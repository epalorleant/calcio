from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .. import models, schemas
from ..db import get_db
from ..services import ratings

router = APIRouter(tags=["matches"])


class MatchCompletionPayload(BaseModel):
    score_team_a: int
    score_team_b: int
    notes: Optional[str] = None
    player_stats: list[schemas.PlayerStatsCreate]


@router.post("/matches", response_model=schemas.SessionMatchRead, status_code=status.HTTP_201_CREATED)
async def create_match(payload: schemas.MatchWithStatsCreate, db: AsyncSession = Depends(get_db)) -> schemas.SessionMatchRead:
    session = await db.get(
        models.Session,
        payload.session_id,
        options=[
            selectinload(models.Session.session_players).selectinload(models.SessionPlayer.player).selectinload(
                models.Player.rating
            )
        ],
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    existing_match_result = await db.execute(
        select(models.Match).where(models.Match.session_id == payload.session_id)
    )
    existing_match = existing_match_result.scalars().first()
    if existing_match:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Match already exists for this session",
        )

    session_roster = {sp.player_id: sp for sp in session.session_players}

    match = models.Match(
        session_id=payload.session_id,
        score_team_a=payload.score_team_a,
        score_team_b=payload.score_team_b,
        notes=payload.notes,
    )
    db.add(match)
    await db.flush()

    for stat_input in payload.player_stats:
        player = await db.get(models.Player, stat_input.player_id)
        if not player:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Player stats team must be either A or B",
            )

        session_player = session_roster.get(stat_input.player_id)
        if not session_player:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Player {stat_input.player_id} is not part of the session roster",
            )

        match.stats.append(
            models.PlayerStats(
                match_id=match.id,
                player_id=stat_input.player_id,
                team=stat_input.team,
                goals=stat_input.goals,
                assists=stat_input.assists,
                minutes_played=stat_input.minutes_played,
            )
        )

    await db.flush()
    await ratings.update_ratings_after_match(db, match)
    await db.commit()
    await db.refresh(match)
    return _compose_session_match_response(match, session_players=session.session_players)


@router.put("/matches/{match_id}", response_model=schemas.SessionMatchRead)
async def update_match(
    match_id: int,
    payload: schemas.MatchWithStatsCreate,
    db: AsyncSession = Depends(get_db),
) -> schemas.SessionMatchRead:
    match = await db.get(
        models.Match,
        match_id,
        options=[
            selectinload(models.Match.session).selectinload(models.Session.session_players),
            selectinload(models.Match.stats),
        ],
    )
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    session = match.session
    if not session or session.id != payload.session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Match does not belong to the provided session",
        )

    session_roster = {sp.player_id: sp for sp in session.session_players}

    match.score_team_a = payload.score_team_a
    match.score_team_b = payload.score_team_b
    match.notes = payload.notes

    match.stats.clear()

    for stat_input in payload.player_stats:
        if stat_input.player_id not in session_roster:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Player {stat_input.player_id} is not part of the session roster",
            )

        match.stats.append(
            models.PlayerStats(
                match_id=match.id,
                player_id=stat_input.player_id,
                team=stat_input.team,
                goals=stat_input.goals,
                assists=stat_input.assists,
                minutes_played=stat_input.minutes_played,
            )
        )

    await db.flush()
    await ratings.update_ratings_after_match(db, match)
    await db.commit()
    await db.refresh(match)
    return _compose_session_match_response(match, session_players=session.session_players)


@router.get("/matches/{match_id}", response_model=schemas.SessionMatchRead)
async def get_match(match_id: int, db: AsyncSession = Depends(get_db)) -> schemas.SessionMatchRead:
    result = await db.execute(
        select(models.Match)
        .options(
            selectinload(models.Match.session).selectinload(models.Session.session_players),
            selectinload(models.Match.stats),
        )
        .where(models.Match.id == match_id)
    )
    match = result.scalars().first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return _compose_session_match_response(match)


@router.get("/sessions/{session_id}/match", response_model=schemas.SessionMatchRead)
async def get_match_for_session(session_id: int, db: AsyncSession = Depends(get_db)) -> schemas.SessionMatchRead:
    result = await db.execute(
        select(models.Match)
        .options(
            selectinload(models.Match.session).selectinload(models.Session.session_players),
            selectinload(models.Match.stats),
        )
        .where(models.Match.session_id == session_id)
    )
    match = result.scalars().first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found for session",
        )
    return _compose_session_match_response(match)


@router.post("/matches/{match_id}/complete", response_model=schemas.SessionMatchRead)
async def complete_match(match_id: int, payload: MatchCompletionPayload, db: AsyncSession = Depends(get_db)) -> schemas.SessionMatchRead:
    match = await db.get(
        models.Match,
        match_id,
        options=[
            selectinload(models.Match.session).selectinload(models.Session.session_players),
            selectinload(models.Match.stats),
        ],
    )
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    match.score_team_a = payload.score_team_a
    match.score_team_b = payload.score_team_b
    match.notes = payload.notes

    existing_stats = {stat.player_id: stat for stat in match.stats}

    for stat_input in payload.player_stats:
        player = await db.get(models.Player, stat_input.player_id)
        if not player:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Player {stat_input.player_id} not found",
            )

        stat = existing_stats.get(stat_input.player_id)
        if stat:
            stat.team = stat_input.team
            stat.goals = stat_input.goals
            stat.assists = stat_input.assists
            stat.minutes_played = stat_input.minutes_played
        else:
            match.stats.append(
                models.PlayerStats(
                    match_id=match.id,
                    player_id=stat_input.player_id,
                    team=stat_input.team,
                    goals=stat_input.goals,
                    assists=stat_input.assists,
                    minutes_played=stat_input.minutes_played,
                )
            )

    await db.flush()
    await ratings.update_ratings_after_match(db, match)
    await db.commit()
    await db.refresh(match)
    return _compose_session_match_response(match)


def _compose_session_match_response(
    match: models.Match, session_players: list[models.SessionPlayer] | None = None
) -> schemas.SessionMatchRead:
    session = match.session
    players = session_players or (session.session_players if session else [])
    team_a = [sp for sp in players if sp.team == models.SessionTeam.A]
    team_b = [sp for sp in players if sp.team == models.SessionTeam.B]
    bench = [sp for sp in players if sp.team == models.SessionTeam.BENCH or sp.team is None]

    return schemas.SessionMatchRead(
        id=match.id,
        session_id=match.session_id,
        score_team_a=match.score_team_a,
        score_team_b=match.score_team_b,
        notes=match.notes,
        stats=list(match.stats),
        team_a_players=team_a,
        team_b_players=team_b,
        bench_players=bench,
    )

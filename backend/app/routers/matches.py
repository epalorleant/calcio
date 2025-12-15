from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..db import get_db
from ..services import ratings

router = APIRouter(tags=["matches"])


class MatchCompletionPayload(BaseModel):
    score_team_a: int
    score_team_b: int
    notes: Optional[str] = None
    player_stats: list[schemas.PlayerStatsCreate]


@router.post("/matches", response_model=schemas.MatchWithStatsRead, status_code=status.HTTP_201_CREATED)
def create_match(payload: schemas.MatchWithStatsCreate, db: Session = Depends(get_db)) -> schemas.MatchWithStatsRead:
    session = db.get(models.Session, payload.session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    existing_match = db.query(models.Match).filter(models.Match.session_id == payload.session_id).first()
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
    db.flush()

    for stat_input in payload.player_stats:
        player = db.get(models.Player, stat_input.player_id)
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

    db.flush()
    ratings.update_ratings_after_match(db, match)
    db.commit()
    db.refresh(match)
    return _compose_session_match_response(match, session_players=session.session_players)


@router.get("/matches/{match_id}", response_model=schemas.MatchWithStatsRead)
def get_match(match_id: int, db: Session = Depends(get_db)) -> schemas.MatchWithStatsRead:
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return match


@router.get("/sessions/{session_id}/match", response_model=schemas.MatchWithStatsRead)
def get_match_for_session(session_id: int, db: Session = Depends(get_db)) -> schemas.MatchWithStatsRead:
    match = db.query(models.Match).filter(models.Match.session_id == session_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found for session",
        )
    return match


@router.post("/matches/{match_id}/complete", response_model=schemas.MatchWithStatsRead)
def complete_match(match_id: int, payload: MatchCompletionPayload, db: Session = Depends(get_db)) -> schemas.MatchWithStatsRead:
    match = db.get(models.Match, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    match.score_team_a = payload.score_team_a
    match.score_team_b = payload.score_team_b
    match.notes = payload.notes

    existing_stats = {stat.player_id: stat for stat in match.stats}

    for stat_input in payload.player_stats:
        player = db.get(models.Player, stat_input.player_id)
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

    db.flush()
    ratings.update_ratings_after_match(db, match)
    db.commit()
    db.refresh(match)
    return match

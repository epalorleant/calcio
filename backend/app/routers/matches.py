from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..services import ratings

router = APIRouter(prefix="/matches", tags=["matches"])


class MatchWithStatsRead(schemas.MatchRead):
    stats: List[schemas.PlayerStatsRead]

    class Config:
        orm_mode = True


class PlayerStatInput(BaseModel):
    player_id: int
    team: models.MatchTeam
    goals: int = 0
    assists: int = 0
    minutes_played: int = 0
    rating_after_match: Optional[int] = None


class CompleteMatchPayload(BaseModel):
    score_team_a: int
    score_team_b: int
    notes: Optional[str] = None
    stats: List[PlayerStatInput]


class MatchCreatePayload(CompleteMatchPayload):
    session_id: int


@router.post("/", response_model=MatchWithStatsRead, status_code=status.HTTP_201_CREATED)
def create_match(payload: MatchCreatePayload, db: Session = Depends(get_db)) -> MatchWithStatsRead:
    session = db.get(models.Session, payload.session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    existing_match = db.query(models.Match).filter(models.Match.session_id == payload.session_id).first()
    if existing_match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Match already exists for this session",
        )

    match = models.Match(
        session_id=payload.session_id,
        score_team_a=payload.score_team_a,
        score_team_b=payload.score_team_b,
        notes=payload.notes,
    )
    db.add(match)
    db.flush()

    for stat_input in payload.stats:
        player = db.get(models.Player, stat_input.player_id)
        if not player:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Player {stat_input.player_id} not found",
            )
        stat = models.PlayerStats(
            match_id=match.id,
            player_id=stat_input.player_id,
            team=stat_input.team,
            goals=stat_input.goals,
            assists=stat_input.assists,
            minutes_played=stat_input.minutes_played,
            rating_after_match=stat_input.rating_after_match,
        )
        db.add(stat)

    db.flush()
    ratings.update_ratings_after_match(db, match, match.stats)
    db.commit()
    db.refresh(match)
    return match


@router.get("/{match_id}", response_model=MatchWithStatsRead)
def get_match(match_id: int, db: Session = Depends(get_db)) -> MatchWithStatsRead:
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return match


@router.post("/{match_id}/complete", response_model=schemas.MatchRead)
def complete_match(
    match_id: int,
    payload: CompleteMatchPayload,
    db: Session = Depends(get_db),
) -> schemas.MatchRead:
    match = db.get(models.Match, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    match.score_team_a = payload.score_team_a
    match.score_team_b = payload.score_team_b
    match.notes = payload.notes

    for stat_input in payload.stats:
        player = db.get(models.Player, stat_input.player_id)
        if not player:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Player {stat_input.player_id} not found",
            )

        existing_stat = (
            db.query(models.PlayerStats)
            .filter(
                models.PlayerStats.match_id == match_id,
                models.PlayerStats.player_id == stat_input.player_id,
            )
            .first()
        )

        if existing_stat:
            existing_stat.team = stat_input.team
            existing_stat.goals = stat_input.goals
            existing_stat.assists = stat_input.assists
            existing_stat.minutes_played = stat_input.minutes_played
            existing_stat.rating_after_match = stat_input.rating_after_match
        else:
            stat = models.PlayerStats(
                match_id=match_id,
                player_id=stat_input.player_id,
                team=stat_input.team,
                goals=stat_input.goals,
                assists=stat_input.assists,
                minutes_played=stat_input.minutes_played,
                rating_after_match=stat_input.rating_after_match,
            )
            db.add(stat)

    db.flush()
    ratings.update_ratings_after_match(db, match, match.stats)
    db.commit()
    db.refresh(match)
    return match

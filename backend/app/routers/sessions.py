from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db
from ..services import team_balance

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/", response_model=schemas.SessionRead, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=schemas.SessionRead, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_session(session_in: schemas.SessionCreate, db: Session = Depends(get_db)) -> schemas.SessionRead:
    session = models.Session(
        date=session_in.date,
        location=session_in.location,
        max_players=session_in.max_players,
        status=session_in.status,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/", response_model=list[schemas.SessionRead])
@router.get("", response_model=list[schemas.SessionRead], include_in_schema=False)
def list_sessions(
    status_filter: Optional[models.SessionStatus] = Query(default=None, alias="status"),
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
) -> list[schemas.SessionRead]:
    query = db.query(models.Session)

    if status_filter:
        query = query.filter(models.Session.status == status_filter)
    if date_from:
        query = query.filter(models.Session.date >= date_from)
    if date_to:
        query = query.filter(models.Session.date <= date_to)

    return query.all()


@router.get("/{session_id}", response_model=schemas.SessionRead)
def get_session(session_id: int, db: Session = Depends(get_db)) -> schemas.SessionRead:
    session = db.get(models.Session, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


@router.patch("/{session_id}", response_model=schemas.SessionRead)
def update_session(
    session_id: int, session_in: schemas.SessionUpdate, db: Session = Depends(get_db)
) -> schemas.SessionRead:
    session = db.get(models.Session, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    updates = session_in.dict(exclude_unset=True)
    for field, value in updates.items():
        setattr(session, field, value)

    db.commit()
    db.refresh(session)
    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: int, db: Session = Depends(get_db)) -> None:
    session = db.get(models.Session, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    db.delete(session)
    db.commit()


class AvailabilityUpdate(BaseModel):
    player_id: int
    availability: models.Availability
    is_goalkeeper: bool = False


class AvailabilityBatch(BaseModel):
    entries: List[AvailabilityUpdate]


@router.get("/{session_id}/availability", response_model=list[schemas.SessionPlayerRead])
def list_availability(session_id: int, db: Session = Depends(get_db)) -> list[schemas.SessionPlayerRead]:
    session = db.get(models.Session, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session_players = (
        db.query(models.SessionPlayer)
        .filter(models.SessionPlayer.session_id == session_id)
        .all()
    )
    return session_players


@router.post("/{session_id}/availability", response_model=schemas.SessionPlayerRead)
def set_availability(
    session_id: int,
    payload: AvailabilityUpdate,
    db: Session = Depends(get_db),
) -> schemas.SessionPlayerRead:
    session = db.get(models.Session, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    player = db.get(models.Player, payload.player_id)
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

    session_player = (
        db.query(models.SessionPlayer)
        .filter(
            models.SessionPlayer.session_id == session_id,
            models.SessionPlayer.player_id == payload.player_id,
        )
        .first()
    )

    if session_player:
        session_player.availability = payload.availability
        session_player.is_goalkeeper = payload.is_goalkeeper
    else:
        session_player = models.SessionPlayer(
            session_id=session_id,
            player_id=payload.player_id,
            availability=payload.availability,
            is_goalkeeper=payload.is_goalkeeper,
        )
        db.add(session_player)

    db.commit()
    db.refresh(session_player)
    return session_player


@router.post("/{session_id}/availability/batch", response_model=list[schemas.SessionPlayerRead])
def set_availability_batch(
    session_id: int,
    payload: AvailabilityBatch,
    db: Session = Depends(get_db),
) -> list[schemas.SessionPlayerRead]:
    session = db.get(models.Session, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    existing = {
        sp.player_id: sp
        for sp in db.query(models.SessionPlayer).filter(models.SessionPlayer.session_id == session_id).all()
    }

    updated_records: list[models.SessionPlayer] = []

    for entry in payload.entries:
        player = db.get(models.Player, entry.player_id)
        if not player:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Player {entry.player_id} not found")

        session_player = existing.get(entry.player_id)
        if session_player:
            session_player.availability = entry.availability
            session_player.is_goalkeeper = entry.is_goalkeeper
        else:
            session_player = models.SessionPlayer(
                session_id=session_id,
                player_id=entry.player_id,
                availability=entry.availability,
                is_goalkeeper=entry.is_goalkeeper,
            )
            db.add(session_player)
            existing[entry.player_id] = session_player

        updated_records.append(session_player)

    db.commit()
    for record in updated_records:
        db.refresh(record)
    return updated_records


class BalancedPlayer(BaseModel):
    player_id: int
    name: str
    rating: float
    is_goalkeeper: bool


class BalancedTeamsResponse(BaseModel):
    team_a: list[BalancedPlayer]
    team_b: list[BalancedPlayer]
    bench: list[BalancedPlayer]
    balance_score: float


@router.post("/{session_id}/balanced-teams", response_model=BalancedTeamsResponse)
def generate_balanced_session_teams(session_id: int, db: Session = Depends(get_db)) -> BalancedTeamsResponse:
    session = db.get(models.Session, session_id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session_players = (
        db.query(models.SessionPlayer)
        .join(models.Player)
        .filter(
            models.SessionPlayer.session_id == session_id,
            models.SessionPlayer.availability == models.Availability.YES,
        )
        .all()
    )

    players = [sp.player for sp in session_players]
    ratings = {sp.player_id: (sp.player.rating.overall_rating if sp.player.rating else 1000.0) for sp in session_players}

    team_a_ids, team_b_ids, bench_ids = team_balance.generate_balanced_teams(players, ratings)

    id_to_sp = {sp.player_id: sp for sp in session_players}
    for pid in team_a_ids:
        id_to_sp[pid].team = models.SessionTeam.A
    for pid in team_b_ids:
        id_to_sp[pid].team = models.SessionTeam.B
    for pid in bench_ids:
        id_to_sp[pid].team = models.SessionTeam.BENCH

    db.commit()

    def to_payload(ids: list[int]) -> list[BalancedPlayer]:
        return [
            BalancedPlayer(
                player_id=pid,
                name=id_to_sp[pid].player.name,
                rating=ratings.get(pid, 1000.0),
                is_goalkeeper=id_to_sp[pid].is_goalkeeper,
            )
            for pid in ids
        ]

    sum_a = sum(ratings.get(pid, 1000.0) for pid in team_a_ids)
    sum_b = sum(ratings.get(pid, 1000.0) for pid in team_b_ids)

    return BalancedTeamsResponse(
        team_a=to_payload(team_a_ids),
        team_b=to_payload(team_b_ids),
        bench=to_payload(bench_ids),
        balance_score=abs(sum_a - sum_b),
    )

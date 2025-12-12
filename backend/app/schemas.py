from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from .models import Availability, MatchTeam, SessionStatus, SessionTeam


class PlayerCreate(BaseModel):
    name: str
    preferred_position: Optional[str] = None
    active: bool = True


class PlayerRead(BaseModel):
    id: int
    name: str
    preferred_position: Optional[str] = None
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class SessionCreate(BaseModel):
    date: datetime
    location: str
    max_players: int
    status: SessionStatus = SessionStatus.PLANNED


class SessionRead(BaseModel):
    id: int
    date: datetime
    location: str
    max_players: int
    status: SessionStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class SessionPlayerRead(BaseModel):
    id: int
    session_id: int
    player_id: int
    availability: Availability
    team: Optional[SessionTeam] = None
    is_goalkeeper: bool

    class Config:
        orm_mode = True


class MatchCreate(BaseModel):
    session_id: int
    score_team_a: int = 0
    score_team_b: int = 0
    notes: Optional[str] = None


class MatchRead(BaseModel):
    id: int
    session_id: int
    score_team_a: int
    score_team_b: int
    notes: Optional[str] = None

    class Config:
        orm_mode = True


class PlayerStatsRead(BaseModel):
    id: int
    match_id: int
    player_id: int
    team: MatchTeam
    goals: int
    assists: int
    minutes_played: int
    rating_after_match: Optional[int] = None

    class Config:
        orm_mode = True


class PlayerRatingRead(BaseModel):
    player_id: int
    overall_rating: float
    last_updated_at: datetime

    class Config:
        orm_mode = True

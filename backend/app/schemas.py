from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from .models import Availability, MatchTeam, SessionStatus, SessionTeam


class OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PlayerCreate(BaseModel):
    name: str
    preferred_position: Optional[str] = None
    active: bool = True


class PlayerRead(OrmBase):
    id: int
    name: str
    preferred_position: Optional[str] = None
    active: bool
    created_at: datetime
    updated_at: datetime


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


class SessionPlayerRead(OrmBase):
    id: int
    session_id: int
    player_id: int
    availability: Availability
    team: Optional[SessionTeam] = None
    is_goalkeeper: bool


class SessionUpdate(BaseModel):
    date: Optional[datetime] = None
    location: Optional[str] = None
    max_players: Optional[int] = None
    status: Optional[SessionStatus] = None


class MatchRead(OrmBase):
    id: int
    session_id: int
    score_team_a: int
    score_team_b: int
    notes: Optional[str] = None


class PlayerStatsCreate(BaseModel):
    player_id: int
    team: MatchTeam
    goals: int = 0
    assists: int = 0
    minutes_played: int = 0


class PlayerStatsRead(OrmBase):
    id: int
    match_id: int
    player_id: int
    team: MatchTeam
    goals: int
    assists: int
    minutes_played: int
    rating_after_match: Optional[int] = None


class MatchWithStatsCreate(BaseModel):
    session_id: int
    score_team_a: int
    score_team_b: int
    notes: Optional[str] = None
    player_stats: list[PlayerStatsCreate]


class MatchWithStatsRead(MatchRead):
    stats: list[PlayerStatsRead]


class PlayerRatingRead(OrmBase):
    player_id: int
    overall_rating: float
    last_updated_at: datetime


class SessionMatchRead(MatchWithStatsRead):
    team_a_players: list[SessionPlayerRead]
    team_b_players: list[SessionPlayerRead]
    bench_players: list[SessionPlayerRead]

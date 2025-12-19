from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .models import Availability, MatchTeam, SessionStatus, SessionTeam


class OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PlayerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Player name")
    preferred_position: Optional[str] = Field(None, max_length=100, description="Preferred playing position")
    active: bool = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Player name cannot be empty")
        return v.strip()


class PlayerRead(OrmBase):
    id: int
    name: str
    preferred_position: Optional[str] = None
    active: bool
    created_at: datetime
    updated_at: datetime
    rating: Optional["PlayerRatingRead"] = None


class SessionCreate(BaseModel):
    date: datetime = Field(..., description="Session date and time")
    location: str = Field(..., min_length=1, max_length=255, description="Session location")
    max_players: int = Field(..., ge=2, le=30, description="Maximum number of players")
    status: SessionStatus = SessionStatus.PLANNED

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Location cannot be empty")
        return v.strip()

    @field_validator("date")
    @classmethod
    def validate_date(cls, v: datetime) -> datetime:
        # Could add future date validation if needed
        return v


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
    date: Optional[datetime] = Field(None, description="Session date and time")
    location: Optional[str] = Field(None, min_length=1, max_length=255, description="Session location")
    max_players: Optional[int] = Field(None, ge=2, le=30, description="Maximum number of players")
    status: Optional[SessionStatus] = None

    @field_validator("location")
    @classmethod
    def validate_location(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not v.strip()):
            raise ValueError("Location cannot be empty")
        return v.strip() if v else None


class MatchRead(OrmBase):
    id: int
    session_id: int
    score_team_a: int
    score_team_b: int
    notes: Optional[str] = None


class PlayerStatsCreate(BaseModel):
    player_id: int = Field(..., gt=0, description="Player ID")
    team: MatchTeam = Field(..., description="Team the player played for")
    goals: int = Field(0, ge=0, description="Number of goals scored")
    assists: int = Field(0, ge=0, description="Number of assists")
    minutes_played: int = Field(0, ge=0, le=120, description="Minutes played (max 120 for a match)")


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
    session_id: int = Field(..., gt=0, description="Session ID")
    score_team_a: int = Field(..., ge=0, description="Team A score")
    score_team_b: int = Field(..., ge=0, description="Team B score")
    notes: Optional[str] = Field(None, max_length=1000, description="Match notes")
    player_stats: list[PlayerStatsCreate] = Field(..., min_length=1, description="Player statistics")

    @field_validator("player_stats")
    @classmethod
    def validate_player_stats(cls, v: list[PlayerStatsCreate]) -> list[PlayerStatsCreate]:
        if not v:
            raise ValueError("At least one player stat is required")
        # Check for duplicate player_ids
        player_ids = [stat.player_id for stat in v]
        if len(player_ids) != len(set(player_ids)):
            raise ValueError("Duplicate player IDs in player_stats")
        return v


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


# Forward refs
PlayerRead.model_rebuild()

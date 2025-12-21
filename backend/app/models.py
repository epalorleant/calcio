from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, declarative_base, mapped_column, relationship


Base = declarative_base()


class SessionStatus(enum.Enum):
    PLANNED = "PLANNED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Availability(enum.Enum):
    YES = "YES"
    NO = "NO"
    MAYBE = "MAYBE"


class SessionTeam(enum.Enum):
    A = "A"
    B = "B"
    BENCH = "BENCH"


class MatchTeam(enum.Enum):
    A = "A"
    B = "B"


class RecurrenceType(enum.Enum):
    NONE = "NONE"
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    player: Mapped["Player | None"] = relationship("Player", back_populates="user", uselist=False)


class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    preferred_position: Mapped[str | None] = mapped_column(String(100))
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User | None"] = relationship("User", back_populates="player")
    session_players: Mapped[list["SessionPlayer"]] = relationship(
        back_populates="player", cascade="all, delete-orphan"
    )
    stats: Mapped[list["PlayerStats"]] = relationship(back_populates="player", cascade="all, delete-orphan")
    rating: Mapped[PlayerRating | None] = relationship(back_populates="player", uselist=False)


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    max_players: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus), nullable=False, default=SessionStatus.PLANNED
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    template_id: Mapped[int | None] = mapped_column(ForeignKey("session_templates.id"), nullable=True)

    session_players: Mapped[list["SessionPlayer"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    match: Mapped[Match | None] = relationship(back_populates="session", uselist=False, cascade="all, delete-orphan")
    template: Mapped["SessionTemplate | None"] = relationship(
        "SessionTemplate", back_populates="sessions", lazy="select"
    )


class SessionPlayer(Base):
    __tablename__ = "session_players"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    availability: Mapped[Availability] = mapped_column(Enum(Availability), nullable=False)
    team: Mapped[SessionTeam | None] = mapped_column(Enum(SessionTeam), nullable=True)
    is_goalkeeper: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    session: Mapped["Session"] = relationship(back_populates="session_players")
    player: Mapped["Player"] = relationship(back_populates="session_players")

    __table_args__ = (UniqueConstraint("session_id", "player_id", name="uq_session_player"),)


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    score_team_a: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    score_team_b: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(Text)

    session: Mapped["Session"] = relationship(back_populates="match")
    stats: Mapped[list["PlayerStats"]] = relationship(back_populates="match", cascade="all, delete-orphan")


class PlayerStats(Base):
    __tablename__ = "player_stats"

    id: Mapped[int] = mapped_column(primary_key=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    team: Mapped[MatchTeam] = mapped_column(Enum(MatchTeam), nullable=False)
    goals: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    assists: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    minutes_played: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rating_after_match: Mapped[int | None] = mapped_column(Integer)

    match: Mapped["Match"] = relationship(back_populates="stats")
    player: Mapped["Player"] = relationship(back_populates="stats")

    __table_args__ = (UniqueConstraint("match_id", "player_id", name="uq_match_player_stats"),)


class PlayerRating(Base):
    __tablename__ = "player_ratings"

    player_id: Mapped[int] = mapped_column(ForeignKey("players.id", ondelete="CASCADE"), primary_key=True)
    overall_rating: Mapped[float] = mapped_column(nullable=False)
    last_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    player: Mapped["Player"] = relationship(back_populates="rating")


class SessionTemplate(Base):
    __tablename__ = "session_templates"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    time_of_day: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    day_of_week: Mapped[int | None] = mapped_column(Integer)  # 0=Monday, 6=Sunday, None for one-time
    max_players: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    recurrence_type: Mapped[RecurrenceType | None] = mapped_column(Enum(RecurrenceType), nullable=True)
    recurrence_start: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    recurrence_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_generated: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    sessions: Mapped[list["Session"]] = relationship(
        "Session", back_populates="template"
    )

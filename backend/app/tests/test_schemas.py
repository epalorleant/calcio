"""Tests for Pydantic schemas validation."""
import pytest
from datetime import datetime
from pydantic import ValidationError

from app import schemas
from app.models import SessionStatus, MatchTeam


def test_player_create_valid():
    """Test valid player creation."""
    player = schemas.PlayerCreate(name="John Doe", preferred_position="Forward", active=True)
    assert player.name == "John Doe"
    assert player.preferred_position == "Forward"
    assert player.active is True


def test_player_create_invalid_empty_name():
    """Test player creation with empty name."""
    with pytest.raises(ValidationError) as exc_info:
        schemas.PlayerCreate(name="", preferred_position="Forward")
    
    errors = exc_info.value.errors()
    assert any(error["type"] == "value_error" for error in errors)


def test_session_create_valid():
    """Test valid session creation."""
    session = schemas.SessionCreate(
        date=datetime(2024, 1, 15, 18, 0),
        location="Community Gym",
        max_players=10,
        status=SessionStatus.PLANNED,
    )
    assert session.location == "Community Gym"
    assert session.max_players == 10


def test_session_create_invalid_max_players():
    """Test session creation with invalid max_players."""
    with pytest.raises(ValidationError) as exc_info:
        schemas.SessionCreate(
            date=datetime(2024, 1, 15, 18, 0),
            location="Community Gym",
            max_players=1,  # Too low
        )
    
    errors = exc_info.value.errors()
    assert any(error["loc"] == ("max_players",) for error in errors)


def test_player_stats_create_valid():
    """Test valid player stats creation."""
    stats = schemas.PlayerStatsCreate(
        player_id=1,
        team=MatchTeam.A,
        goals=2,
        assists=1,
        minutes_played=60,
    )
    assert stats.goals == 2
    assert stats.assists == 1


def test_player_stats_create_negative_values():
    """Test player stats with negative values."""
    with pytest.raises(ValidationError) as exc_info:
        schemas.PlayerStatsCreate(
            player_id=1,
            team=MatchTeam.A,
            goals=-1,  # Invalid
            assists=0,
            minutes_played=60,
        )
    
    errors = exc_info.value.errors()
    assert any(error["loc"] == ("goals",) for error in errors)


def test_match_with_stats_create_duplicate_players():
    """Test match creation with duplicate player IDs."""
    with pytest.raises(ValidationError) as exc_info:
        schemas.MatchWithStatsCreate(
            session_id=1,
            score_team_a=3,
            score_team_b=2,
            player_stats=[
                schemas.PlayerStatsCreate(player_id=1, team=MatchTeam.A, goals=1),
                schemas.PlayerStatsCreate(player_id=1, team=MatchTeam.A, goals=2),  # Duplicate
            ],
        )
    
    errors = exc_info.value.errors()
    assert any("duplicate" in str(error).lower() for error in errors)


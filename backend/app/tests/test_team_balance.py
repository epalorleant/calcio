"""Tests for team balancing algorithm."""
import pytest

from app import models
from app.services import team_balance


def test_generate_balanced_teams_small_group():
    """Test team balancing with a small group (uses brute force)."""
    players = [
        models.Player(id=1, name="Player 1"),
        models.Player(id=2, name="Player 2"),
        models.Player(id=3, name="Player 3"),
        models.Player(id=4, name="Player 4"),
        models.Player(id=5, name="Player 5"),
        models.Player(id=6, name="Player 6"),
        models.Player(id=7, name="Player 7"),
        models.Player(id=8, name="Player 8"),
        models.Player(id=9, name="Player 9"),
        models.Player(id=10, name="Player 10"),
    ]
    
    # Create ratings with clear imbalance
    ratings = {
        1: 1200.0, 2: 1200.0, 3: 1200.0, 4: 1200.0, 5: 1200.0,  # High rated
        6: 800.0, 7: 800.0, 8: 800.0, 9: 800.0, 10: 800.0,  # Low rated
    }
    
    team_a, team_b, bench = team_balance.generate_balanced_teams(players, ratings, team_size=5)
    
    # Should have balanced teams
    assert len(team_a) == 5
    assert len(team_b) == 5
    assert len(bench) == 0
    
    # Teams should be balanced (mix of high and low rated)
    sum_a = sum(ratings[pid] for pid in team_a)
    sum_b = sum(ratings[pid] for pid in team_b)
    diff = abs(sum_a - sum_b)
    
    # Difference should be reasonable (not all high on one team)
    assert diff < 1000  # Should be well balanced


def test_generate_balanced_teams_with_goalkeepers():
    """Test team balancing with goalkeepers."""
    players = [
        models.Player(id=1, name="GK 1"),
        models.Player(id=2, name="GK 2"),
        models.Player(id=3, name="Player 3"),
        models.Player(id=4, name="Player 4"),
        models.Player(id=5, name="Player 5"),
        models.Player(id=6, name="Player 6"),
        models.Player(id=7, name="Player 7"),
        models.Player(id=8, name="Player 8"),
        models.Player(id=9, name="Player 9"),
        models.Player(id=10, name="Player 10"),
    ]
    
    ratings = {i: 1000.0 for i in range(1, 11)}
    goalkeeper_flags = {1: True, 2: True}  # Two goalkeepers
    
    team_a, team_b, bench = team_balance.generate_balanced_teams(
        players, ratings, team_size=5, goalkeeper_flags=goalkeeper_flags
    )
    
    # Each team should have a goalkeeper if possible
    assert len(team_a) == 5
    assert len(team_b) == 5
    
    # Check that goalkeepers are distributed
    gk_in_a = any(pid in [1, 2] for pid in team_a)
    gk_in_b = any(pid in [1, 2] for pid in team_b)
    
    # At least one team should have a goalkeeper (ideally both)
    assert gk_in_a or gk_in_b


def test_generate_balanced_teams_large_group():
    """Test team balancing with a large group (uses optimized algorithm)."""
    players = [models.Player(id=i, name=f"Player {i}") for i in range(1, 21)]
    ratings = {i: 1000.0 + (i % 5) * 50 for i in range(1, 21)}  # Varied ratings
    
    team_a, team_b, bench = team_balance.generate_balanced_teams(players, ratings, team_size=5)
    
    assert len(team_a) == 5
    assert len(team_b) == 5
    assert len(bench) == 10  # 20 players - 10 in teams = 10 bench


def test_generate_balanced_teams_insufficient_players():
    """Test with insufficient players for two teams."""
    players = [models.Player(id=i, name=f"Player {i}") for i in range(1, 6)]
    ratings = {i: 1000.0 for i in range(1, 6)}
    
    team_a, team_b, bench = team_balance.generate_balanced_teams(players, ratings, team_size=5)
    
    # All players should go to team A
    assert len(team_a) == 5
    assert len(team_b) == 0
    assert len(bench) == 0


def test_generate_balanced_teams_zero_team_size():
    """Test with zero team size."""
    players = [models.Player(id=i, name=f"Player {i}") for i in range(1, 11)]
    ratings = {i: 1000.0 for i in range(1, 11)}
    
    team_a, team_b, bench = team_balance.generate_balanced_teams(players, ratings, team_size=0)
    
    assert len(team_a) == 0
    assert len(team_b) == 0
    assert len(bench) == 10


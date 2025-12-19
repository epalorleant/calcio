from __future__ import annotations

import itertools
from typing import Dict, List, Tuple

from .. import models

# Performance threshold: use optimized algorithm for larger groups
OPTIMIZATION_THRESHOLD = 14  # For >14 players, use greedy approach


def generate_balanced_teams(
    players: List[models.Player],
    ratings: Dict[int, float],
    team_size: int = 5,
    goalkeeper_flags: Dict[int, bool] | None = None,
) -> Tuple[List[int], List[int], List[int]]:
    """
    Generate balanced teams from available players.

    For small groups (<=OPTIMIZATION_THRESHOLD), uses brute-force to find optimal balance.
    For larger groups, uses an optimized greedy approach.

    Args:
        players: List of available players
        ratings: Dictionary mapping player_id to rating
        team_size: Target size for each team (default 5 for futsal)
        goalkeeper_flags: Dictionary mapping player_id to is_goalkeeper boolean

    Returns:
        Tuple of (team_a_ids, team_b_ids, bench_ids)
    """
    if team_size <= 0:
        return [], [], [p.id for p in players]

    player_ids = [p.id for p in players]
    id_to_rating = {pid: ratings.get(pid, 1000.0) for pid in player_ids}
    goalkeeper_flags = goalkeeper_flags or {}

    n = len(player_ids)
    if n <= team_size:
        # Not enough players to form two teams
        return player_ids, [], []

    # Separate goalkeepers and field players
    goalkeepers = [pid for pid in player_ids if goalkeeper_flags.get(pid, False)]
    field_players = [pid for pid in player_ids if not goalkeeper_flags.get(pid, False)]

    # Use optimized algorithm for larger groups
    if n > OPTIMIZATION_THRESHOLD:
        return _generate_balanced_teams_optimized(
            field_players, goalkeepers, id_to_rating, team_size
        )

    # Use brute-force for smaller groups to find optimal balance
    return _generate_balanced_teams_brute_force(
        field_players, goalkeepers, id_to_rating, team_size
    )


def _generate_balanced_teams_optimized(
    field_players: List[int],
    goalkeepers: List[int],
    id_to_rating: Dict[int, float],
    team_size: int,
) -> Tuple[List[int], List[int], List[int]]:
    """
    Optimized greedy algorithm for larger groups.
    Ensures goalkeeper distribution when possible.
    """
    # Sort all players by rating (descending)
    all_players = field_players + goalkeepers
    sorted_players = sorted(all_players, key=lambda pid: id_to_rating[pid], reverse=True)

    team_a: List[int] = []
    team_b: List[int] = []
    team_a_gk = False
    team_b_gk = False

    # First pass: assign goalkeepers if available
    for gk_id in goalkeepers:
        if gk_id in sorted_players:
            if not team_a_gk and len(team_a) < team_size:
                team_a.append(gk_id)
                team_a_gk = True
                sorted_players.remove(gk_id)
            elif not team_b_gk and len(team_b) < team_size:
                team_b.append(gk_id)
                team_b_gk = True
                sorted_players.remove(gk_id)

    # Second pass: alternate assignment of remaining players
    for i, player_id in enumerate(sorted_players):
        if len(team_a) >= team_size and len(team_b) >= team_size:
            break

        # Calculate current team totals
        sum_a = sum(id_to_rating[pid] for pid in team_a)
        sum_b = sum(id_to_rating[pid] for pid in team_b)

        # Assign to team with lower total, or alternate if totals are close
        if len(team_a) < team_size and (len(team_b) >= team_size or sum_a <= sum_b):
            team_a.append(player_id)
        elif len(team_b) < team_size:
            team_b.append(player_id)
        else:
            team_a.append(player_id)

    # Remaining players go to bench
    assigned = set(team_a + team_b)
    bench = [pid for pid in sorted_players if pid not in assigned]

    return team_a, team_b, bench


def _generate_balanced_teams_brute_force(
    field_players: List[int],
    goalkeepers: List[int],
    id_to_rating: Dict[int, float],
    team_size: int,
) -> Tuple[List[int], List[int], List[int]]:
    """
    Brute-force algorithm for optimal balance in smaller groups.
    Considers goalkeeper distribution as a constraint.
    """
    all_players = field_players + goalkeepers
    goalkeeper_set = set(goalkeepers)

    best_split: Tuple[List[int], List[int], List[int]] | None = None
    best_diff = float("inf")
    best_gk_balance = float("inf")  # Prefer balanced goalkeeper distribution

    # Try all combinations for Team A
    for team_a in itertools.combinations(all_players, team_size):
        remaining = [pid for pid in all_players if pid not in team_a]
        if len(remaining) < team_size:
            continue

        # Choose best-rated remaining players for Team B
        remaining_sorted = sorted(remaining, key=lambda pid: id_to_rating[pid], reverse=True)
        team_b = remaining_sorted[:team_size]
        bench = remaining_sorted[team_size:]

        # Calculate rating sums
        sum_a = sum(id_to_rating[pid] for pid in team_a)
        sum_b = sum(id_to_rating[pid] for pid in team_b)
        diff = abs(sum_a - sum_b)

        # Check goalkeeper distribution (prefer at least one GK per team if available)
        gk_a = sum(1 for pid in team_a if pid in goalkeeper_set)
        gk_b = sum(1 for pid in team_b if pid in goalkeeper_set)
        gk_balance = abs(gk_a - gk_b)

        # Prioritize solutions with balanced goalkeepers and ratings
        # If goalkeepers are available, prefer solutions with at least one per team
        has_gks = len(goalkeepers) > 0
        gk_penalty = 0
        if has_gks:
            if gk_a == 0 or gk_b == 0:
                gk_penalty = 1000  # Heavy penalty for teams without goalkeepers
            else:
                gk_penalty = gk_balance * 50  # Smaller penalty for unbalanced GK distribution

        total_score = diff + gk_penalty

        if total_score < best_diff or (total_score == best_diff and gk_balance < best_gk_balance):
            best_diff = total_score
            best_gk_balance = gk_balance
            best_split = (list(team_a), team_b, bench)

    if best_split is None:
        # Fallback: use optimized approach
        return _generate_balanced_teams_optimized(field_players, goalkeepers, id_to_rating, team_size)

    return best_split

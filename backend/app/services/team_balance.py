from __future__ import annotations

import itertools
from typing import Dict, List, Tuple

from .. import models


def generate_balanced_teams(
    players: List[models.Player],
    ratings: Dict[int, float],
    team_size: int = 5,
) -> Tuple[List[int], List[int], List[int]]:
    """
    Generate balanced teams from available players using brute-force combinations.

    For each combination of team_size players as Team A, Team B is the best-rated subset
    (team_size players) from the remaining pool; leftovers are bench. We select the split
    that minimizes the absolute rating sum difference between Team A and Team B.
    """
    if team_size <= 0:
        return [], [], [p.id for p in players]

    player_ids = [p.id for p in players]
    id_to_rating = {pid: ratings.get(pid, 1000.0) for pid in player_ids}

    n = len(player_ids)
    if n <= team_size:
        # Not enough players to form two teams; everything goes to Team A (or bench if empty).
        return player_ids, [], []

    best_split: Tuple[List[int], List[int], List[int]] | None = None
    best_diff = float("inf")

    for team_a in itertools.combinations(player_ids, team_size):
        remaining = [pid for pid in player_ids if pid not in team_a]
        # Choose the top-rated remaining players for Team B.
        remaining_sorted = sorted(remaining, key=lambda pid: id_to_rating[pid], reverse=True)
        team_b = remaining_sorted[:team_size]
        bench = remaining_sorted[team_size:]

        sum_a = sum(id_to_rating[pid] for pid in team_a)
        sum_b = sum(id_to_rating[pid] for pid in team_b)
        diff = abs(sum_a - sum_b)

        if diff < best_diff:
            best_diff = diff
            best_split = (list(team_a), team_b, bench)

    if best_split is None:
        return [], [], player_ids

    return best_split

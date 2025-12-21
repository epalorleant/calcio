from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .. import models


K_FACTOR = 50
GOAL_BONUS = 2.5
BASE_RATING = 1000.0


async def get_or_create_player_rating(db: AsyncSession, player_id: int) -> models.PlayerRating:
    rating = await db.get(models.PlayerRating, player_id)
    if rating is None:
        rating = models.PlayerRating(player_id=player_id, overall_rating=BASE_RATING)
        db.add(rating)
        # Flush so the object is persisted within the current transaction.
        await db.flush()
    return rating


async def update_ratings_after_match(db: AsyncSession, match: models.Match) -> None:
    """Update player ratings after a match based on their performance."""
    # Load stats explicitly to avoid lazy loading
    result = await db.execute(
        select(models.PlayerStats).where(models.PlayerStats.match_id == match.id)
    )
    stats = result.scalars().all()
    team_a_stats = [stat for stat in stats if stat.team == models.MatchTeam.A]
    team_b_stats = [stat for stat in stats if stat.team == models.MatchTeam.B]

    team_a_rating_sum = 0.0
    for stat in team_a_stats:
        rating = await get_or_create_player_rating(db, stat.player_id)
        team_a_rating_sum += rating.overall_rating

    team_b_rating_sum = 0.0
    for stat in team_b_stats:
        rating = await get_or_create_player_rating(db, stat.player_id)
        team_b_rating_sum += rating.overall_rating

    expected_a = 1 / (1 + 10 ** ((team_b_rating_sum - team_a_rating_sum) / 400))
    expected_b = 1 - expected_a

    if match.score_team_a > match.score_team_b:
        actual_a, actual_b = 1.0, 0.0
    elif match.score_team_a < match.score_team_b:
        actual_a, actual_b = 0.0, 1.0
    else:
        actual_a = actual_b = 0.5

    for stat in stats:
        player_rating = await get_or_create_player_rating(db, stat.player_id)

        if stat.team == models.MatchTeam.A:
            delta = K_FACTOR * (actual_a - expected_a)
        elif stat.team == models.MatchTeam.B:
            delta = K_FACTOR * (actual_b - expected_b)
        else:
            # Unassigned players should not affect ratings.
            continue

        delta += GOAL_BONUS * stat.goals
        player_rating.overall_rating += delta

    # Flush so callers can commit along with their own updates.
    await db.flush()

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .. import models, schemas
from ..auth.dependencies import get_current_active_user, get_current_admin_user
from ..db import get_db

router = APIRouter(prefix="/players", tags=["players"])


@router.post("/", response_model=schemas.PlayerRead, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=schemas.PlayerRead, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_player(
    player_in: schemas.PlayerCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[models.User, Depends(get_current_admin_user)],
) -> schemas.PlayerRead:
    player = models.Player(
        name=player_in.name,
        preferred_position=player_in.preferred_position,
        active=player_in.active,
    )
    db.add(player)
    await db.commit()
    # Reload player with rating relationship to avoid lazy loading issues
    result = await db.execute(
        select(models.Player)
        .options(selectinload(models.Player.rating))
        .where(models.Player.id == player.id)
    )
    player = result.scalars().first()
    return player


@router.get("/", response_model=list[schemas.PlayerRead])
@router.get("", response_model=list[schemas.PlayerRead], include_in_schema=False)
async def list_players(
    active: bool | None = Query(default=None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
) -> list[schemas.PlayerRead]:
    stmt = select(models.Player).options(selectinload(models.Player.rating))
    if active is not None:
        stmt = stmt.where(models.Player.active == active)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{player_id}", response_model=schemas.PlayerRead)
async def get_player(player_id: int, db: AsyncSession = Depends(get_db)) -> schemas.PlayerRead:
    result = await db.execute(
        select(models.Player)
        .options(selectinload(models.Player.rating))
        .where(models.Player.id == player_id)
    )
    player = result.scalars().first()
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")
    return player


@router.get("/{player_id}/profile", response_model=schemas.PlayerProfileResponse)
async def get_player_profile(
    player_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[models.User, Depends(get_current_active_user)],
) -> schemas.PlayerProfileResponse:
    """Get player profile with statistics and match history.
    
    Regular users can only view their own profile.
    Admins can view any profile.
    """
    # Check if user has permission to view this profile
    if not current_user.is_admin and not current_user.is_root:
        if current_user.player_id != player_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own profile",
            )

    # Get player
    result = await db.execute(
        select(models.Player)
        .options(selectinload(models.Player.rating))
        .where(models.Player.id == player_id)
    )
    player = result.scalars().first()
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

    # Get aggregated statistics
    stats_result = await db.execute(
        select(
            func.count(models.PlayerStats.id).label("total_matches"),
            func.sum(models.PlayerStats.goals).label("total_goals"),
            func.sum(models.PlayerStats.assists).label("total_assists"),
            func.sum(models.PlayerStats.minutes_played).label("total_minutes_played"),
        )
        .where(models.PlayerStats.player_id == player_id)
    )
    stats_row = stats_result.first()
    
    total_matches = stats_row.total_matches or 0
    total_goals = stats_row.total_goals or 0
    total_assists = stats_row.total_assists or 0
    total_minutes = stats_row.total_minutes_played or 0
    
    stats_summary = schemas.PlayerStatsSummary(
        total_matches=total_matches,
        total_goals=total_goals,
        total_assists=total_assists,
        total_minutes_played=total_minutes,
        average_goals_per_match=round(total_goals / total_matches, 2) if total_matches > 0 else 0.0,
        average_assists_per_match=round(total_assists / total_matches, 2) if total_matches > 0 else 0.0,
    )

    # Get match history
    history_result = await db.execute(
        select(
            models.PlayerStats,
            models.Match,
            models.Session,
        )
        .join(models.Match, models.PlayerStats.match_id == models.Match.id)
        .join(models.Session, models.Match.session_id == models.Session.id)
        .where(models.PlayerStats.player_id == player_id)
        .order_by(models.Session.date.desc())
    )
    
    match_history = []
    for stat, match, session in history_result.all():
        match_history.append(
            schemas.PlayerMatchHistoryItem(
                match_id=match.id,
                session_id=session.id,
                session_date=session.date,
                session_location=session.location,
                team=stat.team,
                goals=stat.goals,
                assists=stat.assists,
                minutes_played=stat.minutes_played,
                score_team_a=match.score_team_a,
                score_team_b=match.score_team_b,
                rating_after_match=stat.rating_after_match,
            )
        )

    return schemas.PlayerProfileResponse(
        player=player,
        stats_summary=stats_summary,
        match_history=match_history,
    )


@router.put("/{player_id}", response_model=schemas.PlayerRead)
async def update_player(
    player_id: int,
    player_in: schemas.PlayerCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[models.User, Depends(get_current_admin_user)],
) -> schemas.PlayerRead:
    result = await db.execute(
        select(models.Player)
        .options(selectinload(models.Player.rating))
        .where(models.Player.id == player_id)
    )
    player = result.scalars().first()
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

    player.name = player_in.name
    player.preferred_position = player_in.preferred_position
    player.active = player_in.active

    await db.commit()
    # Reload player with rating relationship to avoid lazy loading issues
    result = await db.execute(
        select(models.Player)
        .options(selectinload(models.Player.rating))
        .where(models.Player.id == player.id)
    )
    player = result.scalars().first()
    return player


@router.delete("/{player_id}", response_model=schemas.PlayerRead)
async def soft_delete_player(
    player_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[models.User, Depends(get_current_admin_user)],
) -> schemas.PlayerRead:
    result = await db.execute(
        select(models.Player)
        .options(selectinload(models.Player.rating))
        .where(models.Player.id == player_id)
    )
    player = result.scalars().first()
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

    player.active = False
    await db.commit()
    # Reload player with rating relationship to avoid lazy loading issues
    result = await db.execute(
        select(models.Player)
        .options(selectinload(models.Player.rating))
        .where(models.Player.id == player.id)
    )
    player = result.scalars().first()
    return player

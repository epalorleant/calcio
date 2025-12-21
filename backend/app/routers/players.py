from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .. import models, schemas
from ..auth.dependencies import get_current_admin_user
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

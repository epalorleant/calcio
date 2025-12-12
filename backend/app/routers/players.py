from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db

router = APIRouter(prefix="/players", tags=["players"])


@router.post("/", response_model=schemas.PlayerRead, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=schemas.PlayerRead, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_player(player_in: schemas.PlayerCreate, db: Session = Depends(get_db)) -> schemas.PlayerRead:
    player = models.Player(
        name=player_in.name,
        preferred_position=player_in.preferred_position,
        active=player_in.active,
    )
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@router.get("/", response_model=list[schemas.PlayerRead])
@router.get("", response_model=list[schemas.PlayerRead], include_in_schema=False)
def list_players(db: Session = Depends(get_db)) -> list[schemas.PlayerRead]:
    return db.query(models.Player).all()


@router.get("/{player_id}", response_model=schemas.PlayerRead)
def get_player(player_id: int, db: Session = Depends(get_db)) -> schemas.PlayerRead:
    player = db.get(models.Player, player_id)
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")
    return player


@router.put("/{player_id}", response_model=schemas.PlayerRead)
def update_player(
    player_id: int, player_in: schemas.PlayerCreate, db: Session = Depends(get_db)
) -> schemas.PlayerRead:
    player = db.get(models.Player, player_id)
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

    player.name = player_in.name
    player.preferred_position = player_in.preferred_position
    player.active = player_in.active

    db.commit()
    db.refresh(player)
    return player


@router.delete("/{player_id}", response_model=schemas.PlayerRead)
def soft_delete_player(player_id: int, db: Session = Depends(get_db)) -> schemas.PlayerRead:
    player = db.get(models.Player, player_id)
    if not player:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Player not found")

    player.active = False
    db.commit()
    db.refresh(player)
    return player

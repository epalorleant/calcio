"""Tests for player profile endpoint."""
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.security import create_access_token, get_password_hash
from app.db import get_db
from app.main import app
from app.models import Player, PlayerRating, User


@pytest.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as async_client:
        yield async_client
    app.dependency_overrides.clear()


async def _create_linked_user(db_session: AsyncSession, *, username: str, email: str) -> tuple[User, Player]:
    user = User(
        email=email,
        username=username,
        hashed_password=get_password_hash("password123"),
        is_active=True,
    )
    player = Player(name="Test Player", active=True)
    db_session.add(user)
    db_session.add(player)
    await db_session.flush()
    player.user_id = user.id
    db_session.add(PlayerRating(player_id=player.id, overall_rating=1000.0))
    await db_session.commit()
    await db_session.refresh(user)
    await db_session.refresh(player)
    return user, player


@pytest.mark.asyncio
async def test_get_own_player_profile(client: AsyncClient, db_session: AsyncSession):
    user, player = await _create_linked_user(db_session, username="player1", email="player1@example.com")
    token = create_access_token(data={"sub": str(user.id), "email": user.email})

    response = await client.get(
        f"/players/{player.id}/profile",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["player"]["id"] == player.id
    assert payload["player"]["name"] == "Test Player"
    assert payload["stats_summary"]["total_matches"] == 0


@pytest.mark.asyncio
async def test_get_other_player_profile_forbidden(client: AsyncClient, db_session: AsyncSession):
    user, player = await _create_linked_user(db_session, username="player1", email="player1@example.com")
    other_player = Player(name="Other", active=True)
    db_session.add(other_player)
    await db_session.commit()
    await db_session.refresh(other_player)

    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    response = await client.get(
        f"/players/{other_player.id}/profile",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_user_player_id_property(db_session: AsyncSession):
    user, player = await _create_linked_user(db_session, username="linked", email="linked@example.com")

    result = await db_session.execute(
        select(User).options(selectinload(User.player)).where(User.id == user.id)
    )
    loaded_user = result.scalar_one()

    assert loaded_user.player_id == player.id

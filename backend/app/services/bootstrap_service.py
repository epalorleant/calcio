"""Bootstrap helpers for first-run application setup."""
from __future__ import annotations

import os
from dataclasses import dataclass
from enum import Enum

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.security import get_password_hash
from ..models import User


class BootstrapStatus(str, Enum):
    CREATED = "created"
    ALREADY_EXISTS = "already_exists"
    SKIPPED = "skipped"


@dataclass(frozen=True)
class BootstrapResult:
    status: BootstrapStatus
    message: str
    email: str | None = None
    username: str | None = None


class BootstrapError(Exception):
    """Raised when bootstrap configuration or validation fails."""


def get_root_credentials_from_env() -> tuple[str, str, str] | None:
    """Return root credentials when all ROOT_* env vars are set."""
    email = os.getenv("ROOT_EMAIL", "").strip()
    username = os.getenv("ROOT_USERNAME", "").strip()
    password = os.getenv("ROOT_PASSWORD", "")

    if not email and not username and not password:
        return None

    if not email or not username or not password:
        raise BootstrapError("ROOT_EMAIL, ROOT_USERNAME, and ROOT_PASSWORD must all be set together")

    validate_root_password(password)
    return email, username, password


def validate_root_password(password: str) -> None:
    if len(password) < 8:
        raise BootstrapError("Password must be at least 8 characters long")


async def ensure_root_user(
    session: AsyncSession,
    email: str,
    username: str,
    password: str,
) -> BootstrapResult:
    """Create the root user if one does not already exist."""
    validate_root_password(password)

    result = await session.execute(select(User).where(User.is_root == True))
    existing_root = result.scalar_one_or_none()
    if existing_root is not None:
        return BootstrapResult(
            status=BootstrapStatus.ALREADY_EXISTS,
            message="Root user already exists",
            email=existing_root.email,
            username=existing_root.username,
        )

    result = await session.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none() is not None:
        raise BootstrapError(f"Email {email} is already registered")

    result = await session.execute(select(User).where(User.username == username))
    if result.scalar_one_or_none() is not None:
        raise BootstrapError(f"Username {username} is already taken")

    root_user = User(
        email=email,
        username=username,
        hashed_password=get_password_hash(password),
        is_active=True,
        is_admin=True,
        is_root=True,
    )
    session.add(root_user)
    await session.commit()

    return BootstrapResult(
        status=BootstrapStatus.CREATED,
        message="Root user created successfully",
        email=email,
        username=username,
    )

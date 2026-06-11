#!/usr/bin/env python3
"""Create the initial root user account.

Usage:
    python scripts/create_root_user.py --email admin@example.com --username admin --password yourpassword

Optional bootstrap mode (for init containers):
    ROOT_EMAIL=... ROOT_USERNAME=... ROOT_PASSWORD=... python scripts/create_root_user.py --optional

If --optional is set and ROOT_* variables are unset, the script exits successfully without changes.
"""
import argparse
import asyncio
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.db import DATABASE_URL_ASYNC
from app.services.bootstrap_service import (
    BootstrapError,
    BootstrapStatus,
    ensure_root_user,
)


def resolve_credentials(args: argparse.Namespace) -> tuple[str, str, str] | None:
    email = (args.email or os.getenv("ROOT_EMAIL", "")).strip()
    username = (args.username or os.getenv("ROOT_USERNAME", "")).strip()
    password = args.password or os.getenv("ROOT_PASSWORD", "")

    if not email and not username and not password:
        return None

    if not email or not username or not password:
        raise BootstrapError("Email, username, and password must all be provided together")

    return email, username, password


async def run(args: argparse.Namespace) -> int:
    try:
        credentials = resolve_credentials(args)
    except BootstrapError as exc:
        print(f"Error: {exc}")
        return 1

    if credentials is None:
        if args.optional:
            print("Bootstrap skipped: root user credentials not configured")
            return 0
        print("Error: --email is required (or set ROOT_EMAIL env var)")
        print("Error: --username is required (or set ROOT_USERNAME env var)")
        print("Error: --password is required (or set ROOT_PASSWORD env var)")
        return 1

    email, username, password = credentials
    engine = create_async_engine(DATABASE_URL_ASYNC, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with async_session() as session:
            result = await ensure_root_user(session, email, username, password)
    except BootstrapError as exc:
        print(f"Error: {exc}")
        return 1
    finally:
        await engine.dispose()

    if result.status == BootstrapStatus.CREATED:
        print("Root user created successfully!")
        print(f"  Email: {result.email}")
        print(f"  Username: {result.username}")
        print("\nYou can now log in with these credentials.")
        return 0

    print(f"Root user already exists: {result.email} ({result.username})")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description="Create initial root user account")
    parser.add_argument("--email", default=None, help="Root user email (or set ROOT_EMAIL env var)")
    parser.add_argument("--username", default=None, help="Root user username (or set ROOT_USERNAME env var)")
    parser.add_argument("--password", default=None, help="Root user password (or set ROOT_PASSWORD env var)")
    parser.add_argument(
        "--optional",
        action="store_true",
        help="Skip bootstrap when credentials are not configured",
    )
    args = parser.parse_args()
    sys.exit(asyncio.run(run(args)))


if __name__ == "__main__":
    main()

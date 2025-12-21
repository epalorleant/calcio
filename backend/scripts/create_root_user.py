#!/usr/bin/env python3
"""Script to create the initial root user account.

Usage:
    python scripts/create_root_user.py --email admin@example.com --username admin --password yourpassword

Or set environment variables:
    ROOT_EMAIL=admin@example.com ROOT_USERNAME=admin ROOT_PASSWORD=yourpassword python scripts/create_root_user.py
"""
import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.auth.security import get_password_hash
from app.core.config import settings
from app.models import User


async def create_root_user(email: str, username: str, password: str) -> None:
    """Create root user account if it doesn't exist."""
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check if root user already exists
        result = await session.execute(select(User).where(User.is_root == True))
        existing_root = result.scalar_one_or_none()
        
        if existing_root:
            print(f"Root user already exists: {existing_root.email} ({existing_root.username})")
            return

        # Check if email already exists
        result = await session.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none() is not None:
            print(f"Error: Email {email} is already registered")
            sys.exit(1)

        # Check if username already exists
        result = await session.execute(select(User).where(User.username == username))
        if result.scalar_one_or_none() is not None:
            print(f"Error: Username {username} is already taken")
            sys.exit(1)

        # Create root user
        hashed_password = get_password_hash(password)
        root_user = User(
            email=email,
            username=username,
            hashed_password=hashed_password,
            is_active=True,
            is_admin=True,  # Root is also admin
            is_root=True,
        )
        session.add(root_user)
        await session.commit()
        print(f"Root user created successfully!")
        print(f"  Email: {email}")
        print(f"  Username: {username}")
        print(f"\nYou can now log in with these credentials.")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Create initial root user account")
    parser.add_argument(
        "--email",
        default=os.getenv("ROOT_EMAIL"),
        help="Root user email (or set ROOT_EMAIL env var)",
    )
    parser.add_argument(
        "--username",
        default=os.getenv("ROOT_USERNAME"),
        help="Root user username (or set ROOT_USERNAME env var)",
    )
    parser.add_argument(
        "--password",
        default=os.getenv("ROOT_PASSWORD"),
        help="Root user password (or set ROOT_PASSWORD env var)",
    )

    args = parser.parse_args()

    if not args.email:
        print("Error: --email is required (or set ROOT_EMAIL env var)")
        sys.exit(1)
    if not args.username:
        print("Error: --username is required (or set ROOT_USERNAME env var)")
        sys.exit(1)
    if not args.password:
        print("Error: --password is required (or set ROOT_PASSWORD env var)")
        sys.exit(1)

    if len(args.password) < 8:
        print("Error: Password must be at least 8 characters long")
        sys.exit(1)

    asyncio.run(create_root_user(args.email, args.username, args.password))


if __name__ == "__main__":
    main()


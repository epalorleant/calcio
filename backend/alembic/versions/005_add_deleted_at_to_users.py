"""Add deleted_at field to users table

Revision ID: 005_add_deleted_at_to_users
Revises: 004_add_deleted_at_to_players
Create Date: 2025-01-XX XX:XX:XX.000000

Schema changes merged into 000_initial_schema for fresh deployments.
"""
from typing import Sequence, Union


revision: str = "005_add_deleted_at_to_users"
down_revision: Union[str, None] = "004_add_deleted_at_to_players"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

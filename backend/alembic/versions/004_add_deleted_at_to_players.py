"""Add deleted_at field to players table

Revision ID: 004_add_deleted_at_to_players
Revises: 003_add_root_user_field
Create Date: 2025-01-XX XX:XX:XX.000000

Schema changes merged into 000_initial_schema for fresh deployments.
"""
from typing import Sequence, Union


revision: str = "004_add_deleted_at_to_players"
down_revision: Union[str, None] = "003_add_root_user_field"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

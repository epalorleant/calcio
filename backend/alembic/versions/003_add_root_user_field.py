"""Add is_root field to users table

Revision ID: 003_add_root_user_field
Revises: 002_add_user_accounts
Create Date: 2025-12-21 22:28:06.000000

Schema changes merged into 000_initial_schema for fresh deployments.
"""
from typing import Sequence, Union


revision: str = "003_add_root_user_field"
down_revision: Union[str, None] = "002_add_user_accounts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

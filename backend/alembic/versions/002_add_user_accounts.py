"""Add user accounts

Revision ID: 002_add_user_accounts
Revises: 001_add_session_templates
Create Date: 2024-12-21 13:53:07.000000

Schema changes merged into 000_initial_schema for fresh deployments.
"""
from typing import Sequence, Union


revision: str = "002_add_user_accounts"
down_revision: Union[str, None] = "001_add_session_templates"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

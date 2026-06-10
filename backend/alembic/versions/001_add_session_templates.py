"""Add session templates

Revision ID: 001_add_session_templates
Revises: 000_initial_schema
Create Date: 2024-01-01 00:00:00.000000

Schema changes merged into 000_initial_schema for fresh deployments.
"""
from typing import Sequence, Union


revision: str = "001_add_session_templates"
down_revision: Union[str, None] = "000_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

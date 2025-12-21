"""Add deleted_at field to users table

Revision ID: 005_add_deleted_at_to_users
Revises: 004_add_deleted_at_to_players
Create Date: 2025-01-XX XX:XX:XX.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005_add_deleted_at_to_users'
down_revision: Union[str, None] = '004_add_deleted_at_to_players'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'deleted_at')


"""Add deleted_at field to players table

Revision ID: 004_add_deleted_at_to_players
Revises: 003_add_root_user_field
Create Date: 2025-01-XX XX:XX:XX.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004_add_deleted_at_to_players'
down_revision: Union[str, None] = '003_add_root_user_field'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('players', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('players', 'deleted_at')


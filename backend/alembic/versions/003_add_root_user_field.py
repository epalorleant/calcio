"""Add is_root field to users table

Revision ID: 003_add_root_user_field
Revises: 002_add_user_accounts
Create Date: 2025-12-21 22:28:06.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003_add_root_user_field'
down_revision: Union[str, None] = '002_add_user_accounts'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_root', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    op.drop_column('users', 'is_root')


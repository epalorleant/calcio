"""Add user accounts

Revision ID: 002_add_user_accounts
Revises: 001_add_session_templates
Create Date: 2024-12-21 13:53:07.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_add_user_accounts'
down_revision: Union[str, None] = '001_add_session_templates'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # Add user_id to players table
    op.add_column('players', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_player_user',
        'players',
        'users',
        ['user_id'],
        ['id'],
        ondelete='SET NULL'
    )
    op.create_unique_constraint('uq_player_user', 'players', ['user_id'])


def downgrade() -> None:
    # Remove user_id from players table
    op.drop_constraint('uq_player_user', 'players', type_='unique')
    op.drop_constraint('fk_player_user', 'players', type_='foreignkey')
    op.drop_column('players', 'user_id')

    # Drop users table
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')


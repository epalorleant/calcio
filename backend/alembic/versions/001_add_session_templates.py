"""Add session templates

Revision ID: 001_add_session_templates
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_add_session_templates'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Check if we're using PostgreSQL
    bind = op.get_bind()
    is_postgres = bind.dialect.name == 'postgresql'
    
    # Create RecurrenceType enum (PostgreSQL only)
    if is_postgres:
        # Create the enum type if it doesn't exist (using DO block to handle duplicates)
        op.execute("""
            DO $$ BEGIN
                CREATE TYPE recurrencetype AS ENUM ('NONE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """)
        
        # Create table with String type first to avoid SQLAlchemy trying to create enum
        recurrence_type_col = sa.Column('recurrence_type', sa.String(20), nullable=True)
    else:
        # SQLite uses String for enum
        recurrence_type_col = sa.Column('recurrence_type', sa.String(20), nullable=True)
    
    # Create session_templates table
    op.create_table(
        'session_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('time_of_day', sa.Time(), nullable=False),
        sa.Column('day_of_week', sa.Integer(), nullable=True),
        sa.Column('max_players', sa.Integer(), nullable=False),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='true'),
        recurrence_type_col,
        sa.Column('recurrence_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('recurrence_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_generated', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # For PostgreSQL, alter the column to use the enum type
    if is_postgres:
        op.execute("ALTER TABLE session_templates ALTER COLUMN recurrence_type TYPE recurrencetype USING recurrence_type::recurrencetype")
    
    # Add template_id to sessions table
    op.add_column('sessions', sa.Column('template_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_session_template',
        'sessions',
        'session_templates',
        ['template_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Remove foreign key and column
    op.drop_constraint('fk_session_template', 'sessions', type_='foreignkey')
    op.drop_column('sessions', 'template_id')
    
    # Drop table
    op.drop_table('session_templates')
    
    # Drop enum (PostgreSQL only)
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        op.execute('DROP TYPE IF EXISTS recurrencetype')


"""Initial schema

Revision ID: 000_initial_schema
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "000_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _create_enum_type(name: str, values: list[str]) -> None:
    values_sql = ", ".join(f"'{value}'" for value in values)
    op.execute(
        f"""
        DO $$ BEGIN
            CREATE TYPE {name} AS ENUM ({values_sql});
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
        """
    )


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    if is_postgres:
        _create_enum_type("sessionstatus", ["PLANNED", "COMPLETED", "CANCELLED"])
        _create_enum_type("availability", ["YES", "NO", "MAYBE"])
        _create_enum_type("sessionteam", ["A", "B", "BENCH"])
        _create_enum_type("matchteam", ["A", "B"])

        # Use String columns first to avoid SQLAlchemy emitting CREATE TYPE
        status_col = sa.Column("status", sa.String(length=20), nullable=False, server_default="PLANNED")
        availability_col = sa.Column("availability", sa.String(length=20), nullable=False)
        session_team_col = sa.Column("team", sa.String(length=20), nullable=True)
        match_team_col = sa.Column("team", sa.String(length=20), nullable=False)
    else:
        status_col = sa.Column("status", sa.String(length=20), nullable=False, server_default="PLANNED")
        availability_col = sa.Column("availability", sa.String(length=20), nullable=False)
        session_team_col = sa.Column("team", sa.String(length=20), nullable=True)
        match_team_col = sa.Column("team", sa.String(length=20), nullable=False)

    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("max_players", sa.Integer(), nullable=False),
        status_col,
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "players",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("preferred_position", sa.String(length=100), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "session_players",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("player_id", sa.Integer(), nullable=False),
        availability_col,
        session_team_col,
        sa.Column("is_goalkeeper", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id", "player_id", name="uq_session_player"),
    )

    op.create_table(
        "matches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("score_team_a", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("score_team_b", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["session_id"], ["sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id"),
    )

    op.create_table(
        "player_stats",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("match_id", sa.Integer(), nullable=False),
        sa.Column("player_id", sa.Integer(), nullable=False),
        match_team_col,
        sa.Column("goals", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("assists", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("minutes_played", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("rating_after_match", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["match_id"], ["matches.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("match_id", "player_id", name="uq_match_player_stats"),
    )

    op.create_table(
        "player_ratings",
        sa.Column("player_id", sa.Integer(), nullable=False),
        sa.Column("overall_rating", sa.Float(), nullable=False),
        sa.Column(
            "last_updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("player_id"),
    )

    if is_postgres:
        op.execute(
            "ALTER TABLE sessions ALTER COLUMN status TYPE sessionstatus "
            "USING status::sessionstatus"
        )
        op.execute(
            "ALTER TABLE sessions ALTER COLUMN status SET DEFAULT 'PLANNED'::sessionstatus"
        )
        op.execute(
            "ALTER TABLE session_players ALTER COLUMN availability TYPE availability "
            "USING availability::availability"
        )
        op.execute(
            "ALTER TABLE session_players ALTER COLUMN team TYPE sessionteam "
            "USING team::sessionteam"
        )
        op.execute(
            "ALTER TABLE player_stats ALTER COLUMN team TYPE matchteam "
            "USING team::matchteam"
        )


def downgrade() -> None:
    op.drop_table("player_ratings")
    op.drop_table("player_stats")
    op.drop_table("matches")
    op.drop_table("session_players")
    op.drop_table("players")
    op.drop_table("sessions")

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP TYPE IF EXISTS matchteam")
        op.execute("DROP TYPE IF EXISTS sessionteam")
        op.execute("DROP TYPE IF EXISTS availability")
        op.execute("DROP TYPE IF EXISTS sessionstatus")

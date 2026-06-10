"""Initial schema

Revision ID: 000_initial_schema
Revises:
Create Date: 2024-01-01 00:00:00.000000

Creates the full application schema for fresh deployments.
Later revisions (001-005) are retained as no-ops for history compatibility.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from migration_utils.postgres_enums import alter_string_column_to_enum, create_enum_type


revision: str = "000_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _enum_column(name: str, *, nullable: bool = False, default: str | None = None) -> sa.Column:
    col = sa.Column(name, sa.String(length=20), nullable=nullable)
    if default is not None:
        col.server_default = default
    return col


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    if is_postgres:
        create_enum_type("sessionstatus", ["PLANNED", "COMPLETED", "CANCELLED"])
        create_enum_type("availability", ["YES", "NO", "MAYBE"])
        create_enum_type("sessionteam", ["A", "B", "BENCH"])
        create_enum_type("matchteam", ["A", "B"])
        create_enum_type("recurrencetype", ["NONE", "WEEKLY", "BIWEEKLY", "MONTHLY"])

    status_col = _enum_column("status", default="PLANNED")
    availability_col = _enum_column("availability")
    session_team_col = _enum_column("team", nullable=True)
    match_team_col = _enum_column("team")
    recurrence_type_col = _enum_column("recurrence_type", nullable=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_root", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "session_templates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("time_of_day", sa.Time(), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=True),
        sa.Column("max_players", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        recurrence_type_col,
        sa.Column("recurrence_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("recurrence_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_generated", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
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
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_player_user"),
    )

    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("max_players", sa.Integer(), nullable=False),
        status_col,
        sa.Column("template_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["template_id"],
            ["session_templates.id"],
            name="fk_session_template",
            ondelete="SET NULL",
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
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["player_id"], ["players.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("player_id"),
    )

    if is_postgres:
        alter_string_column_to_enum("sessions", "status", "sessionstatus", default="PLANNED")
        alter_string_column_to_enum("session_players", "availability", "availability")
        alter_string_column_to_enum("session_players", "team", "sessionteam")
        alter_string_column_to_enum("player_stats", "team", "matchteam")
        alter_string_column_to_enum("session_templates", "recurrence_type", "recurrencetype")


def downgrade() -> None:
    op.drop_table("player_ratings")
    op.drop_table("player_stats")
    op.drop_table("matches")
    op.drop_table("session_players")
    op.drop_table("sessions")
    op.drop_table("players")
    op.drop_table("session_templates")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("DROP TYPE IF EXISTS recurrencetype")
        op.execute("DROP TYPE IF EXISTS matchteam")
        op.execute("DROP TYPE IF EXISTS sessionteam")
        op.execute("DROP TYPE IF EXISTS availability")
        op.execute("DROP TYPE IF EXISTS sessionstatus")

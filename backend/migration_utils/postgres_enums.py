"""Shared helpers for PostgreSQL enum handling in Alembic migrations."""

from alembic import op


def create_enum_type(name: str, values: list[str]) -> None:
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


def alter_string_column_to_enum(
    table: str,
    column: str,
    enum_name: str,
    *,
    default: str | None = None,
) -> None:
    """Convert a varchar column to a PostgreSQL enum, handling text defaults safely."""
    op.execute(f"ALTER TABLE {table} ALTER COLUMN {column} DROP DEFAULT")
    op.execute(
        f"ALTER TABLE {table} ALTER COLUMN {column} TYPE {enum_name} "
        f"USING {column}::{enum_name}"
    )
    if default is not None:
        op.execute(
            f"ALTER TABLE {table} ALTER COLUMN {column} "
            f"SET DEFAULT '{default}'::{enum_name}"
        )

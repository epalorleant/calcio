#!/bin/sh
# Migration script for containerized environments
# Converts async database URLs to sync for Alembic

set -e

# Get the database URL (could be async or sync)
DB_URL="${DATABASE_URL:-${DATABASE_URL_ASYNC}}"

# Convert async URLs to sync for Alembic
if echo "$DB_URL" | grep -q "postgresql+asyncpg://"; then
    DB_URL=$(echo "$DB_URL" | sed 's/postgresql+asyncpg:\/\//postgresql:\/\//')
elif echo "$DB_URL" | grep -q "sqlite+aiosqlite:///"; then
    DB_URL=$(echo "$DB_URL" | sed 's/sqlite+aiosqlite:\/\//sqlite:\/\//')
fi

# Export for Alembic
export DATABASE_URL="$DB_URL"

echo "Running migrations with: $DATABASE_URL"
alembic upgrade head


# Calcio Backend

FastAPI application for managing futsal sessions, players, and ratings.

## Layout
- `app/` – FastAPI code organized by domain (API routers, core config, database models, services, schemas, tests).
- `alembic/` – Database migrations.

## Configuration
- Environment variables are read via `pydantic-settings` with the `CALCIO_` prefix.
- Copy `.env.example` to `.env` for local development overrides.

## Local run
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Migrations
```
alembic upgrade head
```

# Calcio Backend

FastAPI application for managing futsal sessions, players, and ratings.

## Layout
- `app/` – FastAPI code organized by domain (API routers, core config, database models, services, schemas, tests).
- `alembic/` – Database migrations.

## Local run
```bash
uvicorn app.main:app --reload
```

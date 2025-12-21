# Calcio Backend

FastAPI application for managing futsal sessions, players, and ratings.

## Layout
- `app/` – FastAPI code organized by domain (API routers, core config, database models, services, schemas, tests).
- `alembic/` – Database migrations.

## Local run
```bash
uvicorn app.main:app --reload
```

If `DATABASE_URL` is not provided, the API will default to a local SQLite file database at
`calcio.db` in the backend directory, which is useful for quick experiments and tests.

## Creating the Root User

Before you can use admin features, you need to create the initial root user account. See [README_ROOT_USER.md](README_ROOT_USER.md) for detailed instructions.

Quick start:
```bash
python scripts/create_root_user.py --email admin@example.com --username admin --password your_secure_password
```

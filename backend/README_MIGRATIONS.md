# Database Migrations

This project uses Alembic for database migrations.

## Initial Setup

To create the initial migration from existing models:

```bash
cd backend
alembic revision --autogenerate -m "Initial migration"
```

## Running Migrations

To apply all pending migrations:

```bash
alembic upgrade head
```

To rollback one migration:

```bash
alembic downgrade -1
```

To see current migration status:

```bash
alembic current
```

To see migration history:

```bash
alembic history
```

## Creating New Migrations

After modifying models in `app/models.py`:

```bash
alembic revision --autogenerate -m "Description of changes"
```

Then review the generated migration file in `alembic/versions/` before applying it.

## Environment Variables

The migration system uses the same `DATABASE_URL` environment variable as the application.

For SQLite (default):
```bash
DATABASE_URL=sqlite:///./calcio.db alembic upgrade head
```

For PostgreSQL:
```bash
DATABASE_URL=postgresql://user:pass@localhost/calcio alembic upgrade head
```


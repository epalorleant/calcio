# Improvement Suggestions

The current scaffold is a good starting point but requires additional setup to be functional and maintainable. Below are recommended improvements by area.

## Repository-wide
- Add a `.gitignore` (Python, Node, editor artifacts) and `.dockerignore` files for backend/frontend builds to reduce context size.
- Introduce basic CI (lint + test) with separate jobs for backend and frontend.
- Provide lockfiles (`requirements.txt` or `poetry.lock`; `package-lock.json`/`pnpm-lock.yaml`) to ensure reproducible installs.

## Backend
- Include a `[build-system]` table in `pyproject.toml` or switch to a requirements-based install; the current Dockerfile’s `pip install .` will fail without build metadata.
- Add an application package (e.g., `app/__init__.py` already present) plus `__all__` as needed, and consider setting up an editable install for local dev.
- Create `alembic` directory with `alembic.ini` and env script; add a `Database` dependency provider and session management using SQLAlchemy 2.0 style.
- Provide settings management via `pydantic-settings` with `.env` loading for DB URL, CORS origins, and JWT secrets.
- Add API router structure (`api/router.py`) and include a health route in `main.py` via router registration rather than inline definitions.
- Implement logging configuration, exception handlers, and lifespan startup/shutdown (e.g., DB health checks) hooks.
- Add unit tests (pytest) and basic data models/schemas for players, sessions, availability, ratings, and service layer stubs for Elo/team generation.

## Backend Docker
- Install system build deps only if needed; prefer multi-stage build (builder + slim runtime) to reduce image size.
- Avoid using `pip install .` until the project is package-ready; alternatively, install dependencies via a generated `requirements.txt`.
- Add non-root user and explicitly expose port 8000.

## Frontend
- Add `vite.config.ts`, `index.css`, and basic component/page scaffolds to match the documented layout.
- Commit a lockfile and consider using `pnpm` or `npm` consistently with `engines` field.
- Provide linting/prettier configs and scripts (format, type-check) plus React Query provider setup in `main.tsx`.
- Configure environment handling (`import.meta.env.VITE_API_URL`) and API client wrapper (axios instance) in `src/api`.
- Add routing (`react-router-dom`) with placeholder pages for Sessions, Players, and Admin.

## Frontend Docker
- Use a production build served by a minimal web server (e.g., `nginx` stage) instead of running the dev server in container.
- Add `.dockerignore` to exclude `node_modules` and build artifacts.

## Infra
- Extend `docker-compose.yml` with named networks, healthchecks for db/backend, and volume mounts for hot-reload in development.
- Add migration command to backend service (e.g., `alembic upgrade head` entrypoint or separate one-off service).
- Provide sample env files for compose and document port mappings / service URLs in the root README.

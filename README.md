# Calcio

Monorepo for the Calcio futsal session manager.

## Structure
- `backend/` – FastAPI application (SQLAlchemy, PostgreSQL).
- `frontend/` – React + TypeScript single-page app.
- `infra/` – Containerization and deployment assets (Docker Compose, k8s/OpenShift).

## Getting Started
1. Copy `backend/.env.example` to `backend/.env` and adjust values.
2. From `infra/`, run `docker-compose up --build` for a local stack with Postgres, API, and frontend.
3. API should be available at `http://localhost:8000/health` and frontend at `http://localhost:8080`.

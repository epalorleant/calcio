import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncEngine

from .core.config import settings
from .db import engine
from .models import Base
from .routers import matches, players, sessions

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("calcio")

app = FastAPI(title=settings.api_title, version=settings.api_version, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info("%s %s -> %s (%.1f ms)", request.method, request.url.path, response.status_code, duration_ms)
    return response

def register_routers(application: FastAPI) -> None:
    application.include_router(players.router)
    application.include_router(sessions.router)
    application.include_router(matches.router)

register_routers(app)


@app.get("/healthz")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
async def init_db() -> None:
    # Database schema is managed by Alembic migrations.
    # Run migrations with: alembic upgrade head
    pass

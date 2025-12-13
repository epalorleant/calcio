import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .db import engine
from .models import Base
from .routers import matches, players, sessions

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("calcio")

app = FastAPI(title="Calcio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
def init_db() -> None:
    # Create tables if they do not exist. For production schema changes, use migrations.
    Base.metadata.create_all(bind=engine)

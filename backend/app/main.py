from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import matches, players, sessions

app = FastAPI(title="Calcio API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def register_routers(application: FastAPI) -> None:
    application.include_router(players.router)
    application.include_router(sessions.router)
    application.include_router(matches.router)


register_routers(app)


@app.get("/healthz")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}

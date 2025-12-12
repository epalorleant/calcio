from fastapi import FastAPI

app = FastAPI(title="Calcio API")


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}

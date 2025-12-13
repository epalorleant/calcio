from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", ".env.local"), extra="ignore")

    app_name: str = "Calcio API"
    environment: str = Field("development", validation_alias=("CALCIO_ENVIRONMENT", "ENVIRONMENT"))
    database_url: str = Field(..., validation_alias=("CALCIO_DATABASE_URL", "DATABASE_URL"))
    cors_origins: List[AnyHttpUrl] | list[str] = Field(default_factory=list, validation_alias=("CALCIO_CORS_ORIGINS", "CORS_ORIGINS"))
    secret_key: str = Field("change-me", validation_alias=("CALCIO_SECRET_KEY", "SECRET_KEY"))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

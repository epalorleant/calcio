"""Application configuration."""
import os
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API
    api_title: str = "Calcio API"
    api_version: str = "0.1.0"
    debug: bool = False

    # CORS
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    cors_allow_headers: List[str] = ["*"]

    # Database
    database_url: str = "sqlite+aiosqlite:///./calcio.db"
    db_pool_size: int = 10
    db_max_overflow: int = 20
    db_pool_timeout: int = 30

    # Team Balancing
    team_size_default: int = 5
    team_balance_optimization_threshold: int = 14

    # Authentication
    secret_key: str = "your-secret-key-change-in-production"  # Should be in .env
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    class Config:
        env_file = ".env"
        case_sensitive = False

        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str) -> any:
            """Parse CORS origins from comma-separated string."""
            if field_name == "cors_origins":
                return [origin.strip() for origin in raw_val.split(",") if origin.strip()]
            return cls.json_loads(raw_val)


# Global settings instance
settings = Settings()

# Override CORS origins from environment if provided
if os.getenv("CORS_ORIGINS"):
    settings.cors_origins = [
        origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()
    ]

# Allow wildcard for development
if os.getenv("CORS_ALLOW_ALL", "").lower() in ("true", "1", "yes"):
    settings.cors_origins = ["*"]


import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from ..core.config import settings

DATABASE_URL = os.getenv("DATABASE_URL", settings.database_url)


def _to_async_url(url: str) -> str:
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("sqlite:///"):
        return url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
    return url


DATABASE_URL_ASYNC = _to_async_url(DATABASE_URL)

pool_size = int(os.getenv("DB_POOL_SIZE", str(settings.db_pool_size)))
max_overflow = int(os.getenv("DB_MAX_OVERFLOW", str(settings.db_max_overflow)))
pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", str(settings.db_pool_timeout)))

engine_kwargs = {
    "future": True,
}

# Only apply pooling options on non-sqlite databases.
if not DATABASE_URL_ASYNC.startswith("sqlite+"):
    engine_kwargs.update(
        {
            "pool_size": pool_size,
            "max_overflow": max_overflow,
            "pool_timeout": pool_timeout,
        }
    )

engine = create_async_engine(DATABASE_URL_ASYNC, **engine_kwargs)

SessionLocal = async_sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, class_=AsyncSession)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session

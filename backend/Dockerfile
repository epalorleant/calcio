FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir .

# Copy application source
COPY app ./app

# Copy Alembic configuration for migrations
COPY alembic.ini ./
COPY alembic ./alembic

# Copy utility scripts
COPY scripts ./scripts
RUN chmod +x scripts/*.py 2>/dev/null || true

# Ensure alembic is in PATH (should already be from pip install)
# Verify alembic is available
RUN which alembic || (echo "Alembic not found in PATH" && exit 1)

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

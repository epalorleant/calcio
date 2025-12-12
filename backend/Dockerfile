FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
COPY pyproject.toml ./
RUN pip install --no-cache-dir .

# Copy application source
COPY app ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

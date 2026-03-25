# ========================================================================================
# TRINETRA Cyber Defense Backend - Production Dockerfile
# ========================================================================================

# Stage 1: Builder - Install dependencies
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Runtime - Minimal production image
FROM python:3.11-slim

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 appuser

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY backend/ ./backend/
COPY Models/ ./Models/

# Set Playwright browsers path
ENV PLAYWRIGHT_BROWSERS_PATH=/app/pw-browsers

# Ensure directories exist and have proper permissions
WORKDIR /app/backend
RUN mkdir -p data logs screenshots reference_screenshots /app/pw-browsers \
    && chown -R appuser:appuser /app

# Install Playwright dependencies (as root)
RUN playwright install-deps chromium

# Install Playwright browsers (as root, but to a shared path)
RUN playwright install chromium

# Final ownership check
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Default startup command
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

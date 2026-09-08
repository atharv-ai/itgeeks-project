# ─── Stage 1: builder ──────────────────────────────────────────────────────────
# Install dependencies in an isolated stage so the final image stays lean.
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build deps needed by some packages (e.g. bcrypt C extension)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ─── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source (excludes anything in .dockerignore)
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Uvicorn serves on 0.0.0.0 so Docker can route traffic in
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

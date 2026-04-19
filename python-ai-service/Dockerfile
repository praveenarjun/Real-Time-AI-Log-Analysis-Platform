# --- Production Engine ---
FROM python:3.11-slim

# Maintainer info
LABEL maintainer="praveenchalla"
LABEL application="ai-log-forensics-engine"

WORKDIR /app

# Install system dependencies & Protoc
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements & install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application logic
COPY . .

# Generate gRPC code on build
# This ensures Python and Go types are perfectly synchronized
RUN python -m grpc_tools.protoc -Iproto --python_out=. --grpc_python_out=. proto/ai_service.proto

# --- Runtime Configuration ---

# Expose FastAPI (8000) and gRPC (50051)
EXPOSE 8000 50051

# Environment variables are managed by Kubernetes Secrets/ConfigMaps.
# No hardcoded 'localhost' defaults are used here to ensure production stability.

# Security: Non-root user
RUN useradd -m ai-user && chown -R ai-user /app
USER ai-user

# Healthcheck to monitor API and gRPC Gateway
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start the concurrent engine
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# --- Build Stage ---
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY simulator.py scenarios.py ./

# Environment Variables
ENV COLLECTOR_URL="http://go-collector:8081/logs"
ENV LOG_RATE="5"
ENV ERROR_RATE="0.05"
ENV ANOMALY_INTERVAL="60"
ENV ANOMALY_DURATION="15"

# Run the simulator
ENTRYPOINT ["python", "-u", "simulator.py"]

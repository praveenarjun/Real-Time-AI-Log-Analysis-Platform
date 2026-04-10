#!/bin/bash
set -e

# ANSI Color Tokens
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}🛡️  AI Log Analysis Platform - Automated Setup${NC}"
echo -e "${CYAN}---------------------------------------------${NC}"

# 1. Environment Variables Sync
if [ ! -f .env ]; then
    echo -e "${YELLOW}🔹 Creating .env from template...${NC}"
    echo "OPENAI_API_KEY=your_key_here" > .env
    echo "SLACK_WEBHOOK_URL=your_url_here" >> .env
    echo "DATABASE_URL=postgres://user:pass@localhost:5432/workforce" >> .env
    echo "KAFKA_BROKERS=localhost:9092" >> .env
else
    echo -e "${GREEN}✅ .env file exists.${NC}"
fi

# 2. gRPC Protobuf Generation
echo -e "${CYAN}🔹 Generating gRPC Cross-Language Bindings...${NC}"
if command -v protoc &> /dev/null; then
    bash scripts/generate-proto.sh
else
    echo -e "${YELLOW}⚠️  protoc not found locally. Skipping generation.${NC}"
    echo -e "   Please run 'docker compose run --rm ai-service bash scripts/generate-proto.sh' after build."
fi

# 3. Go Backend Setup (Multi-Service)
echo -e "${CYAN}🔹 Initializing Go Backend Services (Target: 1.24.0)...${NC}"
# Use Docker to tidy modules, isolating the host Mac's toolchain (v1.26) from the platform standard (v1.24.0)
docker run --rm -v "$(pwd):/app" -w /app/go-services golang:1.24-alpine go mod tidy
echo -e "${GREEN}✅ Go modules synchronized (Isolated at 1.24.0).${NC}"

# 4. AI Analysis Service Setup
echo -e "${CYAN}🔹 Orchestrating Python AI Engine...${NC}"
cd python-ai-service
if [ ! -d venv ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
fi
echo -e "${GREEN}✅ AI Service environment ready.${NC}"
cd ..

# 5. Log Simulator Setup
echo -e "${CYAN}🔹 Initializing Simulation Engine...${NC}"
cd log-simulator
if [ ! -d venv ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
fi
echo -e "${GREEN}✅ Simulator environment ready.${NC}"
cd ..

# 6. Frontend Setup
echo -e "${CYAN}🔹 Setting up Next.js Dashboard...${NC}"
cd frontend
if [ ! -d node_modules ]; then
    npm install
fi
echo -e "${GREEN}✅ Frontend dependencies installed.${NC}"
cd ..

echo -e "${CYAN}---------------------------------------------${NC}"
echo -e "${GREEN}🚀 Setup Complete! Platform is ready for launch.${NC}"
echo -e "${YELLOW}Next Step: Run 'make up' to start all 6 microservices.${NC}"

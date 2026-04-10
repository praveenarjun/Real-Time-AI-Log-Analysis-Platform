# platform-orchestration

.PHONY: setup up down build simulate logs help

# Default Goal
help:
	@echo "🛡️ AI Log Analysis Platform - Commands"
	@echo "-------------------------------------"
	@echo "setup     : Run automated environment sync (sh scripts/setup.sh)"
	@echo "up        : Start full platform with Docker Compose"
	@echo "down      : Stop and remove all service containers"
	@echo "build     : Rebuild all service images"
	@echo "simulate  : Trigger high-rate 'BURST' anomaly scenario"
	@echo "logs      : Stream logs from all platform services"
	@echo "test-full : Run End-to-End Forensic simulation (Injection -> AI -> Storage)"

# Core Lifecycle
setup:
	@bash scripts/setup.sh

up:
	@docker compose up -d
	@echo "🚀 Platform live at http://localhost:3000"

down:
	@docker compose down

build:
	@docker compose build --no-cache

# Operational Utilities
simulate:
	@docker compose run --rm log-simulator --scenario BURST --rate 10

logs:
	@docker compose logs -f

# Troubleshooting
verify:
	@echo "🔹 Checking Go Services..."
	@cd go-services && go build ./...
	@echo "🔹 Checking Python AI Engine..."
	@cd python-ai-service && python3 -m py_compile main.py
	@echo "🔹 Checking Frontend..."
	@cd frontend && npm run build --dry-run
# Dedicated End-to-End Diagnostic
test-full:
	@echo "🚨 Injecting Critical Database Failure Log..."
	@curl -s -X POST http://localhost:8081/api/v1/ingest/batch \
		-H "Content-Type: application/json" \
		-d '[{"timestamp": "2024-04-07T17:41:00Z", "level": "FATAL", "message": "CRITICAL: Database connection shard-1 failed. Pool exhausted. Final E2E Test.", "service_name": "db-cluster"}]'
	@echo "\n🧠 Waiting 30s for Azure GPT Forensic Analysis & Storage..."
	@sleep 30
	@echo "📊 Final Verification: Checking Elasticsearch for Incident Report..."
	@curl -s http://localhost:9200/incidents/_search?pretty | grep -i "root_cause" -A 5 || echo "❌ No report found yet. Check AI Service logs."

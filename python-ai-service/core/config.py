from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    # API Keys
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    OPENAI_API_VERSION: str = "2023-05-15"

    LLM_PROVIDER: str = "openai"  # gemini, openai, or azure

    # Infrastructure
    KAFKA_BROKERS: str = "localhost:9092"
    REDIS_URL: str = "redis://localhost:6379"

    # Ports
    GRPC_PORT: int = 50051
    HTTP_PORT: int = 8000

    # AI Settings
    LOG_LEVEL: str = "INFO"
    LLM_MODEL: str = "gemini-1.5-pro"
    LLM_TEMPERATURE: float = 0.0

    # Analysis Logic
    ANOMALY_ERROR_RATE_THRESHOLD: float = 0.05
    ANOMALY_SPIKE_MULTIPLIER: float = 3.0
    ALERT_COOLDOWN_SECONDS: int = 300
    # Kafka Topics (Configurable via Environment Variables)
    KAFKA_TOPIC_RAW: str = "raw-logs"
    KAFKA_TOPIC_ANOMALIES: str = "anomalies"
    KAFKA_TOPIC_ALERTS: str = "alerts"
    KAFKA_TOPIC_REPORTS: str = "incident-reports"

    BATCH_PROCESS_SIZE: int = 100

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    def get_kafka_brokers(self) -> List[str]:
        """Parses the comma-separated Kafka broker string into a list."""
        return [b.strip() for b in self.KAFKA_BROKERS.split(",")]


settings = Settings()

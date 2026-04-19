import json
import logging
import asyncio
import os
import ssl  # --- Added for Aiven SSL ---

from typing import AsyncGenerator, List, Dict, Any
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from core.config import settings

logger = logging.getLogger("ai-service.kafka")


def get_ssl_context():
    """Helper to create SSL context for Aiven Kafka."""
    ca_path = os.getenv("KAFKA_CA_PATH", "/app/certs/ca.pem")
    cert_path = os.getenv("KAFKA_CERT_PATH", "/app/certs/service.cert")
    key_path = os.getenv("KAFKA_KEY_PATH", "/app/certs/service.key")

    # Only return context if files actually exist (to avoid local development errors)
    if (
        os.path.exists(ca_path)
        and os.path.exists(cert_path)
        and os.path.exists(key_path)
    ):
        context = ssl.create_default_context(cafile=ca_path)
        context.load_cert_chain(certfile=cert_path, keyfile=key_path)
        # Disable hostname check if connecting via IP or internal K8s proxy
        context.check_hostname = False
        return context
    return None


class LogKafkaConsumer:
    def __init__(self, brokers: List[str], topic: str, group_id: str):
        self.brokers = ",".join(brokers)
        self.topic = topic
        self.group_id = group_id

        # Get the SSL context for Aiven
        ssl_ctx = get_ssl_context()
        
        # Get SASL credentials
        sasl_user = os.getenv("KAFKA_USER")
        sasl_pass = os.getenv("KAFKA_PASS")

        self.consumer = AIOKafkaConsumer(
            self.topic,
            bootstrap_servers=self.brokers,
            group_id=self.group_id,
            auto_offset_reset="latest",
            enable_auto_commit=True,
            # --- SASL_SSL Config ---
            security_protocol="SASL_SSL" if (ssl_ctx and sasl_user) else ("SSL" if ssl_ctx else "PLAINTEXT"),
            ssl_context=ssl_ctx,
            sasl_mechanism="PLAIN" if sasl_user else None,
            sasl_plain_username=sasl_user,
            sasl_plain_password=sasl_pass,
            # -----------------------
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        )

    async def consume(self) -> AsyncGenerator[Dict[str, Any], None]:
        """Async generator that yields individual logs from Kafka."""
        retries = 5
        while retries > 0:
            try:
                await self.consumer.start()
                break
            except Exception as e:
                retries -= 1
                logger.warning(f"Kafka consumer startup failed: {e}. Retries left: {retries}")
                if retries == 0:
                    raise e
                await asyncio.sleep(3)

        try:
            async for msg in self.consumer:
                yield msg.value
        except Exception as e:
            logger.error(f"Error consuming logs: {e}")
        finally:
            await self.consumer.stop()

    async def consume_batches(
        self, batch_size: int, timeout_ms: int = 1000
    ) -> AsyncGenerator[List[Dict[str, Any]], None]:
        """Async generator that yields batches of logs from Kafka."""
        retries = 5
        while retries > 0:
            try:
                await self.consumer.start()
                break
            except Exception as e:
                retries -= 1
                logger.warning(f"Kafka consumer startup failed: {e}. Retries left: {retries}")
                if retries == 0:
                    raise e
                await asyncio.sleep(3)

        try:
            while True:
                # Use wait_for to implement a timeout for the batch
                batch = []
                try:
                    # In a real high-throughput scenario, we'd use getmany()
                    # but here we'll manually collect for simplicity and control
                    start_time = asyncio.get_event_loop().time()
                    while len(batch) < batch_size:
                        remaining = (timeout_ms / 1000) - (
                            asyncio.get_event_loop().time() - start_time
                        )
                        if remaining <= 0:
                            break

                        try:
                            msg = await asyncio.wait_for(
                                self.consumer.getone(), timeout=remaining
                            )
                            val = msg.value
                            # Unpack LogBatch if it is an object with a 'logs' list
                            if isinstance(val, dict) and "logs" in val:
                                batch.extend(val["logs"])
                            elif isinstance(val, list):
                                batch.extend(val)
                            else:
                                batch.append(val)
                        except asyncio.TimeoutError:
                            break

                    if batch:
                        yield batch
                except Exception as e:
                    logger.error(f"Error in batch consumption loop: {e}")
                    await asyncio.sleep(1)  # Backoff
        finally:
            await self.consumer.stop()


class ResultKafkaProducer:
    def __init__(self, brokers: List[str]):
        self.brokers = ",".join(brokers)

        # Get the SSL context for Aiven
        ssl_ctx = get_ssl_context()

        # Get SASL credentials
        sasl_user = os.getenv("KAFKA_USER")
        sasl_pass = os.getenv("KAFKA_PASS")

        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.brokers,
            # --- SASL_SSL Config ---
            security_protocol="SASL_SSL" if (ssl_ctx and sasl_user) else ("SSL" if ssl_ctx else "PLAINTEXT"),
            ssl_context=ssl_ctx,
            sasl_mechanism="PLAIN" if sasl_user else None,
            sasl_plain_username=sasl_user,
            sasl_plain_password=sasl_pass,
            # -----------------------
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )

    async def start(self):
        await self.producer.start()

    async def stop(self):
        await self.producer.stop()

    async def send(self, topic: str, value: Any, key: str = None):
        """Sends a message to a specific topic."""
        try:
            bk = key.encode("utf-8") if key else None
            await self.producer.send_and_wait(topic, value, key=bk)
        except Exception as e:
            logger.error(f"Failed to send message to {topic}: {e}")

    async def send_anomaly(self, anomaly: Dict[str, Any]):
        await self.send(settings.KAFKA_TOPIC_ANOMALIES, anomaly, key=anomaly.get("id"))

    async def send_alert(self, alert: Dict[str, Any]):
        await self.send(settings.KAFKA_TOPIC_ALERTS, alert, key=alert.get("id"))

    async def send_report(self, report: Dict[str, Any]):
        await self.send(settings.KAFKA_TOPIC_REPORTS, report, key=report.get("id"))

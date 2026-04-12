import random
from datetime import datetime, timezone
import uuid

SERVICES = [
    "auth-service", 
    "payment-gateway", 
    "db-cluster-01", 
    "user-profile",
    "inventory-api",
    "notification-worker",
    "search-engine",
    "cache-layer"
]

def generate_log_entry(service, level, message, metadata=None):
    if metadata is None:
        metadata = {}
    
    # Ensure all metadata values are strings to match Go's map[string]string
    sanitized_metadata = {k: str(v) for k, v in metadata.items()}
    
    return {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service_name": service,
        "source": "APPLICATION",
        "host": "simulator-node-01",
        "level": level,
        "message": message,
        "metadata": {
            "environment": "production",
            "region": "us-east-1",
            **sanitized_metadata
        }
    }

def database_cascade():
    """DB primary fails -> connection errors cascade across services"""
    logs = []
    
    # 1. Initial Failure
    logs.append(generate_log_entry("db-cluster-01", "ERROR", "Primary node heartbeat lost", {"node_id": "pg-primary-01"}))
    logs.append(generate_log_entry("db-cluster-01", "CRITICAL", "Failover initiated but secondary syncing is lagging", {"lag_ms": 4500}))
    
    # 2. Connection timeouts across services
    affected_services = ["auth-service", "payment-gateway", "inventory-api", "user-profile"]
    
    for _ in range(35):
        svc = random.choice(affected_services)
        msg_opts = [
            f"Dial timeout connecting to db-cluster-01",
            f"Active connection dropped during query execution",
            f"Transaction failed: connection refused",
            f"Unable to verify user session: database offline"
        ]
        logs.append(generate_log_entry(svc, "ERROR", random.choice(msg_opts), {"db_endpoint": "db-cluster-01:5432"}))
    
    return logs

def memory_leak():
    """Gradual memory increase -> OOM -> crash"""
    logs = []
    service = "payment-gateway"
    mem_usage = 60.0
    
    for i in range(15):
        mem_usage += random.uniform(2.0, 5.0)
        logs.append(generate_log_entry(service, "INFO", f"GC cycle completed. Heap utilization: {mem_usage:.1f}%", {"memory_utilization": mem_usage}))
        
    for i in range(15):
        mem_usage += random.uniform(5.0, 10.0)
        logs.append(generate_log_entry(service, "WARN", f"High memory usage warning. Threshold breached at {mem_usage:.1f}%", {"memory_utilization": mem_usage}))
        
    # Crash
    logs.append(generate_log_entry(service, "ERROR", "Failed to allocate memory: out of memory (OOM killer invoked)", {"memory_utilization": 100.0}))
    logs.append(generate_log_entry(service, "CRITICAL", "Container abruptly terminated by Docker daemon", {"exit_code": 137}))
    
    return logs

def ddos_attack():
    """Sudden traffic spike -> rate limiting -> overload"""
    logs = []
    
    # Initial traffic spike
    for _ in range(10):
        ip = f"192.168.1.{random.randint(10, 250)}"
        logs.append(generate_log_entry("api-gateway", "WARN", f"Unusual traffic volume detected from IP range", {"client_ip": ip, "req_rate": 500}))
        
    # Rate Limiting triggered actively
    for _ in range(25):
        ip = f"192.168.1.{random.randint(10, 250)}"
        logs.append(generate_log_entry("api-gateway", "ERROR", f"HTTP 429 Too Many Requests sent to client", {"client_ip": ip, "path": "/api/v1/checkout"}))
        
    # Underlying services choking
    logs.append(generate_log_entry("payment-gateway", "ERROR", "Thread pool exhausted. Dropping incoming requests."))
    logs.append(generate_log_entry("auth-service", "ERROR", "Redis rate limiting token bucket exhausted. Falling back to degraded mode."))
    
    return logs

def disk_full():
    """Disk warnings increase -> write failures -> service degradation"""
    logs = []
    service = "cache-layer"
    disk_usage = 85.0
    
    for _ in range(10):
        disk_usage += random.uniform(1.0, 2.0)
        logs.append(generate_log_entry(service, "WARN", f"Disk space running low on /var/lib/redis", {"disk_usage_percent": disk_usage}))
        
    for _ in range(20):
        disk_usage += random.uniform(0.5, 0.8)
        if disk_usage >= 99.0:
            logs.append(generate_log_entry(service, "ERROR", f"Failed to write RDB snapshot on disk: No space left on device", {"disk_usage_percent": disk_usage}))
        else:
            logs.append(generate_log_entry(service, "WARN", f"Critical disk limits reached.", {"disk_usage_percent": disk_usage}))
            
    logs.append(generate_log_entry("api-gateway", "ERROR", "Cache serialization failed. Underlying cache-layer is read-only."))
    
    return logs

def certificate_expiry():
    """SSL warnings -> cert expired -> connection failures"""
    logs = []
    
    for _ in range(10):
        logs.append(generate_log_entry("api-gateway", "WARN", "SSL Certificate for *.ai-log.local expires in less than 24 hours.", {"cert_issuer": "LetsEncrypt"}))
        
    logs.append(generate_log_entry("api-gateway", "ERROR", "SSL Certificate has explicitly expired. Handshake rejected."))
    
    for _ in range(25):
        affected = random.choice(["auth-service", "notification-worker"])
        logs.append(generate_log_entry(affected, "ERROR", "x509: certificate has expired or is not yet valid. Cannot establish secure connection.", {"remote_host": "api-gateway"}))
        
    return logs

SCENARIO_FUNCTIONS = {
    "database_cascade": database_cascade,
    "memory_leak": memory_leak,
    "ddos_attack": ddos_attack,
    "disk_full": disk_full,
    "certificate_expiry": certificate_expiry
}

def check_anomaly():
    """Returns a random anomaly scenario logs list"""
    scenario_name = random.choice(list(SCENARIO_FUNCTIONS.keys()))
    logs = SCENARIO_FUNCTIONS[scenario_name]()
    return scenario_name, logs

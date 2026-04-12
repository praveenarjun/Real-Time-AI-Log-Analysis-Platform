import os
import time
import requests
import random
import uuid
from datetime import datetime, timezone
import logging
from colorama import init, Fore, Style

from scenarios import SERVICES, generate_log_entry, check_anomaly

init(autoreset=True)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger("Simulator")

# Environment Config
COLLECTOR_URL = os.getenv("COLLECTOR_URL", "https://back.praveen-challa.tech/api/v1/ingest/batch")
LOG_RATE = float(os.getenv("LOG_RATE", "10"))  # Logs per second
ERROR_RATE = float(os.getenv("ERROR_RATE", "0.05"))
ANOMALY_INTERVAL = int(os.getenv("ANOMALY_INTERVAL", "60"))
ANOMALY_DURATION = int(os.getenv("ANOMALY_DURATION", "15"))

LEVEL_WEIGHTS = {
    "DEBUG": 0.10,
    "INFO": 0.70,
    "WARN": 0.15,
    "ERROR": ERROR_RATE
}

NORMAL_MESSAGES = [
    "User authentication successful",
    "Processing payment transaction",
    "Database query executed in 12ms",
    "Cache hit for user profile",
    "Email notification dispatched",
    "Inventory updated successfully",
    "Search index refreshed",
    "Incoming API request routed",
    "Worker job spawned",
    "Session token validated"
]

def generate_normal_batch(size=5):
    logs = []
    
    levels = list(LEVEL_WEIGHTS.keys())
    weights = list(LEVEL_WEIGHTS.values())
    
    for _ in range(size):
        svc = random.choice(SERVICES)
        level = random.choices(levels, weights=weights, k=1)[0]
        msg = random.choice(NORMAL_MESSAGES)
        
        # Slightly alter messages based on severity
        if level == "ERROR":
            msg = f"Failed to perform action: {msg}"
        elif level == "WARN":
            msg = f"Latency detected while: {msg}"
            
        logs.append(generate_log_entry(svc, level, msg))
        
    return logs

def send_batch(logs):
    try:
        response = requests.post(
            COLLECTOR_URL, 
            json=logs, 
            timeout=3.0,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return True
    except requests.exceptions.RequestException as e:
        logger.error(f"{Fore.RED}Collector Connection Failed: {e}{Style.RESET_ALL}")
        return False

def main():
    global LOG_RATE
    import argparse
    parser = argparse.ArgumentParser(description="AI Log Simulation Engine")
    parser.add_argument("--scenario", type=str, help="Specific anomaly scenario to trigger immediately")
    parser.add_argument("--rate", type=float, default=LOG_RATE, help="Logs per second")
    args = parser.parse_args()

    LOG_RATE = args.rate

    print(f"{Fore.CYAN}=========================================={Style.RESET_ALL}")
    print(f"{Fore.CYAN}🚀 Launching AI Log Simulation Engine...{Style.RESET_ALL}")
    print(f"{Fore.CYAN}Target URL: {COLLECTOR_URL}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}Rate: {LOG_RATE} logs/sec | Anomaly Interval: {ANOMALY_INTERVAL}s{Style.RESET_ALL}")
    print(f"{Fore.CYAN}=========================================={Style.RESET_ALL}")
    
    # 0. Trigger specific scenario if requested
    if args.scenario:
        from scenarios import SCENARIO_FUNCTIONS
        if args.scenario in SCENARIO_FUNCTIONS:
            print(f"{Fore.MAGENTA}🎯 TRIGGERING TARGETED SCENARIO: {args.scenario}{Style.RESET_ALL}")
            logs = SCENARIO_FUNCTIONS[args.scenario]()
            send_batch(logs)
            print(f"{Fore.GREEN}✅ Scenario injected. Transitioning to normal traffic...{Style.RESET_ALL}")
        else:
            print(f"{Fore.RED}❌ Unknown scenario: {args.scenario}. Available: {list(SCENARIO_FUNCTIONS.keys())}{Style.RESET_ALL}")
            return

    start_time = time.time()
    last_anomaly_time = start_time
    last_stat_time = start_time
    
    total_sent = 0
    errors = 0
    current_anomaly = "None"
    
    sleep_interval = 1.0 / LOG_RATE if LOG_RATE > 0 else 0.5
    
    while True:
        now = time.time()
        
        # 1. Print Stats every 10 seconds
        if now - last_stat_time >= 10:
            print(f"{Fore.YELLOW}[STAT] Uptime: {int(now - start_time)}s | Sent: {total_sent} | Errors: {errors} | Anomaly: {current_anomaly}{Style.RESET_ALL}")
            last_stat_time = now
            current_anomaly = "None"
            
        # 2. Check to trigger Anomaly scenario
        if now - last_anomaly_time >= ANOMALY_INTERVAL:
            scenario_name, anomaly_logs = check_anomaly()
            print(f"\n{Fore.MAGENTA}************************************************{Style.RESET_ALL}")
            print(f"{Fore.MAGENTA}⚠️  INJECTING ANOMALY: {scenario_name} ({len(anomaly_logs)} logs){Style.RESET_ALL}")
            print(f"{Fore.MAGENTA}************************************************\n{Style.RESET_ALL}")
            
            success = send_batch(anomaly_logs)
            if success:
                total_sent += len(anomaly_logs)
            else:
                errors += len(anomaly_logs)
                
            current_anomaly = scenario_name
            last_anomaly_time = now
            
        # 3. Normal traffic generation
        normal_logs = generate_normal_batch(size=1)
        success = send_batch(normal_logs)
        
        if success:
            total_sent += 1
        else:
            errors += 1
            
        time.sleep(sleep_interval)

if __name__ == "__main__":
    main()

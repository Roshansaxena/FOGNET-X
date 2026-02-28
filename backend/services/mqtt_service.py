import json
import sqlite3
import requests
import time
import threading
import traceback
import psutil
import paho.mqtt.client as mqtt
from services.realtime import emit_metrics
from services.alert_service import send_email_alert, send_telegram_alert
from services.logger import init_db, log_event
from core.config import DB_NAME
from core.device_registry import DeviceRegistry
from core.context_model import ContextModel
from core.decision_engine import DecisionEngine
from core.orchestrator import Orchestrator
from core.orchestration_config import OrchestrationConfig
from concurrent.futures import ThreadPoolExecutor
from concurrent.futures import ThreadPoolExecutor
import time
from collections import deque
import time

# Sliding window critical tracking
critical_events = deque()
WINDOW_SECONDS = 10
CRITICAL_THRESHOLD = 5

# Executors
alert_executor = ThreadPoolExecutor(max_workers=3)
cloud_executor = ThreadPoolExecutor(max_workers=10)

# Cooldown protection
last_email_alert_time = 0
ALERT_COOLDOWN = 5  # seconds


# =====================================================
# INITIALIZATION
# =====================================================

print("🧠 FOGNET-X Fog Core Booting...")

registry = DeviceRegistry()
context_model = ContextModel()
decision_engine = DecisionEngine()
orchestrator = Orchestrator()
config = OrchestrationConfig()

init_db()

BROKER = "localhost"
PORT = 1883

SENSOR_TOPIC = "fognetx/sensors"
ACTUATOR_TOPIC = "fognetx/actuator"


# =====================================================
# CLOUD EXECUTION (ASYNC)
# =====================================================

def send_to_cloud_async(data, event_id):
    import time

    last_cloud_call = 0
    CLOUD_COOLDOWN = 0.1  # 100ms
    try:
        payload = json.dumps(data)
        payload_size = len(payload.encode("utf-8"))

        cloud_start = time.perf_counter()

        response = requests.post(
            "http://localhost:8000/cloud/process",
            json=data,
            timeout=1.5
        )

        cloud_latency = (time.perf_counter() - cloud_start) * 1000
        response_size = len(response.content)
        total_bandwidth = payload_size + response_size

        # Get SLA threshold dynamically
        cfg = config.get()
        SLA_CLOUD = cfg["sla_cloud_ms"]

        sla_violation = 1 if cloud_latency > SLA_CLOUD else 0

        # Update event record
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("""
            UPDATE events
            SET cloud_latency = ?, sla_violation = ?, bandwidth_bytes = ?
            WHERE id = ?
        """, (cloud_latency, sla_violation, total_bandwidth, event_id))
        conn.commit()
        conn.close()

        print(f"☁ Cloud Latency: {round(cloud_latency, 2)} ms | BW: {total_bandwidth} bytes")

    except Exception as e:
        print("☁ Cloud unavailable:", e)


# =====================================================
# MQTT MESSAGE HANDLER
# =====================================================

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        device_id = data.get("device_id", "unknown")

        # ------------------------------
        # DECISION TIMING
        # ------------------------------

        decision_start = time.perf_counter()

        registry.register_device(device_id)
        registry.update_heartbeat(device_id)
        context_model.update(device_id, data)

        severity, risk = decision_engine.evaluate(data)

        allocation = orchestrator.allocate_task(device_id, severity, risk)

        fog_latency = (time.perf_counter() - decision_start) * 1000

        # ------------------------------
        # SLA CHECK (FOG)
        # ------------------------------

        cfg = config.get()
        SLA_FOG = cfg["sla_fog_ms"]

        sla_violation = 1 if (
            allocation == "FOG_EXECUTION" and fog_latency > SLA_FOG
        ) else 0

        # ------------------------------
        # LOG EVENT
        # ------------------------------

        event_id = log_event(
            device_id,
            data.get("temperature", 0),
            data.get("gas", 0),
            severity,
            risk,
            allocation,
            fog_latency,
            None,
            0,
            sla_violation
        )
        emit_metrics({
            "device_id": device_id,
            "allocation": allocation,
            "risk": risk,
            "fog_latency": fog_latency,
            "severity": severity
        })
        # ------------------------------
        # CRITICAL ALERT HANDLING
        # ------------------------------

        if severity == "CRITICAL":

            actuator_payload = {
                "device_id": device_id,
                "action": "CLOSE_VALVE"
            }

            client.publish(ACTUATOR_TOPIC, json.dumps(actuator_payload))

            if severity == "CRITICAL":

                global last_email_alert_time

                now = time.time()

                # --- Sliding window tracking ---
                critical_events.append(now)

                # Remove old timestamps
                while critical_events and now - critical_events[0] > WINDOW_SECONDS:
                    critical_events.popleft()

                # --- Threshold trigger ---
                if len(critical_events) >= CRITICAL_THRESHOLD:

                    # --- Cooldown protection ---
                    if now - last_email_alert_time > ALERT_COOLDOWN:
                        last_email_alert_time = now

                        alert_executor.submit(
                            send_email_alert,
                            device_id,
                            risk,
                            data.get("temperature"),
                            data.get("gas")
                        )

                    # Reset window after triggering
                    critical_events.clear()

            threading.Thread(
                target=send_telegram_alert,
                args=(device_id, risk,
                      data.get("temperature"),
                      data.get("gas")),
                daemon=True
            ).start()

        # ------------------------------
        # CLOUD OFFLOAD
        # ------------------------------

        if allocation in ["CLOUD_EXECUTION", "FOG_AND_CLOUD"]:
            cloud_executor.submit(send_to_cloud_async, data, event_id)

        # ------------------------------
        # DEBUG OUTPUT
        # ------------------------------

        print("\n==============================")
        print(f"Device: {device_id}")
        print(f"Severity: {severity}")
        print(f"Risk: {round(risk, 3)}")
        print(f"Mode: {cfg['mode']}")
        print(f"Allocation: {allocation}")
        print(f"Fog Latency: {round(fog_latency, 2)} ms")
        print("==============================")

    except Exception:
        print("❌ Error processing message:")
        traceback.print_exc()


# =====================================================
# DEVICE HEALTH MONITOR
# =====================================================

def health_monitor():
    while True:
        registry.check_health()
        time.sleep(5)


# =====================================================
# SYSTEM MONITOR
# =====================================================

def system_monitor():
    while True:
        cpu = psutil.cpu_percent()
        memory = psutil.virtual_memory().percent
        print(f"⚙ Fog CPU: {cpu}% | RAM: {memory}%")
        time.sleep(10)


# =====================================================
# MQTT CLIENT SETUP
# =====================================================

client = mqtt.Client()
client.on_message = on_message
while True:
    try:
        client.connect(BROKER, PORT)
        break
    except Exception:
        print("MQTT broker not available. Retrying in 3s...")
        time.sleep(3)
client.subscribe(SENSOR_TOPIC)

threading.Thread(target=health_monitor, daemon=True).start()
threading.Thread(target=system_monitor, daemon=True).start()

print("✅ FOGNET-X Fog Core Running...")
print("Fog using DB:", DB_NAME)
client.loop_forever()
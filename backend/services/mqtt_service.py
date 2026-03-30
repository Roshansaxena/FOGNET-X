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
from core.decision_engine import DecisionEngine, DeviceContext
from core.orchestrator import Orchestrator
from core.orchestration_config import OrchestrationConfig
from concurrent.futures import ThreadPoolExecutor
from collections import deque

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

# init_db()

BROKER = "mqtt"
PORT = 1883

SENSOR_TOPIC = "fognetx/sensors"
FACTORY_SENSOR_TOPIC = "factory/sensor/data"
HEARTBEAT_TOPIC = "factory/status/heartbeat"

ACTUATOR_TOPIC = "fognetx/actuator"
FACTORY_FAN_TOPIC = "factory/actuator/fan"
FACTORY_VENT_TOPIC = "factory/actuator/vent"


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
            "http://fognetx-backend:8000/cloud/process",
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

def extract_device_context(data: dict, device_id: str) -> DeviceContext:
    """Extract device context from sensor data payload."""
    return DeviceContext(
        device_id=device_id,
        battery_level=data.get('battery', data.get('battery_level', 100.0)),
        signal_strength=data.get('rssi', data.get('signal_strength', -70.0)),
        cpu_usage=data.get('device_cpu', data.get('cpu', 50.0)),
        memory_usage=data.get('device_memory', data.get('memory', 50.0)),
        network_latency=data.get('network_latency', 50.0),
        packet_loss=data.get('packet_loss', 0.0),
        uptime=data.get('uptime', 0),
        capabilities=data.get('capabilities', ['temperature', 'gas'])
    )


def on_message(client, userdata, msg):
    try:
        # Check topic to handle heartbeat specifically
        if msg.topic == HEARTBEAT_TOPIC:
            registry.update_heartbeat("arduino_node_1")
            return

        data = json.loads(msg.payload.decode())
        device_id = data.get("device_id", "arduino_node_1") # Fallback for Arduino
        data["temperature"] = data.get("temperature", data.get("temp", 0)) # Normalize temp

        # ------------------------------
        # DECISION TIMING
        # ------------------------------

        decision_start = time.perf_counter()

        registry.register_device(device_id)
        registry.update_heartbeat(device_id)
        context_model.update(device_id, data)

        # Extract device context for enhanced decision making
        device_context = extract_device_context(data, device_id)
        
        # Use enhanced decision engine with context
        severity, risk, analysis = decision_engine.evaluate(data, device_context)
        
        # Get allocation recommendation
        allocation_rec = decision_engine.get_allocation_recommendation(risk, analysis, device_context)
        
        # Use orchestrator with enhanced context
        allocation = orchestrator.allocate_task(device_id, severity, risk, device_context, allocation_rec)

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

        # Prepare extra data (all sensors not in primary columns)
        extra_data_copy = data.copy()
        primary_fields = ["device_id", "temperature", "temp", "gas", "humidity", 
                         "pressure", "light_lux", "motion", "sound_db", "vibration",
                         "air_quality_index", "tank_level", "flow_rate", 
                         "power_consumption", "voltage", "current", "battery",
                         "rssi", "device_cpu", "device_memory", "network_latency",
                         "packet_loss", "uptime"]
        for k in primary_fields:
            extra_data_copy.pop(k, None)

        event_id = log_event(
            device_id=device_id,
            temp=data.get("temperature", 0),
            gas=data.get("gas", 0),
            severity=severity,
            risk=risk,
            allocation=allocation,
            fog_latency=fog_latency,
            cloud_latency=None,
            bandwidth_bytes=0,
            sla_violation=sla_violation,
            extra_data=json.dumps(extra_data_copy),
            # Extended sensor fields
            humidity=data.get("humidity"),
            pressure=data.get("pressure"),
            light_lux=data.get("light_lux"),
            motion=data.get("motion"),
            sound_db=data.get("sound_db"),
            vibration=data.get("vibration"),
            air_quality_index=data.get("air_quality_index"),
            tank_level=data.get("tank_level"),
            flow_rate=data.get("flow_rate"),
            power_consumption=data.get("power_consumption"),
            voltage=data.get("voltage"),
            current_amp=data.get("current"),
            device_battery=data.get("battery"),
            signal_strength=data.get("rssi"),
            device_cpu=data.get("device_cpu"),
            device_memory=data.get("device_memory"),
            network_latency=data.get("network_latency"),
            packet_loss=data.get("packet_loss")
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

        if severity == "CRITICAL" or severity == "WARNING":

            actuator_payload = {
                "device_id": device_id,
                "action": "CLOSE_VALVE"
            }

            client.publish(ACTUATOR_TOPIC, json.dumps(actuator_payload))
            
            # Send commands to Arduino Actuators
            client.publish(FACTORY_FAN_TOPIC, "ON")
            client.publish(FACTORY_VENT_TOPIC, "OPEN")
            print(f"⚠️ Actuator Triggered: FAN ON, VENT OPEN for {device_id}")

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

                        # Prepare extra sensor data for alerts
                        extra_data = {
                            "humidity": data.get("humidity"),
                            "pressure": data.get("pressure"),
                            "battery": data.get("battery"),
                            "signal_strength": data.get("rssi"),
                            "power_consumption": data.get("power_consumption"),
                            "tank_level": data.get("tank_level"),
                            "flow_rate": data.get("flow_rate"),
                            "sound_db": data.get("sound_db"),
                            "vibration": data.get("vibration"),
                            "air_quality_index": data.get("air_quality_index")
                        }

                        alert_executor.submit(
                            send_email_alert,
                            device_id,
                            risk,
                            data.get("temperature"),
                            data.get("gas"),
                            extra_data
                        )

                    # Reset window after triggering
                    critical_events.clear()

            # Prepare extra data for Telegram
            telegram_extra_data = {
                "humidity": data.get("humidity"),
                "pressure": data.get("pressure"),
                "battery": data.get("battery"),
                "tank_level": data.get("tank_level"),
                "power_consumption": data.get("power_consumption")
            }

            threading.Thread(
                target=send_telegram_alert,
                args=(device_id, risk,
                      data.get("temperature"),
                      data.get("gas"),
                      telegram_extra_data),
                daemon=True
            ).start()

        else:
            # NORMAL conditions - Turn off actuators
            client.publish(FACTORY_FAN_TOPIC, "OFF")
            client.publish(FACTORY_VENT_TOPIC, "CLOSE")

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
# MQTT CLIENT SETUP (FINAL STABLE VERSION)
# =====================================================

def on_connect(client, userdata, flags, rc):
    print(f"MQTT callback triggered, rc={rc}")

    if rc == 0:
        print("✅ Connected to MQTT broker")
        client.subscribe([(SENSOR_TOPIC, 0), (FACTORY_SENSOR_TOPIC, 0), (HEARTBEAT_TOPIC, 0)])
        print(f"📡 Subscribed to sensors and factory topics")
    else:
        print("❌ Failed to connect, return code:", rc)


client = mqtt.Client(protocol=mqtt.MQTTv311)
client.on_connect = on_connect
client.on_message = on_message

print(f"Connecting to broker: {BROKER}:{PORT}")

client.connect(BROKER, PORT, 60)

threading.Thread(target=health_monitor, daemon=True).start()
threading.Thread(target=system_monitor, daemon=True).start()

print("✅ FOGNET-X Fog Core Running...")
print("Fog using DB:", DB_NAME)

client.loop_forever()
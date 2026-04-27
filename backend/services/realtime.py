socketio = None
import time

def init_socketio(sio):
    global socketio
    socketio = sio

def emit_decision(device_id, allocation, risk):
    if socketio:
        socketio.emit("decision_event", {
            "device_id": device_id,
            "allocation": allocation,
            "risk": risk
        })

def emit_metrics(payload):
    if socketio:
        print("Emitting metrics_event")
        socketio.emit("metrics_event", payload)

def emit_sensor_data(data):
    """Emit real-time sensor data to all connected clients"""
    if socketio:
        # Normalize field names to match frontend expectations
        socketio.emit("sensor_data", {
            "device_id": data.get("device_id"),
            "temperature": data.get("temperature", data.get("temp")),
            "humidity": data.get("humidity"),
            "gas": data.get("gas"),
            "pressure": data.get("pressure"),
            "motion": data.get("motion"),
            "tank_level": data.get("tank_level", data.get("tank_dist")),
            "power_consumption": data.get("power_consumption"),
            "network_latency": data.get("network_latency"),
            "timestamp": time.time(),
            "severity": data.get("severity", "NORMAL")
        })
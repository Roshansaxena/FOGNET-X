# 📡 FOGNET-X MQTT Topic Reference

Complete list of MQTT topics for ESP devices, sensors, actuators, and threshold configuration.

---

## 📤 Device → Fog (Publish Topics)

### Sensor Data
**Topic:** `factory/sensor/data`  
**Direction:** Device → Fog  
**Payload Format:** JSON

```json
{
  "device_id": "arduino_factory_01",
  "temperature": 28.5,
  "humidity": 62.0,
  "gas": 245,
  "motion": 0,
  "tank_level": 15.2,
  "pressure": 1013.25,
  "fan_status": 0,
  "vent_position": 0,
  "rssi": -65,
  "uptime": 3600
}
```

**Field Descriptions:**
- `device_id`: Unique device identifier (REQUIRED)
- `temperature`: Temperature in Celsius
- `humidity`: Relative humidity percentage
- `gas`: MQ-2 gas sensor reading (PPM)
- `motion`: PIR motion detected (0 or 1)
- `tank_level`: Tank level/distance in cm
- `pressure`: Atmospheric pressure in hPa
- `fan_status`: Current fan state (0=OFF, 1=ON)
- `vent_position`: Servo angle (0=closed, 90=open)
- `rssi`: WiFi signal strength (dBm)
- `uptime`: Seconds since boot

---

### Heartbeat
**Topic:** `factory/status/heartbeat`  
**Direction:** Device → Fog  
**Payload:** String `"alive"`

**Purpose:** 
- Keeps device marked as "online"
- Triggers auto-registration
- Monitors device health

**Frequency:** Every 2 seconds (with sensor data)

---

## 📥 Fog → Device (Subscribe Topics)

### Fan Control
**Topic:** `factory/actuator/fan`  
**Direction:** Fog → Device  
**Payload:** `"ON"` or `"OFF"`

**Example:**
```bash
mosquitto_pub -h localhost -t "factory/actuator/fan" -m "ON"
```

**Device Response:**
- Relay turns ON (LOW signal) when payload is "ON"
- Relay turns OFF (HIGH signal) when payload is "OFF"

---

### Vent Control
**Topic:** `factory/actuator/vent`  
**Direction:** Fog → Device  
**Payload:** `"OPEN"` or `"CLOSE"`

**Example:**
```bash
mosquitto_pub -h localhost -t "factory/actuator/vent" -m "OPEN"
```

**Device Response:**
- Servo moves to 90° when payload is "OPEN"
- Servo moves to 0° when payload is "CLOSE"

---

### Pump Control
**Topic:** `factory/actuator/pump`  
**Direction:** Fog → Device  
**Payload:** `"ON"` or `"OFF"`

**Example:**
```bash
mosquitto_pub -h localhost -t "factory/actuator/pump" -m "ON"
```

---

### Alarm Control
**Topic:** `factory/actuator/alarm`  
**Direction:** Fog → Device  
**Payload:** `"ON"` or `"OFF"`

**Example:**
```bash
mosquitto_pub -h localhost -t "factory/actuator/alarm" -m "ON"
```

---

### Mode Selection
**Topic:** `factory/actuator/mode`  
**Direction:** Fog → Device  
**Payload:** `"AUTO"` or `"MANUAL"`

**Example:**
```bash
mosquitto_pub -h localhost -t "factory/actuator/mode" -m "MANUAL"
```

**Behavior:**
- **AUTO**: Device runs automatic safety logic
- **MANUAL**: Device only responds to remote commands

---

### All Actuators (Wildcard)
**Topic:** `factory/actuator/#`  
**Direction:** Fog → Device  
**Purpose:** Subscribe to all actuator commands

**Usage in Code:**
```cpp
client.subscribe("factory/actuator/#");
```

---

## ⚙️ Threshold Configuration (NEW!)

### Update Device Thresholds
**Topic:** `factory/config/{device_id}/thresholds`  
**Direction:** Fog → Device  
**Payload:** JSON

**Example Payload:**
```json
{
  "device_id": "esp8266_01",
  "command": "UPDATE_THRESHOLDS",
  "thresholds": {
    "temp_warning": 35.0,
    "temp_critical": 45.0,
    "temp_emergency": 55.0,
    "gas_warning": 400.0,
    "gas_critical": 700.0,
    "gas_emergency": 900.0,
    "humidity_warning": 80.0,
    "humidity_critical": 90.0,
    "tank_min": 10.0,
    "tank_max": 100.0,
    "pressure_warning": 1050.0,
    "pressure_critical": 1100.0,
    "timestamp": 1234567890.123
  }
}
```

**Usage:**
- Sent automatically when user saves thresholds from dashboard
- Device should parse JSON and update local threshold variables
- Enables software-based threshold management (no hardcoded values!)

**Arduino Example:**
```cpp
void callback(char* topic, byte* payload, unsigned int length) {
  String topicStr = String(topic);
  
  if (topicStr.endsWith("/thresholds")) {
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload, length);
    
    if (doc["command"] == "UPDATE_THRESHOLDS") {
      temp_warning = doc["thresholds"]["temp_warning"];
      temp_critical = doc["thresholds"]["temp_critical"];
      // ... update other thresholds
      Serial.println("Thresholds updated from dashboard!");
    }
  }
}
```

---

## 🔁 Bidirectional Topics

### Actuator Acknowledgment
**Topic:** `factory/actuator/ack`  
**Direction:** Device → Fog  
**Payload:** `"OK:<topic>"`

**Example:**
```
OK:factory/actuator/fan
```

**Purpose:** Confirms command execution

---

## 🏗 Topic Hierarchy

```
factory/
├── sensor/
│   └── data              (Device → Fog: Sensor readings)
├── status/
│   └── heartbeat         (Device → Fog: Keep-alive)
└── actuator/
    ├── fan               (Fog → Device: Fan control)
    ├── vent              (Fog → Device: Vent control)
    ├── mode              (Fog → Device: Auto/Manual)
    └── ack               (Device → Fog: Command acknowledgment)
```

---

## 💡 Usage Examples

### Subscribe to All Topics (Debugging)
```bash
mosquitto_sub -h localhost -v -t "factory/#"
```

### Monitor Sensor Data Only
```bash
mosquitto_sub -h localhost -t "factory/sensor/data"
```

### Send Test Command
```bash
# Turn on fan
mosquitto_pub -h localhost -t "factory/actuator/fan" -m "ON"

# Verify acknowledgment
mosquitto_sub -h localhost -t "factory/actuator/ack"
```

### Python Example (Publish Sensor Data)
```python
import paho.mqtt.client as mqtt
import json

client = mqtt.Client()
client.connect("localhost", 1883)

payload = {
    "device_id": "test_device",
    "temp": 25.5,
    "humidity": 60.0,
    "gas": 300
}

client.publish("factory/sensor/data", json.dumps(payload))
client.disconnect()
```

### Arduino Example (Subscribe to Commands)
```cpp
void callback(char* topic, byte* payload, unsigned int length) {
  String topicStr = String(topic);
  String message;
  
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  if (topicStr == "factory/actuator/fan") {
    if (message == "ON") {
      digitalWrite(RELAY_PIN, LOW);
    }
  }
}

// In setup():
client.subscribe("factory/actuator/#");
```

---

## 🔐 QoS Levels

All topics use **QoS 0** (At most once delivery)

```cpp
// Subscribe with QoS 0
client.subscribe("factory/actuator/#", 0);

// Publish with QoS 0
client.publish("factory/sensor/data", payload.c_str(), false);
```

For critical alerts, you can use QoS 1:
```cpp
client.publish("factory/alert/critical", payload.c_str(), true);
```

---

## ⚙️ Payload Validation

### Required Fields (Sensor Data)
```json
{
  "device_id": "string (REQUIRED)",
  "temp": "number",
  "gas": "number"
}
```

Minimum valid payload:
```json
{"device_id":"my_device","temp":25,"gas":300}
```

### Optional Fields
All other fields are optional but recommended for full functionality:
- humidity
- motion
- tank_dist
- fan_status
- vent_position
- rssi
- uptime

---

## 🎯 Best Practices

1. **Always include device_id** in sensor data payloads
2. **Send heartbeat regularly** to maintain online status
3. **Use meaningful device IDs** (e.g., "temp_sensor_A1" not "device123")
4. **Keep payloads small** (< 500 bytes) for faster transmission
5. **Handle connection losses** gracefully with reconnection logic
6. **Log all received commands** for debugging
7. **Acknowledge actuator commands** with `factory/actuator/ack`

---

## 🔍 Debugging Commands

### View Active Subscriptions
```bash
# See what devices are subscribed to
docker exec -it fognetx-mqtt mosquitto_sub -v -t '#'
```

### Check Message Flow
```bash
# Watch all traffic in real-time
mosquitto_sub -h localhost -v -t 'factory/#'
```

### Simulate Device
```bash
# Send fake sensor data
mosquitto_pub -h localhost \
  -t "factory/sensor/data" \
  -m '{"device_id":"sim_01","temp":30.5,"gas":450}'
```

---

**Quick Reference Summary:**

| Topic | Direction | Purpose |
|-------|-----------|---------|
| `factory/sensor/data` | Device → Fog | Sensor readings |
| `factory/status/heartbeat` | Device → Fog | Keep device online |
| `factory/actuator/fan` | Fog → Device | Fan ON/OFF |
| `factory/actuator/vent` | Fog → Device | Vent OPEN/CLOSE |
| `factory/actuator/mode` | Fog → Device | AUTO/MANUAL switch |
| `factory/actuator/#` | Both | All actuator commands |
| `factory/actuator/ack` | Device → Fog | Command confirmation |

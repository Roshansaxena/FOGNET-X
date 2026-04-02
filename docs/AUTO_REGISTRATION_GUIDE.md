# 🤖 FOGNET-X Auto-Registration Guide

## Zero Configuration Device Registration

The system now supports **automatic device registration** - no manual setup required!

---

## How It Works

### 1️⃣ **Device Connects to MQTT Broker**
- ESP8266 connects to WiFi and MQTT broker
- Publishes sensor data to `factory/sensor/data` topic
- OR sends heartbeat to `factory/status/heartbeat`

### 2️⃣ **Fog Node Auto-Registers**
- Fog service receives MQTT message
- Checks if device exists in database
- If new → creates device record automatically
- If exists → updates status to "online" and refreshes heartbeat

### 3️⃣ **Dashboard Shows Device**
- Device appears in devices list
- Real-time sensor data displayed
- Charts update automatically

---

## Quick Start Options

### Option A: Test with Python Simulator (Recommended for Testing)

```bash
# Terminal 1: Start Docker containers
docker-compose up -d

# Terminal 2: Run device simulator
python test_mqtt_device.py
```

**What happens:**
- ✅ Simulator connects to MQTT broker
- ✅ Device auto-registers in database
- ✅ Sensor data published every 2 seconds
- ✅ Dashboard shows live data at http://localhost:8000/dashboard

### Option B: Use ESP8266/Arduino

Upload this code to your ESP8266:

```cpp
const char* DEVICE_ID = "arduino_factory_01"; // Important: Must match!

// In loop(), publish with device_id in JSON:
String payload = "{";
payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
payload += "\"temp\":" + String(t) + ",";
// ... rest of sensor data
payload += "}";
client.publish("factory/sensor/data", payload.c_str());
```

Then just power on the device - it will auto-register!

---

## Verification

### Check Registered Devices
```bash
python check_devices.py
```

### View Device in Database (Docker)
```bash
docker exec -it fognetx-backend sqlite3 /data/fognetx.db "SELECT * FROM devices;"
```

### Monitor Fog Logs
```bash
docker logs -f fognetx-fogcore
```

Look for: `✅ Auto-registered device: arduino_factory_01`

---

## Key Features

### ✨ **Automatic Registration**
- No manual API calls needed
- No form filling
- Just connect and publish

### ✨ **Heartbeat Support**
- Device registers even with just heartbeat messages
- Status updates to "online" automatically

### ✨ **Error Handling**
- Graceful error handling
- Won't crash on database issues
- Logs registration attempts

### ✨ **Status Tracking**
- Online/Offline detection
- Last seen timestamp
- Battery and signal strength monitoring

---

## Troubleshooting

### Device not registering?

**Check these:**

1. **MQTT Connection**
   ```bash
   # Can you reach the broker?
   telnet <broker-ip> 1883
   ```

2. **Device ID in Payload**
   - Must include `"device_id":"arduino_factory_01"` in JSON
   - Case-sensitive!

3. **Fog Service Running**
   ```bash
   docker ps | grep fogcore
   ```

4. **Database Exists**
   ```bash
   docker exec fognetx-backend ls -la /data/
   ```

### Still not working?

**Reset everything:**
```bash
# Stop all containers
docker-compose down

# Remove old database
docker volume rm fognetx_sqlite_data

# Start fresh
docker-compose up -d

# Test with simulator
python test_mqtt_device.py
```

---

## Example Output

When device connects successfully:

```
🧠 FOGNET-X Fog Core Booting...
Connecting to broker: mqtt:1883
✅ Connected to MQTT broker
📡 Subscribed to sensors and factory topics
✅ Auto-registered device: arduino_factory_01
Temp: 28.5 | Gas: 245 | Tank: 15.2
```

Dashboard shows:
- Temperature: 28.5°C
- Gas Level: 245
- Risk Score: Low
- Allocation: FOG_EXECUTION
- Device Status: Online

---

## Architecture

```
ESP8266 Device
    ↓ (MQTT: factory/sensor/data)
Eclipse Mosquitto Broker
    ↓ (Subscribe)
FOGNET-X Fog Core (mqtt_service.py)
    ↓ (Auto-register in SQLite)
Devices Table
    ↓ (Query)
Dashboard API
    ↓ (Display)
Web Dashboard
```

---

## Next Steps

After device is registered:
1. View live dashboard at http://localhost:8000/dashboard
2. Check device health in API: `/api/devices/{device_id}/health`
3. Configure alerts and automation rules
4. Deploy to production with real sensors!

---

**That's it! Zero hustle, just connect and go! 🚀**

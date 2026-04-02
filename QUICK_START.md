# 🚀 FOGNET-X Quick Start Guide

## Get Your ESP8266 Node Running in 5 Minutes!

---

## ⚡ Ultra-Fast Setup

### Step 1: Hardware Assembly (2 minutes)

Connect these components to your ESP8266:

```
ESP8266 → Components
-------   ----------
D2    →   DHT11 DATA pin
A0    →   MQ-2 Gas OUT
D5    →   PIR OUT
D6    →   Ultrasonic TRIG
D7    →   Ultrasonic ECHO
D1    →   Relay IN
D4    →   Servo Signal
3.3V  →   VCC (all sensors)
GND   →   GND (all components)
```

### Step 2: Software Configuration (1 minute)

1. Open `firmware/esp8266_factory_node.ino` in Arduino IDE
2. Update WiFi credentials:
   ```cpp
   const char* ssid = "YOUR_WIFI";
   const char* password = "YOUR_PASSWORD";
   const char* mqtt_server = "10.136.75.54";  // Your fog node IP
   ```

### Step 3: Upload & Run (2 minutes)

1. Upload code to ESP8266 (Ctrl+U)
2. Open Serial Monitor (115200 baud)
3. Watch it connect automatically!

**That's it!** No manual registration needed! ✅

---

## 📊 Verify It Works

### Check Serial Monitor:
```
✅ WiFi Connected!
✅ Connected to FOGNET-X!
📡 Subscribed to: factory/actuator/#
✅ Data published successfully
```

### Check Fog Logs:
```bash
docker logs -f fognetx-fogcore
```

Look for:
```
✅ Auto-registered device: arduino_factory_01
Temp: 28.5 | Gas: 245 | Tank: 15.2
```

### Open Dashboard:
http://localhost:8000/dashboard

You should see live data updating every 2 seconds!

---

## 🎮 Test Actuators

From command line:

```bash
# Turn on fan
mosquitto_pub -h localhost -t "factory/actuator/fan" -m "ON"

# Open vent
mosquitto_pub -h localhost -t "factory/actuator/vent" -m "OPEN"

# You should hear relay click and servo move!
```

---

## 📁 Project Structure

```
FOGNET-X/
├── firmware/
│   └── esp8266_factory_node.ino    ← Upload this to ESP8266
├── backend/
│   └── services/
│       └── mqtt_service.py          ← Fog auto-registration logic
├── test_mqtt_device.py              ← Python simulator
├── check_devices.py                 ← View registered devices
├── DEPLOYMENT_GUIDE.md              ← Detailed deployment guide
├── MQTT_TOPICS_REFERENCE.md         ← All MQTT topics explained
└── QUICK_START.md                   ← This file
```

---

## 🔧 Troubleshooting

### Not Connecting to WiFi?
- Check SSID/password (case-sensitive!)
- ESP8266 only supports 2.4GHz WiFi
- Move closer to router

### Not Registering?
- Check fog node IP is correct
- Verify Docker is running: `docker ps`
- Check firewall allows port 1883

### Sensors Not Reading?
- DHT11: Add 10k resistor between VCC and DATA
- MQ-2: Needs 24-48 hour warm-up for accuracy
- Ultrasonic: Check TRIG (D6) and ECHO (D7) wiring

---

## 📖 More Documentation

- **Complete Deployment**: [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md)
- **MQTT Topics**: [`MQTT_TOPICS_REFERENCE.md`](MQTT_TOPICS_REFERENCE.md)
- **Auto-Registration**: [`AUTO_REGISTRATION_GUIDE.md`](AUTO_REGISTRATION_GUIDE.md)

---

## 🎯 What Happens Automatically

1. ✅ Device connects to WiFi
2. ✅ Device connects to MQTT broker
3. ✅ Fog service detects new device
4. ✅ Device auto-registers in database
5. ✅ Sensor data starts flowing
6. ✅ Dashboard shows live updates
7. ✅ Actuators respond to commands

**Zero manual setup required!** Just power it up and go! 🚀

---

## 💡 Pro Tips

### Multiple Devices:
Change DEVICE_ID for each node:
```cpp
// Node 1
const char* DEVICE_ID = "temp_station_01";

// Node 2
const char* DEVICE_ID = "gas_monitor_01";

// Node 3
const char* DEVICE_ID = "tank_monitor_01";
```

Each will auto-register separately!

### Monitor All Devices:
```bash
python check_devices.py
```

Shows all registered devices and their status.

---

## 🎉 Success Checklist

- [ ] ESP8266 programmed with firmware
- [ ] Sensors connected correctly
- [ ] WiFi credentials configured
- [ ] Fog node IP set
- [ ] Serial shows successful connection
- [ ] Dashboard displays sensor data
- [ ] Actuators respond to commands

**All checked?** Congratulations! Your industrial IoT node is production-ready! 🏆

---

**Questions?** Check the detailed guides or run the Python simulator:
```bash
python test_mqtt_device.py
```

This simulates an ESP8266 without needing hardware!

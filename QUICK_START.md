# 🚀 FOGNET-X Quick Start Guide

## Get Started with FOGNET-X in Minutes!

---

## ⚡ Quick Setup (Backend + Frontend)

### Step 1: Start Backend (1 minute)

```bash
cd backend
python cloud_server.py
```

Backend will start on **http://localhost:8000**

### Step 2: Start Frontend (1 minute)

```bash
cd frontend
npm run dev
```

Frontend will start on **http://localhost:3000**

### Step 3: Access Dashboard

Open **http://localhost:3000** and login:
- **Username:** admin
- **Password:** admin123

---

## 🎯 Key Features

### 1. **Real-time Dashboard**
- Live sensor data via WebSockets
- Device filtering
- Latency tracking

### 2. **Orchestration**
- Fog/Cloud decision engine
- SLA monitoring
- Risk-based allocation

---

## 🔌 Connect ESP Devices

### Option A: With Hardware (ESP8266/ESP32)

1. **Flash firmware:**
   ```
   Open firmware/esp8266_complete_node.ino in Arduino IDE
   Update WiFi credentials
   Upload to device
   ```

2. **Device auto-registers** when it connects to MQTT

3. **View in dashboard:** Go to `/devices`

### Option B: Without Hardware (Simulator)

```bash
cd scripts/archive
python simulate_devices.py
```

This simulates multiple IoT devices sending sensor data.

---

## 📊 Verify It Works

### Check Serial Monitor:
```
✅ WiFi Connected!
✅ Connected to FOGNET-X!
📡 Subscribed to: factory/actuator/#
✅ Data published successfully
```

### Check Backend Logs:
```bash
# Backend terminal should show:
✅ FOGNET-X Fog Core Booting...
📡 Subscribed to sensors and factory topics
✅ FOGNET-X Fog Core Running...
```

### Open Dashboard:
http://localhost:3000

You should see:
- Device list in Overview
- Real-time sensor data updating

---

## 📁 Project Structure

```
FOGNET-X/
├── backend/                    # Python Flask backend
│   ├── cloud_server.py        # ⭐ Main application
│   ├── routes/                # API endpoints
│   ├── services/              # Business logic
│   └── migrations/            # Database migrations
├── frontend/                   # React frontend
│   └── src/pages/             # Dashboard pages
│       ├── DeviceControl.jsx  # Threshold & actuator UI
│       └── Overview.jsx       # Main dashboard
├── firmware/                   # Arduino firmware
│   └── esp8266_*.ino          # ESP device code
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
├── dotnet/                     # .NET applications
└── docker-compose.yml          # Docker setup
```

**Full reference:** [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

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

- **Project Structure**: [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md)
- **Deployment Guide**: [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md)
- **MQTT Topics**: [`MQTT_TOPICS_REFERENCE.md`](MQTT_TOPICS_REFERENCE.md)

---

## 🎯 What Happens Automatically

1. ✅ Device connects to WiFi
2. ✅ Device connects to MQTT broker
3. ✅ Fog service detects new device
4. ✅ Device auto-registers in database
5. ✅ Sensor data starts flowing
6. ✅ Dashboard shows live updates
7. ✅ Actuators respond to MQTT commands

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
# From dashboard - go to Devices page
# Or use API:
curl http://localhost:8000/api/devices
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
- [ ] Actuators respond to MQTT commands

**All checked?** Congratulations! Your industrial IoT node is production-ready! 🏆

---

**Questions?** Check the detailed guides or run the Python simulator:
```bash
cd scripts/archive
python simulate_devices.py
```

This simulates IoT devices without needing hardware!

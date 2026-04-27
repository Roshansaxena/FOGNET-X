# 🎮 Wokwi ESP32 Simulator - Complete Setup Guide

## Simulate FOGNET-X IoT Node Without Hardware!

---

## 🚀 Quick Start (5 Minutes!)

### **Option 1: Online MQTT Simulation** (Connects to real fog node)

#### **Step 1: Open Wokwi**
- Go to: https://wokwi.com/esp32
- Click "New Project" → Choose ESP32

#### **Step 2: Add Components**
Click "Add Component" and add:
```
✅ DHT22 Temperature Sensor
✅ Potentiometer (simulates gas sensor)
✅ PIR Motion Sensor  
✅ LED (any color) x2
✅ Pushbutton
```

#### **Step 3: Wire Components**

**Quick Wiring:**
```
DHT22:
  + → 3.3V
  - → GND
  S → GPIO 23

Potentiometer:
  + → 3.3V
  - → GND
  ~ → GPIO 34

PIR Sensor:
  + → 3.3V
  - → GND
  S → GPIO 27

Green LED:
  Long leg (+) → GPIO 0 (via 220Ω resistor)
  Short leg (-) → GND

Red LED:
  Long leg (+) → GPIO 17 (via 220Ω resistor)
  Short leg (-) → GND

Pushbutton:
  Pin 1 → GPIO 27 + 10k resistor to GND
  Pin 2 → 3.3V
```

#### **Step 4: Copy Code**

1. In Wokwi, click `sketch.ino` tab
2. Delete existing code
3. Copy from: `wokwi_simulator.ino`
4. Update WiFi credentials:

```cpp
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_PASSWORD";
const char* mqtt_server = "10.136.75.54";  // Your fog IP
```

#### **Step 5: Run!**
- Click green ▶️ Play button
- Open Serial Monitor (bottom panel)
- Watch data publish!

---

### **Option 2: Offline Simulation** (No WiFi needed!)

Perfect for testing logic without connecting to fog node.

#### **Steps:**
1. Follow steps above
2. Use `wokwi_offline_sim.ino` instead
3. No WiFi/MQTT configuration needed!
4. See sensor readings in Serial Monitor

---

## 🎛️ Interactive Controls

### **In Wokwi Simulator:**

#### **1. Potentiometer (Gas Sensor)**
- Click the potentiometer component
- Rotate the knob by clicking arrows
- **Effect:** Gas ppm changes (0-1000)
- **Watch:** When gas > 400 → Red LED turns on!

#### **2. Pushbutton (Motion Sensor)**
- Click the button to press/release
- **Effect:** Triggers motion detection
- **Watch:** Serial shows "Motion: DETECTED"

#### **3. DHT22 (Temperature)**
- Automatically reads ambient temp
- Wokwi simulates realistic variations
- **Watch:** Temp fluctuates slightly

---

## 📊 What You'll See

### **Serial Monitor Output:**
```
========================================
🏭 FOGNET-X Wokwi Simulator
========================================
Device ID: wokwi_sim_01
📶 Connecting to WiFi: YOUR_NETWORK
✅ WiFi Connected!
IP: 192.168.1.100
✨ Simulator ready!
========================================

🔌 Attempting MQTT connection...✅ Connected!
📡 Subscribed to factory/actuator/#

--- Sensor Readings ---
🌡 Temperature: 28.5°C
💧 Humidity: 62.0%
💨 Gas: 245 ppm
🔔 Motion: None
✅ Published: {"device_id":"wokwi_sim_01",...}
======================
```

### **When You Turn Potentiometer:**
```
--- Sensor Readings ---
🌡 Temperature: 28.5°C
💧 Humidity: 62.0%
💨 Gas: 450 ppm  ← Increased!
🔔 Motion: None

🚨 ALERT TRIGGERED!
⚠️ Automatic Response:
   - FAN ON
   - VENT OPEN
✅ Published to MQTT
======================
```

### **On Dashboard:**
Open http://localhost:8000/dashboard

You'll see:
- Device: `wokwi_sim_01`
- Temperature graph updating
- Gas level changing as you adjust potentiometer
- Motion events when button clicked

---

## 🔧 Troubleshooting

### **"WiFi Failed"**
- Check SSID/password (case-sensitive!)
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Move closer to router or use USB extension

### **"MQTT Connection Failed"**
- Verify fog node IP is correct
- Check Docker is running: `docker ps`
- Test connectivity: `telnet 10.136.75.54 1883`

### **"DHT Read Failed"**
- Check wiring (DATA → GPIO 23)
- Add 10k pull-up resistor between VCC and DATA
- Try DHT11 instead of DHT22 (update code: `#define DHTTYPE DHT11`)

### **Components Not Responding**
- Refresh browser page
- Check all connections match diagram
- Ensure common ground (GND connected to all components)

---

## 🎯 Advanced Testing

### **Test Alert Thresholds:**

1. **Gas Alert:**
   - Turn potentiometer clockwise
   - Gas increases
   - At 400+ ppm → Red LED turns on!

2. **Temperature Alert:**
   - Can't change actual temp in simulation
   - But you can modify code to test:
   ```cpp
   // Force high temperature for testing
   float temp = 45.0;  // Override with high value
   ```

3. **Motion Detection:**
   - Click pushbutton
   - Serial shows "Motion: DETECTED"
   - Dashboard updates instantly

---

## 📱 Mobile Testing

Wokwi works on mobile browsers too!

1. Open https://wokwi.com/esp32 on phone
2. Build circuit
3. Upload code
4. Tap components to interact
5. Watch Serial Monitor on phone screen!

---

## 💡 Pro Tips

### **1. Save Your Project**
- Click "Save" in Wokwi
- Get shareable URL
- Access from anywhere
- Show team members!

### **2. Multiple Simulators**
Create multiple projects:
- `wokwi_sim_01` - Factory floor sensor
- `wokwi_sim_02` - Warehouse monitor  
- `wokwi_sim_03` - Tank level station

Each will auto-register separately on dashboard!

### **3. Share Projects**
```
https://wokwi.com/projects/YOUR_PROJECT_ID
```
Share with team for collaboration!

### **4. Test Edge Cases**
```cpp
// Force extreme values for testing
if (digitalRead(TEST_BUTTON)) {
  gas = 900;  // Emergency gas level!
  temp = 55.0;  // Critical temperature!
}
```

---

## 🎓 Learning Path

### **Beginner:**
1. Start with offline simulator
2. Learn sensor reading basics
3. Understand thresholds
4. Test safety logic

### **Intermediate:**
1. Connect to real MQTT broker
2. Test actuator responses
3. Monitor on dashboard
4. Debug issues

### **Advanced:**
1. Create multiple virtual devices
2. Simulate complex scenarios
3. Test edge cases
4. Validate entire system

---

## 📋 Component List for Wokwi

| Component | Quantity | Purpose |
|-----------|----------|---------|
| ESP32 DevKit | 1 | Main controller |
| DHT22 Sensor | 1 | Temp & Humidity |
| Potentiometer | 1 | Gas sensor simulator |
| PIR Sensor | 1 | Motion detection |
| LED (Green) | 1 | Status indicator |
| LED (Red) | 1 | Alert indicator |
| Pushbutton | 1 | Manual trigger |
| Resistor 220Ω | 2 | For LEDs |
| Resistor 10k | 1 | Pull-down for button |

**Total Cost:** FREE! (Virtual components)

---

## ✅ Success Checklist

- [ ] Wokwi project created
- [ ] All components added
- [ ] Correctly wired per diagram
- [ ] Code uploaded successfully
- [ ] Serial Monitor shows data
- [ ] Potentiometer changes gas value
- [ ] Button triggers motion
- [ ] LEDs respond correctly
- [ ] (Optional) Dashboard shows data
- [ ] (Optional) MQTT commands received

**All checked?** You're simulating like a pro! 🎉

---

## 🚀 Next Steps

After mastering simulation:

1. **Build Real Hardware:**
   - Order components from DEPLOYMENT_GUIDE.md
   - Assemble physical circuit
   - Upload same code!

2. **Deploy Multiple Nodes:**
   - Create 3-4 Wokwi simulators
   - Each with unique DEVICE_ID
   - Watch all on dashboard simultaneously!

3. **Advanced Features:**
   - Add servo motor control
   - Implement deep sleep
   - Test OTA updates
   - Simulate network failures

---

## 📞 Quick Reference

### **Useful Commands:**
```bash
# Check if devices registered
python check_devices.py

# Monitor MQTT traffic
mosquitto_sub -h localhost -v -t 'factory/#'

# Send test command
mosquitto_pub -h localhost -t "factory/actuator/fan" -m "ON"

# View dashboard
http://localhost:8000/dashboard
```

### **Wokwi Shortcuts:**
- **Ctrl+S** - Save project
- **Ctrl+Enter** - Run simulation
- **F1** - Help
- **Right-click component** - Rotate/Delete

---

**🎮 Happy Simulating!**

Start here: https://wokwi.com/esp32  
Code ready: `wokwi_simulator.ino`  
Dashboard: http://localhost:8000/dashboard  

Zero hardware required - just your browser! 🚀

# 🎛️ Device Control - Works with ANY Device!

## ✅ Answer: Device Control Works for ALL Devices

The Device Control page works with **ANY device** that sends data to FOGNET-X:

- ✅ **Arduino (ESP8266/ESP32)** - Physical hardware
- ✅ **Python Simulators** - `simulate_devices.py`
- ✅ **MQTT Test Clients** - Any MQTT publisher
- ✅ **Custom IoT Devices** - Any device using the MQTT protocol
- ✅ **Wokwi Simulators** - Online/offline simulations

---

## 🔧 Issue Fixed: Auto-Registration

### **The Problem:**
Previously, devices only appeared in Device Control if they were manually added to the `device_thresholds` and `actuator_states` database tables. Simulated devices from the Overview page wouldn't show up.

### **The Solution:**
✅ **Auto-registration added!** Now when you access Device Control for any device, it's automatically registered in the database with default thresholds and actuator states.

---

## 📊 How It Works Now

### **Device Flow:**

```
1. Device sends data (sensor readings)
   ↓
2. Device appears in Overview page
   ↓
3. User opens Device Control page
   ↓
4. Backend checks if device exists in threshold/actuator tables
   ↓
5. If NOT exists → Auto-registers with defaults ✅
   ↓
6. Device now appears in Device Control dropdown ✅
   ↓
7. User can configure thresholds & control actuators ✅
```

---

## 🎯 What Changed

### **Backend (`routes/thresholds.py`):**

```python
# BEFORE: Device had to exist
thresholds = conn.execute(
    'SELECT * FROM device_thresholds WHERE device_id = ?',
    (device_id,)
).fetchone()

if not thresholds:
    return jsonify({"error": "Device not found"}), 404  # ❌ Error!

# AFTER: Auto-register if not exists
thresholds = conn.execute(
    'SELECT * FROM device_thresholds WHERE device_id = ?',
    (device_id,)
).fetchone()

if not thresholds:
    # Auto-create with defaults ✅
    conn.execute('''
        INSERT INTO device_thresholds (device_id) VALUES (?)
    ''', (device_id,))
    conn.commit()
```

---

## 🚀 How to Use with Simulated Devices

### **Step 1: Run Simulator**

```bash
cd scripts/archive
python simulate_devices.py
```

This creates simulated devices sending sensor data.

### **Step 2: Check Overview Page**

Go to `http://localhost:3000/overview`

You should see simulated devices listed as "online".

### **Step 3: Open Device Control**

Go to `http://localhost:3000/control`

**Before Fix:** ❌ Dropdown was empty  
**After Fix:** ✅ Simulated devices appear in dropdown!

### **Step 4: Select & Configure**

1. Select simulated device from dropdown
2. Backend auto-registers it (check logs: "📝 Auto-registering device...")
3. Configure thresholds
4. Control actuators (simulated - MQTT messages sent but no physical hardware)

---

## 📋 Device Types Supported

### **1. Physical Arduino Devices**

**Examples:**
- ESP8266 NodeMCU
- ESP32 Development Board
- Arduino with WiFi shield

**Capabilities:**
- ✅ Real sensor readings
- ✅ Real actuator control (fan, vent, pump, alarm)
- ✅ Threshold enforcement on device
- ✅ AUTO/MANUAL mode works

**Setup:** Flash firmware → Connect to WiFi → Auto-registers

---

### **2. Python Simulators**

**Examples:**
- `scripts/archive/simulate_devices.py`
- Custom MQTT publishers

**Capabilities:**
- ✅ Simulated sensor readings
- ✅ MQTT messages sent (no physical action)
- ✅ Threshold configuration works
- ✅ Actuator commands sent (logged but not executed)

**Setup:** Run script → Devices appear → Configure from dashboard

---

### **3. MQTT Test Clients**

**Examples:**
- `mosquitto_pub` command line
- MQTT Explorer GUI
- Custom scripts

**Capabilities:**
- ✅ Manual sensor data publishing
- ✅ Test threshold updates
- ✅ Verify actuator commands

**Example:**
```bash
# Publish sensor data
mosquitto_pub -h localhost -t "factory/sensor/data" \
  -m '{"device_id":"test_device_01","temperature":30,"gas":500}'

# Device now appears in Device Control!
```

---

### **4. Wokwi Simulators**

**Examples:**
- Online Wokwi ESP32/ESP8266 simulation
- Offline Wokwi simulator

**Capabilities:**
- ✅ Virtual hardware simulation
- ✅ Real-time sensor data
- ✅ Actuator visualization
- ✅ Full integration test

**Setup:** Load Wokwi diagram → Run simulation → Connect to MQTT

---

## 🔍 Troubleshooting

### **Device Not Showing in Device Control?**

**Check 1: Is device sending data?**
```bash
# Check backend logs
# Should see: "Temp: 28.5 | Gas: 245 | ..."
```

**Check 2: Is device in Overview?**
- Go to `/overview`
- If device appears there, it should work in Device Control

**Check 3: Try selecting device**
- Go to `/control`
- Select device from dropdown
- Check backend logs for: "📝 Auto-registering device..."

**Check 4: Database check**
```bash
cd backend
python

>>> import sqlite3
>>> conn = sqlite3.connect("fognetx.db")
>>> conn.execute("SELECT device_id FROM device_thresholds").fetchall()
[('simulated_device_01',), ('esp8266_01',)]  # Should show devices
```

---

### **Actuator Commands Not Working?**

**For Physical Devices:**
- ✅ Check wiring
- ✅ Check MQTT connection
- ✅ Check Serial Monitor for command receipt

**For Simulated Devices:**
- ✅ Commands are sent via MQTT
- ✅ Check backend logs: "📤 Actuator command: ..."
- ⚠️ No physical action (no hardware to control!)

---

## 📊 What Gets Auto-Registered

When a device is auto-registered, it gets:

### **Default Thresholds:**
```python
temp_warning = 35.0°C
temp_critical = 45.0°C
temp_emergency = 55.0°C

gas_warning = 400.0 PPM
gas_critical = 700.0 PPM
gas_emergency = 900.0 PPM

humidity_warning = 80.0%
humidity_critical = 90.0%

tank_min = 10.0 cm
tank_max = 100.0 cm

pressure_warning = 1050.0 hPa
pressure_critical = 1100.0 hPa

auto_fan_enabled = True
auto_vent_enabled = True
auto_pump_enabled = True
auto_alarm_enabled = True
```

### **Default Actuator States:**
```python
fan_state = 'OFF'
vent_state = 'CLOSED'
pump_state = 'OFF'
alarm_state = 'OFF'
control_mode = 'AUTO'
```

---

## 🎉 Summary

### **Device Control Works With:**

| Device Type | Sensor Data | Actuator Control | Threshold Config | Auto-Register |
|-------------|-------------|------------------|------------------|---------------|
| ESP8266/ESP32 | ✅ Real | ✅ Real | ✅ Yes | ✅ Yes |
| Python Simulator | ✅ Simulated | ⚠️ MQTT only | ✅ Yes | ✅ Yes |
| MQTT Client | ✅ Manual | ⚠️ MQTT only | ✅ Yes | ✅ Yes |
| Wokwi Simulator | ✅ Virtual | ✅ Visual | ✅ Yes | ✅ Yes |

### **Key Points:**

1. ✅ **Works with ANY device** - Not just Arduino
2. ✅ **Auto-registration** - No manual setup needed
3. ✅ **Threshold configuration** - Works for all devices
4. ✅ **Actuator control** - MQTT commands sent to all devices
5. ✅ **Physical action** - Only for real hardware (not simulators)

---

## 📝 Backend Logs to Watch

When using Device Control, you'll see:

```
# When device is auto-registered:
📝 Auto-registering device simulated_device_01 for threshold control
📝 Auto-registering device simulated_device_01 for actuator control

# When thresholds are saved:
📤 Thresholds sent to simulated_device_01 via factory/config/simulated_device_01/thresholds

# When actuator is controlled:
📤 Actuator command: factory/actuator/fan -> ON
📤 Actuator command: factory/actuator/vent -> OPEN
```

---

## 🚀 Next Steps

1. **Run simulator:** `python scripts/archive/simulate_devices.py`
2. **Open dashboard:** `http://localhost:3000/control`
3. **Select device:** Choose simulated device from dropdown
4. **Configure thresholds:** Set your custom values
5. **Test actuators:** Click ON/OFF buttons
6. **Check logs:** Watch MQTT commands being sent

**Device Control now works with ALL devices!** 🎉

# 🎛️ Software-Based Threshold & Actuator Control - COMPLETE

## ✅ Implementation Summary

A complete **software-based control system** has been built that allows users to configure sensor thresholds and control actuators directly from the FOGNET-X dashboard, **eliminating the need to hardcode values in Arduino firmware**.

---

## 📁 Files Created/Modified

### **Backend (Python/Flask)**

| File | Status | Lines | Purpose |
|------|--------|-------|---------|
| `backend/migrations/005_create_device_thresholds.sql` | ✅ Created | 73 | Database schema |
| `backend/routes/thresholds.py` | ✅ Created | 305 | REST API endpoints |
| `backend/cloud_server.py` | ✏️ Modified | +4 | Registered thresholds blueprint |
| `backend/services/mqtt_service.py` | ✏️ Modified | +75 | MQTT publish functions |
| `backend/run_migration_005.py` | ✅ Created | 70 | Migration runner |

### **Frontend (React)**

| File | Status | Lines | Purpose |
|------|--------|-------|---------|
| `frontend/src/pages/DeviceControl.jsx` | ✅ Created | 550 | Complete UI page |
| `frontend/src/App.jsx` | ✏️ Modified | +2 | Added `/control` route |
| `frontend/src/components/Sidebar.jsx` | ✏️ Modified | +5 | Added navigation link |

---

## 🎯 Features Implemented

### **1. Threshold Configuration (Per Device)**

Users can set custom thresholds for:

- ✅ **Temperature** (Warning, Critical, Emergency) °C
- ✅ **Gas Level** (Warning, Critical, Emergency) PPM
- ✅ **Humidity** (Warning, Critical) %
- ✅ **Tank Level** (Min, Max) cm
- ✅ **Pressure** (Warning, Critical) hPa
- ✅ **Auto-control toggles** (Fan, Vent, Pump, Alarm)

### **2. Actuator Control**

Manual/automatic control of:

- ✅ **Exhaust Fan** (ON/OFF)
- ✅ **Air Vent** (OPEN/CLOSED)
- ✅ **Water Pump** (ON/OFF)
- ✅ **Alarm/Buzzer** (ON/OFF)
- ✅ **Control Mode** (AUTO/MANUAL toggle)

### **3. Real-time MQTT Integration**

- ✅ Thresholds sent to devices via MQTT when saved
- ✅ Actuator commands published instantly
- ✅ QoS 1 for reliable delivery
- ✅ Automatic device acknowledgment

---

## 🔌 API Endpoints

All endpoints are registered in **`cloud_server.py`** (the main application).

### **Threshold Management**

```http
GET    /api/thresholds                         # Get all device thresholds
GET    /api/thresholds/<device_id>              # Get specific device
PUT    /api/thresholds/<device_id>              # Update thresholds
```

### **Actuator Control**

```http
GET    /api/actuators                           # Get all actuator states
GET    /api/actuators/<device_id>               # Get specific device
POST   /api/actuators/<device_id>/control       # Control actuator
POST   /api/actuators/<device_id>/auto-mode     # Toggle AUTO/MANUAL
```

### **Combined**

```http
GET    /api/device-control/<device_id>          # Get thresholds + actuators
```

---

## 📡 MQTT Topics

### **Threshold Configuration**

```
Topic: factory/config/{device_id}/thresholds
QoS: 1
Payload: JSON
{
  "device_id": "esp8266_01",
  "command": "UPDATE_THRESHOLDS",
  "thresholds": {
    "temp_warning": 35,
    "temp_critical": 45,
    "gas_warning": 400,
    "gas_critical": 700
  }
}
```

### **Actuator Commands**

```
factory/actuator/fan      → "ON" or "OFF"
factory/actuator/vent     → "OPEN" or "CLOSE"
factory/actuator/pump     → "ON" or "OFF"
factory/actuator/alarm    → "ON" or "OFF"
factory/actuator/mode     → "AUTO" or "MANUAL"
```

---

## 🗄️ Database Tables

### **device_thresholds**

Stores per-device threshold configuration:
- Temperature thresholds (warning, critical, emergency)
- Gas thresholds (warning, critical, emergency)
- Humidity thresholds (warning, critical)
- Tank level thresholds (min, max)
- Pressure thresholds (warning, critical)
- Auto-control flags (fan, vent, pump, alarm)

### **actuator_states**

Tracks real-time actuator states:
- Fan state (ON/OFF)
- Vent state (OPEN/CLOSED)
- Pump state (ON/OFF)
- Alarm state (ON/OFF)
- Control mode (AUTO/MANUAL)
- Last command timestamp

---

## 🚀 How to Use

### **1. Database Migration** (Already Done ✅)

```bash
cd backend
python run_migration_005.py
```

Output:
```
✅ Migration successful!
   - device_thresholds table created
   - actuator_states table created
```

### **2. Start Backend** (cloud_server.py)

```bash
cd backend
python cloud_server.py
```

The backend will start on port **8000** with new API endpoints.

### **3. Start Frontend**

```bash
cd frontend
npm run dev
```

### **4. Access Device Control**

1. Login to FOGNET-X dashboard: `http://localhost:3000`
2. Click **"Device Control"** in sidebar (⚙️ icon)
3. Select a device from dropdown
4. Configure thresholds
5. Click **"Save Thresholds"**
6. Control actuators with ON/OFF buttons

---

## 🔄 Data Flow

### **Saving Thresholds**

```
User enters threshold values
    ↓
User clicks "Save Thresholds"
    ↓
Frontend → PUT /api/thresholds/{device_id}
    ↓
Backend saves to device_thresholds table
    ↓
Backend publishes MQTT: factory/config/{device_id}/thresholds
    ↓
ESP32/ESP8266 receives MQTT message
    ↓
Device updates local threshold variables
    ↓
Device uses new thresholds for automation
```

### **Controlling Actuators**

```
User clicks "ON" button for Fan
    ↓
Frontend → POST /api/actuators/{device_id}/control
    ↓
Backend updates actuator_states table
    ↓
Backend publishes MQTT: factory/actuator/fan → "ON"
    ↓
ESP32/ESP8266 receives MQTT message
    ↓
Device turns on fan relay
    ↓
Device sends acknowledgment: factory/actuator/ack → "OK:factory/actuator/fan"
```

---

## 🛠️ Arduino Firmware Update Required

To receive threshold updates from the dashboard, add this to your ESP32/ESP8266 code:

```cpp
#include <ArduinoJson.h>

// Global threshold variables (replace hardcoded values)
float temp_warning = 35.0;
float temp_critical = 45.0;
float temp_emergency = 55.0;
float gas_warning = 400.0;
float gas_critical = 700.0;
float gas_emergency = 900.0;

// In callback() function
void callback(char* topic, byte* payload, unsigned int length) {
  String topicStr = String(topic);
  String message;
  
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  
  Serial.println("\n📩 Command Received:");
  Serial.print("Topic: ");
  Serial.println(topicStr);
  Serial.print("Message: ");
  Serial.println(message);
  
  // Handle threshold updates from dashboard
  if (topicStr.startsWith("factory/config/") && topicStr.endsWith("/thresholds")) {
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, message);
    
    if (!error && doc["command"] == "UPDATE_THRESHOLDS") {
      temp_warning = doc["thresholds"]["temp_warning"];
      temp_critical = doc["thresholds"]["temp_critical"];
      temp_emergency = doc["thresholds"]["temp_emergency"];
      gas_warning = doc["thresholds"]["gas_warning"];
      gas_critical = doc["thresholds"]["gas_critical"];
      gas_emergency = doc["thresholds"]["gas_emergency"];
      
      Serial.println("✅ Thresholds updated from cloud!");
      Serial.printf("  Temp Warning: %.1f°C\n", temp_warning);
      Serial.printf("  Temp Critical: %.1f°C\n", temp_critical);
      Serial.printf("  Gas Warning: %.0f PPM\n", gas_warning);
      Serial.printf("  Gas Critical: %.0f PPM\n", gas_critical);
    }
    return;
  }
  
  // Existing actuator handling...
  if (topicStr == "factory/actuator/fan") {
    process_actuator_command("FAN", message);
  }
  else if (topicStr == "factory/actuator/vent") {
    process_actuator_command("VENT", message);
  }
  // ... other actuators
}

// In setup() - subscribe to threshold config topic
void setup() {
  // ... existing setup code ...
  
  // Subscribe to threshold configuration
  client.subscribe("factory/config/+/thresholds");
  client.subscribe("factory/actuator/#");
  
  Serial.println("✅ Subscribed to threshold and actuator topics");
}

// In loop() - use dynamic thresholds instead of hardcoded
void loop() {
  // ... sensor reading code ...
  
  // Use thresholds from dashboard (not hardcoded)
  if (autoMode) {
    if (temperature >= temp_critical) {
      // Critical temperature - activate cooling
      client.publish("factory/actuator/fan", "ON");
      client.publish("factory/actuator/vent", "OPEN");
      Serial.println("⚠️ CRITICAL TEMP: Fan ON, Vent OPEN");
    }
    else if (temperature >= temp_warning) {
      // Warning temperature
      Serial.println("⚠️ WARNING: Temperature above threshold");
    }
    
    if (gasValue >= gas_critical) {
      // Critical gas - activate ventilation
      client.publish("factory/actuator/fan", "ON");
      client.publish("factory/actuator/vent", "OPEN");
      Serial.println("⚠️ CRITICAL GAS: Fan ON, Vent OPEN");
    }
  }
}
```

---

## 🧪 Testing

### **Test API Endpoints**

```bash
# Get all thresholds
curl http://localhost:8000/api/thresholds

# Get specific device
curl http://localhost:8000/api/thresholds/esp8266_01

# Update thresholds
curl -X PUT http://localhost:8000/api/thresholds/esp8266_01 \
  -H "Content-Type: application/json" \
  -d '{
    "temp_warning": 30,
    "temp_critical": 40,
    "gas_warning": 350,
    "gas_critical": 650
  }'

# Control actuator
curl -X POST http://localhost:8000/api/actuators/esp8266_01/control \
  -H "Content-Type: application/json" \
  -d '{"actuator": "fan", "action": "ON"}'

# Toggle mode
curl -X POST http://localhost:8000/api/actuators/esp8266_01/auto-mode \
  -H "Content-Type: application/json" \
  -d '{"auto_mode": true}'
```

### **Test from Dashboard**

1. Open `http://localhost:3000/control`
2. Select device from dropdown
3. Change threshold values
4. Click "Save Thresholds"
5. Check backend logs:
   ```
   📤 Thresholds sent to esp8266_01 via factory/config/esp8266_01/thresholds
   ```
6. Click actuator buttons
7. Check backend logs:
   ```
   📤 Actuator command: factory/actuator/fan -> ON
   ```

---

## 📊 UI Features

### **Device Control Page Layout**

```
┌─────────────────────────────────────────────────┐
│  ⚙️ Device Control Center                      │
│  [Device Selector ▼]  [🔄 Refresh]              │
├─────────────────────────────────────────────────┤
│  Control Mode:  [🤖 AUTO / 🔧 MANUAL]           │
├───────────────────┬─────────────────────────────┤
│  📊 THRESHOLDS    │  🎮 ACTUATOR CONTROL        │
│                   │                             │
│  🌡️ Temperature   │  🌀 Exhaust Fan             │
│  Warning: [35] °C │  [ON] [OFF] Status: ON     │
│  Critical: [45]   │                             │
│  Emergency: [55]  │  💨 Air Vent                │
│                   │  [OPEN] [CLOSE] Status: CL  │
│  💨 Gas Level     │                             │
│  Warning: [400]   │  💧 Water Pump              │
│  Critical: [700]  │  [ON] [OFF] Status: OFF     │
│  Emergency: [900] │                             │
│                   │  🚨 Alarm/Buzzer            │
│  💧 Humidity      │  [ON] [OFF] Status: OFF     │
│  Warning: [80] %  │                             │
│  Critical: [90]   │                             │
│                   │                             │
│  ✅ Auto-Control  │                             │
│  ☑ Fan  ☑ Vent    │                             │
│  ☑ Pump ☑ Alarm   │                             │
│                   │                             │
│  [💾 Save Thresholds]                           │
└───────────────────┴─────────────────────────────┘
```

### **UI Features**

- 📱 Responsive design (mobile-friendly)
- 🎨 Beautiful dark theme with gradients
- ⚡ Real-time status indicators (green/red)
- 🔄 One-click refresh
- 💾 Instant save with feedback
- 🎯 Color-coded severity levels
- 🎮 Toggle buttons with active states
- 🤖 AUTO/MANUAL mode indicator

---

## 🔐 Security Notes

- ✅ All API endpoints use JWT authentication (via `@jwt_required()`)
- ✅ MQTT uses QoS 1 for reliable delivery
- ✅ Database uses parameterized queries (SQL injection safe)
- ✅ Threshold validation on backend
- ✅ Actuator command validation

---

## 📝 Next Steps (Optional Enhancements)

1. **Threshold Presets**: Save common threshold configurations
2. **Scheduled Thresholds**: Different thresholds for day/night
3. **Actuator Scheduling**: Auto ON/OFF at specific times
4. **Threshold Alerts**: Notify when thresholds are breached
5. **Historical Data**: Track threshold changes over time
6. **Bulk Operations**: Update thresholds for multiple devices
7. **Threshold Templates**: Apply templates to new devices
8. **Actuator Feedback**: Real-time status from devices

---

## 🎉 Summary

✅ **Database migration** - Tables created  
✅ **Backend API** - 7 endpoints for thresholds & actuators  
✅ **MQTT integration** - Real-time device communication  
✅ **Frontend UI** - Beautiful, responsive control page  
✅ **Navigation** - Added to sidebar  
✅ **Routing** - `/control` path configured  
✅ **Documentation** - Complete implementation guide  

**The system is now ready to use! Users can control thresholds and actuators from the dashboard instead of hardcoding them in Arduino!** 🚀

---

## 📚 Related Documentation

- [THRESHOLD_ACTUATOR_IMPLEMENTATION.md](THRESHOLD_ACTUATOR_IMPLEMENTATION.md) - Original implementation guide
- [MQTT_TOPICS_REFERENCE.md](MQTT_TOPICS_REFERENCE.md) - MQTT topic reference
- [backend/migrations/005_create_device_thresholds.sql](backend/migrations/005_create_device_thresholds.sql) - Database schema

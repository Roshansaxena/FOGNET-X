# 🎛️ Software-Based Threshold & Actuator Control Implementation Guide

## Overview

This feature allows users to **control thresholds and actuators from the dashboard** instead of hardcoding them in Arduino firmware.

---

## ✅ What's Done

1. ✅ Database migration created (`005_create_device_thresholds.sql`)
2. ✅ Tables designed:
   - `device_thresholds` - Per-device threshold configuration
   - `actuator_states` - Real-time actuator state tracking

---

## 📋 What Needs to Be Built

### **Phase 1: Backend API** (Next Steps)

#### File: `backend/routes/thresholds.py`

```python
from flask import Blueprint, request, jsonify
import sqlite3
from core.config import DB_NAME

thresholds_bp = Blueprint('thresholds', __name__)

# GET /api/thresholds - Get all device thresholds
@thresholds_bp.route('/api/thresholds', methods=['GET'])
def get_thresholds():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    thresholds = conn.execute('SELECT * FROM device_thresholds').fetchall()
    conn.close()
    return jsonify([dict(t) for t in thresholds])

# PUT /api/thresholds/<device_id> - Update device thresholds
@thresholds_bp.route('/api/thresholds/<device_id>', methods=['PUT'])
def update_thresholds(device_id):
    data = request.json
    
    conn = sqlite3.connect(DB_NAME)
    conn.execute('''
        INSERT INTO device_thresholds (device_id, temp_warning, temp_critical, ...)
        VALUES (?, ?, ?, ...)
        ON CONFLICT(device_id) DO UPDATE SET
            temp_warning = ?,
            temp_critical = ?,
            updated_at = CURRENT_TIMESTAMP
    ''', (device_id, data['temp_warning'], data['temp_critical'], ...))
    conn.commit()
    conn.close()
    
    # MQTT: Send new thresholds to device
    from services.mqtt_service import publish_thresholds
    publish_thresholds(device_id, data)
    
    return jsonify({"status": "ok"})

# GET /api/actuators/<device_id> - Get actuator states
@thresholds_bp.route('/api/actuators/<device_id>', methods=['GET'])
def get_actuators(device_id):
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    state = conn.execute(
        'SELECT * FROM actuator_states WHERE device_id = ?',
        (device_id,)
    ).fetchone()
    conn.close()
    return jsonify(dict(state) if state else {})

# POST /api/actuators/<device_id>/control - Control actuator
@thresholds_bp.route('/api/actuators/<device_id>/control', methods=['POST'])
def control_actuator(device_id):
    data = request.json
    actuator = data['actuator']  # fan, vent, pump, alarm
    action = data['action']  # ON/OFF, OPEN/CLOSED
    
    # Update database
    conn = sqlite3.connect(DB_NAME)
    conn.execute(f'''
        UPDATE actuator_states 
        SET {actuator}_state = ?, 
            last_command_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE device_id = ?
    ''', (action, device_id))
    conn.commit()
    conn.close()
    
    # MQTT: Send command to device
    from services.mqtt_service import client
    mqtt_topic = f"factory/actuator/{actuator}"
    client.publish(mqtt_topic, action)
    
    return jsonify({"status": "ok"})
```

#### Register in `backend/app.py`:

```python
from routes.thresholds import thresholds_bp
app.register_blueprint(thresholds_bp)
```

---

### **Phase 2: MQTT Integration**

#### File: `backend/services/mqtt_service.py`

Add these functions:

```python
def publish_thresholds(device_id, thresholds):
    """Send threshold configuration to device"""
    payload = json.dumps({
        "device_id": device_id,
        "thresholds": {
            "temp_warning": thresholds.get('temp_warning', 35),
            "temp_critical": thresholds.get('temp_critical', 45),
            "gas_warning": thresholds.get('gas_warning', 400),
            "gas_critical": thresholds.get('gas_critical', 700),
            # ... other thresholds
        }
    })
    client.publish(f"factory/config/{device_id}/thresholds", payload)
    print(f"📤 Thresholds sent to {device_id}")

def publish_actuator_command(device_id, actuator, action):
    """Send actuator command to device"""
    mqtt_topic = f"factory/actuator/{actuator}"
    client.publish(mqtt_topic, action)
    print(f"📤 Actuator command: {actuator} -> {action}")
```

---

### **Phase 3: Frontend UI**

#### File: `frontend/src/pages/DeviceControl.jsx`

```jsx
import { useState, useEffect } from "react";
import axios from "axios";

export default function DeviceControl() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [thresholds, setThresholds] = useState({});
  const [actuators, setActuators] = useState({});

  // Load devices
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    const res = await axios.get("/api/devices");
    setDevices(res.data);
  };

  // Load thresholds for selected device
  const loadThresholds = async (deviceId) => {
    const res = await axios.get(`/api/thresholds/${deviceId}`);
    setThresholds(res.data);
  };

  // Load actuator states
  const loadActuators = async (deviceId) => {
    const res = await axios.get(`/api/actuators/${deviceId}`);
    setActuators(res.data);
  };

  // Update thresholds
  const saveThresholds = async () => {
    await axios.put(`/api/thresholds/${selectedDevice}`, thresholds);
    alert("Thresholds updated!");
  };

  // Control actuator
  const controlActuator = async (actuator, action) => {
    await axios.post(`/api/actuators/${selectedDevice}/control`, {
      actuator,
      action
    });
    setActuators({ ...actuators, [`${actuator}_state`]: action });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">🎛️ Device Control</h1>

      {/* Device Selector */}
      <select 
        onChange={(e) => {
          setSelectedDevice(e.target.value);
          loadThresholds(e.target.value);
          loadActuators(e.target.value);
        }}
        className="w-full p-2 bg-slate-800 border border-slate-700 rounded text-white"
      >
        <option>Select Device</option>
        {devices.map(d => (
          <option key={d.device_id} value={d.device_id}>
            {d.device_name}
          </option>
        ))}
      </select>

      {/* Threshold Configuration */}
      {selectedDevice && (
        <>
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-4">
              📊 Threshold Configuration
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400">Temp Warning (°C)</label>
                <input
                  type="number"
                  value={thresholds.temp_warning || 35}
                  onChange={(e) => setThresholds({
                    ...thresholds, 
                    temp_warning: parseFloat(e.target.value)
                  })}
                  className="w-full p-2 bg-slate-700 rounded text-white"
                />
              </div>
              <div>
                <label className="text-gray-400">Temp Critical (°C)</label>
                <input
                  type="number"
                  value={thresholds.temp_critical || 45}
                  onChange={(e) => setThresholds({
                    ...thresholds, 
                    temp_critical: parseFloat(e.target.value)
                  })}
                  className="w-full p-2 bg-slate-700 rounded text-white"
                />
              </div>
              {/* Add more threshold inputs... */}
            </div>

            <button
              onClick={saveThresholds}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              💾 Save Thresholds
            </button>
          </div>

          {/* Actuator Control */}
          <div className="bg-slate-800 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-white mb-4">
              🎮 Actuator Control
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Fan Control */}
              <div className="bg-slate-700 p-4 rounded">
                <h3 className="text-white mb-2">🌀 Fan</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => controlActuator('fan', 'ON')}
                    className={`flex-1 py-2 rounded ${
                      actuators.fan_state === 'ON'
                        ? 'bg-green-600'
                        : 'bg-gray-600'
                    }`}
                  >
                    ON
                  </button>
                  <button
                    onClick={() => controlActuator('fan', 'OFF')}
                    className={`flex-1 py-2 rounded ${
                      actuators.fan_state === 'OFF'
                        ? 'bg-red-600'
                        : 'bg-gray-600'
                    }`}
                  >
                    OFF
                  </button>
                </div>
              </div>

              {/* Vent Control */}
              <div className="bg-slate-700 p-4 rounded">
                <h3 className="text-white mb-2">💨 Vent</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => controlActuator('vent', 'OPEN')}
                    className={`flex-1 py-2 rounded ${
                      actuators.vent_state === 'OPEN'
                        ? 'bg-green-600'
                        : 'bg-gray-600'
                    }`}
                  >
                    OPEN
                  </button>
                  <button
                    onClick={() => controlActuator('vent', 'CLOSE')}
                    className={`flex-1 py-2 rounded ${
                      actuators.vent_state === 'CLOSED'
                        ? 'bg-red-600'
                        : 'bg-gray-600'
                    }`}
                  >
                    CLOSE
                  </button>
                </div>
              </div>

              {/* Add Pump & Alarm controls... */}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

---

### **Phase 4: Arduino Firmware Update**

The firmware needs to listen for threshold configuration updates:

```cpp
// In callback() function
if (topicStr.startsWith("factory/config/") && topicStr.endsWith("/thresholds")) {
  // Parse JSON and update thresholds
  DynamicJsonDocument doc(512);
  deserializeJson(doc, message);
  
  temp_warning = doc["thresholds"]["temp_warning"];
  temp_critical = doc["thresholds"]["temp_critical"];
  gas_warning = doc["thresholds"]["gas_warning"];
  gas_critical = doc["thresholds"]["gas_critical"];
  
  Serial.println("✅ Thresholds updated from cloud!");
}

// Use dynamic thresholds in logic
if (temperature > temp_critical) {
  // Trigger alert
}
```

---

## 🎯 Implementation Order

1. ✅ Database migration (DONE)
2. ⏳ Backend API routes
3. ⏳ MQTT publish functions
4. ⏳ Frontend UI page
5. ⏳ Arduino firmware update
6. ⏳ Testing & validation

---

## 📁 Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `backend/migrations/005_*.sql` | ✅ Created | Database schema |
| `backend/routes/thresholds.py` | 🆕 Create | API endpoints |
| `backend/app.py` | ✏️ Modify | Register blueprint |
| `backend/services/mqtt_service.py` | ✏️ Modify | Add publish functions |
| `frontend/src/pages/DeviceControl.jsx` | 🆕 Create | UI page |
| `frontend/src/App.jsx` | ✏️ Modify | Add route |
| `firmware/*.ino` | ✏️ Modify | Listen for threshold updates |

---

## 🚀 Next Steps

**Would you like me to:**
1. Build the complete backend API?
2. Create the frontend UI?
3. Update the MQTT service?
4. All of the above?

Let me know and I'll continue building! 🛠️

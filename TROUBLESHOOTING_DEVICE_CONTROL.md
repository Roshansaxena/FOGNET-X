# 🔧 Device Control - "No Devices Found" Troubleshooting

## ❌ Problem
Device Control page shows "No devices found" or dropdown is empty.

---

## ✅ Solution: Start the Backend First!

The database tables are created when the backend starts. If you haven't started the backend, the database is empty.

---

## 🚀 Quick Fix

### **Step 1: Start Backend**

```bash
cd backend
python cloud_server.py
```

**You should see:**
```
🧠 FOGNET-X Fog Core Booting...
✅ FOGNET-X Fog Core Running...
☁ Cloud Server Running on port 8000
```

This creates all necessary database tables!

---

### **Step 2: Start Frontend**

```bash
cd frontend
npm run dev
```

---

### **Step 3: Run Simulator (Optional)**

```bash
cd scripts/archive
python simulate_devices.py
```

This creates simulated devices that send data.

---

### **Step 4: Access Device Control**

1. Open `http://localhost:3000/control`
2. Login (admin / admin123)
3. Devices should now appear in dropdown!

---

## 🔍 Diagnostic Steps

### **Check if Backend is Running:**

```bash
# Try to access the API
curl http://localhost:8000/api/devices
```

**Expected:** JSON response (even if empty array `[]`)  
**Error:** Connection refused = backend not running

---

### **Check Database Tables:**

```bash
cd backend
python

>>> import sqlite3
>>> conn = sqlite3.connect("fognetx.db")
>>> tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
>>> print(tables)
[('devices',), ('events',), ('device_thresholds',), ('actuator_states',), ...]
```

**Should see:** devices, events, device_thresholds, actuator_states  
**If empty:** Backend hasn't been started yet!

---

### **Check if Devices Exist:**

```bash
# Run diagnostic script
python check_database.py
```

**Expected output:**
```
📱 Devices Table:
  ⚠️  No devices found in devices table

📊 Events Table (device IDs):
  - factory_floor_1 - Last event: 2026-04-27 01:30:00
  
  ✅ Found 1 unique device(s) in events
```

---

## 📋 Common Scenarios

### **Scenario 1: First Time Setup**

**Problem:** Fresh clone, never ran backend  
**Solution:**
```bash
cd backend
python cloud_server.py  # Creates tables
# Leave it running!

# In new terminal:
cd frontend
npm run dev
```

---

### **Scenario 2: Backend Not Running**

**Problem:** Started frontend but not backend  
**Solution:**
```bash
# Terminal 1:
cd backend
python cloud_server.py

# Terminal 2:
cd frontend
npm run dev
```

---

### **Scenario 3: No Devices Sending Data**

**Problem:** Backend running but no devices connected  
**Solution:** Run simulator
```bash
cd scripts/archive
python simulate_devices.py
```

Wait 5-10 seconds for devices to appear.

---

### **Scenario 4: Devices in Overview but Not in Control**

**Problem:** Devices show in Overview page but not Device Control  
**Solution:** This was the auto-registration bug - **FIXED!**

Now when you:
1. Go to Device Control page
2. Select device from dropdown
3. Backend auto-registers it automatically

---

## 🎯 Complete Working Example

### **Terminal 1 - Backend:**
```bash
cd e:\FOGNET-X_Repo\FOGNET-X\backend
python cloud_server.py
```

**Wait for:**
```
✅ FOGNET-X Fog Core Running...
☁ Cloud Server Running on port 8000
```

---

### **Terminal 2 - Simulator:**
```bash
cd e:\FOGNET-X_Repo\FOGNET-X\scripts\archive
python simulate_devices.py
```

**Wait for:**
```
✅ Connected to MQTT broker
📤 Published sensor data for factory_floor_1
📤 Published sensor data for warehouse_zone_1
...
```

---

### **Terminal 3 - Frontend:**
```bash
cd e:\FOGNET-X_Repo\FOGNET-X\frontend
npm run dev
```

**Wait for:**
```
VITE ready in 500ms
➜  Local:   http://localhost:3000/
```

---

### **Browser:**
1. Open `http://localhost:3000`
2. Login: admin / admin123
3. Go to **Overview** → See devices online ✅
4. Go to **Device Control** → See devices in dropdown ✅
5. Select device → Auto-registers ✅
6. Configure thresholds! ✅

---

## 🔧 If Still Not Working

### **1. Check Backend Logs:**
Look for errors in backend terminal

### **2. Check Browser Console:**
Press F12 → Console tab → Look for errors

### **3. Test API Directly:**
```bash
curl http://localhost:8000/api/devices
```

Should return: `[]` or `[{"device_id": "...", ...}]`

### **4. Restart Everything:**
```bash
# Stop all processes (Ctrl+C)

# Start again:
cd backend && python cloud_server.py
cd frontend && npm run dev
cd scripts/archive && python simulate_devices.py
```

---

## ✅ Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Simulator running (or real devices connected)
- [ ] Can access `http://localhost:3000`
- [ ] Can login (admin/admin123)
- [ ] Overview page shows devices
- [ ] Device Control page shows devices in dropdown
- [ ] Can select device and configure thresholds

---

## 📞 Quick Reference

| Component | Command | Port |
|-----------|---------|------|
| Backend | `python cloud_server.py` | 8000 |
| Frontend | `npm run dev` | 3000 |
| Simulator | `python simulate_devices.py` | N/A |
| MQTT Broker | `docker-compose up -d mqtt` | 1883 |

---

**Most Common Issue:** Backend not started! Always start backend first! 🚀

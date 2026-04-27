# 🚀 Quick Start Guide - Phase 2 UI/UX

## What's New?

### ✨ Enhanced Overview Dashboard
- Professional glass-morphism design
- Real-time sensor readings (8 sensors)
- System health gauges (3 radial charts)
- Task distribution donut chart
- Enhanced metric cards with trend indicators

### 🖥️ Device Management Page
- Full CRUD interface for IoT devices
- Search and filter functionality
- Real-time device status monitoring
- Modal-based device registration/editing

---

## 🎯 How to Test

### Option 1: Start Backend Only (Recommended for Testing)

```powershell
# Navigate to backend
cd e:\FOGNET-X_Repo\FOGNET-X\backend

# Start the cloud server
python cloud_server.py
```

**Expected Output:**
```
☁ Cloud using DB: fognetx.db
✅ Default admin created: admin / admin123
☁ Cloud Server Running on port 8000
```

### Option 2: Start Frontend Development Server

```powershell
# Navigate to frontend
cd e:\FOGNET-X_Repo\FOGNET-X\frontend

# Install dependencies if needed
npm install

# Start dev server
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Option 3: Docker Deployment (Full Stack)

```powershell
# From project root
docker-compose up --build
```

---

## 🌐 Access the Application

### If Running Backend Only:
- **API**: http://localhost:8000
- **Dashboard**: Not available (Flask templates only)

### If Running Frontend Dev Server:
- **Frontend**: http://localhost:5173
- **Backend API**: Proxied through Vite config

### If Running Docker:
- **Nginx Proxy**: http://localhost:80
- Direct access to both frontend and backend

---

## 🔐 Login Credentials

**Default Admin Account:**
- Username: `admin`
- Password: `admin123`

**Or use Google OAuth** (if configured)

---

## 📋 Test Scenarios

### 1. Overview Dashboard
1. Navigate to `/overview`
2. Check if all metric cards load
3. Verify sensor readings display correctly
4. Watch for real-time updates (every 3 seconds)
5. Check chart animations

**What to Look For:**
- ✅ Smooth animations at 60fps
- ✅ No layout shifts or jank
- ✅ Colors match design (indigo/purple gradients)
- ✅ Responsive grid layouts
- ✅ Tooltips work on charts

### 2. Device Management
1. Navigate to `/devices`
2. Click "Register Device" button
3. Fill in the form:
   - Device ID: `TEST-001`
   - Device Name: `Test Sensor`
   - Type: `iot_sensor`
   - Check capabilities: temperature, humidity, gas
   - Location: `Test Lab`
   - Status: `online`
4. Click "Register Device"
5. Verify device appears in grid
6. Try editing the device
7. Try deleting the device

**What to Look For:**
- ✅ Modal opens smoothly
- ✅ Form validation works
- ✅ Device card renders correctly
- ✅ Search/filter functionality
- ✅ CRUD operations succeed

### 3. Live Execution
1. Navigate to `/live`
2. Observe real-time event stream
3. Check latency metrics

### 4. Orchestration
1. Navigate to `/orchestration`
2. View allocation decisions
3. Adjust configuration settings

---

## 🐛 Troubleshooting

### Frontend Won't Load
```powershell
# Check Node version
node --version  # Should be 16+

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend API Errors
```powershell
# Check Python version
python --version  # Should be 3.8+

# Install dependencies
cd backend
pip install -r requirements.txt

# Check database
ls fognetx.db  # Should exist
```

### CORS Errors
Make sure backend is running on port 8000
Frontend proxies API calls to `http://localhost:8000`

### Database Locked Error
Close any other processes using `fognetx.db`
Restart the backend server

---

## 📊 Expected Data Flow

```
ESP8266 → MQTT Broker → mqtt_service.py
                           ↓
                    decision_engine.py
                           ↓
                    orchestrator.py
                           ↓
                    logger.py → SQLite DB
                           ↓
                    cloud_server.py → API
                           ↓
                    React Frontend → Display
```

---

## 🎨 UI Components Preview

### Overview Page Layout:
```
┌─────────────────────────────────────────────┐
│  FOGNET-X Intelligence Dashboard    [Live] │
├─────────────────────────────────────────────┤
│ [Events] [Latency] [SLA] [Bandwidth] [...] │
├──────────────────────────┬──────────────────┤
│  Live Sensor Readings    │ System Health    │
│  [Temp][Humidity][Gas]   │  [Device: 95%]   │
│  [Pressure][Tank]...     │  [Network: 88%]  │
│                          │  [SLA: 99%]      │
├──────────────────────────┴──────────────────┤
│  Risk Trajectory Chart │ Task Distribution  │
│  (Area Chart)          │   (Donut Chart)    │
└─────────────────────────────────────────────┘
```

### Devices Page Layout:
```
┌─────────────────────────────────────────────┐
│ Device Management           [+ Register]    │
│ [Total: 5] [Online: 3] [Warning: 1] [...]   │
├─────────────────────────────────────────────┤
│ [Search Box] [Type Filter] [Refresh]        │
├──────────┬──────────┬──────────┬────────────┤
│ [Card 1] │ [Card 2] │ [Card 3] │ [Card 4]   │
│ Online   │ Warning  │ Online   │ Offline    │
│ Temp Hum │ Gas Mot  │ Pressure │ --         │
│ [Edit][×]│ [Edit][×]│ [Edit][×]│ [Edit][×]  │
└──────────┴──────────┴──────────┴────────────┘
```

---

## ⚡ Performance Benchmarks

**Target Metrics:**
- Initial page load: < 2 seconds
- Time to interactive: < 3 seconds
- API response time: < 100ms
- Chart render time: < 50ms
- Animation frame rate: 60 FPS
- Auto-update interval: 3-10 seconds

---

## 🎯 Demo Script (5 Minutes)

**Minute 0-1: Overview Dashboard**
- Show professional design
- Point out live sensor data
- Highlight system health gauges

**Minute 1-2: Device Management**
- Register a new device
- Show search/filter
- Edit device capabilities

**Minute 2-3: Live Execution**
- Show real-time event stream
- Explain fog vs cloud decision
- Display latency metrics

**Minute 3-4: Hardware Demo**
- Show ESP8266 sending data
- Trigger gas alert
- Display automatic response

**Minute 4-5: Q&A**
- Answer questions
- Show code architecture
- Discuss scalability

---

## 📝 Next Steps

After testing Phase 2:
1. ✅ Verify all features work correctly
2. ✅ Test on different browsers
3. ✅ Check mobile responsiveness
4. ✅ Practice demo script
5. ⏭️ Proceed to Phase 3 (Alerts & Analytics)

---

**Need Help?**
Check `IMPLEMENTATION_SUMMARY.md` for architecture details
Check `PHASE2_COMPLETE.md` for feature list
Check console logs for error messages

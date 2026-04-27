# 📁 FOGNET-X Project Structure

## Clean Directory Layout

```
FOGNET-X/
│
├── 📦 backend/                      # Python Flask backend
│   ├── core/                        # Core logic (orchestrator, decision engine)
│   ├── routes/                      # API endpoints
│   │   ├── thresholds.py           # Threshold & actuator control APIs
│   │   └── ...
│   ├── services/                    # Business logic services
│   │   ├── mqtt_service.py         # MQTT broker integration
│   │   ├── alert_service.py        # Email/Telegram alerts
│   │   ├── realtime.py             # WebSocket real-time updates
│   │   └── ...
│   ├── migrations/                  # Database migrations
│   │   ├── 001_create_users.sql
│   │   ├── 005_create_device_thresholds.sql
│   │   └── ...
│   ├── templates/                   # HTML templates
│   ├── cloud_server.py             # ⭐ Main application entry point
│   ├── app.py                      # Legacy dashboard (minimal)
│   ├── .env                        # Environment variables (DO NOT COMMIT)
│   ├── .env.example                # Environment template
│   └── requirements.txt            # Python dependencies
│
├── 🌐 frontend/                     # React frontend (Vite)
│   ├── src/
│   │   ├── pages/                  # Page components
│   │   │   ├── DeviceControl.jsx  # Threshold & actuator UI
│   │   │   ├── Overview.jsx       # Main dashboard
│   │   │   ├── Orchestration.jsx  # Orchestration config
│   │   │   └── ...
│   │   ├── components/            # Reusable components
│   │   ├── services/              # API & socket services
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── 🔌 firmware/                     # Arduino/ESP firmware
│   ├── esp32_complete_node.ino     # ESP32 firmware
│   ├── esp8266_complete_node.ino   # ESP8266 firmware
│   ├── esp8266_factory_node.ino    # Factory node firmware
│   ├── standalone/                 # Standalone firmware versions
│   └── archive/                    # Old/deprecated firmware
│
├── 📚 docs/                         # Documentation
│   ├── guides/                     # User guides
│   ├── DEPLOYMENT_GUIDE.md         # Deployment instructions
│   ├── QUICK_START.md              # Quick start guide
│   ├── MQTT_TOPICS_REFERENCE.md    # MQTT topic reference
│   └── archive/                    # Historical documentation
│
├── 🛠️ scripts/                      # Utility scripts
│   ├── start_all.sh                # Start all services
│   ├── fognetx.sh                  # Main CLI tool
│   ├── cli.py                      # Command-line interface
│   ├── migrate_db.py               # Database migration tool
│   └── archive/                    # Deprecated scripts
│
├── 📦 packaging/                    # Installation packages
│   ├── installers/                 # OS-specific installers
│   ├── cd-distribution/           # CD burning package
│   └── ...
│
├── 🧪 experiments/                  # ML models & experiments
│   ├── train_model.py              # Model training
│   ├── evaluate_model.py           # Model evaluation
│   └── *.png, *.csv                # Experiment results
│
├── 💻 dotnet/                       # .NET applications
│   ├── FOGNET-X Manager/           # Windows Forms app
│   └── FOGNET-X CLI/               # .NET CLI tool
│
├── 🐳 docker/                       # Docker configuration
│   └── docker-compose.yml          # Docker Compose (root level)
│
├── 📝 logs/                         # Application logs
│   ├── cloud.log
│   ├── fog.log
│   └── frontend.log
│
├── 🌍 nginx/                        # Nginx configuration
│   └── nginx.conf
│
├── 🗄️ fognetx.db                    # SQLite database
│
├── 📄 FOGNET-X.sln                  # Visual Studio solution
├── 📘 README.md                     # Project readme
└── 📋 .gitignore                    # Git ignore rules
```

---

## 📌 Key Files Reference

### **Backend (Python)**

| File | Purpose | Status |
|------|---------|--------|
| `backend/cloud_server.py` | ⭐ Main application (Flask + SocketIO) | ✅ Active |
| `backend/app.py` | Legacy dashboard (minimal) | ⚠️ Legacy |
| `backend/routes/thresholds.py` | Threshold & actuator APIs | ✅ Active |
| `backend/services/mqtt_service.py` | MQTT integration | ✅ Active |
| `backend/services/alert_service.py` | Email/Telegram alerts | ✅ Active |
| `backend/.env` | Environment config | 🔒 Secret |

### **Frontend (React)**

| File | Purpose | Route |
|------|---------|-------|
| `frontend/src/pages/DeviceControl.jsx` | Threshold & actuator UI | `/control` |
| `frontend/src/pages/Overview.jsx` | Main dashboard | `/overview` |
| `frontend/src/pages/Orchestration.jsx` | Orchestration config | `/orchestration` |
| `frontend/src/pages/Devices.jsx` | Device management | `/devices` |

### **Firmware**

| File | Board | Features |
|------|-------|----------|
| `esp32_complete_node.ino` | ESP32 | Full sensor suite + actuators |
| `esp8266_complete_node.ino` | ESP8266 | Complete node |
| `esp8266_factory_node.ino` | ESP8266 | Factory optimized |

---

## 🗂️ Archive Directories

### **docs/archive/**
Historical documentation that's no longer actively maintained:
- Implementation summaries
- Phase completion reports
- Old setup guides
- Feature-specific documentation

### **firmware/archive/**
Deprecated or old firmware versions:
- Wokwi simulator files
- Old factory node versions
- Test firmware

### **scripts/archive/**
Deprecated utility scripts:
- Old test scripts
- Simulation tools
- One-time migration scripts

---

## 🚀 Quick Start

### **Start Backend:**
```bash
cd backend
python cloud_server.py
```

### **Start Frontend:**
```bash
cd frontend
npm run dev
```

### **Start with Docker:**
```bash
docker-compose up -d
```

---

## 📊 Feature Modules

### **1. Device Management**
- Device registration & tracking
- Real-time status monitoring
- Battery & signal strength

### **2. Threshold Control** ⭐ NEW
- Per-device threshold configuration
- Temperature, gas, humidity, pressure
- Auto-control toggles

### **3. Actuator Control** ⭐ NEW
- Fan, vent, pump, alarm control
- AUTO/MANUAL mode switching
- Real-time MQTT commands

### **4. Orchestration**
- Fog/Cloud decision engine
- SLA monitoring
- Risk-based allocation

### **5. Real-time Dashboard**
- WebSocket live updates
- Device filtering
- Latency tracking

### **6. Alerting**
- Email notifications
- Telegram bot alerts
- Configurable thresholds

---

## 🔐 Security Notes

- `.env` file contains secrets - never commit to Git
- All API endpoints use JWT authentication
- MQTT uses QoS 1 for reliable delivery
- Database uses parameterized queries

---

## 📝 Development Workflow

1. **Backend changes:**
   - Edit files in `backend/`
   - Test with `python cloud_server.py`
   - Run migrations if needed

2. **Frontend changes:**
   - Edit files in `frontend/src/`
   - Hot reload with `npm run dev`
   - Build with `npm run build`

3. **Firmware changes:**
   - Edit `.ino` files in `firmware/`
   - Upload to ESP devices
   - Test MQTT communication

---

## 🎯 Recent Additions

### **v2.0 - Software-Based Control** (Latest)
- ✅ Threshold configuration from dashboard
- ✅ Actuator control via MQTT
- ✅ Per-device settings
- ✅ AUTO/MANUAL mode switching
- ✅ Real-time status updates

### **v1.5 - Enhanced Dashboard**
- ✅ WebSocket real-time updates
- ✅ Device filtering
- ✅ Smart change detection
- ✅ Performance optimizations

### **v1.0 - Core Platform**
- ✅ Fog/Cloud orchestration
- ✅ Device management
- ✅ Basic monitoring
- ✅ Alert system

---

## 📞 Support

- **Documentation:** `docs/` directory
- **Issues:** GitHub Issues
- **MQTT Reference:** `docs/MQTT_TOPICS_REFERENCE.md`
- **Deployment:** `docs/DEPLOYMENT_GUIDE.md`

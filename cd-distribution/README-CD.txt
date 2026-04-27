# 🔥 FOGNET-X - Complete Distribution Package

## 📦 What's Included

This CD contains the complete FOGNET-X Fog Computing Platform with:
- ✅ **Backend** - Python FastAPI + Flask server with ML capabilities
- ✅ **Frontend** - React dashboard with real-time WebSocket updates
- ✅ **MQTT Broker** - Eclipse Mosquitto for IoT device communication
- ✅ **Database** - SQLite with auto-migration
- ✅ **Documentation** - Complete setup guides

---

## 🚀 Quick Start (Choose One)

### Option 1: Docker (Recommended - Easiest)

**Requirements:**
- Docker Desktop installed
- 2GB RAM minimum
- Internet connection (first time only for images)

**Steps:**
```bash
# 1. Copy CD contents to your computer
mkdir C:\FOGNET-X
xcopy D:\*.* C:\FOGNET-X\ /E /I /Y

# 2. Navigate to project
cd C:\FOGNET-X

# 3. Start everything
docker-compose up -d

# 4. Access dashboard
# Open browser: http://localhost:3000
# Login: admin / admin123
```

**Done!** 🎉

---

### Option 2: Local Installation (No Docker)

**Requirements:**
- Python 3.9+
- Node.js 18+
- Git (optional)
- 2GB RAM

**Steps:**

#### **Windows:**
```powershell
# 1. Copy files
xcopy D:\*.* C:\FOGNET-X\ /E /I /Y
cd C:\FOGNET-X

# 2. Run automated setup
.\setup-windows.bat

# 3. Access dashboard
# http://localhost:3000
```

#### **Linux/Mac:**
```bash
# 1. Copy files
cp -r /media/cdrom/* ~/fognetx/
cd ~/fognetx

# 2. Run automated setup
chmod +x setup-linux.sh
./setup-linux.sh

# 3. Access dashboard
# http://localhost:3000
```

---

## 📋 System Requirements

### Minimum:
- **CPU:** Dual-core processor
- **RAM:** 2GB
- **Storage:** 1GB free space
- **OS:** Windows 10/11, Ubuntu 20.04+, macOS 11+

### Recommended:
- **CPU:** Quad-core processor
- **RAM:** 4GB+
- **Storage:** 2GB+ free space
- **OS:** Latest Windows/Linux/macOS

---

## 🎯 What You Can Do

1. **Monitor IoT Devices** - Real-time sensor data dashboard
2. **Fog Computing** - Edge processing with low latency
3. **Cloud Integration** - Hybrid fog-cloud execution
4. **ML Predictions** - AI-powered decision making
5. **Device Management** - Add/remove/configure devices
6. **Alerts & Notifications** - Threshold-based alerts

---

## 📖 Documentation

All guides are in the `docs/` folder:

- `QUICK_START.md` - Getting started (5 minutes)
- `INSTALLATION.md` - Detailed setup instructions
- `TROUBLESHOOTING.md` - Common issues & solutions
- `USER_GUIDE.md` - How to use the dashboard
- `DEVICE_SETUP.md` - Connect physical IoT devices

---

## 🔧 Configuration

### Change Default Ports

Edit `docker-compose.yml`:
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # Change 3000 to 8080
  
  backend:
    ports:
      - "8001:8000"  # Change 8000 to 8001
```

### Database Location

Default: `./backend/fognetx.db`

Change in `.env`:
```
DB_PATH=C:\custom\path\fognetx.db
```

---

## 🛑 Stopping FOGNET-X

### Docker:
```bash
# Stop all services
docker-compose down

# Stop and remove data
docker-compose down -v
```

### Local:
```bash
# Press Ctrl+C in terminal
# Or run:
./stop.sh
```

---

## 📞 Support

- **Email:** support@fognetx.com
- **GitHub:** https://github.com/fognetx/support
- **Issues:** Report bugs on GitHub

---

## 📄 License

FOGNET-X is licensed under the MIT License. See `LICENSE` file for details.

---

## ✨ Features

- **Real-time Monitoring** - WebSocket live updates
- **Device Simulation** - Test without physical devices
- **ML Integration** - Scikit-learn models
- **Multi-Protocol** - MQTT, HTTP, WebSocket
- **Responsive UI** - Works on desktop & mobile
- **Auto-scaling** - Handles 1000+ devices

---

## 🎓 Learning Resources

- Watch demo video: `docs/video-demo.mp4`
- Read architecture: `docs/ARCHITECTURE.md`
- API documentation: `http://localhost:8000/docs` (when running)

---

**Welcome to FOGNET-X! 🚀**

Version: 1.0.0  
Build Date: 2026-04-03  
CD Label: FOGNET-X-Complete

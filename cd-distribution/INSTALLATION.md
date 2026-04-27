# FOGNET-X Installation Guide

## Quick Setup (3 Options)

Choose the method that works best for you:

---

## Option 1: Docker (Recommended - 2 Minutes)

**Best for:** Quick setup, no dependencies to install

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- Windows 10/11, macOS 11+, or Ubuntu 20.04+

### Steps

1. **Open Terminal/Command Prompt**
   ```bash
   cd /path/to/fognetx  # Navigate to FOGNET-X folder
   ```

2. **Start All Services**
   ```bash
   docker-compose up -d
   ```

3. **Access Dashboard**
   - Open browser: http://localhost:3000
   - Login: `admin` / `admin123`

4. **Verify Installation**
   ```bash
   docker ps
   # Should show 4 containers: mqtt, fogcore, backend, frontend
   ```

### Stop Services
```bash
docker-compose down
```

---

## Option 2: Windows Local (5-10 Minutes)

**Best for:** Windows users without Docker

### Prerequisites
- Python 3.9+ from https://www.python.org/downloads/
- Node.js 18+ from https://nodejs.org/

### Automated Setup

1. **Double-click** `setup-windows.bat`
2. **Wait** for installation to complete (5-10 minutes)
3. **Browser opens** automatically at http://localhost:3000

### Manual Setup

```powershell
# 1. Install Backend Dependencies
cd backend
pip install -r requirements.txt

# 2. Setup Database
python migrate.py

# 3. Install Frontend Dependencies
cd ..\frontend
npm install

# 4. Start MQTT Broker (Docker)
docker run -d --name fognetx-mqtt -p 1883:1883 eclipse-mosquitto:2

# 5. Start Backend
cd ..\backend
python cloud_server.py

# 6. Start Frontend (in new terminal)
cd ..\frontend
npm run dev
```

---

## Option 3: Linux/Mac Local (5-10 Minutes)

**Best for:** Linux/macOS users without Docker

### Prerequisites

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3 python3-pip nodejs npm
```

**macOS:**
```bash
brew install python3 node
```

### Automated Setup

```bash
chmod +x setup-linux.sh
./setup-linux.sh
```

### Manual Setup

```bash
# 1. Install Backend
cd backend
pip3 install -r requirements.txt
python3 migrate.py

# 2. Install Frontend
cd ../frontend
npm install

# 3. Start MQTT (if not using Docker)
sudo apt install mosquitto
sudo systemctl start mosquitto

# 4. Start Backend
cd ../backend
python3 cloud_server.py &

# 5. Start Frontend
cd ../frontend
npm run dev &
```

---

## Verification

### Test Backend API
```bash
curl http://localhost:8000/api/data
# Should return JSON data
```

### Test Frontend
- Open http://localhost:3000
- Should see FOGNET-X dashboard
- Login with admin/admin123

### Test MQTT
```bash
# Install mosquitto clients
sudo apt install mosquitto-clients

# Subscribe to test
mosquitto_sub -h localhost -t "fognetx/#"

# Publish test message (in another terminal)
mosquitto_pub -h localhost -t "fognetx/test" -m "Hello!"
```

---

## Troubleshooting

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find process using port
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Linux/Mac

# Kill process
taskkill /PID <PID> /F  # Windows
kill -9 <PID>           # Linux/Mac
```

### Python Dependencies Fail

**Error:** `pip install` fails

**Solution:**
```bash
# Upgrade pip first
python -m pip install --upgrade pip

# Then install
pip install -r requirements.txt
```

### Node.js Dependencies Fail

**Error:** `npm install` fails

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Migration Fails

**Error:** `migrate.py` fails

**Solution:**
```bash
# Delete old database
rm backend/fognetx.db  # Linux/Mac
del backend\fognetx.db # Windows

# Run migration again
python migrate.py
```

---

## First-Time Setup

### Create Admin User

```bash
cd backend
python create_admin.py
# Follow prompts to create admin account
```

### Load Sample Data

```bash
cd backend
python test_enhanced_system.py
# Loads test devices and data
```

### Start Device Simulator

```bash
python simulate_devices.py --devices 5 --rate 2
# Simulates 5 devices sending data every 2 seconds
```

---

## Configuration

### Environment Variables

Create `backend/.env` file:

```env
FLASK_SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
DB_PATH=./fognetx.db
MQTT_BROKER=localhost
MQTT_PORT=1883
CORS_ORIGIN=http://localhost:3000
```

### Change Ports

**Backend (port 8000):**
Edit `backend/cloud_server.py`:
```python
app.run(host='0.0.0.0', port=9000)  # Change to 9000
```

**Frontend (port 3000):**
Edit `frontend/vite.config.js`:
```javascript
server: {
  port: 4000  // Change to 4000
}
```

---

## Performance Tips

### Docker Optimization
```bash
# Use build cache
docker-compose build --no-cache

# Clean unused images
docker system prune -a
```

### Local Optimization
```bash
# Use production build for frontend
cd frontend
npm run build
npx serve -s build -l 3000
```

---

## Uninstallation

### Docker
```bash
docker-compose down -v
docker rmi fognetx-backend fognetx-frontend
```

### Local
```bash
# Delete project folder
rm -rf fognetx  # Linux/Mac
rmdir /s fognetx  # Windows

# Remove global packages (optional)
pip uninstall -y -r requirements.txt
npm uninstall -g vite
```

---

## Next Steps

1. ✅ Dashboard running at http://localhost:3000
2. 📚 Read `USER_GUIDE.md` to learn features
3. 🔌 Connect physical IoT devices (see `DEVICE_SETUP.md`)
4. 🤖 Try ML predictions
5. 📊 Monitor real-time data

---

## Support

- **Issues:** GitHub Issues
- **Email:** support@fognetx.com
- **Docs:** `docs/` folder

---

**Happy Monitoring! 🚀**

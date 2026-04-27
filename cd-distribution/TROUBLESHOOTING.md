# 🔧 FOGNET-X Troubleshooting Guide

## Common Issues & Solutions

---

## 🚀 Startup Issues

### Issue: Docker Containers Won't Start

**Symptoms:**
```
Error: Cannot start service backend: driver failed programming external connectivity
```

**Solution:**
```bash
# 1. Stop all containers
docker-compose down

# 2. Remove old containers
docker rm -f $(docker ps -aq)

# 3. Remove unused networks
docker network prune

# 4. Restart
docker-compose up -d
```

---

### Issue: Port Already in Use

**Symptoms:**
```
Error: listen tcp 0.0.0.0:8000: bind: address already in use
```

**Find what's using the port:**

**Windows:**
```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -i :8000
kill -9 <PID>
```

**Or change the port in docker-compose.yml:**
```yaml
ports:
  - "8001:8000"  # Use 8001 instead of 8000
```

---

### Issue: Frontend Won't Load

**Symptoms:**
- Browser shows blank page
- Console shows errors

**Solution:**
```bash
cd frontend

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build

# Restart
npm run dev
```

---

## 📊 Database Issues

### Issue: Database Migration Fails

**Symptoms:**
```
sqlite3.OperationalError: no such table: users
```

**Solution:**
```bash
cd backend

# Delete corrupted database
rm fognetx.db  # Linux/Mac
del fognetx.db # Windows

# Run fresh migration
python migrate.py

# Create admin user
python create_admin.py
```

---

### Issue: Database Locked

**Symptoms:**
```
sqlite3.OperationalError: database is locked
```

**Solution:**
```bash
# Find processes using database
lsof fognetx.db  # Linux/Mac

# Kill them
kill -9 <PID>

# Or restart all services
docker-compose restart
```

---

## 🌐 MQTT Connection Issues

### Issue: Backend Can't Connect to MQTT

**Symptoms:**
```
Connection refused: MQTT broker not available
```

**Solution:**

**Docker:**
```bash
# Check if MQTT container is running
docker ps | grep mqtt

# Restart MQTT
docker restart fognetx-mqtt

# Check logs
docker logs fognetx-mqtt
```

**Local:**
```bash
# Install Mosquitto
sudo apt install mosquitto mosquitto-clients  # Ubuntu
brew install mosquitto                         # macOS

# Start service
sudo systemctl start mosquitto  # Linux
brew services start mosquitto   # macOS

# Test connection
mosquitto_sub -h localhost -t "test"
```

---

### Issue: Devices Not Showing Up

**Symptoms:**
- Dashboard shows "No devices connected"
- MQTT messages not received

**Check MQTT is working:**
```bash
# Subscribe to all FOGNET-X topics
mosquitto_sub -h localhost -t "fognetx/#" -v

# Should see messages like:
# fognetx/sensor/device_001 {"temperature": 25.5, ...}
```

**Start device simulator:**
```bash
python simulate_devices.py --devices 3 --rate 2
```

---

## 🔐 Authentication Issues

### Issue: Can't Login

**Symptoms:**
- Login fails with "Invalid credentials"
- 401 Unauthorized errors

**Solution:**

**Reset admin password:**
```bash
cd backend
python create_admin.py
# Follow prompts to recreate admin user
```

**Or manually in database:**
```bash
python
>>> import sqlite3
>>> conn = sqlite3.connect('fognetx.db')
>>> c = conn.cursor()
>>> from werkzeug.security import generate_password_hash
>>> hashed = generate_password_hash('newpassword123')
>>> c.execute("UPDATE users SET password=? WHERE username='admin'", (hashed,))
>>> conn.commit()
```

---

### Issue: JWT Token Expired

**Symptoms:**
- "Token expired" error in console
- Need to login repeatedly

**Solution:**

Increase token expiry in `backend/.env`:
```env
JWT_ACCESS_TOKEN_EXPIRES=86400  # 24 hours (in seconds)
```

---

## 📱 Device Connection Issues

### Issue: Physical Device Won't Connect

**Symptoms:**
- ESP32/Arduino not sending data
- MQTT broker not receiving messages

**Checklist:**
1. ✅ Device connected to same WiFi network
2. ✅ MQTT broker IP is correct (not localhost!)
3. ✅ Port 1883 is accessible
4. ✅ Topic format is correct: `fognetx/sensor/device_id`

**Get your computer's IP:**
```bash
ipconfig  # Windows
ifconfig  # Linux/Mac
```

**Update device firmware:**
```cpp
// Change this in Arduino code:
const char* mqtt_server = "192.168.1.100";  // Your computer's IP
const int mqtt_port = 1883;
```

---

## 🎨 Frontend Display Issues

### Issue: Charts Not Rendering

**Symptoms:**
- Blank chart areas
- Recharts errors in console

**Solution:**
```bash
cd frontend

# Check for React version conflicts
npm ls react
npm ls react-dom

# Reinstall if versions don't match
npm install react@latest react-dom@latest
```

---

### Issue: WebSocket Not Connecting

**Symptoms:**
- "LIVE" toggle shows disconnected
- Real-time updates not working

**Check WebSocket connection:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Should see connection to `localhost:8000`

**Fix:**
```bash
# Restart backend
docker-compose restart backend

# Check backend logs
docker logs fognetx-backend | grep socket
```

---

## ⚡ Performance Issues

### Issue: Dashboard is Slow

**Symptoms:**
- Page takes long to load
- Updates lag behind

**Solutions:**

1. **Use production build:**
```bash
cd frontend
npm run build
npm run preview
```

2. **Reduce update frequency:**
Edit `frontend/src/pages/Overview.jsx`:
```javascript
const pollInterval = liveMode ? 10000 : 5000;  // Increase from 3000
```

3. **Filter by device:**
- Use device dropdown to monitor single device
- Reduces updates by 90%

---

### Issue: High CPU Usage

**Symptoms:**
- Fan running loud
- System sluggish

**Solution:**

**Check what's using CPU:**
```bash
# Linux
htop

# Windows
Task Manager

# macOS
Activity Monitor
```

**Optimize:**
```bash
# Limit log verbosity
export LOG_LEVEL=WARNING  # Instead of DEBUG

# Reduce WebSocket emit frequency
# In backend/services/realtime.py, add throttling
```

---

## 🐍 Python Issues

### Issue: Import Errors

**Symptoms:**
```
ModuleNotFoundError: No module named 'flask'
```

**Solution:**
```bash
# Activate virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

---

### Issue: Python Version Mismatch

**Symptoms:**
```
SyntaxError: invalid syntax
```

**Check version:**
```bash
python --version
# Should be 3.9 or higher
```

**Install correct version:**
- Download from https://www.python.org/downloads/
- Select "Add to PATH" during installation

---

## 📦 NPM Issues

### Issue: npm install Fails

**Symptoms:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution:**
```bash
# Clear cache
npm cache clean --force

# Delete lock file
rm package-lock.json  # Linux/Mac
del package-lock.json # Windows

# Try with legacy-peer-deps
npm install --legacy-peer-deps
```

---

### Issue: Vite Build Fails

**Symptoms:**
```
error during build:
[vite]: Rollup failed to resolve import
```

**Solution:**
```bash
# Check for missing imports in code
# Common issue: import from non-existent files

# Reinstall dependencies
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

---

## 🔥 Emergency Recovery

### Complete Reset (Docker)

```bash
# Stop everything
docker-compose down -v

# Remove all images
docker rmi fognetx-backend fognetx-frontend

# Remove unused data
docker system prune -a --volumes

# Fresh start
docker-compose up -d --build
```

### Complete Reset (Local)

**Windows:**
```powershell
# Delete everything except code
Remove-Item -Recurse -Force backend\fognetx.db
Remove-Item -Recurse -Force frontend\node_modules
Remove-Item -Recurse -Force backend\__pycache__

# Reinstall
cd backend
pip install -r requirements.txt
python migrate.py

cd ..\frontend
npm install
```

**Linux/Mac:**
```bash
rm -rf backend/fognetx.db frontend/node_modules backend/__pycache__

cd backend
pip3 install -r requirements.txt
python3 migrate.py

cd ../frontend
npm install
```

---

## 📞 Get Help

### Before Asking for Help:

1. ✅ Check this troubleshooting guide
2. ✅ Search closed GitHub issues
3. ✅ Check logs for error messages
4. ✅ Try complete reset (above)

### Provide This Info:

```
Operating System: Windows 11 / Ubuntu 22.04 / macOS 13
Setup Method: Docker / Local
Python Version: 3.10.5
Node Version: 18.12.0
Docker Version: 20.10.17 (if using Docker)

Error Message:
[paste full error here]

Steps to Reproduce:
1. Did this
2. Did that
3. Error appeared

Logs:
[paste relevant logs]
```

---

## 📊 Diagnostic Commands

### Check All Services Status

**Docker:**
```bash
docker-compose ps
docker stats
```

**Local:**
```bash
# Backend
curl http://localhost:8000/api/data

# Frontend
curl http://localhost:3000

# MQTT
mosquitto_sub -h localhost -t "fognetx/#" -C 1
```

### View Logs

**Docker:**
```bash
docker logs fognetx-backend
docker logs fognetx-frontend
docker logs fognetx-mqtt
```

**Local:**
```bash
# Backend logs in console
# Frontend logs in browser console (F12)
```

---

**Still stuck? Contact support! 📧**

# 🎯 Your FOGNET-X Production Setup - Quick Reference

## Current Configuration Summary

---

## 🌐 **Your Domain & Access**

| Service | URL/Address | Port | Protocol |
|---------|-------------|------|----------|
| **Dashboard** | https://fognetx.duckdns.org | 443 (HTTPS) | Web |
| **MQTT Broker** | fognetx.duckdns.org | 1883 | TCP MQTT |
| **MQTT WebSocket** | wss://fognetx.duckdns.org/mqtt | 9001 | WebSocket |
| **Backend API** | https://fognetx.duckdns.org/api/* | 443 | HTTPS |

---

## 🔧 **Configuration Files Location**

```bash
# On Oracle Server:
/home/opc/FOGNET-X/
├── docker-compose.yml              # Service definitions
├── backend/.env                    # Environment variables
├── nginx_production.conf           # Nginx config (ready to use)
├── mqtt/config/mosquitto.conf     # MQTT broker config
└── backend/fognetx.db             # SQLite database (auto-created)

# Nginx Config:
/etc/nginx/sites-available/fognetx
/etc/nginx/sites-enabled/fognetx

# SSL Certificates:
/etc/letsencrypt/live/fognetx.duckdns.org/fullchain.pem
/etc/letsencrypt/live/fognetx.duckdns.org/privkey.pem
```

---

## 📝 **Update ESP/Firmware Code**

### **In ALL Arduino Files:**

Change this line:
```cpp
// OLD (local network only)
const char* mqtt_server = "10.136.75.54";

// NEW (production - works from anywhere!)
const char* mqtt_server = "fognetx.duckdns.org";
```

**Files to update:**
- `firmware/esp8266_factory_node.ino` → Line 25
- `firmware/esp32_complete_node.ino` → Line 58
- `wokwi_simulator.ino` → Line 20
- `arduino_factory_node_v2.ino` → Line 18

### **In Python Scripts:**

```python
# test_mqtt_device.py
MQTT_BROKER = "fognetx.duckdns.org"  # Changed from "localhost"

# check_devices.py
# No change needed (connects to local database)
```

---

## 🚀 **Deployment Commands**

### **Quick Deploy:**
```bash
cd ~/FOGNET-X

# Update Nginx config
sudo cp nginx_production.conf /etc/nginx/sites-available/fognetx
sudo ln -sf /etc/nginx/sites-available/fognetx /etc/nginx/sites-enabled/fognetx
sudo nginx -t
sudo systemctl reload nginx

# Start Docker services
docker-compose up -d

# Check status
docker-compose ps
docker ps
```

### **View Logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f fogcore
docker-compose logs -f backend

# Nginx logs
sudo tail -f /var/log/nginx/fognetx_access.log
sudo tail -f /var/log/nginx/fognetx_error.log
```

### **Restart Services:**
```bash
# Restart all
docker-compose restart

# Restart specific
docker-compose restart fogcore
docker-compose restart backend
docker-compose restart mqtt
```

---

## 🔐 **Firewall & Security Rules**

### **Oracle Cloud Console → Security List → Ingress Rules:**

| Port Range | Protocol | Source CIDR | Description |
|------------|----------|-------------|-------------|
| 22 | TCP | 0.0.0.0/0 | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP (redirects to HTTPS) |
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 1883 | TCP | 0.0.0.0/0 | MQTT (ESP devices) |
| 9001 | TCP | 0.0.0.0/0 | MQTT over WebSocket |

### **Server Firewall (UFW):**
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 1883/tcp
sudo ufw allow 9001/tcp
sudo ufw enable
```

---

## 🧪 **Testing Checklist**

### **Test 1: Dashboard Access**
```
Open browser → https://fognetx.duckdns.org/dashboard
Expected: Dashboard loads with HTTPS padlock
```

### **Test 2: API Endpoint**
```bash
curl https://fognetx.duckdns.org/api/data
Expected: JSON response with sensor data
```

### **Test 3: MQTT Connection**
```bash
telnet fognetx.duckdns.org 1883
Expected: Connected to Mosquitto broker
```

### **Test 4: Device Registration**
```bash
# Run Python simulator
python test_mqtt_device.py

# Check dashboard
http://fognetx.duckdns.org/dashboard
Expected: Device appears and data updates
```

---

## 📊 **Service Architecture**

```
Internet
    ↓
fognetx.duckdns.org (DuckDNS Dynamic DNS)
    ↓
Oracle Cloud Firewall (Ports: 80, 443, 1883, 9001)
    ↓
Nginx Reverse Proxy (SSL Termination)
    ├─→ Frontend:3000 (React Dashboard)
    ├─→ Backend:8000 (Flask/FastAPI API)
    └─→ MQTT:9001 (WebSocket)
            ↓
        Mosquitto Broker:1883
            ↓
        Fog Core Service
            ├─→ Auto-register devices
            ├─→ Process sensor data
            ├─→ Trigger alerts
            └─→ Store in SQLite
                    ↓
                Dashboard displays data
```

---

## ⚠️ **Common Issues & Quick Fixes**

### **"Site Can't Be Reached"**
```bash
# Check Docker is running
docker ps

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check firewall
sudo ufw status
```

### **"MQTT Connection Failed"**
```bash
# Check MQTT broker
docker exec -it fognetx-mqtt mosquitto_sub -v -t '#'

# Check port listening
sudo netstat -tulpn | grep 1883

# Test locally
telnet localhost 1883
```

### **"SSL Certificate Error"**
```bash
# Check cert expiry
sudo certbot certificates

# Renew if needed
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx
```

### **"Device Not Registering"**
```bash
# Check device_id in payload
docker logs -f fognetx-fogcore | grep "device_id"

# Verify MQTT topic
docker exec -it fognetx-mqtt mosquitto_sub -v -t 'factory/sensor/data'

# Check database
sqlite3 /data/fognetx.db "SELECT * FROM devices;"
```

---

## 🔄 **Update Workflow**

When you make code changes:

```bash
# 1. Pull latest code (if using Git)
cd ~/FOGNET-X
git pull origin main

# 2. Rebuild containers
docker-compose down
docker-compose up -d --build

# 3. Check logs
docker-compose logs -f fogcore

# 4. Test on dashboard
https://fognetx.duckdns.org/dashboard
```

---

## 💾 **Backup Strategy**

### **Daily Database Backup:**
```bash
# Create backup script
nano ~/backup_db.sh

#!/bin/bash
DATE=$(date +%Y%m%d)
cp ~/FOGNET-X/backend/fognetx.db ~/backups/fognetx_$DATE.db
find ~/backups -name "*.db" -mtime +30 -delete

# Schedule daily
crontab -e
0 3 * * * /home/opc/backup_db.sh
```

### **Manual Backup:**
```bash
# Stop services
docker-compose down

# Copy database
cp ~/FOGNET-X/backend/fognetx.db ~/backups/fognetx_manual_$(date +%Y%m%d).db

# Restart
docker-compose up -d
```

---

## 📈 **Monitoring Commands**

```bash
# Real-time resource usage
watch -n 2 'docker stats --no-stream'

# Check disk space
df -h

# Check memory
free -h

# Check CPU
htop

# View recent logs
docker-compose logs --tail=100

# Follow error logs
tail -f /var/log/nginx/fognetx_error.log
```

---

## 🎯 **Production Checklist**

Before going live:

- [ ] SSL certificate valid (check with `sudo certbot certificates`)
- [ ] DuckDNS domain resolving to Oracle IP
- [ ] Oracle security rules configured
- [ ] UFW firewall enabled
- [ ] All Docker containers running
- [ ] Database backed up
- [ ] Logs show no errors
- [ ] Test device connects successfully
- [ ] Dashboard accessible via HTTPS
- [ ] Email/Telegram alerts configured
- [ ] Monitoring scripts running

---

## 📞 **Emergency Contacts**

```bash
# Stop everything
docker-compose down

# Start everything
docker-compose up -d

# Emergency restart
sudo systemctl restart nginx
docker-compose restart

# View all containers
docker ps -a

# Cleanup old containers
docker system prune -a
```

---

## 🎉 **Success Criteria**

✅ Dashboard loads at `https://fognetx.duckdns.org`  
✅ HTTPS padlock shows in browser  
✅ ESP devices connect to `fognetx.duckdns.org:1883`  
✅ Devices auto-register automatically  
✅ Sensor data appears on dashboard  
✅ Alerts trigger when thresholds exceeded  
✅ Logs show no critical errors  
✅ System runs 24/7 without issues  

---

**🚀 You're production-ready!**

All set with:
- ✅ Custom domain (DuckDNS)
- ✅ SSL encryption (Let's Encrypt)
- ✅ Global accessibility
- ✅ Auto device registration
- ✅ Real-time monitoring
- ✅ Alert system
- ✅ Production-grade security

**Just upload firmware to ESP devices and watch them appear on dashboard!** 🎉

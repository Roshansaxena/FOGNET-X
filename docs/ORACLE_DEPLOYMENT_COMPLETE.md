# 🚀 FOGNET-X Oracle Cloud Production Deployment

## Complete Setup with DuckDNS & SSL

---

## 📋 **Your Current Setup**

✅ **Domain:** `fognetx.duckdns.org`  
✅ **SSL:** Let's Encrypt  
✅ **Nginx:** Reverse proxy configured  
✅ **Frontend:** Port 3000  
✅ **Backend:** Port 8000  

---

## 🔧 **Step-by-Step Update Guide**

### **Step 1: SSH into Oracle Server**

```bash
ssh -i /path/to/key.pem opc@YOUR_ORACLE_IP
```

---

### **Step 2: Update Nginx Configuration**

#### **Backup Old Config:**
```bash
sudo cp /etc/nginx/sites-available/fognetx /etc/nginx/sites-available/fognetx.backup
sudo cp /etc/nginx/sites-enabled/fognetx /etc/nginx/sites-enabled/fognetx.backup
```

#### **Replace with New Config:**
```bash
sudo nano /etc/nginx/sites-available/fognetx
```

Paste the contents from `nginx_production.conf` (created in this directory).

#### **Enable Site:**
```bash
# Remove old symlink if exists
sudo rm /etc/nginx/sites-enabled/fognetx

# Create new symlink
sudo ln -s /etc/nginx/sites-available/fognetx /etc/nginx/sites-enabled/fognetx

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### **Step 3: Update Docker Compose for Production**

Create production-ready docker-compose.yml:

```yaml
version: '3.8'

services:
  # MQTT Broker (Mosquitto)
  mqtt:
    image: eclipse-mosquitto:2
    container_name: fognetx-mqtt
    ports:
      - "1883:1883"   # TCP MQTT (for ESP devices)
      - "9001:9001"   # WebSocket MQTT (for browser clients)
    volumes:
      - ./mqtt/config:/mosquitto/config
      - mqtt_data:/mosquitto/data
    restart: unless-stopped
    networks:
      - fognetx-network

  # Fog Core (MQTT Processing)
  fogcore:
    build: ./backend
    container_name: fognetx-fogcore
    depends_on:
      - mqtt
    volumes:
      - sqlite_data:/data
      - ./backend/services:/app/services
      - ./backend/core:/app/core
    environment:
      - DB_PATH=/data/fognetx.db
      - FOG_NODE_IP=${ORACLE_PUBLIC_IP}
    env_file:
      - ./backend/.env
    command: ["python", "-m", "services.mqtt_service"]
    restart: unless-stopped
    networks:
      - fognetx-network

  # Backend API
  backend:
    build: ./backend
    container_name: fognetx-backend
    depends_on:
      - mqtt
      - fogcore
    volumes:
      - sqlite_data:/data
      - ./backend:/app
    environment:
      - DB_PATH=/data/fognetx.db
      - FLASK_ENV=production
    env_file:
      - ./backend/.env
    expose:
      - "8000"
    restart: unless-stopped
    networks:
      - fognetx-network

  # Frontend Dashboard (if using React/Vue)
  frontend:
    build: ./frontend
    container_name: fognetx-frontend
    volumes:
      - ./frontend/build:/usr/share/nginx/html
    expose:
      - "3000"
    restart: unless-stopped
    networks:
      - fognetx-network

volumes:
  sqlite_data:
  mqtt_data:

networks:
  fognetx-network:
    driver: bridge
```

---

### **Step 4: Configure Environment Variables**

Create `.env` file in backend directory:

```bash
cd ~/FOGNET-X/backend
nano .env
```

Add these variables:

```env
# ===========================================
# DATABASE
# ===========================================
DB_PATH=/data/fognetx.db

# ===========================================
# EMAIL ALERTS
# ===========================================
EMAIL_SENDER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_RECEIVER=receiver_email@gmail.com

# ===========================================
# TELEGRAM ALERTS
# ===========================================
TELEGRAM_TOKEN=your_bot_token_from_botfather
TELEGRAM_CHAT_ID=your_chat_id

# ===========================================
# FOG NODE CONFIGURATION
# ===========================================
FOG_NODE_IP=YOUR_ORACLE_PUBLIC_IP
MQTT_PORT=1883
HTTP_PORT=8000
WEBSOCKET_PORT=9001

# ===========================================
# SECURITY
# ===========================================
SECRET_KEY=your_secret_key_here
JWT_EXPIRATION=3600

# ===========================================
# ORACLE CLOUD SPECIFIC
# ===========================================
ORACLE_PUBLIC_IP=YOUR_ORACLE_PUBLIC_IP
DOMAIN_NAME=fognetx.duckdns.org
```

---

### **Step 5: Configure Mosquitto MQTT Broker**

Create Mosquitto configuration:

```bash
mkdir -p ~/FOGNET-X/mqtt/config
nano ~/FOGNET-X/mqtt/config/mosquitto.conf
```

Add this config:

```conf
# Listener 1883 - Standard MQTT (for ESP devices)
listener 1883
allow_anonymous true
persistence true
persistence_location /mosquitto/data/

# Listener 9001 - WebSocket MQTT (for browser clients via Nginx)
listener 9001
protocol websockets
allow_anonymous true

# Logging
log_dest stdout
log_type error
log_type warning
log_type notice
log_type information

# Connection limits
max_connections 100
max_inflight_messages 20
max_queued_messages 100
```

---

### **Step 6: Update Oracle Security Rules**

Login to Oracle Cloud Console → Networking → Security List → Add Ingress Rules:

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| 80 | TCP | 0.0.0.0/0 | HTTP (redirect to HTTPS) |
| 443 | TCP | 0.0.0.0/0 | HTTPS traffic |
| 1883 | TCP | 0.0.0.0/0 | MQTT (ESP devices) |
| 9001 | TCP | 0.0.0.0/0 | MQTT over WebSocket |

**In Oracle Console:**
```
Ingress Rules:
- Source CIDR: 0.0.0.0/0
- Destination Port Range: 1883
- Protocol: TCP

- Source CIDR: 0.0.0.0/0
- Destination Port Range: 9001
- Protocol: TCP
```

---

### **Step 7: Update Server Firewall**

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow MQTT
sudo ufw allow 1883/tcp
sudo ufw allow 9001/tcp

# Check status
sudo ufw status verbose
```

---

### **Step 8: Start All Services**

```bash
cd ~/FOGNET-X

# Stop any running containers
docker-compose down

# Build and start
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

Expected output:
```
NAME                 STATUS          PORTS
fognetx-mqtt         Up              0.0.0.0:1883->1883/tcp, 0.0.0.0:9001->9001/tcp
fognetx-fogcore      Up              
fognetx-backend      Up              8000/tcp
fognetx-frontend     Up              3000/tcp
```

---

### **Step 9: Verify Deployment**

#### **Test 1: Check Nginx**
```bash
sudo nginx -t
sudo systemctl status nginx
```

#### **Test 2: Check Docker**
```bash
docker ps
docker-compose logs fogcore
docker-compose logs backend
```

#### **Test 3: Access Dashboard**
Open browser:
```
https://fognetx.duckdns.org
```

Should show dashboard with HTTPS!

#### **Test 4: Test MQTT**
```bash
# Test MQTT port
telnet YOUR_ORACLE_IP 1883

# Should connect successfully
```

---

## 🎯 **Update ESP/Firmware Code**

### **For All ESP Devices:**

Update MQTT server in ALL firmware files:

```cpp
// Before
const char* mqtt_server = "10.136.75.54";

// After (use your DuckDNS domain!)
const char* mqtt_server = "fognetx.duckdns.org";
const int mqtt_port = 1883;
```

**Files to update:**
- `firmware/esp8266_factory_node.ino`
- `firmware/esp32_complete_node.ino`
- `wokwi_simulator.ino`
- `test_mqtt_device.py`

---

## 🌐 **Access URLs After Deployment**

| Service | URL | Notes |
|---------|-----|-------|
| **Dashboard** | `https://fognetx.duckdns.org` | Main interface |
| **API** | `https://fognetx.duckdns.org/api/*` | REST API |
| **MQTT Broker** | `fognetx.duckdns.org:1883` | For ESP devices |
| **MQTT WebSocket** | `wss://fognetx.duckdns.org/mqtt` | For browser clients |
| **Health Check** | `https://fognetx.duckdns.org/health` | Returns "OK" |

---

## 🔐 **Security Enhancements**

### **1. Enable Automatic SSL Renewal:**

```bash
# Create renewal script
sudo nano /usr/local/bin/renew-certs.sh

#!/bin/bash
certbot renew --quiet
systemctl reload nginx

# Make executable
sudo chmod +x /usr/local/bin/renew-certs.sh

# Add to crontab (runs daily at 3am)
sudo crontab -e
0 3 * * * /usr/local/bin/renew-certs.sh
```

### **2. Secure MQTT (Optional):**

If you want authentication:

```bash
# Generate password file
docker exec -it fognetx-mqtt mosquitto_passwd -c /mosquitto/config/passwd admin

# Update mosquitto.conf
nano ~/FOGNET-X/mqtt/config/mosquitto.conf

# Add:
allow_anonymous false
password_file /mosquitto/config/passwd

# Restart MQTT
docker-compose restart mqtt
```

Update ESP code with credentials:
```cpp
client.connect(DEVICE_ID, "admin", "your_password");
```

### **3. Fail2Ban Protection:**

```bash
# Install
sudo apt install fail2ban -y

# Create jail for Nginx
sudo nano /etc/fail2ban/jail.local

[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/*error.log
maxretry = 3
bantime = 3600

# Restart
sudo systemctl restart fail2ban
```

---

## 📊 **Monitoring & Maintenance**

### **Check Logs:**
```bash
# Nginx
sudo tail -f /var/log/nginx/fognetx_access.log
sudo tail -f /var/log/nginx/fognetx_error.log

# Docker
docker-compose logs -f fogcore
docker-compose logs -f backend

# Real-time monitoring
watch -n 2 'docker stats --no-stream'
```

### **Backup Database:**
```bash
# Create backup script
nano ~/backup_fognetx.sh

#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp ~/FOGNET-X/backend/fognetx.db ~/backups/fognetx_backup_$DATE.db
find ~/backups -name "*.db" -mtime +7 -delete

# Schedule daily backups
crontab -e
0 2 * * * /home/opc/backup_fognetx.sh
```

---

## ⚠️ **Troubleshooting**

### **Issue: Can't Access via HTTPS**

**Solution:**
```bash
# Check SSL certs exist
ls -la /etc/letsencrypt/live/fognetx.duckdns.org/

# Check Nginx config
sudo nginx -t

# Check firewall
sudo ufw status

# Check Oracle security rules (in web console)
```

### **Issue: MQTT Not Connecting**

**Solution:**
```bash
# Check MQTT broker
docker exec -it fognetx-mqtt mosquitto_sub -v -t '#'

# Check port is listening
sudo netstat -tulpn | grep 1883

# Test locally
telnet localhost 1883
```

### **Issue: DuckDNS Not Updating**

**Solution:**
Setup DuckDNS updater on Oracle:

```bash
# Create script
nano ~/duckdns_update.sh

#!/bin/bash
echo url="https://www.duckdns.org/update?domains=fognetx&token=YOUR_TOKEN&ip=" | curl -k -o ~/duckdns.log -K -

# Make executable
chmod +x ~/duckdns_update.sh

# Run every 5 minutes
crontab -e
*/5 * * * * /home/opc/duckdns_update.sh
```

---

## ✅ **Deployment Checklist**

- [ ] Nginx config updated with new conf
- [ ] SSL certificates valid
- [ ] Docker Compose services running
- [ ] Oracle security rules added (ports 80, 443, 1883, 9001)
- [ ] Server firewall configured
- [ ] `.env` file created with all variables
- [ ] Mosquitto configured
- [ ] Dashboard accessible via https://fognetx.duckdns.org
- [ ] MQTT accessible on port 1883
- [ ] ESP firmware updated with new MQTT server
- [ ] Logs show no errors
- [ ] Backup system configured

---

## 🎉 **You're Done!**

### **Access Your Production System:**

**Dashboard:**
```
https://fognetx.duckdns.org
```

**MQTT Broker (for devices):**
```
Host: fognetx.duckdns.org
Port: 1883
Protocol: MQTT
```

**All devices will auto-register and appear on dashboard!**

---

## 📞 **Quick Commands Reference**

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Check resource usage
docker stats
htop

# Renew SSL manually
sudo certbot renew --dry-run

# Test Nginx
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check DuckDNS IP
curl https://fognetx.duckdns.org/dynamic.php
```

---

**🚀 Your FOGNET-X is now production-ready with SSL, custom domain, and global accessibility!**

All ESP devices can connect via `fognetx.duckdns.org:1883` and will auto-register automatically! 🎉

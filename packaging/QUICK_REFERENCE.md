# 🚀 FOGNET-X Quick Reference Card

## Installation - One Command

### Linux/macOS
```bash
curl -fsSL https://raw.githubusercontent.com/your-org/fognetx/main/packaging/install.sh | sudo bash
```

### Windows (PowerShell)
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/your-org/fognetx/main/packaging/install.ps1" -OutFile install.ps1
.\install.ps1 -Action install
```

---

## Access Points

| Service | URL | Port |
|---------|-----|------|
| **Dashboard** | http://localhost:3000 | 3000 |
| **Backend API** | http://localhost:8000 | 8000 |
| **MQTT Broker** | localhost:1883 | 1883 |

---

## Management CLI Commands

```bash
fognetx status          # Check service status
fognetx start           # Start all services
fognetx stop            # Stop all services
fognetx restart         # Restart services
fognetx logs -f         # Follow logs (Ctrl+C to exit)
fognetx ps              # List running containers
fognetx config          # Edit configuration file
fognetx backup          # Create backup
fognetx restore ./bkp   # Restore from backup
fognetx update          # Update to latest version
fognetx doctor          # Run diagnostics
fognetx repair          # Fix common issues
```

---

## System Commands

### Linux (systemd)
```bash
sudo systemctl start fognetx
sudo systemctl stop fognetx
sudo systemctl restart fognetx
sudo systemctl status fognetx
sudo journalctl -u fognetx -f
```

### Windows (PowerShell)
```powershell
Start-Service FOGNET-X
Stop-Service FOGNET-X
Restart-Service FOGNET-X
Get-Service FOGNET-X
```

---

## Docker Commands

```bash
# View running containers
docker ps --filter name=fognetx

# View logs
docker-compose -C /etc/fognetx logs -f    # Linux
docker-compose -C C:\FOGNET-X\config logs -f  # Windows

# Restart specific service
docker-compose restart backend

# Stop all
docker-compose down

# Start all
docker-compose up -d
```

---

## Configuration Locations

### Linux
```
/etc/fognetx/.env              # Configuration file
/var/lib/fognetx/              # Data directory
/var/log/fognetx/              # Logs
/opt/fognetx/                  # Application files
```

### Windows
```
C:\FOGNET-X\config\.env        # Configuration file
C:\FOGNET-X\data\              # Data directory
C:\FOGNET-X\logs\              # Logs
C:\FOGNET-X\                   # Application files
```

---

## Common Tasks

### Change Ports
Edit `.env` file:
```bash
FRONTEND_PORT=3001
API_PORT=8001
```
Then restart: `fognetx restart`

### Enable Email Alerts
Edit `.env`:
```bash
ENABLE_EMAIL_ALERTS=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Backup Data
```bash
fognetx backup -o /path/to/backup
```

### View Live Sensor Data
```bash
fognetx logs -f | grep "sensor_data"
```

### Check Database
```bash
docker exec -it fognetx-backend sqlite3 /data/fognetx.db
sqlite> SELECT * FROM events ORDER BY id DESC LIMIT 10;
```

---

## Troubleshooting

### Services Won't Start
```bash
fognetx doctor      # Run diagnostics
fognetx repair      # Attempt repair
fognetx logs        # Check error messages
```

### Port Already in Use
```bash
# Find process using port
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# OR change port in .env
```

### Reset Everything
```bash
# Stop services
fognetx stop

# Remove all data (WARNING: destructive!)
sudo rm -rf /var/lib/fognetx/*
sudo rm -rf /var/log/fognetx/*

# Reconfigure
fognetx config

# Start fresh
fognetx start
```

---

## Build Packages

### Debian Package
```bash
cd packaging
./build_deb.sh 1.0.0
sudo dpkg -i debs/fognetx_1.0.0_amd64.deb
```

### RPM Package
```bash
cd packaging
./build_rpm.sh 1.0.0
sudo yum localinstall rpms/fognetx-1.0.0-1.*.rpm
```

---

## Uninstall

### Linux
```bash
sudo ./uninstall.sh
```

### Windows
```powershell
.\uninstall.ps1
```

---

## Help & Support

- **Installation Guide**: `packaging/INSTALLATION_GUIDE.md`
- **Documentation**: https://github.com/your-org/fognetx
- **Issues**: https://github.com/your-org/fognetx/issues
- **Quick Start**: `QUICK_START.md`

---

## Version Info

**Current**: 1.0.0  
**Release Date**: April 2026  
**Platforms**: Linux, Windows, macOS  
**Docker Required**: 20.10+  

---

**💡 Tip**: Keep this reference handy! Print it or bookmark it.

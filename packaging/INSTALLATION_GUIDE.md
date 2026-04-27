# 📦 FOGNET-X Installation Guide

## Universal Installation Package for Any System with Docker

FOGNET-X is now available as a universal installation package that can be deployed on **any system with Docker** - Linux, Windows, or macOS.

---

## 🎯 Quick Start

### One-Command Installation

#### **Linux/macOS:**
```bash
curl -fsSL https://raw.githubusercontent.com/your-org/fognetx/main/install.sh | sudo bash
```

#### **Windows (PowerShell):**
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/your-org/fognetx/main/install.ps1" -OutFile install.ps1
.\install.ps1 -Action install
```

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Methods](#installation-methods)
   - [Method 1: Universal Installer Script](#method-1-universal-installer-script)
   - [Method 2: Debian/Ubuntu Package](#method-2-debianubuntu-package-deb)
   - [Method 3: RPM Package (RHEL/CentOS/Fedora)](#method-3-rpm-package-rhelcentosfedora)
   - [Method 4: Manual Docker Compose](#method-4-manual-docker-compose)
3. [Post-Installation](#post-installation)
4. [Management CLI](#management-cli)
5. [Configuration](#configuration)
6. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 10GB free space
- **CPU**: 2 cores (4 cores recommended)

### Operating Systems Supported
- ✅ **Linux**: Ubuntu 20.04+, Debian 11+, CentOS 8+, RHEL 8+, Fedora 35+
- ✅ **Windows**: Windows 10/11 with Docker Desktop
- ✅ **macOS**: macOS 11+ with Docker Desktop

---

## Installation Methods

### Method 1: Universal Installer Script (Recommended)

The universal installer automatically detects your OS and installs FOGNET-X with optimal settings.

#### **Linux/macOS Installation:**

```bash
# Download and run installer
curl -fsSL https://raw.githubusercontent.com/your-org/fognetx/main/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh
```

#### **Windows Installation:**

```powershell
# Download installer
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/your-org/fognetx/main/install.ps1" -OutFile install.ps1

# Run installer (as Administrator)
.\install.ps1 -Action install
```

#### **Installer Features:**
- ✅ Automatic Docker detection and installation
- ✅ Pre-flight system checks
- ✅ Configuration file generation
- ✅ Service registration (systemd/Windows Service)
- ✅ Auto-start configuration
- ✅ Uninstaller included

#### **Custom Installation Options:**

**Linux/macOS:**
```bash
# Install to custom directory
sudo INSTALL_DIR=/opt/my-fognetx ./install.sh

# Generate config only
sudo ./install.sh generate-config

# Show help
./install.sh help
```

**Windows:**
```powershell
# Install to custom directory
.\install.ps1 -Action install -InstallDir "D:\FOGNET-X"

# Skip Docker check (if already installed)
.\install.ps1 -Action install -SkipDockerCheck

# Show help
.\install.ps1 -Action help
```

---

### Method 2: Debian/Ubuntu Package (.deb)

For Debian-based systems, FOGNET-X is available as a native `.deb` package.

#### **Build the Package:**

```bash
cd packaging
./build_deb.sh 1.0.0
```

#### **Install the Package:**

```bash
# Install .deb package
sudo dpkg -i packaging/debs/fognetx_1.0.0_amd64.deb

# Fix any dependency issues
sudo apt-get install -f
```

#### **Uninstall:**

```bash
sudo apt-get remove fognetx
# OR completely purge
sudo apt-get purge fognetx
```

---

### Method 3: RPM Package (RHEL/CentOS/Fedora)

For Red Hat-based systems, FOGNET-X is available as a native `.rpm` package.

#### **Build the Package:**

```bash
cd packaging
./build_rpm.sh 1.0.0
```

#### **Install the Package:**

```bash
# Using rpm
sudo rpm -ivh packaging/rpms/fognetx-1.0.0-1.*.rpm

# OR using yum (recommended)
sudo yum localinstall packaging/rpms/fognetx-1.0.0-1.*.rpm

# OR using dnf (Fedora)
sudo dnf install packaging/rpms/fognetx-1.0.0-1.*.rpm
```

#### **Uninstall:**

```bash
sudo rpm -e fognetx
# OR
sudo yum remove fognetx
```

---

### Method 4: Manual Docker Compose

For advanced users who want full control.

#### **Clone Repository:**

```bash
git clone https://github.com/your-org/fognetx.git
cd fognetx
```

#### **Configure:**

```bash
# Copy environment template
cp backend/.env.example .env

# Edit configuration
nano .env
```

#### **Start Services:**

```bash
docker-compose up -d
```

---

## Post-Installation

### Verify Installation

#### **Check Service Status:**

**Linux:**
```bash
sudo systemctl status fognetx
```

**Windows:**
```powershell
Get-Service FOGNET-X
```

#### **Access Dashboard:**

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **MQTT Broker**: localhost:1883

#### **Check Docker Containers:**

```bash
docker ps --filter name=fognetx
```

Expected output:
```
CONTAINER ID   IMAGE                    STATUS
abc123         fognetx-backend          Up 2 minutes
def456         fognetx-frontend         Up 2 minutes
ghi789         eclipse-mosquitto:2      Up 2 minutes
```

---

## Management CLI

FOGNET-X includes a powerful command-line interface for managing your installation.

### Installation

**Linux/macOS:**
```bash
sudo cp packaging/fognetx-cli.py /usr/local/bin/fognetx
sudo chmod +x /usr/local/bin/fognetx
```

**Windows:**
```powershell
Copy-Item packaging\fognetx-cli.py C:\FOGNET-X\fognetx.py
```

### Available Commands

```bash
fognetx --help              # Show all commands
fognetx status              # Check service status
fognetx start               # Start services
fognetx stop                # Stop services
fognetx restart             # Restart services
fognetx logs -f             # Follow logs in real-time
fognetx ps                  # List running processes
fognetx config              # Edit configuration
fognetx backup              # Create backup
fognetx restore ./backup    # Restore from backup
fognetx update              # Update to latest version
fognetx doctor              # Run diagnostics
fognetx repair              # Repair installation
```

### Examples

**View live logs:**
```bash
fognetx logs -f
```

**Create backup:**
```bash
fognetx backup -o /path/to/backup
```

**Run diagnostics:**
```bash
fognetx doctor
```

---

## Configuration

### Environment Variables

Edit `/etc/fognetx/.env` (Linux) or `C:\FOGNET-X\config\.env` (Windows):

```bash
# Database
DATABASE_URL=sqlite:///data/fognetx.db

# MQTT Settings
MQTT_BROKER=mqtt
MQTT_PORT=1883

# Alert Configuration
ENABLE_EMAIL_ALERTS=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ALERT_EMAIL=admin@example.com

# Telegram Alerts
ENABLE_TELEGRAM=true
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Network Settings
API_PORT=8000
FRONTEND_PORT=3000

# Risk Thresholds
RISK_THRESHOLD=0.6
BATTERY_THRESHOLD_LOW=20
```

### Apply Configuration Changes

```bash
# Restart services to apply changes
fognetx restart

# OR manually
sudo systemctl restart fognetx        # Linux
Restart-Service FOGNET-X              # Windows
```

---

## Troubleshooting

### Common Issues

#### **1. Docker Not Running**

**Symptom:** `ERROR: Cannot connect to the Docker daemon`

**Solution:**
```bash
# Linux
sudo systemctl start docker
sudo systemctl enable docker

# Windows
# Start Docker Desktop application
```

#### **2. Port Already in Use**

**Symptom:** `Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use`

**Solution:**
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# OR change port in .env
FRONTEND_PORT=3001
```

#### **3. Permission Denied**

**Symptom:** `permission denied while trying to connect to the Docker daemon socket`

**Solution (Linux):**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
```

#### **4. Services Won't Start**

**Check logs:**
```bash
fognetx logs --lines 200
```

**Repair installation:**
```bash
fognetx repair
```

#### **5. Database Locked**

**Symptom:** `database is locked`

**Solution:**
```bash
# Stop services
fognetx stop

# Remove database lock file
sudo rm /var/lib/fognetx/fognetx.db-shm
sudo rm /var/lib/fognetx/fognetx.db-wal

# Start services
fognetx start
```

---

## Uninstallation

### Linux/macOS

```bash
# Using uninstaller script
sudo ./uninstall.sh

# OR manual removal
sudo systemctl stop fognetx
sudo systemctl disable fognetx
sudo rm -rf /opt/fognetx
sudo rm -rf /etc/fognetx
sudo rm -rf /var/lib/fognetx
sudo rm -rf /var/log/fognetx
sudo rm /etc/systemd/system/fognetx.service
```

### Windows

```powershell
# Using PowerShell uninstaller
.\uninstall.ps1

# OR manual removal
Stop-Service FOGNET-X
nssm remove FOGNET-X confirm
Remove-Item -Path "C:\FOGNET-X" -Recurse -Force
```

---

## Getting Help

### Documentation
- [Quick Start Guide](../QUICK_START.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)
- [MQTT Topics Reference](../MQTT_TOPICS_REFERENCE.md)

### Support Channels
- **GitHub Issues**: https://github.com/your-org/fognetx/issues
- **Discussions**: https://github.com/your-org/fognetx/discussions
- **Email**: support@fognetx.io

### Community
- Join our Discord server
- Participate in community forums
- Attend monthly office hours

---

## Next Steps

After successful installation:

1. ✅ **Access Dashboard**: http://localhost:3000
2. ✅ **Configure Alerts**: Edit `.env` file with your credentials
3. ✅ **Connect Devices**: Program ESP8266/ESP32 devices
4. ✅ **Monitor Data**: Watch real-time sensor data
5. ✅ **Set Up Monitoring**: Configure alerts and notifications

---

## Version Information

**Current Version**: 1.0.0  
**Release Date**: 2026-04-03  
**Supported Platforms**: Linux, Windows, macOS  
**Docker Version**: 20.10+  
**Python Version**: 3.8+  

---

**🎉 You're ready to deploy FOGNET-X anywhere!**

For more information, visit [https://fognetx.io](https://fognetx.io)

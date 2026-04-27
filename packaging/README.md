# 📦 FOGNET-X Packaging & Distribution

This directory contains installation scripts and packaging tools for distributing FOGNET-X across multiple platforms.

---

## 🎯 Overview

FOGNET-X can now be installed as a **universal package** on any system with Docker, making it easy to deploy anywhere - from development laptops to production servers.

---

## 📁 Directory Structure

```
packaging/
├── install.sh                 # Universal installer for Linux/macOS
├── uninstall.sh               # Uninstaller for Linux/macOS
├── install.ps1                # Universal installer for Windows
├── uninstall.ps1              # Uninstaller for Windows
├── fognetx-cli.py             # Management CLI tool
├── build_deb.sh               # Debian package builder
├── build_rpm.sh               # RPM package builder
├── INSTALLATION_GUIDE.md      # Comprehensive installation documentation
└── README.md                  # This file
```

---

## 🚀 Quick Start

### Install on Linux/macOS

```bash
# One-line installation
curl -fsSL https://raw.githubusercontent.com/your-org/fognetx/main/packaging/install.sh | sudo bash
```

### Install on Windows

```powershell
# Download and run installer
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/your-org/fognetx/main/packaging/install.ps1" -OutFile install.ps1
.\install.ps1 -Action install
```

---

## 🛠️ For Developers

### Building Packages

#### **Debian Package (.deb)**

```bash
cd packaging
./build_deb.sh 1.0.0
```

Output: `debs/fognetx_1.0.0_amd64.deb`

#### **RPM Package (.rpm)**

```bash
cd packaging
./build_rpm.sh 1.0.0
```

Output: `rpms/fognetx-1.0.0-1.*.rpm`

### Using the Management CLI

```bash
# Install CLI tool
sudo cp fognetx-cli.py /usr/local/bin/fognetx
sudo chmod +x /usr/local/bin/fognetx

# Use CLI commands
fognetx status
fognetx logs -f
fognetx doctor
```

---

## 📋 Installation Methods

### Method 1: Universal Installer (Recommended)

Automatically detects OS, installs dependencies, and configures services.

**Pros:**
- ✅ Fully automated
- ✅ Cross-platform
- ✅ Includes pre-flight checks
- ✅ Creates systemd/Windows services

**Cons:**
- ❌ Requires internet connection

### Method 2: Native Packages

Use `.deb` or `.rpm` packages for native package manager integration.

**Pros:**
- ✅ System package manager integration
- ✅ Easy updates via apt/yum
- ✅ Dependency management

**Cons:**
- ❌ Platform-specific
- ❌ Requires build step

### Method 3: Manual Docker Compose

For advanced users who want full control.

**Pros:**
- ✅ Complete control over configuration
- ✅ Works in air-gapped environments
- ✅ Custom Docker networks

**Cons:**
- ❌ Manual setup required
- ❌ No automatic service management

---

## 🔧 Customization

### Changing Default Settings

Edit the `.env` file generated during installation:

```bash
# Location varies by platform
/etc/fognetx/.env          # Linux
C:\FOGNET-X\config\.env    # Windows
```

### Common Customizations

1. **Change Ports:**
   ```bash
   API_PORT=8080
   FRONTEND_PORT=8081
   ```

2. **Enable Alerts:**
   ```bash
   ENABLE_EMAIL_ALERTS=true
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

3. **Custom Data Directory:**
   ```bash
   DATA_DIR=/custom/path/data
   ```

---

## 🎯 Distribution Workflow

### For Release Managers

1. **Update Version:**
   ```bash
   # Update version in all files
   export VERSION="1.0.0"
   ```

2. **Build All Packages:**
   ```bash
   cd packaging
   ./build_deb.sh $VERSION
   ./build_rpm.sh $VERSION
   ```

3. **Test Installation:**
   ```bash
   # Test on clean VM/container
   docker run --rm -it ubuntu:22.04 bash
   # Inside container: install curl, download and run installer
   ```

4. **Publish:**
   - Upload `.deb` to package repository
   - Upload `.rpm` to package repository
   - Create GitHub release with assets
   - Update documentation

---

## 🧪 Testing

### Test on Clean Systems

Use Docker containers to test installation:

**Ubuntu:**
```bash
docker run --rm -it ubuntu:22.04 bash
# Inside container:
apt-get update && apt-get install -y curl sudo
curl -fsSL https://raw.githubusercontent.com/your-org/fognetx/main/packaging/install.sh | bash
```

**CentOS:**
```bash
docker run --rm -it centos:7 bash
# Inside container:
yum install -y curl sudo
curl -fsSL https://raw.githubusercontent.com/your-org/fognetx/main/packaging/install.sh | bash
```

### Automated Testing

Create test script:

```bash
#!/bin/bash
set -e

echo "Testing installation..."
./install.sh

echo "Running diagnostics..."
fognetx doctor

echo "Checking services..."
fognetx status

echo "Testing dashboard..."
curl -f http://localhost:3000 || exit 1

echo "All tests passed!"
```

---

## 📊 Platform Support Matrix

| Platform | Installer | .deb/.rpm | Service Mgmt | Notes |
|----------|-----------|-----------|--------------|-------|
| Ubuntu 20.04+ | ✅ | ✅ .deb | systemd | Recommended |
| Debian 11+ | ✅ | ✅ .deb | systemd | Recommended |
| CentOS 8+ | ✅ | ✅ .rpm | systemd | |
| RHEL 8+ | ✅ | ✅ .rpm | systemd | |
| Fedora 35+ | ✅ | ✅ .rpm | systemd | |
| macOS 11+ | ✅ | ❌ | launchd* | Docker Desktop required |
| Windows 10/11 | ✅ PowerShell | ❌ | NSSM | Docker Desktop required |

*macOS uses custom launchd scripts (not yet implemented)

---

## 🔐 Security Considerations

### Production Hardening

Before deploying to production:

1. **Change Default Secrets:**
   ```bash
   SECRET_KEY=$(openssl rand -hex 32)
   # Update in .env
   ```

2. **Enable Firewall Rules:**
   ```bash
   # Linux
   sudo ufw allow 3000/tcp
   sudo ufw allow 8000/tcp
   sudo ufw enable
   ```

3. **Use HTTPS:**
   - Configure reverse proxy (nginx/Apache)
   - Obtain SSL certificate (Let's Encrypt)
   - Enable SSL in configuration

4. **Restrict Database Access:**
   ```bash
   # Set proper permissions
   chmod 600 /var/lib/fognetx/fognetx.db
   chown root:root /var/lib/fognetx/fognetx.db
   ```

---

## 🐛 Troubleshooting

### Common Issues

**Installer fails with permission error:**
```bash
# Ensure running as root/administrator
sudo ./install.sh           # Linux
Run as Administrator        # Windows
```

**Docker not detected:**
```bash
# Verify Docker is running
systemctl status docker     # Linux
docker info                 # Any platform
```

**Service won't start:**
```bash
# Check logs
fognetx logs --lines 200

# Run diagnostics
fognetx doctor

# Attempt repair
fognetx repair
```

---

## 📝 Contributing

To contribute improvements to the packaging system:

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test on multiple platforms
5. Submit pull request

### Testing Requirements

Before merging, ensure:
- ✅ Works on Ubuntu 22.04
- ✅ Works on Windows 11
- ✅ All existing tests pass
- ✅ Documentation updated

---

## 📚 Additional Resources

- [Installation Guide](INSTALLATION_GUIDE.md) - Detailed installation instructions
- [Main README](../README.md) - Project overview
- [Quick Start](../QUICK_START.md) - Get started in 5 minutes
- [Deployment Guide](../DEPLOYMENT_GUIDE.md) - Production deployment

---

## 🎉 Success!

You now have a universal installation package that can be deployed **anywhere Docker runs**!

### Key Benefits

✅ **Cross-Platform**: Linux, Windows, macOS  
✅ **Easy Installation**: One command deploy  
✅ **Native Integration**: systemd/Windows services  
✅ **Management CLI**: Full control via command line  
✅ **Professional**: Production-ready packaging  
✅ **Maintainable**: Easy updates and removal  

---

**Made with ❤️ by Team FOGNET-X**

For questions or issues, visit: https://github.com/your-org/fognetx/issues

# 💿 CD/DVD Burning Guide for FOGNET-X Distribution

## Complete Guide for Creating Installation Media

---

## 📋 What You'll Need

### **Hardware:**
- ✅ Blank CD-R (700MB) or DVD-R (4.7GB)
- ✅ CD/DVD burner drive
- ✅ Computer with burning software

### **Software Options:**
- **Windows:** Built-in File Explorer, ImgBurn, or CDBurnerXP
- **Mac:** Built-in Disk Utility or Finder
- **Linux:** Brasero, K3b, or command-line `cdrecord`

---

## 🗂️ Step 1: Prepare Files for CD

### **Create Distribution Folder:**

```bash
# Create a clean distribution folder
mkdir FOGNET-X-CD
cd FOGNET-X-CD
```

### **Copy Essential Files:**

Create this structure:

```
FOGNET-X-CD/
├── README.txt                          # Quick start instructions
├── INSTALL_GUIDE.txt                   # Installation steps
├── fognet-x-source.zip                 # Complete source code
├── requirements/
│   └── python_requirements.txt         # Python dependencies list
├── docker/
│   └── docker-compose.yml              # Docker deployment
├── firmware/
│   └── esp8266_complete_node.ino       # Arduino firmware
└── scripts/
    ├── setup.bat                       # Windows setup script
    └── setup.sh                        # Linux/Mac setup script
```

### **Compress Source Code:**

```bash
# Go to project root
cd e:\FOGNET-X_Repo\FOGNET-X

# Create zip of entire project (exclude unnecessary files)
# On Windows (PowerShell):
Compress-Archive -Path * -DestinationPath "F:\FOGNET-X-CD\fognet-x-source.zip" -Force

# On Linux/Mac:
zip -r FOGNET-X-CD/fognet-x-source.zip . -x "node_modules/*" ".git/*" "__pycache__/*" "*.db"
```

---

## 📝 Step 2: Create Documentation Files

### **Create README.txt:**

```
========================================
FOGNET-X - Fog Computing IoT Platform
========================================

Welcome to FOGNET-X!

QUICK START:
------------
1. Install Python 3.8+ from https://python.org
2. Install Docker Desktop from https://docker.com
3. Extract fognet-x-source.zip
4. Open terminal/command prompt
5. Navigate to extracted folder
6. Run: docker-compose up -d
7. Open http://localhost:3000
8. Login: admin / admin123

FEATURES:
---------
✅ Real-time IoT device monitoring
✅ Fog/Cloud orchestration
✅ Live sensor data via WebSockets
✅ Device management dashboard
✅ Latency tracking
✅ Automated alerts (Email/Telegram)

SYSTEM REQUIREMENTS:
--------------------
- Python 3.8 or higher
- Docker Desktop
- 4GB RAM minimum
- 2GB disk space

SUPPORT:
--------
- Documentation: See INSTALL_GUIDE.txt
- Issues: Check GitHub repository
- Email: [your-email@example.com]

========================================
```

### **Create INSTALL_GUIDE.txt:**

Copy the content from `DEPLOYMENT_GUIDE.md` but in plain text format.

---

## 💿 Step 3: Burn to CD/DVD

### **Option A: Windows (Built-in)**

1. **Insert blank CD/DVD**
2. **Open File Explorer** → This PC → DVD Drive
3. **Drag and drop** the `FOGNET-X-CD` folder contents
4. **Click "Burn to disc"** in toolbar
5. **Choose burning speed:**
   - CD: 16x or 24x (recommended)
   - DVD: 8x or 16x (recommended)
6. **Click "Next"** → Wait for completion
7. **Verify disc** when prompted

### **Option B: Windows (ImgBurn - Free)**

1. **Download:** https://www.imgburn.com/
2. **Open ImgBurn** → Select "Write files/folders to disc"
3. **Add source folder:** Browse to `FOGNET-X-CD`
4. **Set destination:** Select your CD/DVD drive
5. **Configure:**
   - Write Speed: 16x (CD) or 8x (DVD)
   - Verification: ✅ Enable
   - Finalize Disc: ✅ Enable
6. **Click "Build"** → Wait for completion

### **Option C: Mac (Finder)**

1. **Insert blank CD/DVD**
2. **Open dialog:** Choose "Open Finder"
3. **Copy files** to the disc window
4. **Click "Burn"** in top-right corner
5. **Select speed:** Maximum available
6. **Wait for completion**

### **Option D: Linux (Command Line)**

```bash
# Install cdrtools if needed
sudo apt install cdrkit

# Create ISO image first
mkisofs -o fognet-x.iso -R -J -V "FOGNET-X" FOGNET-X-CD/

# Burn to CD/DVD
cdrecord -v speed=16 dev=/dev/cdrom fognet-x.iso

# Verify
md5sum fognet-x.iso
# Compare with disc md5
```

---

## ✅ Step 4: Verify Burned Disc

### **Test the Disc:**

1. **Eject and re-insert** the CD/DVD
2. **Browse files** to ensure all copied correctly
3. **Test extraction:**
   ```bash
   # Try extracting the zip
   unzip fognet-x-source.zip -d test_extract
   ```
4. **Verify documentation** is readable

### **Check File Integrity:**

```bash
# On Windows (PowerShell)
Get-FileHash fognet-x-source.zip -Algorithm SHA256

# On Linux/Mac
sha256sum fognet-x-source.zip
```

Save the hash value for verification!

---

## 📦 What to Include on CD

### **✅ MUST INCLUDE:**

| File/Folder | Size | Purpose |
|-------------|------|---------|
| `fognet-x-source.zip` | ~50MB | Complete source code |
| `README.txt` | 2KB | Quick start guide |
| `INSTALL_GUIDE.txt` | 10KB | Detailed installation |
| `docker/docker-compose.yml` | 2KB | Docker deployment |
| `firmware/esp8266_complete_node.ino` | 15KB | Arduino firmware |

### **✅ RECOMMENDED:**

| File/Folder | Size | Purpose |
|-------------|------|---------|
| `requirements/` | 5KB | Python dependencies list |
| `scripts/setup.bat` | 3KB | Windows auto-setup |
| `scripts/setup.sh` | 3KB | Linux/Mac auto-setup |
| `QUICK_START.md` | 8KB | Quick reference |

### **❌ DO NOT INCLUDE:**

| File/Folder | Reason |
|-------------|--------|
| `node_modules/` | Too large, regenerate with `npm install` |
| `__pycache__/` | Python cache, not needed |
| `.git/` | Version control, not needed for users |
| `*.db` | Database files, created on first run |
| `logs/` | Log files, not needed |
| `venv/` | Virtual environment, recreate locally |

---

## 🚀 Automated Setup Scripts

### **Create setup.bat (Windows):**

```batch
@echo off
echo ========================================
echo FOGNET-X Installation Wizard
echo ========================================
echo.

echo [1/4] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found!
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)
echo ✅ Python found!
echo.

echo [2/4] Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker not found!
    echo Please install Docker Desktop from https://docker.com
    pause
    exit /b 1
)
echo ✅ Docker found!
echo.

echo [3/4] Extracting source code...
powershell -command "Expand-Archive -Path 'fognet-x-source.zip' -DestinationPath '.' -Force"
echo ✅ Extraction complete!
echo.

echo [4/4] Starting FOGNET-X...
cd fognet-x-source
docker-compose up -d
echo.
echo ========================================
echo ✅ FOGNET-X is starting!
echo ========================================
echo.
echo Open http://localhost:3000 in your browser
echo Login: admin / admin123
echo.
echo For detailed setup, see INSTALL_GUIDE.txt
echo.
pause
```

### **Create setup.sh (Linux/Mac):**

```bash
#!/bin/bash

echo "========================================"
echo "FOGNET-X Installation Wizard"
echo "========================================"
echo ""

echo "[1/4] Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 not found!"
    echo "Please install Python 3.8+"
    exit 1
fi
echo "✅ Python found!"
echo ""

echo "[2/4] Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not found!"
    echo "Please install Docker from https://docker.com"
    exit 1
fi
echo "✅ Docker found!"
echo ""

echo "[3/4] Extracting source code..."
unzip -o fognet-x-source.zip
echo "✅ Extraction complete!"
echo ""

echo "[4/4] Starting FOGNET-X..."
cd fognet-x-source
docker-compose up -d
echo ""
echo "========================================"
echo "✅ FOGNET-X is starting!"
echo "========================================"
echo ""
echo "Open http://localhost:3000 in your browser"
echo "Login: admin / admin123"
echo ""
echo "For detailed setup, see INSTALL_GUIDE.txt"
echo ""
```

---

## 💡 Pro Tips

### **For Large Projects (>700MB):**

1. **Use DVD-R (4.7GB)** instead of CD-R (700MB)
2. **Split into multiple CDs:**
   - Disc 1: Source code
   - Disc 2: Documentation & firmware
   - Disc 3: Dependencies & tools

### **Compression Tips:**

```bash
# Better compression (smaller zip file)
# On Windows:
Compress-Archive -Path * -DestinationPath output.zip -CompressionLevel Optimal

# On Linux:
zip -9 -r fognet-x.zip .  # -9 = maximum compression
```

### **Label the Disc:**

Use a CD/DVD label maker or permanent marker:

```
┌─────────────────────────────┐
│  FOGNET-X v1.0             │
│  Fog Computing IoT Platform│
│                            │
│  Created: 2026-04-27       │
│  Login: admin/admin123     │
│                            │
│  Start: setup.bat or       │
│         docker-compose     │
└─────────────────────────────┘
```

---

## 🔍 Testing Before Distribution

### **Complete Test Checklist:**

- [ ] CD/DVD burns successfully
- [ ] All files readable after burn
- [ ] ZIP file extracts without errors
- [ ] README.txt is clear and accurate
- [ ] Setup script runs without errors
- [ ] Docker containers start successfully
- [ ] Dashboard loads at http://localhost:3000
- [ ] Login works with admin/admin123
- [ ] Simulator runs and shows data
- [ ] Documentation matches actual system

### **Test on Different Machines:**

1. **Test on Windows 10/11**
2. **Test on Mac (if possible)**
3. **Test on Linux (if possible)**
4. **Test on different hardware**

---

## 📊 CD vs USB vs Cloud

| Method | Capacity | Speed | Cost | Best For |
|--------|----------|-------|------|----------|
| **CD-R** | 700MB | Slow | $0.50 | Small projects, archives |
| **DVD-R** | 4.7GB | Medium | $1.00 | Medium projects |
| **USB Drive** | 32GB+ | Fast | $10+ | Large projects, reusable |
| **Cloud** | Unlimited | Fast | Free | Online distribution |

**Recommendation:** For FOGNET-X (~50MB compressed), CD-R is perfect!

---

## 🎯 Quick Burning Commands

### **Windows (PowerShell):**

```powershell
# Create ISO
oscdimg -n -o FOGNET-X-CD fognet-x.iso

# Burn ISO (requires PowerShell 5+)
Burn-DiskImage -ImagePath "fognet-x.iso"
```

### **Linux:**

```bash
# Create and burn in one command
mkisofs -o - -R -J FOGNET-X-CD/ | cdrecord -v speed=16 dev=/dev/cdrom -
```

### **Mac:**

```bash
# Create ISO
hdiutil makehybrid -o fognet-x.iso FOGNET-X-CD/ -iso -joliet

# Burn
hdiutil burn fognet-x.iso
```

---

## ⚠️ Important Notes

1. **Always use high-quality blank media** (Verbatim, Sony, TDK)
2. **Burn at slower speeds** for better reliability (16x for CD, 8x for DVD)
3. **Always verify** after burning
4. **Store discs** in cool, dry place away from sunlight
5. **Keep backup** of original files
6. **Test on multiple systems** before distribution

---

## 📞 Troubleshooting

### **Burn Failed:**
- Try slower burn speed
- Use different brand of CD/DVD
- Clean the burner lens
- Close other applications

### **Files Corrupted:**
- Re-download source files
- Check disk for scratches
- Try different CD/DVD drive
- Verify checksums before burning

### **Setup Script Fails:**
- Check if Python/Docker installed
- Run as Administrator (Windows)
- Check file permissions (Linux/Mac)
- Read error messages carefully

---

## ✅ Final Checklist

Before distributing CDs:

- [ ] All essential files included
- [ ] Documentation clear and complete
- [ ] Setup scripts tested
- [ ] Disc verified after burning
- [ ] Label applied to disc
- [ ] Test installation on clean machine
- [ ] Backup created
- [ ] SHA256 hash documented

---

**💿 Your FOGNET-X distribution CD is ready!**

Users can now:
1. Insert CD
2. Run `setup.bat` (Windows) or `setup.sh` (Linux/Mac)
3. Wait for automatic installation
4. Open browser to http://localhost:3000
5. Start using FOGNET-X!

**Total setup time: ~5 minutes** 🚀

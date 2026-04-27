# 🖥️ FOGNET-X .NET Applications

## Overview

FOGNET-X now includes **two powerful .NET applications** for enhanced management and monitoring on Windows and cross-platform systems.

---

## 📦 What's Included

### 1. **FOGNET-X Manager** (Windows Desktop App)
A professional Windows desktop application with system tray integration for managing FOGNET-X.

**Features:**
- ✅ Modern Windows Forms GUI
- ✅ System tray integration
- ✅ Real-time container monitoring
- ✅ One-click start/stop/restart
- ✅ Live log viewing
- ✅ Auto-refresh status every 5 seconds
- ✅ Minimizes to system tray
- ✅ Professional UI with colored indicators

### 2. **FOGNET-X CLI** (Cross-Platform Command Line)
A modern, cross-platform command-line interface built with .NET 8.

**Features:**
- ✅ Works on Windows, Linux, macOS
- ✅ Beautiful colored output
- ✅ Interactive tables and diagnostics
- ✅ Install as .NET global tool
- ✅ Full Docker orchestration support
- ✅ Built-in diagnostic tools

---

## 🚀 Quick Start

### **Install .NET SDK**

Download from: https://dotnet.microsoft.com/download

**Minimum Version:** .NET 8.0

---

## **FOGNET-X Manager (Windows Desktop)**

### Build from Source

```powershell
cd packaging\dotnet
.\build.ps1
```

### Run Application

```powershell
# Navigate to publish folder
cd packaging\dotnet\FogNetX.Manager\bin\Release\net8.0-windows\win-x64\publish

# Run application
.\FOGNETX.Manager.exe
```

### Features in Action

1. **System Tray Icon**
   - Right-click for quick actions
   - Start/Stop services without opening app
   - Double-click to open main window

2. **Main Dashboard**
   - Start/Stop/Restart buttons
   - Real-time container status
   - Live monitoring (updates every 5 seconds)
   - Color-coded status indicators

3. **Log Viewer**
   - View last 200 lines of logs
   - Copy to clipboard
   - Save logs to file
   - Refresh button

---

## **FOGNET-X CLI (Cross-Platform)**

### Install as Global Tool

```bash
# Build the package
cd packaging/dotnet
dotnet pack FogNetX.CLI/FogNetX.CLI.csproj -c Release

# Install globally
dotnet tool install --global fognetx.cli --add-source ./FogNetX.CLI/bin/Release/

# Or install from published package
dotnet tool install --global fognetx.cli --version 1.0.0
```

### Usage Examples

```bash
# Show help
fognetx --help

# Check service status
fognetx status

# Start services
fognetx start

# Stop services
fognetx stop

# Restart services
fognetx restart

# View logs (last 100 lines)
fognetx logs --tail 100

# Follow logs in real-time
fognetx logs --follow

# Run diagnostics
fognetx doctor
```

### Example Output

```
$ fognetx status
Checking FOGNET-X status...
✓ Connected to Docker

┌─────────────────────┬──────────┬─────────────────┐
│ Container           │ Status   │ Ports           │
├─────────────────────┼──────────┼─────────────────┤
│ fognetx-backend     │ Running  │ 8000->8000      │
│ fognetx-frontend    │ Running  │ 3000->80        │
│ fognetx-mqtt        │ Running  │ 1883->1883      │
└─────────────────────┴──────────┴─────────────────┘

Summary: 3/3 containers running
```

---

## 🛠️ Development

### Project Structure

```
packaging/dotnet/
├── FogNetX.Manager/          # Windows desktop app
│   ├── FogNetX.Manager.csproj
│   ├── Program.cs            # Entry point
│   ├── MainForm.cs           # Main window
│   ├── LogsForm.cs           # Log viewer
│   └── Services/
│       └── DockerService.cs  # Docker integration
│
├── FogNetX.CLI/              # Cross-platform CLI
│   ├── FogNetX.CLI.csproj
│   ├── Program.cs            # CLI commands
│   └── bin/                  # Build output
│
├── build.ps1                 # Build script
└── README.md                 # This file
```

### Build Commands

```bash
# Build everything
dotnet build

# Build Manager only
dotnet build FogNetX.Manager/FogNetX.Manager.csproj

# Build CLI only
dotnet build FogNetX.CLI/FogNetX.CLI.csproj

# Publish Manager as single-file exe
dotnet publish FogNetX.Manager/FogNetX.Manager.csproj \
  -c Release \
  -r win-x64 \
  --self-contained true \
  -p:PublishSingleFile=true

# Pack CLI as NuGet package
dotnet pack FogNetX.CLI/FogNetX.CLI.csproj -c Release
```

### Dependencies

**Manager (Windows):**
- Docker.DotNet (Docker API client)
- Microsoft.Extensions.DependencyInjection
- Serilog (Logging)
- Newtonsoft.Json

**CLI (Cross-platform):**
- System.CommandLine (CLI framework)
- Spectre.Console (Beautiful console output)
- Docker.DotNet
- Serilog

---

## 🎯 Use Cases

### **Scenario 1: Daily Operations (Windows)**

1. Open FOGNET-X Manager from Start Menu
2. See status at a glance (green = running)
3. Click "View Logs" to troubleshoot issues
4. Minimize to system tray for quick access

### **Scenario 2: Remote Management (SSH/Terminal)**

```bash
# SSH into server
ssh user@server

# Check status
fognetx status

# View recent logs
fognetx logs --tail 50

# Restart if needed
fognetx restart
```

### **Scenario 3: Development Workflow**

```bash
# Start development environment
fognetx start

# Monitor logs in real-time
fognetx logs --follow

# In another terminal, test API
curl http://localhost:8000/api/data

# Stop when done
fognetx stop
```

---

## 🔧 Configuration

### Manager Settings

The Manager automatically detects your FOGNET-X installation:

- **Config Location**: `C:\ProgramData\FOGNET-X\config\`
- **Docker Endpoint**: Auto-detected (named pipe on Windows)

### CLI Settings

Same as Manager, plus:

- **Tool Location**: `%USERPROFILE%\.dotnet\tools\` (Windows)
- **PATH**: Ensure tool directory is in PATH

---

## 🐛 Troubleshooting

### **Issue: Cannot connect to Docker**

**Solution:**
1. Ensure Docker Desktop is running
2. Check Docker settings → Enable Docker Compose
3. Verify Docker is accessible: `docker ps`

### **Issue: CLI command not found**

**Solution:**
```bash
# Add .NET tools to PATH
# Windows PowerShell:
$env:Path += ";$env:USERPROFILE\.dotnet\tools"

# Linux/macOS:
export PATH="$PATH:$HOME/.dotnet/tools"
```

### **Issue: Manager won't start**

**Solution:**
1. Check .NET 8.0 runtime is installed
2. Run as Administrator
3. Check logs in `logs/fognetx-manager-.log`

---

## 📊 Comparison

| Feature | Manager (GUI) | CLI | Python CLI |
|---------|--------------|-----|------------|
| Platform | Windows only | Cross-platform | Cross-platform |
| Interface | Graphical UI | Console | Console |
| System Tray | ✅ Yes | ❌ No | ❌ No |
| Real-time Monitoring | ✅ Yes | ❌ No | ❌ No |
| Scriptable | ❌ No | ✅ Yes | ✅ Yes |
| Installation | Single EXE | .NET tool | Python pip |
| Best For | Desktop users | DevOps/Admin | Developers |

---

## 🎨 Screenshots

### Manager Main Window
```
╔═══════════════════════════════════════════════╗
║  FOGNET-X Manager                             ║
╠═══════════════════════════════════════════════╣
║  [▶ Start] [⏹ Stop] [⟳ Restart] [↻ Refresh]  ║
║                                               ║
║  ┌─────────────────────────────────────────┐  ║
║  │ Containers                              │  ║
║  │ Running: 3/3                            │  ║
║  └─────────────────────────────────────────┘  ║
║                                               ║
║  Status: ✓ All services running               ║
╚═══════════════════════════════════════════════╝
```

### CLI Status Output
```
$ fognetx status
Checking FOGNET-X status...
✓ Connected to Docker

┌─────────────────────┬──────────┬─────────────────┐
│ Container           │ Status   │ Ports           │
├─────────────────────┼──────────┼─────────────────┤
│ fognetx-backend     │ Running  │ 8000->8000      │
│ fognetx-frontend    │ Running  │ 3000->80        │
│ fognetx-mqtt        │ Running  │ 1883->1883      │
└─────────────────────┴──────────┴─────────────────┘

Summary: 3/3 containers running
```

---

## 📝 Requirements

### **Manager (Windows)**
- Windows 10/11
- .NET 8.0 Runtime (included in published app)
- Docker Desktop for Windows
- Administrator privileges (for service control)

### **CLI (Cross-platform)**
- .NET 8.0 SDK (for building)
- .NET 8.0 Runtime (for running)
- Docker installed and running
- Docker Compose v2+

---

## 🚀 Advanced Features

### **Custom Docker Endpoints**

Edit configuration to use remote Docker:

```json
{
  "DockerEndpoint": "tcp://remote-server:2375"
}
```

### **Multiple Installations**

Manage multiple FOGNET-X instances:

```bash
# Set custom config directory
export FOGNETX_CONFIG="D:\FOGNET-X-Dev\config"
fognetx status
```

---

## 🎉 Benefits

✅ **Native Windows Experience** - Feels like a native Windows app  
✅ **No Browser Required** - Direct desktop access  
✅ **System Integration** - Taskbar, system tray, notifications  
✅ **Cross-Platform CLI** - Same tool everywhere  
✅ **Modern .NET** - Fast, reliable, well-maintained  
✅ **Professional UI** - Clean, intuitive interface  
✅ **Full Featured** - All management capabilities  

---

## 📚 Additional Resources

- [.NET Documentation](https://docs.microsoft.com/en-us/dotnet/)
- [Docker.DotNet](https://github.com/dotnet/Docker.DotNet)
- [Spectre.Console](https://spectreconsole.net/)
- [System.CommandLine](https://github.com/dotnet/command-line-api)

---

## 🆘 Getting Help

- **Documentation**: See main project README
- **Issues**: https://github.com/your-org/fognetx/issues
- **Discussions**: https://github.com/your-org/fognetx/discussions

---

**Made with ❤️ using .NET 8.0**  
*Version 1.0.0 - April 2026*

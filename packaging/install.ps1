# =============================================================================
# FOGNET-X Installer for Windows (PowerShell)
# =============================================================================
# One-command installation for FOGNET-X on Windows
# Requires: Docker Desktop for Windows, PowerShell 5.1+
# =============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "install",
    
    [Parameter(Mandatory=$false)]
    [string]$InstallDir = "C:\FOGNET-X",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipDockerCheck
)

$ErrorActionPreference = "Stop"

# =============================================================================
# Helper Functions
# =============================================================================

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Print-Banner {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════╗"
    Write-Host "║           FOGNET-X Installation Wizard                    ║"
    Write-Host "║        Fog Computing Platform for Industry 4.0            ║"
    Write-Host "╚═══════════════════════════════════════════════════════════╝"
    Write-Host ""
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

function Test-Administrator {
    $currentUser = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-DockerDesktop {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Warning-Custom "Docker not found in PATH"
        return $false
    }
    
    try {
        $dockerVersion = docker version --format "{{.Server.Version}}" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Docker Desktop found: $dockerVersion"
            return $true
        }
    } catch {
        Write-Warning-Custom "Docker Desktop is not running"
        return $false
    }
    
    return $false
}

function Install-DockerDesktop {
    Write-Info "Downloading Docker Desktop installer..."
    $installerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $installerPath = "$env:TEMP\DockerDesktopInstaller.exe"
    
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath
    
    Write-Info "Running Docker Desktop installer..."
    Start-Process -FilePath $installerPath -ArgumentList "install", "--quiet" -Wait
    
    Write-Success "Docker Desktop installed. Please restart your computer and run this script again."
}

# =============================================================================
# Directory Setup
# =============================================================================

function Setup-Directories {
    Write-Info "Creating installation directories..."
    
    $directories = @(
        $InstallDir,
        "$InstallDir\data",
        "$InstallDir\logs",
        "$InstallDir\config"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Success "Directories created"
}

# =============================================================================
# Configuration Generator
# =============================================================================

function Generate-Config {
    Write-Info "Generating configuration files..."
    
    $envContent = @"
# FOGNET-X Configuration
FLASK_ENV=production
SECRET_KEY=fognetx_secret_key_change_in_production
DATABASE_URL=sqlite:///data/fognetx.db

# MQTT Configuration
MQTT_BROKER=mqtt
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=

# Alert Configuration
ENABLE_EMAIL_ALERTS=false
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
ALERT_EMAIL=

# Telegram Alerts
ENABLE_TELEGRAM=false
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Network Configuration
FOG_NODE_IP=auto
API_PORT=8000
FRONTEND_PORT=3000

# Risk Thresholds
RISK_THRESHOLD=0.6
BATTERY_THRESHOLD_LOW=20
SIGNAL_STRENGTH_THRESHOLD=-85
NETWORK_LATENCY_THRESHOLD_MS=100
PACKET_LOSS_THRESHOLD_PCT=5

# SLA Configuration
SLA_FOG_MS=50
SLA_CLOUD_MS=1000
"@

    $envContent | Out-File -FilePath "$InstallDir\config\.env" -Encoding utf8
    
    # Copy docker-compose.yml
    if (Test-Path ".\docker-compose.yml") {
        Copy-Item ".\docker-compose.yml" "$InstallDir\config\" -Force
    }
    
    Write-Success "Configuration files generated"
}

# =============================================================================
# Download FOGNET-X
# =============================================================================

function Download-FOGNETX {
    Write-Info "Downloading FOGNET-X..."
    
    Set-Location $InstallDir
    
    # Check if running from source
    if (Test-Path "..\docker-compose.yml") {
        Write-Info "Installing from local source..."
        Copy-Item "..\backend" ".\backend" -Recurse -Force
        Copy-Item "..\frontend" ".\frontend" -Recurse -Force
        Copy-Item "..\docker-compose.yml" "." -Force
        Copy-Item "..\Dockerfile*" "." -Force
    } else {
        # Download from GitHub
        $githubUrl = "https://github.com/your-org/fognetx/archive/refs/tags/v1.0.0.zip"
        $zipFile = "$InstallDir\fognetx.zip"
        
        Write-Info "Downloading from GitHub..."
        Invoke-WebRequest -Uri $githubUrl -OutFile $zipFile
        
        Write-Info "Extracting archive..."
        Expand-Archive -Path $zipFile -DestinationPath $InstallDir -Force
        
        # Move files
        Move-Item "$InstallDir\fognetx-1.0.0\*" $InstallDir -Force
        Remove-Item "$InstallDir\fognetx-1.0.0" -Recurse -Force
        Remove-Item $zipFile -Force
    }
    
    Write-Success "FOGNET-X downloaded"
}

# =============================================================================
# Windows Service Setup (NSSM)
# =============================================================================

function Install-WindowsService {
    Write-Info "Setting up Windows service..."
    
    # Download NSSM (Non-Sucking Service Manager)
    $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
    $nssmZip = "$env:TEMP\nssm.zip"
    
    if (-not (Test-Path "$env:TEMP\nssm.exe")) {
        Invoke-WebRequest -Uri $nssmUrl -OutFile $nssmZip
        Expand-Archive -Path $nssmZip -DestinationPath "$env:TEMP\nssm" -Force
        Copy-Item "$env:TEMP\nssm\nssm-2.24\win64\nssm.exe" "C:\Windows\System32\nssm.exe" -Force
    }
    
    # Create batch file to start services
    $batchContent = @"
@echo off
cd /d $InstallDir\config
docker-compose up -d
"@
    $batchContent | Out-File -FilePath "$InstallDir\start_services.bat" -Encoding ascii
    
    $stopBatchContent = @"
@echo off
cd /d $InstallDir\config
docker-compose down
"@
    $stopBatchContent | Out-File -FilePath "$InstallDir\stop_services.bat" -Encoding ascii
    
    # Install service
    nssm install FOGNET-X "$InstallDir\start_services.bat"
    nssm set FOGNET-X DisplayName "FOGNET-X Fog Computing Platform"
    nssm set FOGNET-X Description "Fog Computing Platform for Industry 4.0 IoT orchestration"
    nssm set FOGNET-X Start SERVICE_AUTO_START
    nssm set FOGNET-X AppDirectory "$InstallDir"
    
    # Start service
    Start-Service -Name "FOGNET-X"
    
    Write-Success "Windows service installed and started"
}

# =============================================================================
# Start Services
# =============================================================================

function Start-Services {
    Write-Info "Starting FOGNET-X services..."
    
    Set-Location "$InstallDir\config"
    
    docker-compose up -d
    
    Write-Info "Waiting for services to initialize..."
    Start-Sleep -Seconds 10
    
    Write-Success "FOGNET-X services started"
}

# =============================================================================
# Post-Installation
# =============================================================================

function Post-Install {
    Write-Host ""
    Write-Success "╔═══════════════════════════════════════════════════════════╗"
    Write-Success "║         FOGNET-X Installation Complete! 🎉                ║"
    Write-Success "╚═══════════════════════════════════════════════════════════╝"
    Write-Host ""
    
    Write-Host "Services Status:"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Get-Service -Name "FOGNET-X" | Select-Object Name, Status, DisplayName | Format-Table -AutoSize
    
    Write-Host ""
    Write-Host "Access Points:"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host "  Frontend Dashboard: http://localhost:3000"
    Write-Host "  Backend API:        http://localhost:8000"
    Write-Host "  MQTT Broker:        localhost:1883"
    Write-Host ""
    
    Write-Host "Management Commands:"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host "  Start:      Start-Service FOGNET-X"
    Write-Host "  Stop:       Stop-Service FOGNET-X"
    Write-Host "  Restart:    Restart-Service FOGNET-X"
    Write-Host "  Status:     Get-Service FOGNET-X"
    Write-Host "  Logs:       docker-compose logs -f"
    Write-Host ""
    
    Write-Host "Configuration Location:"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host "  Install: $InstallDir"
    Write-Host "  Config:  $InstallDir\config"
    Write-Host "  Data:    $InstallDir\data"
    Write-Host "  Logs:    $InstallDir\logs"
    Write-Host ""
    
    Write-Host "Next Steps:"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host "  1. Edit $InstallDir\config\.env with your settings"
    Write-Host "  2. Configure alert credentials if needed"
    Write-Host "  3. Connect ESP8266/ESP32 devices"
    Write-Host "  4. Access dashboard at http://localhost:3000"
    Write-Host ""
}

# =============================================================================
# Main Installation Flow
# =============================================================================

function Main {
    Print-Banner
    
    switch ($Action) {
        "install" {
            Write-Info "Starting installation..."
            
            if (-not $SkipDockerCheck) {
                if (-not (Test-Administrator)) {
                    Write-Error-Custom "Please run as Administrator"
                    exit 1
                }
                
                if (-not (Test-DockerDesktop)) {
                    Write-Warning-Custom "Docker Desktop not detected"
                    $response = Read-Host "Would you like to install Docker Desktop? (y/n)"
                    if ($response -eq 'y') {
                        Install-DockerDesktop
                        exit 0
                    } else {
                        Write-Error-Custom "Docker Desktop is required. Installation aborted."
                        exit 1
                    }
                }
            }
            
            Setup-Directories
            Download-FOGNETX
            Generate-Config
            Install-WindowsService
            Start-Services
            Post-Install
            
            Write-Success "Installation completed successfully!"
        }
        
        "uninstall" {
            & "$InstallDir\uninstall.ps1"
        }
        
        "help" {
            Write-Host "FOGNET-X Installer Usage:"
            Write-Host "  .\install.ps1 -Action install    - Install FOGNET-X"
            Write-Host "  .\install.ps1 -Action uninstall  - Remove FOGNET-X"
            Write-Host "  .\install.ps1 -Action help       - Show this help"
            Write-Host ""
            Write-Host "Options:"
            Write-Host "  -InstallDir <path>  - Custom installation directory (default: C:\FOGNET-X)"
            Write-Host "  -SkipDockerCheck    - Skip Docker Desktop verification"
        }
        
        default {
            Write-Error-Custom "Unknown action: $Action"
            exit 1
        }
    }
}

# Run main function
Main

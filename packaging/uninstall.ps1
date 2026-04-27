# =============================================================================
# FOGNET-X Uninstaller for Windows (PowerShell)
# =============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$InstallDir = "C:\FOGNET-X"
)

$ErrorActionPreference = "Stop"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Print-Banner {
    Write-Host ""
    Write-Host "╔═══════════════════════════════════════════════════════════╗"
    Write-Host "║          FOGNET-X Uninstallation Wizard                   ║"
    Write-Host "╚═══════════════════════════════════════════════════════════╝"
    Write-Host ""
}

function Confirm-Uninstall {
    $response = Read-Host "Are you sure you want to uninstall FOGNET-X? [y/N]"
    if ($response -ne 'y' -and $response -ne 'Y') {
        return $false
    }
    return $true
}

function Stop-Services-Custom {
    Write-Info "Stopping FOGNET-X services..."
    
    try {
        $service = Get-Service -Name "FOGNET-X" -ErrorAction SilentlyContinue
        if ($service) {
            Stop-Service -Name "FOGNET-X" -Force
            Start-Sleep -Seconds 2
        }
    } catch {
        Write-Info "Service not running"
    }
    
    if (Test-Path "$InstallDir\config") {
        Set-Location "$InstallDir\config"
        docker-compose down 2>$null
    }
    
    Write-Success "Services stopped"
}

function Remove-WindowsService {
    Write-Info "Removing Windows service..."
    
    try {
        $service = Get-Service -Name "FOGNET-X" -ErrorAction SilentlyContinue
        if ($service) {
            nssm remove FOGNET-X confirm
            Write-Success "Windows service removed"
        }
    } catch {
        Write-Info "Service already removed"
    }
}

function Remove-Containers {
    Write-Info "Removing Docker containers..."
    
    docker rm -f $(docker ps -aq --filter name=fognetx) 2>$null
    docker volume rm $(docker volume ls -q --filter name=fognetx) 2>$null
    
    Write-Success "Containers removed"
}

function Remove-Directories {
    Write-Info "Removing installation directory..."
    
    if (Test-Path $InstallDir) {
        Remove-Item -Path $InstallDir -Recurse -Force
    }
    
    Write-Success "Directories removed"
}

function Cleanup {
    Write-Info "Cleaning up..."
    
    # Remove from PATH if added
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -like "*$InstallDir*") {
        $newPath = ($currentPath -split ';' | Where-Object { $_ -notlike "*$InstallDir*" }) -join ';'
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    }
    
    Write-Success "Cleanup completed"
}

function Post-Uninstall {
    Write-Host ""
    Write-Success "╔═══════════════════════════════════════════════════════════╗"
    Write-Success "║         FOGNET-X Uninstallation Complete!                 ║"
    Write-Success "╚═══════════════════════════════════════════════════════════╝"
    Write-Host ""
    Write-Host "FOGNET-X has been completely removed from your system."
    Write-Host ""
    Write-Host "To reinstall, run:"
    Write-Host "  .\install.ps1 -Action install"
    Write-Host ""
}

function Main {
    Print-Banner
    
    if (-not (Confirm-Uninstall)) {
        Write-Info "Uninstallation cancelled"
        exit 0
    }
    
    Stop-Services-Custom
    Remove-WindowsService
    Remove-Containers
    Remove-Directories
    Cleanup
    Post-Uninstall
    
    Write-Success "Uninstallation completed successfully!"
}

Main

# FOGNET-X CD Burning Script
# This script prepares and burns the CD/DVD

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FOGNET-X CD/DVD Burner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SourcePath = "E:\FOGNET-X_Repo\FOGNET-X"
$StagingPath = "$env:TEMP\FOGNET-X-CD-Staging"
$ExcludePatterns = @(
    "__pycache__",
    "*.pyc",
    "node_modules",
    ".git",
    ".vscode",
    ".idea",
    "*.log",
    "logs",
    "experiments",
    "_archive",
    "fognetx.db",
    "venv",
    ".venv",
    "env"
)

# Step 1: Create staging directory
Write-Host "[1/5] Creating staging directory..." -ForegroundColor Yellow
if (Test-Path $StagingPath) {
    Remove-Item -Recurse -Force $StagingPath
}
New-Item -ItemType Directory -Path $StagingPath | Out-Null

# Step 2: Copy files (excluding unnecessary ones)
Write-Host "[2/5] Copying files to staging..." -ForegroundColor Yellow

# Essential folders to include
$FoldersToCopy = @(
    "backend",
    "frontend",
    "docs",
    "scripts",
    "firmware"
)

$FilesToCopy = @(
    "docker-compose.yml",
    "Dockerfile",
    "Dockerfile.cloud",
    "README.md",
    "QUICK_START.md"
)

# Copy folders
foreach ($folder in $FoldersToCopy) {
    $source = Join-Path $SourcePath $folder
    $dest = Join-Path $StagingPath $folder
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $dest -Recurse -Force
        Write-Host "  ✓ Copied $folder" -ForegroundColor Green
    }
}

# Copy essential files
foreach ($file in $FilesToCopy) {
    $source = Join-Path $SourcePath $file
    $dest = Join-Path $StagingPath $file
    if (Test-Path $source) {
        Copy-Item -Path $source -Destination $dest -Force
        Write-Host "  ✓ Copied $file" -ForegroundColor Green
    }
}

# Copy CD distribution files
$cdDistPath = Join-Path $SourcePath "cd-distribution"
if (Test-Path $cdDistPath) {
    Get-ChildItem -Path $cdDistPath -File | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $StagingPath -Force
        Write-Host "  ✓ Copied $($_.Name)" -ForegroundColor Green
    }
}

# Step 3: Clean up unnecessary files in staging
Write-Host "[3/5] Cleaning up staging..." -ForegroundColor Yellow

foreach ($pattern in $ExcludePatterns) {
    $items = Get-ChildItem -Path $StagingPath -Recurse -Filter $pattern -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        Remove-Item -Recurse -Force $item.FullName -ErrorAction SilentlyContinue
    }
}

# Remove __pycache__ directories
Get-ChildItem -Path $StagingPath -Recurse -Directory -Filter "__pycache__" | ForEach-Object {
    Remove-Item -Recurse -Force $_.FullName -ErrorAction SilentlyContinue
}

Write-Host "  ✓ Cleanup complete" -ForegroundColor Green

# Step 4: Calculate size
Write-Host "[4/5] Calculating CD size..." -ForegroundColor Yellow

$size = (Get-ChildItem -Path $StagingPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($size / 1MB, 2)
$sizeGB = [math]::Round($size / 1GB, 2)

Write-Host "  Total size: $sizeMB MB ($sizeGB GB)" -ForegroundColor Cyan

if ($sizeGB -gt 0.7) {
    Write-Host "  ⚠️  Warning: Size exceeds standard CD (700MB)" -ForegroundColor Yellow
    Write-Host "  Consider using DVD or splitting into multiple CDs" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ Size OK for CD" -ForegroundColor Green
}

# Step 5: Burn to CD/DVD
Write-Host ""
Write-Host "[5/5] Ready to burn!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Staging location: $StagingPath" -ForegroundColor White
Write-Host "Total files: $((Get-ChildItem -Path $StagingPath -Recurse -File).Count)" -ForegroundColor White
Write-Host "Total size: $sizeMB MB" -ForegroundColor White
Write-Host ""

$burn = Read-Host "Burn to CD/DVD now? (Y/N)"

if ($burn -eq "Y" -or $burn -eq "y") {
    Write-Host ""
    Write-Host "Opening File Explorer to staging folder..." -ForegroundColor Cyan
    Write-Host "Please use your CD burning software to burn the contents." -ForegroundColor Cyan
    Write-Host ""
    
    # Open staging folder
    explorer.exe $StagingPath
    
    Write-Host "Instructions:" -ForegroundColor Yellow
    Write-Host "1. Insert blank CD/DVD" -ForegroundColor White
    Write-Host "2. Right-click in the folder" -ForegroundColor White
    Write-Host "3. Select 'Send to' -> 'DVD RW Drive' or 'CD RW Drive'" -ForegroundColor White
    Write-Host "4. Click 'Burn to disc'" -ForegroundColor White
    Write-Host "5. Follow the wizard" -ForegroundColor White
    Write-Host ""
    Write-Host "Alternative: Use software like:" -ForegroundColor Yellow
    Write-Host "  - Windows: Built-in burning" -ForegroundColor White
    Write-Host "  - ImgBurn (free)" -ForegroundColor White
    Write-Host "  - Nero Burning ROM" -ForegroundColor White
    Write-Host "  - CDBurnerXP (free)" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Staging folder is ready at: $StagingPath" -ForegroundColor Cyan
    Write-Host "You can burn it manually or zip it for distribution." -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CD Preparation Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Option to zip
$zip = Read-Host "Create ZIP archive for distribution? (Y/N)"

if ($zip -eq "Y" -or $zip -eq "y") {
    $zipPath = "$env:USERPROFILE\Desktop\FOGNET-X-Complete.zip"
    Write-Host ""
    Write-Host "Creating ZIP archive..." -ForegroundColor Yellow
    
    if (Test-Path $zipPath) {
        Remove-Item -Force $zipPath
    }
    
    Compress-Archive -Path "$StagingPath\*" -DestinationPath $zipPath -CompressionLevel Optimal
    
    Write-Host "✓ ZIP created at: $zipPath" -ForegroundColor Green
    Write-Host ""
    
    $openFolder = Read-Host "Open folder with ZIP? (Y/N)"
    if ($openFolder -eq "Y" -or $openFolder -eq "y") {
        explorer.exe "/select,$zipPath"
    }
}

Write-Host ""
Write-Host "Done! Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

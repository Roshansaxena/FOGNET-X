@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   FOGNET-X Windows Setup
echo ========================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python 3.9+ from https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/7] Setting up Python Backend...
cd backend

echo Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo [2/7] Setting up Database...
python migrate.py
if %errorlevel% neq 0 (
    echo [WARNING] Database migration failed, but continuing...
)

echo.
echo [3/7] Creating Admin User...
python create_admin.py
if %errorlevel% neq 0 (
    echo [WARNING] Admin creation failed, you can create it manually later
)

echo.
echo [4/7] Setting up Frontend...
cd ..\frontend

echo Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo.
echo [5/7] Building Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [WARNING] Build failed, but dev server will still work
)

echo.
echo [6/7] Configuring Environment...
cd ..

:: Generate random secret keys
python -c "import secrets; print('FLASK_SECRET_KEY=' + secrets.token_urlsafe(32))" > backend\.env
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))" >> backend\.env
echo JWT_ACCESS_TOKEN_EXPIRES=86400 >> backend\.env
echo DB_PATH=.\fognetx.db >> backend\.env
echo MQTT_BROKER=localhost >> backend\.env
echo MQTT_PORT=1883 >> backend\.env
echo CORS_ORIGIN=http://localhost:3000 >> backend\.env
echo SERVER_HOST=0.0.0.0 >> backend\.env
echo SERVER_PORT=8000 >> backend\.env
echo ALERT_COOLDOWN=300 >> backend\.env
echo ENABLE_EMAIL_ALERTS=true >> backend\.env
echo ENABLE_TELEGRAM_ALERTS=true >> backend\.env
echo LOG_LEVEL=INFO >> backend\.env

echo ✓ Basic environment file created
echo.

:: Ask user about Email Alerts
echo ========================================
echo   Email Alert Configuration (Optional)
echo ========================================
echo.
echo Email alerts notify you when critical events occur.
echo You'll need a Gmail App Password (not your regular password).
echo Guide: https://support.google.com/accounts/answer/185833
echo.
set /p SETUP_EMAIL="Configure email alerts now? (Y/N): "

if /i "%SETUP_EMAIL%"=="Y" (
    echo.
    set /p EMAIL_SENDER="Your Gmail address: "
    set /p EMAIL_PASSWORD="Gmail App Password: "
    set /p EMAIL_RECEIVER="Alert receiver email (press Enter for same): "
    
    if "!EMAIL_RECEIVER!"=="" set EMAIL_RECEIVER=!EMAIL_SENDER!
    
    echo EMAIL_SENDER=!EMAIL_SENDER! >> backend\.env
    echo EMAIL_PASSWORD=!EMAIL_PASSWORD! >> backend\.env
    echo EMAIL_RECEIVER=!EMAIL_RECEIVER! >> backend\.env
    echo EMAIL_SMTP_SERVER=smtp.gmail.com >> backend\.env
    echo EMAIL_SMTP_PORT=465 >> backend\.env
    
    echo ✓ Email alerts configured!
) else (
    echo.
    echo EMAIL_SENDER= >> backend\.env
    echo EMAIL_PASSWORD= >> backend\.env
    echo EMAIL_RECEIVER= >> backend\.env
    echo Skipped email configuration (you can add it later in backend\.env)
)

echo.
echo ========================================
echo   Telegram Alert Configuration (Optional)
echo ========================================
echo.
echo Telegram alerts send notifications to your Telegram account.
echo.
echo Setup Guide:
echo 1. Open Telegram and search for @BotFather
echo 2. Send /newbot and follow instructions
echo 3. Copy the bot token
echo 4. Search for @userinfobot and send any message
echo 5. Copy your Chat ID
echo.
set /p SETUP_TELEGRAM="Configure Telegram alerts now? (Y/N): "

if /i "%SETUP_TELEGRAM%"=="Y" (
    echo.
    set /p TELEGRAM_TOKEN="Bot Token: "
    set /p TELEGRAM_CHAT_ID="Chat ID: "
    
    echo TELEGRAM_TOKEN=!TELEGRAM_TOKEN! >> backend\.env
    echo TELEGRAM_CHAT_ID=!TELEGRAM_CHAT_ID! >> backend\.env
    
    echo ✓ Telegram alerts configured!
) else (
    echo.
    echo TELEGRAM_TOKEN= >> backend\.env
    echo TELEGRAM_CHAT_ID= >> backend\.env
    echo Skipped Telegram configuration (you can add it later in backend\.env)
)

echo.
echo ✓ Environment setup complete!
echo.

echo [7/7] Setup Complete!
echo.
echo ========================================
echo   Starting FOGNET-X Services
echo ========================================
echo.

:: Start MQTT Broker (Windows - using Docker if available)
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [MQTT] Starting Mosquitto with Docker...
    docker run -d --name fognetx-mqtt -p 1883:1883 eclipse-mosquitto:2
    echo ✓ MQTT Broker started on port 1883
) else (
    echo [WARNING] Docker not found. MQTT broker must be installed separately.
    echo Download from: https://mosquitto.org/download/
)

echo.
echo Starting Backend Server...
start "FOGNET-X Backend" cmd /k "cd backend && python cloud_server.py"

echo.
echo Starting Frontend Server...
start "FOGNET-X Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   FOGNET-X is Starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
echo.
echo Login credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo Alert Configuration:
if "%EMAIL_SENDER%"=="" (
    echo   Email Alerts:    Not configured
) else (
    echo   Email Alerts:    Configured ✓
)
if "%TELEGRAM_TOKEN%"=="" (
    echo   Telegram Alerts: Not configured
) else (
    echo   Telegram Alerts: Configured ✓
)
echo.
echo To change alerts later, edit: backend\.env
echo.
echo Press any key to open browser...
pause >nul

:: Open browser
start http://localhost:3000

echo.
echo Setup and startup complete!
echo To stop: Press Ctrl+C in the server windows
pause

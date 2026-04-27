@echo off
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

echo [1/6] Setting up Python Backend...
cd backend

echo Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo [2/6] Setting up Database...
python migrate.py
if %errorlevel% neq 0 (
    echo [WARNING] Database migration failed, but continuing...
)

echo.
echo [3/6] Setting up Frontend...
cd ..\frontend

echo Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo.
echo [4/6] Building Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo [WARNING] Build failed, but dev server will still work
)

echo.
echo [5/6] Creating configuration files...
cd ..

:: Create .env file if not exists
if not exist backend\.env (
    echo Creating .env file...
    (
        echo FLASK_SECRET_KEY=fognetx-secret-key-change-in-production
        echo JWT_SECRET_KEY=jwt-secret-key-change-in-production
        echo DB_PATH=.\fognetx.db
        echo MQTT_BROKER=localhost
        echo MQTT_PORT=1883
        echo CORS_ORIGIN=http://localhost:3000
    ) > backend\.env
    echo .env file created!
)

echo.
echo [6/6] Setup Complete!
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
    echo MQTT Broker started on port 1883
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
echo Press any key to open browser...
pause >nul

:: Open browser
start http://localhost:3000

echo.
echo Setup and startup complete!
echo To stop: Press Ctrl+C in the server windows
pause

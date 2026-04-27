#!/bin/bash

echo "========================================"
echo "  FOGNET-X Linux/Mac Setup"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 is not installed!"
    echo "Install with: sudo apt install python3 python3-pip (Ubuntu/Debian)"
    echo "Or: brew install python3 (macOS)"
    echo ""
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Install with: sudo apt install nodejs npm (Ubuntu/Debian)"
    echo "Or: brew install node (macOS)"
    echo ""
    exit 1
fi

echo "[1/6] Setting up Python Backend..."
cd backend

echo "Installing Python dependencies..."
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install Python dependencies"
    exit 1
fi

echo ""
echo "[2/6] Setting up Database..."
python3 migrate.py
if [ $? -ne 0 ]; then
    echo "[WARNING] Database migration failed, but continuing..."
fi

echo ""
echo "[3/6] Setting up Frontend..."
cd ../frontend

echo "Installing Node.js dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install Node.js dependencies"
    exit 1
fi

echo ""
echo "[4/6] Building Frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "[WARNING] Build failed, but dev server will still work"
fi

echo ""
echo "[5/6] Creating configuration files..."
cd ..

# Create .env file if not exists
if [ ! -f backend/.env ]; then
    echo "Creating .env file..."
    cat > backend/.env << EOF
FLASK_SECRET_KEY=fognetx-secret-key-change-in-production
JWT_SECRET_KEY=jwt-secret-key-change-in-production
DB_PATH=./fognetx.db
MQTT_BROKER=localhost
MQTT_PORT=1883
CORS_ORIGIN=http://localhost:3000
EOF
    echo ".env file created!"
fi

echo ""
echo "[6/6] Setup Complete!"
echo ""
echo "========================================"
echo "  Starting FOGNET-X Services"
echo "========================================"
echo ""

# Start MQTT Broker (using Docker if available)
if command -v docker &> /dev/null; then
    echo "[MQTT] Starting Mosquitto with Docker..."
    docker run -d --name fognetx-mqtt -p 1883:1883 eclipse-mosquitto:2
    echo "MQTT Broker started on port 1883"
else
    echo "[WARNING] Docker not found. MQTT broker must be installed separately."
    echo "Install with: sudo apt install mosquitto mosquitto-clients"
fi

echo ""
echo "Starting Backend Server..."
cd backend
python3 cloud_server.py &
BACKEND_PID=$!
cd ..

echo ""
echo "Starting Frontend Server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "  FOGNET-X is Running!"
echo "========================================"
echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Login credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Open browser (Linux)
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    open http://localhost:3000
fi

# Wait for Ctrl+C
wait

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

echo "[1/7] Setting up Python Backend..."
cd backend

echo "Installing Python dependencies..."
pip3 install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install Python dependencies"
    exit 1
fi

echo ""
echo "[2/7] Setting up Database..."
python3 migrate.py
if [ $? -ne 0 ]; then
    echo "[WARNING] Database migration failed, but continuing..."
fi

echo ""
echo "[3/7] Creating Admin User..."
python3 create_admin.py
if [ $? -ne 0 ]; then
    echo "[WARNING] Admin creation failed, you can create it manually later"
fi

echo ""
echo "[4/7] Setting up Frontend..."
cd ../frontend

echo "Installing Node.js dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install Node.js dependencies"
    exit 1
fi

echo ""
echo "[5/7] Building Frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "[WARNING] Build failed, but dev server will still work"
fi

echo ""
echo "[6/7] Configuring Environment..."
cd ..

# Generate random secret keys
FLASK_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")

cat > backend/.env << EOF
FLASK_SECRET_KEY=${FLASK_SECRET}
JWT_SECRET_KEY=${JWT_SECRET}
JWT_ACCESS_TOKEN_EXPIRES=86400
DB_PATH=./fognetx.db
MQTT_BROKER=localhost
MQTT_PORT=1883
CORS_ORIGIN=http://localhost:3000
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
ALERT_COOLDOWN=300
ENABLE_EMAIL_ALERTS=true
ENABLE_TELEGRAM_ALERTS=true
LOG_LEVEL=INFO
EOF

echo "✓ Basic environment file created"
echo ""

# Ask user about Email Alerts
echo "========================================"
echo "  Email Alert Configuration (Optional)"
echo "========================================"
echo ""
echo "Email alerts notify you when critical events occur."
echo "You'll need a Gmail App Password (not your regular password)."
echo "Guide: https://support.google.com/accounts/answer/185833"
echo ""
read -p "Configure email alerts now? (y/n): " SETUP_EMAIL

if [[ "$SETUP_EMAIL" =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Your Gmail address: " EMAIL_SENDER
    read -p "Gmail App Password: " EMAIL_PASSWORD
    read -p "Alert receiver email (press Enter for same): " EMAIL_RECEIVER
    
    if [ -z "$EMAIL_RECEIVER" ]; then
        EMAIL_RECEIVER=$EMAIL_SENDER
    fi
    
    cat >> backend/.env << EOF
EMAIL_SENDER=${EMAIL_SENDER}
EMAIL_PASSWORD=${EMAIL_PASSWORD}
EMAIL_RECEIVER=${EMAIL_RECEIVER}
EMAIL_SMTP_SERVER=smtp.gmail.com
EMAIL_SMTP_PORT=465
EOF
    
    echo "✓ Email alerts configured!"
else
    echo ""
    cat >> backend/.env << EOF
EMAIL_SENDER=
EMAIL_PASSWORD=
EMAIL_RECEIVER=
EOF
    echo "Skipped email configuration (you can add it later in backend/.env)"
fi

echo ""
echo "========================================"
echo "  Telegram Alert Configuration (Optional)"
echo "========================================"
echo ""
echo "Telegram alerts send notifications to your Telegram account."
echo ""
echo "Setup Guide:"
echo "1. Open Telegram and search for @BotFather"
echo "2. Send /newbot and follow instructions"
echo "3. Copy the bot token"
echo "4. Search for @userinfobot and send any message"
echo "5. Copy your Chat ID"
echo ""
read -p "Configure Telegram alerts now? (y/n): " SETUP_TELEGRAM

if [[ "$SETUP_TELEGRAM" =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Bot Token: " TELEGRAM_TOKEN
    read -p "Chat ID: " TELEGRAM_CHAT_ID
    
    cat >> backend/.env << EOF
TELEGRAM_TOKEN=${TELEGRAM_TOKEN}
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}
EOF
    
    echo "✓ Telegram alerts configured!"
else
    echo ""
    cat >> backend/.env << EOF
TELEGRAM_TOKEN=
TELEGRAM_CHAT_ID=
EOF
    echo "Skipped Telegram configuration (you can add it later in backend/.env)"
fi

echo ""
echo "✓ Environment setup complete!"
echo ""

echo "[7/7] Setup Complete!"
echo ""
echo "========================================"
echo "  Starting FOGNET-X Services"
echo "========================================"
echo ""

# Start MQTT Broker (using Docker if available)
if command -v docker &> /dev/null; then
    echo "[MQTT] Starting Mosquitto with Docker..."
    docker run -d --name fognetx-mqtt -p 1883:1883 eclipse-mosquitto:2
    echo "✓ MQTT Broker started on port 1883"
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
echo "Alert Configuration:"
if [ -z "$EMAIL_SENDER" ]; then
    echo "  Email Alerts:    Not configured"
else
    echo "  Email Alerts:    Configured ✓"
fi
if [ -z "$TELEGRAM_TOKEN" ]; then
    echo "  Telegram Alerts: Not configured"
else
    echo "  Telegram Alerts: Configured ✓"
fi
echo ""
echo "To change alerts later, edit: backend/.env"
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

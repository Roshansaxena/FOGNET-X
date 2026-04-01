#!/bin/bash

echo "🚀 Starting FOGNET-X System..."

# -------------------
# Start MQTT
# -------------------
echo "🔌 Starting MQTT..."
sudo systemctl start mosquitto

# -------------------
# Start Cloud Server
# -------------------
echo "☁ Starting Cloud..."
gnome-terminal -- bash -c "
cd ~/PycharmProjects/PythonProject/fognetx;
source venv/bin/activate;
python cloud_server.py;
exec bash"

sleep 3

# -------------------
# Start Fog Service
# -------------------
echo "🧠 Starting Fog..."
gnome-terminal -- bash -c "
cd ~/PycharmProjects/PythonProject/fognetx;
source venv/bin/activate;
python -m services.mqtt_service;
exec bash"

sleep 3

# -------------------
# Start Frontend
# -------------------
echo "🖥 Starting Frontend..."
gnome-terminal -- bash -c "
cd ~/PycharmProjects/PythonProject/fognetx/fognetx-frontend;
npm run dev -- --host;
exec bash"

echo "✅ FOGNET-X fully started!"#!/bin/bash

echo "🚀 Starting FOGNET-X System..."

# -------------------
# Start MQTT
# -------------------
echo "🔌 Starting MQTT..."
sudo systemctl start mosquitto

# -------------------
# Start Cloud Server
# -------------------
echo "☁ Starting Cloud..."
gnome-terminal -- bash -c "
cd ~/PycharmProjects/PythonProject/fognetx;
source venv/bin/activate;
python cloud_server.py;
exec bash"

sleep 3

# -------------------
# Start Fog Service
# -------------------
echo "🧠 Starting Fog..."
gnome-terminal -- bash -c "
cd ~/PycharmProjects/PythonProject/fognetx;
source venv/bin/activate;
python -m services.mqtt_service;
exec bash"

sleep 3

# -------------------
# Start Frontend
# -------------------
echo "🖥 Starting Frontend..."
gnome-terminal -- bash -c "
cd ~/PycharmProjects/PythonProject/fognetx/fognetx-frontend;
npm run dev -- --host;
exec bash"

echo "✅ FOGNET-X fully started!"

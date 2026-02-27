#!/bin/bash

PROJECT_DIR="$HOME/PycharmProjects/PythonProject/fognetx"
FRONTEND_DIR="$PROJECT_DIR/fognetx-frontend"

PID_FILE="$PROJECT_DIR/.fognetx_pids"

start_services() {

    echo "🚀 Starting FOGNET-X..."

    # Clear old PID file
    rm -f $PID_FILE

    # ---------------- MQTT ----------------
    echo "🔌 Starting MQTT..."
    sudo systemctl start mosquitto

    # ---------------- CLOUD ----------------
    echo "☁ Starting Cloud..."
    cd $PROJECT_DIR
    source venv/bin/activate
    python cloud_server.py &
    CLOUD_PID=$!
    echo "CLOUD:$CLOUD_PID" >> $PID_FILE

    sleep 2

    # ---------------- FOG ----------------
    echo "🧠 Starting Fog..."
    python -m services.mqtt_service &
    FOG_PID=$!
    echo "FOG:$FOG_PID" >> $PID_FILE

    sleep 2

    # ---------------- FRONTEND ----------------
    echo "🖥 Starting Frontend..."
    cd $FRONTEND_DIR
    npm run dev -- --host &
    FRONT_PID=$!
    echo "FRONT:$FRONT_PID" >> $PID_FILE

    echo "✅ FOGNET-X Started!"
}

stop_services() {

    echo "🛑 Stopping FOGNET-X..."

    if [ -f "$PID_FILE" ]; then

        while read line; do
            PID=$(echo $line | cut -d':' -f2)
            echo "Killing PID $PID"
            kill -9 $PID 2>/dev/null
        done < $PID_FILE

        rm -f $PID_FILE
        echo "✅ All services stopped."

    else
        echo "No running services found."
    fi
}

status_services() {

    echo "📊 FOGNET-X STATUS"
    echo "-----------------------"

    if [ -f "$PID_FILE" ]; then
        while read line; do
            NAME=$(echo $line | cut -d':' -f1)
            PID=$(echo $line | cut -d':' -f2)

            if ps -p $PID > /dev/null; then
                echo "$NAME is RUNNING (PID $PID)"
            else
                echo "$NAME is NOT running"
            fi
        done < $PID_FILE
    else
        echo "No services running."
    fi

    echo ""
    echo "Port Check:"
    lsof -i :8000 2>/dev/null && echo "Cloud running on 8000"
    lsof -i :5173 2>/dev/null && echo "Frontend running on 5173"
    lsof -i :1883 2>/dev/null && echo "MQTT running on 1883"
}

case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    status)
        status_services
        ;;
    *)
        echo "Usage: ./fognetx.sh {start|stop|status}"
        ;;
esac

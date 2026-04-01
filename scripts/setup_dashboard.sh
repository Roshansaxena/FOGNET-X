#!/bin/bash

echo "🚀 Setting up FOGNET-X Dashboard..."

# Ensure folders exist
mkdir -p templates
mkdir -p static

########################################
# Create Flask App
########################################

cat > app.py <<EOL
from flask import Flask, render_template, jsonify
import sqlite3
import psutil
import time

app = Flask(__name__)

DB_NAME = "fognetx.db"

def get_latest_event():
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("SELECT * FROM events ORDER BY id DESC LIMIT 1")
        row = c.fetchone()
        conn.close()

        if row:
            return {
                "device_id": row[1],
                "temperature": row[2],
                "gas": row[3],
                "severity": row[4],
                "risk_score": row[5],
                "allocation": row[6],
                "timestamp": row[7]
            }
    except:
        pass

    return {}

@app.route("/")
def dashboard():
    return render_template("dashboard.html")

@app.route("/api/data")
def api_data():
    data = get_latest_event()

    data["cpu"] = psutil.cpu_percent()
    data["ram"] = psutil.virtual_memory().percent
    data["server_time"] = time.time()

    return jsonify(data)

if __name__ == "__main__":
    print("📊 FOGNET-X Dashboard Running...")
    app.run(host="0.0.0.0", port=5000)
EOL


########################################
# Create Dashboard HTML
########################################

cat > templates/dashboard.html <<EOL
<!DOCTYPE html>
<html>
<head>
    <title>FOGNET-X Dashboard</title>
    <script>
        async function updateData() {
            const res = await fetch("/api/data");
            const data = await res.json();

            document.getElementById("device").innerText = data.device_id || "--";
            document.getElementById("temp").innerText = data.temperature || "--";
            document.getElementById("gas").innerText = data.gas || "--";
            document.getElementById("severity").innerText = data.severity || "--";
            document.getElementById("risk").innerText = data.risk_score || "--";
            document.getElementById("allocation").innerText = data.allocation || "--";
            document.getElementById("cpu").innerText = data.cpu + "%";
            document.getElementById("ram").innerText = data.ram + "%";

            if (data.severity === "CRITICAL") {
                document.body.style.backgroundColor = "#3b0000";
            } else if (data.severity === "WARNING") {
                document.body.style.backgroundColor = "#332900";
            } else {
                document.body.style.backgroundColor = "#001f33";
            }
        }

        setInterval(updateData, 2000);
        window.onload = updateData;
    </script>
</head>

<body style="color:white; font-family:Arial; text-align:center;">

<h1>FOGNET-X Orchestration Dashboard</h1>

<h2>Device: <span id="device">--</span></h2>

<p>Temperature: <span id="temp">--</span> °C</p>
<p>Gas Level: <span id="gas">--</span></p>
<p>Severity: <span id="severity">--</span></p>
<p>Risk Score: <span id="risk">--</span></p>
<p>Task Allocation: <span id="allocation">--</span></p>

<hr>

<h3>Fog System Health</h3>
<p>CPU Usage: <span id="cpu">--</span></p>
<p>RAM Usage: <span id="ram">--</span></p>

</body>
</html>
EOL

echo "✅ Dashboard Setup Complete!"
echo ""
echo "To start dashboard:"
echo "cd fognetx"
echo "source venv/bin/activate"
echo "python app.py"
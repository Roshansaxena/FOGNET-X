#!/bin/bash

echo "🚀 Upgrading FOGNET-X Dashboard to v2..."

########################################
# Replace app.py with graph support
########################################

cat > app.py <<EOL
from flask import Flask, render_template, jsonify
import sqlite3
import psutil
import time

app = Flask(__name__)

DB_NAME = "fognetx.db"

def get_latest_event():
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
    return {}

def get_last_20_events():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT temperature, gas, risk_score, severity FROM events ORDER BY id DESC LIMIT 20")
    rows = c.fetchall()
    conn.close()

    rows.reverse()
    return rows

@app.route("/")
def dashboard():
    return render_template("dashboard.html")

@app.route("/api/data")
def api_data():
    latest = get_latest_event()
    history = get_last_20_events()

    return jsonify({
        "latest": latest,
        "history": history,
        "cpu": psutil.cpu_percent(),
        "ram": psutil.virtual_memory().percent
    })

if __name__ == "__main__":
    print("📊 FOGNET-X Advanced Dashboard Running...")
    app.run(host="0.0.0.0", port=5000)
EOL


########################################
# Replace dashboard.html
########################################

cat > templates/dashboard.html <<EOL
<!DOCTYPE html>
<html>
<head>
    <title>FOGNET-X Advanced Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body style="background:#0d1117;color:white;font-family:Arial;text-align:center;">

<h1>FOGNET-X Orchestration Dashboard</h1>

<h2>Severity: <span id="severity">--</span></h2>
<p>Risk Score: <span id="risk">--</span></p>
<p>Allocation: <span id="allocation">--</span></p>

<canvas id="riskChart" width="400" height="150"></canvas>
<canvas id="tempChart" width="400" height="150"></canvas>
<canvas id="gasChart" width="400" height="150"></canvas>

<hr>
<h3>Fog System</h3>
<p>CPU: <span id="cpu"></span>% | RAM: <span id="ram"></span>%</p>

<script>
let riskChart = new Chart(document.getElementById("riskChart"), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Risk Score', data: [], borderColor: 'red' }] }
});

let tempChart = new Chart(document.getElementById("tempChart"), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Temperature', data: [], borderColor: 'orange' }] }
});

let gasChart = new Chart(document.getElementById("gasChart"), {
    type: 'line',
    data: { labels: [], datasets: [{ label: 'Gas Level', data: [], borderColor: 'cyan' }] }
});

async function updateDashboard() {
    const res = await fetch("/api/data");
    const data = await res.json();

    const latest = data.latest;
    const history = data.history;

    document.getElementById("severity").innerText = latest.severity || "--";
    document.getElementById("risk").innerText = latest.risk_score || "--";
    document.getElementById("allocation").innerText = latest.allocation || "--";
    document.getElementById("cpu").innerText = data.cpu;
    document.getElementById("ram").innerText = data.ram;

    let labels = [];
    let risks = [];
    let temps = [];
    let gases = [];

    history.forEach((row, index) => {
        labels.push(index);
        temps.push(row[0]);
        gases.push(row[1]);
        risks.push(row[2]);
    });

    riskChart.data.labels = labels;
    riskChart.data.datasets[0].data = risks;
    riskChart.update();

    tempChart.data.labels = labels;
    tempChart.data.datasets[0].data = temps;
    tempChart.update();

    gasChart.data.labels = labels;
    gasChart.data.datasets[0].data = gases;
    gasChart.update();
}

setInterval(updateDashboard, 2000);
window.onload = updateDashboard;
</script>

</body>
</html>
EOL

echo "✅ Advanced Dashboard Installed!"
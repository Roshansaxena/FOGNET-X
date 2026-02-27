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

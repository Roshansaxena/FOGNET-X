
from flask import Flask, request, jsonify, redirect, url_for, render_template_string
from flask_cors import CORS
from flask_dance.contrib.google import make_google_blueprint, google
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt,
)
from services.logger import init_db
from core.orchestration_config import OrchestrationConfig
from flask_bcrypt import Bcrypt
from services.realtime import init_socketio
from flask_socketio import SocketIO
from core.config import DB_NAME
from dotenv import load_dotenv
import os
load_dotenv()
import sqlite3
import pandas as pd
import psutil
import datetime
import time
from werkzeug.middleware.proxy_fix import ProxyFix

# ==========================================================
# APP INIT
# ==========================================================

app = Flask(__name__)

app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
# CORS(app)
# socketio = SocketIO(app, cors_allowed_origins="*")
init_socketio(socketio)
init_db()
config = OrchestrationConfig()
import os

app.config["SERVER_NAME"] = os.getenv("SERVER_NAME")
app.config["PREFERRED_URL_SCHEME"] = os.getenv("PREFERRED_URL_SCHEME", "http")
app.secret_key = "fognetx-secret-key"

app.config["JWT_SECRET_KEY"] = "oloawotezdzvvwvykqtnqajixciuitkb"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = datetime.timedelta(hours=8)

jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# DB_NAME = "fognetx.db"
print("☁ Cloud using DB:", DB_NAME)

print("☁ Cloud Server Running on port 8000")

# ==========================================================
# GOOGLE OAUTH
# ==========================================================

google_bp = make_google_blueprint(
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    scope=["profile", "email"],
    # redirect_url="/google_login"
)
@app.route("/google_login")
def google_login():

    if not google.authorized:
        return redirect(url_for("google.login"))

    resp = google.get("/oauth2/v2/userinfo")

    if not resp.ok:
        return "Failed to fetch user info", 400

    user_info = resp.json()
    email = user_info["email"]

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute("SELECT id, role FROM users WHERE username = ?", (email,))
    user = c.fetchone()

    if not user:
        # auto-register google user
        c.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            (email, "", "viewer")
        )
        conn.commit()

        c.execute("SELECT id, role FROM users WHERE username = ?", (email,))
        user = c.fetchone()

    user_id, role = user
    conn.close()

    token = create_access_token(
        identity=str(user_id),
        additional_claims={
            "username": email,
            "role": role
        }
    )

    # redirect back to frontend with token


    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return redirect(f"{frontend_url}/oauth-success?token={token}")
app.register_blueprint(google_bp, url_prefix="/login")

# ==========================================================
# AUTH DB INIT
# ==========================================================

def init_auth_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        )
    """)
    conn.commit()
    conn.close()

init_auth_db()

# ==========================================================
# ROOT
# ==========================================================

@app.route("/")
def home():
    return render_template_string("<h1>FOGNET-X Cloud Layer Running</h1>")

# ==========================================================
# LOGIN
# ==========================================================

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute("SELECT id, password, role FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()

    if not user:
        return jsonify({"msg": "Invalid credentials"}), 401

    user_id, hashed_pw, role = user

    if bcrypt.check_password_hash(hashed_pw, password):
        token = create_access_token(
            identity=str(user_id),
            additional_claims={
                "username": username,
                "role": role
            }
        )
        return jsonify({"access_token": token})

    return jsonify({"msg": "Invalid credentials"}), 401

# ==========================================================
# CLOUD PROCESSING
# ==========================================================

@app.route("/cloud/process", methods=["POST"])
def process():

    data = request.json

    # Optional: simulate small latency (keep small)
    # time.sleep(0.05)

    # Emit realtime event from cloud process
    socketio.emit("metrics_event", {
        "type": "cloud_processed",
        "device_id": data.get("device_id"),
        "timestamp": time.time()
    })

    return jsonify({"status": "processed"})

# ==========================================================
# DASHBOARD (HARDENED)
# ==========================================================

@app.route("/api/dashboard")
@jwt_required()
def dashboard():
    try:
        conn = sqlite3.connect(DB_NAME, timeout=5)
        conn.row_factory = sqlite3.Row

        # --------------------------------
        # Aggregations
        # --------------------------------

        total_events = conn.execute(
            "SELECT COUNT(*) FROM events"
        ).fetchone()[0]

        total_bandwidth = conn.execute(
            "SELECT COALESCE(SUM(bandwidth_bytes),0) FROM events"
        ).fetchone()[0]

        total_sla = conn.execute(
            "SELECT COALESCE(SUM(sla_violation),0) FROM events"
        ).fetchone()[0]

        # Allocation
        alloc_rows = conn.execute("""
            SELECT allocation, COUNT(*)
            FROM events
            GROUP BY allocation
        """).fetchall()

        allocation_summary = {
            "fog": 0,
            "cloud": 0,
            "hybrid": 0
        }

        for row in alloc_rows:
            if row["allocation"] == "FOG_EXECUTION":
                allocation_summary["fog"] = row[1]
            elif row["allocation"] == "CLOUD_EXECUTION":
                allocation_summary["cloud"] = row[1]
            elif row["allocation"] == "FOG_AND_CLOUD":
                allocation_summary["hybrid"] = row[1]

        # Averages
        avg_fog_latency = conn.execute("""
            SELECT AVG(fog_latency)
            FROM events
            WHERE allocation IN ('FOG_EXECUTION','FOG_AND_CLOUD')
        """).fetchone()[0] or 0

        avg_cloud_latency = conn.execute("""
            SELECT AVG(cloud_latency)
            FROM events
            WHERE allocation IN ('CLOUD_EXECUTION','FOG_AND_CLOUD')
        """).fetchone()[0] or 0

        # Risk trend
        risk_rows = conn.execute("""
            SELECT risk_score
            FROM events
            ORDER BY id DESC
            LIMIT 20
        """).fetchall()

        risk_trend = [
            {"index": i, "risk_score": row[0]}
            for i, row in enumerate(reversed(risk_rows))
        ]

        # Devices
        device_rows = conn.execute("""
            SELECT device_id, temperature, gas, severity
            FROM events
            GROUP BY device_id
            ORDER BY id DESC
            LIMIT 10
        """).fetchall()

        devices = [
            {
                "device_id": row[0],
                "temperature": row[1],
                "gas": row[2],
                "severity": row[3]
            }
            for row in device_rows
        ]

        # --------------------------------
        # P95 (must be BEFORE close)
        # --------------------------------

        p95_fog_row = conn.execute("""
            SELECT fog_latency
            FROM (
                SELECT fog_latency
                FROM events
                WHERE fog_latency IS NOT NULL
                ORDER BY id DESC
                LIMIT 200
            )
            ORDER BY fog_latency
            LIMIT 1 OFFSET 190
        """).fetchone()

        p95_cloud_row = conn.execute("""
            SELECT cloud_latency
            FROM (
                SELECT cloud_latency
                FROM events
                WHERE cloud_latency IS NOT NULL
                ORDER BY id DESC
                LIMIT 200
            )
            ORDER BY cloud_latency
            LIMIT 1 OFFSET 190
        """).fetchone()

        p95_fog_latency = round(p95_fog_row[0], 2) if p95_fog_row else 0
        p95_cloud_latency = round(p95_cloud_row[0], 2) if p95_cloud_row else 0

        # --------------------------------
        # NOW close connection
        # --------------------------------

        conn.close()

        # System stats outside DB
        cpu_usage = psutil.cpu_percent()
        memory_usage = psutil.virtual_memory().percent
        socketio.emit("metrics_event", {
            "type": "snapshot_update"
        })
        return jsonify({
            "total_events": total_events,
            "avg_fog_latency": round(avg_fog_latency, 2),
            "avg_cloud_latency": round(avg_cloud_latency, 2),
            "p95_fog_latency": p95_fog_latency,
            "p95_cloud_latency": p95_cloud_latency,
            "sla_violations": total_sla,
            "risk_trend": risk_trend,
            "allocation_summary": allocation_summary,
            "bandwidth": {
                "total_bytes": total_bandwidth,
                "cloud_bytes": 0,
                "fog_bytes": 0
            },
            "formatted_bandwidth": f"{total_bandwidth / 1024:.2f} KB",
            "devices": devices,
            "system": {
                "cpu": cpu_usage,
                "memory": memory_usage
            }
        })

    except Exception as e:
        print("Dashboard Error:", e)
        return jsonify({"error": "Dashboard failed"}), 500

# ==========================================================
# ORCHESTRATION STATE
# ==========================================================

@app.route("/api/orchestration/state")
@jwt_required()
def orchestration_state():
    try:
        conn = sqlite3.connect(DB_NAME, timeout=5)
        conn.row_factory = sqlite3.Row

        alloc_rows = conn.execute("""
            SELECT allocation, COUNT(*)
            FROM events
            GROUP BY allocation
        """).fetchall()

        total_events = conn.execute(
            "SELECT COUNT(*) FROM events"
        ).fetchone()[0]

        total_sla = conn.execute(
            "SELECT COALESCE(SUM(sla_violation),0) FROM events"
        ).fetchone()[0]

        conn.close()

        allocation = {
            "FOG_EXECUTION": 0,
            "CLOUD_EXECUTION": 0,
            "FOG_AND_CLOUD": 0
        }

        for row in alloc_rows:
            allocation[row["allocation"]] = row[1]

        sla_pressure = total_sla / total_events if total_events else 0
        cfg = config.get()

        return jsonify({
            "mode": cfg["mode"],
            "risk_threshold": cfg["risk_threshold"],
            "sla_fog_ms": cfg["sla_fog_ms"],
            "sla_cloud_ms": cfg["sla_cloud_ms"],
            "cpu_threshold": cfg["cpu_threshold"],
            "fog_cpu": psutil.cpu_percent(),
            "memory_usage": psutil.virtual_memory().percent,
            "allocation": allocation,
            "sla_pressure": round(sla_pressure, 3)
        })

    except Exception as e:
        print("Orchestration State Error:", e)
        return jsonify({"error": "Failed"}), 500
# ==========================================================
# UPDATE ORCHESTRATION CONFIG
# ==========================================================

@app.route("/api/orchestration/config", methods=["POST"])
@jwt_required()
def update_orchestration_config():
    data = request.json
    config.update(data)
    return jsonify({"status": "updated", "new_config": config.get()})
@app.route("/api/logs")
@jwt_required()
def get_logs():
    try:
        with open("logs/cloud.log", "r") as f:
            lines = f.readlines()[-100:]
        return jsonify(lines)
    except Exception as e:
        return jsonify({"error": "Failed to read logs"}), 500
    from migrate import run_migrations
# ==========================================================
# RUN
# ==========================================================

if __name__ == "__main__":
    from migrate import run_migrations
    socketio.run(app, host="0.0.0.0", port=8000, allow_unsafe_werkzeug=True)
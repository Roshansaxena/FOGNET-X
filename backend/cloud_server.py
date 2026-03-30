
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
from migrate import ensure_extended_schema
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
ensure_extended_schema()  # Ensure all tables and columns exist on every startup
config = OrchestrationConfig()
import os

#app.config["SERVER_NAME"] = os.getenv("SERVER_NAME")
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
            (email, None, "viewer")
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

def seed_admin():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute("SELECT * FROM users WHERE username = ?", ("admin",))
    user = c.fetchone()

    if not user:
        hashed_pw = bcrypt.generate_password_hash("admin123").decode("utf-8")

        c.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            ("admin", hashed_pw, "admin")
        )
        conn.commit()
        print("✅ Default admin created: admin / admin123")
    else:
        print("ℹ️ Admin already exists")

    conn.close()

seed_admin()

# ==========================================================
# ROOT
# ==========================================================

@app.route("/")
def home():
    return render_template_string("<h1>FOGNET-X Cloud Layer Running</h1>")



@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"msg": "Missing fields"}), 400

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    try:
        hashed = bcrypt.generate_password_hash(password).decode("utf-8")

        c.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            (username, hashed, "viewer")
        )

        conn.commit()
        return jsonify({"msg": "User created"})
    except sqlite3.IntegrityError:
        return jsonify({"msg": "User already exists"}), 400
    finally:
        conn.close()
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

    # AUTH LOGIC
    if hashed_pw is None:
        valid = True
    elif isinstance(hashed_pw, str) and hashed_pw.startswith("$2b$"):
        valid = bcrypt.check_password_hash(hashed_pw, password)
    else:
        valid = (hashed_pw == password)

    if valid:
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

    import random

    data = request.json
    device_id = data.get("device_id", "device_1")

    # -----------------------------
    # SIMULATED INPUTS
    # -----------------------------
    risk = random.uniform(0, 1)
    cpu = psutil.cpu_percent()

    # -----------------------------
    # DECISION LOGIC
    # -----------------------------
    if 0.4 < risk < 0.7:
        allocation = "FOG_AND_CLOUD"
    elif risk >= 0.7 or cpu > 80:
        allocation = "CLOUD_EXECUTION"
    else:
        allocation = "FOG_EXECUTION"

    # -----------------------------
    # LATENCY SIMULATION
    # -----------------------------
    fog_latency = random.uniform(1, 40)
    cloud_latency = random.uniform(150, 350)

    if allocation == "FOG_EXECUTION":
        final_latency = fog_latency
    elif allocation == "CLOUD_EXECUTION":
        final_latency = cloud_latency
    else:
        final_latency = (fog_latency * 0.6) + (cloud_latency * 0.4)

    # NOTE: DB insert removed - fogcore already logged this event
    # We just return the cloud processing result

    # -----------------------------
    # REALTIME EMIT
    # -----------------------------
    socketio.emit("metrics_event", {
        "type": "decision_made",
        "allocation": allocation,
        "risk": risk,
        "latency": final_latency
    })

    return jsonify({
        "status": "processed",
        "allocation": allocation,
        "latency": final_latency
    })

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

        # Devices - Get latest event for each device with all sensor fields
        device_rows = conn.execute("""
            SELECT 
                device_id, temperature, gas, severity, risk_score,
                humidity, pressure, light_lux, motion, sound_db,
                vibration, air_quality_index, tank_level, flow_rate,
                power_consumption, voltage, current_amp, device_battery,
                signal_strength, device_cpu, device_memory, network_latency,
                packet_loss, timestamp, allocation
            FROM events
            WHERE id IN (
                SELECT MAX(id) 
                FROM events 
                GROUP BY device_id
            )
            ORDER BY timestamp DESC
            LIMIT 10
        """).fetchall()

        devices = []
        for row in device_rows:
            dev = {
                "device_id": row[0],
                "temperature": row[1],
                "gas": row[2],
                "severity": row[3] or "NORMAL",
                "risk": row[4] or 0,
                "humidity": row[5],
                "pressure": row[6],
                "light_lux": row[7],
                "motion": bool(row[8]) if row[8] is not None else None,
                "sound_db": row[9],
                "vibration": row[10],
                "air_quality_index": row[11],
                "tank_level": row[12],
                "flow_rate": row[13],
                "power_consumption": row[14],
                "voltage": row[15],
                "current": row[16],
                "battery": row[17],
                "signal_strength": row[18],
                "device_cpu": row[19],
                "device_memory": row[20],
                "network_latency": row[21],
                "packet_loss": row[22],
                "timestamp": row[23],
                "decision": row[24] or "FOG_EXECUTION"
            }
            devices.append(dev)

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

# ==========================================================
# RECENT ORCHESTRATION DECISIONS
# ==========================================================

@app.route("/api/orchestration/recent")
@jwt_required()
def get_recent_decisions():
    try:
        limit = request.args.get("limit", 20, type=int)
        conn = sqlite3.connect(DB_NAME, timeout=5)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("""
            SELECT timestamp, device_id, risk_score, allocation,
                   fog_latency, sla_violation
            FROM events
            ORDER BY id DESC
            LIMIT ?
        """, (limit,)).fetchall()
        conn.close()
        return jsonify([
            {
                "timestamp": r["timestamp"],
                "device_id": r["device_id"],
                "risk": r["risk_score"],
                "decision": r["allocation"],
                "latency": r["fog_latency"],
                "sla_breach": bool(r["sla_violation"])
            }
            for r in rows
        ])
    except Exception as e:
        print("Recent decisions error:", e)
        return jsonify([]), 200
@app.route("/api/logs")
@jwt_required()
def get_logs():
    try:
        conn = sqlite3.connect(DB_NAME, timeout=5)
        conn.row_factory = sqlite3.Row
        
        # Get recent events as logs
        cursor = conn.execute("""
            SELECT 
                id,
                device_id,
                timestamp,
                severity as level,
                allocation as decision,
                risk_score as risk,
                fog_latency as latency,
                sla_violation,
                temperature,
                gas,
                humidity,
                pressure
            FROM events
            ORDER BY timestamp DESC
            LIMIT 100
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        logs = []
        for row in rows:
            # Create a log message based on the event data
            message = f"Device {row['device_id']}: {row['decision']}"
            if row['sla_violation']:
                message += " (SLA VIOLATION)"
            
            logs.append({
                "id": row["id"],
                "timestamp": row["timestamp"],
                "level": row["level"].lower() if row["level"] else "info",
                "device_id": row["device_id"],
                "message": message,
                "decision": row["decision"],
                "risk": row["risk"],
                "latency": row["latency"],
                "temperature": row["temperature"],
                "gas": row["gas"]
            })
        
        return jsonify(logs)
    except Exception as e:
        print("Get logs error:", e)
        return jsonify([]), 200

# ==========================================================
# DEVICE MANAGEMENT
# ==========================================================

@app.route("/api/devices")
@jwt_required()
def list_devices():
    """Get all registered devices from both devices table and events"""
    try:
        conn = sqlite3.connect(DB_NAME, timeout=5)
        conn.row_factory = sqlite3.Row
        
        # First try to get from devices table
        try:
            cursor = conn.execute("""
                SELECT device_id, device_name, device_type, capabilities, 
                       location, status, battery_level, signal_strength,
                       cpu_usage, memory_usage, last_seen, created_at
                FROM devices
                ORDER BY last_seen DESC
            """)
            
            rows = cursor.fetchall()
            devices = []
            
            for row in rows:
                devices.append({
                    "device_id": row["device_id"],
                    "device_name": row["device_name"] or row["device_id"],
                    "device_type": row["device_type"] or "IoT Sensor",
                    "capabilities": row["capabilities"] or "[\"temperature\", \"gas\"]",
                    "location": row["location"] or "Factory Floor",
                    "status": row["status"] or "online",
                    "battery_level": row["battery_level"] or 100,
                    "signal_strength": row["signal_strength"] or -70,
                    "cpu_usage": row["cpu_usage"] or 0,
                    "memory_usage": row["memory_usage"] or 0,
                    "last_seen": row["last_seen"],
                    "created_at": row["created_at"]
                })
        except sqlite3.OperationalError as e:
            # devices table doesn't exist yet, use fallback
            print(f"Devices table not found: {e}")
            devices = []
        
        # If no devices in devices table, get from events table
        if not devices:
            cursor = conn.execute("""
                SELECT 
                    device_id,
                    MAX(timestamp) as last_seen,
                    AVG(device_battery) as battery_level,
                    AVG(signal_strength) as signal_strength,
                    AVG(device_cpu) as cpu_usage,
                    AVG(device_memory) as memory_usage
                FROM events
                GROUP BY device_id
                ORDER BY last_seen DESC
            """)
            
            rows = cursor.fetchall()
            for row in rows:
                devices.append({
                    "device_id": row["device_id"],
                    "device_name": row["device_id"],
                    "device_type": "IoT Sensor",
                    "capabilities": "[\"temperature\", \"gas\", \"humidity\", \"pressure\"]",
                    "location": "Factory Floor",
                    "status": "online",
                    "battery_level": row["battery_level"] or 100,
                    "signal_strength": row["signal_strength"] or -70,
                    "cpu_usage": row["cpu_usage"] or 0,
                    "memory_usage": row["memory_usage"] or 0,
                    "last_seen": row["last_seen"],
                    "created_at": row["last_seen"]
                })
        
        conn.close()
        return jsonify(devices)
    except Exception as e:
        print("List devices error:", e)
        return jsonify({"error": "Failed to fetch devices"}), 500


@app.route("/api/devices", methods=["POST"])
@jwt_required()
def create_device():
    """Register a new device"""
    try:
        data = request.json
        device_id = data.get("device_id")
        device_name = data.get("device_name", device_id)
        device_type = data.get("device_type", "iot_sensor")
        capabilities = data.get("capabilities", "[]")
        location = data.get("location", "")
        status = data.get("status", "offline")
        
        if not device_id:
            return jsonify({"msg": "device_id required"}), 400
        
        conn = sqlite3.connect(DB_NAME, timeout=5)
        c = conn.cursor()
        
        # Check if exists
        c.execute("SELECT device_id FROM devices WHERE device_id = ?", (device_id,))
        if c.fetchone():
            conn.close()
            return jsonify({"msg": "Device already exists"}), 400
        
        now = datetime.datetime.utcnow().isoformat()
        c.execute("""
            INSERT INTO devices (
                device_id, device_name, device_type, capabilities,
                location, status, battery_level, signal_strength,
                cpu_usage, memory_usage, last_seen, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            device_id, device_name, device_type, capabilities,
            location, status, 100, -70, 0, 0, now, now
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({"status": "success", "message": f"Device {device_id} registered"})
    except Exception as e:
        print("Create device error:", e)
        return jsonify({"msg": str(e)}), 400


@app.route("/api/devices/<device_id>", methods=["PUT"])
@jwt_required()
def update_device(device_id):
    """Update device information"""
    try:
        data = request.json
        
        conn = sqlite3.connect(DB_NAME, timeout=5)
        c = conn.cursor()
        
        # Check if exists
        c.execute("SELECT device_id FROM devices WHERE device_id = ?", (device_id,))
        if not c.fetchone():
            conn.close()
            return jsonify({"msg": "Device not found"}), 404
        
        # Update fields
        updates = []
        values = []
        
        if "device_name" in data:
            updates.append("device_name = ?")
            values.append(data["device_name"])
        if "device_type" in data:
            updates.append("device_type = ?")
            values.append(data["device_type"])
        if "capabilities" in data:
            updates.append("capabilities = ?")
            values.append(data["capabilities"])
        if "location" in data:
            updates.append("location = ?")
            values.append(data["location"])
        if "status" in data:
            updates.append("status = ?")
            values.append(data["status"])
        if "battery_level" in data:
            updates.append("battery_level = ?")
            values.append(data["battery_level"])
        if "signal_strength" in data:
            updates.append("signal_strength = ?")
            values.append(data["signal_strength"])
        
        if updates:
            values.append(device_id)
            query = f"UPDATE devices SET {', '.join(updates)} WHERE device_id = ?"
            c.execute(query, values)
            conn.commit()
        
        conn.close()
        return jsonify({"status": "success", "message": f"Device {device_id} updated"})
    except Exception as e:
        print("Update device error:", e)
        return jsonify({"msg": str(e)}), 400


@app.route("/api/devices/<device_id>", methods=["DELETE"])
@jwt_required()
def remove_device(device_id):
    """Delete a device"""
    try:
        conn = sqlite3.connect(DB_NAME, timeout=5)
        c = conn.cursor()
        
        # Check if exists
        c.execute("SELECT device_id FROM devices WHERE device_id = ?", (device_id,))
        if not c.fetchone():
            conn.close()
            return jsonify({"msg": "Device not found"}), 404
        
        c.execute("DELETE FROM devices WHERE device_id = ?", (device_id,))
        conn.commit()
        conn.close()
        
        return jsonify({"status": "success", "message": f"Device {device_id} deleted"})
    except Exception as e:
        print("Delete device error:", e)
        return jsonify({"msg": str(e)}), 400

# ==========================================================
# RUN
# ==========================================================

if __name__ == "__main__":
    from migrate import run_migrations
    socketio.run(app, host="0.0.0.0", port=8000, allow_unsafe_werkzeug=True)

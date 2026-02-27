import sqlite3
import psutil
from fastapi import APIRouter, Depends
from core.config import DB_NAME
from core.orchestration_config import OrchestrationConfig

# ⚠️ Adjust this import to your actual JWT decorator location
from app import jwt_required   # If jwt_required is in app.py
# OR:
# from auth.jwt import jwt_required

router = APIRouter()
config = OrchestrationConfig()


# =====================================================
# GET ORCHESTRATION STATE
# =====================================================

@router.get("/api/orchestration/state")
@jwt_required()
def get_orchestration_state():

    cfg = config.get()

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    # Allocation (last 200 events)
    c.execute("""
        SELECT allocation, COUNT(*) 
        FROM events 
        WHERE id > (SELECT MAX(id)-200 FROM events)
        GROUP BY allocation
    """)
    rows = c.fetchall()

    allocation = {
        "FOG_EXECUTION": 0,
        "CLOUD_EXECUTION": 0,
        "FOG_AND_CLOUD": 0
    }

    for row in rows:
        allocation[row[0]] = row[1]

    # SLA Pressure
    c.execute("""
        SELECT COUNT(*) FROM events
        WHERE sla_violation = 1
        AND id > (SELECT MAX(id)-200 FROM events)
    """)
    violations = c.fetchone()[0]

    c.execute("""
        SELECT COUNT(*) FROM events
        WHERE id > (SELECT MAX(id)-200 FROM events)
    """)
    total = c.fetchone()[0]

    conn.close()

    sla_pressure = (violations / total) if total > 0 else 0

    return {
        **cfg,
        "fog_cpu": psutil.cpu_percent(),
        "memory_usage": psutil.virtual_memory().percent,
        "allocation": allocation,
        "sla_pressure": round(sla_pressure, 4)
    }


# =====================================================
# UPDATE CONFIG
# =====================================================

@router.post("/api/orchestration/config")
@jwt_required()
def update_orchestration(payload: dict):

    config.update(payload)

    return {
        "status": "updated",
        "new_config": config.get()
    }


# =====================================================
# RECENT DECISIONS
# =====================================================

@router.get("/api/orchestration/recent")
@jwt_required()
def get_recent_decisions(limit: int = 20):

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute("""
        SELECT timestamp, device_id, risk_score, allocation,
               fog_latency, sla_violation
        FROM events
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))

    rows = c.fetchall()
    conn.close()

    return [
        {
            "timestamp": r[0],
            "device_id": r[1],
            "risk": r[2],
            "decision": r[3],
            "latency": r[4],
            "sla_breach": bool(r[5])
        }
        for r in rows
    ]
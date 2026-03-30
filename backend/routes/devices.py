import sqlite3
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from core.config import DB_NAME
from app import jwt_required

router = APIRouter()

# =====================================================
# DEVICE REGISTRY & MANAGEMENT
# =====================================================

@router.get("/api/devices")
@jwt_required()
def get_devices():
    """Get all registered devices"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    c.execute("""
        SELECT device_id, device_name, device_type, capabilities, 
               location, status, battery_level, signal_strength,
               cpu_usage, memory_usage, last_seen, created_at
        FROM devices
        ORDER BY last_seen DESC
    """)
    
    rows = c.fetchall()
    conn.close()
    
    return [
        {
            "device_id": row[0],
            "device_name": row[1] or row[0],
            "device_type": row[2],
            "capabilities": row[3] or "[]",
            "location": row[4] or "",
            "status": row[5] or "offline",
            "battery_level": row[6] or 100,
            "signal_strength": row[7] or -70,
            "cpu_usage": row[8] or 0,
            "memory_usage": row[9] or 0,
            "last_seen": row[10],
            "created_at": row[11]
        }
        for row in rows
    ]


@router.post("/api/devices")
@jwt_required()
def register_device(device_data: dict):
    """Register a new device"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    try:
        device_id = device_data["device_id"]
        device_name = device_data.get("device_name", device_id)
        device_type = device_data.get("device_type", "iot_sensor")
        capabilities = device_data.get("capabilities", "[]")
        location = device_data.get("location", "")
        status = device_data.get("status", "offline")
        
        # Check if device already exists
        c.execute("SELECT device_id FROM devices WHERE device_id = ?", (device_id,))
        if c.fetchone():
            raise HTTPException(status_code=400, detail="Device already exists")
        
        c.execute("""
            INSERT INTO devices (
                device_id, device_name, device_type, capabilities,
                location, status, battery_level, signal_strength,
                cpu_usage, memory_usage, last_seen, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            device_id, device_name, device_type, capabilities,
            location, status, 100, -70, 0, 0, 
            datetime.utcnow().isoformat(),
            datetime.utcnow().isoformat()
        ))
        
        conn.commit()
        return {"status": "success", "message": f"Device {device_id} registered"}
    
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@router.put("/api/devices/{device_id}")
@jwt_required()
def update_device(device_id: str, device_data: dict):
    """Update device information"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    try:
        # Check if device exists
        c.execute("SELECT device_id FROM devices WHERE device_id = ?", (device_id,))
        if not c.fetchone():
            raise HTTPException(status_code=404, detail="Device not found")
        
        # Update fields
        if "device_name" in device_data:
            c.execute("UPDATE devices SET device_name = ? WHERE device_id = ?", 
                     (device_data["device_name"], device_id))
        if "device_type" in device_data:
            c.execute("UPDATE devices SET device_type = ? WHERE device_id = ?",
                     (device_data["device_type"], device_id))
        if "capabilities" in device_data:
            c.execute("UPDATE devices SET capabilities = ? WHERE device_id = ?",
                     (device_data["capabilities"], device_id))
        if "location" in device_data:
            c.execute("UPDATE devices SET location = ? WHERE device_id = ?",
                     (device_data["location"], device_id))
        if "status" in device_data:
            c.execute("UPDATE devices SET status = ? WHERE device_id = ?",
                     (device_data["status"], device_id))
        if "battery_level" in device_data:
            c.execute("UPDATE devices SET battery_level = ? WHERE device_id = ?",
                     (device_data["battery_level"], device_id))
        if "signal_strength" in device_data:
            c.execute("UPDATE devices SET signal_strength = ? WHERE device_id = ?",
                     (device_data["signal_strength"], device_id))
        
        conn.commit()
        return {"status": "success", "message": f"Device {device_id} updated"}
    
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@router.delete("/api/devices/{device_id}")
@jwt_required()
def delete_device(device_id: str):
    """Delete a device"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    try:
        # Check if device exists
        c.execute("SELECT device_id FROM devices WHERE device_id = ?", (device_id,))
        if not c.fetchone():
            raise HTTPException(status_code=404, detail="Device not found")
        
        c.execute("DELETE FROM devices WHERE device_id = ?", (device_id,))
        conn.commit()
        return {"status": "success", "message": f"Device {device_id} deleted"}
    
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        conn.close()


@router.get("/api/devices/{device_id}/health")
@jwt_required()
def get_device_health(device_id: str):
    """Get detailed device health metrics"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    
    c.execute("""
        SELECT battery_level, signal_strength, cpu_usage, 
               memory_usage, last_seen, uptime_seconds
        FROM devices
        WHERE device_id = ?
    """, (device_id,))
    
    row = c.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {
        "battery_level": row[0],
        "signal_strength": row[1],
        "cpu_usage": row[2],
        "memory_usage": row[3],
        "last_seen": row[4],
        "uptime_seconds": row[5] or 0
    }

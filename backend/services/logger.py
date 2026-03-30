import sqlite3
import time
from datetime import datetime, timezone
from core.config import DB_NAME

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    # Create events table with extended schema
    c.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT,
            temperature REAL,
            gas REAL,
            severity TEXT,
            risk_score REAL,
            allocation TEXT,
            fog_latency REAL,
            cloud_latency REAL,
            bandwidth_bytes INTEGER DEFAULT 0,
            sla_violation INTEGER,
            created_at REAL,
            timestamp TEXT,
            extra_data TEXT,
            -- Extended sensor fields
            humidity REAL,
            pressure REAL,
            light_lux REAL,
            motion INTEGER,
            sound_db REAL,
            vibration REAL,
            air_quality_index REAL,
            tank_level REAL,
            flow_rate REAL,
            power_consumption REAL,
            voltage REAL,
            current_amp REAL,
            device_battery REAL,
            signal_strength REAL,
            device_cpu REAL,
            device_memory REAL,
            network_latency REAL,
            packet_loss REAL
        )
    """)

    conn.commit()
    conn.close()


def log_event(device_id, temp, gas, severity, risk, allocation,
              fog_latency=None, cloud_latency=None,
              bandwidth_bytes=0, sla_violation=0, extra_data="{}",
              # Extended sensor parameters
              humidity=None, pressure=None, light_lux=None, motion=None,
              sound_db=None, vibration=None, air_quality_index=None,
              tank_level=None, flow_rate=None, power_consumption=None,
              voltage=None, current_amp=None, device_battery=None,
              signal_strength=None, device_cpu=None, device_memory=None,
              network_latency=None, packet_loss=None):
    """
    Log an event with extended sensor data support.
    """
    now_unix = time.time()
    now_iso = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute("""
        INSERT INTO events 
        (device_id, temperature, gas, severity, risk_score, allocation,
         fog_latency, cloud_latency, bandwidth_bytes, sla_violation,
         created_at, timestamp, extra_data,
         humidity, pressure, light_lux, motion, sound_db, vibration,
         air_quality_index, tank_level, flow_rate, power_consumption,
         voltage, current_amp, device_battery, signal_strength,
         device_cpu, device_memory, network_latency, packet_loss)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        device_id,
        temp,
        gas,
        severity,
        risk,
        allocation,
        fog_latency,
        cloud_latency,
        bandwidth_bytes,
        sla_violation,
        now_unix,
        now_iso,
        extra_data,
        # Extended fields
        humidity,
        pressure,
        light_lux,
        motion,
        sound_db,
        vibration,
        air_quality_index,
        tank_level,
        flow_rate,
        power_consumption,
        voltage,
        current_amp,
        device_battery,
        signal_strength,
        device_cpu,
        device_memory,
        network_latency,
        packet_loss
    ))

    event_id = c.lastrowid

    conn.commit()
    conn.close()

    return event_id

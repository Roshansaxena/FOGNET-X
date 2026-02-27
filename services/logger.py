import sqlite3
import time
from core.config import DB_NAME

def init_db():
    conn =  sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute("""
              CREATE TABLE IF NOT EXISTS events
              (
                  id
                  INTEGER
                  PRIMARY
                  KEY
                  AUTOINCREMENT,
                  device_id
                  TEXT,
                  temperature
                  REAL,
                  gas
                  INTEGER,
                  severity
                  TEXT,
                  risk_score
                  REAL,
                  allocation
                  TEXT,
                  fog_latency
                  REAL,
                  cloud_latency
                  REAL,
                  bandwidth_bytes
                  INTEGER
                  DEFAULT
                  0,
                  sla_violation
                  INTEGER,
                  timestamp
                  REAL
              )
              """)

    conn.commit()
    conn.close()


def log_event(device_id, temp, gas, severity, risk, allocation,
              fog_latency=None, cloud_latency=None,
              bandwidth_bytes=0, sla_violation=0):

    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute("""
        INSERT INTO events 
        (device_id, temperature, gas, severity, risk_score, allocation,
         fog_latency, cloud_latency, bandwidth_bytes, sla_violation, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        time.time()
    ))

    event_id = c.lastrowid

    conn.commit()
    conn.close()

    return event_id
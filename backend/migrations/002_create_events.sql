CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT,
    temperature REAL,
    gas REAL,
    severity TEXT,
    allocation TEXT,
    fog_latency REAL,
    cloud_latency REAL,
    bandwidth_bytes INTEGER,
    sla_violation INTEGER,
    risk_score REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

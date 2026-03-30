-- Migration 004: Extended Sensor Schema for FOGNET-X
-- Adds comprehensive sensor support and device capability tracking

-- ============================================
-- EXTENDED EVENTS TABLE (Enhanced sensor data)
-- ============================================
ALTER TABLE events ADD COLUMN humidity REAL;
ALTER TABLE events ADD COLUMN pressure REAL;
ALTER TABLE events ADD COLUMN light_lux REAL;
ALTER TABLE events ADD COLUMN motion INTEGER; -- 0 or 1
ALTER TABLE events ADD COLUMN sound_db REAL;
ALTER TABLE events ADD COLUMN vibration REAL;
ALTER TABLE events ADD COLUMN air_quality_index REAL;
ALTER TABLE events ADD COLUMN tank_level REAL;
ALTER TABLE events ADD COLUMN flow_rate REAL;
ALTER TABLE events ADD COLUMN power_consumption REAL;
ALTER TABLE events ADD COLUMN voltage REAL;
ALTER TABLE events ADD COLUMN current_amp REAL;

-- Device health metrics at event time
ALTER TABLE events ADD COLUMN device_battery REAL;
ALTER TABLE events ADD COLUMN signal_strength REAL; -- RSSI in dBm
ALTER TABLE events ADD COLUMN device_cpu REAL;
ALTER TABLE events ADD COLUMN device_memory REAL;

-- Network quality metrics
ALTER TABLE events ADD COLUMN network_latency REAL;
ALTER TABLE events ADD COLUMN packet_loss REAL;

-- ============================================
-- DEVICES TABLE (Device registry with capabilities)
-- ============================================
CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT UNIQUE NOT NULL,
    device_name TEXT,
    device_type TEXT, -- 'sensor', 'actuator', 'hybrid'
    location TEXT,
    
    -- Capabilities (JSON array of supported sensors)
    capabilities TEXT, -- e.g., '["temperature", "humidity", "gas"]'
    
    -- Hardware specs
    cpu_cores INTEGER,
    memory_mb INTEGER,
    storage_mb INTEGER,
    battery_capacity INTEGER, -- mAh
    
    -- Network specs
    network_type TEXT, -- 'wifi', 'ethernet', 'lte', 'lora'
    max_bandwidth INTEGER, -- kbps
    
    -- Current status
    status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'MAINTENANCE', 'OFFLINE'
    health_score REAL DEFAULT 100.0, -- 0-100
    
    -- Firmware
    firmware_version TEXT,
    last_heartbeat TIMESTAMP,
    
    -- Timestamps
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SENSOR_THRESHOLDS TABLE (Per-device thresholds)
-- ============================================
CREATE TABLE IF NOT EXISTS sensor_thresholds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    sensor_type TEXT NOT NULL, -- 'temperature', 'gas', 'humidity', etc.
    
    -- Threshold levels
    warning_min REAL,
    warning_max REAL,
    critical_min REAL,
    critical_max REAL,
    
    -- Calibration
    calibration_offset REAL DEFAULT 0.0,
    calibration_scale REAL DEFAULT 1.0,
    
    -- Alert settings
    alert_enabled INTEGER DEFAULT 1,
    alert_cooldown INTEGER DEFAULT 300, -- seconds between alerts
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE,
    UNIQUE(device_id, sensor_type)
);

-- ============================================
-- ACTUATOR_STATES TABLE (Track actuator commands)
-- ============================================
CREATE TABLE IF NOT EXISTS actuator_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    actuator_type TEXT NOT NULL, -- 'fan', 'vent', 'valve', 'pump', etc.
    actuator_id TEXT, -- specific actuator identifier
    
    command TEXT NOT NULL, -- 'ON', 'OFF', 'OPEN', 'CLOSE', 'SET_VALUE'
    value REAL, -- for analog actuators (0-100%)
    
    -- Command metadata
    triggered_by TEXT, -- 'AUTO', 'MANUAL', 'RULE', 'SCHEDULE'
    rule_id INTEGER, -- if triggered by rule
    user_id INTEGER, -- if manual override
    
    -- Status
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'EXECUTED', 'FAILED', 'TIMEOUT'
    executed_at TIMESTAMP,
    
    -- Context at time of command
    risk_score REAL,
    severity TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

-- ============================================
-- ALERTS TABLE (Alert history and management)
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    alert_type TEXT NOT NULL, -- 'THRESHOLD', 'OFFLINE', 'SLA_VIOLATION', 'SECURITY'
    severity TEXT NOT NULL, -- 'INFO', 'WARNING', 'CRITICAL', 'EMERGENCY'
    
    title TEXT NOT NULL,
    message TEXT,
    
    -- Alert context
    sensor_type TEXT,
    sensor_value REAL,
    threshold_value REAL,
    
    -- Notification status
    email_sent INTEGER DEFAULT 0,
    telegram_sent INTEGER DEFAULT 0,
    sms_sent INTEGER DEFAULT 0,
    
    -- Acknowledgment
    acknowledged INTEGER DEFAULT 0,
    acknowledged_by TEXT,
    acknowledged_at TIMESTAMP,
    
    -- Resolution
    resolved INTEGER DEFAULT 0,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

-- ============================================
-- ORCHESTRATION_RULES TABLE (Custom decision rules)
-- ============================================
CREATE TABLE IF NOT EXISTS orchestration_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT NOT NULL,
    rule_description TEXT,
    
    -- Rule conditions (JSON)
    conditions TEXT, -- e.g., '{"sensor": "temperature", "operator": ">", "value": 40}'
    
    -- Rule actions
    action_type TEXT, -- 'ALLOCATE_FOG', 'ALLOCATE_CLOUD', 'ALLOCATE_HYBRID', 'TRIGGER_ACTUATOR', 'SEND_ALERT'
    action_params TEXT, -- JSON parameters for action
    
    -- Rule metadata
    priority INTEGER DEFAULT 100, -- lower = higher priority
    enabled INTEGER DEFAULT 1,
    
    -- Statistics
    trigger_count INTEGER DEFAULT 0,
    last_triggered TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_events_device_id ON events(device_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);
CREATE INDEX IF NOT EXISTS idx_events_allocation ON events(allocation);

CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices(device_type);

CREATE INDEX IF NOT EXISTS idx_alerts_device ON alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);

CREATE INDEX IF NOT EXISTS idx_actuator_device ON actuator_states(device_id);
CREATE INDEX IF NOT EXISTS idx_actuator_status ON actuator_states(status);

-- ============================================
-- DEFAULT THRESHOLD CONFIGURATION
-- ============================================
INSERT OR IGNORE INTO orchestration_config (key, value) VALUES ('battery_threshold_low', '20');
INSERT OR IGNORE INTO orchestration_config (key, value) VALUES ('battery_threshold_critical', '10');
INSERT OR IGNORE INTO orchestration_config (key, value) VALUES ('signal_strength_threshold', '-85');
INSERT OR IGNORE INTO orchestration_config (key, value) VALUES ('device_cpu_threshold', '85');
INSERT OR IGNORE INTO orchestration_config (key, value) VALUES ('network_latency_threshold_ms', '100');
INSERT OR IGNORE INTO orchestration_config (key, value) VALUES ('packet_loss_threshold_pct', '5');
INSERT OR IGNORE INTO orchestration_config (key, value) VALUES ('enable_battery_aware_routing', '1');
INSERT OR IGNORE INTO orchestration_config (key, value) VALUES ('enable_network_aware_routing', '1');

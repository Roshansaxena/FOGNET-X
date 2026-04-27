-- Migration 005: Device Thresholds and Actuator Control
-- Allows users to configure thresholds and control actuators from dashboard

-- Device-specific thresholds table
CREATE TABLE IF NOT EXISTS device_thresholds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL UNIQUE,
    
    -- Temperature thresholds (°C)
    temp_warning REAL DEFAULT 35.0,
    temp_critical REAL DEFAULT 45.0,
    temp_emergency REAL DEFAULT 55.0,
    
    -- Gas thresholds (PPM)
    gas_warning REAL DEFAULT 400.0,
    gas_critical REAL DEFAULT 700.0,
    gas_emergency REAL DEFAULT 900.0,
    
    -- Humidity thresholds (%)
    humidity_warning REAL DEFAULT 80.0,
    humidity_critical REAL DEFAULT 90.0,
    
    -- Tank level thresholds (cm)
    tank_min REAL DEFAULT 10.0,
    tank_max REAL DEFAULT 100.0,
    
    -- Pressure thresholds (hPa)
    pressure_warning REAL DEFAULT 1050.0,
    pressure_critical REAL DEFAULT 1100.0,
    
    -- Actuator auto-control enabled flags
    auto_fan_enabled INTEGER DEFAULT 1,
    auto_vent_enabled INTEGER DEFAULT 1,
    auto_pump_enabled INTEGER DEFAULT 1,
    auto_alarm_enabled INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    -- Removed FOREIGN KEY to avoid issues if devices table doesn't exist yet
);

-- Actuator state tracking table
CREATE TABLE IF NOT EXISTS actuator_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    
    -- Actuator states
    fan_state TEXT DEFAULT 'OFF',  -- ON/OFF
    vent_state TEXT DEFAULT 'CLOSED',  -- OPEN/CLOSED
    pump_state TEXT DEFAULT 'OFF',  -- ON/OFF
    alarm_state TEXT DEFAULT 'OFF',  -- ON/OFF
    
    -- Control mode
    control_mode TEXT DEFAULT 'AUTO',  -- AUTO/MANUAL
    
    -- Last command timestamp
    last_command_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(device_id)
    -- Removed FOREIGN KEY to avoid issues if devices table doesn't exist yet
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_thresholds_device ON device_thresholds(device_id);
CREATE INDEX IF NOT EXISTS idx_actuators_device ON actuator_states(device_id);

-- Note: Data will be populated automatically when devices register
-- via the API endpoints or when thresholds are configured from dashboard

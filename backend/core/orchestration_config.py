import sqlite3
import threading
import time
from typing import Dict, Any, Optional
from core.config import DB_NAME


class OrchestrationConfig:
    """
    Enhanced orchestration configuration with support for:
    - Battery-aware routing
    - Network-aware routing  
    - Multi-sensor thresholds
    - SLA constraints
    - Device capability matching
    """

    DEFAULTS = {
        # Core allocation settings
        "mode": "dynamic",
        "risk_threshold": 0.6,
        "sla_fog_ms": 50,
        "sla_cloud_ms": 1000,
        "cpu_threshold": 80,
        
        # Battery-aware routing
        "enable_battery_aware_routing": 1,
        "battery_threshold_low": 20,
        "battery_threshold_critical": 10,
        "battery_saving_mode": 0,
        
        # Network-aware routing
        "enable_network_aware_routing": 1,
        "network_latency_threshold_ms": 100,
        "packet_loss_threshold_pct": 5,
        "signal_strength_threshold": -85,
        "jitter_threshold_ms": 30,
        
        # Device health thresholds
        "device_cpu_threshold": 85,
        "device_memory_threshold": 90,
        "device_health_min_score": 50,
        
        # Multi-sensor decision weights (can be tuned)
        "weight_temperature": 0.20,
        "weight_gas": 0.25,
        "weight_humidity": 0.05,
        "weight_pressure": 0.05,
        "weight_air_quality": 0.15,
        "weight_vibration": 0.10,
        "weight_motion": 0.05,
        "weight_sound": 0.05,
        
        # Sensor thresholds
        "temp_warning": 35,
        "temp_critical": 45,
        "temp_emergency": 55,
        "gas_warning": 400,
        "gas_critical": 700,
        "gas_emergency": 900,
        "humidity_warning": 80,
        "humidity_critical": 90,
        "aqi_warning": 100,
        "aqi_critical": 150,
        "aqi_emergency": 200,
        
        # Alert settings
        "alert_cooldown_seconds": 300,
        "enable_email_alerts": 1,
        "enable_telegram_alerts": 1,
        "critical_alert_threshold": 5,
        
        # Advanced features
        "enable_predictive_allocation": 0,
        "enable_ml_decisions": 0,
        "enable_multi_fog": 0,
    }

    REFRESH_INTERVAL = 5  # seconds

    def __init__(self):
        self._lock = threading.Lock()
        self._cache = {}
        self.ensure_table()
        self._load_from_db()
        self._start_refresh_thread()

    # ==========================
    # DATABASE SETUP
    # ==========================

    def ensure_table(self):
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("""
            CREATE TABLE IF NOT EXISTS orchestration_config (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        """)
        conn.commit()

        for k, v in self.DEFAULTS.items():
            c.execute(
                "INSERT OR IGNORE INTO orchestration_config (key, value) VALUES (?, ?)",
                (k, str(v))
            )

        conn.commit()
        conn.close()

    # ==========================
    # CACHE MANAGEMENT
    # ==========================

    def _load_from_db(self):
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("SELECT key, value FROM orchestration_config")
        rows = c.fetchall()
        conn.close()

        with self._lock:
            self._cache = {
                k: self._cast(k, v)
                for k, v in rows
            }

    def get(self):
        with self._lock:
            return dict(self._cache)

    def update(self, updates: dict):
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()

        for k, v in updates.items():
            if k in self.DEFAULTS:
                c.execute(
                    "UPDATE orchestration_config SET value=? WHERE key=?",
                    (str(v), k)
                )

        conn.commit()
        conn.close()

        # Immediately refresh cache
        self._load_from_db()

    # ==========================
    # BACKGROUND REFRESH
    # ==========================

    def _start_refresh_thread(self):
        thread = threading.Thread(
            target=self._auto_refresh,
            daemon=True
        )
        thread.start()

    def _auto_refresh(self):
        while True:
            time.sleep(self.REFRESH_INTERVAL)
            self._load_from_db()

    # ==========================
    # TYPE CASTING
    # ==========================

    def _cast(self, key, value):
        # Float values
        if key in ["risk_threshold"]:
            return float(value)
        
        # Integer values (all thresholds and flags)
        int_keys = [
            "sla_fog_ms", "sla_cloud_ms", "cpu_threshold",
            "battery_threshold_low", "battery_threshold_critical",
            "network_latency_threshold_ms", "packet_loss_threshold_pct",
            "signal_strength_threshold", "jitter_threshold_ms",
            "device_cpu_threshold", "device_memory_threshold", "device_health_min_score",
            "temp_warning", "temp_critical", "temp_emergency",
            "gas_warning", "gas_critical", "gas_emergency",
            "humidity_warning", "humidity_critical",
            "aqi_warning", "aqi_critical", "aqi_emergency",
            "alert_cooldown_seconds", "critical_alert_threshold",
            "enable_battery_aware_routing", "battery_saving_mode",
            "enable_network_aware_routing", "enable_email_alerts",
            "enable_telegram_alerts", "enable_predictive_allocation",
            "enable_ml_decisions", "enable_multi_fog"
        ]
        if key in int_keys:
            return int(value)
        
        # Float weights
        if key.startswith("weight_"):
            return float(value)
        
        return value

    def get_sensor_thresholds(self) -> Dict[str, Dict[str, int]]:
        """Get all sensor thresholds as structured dict"""
        cfg = self.get()
        return {
            'temperature': {
                'warning': cfg.get('temp_warning', 35),
                'critical': cfg.get('temp_critical', 45),
                'emergency': cfg.get('temp_emergency', 55)
            },
            'gas': {
                'warning': cfg.get('gas_warning', 400),
                'critical': cfg.get('gas_critical', 700),
                'emergency': cfg.get('gas_emergency', 900)
            },
            'humidity': {
                'warning': cfg.get('humidity_warning', 80),
                'critical': cfg.get('humidity_critical', 90)
            },
            'air_quality': {
                'warning': cfg.get('aqi_warning', 100),
                'critical': cfg.get('aqi_critical', 150),
                'emergency': cfg.get('aqi_emergency', 200)
            }
        }

    def get_sensor_weights(self) -> Dict[str, float]:
        """Get all sensor weights for decision making"""
        cfg = self.get()
        return {
            'temperature': cfg.get('weight_temperature', 0.20),
            'gas': cfg.get('weight_gas', 0.25),
            'humidity': cfg.get('weight_humidity', 0.05),
            'pressure': cfg.get('weight_pressure', 0.05),
            'air_quality': cfg.get('weight_air_quality', 0.15),
            'vibration': cfg.get('weight_vibration', 0.10),
            'motion': cfg.get('weight_motion', 0.05),
            'sound': cfg.get('weight_sound', 0.05)
        }
import sqlite3
import threading
import time
from core.config import DB_NAME


class OrchestrationConfig:

    DEFAULTS = {
        "mode": "dynamic",
        "risk_threshold": 0.6,
        "sla_fog_ms": 50,
        "sla_cloud_ms": 1000,
        "cpu_threshold": 80
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
        if key == "risk_threshold":
            return float(value)
        if key in ["sla_fog_ms", "sla_cloud_ms", "cpu_threshold"]:
            return int(value)
        return value
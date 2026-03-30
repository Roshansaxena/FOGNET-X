import sqlite3
import os
from flask_bcrypt import Bcrypt

DB_PATH = os.getenv("DB_PATH", "/data/fognetx.db")
MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "migrations")


def ensure_extended_schema():
    """Add any missing columns to the events table and create all required tables (safe to run multiple times)"""
    conn = sqlite3.connect(DB_PATH)
    cols = [r[1] for r in conn.execute("PRAGMA table_info(events)").fetchall()]

    # Create events table if it doesn't exist
    conn.execute("""
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

    # Create devices table if it doesn't exist
    conn.execute("""
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT UNIQUE,
            device_name TEXT,
            device_type TEXT DEFAULT 'iot_sensor',
            capabilities TEXT DEFAULT '["temperature","gas"]',
            location TEXT DEFAULT 'Factory Floor',
            status TEXT DEFAULT 'online',
            battery_level REAL DEFAULT 100,
            signal_strength REAL DEFAULT -70,
            cpu_usage REAL DEFAULT 0,
            memory_usage REAL DEFAULT 0,
            last_seen TEXT,
            created_at TEXT
        )
    """)
    print('Schema: devices table ensured.')

    new_cols = [
        ('timestamp', 'TEXT'), ('extra_data', 'TEXT'),
        ('humidity', 'REAL'), ('pressure', 'REAL'), ('light_lux', 'REAL'),
        ('motion', 'INTEGER'), ('sound_db', 'REAL'), ('vibration', 'REAL'),
        ('air_quality_index', 'REAL'), ('tank_level', 'REAL'), ('flow_rate', 'REAL'),
        ('power_consumption', 'REAL'), ('voltage', 'REAL'), ('current_amp', 'REAL'),
        ('device_battery', 'REAL'), ('signal_strength', 'REAL'),
        ('device_cpu', 'REAL'), ('device_memory', 'REAL'),
        ('network_latency', 'REAL'), ('packet_loss', 'REAL'),
    ]
    for col, typ in new_cols:
        if col not in cols:
            conn.execute(f'ALTER TABLE events ADD COLUMN {col} {typ}')
            print(f'  Schema: Added column {col}')

    # Backfill timestamp from created_at
    conn.execute("UPDATE events SET timestamp = datetime(created_at, 'unixepoch') WHERE timestamp IS NULL AND created_at IS NOT NULL")
    conn.commit()
    conn.close()
    print("Schema migration complete.")


def run_migrations():
    """Run SQL migration files from migrations directory (only if tables don't exist yet)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if events table already exists - if so, skip old migrations
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='events'")
    if cursor.fetchone():
        print("Events table already exists - skipping legacy migrations")
        conn.close()
        return

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE
        )
    """)

    applied = {
        row[0] for row in cursor.execute("SELECT filename FROM schema_migrations")
    }

    for filename in sorted(os.listdir(MIGRATIONS_DIR)):
        if filename.endswith(".sql") and filename not in applied:
            print(f"Applying migration: {filename}")
            with open(os.path.join(MIGRATIONS_DIR, filename), "r") as f:
                cursor.executescript(f.read())
            cursor.execute(
                "INSERT INTO schema_migrations (filename) VALUES (?)",
                (filename,)
            )

    conn.commit()
    conn.close()
    print("Database migrations complete.")

def seed_admin():
    bcrypt = Bcrypt()

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # ensure users table exists (safety)
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        )
    """)

    # check admin
    c.execute("SELECT * FROM users WHERE username = ?", ("admin",))
    if not c.fetchone():
        hashed = bcrypt.generate_password_hash("admin123").decode("utf-8")

        c.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            ("admin", hashed, "admin")
        )

        print("✅ Admin user created: admin / admin123")

    conn.commit()
    conn.close()


# ----------------------------------
# ✅ RUN EVERYTHING
# ----------------------------------

if __name__ == "__main__":
    ensure_extended_schema()
    run_migrations()
    seed_admin()


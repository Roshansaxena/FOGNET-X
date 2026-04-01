#!/bin/bash

echo "Setting up FOGNET-X database migration system..."

BACKEND_DIR="backend"
MIGRATIONS_DIR="$BACKEND_DIR/migrations"

# Create migrations directory
mkdir -p "$MIGRATIONS_DIR"

# ------------------------------
# 001_create_users.sql
# ------------------------------
if [ ! -f "$MIGRATIONS_DIR/001_create_users.sql" ]; then
cat <<EOF > "$MIGRATIONS_DIR/001_create_users.sql"
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT NOT NULL
);
EOF
echo "Created 001_create_users.sql"
else
echo "001_create_users.sql already exists"
fi

# ------------------------------
# 002_create_events.sql
# ------------------------------
if [ ! -f "$MIGRATIONS_DIR/002_create_events.sql" ]; then
cat <<EOF > "$MIGRATIONS_DIR/002_create_events.sql"
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
EOF
echo "Created 002_create_events.sql"
else
echo "002_create_events.sql already exists"
fi

# ------------------------------
# migrate.py
# ------------------------------
if [ ! -f "$BACKEND_DIR/migrate.py" ]; then
cat <<EOF > "$BACKEND_DIR/migrate.py"
import sqlite3
import os

DB_PATH = os.getenv("DB_NAME", "fognetx.db")
MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "migrations")

def run_migrations():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

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
EOF
echo "Created migrate.py"
else
echo "migrate.py already exists"
fi

# ------------------------------
# create_admin.py
# ------------------------------
if [ ! -f "$BACKEND_DIR/create_admin.py" ]; then
cat <<EOF > "$BACKEND_DIR/create_admin.py"
import sqlite3
from flask_bcrypt import Bcrypt
from cloud_server import app

bcrypt = Bcrypt(app)

username = input("Admin username: ")
password = input("Admin password: ")

conn = sqlite3.connect("fognetx.db")
c = conn.cursor()

hashed = bcrypt.generate_password_hash(password).decode("utf-8")

c.execute(
    "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
    (username, hashed, "admin")
)

conn.commit()
conn.close()

print("Admin created successfully.")
EOF
echo "Created create_admin.py"
else
echo "create_admin.py already exists"
fi

echo "Database setup files ready."

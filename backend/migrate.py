import sqlite3
import os
from flask_bcrypt import Bcrypt

DB_PATH = os.getenv("DB_PATH", "/data/fognetx.db")
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
    run_migrations()
    seed_admin()


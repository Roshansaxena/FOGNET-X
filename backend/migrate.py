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

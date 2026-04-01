import sqlite3
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()

conn = sqlite3.connect("fognetx.db")
c = conn.cursor()

c.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
    )
""")

username = "admin"
password = "admin123"
role = "admin"

hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")

c.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
          (username, hashed_pw, role))

conn.commit()
conn.close()

print("✅ Admin recreated successfully")
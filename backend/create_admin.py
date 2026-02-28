import sqlite3
from flask_bcrypt import Bcrypt
from cloud_server import app

bcrypt = Bcrypt(app)

username = input("Admin username: ")
password = input("Admin password: ")

conn = sqlite3.connect("fognetx.db")
c = conn.cursor()

# Check if admin already exists
c.execute("SELECT * FROM users WHERE username = ?", (username,))
existing_user = c.fetchone()

if existing_user:
    print("❌ Admin already exists.")
else:
    hashed = bcrypt.generate_password_hash(password).decode("utf-8")

    c.execute(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        (username, hashed, "admin")
    )

    conn.commit()
    print("✅ Admin created successfully.")

conn.close()
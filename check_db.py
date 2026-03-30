import sqlite3

DB = '/app/fognetx.db'
conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row

print("=== Event Count ===")
print("Total:", conn.execute("SELECT COUNT(*) FROM events").fetchone()[0])

print("\n=== Latest 3 Events (full sensor data) ===")
rows = conn.execute("""
    SELECT device_id, timestamp, temperature, gas, humidity, pressure,
           power_consumption, network_latency, device_cpu, severity
    FROM events ORDER BY id DESC LIMIT 3
""").fetchall()
for r in rows:
    print(dict(r))

print("\n=== Unique devices ===")
devs = conn.execute("SELECT DISTINCT device_id FROM events ORDER BY device_id").fetchall()
for d in devs:
    print(" -", d[0])

conn.close()

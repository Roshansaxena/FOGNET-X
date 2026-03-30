import sqlite3

DB = '/app/fognetx.db'
conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row

# Check warehouse device specifically (has humidity)
rows = conn.execute("""
    SELECT device_id, timestamp, temperature, gas, humidity, pressure,
           motion, network_latency, device_cpu, device_battery, severity
    FROM events WHERE device_id = 'warehouse_zone_1'
    ORDER BY id DESC LIMIT 5
""").fetchall()
print("=== warehouse_zone_1 latest events ===")
for r in rows:
    print(dict(r))

# Check factory floor (has sound_db, vibration)
rows2 = conn.execute("""
    SELECT device_id, timestamp, temperature, gas, humidity, sound_db, vibration, motion
    FROM events WHERE device_id = 'factory_floor_1'
    ORDER BY id DESC LIMIT 3
""").fetchall()
print("\n=== factory_floor_1 latest events ===")
for r in rows2:
    print(dict(r))

# Check hvac (has power, voltage)
rows3 = conn.execute("""
    SELECT device_id, timestamp, temperature, power_consumption, voltage, device_cpu
    FROM events WHERE device_id = 'hvac_controller_1'
    ORDER BY id DESC LIMIT 3
""").fetchall()
print("\n=== hvac_controller_1 latest events ===")
for r in rows3:
    print(dict(r))

conn.close()

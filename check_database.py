import sqlite3
import os

# Check both possible locations
if os.path.exists("fognetx.db"):
    DB_NAME = "fognetx.db"
elif os.path.exists("backend/fognetx.db"):
    DB_NAME = "backend/fognetx.db"
else:
    print("❌ Database file not found!")
    print("Looked in:")
    print("  - fognetx.db")
    print("  - backend/fognetx.db")
    exit(1)

print("🔍 Checking FOGNET-X Database...\n")

try:
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    
    # Check devices table
    print("📱 Devices Table:")
    try:
        devices = conn.execute("SELECT device_id, device_name, status, last_seen FROM devices ORDER BY last_seen DESC").fetchall()
        if devices:
            for d in devices:
                print(f"  - {d['device_id']} ({d['device_name']}) - {d['status']} - Last seen: {d['last_seen']}")
        else:
            print("  ⚠️  No devices found in devices table")
    except sqlite3.OperationalError as e:
        print(f"  ❌ Error: {e}")
    
    print()
    
    # Check events table (fallback for devices)
    print("📊 Events Table (device IDs):")
    try:
        events = conn.execute("""
            SELECT DISTINCT device_id, MAX(timestamp) as last_seen 
            FROM events 
            GROUP BY device_id 
            ORDER BY last_seen DESC
        """).fetchall()
        if events:
            for e in events:
                print(f"  - {e['device_id']} - Last event: {e['last_seen']}")
            print(f"\n  ✅ Found {len(events)} unique device(s) in events")
        else:
            print("  ⚠️  No events found")
    except sqlite3.OperationalError as e:
        print(f"  ❌ Error: {e}")
    
    print()
    
    # Check device_thresholds table
    print("🎛️ Device Thresholds Table:")
    try:
        thresholds = conn.execute("SELECT device_id FROM device_thresholds").fetchall()
        if thresholds:
            for t in thresholds:
                print(f"  - {t['device_id']}")
            print(f"\n  ✅ Found {len(thresholds)} device(s) with thresholds")
        else:
            print("  ⚠️  No thresholds configured")
    except sqlite3.OperationalError as e:
        print(f"  ❌ Error: {e}")
    
    print()
    
    # Check actuator_states table
    print("🎮 Actuator States Table:")
    try:
        actuators = conn.execute("SELECT device_id, fan_state, vent_state, control_mode FROM actuator_states").fetchall()
        if actuators:
            for a in actuators:
                print(f"  - {a['device_id']} - Fan: {a['fan_state']}, Vent: {a['vent_state']}, Mode: {a['control_mode']}")
            print(f"\n  ✅ Found {len(actuators)} device(s) with actuator states")
        else:
            print("  ⚠️  No actuator states found")
    except sqlite3.OperationalError as e:
        print(f"  ❌ Error: {e}")
    
    print()
    
    # Total events count
    print("📈 Event Statistics:")
    try:
        total = conn.execute("SELECT COUNT(*) as count FROM events").fetchone()
        print(f"  Total events: {total['count']}")
        
        if total['count'] > 0:
            latest = conn.execute("SELECT device_id, timestamp FROM events ORDER BY id DESC LIMIT 1").fetchone()
            print(f"  Latest event: {latest['device_id']} at {latest['timestamp']}")
    except:
        pass
    
    conn.close()
    
    print("\n✅ Database check complete!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

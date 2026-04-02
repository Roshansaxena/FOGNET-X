"""
Check Registered Devices in Database
=====================================
Quick script to see all registered devices and their status.

Usage: python check_devices.py
"""

import sqlite3
import os

DB_PATH = os.getenv("DB_PATH", "fognetx.db")

def check_devices():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        print("\n📱 REGISTERED DEVICES")
        print("=" * 80)
        
        c.execute("""
            SELECT device_id, device_name, status, location, 
                   last_seen, created_at
            FROM devices
            ORDER BY last_seen DESC
        """)
        
        rows = c.fetchall()
        
        if not rows:
            print("No devices registered yet.")
            print("\n💡 Tip: Run 'python test_mqtt_device.py' to simulate a device!")
        else:
            print(f"{'Device ID':<25} {'Name':<20} {'Status':<10} {'Last Seen':<25}")
            print("-" * 80)
            
            for row in rows:
                device_id = row[0]
                device_name = row[1] or "N/A"
                status = row[4] or "offline"
                last_seen = row[4] or "Never"
                
                # Truncate long strings
                if len(device_name) > 18:
                    device_name = device_name[:17] + "..."
                if len(last_seen) > 23:
                    last_seen = last_seen[:20] + "..."
                
                print(f"{device_id:<25} {device_name:<20} {status:<10} {last_seen:<25}")
        
        print("=" * 80)
        print(f"\nTotal devices: {len(rows)}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print(f"\nMake sure the database exists at: {DB_PATH}")
        print("Try running from the backend directory or set DB_PATH environment variable.")

if __name__ == "__main__":
    check_devices()

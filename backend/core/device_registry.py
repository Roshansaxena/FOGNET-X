import time
import sqlite3
from datetime import datetime
from core.config import DB_NAME

class DeviceRegistry:

    def __init__(self):
        self.devices = {}

    def register_device(self, device_id):
        if device_id not in self.devices:
            self.devices[device_id] = {
                "last_seen": time.time(),
                "status": "ACTIVE"
            }

    def update_heartbeat(self, device_id):
        if device_id in self.devices:
            self.devices[device_id]["last_seen"] = time.time()

    def check_health(self, timeout=10):
        """Check device health and update database with offline status."""
        current_time = time.time()
        for device_id, data in self.devices.items():
            if current_time - data["last_seen"] > timeout:
                # Update in-memory status
                if data["status"] != "INACTIVE":  # Only print on first detection
                    data["status"] = "INACTIVE"
                    print(f"⚠️ Device {device_id} went OFFLINE (no heartbeat for {round(current_time - data['last_seen'])}s)")
                
                # Also update database status to OFFLINE
                try:
                    conn = sqlite3.connect(DB_NAME)
                    c = conn.cursor()
                    c.execute("""
                        UPDATE devices 
                        SET status = 'offline', last_seen = ?
                        WHERE device_id = ?
                    """, (datetime.utcnow().isoformat(), device_id))
                    conn.commit()
                    conn.close()
                except Exception as e:
                    print(f"⚠️ Error updating device status: {e}")

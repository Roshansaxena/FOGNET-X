import time

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
        current_time = time.time()
        for device_id, data in self.devices.items():
            if current_time - data["last_seen"] > timeout:
                data["status"] = "INACTIVE"

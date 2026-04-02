import random
import time
import json
import paho.mqtt.client as mqtt
import argparse
from datetime import datetime

# Configuration
BROKER = "80.225.213.210"
TOPIC = "fognetx/sensors"

# Device profiles for realistic simulation
DEVICE_PROFILES = {
    "factory_floor_1": {
        "type": "industrial",
        "location": "Factory Floor A",
        "capabilities": ["temperature", "gas", "humidity", "vibration", "sound_db", "motion"],
        "base_temp": 30, "temp_var": 10,
        "base_gas": 300, "gas_var": 200,
        "has_battery": False
    },
    "warehouse_zone_1": {
        "type": "warehouse", 
        "location": "Warehouse Zone 1",
        "capabilities": ["temperature", "humidity", "motion", "light_lux", "air_quality_index"],
        "base_temp": 25, "temp_var": 8,
        "base_gas": 200, "gas_var": 100,
        "has_battery": True, "battery_drain": 0.1
    },
    "tank_monitor_1": {
        "type": "tank",
        "location": "Storage Tank 1", 
        "capabilities": ["temperature", "tank_level", "pressure", "flow_rate", "gas"],
        "base_temp": 22, "temp_var": 5,
        "base_gas": 250, "gas_var": 150,
        "has_battery": True, "battery_drain": 0.05
    },
    "hvac_controller_1": {
        "type": "hvac",
        "location": "Server Room",
        "capabilities": ["temperature", "humidity", "power_consumption", "voltage", "current"],
        "base_temp": 35, "temp_var": 15,
        "base_gas": 200, "gas_var": 50,
        "has_battery": False
    },
    "outdoor_sensor_1": {
        "type": "environmental",
        "location": "Building Exterior",
        "capabilities": ["temperature", "humidity", "pressure", "light_lux", "air_quality_index"],
        "base_temp": 28, "temp_var": 12,
        "base_gas": 150, "gas_var": 80,
        "has_battery": True, "battery_drain": 0.08
    }
}


class DeviceSimulator:
    """Advanced device simulator with realistic sensor behavior"""
    
    def __init__(self, device_id, profile):
        self.device_id = device_id
        self.profile = profile
        self.battery = 100.0 if profile.get("has_battery") else None
        self.uptime = 0
        self.sequence = 0
        
        # Simulated device specs
        self.cpu_usage = random.uniform(20, 40)
        self.memory_usage = random.uniform(30, 50)
        self.signal_strength = random.uniform(-75, -65)
        
    def generate_reading(self):
        """Generate realistic sensor readings based on device profile"""
        self.sequence += 1
        self.uptime += 1
        
        # Update device health metrics
        self.cpu_usage = max(10, min(95, self.cpu_usage + random.uniform(-5, 5)))
        self.memory_usage = max(20, min(90, self.memory_usage + random.uniform(-3, 3)))
        self.signal_strength = max(-95, min(-50, self.signal_strength + random.uniform(-2, 2)))
        
        # Drain battery if applicable
        if self.battery is not None:
            self.battery = max(0, self.battery - self.profile.get("battery_drain", 0.1))
        
        # Generate sensor data
        payload = {
            "device_id": self.device_id,
            "device_type": self.profile["type"],
            "location": self.profile["location"],
            "firmware_version": "2.1.0",
            "sequence": self.sequence,
            "uptime": self.uptime,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Add capabilities
        payload["capabilities"] = self.profile["capabilities"]
        
        # Temperature (with occasional spikes)
        if "temperature" in self.profile["capabilities"]:
            temp_spike = random.random() < 0.05  # 5% chance of spike
            if temp_spike:
                temp = self.profile["base_temp"] + random.uniform(15, 25)
            else:
                temp = self.profile["base_temp"] + random.uniform(-self.profile["temp_var"]/2, self.profile["temp_var"]/2)
            payload["temperature"] = round(temp, 1)
        
        # Gas (PPM)
        if "gas" in self.profile["capabilities"]:
            gas_spike = random.random() < 0.03  # 3% chance of gas leak simulation
            if gas_spike:
                gas = self.profile["base_gas"] + random.uniform(300, 600)
            else:
                gas = max(0, self.profile["base_gas"] + random.uniform(-self.profile["gas_var"]/2, self.profile["gas_var"]/2))
            payload["gas"] = round(gas, 1)
        
        # Humidity (%)
        if "humidity" in self.profile["capabilities"]:
            payload["humidity"] = round(random.uniform(30, 85), 1)
        
        # Pressure (hPa)
        if "pressure" in self.profile["capabilities"]:
            payload["pressure"] = round(random.uniform(980, 1030), 1)
        
        # Light/Lux
        if "light_lux" in self.profile["capabilities"]:
            # Simulate day/night cycle roughly
            hour = datetime.now().hour
            if 6 <= hour <= 18:  # Daytime
                lux = random.uniform(500, 5000)
            else:  # Nighttime
                lux = random.uniform(0, 50)
            payload["light_lux"] = round(lux, 1)
        
        # Motion (PIR)
        if "motion" in self.profile["capabilities"]:
            payload["motion"] = 1 if random.random() < 0.3 else 0
        
        # Sound/dB
        if "sound_db" in self.profile["capabilities"]:
            payload["sound_db"] = round(random.uniform(40, 75), 1)
        
        # Vibration (Hz)
        if "vibration" in self.profile["capabilities"]:
            # Occasional high vibration
            vib = random.uniform(0, 5) if random.random() < 0.95 else random.uniform(10, 25)
            payload["vibration"] = round(vib, 2)
        
        # Air Quality Index
        if "air_quality_index" in self.profile["capabilities"]:
            aqi = random.uniform(30, 100)
            if random.random() < 0.05:  # Occasional poor air quality
                aqi = random.uniform(100, 180)
            payload["air_quality_index"] = round(aqi, 1)
        
        # Tank Level (%)
        if "tank_level" in self.profile["capabilities"]:
            # Slowly depleting tank
            base_level = 50 - (self.sequence * 0.1) % 50
            payload["tank_level"] = round(max(0, base_level + random.uniform(-2, 2)), 1)
        
        # Flow Rate (L/min)
        if "flow_rate" in self.profile["capabilities"]:
            payload["flow_rate"] = round(random.uniform(0, 50), 1)
        
        # Power consumption (W)
        if "power_consumption" in self.profile["capabilities"]:
            payload["power_consumption"] = round(random.uniform(50, 500), 1)
        
        # Voltage (V)
        if "voltage" in self.profile["capabilities"]:
            payload["voltage"] = round(random.uniform(220, 240), 1)
        
        # Current (A)
        if "current" in self.profile["capabilities"]:
            payload["current"] = round(random.uniform(0.5, 10), 2)
        
        # Device health metrics
        if self.battery is not None:
            payload["battery"] = round(self.battery, 1)
        payload["rssi"] = round(self.signal_strength, 1)
        payload["device_cpu"] = round(self.cpu_usage, 1)
        payload["device_memory"] = round(self.memory_usage, 1)
        
        # Network simulation
        payload["network_latency"] = round(random.uniform(20, 150), 1)
        payload["packet_loss"] = round(random.uniform(0, 2), 2)
        
        return payload


def main():
    parser = argparse.ArgumentParser(description='FOGNET-X Advanced Device Simulator')
    parser.add_argument('--broker', default=BROKER, help='MQTT broker address')
    parser.add_argument('--rate', type=float, default=1.0, help='Message rate per second')
    parser.add_argument('--devices', type=int, default=5, help='Number of devices to simulate')
    args = parser.parse_args()
    
    # Setup MQTT
    client = mqtt.Client(protocol=mqtt.MQTTv311)
    client.connect(args.broker, 1883)
    
    # Create device simulators
    device_names = list(DEVICE_PROFILES.keys())[:args.devices]
    simulators = [
        DeviceSimulator(name, DEVICE_PROFILES[name]) 
        for name in device_names
    ]
    
    print(f"[INFO] Starting Advanced Multi-Device Simulation...")
    print(f"[INFO] Broker: {args.broker}")
    print(f"[INFO] Devices: {len(simulators)}")
    print(f"[INFO] Rate: {args.rate} msg/sec")
    print("-" * 60)
    
    try:
        while True:
            # Randomly select a device to send data
            device = random.choice(simulators)
            payload = device.generate_reading()
            
            # Publish
            client.publish(TOPIC, json.dumps(payload))
            
            # Print summary
            sensors = []
            if "temperature" in payload:
                sensors.append(f"T:{payload['temperature']:.1f}°C")
            if "gas" in payload:
                sensors.append(f"G:{payload['gas']:.0f}ppm")
            if "humidity" in payload:
                sensors.append(f"H:{payload['humidity']:.0f}%")
            if "battery" in payload:
                sensors.append(f"B:{payload['battery']:.0f}%")
            
            print(f"[{payload['device_type']:12}] {device.device_id:20} | {' | '.join(sensors)}")
            
            time.sleep(1.0 / args.rate)
            
    except KeyboardInterrupt:
        print("\n[INFO] Simulation stopped")


if __name__ == "__main__":
    main()

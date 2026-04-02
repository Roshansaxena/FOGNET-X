"""
Test MQTT Device Auto-Registration
====================================
This script simulates an ESP8266 device connecting to MQTT broker
and publishing sensor data. Use this to test auto-registration without Arduino.

Usage: python test_mqtt_device.py
"""

import paho.mqtt.client as mqtt
import json
import time

# Configuration
MQTT_BROKER = "localhost"  # or your fog node IP
DEVICE_ID = "arduino_factory_01"

def main():
    print("🤖 FOGNET-X MQTT Device Simulator")
    print("=" * 50)
    print(f"Device ID: {DEVICE_ID}")
    print(f"Broker: {MQTT_BROKER}:1883")
    print("=" * 50)
    
    # Simple synchronous approach (like simulate_devices.py)
    client = mqtt.Client(client_id=DEVICE_ID)
    
    try:
        print(f"\n🔌 Connecting to MQTT broker...")
        client.connect(MQTT_BROKER, 1883, 60)
        client.loop_start()  # Start background loop
        
        print("✅ Connected! Starting data publication...")
        
        import random
        counter = 0
        while True:
            counter += 1
            
            # Simulate sensor readings
            payload = {
                "device_id": DEVICE_ID,
                "temp": round(random.uniform(25.0, 35.0), 2),
                "humidity": round(random.uniform(40.0, 70.0), 2),
                "gas": random.randint(100, 500),
                "gas_alert": 1 if random.random() > 0.8 else 0,
                "motion": random.randint(0, 1),
                "tank_dist": round(random.uniform(10.0, 50.0), 2),
                "tank_overflow": 0,
                "security": "SECURE"
            }
            
            # Publish to sensor topic
            client.publish("factory/sensor/data", json.dumps(payload))
            client.publish("factory/status/heartbeat", "alive")
            
            print(f"📊 Published: Temp={payload['temp']}°C | Gas={payload['gas']} | Motion={payload['motion']}")
            
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("\n⏹ Stopped by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure:")
        print("  1. Docker containers are running: docker-compose up -d")
        print("  2. MQTT broker is accessible on port 1883")
        print("  3. Check firewall settings")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()

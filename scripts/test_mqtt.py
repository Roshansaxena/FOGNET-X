#!/usr/bin/env python3
"""
Quick MQTT test script to verify connectivity
"""
import paho.mqtt.client as mqtt
import json
import time
import sys

BROKER = "localhost"
PORT = 1883
TOPIC = "fognetx/sensors"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Connected to MQTT broker")
        print(f"📡 Publishing to topic: {TOPIC}")
    else:
        print(f"❌ Connection failed with code: {rc}")
        sys.exit(1)

def on_publish(client, userdata, mid):
    print(f"✅ Message {mid} published successfully")

client = mqtt.Client()
client.on_connect = on_connect
client.on_publish = on_publish

print(f"Connecting to {BROKER}:{PORT}...")
try:
    client.connect(BROKER, PORT, 60)
    client.loop_start()
    
    # Send test message
    test_data = {
        "device_id": "test_device",
        "temperature": 35.5,
        "gas": 450,
        "humidity": 60,
        "pressure": 1015,
        "timestamp": time.time()
    }
    
    print(f"\nSending test data: {json.dumps(test_data, indent=2)}")
    result = client.publish(TOPIC, json.dumps(test_data))
    
    if result.rc == 0:
        print("✅ Message queued for delivery")
    else:
        print(f"❌ Failed to queue message: {result.rc}")
    
    time.sleep(2)
    client.loop_stop()
    client.disconnect()
    print("\n✅ Test complete")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)

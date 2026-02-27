import random
import time
import json
import paho.mqtt.client as mqtt

BROKER = "localhost"
TOPIC = "fognetx/sensors"

client = mqtt.Client()
client.connect(BROKER, 1883)

device_ids = [f"esp{i}" for i in range(1, 6)]  # 5 devices

print("📡 Starting Multi-Device Simulation...")

while True:
    device_id = random.choice(device_ids)

    temperature = random.randint(25, 45)
    gas = random.randint(200, 800)

    payload = {
        "device_id": device_id,
        "temperature": temperature,
        "gas": gas
    }

    client.publish(TOPIC, json.dumps(payload))

    print(f"Sent from {device_id} | Temp: {temperature} | Gas: {gas}")

    time.sleep(1)

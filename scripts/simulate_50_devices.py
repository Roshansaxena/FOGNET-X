import random
import time
import json
import threading
import paho.mqtt.client as mqtt

BROKER = "host.docker.internal"
TOPIC = "fognetx/sensors"

client = mqtt.Client()
client.connect(BROKER, 1883)

device_ids = [f"esp{i}" for i in range(1, 51)]  # 50 devices


def device_loop(device_id):
    while True:
        temperature = random.randint(25, 45)
        gas = random.randint(200, 800)

        payload = {
            "device_id": device_id,
            "temperature": temperature,
            "gas": gas
        }

        client.publish(TOPIC, json.dumps(payload))
        time.sleep(1)  # 1 message per second per device


print("🚀 Starting 50-Device Stress Test...")

for dev in device_ids:
    threading.Thread(target=device_loop, args=(dev,), daemon=True).start()

while True:
    time.sleep(10)

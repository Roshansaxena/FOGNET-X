#!/usr/bin/env python3

import os
import sqlite3
import sys
import signal
import subprocess
import time
from pathlib import Path
import requests

BASE_DIR = Path.home() / "PycharmProjects/PythonProject/fognetx"
PYTHON = BASE_DIR / "venv/bin/python"
GUNICORN = BASE_DIR / "venv/bin/gunicorn"
LOG_DIR = BASE_DIR / "logs"

FOG_PID = BASE_DIR / "fog.pid"
CLOUD_PID = BASE_DIR / "cloud.pid"

CLOUD_PORT = 8000
BROKER_SERVICE = "mosquitto"
API_HEALTH_URL = f"http://127.0.0.1:{CLOUD_PORT}/api/dashboard"


def is_running(pid_file):
    if pid_file.exists():
        try:
            pid = int(pid_file.read_text())
            os.kill(pid, 0)
            return True, pid
        except:
            return False, None
    return False, None


def kill_process(pid_file):
    if pid_file.exists():
        try:
            pid = int(pid_file.read_text())
            os.kill(pid, signal.SIGKILL)
        except:
            pass
        pid_file.unlink(missing_ok=True)


def clean_port(port):
    subprocess.run(
        f"fuser -k {port}/tcp",
        shell=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )


def start():
    print("🚀 Starting FOGNET-X...\n")

    LOG_DIR.mkdir(exist_ok=True)

    cloud_running, _ = is_running(CLOUD_PID)
    fog_running, _ = is_running(FOG_PID)

    if cloud_running or fog_running:
        print("⚠ System already running. Use restart if needed.\n")
        return

    clean_port(CLOUD_PORT)

    print("🔌 Starting MQTT broker...")
    subprocess.run(["sudo", "systemctl", "start", BROKER_SERVICE])

    print("☁ Starting Cloud...")
    cloud = subprocess.Popen(
        [str(GUNICORN), "-w", "4", "-b", f"127.0.0.1:{CLOUD_PORT}", "cloud_server:app"],
        cwd=BASE_DIR,
        stdout=open(LOG_DIR / "cloud.log", "a"),
        stderr=subprocess.STDOUT
    )
    CLOUD_PID.write_text(str(cloud.pid))

    time.sleep(2)

    print("🧠 Starting Fog...")
    fog = subprocess.Popen(
        [str(PYTHON), "-m", "services.mqtt_service"],
        cwd=BASE_DIR,
        stdout=open(LOG_DIR / "fog.log", "a"),
        stderr=subprocess.STDOUT
    )
    FOG_PID.write_text(str(fog.pid))

    print("\n✅ FOGNET-X started successfully.\n")


def stop():
    print("🛑 Stopping FOGNET-X...\n")

    kill_process(FOG_PID)
    kill_process(CLOUD_PID)

    subprocess.run(["sudo", "systemctl", "stop", BROKER_SERVICE])

    print("✅ All services stopped.\n")


def restart():
    print("🔄 Restarting FOGNET-X...\n")
    stop()
    time.sleep(2)
    start()


def status():
    print("📊 FOGNET-X Status\n")

    cloud_running, cloud_pid = is_running(CLOUD_PID)
    fog_running, fog_pid = is_running(FOG_PID)

    print("Cloud:", f"🟢 Running (PID {cloud_pid})" if cloud_running else "🔴 Not running")
    print("Fog  :", f"🟢 Running (PID {fog_pid})" if fog_running else "🔴 Not running")

    mqtt_status = subprocess.run(
        ["systemctl", "is-active", BROKER_SERVICE],
        capture_output=True,
        text=True
    )

    print("MQTT :", "🟢 Running" if "active" in mqtt_status.stdout else "🔴 Not running")
    print()

def reset_events():
    conn = sqlite3.connect("fognetx.db")
    c = conn.cursor()
    c.execute("DELETE FROM events")
    c.execute("DELETE FROM sqlite_sequence WHERE name='events'")
    conn.commit()
    conn.close()
    print("Events table reset.")

def logs():
    print("📜 Last 30 log lines\n")

    print("---- Cloud ----")
    subprocess.run(["tail", "-n", "30", str(LOG_DIR / "cloud.log")])

    print("\n---- Fog ----")
    subprocess.run(["tail", "-n", "30", str(LOG_DIR / "fog.log")])


def health():
    print("🩺 Checking Cloud API health...\n")
    try:
        r = requests.get(API_HEALTH_URL, timeout=3)
        if r.status_code == 200:
            print("🟢 Cloud API responding")
        else:
            print(f"🟡 Cloud reachable but returned status {r.status_code}")
    except:
        print("🔴 Cloud API not reachable")
    print()


def monitor():
    print("🔍 Monitoring FOGNET-X (Press CTRL+C to stop)\n")

    try:
        while True:
            cloud_running, _ = is_running(CLOUD_PID)
            fog_running, _ = is_running(FOG_PID)

            if not cloud_running:
                print("⚠ Cloud stopped. Restarting...")
                restart()

            if not fog_running:
                print("⚠ Fog stopped. Restarting...")
                restart()

            time.sleep(5)

    except KeyboardInterrupt:
        print("\nMonitoring stopped.\n")



def main():
    if len(sys.argv) < 2:
        print("Usage: fognetx [start|stop|restart|status|logs|health|monitor]")
        sys.exit(1)

    command = sys.argv[1]

    if command == "start":
        start()
    elif command == "stop":
        stop()
    elif command == "restart":
        restart()
    elif command == "status":
        status()
    elif command == "logs":
        logs()
    elif command == "health":
        health()
    elif command == "monitor":
        monitor()
    else:
        print("Invalid command")


if __name__ == "__main__":
    main()

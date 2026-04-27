import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ==============================
# CONFIG (FROM ENVIRONMENT)
# ==============================

# Email Configuration
EMAIL_SENDER = os.getenv("EMAIL_SENDER", "")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
EMAIL_RECEIVER = os.getenv("EMAIL_RECEIVER", "")
EMAIL_SMTP_SERVER = os.getenv("EMAIL_SMTP_SERVER", "smtp.gmail.com")
EMAIL_SMTP_PORT = int(os.getenv("EMAIL_SMTP_PORT", "465"))

# Telegram Configuration
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# Alert Settings
ALERT_COOLDOWN = int(os.getenv("ALERT_COOLDOWN", "300"))
ENABLE_EMAIL_ALERTS = os.getenv("ENABLE_EMAIL_ALERTS", "true").lower() == "true"
ENABLE_TELEGRAM_ALERTS = os.getenv("ENABLE_TELEGRAM_ALERTS", "true").lower() == "true"

# ==============================
# EMAIL ALERT
# ==============================

def send_email_alert(device_id, risk, temperature, gas, extra_data=None):
    """Send email alert if enabled and configured"""
    # Check if email alerts are enabled
    if not ENABLE_EMAIL_ALERTS:
        return
    
    # Check if email is configured
    if not EMAIL_SENDER or not EMAIL_PASSWORD or not EMAIL_RECEIVER:
        print("⚠️  Email alerts not configured (check backend/.env)")
        return
    
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        subject = "🚨 FOGNET-X CRITICAL ALERT"
        
        # Build comprehensive alert body
        body = f"""
🚨 CRITICAL ALERT DETECTED 🚨

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 DEVICE INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Device ID: {device_id}
Timestamp: {timestamp}
Alert Level: CRITICAL
Risk Score: {risk:.2%}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SENSOR READINGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌡️  Temperature: {temperature}°C
💨 Gas Level: {gas}
"""
        
        # Add extra sensor data if available
        if extra_data:
            body += f"""
💧 Humidity: {extra_data.get('humidity', 'N/A')}%
📊 Pressure: {extra_data.get('pressure', 'N/A')} hPa
🔋 Battery: {extra_data.get('battery', 'N/A')}%
📶 Signal: {extra_data.get('signal_strength', 'N/A')} dBm
⚡ Power: {extra_data.get('power_consumption', 'N/A')} W
🎯 Tank Level: {extra_data.get('tank_level', 'N/A')}%
🌊 Flow Rate: {extra_data.get('flow_rate', 'N/A')}
🔊 Sound: {extra_data.get('sound_db', 'N/A')} dB
📳 Vibration: {extra_data.get('vibration', 'N/A')}
🏭 Air Quality: {extra_data.get('air_quality_index', 'N/A')}
"""
        
        body += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  ACTION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Immediate attention required.
System has triggered automatic safety protocols.

---
FOGNET-X Industrial IoT Platform
https://github.com/Roshansaxena/FOGNET-X
        """

        msg = MIMEMultipart()
        msg["From"] = EMAIL_SENDER
        msg["To"] = EMAIL_RECEIVER
        msg["Subject"] = subject

        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP_SSL(EMAIL_SMTP_SERVER, EMAIL_SMTP_PORT) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.send_message(msg)

        print(f"📧 Email alert sent to {EMAIL_RECEIVER}")

    except Exception as e:
        print("❌ Email alert failed:", e)

# ==============================
# TELEGRAM ALERT
# ==============================

def send_telegram_alert(device_id, risk, temperature, gas, extra_data=None):
    """Send Telegram alert if enabled and configured"""
    # Check if Telegram alerts are enabled
    if not ENABLE_TELEGRAM_ALERTS:
        return
    
    # Check if Telegram is configured
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        print("⚠️  Telegram alerts not configured (check backend/.env)")
        return
    
    try:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Build comprehensive message with emojis
        message = f"""🚨 <b>FOGNET-X CRITICAL ALERT</b> 🚨

📍 <b>Device:</b> <code>{device_id}</code>
⏰ <b>Time:</b> {timestamp}
⚠️ <b>Risk Score:</b> {risk:.1%}

📊 <b>Sensor Readings:</b>
🌡️ Temperature: {temperature}°C
💨 Gas Level: {gas}"""

        # Add extra sensor data if available
        if extra_data:
            if extra_data.get('humidity'):
                message += f"\n💧 Humidity: {extra_data['humidity']:.1f}%"
            if extra_data.get('pressure'):
                message += f"\n📊 Pressure: {extra_data['pressure']:.0f} hPa"
            if extra_data.get('tank_level'):
                message += f"\n🎯 Tank: {extra_data['tank_level']:.1f}%"
            if extra_data.get('battery'):
                message += f"\n🔋 Battery: {extra_data['battery']:.0f}%"
            if extra_data.get('power_consumption'):
                message += f"\n⚡ Power: {extra_data['power_consumption']:.1f}W"

        message += """

⚠️ <b>ACTION REQUIRED!</b>
Automatic safety protocols activated.

🔗 <a href="https://github.com/Roshansaxena/FOGNET-X">FOGNET-X Platform</a>"""

        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

        response = requests.post(url, json={
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message,
            "parse_mode": "HTML",
            "disable_web_page_preview": True
        })

        if response.status_code == 200:
            print(f"📲 Telegram alert sent to chat {TELEGRAM_CHAT_ID}")
        else:
            print(f"❌ Telegram failed: {response.status_code} - {response.text}")

    except Exception as e:
        print("❌ Telegram error:", e)
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# ==============================
# CONFIG (MOVE TO ENV LATER)
# ==============================

EMAIL_SENDER = "info.roshansaxena@gmail.com"
EMAIL_PASSWORD = "ozaxwnznmzurusmd"
EMAIL_RECEIVER = "roshansaxena33@gmail.com"

TELEGRAM_TOKEN = "8613306034:AAGN81_fj5Q_FHN1OkqB09Ix9shYOEbLGQo"
TELEGRAM_CHAT_ID = "1627319774"

# ==============================
# EMAIL ALERT
# ==============================

def send_email_alert(device_id, risk, temperature, gas):
    try:
        subject = "🚨 FOGNET-X CRITICAL ALERT"
        body = f"""
        CRITICAL ALERT DETECTED

        Device ID: {device_id}
        Risk Score: {risk}
        Temperature: {temperature}
        Gas Level: {gas}

        Immediate attention required.
        """

        msg = MIMEMultipart()
        msg["From"] = EMAIL_SENDER
        msg["To"] = EMAIL_RECEIVER
        msg["Subject"] = subject

        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.send_message(msg)

        print("📧 Email alert sent successfully")

    except Exception as e:
        print("❌ Email alert failed:", e)

# ==============================
# TELEGRAM ALERT
# ==============================

def send_telegram_alert(device_id, risk, temperature, gas):
    try:
        message = (
            f"🚨 FOGNET-X CRITICAL ALERT\n\n"
            f"Device: {device_id}\n"
            f"Risk Score: {risk}\n"
            f"Temperature: {temperature}\n"
            f"Gas Level: {gas}\n"
        )

        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"

        response = requests.post(url, json={
            "chat_id": TELEGRAM_CHAT_ID,
            "text": message
        })

        if response.status_code == 200:
            print("📲 Telegram alert sent")
        else:
            print("❌ Telegram failed:", response.text)

    except Exception as e:
        print("❌ Telegram error:", e)
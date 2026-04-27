# 📧 FOGNET-X Alert Configuration Guide

## Configure Email & Telegram Notifications

This guide will help you set up email and Telegram alerts for critical events in FOGNET-X.

---

## 📧 Email Alerts Setup

### Option 1: Gmail (Recommended - Free)

#### Step 1: Enable 2-Step Verification
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** if not already enabled
3. Follow the prompts to set it up

#### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Other (Custom name)** and type: `FOGNET-X`
4. Click **Generate**
5. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)
   - ⚠️ This is NOT your regular Gmail password!
   - ⚠️ Save it somewhere safe

#### Step 3: Configure in FOGNET-X

**Method A: During Setup (Interactive)**
```bash
# Windows
setup-windows-interactive.bat

# Linux/Mac
./setup-linux-interactive.sh
# Follow the prompts for email configuration
```

**Method B: Manual Configuration**

Edit `backend/.env`:
```env
EMAIL_SENDER=your-email@gmail.com
EMAIL_PASSWORD=abcdefghijklmnop  # Your App Password (no spaces)
EMAIL_RECEIVER=receiver@email.com  # Can be same as sender
EMAIL_SMTP_SERVER=smtp.gmail.com
EMAIL_SMTP_PORT=465
ENABLE_EMAIL_ALERTS=true
```

#### Step 4: Test Email

```bash
cd backend
python
>>> from services.alert_service import send_email_alert
>>> send_email_alert("TEST_DEVICE", 0.95, 50.0, 800)
# Check your inbox for the test alert
```

---

### Option 2: Outlook/Hotmail

```env
EMAIL_SENDER=your-email@outlook.com
EMAIL_PASSWORD=your-app-password
EMAIL_RECEIVER=receiver@email.com
EMAIL_SMTP_SERVER=smtp-mail.outlook.com
EMAIL_SMTP_PORT=587
ENABLE_EMAIL_ALERTS=true
```

---

### Option 3: Custom SMTP Server

```env
EMAIL_SENDER=alerts@yourcompany.com
EMAIL_PASSWORD=your-password
EMAIL_RECEIVER=admin@yourcompany.com
EMAIL_SMTP_SERVER=smtp.yourcompany.com
EMAIL_SMTP_PORT=587  # or 465 for SSL
ENABLE_EMAIL_ALERTS=true
```

---

## 📱 Telegram Alerts Setup

### Step 1: Create a Bot

1. **Open Telegram** on your phone or desktop
2. **Search for:** `@BotFather`
3. **Click Start** or send `/start`
4. **Send:** `/newbot`
5. **Choose a name:** `FOGNET-X Alerts`
6. **Choose a username:** `fognetx_alerts_bot` (must end with `bot`)
7. **BotFather will give you a token** like:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
8. **Copy this token** - you'll need it!

### Step 2: Get Your Chat ID

1. **Search for:** `@userinfobot`
2. **Click Start** or send `/start`
3. **It will reply with your info:**
   ```
   Id: 123456789
   First Name: Your Name
   Username: @yourusername
   ```
4. **Copy the Id number** - this is your Chat ID!

### Step 3: Start a Chat with Your Bot

1. **Search for your bot** by username (e.g., `@fognetx_alerts_bot`)
2. **Click Start** or send any message
3. **This is important!** - Bot can't message you until you message it first

### Step 4: Configure in FOGNET-X

**Method A: During Setup (Interactive)**
```bash
# Windows
setup-windows-interactive.bat

# Linux/Mac
./setup-linux-interactive.sh
# Follow the prompts for Telegram configuration
```

**Method B: Manual Configuration**

Edit `backend/.env`:
```env
TELEGRAM_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
ENABLE_TELEGRAM_ALERTS=true
```

### Step 5: Test Telegram

```bash
cd backend
python
>>> from services.alert_service import send_telegram_alert
>>> send_telegram_alert("TEST_DEVICE", 0.95, 50.0, 800)
# Check your Telegram for the test alert
```

---

## 🔔 Alert Settings

### Configure Alert Frequency

Prevent spam by setting cooldown period (in seconds):

```env
ALERT_COOLDOWN=300  # 5 minutes between alerts
```

**Recommended values:**
- `300` = 5 minutes (default)
- `600` = 10 minutes (less spam)
- `900` = 15 minutes (minimal alerts)

### Enable/Disable Alerts

```env
ENABLE_EMAIL_ALERTS=true      # Set to false to disable
ENABLE_TELEGRAM_ALERTS=true   # Set to false to disable
```

---

## 🎨 Customizing Alert Messages

### Edit Email Template

Open `backend/services/alert_service.py` and modify the `send_email_alert()` function:

```python
def send_email_alert(device_id, risk, temperature, gas, extra_data=None):
    subject = "🚨 YOUR CUSTOM SUBJECT"
    body = """
YOUR CUSTOM MESSAGE TEMPLATE

Device: {device_id}
Risk: {risk}
Temp: {temperature}
Gas: {gas}
"""
    # ... rest of the function
```

### Edit Telegram Template

Modify the `send_telegram_alert()` function:

```python
def send_telegram_alert(device_id, risk, temperature, gas, extra_data=None):
    message = f"""🚨 <b>YOUR CUSTOM TITLE</b>

📍 Device: <code>{device_id}</code>
⚠️ Risk: {risk:.1%}

YOUR CUSTOM FORMAT
"""
    # ... rest of the function
```

---

## 📊 Alert Triggers

Alerts are sent when:

1. **Risk Score > Threshold** (default: 60%)
2. **Temperature > Critical** (default: 45°C)
3. **Gas Level > Critical** (default: 700 PPM)
4. **Multiple sensors exceed warning levels**

### Customize Thresholds

Edit `backend/.env`:

```env
# Temperature thresholds (°C)
TEMP_WARNING=35
TEMP_CRITICAL=45
TEMP_EMERGENCY=55

# Gas thresholds (PPM)
GAS_WARNING=400
GAS_CRITICAL=700
GAS_EMERGENCY=900

# Humidity thresholds (%)
HUMIDITY_WARNING=80
HUMIDITY_CRITICAL=90
```

---

## 🔍 Troubleshooting

### Email Not Sending

**Error:** `SMTPAuthenticationError`

**Solutions:**
1. ✅ Make sure you're using **App Password**, not regular password
2. ✅ Enable 2-Step Verification on Gmail
3. ✅ Check if `EMAIL_SENDER` matches the account that generated the App Password
4. ✅ Remove spaces from App Password

**Test SMTP connection:**
```bash
python
>>> import smtplib
>>> server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
>>> server.login("your-email@gmail.com", "your-app-password")
>>> print("Login successful!")
>>> server.quit()
```

---

### Telegram Not Sending

**Error:** `Chat not found` or `403 Forbidden`

**Solutions:**
1. ✅ Make sure you **messaged the bot first** (bot can't initiate conversation)
2. ✅ Check `TELEGRAM_CHAT_ID` is correct
3. ✅ Verify `TELEGRAM_TOKEN` has no extra spaces
4. ✅ Try creating a new bot token from @BotFather

**Test Telegram API:**
```bash
curl -X POST "https://api.telegram.org/botYOUR_TOKEN/sendMessage" \
  -d "chat_id=YOUR_CHAT_ID" \
  -d "text=Test message from FOGNET-X"
```

**Error:** `Bad Request: chat not found`
- You haven't started a chat with the bot yet
- Solution: Search for your bot in Telegram and click **Start**

---

### Both Email and Telegram Fail

**Check:**
1. ✅ Internet connection is working
2. ✅ No firewall blocking outgoing connections
3. ✅ Backend server is running
4. Check backend logs:
   ```bash
   docker logs fognetx-backend
   # or
   tail -f logs/fognetx.log
   ```

---

## 🎯 Quick Setup Checklist

### Email Alerts:
- [ ] Gmail 2-Step Verification enabled
- [ ] App Password generated
- [ ] `EMAIL_SENDER` configured in `.env`
- [ ] `EMAIL_PASSWORD` configured in `.env`
- [ ] `EMAIL_RECEIVER` configured in `.env`
- [ ] Test email sent successfully
- [ ] Alert received in inbox

### Telegram Alerts:
- [ ] Bot created via @BotFather
- [ ] Bot token copied to `.env`
- [ ] Chat ID obtained from @userinfobot
- [ ] Started chat with your bot
- [ ] `TELEGRAM_TOKEN` configured in `.env`
- [ ] `TELEGRAM_CHAT_ID` configured in `.env`
- [ ] Test message sent successfully
- [ ] Alert received in Telegram

---

## 📱 Advanced: Multiple Recipients

### Email Multiple People

Edit `backend/services/alert_service.py`:

```python
EMAIL_RECEIVERS = [
    "person1@email.com",
    "person2@email.com",
    "manager@company.com"
]

# In send_email_alert():
msg["To"] = ", ".join(EMAIL_RECEIVERS)
server.send_message(msg)
```

### Telegram Multiple Groups

1. Create a Telegram group
2. Add your bot to the group
3. Get the group chat ID (it will be negative, like `-1001234567890`)
4. Use that as `TELEGRAM_CHAT_ID`

---

## 🔐 Security Best Practices

1. **Never commit `.env` to Git**
   ```bash
   echo "backend/.env" >> .gitignore
   ```

2. **Use strong secrets**
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

3. **Rotate passwords regularly**
   - Generate new Gmail App Password every 90 days
   - Regenerate Telegram bot token if compromised

4. **Use environment-specific configs**
   ```
   .env.development  # For testing
   .env.production   # For live deployment
   ```

5. **Monitor alert frequency**
   - Too many alerts? Increase `ALERT_COOLDOWN`
   - Too few? Decrease thresholds

---

## 📞 Support

- **Issues:** Check `TROUBLESHOOTING.md`
- **Email Config:** https://support.google.com/accounts/answer/185833
- **Telegram Bots:** https://core.telegram.org/bots
- **GitHub:** https://github.com/fognetx/support

---

## ✅ Verification

After configuration, verify everything works:

```bash
# 1. Check .env file
cat backend/.env | grep EMAIL
cat backend/.env | grep TELEGRAM

# 2. Test email
python backend/test_email.py

# 3. Test Telegram
python backend/test_telegram.py

# 4. Trigger real alert
python simulate_devices.py --devices 1 --critical
```

You should receive alerts via both channels! 🎉

---

**Happy Alerting! 📧📱**

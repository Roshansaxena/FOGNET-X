"""
Test script to verify Telegram alert configuration
Run this after setting up Telegram in .env file
"""

from services.alert_service import send_telegram_alert

print("=" * 50)
print("  FOGNET-X Telegram Alert Test")
print("=" * 50)
print()

print("Testing Telegram alert configuration...")
print()

# Send test alert
try:
    send_telegram_alert(
        device_id="TEST_DEVICE_001",
        risk=0.95,
        temperature=50.0,
        gas=800,
        extra_data={
            'humidity': 85.5,
            'pressure': 1013.0,
            'battery': 75,
            'tank_level': 60.0
        }
    )
    
    print()
    print("=" * 50)
    print("  Test Complete!")
    print("=" * 50)
    print()
    print("✓ Test alert sent successfully!")
    print("✓ Check your Telegram app")
    print()
    
except Exception as e:
    print()
    print("=" * 50)
    print("  Test Failed!")
    print("=" * 50)
    print()
    print(f"❌ Error: {e}")
    print()
    print("Troubleshooting:")
    print("1. Check backend/.env file has Telegram settings")
    print("2. Verify TELEGRAM_TOKEN is correct (from @BotFather)")
    print("3. Verify TELEGRAM_CHAT_ID is correct (from @userinfobot)")
    print("4. Make sure you started a chat with your bot first!")
    print("5. See ALERT-SETUP-GUIDE.md for detailed instructions")
    print()

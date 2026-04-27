"""
Test script to verify email alert configuration
Run this after setting up email in .env file
"""

from services.alert_service import send_email_alert

print("=" * 50)
print("  FOGNET-X Email Alert Test")
print("=" * 50)
print()

print("Testing email alert configuration...")
print()

# Send test alert
try:
    send_email_alert(
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
    print("✓ Check your email inbox (and spam folder)")
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
    print("1. Check backend/.env file has email settings")
    print("2. Verify EMAIL_SENDER is your Gmail address")
    print("3. Verify EMAIL_PASSWORD is Gmail App Password (not regular password)")
    print("4. Enable 2-Step Verification on Gmail")
    print("5. See ALERT-SETUP-GUIDE.md for detailed instructions")
    print()

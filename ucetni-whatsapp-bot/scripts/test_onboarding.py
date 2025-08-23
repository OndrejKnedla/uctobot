#!/usr/bin/env python3
"""
Test script for onboarding flow
"""
import requests
import json
import time
from urllib.parse import urlencode

# Test configuration
BASE_URL = "http://localhost:8000"
WEBHOOK_URL = f"{BASE_URL}/webhook/whatsapp"

# Test user data
TEST_PHONE = "+420777123456"  # Test phone number
TEST_MESSAGES = [
    ("start", "Start onboarding"),
    ("Jan Novák", "Provide name"),
    ("12345678", "Provide ICO"),
    ("CZ12345678", "Provide DIC"),  
    ("1", "Select IT/Programming"),
]

def simulate_whatsapp_message(phone_number, message):
    """Simulate a WhatsApp message to our webhook"""
    # Simulate Twilio webhook data
    data = {
        'From': f'whatsapp:{phone_number}',
        'To': 'whatsapp:+14155238886',  # Twilio sandbox number
        'Body': message,
        'MessageSid': f'SM{int(time.time())}{hash(message) % 1000}',
        'ProfileName': 'Test User',
        'NumMedia': '0'
    }
    
    print(f"\n📱 Sending: '{message}' from {phone_number}")
    print("=" * 50)
    
    try:
        response = requests.post(
            WEBHOOK_URL,
            data=data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=30
        )
        
        print(f"✅ Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Message processed successfully")
        else:
            print(f"❌ Error: {response.text}")
            
        return response.status_code == 200
        
    except Exception as e:
        print(f"❌ Request failed: {str(e)}")
        return False

def test_onboarding_flow():
    """Test complete onboarding flow"""
    print("🧪 Testing ÚčtoBot Onboarding Flow")
    print("=" * 50)
    
    # Test server health first
    try:
        health_response = requests.get(f"{BASE_URL}/health", timeout=10)
        if health_response.status_code == 200:
            print("✅ Server is healthy")
        else:
            print("⚠️  Server health check failed")
            return False
    except Exception as e:
        print(f"❌ Cannot reach server: {str(e)}")
        return False
    
    success_count = 0
    
    # Test each onboarding step
    for i, (message, description) in enumerate(TEST_MESSAGES, 1):
        print(f"\n📝 Step {i}: {description}")
        
        success = simulate_whatsapp_message(TEST_PHONE, message)
        if success:
            success_count += 1
            print(f"✅ Step {i} passed")
        else:
            print(f"❌ Step {i} failed")
        
        # Wait between messages to simulate real usage
        time.sleep(2)
    
    print(f"\n🎯 Test Results:")
    print(f"✅ Passed: {success_count}/{len(TEST_MESSAGES)}")
    print(f"❌ Failed: {len(TEST_MESSAGES) - success_count}/{len(TEST_MESSAGES)}")
    
    if success_count == len(TEST_MESSAGES):
        print("\n🎉 All onboarding tests passed!")
        print("✅ Onboarding flow is working correctly")
        return True
    else:
        print("\n⚠️  Some tests failed")
        print("❌ Check server logs for details")
        return False

def test_registered_user():
    """Test behavior with an already registered user"""
    print("\n🔄 Testing already registered user...")
    
    # Send start command from same user
    success = simulate_whatsapp_message(TEST_PHONE, "start")
    if success:
        print("✅ Registered user test passed")
    else:
        print("❌ Registered user test failed")
    
    return success

if __name__ == "__main__":
    print("🚀 Starting Onboarding Flow Tests")
    print(f"📡 Testing against: {BASE_URL}")
    print(f"📱 Test phone: {TEST_PHONE}")
    
    try:
        # Test onboarding flow
        if test_onboarding_flow():
            print("\n" + "=" * 50)
            # Test registered user behavior
            test_registered_user()
        
        print("\n" + "=" * 50)
        print("🏁 Test suite completed!")
        
    except KeyboardInterrupt:
        print("\n⛔ Tests interrupted by user")
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
#!/usr/bin/env python3
"""
Test script pro WhatsApp webhook
"""
import requests
import json
import sys

def test_webhook():
    base_url = "http://localhost:8000"
    
    print("🚀 Testování WhatsApp webhook...")
    print("=" * 50)
    
    # 1. Test zdraví API
    print("1. Test zdraví API:")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ API běží")
        else:
            print(f"   ❌ API problém: {response.text}")
    except Exception as e:
        print(f"   ❌ API nedostupné: {e}")
        return False
    
    # 2. Test GET webhook endpoint
    print("\n2. Test GET webhook endpoint:")
    try:
        response = requests.get(f"{base_url}/webhook/whatsapp", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ GET webhook failed: {e}")
    
    # 3. Test POST webhook s testovací zprávou
    print("\n3. Test POST webhook s testovací zprávou:")
    
    test_data = {
        "From": "whatsapp:+420777888999",
        "To": "whatsapp:+14155238886", 
        "Body": "Ahoj bot",
        "AccountSid": "test_account",
        "MessageSid": "test_message_123",
        "ProfileName": "Test User"
    }
    
    try:
        response = requests.post(
            f"{base_url}/webhook/whatsapp",
            data=test_data,
            timeout=10,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        print(f"   Status: {response.status_code}")
        print(f"   Content-Type: {response.headers.get('content-type')}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            print("   ✅ Webhook funguje!")
        else:
            print(f"   ❌ Webhook problém")
            
    except Exception as e:
        print(f"   ❌ POST webhook failed: {e}")
        return False
    
    # 4. Test webhook s prázdnou zprávou
    print("\n4. Test webhook s prázdnou zprávou:")
    test_data_empty = {
        "From": "whatsapp:+420777888999",
        "To": "whatsapp:+14155238886",
        "Body": "",
        "AccountSid": "test_account", 
        "MessageSid": "test_message_456"
    }
    
    try:
        response = requests.post(
            f"{base_url}/webhook/whatsapp", 
            data=test_data_empty,
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ❌ Empty message test failed: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Test dokončen!")
    return True

if __name__ == "__main__":
    success = test_webhook()
    sys.exit(0 if success else 1)
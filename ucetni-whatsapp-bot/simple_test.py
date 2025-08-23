#!/usr/bin/env python3
"""
Jednoduchý test aktivačního systému
"""
import requests
import json

BACKEND_URL = "http://localhost:8000"

# Test 1: Health check
print("Test 1: Health check")
try:
    response = requests.get(f"{BACKEND_URL}/health", timeout=10)
    if response.status_code == 200:
        print("✅ Backend zdravý")
        result = response.json()
        print(f"  Status: {result.get('status')}")
    else:
        print(f"❌ Backend nedostupný: {response.status_code}")
except Exception as e:
    print(f"❌ Chyba: {e}")

print()

# Test 2: Create checkout session (this should create user and token)
print("Test 2: Create checkout session")
try:
    response = requests.post(
        f"{BACKEND_URL}/webhook/payment/create-checkout-session",
        json={"email": "test@example.com", "plan": "monthly"},
        timeout=30
    )
    if response.status_code == 200:
        result = response.json()
        print("✅ Checkout session vytvořen")
        print(f"  Success: {result.get('success')}")
        print(f"  Session ID: {result.get('session_id', 'N/A')}")
        if result.get('success'):
            print(f"  User ID: {result.get('user_id')}")
    else:
        print(f"❌ Chyba: {response.status_code}")
        print(f"  Text: {response.text}")
except Exception as e:
    print(f"❌ Chyba: {e}")

print()

# Test 3: WhatsApp webhook with fake token
print("Test 3: WhatsApp webhook s neplatným tokenem")
try:
    fake_token = "fakefakefakefakefakefakefaketoken"
    data = {
        'From': 'whatsapp:+420999888777',
        'To': 'whatsapp:+14155238886',
        'Body': fake_token,
        'MessageSid': 'SM123fake',
        'ProfileName': 'Test User',
        'NumMedia': '0'
    }
    
    response = requests.post(
        f"{BACKEND_URL}/webhook/whatsapp",
        data=data,
        timeout=30
    )
    
    if response.status_code == 200:
        print("✅ Webhook zpracoval neplatný token")
    else:
        print(f"❌ Webhook chyba: {response.status_code}")
except Exception as e:
    print(f"❌ Chyba: {e}")

print()
print("🏁 Test dokončen")
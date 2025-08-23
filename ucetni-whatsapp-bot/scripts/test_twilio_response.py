#!/usr/bin/env python3
"""
Test Twilio WhatsApp odpovědi
"""
import requests

def test_webhook_response():
    """Test jestli webhook vrací správnou Twilio odpověď"""
    
    # Simuluj Twilio request
    data = {
        'From': 'whatsapp:+420722158002',
        'Body': 'test zprava',
        'ProfileName': 'TestUser',
        'MessageSid': 'test123',
        'To': 'whatsapp:+14155238886',
        'AccountSid': os.environ.get("TWILIO_ACCOUNT_SID")
    }
    
    print("🔍 Testing webhook response format...")
    print("=" * 50)
    
    response = requests.post(
        "http://localhost:8000/webhook/whatsapp-simple",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    print(f"Response Body:")
    print(response.text)
    print()
    
    # Kontrola Twilio XML formátu
    if response.status_code == 200:
        xml_response = response.text.strip()
        if xml_response.startswith('<?xml') and '<Response>' in xml_response and '<Message>' in xml_response:
            print("✅ XML format je správný pro Twilio")
        else:
            print("❌ XML format není správný pro Twilio")
            
        # Test jestli obsahuje českou zprávu
        if 'Ahoj' in xml_response or 'Bot' in xml_response:
            print("✅ Obsahuje českou odpověď")
        else:
            print("❌ Neobsahuje českou odpověď")
            
    print("=" * 50)
    
    # Test s 'ahoj'
    print("\n🔍 Testing 'ahoj' message...")
    data['Body'] = 'ahoj'
    response = requests.post(
        "http://localhost:8000/webhook/whatsapp-simple",
        data=data
    )
    print(f"Response: {response.text}")
    
    print("\n✅ Test completed!")

if __name__ == "__main__":
    test_webhook_response()

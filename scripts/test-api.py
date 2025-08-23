#!/usr/bin/env python3
"""
ÚčetníBot API Test Suite
Otestuje všechny klíčové endpointy a funkcionality
"""

import requests
import json
import os
import sys
from datetime import datetime

API_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        data = response.json()
        
        if response.status_code == 200 and ("running" in str(data) or "healthy" in str(data)):
            return True, "OK"
        else:
            return False, f"Status: {response.status_code}, Data: {data}"
    except Exception as e:
        return False, f"Error: {str(e)}"

def test_basic_api():
    """Test basic API endpoint"""
    try:
        response = requests.get(f"{API_URL}/api", timeout=5)
        data = response.json()
        
        if response.status_code == 200 and "aktivní" in data.get("message", ""):
            return True, "OK"
        else:
            return False, f"Status: {response.status_code}, Data: {data}"
    except Exception as e:
        return False, f"Error: {str(e)}"

def test_frontend():
    """Test frontend accessibility"""
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            return True, "OK"
        else:
            return False, f"Status: {response.status_code}"
    except Exception as e:
        return False, f"Error: {str(e)}"

def test_api_docs():
    """Test API documentation"""
    try:
        response = requests.get(f"{API_URL}/docs", timeout=5)
        if response.status_code == 200:
            return True, "OK - Swagger docs available"
        else:
            return False, f"Status: {response.status_code}"
    except Exception as e:
        return False, f"Error: {str(e)}"

def test_cors():
    """Test CORS headers"""
    try:
        headers = {"Origin": "http://localhost:3000"}
        response = requests.options(f"{API_URL}/api", headers=headers, timeout=5)
        
        cors_header = response.headers.get("Access-Control-Allow-Origin")
        if cors_header:
            return True, f"OK - CORS: {cors_header}"
        else:
            return False, "No CORS headers found"
    except Exception as e:
        return False, f"Error: {str(e)}"

def test_database():
    """Test database existence"""
    db_path = "/home/asznee/mvp-ucetni/ucetni-whatsapp-bot/ucetni_bot.db"
    if os.path.exists(db_path):
        return True, f"OK - Database file exists ({os.path.getsize(db_path)} bytes)"
    else:
        return False, "Database file not found"

def test_env_variables():
    """Test environment variables"""
    env_path = "/home/asznee/mvp-ucetni/ucetni-whatsapp-bot/.env"
    if not os.path.exists(env_path):
        return False, ".env file not found"
    
    try:
        with open(env_path, 'r') as f:
            env_content = f.read()
        
        checks = {
            "GROQ_API_KEY": "gsk_" in env_content,
            "TWILIO_ACCOUNT_SID": "AC" in env_content,
            "STRIPE_SECRET_KEY": "sk_test_" in env_content
        }
        
        configured = sum(checks.values())
        total = len(checks)
        
        if configured == total:
            return True, f"OK - All {total} key APIs configured"
        else:
            missing = [k for k, v in checks.items() if not v]
            return False, f"PARTIAL - {configured}/{total} configured. Missing: {missing}"
            
    except Exception as e:
        return False, f"Error reading .env: {str(e)}"

def test_whatsapp_endpoint():
    """Test WhatsApp webhook endpoint (basic connectivity)"""
    try:
        # Just test if endpoint exists and responds
        response = requests.post(
            f"{API_URL}/webhook/whatsapp",
            data={
                "Body": "test message",
                "From": "whatsapp:+420777123456",
                "To": "whatsapp:+14155238886"
            },
            timeout=10
        )
        
        # Accept any response that doesn't crash the server
        if response.status_code in [200, 400, 422]:  # 400/422 are OK for invalid test data
            return True, f"OK - Endpoint responding (status: {response.status_code})"
        else:
            return False, f"Status: {response.status_code}"
    except requests.exceptions.Timeout:
        return False, "Timeout - endpoint might be processing"
    except Exception as e:
        return False, f"Error: {str(e)}"

def run_tests():
    """Run all tests and display results"""
    print("🧪 ÚčetníBot API Test Suite")
    print("=" * 40)
    print(f"⏰ Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    tests = [
        ("Health check", test_health),
        ("Basic API endpoint", test_basic_api),
        ("Frontend accessibility", test_frontend),
        ("API Documentation", test_api_docs),
        ("CORS configuration", test_cors),
        ("Database (SQLite)", test_database),
        ("Environment variables", test_env_variables),
        ("WhatsApp webhook endpoint", test_whatsapp_endpoint),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"{test_name:<25}: ", end="", flush=True)
        try:
            success, message = test_func()
            if success:
                print(f"✅ {message}")
                results.append(True)
            else:
                print(f"❌ {message}")
                results.append(False)
        except Exception as e:
            print(f"❌ EXCEPTION: {str(e)}")
            results.append(False)
    
    print()
    print("📊 VÝSLEDKY:")
    print("-" * 20)
    passed = sum(results)
    total = len(results)
    print(f"✅ Úspěšné testy: {passed}/{total}")
    print(f"❌ Neúspěšné testy: {total - passed}/{total}")
    
    if passed == total:
        print("🎉 Všechny testy prošly!")
        status = 0
    elif passed >= total * 0.7:  # 70% success rate
        print("⚠️  Většina testů prošla, některé vyžadují konfiguraci")
        status = 0
    else:
        print("🚨 Několik kritických testů selhalo")
        status = 1
    
    print()
    print("📋 Rychlé odkazy:")
    print(f"🌐 Frontend:     {FRONTEND_URL}")
    print(f"🔧 Backend API:  {API_URL}")
    print(f"📚 API Docs:     {API_URL}/docs")
    print(f"❤️  Health:       {API_URL}/health")
    
    return status

if __name__ == "__main__":
    exit_code = run_tests()
    sys.exit(exit_code)
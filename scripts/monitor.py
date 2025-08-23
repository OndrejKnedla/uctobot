#!/usr/bin/env python3
"""
ÚčetníBot Real-time Monitor
Živé sledování stavu aplikace
"""

import requests
import time
import os
import json
from datetime import datetime
import subprocess

API_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:3000"

def clear_screen():
    """Vyčisti obrazovku"""
    os.system('clear' if os.name == 'posix' else 'cls')

def get_service_status(url, timeout=5):
    """Zkontroluj stav služby"""
    try:
        response = requests.get(url, timeout=timeout)
        if response.status_code == 200:
            return "✅ Running", response.elapsed.total_seconds()
        else:
            return f"❌ Error {response.status_code}", 0
    except requests.exceptions.ConnectionError:
        return "🔴 Down", 0
    except requests.exceptions.Timeout:
        return "⚠️  Timeout", 0
    except Exception as e:
        return f"❌ Error", 0

def get_health_details():
    """Získej detailní health info"""
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code in [200, 503]:  # Accept both healthy and unhealthy
            data = response.json()
            return data
        else:
            return {"error": f"HTTP {response.status_code}"}
    except Exception as e:
        return {"error": str(e)}

def get_database_info():
    """Informace o databázi"""
    db_path = "/home/asznee/mvp-ucetni/ucetni-whatsapp-bot/ucetni_bot.db"
    if os.path.exists(db_path):
        size_bytes = os.path.getsize(db_path)
        size_mb = size_bytes / 1024 / 1024
        return f"✅ SQLite ({size_mb:.1f} MB)"
    else:
        return "❌ Database not found"

def get_process_info():
    """Informace o procesech"""
    try:
        # Pokus se najít Python procesy
        result = subprocess.run(['pgrep', '-f', 'uvicorn'], capture_output=True, text=True)
        backend_running = len(result.stdout.strip()) > 0
        
        result = subprocess.run(['pgrep', '-f', 'next-server'], capture_output=True, text=True)
        frontend_running = len(result.stdout.strip()) > 0
        
        return backend_running, frontend_running
    except:
        return False, False

def format_uptime(seconds):
    """Formátuj uptime"""
    if seconds < 60:
        return f"{seconds:.0f}s"
    elif seconds < 3600:
        return f"{seconds/60:.0f}m {seconds%60:.0f}s"
    else:
        hours = int(seconds / 3600)
        minutes = int((seconds % 3600) / 60)
        return f"{hours}h {minutes}m"

def monitor_loop():
    """Hlavní monitoring smyčka"""
    start_time = time.time()
    
    while True:
        try:
            clear_screen()
            
            # Header
            print("🔍 ÚčetníBot Live Monitor")
            print("=" * 50)
            print(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"🕐 Monitor running: {format_uptime(time.time() - start_time)}")
            print()
            
            # Service Status
            print("🚀 SERVICES STATUS")
            print("-" * 30)
            
            backend_status, backend_time = get_service_status(f"{API_URL}/api")
            print(f"Backend API:     {backend_status:<15} ({backend_time*1000:.0f}ms)" if backend_time > 0 else f"Backend API:     {backend_status}")
            
            frontend_status, frontend_time = get_service_status(FRONTEND_URL)
            print(f"Frontend:        {frontend_status:<15} ({frontend_time*1000:.0f}ms)" if frontend_time > 0 else f"Frontend:        {frontend_status}")
            
            docs_status, docs_time = get_service_status(f"{API_URL}/docs")
            print(f"API Docs:        {docs_status:<15}")
            
            print()
            
            # Health Details
            print("❤️  HEALTH CHECK")
            print("-" * 30)
            health = get_health_details()
            
            if "error" in health:
                print(f"Health endpoint: ❌ {health['error']}")
            else:
                status = health.get('status', 'unknown')
                uptime = health.get('uptime_seconds', 0)
                env = health.get('environment', 'unknown')
                
                print(f"Overall status:  {'✅' if status == 'healthy' else '⚠️ '} {status.upper()}")
                print(f"Environment:     {env}")
                print(f"Uptime:          {format_uptime(uptime)}")
                
                # System metrics
                if 'checks' in health and 'system' in health['checks']:
                    sys_info = health['checks']['system']
                    print(f"CPU usage:       {sys_info.get('cpu_percent', 0):.1f}%")
                    print(f"Memory usage:    {sys_info.get('memory_percent', 0):.1f}%")
                    print(f"Disk usage:      {sys_info.get('disk_percent', 0):.1f}%")
            
            print()
            
            # Database Status
            print("🗄️  DATABASE")
            print("-" * 30)
            db_status = get_database_info()
            print(f"Database:        {db_status}")
            print()
            
            # API Keys Status
            print("🔑 API KEYS")
            print("-" * 30)
            env_path = "/home/asznee/mvp-ucetni/ucetni-whatsapp-bot/.env"
            if os.path.exists(env_path):
                with open(env_path, 'r') as f:
                    env_content = f.read()
                
                groq_ok = "gsk_" in env_content and "xxxxx" not in env_content
                twilio_ok = "TWILIO_ACCOUNT_SID" in env_content and "AC" in env_content
                stripe_ok = "sk_test_51PO6fG" in env_content
                
                print(f"Groq AI:         {'✅ Configured' if groq_ok else '⚠️  Needs setup'}")
                print(f"Twilio:          {'✅ Configured' if twilio_ok else '⚠️  Needs setup'}")  
                print(f"Stripe:          {'✅ Configured' if stripe_ok else '⚠️  Needs setup'}")
            else:
                print("Environment:     ❌ .env file not found")
            
            print()
            
            # Quick Links
            print("🔗 QUICK LINKS")
            print("-" * 30)
            print(f"Frontend:        {FRONTEND_URL}")
            print(f"Backend API:     {API_URL}")
            print(f"API Docs:        {API_URL}/docs")
            print(f"Health Check:    {API_URL}/health")
            print()
            
            # Controls
            print("⚡ CONTROLS")
            print("-" * 30)
            print("Press Ctrl+C to exit")
            print("Refreshing every 5 seconds...")
            
            # Wait
            time.sleep(5)
            
        except KeyboardInterrupt:
            print("\n\n⏹️  Monitoring stopped by user")
            break
        except Exception as e:
            print(f"\n❌ Monitor error: {str(e)}")
            time.sleep(5)

if __name__ == "__main__":
    print("🚀 Starting ÚčetníBot Monitor...")
    print("Press Ctrl+C to exit")
    print()
    time.sleep(2)
    
    try:
        monitor_loop()
    except KeyboardInterrupt:
        print("\n👋 Monitor terminated")
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")

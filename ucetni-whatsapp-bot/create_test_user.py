#!/usr/bin/env python3
"""
Vytvoří testovacího uživatele s aktivačním tokenem
"""
import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import init_database, db_manager
from app.services.activation_service import ActivationService

async def create_test_user():
    """Vytvoří testovacího uživatele s aktivačním tokenem"""
    
    # Inicializuj databázi
    await init_database()
    
    # Vytvoř aktivační službu
    activation_service = ActivationService()
    
    # Vytvoř uživatele s aktivačním tokenem
    print("🔧 Vytvářím testovacího uživatele...")
    
    result = await activation_service.create_user_with_activation(
        email="test@ucetnibot.cz",
        plan="monthly"
    )
    
    if result.get('success'):
        token = result['activation_token']
        user_id = result['user_id']
        expires = result['expires_at']
        
        print("✅ ÚSPĚCH! Testovací uživatel vytvořen")
        print("=" * 60)
        print(f"📧 Email: test@ucetnibot.cz")
        print(f"👤 User ID: {user_id}")
        print(f"⏰ Platnost do: {expires}")
        print()
        print("🔑 VÁŠ AKTIVAČNÍ KÓD:")
        print("=" * 30)
        print(f"     {token}")
        print("=" * 30)
        print()
        print("📱 JAK TESTOVAT:")
        print("1. Pošlete tento kód na WhatsApp číslo +14155238886")
        print("2. Nebo použijte Twilio sandbox s vaším číslem +420 722 158 002")
        print("3. Bot by měl rozpoznat kód a aktivovat váš účet")
        print("4. Po aktivaci už můžete psát normálně (START, pomoc, atd.)")
        print()
        print("💡 Kód je:")
        print("   • Přesně 32 hexadecimálních znaků")
        print("   • Kryptograficky bezpečný (secrets.token_hex)")
        print("   • Platný 48 hodin")
        print("   • Použitelný pouze jednou")
        
    else:
        print(f"❌ CHYBA: {result.get('error')}")
    
    # Uzavři databázové spojení
    from app.database.connection import close_database
    await close_database()

if __name__ == "__main__":
    asyncio.run(create_test_user())
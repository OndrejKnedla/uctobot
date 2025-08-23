#!/usr/bin/env python3
"""
Debug aktivačního systému
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
from app.database.models import User
from sqlalchemy import select

async def debug_activation():
    """Debug aktivačního systému"""
    
    # Inicializuj databázi
    await init_database()
    
    # Vytvoř aktivační službu
    activation_service = ActivationService()
    
    print("🔍 DEBUG AKTIVAČNÍHO SYSTÉMU")
    print("=" * 50)
    
    # Zkontroluj aktivaci pro váš telefon
    phone = "+420722158002"
    print(f"📱 Kontroluji aktivaci pro: {phone}")
    
    status = await activation_service.check_user_activation_status(phone)
    print(f"Status: {status}")
    
    # Podívej se do databáze přímo
    async with db_manager.get_session() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        print(f"\n👥 Uživatelé v databázi: {len(users)}")
        
        for user in users:
            print(f"  User {user.id}:")
            print(f"    Email: {user.email}")
            print(f"    WhatsApp: {user.whatsapp_number}")
            print(f"    Aktivován: {user.whatsapp_activated}")
            print(f"    Token: {user.activation_token}")
            print(f"    Token použit: {user.activation_used}")
            print(f"    Předplatné: {user.subscription_status}")
            print()
    
    # Test aktivace s vaším tokenem
    print("🧪 Test aktivace s tokenem 7eb86f599a55d2966163451b61f16ae1")
    result = await activation_service.activate_whatsapp(
        phone_number=phone,
        token="7eb86f599a55d2966163451b61f16ae1",
        ip_address="127.0.0.1",
        user_agent="Debug Test"
    )
    print(f"Výsledek aktivace: {result}")
    
    # Uzavři databázové spojení
    from app.database.connection import close_database
    await close_database()

if __name__ == "__main__":
    asyncio.run(debug_activation())
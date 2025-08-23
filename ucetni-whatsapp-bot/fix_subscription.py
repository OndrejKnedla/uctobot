#!/usr/bin/env python3
"""
Opravi subscription status pro testovacího uživatele
"""
import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import init_database, db_manager
from app.database.models import User
from sqlalchemy import select

async def fix_subscription():
    """Opravi subscription status"""
    
    # Inicializuj databázi
    await init_database()
    
    print("🔧 OPRAVA SUBSCRIPTION STATUS")
    print("=" * 40)
    
    async with db_manager.get_session() as db:
        # Najdi uživatele
        result = await db.execute(
            select(User).where(User.whatsapp_number == "+420722158002")
        )
        user = result.scalar_one_or_none()
        
        if user:
            print(f"✅ Nalezen user {user.id}")
            print(f"   Před: subscription_status = {user.subscription_status}")
            
            # Změň na active
            user.subscription_status = "active"
            
            await db.commit()
            
            print(f"   Po: subscription_status = {user.subscription_status}")
            print("🎉 Status změněn na ACTIVE!")
            print()
            print("📱 NYNÍ MŮŽETE TESTOVAT:")
            print("   Napište 'START' do WhatsApp")
            print("   Bot by měl začít onboarding proces")
            
        else:
            print("❌ Uživatel nenalezen")
    
    # Uzavři databázové spojení
    from app.database.connection import close_database
    await close_database()

if __name__ == "__main__":
    asyncio.run(fix_subscription())
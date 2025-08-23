#!/usr/bin/env python3
"""
Přidá nové tax evidence compliance fieldy do Transaction tabulky
"""
import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import init_database, db_manager
from sqlalchemy import text

async def add_tax_evidence_fields():
    """Přidá nové columny pro tax evidence compliance"""
    
    # Inicializuj databázi
    await init_database()
    
    print("🔧 PŘIDÁVÁNÍ TAX EVIDENCE COMPLIANCE FIELDŮ")
    print("=" * 50)
    
    async with db_manager.get_session() as db:
        # Add new columns to transactions table
        alter_statements = [
            "ALTER TABLE transactions ADD COLUMN evidence_completeness_score NUMERIC(5,2) DEFAULT 0.0",
            "ALTER TABLE transactions ADD COLUMN evidence_risk_level VARCHAR(20) DEFAULT 'high'",
            "ALTER TABLE transactions ADD COLUMN evidence_missing_required JSON",
            "ALTER TABLE transactions ADD COLUMN evidence_missing_recommended JSON", 
            "ALTER TABLE transactions ADD COLUMN evidence_compliance_warnings JSON",
            "ALTER TABLE transactions ADD COLUMN evidence_validation_date TIMESTAMP",
            "ALTER TABLE transactions ADD COLUMN evidence_needs_attention BOOLEAN DEFAULT false"
        ]
        
        for statement in alter_statements:
            try:
                await db.execute(text(statement))
                print(f"✅ {statement}")
            except Exception as e:
                if "already exists" in str(e):
                    print(f"⏭️  Column already exists: {statement}")
                else:
                    print(f"❌ Error: {statement} - {e}")
        
        await db.commit()
        print("\n🎉 Tax evidence compliance fieldy úspěšně přidány!")
        
    # Uzavři databázové spojení
    from app.database.connection import close_database
    await close_database()

if __name__ == "__main__":
    asyncio.run(add_tax_evidence_fields())
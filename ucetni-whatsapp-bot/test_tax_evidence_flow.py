#!/usr/bin/env python3
"""
Testuje kompletní tax evidence flow - od jednoduché zprávy až po compliance report
"""
import asyncio
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.connection import init_database, db_manager
from app.services.smart_ai_processor import SmartAIProcessor
from app.services.compliance_report_service import ComplianceReportService
from app.database.models import User
from sqlalchemy import select

async def test_tax_evidence_flow():
    """Testuje kompletní tax evidence flow"""
    
    # Inicializuj databázi
    await init_database()
    
    print("🧪 TESTOVÁNÍ TAX EVIDENCE FLOW")
    print("=" * 60)
    
    # Vytvoř služby
    smart_ai_processor = SmartAIProcessor()
    compliance_service = ComplianceReportService()
    
    async with db_manager.get_session() as db:
        # Najdi testovacího uživatele
        result = await db.execute(
            select(User).where(User.whatsapp_number == "+420722158002")
        )
        user = result.scalar_one_or_none()
        
        if not user:
            print("❌ Testovací uživatel nenalezen")
            return
        
        print(f"✅ Testovací uživatel nalezen: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Aktivován: {user.whatsapp_activated}")
        print()
        
        # Test scénáře
        test_messages = [
            {
                'message': 'benzín 500',
                'description': 'Jednoduchá zpráva - chybí dodavatel',
                'expected_outcome': 'needs_more_info'
            },
            {
                'message': 'Shell benzín 800 Kč',
                'description': 'Zpráva s dodavatelem - měla by být OK',
                'expected_outcome': 'success'
            },
            {
                'message': 'notebook 25000',
                'description': 'Velký výdaj bez dodavatele - vysoké riziko',
                'expected_outcome': 'needs_more_info'
            },
            {
                'message': 'Alza notebook 15000 IČO 27082440',
                'description': 'Kompletní informace - excellentní',
                'expected_outcome': 'success'
            }
        ]
        
        print("📝 TESTOVÁNÍ ZPRACOVÁNÍ ZPRÁV")
        print("-" * 40)
        
        conversation_contexts = {}
        
        for i, test in enumerate(test_messages, 1):
            print(f"\n{i}. {test['description']}")
            print(f"   Zpráva: '{test['message']}'")
            
            context_id = f"test_context_{i}"
            
            try:
                result = await smart_ai_processor.process_for_non_vat_payer(
                    test['message'], user, context_id
                )
                
                print(f"   Výsledek: {result.get('success', 'N/A')}")
                
                if result.get('needs_more_info'):
                    print(f"   ❓ Potřebuje více info:")
                    print(f"      {result['question'][:100]}...")
                    
                    # Simuluj odpověď uživatele
                    follow_up_responses = {
                        1: "Shell",  # Pro benzín
                        3: "Alza"   # Pro notebook
                    }
                    
                    if i in follow_up_responses:
                        print(f"   👤 Simulovaná odpověď: '{follow_up_responses[i]}'")
                        
                        # Zpracuj follow-up
                        follow_result = await smart_ai_processor.process_for_non_vat_payer(
                            follow_up_responses[i], user, context_id
                        )
                        
                        if follow_result.get('success'):
                            print(f"   ✅ Transakce dokončena po doplnění")
                            print(f"      {follow_result.get('message', '')[:100]}...")
                        else:
                            print(f"   ⚠️ Další info potřebné")
                            
                elif result.get('success'):
                    print(f"   ✅ Transakce uložena")
                    print(f"      {result.get('message', '')[:100]}...")
                else:
                    print(f"   ❌ Chyba: {result.get('error', 'Neznámá chyba')}")
                    
            except Exception as e:
                print(f"   ❌ Výjimka: {str(e)}")
        
        print(f"\n📊 TESTOVÁNÍ COMPLIANCE REPORTINGU")
        print("-" * 40)
        
        try:
            # Generuj compliance report
            report = await compliance_service.generate_monthly_compliance_report(user.id)
            
            if report.get('error'):
                print(f"❌ Chyba při generování reportu: {report['error']}")
            else:
                summary = report['compliance_summary']
                print(f"✅ Compliance report vygenerován")
                print(f"   Celkové skóre: {summary['overall_score']:.1f}%")
                print(f"   Status: {summary['status']}")
                print(f"   Transakce celkem: {summary['total_transactions']}")
                print(f"   Kritické: {summary['critical_transactions']}")
                print(f"   Výborné: {summary['excellent_transactions']}")
                
                # Test WhatsApp formátu
                whatsapp_message = compliance_service.format_monthly_report_for_whatsapp(report)
                print(f"\n📱 WhatsApp zpráva ({len(whatsapp_message)} znaků):")
                print(whatsapp_message[:300] + "..." if len(whatsapp_message) > 300 else whatsapp_message)
                
        except Exception as e:
            print(f"❌ Chyba při testování reportingu: {str(e)}")
    
    print(f"\n🎯 TEST DOKONČEN")
    print("=" * 60)
    
    # Uzavři databázové spojení
    from app.database.connection import close_database
    await close_database()

if __name__ == "__main__":
    asyncio.run(test_tax_evidence_flow())
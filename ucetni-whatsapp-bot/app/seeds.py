from app.database_new import SessionLocal
from app.models import User, Transaction, TransactionItem, TransactionType, SubscriptionStatus
from datetime import datetime, timedelta
import random

def seed_demo_data():
    """Vytvoří demo data pro testování"""
    db = SessionLocal()
    
    try:
        # 1. Vytvoř demo uživatele
        demo_user = User(
            email="demo@ucetnibot.cz",
            phone="+420777123456",
            full_name="Jan Novák",
            business_name="Jan Novák - OSVČ",
            ico="12345678",
            dic=None,  # Neplátce
            address="Václavské náměstí 1, 110 00 Praha 1",
            bank_account="1234567890/0100",
            vat_payer=False,
            subscription_status=SubscriptionStatus.ACTIVE,
            subscription_plan="monthly",
            subscription_until=datetime.now() + timedelta(days=30),
            current_year_revenue=450000,
            whatsapp_activated=True,
            tax_type="60_40",
            default_vat_rate=21
        )
        db.add(demo_user)
        db.commit()
        
        print(f"✅ Vytvořen uživatel: {demo_user.full_name}")
        
        # 2. Vytvoř demo transakce
        transactions_data = [
            {
                "type": TransactionType.EXPENSE,
                "description": "Benzín - služební cesta Praha-Brno",
                "amount": 1210,
                "vat_rate": 21,
                "counterparty_name": "Shell Czech Republic",
                "counterparty_ico": "60193328",
                "category": "doprava",
                "document_number": "FA-2024-001",
                "payment_method": "card"
            },
            {
                "type": TransactionType.EXPENSE,
                "description": "Kancelářské potřeby - papír, toner",
                "amount": 847,
                "vat_rate": 21,
                "counterparty_name": "Alza.cz a.s.",
                "counterparty_ico": "27082440",
                "category": "materiál",
                "document_number": "UCT-2024-112",
                "payment_method": "transfer"
            },
            {
                "type": TransactionType.INCOME,
                "description": "Faktura za konzultace - projekt ABC",
                "amount": 15000,
                "vat_rate": 0,  # Neplátce
                "counterparty_name": "ABC Solutions s.r.o.",
                "counterparty_ico": "87654321",
                "category": "služby",
                "document_number": "VF-2024-001",
                "payment_method": "transfer"
            },
            {
                "type": TransactionType.EXPENSE,
                "description": "Občerstvení pro klienty",
                "amount": 523,
                "vat_rate": 10,
                "counterparty_name": "Kaufland Česká republika",
                "counterparty_ico": "25110161",
                "category": "reprezentace",
                "document_number": "UCT-2024-223",
                "payment_method": "cash"
            },
            {
                "type": TransactionType.EXPENSE,
                "description": "Předplatné Office 365",
                "amount": 2420,
                "vat_rate": 21,
                "counterparty_name": "Microsoft s.r.o.",
                "counterparty_ico": "47123737",
                "category": "software",
                "document_number": "INV-2024-445",
                "payment_method": "card"
            },
            {
                "type": TransactionType.INCOME,
                "description": "Tvorba webu - Novák s.r.o.",
                "amount": 25000,
                "vat_rate": 0,
                "counterparty_name": "Novák Trading s.r.o.",
                "counterparty_ico": "11223344",
                "category": "služby",
                "document_number": "VF-2024-002",
                "payment_method": "transfer"
            },
            {
                "type": TransactionType.EXPENSE,
                "description": "Mobilní tarif",
                "amount": 599,
                "vat_rate": 21,
                "counterparty_name": "T-Mobile Czech Republic",
                "counterparty_ico": "64949681",
                "category": "telekomunikace",
                "document_number": "FA-2024-667",
                "payment_method": "transfer"
            },
            {
                "type": TransactionType.EXPENSE,
                "description": "Pronájem kanceláře",
                "amount": 12000,
                "vat_rate": 21,
                "counterparty_name": "Office Park Praha s.r.o.",
                "counterparty_ico": "99887766",
                "category": "nájem",
                "document_number": "NF-2024-03",
                "payment_method": "transfer"
            }
        ]
        
        for idx, t_data in enumerate(transactions_data):
            # Vypočti DPH
            vat_rate = t_data["vat_rate"]
            total = t_data["amount"]
            
            if vat_rate > 0 and t_data["type"] == TransactionType.EXPENSE:
                amount_without_vat = round(total / (1 + vat_rate/100), 2)
                vat_amount = round(total - amount_without_vat, 2)
            else:
                amount_without_vat = total
                vat_amount = 0
            
            transaction = Transaction(
                user_id=demo_user.id,
                type=t_data["type"],
                amount=total,
                amount_without_vat=amount_without_vat,
                vat_amount=vat_amount,
                vat_rate=vat_rate,
                description=t_data["description"],
                category=t_data["category"],
                counterparty_name=t_data["counterparty_name"],
                counterparty_ico=t_data.get("counterparty_ico"),
                counterparty_address=f"Adresa {idx+1}, Praha",
                document_number=t_data["document_number"],
                document_date=datetime.now() - timedelta(days=random.randint(1, 30)),
                payment_date=datetime.now() - timedelta(days=random.randint(0, 15)),
                payment_method=t_data["payment_method"],
                completeness_score=random.randint(70, 100),
                ai_confidence=random.uniform(0.85, 0.99)
            )
            db.add(transaction)
            
            # Přidej položky pro některé transakce
            if idx < 3:  # První 3 transakce budou mít položky
                for item_idx in range(random.randint(1, 3)):
                    item = TransactionItem(
                        transaction=transaction,
                        description=f"Položka {item_idx+1} - {t_data['description'][:20]}",
                        quantity=random.randint(1, 5),
                        unit="ks",
                        unit_price=round(amount_without_vat / (item_idx + 2), 2),
                        vat_rate=vat_rate,
                        total_without_vat=round(amount_without_vat / (item_idx + 2), 2),
                        vat_amount=round(vat_amount / (item_idx + 2), 2),
                        total_with_vat=round(total / (item_idx + 2), 2)
                    )
                    db.add(item)
        
        db.commit()
        print(f"✅ Vytvořeno {len(transactions_data)} transakcí")
        
        # 3. Vytvoř plátce DPH
        vat_user = User(
            email="platce@ucetnibot.cz",
            phone="+420777999888",
            full_name="Marie Svobodová",
            business_name="Svobodová Consulting s.r.o.",
            ico="87654321",
            dic="CZ87654321",
            address="Národní 25, 110 00 Praha 1",
            bank_account="9876543210/0300",
            vat_payer=True,
            vat_registration_date=datetime.now() - timedelta(days=365),
            vat_period="monthly",
            subscription_status=SubscriptionStatus.ACTIVE,
            subscription_plan="yearly",
            subscription_until=datetime.now() + timedelta(days=365),
            current_year_revenue=1250000,
            whatsapp_activated=True,
            tax_type="real_costs",
            default_vat_rate=21
        )
        db.add(vat_user)
        db.commit()
        
        print(f"✅ Vytvořen plátce DPH: {vat_user.full_name}")
        
        # 4. Vytvoř trial uživatele
        trial_user = User(
            email="trial@ucetnibot.cz",
            phone="+420777555444",
            full_name="Petr Dvořák",
            business_name="Petr Dvořák",
            ico="11223344",
            address="Žižkova 10, 130 00 Praha 3",
            vat_payer=False,
            subscription_status=SubscriptionStatus.TRIAL,
            subscription_plan="trial",
            trial_transactions_used=3,
            trial_transactions_limit=10,
            whatsapp_activated=False
        )
        db.add(trial_user)
        db.commit()
        
        print(f"✅ Vytvořen trial uživatel: {trial_user.full_name}")
        
        print("\n📊 Statistiky databáze:")
        print(f"   - Uživatelů: {db.query(User).count()}")
        print(f"   - Transakcí: {db.query(Transaction).count()}")
        print(f"   - Položek: {db.query(TransactionItem).count()}")
        
    except Exception as e:
        print(f"❌ Chyba při vytváření demo dat: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def clear_database():
    """Vymaže všechna data z databáze"""
    db = SessionLocal()
    try:
        # Smaž v opačném pořadí kvůli foreign keys
        db.query(TransactionItem).delete()
        db.query(Transaction).delete()
        db.query(User).delete()
        db.commit()
        print("✅ Databáze vyčištěna")
    except Exception as e:
        print(f"❌ Chyba při mazání dat: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "clear":
        clear_database()
    else:
        seed_demo_data()
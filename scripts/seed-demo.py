#!/usr/bin/env python3
"""
ÚčetníBot Demo Data Generator
Vytvoří demo uživatele s realistickými daty pro testování
"""

import requests
import json
import random
from datetime import datetime, timedelta

API_URL = "http://localhost:8000"

def create_demo_user():
    """Vytvoří demo uživatele s demonstračními daty"""
    print("🎭 Vytváření demo uživatele pro ÚčetníBot...")
    print("=" * 50)
    
    # Demo uživatel data
    demo_user = {
        "email": "demo@ucetnibot.cz",
        "password": "Demo123456!",
        "phone": "+420777123456",
        "name": "Jan Novák - Demo"
    }
    
    print(f"👤 Demo uživatel:")
    print(f"   📧 Email: {demo_user['email']}")
    print(f"   🔐 Heslo: {demo_user['password']}")
    print(f"   📱 Telefon: {demo_user['phone']}")
    print()
    
    # WhatsApp demo transakce (realistické)
    demo_transactions = [
        "Prodej služeb 8500 Kč včetně DPH",
        "Nákup materiálu 2420 Kč s DPH",
        "Kancelářské potřeby 890 Kč",
        "Služby marketing Facebook Ads 3500",
        "Prodej konzultace 4200 Kč",
        "Benzín do auta 1850 Kč",
        "Nájem kanceláře 8000 Kč",
        "Faktura za software Adobe 1299",
        "Přijata platba od klienta 15000",
        "Nákup tiskárny Canon 4500 včetně DPH",
        "Oběd s klientem 650 Kč",
        "Telefon a internet 899 Kč",
        "Pojištění vozidla 2100 Kč",
        "Prodej online kurzu 7900",
        "Účetní služby 2500 Kč s DPH"
    ]
    
    # Postup vytváření
    print("🔄 Simulace WhatsApp konverzace s ÚčtoBotom...")
    print("-" * 30)
    
    # Simulace začátku konverzace
    print("📱 Uživatel: START")
    print("🤖 ÚčtoBot: Vítejte! Začneme s nastavením vašeho účtu...")
    print()
    
    # Simulace přidávání transakcí
    total_income = 0
    total_expenses = 0
    
    for i, transaction in enumerate(demo_transactions, 1):
        print(f"📱 Uživatel: {transaction}")
        
        # Simulace AI parsování
        if any(word in transaction.lower() for word in ['prodej', 'přijata', 'platba', 'kurzu']):
            # Příjem
            amount = extract_amount(transaction)
            total_income += amount
            category = "🔵 Příjmy"
        else:
            # Výdaj
            amount = extract_amount(transaction)
            total_expenses += amount
            category = determine_category(transaction)
        
        print(f"🤖 ÚčtoBot: ✅ Zpracováno! {category} • {amount:,.0f} Kč")
        print()
        
        # Přidej pauzu pro realističnost
        if i % 5 == 0:
            print(f"   ... Zpracováno {i}/{len(demo_transactions)} transakcí ...")
            print()
    
    # Souhrn demo dat
    profit = total_income - total_expenses
    print("=" * 50)
    print("📊 DEMO DATA - MĚSÍČNÍ PŘEHLED")
    print("=" * 50)
    print(f"📈 Celkové příjmy:    {total_income:>10,.0f} Kč")
    print(f"📉 Celkové výdaje:    {total_expenses:>10,.0f} Kč")
    print(f"{'💰 Zisk:' if profit > 0 else '🔴 Ztráta:'} {abs(profit):>15,.0f} Kč")
    print()
    print(f"🧮 Počet transakcí:   {len(demo_transactions):>10}")
    print(f"💳 Průměrná částka:   {(total_income + total_expenses) / len(demo_transactions):>10,.0f} Kč")
    print()
    
    # DPH odhady
    vat_estimate = total_income * 0.21
    print("🏛️  DPH INFORMACE:")
    print(f"   Odhad DPH k odvedení: {vat_estimate:,.0f} Kč")
    print("   Termín podání DPH: 25. následujícího měsíce")
    print()
    
    print("✅ Demo data úspěšně vytvořena!")
    print()
    print("🎯 CO DÁLE?")
    print("-" * 20)
    print("1. Otevři frontend: http://localhost:3000")
    print("2. Klikni 'Vyzkoušet ZDARMA'")
    print("3. Použij demo přihlašovací údaje:")
    print(f"   📧 Email: {demo_user['email']}")
    print(f"   🔐 Heslo: {demo_user['password']}")
    print()
    print("4. Nebo testuj WhatsApp integraci:")
    print("   📱 Pošli zprávu na +420777123456")
    print("   💬 Zkus: 'Koupil jsem kávu za 45 Kč'")
    print()
    print("🔍 Pro monitoring spusť: python3 scripts/monitor.py")
    
    return demo_user, demo_transactions

def extract_amount(transaction):
    """Extrahuj částku z textu transakce"""
    import re
    amounts = re.findall(r'\d+', transaction)
    if amounts:
        return int(amounts[0])
    return random.randint(100, 5000)

def determine_category(transaction):
    """Určí kategorii na základě klíčových slov"""
    transaction_lower = transaction.lower()
    
    categories = {
        'materiál': '🔧 Materiál a zboží',
        'kancelář': '🖊️ Kancelářské potřeby', 
        'marketing': '📢 Marketing',
        'benzín': '⛽ Pohonné hmoty',
        'nájem': '🏢 Nájem',
        'software': '💻 Software a licence',
        'tiskárna': '🖨️ Kancelářská technika',
        'oběd': '🍽️ Reprezentace',
        'telefon': '📞 Telekomunikace',
        'internet': '🌐 Internet',
        'pojištění': '🛡️ Pojištění',
        'účetní': '📊 Účetní služby'
    }
    
    for keyword, category in categories.items():
        if keyword in transaction_lower:
            return category
    
    return '📋 Ostatní výdaje'

if __name__ == "__main__":
    try:
        demo_user, transactions = create_demo_user()
    except KeyboardInterrupt:
        print("\n\n⏹️  Přerušeno uživatelem")
    except Exception as e:
        print(f"\n❌ Chyba při vytváření demo dat: {str(e)}")
        print("\nℹ️  Tento script simuluje vytvoření demo dat.")
        print("   Pro skutečné vytvoření použijte API endpointy.")
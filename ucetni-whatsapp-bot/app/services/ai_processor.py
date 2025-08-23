"""
AI zpracování WhatsApp zpráv pomocí Groq API
"""
import re
import json
from datetime import datetime
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import Session

from app.models import User, Transaction, TransactionType, ActivationToken
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Groq AI klient (používáme requests pro jednoduchost)
import requests

class AIProcessor:
    def __init__(self):
        self.groq_api_key = settings.GROQ_API_KEY
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
    
    def extract_transaction_from_text(self, message: str, user: User) -> Optional[Dict]:
        """
        Extrahuje transakci z textové zprávy pomocí AI
        
        Args:
            message: Text zprávy od uživatele
            user: Uživatel, který zprávu poslal
            
        Returns:
            Dict s extrahovanými daty nebo None
        """
        
        # Nejdříve zkus jednoduché regex vzory pro rychlé zpracování
        quick_result = self._quick_parse(message)
        if quick_result:
            return quick_result
        
        # Pokud regex neselhá, použij AI
        if not self.groq_api_key:
            logger.warning("⚠️ GROQ API key není nastavený, používám fallback parsing")
            return self._fallback_parse(message)
        
        return self._ai_parse(message, user)
    
    def _quick_parse(self, message: str) -> Optional[Dict]:
        """Rychlé parsování pomocí regex vzorů"""
        
        # Vzory pro parsování
        patterns = [
            # "Koupil jsem notebook 25000"
            r"(?:koupil|kupil|nakoupil)\s+(?:jsem\s+)?(.+?)\s+(\d+(?:\.\d{2})?)",
            # "Prodal jsem web 50000"  
            r"(?:prodal|vydělal|příjem)\s+(?:jsem\s+)?(.+?)\s+(\d+(?:\.\d{2})?)",
            # "Faktura benzín 1200"
            r"(?:faktura|účtenka)\s+(.+?)\s+(\d+(?:\.\d{2})?)",
            # "Benzín 1500"
            r"^([a-záčďéěíňóřšťůúýž\s]+)\s+(\d+(?:\.\d{2})?)$",
            # "1500 benzín"
            r"^(\d+(?:\.\d{2})?)\s+([a-záčďéěíňóřšťůúýž\s]+)$"
        ]
        
        message_lower = message.lower().strip()
        
        for pattern in patterns:
            match = re.search(pattern, message_lower, re.IGNORECASE)
            if match:
                groups = match.groups()
                
                # Detekuj částku a popis
                if len(groups) == 2:
                    if groups[0].isdigit() or '.' in groups[0]:
                        amount = float(groups[0])
                        description = groups[1].strip()
                    else:
                        description = groups[0].strip()
                        amount = float(groups[1])
                    
                    # Detekuj typ transakce
                    transaction_type = "expense"  # default
                    if any(word in message_lower for word in ["prodal", "příjem", "vydělal", "tržba", "fakturace"]):
                        transaction_type = "income"
                    
                    # Detekuj kategorii
                    category = self._detect_category(description)
                    
                    return {
                        "type": transaction_type,
                        "amount": amount,
                        "description": description.title(),
                        "category": category,
                        "confidence": 0.8
                    }
        
        return None
    
    def _detect_category(self, description: str) -> str:
        """Detekuj kategorii podle popisu"""
        desc_lower = description.lower()
        
        categories_map = {
            "office-supplies": ["papír", "tisk", "kancelář", "pero", "sešit", "složka"],
            "it-equipment": ["notebook", "laptop", "počítač", "monitor", "klávesnice", "myš", "software"],
            "fuel": ["benzín", "nafta", "palivo", "tank"],
            "marketing": ["reklama", "marketing", "facebook", "google", "seznam", "inzerce"],
            "services": ["služba", "poradenství", "konzultace"],
            "travel": ["cesta", "hotel", "letenka", "vlak", "autobus"],
            "meals": ["oběd", "jídlo", "restaurace", "káva", "občerstvení"],
        }
        
        for category, keywords in categories_map.items():
            if any(keyword in desc_lower for keyword in keywords):
                return category
        
        return "other"
    
    def _ai_parse(self, message: str, user: User) -> Optional[Dict]:
        """Parsování pomocí Groq AI"""
        try:
            prompt = f"""
Extrahuj z následující česky psané zprávy informace o finanční transakci:

Zpráva: "{message}"

Odpověz POUZE validním JSON objektem s těmito klíči:
- "type": "income" nebo "expense"
- "amount": číselná částka v Kč
- "description": stručný popis transakce
- "category": jedna z kategorií: office-supplies, it-equipment, fuel, marketing, services, travel, meals, other
- "counterparty": název firmy/dodavatele (pokud je zřejmý)
- "confidence": číslo 0-1 jak si jsi jistý

Pokud zpráva neobsahuje finanční transakci, odpověz: {{"error": "no_transaction"}}

Příklady:
"Koupil jsem notebook 25000" -> {{"type": "expense", "amount": 25000, "description": "Nákup notebooku", "category": "it-equipment", "confidence": 0.9}}
"Příjem za web 50000" -> {{"type": "income", "amount": 50000, "description": "Příjem za web", "category": "services", "confidence": 0.9}}
"""

            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "mixtral-8x7b-32768",  # Rychlý a levný model
                "messages": [
                    {"role": "system", "content": "Jsi expert na finanční analýzu a parsování českých textů. Odpovídáš pouze validním JSON."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,  # Nízká teplota pro konzistentní výsledky
                "max_tokens": 200
            }
            
            response = requests.post(self.api_url, headers=headers, json=data, timeout=10)
            
            if response.status_code != 200:
                logger.error(f"❌ Groq API chyba: {response.status_code} - {response.text}")
                return self._fallback_parse(message)
            
            result = response.json()
            ai_response = result["choices"][0]["message"]["content"].strip()
            
            # Parsuj JSON odpověď
            try:
                parsed = json.loads(ai_response)
                if "error" in parsed:
                    return None
                return parsed
            except json.JSONDecodeError:
                logger.error(f"❌ AI vrátila nevalidní JSON: {ai_response}")
                return self._fallback_parse(message)
            
        except Exception as e:
            logger.error(f"❌ Chyba v AI parsování: {e}")
            return self._fallback_parse(message)
    
    def _fallback_parse(self, message: str) -> Optional[Dict]:
        """Fallback parsing bez AI"""
        
        # Hledej čísla v textu
        numbers = re.findall(r'\d+(?:\.\d{2})?', message)
        if not numbers:
            return None
        
        # Vezmi největší číslo jako částku
        amount = max([float(n) for n in numbers])
        
        # Jednoduché heuristiky
        description = message.strip().title()
        transaction_type = "expense"  # default
        
        if any(word in message.lower() for word in ["příjem", "prodal", "vydělal", "tržba"]):
            transaction_type = "income"
        
        return {
            "type": transaction_type,
            "amount": amount,
            "description": description,
            "category": "other",
            "confidence": 0.5
        }

# Globální instance
ai_processor = AIProcessor()

async def process_message_with_ai(message: str, user: User, db: Session) -> str:
    """
    Zpracuje zprávu od uživatele pomocí AI a vytvoří transakci
    
    Args:
        message: Text zprávy
        user: Uživatel
        db: Databázová session
        
    Returns:
        str: Odpověď pro uživatele
    """
    
    # Speciální příkazy
    message_lower = message.lower().strip()
    
    # Zkontroluj jestli je to aktivační token (32 znakový hex string)
    if re.match(r'^[a-fA-F0-9]{32}$', message.strip()):
        return await handle_activation_token(message.strip(), user, db)
    
    if message_lower in ["nápověda", "help", "pomoc"]:
        from app.services.whatsapp import format_help_message
        return format_help_message()
    
    if message_lower in ["statistiky", "přehled", "stats"]:
        stats = get_user_statistics(user, db)
        from app.services.whatsapp import format_statistics_message
        return format_statistics_message(stats)
    
    # Pokus se extrahovat transakci
    transaction_data = ai_processor.extract_transaction_from_text(message, user)
    
    if not transaction_data:
        return f"""❓ Nerozumím této zprávě: "{message}"

🤖 **Zkuste například:**
• "Koupil jsem notebook 25000"
• "Příjem za web 50000"  
• "Faktura benzín 1200"

_Pro nápovědu napište 'help'_"""
    
    # Vytvoř transakci v databázi
    try:
        # Vypočítej DPH
        amount = transaction_data["amount"]
        vat_rate = 21 if transaction_data["type"] == "expense" else 0
        
        if vat_rate > 0:
            amount_without_vat = amount / (1 + vat_rate/100)
            vat_amount = amount - amount_without_vat
        else:
            amount_without_vat = amount
            vat_amount = 0
        
        # Vytvoř transakci
        transaction = Transaction(
            user_id=user.id,
            type=TransactionType(transaction_data["type"]),
            amount=amount,
            amount_without_vat=amount_without_vat,
            vat_amount=vat_amount,
            vat_rate=vat_rate,
            description=transaction_data["description"],
            category=transaction_data.get("category"),
            counterparty_name=transaction_data.get("counterparty"),
            document_date=datetime.now().date(),
            payment_date=datetime.now().date(),
            completeness_score=int(transaction_data.get("confidence", 0.5) * 100),
            ai_confidence=transaction_data.get("confidence", 0.5)
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        # Aktualizuj uživatelské statistiky
        update_user_stats(user, db)
        
        # Vytvoř odpověď
        from app.services.whatsapp import format_transaction_message
        response_data = {
            "type": transaction_data["type"],
            "amount": amount,
            "description": transaction_data["description"],
            "category": transaction_data.get("category"),
            "created_at": datetime.now().strftime("%d.%m.%Y")
        }
        
        return format_transaction_message(response_data)
        
    except Exception as e:
        logger.error(f"❌ Chyba při vytváření transakce: {e}")
        return f"❌ Chyba při ukládání transakce: {str(e)}\n\n_Zkuste to znovu nebo kontaktujte podporu_"

def get_user_statistics(user: User, db: Session) -> Dict:
    """Získá statistiky uživatele"""
    
    # Základní statistiky
    transactions = db.query(Transaction).filter(Transaction.user_id == user.id).all()
    
    stats = {
        "total_transactions": len(transactions),
        "total_income": sum(t.amount for t in transactions if t.type == TransactionType.INCOME),
        "total_expenses": sum(t.amount for t in transactions if t.type == TransactionType.EXPENSE),
        "current_month_transactions": 0,
        "current_month_income": 0,
        "current_month_expenses": 0
    }
    
    stats["profit"] = stats["total_income"] - stats["total_expenses"]
    
    # Aktuální měsíc
    current_month = datetime.now().replace(day=1)
    current_month_transactions = [t for t in transactions if t.created_at >= current_month]
    
    stats["current_month_transactions"] = len(current_month_transactions)
    stats["current_month_income"] = sum(t.amount for t in current_month_transactions if t.type == TransactionType.INCOME)
    stats["current_month_expenses"] = sum(t.amount for t in current_month_transactions if t.type == TransactionType.EXPENSE)
    
    return stats

def update_user_stats(user: User, db: Session):
    """Aktualizuje statistiky uživatele"""
    try:
        stats = get_user_statistics(user, db)
        user.total_transactions = stats["total_transactions"]
        user.current_year_revenue = stats["total_income"]
        db.commit()
    except Exception as e:
        logger.error(f"❌ Chyba při aktualizaci statistik uživatele: {e}")

async def handle_activation_token(token: str, current_user: User, db: Session) -> str:
    """
    Zpracuje aktivační token od uživatele
    
    Args:
        token: Aktivační token (32 znakový hex string)
        current_user: Uživatel který poslal token (může být dočasný)
        db: Databázová session
        
    Returns:
        str: Odpověď pro uživatele
    """
    try:
        # Najdi uživatele s tímto aktivačním tokenem (použij novou tabulku)
        activation_token_record = db.query(ActivationToken).filter(
            ActivationToken.token == token,
            ActivationToken.is_used == False
        ).first()
        
        paid_user = None
        if activation_token_record:
            paid_user = db.query(User).filter(User.id == activation_token_record.user_id).first()
        
        # Fallback na starou logiku pro existující tokeny
        if not paid_user:
            paid_user = db.query(User).filter(
                User.activation_token == token,
                User.activation_used == False
            ).first()
        
        if not paid_user:
            return """❌ **Neplatný aktivační kód**

🔍 Možné příčiny:
• Kód už byl použit
• Kód je neplatný nebo vypršel
• Překlepli jste se při psaní

💡 **Co dělat:**
• Zkopírujte kód znovu z emailu
• Kontaktujte podporu: podpora@ucetnibot.cz"""
        
        # Zkontroluj jestli token nevypršel
        from datetime import datetime
        if paid_user.activation_expires_at and paid_user.activation_expires_at < datetime.utcnow():
            return """⏰ **Aktivační kód vypršel**

🔗 Prosím vytvořte si nové předplatné na:
https://ucetnibot.cz

🆘 Nebo kontaktujte podporu: podpora@ucetnibot.cz"""
        
        # Zkontroluj, jestli už platící uživatel nemá nastavenou aktivaci
        if paid_user.activation_used:
            return f"""⚠️ **Kód už byl použit**

🔍 Tento aktivační kód byl už použit k aktivaci:
📧 Email: {paid_user.email}
📱 Telefon: {paid_user.phone}
📅 Aktivováno: {paid_user.activation_used_at.strftime('%d.%m.%Y %H:%M') if paid_user.activation_used_at else 'N/A'}

🆘 Pokud si myslíte, že jde o chybu, kontaktujte podporu: podpora@ucetnibot.cz"""
        
        # Nejdříve odstraň telefon u všech ostatních uživatelů (bezpečnostní opatření)
        conflicting_users = db.query(User).filter(
            User.phone == current_user.phone,
            User.id != paid_user.id
        ).all()
        
        for user in conflicting_users:
            print(f"🔄 Převádím transakce z uživatele {user.id} na uživatele {paid_user.id}")
            # Převeď transakce na platícího uživatele
            transactions = db.query(Transaction).filter(Transaction.user_id == user.id).all()
            for transaction in transactions:
                transaction.user_id = paid_user.id
            
            # Nastav telefon na null nebo smaž uživatele
            if user.email is None and user.stripe_customer_id is None:
                # Smaž dočasného uživatele
                print(f"🗑️ Mažu dočasného uživatele {user.id}")
                db.delete(user)
            else:
                # Jen vynuluj telefon u uživatele s daty
                print(f"📞 Vynuluji telefon u uživatele {user.id}")
                user.phone = None
        
        # Flush změny před nastavením telefonu (vynutí provedení DELETE/UPDATE)
        db.flush()
        
        # Aktivuj uživatele - propoj s telefonním číslem
        paid_user.phone = current_user.phone
        paid_user.activation_used = True
        paid_user.activation_used_at = datetime.utcnow()
        paid_user.whatsapp_activated = True
        
        # Označit token jako použitý v nové tabulce
        activation_token_record = db.query(ActivationToken).filter(
            ActivationToken.token == token,
            ActivationToken.is_used == False
        ).first()
        
        if activation_token_record:
            activation_token_record.is_used = True
            activation_token_record.used_at = datetime.utcnow()
            activation_token_record.used_from_phone = current_user.phone
        
        # Smaž dočasného uživatele pokud existuje a není to stejný
        if current_user.id != paid_user.id:
            # Převeď transakce z dočasného uživatele na platícího
            transactions = db.query(Transaction).filter(Transaction.user_id == current_user.id).all()
            for transaction in transactions:
                transaction.user_id = paid_user.id
            
            # Smaž dočasného uživatele
            db.delete(current_user)
        
        db.commit()
        
        # Aktualizuj statistiky
        update_user_stats(paid_user, db)
        
        return f"""✅ **Aktivace úspěšná!**

🎉 Vítejte v ÚčetníBot Premium!
📧 Email: {paid_user.email}
📱 Telefon: {paid_user.phone}

🚀 **Můžete začít:**
• Posílejte mi účtenky a faktury
• "Koupil jsem notebook 25000"
• "Příjem za web 50000"
• Pro nápovědu napište "help"

💼 **Váš plán:** {paid_user.subscription_plan} 
📅 **Platí do:** {paid_user.subscription_until.strftime('%d.%m.%Y') if paid_user.subscription_until else 'N/A'}"""
        
    except Exception as e:
        logger.error(f"❌ Chyba při aktivaci tokenu: {e}")
        return f"""❌ **Chyba při aktivaci**

{str(e)}

🆘 Kontaktujte podporu: podpora@ucetnibot.cz"""
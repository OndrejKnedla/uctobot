from app.ai_processor import AIProcessor
# Database import removed - using new SQLAlchemy services
from utils.twilio_client import TwilioClient
from utils.currency_converter import CurrencyConverter
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class WhatsAppHandler:
    def __init__(self):
        self.ai_processor = AIProcessor()
        self.twilio_client = TwilioClient()
        self.currency_converter = CurrencyConverter()

    async def process_transaction(self, message: str, user_id: int, user_number: str) -> str:
        try:
            transaction_data = await self.ai_processor.process_message(message)
            
            if not transaction_data:
                return self._get_error_response(message)
            
            from app.database.operations import db_operations
            transaction_id = await db_operations.save_transaction(user_id, transaction_data)
            
            return self._format_success_response(transaction_data, transaction_id)
            
        except Exception as e:
            logger.error(f"Chyba při zpracování transakce: {str(e)}")
            return "❌ Omlouvám se, nastala chyba při zpracování vaší zprávy. Zkuste to prosím znovu."

    def _format_success_response(self, transaction_data: Dict[str, Any], transaction_id: int) -> str:
        trans_type = "příjem" if transaction_data['type'] == 'income' else "výdaj"
        emoji = "📈" if transaction_data['type'] == 'income' else "📉"
        
        # Zobraź původní měnu i přepočet na CZK
        original_currency = transaction_data.get('original_currency', 'CZK')
        original_amount = transaction_data.get('original_amount', transaction_data['amount'])
        
        if original_currency != 'CZK':
            # Cizí měna - zobrazíme obě částky
            original_formatted = self.currency_converter.format_amount(original_amount, original_currency)
            czk_amount = transaction_data['amount']
            czk_formatted = self._format_currency(czk_amount)
            exchange_rate = transaction_data.get('exchange_rate', 1.0)
            
            response = f"""✅ *Zaznamenal jsem {trans_type}*

{emoji} *Typ:* {trans_type.capitalize()}
💰 *Částka:* {original_formatted} ({czk_formatted} Kč)
💱 *Kurz:* 1 {original_currency} = {exchange_rate:.2f} Kč (ČNB {datetime.now().strftime('%d.%m.%Y')})
📁 *Kategorie:* {transaction_data.get('category_name', 'Nezařazeno')}
📝 *Popis:* {transaction_data.get('description', 'Bez popisu')}
🔢 *ID transakce:* #{transaction_id}"""
        else:
            # CZK - standardní zobrazení
            amount_formatted = self._format_currency(original_amount)
            response = f"""✅ *Zaznamenal jsem {trans_type}*

{emoji} *Typ:* {trans_type.capitalize()}
💰 *Částka:* {amount_formatted} Kč
📁 *Kategorie:* {transaction_data.get('category_name', 'Nezařazeno')}
📝 *Popis:* {transaction_data.get('description', 'Bez popisu')}
🔢 *ID transakce:* #{transaction_id}"""
        
        if transaction_data['type'] == 'expense' and transaction_data['amount'] > 10000:
            response += "\n\n💡 *Tip:* Nezapomeň si uschovat doklad pro daňové účely!"
        
        return response

    def _get_error_response(self, message: str) -> str:
        suggestions = [
            "Koupil jsem notebook za 25000",
            "Faktura od Alza 35000",
            "AWS faktura $49.99",
            "Hotel Vídeň 234,50 €",
            "Přišla platba 50000 od ČEZ",
            "Tankování 1500"
        ]
        
        import random
        example = random.choice(suggestions)
        
        return f"""❓ *Nerozumím vaší zprávě*

Nemohl jsem rozpoznat transakci ve vaší zprávě: "{message[:50]}..."

*Zkuste například:*
• {example}

*Pro nápovědu napište:* pomoc"""

    def _format_currency(self, amount: float) -> str:
        return f"{amount:,.0f}".replace(",", " ")

    async def handle_voice_message(self, audio_url: str, user_id: int) -> str:
        return """🎤 *Hlasové zprávy*

Omlouvám se, ale zatím neumím zpracovávat hlasové zprávy.

Prosím napište mi vaši transakci textově.

*Například:*
• "Koupil jsem papír za 500"
• "Faktura 15000 od Škoda"

Pro nápovědu napište: *pomoc*"""

    async def handle_image_message(self, image_url: str, user_id: int) -> str:
        return """📷 *Obrázky a dokumenty*

Omlouvám se, ale zatím neumím zpracovávat obrázky účtenek nebo faktur.

Prosím napište mi údaje z dokladu textově.

*Například:*
• "Nákup Albert 1250"
• "Faktura za služby 35000"

*Tip:* V budoucí verzi budu umět číst účtenky přímo z fotek!

Pro nápovědu napište: *pomoc*"""

    async def validate_transaction(self, transaction_data: Dict[str, Any]) -> tuple[bool, str]:
        if transaction_data['amount'] <= 0:
            return False, "Částka musí být větší než 0"
        
        if transaction_data['amount'] > 10000000:
            return False, "Částka se zdá být příliš vysoká. Zkontrolujte prosím zadání."
        
        if not transaction_data.get('type') in ['income', 'expense']:
            return False, "Neplatný typ transakce"
        
        return True, ""

    async def get_quick_stats(self, user_id: int) -> str:
        try:
            stats = await self.db.get_user_statistics(user_id)
            
            if not stats or stats.get('total_transactions', 0) == 0:
                return "📊 Zatím nemáte žádné zaznamenané transakce."
            
            total_income = stats.get('total_income', 0)
            total_expenses = stats.get('total_expenses', 0)
            profit = total_income - total_expenses
            
            return f"""📊 *Rychlý přehled*

💰 *Celkové příjmy:* {self._format_currency(total_income)} Kč
📉 *Celkové výdaje:* {self._format_currency(total_expenses)} Kč
📈 *Zisk:* {self._format_currency(profit)} Kč

📝 *Počet transakcí:* {stats.get('total_transactions', 0)}

Pro detailní přehled napište: *přehled* nebo *kvartál*"""
            
        except Exception as e:
            logger.error(f"Chyba při získávání statistik: {str(e)}")
            return "❌ Nepodařilo se získat statistiky."
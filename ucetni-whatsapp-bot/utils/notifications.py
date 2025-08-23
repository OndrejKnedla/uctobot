import asyncio
from datetime import datetime, timedelta
import logging
from typing import List, Dict, Any
# Database import removed - using new SQLAlchemy services
from utils.twilio_client import TwilioClient

logger = logging.getLogger(__name__)

class NotificationManager:
    def __init__(self):
        self.twilio_client = TwilioClient()
        self.running = False

    async def start_reminder_loop(self):
        self.running = True
        logger.info("Spouštím smyčku připomínek...")
        
        while self.running:
            try:
                await self.check_and_send_reminders()
                await asyncio.sleep(3600)
                
            except Exception as e:
                logger.error(f"Chyba v reminder loop: {str(e)}")
                await asyncio.sleep(300)

    async def stop_reminder_loop(self):
        self.running = False
        logger.info("Zastavuji smyčku připomínek...")

    async def check_and_send_reminders(self):
        try:
            now = datetime.now()
            logger.info(f"Kontroluji připomínky - {now.strftime('%Y-%m-%d %H:%M')}")
            
            if now.hour == 9:
                await self.send_tax_reminders()
                await self.send_vat_reminders()
                await self.send_custom_reminders()
            
            if now.day == 1 and now.hour == 8:
                await self.send_monthly_summary()
            
            if now.day in [1, 10, 20] and now.hour == 14:
                await self.send_tips()
                
        except Exception as e:
            logger.error(f"Chyba při kontrole připomínek: {str(e)}")

    async def send_tax_reminders(self):
        try:
            now = datetime.now()
            
            if now.day == 10:
                reminders = await db_operations.get_pending_reminders()
                
                for reminder in reminders:
                    if reminder['reminder_type'] == 'tax_advance':
                        message = """📅 *Připomínka - Zálohy na daň*

⚠️ Do 15. dne je potřeba zaplatit zálohy na daň z příjmů!

*Co udělat:*
1. Spočítej zálohu (obvykle 1/4 z loňské daně)
2. Zaplať na účet finančního úřadu
3. Použij správný variabilní symbol

💡 *Tip:* Nastav si trvalý příkaz, ať na to nemusíš myslet!"""
                        
                        success = await self.twilio_client.send_message(
                            reminder['whatsapp_number'],
                            message
                        )
                        
                        if success:
                            await db_operations.mark_reminder_sent(reminder['id'])
                            logger.info(f"Odeslána připomínka na zálohy pro {reminder['whatsapp_number']}")
                            
        except Exception as e:
            logger.error(f"Chyba při odesílání tax reminders: {str(e)}")

    async def send_vat_reminders(self):
        try:
            now = datetime.now()
            current_quarter = (now.month - 1) // 3 + 1
            
            is_vat_deadline_month = now.month in [1, 4, 7, 10]
            
            if is_vat_deadline_month and now.day == 20:
                reminders = await db_operations.get_pending_reminders()
                
                for reminder in reminders:
                    if reminder['reminder_type'] == 'vat':
                        message = f"""📅 *DŮLEŽITÉ - DPH za Q{current_quarter}*

⚠️ Do 25. je termín pro podání přiznání k DPH!

*Nezapomeň:*
✅ Vyplnit přiznání k DPH
✅ Podat elektronicky přes datovku
✅ Zaplatit daň (pokud vyjde k úhradě)

*Rychlý přehled:*
Pro zobrazení kvartálního přehledu napiš: *kvartál*

💡 Potřebuješ pomoc? Napiš *pomoc*"""
                        
                        success = await self.twilio_client.send_message(
                            reminder['whatsapp_number'],
                            message
                        )
                        
                        if success:
                            await db_operations.mark_reminder_sent(reminder['id'])
                            logger.info(f"Odeslána DPH připomínka pro {reminder['whatsapp_number']}")
                            
        except Exception as e:
            logger.error(f"Chyba při odesílání VAT reminders: {str(e)}")

    async def send_custom_reminders(self):
        try:
            pending_reminders = await self.db.get_pending_reminders()
            
            for reminder in pending_reminders:
                if reminder['reminder_type'] not in ['tax_advance', 'vat']:
                    success = await self.twilio_client.send_message(
                        reminder['whatsapp_number'],
                        reminder['message']
                    )
                    
                    if success:
                        await self.db.mark_reminder_sent(reminder['id'])
                        logger.info(f"Odeslána custom připomínka #{reminder['id']}")
                        
        except Exception as e:
            logger.error(f"Chyba při odesílání custom reminders: {str(e)}")

    async def send_monthly_summary(self):
        try:
            from app.database.operations import db_operations
            users = await db_operations.get_all_users()
            
            for user in users:
                last_month = datetime.now().replace(day=1) - timedelta(days=1)
                month_name = self._get_czech_month_name(last_month.month)
                
                summary = await self.db.get_monthly_summary(user['id'])
                
                if summary and summary['transaction_count'] > 0:
                    message = f"""📊 *Měsíční shrnutí - {month_name}*

📈 *Příjmy:* {self._format_currency(summary['total_income'])} Kč
📉 *Výdaje:* {self._format_currency(summary['total_expenses'])} Kč
💰 *Zisk:* {self._format_currency(summary['profit'])} Kč

*Počet transakcí:* {summary['transaction_count']}

Pro detailní export napiš: *export*

🎯 Hodně štěstí v novém měsíci!"""
                    
                    await self.twilio_client.send_message(
                        user['whatsapp_number'],
                        message
                    )
                    
                    logger.info(f"Odeslán měsíční souhrn pro {user['whatsapp_number']}")
                    
        except Exception as e:
            logger.error(f"Chyba při odesílání měsíčního souhrnu: {str(e)}")

    async def send_tips(self):
        tips = [
            "💡 *Tip dne:* Veď si evidenci jízdného! Cesty k zákazníkům můžeš dát do nákladů.",
            "💡 *Tip dne:* Pamatuj na 60% paušál u auta - nemusíš evidovat každý výdaj!",
            "💡 *Tip dne:* Reprezentaci můžeš uplatnit jen do výše 50% výdajů.",
            "💡 *Tip dne:* Uschovávej všechny doklady minimálně 5 let!",
            "💡 *Tip dne:* Home office? Část nájmu a energií můžeš dát do nákladů.",
            "💡 *Tip dne:* Vzdělávací kurzy jsou daňově uznatelným nákladem!",
            "💡 *Tip dne:* Nezapomeň na odpisy majetku nad 80 000 Kč.",
            "💡 *Tip dne:* Kontroluj si DPH na vstupu i výstupu každý měsíc."
        ]
        
        import random
        tip = random.choice(tips)
        
        try:
            from app.database.operations import db_operations
            users = await db_operations.get_all_users()
            
            active_users = []
            for user in users:
                recent_transactions = await db_operations.get_transactions(user['id'], limit=1)
                if recent_transactions:
                    last_transaction = recent_transactions[0]
                    days_ago = (datetime.now() - last_transaction['created_at']).days
                    if days_ago <= 30:
                        active_users.append(user)
            
            for user in active_users[:10]:
                await self.twilio_client.send_message(
                    user['whatsapp_number'],
                    tip
                )
                await asyncio.sleep(1)
                
            logger.info(f"Odeslány tipy {len(active_users)} aktivním uživatelům")
            
        except Exception as e:
            logger.error(f"Chyba při odesílání tipů: {str(e)}")

    def _format_currency(self, amount: float) -> str:
        return f"{amount:,.0f}".replace(",", " ")

    def _get_czech_month_name(self, month: int) -> str:
        months = {
            1: "leden", 2: "únor", 3: "březen", 4: "duben",
            5: "květen", 6: "červen", 7: "červenec", 8: "srpen",
            9: "září", 10: "říjen", 11: "listopad", 12: "prosinec"
        }
        return months.get(month, "")

    async def schedule_custom_reminder(self, user_id: int, message: str, due_date: datetime) -> bool:
        try:
            async with self.db.pool.acquire() as conn:
                await conn.execute(
                    '''INSERT INTO reminders (user_id, reminder_type, message, due_date)
                       VALUES ($1, $2, $3, $4)''',
                    user_id, 'custom', message, due_date
                )
                
                logger.info(f"Naplánována připomínka pro uživatele #{user_id}")
                return True
                
        except Exception as e:
            logger.error(f"Chyba při plánování připomínky: {str(e)}")
            return False
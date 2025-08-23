from typing import Dict, Any, Optional
from enum import Enum
from datetime import datetime, timedelta
import logging
import asyncio
from utils.ares_validator import validate_ico
from app.services.user_service import UserService

logger = logging.getLogger(__name__)

class OnboardingStep(Enum):
    WELCOME = "welcome"
    NAME = "name"
    ICO = "ico"
    ICO_CONFIRM = "ico_confirm"
    TAX_MODE = "tax_mode"
    TAX_MODE_HELP = "tax_mode_help"
    VAT_STATUS = "vat_status"
    VAT_HELP = "vat_help"
    BUSINESS_TYPE = "business_type"
    BANK_CONNECTION = "bank_connection"
    NOTIFICATIONS = "notifications"
    COMPLETED = "completed"

class OnboardingWizard:
    def __init__(self, user_service: Optional[UserService] = None):
        self.user_sessions = {}  # user_id -> session_data
        self.user_service = user_service
        
        self.business_types = {
            '1': {
                'code': 'it_programming',
                'name': 'IT/Programování',
                'categories': ['518300', '501100', '518200'],
                'common_expenses': ['software', 'hosting', 'domény', 'notebook', 'monitor']
            },
            '2': {
                'code': 'graphic_design',
                'name': 'Grafika/Design',
                'categories': ['518300', '501100', '501400'],
                'common_expenses': ['adobe', 'stock fotky', 'tablet', 'tiskárna']
            },
            '3': {
                'code': 'consulting',
                'name': 'Konzultace/Poradenství',
                'categories': ['513100', '518200', '501100'],
                'common_expenses': ['cestovné', 'reprezentace', 'telefon']
            },
            '4': {
                'code': 'trades_construction',
                'name': 'Řemesla/Stavebnictví',
                'categories': ['501100', '501300', '501400'],
                'common_expenses': ['nářadí', 'materiál', 'benzín', 'pracovní oděvy']
            },
            '5': {
                'code': 'e_commerce',
                'name': 'E-shop/Prodej zboží',
                'categories': ['501200', '518300', '518600'],
                'common_expenses': ['zboží', 'doprava', 'marketing', 'poplatky']
            },
            '6': {
                'code': 'other_services',
                'name': 'Jiné služby',
                'categories': ['549100', '518200', '501100'],
                'common_expenses': ['různé služby', 'komunikace', 'materiál']
            }
        }
        
        self.banks = {
            '1': {'code': 'fio', 'name': 'Fio banka'},
            '2': {'code': 'airbank', 'name': 'Air Bank'},
            '3': {'code': 'csob', 'name': 'ČSOB'},
            '4': {'code': 'csas', 'name': 'Česká spořitelna'},
            '5': {'code': 'kb', 'name': 'Komerční banka'},
            '6': {'code': 'later', 'name': 'Později'}
        }
    
    def start_onboarding(self, user_id: int) -> str:
        """Spustí onboarding proces"""
        self.user_sessions[user_id] = {
            'step': OnboardingStep.WELCOME,
            'data': {},
            'started_at': datetime.now()
        }
        
        return self._get_welcome_message()
    
    async def process_onboarding_message(self, user_id: int, message: str) -> str:
        """Zpracuje zprávu v rámci onboarding procesu"""
        if user_id not in self.user_sessions:
            return "❌ Onboarding proces nebyl spuštěn. Napište /start"
        
        session = self.user_sessions[user_id]
        current_step = session['step']
        
        try:
            if current_step == OnboardingStep.WELCOME:
                return self._handle_welcome(user_id, message)
            elif current_step == OnboardingStep.NAME:
                return self._handle_name(user_id, message)
            elif current_step == OnboardingStep.ICO:
                return await self._handle_ico(user_id, message)
            elif current_step == OnboardingStep.ICO_CONFIRM:
                return self._handle_ico_confirm(user_id, message)
            elif current_step == OnboardingStep.TAX_MODE:
                return self._handle_tax_mode(user_id, message)
            elif current_step == OnboardingStep.TAX_MODE_HELP:
                return self._handle_tax_mode_help(user_id, message)
            elif current_step == OnboardingStep.VAT_STATUS:
                return self._handle_vat_status(user_id, message)
            elif current_step == OnboardingStep.VAT_HELP:
                return self._handle_vat_help(user_id, message)
            elif current_step == OnboardingStep.BUSINESS_TYPE:
                return self._handle_business_type(user_id, message)
            elif current_step == OnboardingStep.BANK_CONNECTION:
                return self._handle_bank_connection(user_id, message)
            elif current_step == OnboardingStep.NOTIFICATIONS:
                return await self._handle_notifications(user_id, message)
            else:
                return "❌ Neočekávaný krok onboardingu"
                
        except Exception as e:
            logger.error(f"Error in onboarding step {current_step}: {str(e)}")
            return "❌ Nastala chyba. Zkuste to znovu nebo napište /start pro restart."
    
    def _get_welcome_message(self) -> str:
        return """👋 *Ahoj! Jsem ÚčetníBot*

Pomůžu ti s účetnictvím přes WhatsApp.
Za 2 minuty tě nastavím a můžeš začít.

Nejdřív potřebuju pár základních údajů.

*Jak se jmenuješ?* (jméno a příjmení)"""
    
    def _handle_welcome(self, user_id: int, message: str) -> str:
        # Přechod na zadání jména
        self.user_sessions[user_id]['step'] = OnboardingStep.NAME
        return self._handle_name(user_id, message)
    
    def _handle_name(self, user_id: int, message: str) -> str:
        name = message.strip()
        
        if len(name) < 3:
            return "❌ Zadejte prosím celé jméno (alespoň 3 znaky)"
        
        self.user_sessions[user_id]['data']['full_name'] = name
        self.user_sessions[user_id]['step'] = OnboardingStep.ICO
        
        return f"""Super, {name.split()[0]}! 👍

Teď potřebuju tvoje *IČO* (identifikační číslo osoby).

📝 *Napiš prosím jen 8-místné číslo* (např. 12345678)
❌ *Nepíš "IČO" před číslem*

Pokud ho ještě nemáš, napiš "*nemám*".

💡 *Tip:* IČO najdeš na živnostenském listu nebo na portálu Moje daně."""
    
    async def _handle_ico(self, user_id: int, message: str) -> str:
        ico = message.strip().replace(' ', '').upper()
        
        if ico in ['NEMÁM', 'NEMAM', 'NEMÁM IČO', 'NEEXISTUJE']:
            self.user_sessions[user_id]['data']['ico'] = None
            self.user_sessions[user_id]['step'] = OnboardingStep.TAX_MODE
            return self._get_tax_mode_message()
        
        # Zkontroluj formát IČO
        if not ico.isdigit() or len(ico) != 8:
            return "❌ IČO musí být přesně 8 číslic.\n\n📝 Zadej prosím jen čísla (např. 12345678) nebo 'nemám'."
        
        # Dočasný bypass pro ARES - uložíme IČO přímo
        try:
            self.user_sessions[user_id]['data']['ico'] = ico
            self.user_sessions[user_id]['data']['company_name'] = f"Podnikatel IČO {ico}"
            self.user_sessions[user_id]['data']['dic'] = None
            self.user_sessions[user_id]['data']['address'] = ''
            self.user_sessions[user_id]['step'] = OnboardingStep.ICO_CONFIRM
            
            return f"""✅ *IČO přijato:*

🏢 *IČO:* {ico}
📋 *Poznámka:* Údaje z ARES se načtou později

*Je to správně?* (ano/ne)"""
                
        except Exception as e:
            logger.error(f"ICO processing error: {str(e)}")
            return "❌ Chyba při zpracování IČO. Zkuste to znovu nebo napište 'nemám'."
    
    def _handle_ico_confirm(self, user_id: int, message: str) -> str:
        response = message.strip().lower()
        
        if response in ['ano', 'a', 'yes', 'správně', 'spravne']:
            # Přechod na daňový režim
            self.user_sessions[user_id]['step'] = OnboardingStep.TAX_MODE
            logger.info(f"Uživatel {user_id} potvrdil IČO, přechod na TAX_MODE")
            return self._get_tax_mode_message()
        elif response in ['ne', 'n', 'no', 'špatně', 'spatne']:
            self.user_sessions[user_id]['step'] = OnboardingStep.ICO
            return "Zadejte prosím správné IČO nebo napište 'nemám':"
        else:
            return "Odpovězte prosím 'ano' nebo 'ne':"
    
    def _get_tax_mode_message(self) -> str:
        return """💰 *Jaký máš daňový režim?*

Vyber číslo:

1️⃣ *Paušální daň* (měsíční paušál)
2️⃣ *Skutečné výdaje* (60% nebo reálné)
3️⃣ *Nevím/Pomozte mi*

💡 *Tip:* Paušální daň je jednodušší - platíš fixní částku měsíčně."""
    
    def _handle_tax_mode(self, user_id: int, message: str) -> str:
        choice = message.strip()
        
        if choice == '1':
            self.user_sessions[user_id]['data']['tax_mode'] = 'pausalni'
            self.user_sessions[user_id]['step'] = OnboardingStep.VAT_STATUS
            return self._get_vat_status_message()
        elif choice == '2':
            self.user_sessions[user_id]['data']['tax_mode'] = 'skutecne'
            self.user_sessions[user_id]['step'] = OnboardingStep.VAT_STATUS
            return self._get_vat_status_message()
        elif choice == '3':
            self.user_sessions[user_id]['step'] = OnboardingStep.TAX_MODE_HELP
            return """🤔 *Žádný problém! Pomohu ti vybrat.*

Odpověz na otázky:

1) *Máš roční příjmy pod 2 mil. Kč?* (ano/ne)
2) *Chceš platit jednu částku měsíčně?* (ano/ne)

Napiš odpovědi oddělené čárkou, např: "ano, ano" """
        else:
            return "❌ Vyber prosím číslo 1, 2 nebo 3"
    
    def _handle_tax_mode_help(self, user_id: int, message: str) -> str:
        responses = [r.strip().lower() for r in message.split(',')]
        
        if len(responses) != 2:
            return "❌ Zadej obě odpovědi oddělené čárkou, např: 'ano, ne'"
        
        under_2mil = responses[0] in ['ano', 'a']
        wants_fixed = responses[1] in ['ano', 'a']
        
        if under_2mil and wants_fixed:
            recommendation = 'pausalni'
            msg = "💡 *Doporučuji: Paušální daň*\n\nPlatíš fixní částku měsíčně a nemusíš řešit výdaje."
        else:
            recommendation = 'skutecne'
            msg = "💡 *Doporučuji: Skutečné výdaje*\n\nMůžeš si odečíst všechny výdaje nebo použít 60% paušál."
        
        self.user_sessions[user_id]['data']['tax_mode'] = recommendation
        self.user_sessions[user_id]['step'] = OnboardingStep.VAT_STATUS
        
        return f"{msg}\n\n{self._get_vat_status_message()}"
    
    def _get_vat_status_message(self) -> str:
        return """📊 *Jsi plátce DPH?*

1️⃣ *Ano*, jsem plátce DPH
2️⃣ *Ne*, nejsem plátce DPH
3️⃣ *Nevím*

💡 *Tip:* Plátce musíš být pokud tvůj obrat přesáhl 2 mil. Kč za 12 měsíců."""
    
    def _handle_vat_status(self, user_id: int, message: str) -> str:
        choice = message.strip()
        
        if choice == '1':
            self.user_sessions[user_id]['data']['vat_payer'] = True
            self.user_sessions[user_id]['step'] = OnboardingStep.BUSINESS_TYPE
            return self._get_business_type_message()
        elif choice == '2':
            self.user_sessions[user_id]['data']['vat_payer'] = False
            self.user_sessions[user_id]['step'] = OnboardingStep.BUSINESS_TYPE
            return self._get_business_type_message()
        elif choice == '3':
            self.user_sessions[user_id]['step'] = OnboardingStep.VAT_HELP
            return """❓ *Pomůžu ti určit, jestli jsi plátce DPH.*

*Tvůj přibližný roční obrat je?* (v Kč)

Napiš číslo, např: 1500000

💡 Pokud je nad 2 000 000 Kč, musíš být plátce DPH."""
        else:
            return "❌ Vyber prosím číslo 1, 2 nebo 3"
    
    def _handle_vat_help(self, user_id: int, message: str) -> str:
        try:
            turnover = int(message.strip().replace(' ', '').replace(',', ''))
            
            if turnover >= 2000000:
                self.user_sessions[user_id]['data']['vat_payer'] = True
                msg = f"📊 Obrat {turnover:,} Kč → *Musíš být plátce DPH*"
            else:
                self.user_sessions[user_id]['data']['vat_payer'] = False
                msg = f"📊 Obrat {turnover:,} Kč → *Nemusíš být plátce DPH*"
            
            self.user_sessions[user_id]['step'] = OnboardingStep.BUSINESS_TYPE
            return f"{msg}\n\n{self._get_business_type_message()}"
            
        except ValueError:
            return "❌ Zadej prosím číslo (roční obrat v Kč)"
    
    def _get_business_type_message(self) -> str:
        options = []
        for key, value in self.business_types.items():
            options.append(f"{key}️⃣ {value['name']}")
        
        return f"""🏢 *Co hlavně děláš?*

Vyber nejbližší:

{chr(10).join(options)}

💡 Podle výběru přednaplním kategorie výdajů."""
    
    def _handle_business_type(self, user_id: int, message: str) -> str:
        choice = message.strip()
        
        if choice in self.business_types:
            business_data = self.business_types[choice]
            self.user_sessions[user_id]['data']['business_type'] = business_data['code']
            self.user_sessions[user_id]['data']['business_name'] = business_data['name']
            self.user_sessions[user_id]['data']['default_categories'] = business_data['categories']
            self.user_sessions[user_id]['step'] = OnboardingStep.BANK_CONNECTION
            
            return f"""✅ *{business_data['name']}* - výborně!

Přednaplnil jsem časté kategorie výdajů:
{', '.join(business_data['common_expenses'])}

🏦 *Chceš propojit bankovní účet* pro automatický import? (ano/ne/později)

💡 Ušetří ti to čas při zadávání transakcí."""
        else:
            return f"❌ Vyber prosím číslo 1-{len(self.business_types)}"
    
    def _handle_bank_connection(self, user_id: int, message: str) -> str:
        response = message.strip().lower()
        
        if response in ['ne', 'n', 'později', 'pozdeji']:
            self.user_sessions[user_id]['data']['bank_connection'] = None
            self.user_sessions[user_id]['step'] = OnboardingStep.NOTIFICATIONS
            return self._get_notifications_message()
        elif response in ['ano', 'a', 'yes']:
            return self._get_bank_selection_message()
        else:
            return "Odpověz prosím 'ano', 'ne' nebo 'později'"
    
    def _get_bank_selection_message(self) -> str:
        options = []
        for key, value in self.banks.items():
            options.append(f"{key}️⃣ {value['name']}")
        
        return f"""🏦 *Z které banky máš firemní účet?*

{chr(10).join(options)}

💡 Pro propojení budeš potřebovat API token z internetového bankovnictví."""
    
    def _handle_bank_selection(self, user_id: int, message: str) -> str:
        choice = message.strip()
        
        if choice in self.banks:
            bank_data = self.banks[choice]
            if choice == '6':  # Později
                self.user_sessions[user_id]['data']['bank_connection'] = None
            else:
                self.user_sessions[user_id]['data']['bank_connection'] = {
                    'bank': bank_data['code'],
                    'name': bank_data['name'],
                    'api_key': None  # Nastaví se později
                }
            
            self.user_sessions[user_id]['step'] = OnboardingStep.NOTIFICATIONS
            return self._get_notifications_message()
        else:
            return f"❌ Vyber prosím číslo 1-{len(self.banks)}"
    
    def _get_notifications_message(self) -> str:
        return """⏰ *Kdy ti mám posílat připomínky?*

📅 *Zálohy na daň* (každý měsíc do 15.):
• 5 dní předem (10. den)
• 2 dny předem (13. den)

📊 *DPH* (každý kvartál do 25.):
• Týden předem
• 2 dny předem

*Chceš výchozí nastavení?* (ano/vlastní)"""
    
    async def _handle_notifications(self, user_id: int, message: str) -> str:
        response = message.strip().lower()
        
        if response in ['ano', 'a', 'výchozí', 'vychozi', 'default']:
            notifications = {
                'tax_advance': {'days_before': [5, 2]},
                'vat': {'days_before': [7, 2]},
                'enabled': True
            }
        else:
            notifications = {
                'tax_advance': {'days_before': [7, 2]},
                'vat': {'days_before': [7, 2]},
                'enabled': True
            }
        
        self.user_sessions[user_id]['data']['reminder_settings'] = notifications
        self.user_sessions[user_id]['step'] = OnboardingStep.COMPLETED
        
        # Ulož onboarding data do databáze
        if self.user_service:
            try:
                success = await self.user_service.complete_onboarding(
                    user_id, 
                    self.user_sessions[user_id]['data']
                )
                if success:
                    logger.info(f"Onboarding dokončen pro uživatele {user_id}")
                else:
                    logger.error(f"Chyba při ukládání onboarding dat pro uživatele {user_id}")
            except Exception as e:
                logger.error(f"Chyba při dokončování onboarding: {str(e)}")
        
        return self._get_completion_message(user_id)
    
    def _get_completion_message(self, user_id: int) -> str:
        session_data = self.user_sessions[user_id]['data']
        name = session_data['full_name'].split()[0]
        
        return f"""🎉 *Výborně, {name}! Tvůj účet je nastaven*

📱 *JAK TO FUNGUJE:*
• Napiš libovolný výdaj: "notebook 25000"
• Nebo příjem: "faktura Alza 45000" 
• S měnou: "AWS $49.99"
• Pro přehled: "přehled"
• Pro nápovědu: "pomoc"

💳 *PŘEDPLATNÉ: 299 Kč/měsíc*
🔗 **Aktivovat:** https://ucetni-bot.cz/subscribe

Po aktivaci můžeš začít používat všechny funkce!
Napište *info* pro více informací o předplatném."""
    
    async def is_onboarding_completed(self, user_id: int) -> bool:
        """Zjistí, zda je onboarding dokončený"""
        # Nejprve zkontroluj session
        session_completed = (user_id in self.user_sessions and 
                            self.user_sessions[user_id]['step'] == OnboardingStep.COMPLETED)
        
        # Pokud máme user_service, zkontroluj i databázi
        if self.user_service:
            try:
                from app.database.models import User
                from sqlalchemy.orm import sessionmaker
                # Toto je hack - v produkci bychom potřebovali lepší přístup k DB session
                # Pro nyní budeme spoléhat na session cache
                return session_completed
            except Exception as e:
                logger.error(f"Chyba při kontrole onboarding v DB: {str(e)}")
        
        return session_completed
    
    def get_user_onboarding_data(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Vrátí data z onboarding procesu"""
        if user_id not in self.user_sessions:
            return None
        return self.user_sessions[user_id]['data']
    
    def cleanup_session(self, user_id: int):
        """Vyčistí session data po dokončení"""
        if user_id in self.user_sessions:
            del self.user_sessions[user_id]
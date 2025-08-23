"""
OnboardingService - Řídí proces registrace nových uživatelů
"""
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime, timedelta
import json
import re

from sqlalchemy.orm import Session
from app.database.models import User, UserSettings, BUSINESS_CATEGORIES_DATA
from app.database.connection import get_db_session
from app.services.ares_service import AresService

logger = logging.getLogger(__name__)

class OnboardingService:
    """Service pro řízení onboarding procesu nových uživatelů"""
    
    def __init__(self):
        self.ares_service = AresService()
        
        # Definice kroků onboardingu
        self.ONBOARDING_STEPS = [
            'start',
            'name', 
            'ico',
            'dic',
            'business_type',
            'completed'
        ]
        
        # Mapování typů podnikání na uživatelsky přívětivé názvy
        self.BUSINESS_TYPES = {
            'it_programming': 'IT/Programování',
            'graphic_design': 'Grafika/Design', 
            'consulting': 'Konzultace/Poradenství',
            'trades_construction': 'Řemesla/Stavebnictví',
            'e_commerce': 'E-commerce',
            'other': 'Jiné'
        }
    
    async def start_onboarding(self, whatsapp_number: str) -> Dict[str, Any]:
        """Zahájí onboarding proces pro nového uživatele"""
        async with get_db_session() as db:
            try:
                # Zkontroluj jestli už uživatel neexistuje
                existing_user = db.query(User).filter(
                    User.whatsapp_number == whatsapp_number
                ).first()
                
                if existing_user:
                    if existing_user.onboarding_completed:
                        return {
                            "success": False,
                            "message": "Už jste registrovaný! Můžete rovnou posílat účtenky.",
                            "user": existing_user
                        }
                    else:
                        # Pokračuj v nedokončeném onboardingu
                        return await self.continue_onboarding(existing_user, db)
                
                # Vytvoř nového uživatele
                new_user = User(
                    whatsapp_number=whatsapp_number,
                    onboarding_completed=False,
                    onboarding_step='start',
                    onboarding_data={},
                    subscription_status='trial',
                    trial_ends_at=datetime.now() + timedelta(days=7),
                    created_at=datetime.now()
                )
                
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                
                logger.info(f"Started onboarding for user {new_user.id}: {whatsapp_number}")
                
                return {
                    "success": True,
                    "message": self._get_welcome_message(),
                    "user": new_user,
                    "next_step": "name"
                }
                
            except Exception as e:
                db.rollback()
                logger.error(f"Failed to start onboarding for {whatsapp_number}: {str(e)}")
                return {
                    "success": False,
                    "message": "Chyba při zahájení registrace. Zkuste to znovu."
                }
    
    async def process_onboarding_step(self, user: User, message: str, db: Session) -> Dict[str, Any]:
        """Zpracuje jeden krok onboardingu"""
        current_step = user.onboarding_step or 'start'
        
        if current_step == 'start':
            return await self._handle_start_step(user, message, db)
        elif current_step == 'name':
            return await self._handle_name_step(user, message, db)
        elif current_step == 'ico':
            return await self._handle_ico_step(user, message, db)
        elif current_step == 'dic':
            return await self._handle_dic_step(user, message, db)
        elif current_step == 'business_type':
            return await self._handle_business_type_step(user, message, db)
        else:
            return await self._complete_onboarding(user, db)
    
    async def continue_onboarding(self, user: User, db: Session) -> Dict[str, Any]:
        """Pokračuje v nedokončeném onboardingu"""
        current_step = user.onboarding_step or 'start'
        
        if current_step == 'start' or current_step == 'name':
            return {
                "success": True,
                "message": "Dokončme vaši registraci. " + self._get_name_prompt(),
                "next_step": "name"
            }
        elif current_step == 'ico':
            return {
                "success": True,
                "message": f"Pokračujeme v registraci, {user.full_name}. " + self._get_ico_prompt(),
                "next_step": "ico"
            }
        elif current_step == 'dic':
            return {
                "success": True,
                "message": self._get_dic_prompt(),
                "next_step": "dic"
            }
        elif current_step == 'business_type':
            return {
                "success": True,
                "message": self._get_business_type_prompt(),
                "next_step": "business_type"
            }
        else:
            return await self._complete_onboarding(user, db)
    
    async def _handle_start_step(self, user: User, message: str, db: Session) -> Dict[str, Any]:
        """Zpracuje start krok - přechod na zadání jména"""
        user.onboarding_step = 'name'
        db.commit()
        
        return {
            "success": True,
            "message": self._get_name_prompt(),
            "next_step": "name"
        }
    
    async def _handle_name_step(self, user: User, message: str, db: Session) -> Dict[str, Any]:
        """Zpracuje zadání jména"""
        name = message.strip()
        
        if len(name) < 2:
            return {
                "success": False,
                "message": "Zadejte prosím vaše celé jméno (alespoň 2 znaky).",
                "next_step": "name"
            }
        
        # Validace jména (pouze písmena, mezery, pomlčky)
        if not re.match(r'^[a-zA-ZáčďéěíňóřšťůúýžÁČĎÉĚÍŇÓŘŠŤŮÚÝŽ\s\-]+$', name):
            return {
                "success": False,
                "message": "Jméno může obsahovat pouze písmena, mezery a pomlčky.",
                "next_step": "name"
            }
        
        # Uložíme jméno
        user.full_name = name
        user.onboarding_step = 'ico'
        
        # Aktualizuj onboarding_data
        onboarding_data = user.onboarding_data or {}
        onboarding_data['name_completed'] = datetime.now().isoformat()
        user.onboarding_data = onboarding_data
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Děkuji, {name}! " + self._get_ico_prompt(),
            "next_step": "ico"
        }
    
    async def _handle_ico_step(self, user: User, message: str, db: Session) -> Dict[str, Any]:
        """Zpracuje zadání IČO"""
        ico = message.strip().replace(' ', '')
        
        # Validace formátu IČO
        if not re.match(r'^\d{8}$', ico):
            return {
                "success": False,
                "message": "IČO musí mít přesně 8 číslic. Zkuste znovu:",
                "next_step": "ico"
            }
        
        # Validace IČO pomocí ARES
        ares_result = await self.ares_service.validate_ico(ico)
        
        if not ares_result["valid"]:
            return {
                "success": False,
                "message": f"IČO {ico} není platné nebo nebylo nalezeno v registru. Zkuste znovu:",
                "next_step": "ico"
            }
        
        # Uložíme IČO a doplníme informace z ARES
        user.ico = ico
        if ares_result.get("business_name"):
            user.business_name = ares_result["business_name"]
        if ares_result.get("address"):
            address_parts = ares_result["address"]
            user.street = address_parts.get("street")
            user.house_number = address_parts.get("house_number")
            user.city = address_parts.get("city")
            user.postal_code = address_parts.get("postal_code")
        
        user.onboarding_step = 'dic'
        
        # Aktualizuj onboarding_data
        onboarding_data = user.onboarding_data or {}
        onboarding_data['ico_completed'] = datetime.now().isoformat()
        onboarding_data['ares_data'] = ares_result
        user.onboarding_data = onboarding_data
        
        db.commit()
        
        business_info = f" ({ares_result['business_name']})" if ares_result.get('business_name') else ""
        return {
            "success": True,
            "message": f"Super! IČO {ico}{business_info} je platné. " + self._get_dic_prompt(),
            "next_step": "dic"
        }
    
    async def _handle_dic_step(self, user: User, message: str, db: Session) -> Dict[str, Any]:
        """Zpracuje zadání DIČ"""
        dic = message.strip().replace(' ', '').upper()
        
        # Pokud uživatel napsal "nemam" nebo podobně, přeskoč DIČ
        if dic.lower() in ['nemam', 'nemám', 'ne', 'zadne', 'žádné', 'skip']:
            user.dic = None
            user.vat_payer = False
        else:
            # Validace formátu DIČ
            if not re.match(r'^CZ\d{8,10}$', dic):
                return {
                    "success": False,
                    "message": "DIČ musí mít formát CZ12345678 nebo CZ1234567890. Pokud DIČ nemáte, napište 'nemám':",
                    "next_step": "dic"
                }
            
            user.dic = dic
            user.vat_payer = True  # Pokud má DIČ, pravděpodobně je plátce DPH
        
        user.onboarding_step = 'business_type'
        
        # Aktualizuj onboarding_data
        onboarding_data = user.onboarding_data or {}
        onboarding_data['dic_completed'] = datetime.now().isoformat()
        user.onboarding_data = onboarding_data
        
        db.commit()
        
        return {
            "success": True,
            "message": self._get_business_type_prompt(),
            "next_step": "business_type"
        }
    
    async def _handle_business_type_step(self, user: User, message: str, db: Session) -> Dict[str, Any]:
        """Zpracuje výběr typu podnikání"""
        business_choice = message.strip().lower()
        
        # Mapování možných odpovědí na business_type
        choice_mapping = {
            '1': 'it_programming',
            'it': 'it_programming',
            'programování': 'it_programming',
            'programovani': 'it_programming',
            
            '2': 'graphic_design',
            'grafika': 'graphic_design',
            'design': 'graphic_design',
            
            '3': 'consulting',
            'konzultace': 'consulting',
            'poradenství': 'consulting',
            'poradenstvi': 'consulting',
            
            '4': 'trades_construction',
            'řemesla': 'trades_construction',
            'remesla': 'trades_construction',
            'stavba': 'trades_construction',
            'stavebnictví': 'trades_construction',
            'stavebnictvi': 'trades_construction',
            
            '5': 'e_commerce',
            'eshop': 'e_commerce',
            'obchod': 'e_commerce',
            
            '6': 'other',
            'jiné': 'other',
            'jine': 'other',
            'ostatní': 'other',
            'ostatni': 'other'
        }
        
        business_type = choice_mapping.get(business_choice)
        
        if not business_type:
            return {
                "success": False,
                "message": "Nerozumím vaší volbě. " + self._get_business_type_prompt(),
                "next_step": "business_type"
            }
        
        user.business_type = business_type
        user.onboarding_step = 'completed'
        
        # Aktualizuj onboarding_data
        onboarding_data = user.onboarding_data or {}
        onboarding_data['business_type_completed'] = datetime.now().isoformat()
        user.onboarding_data = onboarding_data
        
        db.commit()
        
        return await self._complete_onboarding(user, db)
    
    async def _complete_onboarding(self, user: User, db: Session) -> Dict[str, Any]:
        """Dokončí onboarding a vytvoří UserSettings"""
        try:
            # Označ onboarding jako dokončený
            user.onboarding_completed = True
            user.onboarding_step = 'completed'
            
            # Vytvoř UserSettings s předvyplněnými údaji
            user_settings = UserSettings(
                user_id=user.id,
                full_name=user.full_name,
                ico=user.ico,
                dic=user.dic,
                business_name=user.business_name,
                business_type=user.business_type,
                street=user.street,
                house_number=user.house_number,
                city=user.city,
                postal_code=user.postal_code,
                country=user.country or 'Česká republika',
                vat_payer=user.vat_payer,
                tax_mode='pausalni',  # Výchozí daňový režim
                default_categories=self._get_default_categories(user.business_type)
            )
            
            db.add(user_settings)
            
            # Finální aktualizace onboarding_data
            onboarding_data = user.onboarding_data or {}
            onboarding_data['completed_at'] = datetime.now().isoformat()
            onboarding_data['trial_expires'] = user.trial_ends_at.isoformat() if user.trial_ends_at else None
            user.onboarding_data = onboarding_data
            
            db.commit()
            
            logger.info(f"Completed onboarding for user {user.id}: {user.whatsapp_number}")
            
            business_type_name = self.BUSINESS_TYPES.get(user.business_type, 'Jiné')
            trial_days = 7 if user.trial_ends_at else 0
            
            return {
                "success": True,
                "message": self._get_completion_message(user.full_name, business_type_name, trial_days),
                "user": user,
                "completed": True
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to complete onboarding for user {user.id}: {str(e)}")
            return {
                "success": False,
                "message": "Chyba při dokončování registrace. Zkuste to znovu.",
                "next_step": "business_type"
            }
    
    def _get_default_categories(self, business_type: str) -> Dict[str, Any]:
        """Vrátí výchozí kategorie pro daný typ podnikání"""
        categories = []
        for category in BUSINESS_CATEGORIES_DATA:
            if category['business_type'] == business_type:
                categories.append({
                    'code': category['category_code'],
                    'name': category['category_name'],
                    'is_primary': category['is_primary'],
                    'keywords': category['keywords']
                })
        
        return {
            'business_type': business_type,
            'categories': categories,
            'primary_category': next(
                (cat for cat in categories if cat['is_primary']), 
                categories[0] if categories else None
            )
        }
    
    def _get_welcome_message(self) -> str:
        return """👋 Vítejte v ÚčtoBot!

Jsem váš virtuální účetní asistent. Pomůžu vám s evidencí příjmů a výdajů pro vaše podnikání.

Než začneme, potřebuji si od vás zjistit několik základních údajů pro správné účetní zpracování.

Registrace zabere jen 2-3 minuty. Jdeme na to? 💪"""

    def _get_name_prompt(self) -> str:
        return "📝 Jak se jmenujete? (celé jméno a příjmení)"
    
    def _get_ico_prompt(self) -> str:
        return "🏢 Zadejte prosím vaše IČO (8 číslic):"
    
    def _get_dic_prompt(self) -> str:
        return "💳 Zadejte vaše DIČ (např. CZ12345678) nebo napište 'nemám' pokud DIČ nemáte:"
    
    def _get_business_type_prompt(self) -> str:
        return """💼 Jaký je váš hlavní typ podnikání?

1️⃣ IT/Programování
2️⃣ Grafika/Design  
3️⃣ Konzultace/Poradenství
4️⃣ Řemesla/Stavebnictví
5️⃣ E-commerce
6️⃣ Jiné

Napište číslo nebo název:"""
    
    def _get_completion_message(self, name: str, business_type: str, trial_days: int) -> str:
        return f"""🎉 Skvěle! Registrace dokončena!

✅ Jméno: {name}
✅ Typ podnikání: {business_type}
✅ Zkušební období: {trial_days} dní

🚀 **Nyní můžete začít používat bota:**

📸 **Pošlete foto účtenky** - automaticky zpracuji a zaeviduji
💬 **Napište příjem/výdaj** - např. "příjem 5000 Kč za programování"
📊 **Požádejte o přehled** - "kolik jsem vydal tento měsíc?"

Posílejte první účtenku! 📱"""

    async def get_onboarding_status(self, whatsapp_number: str) -> Optional[Dict[str, Any]]:
        """Vrátí status onboardingu pro daného uživatele"""
        async with get_db_session() as db:
            user = db.query(User).filter(
                User.whatsapp_number == whatsapp_number
            ).first()
            
            if not user:
                return None
                
            return {
                "user_id": user.id,
                "whatsapp_number": user.whatsapp_number,
                "onboarding_completed": user.onboarding_completed,
                "current_step": user.onboarding_step,
                "onboarding_data": user.onboarding_data,
                "full_name": user.full_name,
                "ico": user.ico,
                "dic": user.dic,
                "business_type": user.business_type
            }
    
    async def reset_onboarding(self, user_id: int) -> bool:
        """Resetuje onboarding pro daného uživatele (pouze pro debugging)"""
        async with get_db_session() as db:
            try:
                user = db.query(User).filter(User.id == user_id).first()
                if not user:
                    return False
                
                # Reset onboarding fields
                user.onboarding_completed = False
                user.onboarding_step = 'start'
                user.onboarding_data = {}
                user.full_name = None
                user.business_name = None
                user.ico = None
                user.dic = None
                user.business_type = None
                user.vat_payer = False
                
                # Smaž UserSettings pokud existuje
                settings = db.query(UserSettings).filter(
                    UserSettings.user_id == user_id
                ).first()
                if settings:
                    db.delete(settings)
                
                db.commit()
                return True
                
            except Exception as e:
                db.rollback()
                logger.error(f"Failed to reset onboarding for user {user_id}: {str(e)}")
                return False
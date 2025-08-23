from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import select
from app.database.models import User, UserSettings
from app.database.connection import get_db_session
import logging

logger = logging.getLogger(__name__)

class UserService:
    """Service pro správu uživatelů a jejich nastavení"""
    
    def __init__(self):
        pass
    
    async def get_or_create_user(self, whatsapp_number: str, profile_name: str = None) -> User:
        """Získá existujícího uživatele nebo vytvoří nového"""
        async for db in get_db_session():
            try:
                # Normalizuj WhatsApp číslo
                normalized_number = self._normalize_whatsapp_number(whatsapp_number)
                
                # Pokus o nalezení existujícího uživatele
                stmt = select(User).where(User.whatsapp_number == normalized_number)
                result = await db.execute(stmt)
                user = result.scalar_one_or_none()
                
                if user:
                    # Aktualizuj poslední aktivitu
                    user.last_activity = datetime.now()
                    if profile_name and not user.profile_name:
                        user.profile_name = profile_name
                    await db.commit()
                    logger.info(f"Existující uživatel {user.id} aktualizován")
                    return user
                
                # Vytvoř nového uživatele
                user = User(
                    whatsapp_number=normalized_number,
                    profile_name=profile_name,
                    subscription_status='inactive',  # Nový uživatel nemá placené předplatné
                    trial_ends_at=None,  # Žádný trial
                    onboarding_completed=False
                )
                
                db.add(user)
                await db.commit()
                await db.refresh(user)
                
                logger.info(f"Vytvořen nový uživatel {user.id} s číslem {normalized_number}")
                return user
                
            except SQLAlchemyError as e:
                await db.rollback()
                logger.error(f"Chyba při vytváření/získávání uživatele: {str(e)}")
                raise
    
    async def complete_onboarding(self, user_id: int, onboarding_data: Dict[str, Any]) -> bool:
        """Dokončí onboarding a uloží uživatelská nastavení"""
        async for db in get_db_session():
            try:
                # Najdi uživatele
                stmt = select(User).where(User.id == user_id)
                result = await db.execute(stmt)
                user = result.scalar_one_or_none()
                
                if not user:
                    logger.error(f"Uživatel {user_id} nebyl nalezen")
                    return False
                
                # Aktualizuj uživatele
                user.onboarding_completed = True
                user.onboarding_data = onboarding_data
                user.updated_at = datetime.now()
                
                # Zkontroluj, zda už má nastavení
                settings_stmt = select(UserSettings).where(UserSettings.user_id == user_id)
                settings_result = await db.execute(settings_stmt)
                existing_settings = settings_result.scalar_one_or_none()
                
                if existing_settings:
                    # Aktualizuj existující nastavení
                    self._update_user_settings(existing_settings, onboarding_data)
                    logger.info(f"Aktualizována nastavení pro uživatele {user_id}")
                else:
                    # Vytvoř nová nastavení
                    user_settings = self._create_user_settings(user_id, onboarding_data)
                    db.add(user_settings)
                    logger.info(f"Vytvořena nová nastavení pro uživatele {user_id}")
                
                await db.commit()
                return True
                
            except SQLAlchemyError as e:
                await db.rollback()
                logger.error(f"Chyba při dokončování onboarding: {str(e)}")
                return False
    
    async def check_trial_status(self, user_id: int) -> Dict[str, Any]:
        """Zkontroluje trial status uživatele"""
        async for db in get_db_session():
            try:
                stmt = select(User).where(User.id == user_id)
                result = await db.execute(stmt)
                user = result.scalar_one_or_none()
                
                if not user:
                    return {'status': 'user_not_found', 'active': False}
                
                now = datetime.now()
                
                if user.subscription_status == 'active':
                    # Zkontroluj, zda předplatné nevypršelo
                    if user.subscription_ends_at and user.subscription_ends_at < now:
                        user.subscription_status = 'expired'
                        await db.commit()
                        return {
                            'status': 'expired',
                            'active': False,
                            'subscription_ends_at': user.subscription_ends_at
                        }
                    
                    return {
                        'status': 'active',
                        'active': True,
                        'subscription_ends_at': user.subscription_ends_at
                    }
                
                # Všichny ostatní stavy (inactive, expired, cancelled) = nemá přístup
                return {
                    'status': user.subscription_status,
                    'active': False
                }
                
            except SQLAlchemyError as e:
                logger.error(f"Chyba při kontrole trial status: {str(e)}")
                return {'status': 'error', 'active': False}
    
    async def get_user_settings(self, user_id: int) -> Optional[UserSettings]:
        """Získá nastavení uživatele"""
        async for db in get_db_session():
            try:
                stmt = select(UserSettings).where(UserSettings.user_id == user_id)
                result = await db.execute(stmt)
                return result.scalar_one_or_none()
            except SQLAlchemyError as e:
                logger.error(f"Chyba při získávání nastavení uživatele: {str(e)}")
                return None
    
    async def update_last_activity(self, user_id: int):
        """Aktualizuje poslední aktivitu uživatele"""
        async for db in get_db_session():
            try:
                stmt = select(User).where(User.id == user_id)
                result = await db.execute(stmt)
                user = result.scalar_one_or_none()
                if user:
                    user.last_activity = datetime.now()
                    await db.commit()
            except SQLAlchemyError as e:
                logger.error(f"Chyba při aktualizaci aktivity: {str(e)}")
    
    def _normalize_whatsapp_number(self, number: str) -> str:
        """Normalizuje WhatsApp číslo do standardního formátu"""
        # Odstraň whitespace
        number = number.strip()
        
        # Pokud už má whatsapp: prefix, nech to
        if number.startswith('whatsapp:'):
            return number
        
        # Přidej whatsapp: prefix
        if not number.startswith('+'):
            # Předpokládej české číslo pokud nezačína +
            if len(number) == 9:
                number = f'+420{number}'
            else:
                number = f'+{number}'
        
        return f'whatsapp:{number}'
    
    def _create_user_settings(self, user_id: int, onboarding_data: Dict[str, Any]) -> UserSettings:
        """Vytvoří nová uživatelská nastavení z onboarding dat"""
        # Parsuj celé jméno
        full_name = onboarding_data.get('full_name', '')
        name_parts = full_name.split()
        first_name = name_parts[0] if name_parts else ''
        last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
        
        return UserSettings(
            user_id=user_id,
            full_name=full_name,
            first_name=first_name,
            last_name=last_name,
            ico=onboarding_data.get('ico'),
            dic=onboarding_data.get('dic'),
            company_name=onboarding_data.get('company_name'),
            business_type=onboarding_data.get('business_type'),
            tax_mode=onboarding_data.get('tax_mode'),
            vat_payer=onboarding_data.get('vat_payer', False),
            bank_connection=onboarding_data.get('bank_connection'),
            reminder_settings=onboarding_data.get('reminder_settings'),
            default_categories=onboarding_data.get('default_categories', [])
        )
    
    def _update_user_settings(self, settings: UserSettings, onboarding_data: Dict[str, Any]):
        """Aktualizuje existující nastavení"""
        # Parsuj celé jméno
        if 'full_name' in onboarding_data:
            full_name = onboarding_data['full_name']
            name_parts = full_name.split()
            settings.full_name = full_name
            settings.first_name = name_parts[0] if name_parts else ''
            settings.last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
        
        # Aktualizuj ostatní pole
        fields_to_update = [
            'ico', 'dic', 'company_name', 'business_type', 'tax_mode',
            'vat_payer', 'bank_connection', 'reminder_settings', 'default_categories'
        ]
        
        for field in fields_to_update:
            if field in onboarding_data:
                setattr(settings, field, onboarding_data[field])
        
        settings.updated_at = datetime.now()
    
    async def get_subscription_required_message(self) -> str:
        """Vrátí zprávu pro uživatele bez předplatného"""
        return """🔐 *Předplatné je vyžadováno*

Pro používání ÚčetníBota potřebujete aktivní předplatné.

💳 *299 Kč/měsíc*
✅ Neomezené transakce
✅ Automatické AI kategorizace
✅ DPH výpočty a přehledy
✅ Export do CSV/XML
✅ Připomínky daňových termínů

🔗 **Zakoupit předplatné:**
https://ucetni-bot.cz/subscribe

Napište *info* pro více informací."""

    async def get_subscription_expired_message(self) -> str:
        """Vrátí zprávu pro vypršelé předplatné"""
        return """⏰ *Vaše předplatné vypršelo*

Pro pokračování v používání ÚčetníBota si obnovte předplatné.

💳 *299 Kč/měsíc*
🔗 **Obnovit předplatné:**
https://ucetni-bot.cz/subscribe

Napište *info* pro více informací."""
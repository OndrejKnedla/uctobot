from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Callable
from app.services.user_service import UserService
import logging

logger = logging.getLogger(__name__)

class TrialCheckMiddleware:
    """Middleware pro kontrolu trial statusu před zpracováním transakcí"""
    
    def __init__(self, user_service: UserService):
        self.user_service = user_service
    
    async def check_user_access(self, user_id: int, action_type: str = 'transaction') -> Dict[str, Any]:
        """
        Zkontroluje, zda uživatel má přístup k dané akci
        
        Args:
            user_id: ID uživatele
            action_type: Typ akce (transaction, export, summary)
            
        Returns:
            Dict s výsledkem kontroly
        """
        try:
            trial_status = await self.user_service.check_trial_status(user_id)
            
            # Pokud má aktivní předplatné, povol vše
            if trial_status.get('active', False):
                return {
                    'allowed': True,
                    'status': trial_status['status']
                }
            
            # Pokud nemá přístup
            if trial_status['status'] == 'inactive':
                subscription_message = await self.user_service.get_subscription_required_message()
                return {
                    'allowed': False,
                    'status': 'subscription_required',
                    'block_message': subscription_message
                }
            elif trial_status['status'] == 'expired':
                expired_message = await self.user_service.get_subscription_expired_message()
                return {
                    'allowed': False,
                    'status': 'subscription_expired',
                    'block_message': expired_message
                }
            
            # Jiné stavy (cancelled, error, atd.)
            return {
                'allowed': False,
                'status': trial_status['status'],
                'block_message': "❌ Přístup k této funkci není momentálně dostupný. Kontaktujte podporu."
            }
            
        except Exception as e:
            logger.error(f"Chyba při kontrole přístupu uživatele {user_id}: {str(e)}")
            return {
                'allowed': True,  # V případě chyby povolit access (fail-safe)
                'status': 'error',
                'error': str(e)
            }
    
    async def check_transaction_limits(self, user_id: int) -> Dict[str, Any]:
        """
        Zkontroluje limity pro transakce (budoucí rozšíření)
        Zatím jen wrapper pro check_user_access
        """
        return await self.check_user_access(user_id, 'transaction')
    
    async def check_export_access(self, user_id: int) -> Dict[str, Any]:
        """
        Zkontroluje přístup k exportním funkcím
        """
        return await self.check_user_access(user_id, 'export')
    
    async def check_summary_access(self, user_id: int) -> Dict[str, Any]:
        """
        Zkontroluje přístup k přehledům a reportům
        """
        return await self.check_user_access(user_id, 'summary')
    
    def middleware_decorator(self, action_type: str = 'transaction'):
        """
        Decorator pro automatickou kontrolu přístupu
        
        Usage:
            @trial_middleware.middleware_decorator('transaction')
            async def process_transaction(user_id, message):
                # Funkce se spustí pouze pokud má uživatel přístup
                pass
        """
        def decorator(func: Callable):
            async def wrapper(*args, **kwargs):
                # Extrahuj user_id z argumentů
                user_id = None
                if 'user_id' in kwargs:
                    user_id = kwargs['user_id']
                elif len(args) > 0 and isinstance(args[0], int):
                    user_id = args[0]
                
                if not user_id:
                    logger.error("Nelze najít user_id pro trial check")
                    return await func(*args, **kwargs)
                
                # Proveď kontrolu přístupu
                access_result = await self.check_user_access(user_id, action_type)
                
                if not access_result.get('allowed', False):
                    # Vrať blokační zprávu místo spuštění funkce
                    return access_result.get('block_message', 
                                           "❌ Přístup k této funkci není dostupný.")
                
                # Spusť původní funkci
                result = await func(*args, **kwargs)
                
                # Přidej varování pokud je potřeba
                if access_result.get('status') == 'trial_warning':
                    warning = access_result.get('warning_message', '')
                    if isinstance(result, str):
                        result = f"{result}\n\n{warning}"
                    
                return result
            
            return wrapper
        return decorator
    
    async def get_subscription_info_message(self) -> str:
        """Vrátí informace o předplatném"""
        return """💳 *Předplatné ÚčetníBot*

**Co získáte:**
✅ Neomezené transakce
✅ Automatické AI kategorizace
✅ DPH výpočty a kontrolní hlášení
✅ Export do CSV/XML formátu
✅ Připomínky daňových termínů
✅ Měsíční a kvartální přehledy
✅ Prioritní podpora

**Cena:** 299 Kč/měsíc
**První měsíc:** ZDARMA

🔗 **Objednat:** https://ucetni-bot.cz/subscribe
📧 **Podpora:** podpora@ucetni-bot.cz

*Můžete kdykoli zrušit, bez závazků.*"""
    
    async def handle_subscription_required_action(self, user_id: int, original_message: str) -> str:
        """
        Zpracuje akci uživatele bez předplatného
        """
        if original_message.lower() in ['info', 'informace', 'předplatné', 'predplatne', 'cena']:
            return await self.get_subscription_info_message()
        
        # Pro ostatní zprávy vrať blokační zprávu
        return await self.user_service.get_subscription_required_message()
    
    async def log_blocked_action(self, user_id: int, action_type: str, message: str):
        """
        Loguje blokované akce pro analytics
        """
        logger.info(f"BLOCKED ACTION - User: {user_id}, Action: {action_type}, Message: {message[:50]}...")
        # Zde by bylo možné přidat další analytics/metrics
"""
ActivationService - Bezpečný aktivační systém pro WhatsApp
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, select, func

from app.database.models import User, ActivationLog, is_valid_activation_token, clean_phone_number
from app.database.connection import db_manager

logger = logging.getLogger(__name__)

class ActivationService:
    """Service pro správu bezpečného aktivačního systému"""
    
    def __init__(self):
        self.token_validity_hours = 48
    
    async def create_user_with_activation(self, email: str, plan: str = "monthly") -> Dict[str, Any]:
        """
        Vytvoří nového uživatele s aktivačním tokenem
        Volá se po úspěšné platbě
        """
        try:
            async with db_manager.get_session() as db:
                # Vytvoř nového uživatele
                user = User(
                    email=email,
                    subscription_status="pending",
                    subscription_plan=plan,
                    whatsapp_activated=False,
                    created_at=datetime.now()
                )
                
                # Vygeneruj aktivační token
                activation_token = user.create_activation_token()
                
                db.add(user)
                await db.commit()
                await db.refresh(user)
                
                logger.info(f"Created user with activation token: {user.id}, email: {email}")
                
                return {
                    "success": True,
                    "user_id": user.id,
                    "activation_token": activation_token,
                    "expires_at": user.activation_expires_at.isoformat(),
                    "email": email,
                    "plan": plan
                }
                
        except Exception as e:
            logger.error(f"Failed to create user with activation: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def activate_whatsapp(self, phone_number: str, token: str, ip_address: str = None, user_agent: str = None) -> Dict[str, Any]:
        """
        Aktivuje WhatsApp pro uživatele pomocí tokenu
        """
        # Vyčisti telefonní číslo
        clean_phone = clean_phone_number(phone_number)
        
        try:
            async with db_manager.get_session() as db:
                # Vytvoř log pokus o aktivaci
                activation_log = ActivationLog(
                    phone_number=clean_phone,
                    activation_token=token.lower() if token else None,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    attempted_at=datetime.now()
                )
                
                # Validace formátu tokenu
                if not token or not is_valid_activation_token(token):
                    activation_log.success = False
                    activation_log.error_type = "invalid_format"
                    activation_log.error_message = "Token musí mít přesně 32 hexadecimálních znaků"
                    
                    db.add(activation_log)
                    await db.commit()
                    
                    return {
                        "success": False,
                        "error_type": "invalid_format",
                        "message": """❌ Neplatný aktivační kód.
                        
Aktivační kód musí mít přesně 32 znaků.

Zkontrolujte:
• Správnost kódu (bez mezer)
• Není to náhodou část kódu?

Kód najdete:
📧 V emailu po platbě
🌐 Na webu v sekci "Můj účet\""""
                    }
                
                # Najdi uživatele s tokenem
                result = await db.execute(
                    select(User).where(
                        and_(
                            User.activation_token == token.lower(),
                            User.activation_used == False
                        )
                    )
                )
                user = result.scalar_one_or_none()
                
                if not user:
                    activation_log.success = False
                    activation_log.error_type = "token_not_found"
                    activation_log.error_message = "Token nenalezen nebo již byl použit"
                    
                    db.add(activation_log)
                    await db.commit()
                    
                    return {
                        "success": False,
                        "error_type": "token_not_found", 
                        "message": """❌ Neplatný aktivační kód.

Možné příčiny:
• Kód byl již použit
• Překlep v kódu
• Kód neexistuje

Pomoc:
📧 podpora@ucetnibot.cz
🌐 ucetnibot.cz/kontakt"""
                    }
                
                # Kontrola platnosti tokenu
                if not user.is_activation_valid():
                    activation_log.success = False
                    activation_log.error_type = "token_expired"
                    activation_log.error_message = "Token vypršel"
                    activation_log.user_id = user.id
                    
                    db.add(activation_log)
                    await db.commit()
                    
                    return {
                        "success": False,
                        "error_type": "token_expired",
                        "message": """❌ Aktivační kód vypršel.

Kódy platí 48 hodin od zaplacení.

Řešení:
📧 Kontaktujte podporu s emailem použitým při platbě
📞 Rádi vám vygenerujeme nový kód

Kontakt:
📧 podpora@ucetnibot.cz"""
                    }
                
                # Kontrola jestli už nemá jiné WhatsApp číslo
                if user.whatsapp_activated and user.whatsapp_number and user.whatsapp_number != clean_phone:
                    activation_log.success = False
                    activation_log.error_type = "phone_mismatch"
                    activation_log.error_message = f"Uživatel už má aktivované jiné číslo: {user.whatsapp_number}"
                    activation_log.user_id = user.id
                    
                    db.add(activation_log)
                    await db.commit()
                    
                    return {
                        "success": False,
                        "error_type": "phone_mismatch",
                        "message": f"""❌ Účet je již propojen s jiným číslem.

Aktivní číslo: {user.whatsapp_number}
Pokus o aktivaci: {clean_phone}

Řešení:
📱 Použijte původní číslo
📧 Nebo kontaktujte podporu pro změnu

Kontakt:
📧 podpora@ucetnibot.cz"""
                    }
                
                # AKTIVACE ÚSPĚŠNÁ
                success = user.activate_whatsapp(clean_phone, ip_address)
                
                if success:
                    activation_log.success = True
                    activation_log.user_id = user.id
                    
                    db.add(activation_log)
                    await db.commit()
                    
                    # Určit další krok
                    needs_onboarding = not user.onboarding_completed or not user.full_name
                    
                    if needs_onboarding:
                        # Nastav onboarding
                        user.onboarding_step = "name"
                        user.onboarding_completed = False
                        await db.commit()
                        
                        response_message = f"""✅ Účet aktivován!

🎉 Vítejte v ÚčetníBotu!
💼 Váš plán: {self._get_plan_name(user.subscription_plan)}
📅 Platné do: {user.subscription_ends_at.strftime('%d.%m.%Y') if user.subscription_ends_at else 'N/A'}

Nejdřív se rychle seznámíme.
**Jak se jmenujete?** (celé jméno)"""
                    else:
                        response_message = f"""✅ WhatsApp aktivován!

Vítejte zpět, {user.full_name}!
📱 Číslo propojeno: {clean_phone}

Můžete začít:
📸 Pošlete fotku účtenky
📝 Napište transakci: "benzín 500 Kč"
📊 Požádejte o přehled: "přehled"

💡 Tip: Napište "pomoc" pro všechny příkazy."""
                    
                    return {
                        "success": True,
                        "user_id": user.id,
                        "message": response_message,
                        "needs_onboarding": needs_onboarding,
                        "user_name": user.full_name,
                        "plan": user.subscription_plan
                    }
                else:
                    activation_log.success = False
                    activation_log.error_type = "activation_failed"
                    activation_log.error_message = "Aktivace selhala z neznámého důvodu"
                    activation_log.user_id = user.id
                    
                    db.add(activation_log)
                    await db.commit()
                    
                    return {
                        "success": False,
                        "error_type": "activation_failed",
                        "message": "❌ Aktivace selhala. Kontaktujte podporu."
                    }
                
        except Exception as e:
            logger.error(f"Activation failed for phone {clean_phone}: {str(e)}")
            return {
                "success": False,
                "error_type": "system_error",
                "message": "❌ Systémová chyba při aktivaci. Zkuste to znovu za chvíli."
            }
    
    async def check_user_activation_status(self, phone_number: str) -> Dict[str, Any]:
        """
        Zkontroluje stav aktivace pro telefonní číslo
        """
        clean_phone = clean_phone_number(phone_number)
        
        try:
            async with db_manager.get_session() as db:
                result = await db.execute(
                    select(User).where(
                        User.whatsapp_number == clean_phone,
                        User.whatsapp_activated == True
                    )
                )
                user = result.scalar_one_or_none()
                
                if user:
                    return {
                        "activated": True,
                        "user_id": user.id,
                        "subscription_status": user.subscription_status,
                        "subscription_ends": user.subscription_ends_at.isoformat() if user.subscription_ends_at else None,
                        "needs_onboarding": not user.onboarding_completed
                    }
                else:
                    return {
                        "activated": False,
                        "message": """👋 Vítejte u ÚčetníBota!

Pro používání potřebujete:
1️⃣ Zakoupit předplatné na ucetnibot.cz
2️⃣ Získat aktivační kód (32 znaků)
3️⃣ Poslat kód sem pro aktivaci

💰 Cena: 299 Kč/měsíc
🌐 Web: ucetnibot.cz
📧 Pomoc: podpora@ucetnibot.cz"""
                    }
                    
        except Exception as e:
            logger.error(f"Failed to check activation status for {clean_phone}: {str(e)}")
            return {
                "activated": False,
                "error": str(e)
            }
    
    async def get_activation_stats(self, days: int = 7) -> Dict[str, Any]:
        """
        Získá statistiky aktivací za posledních N dní
        """
        try:
            async with db_manager.get_session() as db:
                since_date = datetime.now() - timedelta(days=days)
                
                # Celkový počet pokusů
                total_attempts_result = await db.execute(
                    select(func.count(ActivationLog.id)).where(
                        ActivationLog.attempted_at >= since_date
                    )
                )
                total_attempts = total_attempts_result.scalar()
                
                # Úspěšné aktivace
                successful_activations_result = await db.execute(
                    select(func.count(ActivationLog.id)).where(
                        and_(
                            ActivationLog.attempted_at >= since_date,
                            ActivationLog.success == True
                        )
                    )
                )
                successful_activations = successful_activations_result.scalar()
                
                # Nejčastější chyby
                error_stats_result = await db.execute(
                    select(
                        ActivationLog.error_type,
                        func.count(ActivationLog.id).label('count')
                    ).where(
                        and_(
                            ActivationLog.attempted_at >= since_date,
                            ActivationLog.success == False
                        )
                    ).group_by(ActivationLog.error_type)
                )
                error_stats = error_stats_result.all()
                
                return {
                    "period_days": days,
                    "total_attempts": total_attempts,
                    "successful_activations": successful_activations,
                    "success_rate": (successful_activations / total_attempts * 100) if total_attempts > 0 else 0,
                    "error_breakdown": {error.error_type: error.count for error in error_stats}
                }
                
        except Exception as e:
            logger.error(f"Failed to get activation stats: {str(e)}")
            return {"error": str(e)}
    
    def _get_plan_name(self, plan: str) -> str:
        """Převede kód plánu na lidsky čitelný název"""
        plans = {
            "monthly": "Měsíční (299 Kč/měsíc)",
            "yearly": "Roční (2990 Kč/rok)"
        }
        return plans.get(plan, plan)
    
    async def regenerate_activation_token(self, user_id: int) -> Dict[str, Any]:
        """
        Vygeneruje nový aktivační token pro uživatele (pouze pro podporu)
        """
        try:
            async with db_manager.get_session() as db:
                result = await db.execute(select(User).where(User.id == user_id))
                user = result.scalar_one_or_none()
                
                if not user:
                    return {"success": False, "error": "Uživatel nenalezen"}
                
                # Vygeneruj nový token
                new_token = user.create_activation_token()
                await db.commit()
                
                logger.info(f"Regenerated activation token for user {user_id}")
                
                return {
                    "success": True,
                    "activation_token": new_token,
                    "expires_at": user.activation_expires_at.isoformat()
                }
                
        except Exception as e:
            logger.error(f"Failed to regenerate token for user {user_id}: {str(e)}")
            return {"success": False, "error": str(e)}
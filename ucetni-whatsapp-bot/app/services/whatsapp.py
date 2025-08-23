"""
WhatsApp integrace přes Twilio
"""
from twilio.rest import Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Inicializace Twilio klienta
twilio_client = None
if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
    try:
        twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        logger.info("✅ Twilio klient inicializován")
    except Exception as e:
        logger.error(f"❌ Chyba při inicializaci Twilio klienta: {e}")

async def send_whatsapp_message(to_number: str, message: str) -> bool:
    """
    Pošle WhatsApp zprávu přes Twilio
    
    Args:
        to_number: Cílové telefonní číslo (ve formátu whatsapp:+420...)
        message: Text zprávy k odeslání
    
    Returns:
        bool: True pokud se zpráva odeslala úspěšně
    """
    if not twilio_client:
        logger.error("❌ Twilio klient není inicializován")
        return False
    
    try:
        # Ujisti se, že číslo má správný formát pro WhatsApp
        if not to_number.startswith("whatsapp:"):
            to_number = f"whatsapp:{to_number}"
        
        from_number = settings.TWILIO_WHATSAPP_NUMBER or "whatsapp:+14155238886"
        
        # Odešli zprávu
        message_obj = twilio_client.messages.create(
            body=message,
            from_=from_number,
            to=to_number
        )
        
        logger.info(f"✅ WhatsApp zpráva odeslána: {message_obj.sid}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Chyba při odesílání WhatsApp zprávy: {e}")
        return False

def format_transaction_message(transaction_data: dict) -> str:
    """
    Formátuje zprávu o nově vytvořené transakci
    
    Args:
        transaction_data: Dict s daty o transakci
    
    Returns:
        str: Naformátovaná zpráva
    """
    amount = transaction_data.get("amount", 0)
    description = transaction_data.get("description", "")
    category = transaction_data.get("category", "")
    transaction_type = transaction_data.get("type", "expense")
    
    # Emoji podle typu transakce
    emoji = "💰" if transaction_type == "income" else "💸"
    type_text = "Příjem" if transaction_type == "income" else "Výdaj"
    
    message = f"✅ {emoji} **{type_text} zpracován!**\n\n"
    message += f"📊 **Částka:** {amount:,.0f} Kč\n"
    message += f"📝 **Popis:** {description}\n"
    
    if category:
        message += f"📂 **Kategorie:** {category}\n"
    
    message += f"📅 **Datum:** {transaction_data.get('created_at', 'dnes')}\n\n"
    
    # Přidej tip
    if transaction_type == "expense":
        message += "💡 **Tip:** Tato transakce je plně odpočitatelná z daní!\n\n"
    else:
        message += "📈 **Skvělé!** Další příjem pro vaše podnikání!\n\n"
    
    message += "_Pro přehled napište 'statistiky' nebo 'přehled'_"
    
    return message

def format_help_message() -> str:
    """Vrátí nápovědu pro uživatele"""
    return """🤖 **ÚčetníBot - Nápověda**

**📝 Jak přidat transakce:**
• Napište: "Koupil jsem notebook 25000"
• Nebo: "Příjem za web 50000"
• Nebo: "Faktura benzín 1200"

**📊 Příkazy:**
• `přehled` - měsíční přehled
• `statistiky` - celkové statistiky  
• `kategorie` - seznam kategorií
• `nápověda` - tato nápověda

**🔧 Podporované formáty:**
• Prostý text s částkou
• Fotka účtenky (v přípravě)
• Strukturovaný popis

💡 **Tip:** Čím více detailů napíšete, tím lépe AI rozpozná kategorii a detaily!

_Potřebujete pomoc? Napište 'podpora'_"""

def format_statistics_message(stats: dict) -> str:
    """
    Formátuje zprávu se statistikami uživatele
    
    Args:
        stats: Dict se statistikami
    
    Returns:
        str: Naformátovaná zpráva
    """
    message = f"📈 **Vaše statistiky**\n\n"
    
    message += f"💰 **Celkové příjmy:** {stats.get('total_income', 0):,.0f} Kč\n"
    message += f"💸 **Celkové výdaje:** {stats.get('total_expenses', 0):,.0f} Kč\n"
    message += f"📊 **Zisk:** {stats.get('profit', 0):,.0f} Kč\n"
    message += f"📋 **Počet transakcí:** {stats.get('total_transactions', 0)}\n\n"
    
    # Aktuální měsíc
    message += f"📅 **Tento měsíc:**\n"
    message += f"• Transakce: {stats.get('current_month_transactions', 0)}\n"
    message += f"• Příjmy: {stats.get('current_month_income', 0):,.0f} Kč\n"
    message += f"• Výdaje: {stats.get('current_month_expenses', 0):,.0f} Kč\n\n"
    
    message += "_Pro detailní přehled navštivte dashboard na webu_"
    
    return message
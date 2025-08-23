from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
import os
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class TwilioClient:
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')
        
        if self.account_sid and self.auth_token:
            try:
                self.client = Client(self.account_sid, self.auth_token)
                logger.info("Twilio klient úspěšně inicializován")
            except Exception as e:
                logger.error(f"Chyba při inicializaci Twilio klienta: {str(e)}")
                self.client = None
        else:
            logger.warning("Twilio credentials nejsou nastavené")
            self.client = None

    async def send_message(self, to_number: str, message: str, media_url: Optional[str] = None) -> bool:
        if not self.client:
            logger.error("Twilio klient není inicializován")
            return False
        
        try:
            if not to_number.startswith('whatsapp:'):
                to_number = f'whatsapp:{to_number}'
            
            message_params = {
                'body': message,
                'from_': self.whatsapp_number,
                'to': to_number
            }
            
            if media_url:
                message_params['media_url'] = [media_url]
            
            message = self.client.messages.create(**message_params)
            
            logger.info(f"Zpráva odeslána: {message.sid} na {to_number}")
            return True
            
        except TwilioRestException as e:
            logger.error(f"Twilio chyba při odesílání zprávy: {e.msg}")
            return False
        except Exception as e:
            logger.error(f"Neočekávaná chyba při odesílání zprávy: {str(e)}")
            return False

    async def send_template_message(self, to_number: str, template_name: str, parameters: Dict[str, Any] = None) -> bool:
        if not self.client:
            logger.error("Twilio klient není inicializován")
            return False
        
        try:
            if not to_number.startswith('whatsapp:'):
                to_number = f'whatsapp:{to_number}'
            
            content_variables = {}
            if parameters:
                for i, (key, value) in enumerate(parameters.items(), 1):
                    content_variables[str(i)] = str(value)
            
            message = self.client.messages.create(
                from_=self.whatsapp_number,
                to=to_number,
                content_sid=template_name,
                content_variables=content_variables if content_variables else None
            )
            
            logger.info(f"Template zpráva odeslána: {message.sid}")
            return True
            
        except TwilioRestException as e:
            logger.error(f"Twilio chyba při odesílání template zprávy: {e.msg}")
            return False
        except Exception as e:
            logger.error(f"Neočekávaná chyba při odesílání template zprávy: {str(e)}")
            return False

    async def validate_webhook_request(self, request_url: str, request_params: dict, signature: str) -> bool:
        if not self.auth_token:
            logger.warning("Auth token není nastavený, webhook validace přeskočena")
            return True
        
        try:
            from twilio.request_validator import RequestValidator
            validator = RequestValidator(self.auth_token)
            
            is_valid = validator.validate(
                request_url,
                request_params,
                signature
            )
            
            if not is_valid:
                logger.warning("Webhook request validace selhala")
            
            return is_valid
            
        except Exception as e:
            logger.error(f"Chyba při validaci webhook requestu: {str(e)}")
            return False

    def get_sandbox_join_message(self) -> str:
        return """📱 *Připojení k WhatsApp botu*

Pro aktivaci bota pošlete zprávu:
*join <your-sandbox-keyword>*

na číslo: *+1 415 523 8886*

Nebo použijte tento link:
wa.me/14155238886?text=join%20<your-sandbox-keyword>

Po připojení můžete začít zadávat transakce!"""

    def format_whatsapp_number(self, phone_number: str) -> str:
        phone_number = phone_number.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        
        if phone_number.startswith('whatsapp:'):
            return phone_number
        
        if not phone_number.startswith('+'):
            if phone_number.startswith('420'):
                phone_number = f'+{phone_number}'
            elif len(phone_number) == 9:
                phone_number = f'+420{phone_number}'
            else:
                phone_number = f'+{phone_number}'
        
        return f'whatsapp:{phone_number}'

    async def get_message_status(self, message_sid: str) -> Optional[str]:
        if not self.client:
            return None
        
        try:
            message = self.client.messages(message_sid).fetch()
            return message.status
        except Exception as e:
            logger.error(f"Chyba při získávání statusu zprávy: {str(e)}")
            return None

    async def send_bulk_messages(self, recipients: list, message: str) -> Dict[str, bool]:
        results = {}
        
        for recipient in recipients:
            success = await self.send_message(recipient, message)
            results[recipient] = success
        
        successful = sum(1 for v in results.values() if v)
        logger.info(f"Hromadné odeslání: {successful}/{len(recipients)} úspěšných")
        
        return results
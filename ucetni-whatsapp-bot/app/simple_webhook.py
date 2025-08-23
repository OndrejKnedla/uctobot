"""
ZJEDNODUŠENÝ WhatsApp webhook pro testování
"""
from fastapi import FastAPI, Request
from fastapi.responses import Response
from twilio.twiml.messaging_response import MessagingResponse

def create_simple_webhook_endpoint(app: FastAPI):
    @app.post("/webhook/whatsapp-simple")
    @app.get("/webhook/whatsapp-simple") 
    async def simple_whatsapp_webhook(request: Request):
        """
        JEDNODUCHÝ WhatsApp webhook pro testování
        """
        try:
            # Získej form data z requestu
            form_data = await request.form()
            
            # Debug - vypiš co přišlo
            print("=" * 50)
            print("SIMPLE WhatsApp Webhook received:")
            print(f"From: {form_data.get('From')}")
            print(f"Body: {form_data.get('Body')}")
            print(f"ProfileName: {form_data.get('ProfileName')}")
            print(f"MessageSid: {form_data.get('MessageSid')}")
            print(f"All data: {dict(form_data)}")
            print("=" * 50)
            
            # Základní údaje z Twilio
            from_number = form_data.get('From', '').replace('whatsapp:', '')
            message_body = form_data.get('Body', '').strip()
            profile_name = form_data.get('ProfileName', 'Uživatel')
            
            # Vytvoř odpověď
            resp = MessagingResponse()
            
            if 'ahoj' in message_body.lower():
                resp.message("Ahoj! Jsem UcetniBot. Test funguje!\n\nPosli mi:\n- Fotku uctenky\n- Text: 'Nakup 500 Kc'\n- 'Pomoc' pro napovedu")
            elif 'pomoc' in message_body.lower():
                resp.message("Jak me pouzivat:\n- Posli fotku uctenky\n- Napis: Nakup 500 Kc\n- Napis: Mesicni prehled\n\nTest verze - funguju!")
            elif 'test' in message_body.lower():
                resp.message("Test uspesny! WhatsApp bot funguje spravne.")
            else:
                resp.message(f"Prijal jsem: {message_body}\nZpracovavam... (test mode)")
            
            print(f"Sending response: {str(resp)}")
            
            return Response(content=str(resp), media_type="application/xml")
            
        except Exception as e:
            print(f"SIMPLE WEBHOOK ERROR: {str(e)}")
            
            # Fallback response
            resp = MessagingResponse()
            resp.message("🤖 ÚčetníBot: Test odpověď - dostávám zprávy!")
            
            return Response(content=str(resp), media_type="application/xml")
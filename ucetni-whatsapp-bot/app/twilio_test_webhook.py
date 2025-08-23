"""
Testovací webhook který aktivně posílá zprávy přes Twilio API
"""
from fastapi import FastAPI, Request, Form
from fastapi.responses import PlainTextResponse
import os
from twilio.rest import Client

def create_twilio_test_webhook(app: FastAPI):
    @app.post("/webhook/twilio-test")
    async def twilio_test_webhook(
        From: str = Form(...),
        Body: str = Form(...),
        To: str = Form(...)
    ):
        """
        Webhook který přímo používá Twilio API k poslání odpovědi
        """
        print(f"=== TWILIO TEST WEBHOOK ===")
        print(f"From: {From}")
        print(f"To: {To}")
        print(f"Body: {Body}")
        
        # Twilio credentials
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        
        if not auth_token:
            print("ERROR: Twilio auth token not found!")
            return PlainTextResponse("OK")
        
        try:
            # Initialize Twilio client
            client = Client(account_sid, auth_token)
            
            # Prepare response message
            response_text = f"Echo: Dostal jsem '{Body}'"
            
            if 'ahoj' in Body.lower():
                response_text = "Ahoj! Twilio test webhook funguje!"
            elif 'test' in Body.lower():
                response_text = "Test OK! Webhook funguje spravne."
            
            # Send WhatsApp message back
            message = client.messages.create(
                from_=To,  # Swap From and To
                to=From,   # Send back to sender
                body=response_text
            )
            
            print(f"Message sent! SID: {message.sid}")
            
        except Exception as e:
            print(f"ERROR sending message: {str(e)}")
        
        # Return empty response (Twilio doesn't need XML if we send via API)
        return PlainTextResponse("OK")

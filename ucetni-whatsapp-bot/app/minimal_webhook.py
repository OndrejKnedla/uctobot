"""
Minimální webhook - pouze loguje a vrací 200 OK
"""
from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse

def create_minimal_webhook(app: FastAPI):
    @app.post("/webhook/minimal")
    @app.get("/webhook/minimal")
    async def minimal_webhook(request: Request):
        """
        Absolutně minimální webhook
        """
        try:
            form_data = await request.form()
            
            print("=" * 50)
            print("MINIMAL WEBHOOK - Received WhatsApp message:")
            print(f"From: {form_data.get('From')}")
            print(f"Body: {form_data.get('Body')}")
            print("=" * 50)
            
            # Vrať pouze 200 OK bez obsahu
            return PlainTextResponse("", status_code=200)
            
        except Exception as e:
            print(f"ERROR: {str(e)}")
            return PlainTextResponse("", status_code=200)
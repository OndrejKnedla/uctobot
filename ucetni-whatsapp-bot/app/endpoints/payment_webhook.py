"""
Payment webhook endpoints for Stripe and Comgate
Handles payment notifications and subscription lifecycle
"""
from fastapi import APIRouter, Request, HTTPException, Form, BackgroundTasks
from fastapi.responses import JSONResponse, HTMLResponse
import logging
from typing import Dict, Any
import json

from app.services.payment_service import payment_service
from app.services.activation_service import ActivationService
from app.database.connection import get_db_session
from app.utils.logging import get_logger, log_user_action
from app.utils.sentry import capture_business_event, capture_api_context
from pydantic import BaseModel

logger = get_logger(__name__)
router = APIRouter(prefix="/webhook/payment", tags=["payment"])
activation_service = ActivationService()

class CreateCheckoutRequest(BaseModel):
    email: str
    plan: str = "monthly"  # monthly or yearly

# NOVÉ ENDPOINTY PRO AKTIVAČNÍ SYSTÉM

@router.post("/create-checkout-session")
async def create_checkout_session(request: CreateCheckoutRequest):
    """
    Vytvoří Stripe checkout session s aktivačním tokenem
    """
    try:
        # Vytvoř uživatele s aktivačním tokenem
        user_result = await activation_service.create_user_with_activation(
            email=request.email,
            plan=request.plan
        )
        
        if not user_result.get('success'):
            raise HTTPException(status_code=400, detail=user_result.get('error', 'Failed to create user'))
        
        # Získej Stripe price ID podle plánu
        price_ids = {
            "monthly": "price_monthly_299czk",  # Nahraď skutečným Stripe Price ID
            "yearly": "price_yearly_2990czk"   # Nahraď skutečným Stripe Price ID
        }
        
        price_id = price_ids.get(request.plan)
        if not price_id:
            raise HTTPException(status_code=400, detail="Invalid plan")
        
        import stripe
        import os
        
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        
        # Vytvoř Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{frontend_url}/aktivace?token={user_result['activation_token']}",
            cancel_url=f"{frontend_url}/zruseno",
            metadata={
                'user_id': str(user_result['user_id']),
                'activation_token': user_result['activation_token'],
                'plan': request.plan
            },
            customer_email=request.email,
            billing_address_collection='required',
            automatic_tax={'enabled': True},
        )
        
        logger.info(
            f"Created checkout session for user {user_result['user_id']}: {session.id}"
        )
        
        return JSONResponse(content={
            "success": True,
            "checkout_url": session.url,
            "session_id": session.id,
            "user_id": user_result['user_id']
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Checkout session creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")

@router.post("/stripe")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Handle Stripe webhook events
    
    Events handled:
    - checkout.session.completed: Initial subscription setup
    - invoice.payment_succeeded: Recurring payment success
    - invoice.payment_failed: Payment failure
    - customer.subscription.deleted: Subscription cancellation
    """
    try:
        # Get raw payload and signature
        payload = await request.body()
        signature = request.headers.get('stripe-signature', '')
        
        if not signature:
            logger.warning("Stripe webhook without signature")
            raise HTTPException(status_code=400, detail="Missing signature")
        
        # Capture API context for monitoring
        capture_api_context(
            method="POST",
            endpoint="/webhook/payment/stripe",
            status_code=200
        )
        
        # Process webhook in background
        background_tasks.add_task(
            process_stripe_webhook,
            payload,
            signature
        )
        
        # Return 200 immediately to Stripe
        return JSONResponse(content={"received": True}, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Stripe webhook processing failed", error=str(e))
        raise HTTPException(status_code=500, detail="Webhook processing failed")

async def process_stripe_webhook(payload: bytes, signature: str):
    """Process Stripe webhook in background task"""
    try:
        import stripe
        import os
        
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
        endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
        
        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, endpoint_secret
            )
        except ValueError:
            logger.error("Invalid Stripe webhook payload")
            return
        except stripe.error.SignatureVerificationError:
            logger.error("Invalid Stripe webhook signature")
            return
        
        # Handle checkout.session.completed event
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            
            # Najdi uživatele podle activation_token
            activation_token = session['metadata'].get('activation_token')
            user_id = session['metadata'].get('user_id')
            
            if user_id and activation_token:
                async with get_db_session() as db:
                    from app.database.models import User
                    from sqlalchemy import select
                    
                    stmt = select(User).where(User.id == int(user_id))
                    result = await db.execute(stmt)
                    user = result.scalar_one_or_none()
                    
                    if user and user.activation_token == activation_token:
                        # Aktivuj předplatné
                        user.subscription_status = "active"
                        user.stripe_customer_id = session['customer']
                        user.stripe_subscription_id = session['subscription']
                        user.subscription_ends_at = datetime.now() + timedelta(days=30)
                        
                        await db.commit()
                        
                        logger.info(f"Activated subscription for user {user_id}")
                        
                        # Pošli email s aktivačním kódem
                        await send_activation_email(
                            user.email,
                            activation_token,
                            user.subscription_plan or 'monthly'
                        )
        
        logger.info("Stripe webhook processed", event_type=event['type'])
        
    except Exception as e:
        logger.error("Background Stripe webhook processing failed", error=str(e))

@router.post("/comgate")
async def comgate_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    merchant: str = Form(...),
    transId: str = Form(...),
    refId: str = Form(...),
    status: str = Form(...),
    price: str = Form(...),
    curr: str = Form(...),
    signature: str = Form(...)
):
    """
    Handle Comgate webhook notifications
    
    Status codes:
    - PAID: Payment successful
    - CANCELLED: Payment cancelled by user
    - TIMEOUT: Payment timeout
    - REFUSED: Payment refused
    """
    try:
        # Prepare form data
        form_data = {
            'merchant': merchant,
            'transId': transId,
            'refId': refId,
            'status': status,
            'price': price,
            'curr': curr,
            'signature': signature
        }
        
        # Capture API context
        capture_api_context(
            method="POST",
            endpoint="/webhook/payment/comgate",
            status_code=200
        )
        
        # Process webhook in background
        background_tasks.add_task(
            process_comgate_webhook,
            form_data
        )
        
        # Comgate expects "OK" response
        return "OK"
        
    except Exception as e:
        logger.error("Comgate webhook processing failed", error=str(e))
        return "ERROR"

async def process_comgate_webhook(form_data: Dict[str, str]):
    """Process Comgate webhook in background task"""
    try:
        result = await payment_service.comgate_service.handle_webhook(form_data)
        
        if result['status'] == 'success':
            # Send WhatsApp notification to user about successful payment
            user_id = result.get('user_id')
            if user_id:
                await send_payment_success_notification(user_id, 'comgate')
                
        logger.info("Comgate webhook processed", result=result)
        
    except Exception as e:
        logger.error("Background Comgate webhook processing failed", error=str(e))

@router.get("/activation-status/{token}")
async def get_activation_status(token: str):
    """Zkontroluje stav aktivačního tokenu"""
    try:
        async with get_db_session() as db:
            from app.database.models import User, is_valid_activation_token
            from sqlalchemy import select, and_
            
            if not is_valid_activation_token(token):
                return JSONResponse(content={
                    "valid": False,
                    "error": "Invalid token format"
                }, status_code=400)
            
            stmt = select(User).where(User.activation_token == token.lower())
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                return JSONResponse(content={
                    "valid": False,
                    "error": "Token not found"
                }, status_code=404)
            
            return JSONResponse(content={
                "valid": user.is_activation_valid(),
                "used": user.activation_used,
                "expires_at": user.activation_expires_at.isoformat() if user.activation_expires_at else None,
                "whatsapp_activated": user.whatsapp_activated,
                "subscription_status": user.subscription_status
            })
            
    except Exception as e:
        logger.error(f"Activation status check failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Status check failed")

@router.get("/success")
async def payment_success(session_id: str = None):
    """Payment success page - redirects to activation page"""
    try:
        capture_api_context(
            method="GET",
            endpoint="/webhook/payment/success"
        )
        
        # Redirect to activation page
        html_content = f"""
        <!DOCTYPE html>
        <html lang="cs">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Platba úspěšná - ÚčetníBot</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    text-align: center;
                    background-color: #f8f9fa;
                }}
                .container {{
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }}
                .success-icon {{
                    font-size: 64px;
                    color: #28a745;
                    margin-bottom: 20px;
                }}
                h1 {{
                    color: #2c3e50;
                    margin-bottom: 20px;
                }}
                p {{
                    color: #6c757d;
                    line-height: 1.6;
                    margin-bottom: 30px;
                }}
                .whatsapp-link {{
                    display: inline-block;
                    background-color: #25d366;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 8px;
                    margin: 10px;
                }}
                .info-box {{
                    background-color: #e3f2fd;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 30px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="success-icon">✅</div>
                <h1>Platba byla úspěšná!</h1>
                <p>
                    Děkujeme za zakoupení předplatného ÚčetníBot.<br>
                    Aktivační kód vám byl odeslán na e-mail.
                </p>
                
                <div class="info-box">
                    <h3>Jak pokračovat:</h3>
                    <ol style="text-align: left;">
                        <li>Zkontrolujte si e-mail (včetně spamu)</li>
                        <li>Najděte 32-znakový aktivační kód</li>
                        <li>Pošlete kód na WhatsApp pro aktivaci</li>
                    </ol>
                </div>
                
                <a href="https://wa.me/420777888999" class="whatsapp-link">
                    📱 Otevřít WhatsApp
                </a>
                
                <div class="info-box">
                    <h3>⚠️ Důležité:</h3>
                    <ul style="text-align: left;">
                        <li>Aktivační kód platí pouze 48 hodin</li>
                        <li>Kód stačí použít jednou</li>
                        <li>Poté už píšete normálně bez kódu</li>
                        <li>Fakturu obdržíte na e-mail do 24 hodin</li>
                    </ul>
                </div>
            </div>
            
            <script>
                // Redirect to WhatsApp after 10 seconds
                setTimeout(function() {{
                    if (confirm('Chcete otevřít WhatsApp a začít používat ÚčetníBot?')) {{
                        window.location.href = 'https://wa.me/14155238886?text=start';
                    }}
                }}, 5000);
            </script>
        </body>
        </html>
        """
        
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        logger.error("Payment success page error", error=str(e))
        return HTMLResponse(content="<h1>Chyba při načítání stránky</h1>", status_code=500)

@router.get("/cancel")
async def payment_cancel():
    """Payment cancellation page"""
    try:
        capture_api_context(
            method="GET",
            endpoint="/webhook/payment/cancel"
        )
        
        html_content = """
        <!DOCTYPE html>
        <html lang="cs">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Platba zrušena - ÚčetníBot</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    text-align: center;
                    background-color: #f8f9fa;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .cancel-icon {
                    font-size: 64px;
                    color: #dc3545;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #2c3e50;
                    margin-bottom: 20px;
                }
                p {
                    color: #6c757d;
                    line-height: 1.6;
                    margin-bottom: 30px;
                }
                .retry-button {
                    display: inline-block;
                    background-color: #007bff;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 8px;
                    margin: 10px;
                }
                .whatsapp-link {
                    display: inline-block;
                    background-color: #25d366;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 8px;
                    margin: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="cancel-icon">❌</div>
                <h1>Platba byla zrušena</h1>
                <p>
                    Nedokončili jste platbu za předplatné ÚčetníBot.<br>
                    Můžete se kdykoliv vrátit a dokončit platbu.
                </p>
                
                <a href="https://wa.me/14155238886?text=platba" class="retry-button">
                    💳 Zkusit znovu
                </a>
                
                <a href="https://wa.me/14155238886?text=pomoc" class="whatsapp-link">
                    💬 Pomoc
                </a>
                
                <p style="font-size: 14px; margin-top: 30px; color: #999;">
                    Pro dokončení platby napište "platba" v WhatsApp
                </p>
            </div>
        </body>
        </html>
        """
        
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        logger.error("Payment cancel page error", error=str(e))
        return HTMLResponse(content="<h1>Chyba při načítání stránky</h1>", status_code=500)

@router.get("/status/{user_id}")
async def payment_status(user_id: int):
    """Get payment status for user (for debugging/admin)"""
    try:
        # This endpoint should be protected in production
        if not is_admin_request():
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        status = await payment_service.get_user_subscription_info(user_id)
        
        capture_api_context(
            method="GET",
            endpoint=f"/webhook/payment/status/{user_id}"
        )
        
        return JSONResponse(content=status)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Payment status check failed", error=str(e), user_id=user_id)
        raise HTTPException(status_code=500, detail="Status check failed")

async def send_payment_success_notification(user_id: int, provider: str):
    """Send WhatsApp notification about successful payment"""
    try:
        # Import here to avoid circular imports
        from app.services.user_service import UserService
        from app.main import _send_whatsapp_message
        
        user_service = UserService()
        
        # Get user data
        async for db in get_db_session():
            from sqlalchemy import select
            from app.database.models import User
            stmt = select(User).where(User.id == user_id)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user or not user.whatsapp_number:
                logger.warning("User not found or missing WhatsApp number", user_id=user_id)
                return
            
            # Prepare success message
            provider_name = "Stripe" if provider == "stripe" else "Comgate"
            message = f"""🎉 *Platba úspěšná!*

✅ Vaše předplatné ÚčetníBot je aktivní
💳 Platební brána: {provider_name}
📅 Platí do: {user.subscription_ends_at.strftime('%d.%m.%Y') if user.subscription_ends_at else 'N/A'}

🚀 *Můžete začít používat všechny funkce:*
• Neomezené transakce
• AI kategorizace výdajů
• Měsíční a kvartální přehledy
• DPH výpočty a reporty
• Export do CSV/XML

📧 Fakturu obdržíte na e-mail do 24 hodin.

Napište libovolnou transakci pro začátek!"""

            # Send notification
            await _send_whatsapp_message(user.whatsapp_number, message)
            
            # Log success
            log_user_action(
                logger,
                user_id=user_id,
                action='payment_notification_sent',
                success=True,
                provider=provider
            )
            
            # Capture business event
            capture_business_event(
                'payment_notification_sent',
                user_id=user_id,
                provider=provider
            )
            
    except Exception as e:
        logger.error("Payment notification failed", error=str(e), user_id=user_id)

async def send_activation_email(email: str, activation_token: str, plan: str):
    """Pošle email s aktivačním kódem"""
    try:
        # Import email service
        from app.services.email_service import EmailService
        
        email_service = EmailService()
        
        whatsapp_number = "+420777888999"  # Vaše WhatsApp číslo
        whatsapp_link = f"https://wa.me/{whatsapp_number.replace('+', '')}?text={activation_token}"
        
        plan_names = {
            "monthly": "Měsíční (299 Kč/měsíc)",
            "yearly": "Roční (2990 Kč/rok)"
        }
        plan_name = plan_names.get(plan, plan)
        
        subject = "🎉 Váš aktivační kód pro ÚčetníBot"
        
        # HTML template
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container {{ max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }}
                .header {{ background: #10b981; color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; background: #f9fafb; }}
                .token-box {{ 
                    background: white; 
                    border: 2px dashed #10b981; 
                    padding: 20px; 
                    margin: 20px 0;
                    text-align: center;
                    border-radius: 8px;
                }}
                .token {{ 
                    font-family: monospace; 
                    font-size: 18px; 
                    color: #1f2937;
                    word-break: break-all;
                    padding: 10px;
                    background: #f3f4f6;
                    border-radius: 4px;
                    letter-spacing: 2px;
                }}
                .button {{
                    display: inline-block;
                    background: #10b981;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 20px 0;
                }}
                .steps {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
                .step {{ margin: 15px 0; }}
                .step-number {{ 
                    display: inline-block;
                    width: 30px;
                    height: 30px;
                    background: #10b981;
                    color: white;
                    border-radius: 50%;
                    text-align: center;
                    line-height: 30px;
                    margin-right: 10px;
                }}
                .warning {{ color: #dc2626; font-weight: bold; }}
                .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Vítejte v ÚčetníBotu!</h1>
                </div>
                
                <div class="content">
                    <p>Dobrý den,</p>
                    
                    <p>děkujeme za zakoupení předplatného <strong>{plan_name}</strong>.</p>
                    
                    <div class="token-box">
                        <h3>Váš aktivační kód:</h3>
                        <div class="token">{activation_token}</div>
                        <p class="warning">
                            ⚠️ Platnost: 48 hodin
                        </p>
                    </div>
                    
                    <div class="steps">
                        <h3>Jak začít:</h3>
                        
                        <div class="step">
                            <span class="step-number">1</span>
                            <strong>Uložte si číslo:</strong> {whatsapp_number}
                        </div>
                        
                        <div class="step">
                            <span class="step-number">2</span>
                            <strong>Pošlete aktivační kód</strong> na WhatsApp
                        </div>
                        
                        <div class="step">
                            <span class="step-number">3</span>
                            <strong>Začněte účtovat!</strong> Pošlete první účtenku
                        </div>
                    </div>
                    
                    <center>
                        <a href="{whatsapp_link}" class="button">
                            Aktivovat na WhatsApp
                        </a>
                    </center>
                    
                    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #92400e; margin: 0;"><strong>Důležité:</strong></p>
                        <ul style="color: #92400e; margin: 10px 0;">
                            <li>Kód stačí poslat jednou</li>
                            <li>Bot si vás zapamatuje podle telefonního čísla</li>
                            <li>Poté už píšete normálně bez kódu</li>
                            <li>První zpráva po aktivaci: vyplníte IČO a základní údaje</li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer">
                    Potřebujete pomoc? 
                    <a href="mailto:podpora@ucetnibot.cz">podpora@ucetnibot.cz</a><br>
                    ÚčetníBot - Vaše chytré účetnictví
                </div>
            </div>
        </body>
        </html>
        """
        
        # Odeslat email
        success = await email_service.send_email(
            to_email=email,
            subject=subject,
            html_content=html_content,
            template_name="activation_email"
        )
        
        if success:
            logger.info(f"Activation email sent successfully to {email}")
        else:
            logger.error(f"Failed to send activation email to {email}")
            
        return success
        
    except Exception as e:
        logger.error(f"Activation email sending failed: {str(e)}")
        return False

def is_admin_request() -> bool:
    """Check if request is from admin (implement your logic)"""
    # TODO: Implement proper admin authentication
    # For now, return False to disable admin endpoints
    return False

# Add the router to your main app
# In app/main.py: app.include_router(payment_webhook.router)
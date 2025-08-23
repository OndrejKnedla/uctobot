import stripe
import os
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from app.database_new import get_db
from app.models import User, Payment, SubscriptionStatus, ActivationToken
from datetime import datetime, timedelta
import secrets
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

router = APIRouter(prefix="/api", tags=["payments"])

# Set Stripe API key
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
if not STRIPE_SECRET_KEY:
    # For debugging
    print("Available env vars:", [k for k in os.environ.keys() if 'STRIPE' in k])
    raise ValueError("STRIPE_SECRET_KEY environment variable is not set")
stripe.api_key = STRIPE_SECRET_KEY

class CheckoutRequest(BaseModel):
    plan: str  # "monthly" nebo "yearly"

@router.post("/create-checkout-session")
async def create_checkout_session(
    request: CheckoutRequest,
    db: Session = Depends(get_db)
):
    """
    Vytvoří Stripe checkout session
    """
    # Ceny v haléřích (Stripe vyžaduje nejmenší jednotku)
    prices = {
        "monthly": {
            "amount": 29900,  # 299 Kč
            "name": "Měsíční plán ÚčetníBot",
            "interval": "month"
        },
        "yearly": {
            "amount": 299000,  # 2990 Kč (249 Kč/měsíc)
            "name": "Roční plán ÚčetníBot",
            "interval": "year"
        }
    }
    
    selected_price = prices.get(request.plan)
    if not selected_price:
        raise HTTPException(status_code=400, detail="Neplatný plán")
    
    try:
        # Vytvoř Stripe checkout session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'czk',
                    'product_data': {
                        'name': selected_price['name'],
                        'description': 'AI účetní asistent přes WhatsApp',
                        'images': ['https://ucetnibot.cz/logo.png'],
                    },
                    'unit_amount': selected_price['amount'],
                    'recurring': {
                        'interval': selected_price['interval'],
                        'interval_count': 1
                    }
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url='http://localhost:3000/platba-uspesna?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:3000',
            metadata={
                'plan': request.plan
            }
        )
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/payment-success")
async def payment_success(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Zpracuje úspěšnou platbu
    """
    try:
        # Získej session z Stripe
        session = stripe.checkout.Session.retrieve(
            session_id,
            expand=['subscription', 'customer']
        )
        
        print(f"DEBUG: Session status: {session.status}, payment_status: {session.payment_status}")
        print(f"DEBUG: Customer: {session.customer}")
        print(f"DEBUG: Subscription: {session.subscription}")
        
        if session.payment_status == 'paid':
            # Zkontroluj, jestli už uživatel neexistuje podle Stripe Customer ID nebo emailu
            customer_id = session.customer.id if hasattr(session.customer, 'id') else session.customer
            customer_email = session.customer.email
            
            existing_user = db.query(User).filter(
                (User.stripe_customer_id == customer_id) | (User.email == customer_email)
            ).first()
            
            if existing_user:
                # Uživatel už existuje, aktualizuj Stripe údaje a vrať aktivační kód
                subscription_id = session.subscription.id if hasattr(session.subscription, 'id') else session.subscription
                existing_user.stripe_customer_id = customer_id
                existing_user.stripe_subscription_id = subscription_id
                existing_user.subscription_status = SubscriptionStatus.ACTIVE
                existing_user.subscription_plan = session.metadata.get('plan')
                existing_user.subscription_until = datetime.utcnow() + timedelta(days=30 if session.metadata.get('plan') == 'monthly' else 365)
                
                # Vygeneruj vždy nový aktivační token při každé platbě
                new_token = secrets.token_hex(16)
                expires_at = datetime.utcnow() + timedelta(hours=48)
                
                # Ulož do nové tabulky pro historii
                activation_token = ActivationToken(
                    user_id=existing_user.id,
                    token=new_token,
                    expires_at=expires_at,
                    created_from="stripe_payment",
                    stripe_session_id=session.id
                )
                db.add(activation_token)
                
                # Aktualizuj současný token v uživateli (pro backward compatibility)
                existing_user.activation_token = new_token
                existing_user.activation_created_at = datetime.utcnow()
                existing_user.activation_expires_at = expires_at
                existing_user.activation_used = False  # Resetuj použití tokenu
                existing_user.activation_used_at = None
                
                try:
                    db.commit()
                except Exception as db_error:
                    db.rollback()
                    print(f"ERROR: Database error updating existing user: {str(db_error)}")
                    raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
                
                return {
                    "success": True,
                    "activation_token": existing_user.activation_token,
                    "whatsapp_number": os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886"),
                    "user_email": existing_user.email,
                    "expires_at": existing_user.activation_expires_at
                }
            
            # Vytvoř nového uživatele
            new_token = secrets.token_hex(16)
            expires_at = datetime.utcnow() + timedelta(hours=48)
            
            subscription_id = session.subscription.id if hasattr(session.subscription, 'id') else session.subscription
            
            user = User(
                email=session.customer.email,
                subscription_status=SubscriptionStatus.ACTIVE,
                subscription_plan=session.metadata.get('plan'),
                stripe_customer_id=customer_id,
                stripe_subscription_id=subscription_id,
                activation_token=new_token,
                activation_created_at=datetime.utcnow(),
                activation_expires_at=expires_at,
                subscription_until=datetime.utcnow() + timedelta(days=30 if session.metadata.get('plan') == 'monthly' else 365),
                trial_transactions_used=0,
                trial_transactions_limit=10,
                default_vat_rate=21,
                tax_type='60_40'
            )
            
            try:
                db.add(user)
                db.commit()
                
                # Ulož token do historie
                activation_token_record = ActivationToken(
                    user_id=user.id,
                    token=new_token,
                    expires_at=expires_at,
                    created_from="stripe_payment",
                    stripe_session_id=session.id
                )
                db.add(activation_token_record)
                db.commit()
                
                # Ulož platbu
                payment = Payment(
                    user_id=user.id,
                    amount=session.amount_total / 100,  # Převeď z haléřů
                    currency='CZK',
                    payment_method='card',
                    stripe_payment_intent_id=session.payment_intent,
                    status='completed',
                    paid_at=datetime.utcnow()
                )
                
                db.add(payment)
                db.commit()
            except Exception as db_error:
                db.rollback()
                print(f"ERROR: Database error: {str(db_error)}")
                raise HTTPException(status_code=500, detail=f"Database error: {str(db_error)}")
            
            return {
                "success": True,
                "activation_token": new_token,
                "whatsapp_number": os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886"),
                "user_email": user.email,
                "expires_at": user.activation_expires_at
            }
        else:
            return {"success": False, "error": "Platba nebyla dokončena"}
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Stripe webhook pro recurring payments
    """
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    if not endpoint_secret:
        # Pro development - přijmi webhook bez ověření podpisu
        import json
        event = json.loads(payload)
    else:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Zpracuj různé eventy
    if event['type'] == 'invoice.payment_succeeded':
        # Prodluž předplatné
        invoice = event['data']['object']
        customer_id = invoice['customer']
        
        user = db.query(User).filter(
            User.stripe_customer_id == customer_id
        ).first()
        
        if user:
            # Prodluž předplatné
            if user.subscription_plan == 'monthly':
                user.subscription_until = datetime.utcnow() + timedelta(days=30)
            else:
                user.subscription_until = datetime.utcnow() + timedelta(days=365)
            
            # Ulož platbu
            payment = Payment(
                user_id=user.id,
                amount=invoice['amount_paid'] / 100,
                currency='CZK',
                payment_method='card',
                stripe_payment_intent_id=invoice['payment_intent'],
                status='completed',
                paid_at=datetime.utcnow()
            )
            
            db.add(payment)
            db.commit()
            
    elif event['type'] == 'customer.subscription.deleted':
        # Zruš předplatné
        subscription = event['data']['object']
        customer_id = subscription['customer']
        
        user = db.query(User).filter(
            User.stripe_customer_id == customer_id
        ).first()
        
        if user:
            user.subscription_status = 'cancelled'
            db.commit()
    
    return {"status": "success"}
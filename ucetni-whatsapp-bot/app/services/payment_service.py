"""
Payment Gateway Integration Service for ÚčetníBot
Supports Stripe and Comgate payment processors
"""
import os
import json
import hashlib
import hmac
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from decimal import Decimal
from dataclasses import dataclass
import httpx
import stripe
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db_session
from app.database.models import User, Payment, Invoice
from app.utils.logging import get_logger, log_user_action
from app.utils.sentry import capture_business_event
import logging

logger = get_logger(__name__)

@dataclass
class PaymentRequest:
    """Payment request data structure"""
    amount: Decimal
    currency: str
    description: str
    customer_email: str
    customer_name: str
    user_id: int
    subscription_type: str = "monthly"
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None

@dataclass
class PaymentResult:
    """Payment processing result"""
    success: bool
    payment_id: Optional[str] = None
    payment_url: Optional[str] = None
    error_message: Optional[str] = None
    webhook_secret: Optional[str] = None

class StripePaymentService:
    """Stripe payment processor implementation"""
    
    def __init__(self):
        self.api_key = os.getenv('STRIPE_SECRET_KEY')
        self.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
        self.price_id = os.getenv('STRIPE_PRICE_ID')  # Monthly subscription price
        
        if self.api_key:
            stripe.api_key = self.api_key
        
        # Czech pricing
        self.pricing = {
            'monthly': {
                'amount': 29900,  # 299 CZK in haléře
                'currency': 'czk',
                'interval': 'month'
            }
        }
    
    async def create_subscription(self, request: PaymentRequest) -> PaymentResult:
        """Create recurring subscription via Stripe"""
        try:
            if not self.api_key:
                return PaymentResult(
                    success=False, 
                    error_message="Stripe API key not configured"
                )
            
            # Create or get customer
            customer = await self._get_or_create_customer(
                email=request.customer_email,
                name=request.customer_name,
                user_id=request.user_id
            )
            
            # Create checkout session for subscription
            checkout_session = stripe.checkout.Session.create(
                customer=customer.id,
                payment_method_types=['card'],
                line_items=[{
                    'price': self.price_id or await self._get_or_create_price(),
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=request.success_url or f"{os.getenv('WEBHOOK_URL', '')}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=request.cancel_url or f"{os.getenv('WEBHOOK_URL', '')}/payment/cancel",
                client_reference_id=str(request.user_id),
                metadata={
                    'user_id': str(request.user_id),
                    'subscription_type': request.subscription_type,
                    'service': 'ucetni-whatsapp-bot'
                },
                locale='cs',
                billing_address_collection='required',
                tax_id_collection={'enabled': True},
                invoice_creation={'enabled': True},
                subscription_data={
                    'trial_period_days': 7,  # 7-day free trial
                    'metadata': {
                        'user_id': str(request.user_id),
                        'service': 'ucetni-whatsapp-bot'
                    }
                }
            )
            
            # Save payment record
            await self._save_payment_record(
                user_id=request.user_id,
                payment_id=checkout_session.id,
                amount=request.amount,
                currency=request.currency,
                provider="stripe",
                status="pending",
                payment_metadata={
                    'customer_id': customer.id,
                    'checkout_session_id': checkout_session.id
                }
            )
            
            logger.info("Stripe checkout session created", 
                       user_id=request.user_id,
                       session_id=checkout_session.id,
                       amount=float(request.amount))
            
            return PaymentResult(
                success=True,
                payment_id=checkout_session.id,
                payment_url=checkout_session.url
            )
            
        except stripe.error.StripeError as e:
            logger.error("Stripe error", error=str(e), user_id=request.user_id)
            return PaymentResult(success=False, error_message=str(e))
        except Exception as e:
            logger.error("Payment creation failed", error=str(e), user_id=request.user_id)
            return PaymentResult(success=False, error_message=str(e))
    
    async def _get_or_create_customer(self, email: str, name: str, user_id: int) -> stripe.Customer:
        """Get existing or create new Stripe customer"""
        try:
            # Try to find existing customer by email
            customers = stripe.Customer.list(email=email, limit=1)
            if customers.data:
                return customers.data[0]
            
            # Create new customer
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={
                    'user_id': str(user_id),
                    'service': 'ucetni-whatsapp-bot'
                }
            )
            
            logger.info("Stripe customer created", 
                       user_id=user_id,
                       customer_id=customer.id,
                       email=email)
            
            return customer
            
        except Exception as e:
            logger.error("Customer creation failed", error=str(e), user_id=user_id)
            raise
    
    async def _get_or_create_price(self) -> str:
        """Get or create Stripe price for monthly subscription"""
        try:
            # Create price if not exists
            price = stripe.Price.create(
                unit_amount=self.pricing['monthly']['amount'],
                currency=self.pricing['monthly']['currency'],
                recurring={'interval': self.pricing['monthly']['interval']},
                product_data={
                    'name': 'ÚčetníBot - Měsíční předplatné',
                    'description': 'Český WhatsApp asistent pro účetnictví OSVČ'
                },
                metadata={
                    'service': 'ucetni-whatsapp-bot',
                    'type': 'monthly_subscription'
                }
            )
            return price.id
        except Exception as e:
            logger.error("Price creation failed", error=str(e))
            raise
    
    async def handle_webhook(self, payload: bytes, signature: str) -> Dict[str, Any]:
        """Process Stripe webhook events"""
        try:
            if not self.webhook_secret:
                raise ValueError("Stripe webhook secret not configured")
            
            # Verify webhook signature
            event = stripe.Webhook.construct_event(
                payload, signature, self.webhook_secret
            )
            
            event_type = event['type']
            event_data = event['data']['object']
            
            logger.info("Stripe webhook received", 
                       event_type=event_type,
                       event_id=event['id'])
            
            # Handle different event types
            if event_type == 'checkout.session.completed':
                return await self._handle_checkout_completed(event_data)
            elif event_type == 'invoice.payment_succeeded':
                return await self._handle_payment_succeeded(event_data)
            elif event_type == 'invoice.payment_failed':
                return await self._handle_payment_failed(event_data)
            elif event_type == 'customer.subscription.deleted':
                return await self._handle_subscription_cancelled(event_data)
            else:
                logger.info("Unhandled webhook event", event_type=event_type)
                return {'status': 'ignored', 'event_type': event_type}
                
        except stripe.error.SignatureVerificationError as e:
            logger.error("Webhook signature verification failed", error=str(e))
            return {'status': 'error', 'message': 'Invalid signature'}
        except Exception as e:
            logger.error("Webhook processing failed", error=str(e))
            return {'status': 'error', 'message': str(e)}
    
    async def _handle_checkout_completed(self, session) -> Dict[str, Any]:
        """Handle successful checkout session completion"""
        try:
            user_id = int(session.get('client_reference_id') or session['metadata']['user_id'])
            subscription_id = session.get('subscription')
            customer_id = session['customer']
            
            # Update payment record
            async for db in get_db_session():
                stmt = update(Payment).where(
                    Payment.payment_id == session['id']
                ).values(
                    status='completed',
                    stripe_subscription_id=subscription_id,
                    stripe_customer_id=customer_id,
                    completed_at=datetime.now()
                )
                await db.execute(stmt)
                
                # Activate user subscription
                user_stmt = update(User).where(User.id == user_id).values(
                    subscription_status='active',
                    subscription_ends_at=datetime.now() + timedelta(days=30),
                    stripe_customer_id=customer_id,
                    stripe_subscription_id=subscription_id,
                    updated_at=datetime.now()
                )
                await db.execute(user_stmt)
                await db.commit()
            
            # Log business event
            capture_business_event(
                'subscription_activated',
                user_id=user_id,
                subscription_id=subscription_id,
                payment_method='stripe'
            )
            
            log_user_action(
                logger,
                user_id=user_id,
                action='subscription_activated',
                success=True
            )
            
            logger.info("Subscription activated", 
                       user_id=user_id,
                       subscription_id=subscription_id)
            
            return {
                'status': 'success',
                'user_id': user_id,
                'subscription_id': subscription_id
            }
            
        except Exception as e:
            logger.error("Checkout completion handling failed", error=str(e))
            return {'status': 'error', 'message': str(e)}
    
    async def _handle_payment_succeeded(self, invoice) -> Dict[str, Any]:
        """Handle successful recurring payment"""
        try:
            subscription_id = invoice['subscription']
            customer_id = invoice['customer']
            amount = invoice['amount_paid']
            
            # Get user by subscription
            async for db in get_db_session():
                user_stmt = select(User).where(User.stripe_subscription_id == subscription_id)
                result = await db.execute(user_stmt)
                user = result.scalar_one_or_none()
                
                if not user:
                    logger.warning("User not found for subscription", subscription_id=subscription_id)
                    return {'status': 'error', 'message': 'User not found'}
                
                # Extend subscription
                user_stmt = update(User).where(User.id == user.id).values(
                    subscription_status='active',
                    subscription_ends_at=user.subscription_ends_at + timedelta(days=30) if user.subscription_ends_at else datetime.now() + timedelta(days=30),
                    updated_at=datetime.now()
                )
                await db.execute(user_stmt)
                
                # Create payment record
                payment = Payment(
                    user_id=user.id,
                    amount=Decimal(amount) / 100,  # Convert from cents
                    currency='czk',
                    status='completed',
                    payment_id=invoice['id'],
                    provider='stripe',
                    stripe_subscription_id=subscription_id,
                    stripe_customer_id=customer_id,
                    completed_at=datetime.now(),
                    payment_metadata={'invoice_id': invoice['id']}
                )
                db.add(payment)
                
                await db.commit()
            
            logger.info("Recurring payment processed", 
                       user_id=user.id,
                       amount=amount/100,
                       subscription_id=subscription_id)
            
            # Generate invoice
            try:
                from app.services.invoice_service import invoice_service
                await invoice_service.process_payment_invoice(user.id, payment, invoice)
            except Exception as e:
                logger.error("Invoice generation failed", error=str(e), user_id=user.id)
            
            return {
                'status': 'success',
                'user_id': user.id,
                'amount': amount/100
            }
            
        except Exception as e:
            logger.error("Payment success handling failed", error=str(e))
            return {'status': 'error', 'message': str(e)}
    
    async def _save_payment_record(self, user_id: int, payment_id: str, amount: Decimal, 
                                  currency: str, provider: str, status: str, payment_metadata: Dict = None):
        """Save payment record to database"""
        async for db in get_db_session():
            payment = Payment(
                user_id=user_id,
                payment_id=payment_id,
                amount=amount,
                currency=currency,
                status=status,
                provider=provider,
                payment_metadata=payment_metadata or {}
            )
            db.add(payment)
            await db.commit()

class ComgatePaymentService:
    """Comgate payment processor implementation (Czech payment gateway)"""
    
    def __init__(self):
        self.merchant_id = os.getenv('COMGATE_MERCHANT_ID')
        self.secret = os.getenv('COMGATE_SECRET')
        self.test_mode = os.getenv('ENVIRONMENT', 'development') != 'production'
        self.api_url = 'https://payments.comgate.cz/v1.0' if not self.test_mode else 'https://payments.comgate.cz/v1.0'
    
    async def create_payment(self, request: PaymentRequest) -> PaymentResult:
        """Create one-time payment via Comgate"""
        try:
            if not self.merchant_id or not self.secret:
                return PaymentResult(
                    success=False,
                    error_message="Comgate credentials not configured"
                )
            
            # Generate unique transaction ID
            transaction_id = f"UCT{request.user_id}_{int(datetime.now().timestamp())}"
            
            # Prepare payment data
            payment_data = {
                'merchant': self.merchant_id,
                'price': int(request.amount * 100),  # Convert to haléře
                'curr': request.currency.upper(),
                'label': request.description,
                'refId': transaction_id,
                'email': request.customer_email,
                'method': 'ALL',  # All payment methods
                'account': '',
                'phone': '',
                'name': request.customer_name,
                'lang': 'cs',
                'prepareOnly': 'true',
                'verification': 'true',
                'embedded': 'false',
                'applePayEnabled': 'true',
                'googlePayEnabled': 'true'
            }
            
            # Add signature
            payment_data['signature'] = self._generate_signature(payment_data)
            
            # Make API request
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_url}/create",
                    data=payment_data,
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.error("Comgate API error", status_code=response.status_code, response=response.text)
                    return PaymentResult(
                        success=False,
                        error_message=f"API error: {response.status_code}"
                    )
                
                result = response.json()
                
                if result.get('code') != 0:
                    return PaymentResult(
                        success=False,
                        error_message=result.get('message', 'Unknown error')
                    )
                
                # Save payment record
                await self._save_payment_record(
                    user_id=request.user_id,
                    payment_id=transaction_id,
                    amount=request.amount,
                    currency=request.currency,
                    provider="comgate",
                    status="pending",
                    metadata={
                        'comgate_transaction_id': result.get('transId'),
                        'redirect_url': result.get('redirect')
                    }
                )
                
                logger.info("Comgate payment created", 
                           user_id=request.user_id,
                           transaction_id=transaction_id,
                           comgate_trans_id=result.get('transId'))
                
                return PaymentResult(
                    success=True,
                    payment_id=transaction_id,
                    payment_url=result.get('redirect')
                )
                
        except Exception as e:
            logger.error("Comgate payment creation failed", error=str(e), user_id=request.user_id)
            return PaymentResult(success=False, error_message=str(e))
    
    def _generate_signature(self, data: Dict[str, Any]) -> str:
        """Generate Comgate API signature"""
        # Create signature string from specific fields
        signature_fields = ['merchant', 'price', 'curr', 'refId', 'method']
        signature_string = ''.join([str(data.get(field, '')) for field in signature_fields])
        signature_string += self.secret
        
        return hashlib.sha256(signature_string.encode('utf-8')).hexdigest()
    
    async def handle_webhook(self, form_data: Dict[str, str]) -> Dict[str, Any]:
        """Process Comgate webhook notification"""
        try:
            # Verify signature
            if not self._verify_webhook_signature(form_data):
                return {'status': 'error', 'message': 'Invalid signature'}
            
            transaction_id = form_data.get('refId')
            status = form_data.get('status')
            trans_id = form_data.get('transId')
            
            logger.info("Comgate webhook received",
                       transaction_id=transaction_id,
                       status=status,
                       trans_id=trans_id)
            
            if status == 'PAID':
                return await self._handle_payment_success(transaction_id, trans_id, form_data)
            elif status in ['CANCELLED', 'TIMEOUT']:
                return await self._handle_payment_cancelled(transaction_id, status)
            
            return {'status': 'ignored', 'transaction_status': status}
            
        except Exception as e:
            logger.error("Comgate webhook processing failed", error=str(e))
            return {'status': 'error', 'message': str(e)}
    
    def _verify_webhook_signature(self, data: Dict[str, str]) -> bool:
        """Verify Comgate webhook signature"""
        try:
            received_signature = data.get('signature', '')
            
            # Create signature string
            signature_fields = ['transId', 'refId', 'status', 'price']
            signature_string = ''.join([data.get(field, '') for field in signature_fields])
            signature_string += self.secret
            
            calculated_signature = hashlib.sha256(signature_string.encode('utf-8')).hexdigest()
            
            return hmac.compare_digest(received_signature.lower(), calculated_signature.lower())
            
        except Exception as e:
            logger.error("Signature verification failed", error=str(e))
            return False

class PaymentService:
    """Main payment service orchestrator"""
    
    def __init__(self):
        self.stripe_service = StripePaymentService()
        self.comgate_service = ComgatePaymentService()
        self.default_provider = os.getenv('PAYMENT_PROVIDER', 'stripe').lower()
    
    async def create_subscription_payment(self, user_id: int, customer_email: str, 
                                        customer_name: str, provider: str = None) -> PaymentResult:
        """Create subscription payment link"""
        provider = provider or self.default_provider
        
        request = PaymentRequest(
            amount=Decimal('299.00'),  # 299 CZK
            currency='czk',
            description='ÚčetníBot - Měsíční předplatné',
            customer_email=customer_email,
            customer_name=customer_name,
            user_id=user_id,
            subscription_type='monthly'
        )
        
        if provider == 'stripe':
            return await self.stripe_service.create_subscription(request)
        elif provider == 'comgate':
            return await self.comgate_service.create_payment(request)
        else:
            return PaymentResult(success=False, error_message=f"Unknown provider: {provider}")
    
    async def get_user_subscription_info(self, user_id: int) -> Dict[str, Any]:
        """Get user's subscription information"""
        async for db in get_db_session():
            user_stmt = select(User).where(User.id == user_id)
            result = await db.execute(user_stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                return {'status': 'user_not_found'}
            
            # Get recent payments
            payments_stmt = (
                select(Payment)
                .where(Payment.user_id == user_id)
                .order_by(Payment.created_at.desc())
                .limit(5)
            )
            payments_result = await db.execute(payments_stmt)
            payments = payments_result.scalars().all()
            
            return {
                'status': 'success',
                'subscription_status': user.subscription_status,
                'subscription_ends_at': user.subscription_ends_at.isoformat() if user.subscription_ends_at else None,
                'stripe_customer_id': user.stripe_customer_id,
                'stripe_subscription_id': user.stripe_subscription_id,
                'recent_payments': [
                    {
                        'id': p.id,
                        'amount': float(p.amount),
                        'currency': p.currency,
                        'status': p.status,
                        'provider': p.provider,
                        'created_at': p.created_at.isoformat(),
                        'completed_at': p.completed_at.isoformat() if p.completed_at else None
                    }
                    for p in payments
                ]
            }

# Global payment service instance
payment_service = PaymentService()
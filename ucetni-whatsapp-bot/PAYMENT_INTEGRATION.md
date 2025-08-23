# 💳 Payment Integration - ÚčetníBot

## 📋 Overview
Complete payment gateway integration with Stripe and Comgate for ÚčetníBot, including recurring subscriptions, webhook processing, and automatic invoice generation.

## 🏗️ Architecture

### Payment Flow
```
User --> WhatsApp --> /platba command --> PaymentService --> Stripe/Comgate --> Webhook --> SubscriptionActivation --> InvoiceGeneration --> EmailDelivery
```

### Components
- **PaymentService**: Main orchestrator for payment operations
- **StripePaymentService**: Stripe integration with subscriptions
- **ComgatePaymentService**: Czech payment gateway integration
- **InvoiceService**: Automatic invoice generation and email delivery
- **Payment Webhooks**: Handle payment notifications and lifecycle events

## 💰 Pricing Model

### Current Pricing
- **Monthly Subscription**: 299 CZK/month
- **Free Trial**: 7 days (Stripe) or immediate payment (Comgate)
- **Currency**: Czech Koruna (CZK)

### Payment Providers
1. **Stripe** (Primary)
   - International cards
   - Recurring subscriptions
   - 7-day free trial
   - Automatic invoice generation

2. **Comgate** (Czech Alternative)
   - Czech bank transfers
   - Local payment methods
   - One-time payments
   - Manual subscription management

## 🚀 User Payment Flow

### 1. Payment Request
User types **"platba"** in WhatsApp:
```
💳 Aktivace předplatného ÚčetníBot

**Cena:** 299 Kč/měsíc
**První týden:** ZDARMA (zkušební období)

✅ Co získáte:
• Neomezené transakce
• AI kategorizace výdajů  
• Měsíční a kvartální přehledy
• DPH výpočty a reporty
• Export do CSV/XML
• Automatické faktury

🔗 Klikněte pro platbu:
https://checkout.stripe.com/...

💡 Platba je zabezpečena přes Stripe.
```

### 2. Payment Processing
- User clicks payment link
- Redirected to Stripe Checkout
- Completes payment with card
- Redirected to success page

### 3. Webhook Processing
- Stripe sends webhook notification
- Payment status updated in database
- User subscription activated
- WhatsApp notification sent

### 4. Invoice Generation
- Automatic invoice creation
- PDF generation with Czech formatting
- Email delivery to customer
- Invoice stored in database

## 🔧 Technical Implementation

### Database Schema

#### Payments Table
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    payment_id VARCHAR(200) NOT NULL,  -- Stripe/Comgate ID
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'czk',
    status VARCHAR(20) NOT NULL,  -- pending, completed, failed
    provider VARCHAR(20) NOT NULL,  -- stripe, comgate
    -- Provider specific fields
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    comgate_transaction_id VARCHAR(100),
    metadata JSON,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

#### Invoices Table
```sql
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    payment_id INTEGER REFERENCES payments(id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    amount_without_vat DECIMAL(12,2) NOT NULL,
    vat_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    customer_email VARCHAR(200),
    status VARCHAR(20) DEFAULT 'generated',
    pdf_path VARCHAR(500),
    email_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

#### Webhook Endpoints
- `POST /webhook/payment/stripe` - Stripe webhook events
- `POST /webhook/payment/comgate` - Comgate notifications
- `GET /webhook/payment/success` - Payment success page
- `GET /webhook/payment/cancel` - Payment cancellation page

#### Admin Endpoints
- `GET /webhook/payment/status/{user_id}` - Payment status (protected)

### Environment Variables

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
PAYMENT_PROVIDER=stripe

# Comgate Configuration
COMGATE_MERCHANT_ID=12345
COMGATE_SECRET=your_secret

# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@ucetni-bot.cz
FROM_NAME=ÚčetníBot
```

## 🔄 Stripe Integration

### Subscription Setup
```python
# Create subscription with 7-day trial
checkout_session = stripe.checkout.Session.create(
    customer=customer.id,
    payment_method_types=['card'],
    line_items=[{
        'price': price_id,
        'quantity': 1,
    }],
    mode='subscription',
    subscription_data={
        'trial_period_days': 7,
        'metadata': {
            'user_id': str(user_id),
            'service': 'ucetni-whatsapp-bot'
        }
    },
    success_url=f"{base_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
    cancel_url=f"{base_url}/payment/cancel"
)
```

### Webhook Events Handled
- `checkout.session.completed` - Initial subscription setup
- `invoice.payment_succeeded` - Recurring payment success  
- `invoice.payment_failed` - Payment failure
- `customer.subscription.deleted` - Subscription cancellation

### Webhook Processing
```python
@router.post("/stripe")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.body()
    signature = request.headers.get('stripe-signature')
    
    # Process in background to return 200 immediately
    background_tasks.add_task(process_stripe_webhook, payload, signature)
    
    return JSONResponse(content={"received": True}, status_code=200)
```

## 🏦 Comgate Integration

### Payment Creation
```python
payment_data = {
    'merchant': merchant_id,
    'price': int(amount * 100),  # Convert to haléře
    'curr': 'CZK',
    'label': 'ÚčetníBot - Měsíční předplatné',
    'refId': transaction_id,
    'email': customer_email,
    'method': 'ALL',  # All payment methods
    'lang': 'cs'
}

# Add signature
payment_data['signature'] = generate_signature(payment_data)

response = await client.post(f"{api_url}/create", data=payment_data)
```

### Webhook Processing
```python
@router.post("/comgate")
async def comgate_webhook(
    refId: str = Form(...),
    status: str = Form(...),
    transId: str = Form(...),
    signature: str = Form(...)
):
    # Verify signature
    if not verify_signature(form_data):
        return "ERROR"
    
    # Process payment status
    if status == 'PAID':
        await handle_payment_success(refId, transId)
    
    return "OK"  # Comgate expects "OK" response
```

## 📄 Invoice Generation

### Invoice Template
Czech-compliant invoice template with:
- **Company details**: ÚčetníBot s.r.o.
- **Customer information**: Name, email, IČO, DIČ
- **VAT calculation**: 21% Czech VAT rate
- **Payment details**: Bank account, variable symbol
- **Professional styling**: Corporate design

### PDF Generation
```python
async def generate_pdf(self, invoice_data: InvoiceData) -> bytes:
    template = self.jinja_env.get_template('invoice.html')
    html_content = template.render(invoice=invoice_data)
    
    html_doc = HTML(string=html_content)
    pdf_bytes = html_doc.write_pdf()
    
    return pdf_bytes
```

### Email Delivery
```python
async def send_invoice_email(self, invoice_data: InvoiceData, pdf_bytes: bytes):
    msg = MimeMultipart()
    msg['Subject'] = f"Faktura {invoice_data.invoice_number} - ÚčetníBot"
    
    # Attach PDF invoice
    pdf_attachment = MimeApplication(pdf_bytes, _subtype='pdf')
    pdf_attachment.add_header(
        'Content-Disposition', 
        'attachment', 
        filename=f'faktura_{invoice_data.invoice_number}.pdf'
    )
    msg.attach(pdf_attachment)
    
    # Send via SMTP
    await self._send_email_async(msg)
```

## 💬 WhatsApp Integration

### Payment Commands
Users can trigger payment with:
- `platba` - Request payment link
- `zaplatit` - Alternative payment command  
- `předplatné` - Subscription management
- `info` - Pricing and feature information

### Status Messages
```python
# Active subscription
✅ Vaše předplatné je již aktivní
📅 Aktivní do: 15.01.2025
💳 Status: Aktivní předplatné

# Payment success notification
🎉 Platba úspěšná!
✅ Vaše předplatné ÚčetníBot je aktivní
📅 Platí do: 15.01.2025
💳 Platební brána: Stripe
📧 Fakturu obdržíte na e-mail do 24 hodin.
```

## 🔒 Security

### Webhook Verification
- **Stripe**: Signature verification with webhook secret
- **Comgate**: HMAC signature validation
- **HTTPS only**: All webhook endpoints require SSL

### Data Protection
- **PCI Compliance**: Payment processing handled by providers
- **No card storage**: Card details never touch our servers
- **Encrypted communication**: All API calls over HTTPS
- **Audit logging**: All payment events logged with Sentry

### Error Handling
```python
try:
    result = await payment_service.create_subscription_payment(...)
    if result.success:
        return result.payment_url
    else:
        logger.error("Payment creation failed", error=result.error_message)
        return error_message
except Exception as e:
    logger.error("Payment processing failed", error=str(e))
    return generic_error_message
```

## 📊 Monitoring & Analytics

### Key Metrics
- **Conversion rate**: Payment requests → completed payments
- **Churn rate**: Monthly subscription cancellations  
- **Revenue**: Monthly recurring revenue (MRR)
- **Payment success rate**: Successful vs failed payments
- **Invoice delivery**: Email delivery success rate

### Logging
Structured logging with:
```json
{
  "event_type": "payment_created",
  "user_id": 123,
  "payment_id": "cs_...",
  "amount": 299.00,
  "currency": "czk",
  "provider": "stripe"
}
```

### Error Tracking
- **Sentry integration**: Automatic error capture
- **Business events**: Payment lifecycle tracking
- **Performance monitoring**: Payment processing times

## 🚀 Deployment

### Stripe Setup
1. Create Stripe account
2. Get API keys (test/live)
3. Create monthly product and price
4. Configure webhook endpoint
5. Set environment variables

### Comgate Setup
1. Register merchant account
2. Get merchant ID and secret
3. Configure notification URL
4. Test payments in sandbox
5. Switch to production

### Email Setup
1. Configure SMTP server (Gmail/custom)
2. Set up app password
3. Configure sender address
4. Test email delivery
5. Set up SPF/DKIM records

## 🧪 Testing

### Test Scenarios
1. **Successful payment flow**
   - Create payment link
   - Complete payment
   - Verify webhook processing
   - Check subscription activation
   - Confirm invoice generation

2. **Failed payment handling**
   - Invalid card details
   - Declined payment
   - Webhook failures
   - Error messaging

3. **Subscription lifecycle**
   - Trial expiration
   - Recurring payments
   - Subscription cancellation
   - Reactivation

### Test Cards (Stripe)
```
# Successful payment
4242424242424242

# Declined payment
4000000000000002

# Insufficient funds
4000000000009995
```

### Test Commands
```bash
# Test payment creation
curl -X POST http://localhost:8000/webhook/whatsapp \
  -d "Body=platba&From=whatsapp:+420123456789&To=whatsapp:+14155238886"

# Test webhook processing
curl -X POST http://localhost:8000/webhook/payment/stripe \
  -H "stripe-signature: ..." \
  -d @stripe_webhook.json
```

## 🎯 Future Enhancements

### Planned Features
- **Annual subscriptions**: Discounted yearly plans
- **Promo codes**: Discount coupons and referral bonuses
- **Multi-currency**: EUR, USD support
- **Payment methods**: Bank transfers, digital wallets
- **Subscription management**: Self-service portal

### Integration Opportunities
- **Accounting software**: Direct integration with Pohoda, Money
- **Bank connections**: Open banking API for automatic imports
- **Tax authority**: Direct VAT filing integration
- **Analytics**: Advanced business intelligence

## 📞 Support

### Payment Issues
- **Failed payments**: Check card details, try different card
- **Subscription status**: Use `/info` command for current status
- **Invoice delivery**: Check spam folder, request resend
- **Cancellation**: Contact support@ucetni-bot.cz

### Technical Support
- **Webhook failures**: Monitor logs, check endpoint URLs
- **Database issues**: Verify migration status
- **Email delivery**: Check SMTP configuration
- **Error tracking**: Review Sentry dashboard

---

## 🎉 Payment System Ready!

**ÚčetníBot now features a complete payment integration with:**
- ✅ **Dual payment gateways** (Stripe + Comgate)
- ✅ **Recurring subscriptions** with free trials
- ✅ **Automatic invoicing** with Czech compliance
- ✅ **WhatsApp integration** for seamless UX
- ✅ **Webhook processing** with error handling
- ✅ **Email delivery** with PDF invoices
- ✅ **Comprehensive monitoring** and logging

**Ready to generate revenue! 💰**
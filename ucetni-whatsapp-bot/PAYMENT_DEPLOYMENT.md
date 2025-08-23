# ÚčetníBot - Payment Integration Deployment Guide

## ✅ Completed Implementation

### 1. Payment Infrastructure
- ✅ **Stripe Integration**: Complete subscription management
- ✅ **Comgate Integration**: Czech payment gateway support
- ✅ **Database Models**: Payment and Invoice tables migrated
- ✅ **Webhook Endpoints**: Stripe and Comgate webhook handling
- ✅ **PDF Invoice Generation**: Automated invoice creation
- ✅ **Email Delivery**: SMTP integration for invoice sending

### 2. WhatsApp Commands
- ✅ **`/platba`** command implemented
- ✅ **Subscription status** checking
- ✅ **Payment link generation** 
- ✅ **Success notifications** to WhatsApp

### 3. Production Ready Features
- ✅ **Error tracking** with Sentry integration
- ✅ **Structured logging** with JSON format
- ✅ **Database migrations** applied
- ✅ **Environment configuration** templates
- ✅ **Railway.app configuration** updated

## 🚀 Deployment Steps

### Required Environment Variables

#### Payment Configuration
```bash
# Primary payment provider (stripe/comgate)
PAYMENT_PROVIDER=stripe

# Stripe Configuration (Production)
STRIPE_SECRET_KEY=sk_live_your_stripe_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_live_webhook_secret
STRIPE_PRICE_ID=price_your_live_monthly_subscription_price_id

# Comgate Configuration (Czech gateway)
COMGATE_MERCHANT_ID=your_production_merchant_id
COMGATE_SECRET=your_production_comgate_secret
```

#### Email Configuration
```bash
# SMTP for invoice delivery
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=invoices@ucetni-bot.cz
SMTP_PASSWORD=your_production_email_app_password
FROM_EMAIL=noreply@ucetni-bot.cz
FROM_NAME=ÚčetníBot
```

### Railway Deployment

1. **Set Environment Variables** in Railway dashboard:
   - All payment configuration variables
   - SMTP email settings
   - Database URL (PostgreSQL)
   - Webhook URL (Railway domain)

2. **Database Migration**:
   ```bash
   # Run after deployment
   railway run alembic upgrade head
   ```

3. **Webhook URLs** to configure:
   - Stripe: `https://your-domain.railway.app/webhook/payment/stripe`
   - Comgate: `https://your-domain.railway.app/webhook/payment/comgate`

## 💳 Payment Flow

### User Experience
1. User sends `/platba` or `platba` in WhatsApp
2. Bot generates payment link (Stripe/Comgate)
3. User completes payment on secure gateway
4. Webhook activates subscription
5. Success notification sent to WhatsApp
6. Invoice generated and emailed automatically

### Subscription Management
- **Price**: 299 CZK/month
- **Trial**: 7 days free trial
- **Billing**: Automatic monthly renewal
- **Invoice**: PDF generated and emailed within 24h

## 🔧 Technical Architecture

### Payment Services
- `PaymentService`: Main orchestrator
- `StripePaymentService`: Stripe integration
- `ComgatePaymentService`: Czech payment gateway
- `InvoiceService`: PDF generation and email delivery

### Database Models
- `Payment`: Payment records and metadata
- `Invoice`: Invoice generation and tracking
- `User`: Extended with subscription fields

### Endpoints
- `POST /webhook/payment/stripe`: Stripe webhooks
- `POST /webhook/payment/comgate`: Comgate webhooks
- `GET /webhook/payment/success`: Payment success page
- `GET /webhook/payment/cancel`: Payment cancellation page

## 🔒 Security Features

### Payment Security
- ✅ Webhook signature verification
- ✅ Environment variables for secrets
- ✅ HTTPS required for webhooks
- ✅ No sensitive data in logs

### Data Protection
- ✅ Customer data encryption
- ✅ PCI DSS compliant payment processing
- ✅ GDPR compliant data handling

## 📊 Monitoring

### Logging
- Payment events logged with structured data
- User actions tracked for analytics
- Error tracking via Sentry

### Business Metrics
- Payment success/failure rates
- Subscription activation events
- Invoice generation tracking

## 🧪 Testing

### Test Commands
```bash
# Test payment service import
python -c "from app.services.payment_service import payment_service; print('✅ Payment service loaded')"

# Test invoice generation
python -c "from app.services.invoice_service import invoice_service; print('✅ Invoice service loaded')"

# Test main application
python -c "from app.main import app; print('✅ Main app loads with payment integration')"
```

### Test Payment Flow
1. Send `/platba` to WhatsApp bot
2. Verify payment link generation
3. Complete test payment
4. Verify webhook processing
5. Check subscription activation
6. Confirm invoice generation

## 📋 Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test payment link generation
- [ ] Verify webhook endpoints respond correctly
- [ ] Test invoice PDF generation
- [ ] Verify email delivery works
- [ ] Test complete payment flow end-to-end
- [ ] Monitor error logs for issues
- [ ] Verify subscription activation works

## 🆘 Troubleshooting

### Common Issues
1. **Payment links not generating**: Check Stripe/Comgate API keys
2. **Webhooks failing**: Verify webhook secrets and URLs
3. **Invoices not sending**: Check SMTP configuration
4. **Database errors**: Ensure migrations are applied

### Support Contacts
- Technical issues: Log via Sentry
- Payment gateway issues: Check provider status pages
- Email delivery issues: Verify SMTP credentials

---

**Status**: ✅ Ready for Production Deployment
**Last Updated**: August 19, 2025
**Integration Version**: v1.0.0
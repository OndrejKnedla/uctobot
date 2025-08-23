# 🚀 Production Deployment Guide - ÚčetníBot

## 📋 Přehled
Kompletní návod pro nasazení českého WhatsApp účetního bota do produkce.

## 🏗️ Architektura
- **Backend**: FastAPI + SQLAlchemy + Async/Await
- **Databáze**: SQLite (development) → PostgreSQL (production)
- **AI**: Groq API (levné GPT řešení)
- **Messaging**: Twilio WhatsApp Business API
- **Hosting**: Railway.app / Heroku / DigitalOcean

## 📦 1. Příprava produkčního buildu

### Aktualizuj requirements.txt pro produkci:
```bash
# Přidej production dependencies
echo "python-dotenv==1.0.0" >> requirements.txt
echo "aiosqlite==0.19.0" >> requirements.txt
echo "gunicorn==21.2.0" >> requirements.txt
```

### Vytvoř produkční .env soubor:
```env
# Production Environment
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=your-super-secret-production-key

# Database (PostgreSQL for production)
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/dbname

# Twilio Production API
TWILIO_ACCOUNT_SID=your_production_sid
TWILIO_AUTH_TOKEN=your_production_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+your_approved_number

# Groq AI API
GROQ_API_KEY=your_groq_api_key

# Webhook URL
WEBHOOK_URL=https://your-domain.com/webhook/whatsapp

# Timezone
TZ=Europe/Prague
LOG_LEVEL=INFO
```

## 🏃‍♂️ 2. Deployment Options

### Option A: Railway.app (Doporučeno)
```bash
# 1. Vytvoř account na railway.app
# 2. Nainstaluj Railway CLI
npm install -g @railway/cli

# 3. Login a deploy
railway login
railway init
railway add
railway up
```

### Option B: Heroku
```bash
# 1. Vytvoř Procfile
echo "web: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker" > Procfile

# 2. Deploy
heroku create ucetni-whatsapp-bot
heroku config:set $(cat .env | grep -v '^#' | xargs)
git push heroku main
```

### Option C: DigitalOcean Droplet
```bash
# 1. Vytvoř Ubuntu 22.04 server
# 2. Nainstaluj dependencies
sudo apt update
sudo apt install python3-pip nginx supervisor

# 3. Deploy aplikaci
git clone your-repo
cd ucetni-whatsapp-bot
pip3 install -r requirements.txt

# 4. Konfigurace nginx + supervisor
```

## 🗄️ 3. Databáze Setup

### PostgreSQL na Supabase:
```sql
-- 1. Vytvoř projekt na supabase.com
-- 2. Spusť migrations
alembic upgrade head

-- 3. Aktualizuj DATABASE_URL v .env
DATABASE_URL=postgresql+asyncpg://postgres:[password]@[host]:5432/postgres
```

### Alternativa - Railway PostgreSQL:
```bash
# Railway automaticky vytvoří PostgreSQL addon
railway add postgresql
```

## 🔧 4. Twilio Production Setup

### 1. Upgrade Twilio Account:
- Upgrade z Trial na Pay-as-you-go
- Verify your business
- Request WhatsApp Business approval

### 2. Webhook Configuration:
```bash
# Nastav webhook URL v Twilio Console
https://your-domain.com/webhook/whatsapp
```

### 3. WhatsApp Business Profile:
- Upload business logo
- Add business description
- Verify business information

## 🔐 5. Security & Monitoring

### Environment Variables:
```bash
# Nikdy necommituj .env do gitu!
echo ".env" >> .gitignore

# Používej silné secret keys
openssl rand -hex 32
```

### Monitoring:
```python
# Přidej do main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FastApiIntegration()],
    traces_sample_rate=1.0,
)
```

## 📊 6. Platební systém

### Stripe Integration:
```python
# Přidej Stripe pro předplatné
pip install stripe

# Webhook pro payment confirmation
@app.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    # Verify payment and activate subscription
    pass
```

### Subscription Management:
```sql
-- Přidej payment tabulky
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    stripe_payment_id VARCHAR(255),
    amount INTEGER,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 7. Go Live Checklist

### Pre-launch:
- [ ] Databáze migrations applied
- [ ] Twilio business verification complete
- [ ] SSL certificate configured
- [ ] Environment variables set
- [ ] Monitoring setup
- [ ] Backup strategy defined

### Post-launch:
- [ ] Webhook URL updated in Twilio
- [ ] DNS configured
- [ ] Health checks running
- [ ] Error tracking active
- [ ] Payment system tested

## 📞 8. Support & Maintenance

### Daily Tasks:
- Monitor error logs
- Check Twilio message delivery
- Review user signups
- Payment processing status

### Weekly Tasks:
- Database backup verification
- Performance metrics review
- User feedback analysis
- Security updates

## 💰 9. Monetization Ready

Bot je připraven pro:
- ✅ Paid-only model (299 Kč/měsíc)
- ✅ Subscription management
- ✅ Access control middleware
- ✅ User onboarding flow
- ✅ Czech accounting features

## 📧 Contact & Support

- **Email**: podpora@ucetni-bot.cz
- **Website**: https://ucetni-bot.cz
- **Documentation**: /docs endpoint

---
🚀 **Bot je připraven k nasazení!**
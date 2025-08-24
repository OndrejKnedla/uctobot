# 🚀 ÚčtoBot - Produkční nasazení

## Rychlý přehled změn

✅ **Implementovano 7-day free trial**
- Stripe subscription s trial periodem
- Updated PricingCard komponenta
- Trial banner na homepage

✅ **Nový design payment success page**
- Kompletně redesignovaná stránka
- WhatsApp download instrukce 
- Onboarding flow s 4 kroky
- Konzistentní fonty s hlavní stránkou

✅ **Environment-based konfigurace**
- API URLs se automaticky přizpůsobí prostředí
- Development: localhost:8000
- Production: uctobot-api.vercel.app

## Nasazení na Vercel

### 1. Frontend
```bash
cd uctobot-web
npx vercel --prod
```

Environment variables:
```
NEXT_PUBLIC_API_URL = https://uctobot-api.vercel.app
NEXT_PUBLIC_STRIPE_PUBLIC_KEY = [tvůj Stripe public key]  
NEXT_PUBLIC_APP_URL = https://uctobot.vercel.app
```

### 2. Backend  
```bash
cd ucetni-whatsapp-bot
npx vercel --prod
```

Environment variables:
```
DATABASE_URL = [PostgreSQL URL]
STRIPE_SECRET_KEY = [tvůj Stripe secret key]
FRONTEND_URL = https://uctobot.vercel.app
TWILIO_ACCOUNT_SID = [Twilio SID]
TWILIO_AUTH_TOKEN = [Twilio token]
```

### 3. Databáze
Doporučuji **Supabase** (zdarma PostgreSQL):
1. Vytvoř projekt na https://supabase.com
2. Zkopíruj connection string
3. Nastav jako DATABASE_URL

### 4. Stripe Webhooks
1. Jdi na https://dashboard.stripe.com/webhooks
2. Přidej endpoint: `https://uctobot-api.vercel.app/api/webhook/stripe`
3. Events: `checkout.session.completed`, `invoice.payment_succeeded`

## Hlavní soubory

**Frontend změny:**
- `components/PricingCard.tsx` - 7-day trial tlačítka
- `app/platba-uspesna/page.tsx` - nový design success page
- `lib/api.ts` - environment-based API URLs

**Backend změny:**
- `app/routers/payments.py` - trial period support
- `api/index.py` - Vercel FastAPI integration

**Konfigurace:**
- `vercel.json` v obou projektech
- `.env.production.template` - šablony pro env vars

## Test flow

1. ✅ Homepage načtení
2. ✅ Klik na "Vyzkoušet 7 dní zdarma" 
3. ✅ Stripe Checkout otevření
4. ✅ Test platba (4242 4242 4242 4242)
5. ✅ Redirect na success page
6. ✅ WhatsApp download instrukce

Aplikace je ready pro live nasazení! 🎉
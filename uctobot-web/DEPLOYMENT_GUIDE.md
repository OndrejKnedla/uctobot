# 🚀 Nasazení ÚčtoBot do produkce

## Krok 1: Nastavení Supabase databáze

1. **Dokončete nastavení podle** `SUPABASE_SETUP.md`
2. **Aktualizujte environment variables** v `.env.local`
3. **Pushnete databázové schéma:**
   ```bash
   npx prisma db push
   ```

## Krok 2: Nasazení na Vercel

### A. Příprava

```bash
# Nainstalujte Vercel CLI (pokud už není)
npm install -g vercel

# Přihlášení
vercel login
```

### B. První nasazení

```bash
# V root adresáři projektu
vercel

# Postupujte dle instrukcí:
# - Set up and deploy? Yes
# - Which scope? (Vyberte svůj účet)
# - Link to existing project? No
# - Project name: uctobot-production
# - Directory: ./
```

### C. Nastavení environment variables

Ve Vercel dashboard (https://vercel.com/dashboard):

1. **Jděte do Project → Settings → Environment Variables**
2. **Přidejte všechny proměnné z `.env.local`:**

```bash
# Database
DATABASE_URL=postgresql://postgres.[ref]:[password]@[hostname]/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# JWT
JWT_SECRET=your_super_secret_jwt_key_production_strong

# WhatsApp
WHATSAPP_VERIFY_TOKEN=uctobot_verify_token_production
WHATSAPP_ACCESS_TOKEN=[facebook-access-token]
WHATSAPP_PHONE_NUMBER_ID=[phone-number-id]
WHATSAPP_BUSINESS_ACCOUNT_ID=[business-account-id]

# Google Vision API
GOOGLE_VISION_API_KEY=[your-google-vision-key]

# Twilio
TWILIO_ACCOUNT_SID=[your-twilio-sid]
TWILIO_AUTH_TOKEN=[your-twilio-token]

# Stripe
STRIPE_SECRET_KEY=sk_live_[your-live-key]
STRIPE_WEBHOOK_SECRET=whsec_[your-webhook-secret]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[your-live-key]

# App URLs
NEXT_PUBLIC_APP_URL=https://uctobot.vercel.app
NODE_ENV=production
```

## Krok 3: Konfigurace webhooků

### A. WhatsApp webhook

1. **Ve Facebook Developer Console nastavte webhook URL:**
   ```
   https://uctobot.vercel.app/api/whatsapp/webhook
   ```

2. **Verify token:** `uctobot_verify_token_production`

### B. Stripe webhook

1. **V Stripe Dashboard → Webhooks přidejte endpoint:**
   ```
   https://uctobot.vercel.app/api/stripe/webhook
   ```

2. **Události:** `payment_intent.succeeded`, `customer.subscription.updated`

## Krok 4: DNS a doména (volitelné)

```bash
# Pokud máte vlastní doménu (např. uctobot.cz)
vercel domains add uctobot.cz
vercel domains add www.uctobot.cz

# Poté v Vercel dashboard přiřaďte doménu k projektu
```

## Krok 5: Monitoring a zálohy

### A. Nastavení automatických záloh

```bash
# Na produkčním serveru
./scripts/setup-backup-cron.sh
```

### B. Monitoring (doporučené)

1. **Vercel Analytics** - automaticky aktivní
2. **Supabase Dashboard** - sledování databáze
3. **Error tracking:**

```bash
npm install @sentry/nextjs
```

## Krok 6: Testování produkce

1. **Zkontrolujte aplikaci na** `https://uctobot.vercel.app`
2. **Otestujte WhatsApp webhook**
3. **Zkuste registraci nového uživatele**
4. **Pošlete testovací účtenku**
5. **Zkontrolujte data v Supabase**

## Krok 7: Bezpečnost

### A. Rate limiting

```bash
# Přidejte do middleware.ts
export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}
```

### B. CORS nastavení

Již nakonfigurováno v `vercel.json`

### C. SSL certifikáty

Automaticky spravuje Vercel

## Krok 8: Údržba

### Denní kontroly:
- [ ] Backup se spustil (kontrola logů)
- [ ] Aplikace funguje (ping test)
- [ ] Databáze je dostupná

### Týdenní kontroly:
- [ ] Velikost databáze (Supabase dashboard)
- [ ] Error logy (Vercel dashboard)
- [ ] Performance metrics

### Měsíční kontroly:
- [ ] Aktualizace dependencí
- [ ] Bezpečnostní updaty
- [ ] Záložní testy (restore test)

## 🚨 V případě problémů

```bash
# Rollback na předchozí verzi
vercel rollback

# Zkontrolovat logy
vercel logs uctobot-production

# Manuální backup
npm run backup:manual
```

## 📞 Podpora

- **Vercel:** https://vercel.com/support
- **Supabase:** https://supabase.com/support
- **WhatsApp API:** Facebook Developer Support
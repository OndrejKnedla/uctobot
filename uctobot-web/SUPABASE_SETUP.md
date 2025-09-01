# 🛠️ Nastavení Supabase PostgreSQL databáze pro produkci

## 1. Vytvoření Supabase projektu

1. **Přejděte na** https://supabase.com
2. **Klikněte na** "Start your project"
3. **Přihlaste se** pomocí GitHub účtu
4. **Vytvořte nový projekt:**
   - Organization: Vyberte svou organizaci
   - Project name: `uctobot-production`
   - Database password: **DŮLEŽITÉ - uložte si heslo!** (nebude vidět podruhé)
   - Region: `Europe (Frankfurt)` - nejblíže k ČR

## 2. Získání údajů pro připojení

Po vytvoření projektu:

1. **Přejděte do Settings → Database**
2. **Zkopírujte Connection string:**
   ```
   postgresql://postgres.[ref]:[password]@[hostname]/postgres
   ```

3. **Přejděte do Settings → API**
4. **Zkopírujte:**
   - Project URL: `https://[project-ref].supabase.co`
   - anon public key: `eyJ...` (dlouhý token)

## 3. Aktualizace .env.local

Odkomentujte a vyplňte v `.env.local`:

```bash
# Database - Production (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[ref]:[password]@[hostname]/postgres"

# Supabase Configuration (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Migrace databáze na Supabase

```bash
# Push databázového schématu na Supabase
npx prisma db push

# Generování Prisma klienta
npx prisma generate
```

## 5. Bezpečnostní nastavení

V Supabase dashboard:

1. **Authentication → Settings:**
   - Disable "Enable email confirmations" (pro WhatsApp flow)
   
2. **Database → Policies:**
   - Row Level Security bude automaticky nastaveno přes Prisma

## 6. Zálohy (automatické)

Supabase automaticky poskytuje:
- ✅ **Daily backups** (7 dní uchovávání na free tier)
- ✅ **Point-in-time recovery**
- ✅ **Replikace** napříč data centry
- ✅ **SSL připojení**

## 7. Monitoring

V Supabase dashboard můžete sledovat:
- Database utilization
- API requests
- Error logs
- Performance metrics

## 🚀 Po dokončení nastavení

1. Restartujte development server: `npm run dev`
2. Otestujte registraci nového uživatele
3. Zkontrolujte data v Supabase dashboard

## 📊 Limity Free tier

- **Database:** 500MB storage
- **Bandwidth:** 5GB/měsíc
- **API requests:** 50,000/měsíc
- **Auth users:** 50,000

Pro škálování můžete přejít na Pro plan ($25/měsíc).
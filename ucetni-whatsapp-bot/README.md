# 🤖 Účetní WhatsApp Bot pro OSVČ

MVP (Minimum Viable Product) účetního bota pro české osoby samostatně výdělečně činné (OSVČ). Bot umožňuje jednoduché zadávání příjmů a výdajů přes WhatsApp a automaticky je kategorizuje podle českých účetních osnov.

## 🎯 Hlavní funkce

- ✅ **Jednoduché zadávání transakcí** - "Koupil jsem notebook za 25000"
- 🤖 **AI kategorizace** - automatické přiřazení účetních kategorií
- 📊 **Přehledy a statistiky** - měsíční a kvartální souhrny
- 📅 **Připomínky termínů** - DPH, zálohy na daň
- 📄 **Export dat** - CSV export pro účetní
- 🇨🇿 **České účetní osnovy** - kategorie podle českých standardů

## 🛠️ Technologický stack

- **Backend**: Python 3.11+ + FastAPI
- **WhatsApp API**: Twilio WhatsApp Business API
- **AI**: OpenAI GPT pro zpracování přirozeného jazyka
- **Databáze**: PostgreSQL (doporučeno Supabase)
- **Deployment**: Railway.app / Render.com
- **Lokální vývoj**: ngrok pro webhook testování

## 📋 Předpoklady

1. **Twilio účet** - [Zdarma trial](https://www.twilio.com/try-twilio)
2. **OpenAI API klíč** - [$5 kredit zdarma](https://platform.openai.com/)
3. **PostgreSQL databáze** - [Supabase 500MB zdarma](https://supabase.com/)
4. **Python 3.11+**

## 🚀 Rychlé spuštění

### 1. Klonování a instalace

```bash
git clone <repository-url>
cd ucetni-whatsapp-bot
pip install -r requirements.txt
```

### 2. Nastavení prostředí

```bash
cp .env.example .env
# Vyplň své API klíče do .env souboru
```

### 3. Nastavení Twilio

1. Vytvoř účet na [Twilio Console](https://console.twilio.com/)
2. Jdi do **Develop → Messaging → Try it out → Send a WhatsApp message**
3. Zkopíruj **Account SID** a **Auth Token** do `.env`
4. Aktivuj WhatsApp Sandbox: pošli "join <sandbox-keyword>" na +1 415 523 8886

### 4. Nastavení databáze

#### Supabase (doporučeno)
1. Vytvoř projekt na [Supabase](https://supabase.com/)
2. Jdi do **Settings → Database** a zkopíruj Connection String
3. Vlož do `.env` jako `DATABASE_URL`

#### Lokální PostgreSQL
```bash
# Spusť PostgreSQL lokálně
createdb ucetni_bot
# Nastav DATABASE_URL=postgresql://username:password@localhost:5432/ucetni_bot
```

### 5. Získání OpenAI API klíče

1. Vytvoř účet na [OpenAI Platform](https://platform.openai.com/)
2. Jdi do **API Keys** a vytvoř nový klíč
3. Vlož do `.env` jako `OPENAI_API_KEY`

### 6. Spuštění aplikace

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 7. Nastavení webhook (lokální vývoj)

```bash
# V novém terminálu
ngrok http 8000
```

1. Zkopíruj ngrok URL (např. `https://abc123.ngrok.io`)
2. V Twilio Console jdi do **Develop → Webhooks**
3. Nastav webhook URL na: `https://abc123.ngrok.io/webhook/whatsapp`

## 📱 Jak používat

### Základní příkazy

```
Koupil jsem toner za 1500
Faktura od Alza 35000  
Zaplatil jsem nájem 12000
Přišla platba 50000 od ČEZ
```

### Speciální příkazy

- `přehled` - měsíční souhrn
- `kvartál` - kvartální souhrn  
- `export` - CSV export
- `pomoc` - nápověda

### Příklady konverzace

**Uživatel**: Koupil jsem notebook za 25000  
**Bot**: ✅ Zaznamenal jsem výdaj:
💰 Částka: 25 000 Kč
📁 Kategorie: Drobný majetek
📝 Popis: Notebook

**Uživatel**: přehled  
**Bot**: 📊 Přehled za listopad 2024:
📈 Příjmy: 85 000 Kč
📉 Výdaje: 23 500 Kč
💰 Zisk: 61 500 Kč

## 🏗️ Struktura projektu

```
ucetni-whatsapp-bot/
├── app/
│   ├── main.py              # FastAPI aplikace + webhook handler
│   ├── whatsapp_handler.py  # Zpracování WhatsApp zpráv
│   ├── ai_processor.py      # OpenAI integrace
│   └── database.py          # PostgreSQL operace
├── models/
│   └── transaction.py       # Pydantic modely
├── utils/
│   ├── categories.py        # České účetní kategorie
│   ├── notifications.py     # Připomínky a notifikace
│   └── twilio_client.py     # Twilio konfigurace
├── requirements.txt
├── .env.example
└── README.md
```

## 📊 České účetní kategorie

### Výdaje
- **501100** - Spotřeba materiálu (papír, toner, kancelářské potřeby)
- **501300** - PHM (benzín, nafta, palivo)
- **518100** - Nájemné (kancelář, prostory)
- **518200** - Telefon a internet
- **518300** - Software a licence
- **513100** - Reprezentace (obědy s klienty)
- **521100** - Mzdy
- **524100** - Sociální a zdravotní pojištění

### Příjmy  
- **602100** - Tržby za služby
- **604100** - Tržby za zboží

## 🔄 Deployment

### Railway.app

1. Vytvoř účet na [Railway](https://railway.app/)
2. Připoj GitHub repository
3. Nastav environment variables z `.env`
4. Deploy!
5. Zkopíruj URL a nastav v Twilio webhook

### Render.com

1. Vytvoř účet na [Render](https://render.com/)
2. Vytvoř nový Web Service z GitHub
3. Nastav:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Nastav environment variables
5. Deploy a nastav webhook URL

## 📅 Automatické připomínky

Bot automaticky posílá připomínky:

- **10. každého měsíce** - Zálohy na daň z příjmů (termín 15.)
- **20. posledního měsíce kvartálu** - DPH přiznání (termín 25.)
- **1. každého měsíce** - Měsíční souhrn
- **Pravidelně** - Účetní tipy a rady

## 🔧 Konfigurace

### Environment variables

```bash
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# OpenAI  
OPENAI_API_KEY=sk-xxxxx

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Aplikace
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=your-secret-key
WEBHOOK_URL=https://your-domain.com/webhook/whatsapp
```

### Databázové schéma

```sql
-- Uživatelé
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    whatsapp_number VARCHAR(50) UNIQUE,
    business_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Transakce
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(10) CHECK (type IN ('income', 'expense')),
    amount DECIMAL(12,2),
    description TEXT,
    category VARCHAR(10),
    category_name VARCHAR(100),
    original_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Připomínky
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    reminder_type VARCHAR(20),
    message TEXT,
    due_date DATE,
    sent BOOLEAN DEFAULT FALSE
);
```

## 🐛 Troubleshooting

### Časté problémy

**Bot neodpovídá**
- Zkontroluj webhook URL v Twilio Console
- Ověř, že aplikace běží a je dostupná
- Zkontroluj logy aplikace

**AI nerozpoznává transakce**
- Ověř OpenAI API klíč
- Zkontroluj kredit na OpenAI účtu
- Zkus jednodušší formulace

**Databázové chyby**
- Ověř DATABASE_URL
- Zkontroluj připojení k databázi
- Ověř, že tabulky existují

### Logy

```bash
# Spuštění s detailními logy
LOG_LEVEL=DEBUG uvicorn app.main:app --reload
```

## 📈 Roadmap

- [ ] **OCR pro účtenky** - automatické čtení z fotek
- [ ] **Hlasové zprávy** - diktování transakcí
- [ ] **Více účetních systémů** - export do různých formátů  
- [ ] **Pokročilé reporty** - grafy, trendy
- [ ] **Multi-tenant** - více firem na jednom botu
- [ ] **Integrace s bankami** - automatický import transakcí

## 📄 Licence

MIT License - viz LICENSE soubor

## 💬 Podpora

Pro podporu a dotazy:
- 📧 Email: support@example.com
- 💬 GitHub Issues
- 📱 WhatsApp: +420 xxx xxx xxx

---

**Upozornění**: Tento bot je MVP určený pro základní účetní evidenci. Pro komplexní účetnictví doporučujeme konzultaci s odborným účetním.

## 🙏 Poděkování

- [Twilio](https://www.twilio.com/) za WhatsApp API
- [OpenAI](https://openai.com/) za AI zpracování
- [FastAPI](https://fastapi.tiangolo.com/) za web framework
- [Supabase](https://supabase.com/) za databázi
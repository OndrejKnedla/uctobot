# ÚčtoBot - Databázová architektura

## Přehled

Databáze je navržena pro kompletní účetní systém s WhatsApp integrací. Využívá PostgreSQL s Prisma ORM.

## Spuštění databáze

### S Docker Compose (doporučeno)
```bash
# Spustí PostgreSQL a Redis
docker-compose up -d postgres redis

# Vytvoří databázi a spustí migrace
npx prisma db push

# Naplní databázi testovacími daty
npm run db:seed
```

### Manuálně
```bash
# Nainstaluj PostgreSQL lokálně
sudo apt install postgresql postgresql-contrib

# Vytvoř databázi
sudo -u postgres createdb uctobot

# Nastav heslo pro postgres uživatele
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
```

## Databázové schéma

### Hlavní entity

#### 🧑 User (Uživatelé)
- Základní informace o OSVČ (název, IČO, DIČ)
- WhatsApp autentizace (telefon, OTP)
- Nastavení účetnictví (plátce DPH, frekvence)

#### 💳 Subscription (Předplatné)
- Tarify (MONTHLY, YEARLY)
- Status (TRIAL, ACTIVE, CANCELLED)
- Speciální nabídka pro prvních 50 zákazníků

#### 💰 Payment (Platby)
- Platby předplatného
- Stripe integrace

#### 📄 Invoice (Faktury vydané)
- Faktury pro zákazníky
- Položky faktury s DPH
- Stavy (DRAFT, SENT, PAID, OVERDUE)

#### 💸 Expense (Výdaje)
- Přijaté faktury a účtenky
- AI OCR zpracování
- Kategorie pro daňové účely

#### 🏦 BankAccount & BankTransaction
- Bankovní účty s API integrací
- Automatické stahování transakcí
- Párování s výdaji

#### 📂 Category (Kategorie)
- Příjmy/výdaje
- Daňově uznatelné položky
- Sazby DPH

#### 👥 Contact (Kontakty)
- Zákazníci a dodavatelé
- ARES integrace
- IČO, DIČ

#### 📁 Document (Dokumenty)
- Naskenované účtenky
- OCR zpracování
- Cloud storage

#### 📊 TaxReport (Daňové přehledy)
- DPH přiznání
- Daň z příjmu
- Sociální a zdravotní pojištění

#### 🔔 Notification (Notifikace)
- Připomínky termínů
- WhatsApp notifikace

## API Endpointy

### Autentizace
- `POST /api/auth/whatsapp` - Registrace/login přes WhatsApp OTP

### Faktury
- `GET /api/invoices` - Seznam faktur
- `POST /api/invoices` - Nová faktura

### Výdaje  
- `GET /api/expenses` - Seznam výdajů s filtry
- `POST /api/expenses` - Nový výdaj
- `PUT /api/expenses` - Aktualizace (AI zpracování)

### Předplatné
- `GET /api/subscriptions` - Detail předplatného
- `POST /api/subscriptions` - Nové předplatné
- `DELETE /api/subscriptions` - Zrušení

## Bezpečnost

- JWT tokeny pro autentizace
- Šifrování citlivých dat (API tokeny)
- Row-level security (každý uživatel vidí jen svá data)
- Rate limiting na API endpointy

## Škálování

- Database connection pooling
- Redis cache pro často používaná data
- Indexy na nejčastěji dotazované sloupce
- Partitioning pro transakce podle data

## Monitoring

- Prisma metrics
- Slow query logging
- Error tracking
- Database performance insights

## Zálohy

- Automatické denní zálohy
- Point-in-time recovery
- Encryption at rest
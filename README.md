# 🤖 ÚčetníBot - AI WhatsApp Účetní Asistent

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Next.js](https://img.shields.io/badge/Next.js-15.2+-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)

Inteligentní WhatsApp bot pro účetnictví OSVČ v České republice. Umožňuje jednoduché vedení účetnictví přímo z WhatsApp pomocí AI zpracování zpráv.

## 🚀 Quick Start

### Požadavky
- Docker & Docker Compose
- Node.js 18+ (pro lokální vývoj)
- Python 3.11+ (pro lokální vývoj)

### Instalace a spuštění

1. **Naklonuj repozitář:**
```bash
git clone <repository>
cd mvp-ucetni
```

2. **Zkopíruj a vyplň .env soubory:**
```bash
# Backend environment
cp ucetni-whatsapp-bot/.env.example ucetni-whatsapp-bot/.env

# Frontend environment  
cp uctobot-web/.env.local.example uctobot-web/.env.local

# Vyplň API klíče v .env souborech
```

3. **Spusť aplikaci:**
```bash
make dev
```

### 🌐 Přístupy

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Dokumentace**: http://localhost:8000/docs
- **Databáze**: localhost:5432

## 📋 Dostupné příkazy

```bash
make help        # Zobrazí všechny příkazy
make dev         # Spustí vývoj v Dockeru
make up          # Spustí na pozadí
make down        # Zastaví aplikaci
make logs        # Zobrazí logy
make logs-be     # Logy backendu
make logs-fe     # Logy frontendu
make clean       # Vyčistí cache
make test        # Spustí testy
make migrate     # Migrace databáze
make health      # Kontrola zdraví služeb
```

## 🛠 Vývoj

### Backend (FastAPI)
```bash
cd ucetni-whatsapp-bot
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (Next.js)
```bash
cd uctobot-web
npm install
npm run dev
```

### Lokální vývoj bez Docker
```bash
make dev-local
```

## 📁 Struktura projektu

```
mvp-ucetni/
├── ucetni-whatsapp-bot/     # FastAPI Backend
│   ├── app/                 # Aplikační logika
│   ├── migrations/          # Databázové migrace
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile          # Backend container
├── uctobot-web/            # Next.js Frontend
│   ├── app/                # Next.js 15 app directory
│   ├── components/         # React komponenty
│   ├── lib/               # Utility funkce
│   └── Dockerfile         # Frontend container
├── docker-compose.yml     # Docker orchestrace
├── Makefile              # Příkazy pro vývoj
└── README.md             # Tato dokumentace
```

## 🔧 Konfigurace

### Backend (.env)
```env
# Databáze
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ucetnibot

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# AI Processing
GROQ_API_KEY=your_groq_api_key

# Stripe platby
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📦 Technologie

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM pro databázi
- **Alembic** - Databázové migrace
- **PostgreSQL** - Hlavní databáze
- **Twilio** - WhatsApp API
- **Groq** - AI zpracování zpráv
- **Stripe** - Platební brána
- **Sentry** - Error tracking

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI komponenty

### DevOps
- **Docker** - Kontejnerizace
- **Docker Compose** - Orchestrace
- **PostgreSQL** - Databáze
- **Redis** - Cache (volitelné)
- **Nginx** - Reverse proxy (produkce)

## 🎯 Funkce

### Uživatelské funkce
- 💬 WhatsApp rozhraní
- 🤖 AI kategorizace transakcí
- 📊 Měsíční a kvartální přehledy
- 💰 DPH výpočty a reporty
- 📄 Export dat (CSV, XML)
- 🔔 Automatické připomínky
- 💳 Stripe platby

### Vývojářské funkce
- 🐳 Docker development
- 📝 Comprehensive logging
- 🧪 Pytest test suite
- 📈 Prometheus metrics
- 🔍 Sentry error tracking
- 📋 API dokumentace
- 🔄 Hot reloading

## 🧪 Testování

```bash
# Backend testy
make test

# Nebo přímo
cd ucetni-whatsapp-bot
pytest tests/ -v

# S coverage
pytest tests/ --cov=app --cov-report=html
```

## 🚀 Nasazení

### Docker produkce
```bash
docker-compose -f docker-compose.yml up -d
```

### Railway/Heroku
```bash
# Backend má připravené Procfile a railway.json
git push heroku main
```

## 🔒 Bezpečnost

- 🔐 CORS správně nakonfigurován
- 🔑 Environment variables pro citlivé údaje
- 🛡️ Twilio webhook validace
- 📊 Rate limiting
- 🚨 Sentry error tracking
- 📝 Comprehensive logging

## 🐛 Troubleshooting

### Časté problémy

1. **Port už používán**
```bash
make clean
sudo lsof -i :3000 -i :8000 -i :5432
```

2. **Databáze se nepřipojí**
```bash
make logs-db
docker-compose restart db
```

3. **Frontend se nebuilds**
```bash
cd uctobot-web
rm -rf .next node_modules
npm install
npm run build
```

4. **Backend neprojde migrace**
```bash
make logs-be
docker-compose exec backend alembic current
docker-compose exec backend alembic upgrade head
```

### Debug příkazy
```bash
make status        # Stav všech kontejnerů
make health        # Health check všech služeb
make db-shell      # Připojení k databázi
make backend-shell # Bash v backend kontejneru
```

## 🤝 Přispívání

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 Licence

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Kontakt

- **Email**: podpora@ucetnibot.cz
- **Website**: https://ucetnibot.cz
- **WhatsApp**: +420 777 123 456

---

Made with ❤️ for Czech entrepreneurs
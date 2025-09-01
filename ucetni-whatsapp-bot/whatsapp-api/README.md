# WhatsApp Business API - UctoBot Phase 1

Komplětní WhatsApp Business API integrace s pokročilou anti-spam ochranou a efektivním využíváním free tier (1000 zpráv/měsíc).

## 🚀 Funkce

### Anti-Spam Ochrana
- **Týdenní limity**: 20-500 zpráv/týden podle trust level
- **Burst protection**: Max 15 zpráv/den, 5 zpráv/hodina
- **Progresivní trust systém**: NEW_USER → REGULAR → VERIFIED → PREMIUM
- **Automatické bany**: Za spam nebo porušení pravidel
- **Detekce duplicitních zpráv** a spam patterns

### Trust Level Systém
- **NEW_USER**: 20 zpráv/týden (první 7 dní)
- **REGULAR**: 40 zpráv/týden (po 7 dnech)
- **VERIFIED**: 60 zpráv/týden (s ověřeným IČO)
- **PREMIUM**: 500 zpráv/týden (platící uživatelé)

### Monitoring & Alerting
- Real-time statistiky využití free tier
- Automatické alerty při 80% a 95% využití
- Denní reporty a týdenní resety
- Export dat pro migraci na Phase 2

## 📋 Požadavky

- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- Docker & Docker Compose (volitelné)

## 🛠 Instalace

### 1. Klonování a závislosti

```bash
cd whatsapp-api
npm install
```

### 2. Environment konfigurace

```bash
cp .env.example .env
```

Vyplň tyto povinné hodnoty v `.env`:

```env
# Meta WhatsApp API
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret  
WHATSAPP_TOKEN=your_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WEBHOOK_VERIFY_TOKEN=your_unique_verify_token

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_api

# Redis
REDIS_URL=redis://localhost:6379
```

### 3. Databáze setup

```bash
# Generuj Prisma client
npm run prisma:generate

# Spusť migrace
npm run prisma:migrate

# (Volitelně) Otevři Prisma Studio
npm run prisma:studio
```

### 4. Spuštění

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## 🐳 Docker Deployment

```bash
# Spusť všechny služby
docker-compose up -d

# Pouze s admin tools
docker-compose --profile admin --profile studio up -d

# Zobrazit logy
docker-compose logs -f whatsapp-api

# Stop
docker-compose down
```

## 📊 API Endpointy

### Webhook
- `GET /api/webhook` - Meta webhook verification
- `POST /api/webhook` - Příjem WhatsApp zpráv

### Monitoring
- `GET /api/health` - Health check
- `GET /api/stats` - Základní statistiky
- `GET /api/stats/detailed` - Detailní statistiky
- `GET /api/users/:phoneNumber/stats` - Stats konkrétního uživatele

### Admin (pouze pro development)
- `POST /api/admin/reset-weekly` - Manuální týdenní reset
- `POST /api/admin/daily-tasks` - Spusť denní úkoly
- `GET /api/admin/jobs` - Status CRON jobs
- `GET /api/admin/export` - Export uživatelských dat

## 🔒 Rate Limiting

### Týdenní limity (reset každé pondělí 00:00)
```typescript
NEW_USER: 20 zpráv/týden
REGULAR: 40 zpráv/týden  
VERIFIED: 60 zpráv/týden
PREMIUM: 500 zpráv/týden
```

### Burst Protection
- Max 15 zpráv/den (bez ohledu na týdenní limit)
- Max 5 zpráv/hodina
- Min 10 sekund mezi zprávami

### Anti-Spam
- Max 3 identické zprávy → warning
- 5 identických zpráv → auto-ban 24h
- Detekce spam patterns (URL shortenery, podezřelé vzory)

## 📈 Monitoring

### Free Tier Tracking
- Sledování využití 1000 zpráv/měsíc
- Alerty při 80% (WARNING) a 95% (CRITICAL)
- Odhad zbývajících dní při aktuálním tempu

### Automatické Alerty
- **80% využití**: "Připrav Phase 2 migraci"  
- **95% využití**: "Migrace na Hetzner IHNED!"
- **Vysoká ban rate**: Při více než 10% banned uživatelů

## 🔄 CRON Jobs

- **Týdenní reset** (Po 00:00): Vymaže všechny rate limit countery
- **Denní úkoly** (denně 00:00): Report, cleanup, trust level check
- **Hodinové checks** (každou hodinu): Free tier monitoring
- **Cleanup banů** (každých 15 min): Odstraní expirované bany
- **Trust level update** (každé 4h): Kontrola na upgrady

## 🎯 Business Logic

### Zpracování zpráv
1. **Prvotní zpráva**: Uvítací zpráva s limity
2. **Pomoc**: `pomoc`, `help` → nápověda
3. **Statistiky**: `limit`, `stats` → využití účtu  
4. **IČO verification**: 8 číslic → upgrade na VERIFIED
5. **Faktury**: Obrázek → OCR zpracování
6. **Dokumenty**: PDF → analýza

### Automated Responses
```
📊 Týdenní limit vyčerpán. Reset v pondělí.
⏸️ Denní limit dosažen. Pokračuj zítra.
⏱️ Příliš rychle! Počkej 10 sekund.
🚫 Účet dočasně zablokován za spam.
```

## 🔧 Configuration

### Rate Limits (env variables)
```env
WEEKLY_LIMIT_NEW=20
WEEKLY_LIMIT_REGULAR=40  
WEEKLY_LIMIT_VERIFIED=60
WEEKLY_LIMIT_PREMIUM=500
DAILY_BURST_LIMIT=15
HOURLY_BURST_LIMIT=5
```

### Monitoring
```env
FREE_TIER_LIMIT=1000
ALERT_THRESHOLD_PERCENT=80
CRITICAL_THRESHOLD_PERCENT=95
```

## 🚨 Production Checklist

### Security
- [ ] Změň `WEBHOOK_VERIFY_TOKEN`
- [ ] Nastav správné `META_APP_SECRET`
- [ ] Omezenej admin endpointy (firewall/auth)
- [ ] HTTPS certifikát pro webhook
- [ ] Environment variables security

### Monitoring
- [ ] Log monitoring (ELK stack)
- [ ] Uptime monitoring
- [ ] Alerting (email/Slack)
- [ ] Backup strategie (PostgreSQL)

### Performance  
- [ ] Redis persistence config
- [ ] PostgreSQL connection pooling
- [ ] Rate limiting headers
- [ ] Gzip compression

## 📱 Meta Developer Setup

1. **Meta Developer Account**: https://developers.facebook.com/
2. **Create WhatsApp Business App**
3. **Get Phone Number ID** & **Access Token**
4. **Configure Webhook**: `https://yourdomain.com/api/webhook`
5. **Subscribe to messages field**

### Webhook Verification
Meta bude volat:
```
GET /api/webhook?hub.mode=subscribe&hub.challenge=123&hub.verify_token=your_token
```

## 🔄 Migration to Phase 2

Když dosáhneš 80-90% free tier:

1. **Export dat**: `GET /api/admin/export`
2. **Setup Hetzner** server s Evolution API
3. **Migrate users** s jejich trust levels
4. **Update webhook** URL
5. **Switch providers** atomicky

## 🐞 Troubleshooting

### Časté problémy

**Webhook not working:**
```bash
# Check ngrok/tunnel
curl https://yourdomain.com/api/health

# Check logs
docker-compose logs -f whatsapp-api
```

**Redis connection:**
```bash
# Test Redis
redis-cli ping

# Check Docker
docker-compose ps
```

**Database issues:**
```bash
# Reset migrations
npm run prisma:migrate reset

# Regenerate client  
npm run prisma:generate
```

### Debug Mode
```bash
NODE_ENV=development npm run dev
```

## 📊 Performance Expectations

### Free Tier Capacity
- **40-50 aktivních uživatelů**
- **Průměr 20-25 zpráv/uživatel/týden**
- **800-900 zpráv/měsíc** utilization
- **100+ dny provozu** při správném rate limiting

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Add tests
4. Submit pull request

## 📄 License

MIT License - viz LICENSE soubor.

---

**UctoBot Phase 1** - Efektivní využití Meta Cloud API free tier s pokročilou anti-spam ochranou! 🚀
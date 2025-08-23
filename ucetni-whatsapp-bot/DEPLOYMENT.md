# 🚀 ÚčetníBot - Production Deployment Guide

## 📋 Overview
Complete production deployment guide for ÚčetníBot - Czech WhatsApp Accounting Assistant.

## 🏗️ Architecture
- **Backend**: FastAPI + SQLAlchemy + Async/Await
- **Database**: PostgreSQL with connection pooling
- **Monitoring**: Sentry + Prometheus + Structured logging
- **Container**: Docker with multi-stage build
- **Reverse Proxy**: Nginx with rate limiting
- **Cache**: Redis for session management

## 📦 Quick Start

### 1. Clone and Setup
```bash
git clone <your-repo>
cd ucetni-whatsapp-bot

# Copy environment template
cp .env.example .env
# Edit .env with your production values
```

### 2. Docker Deployment
```bash
# Production deployment with PostgreSQL
docker-compose up -d

# View logs
docker-compose logs -f web

# Health check
curl http://localhost/health
```

### 3. Railway.app Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Add PostgreSQL
railway add postgresql

# Set environment variables
railway variables set TWILIO_ACCOUNT_SID=<your-sid>
railway variables set TWILIO_AUTH_TOKEN=<your-token>
# ... set all required variables
```

## 🔧 Environment Configuration

### Required Variables
```env
# Application
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=<generate-with-openssl-rand-hex-32>
PORT=8000

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=<your-production-sid>
TWILIO_AUTH_TOKEN=<your-production-token>
TWILIO_WHATSAPP_NUMBER=whatsapp:+<your-approved-number>

# AI Processing
GROQ_API_KEY=<your-groq-key>

# Webhook
WEBHOOK_URL=https://your-domain.com/webhook/whatsapp

# Monitoring
SENTRY_DSN=https://<your-sentry-dsn>
```

### Optional Variables
```env
# Redis caching
REDIS_URL=redis://redis:6379

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Feature flags
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- `GET /health` - Comprehensive health check with system metrics
- `GET /status` - Simple OK status for load balancers  
- `GET /metrics` - Prometheus metrics

### Monitoring Stack
- **Sentry**: Error tracking and performance monitoring
- **Prometheus**: Metrics collection
- **Structured Logs**: JSON formatted logs with context

### Key Metrics
```bash
# HTTP requests
http_requests_total{method="POST", endpoint="/webhook/whatsapp", status="200"}

# WhatsApp messages
whatsapp_messages_total{direction="incoming", status="received"}
whatsapp_messages_total{direction="outgoing", status="sent"}

# Request duration
http_request_duration_seconds
```

## 🔒 Security

### SSL/TLS Setup
```bash
# Generate self-signed certificates (development)
mkdir ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem

# For production, use Let's Encrypt or proper certificates
```

### Security Headers
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HTTPS only)

### Rate Limiting
- API endpoints: 10 requests/second per IP
- Webhook endpoint: 30 requests/second per IP
- Burst capacity: 20-50 requests

## 🗄️ Database Management

### PostgreSQL Setup
```bash
# Create database
createdb ucetni_bot

# Run migrations
alembic upgrade head

# Backup
pg_dump ucetni_bot > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql ucetni_bot < backup_20241201_120000.sql
```

### Connection Pooling
- Pool size: 5 connections
- Max overflow: 10 connections
- Pool recycle: 3600 seconds
- Pre-ping enabled for connection health

## 📡 Twilio Configuration

### Production Setup
1. **Upgrade Account**: From trial to pay-as-you-go
2. **Business Verification**: Complete business verification process
3. **WhatsApp Approval**: Request WhatsApp Business API approval
4. **Phone Number**: Get approved WhatsApp Business number
5. **Webhook URL**: Set to `https://your-domain.com/webhook/whatsapp`

### Webhook Security
```python
# Twilio signature verification is built into the webhook handler
# Ensure TWILIO_AUTH_TOKEN is kept secure
```

## 🚀 Deployment Options

### Option 1: Railway.app (Recommended)
```bash
# Simple deployment with PostgreSQL addon
railway login
railway init
railway add postgresql
railway up
```

**Pros**: Easy setup, automatic SSL, built-in monitoring
**Cons**: Higher cost for high traffic

### Option 2: DigitalOcean App Platform
```bash
# Deploy via GitHub integration
# PostgreSQL managed database
# Automatic SSL and CDN
```

**Pros**: Good price/performance, managed services
**Cons**: Less control over configuration

### Option 3: Self-hosted VPS
```bash
# Ubuntu 22.04 setup
sudo apt update && sudo apt install docker.io docker-compose
git clone <repo>
docker-compose -f docker-compose.prod.yml up -d
```

**Pros**: Full control, lowest cost
**Cons**: Manual maintenance, security responsibility

## 📝 Logging

### Structured JSON Logs
```json
{
  "timestamp": "2024-12-01T10:30:00.000Z",
  "level": "INFO",
  "service": "ucetni-whatsapp-bot",
  "event_type": "whatsapp_message",
  "direction": "incoming",
  "phone_number": "+420*****789",
  "user_id": 123,
  "message_preview": "start"
}
```

### Log Aggregation
```bash
# Docker logs
docker-compose logs -f web

# Ship to external service (optional)
# Configure fluentd, filebeat, or similar
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: railway up --service production
```

## 📈 Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml
services:
  web:
    deploy:
      replicas: 3
  
  nginx:
    depends_on:
      - web
```

### Database Scaling
- Read replicas for reporting
- Connection pooling optimization
- Query optimization and indexing

### Caching
- Redis for session management
- API response caching
- Database query result caching

## 🚨 Troubleshooting

### Common Issues

**1. Database Connection Errors**
```bash
# Check connection
docker-compose exec web python -c "from app.database.connection import test_database_connection; import asyncio; asyncio.run(test_database_connection())"

# Check PostgreSQL logs
docker-compose logs db
```

**2. Twilio Webhook Failures**
```bash
# Check webhook logs
docker-compose logs web | grep webhook

# Test webhook locally
curl -X POST http://localhost/webhook/whatsapp \
  -d "Body=test&From=whatsapp:+420123456789&To=whatsapp:+14155238886"
```

**3. High Memory Usage**
```bash
# Monitor container resources
docker stats

# Check application metrics
curl http://localhost/health
```

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
docker-compose restart web
```

## 📞 Support & Maintenance

### Daily Tasks
- ✅ Monitor error rates in Sentry
- ✅ Check system health metrics
- ✅ Review Twilio message delivery
- ✅ Verify database backups

### Weekly Tasks  
- ✅ Update security patches
- ✅ Review performance metrics
- ✅ Analyze user growth
- ✅ Check SSL certificate expiry

### Monthly Tasks
- ✅ Database maintenance and optimization
- ✅ Review and update dependencies
- ✅ Cost optimization analysis
- ✅ Security audit

## 💰 Cost Estimation

### Railway.app
- Hobby Plan: $5/month (suitable for development)
- Pro Plan: $20/month (recommended for production)
- PostgreSQL: $10/month
- **Total**: ~$30/month

### DigitalOcean
- App Platform: $12/month (1 vCPU, 512MB RAM)
- Managed PostgreSQL: $15/month
- **Total**: ~$27/month

### Self-hosted VPS
- VPS (2 vCPU, 4GB RAM): $20/month
- Backups and monitoring: $5/month
- **Total**: ~$25/month

## 📧 Production Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Twilio webhook URL updated
- [ ] SSL certificates installed
- [ ] Health checks configured
- [ ] Monitoring setup (Sentry)
- [ ] Error tracking configured
- [ ] Rate limiting configured
- [ ] Backup strategy defined

### Post-deployment
- [ ] Health check passing
- [ ] Webhook receiving messages
- [ ] Error tracking active
- [ ] Metrics being collected
- [ ] SSL working correctly
- [ ] Database performance acceptable
- [ ] Logs being generated properly

### Go-Live
- [ ] DNS configured
- [ ] Load balancer configured
- [ ] CDN configured (if applicable)
- [ ] Monitoring alerts configured
- [ ] On-call procedures defined
- [ ] Documentation updated

---

## 🎯 Success Metrics

Your ÚčetníBot is production-ready when:
- ✅ Health check returns 200 OK
- ✅ WhatsApp messages flow bidirectionally  
- ✅ Database transactions complete successfully
- ✅ Error rate < 1%
- ✅ Response time < 2 seconds
- ✅ Uptime > 99.5%

**Bot je připraven na špičkový provoz! 🚀**
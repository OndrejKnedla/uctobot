.PHONY: help install dev up down logs clean test migrate init db-create db-migrate db-upgrade db-downgrade db-seed db-reset db-backup db-restore

help:
	@echo "🚀 ÚčetníBot - Dostupné příkazy:"
	@echo ""
	@echo "  make install    - Instalace všech dependencies"
	@echo "  make dev        - Spustí celou aplikaci v Docker"
	@echo "  make up         - Spustí aplikaci na pozadí"
	@echo "  make down       - Zastaví aplikaci"
	@echo "  make logs       - Zobrazí logy všech služeb"
	@echo "  make logs-be    - Zobrazí logy backendu"
	@echo "  make logs-fe    - Zobrazí logy frontendu"
	@echo "  make logs-db    - Zobrazí logy databáze"
	@echo "  make clean      - Smaže Docker volumes a cache"
	@echo "  make test       - Spustí testy"
	@echo "  make migrate    - Spustí databázové migrace"
	@echo "  make init       - Inicializace databáze"
	@echo "  make dev-local  - Spustí lokální development (bez Docker)"
	@echo "  make status     - Zobrazí stav všech služeb"
	@echo ""
	@echo "🗄️ Databázové příkazy:"
	@echo "  make db-create  - Vytvoří databázi a spustí migrace"
	@echo "  make db-migrate - Vytvoří novou migraci (msg='popis')"
	@echo "  make db-upgrade - Aplikuje všechny migrace"
	@echo "  make db-downgrade - Vrátí poslední migraci"
	@echo "  make db-seed    - Naplní databázi demo daty"
	@echo "  make db-reset   - Resetuje databázi a vytvoří demo data"
	@echo "  make db-backup  - Vytvoří zálohu databáze"
	@echo "  make db-restore - Obnoví databázi ze zálohy (file=backup.sql)"

install:
	@echo "📦 Instaluji dependencies..."
	cd ucetni-whatsapp-bot && pip install -r requirements.txt
	cd uctobot-web && npm install

dev:
	@echo "🚀 Spouštím celou aplikaci v Docker..."
	docker-compose up --build

up:
	@echo "🚀 Spouštím aplikaci na pozadí..."
	docker-compose up -d --build

down:
	@echo "🛑 Zastavuji aplikaci..."
	docker-compose down

logs:
	@echo "📋 Zobrazuji logy všech služeb..."
	docker-compose logs -f

logs-be:
	@echo "📋 Zobrazuji logy backendu..."
	docker-compose logs -f backend

logs-fe:
	@echo "📋 Zobrazuji logy frontendu..."
	docker-compose logs -f frontend

logs-db:
	@echo "📋 Zobrazuji logy databáze..."
	docker-compose logs -f db

clean:
	@echo "🧹 Čistím Docker volumes a cache..."
	docker-compose down -v
	docker system prune -f
	cd uctobot-web && rm -rf .next node_modules
	find ucetni-whatsapp-bot -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

test:
	@echo "🧪 Spouštím testy..."
	cd ucetni-whatsapp-bot && python -m pytest tests/ -v

migrate:
	@echo "🗃️ Spouštím databázové migrace..."
	docker-compose exec backend alembic upgrade head

init:
	@echo "🗃️ Inicializuji databázi..."
	docker-compose exec backend alembic upgrade head

status:
	@echo "📊 Stav služeb:"
	docker-compose ps

# Rychlé spuštění bez Dockeru pro development
dev-local:
	@echo "🏠 Spouštím lokální development servery..."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/docs"
	@make -j 2 dev-backend dev-frontend

dev-backend:
	@echo "🔧 Spouštím backend server..."
	cd ucetni-whatsapp-bot && uvicorn app.main:app --reload --port 8000

dev-frontend:
	@echo "🎨 Spouštím frontend server..."
	cd uctobot-web && npm run dev

# Utility commands
db-shell:
	@echo "💾 Připojuji se k databázi..."
	docker-compose exec db psql -U postgres -d ucetnibot

backend-shell:
	@echo "🐍 Připojuji se k backend containeru..."
	docker-compose exec backend /bin/bash

frontend-shell:
	@echo "📦 Připojuji se k frontend containeru..."
	docker-compose exec frontend /bin/sh

# Health checks
health:
	@echo "🏥 Kontroluji zdraví služeb..."
	@echo "Backend:"
	@curl -s http://localhost:8000/health || echo "❌ Backend nedostupný"
	@echo ""
	@echo "Frontend:"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend nedostupný"
	@echo ""
	@echo "Database:"
	@docker-compose exec -T db pg_isready -U postgres && echo "✅ Database OK" || echo "❌ Database nedostupná"

# Quick setup for new users
setup:
	@echo "🎯 Rychlé nastavení pro nové uživatele..."
	@echo "1. Kopíruji .env soubory..."
	@test -f ucetni-whatsapp-bot/.env || cp ucetni-whatsapp-bot/.env.example ucetni-whatsapp-bot/.env
	@test -f uctobot-web/.env.local || echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > uctobot-web/.env.local
	@echo "2. Instaluji dependencies..."
	@make install
	@echo "3. Spouštím aplikaci..."
	@make dev

# Databázové příkazy
db-create:
	@echo "🗄️ Vytvářím databázi a spouštím migrace..."
	docker-compose up -d db
	sleep 5
	cd ucetni-whatsapp-bot && source venv/bin/activate && alembic upgrade head

db-migrate:
	@echo "📝 Vytvářím novou migraci: $(msg)"
	cd ucetni-whatsapp-bot && source venv/bin/activate && alembic revision --autogenerate -m "$(msg)"

db-upgrade:
	@echo "⬆️ Aplikuji všechny migrace..."
	cd ucetni-whatsapp-bot && source venv/bin/activate && alembic upgrade head

db-downgrade:
	@echo "⬇️ Vracím poslední migraci..."
	cd ucetni-whatsapp-bot && source venv/bin/activate && alembic downgrade -1

db-seed:
	@echo "🌱 Plním databázi demo daty..."
	cd ucetni-whatsapp-bot && source venv/bin/activate && python app/seeds.py

db-reset:
	@echo "🔄 Resetuji databázi..."
	docker-compose down -v
	docker-compose up -d db
	sleep 5
	cd ucetni-whatsapp-bot && source venv/bin/activate && alembic upgrade head
	cd ucetni-whatsapp-bot && source venv/bin/activate && python app/seeds.py

db-backup:
	@echo "💾 Vytvářím zálohu databáze..."
	docker exec ucetnibot-db pg_dump -U postgres ucetnibot > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Záloha vytvořena: backup_$(shell date +%Y%m%d_%H%M%S).sql"

db-restore:
	@echo "📥 Obnovuji databázi ze zálohy: $(file)"
	docker exec -i ucetnibot-db psql -U postgres ucetnibot < $(file)
	@echo "✅ Databáze obnovena"
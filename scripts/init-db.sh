#!/bin/bash
set -e

echo "🗃️ Inicializuji databázi pro ÚčetníBot..."

# Wait for postgres
echo "⏳ Čekám na PostgreSQL..."
until docker-compose exec -T db pg_isready -U postgres; do
  echo "   PostgreSQL ještě není připraven..."
  sleep 2
done

echo "✅ PostgreSQL je připraven!"

# Run migrations
echo "🔄 Spouštím migrace..."
docker-compose exec -T backend alembic upgrade head

echo "✅ Databáze je inicializována!"

# Show status
echo ""
echo "📊 Stav databáze:"
docker-compose exec -T db psql -U postgres -d ucetnibot -c "\dt"

echo ""
echo "🎉 Databáze je připravena k použití!"
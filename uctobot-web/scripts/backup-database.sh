#!/bin/bash

# 📦 ÚčtoBot Database Backup Script
# Automatické zálohování Supabase PostgreSQL databáze

set -e

# Konfigurace
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="uctobot_backup_$DATE.sql"

echo "🔄 Začínám zálohování databáze..."

# Vytvoření backup adresáře
mkdir -p $BACKUP_DIR

# Kontrola proměnných prostředí
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL není nastavena"
    exit 1
fi

# Extrakce údajů z DATABASE_URL
# Formát: postgresql://user:password@host:port/database
DB_URL=$DATABASE_URL
DB_HOST=$(echo $DB_URL | sed 's|.*@\([^:]*\):.*|\1|')
DB_PORT=$(echo $DB_URL | sed 's|.*:\([0-9]*\)/.*|\1|')
DB_NAME=$(echo $DB_URL | sed 's|.*/\([^?]*\).*|\1|')
DB_USER=$(echo $DB_URL | sed 's|.*://\([^:]*\):.*|\1|')
DB_PASSWORD=$(echo $DB_URL | sed 's|.*://[^:]*:\([^@]*\)@.*|\1|')

# Vytvoření zálohy pomocí pg_dump
echo "📊 Exportuji data z $DB_HOST:$DB_PORT/$DB_NAME..."

PGPASSWORD=$DB_PASSWORD pg_dump \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --verbose \
  --no-owner \
  --no-privileges \
  --format=custom \
  --file="$BACKUP_DIR/$BACKUP_FILE"

# Komprese zálohy
echo "🗜️ Kompresuje zálohu..."
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Výpis velikosti zálohy
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE.gz" | cut -f1)
echo "✅ Záloha dokončena: $BACKUP_FILE.gz ($BACKUP_SIZE)"

# Smazání starých záloh (starších než 30 dní)
echo "🧹 Mažu staré zálohy (>30 dní)..."
find $BACKUP_DIR -name "uctobot_backup_*.sql.gz" -mtime +30 -delete

echo "🎉 Záloha dokončena úspěšně!"
echo "📁 Záloha uložena: $BACKUP_DIR/$BACKUP_FILE.gz"

# Statistiky
TOTAL_BACKUPS=$(ls -1 $BACKUP_DIR/uctobot_backup_*.sql.gz 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh $BACKUP_DIR 2>/dev/null | cut -f1)
echo "📈 Celkem záloh: $TOTAL_BACKUPS (celková velikost: $TOTAL_SIZE)"
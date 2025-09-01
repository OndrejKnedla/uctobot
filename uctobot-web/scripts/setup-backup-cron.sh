#!/bin/bash

# 🕒 Nastavení automatických záloh přes CRON
# Spustí zálohu každý den ve 2:00 ráno

echo "⚙️ Nastavuji automatické denní zálohy..."

# Cesta k backup scriptu
SCRIPT_PATH=$(readlink -f ./scripts/backup-database.sh)
PROJECT_PATH=$(pwd)

# Cron job - každý den ve 2:00 ráno
CRON_JOB="0 2 * * * cd $PROJECT_PATH && $SCRIPT_PATH >> /var/log/uctobot-backup.log 2>&1"

# Přidání do cronu
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Automatické zálohy nastaveny!"
echo "📅 Zálohy budou spuštěny každý den ve 2:00"
echo "📝 Logy: /var/log/uctobot-backup.log"

# Zobrazení současných cron jobů
echo ""
echo "🔍 Aktuální cron jobs:"
crontab -l

echo ""
echo "💡 Pro ruční spuštění zálohy:"
echo "   ./scripts/backup-database.sh"
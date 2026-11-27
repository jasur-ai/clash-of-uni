#!/usr/bin/env bash
# Bir buyruqli deploy:  ./deploy.sh
set -e
cd "$(dirname "$0")"
echo "→ Vercelga deploy qilinmoqda..."
npx vercel deploy --prod --yes
echo "✅ Tayyor. Havolani Telegram @BotFather → Menu Button ga qo'ying."

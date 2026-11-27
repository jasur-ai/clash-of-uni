#!/usr/bin/env bash
# @hudud_2x_bot ni Vercel'dagi Mini App'ga ulash.
# Ishlatish:  TELEGRAM_BOT_TOKEN=... APP_URL=https://kampus.vercel.app ./bot-setup.sh
set -euo pipefail
: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN kerak}"
: "${APP_URL:?APP_URL kerak (masalan https://kampus-tdiu.vercel.app/)}"
BASE="${APP_URL%/}"

echo "1) Webhook -> $BASE/api/telegram"
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H 'Content-Type: application/json' \
  -d "{\"url\":\"$BASE/api/telegram\",\"allowed_updates\":[\"message\",\"edited_message\"],\"drop_pending_updates\":true}"; echo

echo "2) Menu Button (chap pastdagi tugma) -> $BASE"
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setChatMenuButton" \
  -H 'Content-Type: application/json' \
  -d "{\"menu_button\":{\"type\":\"web_app\",\"text\":\"KAMPUS\",\"web_app\":{\"url\":\"$BASE\"}}}"; echo

echo "3) Buyruqlar"
curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setMyCommands" \
  -H 'Content-Type: application/json' \
  -d '{"commands":[{"command":"start","description":"KAMPUS o‘yinini ochish"},{"command":"help","description":"Yordam"}]}'; echo

echo "4) Holat"
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getWebhookInfo"; echo

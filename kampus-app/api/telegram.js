// Telegram webhook — @hudud_2x_bot uchun (Vercel serverless funksiya)
// Vercel'da avtomatik /api/telegram manzilida ishlaydi.
// Kerakli env: TELEGRAM_BOT_TOKEN, APP_URL (ixtiyoriy), TELEGRAM_WEBHOOK_SECRET (ixtiyoriy)

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.APP_URL || '';

async function call(method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.json();
}

function mainKeyboard(appUrl) {
  return {
    inline_keyboard: [[{ text: '🏛 KAMPUSni ochish', web_app: { url: appUrl } }]],
  };
}

module.exports = async (req, res) => {
  // Telegram faqat POST yuboradi; boshqa so'rovlarga "ok" qaytaramiz
  if (req.method !== 'POST') return res.status(200).json({ ok: true, service: 'kampus-bot' });
  if (!TOKEN) return res.status(500).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN yoq' });

  // ixtiyoriy xavfsizlik tekshiruvi
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) {
    return res.status(401).json({ ok: false });
  }

  let upd = req.body;
  if (typeof upd === 'string') { try { upd = JSON.parse(upd); } catch (e) { upd = {}; } }
  upd = upd || {};

  const appUrl = APP_URL || `https://${req.headers.host}/`;
  const msg = upd.message || upd.edited_message;

  try {
    if (msg && msg.text && msg.text.trim().startsWith('/start')) {
      const name = (msg.from && msg.from.first_name) || 'do‘stim';
      await call('sendMessage', {
        chat_id: msg.chat.id,
        parse_mode: 'HTML',
        text:
          `<b>Assalomu alaykum, ${name}!</b>\n\n` +
          `Bu — <b>KAMPUS · TDIU</b>: Chilonzor va Yunusobod tumanlari raqamli egizagi.\n` +
          `Universitet hududini bosib oling, binolarni kuchaytiring, talabalar bilan duelda bellashing.\n\n` +
          `Pastdagi tugmani bosing 👇`,
        reply_markup: mainKeyboard(appUrl),
      });
    } else if (msg && msg.text && msg.text.trim() === '/help') {
      await call('sendMessage', {
        chat_id: msg.chat.id,
        text:
          'Buyruqlar:\n/start — o‘yinni ochish\n/help — yordam\n\n' +
          'O‘yin ichida: bino ustiga bosing → “Kuchaytirish”. Darvoza (QR) orqali Bilim yig‘ing.',
        reply_markup: mainKeyboard(appUrl),
      });
    } else if (msg && msg.text) {
      await call('sendMessage', {
        chat_id: msg.chat.id,
        text: 'O‘yinni ochish uchun pastdagi tugmani bosing 👇',
        reply_markup: mainKeyboard(appUrl),
      });
    }
  } catch (e) {
    // Telegram qayta yubormasligi uchun baribir 200
  }
  return res.status(200).json({ ok: true });
};

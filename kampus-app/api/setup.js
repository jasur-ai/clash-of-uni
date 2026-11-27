// Bir marta ishga tushiriladigan sozlash: webhook + Menu Button + buyruqlar.
// Foydalanish: https://<domen>/api/setup?key=<SETUP_KEY>&url=https://<domen>/
// Env: TELEGRAM_BOT_TOKEN, SETUP_KEY

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SETUP_KEY = process.env.SETUP_KEY || 'kampus-setup';

module.exports = async (req, res) => {
  if (!TOKEN) return res.status(500).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN yoq' });
  const q = req.query || {};
  if (q.key !== SETUP_KEY) return res.status(401).json({ ok: false, error: 'key xato' });

  const base = q.url || `https://${req.headers.host}/`;
  const hook = `${base.replace(/\/$/, '')}/api/telegram`;

  const post = (m, p) =>
    fetch(`https://api.telegram.org/bot${TOKEN}/${m}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    }).then((r) => r.json());

  const out = {};
  out.webhook = await post('setWebhook', {
    url: hook,
    allowed_updates: ['message', 'edited_message'],
    drop_pending_updates: true,
  });
  out.menu = await post('setChatMenuButton', {
    menu_button: { type: 'web_app', text: 'KAMPUS', web_app: { url: base } },
  });
  out.commands = await post('setMyCommands', {
    commands: [
      { command: 'start', description: 'KAMPUS o‘yinini ochish' },
      { command: 'help', description: 'Yordam' },
    ],
  });
  return res.status(200).json({ ok: true, hook, out });
};

# KAMPUS: TDIU — deploy + bot qo'llanmasi (v0.3)

Bu papkada **tayyor Mini App** bor: `index.html` (≈2.0 MB, hamma narsa — three.js, 3D kampus,
**Chilonzor + Yunusobod tumanlarining 42 065 ta haqiqiy binosi**, o'yin mantiqi — ichida).
Server shart emas; bot uchun `api/` papkasidagi 2 ta serverless funksiya bor.

> **v0.3 da nima yangi:** butun Chilonzor va Yunusobod — **42 065 ta haqiqiy bino** (OSM konturlari:
> L, U, hovilli, minora+stilobat shakllari, to'rtburchak "karton" yo'q) + **4 234 ta ko'cha**;
> kampus hududi firuza rang bilan ajratilgan; draw call 592 → 104; bot ulandi.

---

## 0. ⚠️ Bot tokeni haqida — birinchi navbatda

Token chatda yozilgan bo'lsa, uni **darhol yangilang**:

```
BotFather → /mybots → @hudud_2x_bot → API Token → Revoke current token
```

Yangi tokenni **hech qayerga faylga yozmang** — faqat Vercel'ning *Environment Variables*
bo'limiga kiriting (`TELEGRAM_BOT_TOKEN`). Repo'ga tushsa, bot o'g'irlanadi.

---

## 1. Vercelga chiqarish — 3 xil yo'l

### Yo'l A — Drag & Drop (eng tez)
1. `kampus-app` papkasini yuklab oling (`index.html`, `vercel.json`, `package.json`, `api/`).
2. https://vercel.com/new → **Deploy → Browse** → papkani tashlang.
3. Framework: **Other**. Build command: bo'sh. Output directory: bo'sh.
4. **Deploy** → `https://<loyiha>.vercel.app`.

### Yo'l B — CLI
```bash
cd kampus-app
npx vercel login
npx vercel deploy --prod --yes
```

### Yo'l C — GitHub → Vercel (keyingi yangilanishlar uchun qulay)
```bash
cd kampus-app
git init && git add -A && git commit -m "KAMPUS TDIU v0.3"
git branch -M main
git remote add origin https://github.com/<account>/kampus-tdiu.git
git push -u origin main
```
Vercel → **Add New → Project → Import** → **Deploy**. Har `git push` da avtomatik qayta deploy.

### Environment Variables (Vercel → Settings → Environment Variables)
| Nomi | Qiymat | Kerakmi |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | BotFather bergan yangi token | **ha** (bot uchun) |
| `APP_URL` | `https://<loyiha>.vercel.app/` | tavsiya |
| `SETUP_KEY` | o'zingiz o'ylagan parol | ixtiyoriy |
| `TELEGRAM_WEBHOOK_SECRET` | tasodifiy satr | ixtiyoriy |

---

## 2. Botni ulash — `@hudud_2x_bot`

### 2.1 Eng sodda yo'l (Menu Button, 40 soniya)
```
BotFather → /mybots → @hudud_2x_bot → Bot Settings → Menu Button
→ Configure menu button → URL: https://<loyiha>.vercel.app
→ Button text: "KAMPUS"
```
Endi bot bilan suhbatning chap pastida doimiy tugma paydo bo'ladi.

### 2.2 To'liq Web App (havola: `t.me/hudud_2x_bot/kampus`)
```
BotFather → /newapp → @hudud_2x_bot → title: KAMPUS TDIU
→ Web App URL: https://<loyiha>.vercel.app → Short name: kampus
```

### 2.3 Webhook'ni avtomatik sozlash (repo ichida tayyor)
```bash
cd kampus-app
TELEGRAM_BOT_TOKEN=<yangi-token> APP_URL=https://<loyiha>.vercel.app ./bot-setup.sh
```
Skript 3 ish qiladi: `setWebhook` (`/api/telegram`), `setChatMenuButton`, `setMyCommands`
va oxirida `getWebhookInfo` bilan holatni ko'rsatadi.

Yoki brauzerdan bir marta:
```
https://<loyiha>.vercel.app/api/setup?key=<SETUP_KEY>&url=https://<loyiha>.vercel.app/
```

### 2.4 Bot nima qiladi
`/api/telegram.js` — `/start`, `/help` va boshqa xabarlarga javob beradi, ichida
**"🏛 KAMPUSni ochish"** `web_app` tugmasi bor. Foydalanuvchi ismi bilan salomlashadi.

---

## 3. Tekshirish ro'yxati
- [ ] Havola **HTTPS** (Vercel beradi) — Telegram HTTP qabul qilmaydi.
- [ ] Telefonda to'liq ekran (`expand()` kodda).
- [ ] iPhone'da pastki safe-area (nav tugmalari) ko'rinadi.
- [ ] Birinchi yuklanish: 2 MB fayl, CDN gzip bilan ≈1.2 MB → 4G'da ~2–3 s.
- [ ] `getWebhookInfo` da `last_error_message` yo'q.
- [ ] Ochilganda tepada "KAMPUS · TDIU" va xarita ustida TDIU/MOLIYA yorliqlari ko'rinadi.

---

## 4. Keyingi yangilanishlar

Manba kod: `../tsue3d/`
```bash
cd tsue3d
python3 fetch_districts.py     # OSM tile'lar (kesh: data/tiles/)
python3 build_districts.py     # -> build/districts.json (42 065 bino, 1.05 MB)
python3 fetch_roads.py         # ko'chalar (kesh: data/tiles_road/)
python3 build_roads.py         # -> build/roads.json (73 KB)
python3 build_v2.py            # -> tsue-campus-v3.html + ../kampus-app/index.html
```

---

## 5. Nima qilinmagan (keyingi sprint)

| Vazifa | Nega kerak |
|---|---|
| Server + `initData` HMAC tekshiruvi | Hozir progress `localStorage`da — cheat mumkin |
| Postgres + lazy tick | Reytinni hamma o'yinchi uchun umumiy qilish |
| Real savol banki (5 000) | Hozir 16 ta demo savol |
| Telegram Stars to'lovlari | Mavsum pass / kosmetika |
| Boshqa tumanlar (Yakkasaroy, Mirzo Ulug'bek) | Xarita kengayishi — skript tayyor, faqat ro'yxatga qo'shish |

Batafsil: `../tsue3d/KAMPUS-TDIU-tahlil.md` (7-bo'lim: yo'l xaritasi va byudjet).
Ma'lumot manbasi: **© OpenStreetMap contributors (ODbL)** — atributsiya o'yin ichida ko'rsatilgan.

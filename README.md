# Clash of Uni — KAMPUS: TDIU

**Telegram Mini App** — TDIU (Toshkent Davlat Iqtisodiyot Universiteti) kampusining
interaktiv 3D "digital twin" o'yini: Clash of Clans uslubida hudud egallash, upgrade,
QR check-in, duel, mavsum va fakultet urushlari. Butun Chilonzor va Yunusobod
tumanlari — **42 065 ta real bino** (OpenStreetMap) + 4 234 ta ko'cha, hammasi bitta
self-contained `three.js` HTML faylda.

## Repo tuzilishi

| Yo'l | Nima |
|---|---|
| `kampus-app/` | **Deploy qilinadigan tayyor app** — `index.html` (≈2 MB, hamma narsa ichida), `api/` (Vercel serverless: Telegram bot webhook), `vercel.json` |
| `tsue3d/` | Manba kod va hujjatlar — OSM fetch/build skriptlari (Python), `src/`, `vendor/`, oldingi versiyalar (v2, v3, game) |
| `image-search/` | Kampus foto-referenslar |
| `KAMPUS-LOYIHA-TARIXI.md` | To'liq loyiha tarixi va texnik hujjat (o'zbek tilida) |

> Katta, qayta tiklanadigan fayllar git'da yo'q: `tsue3d/data/tiles/` (61 MB OSM tile
> cache — `python3 fetch_districts.py` bilan tiklanadi) va `tsue3d/shots/` (comparison
> skrinshotlar). Ularning originali Google Drive'dagi `chat_for_game` arxivida saqlanadi.

## Lokal ishga tushirish

```bash
cd kampus-app
npm run dev        # yoki: python3 -m http.server 5173
```

Brauzerda: <http://localhost:5173>

## Vercel'ga deploy

Loyiha statik `index.html` + `api/*.js` serverless funksiyalardan iborat.
Vercel'da Project Root Directory = `kampus-app` qilib deploy qiling (framework: **Other**,
build/output bo'sh). Har bir push'da avtomatik qayta deploy.

Bot uchun Vercel → Settings → Environment Variables ga `TELEGRAM_BOT_TOKEN`
qo'shing (README: `kampus-app/README.md` — tokenni hech qachon repo'ga yozmang).
Batafsil: `kampus-app/README.md`.

Ma'lumot manbasi: © OpenStreetMap contributors (ODbL).

# Clash of Uni — KAMPUS: TDIU

**Telegram Mini App** — TDIU (Toshkent Davlat Iqtisodiyot Universiteti) kampusining
interaktiv 3D "digital twin" o'yini: Clash of Clans uslubida hudud egallash, upgrade,
QR check-in, duel, mavsum va fakultet urushlari. **Butun Toshkent** — 12 tuman
(Chilonzor 15 660 + Yunusobod 26 405 — **real OpenStreetMap**; qolgan 10 tuman
protsedural model) + 64 ta maskanning 3D modellari (universitetlar, litseylar,
maktablar, bog'chalar, ovqatlanish, xiyobonlar), TDIU binolarining ichki ko'rinishi
(xonalar), hammasi bitta self-contained `three.js` HTML faylda. v0.5 — jonli:
https://clash-of-uni.vercel.app/

## Repo tuzilishi

| Yo'l | Nima |
|---|---|
| `kampus-app/` | **Deploy qilinadigan tayyor app** — `index.html` (≈2.9 MB, hamma narsa ichida), `api/` (Vercel serverless: Telegram bot webhook), `vercel.json` |
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
build/output bo'sh). Push avtomatik deploy qilmaydi — Vercel connector orqali
`create_deployment` (git_source, main) chaqiriladi; keyin `get_deployment` bilan READY tekshiring.

Bot uchun Vercel → Settings → Environment Variables ga `TELEGRAM_BOT_TOKEN`
qo'shing (README: `kampus-app/README.md` — tokenni hech qachon repo'ga yozmang).
Batafsil: `kampus-app/README.md`.

Ma'lumot manbasi: © OpenStreetMap contributors (ODbL).

# Clash of Uni — KAMPUS: TDIU

**Telegram Mini App** — TDIU (Toshkent Davlat Iqtisodiyot Universiteti) kampusining
interaktiv 3D "digital twin" o'yini: Clash of Clans uslubida hudud egallash, upgrade,
QR check-in, duel, mavsum va fakultet urushlari. **Butun Toshkent** — 12 tuman, hammasi **real OpenStreetMap**
(12 tumanning hammasi haqiqiy OSM relation chegaralari) — jami **253 328 ta haqiqiy bino** + 8 844 ta haqiqiy ko'cha + 64 ta maskanning 3D modellari (universitetlar, litseylar,
maktablar, bog'chalar, ovqatlanish, xiyobonlar), TDIU binolarining ichki ko'rinishi
(xonalar). v0.8 — **lazy-loading** + foto-asosli landmarklar + **SAYR rejimi**: `index.html` ≈1.05 MB
(three.js + o'yin mantiqi ichida), tuman geometriyalari `kampus-app/data/*.bin` (13 fayl, 5.1 MB) —
kamera yaqinlashganda yuklanadi. Landmark modellar: **Chorsu bozori gumbazi, Toshkent teleminorasi (375 m),
Nest One (266 m), akademik litsey darvozasi**. **v0.8 — SAYR**: personaj (joystik / `W A S D`, `Shift`),
mashina (27 m/s), mototsikl (33 m/s), eng yaqin bino ichiga **E** bilan kirish (yurib kiriladigan interyer:
marmar foye, 8 ustun, qabul peshtaxtasi, 2 lift — hammasi kollayderli).
Batafsil: `tsue3d/KAMPUS-v0.7-yangilanish.md`. **v0.8 — jonli:**
https://clash-of-uni.vercel.app/

## Repo tuzilishi

| Yo'l | Nima |
|---|---|
| `kampus-app/` | **Deploy qilinadigan tayyor app** — `index.html` (≈7.1 MB, hamma narsa ichida), `api/` (Vercel serverless: Telegram bot webhook), `vercel.json` |
| `tsue3d/` | Manba kod va hujjatlar — OSM fetch/build skriptlari (Python), `src/`, `vendor/`, `build/` (districts.json/roads.json/campuses.json), `smoke.py`, oldingi versiyalar (v2, v3, game) |
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

> v0.7'da binolar `data/*.bin` orqali yuklanadi — `file://` bilan ochilmaydi,
> statik server kerak (yuqoridagilar shunday).

## Build + smoke test

```bash
python3 tsue3d/build_v2.py    # -> kampus-app/ (index.html + data/*.bin) + tsue-campus-v3.html
python3 tsue3d/smoke.py       # 79 ta tekshiruv (bin walk, HTTP, CSP, header'lar)
```

## Vercel'ga deploy

Loyiha statik `index.html` + `api/*.js` serverless funksiyalardan iborat.
Vercel'da Project Root Directory = `kampus-app` qilib deploy qiling (framework: **Other**,
build/output bo'sh). Push avtomatik deploy qilmaydi — Vercel connector orqali
`create_deployment` (git_source, main) chaqiriladi; keyin `get_deployment` bilan READY tekshiring.

Bot uchun Vercel → Settings → Environment Variables ga `TELEGRAM_BOT_TOKEN`
qo'shing (README: `kampus-app/README.md` — tokenni hech qachon repo'ga yozmang).
Batafsil: `kampus-app/README.md`.

Ma'lumot manbasi: © OpenStreetMap contributors (ODbL).

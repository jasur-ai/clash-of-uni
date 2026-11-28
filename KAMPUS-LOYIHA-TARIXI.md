# KAMPUS · TDIU — loyiha tarixi va to'liq texnik hujjat

> **Bu nima?** Butun suhbatning to'liq arxivi: foydalanuvchi promptlari, qilingan research,
> qabul qilingan qarorlar, har bir versiyada nima va **qanday** qilinganligi, xatolar,
> o'lchovlar, deploy va bot sozlash qadamlari — hammasi bitta faylda.
>
> **Kim uchun?** Yangi chat/model sessiyasida kontekstni tiklash, GitHub'ga yuklash va
> Vercel'ga deploy qilish uchun. Fayl o'z-o'zini to'liq ta'minlaydi — boshqa hech qanday
> hujjat o'qish shart emas.
>
> **Sana:** 2026-11-28 (v0.5 gacha yangilandi) · **Til:** o'zbek · **Loyiha papkasi:** `tsue3d/` (manba) + `kampus-app/` (deploy)

---

## 0. Bu faylni yangi chatda qanday ishlatish

Yangi chatda shunday yozing:

```
Quyidagi hujjat — mening KAMPUS:TDIU loyihamning to'liq tarixi.
Uni o'qib chiq va shu darajadan davom ettiramiz:
[faylni biriktirasiz yoki mazmunini joylaysiz]
Keyingi qadam: ...
```

Model hujjatdan loyihaning barcha kontekstini oladi: fayllar tuzilishi, formulalar,
ma'lumot formati, qurish buyruqlari, nimalar sinab ko'rilgani va nima ishlamagani.

---

## 1. Foydalanuvchi promptlari (xronologiya)

> Dastlabki promptlar sessiya xotirasidan qayta tiklangan (so'zma-so'z emas, mazmunan aniq).
> Har bir prompt ostida — qabul qilingan qaror.

### P1. Boshlang'ich talab
> **Telegram Mini App o'yini** kerak: egallanadigan hudud — **TSUE/TDIU ning butun kampusi**,
> va u **batafsil, haqiqiyga o'xshash 3D model** ko'rinishida bo'lsin.

**Qaror:** bitta HTML fayl (three.js ichida), OSM ma'lumotidan real geometriya,
Telegram WebApp API, Vercel'ga deploy.

### P2. Qamrov va sifat
> Kampus **to'liq** bo'lsin (faqat bitta bino emas), **fotosuratlarga o'xshasin**,
> renderlarni haqiqiy rasmlar bilan solishtirib yaxshilab bor.

**Qaror:** real foto-gallery'dan landshaft sxemasi olindi, 12 ta diqqatga sazovor bino
specifikatsiyasi (balandlik, qavat, fasad rangi) qo'lda yozildi.

### P3. O'sish mexanikalari
> **Barcha o'sish/egallash mexanizmlarini** tahlil qilib solishtir, keyin qo'sh.

**Qaror:** Clash of Clans, Pokemon GO, CoinHuntWorld, Tamagotchi-hacklar tahlil qilindi →
upgrade + QR check-in + duel + mavsum + faculty war — hammasi parallel qo'shildi (hech biri olib tashlanmadi).

### P4. Ikkinchi kampus
> **Moliya instituti** kampusi ham bo'lsin, xarita almashadigan qilib.

**Qaror:** 41.324383, 69.284067 — ikkinchi kampus, xarita almashtirish tugmasi.

### P5. Deploy
> **Vercel**ga chiqar, **Telegram Mini App** sifatida ishga tushir. **Har bir versiya parallel
> ishlab tursin** (eskisini o'chirmang).

**Qaror:** `kampus-app/` paketi + v0.1, v0.2, v0.3 HTML fayllar yonma-yon saqlanadi.

### P6. Bot
> **`t.me/hudud_2x_bot`** — buni ham qo'shib qo'y (BotFather'dan token berildi).

**Qaror:** `api/telegram.js` webhook + `api/setup.js` + `bot-setup.sh`.

### P7. Universitet "egasi" ko'rinishi
> **Universitetligi bilinib tursin** — qandaydir rang bilanmi yoki boshqacha qilib.

**Qaror:** firuza disk + chegara ring + "TDIU / MOLIYA" yorlig'i + tuman nomlari.

### P8. Butun tumanlar
> **Butun Chilonzor hamda Yunusobodni tuzib chiq.**

**Qaror:** bbox tiling bilan 42 065 bino + 4 234 ko'cha.

### P9. Shakl haqida
> **Unda bunaqa to'rtburchak emas.**

**Qaror:** protsedural "karton shahar" butunlay o'chirildi → har bir bino OSM'dagi haqiqiy kontur.

### P10. (joriy)
> Workspace'da butun chat tarixini MD qilib yuklab qo'y — promptlar, researchlar, hammasi.
> Boshqa chatda ochib, GitHub'ga yuklayman, keyin Vercel'ga deploy qilinadi.

**Qaror:** shu fayl.

---

## 2. Loyiha maqsadi va qabul mezonlari

| # | Talab | Holat |
|---|---|---|
| 1 | Telegram Mini App (WebView ichida ishlaydi) | ✅ |
| 2 | TDIU kampusi to'liq 3D, haqiqiyga o'xshash | ✅ 70 bino, 211 yo'l, 51 maydon |
| 3 | Moliya kampusi + xarita almashish | ✅ 132 bino, 145 yo'l |
| 4 | Egallashning barcha usullari | ✅ upgrade, QR, duel, mavsum, faculty war |
| 5 | Butun Chilonzor + Yunusobod | ✅ 42 065 bino, 4 234 ko'cha |
| 6 | Binolar to'rtburchak emas | ✅ real OSM konturlar |
| 7 | Universitet hududi rang bilan ajraladi | ✅ firuza #2fd6c0 |
| 8 | Bot ulangan | ✅ kod tayyor, deploy+token kerak |
| 9 | Vercel'ga deploy | ⏳ foydalanuvchi tomondan |
| 10 | Versiyalar parallel | ✅ v0.1 / v0.2 / v0.3 |

---

## 3. Research — o'rganilgan manbalar va xulosalar

### 3.1 TDIU kampusi haqida
| Manba | Olingan ma'lumot |
|---|---|
| `https://tsue.uz/en/university` | Kampus tarixi, fakultetlar ro'yxati, asosiy bino tavsifi |
| `https://tsue.uz/en/photo-galleries/1` | Haqiqiy fotosuratlar: rektorat minorasi (17 qavat), 1- va 2-o'quv korpuslari, Ilmiy-innovatsiya markazi, Iqtisodiyot gimnaziyasi, Akademik litsey, sport inshootlari |
| OpenStreetMap | Bino konturlari, yo'llar, yashil maydonlar |

**Natija:** har bir diqqatga sazovor bino uchun qo'lda spec yozildi: balandlik, qavat soni,
fasad rangi, oyna to'ri zichligi, tom turi.

### 3.2 Telegram Mini App
| Manba | Xulosa |
|---|---|
| `https://core.telegram.org/bots/webapps` | `expand()`, `setHeaderColor`, `setBackgroundColor`, `disableVerticalSwipes`, `DeviceStorage` 5 MB, **service worker ishlamaydi**, `performance_class` |
| `https://t.me/s/BotNews/90`, `/96` | Raqamli tovarlar uchun **Telegram Stars (XTR)** majburiy, Bot API 7.4+ |

**Qaror:** progress `localStorage`da (keyingi sprintda server + `initData` HMAC),
fayl bitta HTML — CDN'dan tez yuklanadi, SW kerak emas.

### 3.3 O'yin iqtisodiyoti
| Manba | Xulosa |
|---|---|
| `https://clashclock.com/calculator` | CoC TH egri chizig'i: TH18 = 25 M gold / 12 kun → bizning shkala 1:1000 |

**Qabul qilingan formulalar** (4-bo'limga qarang): upgrade narxi `240·1.55^(n-1)`,
vaqt `8·1.9^(n-1)` s, cap 10, HQ gate `14·1.32^(lvl-1)`.

### 3.4 Huquqiy/mahalliy
| Manba | Xulosa |
|---|---|
| `https://bondstonelaw.com/data-localisation-in-uzbekistan/` | **Qonun № 1125 (26.03.2026)** — shaxsiy ma'lumotlar O'zbekistonda saqlanishi kerak. Hozir shaxsiy ma'lumot yig'ilmaydi (faqat `first_name` toast uchun) → keyingi sprintda server shu talabga mos joyda bo'lishi kerak |

### 3.5 3D xarita texnologiyalari
| Manba | Xulosa |
|---|---|
| `https://developers.google.com/maps/billing-and-pricing/pricing` | Photorealistic 3D Tiles $6/1000 root tile, **offline keshlash ta'qiqlangan** → ToS buziladi |

**Qaror:** Google 3D Tiles ishlatilmaydi. Dronlar ham real loyihada qimmat.
OSM konturlari + protsedural fasad = eng arzon va qonuniy yo'l.

---

## 4. Texnik arxitektura

### 4.1 Fayllar daraxti

```
/home/user/
├── tsue3d/                        ← MANBA (build qilinadigan joy)
│   ├── data/                      ← xom OSM javoblari
│   │   ├── osm_raw.json           (379 KB)  kampus atrofi xom
│   │   ├── bld.json  land.json  roads.json  (asosiy kampus)
│   │   ├── fin_bld.json  fin_land.json  fin_roads.json  (Moliya)
│   │   ├── tiles/                 (60 ta bbox bo'lak — tuman binolari)
│   │   └── tiles_road/            (60 ta bbox bo'lak — ko'chalar)
│   ├── build/
│   │   ├── campuses.json          (110 KB)  ikkala kampus geometriyasi
│   │   ├── districts.json         (1.08 MB) 42 065 bino, base64 binary
│   │   └── roads.json             (74 KB)   4 234 ko'cha, base64 binary
│   ├── src/
│   │   ├── index.v2.template.html (5 KB)   HTML skelet + __DATA__/__DISTRICTS__/__ROADS__
│   │   ├── style.v2.css           (12 KB)  barcha UI
│   │   └── game.v2.js             (61 KB)  ~1200 satr: three.js, kamera, o'yin mantiqi, TG
│   ├── build_campuses.py          OSM → campuses.json
│   ├── fetch_districts.py         tuman binolari (tiling)
│   ├── build_districts.py         filtr + soddalashtirish + binary
│   ├── fetch_roads.py             ko'chalar (tiling)
│   ├── build_roads.py             ko'chalar binary
│   ├── build_v2.py                INJECTOR: src + build → bitta HTML
│   ├── tsue-campus-game.html      v0.1 (769 KB)
│   ├── tsue-campus-v2.html        v0.2 (849 KB)
│   ├── tsue-campus-v3.html        v0.3 (1.99 MB)  ← joriy
│   ├── KAMPUS-v0.2-yangilanish.md
│   ├── KAMPUS-v0.3-yangilanish.md
│   ├── KAMPUS-TDIU-tahlil.md      (30 KB) research va yo'l xaritasi
│   └── shots/                     13 ta QA skrinshot
│
└── kampus-app/                    ← DEPLOY PAKETI (Vercel'ga shu ketadi)
    ├── index.html                 (= tsue-campus-v3.html, 1.99 MB)
    ├── api/telegram.js            webhook (CommonJS, Node 18+ fetch)
    ├── api/setup.js               bir martalik sozlash
    ├── bot-setup.sh               curl bilan webhook + menu button
    ├── vercel.json                cleanUrls, CSP frame-ancestors, functions
    ├── package.json               v0.3.0, scripts
    ├── deploy.sh                  npx vercel deploy --prod --yes
    ├── .vercelignore
    └── README.md                  o'zbekcha deploy + bot qo'llanmasi
```

### 4.2 Build pipeline

```
OSM (Overpass) ──► fetch_*.py ──► data/*.json ──► build_*.py ──► build/*.json
                                                                      │
src/index.v2.template.html ──┐                                        │
src/style.v2.css ────────────┤                                        ▼
vendor/three.min.js ─────────┼──► build_v2.py ──► tsue-campus-v3.html + kampus-app/index.html
src/game.v2.js ──────────────┘        (matn almashtirish: __DATA__, __DISTRICTS__, __ROADS__)
```

`build_v2.py` — oddiy Python matn almashtiruvchi: shablonga CSS, three.js, JSON va JS'ni
`replace()` bilan tiqadi. Natija — **bitta fayl**, hech qanday tashqi so'rov yo'q
(Telegram WebView uchun ideal).

### 4.3 Dunyo koordinatalari

```python
WORLD_LAT0, WORLD_LON0 = 41.30930, 69.24990    # TDIU asosiy kampus = (0, 0)
M_LAT = 110574.0                               # 1° kenglik  ≈ metr
K_LON = 111320.0 * cos(radians(WORLD_LAT0))    # 1° uzunlik ≈ metr (Toshkentda ≈ 83 630)

x = (lon - WORLD_LON0) * K_LON
z = -(lat - WORLD_LAT0) * M_LAT      # shimol = -z (three.js: kamera -z ga qaraydi)
```

Natijada: kampus markazi (0,0), Moliya kampusi ≈ (2857, −1668),
butun tumanlar ≈ x ∈ [−8446, 7873], z ∈ [−9878, 9591] (≈16×19 km).

---

## 5. Ma'lumot yig'ish — uch bosqich

### 5.1 Overpass: nima ishladi, nima ishlamadi

| Endpoint / usul | Natija |
|---|---|
| `overpass-api.de` | **406 Not Acceptable** |
| `kumi.systems`, `private.coffee` | timeout |
| **`maps.mail.ru/osm/tools/overpass/api/interpreter`** | ✅ ishlaydi |
| `area(360002441810)` (butun tuman) | ❌ **504 gateway timeout** |
| `way["building"](area.a)(bbox)` | ❌ **0 natija** (area bu mirror'da yaratilmaydi) |
| `way["building"](41.26,69.19,41.28,69.21)` | ✅ **2 668 way / 7.4 s** |

**Xulosa:** `area()` umuman ishlatilmaydi. Faqat **raqamli bbox** + o'zimiz poligon bo'yicha filtrlaymiz.

### 5.2 Kampus (v0.1 / v0.2)

```overpassql
[out:json][timeout:90];
(
  way["building"](around:900,41.3093,69.2499);
  way["highway"](around:900,41.3093,69.2499);
  way["landuse"](around:900,41.3093,69.2499);
);
out geom tags;
```

`build_campuses.py` buni tayyorlaydi:
- konturlarni poligon qilib yig'adi, maydon va markazni hisoblaydi,
- balandlikni `height` → `building:levels × 3.2` → bino turi bo'yicha taxmin qiladi,
- 12 ta diqqatga sazovor binoga **qo'lda yozilgan** balandlik/rang beradi,
- yo'llarni `highway` toifasi bo'yicha kenglikka aylantiradi,
- maydonlarni `landuse`/`leisure` bo'yicha guruhlaydi.

Natija: `build/campuses.json` — **main: 70 bino / 211 yo'l / 51 maydon**,
**finance: 132 bino / 145 yo'l / 13 maydon**.

### 5.3 Tumanlar (v0.3) — 60 ta bo'lak

Tuman chegaralari Overpass'dan **relation** sifatida olindi va ring yig'ildi:

| Tuman | relation | lat | lon | ring nuqta |
|---|---|---|---|---|
| Chilonzor | **2441810** | 41.2226 … 41.3119 | 69.1489 … 69.2600 | 611 |
| Yunusobod | **2448072** | 41.3094 … 41.3986 | 69.2280 … 69.3441 | 563 |

Bino so'rovi (har bo'lak uchun):

```overpassql
[out:json][timeout:90];
way["building"](41.26000,69.19000,41.28000,69.21000);
out geom tags;
```

- Bo'lak: **0.02° ≈ 2.2 km**, jami **60 ta**, 4 oqimda parallel → **~3.5 daqiqa**
- Xom natija: **118 969 way** (dedupe'dan keyin noyob) → poligon filtri → **42 065 bino**
- Filtrlash: markaz nuqtasi tuman poligoni ichidami (ray-casting), maydon ≥ **30 m²**
- Soddalashtirish: **Douglas–Peucker 1.6 m** (12 nuqtadan ko'p bo'lsa 3.5 m)

Ko'chalar (alohida kesh `data/tiles_road/`, xuddi shu 60 bo'lak):

```overpassql
[out:json][timeout:90];
way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential)$"]
   (41.26000,69.19000,41.28000,69.21000);
out geom;
```

→ **4 234 yo'l**, DP 2.5 m.

### 5.4 Siqish formati (muhim — takrorlash uchun)

JSON 9 MB bo'lardi. Buning o'rniga **binary + delta + base64**:

```
binolar:
  uint32  count
  takrorlanadi:
    int16   x0, z0        ← birinchi nuqta (metr, dunyo koordinatasi)
    uint8   n             ← nuqtalar soni
    uint8   h             ← balandlik (metr, 3..90)
    (n-1) × int16 dx, int16 dz    ← oldingi nuqtaga nisbatan delta

ko'chalar:
  takrorlanadi:
    uint8   class         ← 1=motorway/trunk, 2=primary, 3=secondary, 4=tertiary, 5=residential
    uint8   n
    int16   x0, z0
    (n-1) × int16 dx, int16 dz
```

**Dekoder (JS):**

```js
function decodeDistrict(b64) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const dv = new DataView(u8.buffer);
  let off = 0;
  const n = dv.getUint32(off, true); off += 4;
  const out = [];
  for (let i = 0; i < n; i++) {
    const x0 = dv.getInt16(off, true), z0 = dv.getInt16(off + 2, true);
    const cnt = dv.getUint8(off + 4), h = dv.getUint8(off + 5);
    off += 6;
    const pts = [[x0, z0]];
    let px = 0, pz = 0;
    for (let k = 1; k < cnt; k++) {
      px += dv.getInt16(off, true); pz += dv.getInt16(off + 2, true); off += 4;
      pts.push([x0 + px, z0 + pz]);
    }
    out.push({ pts, h });
  }
  return out;
}
```

**O'lchamlar:**

| Fayl | Xom | Siqilgan (b64) | Bino/yo'l |
|---|---|---|---|
| `build/districts.json` | ~9 MB | **1 104 086 B** (1.08 MB) | 42 065 |
| `build/roads.json` | ~1.4 MB | **74 487 B** (73 KB) | 4 234 |

Int16 chegarasi ±32 767 m — dunyomiz 19 km, bemalol sig'adi.

---

## 6. 3D model va render

### 6.1 Bino generatori

Har bir bino `extrudeInto(sideBuilder, roofBuilder, pts, height, baseY, color, style)` orqali quriladi:

1. **Devorlar** — kontur bo'ylab to'rtburchaklar (har qirra = 2 uchburchak), UV oyna to'ri bo'yicha
   masshtablanadi: `uv.x = yig'indi_uzunlik / 3.2`, `uv.y = balandlik / 3.4` — shu bilan
   **deraza o'lchami barcha binoda bir xil** bo'lib qoladi (realistik ko'rinishning kaliti).
2. **Tom** — `THREE.ShapeGeometry` (kontur bo'yicha triangulyatsiya), y=balandlikda.
3. **Plinth** — bino tagida 0.6 m to'q rangli polosa (soya ta'siri).
4. **Rang** — balandlikka qarab HSL: past binolar issiqroq/kulrang, baland binolar sovuqroq/ko'kimtir.

Diqqatga sazovor binolar qo'shimcha detallar oladi (fasad ustunlari, peshayvon, minora+stilobat).

### 6.2 Materiallar

| Narsa | Material |
|---|---|
| Fasad | `MeshLambertMaterial` + canvas'da generatsiya qilingan **oyna teksturasi** (`TEX.panel`), `vertexColors: true` |
| Tom | `MeshLambertMaterial` + `TEX.roof` (yumshoq shag'al naqshi) |
| Shahar tomi (v0.3) | `cityRoofMat` — teksturasiz, faqat vertex color (42 065 bino uchun tez) |
| Yer | `TEX.grass` (repeat 320×320) |
| Ko'cha | `TEX.asphalt` ribbon yoki tekis rang |
| Kampus yuzasi | `MeshBasicMaterial` firuza, `transparent`, `depthWrite: false` |

### 6.3 Moiré muammosi va uning yechimi (v0.2)

Birinchi urinishda yer yuzasida **"zebra" chiziqlar** (moiré) paydo bo'ldi. Sabab: bir-biriga
juda yaqin parallel tekisliklar (ground / city plane / street ribbon) va katta masofada
chuqurlik aniqligi.

**Yechim (hammasi birga):**

```js
logarithmicDepthBuffer: true          // chuqurlik aniqligi
camera near 3, far 14000 → 32000      // v0.3 da yana uzaytirildi
ground.position.y = -0.8              // qatlamlar orasidagi masofa
cityMesh.position.y = 0.01
street ribbon width 7 → 14            // ingichka lenta = moiré
material.color 0x8e9499 → 0xf4f6f9, emissive 0x161c24   // yorug'lik tekislanadi
STEP 158 → 205                        // to'r qadami
```

### 6.4 v0.3 render optimizatsiyasi (eng katta yutuq)

42 065 bino = 42 065 draw call bo'lardi. Uch qadam:

| Muammo | Yechim | Effekt |
|---|---|---|
| Har bino alohida mesh | **950 m chunk** bo'yicha merge (`walls` va `roofs` alohida) | ~150 mesh, frustum culling ishlaydi |
| Kampus yo'llari 356 ta mesh | `mergeGeos()` — barcha ribbon'lar bitta geometriyaga | −350 call |
| Uzoqdan hamma chunk ko'rinadi | `cam.r > 2600` → bitta **"far mesh"** (barcha tomlar + 14 m dan baland binolarning devorlari) | 592 → **104** call |

```js
/* far mesh namunasi */
if (b.h >= 14) extrudeInto(window.__farTall, window.__farTall, b.pts, b.h, 0, col, 'panel');
```

```js
/* loop ichida */
const farMode = cam.r > 2600;
if (farMode !== loop._farMode) {
  loop._farMode = farMode;
  for (const m of districtMeshes) m.visible = !farMode;
  if (farCityMesh) farCityMesh.visible = farMode;
  if (farTallMesh) farTallMesh.visible = farMode;
}
```

**O'lchandi** (420×820, dsf 2, SwiftShader — CPU render, real GPU'da ancha tez):

| Ko'rinish | Draw call | Uchburchak |
|---|---|---|
| Kampus (r≈520) | 68–75 | 25–50k |
| Shahar (r≈1500) | 79 | 39k |
| Butun shahar (r≈21000) | **104** | 157k |
| v0.2 (solishtirish uchun) | 346 | 16k |

### 6.5 Kamera va boshqaruv

```js
cam = { tx, tz, r, theta, phi }   // target + sfera koordinatalari
```

- `flyTo(id)` — **to'rtala parametr** birga o'rnatiladi; masofa > 400 m bo'lsa **sakraydi** (lerp emas),
  aks holda kamera shaharning ustidan "uchib" o'tib, yo'qoladi.
- Fog masofaga moslashadi: `fog.near = max(420, r*1.35)`, `fog.far = max(1600, r*4.2)`.
- Yorliqlar: `r > 2200` da bino yorliqlari o'chadi, tuman/kampus yorliqlari qoladi.
- Yorliqlar kameraga qarab masshtablanadi (`d * 0.075`), ekranda doimiy o'lchamda turadi.

---

## 7. O'yin mexanikasi (hammasi saqlanadi, hech biri olib tashlanmagan)

### 7.1 Iqtisod formulalari

```
Kuchaytirish narxi (Mablag'):   240 · 1.55^(n-1)
Kuchaytirish narxi (Bilim'):     40 · 1.45^(n-1)
Kuchaytirish vaqti:               8 · 1.9^(n-1)  sekund
Maksimal daraja:                 10
HQ darvoza (boshqa bino uchun):  14 · 1.32^(lvl-1)
```

### 7.2 Egallashning 4 usuli

| Usul | Mexanika | Mukofot |
|---|---|---|
| **Kuchaytirish** | Bino ustiga bosib resurs sarflash | +Nufuz, bino darajasi |
| **QR check-in** | Fakultet darvozasidagi QR: `TDIU-*` / `MOLIYA-*` | +80 Bilim, +15 Nufuz |
| **Duel** | Bot bilan savol-javob jangi; aniqlik 0.55–0.8, zarar `10 + 14·speed` | G'alaba = hudud |
| **Mavsum** | Haftalik reyting + "Nazorat ro'yxati" topshiriqlari | Mavsum mukofoti |

Qo'shimcha: **faculty war** — fakultetlar jamoaviy reytingi.

### 7.3 Rollar va ID'lar (real OSM node id'lari)

**Asosiy kampus:** `hq 149530194` (17 qavat), `innovation 149530196`, `flow 1154762660`,
`edu 149530198`, `money 180776564`, `energy 181413037`

**Moliya kampusi:** `hq 32973414`, `edu 32973599`, `money 32973617`, `flow 32973664`,
`energy 32490462`, `innovation 32973659`

### 7.4 Saqlash
`localStorage` (Telegram `DeviceStorage` ham mumkin). Server yo'q → cheat mumkin, bu
keyingi sprintning 1-raqamli vazifasi (`initData` HMAC).

---

## 8. Versiyalar tarixi

### v0.1 — `tsue-campus-game.html` (769 KB)
- Asosiy kampus, OSM'dan real geometriya
- 231 draw call, 14 144 uchburchak, `errs []`
- Upgrade + QR + duel ishlaydi

### v0.2 — `tsue-campus-v2.html` (849 KB)
- **Moliya kampusi** qo'shildi + xarita almashtirish
- **Haqiqiy deraza fasadlari** (canvas tekstura, UV = metr/3.2 — barcha binoda bir xil oyna)
- 17 qavatli rektorat minorasi, protsedural shahar (`fillerCity`)
- Egallashning 4 usuli + mavsum + faculty war
- **Moiré tuzatildi** (5.3 ga qarang)
- Telegram init kengaytirildi: `TG_USER`, `setBackgroundColor`, `disableVerticalSwipes`,
  ism bilan salomlashish toast'i
- 346 draw call, desktop skrinshot tasdiqlandi

### v0.3 — `tsue-campus-v3.html` (1.99 MB)
*(batafsil: 8.1 bo'lim v0.4/v0.5)*
- **42 065 haqiqiy bino** (Chilonzor 15 660 + Yunusobod 26 405)
- **4 234 ko'cha** (6 toifa, kenglik bo'yicha)
- Protsedural "karton shahar" **butunlay o'chirildi** → real konturlar
- **Kampus firuza rang bilan ajraladi** + TDIU/MOLIYA yorliqlari + tuman nomlari
- Chunk merge + far mesh: **592 → 104 draw call**
- Bot: `api/telegram.js`, `api/setup.js`, `bot-setup.sh`
- Kampus atrofidagi 430 m radiusdagi OSM binolari chiqarildi (model bilan z-fighting bo'lmasin)

---

### v0.4 — `tsue-campus-v3.html` (2 816 KB)
- **Butun Toshkent: 12 tuman** — Chilonzor 15 660 + Yunusobod 26 405 (real OSM), qolgan 10 tasi Voronoi-clip protsedural (jami 74 469 bino)
- 20 park, 1 879 daraxt (InstancedMesh), 4 code-built landmark (Tashkent City 266 m, Humo Arena, aylanuvchi Magic City charchpalagi, Ice City)
- Kunduzgi osmon, tuman-bo'yicha fasad palitralari (DIST_STYLE), emoji → inline SVG ikonlar
- farMode → 5 200 m, zoom max 26 000, landmark yorliqlari ≤14 km, LM_FLY fly-to
- PR #3 → main `0377938` · deploy `dpl_C27UTxRazNnvDD7KFMKBbJHQpujm` → clash-of-uni.vercel.app

### v0.5 — `tsue-campus-v3.html` (2 889 KB) ← **joriy**
- **Har bir tuman binosi tanlanadi** — merged-chunk yuz → bino xaritasi (faceMap + ikkilik qidiruv): balandlik/qavat, tuman, material, OSM/protsedural belgisi
- **TDIU binolari ichida** — 3 tab (Ma'lumot/Xonalar/Ichki ko'rinish): dollhouse kesma, qavat tanlash, rolga qarab generatsiya qilingan xonalar (nom, o'lcham, ~m²), bosilganda halqa + ma'lumot
- **64 ta maskan, har biri o'z 3D modeli** — 11 universitet (portik+gumbaz+fronton), 6 litsey, 6 maktab, 6 bog'cha, 6 ovqatlanish, 4 o'quv markazi, 3 spot (TV minorasi/Oloy bozori/Mustaqillik maydoni), 22 xiyobon (fontan)
- Shahar hayoti: 10 avenyu, 1 529 ko'cha chirog'i, 26 harakatlanuvchi mashina, HQ'larda O'zbekiston bayrog'i, bosh kampus fontani, Universitetlar quick-fly grid
- PR #4 → main `18dc519` · deploy `dpl_Di5ah5fEQ6DcUXr3VqB3HaTg1Avd` (READY/PROMOTED) → clash-of-uni.vercel.app

---

## 9. Xatolar va boshi berk yo'llar (takrorlamang!)

| # | Muammo | Sabab | Yechim / qaror |
|---|---|---|---|
| 1 | Overpass 406 | `overpass-api.de` UA/blogan | `maps.mail.ru` mirror |
| 2 | Tuman so'rovi 504 | bitta ulkan so'rov | 0.02° bo'laklarga bo'lish |
| 3 | `area()` 0 natija | mirror area generatsiya qilmaydi | **umuman ishlatmang** — bbox + o'z poligon filtri |
| 4 | Moiré "zebra" | yaqin parallel tekisliklar + chuqurlik | `logarithmicDepthBuffer` + qatlamlarni ajratish + kengroq ribbon |
| 5 | Moliya kampusi bo'sh ko'rinadi | `flyTo` to'liq bo'lmagan parametrlar | 4 ta parametr birga + masofa > 400 da snap |
| 6 | Shahar bo'sh/uchib turadi | fog noto'g'ri masshtabda | `fog` `cam.r` ga bog'landi |
| 7 | Vercel connector 830 KB faylni olmadi | connector payload cheklovi | foydalanuvchi qo'lda deploy qiladi (drag&drop/CLI/GitHub) |
| 8 | Playwright'da 2-sahifa `goto` timeout | SwiftShader bitta kontekstda | har viewport uchun alohida browser |
| 9 | Google 3D Tiles | ToS: offline kesh ta'qiqlangan, $6/1000 tile | ishlatilmaydi |
| 10 | `mergeGeos is not defined` | kod noto'g'ri joyga (funksiya ichiga) kiritildi | funksiya `world` guruhidan **oldin**, global scope'da bo'lishi kerak |

---

## 10. Telegram Mini App va bot

### 10.1 O'yin ichidagi TG init (`game.v2.js`)

```js
let TG_USER = null;
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#0b1220');
  tg.setBackgroundColor('#0b1220');
  tg.disableVerticalSwipes?.();
  TG_USER = tg.initDataUnsafe?.user || null;
  window.TG_USER = TG_USER;
  if (TG_USER?.first_name) toast(`Salom, ${TG_USER.first_name}!`);
}
```

### 10.2 Webhook — `kampus-app/api/telegram.js`

```js
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.APP_URL || '';

async function call(method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.json();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });
  if (!TOKEN) return res.status(500).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN yoq' });

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret)
    return res.status(401).json({ ok: false });

  const upd = req.body || {};
  const msg = upd.message || upd.edited_message;
  const appUrl = APP_URL || `https://${req.headers.host}/`;

  if (msg?.text?.startsWith('/start')) {
    await call('sendMessage', {
      chat_id: msg.chat.id, parse_mode: 'HTML',
      text: `<b>Assalomu alaykum, ${msg.from?.first_name || 'do‘stim'}!</b>\n\n` +
            `Bu — <b>KAMPUS · TDIU</b>: Chilonzor va Yunusobod tumanlari raqamli egizagi.`,
      reply_markup: { inline_keyboard: [[{ text: '🏛 KAMPUSni ochish', web_app: { url: appUrl } }]] },
    });
  }
  return res.status(200).json({ ok: true });
};
```

### 10.3 Sozlash — `bot-setup.sh`

```bash
TELEGRAM_BOT_TOKEN=<token> APP_URL=https://<loyiha>.vercel.app ./bot-setup.sh
```

Skript: `setWebhook` (`/api/telegram`), `setChatMenuButton` (web_app), `setMyCommands`,
`getWebhookInfo` bilan tekshirish.

### 10.4 ⚠️ Token xavfsizligi
Token chatda yozilgan edi → **BotFather → `/mybots` → API Token → Revoke current token**.
Yangi token faqat Vercel *Environment Variables*da (`TELEGRAM_BOT_TOKEN`), repoda **yo'q**.

---

## 11. Deploy — Vercel

### 11.1 Environment variables

| Nomi | Qiymat | Kerakmi |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | yangi token | ha (bot uchun) |
| `APP_URL` | `https://<loyiha>.vercel.app/` | tavsiya |
| `SETUP_KEY` | o'zingiz o'ylagan parol | ixtiyoriy |
| `TELEGRAM_WEBHOOK_SECRET` | tasodifiy satr | ixtiyoriy |

### 11.2 Uch yo'l

**A) Drag & drop:** https://vercel.com/new → `kampus-app` papkasini tashlash → Framework: **Other**,
build command bo'sh → Deploy.

**B) CLI:**
```bash
cd kampus-app && npx vercel login && npx vercel deploy --prod --yes
```

**C) GitHub:**
```bash
cd kampus-app
git init && git add -A && git commit -m "KAMPUS TDIU v0.3"
git branch -M main
git remote add origin https://github.com/<account>/kampus-tdiu.git
git push -u origin main
# Vercel → Add New → Project → Import → Deploy (keyin har push avtomatik deploy)
```

> `.vercelignore` va `.gitignore` ichida `api/.env`, `*.token` kabi fayllar bo'lmasin —
> token faqat env'da.

### 11.3 Tekshirish ro'yxati
- [ ] HTTPS (Telegram HTTP qabul qilmaydi)
- [ ] Telefonda to'liq ekran (`expand()`)
- [ ] iPhone safe-area pastki nav uchun joy qoldirilgan
- [ ] Birinchi yuklanish 2–3 s (2 MB, gzip ~1.2 MB)
- [ ] `getWebhookInfo` da `last_error_message` yo'q
- [ ] Ochilganda "KAMPUS · TDIU" + TDIU/MOLIYA yorliqlari

---

## 12. QA — qanday sinovdan o'tkazilgan

Playwright + Chromium (SwiftShader, mobil viewport 420×820, dsf 2):

```python
b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader',
                            '--enable-unsafe-swiftshader'])
pg = b.new_page(viewport={'width':420,'height':820}, device_scale_factor=2)
pg.on('pageerror', lambda e: errs.append(str(e)))
pg.goto('file:///home/user/tsue3d/tsue-campus-v3.html')
```

**Funksional test natijasi (v0.3):**
```
panel: True
build: 2            ← upgrade ishladi
lvl: 2
visited: {"149530198": true}     ← QR check-in yozildi
owner: {"180776564": 0}          ← hudud egasi o'zgardi
duel closed: True
stats [duelWin, duelLose, nufuz] = [0, 0, 450]
errs []                          ← hech qanday JS xatosi yo'q
```

Skrinshotlar: `tsue3d/shots/` — `v3-01-main.png` (kampus), `v3-03-city.png` (shahar 3D),
`v3-05-overview.png` (butun shahar), `v3-07-desktop.png` (1280×800).

---

## 13. Keyingi qadamlar (prioritet bo'yicha)

1. **Deploy + bot** — `kampus-app` ni Vercel'ga chiqarish, env'lar, `bot-setup.sh`.
2. **Server + `initData` HMAC** — progress'ni serverda saqlash (cheat'ni yo'q qilish),
   umumiy reyting, O'zbekiston hududida saqlash (Qonun № 1125).
3. **Boshqa tumanlar** — `fetch_districts.py` dagi `DISTRICTS` lug'atiga yangi `relation` id
   qo'shish kifoya (Yakkasaroy, Mirzo Ulug'bek, Shayxontohur…). Har tuman ≈ +25 daqiqa ishlov.
4. **Binolarga protsedural detallar** — tomdagi lift shaxtasi, kirish portigi, ayvon
   (OSM'da yo'q, bino turiga qarab generatsiya qilinadi).
5. **Real savol banki** — 16 demo savol → 5 000 (fakultet bo'yicha).
6. **Telegram Stars** — mavsum pass / kosmetika.
7. **Fotogrammetriya (L2)** — faqat rektorat minorasi uchun, agar byudjet bo'lsa.

---

## 14. Atributsiya va litsenziya

- Bino va yo'l geometriyasi: **© OpenStreetMap contributors, ODbL 1.0**
  (o'yin ichida "Mavsum → Nazorat ro'yxati" va README'da ko'rsatilgan).
- three.js — MIT.
- TDIU nomi/logotipi — faqat ta'lim maqsadida; tijoriy ishlatishdan oldin universitetdan
  ruxsat olish tavsiya etiladi.

---

## 15. Ilova — tezkor ma'lumot

### Buyruqlar
```bash
cd /home/user/tsue3d

python3 fetch_districts.py     # 60 bo'lak bino yuklash (~3.5 daq)
python3 build_districts.py     # filtr + binary → build/districts.json
python3 fetch_roads.py         # 60 bo'lak ko'cha yuklash (~3.5 daq)
python3 build_roads.py         # → build/roads.json
python3 build_campuses.py      # kampuslar (odatda o'zgarmaydi)
python3 build_v2.py            # → tsue-campus-v3.html + ../kampus-app/index.html
```

### Koordinatalar
```
TDIU asosiy kampus : 41.30930, 69.24990   → dunyo (0, 0)
Moliya instituti   : 41.324383, 69.284067 → dunyo (≈2857, ≈-1668)
Chilonzor markazi  : 41.2672, 69.2045
Yunusobod markazi  : 41.3540, 69.2860
```

### Muhim konstantalar (`game.v2.js`)
```js
const CHUNK = 950;                 // chunk o'lchami (m) — bino merge to'ri
/* v0.3 da protsedural to'r (STEP=205) butunlay olib tashlandi:
   shahar endi haqiqiy OSM binolaridan quriladi */
const farMode = cam.r > 2600;      // far mesh chegarasi
camera: near 3, far 32000
ground: PlaneGeometry(26000, 26000), y = -0.8
kampus rangi: 0x2fd6c0 (firuza)
```

### Fayl o'lchamlari
```
tsue-campus-game.html  v0.1   769 038 B
tsue-campus-v2.html    v0.2   848 712 B
tsue-campus-v3.html    v0.3 2 036 514 B
build/districts.json          1 104 086 B   (42 065 bino)
build/roads.json                 74 487 B   (4 234 ko'cha)
build/campuses.json             109 811 B   (202 bino, 356 yo'l, 64 maydon)
```


---

## 16. v0.4–v0.5 — butun shahar, har bino tanlanadi, ichki koʻrinish (2026-11-27…28)

> Bu boʻlim yangi sessiyalar uchun yozilgan: **nima qilingani** va **qanday qilinganligi**.
> Avval 7, 8, 12 boʻlimlarni oʻqing, keyin shu boʻlim.

### 16.1 Nima qilingani

**v0.4 (PR #3, main `0377938`):**
- Butun Toshkent — 12 tuman. Chilonzor (15 660) va Yunusobod (26 405) real OSM 2026-11 geometriyasi; qolgan 10 tuman `tsue3d/gen_city.py` bilan Voronoi-clip protsedural modeldan qurilgan (Olmazor 3 912, Uchtepa 5 564, Mirzo Ulugʻbek 1 950, Mirobod 2 169, Shayxontohur 5 565, Sergeli 3 060, Bektemir 2 296, Yashnobod 2 884, Yakkasaroy 2 765, Yangihayot 2 239). Jami **74 469 bino**.
- 20 park (tuman markazlarida), 1 879 daraxt — `InstancedMesh` (trunk+crown), 956…12 ta joy/tuman boʻyicha.
- 4 ta code-built landmark: **Tashkent City / Nest One** (41.3122, 69.2519, 266 m), **Humo Arena** (12 500 oʻrinlik, gumbaz), **Magic City** (41.3039, 69.2452 — aylanuvchi Ferris charchpalagi, `landmarkAnims`), **Ice City** (Yakkasaroy, Bobur 6).
- Kunduzgi osmon (gradient), tuman-boʻyicha fasad palitralari (`DIST_STYLE`), roof desaturatsiyasi, emoji butunlay olib tashlandi → inline SVG ikonlar.
- Kameralar: farMode chegarasi 5 200 m ga koʻtarildi, zoom max 26 000, landmark spritelari 14 km dan uzoqlashmasa koʻrinadi.

**v0.5 (PR #4, main `18dc519`):**
- **Har bir tuman binosi tanlanadi va maʼlumot beradi.** `pick()` endi: (1) aktiv ichki xonalarni tekshiradi, (2) pickables (POI hit-silindrlar + TDIU binolori), (3) `districtMeshes` boʻyicha faceMap (tri-range → bino indeksi) ikkilik qidiruv → `buildingInfoAt()` → `genericBuildingPanel()` — balandlik (m va ~qavat 3.4 m ga), tuman nomi (`DIST_NAME`), material (panel/shisha/classic), OSM 2026-11 yoki protsedural belgisi (`REAL_DATA`).
- **TDIU binolarida ichki koʻrinish (dollhouse).** Pannel tablari: `Maʼlumot | Xonalar | Ichki koʻrinish`. «Ichki koʻrinish» tanlansa: `wallsMesh/roofMesh/edgesMesh` yashiriladi, `ensureInterior(b)` qavatma-qavat guruh quradi — plita (slab), perimetr devor, xonalar va boʻluvchi devorlar. Xonalar rolga qarab generatsiya qilinadi (`ROOM_POOLS` hq/edu/money/flow/energy/innovation), `mulberry32(b.id*7919+101)` bilan deterministik. Xona nomi `Auditoriya 105` kabi, bosilganda `roomRing` + nom/oʻlcham/m². Maksimal 24 qavat.
- **Panel tablari oʻyinni buzmaydi:** yangilash/check-in/egallash faqat TDIU tabida, lekin doim `panelTab='info'` boshlanadi; `closePanel()` interiorni yopadi, `select()` interiorni chiqadi.
- **64 ta POI — har biri kategoriyasi boʻyicha 3D model** (`tsue3d/gen_pois.py` + `POI_BUILDERS`): 11 universitet (oq portik, ustunlar, fronton (`_triPrism`), koʻk gumbaz, bayroq), 6 akademik litsey (belgi paneli), 6 maktab (sport zal bilan), 6 bogʻcha (rangli tom, panjara, qumdon, sharlar), 6 ovqatlanish (chiziqli soyabon canvas tekstura, stollar+soyabonlar), 4 oʻquv markazi (shisha minora, neon chiziqlar), 3 spot (Toshkent TV minorasi nusxasi, Oloy bozori gumbazi, Mustaqillik maydoni — bayroq + abadiy olov), 22 xiyobon (fontan+skameyka+daraxtlar). POI — bosiladigan panel, «Yanada yaqinlashtirish» fly-to, yorliq masofaga qarab koʻrinadi (≤2 600 m).
- **Shahar hayoti:** 10 avenyu lentasi (`build/districts.json → avenues`), 1 529 koʻcha chirogʻi (42 m qadam, ikki tomonlama, instanced), 26 harakatlanuvchi mashina (InstancedMesh + `updateCars()`, `t += speed`), HQ binolarida Oʻzbekiston bayrogʻi (`flagMeshes`, shamolda tebranganish), bosh kampusda fontan.
- **Universitetlar quick-fly grid** — kampus overlayʼda 11 universitet tugmasi (`uni-grid`), bosishda kamera universitetga uchadi. «Digital Twin v0.5» yorligʻi.

### 16.2 Qanday qilinganligi (arxitektura va formatlar)

**Data pipeline (oʻzgarmagan zanjir):**
`fetch_*.py` (Overpass, faqat internet-mashina) → `tsue3d/build/*.json` (b64 binar) → `tsue3d/build_v2.py` (src/index.v2.template.html + style.v2.css + game.v2.js + three.min.js inline) → `kampus-app/index.html` (deploy) va `tsue3d/tsue-campus-v3.html`.

**Binary bino formati (`districts.json → districts.<tuman>.b64`):** uint32 count, keyin har bino: int16 x0,z0 (abs), uint8 cnt, uint8 h, undan keyin (cnt-1) marta int16 delta-px/pz. Dekoder — `decodeDistrict()`. Chunk merge: 950 m toʻr, 3 uslub chelasi (panel/classic/glass), har chunk uchun `faceMap=[{a,b,bIdx}]` (tri-indeks diapazonlari) + `userData.blds=[{cx,cz,h,key,hsh,style}]`.

**districts.json (v0.4+v0.5, 1.87 MB):** `{meta, districts, parks, trees, landmarks, pois[64], avenues[10], lamps[1529]}`. `gen_pois.py` POI koordinatalarini qoʻlda yozilgan lat/lon → dunyo (x,z) formulaga o’giradi: `x = (lon−69.2499)*K_LON`, `z = −(lat−41.3093)*M_LAT`, K_LON=111 320·cos(41.3093°), M_LAT=110 574. **Koordinata taxminiy** — rasman emas.

**draw call byudjeti:** chunk merge (2 942 mesh), trees/lamps/cars InstancedMesh, farMode panorama 5 200 m. POI modellari ~10–25 mesh × 64 — mobil uchun esa sinov kerak, hali oʻlchanmagan.

**Determinizm:** POI rotation — koordinata hash; xonalar/binolar rang jitter — `fract(sin(x*12.9898…)*43758.5453)`; TDIU xonalari — `mulberry32(b.id*7919+101)`.

### 16.3 QA va deploy

**Node stub smoke (`/tmp/smoke.js`, three.min.js real + WebGLRenderer stub):**
`INTERIORS-OK` (12 TDIU binosi), `FLOOR-SWITCH-OK` (qavat almashish + panel), `POI-PANEL-OK`, `FACE-MAP-OK h=32 key=chilonzor` (faceMap ikkilik qidiruv), `GEN-PANEL-OK` → **SMOKE PASS**. Emoji-skan: `✓`/`✕` dan boshqa yoʻq (python `re`).

**Deploy oqimi (oʻzgarmadi):** branch → PR → merge `main` → Vercel connector `create_deployment` (`git_source`, main, project `prj_K9ZjsgmDoICNc3hcvD4OfY1IjLTt`, team `team_66P4fjrngeXuucmcUOSpvGNe`) → `get_deployment` READY → `fetch_page https://clash-of-uni.vercel.app/`. Merge oʻzi deploy qilmaydi; Vercel git-suriluvchi deploylar o’chirilgan — har doim qoʻlda create_deployment. v0.4: `dpl_C27UTxRazNnvDD7KFMKBbJHQpujm`, v0.5: `dpl_Di5ah5fEQ6DcUXr3VqB3HaTg1Avd` (6 s build, READY/PROMOTED).

### 16.4 Hali qilinmagan / keyingi qadamlar

1. **10 ta tumanni real OSM’ga almashtirish** — `tsue3d/fetch_all_districts.py` ni internet-ulanadigan mashinada ishga tushiring, keyin `build_v2.py` + smoke + deploy.
2. **POI koordinatalarini aniqlashtirish** (OSM/Google orqali) — hozirgi joylashuv taxminiy; `gen_pois.py` POI roʻyxatining yagona manbai.
3. Mobil performance’ni o’lchash (POI modellari draw call yuki); kerak boʻlsa POI’larni chunk/far-mode’ga solish yoki LOD.
4. TDIU interyerlarini yanada boyitish (mebellar, eshiklar, lift/zamburugʻ joyi, qavat boʻyicha Navigator).
5. `README.md` v0.5’ga yangilandi; `KAMPUS-LOYIHA-TARIXI.md` shu boʻlim bilan toʻldi.

**Hujjat tugadi.** Savol bo'lsa — shu faylni yangi chatga bering va "davom etamiz" deb yozing.

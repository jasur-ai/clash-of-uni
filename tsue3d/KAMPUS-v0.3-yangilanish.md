# KAMPUS · TDIU — v0.3 yangilanishi

**Sana:** 2026-11-27 · **Fayl:** `tsue-campus-v3.html` (1.99 MB) · **Deploy:** `kampus-app/index.html`

---

## 1. Qisqa xulosa

| Nima so'ralgan | Nima qilindi |
|---|---|
| "butun Chilonzor hamda Yunusobodni tuzib chiq" | **42 065 ta haqiqiy bino** — Chilonzor 15 660, Yunusobod 26 405 (OpenStreetMap) |
| "to'rtburchak emas" | Protsedural to'rtburchak "karton shahar" **butunlay olib tashlandi**; har bir bino — OSM'dagi haqiqiy kontur (L, U, T, hovilli, yumaloq stadion, minora) |
| "universitetligi bilinib tursin" | Kampus yuzasi **firuza (0x2fd6c0)** rangda, chegarasi yorqin ring, ustiда "TDIU / MOLIYA" yorlig'i |
| "botni qo'shib qo'y" | `api/telegram.js` (webhook), `api/setup.js`, `bot-setup.sh` — `@hudud_2x_bot` uchun tayyor |

---

## 2. Ma'lumot yig'ish (eng katta ish)

Overpass'ning `area()` filtri bu mirror'da ishlamaydi (504 / 0 natija), shuning uchun **bbox tiling**:

```
[out:json][timeout:90];
way["building"](41.26000,69.19000,41.28000,69.21000);
out geom tags;
```

- 60 ta bo'lak (0.02° ≈ 2.2 km), 4 oqimda parallel → **~3.5 daqiqa**, xom holda 118 969 way.
- Tuman chegarasi `relation`dan yig'ildi (Chilonzor 611 nuqta, Yunusobod 563 nuqta) va
  **point-in-polygon** bilan filtrlandi.
- Douglas–Peucker 1.6 m, 30 m² dan kichik hovliqurilmalar tashlandi.
- Balandlik: `height` → `building:levels × 3.2` → turi bo'yicha (garaj 3 m … turar-joy 13 m), 3–90 m.
- Ko'chalar: 6 toifa (`motorway…residential`), 4 234 ta yo'l, DP 2.5 m.

### Siqish (binary + base64)

```
header: uint32 count
bino:   int16 x0, int16 z0, uint8 n, uint8 h
        keyin (n-1) × int16 dx, int16 dz      ← delta kodlash
```

| Ma'lumot | Xom JSON | Siqilgan (b64) |
|---|---|---|
| Binolar | ~9 MB | **1 078 KB** |
| Ko'chalar | ~1.4 MB | **73 KB** |

Butun o'yin: **1.99 MB** (bitta fayl). Vercel gzip bilan ≈1.2 MB transfer.

---

## 3. Render optimizatsiyasi

| Muammo | Yechim | Natija |
|---|---|---|
| 42 065 bino = 42 065 draw call | **950 m chunk** bo'yicha merge (walls + roofs alohida) | ~150 mesh, frustum culling ishlaydi |
| Kampus yo'llari 356 ta alohida mesh | `mergeGeos()` bilan birlashtirildi | −350 draw call |
| Uzoqdan hamma chunk ko'rinadi | `r > 2600` da **bitta birlashtirilgan "far mesh"** (barcha tomlar + 14 m dan baland binolar devorlari) | 592 → **104** draw call |

**O'lchandi** (420×820, dsf 2, SwiftShader):
- kampus ko'rinishi: **68–75** call, 25–50k tris
- umumiy ko'rinish: **104** call, 157k tris
- xato: `errs []`; o'yin oqimi (panel → upgrade → QR check-in → claim → duel) ishlaydi

---

## 4. Universitet hududi — qanday ajralib turadi

1. **Firuza disk** (`CircleGeometry`, r ≈ 360 m, opacity 0.13–0.20) — kampus zamini rangli.
2. **Yorqin chegara ring** (`0x37e0c8`, opacity 0.45).
3. **Katta yorliq**: "TDIU — Asosiy kampus" / "MOLIYA — Maliya kampusi" (kameraga qarab masshtablanadi).
4. Uzoqdan (r > 1400) tuman nomlari: **CHILONZOR**, **YUNUSOBOD** — kontur chizig'i bilan.
5. Kampus atrofidagi 430 m radiusdagi OSM binolari chiqarib tashlanadi — model bilan ustma-ust
   tushmasligi uchun (aks holda z-fighting).

---

## 5. Bot — `@hudud_2x_bot`

| Fayl | Vazifa |
|---|---|
| `kampus-app/api/telegram.js` | Webhook: `/start` (ism bilan salomlashish + Web App tugma), `/help`, boshqa xabarlar |
| `kampus-app/api/setup.js` | Bir marta: `setWebhook` + `setChatMenuButton` + `setMyCommands` |
| `kampus-app/bot-setup.sh` | Xuddi shu narsa curl bilan, terminaldan |

```bash
TELEGRAM_BOT_TOKEN=<token> APP_URL=https://<loyiha>.vercel.app ./bot-setup.sh
```

**Xavfsizlik:** token chatda yozilgan — BotFather → `/mybots` → **API Token → Revoke**.
Yangi token faqat Vercel Environment Variables'da saqlanadi, repoda emas
(`.vercelignore` + `.gitignore`).

---

## 6. Nima keyingi

1. **Boshqa tumanlar** — skript universal: `DISTRICTS` lug'atiga yangi `relation` id qo'shish kifoya
   (Yakkasaroy 2441xxx, Mirzo Ulug'bek …).
2. **Binolarni "yaxshilash"** — tomdagi lift shaxtalari, kirish portiklari, ayvonlar: OSM'da bu
   ma'lumot yo'q, shuning uchun bino turiga qarab protsedural qo'shiladi (keyingi sprint).
3. **Server + `initData` HMAC** — reytingni umumiy qilish uchun.
4. **Telegram Stars** — mavsum pass.

---

## 7. Atributsiya

Bino va yo'l geometriyasi: **© OpenStreetMap contributors, ODbL 1.0**.
O'yin ichida (Mavsum → "Nazorat ro'yxati") va README'da ko'rsatilgan.

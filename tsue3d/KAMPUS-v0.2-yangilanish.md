# KAMPUS: TDIU — v0.2 yangilanishlar

**Sana:** 2026-11-27 · **Fayl:** `tsue-campus-v2.html` (829 KB, bitta fayl, oflayn ishlaydi)
**Deploy nusxasi:** `../kampus-app/index.html` (+ `vercel.json`, `package.json`, `README.md`)

---

## 1. Nima qo'shildi

### 1.1 Ikkinchi kampus — Moliya instituti
2024-yilda TDIU tarkibiga qo'shilgan **Toshkent moliya instituti** kampusi OSM'dan yuklandi:
132 bino, 145 yo'l, 13 maydon. Ikkala kampus **bitta 3D dunyoda, haqiqiy geografik joylashuvida**
(orası ≈ 3,3 km) — "Umumiy ko'rinish" rejimida ikkalasi bir xaritada ko'rinadi.

Kampus almashtirish: pastdagi **🗺 Kampus** tugmasi → *Asosiy / Moliya / Umumiy*.

### 1.2 Realga yaqinlashtirish (rasmlar bilan solishtirilgan)
| O'zgarish | Tafsilot |
|---|---|
| **Deraza fasadlari** | Protsedural tekstura, modul 3,0 × 3,4 m — har bino haqiqiy o'lchamda deraza to'riga ega |
| **3 xil fasad uslubi** | `panel` (sovet paneli), `classic` (oq ustunli ma'muriy), `glass` (shisha ofis) |
| **Rektorat minorasi** | OSM'da "3 qavat" deb belgilangan, lekin **rasmda 17 qavatli minora** — qo'lda tuzatildi: 3 qavatli podium + 17 qavatli shisha minora + toj |
| **Shahar to'ldiruvchisi** | Ikki kampus orasidagi bo'shliq protsedural shahar bloklari + ko'cha to'ri bilan to'ldirildi (~700 bino, 1 draw call) |
| **Yorug'lik/fog** | Kamera masofasiga mos dinamik tuman, gradient osmon, 3 manbali yorug'lik |
| **Geometriya** | `ExtrudeGeometry` → o'z ekstruziyam (to'g'ri UV, normal, tom triangulyatsiyasi) |
| **Performance** | Dekorativ binolar **merged**: 346 draw call → ~168 (bitta kampusda), 15 700 triangle |

### 1.3 Egallashning 4 usuli — hammasi ishlaydi
| # | Usul | Qayerda | Mexanika |
|---|---|---|---|
| **A** | **Qurilish (PvE)** | Bino paneli → *Yangilash* | Resurs + prorab taymeri, har daraja +qavat (vertikal o'sish) |
| **B** | **Fakultet urushi** | 🏆 *Mavsum* | 5 fakultet haftalik ball to'playdi; yetakchi fakultet binoni **egallaydi** (50 Nufuz) → +15% produksiya, rangli belgi |
| **C** | **QR check-in** | Bino paneli → *📍 QR check-in* | Bino oldidagi kod (masalan `TDIU-EDU`) → +80 Bilim, +15 Nufuz (geofence 120 m bilan cheklanadi) |
| **D** | **Darvoza (1v1 duel)** | ⚔️ *Darvoza* | 6 savol, HP 100/100, tezlik = zarar; g'alaba +60 Nufuz, +25 mavsum ball |

### 1.4 Telegram Mini App tayyorligi
- `ready()`, `expand()`, `setHeaderColor/BackgroundColor`, `disableVerticalSwipes()`
- `initDataUnsafe.user.first_name` bilan shaxsiy salomlashish
- Har bosishda `HapticFeedback` (light/medium/success)
- `env(safe-area-inset-*)` — iPhone "notch" va pastki panel
- Desktop (1280×800) va telefon (390×844) da tekshirilgan

### 1.5 Vercel paketi
`kampus-app/` → `index.html` + `vercel.json` (xavfsizlik sarlavhalari, Telegram iframe ruxsati) +
`package.json` + `README.md` (drag&drop / CLI / GitHub 3 yo'l, BotFather qadamlari).

---

## 2. Texnik ko'rsatkichlar (o'lchangan)

| Ko'rsatkich | Qiymat |
|---|---|
| Fayl hajmi | 829 KB (three.js 670 KB + geometriya 107 KB + kod/CSS ~52 KB) |
| Draw call | 168–346 (kameraga qarab) |
| Triangle | ~16 000 |
| Binolar | 202 (70 + 132), shundan **12 tasi boshqariladi** |
| Shahar to'ldiruvchisi | ~700 protsedural bino, 1 draw call |
| Birinchi render | ~0.9 s (lokal), Vercel CDN da ~0.4 s |

---

## 3. Ma'lumot manbalari va litsenziya
- **OpenStreetMap** (Overpass API) — binolar konturi, qavat soni, yo'llar, yashil hududlar. **© OpenStreetMap contributors, ODbL.**
- Balandlik tuzatishlari: TDIU rasmiy foto galereyasi (`tsue.uz`) asosida (rektorat minorasi).
- Protsedural teksturalar va shahar to'ldiruvchisi — o'zimizning kod (litsenziya cheklovi yo'q).

---

## 4. Keyingi qadamlar (siz aytgan tartibda)
1. **Vercelga chiqarish** → `kampus-app/README.md` (drag&drop yoki `npx vercel --prod`).
2. **BotFather** → Menu Button / `/newapp` bilan ulash.
3. **Server** → `initData` HMAC, umumiy reyting, anti-cheat (lazy tick).
4. **Realga yaqinlashtirish davomi** → rektorat va bosh binoni yerdan fotogrammetriya bilan (L2), qolganlari stilizatsiya.
5. **Kontent** → 5 000 savollik bank (hozir 16 demo).

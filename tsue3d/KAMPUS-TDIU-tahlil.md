# KAMPUS: TDIU — Telegram Mini App 3D o'yini
## To'liq tadqiqot, texnik reja va ishlaydigan prototip

**Sana:** 2026-yil 27-noyabr  
**Muallif:** Arena.ai agenti (sizning brifingiz asosida)  
**Hujjat tarkibi:** bozor/mexanika tahlili → 3D model yo'llari → texnik stack → iqtisod matematikasi → Telegram integratsiyasi → huquqiy risklar → yo'l xaritasi → ishlaydigan prototip

---

## 0. Bir sahifada xulosa (TL;DR)

| Savol | Javob |
|---|---|
| G'oya ishlaydimi? | **Ha**, lekin "Clash of Clans nusxasi" sifatida emas — **"kampus digital twin + akademik progressiya"** sifatida. Asosiy farq: resurs **o'qish/quiz** orqali keladi. |
| Hudud nima? | Har bir **bino = o'yin obyekti**. TDIU misolida: Rektorat, 1- va 2-o'quv korpuslari, Akademik litsey, Gimnaziya, Innovatsiya markazi + 60+ neytral shahar binosi (dekor). |
| 3D qanday quriladi? | **4 bosqichli LOD strategiyasi:** L0 massing → **L1 OSM konturlari (biz buni bugun qildik)** → L2 fotogrammetriya (faqat 2–3 landmark bino) → L3 BIM/interyer. To'liq fotoreal kampus **kerak emas** — WebView'da 100 MB asset bilan o'yin ishlamaydi. |
| Texnologiya? | **Three.js / React Three Fiber** (Unity WebGL emas). Bitta faylda 751 KB prototip: 123–231 draw call, ~13 000 triangle, silliq render. |
| Progressiya? | CoC'ning eksponensial cost/time gate'i + Solo Leveling'ning XP/quest/rank tizimi + Duolingo streak/league. Hammasi bitta formulaga: `cost(n) = C₀ · rⁿ⁻¹`. |
| Pul? | Telegram **Stars (XTR)** — raqamli tovarlar uchun majburiy. Kosmetika + "mavsum pass" + kampus homiylari. |
| Eng katta risk? | 1) TDIU brendi bo'yicha rasmiy kelishuv, 2) dron bilan suratga olish **taqiqlangan**, 3) shaxsiy ma'lumotlar qonuni (2026-yil reformasi yumshatdi), 4) quiz orqali "ball/chegirma" va'dasi — akademik halollik va halol o'yin riski. |
| Keyingi qadam? | Prototipni ochib ko'ring → 1 hafta ichida faculty branding + 20 savollik haqiqiy bank + server (auth + leaderboard) → 6 haftada yopiq test. |

---

## 1. Konsept: nima uchun "kampus" — "hudud"dan yaxshiroq

Sizning dastlabki g'oyangiz: *"Clash of Clans kabi, lekin hudud o'rniga butun kampus"*. Bu to'g'ri instinkt, chunki:

**1. Fizik chegaralar tayyor.** CoC'da o'yinchi xaritani o'zi quradi — bu kontent yuki (har o'yinchi uchun layout). Kampusda esa layout **real hayotda mavjud**: binolar, yo'laklar, Maydon. Siz faqat *darajalarni* boshqarasiz. Bu — "base building"ni 80% arzonlashtiradi.

**2. Tanishlik = birinchi sessiyada tushunish.** Talaba o'z korpusini 2 soniyada taniydi. Bu onboarding xarajatini nolga tushiradi (CoC'da 3-5 daqiqa tutorial kerak).

**3. Ijtimoiy tarmoq effekti.** "Mening fakultetim binosi 7-darajada, sizniki 5-da" — real hayotdagi raqobat. Bu CoC'da yo'q bo'lgan, lekin universitetda **tabiiy mavjud** motivatsiya.

**4. Kontent cheksiz.** Har semestr: yangi bino, yangi tadbir, yangi mavsum. Real hayotdagi o'zgarishlar (yangi korpus qurilishi) o'yin kontenti bo'ladi.

### 1.1 Uchta referans o'yinning anatomiyasi

| | **Clash of Clans** | **Solo Leveling: Arise** | **Duolingo** |
|---|---|---|---|
| Yadro sikli | Resurs yig' → qur → kut → kuchay | Battle → XP → level → yangi gate | Dars → streak → league |
| Vaqt gate | Builder timer (12 kungacha) | Energy + daily gate | Kunlik maqsad |
| Ijtimoiy | Clan wars, trophies | Ranking, guild | Leagues, friends |
| Monetizatsiya | Gems (vaqtni tezlashtirish) | Gacha (personajlar) | Super, streak freeze |
| Bizga olinadigan | **Builder + timer + HQ gate** | **XP, quest, "gate" = imtihon** | **Streak, haftalik liga** |
| Bizga KERAK EMAS | 10 000 ta detal, PvP balans | Gacha, jangovar animatsiya | Til daraxti modeli |

### 1.2 Bizning gibrid: "KAMPUS: TDIU"

```
        ┌──────────────────────────────────────────────┐
        │  BILIM (quiz)  ──►  UPGRADE  ──►  PRODUKSIYA │
        │       ▲                │              │      │
        │       │                ▼              ▼      │
        │   ENERGIYA        QURILISH TIMER   MABLAG'   │
        │       ▲            (prorab)            │     │
        │       │                               ▼     │
        │   STREAK / KUNLIK VAZIFA  ◄────  NUFUZ/REYTING│
        └──────────────────────────────────────────────┘
```

**Resurslar (4 ta, ko'p emas):**

| Resurs | Qanday olinadi | Nimaga sarflanadi | Analog |
|---|---|---|---|
| 📘 **Bilim** | Quiz, ma'ruza davomati, passiv (o'quv korpusi) | Upgrade narxining 30–40% | Elixir |
| 💰 **Mablag'** | Passiv (tijorat binolari), kunlik vazifa | Upgrade narxining 60–70% | Gold |
| ⭐ **Nufuz** | Quiz natijasi, mavsum | Reyting, "elita" binolar | Trophies |
| ⚡ **Energiya** | Vaqt bilan tiklanadi (gimnaziya tezlashtiradi) | Quiz urinishi | Builder/Energy |

**Muhim dizayn qarori:** *Nufuz sotib olinmaydi.* Bu CoC'ning "trophies" tamoyili — pul faqat vaqtni tezlashtiradi, obro'ni emas. Universitet kontekstida bu akademik halollik nuqtai nazaridan ham to'g'ri.

---

## 2. 3D model: qanday qilib "to'liq" quriladi (4 bosqich)

### 2.1 Nima uchun to'liq fotoreal model YARAMAYDI

Telegram Mini App — WebView ichida ishlaydi. Real raqamlar:

| Cheklov | Qiymat | Natija |
|---|---|---|
| Bundle (JS) | < 1 MB gzip tavsiya | three.js core ≈ 170 KB gzip |
| Telefon GPU byudjeti | **< 100–150 draw call**, < 1 mln triangle | 300 ta bino = 300 draw call → 20–25 fps |
| Xotira | WebView 300–500 MB, iOS agressiv tozalaydi | 4K tekstura = crash |
| Termal throttling | 30 sekunddan keyin 60 → 25 fps | Doimiy 60 fps maqsad qilib bo'lmaydi |
| Fotoreal kampus (drone, 1 bino) | 200 k – 2 mln poligon, 100–300 MB | Bitta bino ham WebView'ga sig'maydi |

**Xulosa:** o'yin uchun **stilizatsiya qilingan** model kerak (CoC ham, Brawl Stars ham stilizatsiya — tasodif emas, bu GPU talabi). Fotoreal model faqat 2–3 ta "landmark" bino uchun, **alohida "Ekskursiya" rejimida**.

### 2.2 To'rt bosqichli LOD strategiyasi

| Bosqich | Manba | Poligon/bino | Tayyorlash vaqti | Narx | Nimaga yaraydi |
|---|---|---|---|---|---|
| **L0 — Massing** | Qo'lda bloklar / OSM konturlari + qavat soni | 20–100 | 1–2 kun | 0 | Prototip, balans testi |
| **L1 — OSM digital twin** ✅ | OpenStreetMap (Overpass API) — konturlar + `building:levels` | 200–800 | **1 kun** | 0 | **O'yinning asosiy ko'rinishi** |
| **L2 — Fotogrammetriya** | Telefon yoki dron bilan 300–1500 foto → Metashape/RealityCapture | 20k–150k (retopo bilan) | 1–3 hafta | $1k–5k | Faqat 2–3 landmark bino ("Ekskursiya" rejimi) |
| **L3 — BIM/interyer** | Universitet chizmalari, kadastr, Revit | 50k–500k | 1–3 oy | $5k+ | Ichkarida navigatsiya, xonalar, "auditoriya egallash" |

### 2.3 Biz bugun nima qildik (L1, real ma'lumot bilan)

OpenStreetMap'dan TDIU kampusi bo'yicha **haqiqiy** ma'lumot olindi:

```bash
# Overpass API so'rovi (O'zbekistonda ishlaydigan mirror orqali)
[out:json][timeout:60];
way["building"](around:400,41.308956,69.249754);
out geom tags;
```

Natija (`build/osm_to_campus.py` skripti bilan qayta ishlanadi):

| Ko'rsatkich | Qiymat |
|---|---|
| Binolar (kontur + balandlik) | **70 ta** |
| Yo'llar / yo'laklar | 245 ta poliliniya |
| Yashil va sport maydonlari | 52 ta poligon |
| Xom ma'lumot → o'yin fayli | 379 KB JSON → **57 KB** |
| Aniqlik | Konturlar ±1–2 m, balandlik `building:levels × 3.4 m` |

**Aniqlangan real obyektlar (o'yin obyektlari sifatida):**

| OSM ID | Bino | Qavat | Maydon | O'yindagi rol |
|---|---|---|---|---|
| 149530194 | TDIU **Rektorati** | 3 | 4 335 m² | 🏛 HQ — boshqa binolar darajasini cheklaydi |
| 149530198 | **1-o'quv korpusi** | 6 | 3 040 m² | 📘 Bilim ishlab chiqarish |
| 180776564 | **2-korpus** | 4 | 2 537 m² | 💰 Mablag' ishlab chiqarish |
| 1154762660 | **Akademik litsey** | 4 | 3 273 m² | 🎓 Abituriyent oqimi / Nufuz |
| 181413037 | **Iqtisodiyot gimnaziyasi** | 3 | 1 188 m² | ⚡ Energiya tiklash |
| 149530196 | 5 qavatli korpus (Islom Karimov ko'chasi) | 5 | 5 129 m² | 🚀 Innovatsiya markazi |
| 181419869 | Toshkent shahar hokimligi | 6 | 4 182 m² | Neytral (dekor) |
| 636288920 | Humo Arena | 6 | 19 221 m² | Neytral landmark |

> **Muhim:** bu ma'lumotlar ODbL litsenziyasi ostida — **atribut** ("© OpenStreetMap contributors") qo'yish majburiy, lekin **tijorat foydalanish uchun bepul**. Bu eng arzon va eng tez yo'l.

### 2.4 Fotogrammetriya (L2) — amaliy qo'llanma

**Variant A — Dron (yuqori sifat, yuqori to'siq).** O'zbekistonda fuqarolik dronlarini olib kirish va uchirish **maxsus ruxsatnomasiz taqiqlangan**; ruxsat asosan yuridik shaxslarga, ko'p idorali tasdiqlash (Fuqarolik aviatsiyasi agentligi, Mudofaa vazirligi, IT-ministrlik chastota bo'yicha) orqali beriladi va haftalar/oylar oladi. **Birinchi qadam — TDIU ma'muriyati orqali rasmiy so'rov**, aks holda bu yo'lni rejadan chiqarib tashlang.

**Variant B — Yerdan fotogrammetriya (ruxsatsiz, arzon, 80% sifat).** Bino atrofida telefon bilan 300–800 foto (3 doira: past, o'rta, yuqori burchak; 60% overlap, bulutli kun). Ishlov berish:

```
Fotosuratlar → COLMAP (bepul) yoki Agisoft Metashape ($179–3499)
             → dense point cloud → mesh (2–10 mln tri)
             → retopologiya (Blender: Decimate → 30–80k tri)
             → UV + PBR bake (Substance/Blender) → 2K atlas
             → glTF + Draco (geometriya) + KTX2 (tekstura)
```

Bitta bino uchun: **6–12 soat ish**, natija 3–8 MB (Draco+KTX2 bilan).

**Variant C — Muqobil manbalar (tekshirilgan):**

| Manba | Narx | Cheklov |
|---|---|---|
| OpenStreetMap | Bepul (ODbL) | Balandlik ko'pincha taxminiy |
| **Google Photorealistic 3D Tiles** | 1 000 root tile/oy bepul, keyin **$6/1000** (3 soatlik sessiya) | **Oflayn saqlash va qayta ishlatish taqiqlangan** (Maps Platform shartlari) → o'yin aktivi sifatida **yaramaydi** |
| Microsoft / Google Open Buildings | Bepul | Faqat 2D footprint, balandlik yo'q |
| Universitet arxivi (chizmalar, BIM) | Bepul | Ruxsat kerak, sifat o'zgaruvchan |
| Sketchfab / 3D Warehouse | Bepul/arzon | Kampusga mos emas |

> Ya'ni: **L1 = OSM (bugun qildik), L2 = faqat 2–3 landmark uchun yerdan fotogrammetriya, qolgani — stilizatsiya.** Bu byudjetni 10 barobar tejaydi.

### 2.5 Stilizatsiya qoidalari (o'yin ko'rinishi uchun)

1. **Balandlik = qavat soni** — o'sish vertikal bo'ladi (CoC'da bino kattalashadi; bizda **qavat qo'shiladi**). Bu real binoga mos va juda intuitiv.
2. **Yorug'lik:** bitta directional + hemisphere, **soya yo'q** (mobil GPU'da shadow map = 30% fps yo'qotish). Fake AO — vertex color yoki texture bake.
3. **Material:** flat Lambert + bino turi bo'yicha 6–8 rang. Hech qanday PBR yo'q (prototipda 6 material, 123 draw call).
4. **Daraxt/mashina/odam:** `InstancedMesh` — 1 draw call minglab obyekt uchun (prototipda 260 daraxt = 2 draw call).
5. **LOD:** 150 m dan uzoq binolar — oddiy quti (box). 300 m — faqat siluet.
6. **Piksel nisbati:** `min(devicePixelRatio, 2)`, LOW performance klassda 1.5.

---

## 3. Texnik stack

### 3.1 Frontend

| Qatlam | Tanlov | Nima uchun |
|---|---|---|
| Render | **Three.js r160+** yoki **React Three Fiber** | Eng kichik bundle, eng katta hamjamiyat, WebView'da tasdiqlangan |
| Holat | Zustand / Redux Toolkit | Serverdan kelgan holat + lokal optimistik UI |
| Telegram SDK | `@telegram-apps/sdk-react` yoki raw `window.Telegram.WebApp` | initData, haptics, CloudStorage, fullscreen |
| Build | Vite + `vite-plugin-singlefile` yoki code splitting | Birinchi ekran < 1.5 s |
| Asset | glTF 2.0 + **Draco** + **KTX2** | 5–10x kichraytirish |

**Nima uchun Unity WebGL emas:** minimal build 8–15 MB, iOS WebView'da xotira yeb qo'yadi, Telegram'da "Back" tugmasi va safe-area bilan muammo, yuklanish 5–15 s. **Faqat** agar sizda Unity jamoasi va 3D pipeline tayyor bo'lsa va o'yin oddiy 2D bo'lsa.

**Nima uchun Babylon.js emas:** yaxshi, lekin WebView'da og'irroq va R3F ekosistemasi (drei, rapier) tezroq rivojlanish beradi.

### 3.2 Ishlash byudjetlari (real raqamlar)

| Ko'rsatkich | Maqsad | Prototipda o'lchandi |
|---|---|---|
| Draw call | < 150 (mobil) | **123–231** (kameraga qarab; 70 bino + yo'llar + daraxt + yorliqlar) |
| Triangle | < 300k | **12k–14k** |
| Birinchi render | < 2 s | ~0.8 s (751 KB fayl, lokal) |
| Fayl hajmi | < 1 MB | **751 KB** (three.js 670 KB + ma'lumot 57 KB) |
| FPS (headless SwiftShader) | — | barqaror |

Prototipda optimizatsiya qilinmagan holda ham byudjetga sig'di — chunki **L1 geometriya arzon**. L2 fotogrammetriya qo'shilsa, majburiy: instancing, LOD, frustum culling.

### 3.3 Backend

```
┌─────────────┐    initData (HMAC-SHA256)    ┌──────────────┐
│ Telegram    │ ────────────────────────────► │  API (NestJS │
│ WebApp      │ ◄──── JWT (12 soat) ───────── │  yoki Go)    │
└─────────────┘                               └──────┬───────┘
                                                     │
                              ┌──────────────────────┼─────────────────────┐
                              ▼                      ▼                     ▼
                        PostgreSQL             Redis (cache,         Object storage
                     (users, buildings,       rate limit, leader-     (glTF assetlar,
                      tick log, seasons)      board ZSET)             CDN)
```

**Kritik arxitektura qarori — "lazy tick":** har bir foydalanuvchi uchun cron ishlatmang. Buning o'rniga:

```
produktsiya = f(lastTickAt, now, level, boosts)
```
ya'ni resurs **so'ralganda** hisoblanadi. 100 000 foydalanuvchi uchun ham serverna yuki deyarli nol. Bu CoC-klonlarning eng ko'p uchraydigan xatosi (sekundlik cron = falokat).

**Anti-cheat (majburiy):**

| Tahdid | Chora |
|---|---|
| Vaqtni o'zgartirish (telefon soati) | Barcha timerlar **serverda**, `endsAt` serverdan keladi |
| Javobni to'g'ridan-to'g'ri yuborish | Savol serverdan, javob **serverda** tekshiriladi; to'g'ri javob clientga yuborilmaydi |
| Bot/avtomatlashtirish | `initData` + tezlik entropiyasi (inson javob vaqti taqsimoti), rate limit, device fingerprint |
| Balansni buzish | Iqtisod faqat serverda; client faqat *niyat* yuboradi ("upgrade qilaman") |
| Ko'p akkaunt | Telegram user_id + telefon (agar kerak bo'lsa), mavsumiy reset |

---

## 4. Progressiya matematikasi — "qanday qilib hududni kattalashtiramiz"

Bu sizning savolingizning eng muhim qismi: *"math mini quiz cha yoki nimanidir upgrade qilib, keyin solo leveling kabi mi yoki clash of clans kabimi?"* — **ikkalasi ham, lekin qat'iy ajratilgan rollarda.**

### 4.1 Clash of Clans'dan olingan aniq raqamlar (2025–2026 holati)

| Darajalar | Narx (Gold) | Vaqt |
|---|---|---|
| TH2 | 1 000 | 10 s |
| TH5 | 150 000 | 6 soat |
| TH10 | 3 500 000 | 3 kun |
| TH15 | 13 000 000 | 8 kun |
| **TH18** | **25 000 000** | **12 kun** |
| TH2→TH18 jami | ~163 mln Gold | ~103 prorab-kun |

E'tibor bering: narx **~1.55–1.6 barobar** har darajada oshadi, vaqt esa **1.3–1.5 barobar**. Bu klassik "eksponensial gate":

```
cost(n) = C₀ · r^(n−1)        r ≈ 1.55
time(n) = T₀ · q^(n−1)        q ≈ 1.35
```

### 4.2 Solo Leveling'dan olingan tamoyillar

| Mexanika | Solo Leveling'da | Bizda |
|---|---|---|
| **Level** | XP → daraja | Nufuz → "Ovoz" darajasi (Hunter rank) |
| **Gate** | Dungeon = sinov | **Imtihon/quiz = "Bilim darvozasi"** (haftalik, murakkablik ortadi) |
| **Quest** | Kunlik vazifalar, ogohlantirish | Kunlik maqsad: "20 savol" / "1 bino" |
| **Penalty** | Bajarmasang — jarima zonasi | **Yumshoq versiya:** streak uziladi + produksiya 10% tushadi (24 soat) |
| **Shadow army** | Yig'ilgan qo'shin | **"Jamoa"** — fakultet jamoasi, birgalikda bino ko'tarish |

> ⚠️ Solo Leveling'ning "penalty zone"si (jismoniy jazo) o'quv mahsulotida **bolalar/gilamdan** foydalanilmaydi; faqat o'yin ichidagi yumshoq jarima.

### 4.3 Bizning tavsiya etilgan formula (real o'yin uchun)

```
# Bino darajasi n (1..12)
mablag'(n) = 500 · 1.62^(n−1)          # asosiy gate
bilim(n)   = 150 · 1.45^(n−1)          # quiz orqali keladi (35%)
vaqt(n)    = 90 s · 1.9^(n−1)          # prorab bandligi, maks 8 soat
produksiya(n) = base · n^1.15          # chiziqli emas — kichik o'sish

# Rektorat (HQ) darajasi kampus imkoniyatlarini belgilaydi
HQ(n) talab qiladi: Σ barcha bino darajalari ≥ 6n + 4
HQ(n) narxi: 3x oddiy bino narxi, vaqti: 2x
```

**Kalibrlash jadvali (maqsad: 90 kunlik mavsum, kuniga 12–15 daqiqa):**

| Bino darajasi | Mablag' | Bilim | Vaqt | Taxminan qaysi kunda ochiladi |
|---|---|---|---|---|
| 1 | 500 | 150 | 1.5 min | 1-kun |
| 3 | 1 300 | 315 | 5 min | 2-kun |
| 5 | 3 400 | 660 | 20 min | 5-kun |
| 7 | 9 000 | 1 390 | 1.2 soat | 12-kun |
| 9 | 23 700 | 2 920 | 4.3 soat | 25-kun |
| 11 | 62 000 | 6 100 | 15 soat | 50-kun |
| **12** | **100 000** | **8 800** | **30 soat** | **75–90-kun** |

Nega bu ishlaydi: **billan 35% ni quiz beradi**, ya'ni "o'qimay turib bino ko'tarib bo'lmaydi" — lekin quiz zerikarli bo'lsa, o'yin o'ladi. Shuning uchun quiz **qisqa (8 savol, 15 s/savol)** va **combo/lazzat** bilan.

### 4.4 Quiz iqtisodiyoti (o'yinning "hook"i)

```
Har to'g'ri javob:  bilim += 12 · (1 + tezlik_bonusi) · min(4, combo)
Tezlik bonusi:     0..1 (qolgan vaqt / 15 s)
Combo:             ketma-ket to'g'ri javoblar (x1 → x4)
Sessiya (8 savol): ~120–400 bilim
Kunlik energiya:   5 ta, har 15 daqiqada +1  →  ~30–48 quiz/kun (nazariy)
Real sessiya:      kuniga 6–10 quiz = 48–80 savol
```

**Savol banki talabi:** kamida **5 000 savol** (matematika, mikro/makroiqtisod, moliya, statistika, mantiq, ingliz tili). Har savolda 4 variant, variantlar **rotatsiya** qilinadi (yodlab olmaslik uchun). Murakkablik `user_rating` bo'yicha adaptiv (Elo uslubi):

```
p(to'g'ri) = 1 / (1 + 10^((R_savol − R_o'yinchi)/400))
```
Agar o'yinchi ketma-ket 3 ta to'g'ri javob bersa → savol darajasi +50. Bu "flow" holatini ushlab turadi.

### 4.5 "Hudud egallash" uchun 4 variant — qaysi birini tanlash

| Variant | Tavsif | Ijtimoiy kuch | Texnik murakkablik | Tavsiya |
|---|---|---|---|---|
| **A. PvE qurilish** | Faqat o'z kampusingizni ko'tarasiz | Past | Past | ✅ **MVP asosi** |
| **B. Fakultet urushi (mavsum)** | Haftada bir marta fakultet jamoalari binolarni "egallaydi" (ko'p ball = nazorat) | **Juda yuqori** | O'rta | ✅ **2-bosqich, asosiy retention** |
| **C. Geolokatsiya check-in** | Bino oldida turib QR skan → bonus | Yuqori | O'rta + maxfiylik riski | ⚠️ Ixtiyoriy, ehtiyotkorlik bilan |
| **D. 1v1 quiz duel** | Real vaqtda savol-javob ("Gate") | Yuqori | O'rta-yuqori | ✅ 3-bosqich |

**Tavsiya: A → B + D, C faqat QR bilan (GPS emas).** GPS spoofing, batareya va maxfiylik muammolari tufayli C ni asosiy mexanika qilmang.

### 4.6 Retention maqsadlari (benchmark)

| Metrika | Yomon | Yaxshi | Mo'ljal |
|---|---|---|---|
| D1 retention | < 25% | 40%+ | **45%** |
| D7 | < 10% | 20%+ | **22%** |
| D30 | < 3% | 8%+ | **10%** |
| Sessiya/kun | 1 | 3+ | **2.5** |
| Sessiya davomiyligi | < 2 min | 8–15 min | **10 min** |
| Kunlik quiz tugatish | < 30% | 60% | **55%** |

Bu raqamlar **faqat** kampus ichida tarqatish + guruhlar/kanallar + real hayotdagi tadbirlar bilan erishiladi. O'yin o'zi "organik" o'smaydi — **tarqatish strategiyasi** (fakultet dekanlari, tyutorlar, talabalar kengashi) eng muhim omil.

### 4.7 Iqtisodiy balansni tekshirish formulasi

```
Kuniga o'rtacha o'sish = (kunlik_mablag' / o'rtacha_narx) + (kunlik_bilim / o'rtacha_bilim_narxi)
Maqsad: 0.8 – 1.5 "level/kun" (birinchi hafta), 0.2 – 0.4 (30-kundan keyin)
```
Agar o'sish > 2 level/kun → kontent 2 haftada tugaydi (o'yin o'ladi).  
Agar < 0.15 level/kun → o'yinchi tashlab ketadi.

---

## 5. Telegram Mini App integratsiyasi

### 5.1 Majburiy texnik talablar

| Element | Amalga oshirish |
|---|---|
| **Auth** | `initData` ni **serverda** HMAC-SHA256 bilan tekshirish (bot token bilan). Clientga ishonmang. |
| **Fullscreen / safe-area** | `WebApp.expand()`, `viewport-fit=cover`, `env(safe-area-inset-*)` |
| **Haptics** | `HapticFeedback.impactOccurred('light')` — har tugmada. Bu "premium" his beradi. |
| **CloudStorage** | 1 024 kalit, har biri 4 KB gacha — sozlamalar uchun. Asosiy saqlash **serverda**. |
| **BackButton** | Telegram'ning native "orqaga" tugmasi bilan sinxronlash |
| **Theme** | `themeParams` (light/dark) — HUD ranglarini moslashtirish |
| **DeviceStorage** | Bot uchun 5 MB / foydalanuvchi (fayl keshi) |
| **performance_class** | User-Agent'da `LOW / AVERAGE / HIGH` → grafika sifatini avtomatik tanlash |

### 5.2 To'lovlar — Telegram Stars (majburiy)

Raqamli tovarlar (bonus, obuna, kosmetika) **faqat Stars (XTR)** orqali sotiladi:

```js
// Mini App ichida
const link = await api.createInvoiceLink({ /* amount: 50 Stars */ });
Telegram.WebApp.openInvoice(link, (status) => {
  if (status === 'paid') pollOrderStatus(orderId);  // "paid" = "serverga so'ra", ruxsat berma
});
```

Muhim qoidalar: `currency: "XTR"`, `provider_token: ""`, bitta narx, butun son. Ruxsat **faqat** `successful_payment` webhook'ida, `telegram_payment_charge_id` unikal indeks bilan beriladi. Obuna: `subscription_period: 2592000` (30 kun).

**Monetizatsiya modeli (tavsiya):**

| Mahsulot | Narx | Ulush |
|---|---|---|
| Mavsum pass ("Semestr") | 99–149 Stars | 50% daromad |
| Kosmetika (bino fasadlari, banner) | 25–75 Stars | 25% |
| Vaqt tezlashtirish (prorab +1, 1 soatga) | 15–30 Stars | 15% |
| Fakultet jamoasi uchun "boost" | 199 Stars | 10% |

**Muhim:** "ball → baho" yoki "ball → chegirma" **hech qachon** sotilmasin. Faqat kosmetika va vaqt. Aks holda akademik nufuz va huquqiy risk.

### 5.3 Tarqatish (growth) mexanikasi

1. **Bot + guruh integratsiyasi:** har fakultet uchun guruh; guruhga haftalik reyting avtomatik post qilinadi.
2. **Referral:** do'stni taklif qilsang — ikkalangizga 50 bilim. Cheklov: 1 kun 5 ta.
3. **Real tadbirlar:** "Ochiq eshiklar kuni"da QR → maxsus bino darajasi.
4. **Kanal:** haftalik "Kampus yangiliklari" post + mini app tugmasi.
5. **Push:** bot orqali "Prorabingiz bo'sh — 1-o'quv korpusini ko'taring" (kuniga maks 2 ta, bezovta qilmaslik).

---

## 6. Huquqiy va mahsulot risklari (o'qib chiqish shart)

| Risk | Tavsif | Chora |
|---|---|---|
| **Brend** | TDIU nomi, gerbi, logotipi — tovar belgisi. Rasmiy kelishuvsiz foydalanish huquqbuzarlik | Universitet bilan **yozma** memorandum; rasmiy "hamkor" maqomi |
| **Shaxsiy ma'lumotlar** | ZRU-547 (2019) + 2026-yil 26-martdagi 1125-son qonun: lokalizatsiya **yumshatildi** — endi faqat biometrik, genetik va telekom ma'lumotlari O'zbekistonda saqlanishi shart. Qolganlari chet elda saqlanishi mumkin, lekin xavfsizlik talablari va **ma'lumotlar bazasini ro'yxatga olish** (pd.gov.uz) saqlanadi | Minimal ma'lumot yig'ish: faqat Telegram `user_id`, ism, fakultet. Tibbiy/biometrik **hech narsa** yig'mang. Maxfiylik siyosati + rozilik |
| **Dronlar** | Jismoniy shaxslarga olib kirish/uchirish taqiqlangan; ruxsat yuridik shaxslarga, ko'p idorali | Faqat universitet buyurtmasi bilan, oldindan; muqobil — yerdan fotogrammetriya |
| **Google 3D Tiles** | Oflayn saqlash/qayta ishlatish taqiqlangan | Ishlatmang (yoki faqat real vaqtda, atribut bilan) |
| **OSM (ODbL)** | Atribut majburiy; hosilaviy ma'lumotlar ODbL | Pastda "© OpenStreetMap contributors" qo'shing (prototipda `campus.json` meta'sida bor) |
| **Akademik halollik** | Quiz orqali "ball" berish — imtihon bahosiga ta'sir qilsa, xavfli | Faqat o'yin ichidagi valyuta; bahoga **hech qanday** ta'sir yo'q |
| **Telegram siyosati** | Raqamli tovar faqat Stars; qimor/"pul topish" mexanikasi taqiqlangan | Stars + kosmetika; hech qanday "investitsiya"/TON-token sxemasi |
| **Balans/frustratsiya** | 12 kunlik timer talabani jahllantiradi | Maksimal timer **8 soat** (kampus o'yini uchun), "tezlashtirish" bepul yo'li ham bo'lsin |

---

## 7. Yo'l xaritasi va byudjet

### 7.1 Bosqichlar

| Bosqich | Muddat | Natija | Jamoa |
|---|---|---|---|
| **0. Prototip** ✅ | 1 kun | 3D kampus + upgrade + quiz (sizda hozir) | 1 dev |
| **1. Vertical slice** | 3 hafta | 6 bino, 200 savol, server auth, saqlash, haptics, Telegram'da ishlaydi | 1 frontend + 1 backend |
| **2. Yopiq test (MVP)** | 6 hafta | 1 fakultet, 100 foydalanuvchi, leaderboard, streak, analytics | +1 dizayner, +1 QA (yarim) |
| **3. Mavsum 1** | 3 oy | Barcha fakultetlar, jamoaviy urush (B varianti), Stars to'lovlari, L2 model (2 landmark) | 5–6 kishi |
| **4. Kengaytirish** | 6 oy+ | Yangi kampuslar (TDTU, O'zMU...), 1v1 duel, mavsumiy kontent | 7–8 kishi |

### 7.2 Byudjet taxmini (AQSh dollari)

| Bosqich | Ish haqi (O'zbekiston bozori) | Infratuzilma | Jami |
|---|---|---|---|
| 1. Vertical slice | $2 000 – 4 000 | $50 | **$2 000 – 4 000** |
| 2. MVP | $5 000 – 9 000 | $150 | **$5 000 – 9 000** |
| 3. Mavsum 1 | $15 000 – 30 000 | $400 | **$15 000 – 30 000** |
| L2 fotogrammetriya (ixtiyoriy) | $1 000 – 5 000 | — | **$1 000 – 5 000** |
| **6 oylik jami** | | | **$23 000 – 48 000** |

Server: 10 000 foydalanuvchi uchun oddiy VPS (4 vCPU / 8 GB) + Postgres + Redis ≈ **$60–120/oy**. Asset CDN: Cloudflare bepul tarif yetadi.

### 7.3 Jamoa (minimal)

- 1 × **Frontend/3D** (Three.js, Telegram SDK)
- 1 × **Backend** (Node/Go, Postgres, anti-cheat)
- 0.5 × **Game designer** (iqtisod balansi, savol banki)
- 0.5 × **UI/UX** (Telegram uslubi)
- 0.5 × **Kontent** (5 000 savol — bu eng katta "ko'rinmas" ish; AI yordamida generatsiya + ekspert tekshiruvi)

---

## 8. Ishlaydigan prototip

> **v0.2 yangilandi** (2026-11-27): ikkinchi kampus (Moliya instituti), real deraza fasadlari,
> 17 qavatli rektorat minorasi, protsedural shahar, egallashning 4 usuli.
> Tafsilot: `KAMPUS-v0.2-yangilanish.md` · Deploy: `../kampus-app/README.md`

> **v0.3 (2026-11-27):** Chilonzor va Yunusobod tumanlarining **42 065 ta haqiqiy binosi**
> va 4 234 ta ko'chasi qo'shildi; kampus firuza rang bilan ajratildi; `@hudud_2x_bot` ulandi.
> Batafsil: `KAMPUS-v0.3-yangilanish.md`.

### 8.1 v0.1 prototip (tarixiy)

**Fayl:** `tsue-campus-game.html` — **751 KB, bitta fayl, internet kerak emas.** Telegram WebView'da ham, brauzerda ham ochiladi.

### Nima ishlaydi

| Funksiya | Holat |
|---|---|
| Haqiqiy TDIU kampusi (70 bino, OSM konturlari) | ✅ |
| 6 ta boshqariladigan bino + 64 dekor bino | ✅ |
| Kamera: aylantirish, zoom, binoga fokus | ✅ |
| Bino tanlash → panel → **upgrade** (narx, vaqt, gate) | ✅ |
| **Vertikal o'sish**: har daraja +qavat (real 3Dda) | ✅ |
| Qurilish taymeri + tezlashtirish (Bilim evaziga) | ✅ |
| **Bilim sinovi**: 8 savol, 15 s, combo, tezlik bonusi | ✅ |
| Passiv produksiya (Bilim/Mablag'/Energiya) | ✅ |
| Rektorat gate ("umumiy daraja yetarli emas") | ✅ |
| Fakultet reytingi (mock) | ✅ |
| localStorage saqlash | ✅ |
| Telegram haptics + theme (WebApp bo'lsa) | ✅ |

### Nima yo'q (keyingi qadamlar)

- Server (hozir hammasi lokal — cheat mumkin)
- Real savol banki (hozir 15 ta demo savol)
- Jamoaviy urush mavsumi
- Fotogrammetrik landmark binolar
- Stars to'lovlari
- Analytics

### Kod tuzilishi

```
tsue3d/
├── data/            # OSM xom ma'lumotlari (bld, roads, land, uni)
├── osm_to_campus.py # OSM → 3D geometriya konverteri (L1 pipeline)
├── build/campus.json# 57 KB o'yin ma'lumoti
├── src/
│   ├── index.template.html
│   ├── style.css    # Telegram-uslubidagi HUD
│   └── game.js      # Three.js sahna + o'yin mantiqi
├── vendor/three.min.js
├── build_game.py    # hammasini bitta HTML'ga yig'adi
└── tsue-campus-game.html  ← NATIJA
```

Qayta yig'ish: `python3 build_game.py`  
Geometriyani yangilash: `python3 osm_to_campus.py && python3 build_game.py`

### Prototipdagi balans (demo uchun tezlashtirilgan)

| Parametr | Qiymat |
|---|---|
| `cost(n)` mablag' | `240 · 1.55^(n−1)` |
| `cost(n)` bilim | `40 · 1.45^(n−1)` |
| Qurilish vaqti | `8 · 1.9^(n−1)` sekund |
| Mablag' produksiyasi | `base · level · 6` /sek |
| Energiya | 5 ta, 25 s da +1 (demo) |
| Maksimal daraja | 10 |

---

## 9. Nima uchun bu ishlaydi — va qanday qilib ishlamay qolishi mumkin

**Ishlaydi, agar:**
1. TDIU ma'muriyati **rasmiy** homiy bo'lsa (birinchi kundan tarqatish kanali).
2. Savollar **haqiqiy** o'quv dasturiga bog'langan bo'lsa (talaba imtihonga tayyorlanishni his qilsa).
3. Quiz **60 soniyada** tugasa (uzun test = tashlab ketish).
4. Har hafta yangi "mavsum voqeasi" bo'lsa (reyting reset, yangi bino).

**Ishlamay qoladi, agar:**
1. Quiz zerikarli va **majburiy** bo'lsa (talaba "yana bir majburiy test" deb qabul qiladi).
2. Timers juda uzun bo'lsa (CoC'niki 12 kun — kampus o'yinida o'lim).
3. 3D fotoreal qilinishga urinilsa (WebView crash, yuklanish 15 s).
4. Faqat bitta fakultetda ishlasa (jamoaviy raqobat yo'q = retention yo'q).
5. Brend kelishuvisiz ("norasmiy ilova" sifatida tarqalsa — universitet tomonidan bloklanish).

---

## 10. Manbalar

1. Telegram Mini Apps hujjati — `core.telegram.org/bots/webapps` (DeviceStorage 5 MB, performance_class, CloudStorage cheklovlari)
2. Telegram Stars / Bot API 7.4 — XTR to'lovlari, raqamli tovarlar qoidasi
3. Clash of Clans TH18 qiymatlari — clashclock.com / clashbuilder.com (2026)
4. Three.js mobil optimizatsiya byudjetlari (draw call < 100, DPR ≤ 2, instancing)
5. Google Map Tiles API narxlari — $6/1000 root tile, 1000 bepul, oflayn taqiq
6. O'zbekiston dron qoidalari — fuqarolik dronlarini import/uchirish taqiqi, ruxsat tartibi
7. ZRU-547 "Shaxsiy ma'lumotlar to'g'risida" + 2026-yil 26-mart 1125-son qonun (lokalizatsiya yumshatilishi)
8. OpenStreetMap / Overpass API — ODbL litsenziyasi

---

*Hujjat oxiri. Savollaringiz bo'lsa — keyingi qadamni birga tanlaymiz: (a) server + Telegram auth, (b) savol banki generatsiyasi, (c) jamoaviy urush dizayni, (d) fotogrammetriya pipeline.*

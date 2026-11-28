# KAMPUS · TDIU — v0.7: fotoga qarab qurilgan binolar

**Sana:** 2026-11-28 · **Asos:** v0.6 (butun shahar real OSM)

---

## 1. Yondashuv (nima uchun shunday)

253 328 binoning har biri uchun foto topib, alohida model qurish — jismonan mumkin emas
(na foto bor, na GPU ko'taradi). Shuning uchun **uch qatlamli** tizim:

| Qatlam | Soni | Usul |
|---|---|---|
| **A. Batafsil modellar** | 2 (hozircha) | Wikimedia Commons fotosi → qo'lda o'lchov → parametrik geometriya |
| **B. Fasad uslublari** | 6 xil | foto asosida yasalgan protsedural tekstura (sovet, curtain, tosh, panel, klassik, shisha) |
| **C. Ommaviy binolar** | 253 328 | OSM konturi + B uslub (maydon, balandlik bo'yicha avtomatik tanlov) |

Faqat **A** qatlami "aynan shu bino" bo'ladi — chunki faqat ular ekranda yaqindan ko'riladi
va o'yinda rol o'ynaydi (egallash, yangilash, QR). Qolgan shahar — muhit.

---

## 2. v0.7 da qilingan ish

### 2.1 Foto bazasi (`tsue3d/refs/`)

8 ta bino rasmi Wikimedia Commons'dan yuklandi (`Special:FilePath?width=1200`), har biri
uchun manba va litsenziya `refs/README.md` da qayd etilgan.
Rasmlardan **o'lchamlar** olinadi: qavat balandligi, fasad moduli, minora eni/chuqurligi,
material rangi, peshtoq va karniz nisbatlari.

### 2.2 Yangi fasad uslublari (fotodan)

`facadeTexture()` ga 3 ta yangi uslub qo'shildi:

- **`soviet`** — shaftoli suvoq + oq rom + **kemerli deraza boshi** + uch tavaqali oyna
  (TDIU fakulteti fotosidan). Kampusning 68 ta oddiy binosi shu uslubga o'tkazildi.
- **`curtain`** — to'q ko'k-yashil oyna pardasi + qora vertikal ustunlar + yorug'lik aksi
  (bosh bino minorasi fotosidan).
- **`stone`** — sarg'ish tosh qoplama (podiym, portallar, karnizlar uchun).

### 2.3 TDIU bosh binosi — to'liq qayta qurildi

Fotodagi nisbatlar bo'yicha:

| Element | O'lcham |
|---|---|
| Podiym (OSM konturi bo'yicha) | 8.6 m (2 qavat) |
| Minora | 34 × 17 m, **54 m** (18 qavat × 3.0 m) |
| Yon peshtoqlar | 4.4 m keng, sut rangli tosh |
| Yuqori karniz | 2.6 m, 1.6 m osilgan |
| Tom texnika bloki | 3.2 m |
| Granit portal | 17.4 m keng, 11.4 m baland |
| Soyabon | 17.2 × 5.6 m, eni bo'ylab yoysimon tasma |
| Yozuv | "TOSHKENT DAVLAT IQTISODIYOT UNIVERSITETI" |
| Zinapoya | 7 pog'ona, 22 m keng + 30 × 9 m granit maydon |

**Draw call:** portal ham, zinapoya ham, peshtoqlar ham bitta uslub bo'yicha birlashtirilgan
(`solidGroup()`) — butun bino **3–4 mesh**.

### 2.4 Fasad yo'nalishini avtomatik aniqlash (`pickFront`)

Muammo: binoning kirishi qaysi tomonda? Avval qo'lda berilgan burchak edi — noto'g'ri chiqdi
(portal binoning orqasida qolardi, zinapoya bo'sh maydonda turardi).

**Yechim:** 
1. Konturning **eng uzun devori** topiladi → uning normali fasad yo'nalishi (2 nomzod: old/orqa).
2. Qo'shni binolar to'sib qo'ymagan tomon tanlanadi (16 yo'nalishli konus skaneri).

Natija: portal doim ko'cha/ochiq maydon tomonda, devor esa fasad bo'ylab.

### 2.5 1-o'quv korpusi (Iqtisodiyot fakulteti) — kontur tayyor

Shaftoli fasad, yoysimon shisha zinapoya minorasi (r = 5.6 m, balandligi 18.8 m),
mis rangli karniz, oq soyabon-lenta ("KUCH — BILIM VA TAFAKKURDA"), 4 pog'onali kirish.
**Holat:** geometriya yozilgan, lekin joylashuv hali aniqlanmagan — keyingi iteratsiyada
kontur markazi bo'yicha tekshiriladi (2-rasm, pastki qator).

### 2.6 Yo'l-yo'lakay topilgan va tuzatilgan xatolar

1. **`wm is not defined`** — `const` blok ichida e'lon qilinib, tashqarida ishlatilgan.
2. **Portal 25 m narida** — `eD` (kontur cheti) ikki marta qo'shilgan edi.
3. **Fasad yo'nalishi noto'g'ri** — 16 yo'nalishli skaner uzun devorga perpendikulyar
   bo'lmagan tomonni tanlardi; endi eng uzun devordan olinadi.
4. **Kampus binolari ikki marta** — tuman `.bin` da ham, kampusda ham chizilardi.

---

## 3. O'lchovlar

- `index.html`: **1007 KB** (o'zgarmadi), `data/*.bin`: 4.87 MB
- Kampus ko'rinishi: 120–139 draw call, xato yo'q
- Batafsil model narxi: 1 bino ≈ 3–4 mesh (avvalgi 2 mesh o'rniga) — sezilarli emas

---

## 4. Navbatdagi ishlar (v0.7.x)

1. **1-o'quv korpusi** — joylashuvni tugatish (kontur markazi + fasad cheti).
2. **Chorsu bozori** — gumbaz (foto `refs/chorsu.jpg`), 3 qavatli galereya halqasi.
3. **Teleminora** — panjara konstruksiya + kuzatuv zali (`refs/tvtower.jpg`).
4. **Nest One** — pog'onali art-deco minora, 266 m (`refs/nestone.jpg`).
5. **Hotel Uzbekistan** — mashhur panjara fasad (`refs/tashcity.jpg` bilan birga).
6. **Humo Arena** — muz saroyi gumbazi (`refs/humo.jpg`).
7. **Moliya instituti** — Finance kampus binosi (foto topilishi kerak).
8. Har bir model uchun **foto | render** taqqoslama jadvali (`shots/v7-taqqoslash.jpg` namunasi).


---

## 6. v0.7.1 — barcha institutsional binolar + ichki ko'rinish qoidasi

### 6.1 Yagona parametrik quruvchi (`v7_inst`)

Endi **barcha rol binolari** (litsey, 1/2-o'quv korpuslari, gimnaziya, ilmiy-innovatsiya
markazi, Moliya instituti va uning 5 korpusi — jami 12 ta) bitta foto-asosli qolipdan o'tadi:

- shaftoli/krem suvoq fasad (`soviet` tekstura: kemerli deraza + oq rom)
- **markaziy risalit** (kirish qanoti, binodan 2.4 m baland chiqadi) + ustidagi karniz
- yuqori karniz tasmasi (konturdan 3 % chiqadi) + oq parapet
- shisha kirish eshigi + **yozuvli soyabon** (bino nomi o'zbekcha) + 3 pog'onali zinapoya
  va kirish maydoni

Mesh narxi: har bino 3–5 mesh (avval 2) — 12 bino uchun ~40 mesh, sezilmaydi.

### 6.2 Kampus palitrasi

Kampusning qolgan 64 ta binosi ham (avval "klassik" sariq edi) endi `soviet` uslubida va
**5 xil shaftoli/krem rang** palitrasida (fotosuratdagi kabi), pozitsiya bo'yicha barqaror
tanlanadi — qayta yuklashda rang o'zgarmaydi.

### 6.3 Ichki ko'rinish — faqat TDIU

Talab bo'yicha: **ichki ko'rinish va "Xonalar" faqat `campus === 'main'` (TDIU) binolarida**
ko'rinadi. Moliya instituti va boshqa kampuslar — faqat tashqi ko'rinish.
Panel tablari shunga qarab dinamik yasaladi.

### 6.4 Drive

- **`kampus-v0.7-foto-2026-11-28.zip`** (3.9 MB) — to'liq deploy paketi
  (index.html 1013 KB, data/*.bin 4.87 MB, api/, vercel.json, game.v2.js, 3 skrinshot)
  `https://drive.google.com/file/d/1ftLVfGDsJU7PakJFXn95MWaVCKO9OI7m/view`
- OSM tile keshi: `osm-tiles-v06-2026-11-28.zip` (41 MB) — o'zgarmadi

### 6.5 O'lchov

- kampus ko'rinishi: **225 draw call / 555 422 uchburchak**, xato yo'q
- `index.html` **1013 KB**, `data/` 4.87 MB

### 6.6 Keyingi (v0.8)

1. Chorsu / teleminora / Nest One / Hotel Uzbekistan / Humo — foto bo'yicha (refs/ tayyor).
2. Litsey darvozasi (brick ustun + temir panjara + "AKADEMIK LITSEYI" yozuvi) — foto bor.
3. TDIU ichki ko'rinishi: foye/atrium fotosi topilsa, marmar pol + ustunlar qo'shiladi.


---

## 7. v0.7.2 — shahar landmarklari (foto bo'yicha)

Yangi modellashtirilgan binolar (hammasi `refs/` dagi foto asosida):

| Landmark | Koordinata | Model |
|---|---|---|
| **Chorsu bozori** | 41.32656, 69.23611 | yassi ko'k gumbaz (r=38, 0.34 siqilgan), 16 qirrali baraban + kemerli tokchalar, g'isht galereya halqasi (r=56), tepa chiroq, markaziy ustun + favvora (ichki fotodan) |
| **Toshkent teleminorasi** | 41.34797, 69.28464 | pastki pavilion (ko'k shisha + oq tasmalar, fotodagidek), **205 m panjara konstruksiya** (LineSegments — 1 draw call), 3 qavatli kuzatuv zallari, 150 m konus + qizil antenna, 375 m |
| **Tashkent City / Nest One** | 41.3122, 69.2519 | 3 ta to'q shisha slab (168/138/96 m) vertikal qirralar, tom + mexanik qavat + antenna, konsol plita; **Nest One — 4 pog'onali, 266 m + shpil** |
| **Akademik litsey darvozasi** | kampus | g'isht ustunlar, temir panjara, oq lavha: "TOSHKENT DAVLAT IQTISODIYOT UNIVERSITETI / AKADEMIK LITSEYI" (foto: `tdiual.uz` darvoza rasmi) |
| Humo Arena, Magic City, Ice City | avvaldan | saqlab qolindi |

**Muhim:** tuman `.bin` ichida landmark binolari ham bor edi (masalan Chorsu gumbazi oddiy quti
bo'lib chiqardi). Endi har landmark atrofida **`rx` radiusi** (55–95 m) bo'yicha tuman binolari
chetlab o'tiladi — `window.DISTRICTS.landmarks[].rx`.

**O'lchov:** butun shahar ko'rinishi **284 draw call** (260 edi), `index.html` **1023 KB**, xato yo'q.

### Qolgan ish (v0.8)
- Hotel Uzbekistan (foto topilmadi — Commons'da faqat ichki ko'rinishlar bor; tashqi fasad rasmi kerak)
- Magic City / Ice City ni foto bo'yicha qayta ishlash
- Chorsu interyeri: ichki gumbaz + rastalar (foto `refs/chorsu.jpg` — tayyor)
- TDIU foye/interyer fotosi topilsa — marmar pol, ustunlar, peshtaxta

---

## 5. Fayllar

```
tsue3d/
  refs/                 8 ta foto + README (manba, litsenziya, o'lchamlar)
  src/game.v2.js        +fasad uslublari, +V7_CUSTOM, +pickFront, +solidGroup
  shots/v7-taqqoslash.jpg  foto | render taqqoslama
  shots/v7-angles.jpg       bosh bino 4 burchakdan
```

Lokal commit: v0.7 (push qilinmagan).

---

## 8. v0.8 — SAYR: personaj, mashina, mototsikl va haqiqiy interyer

Bu bosqichda o'yin "kuzatish" rejimidan **o'ynaladigan** rejimga o'tdi: kamera ortidan
boshqariladigan odam, transport va **ichiga kirib yuriladigan** bino.

### 8.1 Boshqaruv

| Amal | Telefonda | Klaviaturada |
|---|---|---|
| Yurish / haydash | chap pastdagi **joystik** | `W A S D` yoki strelkalar |
| Yuguirsh | — | `Shift` (7.4 m/s) |
| Kirish / chiqish / transportga o'tirish | o'ngdagi **E** | `E` |
| Mashina / mototsikl chaqirish | «mashina» / «mototsikl» tugmalari | `E` (yaqin transportga) |
| Sayrdan chiqish | yuqoridagi **✕** | `Esc` |

Kirish: yuqori navigatsiyadagi yangi **"Sayr"** tugmasi. Sayr rejimida oddiy HUD
(chip'lar, nav, toast) yashiriladi — faqat o'yin boshqaruvi qoladi.

### 8.2 Personaj

- Balandligi ≈1.8 m, 15 ta primitiv: tana, bosh + soch, **sonlar va yelkalar alohida
  guruhlarda** — yurganda qo'l-oyoq qarshi fazada tebranadi (`sw` sinus), sakrash yo'q.
- Tezlik: yurish **3.6 m/s**, yugurish **7.4 m/s**, burilish silliq (lerp).
- Spawn: kampusdagi bo'sh joy **halqa bo'ylab qidiriladi** — bino qutisi ham, daraxt ham
  5 m masofada bo'lmasligi shart (daraxtlar `Math.random` bilan qo'yiladi, shuning uchun
  har yuklashda joy o'zgaradi — qidiruv ham har safar yangilanadi).

### 8.3 Transport

| | Mashina | Mototsikl |
|---|---|---|
| O'lcham | 4.35 × 1.86 m, shisha kabina, yon oynalar, ko'zgular, panjara, fara + stop | 2.4 m karkas, bak, o'rindiq, vilka, rul, egzoz, fara + stop |
| Tezlik | max **27 m/s** (97 km/soat), tezlanish 9 | max **33 m/s** (119 km/soat), tezlanish 13 |
| Kamera | orqada 13.5 m, balandlik 5.2 m | xuddi shunday |

- Transport **E** bilan chaqiriladi va o'yinchining 5 m oldiga keladi (`SAYR.want` —
  chaqirilgan transport ustuvor, aks holda eng yaqini tanlanadi).
- Tushganda o'yinchi transportning yoniga (2.4 m) qo'yiladi; agar u joy to'siq bo'lsa —
  narigi tomoniga.
- Mototsiklda personaj transport ustida turadi (oyoqlari bukilgan), mashinada yashiriladi.

### 8.4 Haqiqiy interyer (faqat struktura emas)

Kampusdagi eng yaqin binoga (26 m) **E** bosilsa — bino ichiga "kiriladi". Interyer
shahar koordinatalaridan **46 000 m** uzoqda, alohida guruhda quriladi (`ROOM_ORIGIN`),
shuning uchun shahar bilan hech qanday ziddiyat yo'q va u yerda faqat xona renderlanadi
(49 draw call).

Xona: **38 × 30 m, balandligi 4.4 m**, haqiqiy yuriladigan:

- marmar pol (chok chiziqlari), shiftda 5 ta yorug'lik paneli + **5 nuqtali yoritish**;
- **+Z devorda 4.2 m eshik teshigi** (ikkita yon bo'lak + tepa qism) — o'yinchi shu yerdan
  "kiradi";
- 8 ta ustun (ikki qatorda), har biri **kollayder** (r 0.72 m) — urib o'tib ketilmaydi;
- qabul peshtaxtasi (9 m) ustida monitor, orqasida stul, kollayderi bilan;
- 2 ta **lift eshigi** + tugma paneli, 4 ta devor ramkasi, 4 ta skameyka, 2 ta fikus;
- kirish gilami, orqa devorda bino nomi (`v7TextPlane` bilan avtomatik shrift);
- xona tashqarisida katta "quti" (BackSide) — ko'chadagi shahar ko'rinmaydi;
- devor/ustun/transport **kollayderlari**: AABB emas, aylana bo'yicha (tez va aniq).

Chiqish — yana **E**; o'yinchi kirishdan oldingi joyiga qaytadi (`SAYR.roomReturn`).

### 8.5 Bu bosqichda tuzatilgan xatolar

1. **Kamera yaqin tekisligi 3 m edi** — sayrda personaj va transport ko'rinmasdi.
   Endi sayrda `near = 0.3`, `fov = 58` (chiqishda 3 / 42 ga qaytadi).
2. **Kamera lerpi past FPS'da yetib bormasdi** — 25 m dan uzoq bo'lsa darhol o'rnatiladi,
   `dt` chegarasi 0.05 → **0.2 s**.
3. **Transport 90° yonboshlab yurardi** — modellar +X bo'ylab qurilgan, `rotation.y = yaw`
   esa +Z ni beradi → `yaw − π/2`. Mototsikldagi personaj burilishi ham tuzatildi.
4. **Ustun/daraxt ichiga kirib ketish** — kamera endi o'yinchidan orqaga qarab qadamlab
   tekshiradi (daraxt radiusi 3.4 m, xonada ustun/devor 0.45 m), birinchi bo'sh nuqtada
   to'xtaydi; harakatda esa daraxt tanasi (r + 1 m) to'siq bo'ladi.
5. **Ikki marta toast/ikki hint** — sayrda toast butunlay yashiriladi.
6. **"Mototsikl" tugmasi mashinaga o'tirib olardi** — endi chaqirilgan transport ustuvor.
7. Xona kollayderi **lokal** koordinatada hisoblanardi (46 000 → 16), shu sababli o'yinchi
   devorga yopishib qolardi — jahon koordinatasiga o'tkazildi.

### 8.6 O'lchov va sinov

| Ko'rsatkich | Qiymat |
|---|---|
| `index.html` | 1052 KB (1045 edi) |
| Tuman `.bin` | 12 ta, 4.87 MB |
| Sayr — shahar | ~150 draw call |
| Sayr — interyer | **49 draw call** |
| Sahifa xatolari | 0 |
| Yurish (3 s, dasturiy render ~4 FPS) | 4 m |
| Mashina (3 s) | 33.7 m, `vel` 27.0 |
| Mototsikl (2.5 s) | 31.9 m |
| Kirish/chiqish, transportga o'tirish | ishlaydi (`SAYR.inRoom`, `SAYR.mode`), chiqishda `near/fov` tiklanadi |

Eslatma: dasturiy render (SwiftShader) da FPS past bo'lgani uchun yurish masofasi kam
ko'rinadi — haqiqiy qurilmada 60 FPS da tezlik to'liq (3.6 m/s).

### 8.7 Fayllar

```
tsue3d/src/game.v2.js        +SAYR moduli (~600 satr): kolliziya, personaj, transport, interyer
tsue3d/src/index.v2.template.html  +"Sayr" nav tugmasi
kampus-app/index.html        1052 KB (qurilgan)
tsue3d/shots/v8-01-sayr.png            piyoda
tsue3d/shots/v8-03-mashina.png         mashinada
tsue3d/shots/v8-04-mototsikl.png       mototsiklda
tsue3d/shots/v8-05-interyer.png        interyer (kirish)
tsue3d/shots/v8-06-interyer-yurish.png interyer (yurish)
tsue3d/shots/v8-sayr-taqqoslash.jpg    4 rejim — 2×2
```

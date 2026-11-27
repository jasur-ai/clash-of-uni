#!/usr/bin/env python3
"""
Toshkent 3D dunyosi: POI (nuqtalar) + asosiy avenje + ko'cha chiroqlari.
build/districts.json ga 'pois', 'avenues', 'lamps' kalitlarini qo'shadi (idempotent).
POI joylashuvi taxminiy (ommaviy manbalar/ma'lumotlar asosida) — o'yin uchun.
"""
import json, math, os
import gen_city as GC

HERE = os.path.dirname(os.path.abspath(__file__))

POIS = [
    # --- universitetlari ---
    ('O\'zbekiston Milliy universiteti', 'university', 41.3450, 69.2130, 'M. Ulug\'bek nomidagi · 1918 · Vuzgorodok'),
    ('TDTU — texnika universiteti', 'university', 41.3525, 69.2081, 'Islom Karimov nomidagi · 1951 · Universitet shoh ko\'chasi 2A'),
    ('Toshkent tibbiyot akademiyasi', 'university', 41.3410, 69.2090, 'Farobiy ko\'chasi 2 · 1993 · Olmazor'),
    ('TDPU — pedagogika universiteti', 'university', 41.2815, 69.2380, 'Nizomiy nomidagi · 1931 · Yusuf Hos Hojib 103'),
    ('Inha universiteti', 'university', 41.3175, 69.3080, '2014 · Ziyolilar ko\'chasi 9 · Mirzo Ulug\'bek'),
    ('IT Park universiteti', 'university', 41.3050, 69.3260, '2019 · Maxtumquli shoh ko\'chasi · Yashnobod'),
    ('UWED — diplomatiya universiteti', 'university', 41.3050, 69.2350, 'Jahon iqtisodiyoti va diplomatiyasi · 1991'),
    ('Sharqshunoslik universiteti', 'university', 41.2990, 69.2370, '1918 · Shayxontohur'),
    ('Westminster universiteti', 'university', 41.2900, 69.2720, '2002 · Mirobod'),
    ('AKFA universiteti', 'university', 41.3290, 69.3000, '2014 · Mirzo Ulug\'bek'),
    ('Turin politexnika universiteti', 'university', 41.2955, 69.2470, '2009 · markaz'),
    # --- akademik litseylari ---
    ('TDTU Kimyo litseyi', 'lyceum', 41.3545, 69.2070, 'O\'rta maxsus ta\'lim'),
    ('Olmazor akademik litseyi', 'lyceum', 41.3365, 69.2145, 'O\'rta maxsus ta\'lim'),
    ('Yunusobod akademik litseyi', 'lyceum', 41.3470, 69.2520, 'O\'rta maxsus ta\'lim'),
    ('Chilonzor akademik litseyi', 'lyceum', 41.2745, 69.2065, 'O\'rta maxsus ta\'lim'),
    ('Yakkasaroy akademik litseyi', 'lyceum', 41.2835, 69.2660, 'O\'rta maxsus ta\'lim'),
    ('Sergeli akademik litseyi', 'lyceum', 41.2445, 69.2185, 'O\'rta maxsus ta\'lim'),
    # --- maktablar ---
    ('56-sonli ixtisoslashgan maktab', 'school', 41.3100, 69.2620, 'Mirobod · chuqurlashtirilgan'),
    ('110-sonli maktab', 'school', 41.3260, 69.2580, 'Yunusobod · umumiy o\'rta ta\'lim'),
    ('102-sonli maktab', 'school', 41.2785, 69.2105, 'Chilonzor · umumiy o\'rta ta\'lim'),
    ('17-sonli maktab', 'school', 41.3415, 69.2475, 'Yunusobod · umumiy o\'rta ta\'lim'),
    ('34-sonli maktab', 'school', 41.2405, 69.2135, 'Sergeli · umumiy o\'rta ta\'lim'),
    ('5-sonli maktab', 'school', 41.3000, 69.2345, 'Shayxontohur · umumiy o\'rta ta\'lim'),
    # --- bog'chalar ---
    ('14-sonli bog\'cha', 'kindergarten', 41.3050, 69.2400, 'Maktabgacha ta\'lim · Shayxontohur'),
    ('27-sonli bog\'cha', 'kindergarten', 41.3390, 69.2550, 'Maktabgacha ta\'lim · Yunusobod'),
    ('9-sonli bog\'cha', 'kindergarten', 41.3085, 69.2680, 'Maktabgacha ta\'lim · Mirobod'),
    ('31-sonli bog\'cha', 'kindergarten', 41.2470, 69.2090, 'Maktabgacha ta\'lim · Sergeli'),
    ('22-sonli bog\'cha', 'kindergarten', 41.2945, 69.1705, 'Maktabgacha ta\'lim · Uchtepa'),
    ('12-sonli bog\'cha', 'kindergarten', 41.3235, 69.3330, 'Maktabgacha ta\'lim · Yashnobod'),
    # --- ovqatlanish maskanlari ---
    ('Afandi', 'food', 41.3070, 69.2690, 'O\'zbek milliy taomlari · Mirobod'),
    ('Evos — Yunusobod', 'food', 41.3440, 69.2490, 'Fast food · tarmoq'),
    ('Caravanserai', 'food', 41.3110, 69.2405, 'Restoran · sharq oshxonasi'),
    ('Beshqozon', 'food', 41.3020, 69.2460, 'O\'zbek taomlari · Shayxontohur'),
    ('Plov Center', 'food', 41.2895, 69.2530, 'Palov · Yakkasaroy'),
    ('Chayxona Eshon Bobo', 'food', 41.3150, 69.2280, 'Choyxona · Shayxontohur'),
    # --- o'quv markazlari ---
    ('PDP o\'quv markazi', 'educenter', 41.2995, 69.2610, 'Dasturlash · IELTS · CEFR'),
    ('Cambridge Academy', 'educenter', 41.3075, 69.2500, 'Xalqaro imtihonlar · markaz'),
    ('IELTS markazi', 'educenter', 41.3135, 69.2425, 'Ingliz tili imtihon markazi'),
    ('UCEC til markazi', 'educenter', 41.2950, 69.2650, 'Xorijiy tillar maktabi'),
    # --- shahar maskanlari / diqqatga sazovor joylar ---
    ('Mustaqillik shoh maydoni', 'spot', 41.3115, 69.2460, 'Poytaxt markazi · Amir Temur maydoni'),
    ('TV minorasi', 'spot', 41.3455, 69.2870, '378 m · 1985 · shahar simvoli'),
    ('Oloy bozori', 'spot', 41.3220, 69.2410, 'Tarixiy bozor · 1870-yillar'),
    ('Alisher Navoiy nomidagi milliy bog\'', 'park', 41.2990, 69.2265, 'Milliy bog\' · Shayxontohur'),
    ('Mirzo Ulug\'bek Botanika bog\'i', 'park', 41.3290, 69.2780, 'Botanika bog\'i · Yunusobod'),
]

CAT_NAME = {
    'university': 'Universitet', 'lyceum': 'Akademik litsey', 'school': 'Maktab',
    'kindergarten': "Bog'cha", 'food': 'Ovqatlanish', 'educenter': "O'quv markazi",
    'park': "Bog' / xiyobon", 'spot': 'Diqqatga sazovor joy',
}

def main():
    p = os.path.join(HERE, 'build', 'districts.json')
    d = json.load(open(p))

    pois = []
    for i, (name, cat, lat, lon, info) in enumerate(POIS):
        x, z = GC.proj(lat, lon)
        pois.append({'id': 'poi-' + str(i), 'name': name, 'cat': cat,
                     'catName': CAT_NAME[cat], 'x': round(x, 1), 'z': round(z, 1), 'info': info})

    # protsedural bog'larga nom berish + POI sifatida qo'shish
    tuman_nom = GC.NAMES
    park_kinds = ["markaziy bog'", 'xiyoboni', "istirohat bog'i"]
    for i, pk in enumerate(d.get('parks', [])):
        t = tuman_nom.get(pk.get('tuman'), 'Tuman')
        nm = f"{t} — {park_kinds[i % len(park_kinds)]}"
        pois.append({'id': f"park-{i}", 'name': nm, 'cat': 'park',
                     'catName': CAT_NAME['park'],
                     'x': pk['x'], 'z': pk['z'], 'info': 'Yashil zona · istirohat'})

    # har bir protsedural tumanga 1 ta asosiy avenje + chiroqlar
    boundary = [GC.proj(la, lo) for (lo, la) in GC.BOUNDARY]
    cells = GC.voronoi(GC.SITES, boundary)
    avenues, lamps = [], []
    for key, cell in cells.items():
        if key in ('chilonzor', 'yunusobod'):
            continue
        xs = [q[0] for q in cell]; zs = [q[1] for q in cell]
        mx, mz = (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2
        horizontal = (max(xs) - min(xs)) >= (max(zs) - min(zs))
        # markazdan ikki tomonga chegara topish
        def walk(sgn):
            t = 0.0
            last = (mx, mz)
            while t < 6000:
                t += 25.0
                if horizontal:
                    p = (mx + sgn * t, mz)
                else:
                    p = (mx, mz + sgn * t)
                if not GC.point_in_poly(p[0], p[1], cell):
                    return last
                last = p
            return last
        a, b = walk(-1), walk(1)
        avenues.append([round(a[0], 1), round(a[1], 1), round(b[0], 1), round(b[1], 1)])
        # chiroqlar har 42 m, ikki tomondan navbatma-navbat
        L = math.hypot(b[0] - a[0], b[1] - a[1])
        if L > 1:
            ux, uz = (b[0] - a[0]) / L, (b[1] - a[1]) / L
            nx, nz = -uz, ux
            n_lamps = int(L / 42)
            for i in range(1, n_lamps):
                t = i / n_lamps
                off = 12.5 if i % 2 else -12.5
                lx, lz = a[0] + (b[0] - a[0]) * t + nx * off, a[1] + (b[1] - a[1]) * t + nz * off
                lamps.append([round(lx, 1), round(lz, 1)])

    d['pois'] = pois
    d['avenues'] = avenues
    d['lamps'] = lamps
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(d, f, separators=(',', ':'))
    print(f"pois: {len(pois)} ({sum(1 for x in pois if x['cat']=='university')} universitet) | avenjelar: {len(avenues)} | chiroqlar: {len(lamps)}")
    print(f"-> {p} ({round(os.path.getsize(p)/1024/1024, 2)} MB)")

if __name__ == '__main__':
    main()

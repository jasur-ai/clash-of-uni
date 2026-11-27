#!/usr/bin/env python3
"""
Toshkent shahri 12 tumanini birlashtirgan 3D dunyo ma'lumotini generatsiya qiladi.

  * Chilonzor & Yunusobod — build/districts.json dagi HAQIQIY OSM geometriyasi saqlanadi.
  * Qolgan 10 tuman — protsedural, ammo ishonarli shahar to'ri:
    - Voronoi chegaralar (nuqta-chegara sivirish) — bo'shliq va qoplash yo'q
    - har tuman o'z xarakteriga ega (balandlik, zichlik, tarmoq burchagi)
    - landmark va kampuslar atrofi tozalanadi (exclusion zone)
  * Extras: bog'lar (park discs), daraxtlar, TDIU kampuslari, 4 ta landmark.

Chiqish: build/districts.json (ustiga yozadi, avval .bak nusxa olinadi)
"""
import json, math, os, struct, base64, hashlib, random, sys

HERE = os.path.dirname(os.path.abspath(__file__))
WORLD_LAT0, WORLD_LON0 = 41.30930, 69.24990
M_LAT = 110574.0
K_LON = 111320.0 * math.cos(math.radians(WORLD_LAT0))

def proj(lat, lon):
    return ((lon - WORLD_LON0) * K_LON, -(lat - WORLD_LAT0) * M_LAT)

def seed_rng(key):
    return random.Random(int(hashlib.md5(key.encode()).hexdigest(), 16) & 0xffffffff)

# ---------------------------------------------------------------- tumanlar
SITES = {  # taxminiy markazlar (OSM relation ma'lumotlari mavjud bo'lmaganda)
    'chilonzor':     (41.276, 69.204),
    'yunusobod':     (41.344, 69.245),
    'olmazor':       (41.331, 69.208),
    'uchtepa':       (41.296, 69.166),
    'mirzo_ulugbek': (41.343, 69.315),
    'mirobod':       (41.306, 69.273),
    'shayxontohur':  (41.301, 69.230),
    'sergeli':       (41.243, 69.215),
    'bektemir':      (41.244, 69.318),
    'yashnobod':     (41.326, 69.337),
    'yakkasaroy':    (41.287, 69.260),
    'yangihayot':    (41.216, 69.270),
}
NAMES = {
    'chilonzor': 'Chilonzor', 'yunusobod': 'Yunusobod', 'olmazor': 'Olmazor',
    'uchtepa': 'Uchtepa', 'mirzo_ulugbek': "Mirzo Ulug'bek", 'mirobod': 'Mirobod',
    'shayxontohur': 'Shayxontohur', 'sergeli': 'Sergeli', 'bektemir': 'Bektemir',
    'yashnobod': 'Yashnobod', 'yakkasaroy': 'Yakkasaroy', 'yangihayot': 'Yangihayot',
}
# xarakter: burchak(rad), mayda ko'cha(m), blokdagi qurilish chuqurligi, balandlik profili
CHAR = {
    'olmazor':       dict(angle=0.10, minor=235, fw=30, gap=9,  h_mu=24, h_sd=7,  h_max=42,  jitter=0.28),
    'uchtepa':       dict(angle=-0.06, minor=225, fw=28, gap=10, h_mu=14, h_sd=6,  h_max=33,  jitter=0.30),
    'mirzo_ulugbek': dict(angle=0.38, minor=300, fw=32, gap=12, h_mu=12, h_sd=6,  h_max=36,  jitter=0.34),  # shaxsiy uylar + 9qavat
    'mirobod':       dict(angle=0.16, minor=240, fw=28, gap=9,  h_mu=18, h_sd=8,  h_max=48,  jitter=0.30),
    'shayxontohur':  dict(angle=0.44, minor=115, fw=15, gap=5,  h_mu=6,  h_sd=2.5, h_max=15,  jitter=0.22),  # eski shahar
    'sergeli':       dict(angle=-0.32, minor=260, fw=44, gap=14, h_mu=38, h_sd=11, h_max=70,  jitter=0.20),  # yangi panel
    'bektemir':      dict(angle=0.05, minor=310, fw=46, gap=16, h_mu=9,  h_sd=4,  h_max=22,  jitter=0.34),   # sanoat
    'yashnobod':     dict(angle=0.28, minor=250, fw=30, gap=11, h_mu=14, h_sd=6,  h_max=45,  jitter=0.30),
    'yakkasaroy':    dict(angle=0.12, minor=215, fw=26, gap=8,  h_mu=30, h_sd=12, h_max=64,  jitter=0.28),   # zich markaz
    'yangihayot':    dict(angle=-0.18, minor=285, fw=40, gap=13, h_mu=40, h_sd=13, h_max=80,  jitter=0.24),  # yangi razvitar
}

# shahar tashqi chegarasi (taxminiy silhouette, lon/lat)
BOUNDARY = [(69.115,41.285),(69.128,41.330),(69.155,41.362),(69.205,41.388),
            (69.260,41.392),(69.310,41.378),(69.350,41.350),(69.372,41.312),
            (69.375,41.270),(69.352,41.232),(69.315,41.203),(69.270,41.190),
            (69.220,41.192),(69.175,41.205),(69.140,41.235),(69.115,41.258)]

# exclusion zones (landmarklar + kampuslar)
def ll(lat, lon):
    return proj(lat, lon)
EXCLUSIONS = [
    (ll(41.3122, 69.2519), 260),   # Tashkent City / Nest One
    (ll(41.3056, 69.2533), 170),   # Humo Arena
    (ll(41.3039, 69.2452), 150),   # Magic City
    (ll(41.2910, 69.2545), 120),   # Ice City
    ((0.0, 0.0), 430),             # TDIU Asosiy kampus
    (ll(41.3093, 69.2499), 0),     # same point (origin)
    (None, 0),                     # Finance kampus — to'ldiriladi pastda (kampuslar.json)
]

# landmarklar (JS modellarida ishlatiladi)
LANDMARKS = [
    {'id': 'tashkent_city', 'name': 'Tashkent City', 'sub': 'Nest One · 266 m',
     'lat': 41.3122, 'lon': 69.2519, 'h': 266},
    {'id': 'humo_arena', 'name': 'Humo Arena', 'sub': 'Markaziy muz saroyi · 12 500',
     'lat': 41.3056, 'lon': 69.2533, 'h': 40},
    {'id': 'magic_city', 'name': 'Magic City', 'sub': "Ko'ngilochar park",
     'lat': 41.3039, 'lon': 69.2452, 'h': 52},
    {'id': 'ice_city', 'name': 'Ice City', 'sub': "Yopiq muz majmuasi",
     'lat': 41.2910, 'lon': 69.2545, 'h': 24},
]

# ---------------------------------------------------------------- Voronoi
def clip_halfplane(poly, pi, pj):
    """|p-pi|^2 <= |p-pj|^2 yarim tekisligi bilan qisish (Sutherland–Hodgman)."""
    px, pz = pi; qx, qz = pj
    dx, dz = qx - px, qz - pz
    # 2*(q-p)·x <= |q|^2 - |p|^2
    c = (qx * qx + qz * qz) - (px * px + pz * pz)
    def val(p):
        return 2 * (dx * p[0] + dz * p[1]) - c
    out = []
    n = len(poly)
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]
        va, vb = val(a), val(b)
        a_in, b_in = va <= 0, vb <= 0
        if a_in:
            out.append(a)
        if a_in != b_in:
            t = va / (va - vb)
            out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t))
    return out

def voronoi(sites, boundary):
    cells = {}
    items = list(sites.items())
    for i, (ki, (la, lo)) in enumerate(items):
        poly = [(x, z) for (x, z) in boundary]
        pi = proj(la, lo)
        for j, (kj, (lj, lo2)) in enumerate(items):
            if i == j:
                continue
            poly = clip_halfplane(poly, pi, proj(lj, lo2))
            if len(poly) < 3:
                break
        cells[ki] = poly
    return cells

def point_in_poly(x, z, poly):
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, zi = poly[i]; xj, zj = poly[j]
        if ((zi > z) != (zj > z)) and (x < (xj - xi) * (z - zi) / (zj - zi + 1e-12) + xi):
            inside = not inside
        j = i
    return inside

def ring_area(pts):
    a = 0.0
    for i in range(len(pts)):
        x1, z1 = pts[i]; x2, z2 = pts[(i + 1) % len(pts)]
        a += x1 * z2 - x2 * z1
    return abs(a) / 2

def dp_simplify(points, tol):
    if len(points) < 4:
        return list(points)
    p0 = points[0]
    far = max(range(len(points)), key=lambda i: (points[i][0]-p0[0])**2 + (points[i][1]-p0[1])**2)
    def simplify(pts):
        if len(pts) < 3:
            return pts
        a, b = pts[0], pts[-1]
        dx, dz = b[0]-a[0], b[1]-a[1]
        L = math.hypot(dx, dz) or 1e-9
        best, idx = 0.0, 0
        for i in range(1, len(pts)-1):
            d = abs(dz*(pts[i][0]-a[0]) - dx*(pts[i][1]-a[1])) / L
            if d > best:
                best, idx = d, i
        if best > tol:
            return simplify(pts[:idx+1])[:-1] + simplify(pts[idx:])
        return [a, b]
    A = simplify(points[:far+1])
    B = simplify(points[far:] + [points[0]])
    out = A[:-1] + B[:-1]
    return out if len(out) >= 3 else list(points)

# ---------------------------------------------------------------- qurilish generatsiyasi
def gen_buildings(key, poly, rng):
    cfg = CHAR[key]
    ang = cfg['angle']; ca, sa = math.cos(ang), math.sin(ang)
    # rotated frame bbox
    rp = [(ca*x + sa*z, -sa*x + ca*z) for (x, z) in poly]
    xs = [p[0] for p in rp]; zs = [p[1] for p in rp]
    x0, x1, z0, z1 = min(xs), max(xs), min(zs), max(zs)
    s = cfg['minor']          # ko'cha tarmog'i qadami
    sw = 13 if s < 150 else 17  # ko'cha kengligi
    fw, gap = cfg['fw'], cfg['gap']
    blds = []
    y = z0
    row = 0
    while y < z1:
        # blok ichki zona
        by0, by1 = y + sw/2, y + s - sw/2
        if by1 - by0 > 12:
            x = x0
            while x < x1:
                if x + fw > x1:
                    break
                cxr, cyr = x + fw/2, (by0+by1)/2
                # dunyo koordinatalariga qaytarish
                wx = ca*cxr - sa*cyr
                wz = sa*cxr + ca*cyr
                if point_in_poly(wx, wz, poly):
                    ok = True
                    for (ex, zz), er in EXCLUSIONS:
                        if ex is not None and math.hypot(wx-ex, wz-zz) < er:
                            ok = False; break
                    if ok:
                        bw = fw * (1 - rng.uniform(0.15, 0.42))
                        bd = (by1-by0) * (1 - rng.uniform(0.25, 0.55))
                        if bd < 6: bd = 6
                        h = max(4.0, min(cfg['h_max'], rng.gauss(cfg['h_mu'], cfg['h_sd'])))
                        if rng.random() < 0.07:   # ba'zi binolar balandroq
                            h = min(cfg['h_max'], h * rng.uniform(1.5, 2.15))
                        # to'rtburchak (ba'zan L-shakl), jitter bilan
                        jx, jz = rng.uniform(-2.5, 2.5), rng.uniform(-2.5, 2.5)
                        bw = min(bw, fw - 3)
                        corners = [(-bw/2+jx, -bd/2+jz), (bw/2+jx, -bd/2+jz),
                                   (bw/2+jx, bd/2+jz), (-bw/2+jx, bd/2+jz)]
                        pts = []
                        for (lx, lz) in corners:
                            pts.append((ca*lx - sa*lz + wx, sa*lx + ca*lz + wz))
                        blds.append((pts, h))
                x += fw + gap
        y += s
        row += 1
    return blds

def encode_district(name, ring, bins):
    buf = bytearray()
    buf += struct.pack('<I', len(bins))
    skipped = 0
    for pts, h in bins:
        x0, z0 = round(pts[0][0]), round(pts[0][1])
        if abs(x0) > 32000 or abs(z0) > 32000:
            skipped += 1; continue
        q = [[round(p[0]) - x0, round(p[1]) - z0] for p in pts]
        if any(abs(dx) > 32000 or abs(dz) > 32000 for dx, dz in q):
            skipped += 1; continue
        buf += struct.pack('<hhBB', x0, z0, len(q), max(0, min(255, round(h))))
        prev = [0, 0]
        for dx, dz in q[1:]:
            buf += struct.pack('<hh', dx - prev[0], dz - prev[1])
            prev = [dx, dz]
    bpoly = dp_simplify(ring, 8.0)
    return {
        'name': name,
        'ring': [[round(x), round(z)] for x, z in (bpoly if len(bpoly) > 2 else ring)],
        'count': len(bins) - skipped,
        'skipped': skipped,
        'b64': base64.b64encode(bytes(buf)).decode(),
    }

def gen_parks(key, poly, rng, n_parks=2):
    xs = [p[0] for p in poly]; zs = [p[1] for p in poly]
    cx, cz = (min(xs)+max(xs))/2, (min(zs)+max(zs))/2
    parks = []
    tries = 0
    while len(parks) < n_parks and tries < 60:
        tries += 1
        px = rng.uniform(min(xs), max(xs)); pz = rng.uniform(min(zs), max(zs))
        if not point_in_poly(px, pz, poly):
            continue
        ok = True
        for (ex, zz), er in EXCLUSIONS:
            if ex is not None and math.hypot(px-ex, pz-zz) < er + 60:
                ok = False; break
        for p in parks:
            if math.hypot(px-p['x'], pz-p['z']) < max(p['rx'], p['rz']) + 130:
                ok = False; break
        if not ok:
            continue
        parks.append({'x': round(px,1), 'z': round(pz,1),
                      'rx': round(rng.uniform(70, 150),1), 'rz': round(rng.uniform(50, 110),1),
                      'rot': round(rng.uniform(0, math.pi), 2)})
    return parks

def main():
    p = os.path.join(HERE, 'build', 'districts.json')
    old = json.load(open(p))
    districts = old['districts']           # Chilonzor + Yunusobod saqlanadi
    print('mavjud:', {k: v['count'] for k, v in districts.items()})

    # Finance kampus exclusion — kampuslar.json dan
    try:
        camp = json.load(open(os.path.join(HERE, 'build', 'campuses.json')))
        for c in camp['campuses']:
            if c['id'] == 'finance':
                EXCLUSIONS[-1] = ((c['cx'], c['cz']), 430)
    except Exception as e:
        print('finance exclusion topilmadi:', e)
        EXCLUSIONS[-1] = ((2857.0, -1668.0), 430)

    boundary = [proj(la, lo) for (lo, la) in BOUNDARY]
    cells = voronoi(SITES, boundary)
    total_new = 0
    all_parks, all_trees = [], []
    for key, cell in cells.items():
        if key in ('chilonzor', 'yunusobod'):
            continue  # haqiqiy OSM ma'lumot bor
        rng = seed_rng('tsh-' + key)
        blds = gen_buildings(key, cell, rng)
        # balandlikka qarab xarita (render JS da) — faqat saqlash
        enc = encode_district(NAMES[key], cell, blds)
        districts[key] = enc
        total_new += enc['count']
        print(f'{key:15s} {enc["count"]:6d} bino, halqa {len(enc["ring"])} nuqta')
        # bog'lar
        parks = gen_parks(key, cell, seed_rng('park-' + key), 2)
        all_parks += [{**pk, 'tuman': key} for pk in parks]
        # bog' daraxtlari
        for pk in parks:
            r2 = seed_rng(f'parktrees-{key}-{pk["x"]}')
            for _ in range(46):
                a = r2.uniform(0, math.pi * 2); rr = math.sqrt(r2.random())
                tx = pk['x'] + math.cos(a) * pk['rx'] * rr
                tz = pk['z'] + math.sin(a) * pk['rz'] * rr
                all_trees.append([round(tx, 1), round(tz, 1), round(r2.uniform(0.7, 1.5), 2)])
        # asosiy ko'cha bo'ylab chinor daraxti qatori (cell markazi orqali uzun o'qqa perpendikulyar)
        xs = [q[0] for q in cell]; zs = [q[1] for q in cell]
        mx, mz = (min(xs)+max(xs))/2, (min(zs)+max(zs))/2
        horizontal = (max(xs)-min(xs)) >= (max(zs)-min(zs))
        r3 = seed_rng('street-' + key)
        n_t = int(((max(zs)-min(zs)) if horizontal else (max(xs)-min(xs))) / 55)
        for i in range(n_t):
            t = (i + 0.5) / n_t
            if horizontal:
                tx, tz = min(xs) + t*(max(xs)-min(xs)), mz + r3.uniform(-9, 9)
            else:
                tx, tz = mx + r3.uniform(-9, 9), min(zs) + t*(max(zs)-min(zs))
            if not point_in_poly(tx, tz, cell):
                continue
            in_excl = False
            for (ex, zz), er in EXCLUSIONS:
                if ex is not None and math.hypot(tx-ex, tz-zz) < er:
                    in_excl = True; break
            if not in_excl:
                all_trees.append([round(tx, 1), round(tz, 1), round(r3.uniform(0.8, 1.35), 2)])

    print('yangi bino jami:', total_new, '| bog\'lar:', len(all_parks), '| daraxtlar:', len(all_trees))

    # landmark koordinatalari (meter)
    lms = []
    for lm in LANDMARKS:
        x, z = proj(lm['lat'], lm['lon'])
        lms.append({**lm, 'x': round(x, 1), 'z': round(z, 1)})

    old.setdefault('meta', {})['source'] = ('Chilonzor/Yunusobod: © OpenStreetMap contributors (ODbL). '
                                            'Boshqa tumanlar: protsedural generatsiya (taxminiy). '
                                            'Landmarklar: Wikidata/ommaviy manbalar.')
    old['parks'] = all_parks
    old['trees'] = all_trees
    old['landmarks'] = lms
    backup = p + '.bak'
    if not os.path.exists(backup):
        os.replace(p, backup)
        print('backup ->', backup)
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(old, f, separators=(',', ':'))
    print('->', p, round(os.path.getsize(p) / 1024 / 1024, 2), 'MB')

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Offline: data/tiles/*.json (Overpass bbox tile'lari) lardan 12 tumanning
HAQIQIY bino geometriyasini yig'adi -> build/districts.json ['districts'].

Chegara: build/districts.json dagi `ring`lar — 12 tumanning hammasi endi
HAQIQIY OSM relation chegaralari (v0.7, 2026-11-28).
Avval har bir ring tekshiriladi (point-in-poly); hech qaysisiga tushmasa,
shahar chegarasi (BOUND_XY) ichida bo'lsa — eng yaqin sayt (Voronoi)
zaxira varianti sifatida, log'da sanaladi; aks holda tashlab yuboriladi.
Overpass kerak emas.
"""
import json, math, os, struct, base64, hashlib, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'data', 'tiles')
BUILD = os.path.join(HERE, 'build')
WORLD_LAT0, WORLD_LON0 = 41.30930, 69.24990
M_LAT = 110574.0
K_LON = 111320.0 * math.cos(math.radians(WORLD_LAT0))
MIN_AREA = 30.0
DP_TOL = 1.6

SITES = {
    'chilonzor':     (41.276, 69.204), 'yunusobod':     (41.344, 69.245),
    'olmazor':       (41.331, 69.208), 'uchtepa':       (41.296, 69.166),
    'mirzo_ulugbek': (41.343, 69.315), 'mirobod':       (41.306, 69.273),
    'shayxontohur':  (41.301, 69.230), 'sergeli':       (41.243, 69.215),
    'bektemir':      (41.244, 69.318), 'yashnobod':     (41.326, 69.337),
    'yakkasaroy':    (41.287, 69.260), 'yangihayot':    (41.216, 69.270),
}
NAMES = {
    'chilonzor': 'Chilonzor', 'yunusobod': 'Yunusobod', 'olmazor': 'Olmazor',
    'uchtepa': 'Uchtepa', 'mirzo_ulugbek': "Mirzo Ulug'bek", 'mirobod': 'Mirobod',
    'shayxontohur': 'Shayxontohur', 'sergeli': 'Sergeli', 'bektemir': 'Bektemir',
    'yashnobod': 'Yashnobod', 'yakkasaroy': 'Yakkasaroy', 'yangihayot': 'Yangihayot',
}
REAL_FIRST = ['chilonzor', 'yunusobod']          # haqiqiy OSM relation ringlar
BOUNDARY = [(69.115,41.285),(69.128,41.330),(69.155,41.362),(69.205,41.388),
            (69.260,41.392),(69.310,41.378),(69.350,41.350),(69.372,41.312),
            (69.375,41.270),(69.352,41.232),(69.315,41.203),(69.270,41.190),
            (69.220,41.192),(69.175,41.205),(69.140,41.235),(69.115,41.258)]

def proj(lat, lon):
    return ((lon - WORLD_LON0) * K_LON, -(lat - WORLD_LAT0) * M_LAT)

BOUND_XY = [proj(la, lo) for lo, la in BOUNDARY]
SITES_XY = {k: proj(la, lo) for k, (la, lo) in SITES.items()}

def point_in_poly(x, z, poly):
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
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

def dp(points, tol):
    if len(points) < 4:
        return points
    def simplify(pts):
        if len(pts) < 3:
            return pts
        p0, p1 = pts[0], pts[-1]
        dx, dz = p1[0] - p0[0], p1[1] - p0[1]
        L = math.hypot(dx, dz) or 1e-9
        best, idx = 0.0, 0
        for i in range(1, len(pts) - 1):
            px, pz = pts[i]
            d = abs(dz * (px - p0[0]) - dx * (pz - p0[1])) / L
            if d > best:
                best, idx = d, i
        if best > tol:
            left = simplify(pts[:idx + 1]); right = simplify(pts[idx:])
            return left[:-1] + right
        return [p0, p1]
    p0 = points[0]
    far = max(range(len(points)), key=lambda i: (points[i][0] - p0[0]) ** 2 + (points[i][1] - p0[1]) ** 2)
    a = simplify(points[:far + 1]); b = simplify(points[far:] + [points[0]])
    out = a[:-1] + b[:-1]
    return out if len(out) >= 3 else points

def assign(cx, cz):
    # 1) haqiqiy relation ringlar (12 tuman — barchasi)
    for k in RINGS:
        if point_in_poly(cx, cz, RINGS[k]):
            return k, 'ring'
    # 2) zaxira: shahar ichida, lekin hech bir ringga tushmadi -> yaqin sayt
    if not point_in_poly(cx, cz, BOUND_XY):
        return None, 'tashqarida'
    best_k, best_d = None, None
    for k, (sx, sz) in SITES_XY.items():
        d2 = (cx - sx) ** 2 + (cz - sz) ** 2
        if best_d is None or d2 < best_d:
            best_d, best_k = d2, k
    return best_k, 'voronoi-fallback'

cur = json.load(open(os.path.join(BUILD, 'districts.json'), encoding='utf-8'))
RINGS = {k: d['ring'] for k, d in cur['districts'].items()}
assert set(RINGS) == set(SITES), (sorted(RINGS), sorted(SITES))
print('ringlar yuklandi:', {k: len(v) for k, v in RINGS.items()})

assign_stats = {}
seen = {}
n_files = 0
for fn in os.listdir(CACHE):
    if not fn.endswith('.json'):
        continue
    n_files += 1
    d = json.load(open(os.path.join(CACHE, fn), encoding='utf-8'))
    for e in d.get('elements', []):
        if e['type'] == 'way' and e.get('geometry'):
            seen[e['id']] = e
print(f'tile fayl: {n_files} | noyob bino way: {len(seen)}')

bins = {k: [] for k in SITES}
dropped_out = dropped_small = 0
for wid, e in seen.items():
    g = e.get('geometry') or []
    if len(g) < 3:
        dropped_small += 1
        continue
    pts = [proj(p['lat'], p['lon']) for p in g]
    if pts[0] == pts[-1]:
        pts = pts[:-1]
    if len(pts) < 3:
        dropped_small += 1
        continue
    cx = sum(p[0] for p in pts) / len(pts)
    cz = sum(p[1] for p in pts) / len(pts)
    key, how = assign(cx, cz)
    assign_stats[how] = assign_stats.get(how, 0) + 1
    if key is None:
        dropped_out += 1
        continue
    if ring_area(pts) < MIN_AREA:
        dropped_small += 1
        continue
    simp = dp(pts, DP_TOL)
    if len(simp) < 3:
        dropped_small += 1
        continue
    if len(simp) > 12:
        simp = dp(simp, DP_TOL * 2.2)
    t = e.get('tags', {})
    lv = t.get('building:levels')
    try:
        levels = float(lv) if lv else None
    except (ValueError, TypeError):
        levels = None
    h = t.get('height')
    try:
        h = float(str(h).replace('m', '').strip()) if h else None
    except (ValueError, TypeError):
        h = None
    if h is None:
        h = levels * 3.2 if levels else {'garage': 3, 'garages': 3, 'shed': 3, 'hut': 3.5,
                                         'house': 4.5, 'apartments': 13, 'residential': 13,
                                         'school': 11, 'kindergarten': 7, 'industrial': 8,
                                         'commercial': 12, 'retail': 6}.get(t.get('building'), 7.0)
    bins[key].append((simp, max(3.0, min(90.0, h))))

print(f'shahar tashqarida tashlandi: {dropped_out} | mayda/yaroqsiz: {dropped_small}')
print('joylashuv statistikasi:', assign_stats)

out = {}
total = 0
for key, arr in bins.items():
    buf = bytearray()
    buf += struct.pack('<I', len(arr))
    skipped = 0
    for pts, h in arr:
        x0, z0 = round(pts[0][0]), round(pts[0][1])
        if abs(x0) > 32000 or abs(z0) > 32000:
            skipped += 1
            continue
        q = [[round(p[0]) - x0, round(p[1]) - z0] for p in pts]
        if any(abs(dx) > 32000 or abs(dz) > 32000 for dx, dz in q):
            skipped += 1
            continue
        n = len(q)
        buf += struct.pack('<hhBB', x0, z0, n, max(0, min(255, round(h))))
        prev = [0, 0]
        for dx, dz in q[1:]:
            buf += struct.pack('<hh', dx - prev[0], dz - prev[1])
            prev = [dx, dz]
    xs = [p[0] for p in RINGS[key]]; zs = [p[1] for p in RINGS[key]]
    out[key] = {
        'name': NAMES[key],
        'ring': RINGS[key],
        'bbox': [min(xs), min(zs), max(xs), max(zs)],
        'count': len(arr) - skipped,
        'skipped': skipped,
        'bytes': len(buf),
        'b64': base64.b64encode(bytes(buf)).decode(),
    }
    total += out[key]['count']
    print(f'{key:14s} {out[key]["count"]:6d} bino | binary {len(buf)/1024:8.0f} KB')

cur['districts'] = out
cur.setdefault('meta', {})['source'] = ('Toshkent shahri 12 tumani: (c) OpenStreetMap contributors, ODbL 1.0 — '
                                        '12 tumanning hammasi haqiqiy OSM relation chegaralari (2026-11-28). '
                                        'Chegara kiplar: data/tiles/*.json. '
                                        'Landmarklar: Wikidata/ommaviy manbalar.')
cur['meta']['built'] = '2026-11-28'
cur['meta']['realDistricts'] = sorted(SITES)
with open(os.path.join(BUILD, 'districts.json'), 'w', encoding='utf-8') as f:
    json.dump(cur, f, separators=(',', ':'))
print(f'-> districts.json | jami {total} bino | {os.path.getsize(os.path.join(BUILD, "districts.json"))/1024/1024:.2f} MB')

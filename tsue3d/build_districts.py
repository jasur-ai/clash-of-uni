#!/usr/bin/env python3
"""
Yuklangan tile'lardan tuman binolarini yig'ish, soddalashtirish va siqish.

Chiqish:
  build/districts.json  — meta + base64 bilan qadoqlangan binary geometriya
Binary format (little-endian):
  header: uint32 buildings_count
  har bino: int16 x0, int16 z0, uint8 n, uint8 h10, keyin (n-1) ta int16 dx, int16 dz
  koordinatalar: metr (dunyoning 0,0 nuqtasiga nisbatan — TDIU asosiy kampus),
  delta kodlash, Int16 (chegaradan chiqsa bino tashlab yuboriladi)
"""
import json, os, math, struct, base64, urllib.request, urllib.parse, time, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'data', 'tiles')
WORLD_LAT0, WORLD_LON0 = 41.30930, 69.24990
M_LAT = 110574.0
K_LON = 111320.0 * math.cos(math.radians(WORLD_LAT0))

DISTRICTS = {
    'chilonzor': {'rel': 2441810, 'name': 'Chilonzor'},
    'yunusobod': {'rel': 2448072, 'name': 'Yunusobod'},
}
MIN_AREA = 30.0      # m² — undan kichik hovliqurilmalar tashlanadi
DP_TOL = 1.6         # m — soddalashtirish toleransi


def proj(lat, lon):
    return ((lon - WORLD_LON0) * K_LON, -(lat - WORLD_LAT0) * M_LAT)


def polygon_for(rel_id):
    """Relation chegarasini yopiq ringga yig'adi."""
    q = f'[out:json][timeout:90];relation({rel_id});out geom;'
    for _ in range(4):
        try:
            data = urllib.parse.urlencode({'data': q}).encode()
            req = urllib.request.Request('https://maps.mail.ru/osm/tools/overpass/api/interpreter',
                                         data=data, headers={'User-Agent': 'Mozilla/5.0'})
            d = json.loads(urllib.request.urlopen(req, timeout=120).read())
            break
        except Exception:
            time.sleep(3)
    else:
        raise RuntimeError('poligon yuklanmadi')

    ways = []
    for m in d['elements'][0].get('members', []):
        if m['type'] == 'way' and m.get('role') in ('outer', ''):
            g = m.get('geometry') or []
            if len(g) > 1:
                ways.append([(p['lat'], p['lon']) for p in g])
    # ring yig'ish
    rings = []
    while ways:
        ring = ways.pop(0)
        changed = True
        while changed:
            changed = False
            for i, w in enumerate(ways):
                if w[0] == ring[-1]:
                    ring += w[1:]; ways.pop(i); changed = True; break
                if w[-1] == ring[-1]:
                    ring += list(reversed(w))[1:]; ways.pop(i); changed = True; break
                if w[-1] == ring[0]:
                    ring = w[:-1] + ring; ways.pop(i); changed = True; break
                if w[0] == ring[0]:
                    ring = list(reversed(w))[:-1] + ring; ways.pop(i); changed = True; break
        if len(ring) > 10:
            rings.append(ring)
    rings.sort(key=len, reverse=True)
    return rings[0] if rings else []


def point_in_poly(x, z, poly):
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, zi = poly[i]
        xj, zj = poly[j]
        if ((zi > z) != (zj > z)) and (x < (xj - xi) * (z - zi) / (zj - zi + 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def ring_area(pts):
    a = 0.0
    for i in range(len(pts)):
        x1, z1 = pts[i]
        x2, z2 = pts[(i + 1) % len(pts)]
        a += x1 * z2 - x2 * z1
    return abs(a) / 2


def dp(points, tol):
    """Douglas-Peucker (yopiq poligon uchun)."""
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
            left = simplify(pts[:idx + 1])
            right = simplify(pts[idx:])
            return left[:-1] + right
        return [p0, p1]

    # poligonni eng uzoq ikki nuqta orqali bo'lamiz
    p0 = points[0]
    far = max(range(len(points)), key=lambda i: (points[i][0] - p0[0]) ** 2 + (points[i][1] - p0[1]) ** 2)
    a = simplify(points[:far + 1])
    b = simplify(points[far:] + [points[0]])
    out = a[:-1] + b[:-1]
    return out if len(out) >= 3 else points


def main():
    seen = {}
    for fn in os.listdir(CACHE):
        if not fn.endswith('.json'):
            continue
        d = json.load(open(os.path.join(CACHE, fn)))
        for e in d['elements']:
            if e['type'] == 'way' and e.get('geometry'):
                seen[e['id']] = e
    print('tile\'larda noyob bino:', len(seen))

    polys = {}
    for key, info in DISTRICTS.items():
        ring = polygon_for(info['rel'])
        polys[key] = [proj(la, lo) for la, lo in ring]
        print(f'{key}: chegara {len(ring)} nuqta')

    out = {}
    for key, poly in polys.items():
        keep = 0
        bins = []
        for wid, e in seen.items():
            g = e['geometry']
            if len(g) < 3:
                continue
            pts = [proj(p['lat'], p['lon']) for p in g]
            if pts[0] == pts[-1]:
                pts = pts[:-1]
            if len(pts) < 3:
                continue
            cx = sum(p[0] for p in pts) / len(pts)
            cz = sum(p[1] for p in pts) / len(pts)
            if not point_in_poly(cx, cz, poly):
                continue
            if ring_area(pts) < MIN_AREA:
                continue
            simp = dp(pts, DP_TOL)
            if len(simp) < 3:
                continue
            if len(simp) > 12:
                simp = dp(simp, DP_TOL * 2.2)
            t = e.get('tags', {})
            lv = t.get('building:levels')
            try:
                levels = float(lv) if lv else None
            except ValueError:
                levels = None
            h = t.get('height')
            try:
                h = float(str(h).replace('m', '').strip()) if h else None
            except ValueError:
                h = None
            if h is None:
                h = levels * 3.2 if levels else {'garage': 3, 'garages': 3, 'shed': 3, 'hut': 3.5,
                                                 'house': 4.5, 'apartments': 13, 'residential': 13,
                                                 'school': 11, 'kindergarten': 7, 'industrial': 8,
                                                 'commercial': 12, 'retail': 6}.get(t.get('building'), 7.0)
            bins.append((simp, max(3.0, min(90.0, h))))
            keep += 1

        # binary encode
        buf = bytearray()
        buf += struct.pack('<I', len(bins))
        skipped = 0
        for pts, h in bins:
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
        # chegara poligoni (soddalashtirilgan)
        bpoly = dp(poly, 18.0)
        out[key] = {
            'name': DISTRICTS[key]['name'],
            'ring': [[round(x), round(z)] for x, z in (bpoly if len(bpoly) > 2 else poly)],
            'count': len(bins) - skipped,
            'skipped': skipped,
            'b64': base64.b64encode(bytes(buf)).decode(),
        }
        print(f'{key}: {len(bins)-skipped} bino, binary {len(buf)/1024:.0f} KB, '
              f'b64 {len(out[key]["b64"])/1024:.0f} KB (tashlandi: {skipped})')

    res = {
        'meta': {
            'source': 'OpenStreetMap (Overpass API), ODbL — © OpenStreetMap contributors',
            'lat0': WORLD_LAT0, 'lon0': WORLD_LON0,
            'minArea': MIN_AREA, 'dpTol': DP_TOL,
            'format': 'int16 delta, uint8 n, uint8 h (m)',
        },
        'districts': out,
    }
    p = os.path.join(HERE, 'build', 'districts.json')
    with open(p, 'w') as f:
        json.dump(res, f, separators=(',', ':'))
    print('->', p, round(os.path.getsize(p) / 1024 / 1024, 2), 'MB')


if __name__ == '__main__':
    main()

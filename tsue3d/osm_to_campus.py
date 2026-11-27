#!/usr/bin/env python3
"""
OSM -> 3D kampus geometriyasi konverteri.

Kirish:  data/bld.json, data/roads.json, data/land.json  (Overpass API, out geom tags)
Chiqish: build/campus.json  (lokal metr koordinatalarida, markaz = TDIU rektorati)

OSM ma'lumotlari © OpenStreetMap hissa qo'shuvchilari, ODbL litsenziyasi.
"""
import json, math, os

LAT0, LON0 = 41.30930, 69.24990          # TDIU kampus markazi (Islom Karimov ko'chasi 49)
M_PER_DEG_LAT = 110574.0
M_PER_DEG_LON = 111320.0 * math.cos(math.radians(LAT0))

RADIUS = 360.0                            # o'yin maydoni radiusi (m)

def xy(lat, lon):
    """Geo -> lokal metr. X = sharq, Z = janub (three.js uchun qulay)."""
    return ((lon - LON0) * M_PER_DEG_LON, -(lat - LAT0) * M_PER_DEG_LAT)

def ring_area(pts):
    a = 0.0
    for i in range(len(pts)):
        x1, z1 = pts[i]; x2, z2 = pts[(i + 1) % len(pts)]
        a += x1 * z2 - x2 * z1
    return abs(a) / 2.0

def centroid(pts):
    x = sum(p[0] for p in pts) / len(pts)
    z = sum(p[1] for p in pts) / len(pts)
    return x, z

def load(fn):
    with open(os.path.join(os.path.dirname(__file__), 'data', fn)) as f:
        return json.load(f)['elements']

# ---------------------------------------------------------------- binolar
TYPE_DEFAULT_H = {
    'university': 16.0, 'school': 12.0, 'college': 12.0, 'stadium': 20.0,
    'apartments': 13.0, 'residential': 13.0, 'commercial': 12.0, 'hotel': 14.0,
    'yes': 10.0, 'garage': 3.0, 'garages': 3.0, 'warehouse': 6.0, 'industrial': 8.0,
    'kindergarten': 7.0, 'roof': 6.0, 'construction': 6.0,
}
TYPE_COLOR = {
    'university': '#dfe7f2', 'school': '#e6ddcb', 'college': '#e6ddcb',
    'stadium': '#cfd9cc', 'apartments': '#d8d2c8', 'residential': '#d8d2c8',
    'commercial': '#d6cfd2', 'hotel': '#d6cfd2', 'garage': '#c9c9c9',
    'garages': '#c9c9c9', 'warehouse': '#cfc9c1', 'industrial': '#cfc9c1',
    'kindergarten': '#e3dcc9', 'yes': '#dcdcd6',
}

buildings, roads, greens = [], [], []

for e in load('bld.json'):
    t = e.get('tags', {})
    g = e.get('geometry') or []
    if len(g) < 3:
        continue
    pts = [xy(p['lat'], p['lon']) for p in g]
    if pts[0] == pts[-1]:
        pts = pts[:-1]
    if len(pts) < 3:
        continue
    cx, cz = centroid(pts)
    if math.hypot(cx, cz) > RADIUS:
        continue
    area = ring_area(pts)
    if area < 12:                      # shkala ostidagi "dog'lar"
        continue
    btype = t.get('building', 'yes')
    levels = t.get('building:levels')
    try:
        levels = float(levels) if levels else None
    except ValueError:
        levels = None
    h = t.get('height')
    try:
        h = float(str(h).replace('m', '').strip()) if h else None
    except ValueError:
        h = None
    if h is None:
        h = (levels * 3.4 + 1.2) if levels else TYPE_DEFAULT_H.get(btype, 10.0)
    buildings.append({
        'id': e['id'],
        'name': t.get('name') or t.get('addr:street') or '',
        'nameEn': t.get('name:en', ''),
        'type': btype,
        'amenity': t.get('amenity', ''),
        'levels': int(levels) if levels else max(1, round(h / 3.4)),
        'h': round(h, 1),
        'area': round(area),
        'px': round(cx, 1), 'pz': round(cz, 1),
        'pts': [[round(x, 1), round(z, 1)] for x, z in pts],
        'color': TYPE_COLOR.get(btype, '#dcdcd6'),
    })

# ---------------------------------------------------------------- yo'llar
WIDTH = {'footway': 1.8, 'path': 1.8, 'steps': 2.2, 'pedestrian': 4.0, 'service': 4.5,
         'residential': 6.0, 'living_street': 6.0, 'unclassified': 6.0,
         'secondary': 11.0, 'secondary_link': 7.0, 'tertiary': 9.0}

for e in load('roads.json'):
    t = e.get('tags', {})
    g = e.get('geometry') or []
    if len(g) < 2:
        continue
    cls = t.get('highway') or ('barrier' if 'barrier' in t else 'other')
    if cls == 'other':
        continue
    pts = [xy(p['lat'], p['lon']) for p in g]
    if all(math.hypot(x, z) > RADIUS + 20 for x, z in pts):
        continue
    roads.append({
        'cls': cls,
        'w': WIDTH.get(cls, 3.0),
        'pts': [[round(x, 1), round(z, 1)] for x, z in pts],
    })

# ---------------------------------------------------------------- yashil / maydonlar
for e in load('land.json'):
    t = e.get('tags', {})
    g = e.get('geometry') or []
    if len(g) < 3:
        continue
    kind = None
    if t.get('landuse') in ('grass', 'forest', 'recreation_ground', 'village_green'):
        kind = 'grass'
    elif t.get('landuse') in ('residential', 'construction', 'industrial', 'commercial'):
        kind = 'ground'
    elif t.get('leisure') in ('pitch', 'stadium', 'playground', 'park', 'garden'):
        kind = 'pitch' if t['leisure'] in ('pitch', 'stadium') else 'grass'
    elif t.get('natural') in ('wood', 'scrub', 'grassland'):
        kind = 'grass'
    elif t.get('natural') == 'water' or t.get('waterway'):
        kind = 'water'
    elif t.get('amenity') in ('parking', 'marketplace'):
        kind = 'pavement'
    if not kind:
        continue
    pts = [xy(p['lat'], p['lon']) for p in g]
    cx, cz = centroid(pts)
    if math.hypot(cx, cz) > RADIUS + 30:
        continue
    if ring_area(pts) < 30:
        continue
    greens.append({'kind': kind, 'pts': [[round(x, 1), round(z, 1)] for x, z in pts]})

out = {
    'meta': {
        'lat0': LAT0, 'lon0': LON0, 'radius': RADIUS,
        'source': 'OpenStreetMap (Overpass API), ODbL',
        'note': "Haqiqiy TDIU kampus binolari konturlari, 3D ekstruziya qilingan",
    },
    'buildings': sorted(buildings, key=lambda b: -b['area']),
    'roads': roads,
    'greens': greens,
}

os.makedirs(os.path.join(os.path.dirname(__file__), 'build'), exist_ok=True)
p = os.path.join(os.path.dirname(__file__), 'build', 'campus.json')
with open(p, 'w') as f:
    json.dump(out, f, separators=(',', ':'), ensure_ascii=False)

print(f'binolar: {len(buildings)}  yo\'llar: {len(roads)}  maydonlar: {len(greens)}')
print('fayl:', p, os.path.getsize(p) // 1024, 'KB')
for b in out['buildings'][:14]:
    print(f"  {b['id']:>10} {b['levels']:>2} qavat {b['h']:>5.1f}m {b['area']:>5}m2  {b['type']:<12} {b['name']}")

#!/usr/bin/env python3
"""
Ko'p kampusli konverter: OSM -> yagona 3D dunyo koordinatalari.

Kampuslar:
  • main     — TDIU asosiy kampusi (Islom Karimov ko'chasi 49)
  • finance  — Moliya kampusi (sobiq Toshkent moliya instituti, 2024-yilda TDIU tarkibiga qo'shilgan)

Chiqish: build/campuses.json
OSM ma'lumotlari © OpenStreetMap hissa qo'shuvchilari, ODbL.
"""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'data')
M_LAT = 110574.0

# ------------------------------------------------------------------ kampuslar
CAMPUSES = [
    {
        'id': 'main',
        'name': 'Asosiy kampus',
        'sub': 'Islom Karimov ko‘chasi 49',
        'lat0': 41.30930, 'lon0': 69.24990, 'radius': 360,
        'files': {'bld': 'bld.json', 'roads': 'roads.json', 'land': 'land.json'},
        # qo'lda belgilangan rollar (OSM ID -> rol)
        'roles': {
            149530194: 'hq',          # Rektorat (aslida 17 qavatli minora — rasm bo'yicha)
            149530198: 'edu',         # 1-o'quv korpusi
            180776564: 'money',       # 2-korpus
            1154762660: 'flow',       # Akademik litsey
            181413037: 'energy',      # Iqtisodiyot gimnaziyasi
            149530196: 'innovation',  # 5 qavatli korpus
        },
        # rasm bo'yicha tuzatilgan balandliklar / landmark spetsifikatsiyasi
        'landmarks': {
            149530194: {'floors': 17, 'style': 'tower', 'podiumFloors': 3,
                        'tower': {'w': 36, 'd': 26}, 'name': 'TDIU bosh binosi'},
        },
    },
    {
        'id': 'finance',
        'name': 'Moliya kampusi',
        'sub': 'Sobiq Toshkent moliya instituti',
        'lat0': 41.324383, 'lon0': 69.284067, 'radius': 330,
        'files': {'bld': 'fin_bld.json', 'roads': 'fin_roads.json', 'land': 'fin_land.json'},
        'roles': {},   # avtomatik tanlanadi
        'landmarks': {},
    },
]

# dunyo markazi = asosiy kampus
WORLD_LAT0, WORLD_LON0 = CAMPUSES[0]['lat0'], CAMPUSES[0]['lon0']

TYPE_DEFAULT_H = {
    'university': 16.0, 'school': 12.0, 'college': 12.0, 'stadium': 20.0,
    'apartments': 13.0, 'residential': 13.0, 'commercial': 12.0, 'hotel': 14.0,
    'office': 12.0, 'yes': 10.0, 'garage': 3.0, 'garages': 3.0, 'warehouse': 6.0,
    'industrial': 8.0, 'kindergarten': 7.0, 'roof': 6.0, 'construction': 6.0,
    'store': 6.0, 'religious': 12.0, 'public': 12.0, 'civic': 12.0,
}
TYPE_COLOR = {
    'university': '#eef0f4', 'school': '#efe7d6', 'college': '#efe7d6',
    'stadium': '#dfe4dc', 'apartments': '#e2ddd4', 'residential': '#e2ddd4',
    'commercial': '#e4dde1', 'hotel': '#e4dde1', 'office': '#e7e9ee',
    'garage': '#cfcfcf', 'garages': '#cfcfcf', 'warehouse': '#d6cfc6',
    'industrial': '#d6cfc6', 'kindergarten': '#eee4cf', 'store': '#e4dde1',
    'yes': '#e6e4de', 'construction': '#d8d3cb',
}
GLASS_TYPES = {'commercial', 'hotel', 'office'}
CLASSIC_TYPES = {'university', 'school', 'college', 'kindergarten'}

WIDTH = {'footway': 1.8, 'path': 1.8, 'steps': 2.2, 'pedestrian': 4.0, 'service': 4.5,
         'residential': 6.0, 'living_street': 6.0, 'unclassified': 6.0,
         'secondary': 11.0, 'secondary_link': 7.0, 'tertiary': 9.0}


def proj(lat, lon):
    """Geo -> dunyo metr koordinatalari (X sharq, Z janub)."""
    k = 111320.0 * math.cos(math.radians(WORLD_LAT0))
    return ((lon - WORLD_LON0) * k, -(lat - WORLD_LAT0) * M_LAT)


def ring_area(pts):
    a = 0.0
    for i in range(len(pts)):
        x1, z1 = pts[i]; x2, z2 = pts[(i + 1) % len(pts)]
        a += x1 * z2 - x2 * z1
    return abs(a) / 2.0


def load(campus, key):
    with open(os.path.join(DATA, campus['files'][key])) as f:
        return json.load(f)['elements']


def style_of(btype, levels, name):
    if btype in GLASS_TYPES or (levels or 0) >= 10:
        return 'glass'
    if btype in CLASSIC_TYPES or 'корпус' in name or 'universitet' in name.lower():
        return 'classic'
    return 'panel'


out_campuses = []

for c in CAMPUSES:
    cx0, cz0 = proj(c['lat0'], c['lon0'])
    buildings, roads, greens = [], [], []

    for e in load(c, 'bld'):
        t = e.get('tags', {})
        g = e.get('geometry') or []
        if len(g) < 3:
            continue
        pts = [proj(p['lat'], p['lon']) for p in g]
        if pts[0] == pts[-1]:
            pts = pts[:-1]
        if len(pts) < 3:
            continue
        cx = sum(p[0] for p in pts) / len(pts)
        cz = sum(p[1] for p in pts) / len(pts)
        if math.hypot(cx - cx0, cz - cz0) > c['radius']:
            continue
        area = ring_area(pts)
        if area < 14:
            continue

        btype = t.get('building', 'yes')
        lv = t.get('building:levels')
        try:
            levels = int(float(lv)) if lv else None
        except ValueError:
            levels = None
        h = t.get('height')
        try:
            h = float(str(h).replace('m', '').strip()) if h else None
        except ValueError:
            h = None
        if h is None:
            h = (levels * 3.4 + 1.2) if levels else TYPE_DEFAULT_H.get(btype, 10.0)

        rec = {
            'id': e['id'],
            'campus': c['id'],
            'name': t.get('name') or '',
            'type': btype,
            'levels': levels if levels else max(1, round(h / 3.4)),
            'h': round(h, 1),
            'area': round(area),
            'px': round(cx, 1), 'pz': round(cz, 1),
            'pts': [[round(x, 1), round(z, 1)] for x, z in pts],
            'color': TYPE_COLOR.get(btype, '#e6e4de'),
            'style': style_of(btype, levels, t.get('name', '')),
        }
        lm = c['landmarks'].get(e['id'])
        if lm:
            rec['landmark'] = lm
            rec['h'] = round(lm.get('floors', rec['levels']) * 3.4, 1)
            rec['levels'] = lm.get('floors', rec['levels'])
            rec['style'] = lm.get('style', rec['style'])
            if lm.get('name'):
                rec['name'] = lm['name']
        role = c['roles'].get(e['id'])
        if role:
            rec['role'] = role
        buildings.append(rec)

    # -------- avtomatik rol tanlash (rollar qo'lda berilmagan kampuslar uchun)
    if not c['roles']:
        cand = [b for b in buildings
                if b['type'] not in ('apartments', 'residential', 'garage', 'garages', 'yes', 'roof')
                and b['area'] >= 600 and 'landmark' not in b]
        cand.sort(key=lambda b: -b['area'])
        order = ['hq', 'edu', 'money', 'flow', 'energy', 'innovation']
        for role, b in zip(order, cand[:len(order)]):
            b['role'] = role

    # -------- yo'llar
    for e in load(c, 'roads'):
        t = e.get('tags', {})
        g = e.get('geometry') or []
        if len(g) < 2:
            continue
        cls = t.get('highway')
        if not cls:
            continue
        pts = [proj(p['lat'], p['lon']) for p in g]
        if all(math.hypot(x - cx0, z - cz0) > c['radius'] + 25 for x, z in pts):
            continue
        roads.append({'cls': cls, 'w': WIDTH.get(cls, 3.0),
                      'pts': [[round(x, 1), round(z, 1)] for x, z in pts]})

    # -------- yashil / maydonlar
    for e in load(c, 'land'):
        t = e.get('tags', {})
        g = e.get('geometry') or []
        if len(g) < 3:
            continue
        kind = None
        if t.get('landuse') in ('grass', 'forest', 'recreation_ground', 'village_green'):
            kind = 'grass'
        elif t.get('landuse') in ('residential', 'construction', 'industrial', 'commercial'):
            kind = 'ground'
        elif t.get('leisure') in ('pitch', 'stadium'):
            kind = 'pitch'
        elif t.get('leisure') in ('playground', 'park', 'garden'):
            kind = 'grass'
        elif t.get('natural') in ('wood', 'scrub', 'grassland'):
            kind = 'grass'
        elif t.get('natural') == 'water' or t.get('waterway'):
            kind = 'water'
        elif t.get('amenity') in ('parking', 'marketplace'):
            kind = 'pavement'
        if not kind:
            continue
        pts = [proj(p['lat'], p['lon']) for p in g]
        cx = sum(p[0] for p in pts) / len(pts)
        cz = sum(p[1] for p in pts) / len(pts)
        if math.hypot(cx - cx0, cz - cz0) > c['radius'] + 30 or ring_area(pts) < 40:
            continue
        greens.append({'kind': kind, 'pts': [[round(x, 1), round(z, 1)] for x, z in pts]})

    out_campuses.append({
        'id': c['id'], 'name': c['name'], 'sub': c['sub'],
        'cx': round(cx0, 1), 'cz': round(cz0, 1), 'radius': c['radius'],
        'buildings': sorted(buildings, key=lambda b: -b['area']),
        'roads': roads, 'greens': greens,
    })

out = {
    'meta': {
        'generated': '2026-11-27',
        'source': 'OpenStreetMap (Overpass API), ODbL — © OpenStreetMap contributors',
        'worldLat0': WORLD_LAT0, 'worldLon0': WORLD_LON0,
    },
    'campuses': out_campuses,
}

os.makedirs(os.path.join(HERE, 'build'), exist_ok=True)
p = os.path.join(HERE, 'build', 'campuses.json')
with open(p, 'w') as f:
    json.dump(out, f, separators=(',', ':'), ensure_ascii=False)

print(f'fayl: {p}  {os.path.getsize(p)//1024} KB')
for cp in out_campuses:
    roles = [b for b in cp['buildings'] if b.get('role')]
    print(f"\n== {cp['id']} — {len(cp['buildings'])} bino, {len(cp['roads'])} yo'l, "
          f"{len(cp['greens'])} maydon, markaz ({cp['cx']:.0f}, {cp['cz']:.0f})")
    for b in roles:
        print(f"   {b['role']:<11} {b['id']:>11} {b['levels']:>2}q {b['area']:>5}m² {b['style']:<8} {b['name'][:40]}")

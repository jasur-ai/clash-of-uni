#!/usr/bin/env python3
"""Chilonzor + Yunusobod tumanlari binolarini OSM'dan tiled (bo'laklab) yuklash.

Overpass'ning area() filtri bu mirror'da ishlamaydi — shuning uchun bbox bo'laklar
bilan yuklaymiz va keyin tuman poligoni bo'yicha filtrlaymiz.
"""
import urllib.request, urllib.parse, json, time, os, sys
from concurrent.futures import ThreadPoolExecutor

EP = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'data', 'tiles')
os.makedirs(CACHE, exist_ok=True)

DISTRICTS = {
    'chilonzor': {'rel': 2441810, 'bbox': (41.2226, 69.1489, 41.3119, 69.2600)},
    'yunusobod': {'rel': 2448072, 'bbox': (41.3094, 69.2280, 41.3986, 69.3441)},
}
STEP = 0.02      # ~2.2 km


def fetch(query, tries=4):
    for i in range(tries):
        try:
            data = urllib.parse.urlencode({'data': query}).encode()
            req = urllib.request.Request(EP, data=data, headers={'User-Agent': 'Mozilla/5.0 kampus-research'})
            raw = urllib.request.urlopen(req, timeout=120).read()
            return json.loads(raw)
        except Exception as e:
            time.sleep(2 + i * 2)
    return None


def get_polygon(rel_id):
    q = f'[out:json][timeout:90];relation({rel_id});out geom;'
    d = fetch(q)
    if not d:
        raise RuntimeError('poligon olinmadi')
    el = d['elements'][0]
    rings = []
    for m in el.get('members', []):
        if m['type'] == 'way' and m['role'] in ('outer', ''):
            g = m.get('geometry') or []
            if len(g) > 2:
                rings.append([(p['lat'], p['lon']) for p in g])
    # eng katta ring = tashqi chegara
    rings.sort(key=len, reverse=True)
    return rings


def tile_query(bbox):
    s, w, n, e = bbox
    return (f'[out:json][timeout:90];way["building"]({s:.5f},{w:.5f},{n:.5f},{e:.5f});'
            f'out geom tags;')


def main():
    todo = []
    for name, d in DISTRICTS.items():
        s, w, n, e = d['bbox']
        la = s
        while la < n:
            lo = w
            while lo < e:
                key = f'{name}_{la:.3f}_{lo:.3f}'.replace('.', 'p')
                fp = os.path.join(CACHE, key + '.json')
                if not os.path.exists(fp):
                    todo.append((fp, (la, lo, min(la + STEP, n), min(lo + STEP, e))))
                lo += STEP
            la += STEP
    print(f'yuklanadi: {len(todo)} bo\'lak')

    def work(item):
        fp, bbox = item
        d = fetch(tile_query(bbox))
        if d is None:
            return fp, -1
        with open(fp, 'w') as f:
            json.dump(d, f)
        return fp, len(d['elements'])

    done = 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        for fp, n in ex.map(work, todo):
            done += 1
            if done % 5 == 0 or n < 0:
                print(f'  {done}/{len(todo)}  oxirgi: {n} bino', flush=True)

    # stat
    total = 0
    for f in os.listdir(CACHE):
        try:
            total += len(json.load(open(os.path.join(CACHE, f)))['elements'])
        except Exception:
            pass
    print('jami yuklangan (filtrsiz):', total)


if __name__ == '__main__':
    main()

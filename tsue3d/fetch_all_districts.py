#!/usr/bin/env python3
"""
Toshkent shahrining 12 tumani uchun OSM binolari geometriyasini Overpass'dan yuklaydi.
(Sandbox'da tarmoq cheklangan — lokal kompyuteringizda internet bilan ishga tushiring.)

    python3 fetch_all_districts.py            # barcha tumanlar
    python3 fetch_all_districts.py chilonzor  # faqat bittasi

Chiqish: data/<tuman>_bld.json (raw Overpass javobi), so'ng build_districts.py
shuni o'qib build/districts.json ni qayta yig'adi.

Eslatma: build_districts.py DISTRICTS ro'yxatini yangi tumanlar bilan to'ldiring
(rel ID'lar quyida tuman nomi bilan Overpass orqali avtomatik topiladi).
"""
import json, sys, time, urllib.request, urllib.parse, os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'data')
os.makedirs(DATA, exist_ok=True)

TURK = {  # tuman -> Overpass name (uzbekcha)
    'chilonzor': 'Chilonzor tumani', 'yunusobod': 'Yunusobod tumani',
    'olmazor': 'Olmazor tumani', 'uchtepa': 'Uchtepa tumani',
    'mirzo_ulugbek': "Mirzo Ulug'bek tumani", 'mirobod': 'Mirobod tumani',
    'shayxontohur': 'Shayxontohur tumani', 'sergeli': 'Sergeli tumani',
    'bektemir': 'Bektemir tumani', 'yashnobod': 'Yashnobod tumani',
    'yakkasaroy': 'Yakkasaroy tumani', 'yangihayot': 'Yangihayot tumani',
}
ENDPOINTS = [
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
]

def overpass(query):
    data = urllib.parse.urlencode({'data': query}).encode()
    last = None
    for ep in ENDPOINTS:
        for attempt in range(4):
            try:
                req = urllib.request.Request(ep, data=data, headers={'User-Agent': 'Mozilla/5.0 kampus-tdiu'})
                return json.loads(urllib.request.urlopen(req, timeout=300).read())
            except Exception as e:
                last = e
                print(f'  {ep} urinish {attempt + 1} muvaffaqiyatsiz: {e}')
                time.sleep(4)
    raise RuntimeError(f'Overpass javob bermadi: {last}')

def relation_id(name):
    q = f'[out:json][timeout:60];relation["boundary"="administrative"]["name"="{name}"];out ids;'
    d = overpass(q)
    ids = [e['id'] for e in d.get('elements', []) if e['type'] == 'relation']
    if not ids:
        raise RuntimeError(f'relation topilmadi: {name}')
    print(f'  {name}: relation {ids[0]}')
    return ids[0]

def fetch_buildings(rel, out_path, tile_deg=0.03):
    """Relation bbox'ini tile'larga bo'lib binolarni yuklaydi."""
    d = overpass(f'[out:json][timeout:60];relation({rel});out body;')
    # bbox: relation member way'laridan hisoblamaymiz — Overpass area id orqali
    q = f'[out:json][timeout:60];rel({rel});map_to_area->.a;(way(area.a)["building"];relation(area.a)["building"];);out geom;'
    d = overpass(q)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(d, f)
    print(f'  -> {out_path}: {len(d.get("elements", []))} element')

def main():
    keys = sys.argv[1:] or list(TURK)
    for k in keys:
        name = TURK[k]
        print(f'== {k} ==')
        try:
            rel = relation_id(name)
            fetch_buildings(rel, os.path.join(DATA, f'{k}_bld.json'))
        except Exception as e:
            print(f'  XATO: {e}')
    print('\nEndi: python3 build_districts.py  (DISTRICTS lug\'atiga yangi tumanlarni qo\'shing)')

if __name__ == '__main__':
    main()

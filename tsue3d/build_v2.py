#!/usr/bin/env python3
"""KAMPUS v0.7 — build: lazy-loading deploy + standalone debug fayl.

Ikkita natija:

1) kampus-app/ (Vercel deploy):
   - index.html              — three.js + CAMPUS + DISTRICTS META (b64 YO'Q,
                               faqat name/ring/bbox/count/bytes + parks/trees/...)
   - data/d_<tuman>.bin      — har tuman binolari (Int16 delta format,
                               «format» = int16 delta, uint8 n, uint8 h (m))
   - data/roads.bin          — 8 844 ta haqiqiy ko'cha geometriyasi
   - window.DISTRICT_ROADS = {"count","file","bytes"} (pointer, b64 emas)
   O'yin birinchi ochilishda faqat chilonzor+yunusobodni yuklaydi,
   qolganlari kamera yaqinlashganda lazy fetch (fetch('data/d_<key>.bin')).

2) tsue3d/tsue-campus-v3.html (standalone, hammasi inline b64 bilan)
   — oflayn debug uchun bitta self-contained fayl (game b64 fallback'ini
   ishlatadi: DIST_META[key].b64 mavjud bo'lsa fetch o'rniga atob ishlaydi).
"""
import json, os, struct, base64, shutil

ROOT = os.path.dirname(os.path.abspath(__file__))

def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()

def district_bin(d):
    return base64.b64decode(d['b64'])

def check_bin(key, raw, count):
    """Binar header'ni to'liq yurgizib, yozilgan bino soni == meta'dagi count ekanini tekshiradi."""
    n = struct.unpack_from('<I', raw, 0)[0]
    off = 4
    for _ in range(n):
        x0, z0, n_pts, h = struct.unpack_from('<hhBB', raw, off)
        off += 6 + (n_pts - 1) * 4
    assert n == count, f'{key}: header {n} != meta count {count}'
    assert off == len(raw), f'{key}: oxirgi bayt {off} != fayl {len(raw)}'
    return n

districts = json.loads(read('build', 'districts.json'))
roads = json.loads(read('build', 'roads.json'))
roads_raw = base64.b64decode(roads['b64'])

def walk_roads(raw):
    """Yo'l buffer'ini record bo'ylab yurgizadi; count mosligini tekshiradi."""
    off, n = 0, 0
    while off + 6 <= len(raw):
        # cls = raw[off]; n_pts = raw[off+1]
        n_pts = raw[off + 1]
        off += 6 + (n_pts - 1) * 4
        n += 1
    assert off == len(raw), f'roads.bin uzunlik mos emas: {off} != {len(raw)}'
    return n

assert walk_roads(roads_raw) == roads['count'], 'roads.bin count mos emas'

# --- 1) lazy meta (b64'siz) ------------------------------------------------
dist_meta = json.loads(json.dumps(districts))  # deep copy
for key, d in dist_meta['districts'].items():
    raw = district_bin(districts['districts'][key])
    # bbox/bytes bo'lmasa (eski districts.json) ring/bikdan hisoblaymiz
    if 'bbox' not in d:
        xs = [p[0] for p in d['ring']]; zs = [p[1] for p in d['ring']]
        d['bbox'] = [min(xs), min(zs), max(xs), max(zs)]
    d['bytes'] = len(raw)
    check_bin(key, raw, d['count'])
    d.pop('b64', None)
    d.pop('skipped', None)

roads_ptr = {'count': roads['count'], 'file': 'data/roads.bin', 'bytes': len(roads_raw)}

tpl = read('src', 'index.v2.template.html')
three = read('vendor', 'three.min.js').replace('</script>', '<\\/script>')
css = read('src', 'style.v2.css')
game = read('src', 'game.v2.js').replace('</script>', '<\\/script>')
campus = json.dumps(json.loads(read('build', 'campuses.json')), separators=(',', ':'), ensure_ascii=False)

meta_json = json.dumps(dist_meta, separators=(',', ':'), ensure_ascii=False)
roads_ptr_json = json.dumps(roads_ptr, separators=(',', ':'), ensure_ascii=False)
full_json = json.dumps(districts, separators=(',', ':'), ensure_ascii=False)
roads_full_json = json.dumps(roads, separators=(',', ':'), ensure_ascii=False)

def render(dist_json, roads_json):
    return (tpl.replace('__CSS__', css)
               .replace('__THREE__', three)
               .replace('__DATA__', campus)
               .replace('__DISTRICTS__', dist_json)
               .replace('__ROADS__', roads_json)
               .replace('__GAME__', game))

total = sum(d['count'] for d in dist_meta['districts'].values())
print(f'lazy meta: {len(meta_json)/1024:.0f} KB | binolar jami {total} | roads pointer {roads_ptr_json}')

# --- kampus-app (Vercel) ----------------------------------------------------
deploy = os.path.abspath(os.path.join(ROOT, '..', 'kampus-app'))
if os.path.isdir(deploy):
    data_dir = os.path.join(deploy, 'data')
    os.makedirs(data_dir, exist_ok=True)
    # eski d_*.bin / roads.bin ni tozalaymiz (o'chmaydigan begona fayllarni emas)
    for fn in os.listdir(data_dir):
        if (fn.startswith('d_') and fn.endswith('.bin')) or fn == 'roads.bin':
            os.remove(os.path.join(data_dir, fn))
    for key, d in districts['districts'].items():
        raw = district_bin(d)
        with open(os.path.join(data_dir, f'd_{key}.bin'), 'wb') as f:
            f.write(raw)
    with open(os.path.join(data_dir, 'roads.bin'), 'wb') as f:
        f.write(roads_raw)
    out = os.path.join(deploy, 'index.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(render(meta_json, roads_ptr_json))
    print('OK ->', out, round(os.path.getsize(out) / 1024), 'KB')
    print('OK -> kampus-app/data/d_*.bin (12 tuman) + roads.bin')

# --- tsue-campus-v3.html (standalone, hammasi inline) ------------------------
out = os.path.join(ROOT, 'tsue-campus-v3.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(render(full_json, roads_full_json))
print('OK ->', out, round(os.path.getsize(out) / 1024), 'KB')

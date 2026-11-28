#!/usr/bin/env python3
"""KAMPUS v0.7.2 smoke test — kampus-app/ statik to'plami to'g'riligini tekshiradi.

Ishlatish:  python3 tsue3d/smoke.py
Chiqish kodi: 0 = SMOKE PASS, 1 = xato.

Tekshiruvlar:
  • HTTP server (python http.server) orqali index.html 200 va lazy data fayllari 200
  • brand/title, DOM id'lar, emoji yo'qligi
  • window.CAMPUS / window.DISTRICTS / window.DISTRICT_ROADS inline JSON parse
  • data/d_*.bin — header'dagi bino soni == meta count; 12 tuman; jami 253 328
  • data/roads.bin — 8 844 yo'l, pointer bytes mos
  • vercel.json (Cache-Control /data immutable, X-Content-Type-Options, CSP
    frame-ancestors → web.telegram.org, api/*.js functions) va api/ fayllar
  • TELEGRAM_BOT_TOKEN hech qayerda qattiq yozilmagan
"""
import json, os, re, struct, sys, threading, functools, http.server, socketserver, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
APP = os.path.abspath(os.path.join(ROOT, '..', 'kampus-app'))
EXPECTED_TOTAL = 253_328
EXPECTED_ROADS = 8_844

errors, checks = [], []

def ok(msg):
    checks.append(msg)
    print('  ✓', msg)

def fail(msg):
    errors.append(msg)
    print('  ✕', msg)

def check(cond, msg):
    (ok if cond else fail)(msg)

html = open(os.path.join(APP, 'index.html'), encoding='utf-8').read()
if not html:
    fail('index.html boʻsh')
    sys.exit(1)

print('== 1) index.html asosiy ==')
check('DIGITAL TWIN v0.7.2' in html, 'brand «DIGITAL TWIN v0.7.2»')
check('<title>KAMPUS · TDIU — Toshkent 3D digital twin</title>' in html, 'title')
check('DIGITAL TWIN v0.6' not in html and 'DIGITAL TWIN v0.7</span>' not in html, 'eski brand yoʻq')

EMOJI = re.compile('['
    '\U0001F300-\U0001FAFF'   # symbols & pictographs, emoticons, etc.
    '\U00002600-\U00002712'   # misc symbols + dingbats (U+2713 ✓ ruxsat)
    '\U00002714-\U00002714'   # heavy check mark
    '\U00002716-\U000027BF'   # ✕ U+2715 ruxsat — qolganlari emoji
    '\U0001F1E6-\U0001F1FF'   # regional indicators
    '\U0000FE00-\U0000FE0F'   # variation selectors
    '\u2705\u274C'            # white heavy check / cross mark
    ']', re.U)
bad_emoji = [m.group(0) for m in EMOJI.finditer(html)]
check(not bad_emoji, f'emoji yoʻq (topildi: {bad_emoji[:5]})')

REQUIRED_IDS = ['hud', 'quiz', 'duel', 'season', 'campus', 'checkin', 'toast',
                'r-mablag', 'r-bilim', 'r-nufuz', 'r-energy', 'hq-lvl',
                'fac-name', 'campus-name', 'queue', 'q-name', 'q-time', 'q-bar',
                'q-text', 'q-opts', 'd-text', 'd-opts', 'd-hp-p', 'd-hp-o',
                'season-list', 'uni-grid', 'checkin-code', 'checkin-go']
missing = [i for i in REQUIRED_IDS if f'id="{i}"' not in html]
check(not missing, f'DOM id\'lar ({len(REQUIRED_IDS)} ta)' + (f' — YETISHMADI: {missing}' if missing else ''))

def inline_json(marker, html_text=html):
    i = html_text.find(marker)
    assert i >= 0, f'marker topilmadi: {marker}'
    j = html_text.find(';</script>', i)
    return json.loads(html_text[i + len(marker):j])

print('== 1b) game (inline) mazmuni ==')
for frag in ['buildChorsu', 'buildTVTower', 'AKADEMIK LITSEYI', 'LMARR', 'hasInterior']:
    check(frag in html, f'game: {frag}')
check("b.campus === 'main'\n    ?" not in html, 'Finance-interior gate olib tashlangan (qaror)')
check(html.count("b.campus === 'main'") >= 2, 'ichki koʻrinish gate main+finance')

print('== 2) inline JSON bloklari ==')
campus = inline_json('window.CAMPUS = ')
check('campuses' in json.dumps(campus) or 'main' in json.dumps(campus), 'CAMPUS parse + mazmun')

dist = inline_json('window.DISTRICTS = ')
check(set(dist) >= {'meta', 'districts', 'parks', 'trees', 'landmarks', 'pois', 'avenues', 'lamps'}, 'DISTRICTS kalitlari')
check(len(dist['districts']) == 12, '12 tuman')
no_b64 = all('b64' not in v and 'skipped' not in v for v in dist['districts'].values())
check(no_b64, 'inline meta\'da b64/skipped yoʻq (lazy-loading)')
total = sum(v['count'] for v in dist['districts'].values())
check(total == EXPECTED_TOTAL, f'jami bino = {total} (kutilgan {EXPECTED_TOTAL})')
meta_ok = 'ODbL' in dist['meta'].get('source', '')
check(meta_ok, 'meta source ODbL atributsiyasi bilan')
check(len(dist['landmarks']) == 7, '7 landmark (4 eski + chorsu, tv_tower, hotel_uz)')
lm = {x['id']: x for x in dist['landmarks']}
check(lm['chorsu'].get('rx') == 78 and lm['tv_tower'].get('rx') == 95 and lm['hotel_uz'].get('rx') == 55,
      'chorsu/tv_tower/hotel_uz rx radius (bin-skip)')
check(all(lm[k]['x'] is not None and lm[k]['z'] is not None for k in lm), 'barcha landmark koordinatalari')
check(len(dist['parks']) == 20 and len(dist['trees']) == 1879
      and len(dist['pois']) == 64 and len(dist['avenues']) == 10 and len(dist['lamps']) == 1529,
      'parks/trees/pois/avenues/lamps sonlari')
for k, v in dist['districts'].items():
    xs = [p[0] for p in v['ring']]; zs = [p[1] for p in v['ring']]
    rb = [min(xs), min(zs), max(xs), max(zs)]
    check(rb == v['bbox'], f'{k}: bbox == ring bbox')

roads_ptr = inline_json('window.DISTRICT_ROADS = ')
check(roads_ptr.get('file') == 'data/roads.bin', 'DISTRICT_ROADS.file = data/roads.bin')
check(roads_ptr.get('count') == EXPECTED_ROADS, f'DISTRICT_ROADS.count = {EXPECTED_ROADS}')
check(isinstance(roads_ptr.get('bytes'), int) and roads_ptr['bytes'] > 0, 'DISTRICT_ROADS.bytes')

print('== 3) data/*.bin fayllari ==')
data_dir = os.path.join(APP, 'data')
bins_total = 0
for k, v in dist['districts'].items():
    p = os.path.join(data_dir, f'd_{k}.bin')
    if not os.path.exists(p):
        fail(f'{k}: fayl yoʻq'); continue
    size = os.path.getsize(p)
    check(size == v['bytes'], f'{k}: bytes {size} == meta {v["bytes"]}')
    raw = open(p, 'rb').read()
    n_hdr = struct.unpack_from('<I', raw, 0)[0]
    off = 4
    valid = True
    try:
        for _ in range(n_hdr):
            x0, z0, n_pts, h = struct.unpack_from('<hhBB', raw, off)
            off += 6 + (n_pts - 1) * 4
        valid = (off == len(raw))
    except struct.error:
        valid = False
    check(valid and n_hdr == v['count'], f'{k}: bin walk ok, hdr bino = {n_hdr} == count {v["count"]}')
    bins_total += n_hdr
check(bins_total == EXPECTED_TOTAL, f'jami bino (fayllardan) = {bins_total}')

rp = os.path.join(data_dir, 'roads.bin')
raw = open(rp, 'rb').read()
check(len(raw) == roads_ptr['bytes'], f'roads.bin bytes {len(raw)} == pointer {roads_ptr["bytes"]}')
off, nways = 0, 0
while off + 6 <= len(raw):
    n_pts = raw[off + 1]
    off += 6 + (n_pts - 1) * 4
    nways += 1
check(off == len(raw) and nways == EXPECTED_ROADS, f'roads.bin walk: {nways} yoʻl == {EXPECTED_ROADS}')

print('== 4) HTTP server orqali ==')
class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

handler = functools.partial(Quiet, directory=APP)
with socketserver.TCPServer(('127.0.0.1', 0), handler) as httpd:
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    def get(path):
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/{path}', timeout=10) as r:
            return r.status, r.read()
    st, body = get('index.html')
    check(st == 200 and b'DIGITAL TWIN v0.7.2' in body, 'index.html 200 + brand')
    st, _ = get('data/roads.bin')
    check(st == 200, 'data/roads.bin 200')
    for k in dist['districts']:
        st, body = get(f'data/d_{k}.bin')
        check(st == 200 and len(body) == dist['districts'][k]['bytes'], f'data/d_{k}.bin 200 + size')
    httpd.shutdown()

print('== 5) vercel.json + api/ ==')
vj = json.load(open(os.path.join(APP, 'vercel.json'), encoding='utf-8'))
hdrs = {h['source']: h['headers'] for h in vj.get('headers', [])}
check('/data/(.*)' in hdrs and any(x['value'] == 'public, max-age=31536000, immutable' for x in hdrs['/data/(.*)']),
      'vercel.json: /data/(.*) → immutable cache')
check('/index.html' in hdrs and any('must-revalidate' in x['value'] for x in hdrs['/index.html']),
      'vercel.json: /index.html revalidate')
all_hdr = {x['key']: x['value'] for h in vj.get('headers', []) for x in h['headers']}
check(all_hdr.get('X-Content-Type-Options') == 'nosniff', 'vercel.json: nosniff')
check('web.telegram.org' in all_hdr.get('Content-Security-Policy', ''), 'vercel.json: CSP frame-ancestors web.telegram.org')
check('api/*.js' in vj.get('functions', {}), 'vercel.json: api/*.js functions')

TOKEN_RE = re.compile(r'[0-9]{8,12}:[A-Za-z0-9_-]{30,}')
for fn in ['api/telegram.js', 'api/setup.js']:
    p = os.path.join(APP, fn)
    check(os.path.exists(p) and os.path.getsize(p) > 100, f'{fn} mavjud')
    src = open(p, encoding='utf-8').read()
    check('process.env.TELEGRAM_BOT_TOKEN' in src, f'{fn}: token env\'dan o\'qiladi')
    check(not TOKEN_RE.search(src), f'{fn}: qattiq token yoʻq')

print()
if errors:
    print(f'SMOKE FAIL — {len(errors)} xato ({len(checks)} tekshiruvdan oʻtdi):')
    for e in errors:
        print('  -', e)
    sys.exit(1)
print(f'SMOKE PASS — {len(checks)} tekshiruv oʻtdi (jami bino {total}, yoʻllar {EXPECTED_ROADS})')

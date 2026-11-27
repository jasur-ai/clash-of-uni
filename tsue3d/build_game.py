#!/usr/bin/env python3
"""Bitta faylli (offline ishlaydigan) HTML o'yin yig'uvchi.

three.js, campus.json, CSS va game.js ni bitta HTML ichiga inline qiladi —
Telegram WebView va preview iframe (tashqi tarmoqsiz) uchun muhim.
"""
import json, os

ROOT = os.path.dirname(os.path.abspath(__file__))

def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()

tpl = read('src', 'index.template.html')
three = read('vendor', 'three.min.js').replace('</script>', '<\\/script>')
css = read('src', 'style.css')
game = read('src', 'game.js').replace('</script>', '<\\/script>')
data = json.dumps(json.loads(read('build', 'campus.json')), separators=(',', ':'), ensure_ascii=False)

out = (tpl
       .replace('__CSS__', css)
       .replace('__THREE__', three)
       .replace('__DATA__', data)
       .replace('__GAME__', game))

p = os.path.join(ROOT, 'tsue-campus-game.html')
with open(p, 'w', encoding='utf-8') as f:
    f.write(out)
print('OK ->', p, round(os.path.getsize(p) / 1024), 'KB')

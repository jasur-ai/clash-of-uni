#!/usr/bin/env python3
"""KAMPUS v0.2 — bitta faylli build (Telegram WebView + Vercel uchun)."""
import json, os, shutil

ROOT = os.path.dirname(os.path.abspath(__file__))

def read(*p):
    with open(os.path.join(ROOT, *p), encoding='utf-8') as f:
        return f.read()

tpl = read('src', 'index.v2.template.html')
three = read('vendor', 'three.min.js').replace('</script>', '<\\/script>')
css = read('src', 'style.v2.css')
game = read('src', 'game.v2.js').replace('</script>', '<\\/script>')
data = json.dumps(json.loads(read('build', 'campuses.json')), separators=(',', ':'), ensure_ascii=False)
dist_path = os.path.join(ROOT, 'build', 'districts.json')
if os.path.exists(dist_path):
    dist = json.dumps(json.loads(read('build', 'districts.json')), separators=(',', ':'))
    roads = json.dumps(json.loads(read('build', 'roads.json')), separators=(',', ':'))
    print('yo\'llar:', round(len(roads)/1024), 'KB')
else:
    dist = 'null'
    roads = 'null'
print('tumanlar ma\'lumoti:', round(len(dist)/1024), 'KB')

out = (tpl.replace('__CSS__', css)
          .replace('__THREE__', three)
          .replace('__DATA__', data)
          .replace('__DISTRICTS__', dist)
          .replace('__ROADS__', roads)
          .replace('__GAME__', game))

targets = [os.path.join(ROOT, 'tsue-campus-v3.html')]
# Vercel deploy papkasi
deploy = os.path.abspath(os.path.join(ROOT, '..', 'kampus-app'))
if os.path.isdir(deploy):
    targets.append(os.path.join(deploy, 'index.html'))

for p in targets:
    with open(p, 'w', encoding='utf-8') as f:
        f.write(out)
    print('OK ->', p, round(os.path.getsize(p) / 1024), 'KB')

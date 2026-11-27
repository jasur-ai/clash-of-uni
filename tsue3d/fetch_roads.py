#!/usr/bin/env python3
"""Tumanlar uchun asosiy ko'chalar (highway) — tile bo'ylab."""
import urllib.request, urllib.parse, json, time, os
from concurrent.futures import ThreadPoolExecutor
EP='https://maps.mail.ru/osm/tools/overpass/api/interpreter'
HERE=os.path.dirname(os.path.abspath(__file__)); CACHE=os.path.join(HERE,'data','tiles_road')
os.makedirs(CACHE,exist_ok=True)
DISTRICTS={'chilonzor':(41.2226,69.1489,41.3119,69.2600),'yunusobod':(41.3094,69.2280,41.3986,69.3441)}
STEP=0.02
def fetch(q,tries=4):
    for i in range(tries):
        try:
            d=urllib.parse.urlencode({'data':q}).encode()
            r=urllib.request.Request(EP,data=d,headers={'User-Agent':'Mozilla/5.0 kampus'})
            return json.loads(urllib.request.urlopen(r,timeout=120).read())
        except Exception: time.sleep(2+i*2)
def main():
    todo=[]
    for name,bb in DISTRICTS.items():
        s,w,n,e=bb; la=s
        while la<n:
            lo=w
            while lo<e:
                key=f'{name}_{la:.3f}_{lo:.3f}'.replace('.','p'); fp=os.path.join(CACHE,key+'.json')
                if not os.path.exists(fp): todo.append((fp,(la,lo,min(la+STEP,n),min(lo+STEP,e))))
                lo+=STEP
            la+=STEP
    print('yuklanadi:',len(todo))
    def work(it):
        fp,(s,w,n,e)=it
        q=(f'[out:json][timeout:90];way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential)$"]'
           f'({s:.5f},{w:.5f},{n:.5f},{e:.5f});out geom;')
        d=fetch(q)
        if d is None: return -1
        json.dump(d,open(fp,'w')); return len(d['elements'])
    tot=0
    with ThreadPoolExecutor(max_workers=4) as ex:
        for i,n in enumerate(ex.map(work,todo)):
            if n>0: tot+=n
            if (i+1)%10==0: print(' ',i+1,'/',len(todo),flush=True)
    print('jami yo\'l (filtrsiz):',tot)
main()

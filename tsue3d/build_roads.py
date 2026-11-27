#!/usr/bin/env python3
"""Yo'llarni yig'ish, soddalashtirish, siqish -> build/roads.json (b64)."""
import json,os,math,struct,base64
HERE=os.path.dirname(os.path.abspath(__file__)); CACHE=os.path.join(HERE,'data','tiles_road')
WORLD_LAT0,WORLD_LON0=41.30930,69.24990
M_LAT=110574.0; K_LON=111320.0*math.cos(math.radians(WORLD_LAT0))
W={'motorway':1,'trunk':1,'primary':2,'secondary':3,'tertiary':4,'residential':5}
def proj(la,lo): return ((lo-WORLD_LON0)*K_LON, -(la-WORLD_LAT0)*M_LAT)
def dp(pts,tol):
    if len(pts)<3: return pts
    p0,p1=pts[0],pts[-1]; dx,dz=p1[0]-p0[0],p1[1]-p0[1]; L=math.hypot(dx,dz) or 1e-9
    best,idx=0,0
    for i in range(1,len(pts)-1):
        d=abs(dz*(pts[i][0]-p0[0])-dx*(pts[i][1]-p0[1]))/L
        if d>best: best,idx=d,i
    if best>tol:
        return dp(pts[:idx+1],tol)[:-1]+dp(pts[idx:],tol)
    return [p0,p1]
seen={}
for fn in os.listdir(CACHE):
    d=json.load(open(os.path.join(CACHE,fn)))
    for e in d['elements']:
        if e['type']=='way' and e.get('geometry') and len(e['geometry'])>1: seen[e['id']]=e
print('noyob yo\'l:',len(seen))
buf=bytearray(); n=0
for wid,e in seen.items():
    cls=W.get(e.get('tags',{}).get('highway'),5)
    pts=[proj(p['lat'],p['lon']) for p in e['geometry']]
    pts=dp(pts,2.5)
    if len(pts)<2: continue
    q=[(round(x),round(z)) for x,z in pts]
    if any(abs(x)>32000 or abs(z)>32000 for x,z in q): continue
    buf+=struct.pack('<BBhh',cls,min(255,len(q)),q[0][0],q[0][1])
    px,pz=q[0]
    for x,z in q[1:]:
        dx,dz=x-px,z-pz
        if abs(dx)>32000 or abs(dz)>32000: break
        buf+=struct.pack('<hh',dx,dz); px,pz=x,z
    n+=1
print('yo\'l:',n,'binary',round(len(buf)/1024),'KB','b64',round(len(base64.b64encode(bytes(buf)))/1024),'KB')
json.dump({'count':n,'b64':base64.b64encode(bytes(buf)).decode()},open(os.path.join(HERE,'build','roads.json'),'w'),separators=(',',':'))

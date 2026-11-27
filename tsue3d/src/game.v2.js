/* =====================================================================
   KAMPUS: TDIU — v0.2 "Digital Twin"
   • 2 kampus (Asosiy + Moliya), haqiqiy OSM geometriyasi
   • protsedural fasad teksturalari (deraza to'rlari), landmark minora
   • 4 xil egallash usuli: qurilish, fakultet urushi, QR check-in, 1v1 duel
   ===================================================================== */
'use strict';

const W = window.CAMPUS;                  // { meta, campuses[] }
const CPS = W.campuses;
const ALL_B = CPS.flatMap(c => c.buildings);
const byId = id => ALL_B.find(b => b.id === id);
const TG = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
let TG_USER = null;
if (TG) {
  try {
    TG.ready(); TG.expand();
    TG.setHeaderColor && TG.setHeaderColor('#0b1220');
    TG.setBackgroundColor && TG.setBackgroundColor('#0b1220');
    TG.disableVerticalSwipes && TG.disableVerticalSwipes();
    TG_USER = TG.initDataUnsafe && TG.initDataUnsafe.user ? TG.initDataUnsafe.user : null;
  } catch (e) {}
}
window.TG_USER = TG_USER;

/* ---------------------------------------------------------------- rollar */
const ROLE_DEF = {
  hq:         { icon: '🏛', res: null,        base: 0,    name: 'Rektorat' },
  edu:        { icon: '📘', res: 'bilim',     base: 1.4,  name: "O'quv korpusi",       desc: "Ma'ruza zallari — Bilim ishlab chiqaradi." },
  money:      { icon: '💰', res: 'mablag',    base: 2.6,  name: "Tijorat korpusi",     desc: "Kontrakt va tijorat — Mablag' ishlab chiqaradi." },
  flow:       { icon: '🎓', res: 'bilim',     base: 0.9,  name: "Akademik litsey",     desc: "Abituriyentlar oqimi — Bilim + Nufuz." },
  energy:     { icon: '⚡', res: 'energiya',  base: 0.05, name: "Gimnaziya",           desc: "Energiya (sinov urinishlari) tiklaydi." },
  innovation: { icon: '🚀', res: 'mablag',    base: 1.6,  name: "Innovatsiya markazi", desc: "Startap laboratoriyalar — Mablag' + Bilim." },
};
/* kampus bo'yicha chiroyli nomlar */
const ROLE_NAME = {
  main: {
    hq: 'TDIU bosh binosi', edu: "1-o'quv korpusi", money: '2-o\'quv korpusi',
    flow: 'Akademik litsey', energy: 'Iqtisodiyot gimnaziyasi', innovation: 'Ilmiy-innovatsiya markazi',
  },
  finance: {
    hq: 'Moliya instituti', edu: 'Bank-moliya fakulteti', money: 'Buxgalteriya korpusi',
    flow: 'Soliq va soliqqa tortish', energy: 'Moliya litseyi', innovation: 'Moliyaviy texnologiyalar markazi',
  },
};
for (const b of ALL_B) {
  const r = b.role;
  b.roleData = r ? { ...ROLE_DEF[r], key: r, name: (ROLE_NAME[b.campus] || {})[r] || ROLE_DEF[r].name } : null;
}

/* ---------------------------------------------------------------- holat */
const G = {
  v: 2,
  res: { mablag: 400, bilim: 260, nufuz: 0, energiya: 5 },
  lvl: {},                     // bino id -> daraja
  build: null,                 // { id, startedAt, endsAt, toLvl }
  visited: {},                 // check-in qilingan binolar
  owner: {},                   // bino id -> fakultet indeksi (egallangan)
  faculty: 0,                  // o'yinchi fakulteti
  season: { pts: [0, 0, 0, 0, 0], week: 0, last: 0 },
  campus: 'main',
  quizBest: 0, duelWin: 0, duelLose: 0,
  quality: 'auto',
};
const CAP = 10;

function load() {
  try {
    const s = JSON.parse(localStorage.getItem('tsue_campus_v2') || 'null');
    if (s && s.v === G.v) Object.assign(G, s);
  } catch (e) {}
  for (const b of ALL_B) if (b.role && !G.lvl[b.id]) G.lvl[b.id] = 1;
  G.res.energiya = Math.min(5, G.res.energiya);
}
function save() { try { localStorage.setItem('tsue_campus_v2', JSON.stringify(G)); } catch (e) {} }
load();

const FACULTIES = [
  { n: 'Iqtisodiyot', c: '#4cc9f0' },
  { n: 'Moliya', c: '#f7b731' },
  { n: 'Biznes', c: '#a78bfa' },
  { n: 'Turizm', c: '#34d399' },
  { n: 'Raqamli iqtisodiyot', c: '#fb7185' },
];

/* iqtisod */
const MABLAG_MULT = 6;
const costMablag = n => Math.round(240 * Math.pow(1.55, n - 1));
const costBilim  = n => Math.round(40 * Math.pow(1.45, n - 1));
const buildTime  = n => Math.round(8 * Math.pow(1.9, n - 1));
const prodRate   = b => b.roleData.base * G.lvl[b.id];
const sumLevels  = () => ALL_B.filter(b => b.role).reduce((a, b) => a + G.lvl[b.id], 0);
const hqLvl      = () => G.lvl[CPS.find(c => c.id === 'main').buildings.find(b => b.role === 'hq').id] || 1;
const gateLvl    = () => Math.min(hqLvl() + 1, CAP);

/* ---------------------------------------------------------------- three */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', logarithmicDepthBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 3, 32000);

/* osmon gradienti */
(function sky() {
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256;
  const cx = cv.getContext('2d');
  const g = cx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#08131f'); g.addColorStop(0.45, '#16304a'); g.addColorStop(0.75, '#3a5f7d'); g.addColorStop(1, '#6d8ea6');
  cx.fillStyle = g; cx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex;
})();

scene.fog = new THREE.Fog(0x54718a, 900, 9000);

const hemi = new THREE.HemisphereLight(0xdfefff, 0x40566f, 1.5);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d8, 2.0);
sun.position.set(-260, 420, 220);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x9cc0ff, 0.5);
fill.position.set(300, 160, -300);
scene.add(fill);

/* ---------------------------------------------------------------- teksturalar */
function noiseCanvas(size, base, amp, extra) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const c = cv.getContext('2d');
  c.fillStyle = base; c.fillRect(0, 0, size, size);
  const img = c.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * amp;
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
  }
  c.putImageData(img, 0, 0);
  if (extra) extra(c, size);
  return cv;
}

/* fasad: 3 xil uslub. Bitta bo'lak = 1 oyna moduli (3.0 x 3.4 m) */
function facadeTexture(style) {
  const S = 128;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const wall = style === 'glass' ? '#dfe6ec' : style === 'classic' ? '#f2ece1' : '#e9e7e2';
  c.fillStyle = wall; c.fillRect(0, 0, S, S);
  // g'isht/panel bo'g'inlari
  c.strokeStyle = 'rgba(0,0,0,0.07)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(0, S - 1); c.lineTo(S, S - 1); c.stroke();

  if (style === 'glass') {
    // vertikal oyna chizig'i
    const grad = c.createLinearGradient(0, 0, 0, S);
    grad.addColorStop(0, '#6f97ad'); grad.addColorStop(0.45, '#3f6d86'); grad.addColorStop(1, '#2c5169');
    c.fillStyle = grad;
    c.fillRect(8, 6, S - 16, S - 16);
    c.fillStyle = 'rgba(255,255,255,0.20)';
    c.beginPath(); c.moveTo(14, S - 10); c.lineTo(40, 6); c.lineTo(56, 6); c.lineTo(30, S - 10); c.fill();
    c.strokeStyle = 'rgba(250,250,250,0.85)'; c.lineWidth = 5;
    c.strokeRect(8, 6, S - 16, S - 16);
  } else if (style === 'classic') {
    // ikki qanotli deraza + rom
    c.fillStyle = '#38576b';
    c.fillRect(14, 18, S - 28, S - 46);
    const g2 = c.createLinearGradient(14, 18, S - 14, S - 28);
    g2.addColorStop(0, 'rgba(160,205,230,0.55)'); g2.addColorStop(0.5, 'rgba(90,140,175,0.15)'); g2.addColorStop(1, 'rgba(180,215,235,0.4)');
    c.fillStyle = g2; c.fillRect(14, 18, S - 28, S - 46);
    c.strokeStyle = '#f7f3ea'; c.lineWidth = 5;
    c.strokeRect(14, 18, S - 28, S - 46);
    c.beginPath(); c.moveTo(S / 2, 18); c.lineTo(S / 2, S - 28); c.stroke();
    c.beginPath(); c.moveTo(14, S / 2 - 4); c.lineTo(S - 14, S / 2 - 4); c.stroke();
    c.fillStyle = 'rgba(0,0,0,0.10)'; c.fillRect(12, S - 26, S - 24, 6);   // soyabon tokcha
  } else {
    // oddiy panel derazasi (2 ta)
    for (const x of [16, S / 2 + 4]) {
      c.fillStyle = '#31505f';
      c.fillRect(x, 26, S / 2 - 26, S - 60);
      c.fillStyle = 'rgba(150,195,220,0.35)';
      c.fillRect(x, 26, S / 2 - 26, 12);
      c.strokeStyle = 'rgba(255,255,255,0.65)'; c.lineWidth = 3;
      c.strokeRect(x, 26, S / 2 - 26, S - 60);
    }
    c.fillStyle = 'rgba(0,0,0,0.06)'; c.fillRect(0, S - 30, S, 4);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

const TEX = {
  panel: facadeTexture('panel'),
  classic: facadeTexture('classic'),
  glass: facadeTexture('glass'),
  roof: new THREE.CanvasTexture(noiseCanvas(128, '#8b8f94', 26)),
  grass: new THREE.CanvasTexture(noiseCanvas(256, '#5f8b62', 26)),
  asphalt: new THREE.CanvasTexture(noiseCanvas(128, '#3a424c', 16)),
};
for (const k of ['roof', 'grass', 'asphalt']) {
  TEX[k].wrapS = TEX[k].wrapT = THREE.RepeatWrapping;
  TEX[k].colorSpace = THREE.SRGBColorSpace;
}
TEX.grass.repeat.set(320, 320);
TEX.roof.repeat.set(1, 1);

/* ---------------------------------------------------------------- geometriya yig'uvchi */
class Builder {
  constructor() { this.pos = []; this.nor = []; this.uv = []; this.col = []; this.idx = []; }
  vert(p, n, u, v, c) {
    this.pos.push(p[0], p[1], p[2]);
    this.nor.push(n[0], n[1], n[2]);
    this.uv.push(u, v);
    this.col.push(c[0], c[1], c[2]);
    return this.pos.length / 3 - 1;
  }
  tri(a, b, c) { this.idx.push(a, b, c); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  }
}

const MOD_U = 3.0, MOD_V = 3.4;           // oyna moduli (m)

/** Poligonni ekstruziya qiladi va builder'ga qo'shadi. */
function extrudeInto(sb, rb, pts, h, base, color, style) {
  const n = pts.length;
  let cx = 0, cz = 0;
  for (const p of pts) { cx += p[0]; cz += p[1]; }
  cx /= n; cz /= n;
  const col = [color.r, color.g, color.b];

  let run = 0;
  for (let i = 0; i < n; i++) {
    const p0 = pts[i], p1 = pts[(i + 1) % n];
    const dx = p1[0] - p0[0], dz = p1[1] - p0[1];
    const len = Math.hypot(dx, dz);
    if (len < 0.3) continue;
    const ex = dx / len, ez = dz / len;
    let nx = ez, nz = -ex;
    const mx = (p0[0] + p1[0]) / 2 - cx, mz = (p0[1] + p1[1]) / 2 - cz;
    if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; }
    const u0 = run / MOD_U, u1 = (run + len) / MOD_U;
    run += len;
    const v0 = base / MOD_V, v1 = (base + h) / MOD_V;

    const a = [p0[0], base, p0[1]], b2 = [p1[0], base, p1[1]];
    const c2 = [p1[0], base + h, p1[1]], d = [p0[0], base + h, p0[1]];
    const nn = [nx, 0, nz];
    // winding: tashqi normalga mos
    const cr = [
      (b2[1] - a[1]) * (c2[2] - a[2]) - (b2[2] - a[2]) * (c2[1] - a[1]),
      (b2[2] - a[2]) * (c2[0] - a[0]) - (b2[0] - a[0]) * (c2[2] - a[2]),
      (b2[0] - a[0]) * (c2[1] - a[1]) - (b2[1] - a[1]) * (c2[0] - a[0]),
    ];
    const flip = cr[0] * nn[0] + cr[1] * nn[1] + cr[2] * nn[2] < 0;
    const i0 = sb.vert(flip ? d : a, nn, flip ? u1 : u0, flip ? v1 : v0, col);
    const i1 = sb.vert(flip ? c2 : b2, nn, flip ? u0 : u1, flip ? v1 : v0, col);
    const i2 = sb.vert(flip ? b2 : c2, nn, flip ? u0 : u1, flip ? v0 : v1, col);
    const i3 = sb.vert(flip ? a : d, nn, flip ? u1 : u0, flip ? v0 : v1, col);
    sb.tri(i0, i1, i2); sb.tri(i0, i2, i3);
  }

  // tom
  const contour = pts.map(p => new THREE.Vector2(p[0], p[1]));
  const faces = THREE.ShapeUtils.triangulateShape(contour, []);
  const up = [0, 1, 0];
  for (const f of faces) {
    const P = f.map(i => [pts[i][0], base + h, pts[i][1]]);
    const cru = [
      (P[1][1] - P[0][1]) * (P[2][2] - P[0][2]) - (P[1][2] - P[0][2]) * (P[2][1] - P[0][1]),
      (P[1][2] - P[0][2]) * (P[2][0] - P[0][0]) - (P[1][0] - P[0][0]) * (P[2][2] - P[0][2]),
      (P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[1][1] - P[0][1]) * (P[2][0] - P[0][0]),
    ];
    const flip = cru[1] < 0;
    const ord = flip ? [0, 2, 1] : [0, 1, 2];
    const ids = ord.map(i => rb.vert(P[i], up, P[i][0] / 6, P[i][2] / 6, col));
    rb.tri(ids[0], ids[1], ids[2]);
  }
}

/* binoning to'liq geometriyasi (devor + tom) */
function buildingMeshes(b) {
  const sb = new Builder(), rb = new Builder();
  const color = new THREE.Color(b.color);
  if (b.landmark && b.landmark.tower) {
    const lm = b.landmark;
    const podH = (lm.podiumFloors || 3) * 3.4;
    extrudeInto(sb, rb, b.pts, podH, 0, color, 'classic');
    // minora: markazga nisbatan to'rtburchak
    const w = lm.tower.w / 2, d = lm.tower.d / 2;
    const cx = b.px, cz = b.pz;
    const rect = [[cx - w, cz - d], [cx + w, cz - d], [cx + w, cz + d], [cx - w, cz + d]];
    const towerH = Math.max(6, b.h - podH);
    extrudeInto(sb, rb, rect, towerH, podH, new THREE.Color('#dfe9f0'), 'glass');
    // toj (crown)
    extrudeInto(rb, rb, [[cx - w * 1.06, cz - d * 1.06], [cx + w * 1.06, cz - d * 1.06],
    [cx + w * 1.06, cz + d * 1.06], [cx - w * 1.06, cz + d * 1.06]], 2.2, b.h, new THREE.Color('#8fa3b5'), 'glass');
  } else {
    extrudeInto(sb, rb, b.pts, b.h, 0, color, b.style);
  }
  return { walls: sb.geometry(), roof: rb.geometry(), style: b.landmark ? 'glass' : b.style };
}

/* ---------------------------------------------------------------- materiallar */
const wallMat = {};
function matForStyle(style) {
  if (!wallMat[style]) {
    wallMat[style] = new THREE.MeshLambertMaterial({ map: TEX[style], vertexColors: true });
  }
  return wallMat[style];
}
const roofMaterial = new THREE.MeshLambertMaterial({ map: TEX.roof, vertexColors: true });
const cityRoofMat = new THREE.MeshLambertMaterial({ vertexColors: true });

/* ---------------------------------------------------------------- yer */
const groundGeo = new THREE.PlaneGeometry(26000, 26000, 1, 1);
groundGeo.rotateX(-Math.PI / 2);
const ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ map: TEX.grass, color: 0x93a08c }));
ground.position.y = -0.8;
scene.add(ground);

/* yo'llar va maydonlar — kampus bo'yicha yig'iladi */
function ribbon(pts, w) {
  const pos = [], idx = [];
  const hw = w / 2;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const a = pts[Math.max(0, i - 1)], b2 = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b2[0] - a[0], dz = b2[1] - a[1];
    const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    pos.push(p[0] - dz * hw, 0.1, p[1] + dx * hw);
    pos.push(p[0] + dz * hw, 0.1, p[1] - dx * hw);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const flatMat = {
  grass: new THREE.MeshLambertMaterial({ color: 0x74a06d }),
  pitch: new THREE.MeshLambertMaterial({ color: 0x74a06a }),
  ground: new THREE.MeshLambertMaterial({ color: 0x6f7a80 }),
  pavement: new THREE.MeshLambertMaterial({ color: 0x8b9198 }),
  water: new THREE.MeshLambertMaterial({ color: 0x2f6f96 }),
};

/* bir nechta BufferGeometry'ni bitta geometriyaga qo'shish */
function mergeGeos(list) {
  if (!list.length) return null;
  let vCount = 0, iCount = 0;
  for (const g of list) { vCount += g.attributes.position.count; iCount += g.index ? g.index.count : 0; }
  const pos = new Float32Array(vCount * 3), nor = new Float32Array(vCount * 3);
  const idx = new Uint32Array(iCount);
  let vo = 0, io = 0;
  for (const g of list) {
    const gp = g.attributes.position.array, gn = g.attributes.normal ? g.attributes.normal.array : null;
    pos.set(gp, vo * 3);
    if (gn) nor.set(gn, vo * 3);
    const gi = g.index ? g.index.array : null;
    if (gi) { for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + vo; io += gi.length; }
    vo += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  return out;
}

/* kampus obyektlari guruhi */
const world = new THREE.Group();
scene.add(world);
const pickables = [];
const roleMeshes = new Map();      // bino id -> mesh(lar)
const labels = [];
const boundaries = {};

for (const cp of CPS) {
  const g = new THREE.Group();
  world.add(g);
  cp.group = g;

  /* maydonlar (birlashtirilgan) */
  const greenGroups = {};
  for (const gg of cp.greens) {
    try {
      const shape = new THREE.Shape();
      shape.moveTo(gg.pts[0][0], -gg.pts[0][1]);
      for (let i = 1; i < gg.pts.length; i++) shape.lineTo(gg.pts[i][0], -gg.pts[i][1]);
      const geo = new THREE.ShapeGeometry(shape);
      geo.rotateX(-Math.PI / 2);
      const kind = flatMat[gg.kind] ? gg.kind : 'grass';
      (greenGroups[kind] = greenGroups[kind] || []).push(geo);
    } catch (e) {}
  }
  for (const kind of Object.keys(greenGroups)) {
    const mergedG = mergeGeos(greenGroups[kind]);
    if (!mergedG) continue;
    const m = new THREE.Mesh(mergedG, flatMat[kind]);
    m.position.y = 0.05;
    g.add(m);
  }

  /* yo'llar */
  const roadGeo = [];
  const pathGeo = [];
  for (const r of cp.roads) {
    if (r.pts.length < 2) continue;
    (r.w >= 5 ? roadGeo : pathGeo).push(ribbon(r.pts, r.w));
  }
  const rm = mergeGeos(roadGeo);
  if (rm) {
    const m = new THREE.Mesh(rm, new THREE.MeshLambertMaterial({ map: TEX.asphalt, color: 0x7f878f, side: THREE.DoubleSide }));
    m.position.y = 0.09; g.add(m);
  }
  const pm = mergeGeos(pathGeo);
  if (pm) {
    const m = new THREE.Mesh(pm, new THREE.MeshLambertMaterial({ color: 0x9099a2, side: THREE.DoubleSide }));
    m.position.y = 0.12; g.add(m);
  }

  /* binolar: dekorativlar merged, rollilar alohida */
  const merged = { walls: {}, roofs: new Builder() };
  for (const b of cp.buildings) {
    if (b.role) continue;
    const { walls, roof, style } = buildingMeshes(b);
    // merge
    const key = style;
    if (!merged.walls[key]) merged.walls[key] = { pos: [], nor: [], uv: [], col: [], idx: [] };
    const dst = merged.walls[key];
    appendGeom(dst, walls);
    appendGeom(merged.roofs, roof);
  }
  for (const style of Object.keys(merged.walls)) {
    const geo = builderToGeometry(merged.walls[style]);
    const m = new THREE.Mesh(geo, matForStyle(style));
    g.add(m);
  }
  const roofGeo = builderToGeometry(merged.roofs);
  if (roofGeo) g.add(new THREE.Mesh(roofGeo, roofMaterial));

  /* rolli binolar */
  for (const b of cp.buildings) {
    if (!b.role) continue;
    const { walls, roof, style } = buildingMeshes(b);
    const grp = new THREE.Group();
    const wm = new THREE.Mesh(walls, matForStyle(style));
    wm.material = matForStyle(style);
    const rm = new THREE.Mesh(roof, roofMaterial);
    grp.add(wm, rm);
    grp.userData.b = b;
    g.add(grp);
    pickables.push(wm, rm);
    roleMeshes.set(b.id, grp);

    // kontur chizig'i
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(walls, 25),
      new THREE.LineBasicMaterial({ color: 0x7fd7ff, transparent: true, opacity: 0.18 })
    );
    grp.add(edges);

    // yorliq
    const mat = new THREE.SpriteMaterial({ map: labelTexture(b, G.lvl[b.id]), transparent: true, depthTest: false, depthWrite: false });
    const sp = new THREE.Sprite(mat);
    sp.userData.aspect = 320 / 112;
    sp.scale.set(26, 26 / (320 / 112), 1);
    sp.position.set(b.px, b.h + 10, b.pz);
    sp.renderOrder = 10;
    g.add(sp);
    labels.push({ b, sp });

    // egalik halqasi
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(Math.max(8, b.area / 26), Math.max(9, b.area / 26) + 2.2, 40),
      new THREE.MeshBasicMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0.0, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(b.px, 0.3, b.pz);
    g.add(ring);
    b.ring = ring;
  }

  /* kampus yuzasi — universitet hududi rang bilan ajralib turadi */
  const discGeo = new THREE.CircleGeometry(cp.radius, 96);
  discGeo.rotateX(-Math.PI / 2);
  const disc = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({
    color: 0x2fd6c0, transparent: true, opacity: 0.13, depthWrite: false
  }));
  disc.position.set(cp.cx, 0.02, cp.cz);
  g.add(disc);
  cp.disc = disc;

  /* kampus nomi (katta yozuv) */
  {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
    const c2 = cv.getContext('2d');
    c2.fillStyle = 'rgba(8,18,28,0.72)';
    c2.beginPath();
    if (c2.roundRect) c2.roundRect(6, 6, 500, 116, 28); else c2.rect(6, 6, 500, 116);
    c2.fill();
    c2.strokeStyle = 'rgba(47,214,192,0.9)'; c2.lineWidth = 5;
    c2.beginPath();
    if (c2.roundRect) c2.roundRect(6, 6, 500, 116, 28); else c2.rect(6, 6, 500, 116);
    c2.stroke();
    c2.font = '800 46px system-ui, sans-serif';
    c2.textAlign = 'center'; c2.textBaseline = 'middle';
    c2.fillStyle = '#e9fffb';
    c2.fillText(cp.id === 'main' ? 'TDIU' : 'MOLIYA', 256, 50);
    c2.font = '600 26px system-ui, sans-serif';
    c2.fillStyle = '#8fe6d8';
    c2.fillText(cp.name, 256, 90);
    const t2 = new THREE.CanvasTexture(cv);
    t2.colorSpace = THREE.SRGBColorSpace;
    const sp2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: t2, transparent: true, depthTest: false, depthWrite: false }));
    sp2.position.set(cp.cx, 70, cp.cz);
    sp2.scale.set(150, 37.5, 1);
    sp2.renderOrder = 11;
    cp.bigLabel = sp2;
    g.add(sp2);
  }

  /* kampus chegarasi */
  const rg = new THREE.RingGeometry(cp.radius - 3, cp.radius, 128);
  rg.rotateX(-Math.PI / 2);
  const bm = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0x37e0c8, transparent: true, opacity: 0.45, side: THREE.DoubleSide }));
  bm.position.set(cp.cx, 0.2, cp.cz);
  g.add(bm);
  boundaries[cp.id] = bm;
}

/* yordamchi: geometry -> builder massivlariga */
function appendGeom(dst, geo) {
  const off = dst.pos.length / 3;
  const p = geo.attributes.position.array, n = geo.attributes.normal.array;
  const u = geo.attributes.uv.array, c = geo.attributes.color.array;
  for (let i = 0; i < p.length; i++) dst.pos.push(p[i]);
  for (let i = 0; i < n.length; i++) dst.nor.push(n[i]);
  for (let i = 0; i < u.length; i++) dst.uv.push(u[i]);
  for (let i = 0; i < c.length; i++) dst.col.push(c[i]);
  const idx = geo.index.array;
  for (let i = 0; i < idx.length; i++) dst.idx.push(idx[i] + off);
}
function builderToGeometry(d) {
  if (!d || !d.pos.length) return null;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(d.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(d.nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(d.uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(d.col, 3));
  g.setIndex(d.idx);
  g.computeBoundingSphere();
  return g;
}


/* shahar to'ldiruvchisi olib tashlandi — v0.3 da haqiqiy OSM binolari */


/* ---------------------------------------------------------------- TUMANLAR (Chilonzor + Yunusobod)
   Haqiqiy OSM binolari: base64 -> Int16 delta -> uchastkalar (chunk) bo'yicha merge. */
const DISTRICTS = [];       // {name, count, buildings:[{pts,h,cx,cz}]}
const districtMeshes = [];  // chunk meshes
let districtLabel = null;
let farCityMesh = null;
let farTallMesh = null;
const DIST_LABELS = [];

function decodeDistrict(b64) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const dv = new DataView(u8.buffer);
  let off = 0;
  const n = dv.getUint32(off, true); off += 4;
  const out = [];
  for (let i = 0; i < n; i++) {
    const x0 = dv.getInt16(off, true), z0 = dv.getInt16(off + 2, true);
    const cnt = dv.getUint8(off + 4), h = dv.getUint8(off + 5);
    off += 6;
    const pts = [[x0, z0]];
    let px = 0, pz = 0;
    for (let k = 1; k < cnt; k++) {
      px += dv.getInt16(off, true); pz += dv.getInt16(off + 2, true); off += 4;
      pts.push([x0 + px, z0 + pz]);
    }
    let cx = 0, cz = 0;
    for (const q of pts) { cx += q[0]; cz += q[1]; }
    out.push({ pts, h, cx: cx / pts.length, cz: cz / pts.length });
  }
  return out;
}

function buildDistricts() {
  if (!window.DISTRICTS) return;
  for (const key of Object.keys(window.DISTRICTS.districts)) {
    const d = window.DISTRICTS.districts[key];
    const blds = decodeDistrict(d.b64);
    DISTRICTS.push({ key, name: d.name, buildings: blds, count: blds.length, ring: d.ring || [] });

    /* tuman yuzasi (shahar zamini) */
    if (d.ring && d.ring.length > 2) {
      const shp = new THREE.Shape();
      shp.moveTo(d.ring[0][0], -d.ring[0][1]);
      for (let i = 1; i < d.ring.length; i++) shp.lineTo(d.ring[i][0], -d.ring[i][1]);
      const gGeom = new THREE.ShapeGeometry(shp);
      gGeom.rotateX(-Math.PI / 2);
      const gm = new THREE.Mesh(gGeom, new THREE.MeshLambertMaterial({ color: 0x5b646d }));
      gm.position.y = -0.25;
      world.add(gm);
      // chegara chizig'i
      const pts = d.ring.map(([x, z]) => new THREE.Vector3(x, 0.15, z));
      const lg = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.LineLoop(lg, new THREE.LineBasicMaterial({ color: 0x5ea8c9, transparent: true, opacity: 0.5 }));
      world.add(line);

      /* tuman nomi (uzoqdan ko'rinadi) */
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
      const c2 = cv.getContext('2d');
      c2.font = '800 64px system-ui, sans-serif';
      c2.textAlign = 'center'; c2.textBaseline = 'middle';
      c2.fillStyle = 'rgba(8,16,26,0.78)';
      if (c2.roundRect) { c2.beginPath(); c2.roundRect(4, 24, 504, 80, 22); c2.fill(); }
      else c2.fillRect(4, 24, 504, 80);
      c2.strokeStyle = 'rgba(120,200,235,0.85)'; c2.lineWidth = 4;
      c2.stroke();
      c2.fillStyle = '#ffffff';
      c2.fillText(d.name.toUpperCase(), 256, 66);
      const tx2 = new THREE.CanvasTexture(cv);
      tx2.colorSpace = THREE.SRGBColorSpace;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx2, transparent: true, depthTest: false, depthWrite: false, opacity: 0.85 }));
      sp.position.set(d.ring.reduce((a, p) => a + p[0], 0) / d.ring.length, 30,
                      d.ring.reduce((a, p) => a + p[1], 0) / d.ring.length);
      sp.scale.set(420, 105, 1);
      sp.renderOrder = 5;
      world.add(sp);
      DIST_LABELS.push(sp);
      }


    /* uchastkalar: 700 m to'r */
    const CHUNK = 950;
    const cells = new Map();
    const campCenters = [[0, 0], [2857, -1668]];
    for (const b of blds) {
      let skip = false;
      for (const cc of campCenters) if (Math.hypot(b.cx - cc[0], b.cz - cc[1]) < 430) skip = true;
      if (skip) continue;
      const k = Math.floor(b.cx / CHUNK) + ':' + Math.floor(b.cz / CHUNK);
      let c = cells.get(k);
      if (!c) { c = { sb: new Builder(), rb: new Builder() }; cells.set(k, c); }
      const t = ((b.h - 3) / 40);
      const col = new THREE.Color().setHSL(0.085 - 0.02 * Math.min(1, t), 0.06 + 0.07 * Math.min(1, t), 0.64 + 0.07 * (1 - Math.min(1, t)));
      extrudeInto(c.sb, c.rb, b.pts, b.h, 0, col, 'panel');
      if (b.h >= 14) {
        if (!window.__farTall) window.__farTall = new Builder();
        extrudeInto(window.__farTall, window.__farTall, b.pts, b.h, 0, col, 'panel');
      }
    }
    for (const c of cells.values()) {
      /* uzoq masofa uchun yagona birlashtirilgan tom to'plami */
      if (!window.__farRoof) window.__farRoof = new Builder();
      const fr = window.__farRoof;
      const off = fr.pos.length / 3;
      for (let i = 0; i < c.rb.pos.length; i++) fr.pos.push(c.rb.pos[i]);
      for (let i = 0; i < c.rb.nor.length; i++) fr.nor.push(c.rb.nor[i]);
      for (let i = 0; i < c.rb.uv.length; i++) fr.uv.push(c.rb.uv[i]);
      for (let i = 0; i < c.rb.col.length; i++) fr.col.push(c.rb.col[i]);
      for (let i = 0; i < c.rb.idx.length; i++) fr.idx.push(c.rb.idx[i] + off);

      const wg = builderToGeometry({ pos: c.sb.pos, nor: c.sb.nor, uv: c.sb.uv, col: c.sb.col, idx: c.sb.idx });
      const rg = builderToGeometry({ pos: c.rb.pos, nor: c.rb.nor, uv: c.rb.uv, col: c.rb.col, idx: c.rb.idx });
      if (wg) {
        const wm = new THREE.Mesh(wg, matForStyle('panel'));
        wm.userData.kind = 'walls';
        world.add(wm); districtMeshes.push(wm);
      }
      if (rg) {
        const rm = new THREE.Mesh(rg, cityRoofMat);
        rm.userData.kind = 'roof';
        world.add(rm); districtMeshes.push(rm);
      }
    }
  }
  if (window.__farRoof) {
    const parts = [window.__farRoof];
    if (window.__farTall && window.__farTall.idx.length) {
      // baland binolar devorlari material talab qiladi — alohida mesh
      const tg = builderToGeometry(window.__farTall);
      const tm = new THREE.Mesh(tg, matForStyle('panel'));
      tm.visible = false;
      world.add(tm);
      farTallMesh = tm;
    }
    const g = builderToGeometry(window.__farRoof);
    farCityMesh = new THREE.Mesh(g, cityRoofMat);
    farCityMesh.visible = false;
    world.add(farCityMesh);
  }
  console.log('tumanlar:', DISTRICTS.map(d => d.name + ' ' + d.count).join(', '),
              '| chunk mesh:', districtMeshes.length);
}
buildDistricts();

/* butun shahar bo'yicha avtomatik "umumiy ko'rinish" ramkasi */
const OVERVIEW = (() => {
  let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const d of DISTRICTS) for (const b of d.buildings) {
    if (b.cx < minX) minX = b.cx; if (b.cx > maxX) maxX = b.cx;
    if (b.cz < minZ) minZ = b.cz; if (b.cz > maxZ) maxZ = b.cz;
  }
  if (minX > maxX) { minX = -900; maxX = 3800; minZ = -2600; maxZ = 900; }
  return {
    tx: (minX + maxX) / 2, tz: (minZ + maxZ) / 2,
    r: Math.max(maxX - minX, maxZ - minZ) * 1.0,
  };
})();


/* ---------------------------------------------------------------- tuman ko'chalari */
function buildDistrictRoads() {
  if (!window.DISTRICT_ROADS) return;
  const bin = atob(window.DISTRICT_ROADS.b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const dv = new DataView(u8.buffer);
  const WIDTH = { 1: 26, 2: 20, 3: 15, 4: 11, 5: 8 };
  const groups = {};
  let off = 0;
  while (off < u8.length) {
    const cls = dv.getUint8(off), n = dv.getUint8(off + 1);
    let px = dv.getInt16(off + 2, true), pz = dv.getInt16(off + 4, true);
    off += 6;
    const pts = [[px, pz]];
    for (let k = 1; k < n; k++) {
      px += dv.getInt16(off, true); pz += dv.getInt16(off + 2, true); off += 4;
      pts.push([px, pz]);
    }
    const w = WIDTH[cls] || 8;
    (groups[cls] = groups[cls] || []).push(ribbon(pts, w));
  }
  for (const cls of Object.keys(groups)) {
    const g = mergeGeos(groups[cls]);
    if (!g) continue;
    const c = cls === '1' ? 0xa9b1b8 : cls === '2' ? 0xb4bbc2 : cls === '3' ? 0xbcc2c8 : 0xc4c9ce;
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
    m.position.y = 0.07;
    world.add(m);
  }
}
buildDistrictRoads();

/* daraxtlar (instanced) */
(function trees() {
  const N = 520;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.5, 3.4, 5), new THREE.MeshLambertMaterial({ color: 0x4d3b2a }), N);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.7, 0), new THREE.MeshLambertMaterial({ color: 0x3f7a44 }), N);
  const d = new THREE.Object3D();
  let n = 0;
  for (const cp of CPS) {
    for (const gg of cp.greens) {
      if (gg.kind !== 'grass' && gg.kind !== 'pitch') continue;
      const cs = gg.pts;
      const cx = cs.reduce((a, p) => a + p[0], 0) / cs.length;
      const cz = cs.reduce((a, p) => a + p[1], 0) / cs.length;
      let rad = 0; for (const p of cs) rad = Math.max(rad, Math.hypot(p[0] - cx, p[1] - cz));
      if (rad < 5) continue;
      const k = Math.min(12, Math.max(1, Math.round(rad / 7)));
      for (let i = 0; i < k && n < N; i++) {
        const ang = Math.random() * Math.PI * 2, rr = Math.random() * rad * 0.75;
        const x = cx + Math.cos(ang) * rr, z = cz + Math.sin(ang) * rr;
        const s = 0.75 + Math.random() * 0.75;
        d.position.set(x, 1.7 * s, z); d.scale.setScalar(s); d.rotation.set(0, Math.random() * 6, 0); d.updateMatrix();
        trunk.setMatrixAt(n, d.matrix);
        d.position.y = 3.8 * s; d.updateMatrix();
        crown.setMatrixAt(n, d.matrix);
        n++;
      }
    }
  }
  trunk.count = crown.count = n;
  trunk.instanceMatrix.needsUpdate = crown.instanceMatrix.needsUpdate = true;
  scene.add(trunk, crown);
})();

/* tanlash halqasi */
const selRing = new THREE.Mesh(
  new THREE.RingGeometry(1, 1.06, 64),
  new THREE.MeshBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
);
selRing.rotation.x = -Math.PI / 2;
selRing.visible = false;
scene.add(selRing);

/* yorliq teksturasi */
function labelTexture(b, lvl) {
  const Wd = 320, Hd = 112;
  const cv = document.createElement('canvas'); cv.width = Wd; cv.height = Hd;
  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(10,17,30,0.84)';
  c.strokeStyle = 'rgba(110,231,255,0.5)'; c.lineWidth = 3;
  c.beginPath();
  if (c.roundRect) c.roundRect(4, 4, Wd - 8, Hd - 8, 26); else c.rect(4, 4, Wd - 8, Hd - 8);
  c.fill(); c.stroke();
  const own = G.owner[b.id];
  c.beginPath(); c.arc(52, 56, 24, 0, Math.PI * 2);
  c.fillStyle = own !== undefined ? FACULTIES[own].c : 'rgba(110,231,255,0.95)';
  c.fill();
  c.fillStyle = '#06131f'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '800 30px system-ui, sans-serif';
  c.fillText(String(lvl), 52, 58);
  c.fillStyle = '#eaf4ff'; c.textAlign = 'left';
  c.font = '700 25px system-ui, sans-serif';
  const nm = b.roleData.name;
  c.fillText(nm.length > 18 ? nm.slice(0, 17) + '…' : nm, 88, 58);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function refreshLabel(b) {
  const L = labels.find(x => x.b.id === b.id);
  if (!L) return;
  const old = L.sp.material.map;
  L.sp.material.map = labelTexture(b, G.lvl[b.id]);
  L.sp.material.needsUpdate = true;
  if (old) old.dispose();
}
function refreshAllLabels() { for (const L of labels) refreshLabel(L.b); }

/* ---------------------------------------------------------------- kamera */
const CAMS = {
  main: { theta: -0.72, phi: 0.86, r: 700, tx: 0, tz: 0 },
  finance: { theta: -2.3, phi: 0.86, r: 650, tx: 0, tz: 0 },
};
{
  const f = CPS.find(c => c.id === 'finance');
  if (f) { CAMS.finance.tx = f.cx; CAMS.finance.tz = f.cz; }
}
const cam = { theta: -0.72, phi: 0.86, r: 700, tx: 0, tz: 0, txT: 0, tzT: 0 };
function applyCam() {
  cam.tx += (cam.txT - cam.tx) * 0.1;
  cam.tz += (cam.tzT - cam.tz) * 0.1;
  /* masofaga mos tuman (fog) — yaqin ko'rinishda atmosfera, uzoqda ochiq */
  scene.fog.near = Math.max(420, cam.r * 1.35);
  scene.fog.far = Math.max(1600, cam.r * 4.2);
  const y = Math.cos(cam.phi) * cam.r, rr = Math.sin(cam.phi) * cam.r;
  camera.position.set(cam.tx + Math.sin(cam.theta) * rr, Math.max(6, y), cam.tz + Math.cos(cam.theta) * rr);
  camera.lookAt(cam.tx, 4, cam.tz);
}
function flyTo(id) {
  const cp = CPS.find(c => c.id === id);
  let tx, tz, r, theta, phi;
  if (!cp) {                                  // umumiy ko'rinish
    tx = OVERVIEW.tx; tz = OVERVIEW.tz; r = OVERVIEW.r; theta = -1.043; phi = 0.42;
  } else {
    const c = CAMS[id];
    tx = cp.cx; tz = cp.cz; r = c.r; theta = c.theta; phi = c.phi;
  }
  cam.txT = tx; cam.tzT = tz; cam.r = r; cam.theta = theta; cam.phi = phi;
  // kampus almashinuvi — sakrash (lerp emas)
  if (Math.hypot(tx - cam.tx, tz - cam.tz) > 400) { cam.tx = tx; cam.tz = tz; }
  applyCam();
}
applyCam();

let drag = null, moved = 0, pinch = null;
canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
  moved = 0;
});
canvas.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.x = e.clientX; drag.y = e.clientY;
  moved += Math.abs(dx) + Math.abs(dy);
  cam.theta -= dx * 0.006;
  cam.phi = Math.min(1.34, Math.max(0.3, cam.phi - dy * 0.004));
});
canvas.addEventListener('pointerup', e => {
  if (drag && e.pointerId === drag.id) {
    if (moved < 9 && performance.now() - drag.t < 420) pick(e.clientX, e.clientY);
    drag = null;
  }
});
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  cam.r = Math.min(16000, Math.max(60, cam.r * (1 + Math.sign(e.deltaY) * 0.09)));
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 2) {
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (pinch) cam.r = Math.min(16000, Math.max(60, cam.r * (pinch / d)));
    pinch = d;
  }
}, { passive: true });
canvas.addEventListener('touchend', () => { pinch = null; });

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function pick(cx, cy) {
  ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(pickables, false);
  if (hits.length) {
    let o = hits[0].object;
    while (o && !o.userData.b) o = o.parent;
    if (o) select(o.userData.b);
  } else closePanel();
}

/* ---------------------------------------------------------------- UI yordamchilar */
const $ = s => document.querySelector(s);
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e4 ? Math.round(n / 1000) + 'k' : Math.round(n).toFixed(0);
const fmtT = s => {
  s = Math.max(0, Math.ceil(s));
  if (s >= 3600) return Math.floor(s / 3600) + 's ' + Math.floor((s % 3600) / 60) + 'daq';
  return s >= 60 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : s + 's';
};
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------------------------------------------------------------- panel */
let selected = null;
function select(b) {
  selected = b;
  const r = Math.max(...b.pts.map(p => Math.hypot(p[0] - b.px, p[1] - b.pz))) + 5;
  selRing.position.set(b.px, 0.35, b.pz);
  selRing.scale.setScalar(r);
  selRing.visible = true;
  cam.txT = b.px; cam.tzT = b.pz;
  cam.r = Math.min(cam.r, Math.max(260, r * 3.4));
  if (TG && TG.HapticFeedback) TG.HapticFeedback.selectionChanged();
  renderPanel();
  $('#panel').classList.add('open');
}
function closePanel() { $('#panel').classList.remove('open'); selRing.visible = false; selected = null; }
window.__close = closePanel;

function renderPanel() {
  if (!selected) return;
  const b = selected, r = b.roleData, lvl = G.lvl[b.id];
  const isBuilding = G.build && G.build.id === b.id;
  const needM = costMablag(lvl), needB = costBilim(lvl);
  const gated = r.key !== 'hq' && lvl >= gateLvl();
  const hqReq = r.key === 'hq' ? Math.round(14 * Math.pow(1.32, lvl - 1)) : 0;
  const hqGated = r.key === 'hq' && sumLevels() < hqReq;
  const afford = G.res.mablag >= needM && G.res.bilim >= needB;
  const owner = G.owner[b.id];
  const prod = r.res === 'bilim' ? `+${prodRate(b).toFixed(1)} Bilim/s`
    : r.res === 'mablag' ? `+${(prodRate(b) * MABLAG_MULT).toFixed(1)} Mablag'/s`
      : r.res === 'energiya' ? `+${(prodRate(b) * 60).toFixed(1)} Energiya/daq` : 'Kampus yadrosi';
  const visited = !!G.visited[b.id];

  $('#panel').innerHTML = `
    <div class="p-head">
      <div class="p-icon">${r.icon}</div>
      <div>
        <div class="p-title">${r.name}</div>
        <div class="p-sub">${b.levels} qavat · ${b.area} m² · <b>${lvl}-daraja</b>${owner !== undefined ? ` · <span style="color:${FACULTIES[owner].c}">${FACULTIES[owner].n}</span>` : ''}</div>
      </div>
      <button class="p-x" onclick="window.__close()">✕</button>
    </div>
    <p class="p-desc">${r.desc || 'Kampus yadrosi — darajasi boshqa binolar chegarasini belgilaydi.'}</p>
    <div class="p-prod">${prod}</div>
    ${isBuilding ? `
      <div class="p-build">
        <div class="p-build-row"><span>Qurilish ketmoqda…</span><b id="p-timer">${fmtT((G.build.endsAt - Date.now()) / 1000)}</b></div>
        <div class="bar"><i id="p-bar" style="width:0%"></i></div>
        <button class="btn ghost" onclick="window.__speed()">⚡ Tezlashtirish — 5 Bilim / 5s</button>
      </div>` : `
      <div class="p-costs">
        <div class="${G.res.mablag >= needM ? '' : 'lack'}">💰 ${fmt(needM)}</div>
        <div class="${G.res.bilim >= needB ? '' : 'lack'}">📘 ${fmt(needB)}</div>
        <div>⏱ ${fmtT(buildTime(lvl))}</div>
      </div>
      <button class="btn ${!gated && !hqGated && afford ? '' : 'disabled'}" onclick="window.__upgrade(${b.id})">
        ${lvl >= CAP ? 'Maksimal daraja' : gated ? 'Rektorat darajasini ko\'taring' : hqGated ? `Kamida ${hqReq} umumiy daraja kerak` : 'Yangilash'}
      </button>`}
    <div class="p-row">
      <button class="btn ghost" onclick="window.__checkin(${b.id})" ${visited ? 'disabled' : ''}>
        📍 QR check-in ${visited ? '✓' : ''}
      </button>
      <button class="btn ghost" onclick="window.__claim(${b.id})">🚩 Egallash</button>
    </div>
    <div class="p-foot">Har daraja binoni <b>vertikal o'sadi</b> · Egallangan bino +15% produksiya beradi.</div>
  `;
}

window.__upgrade = function (id) {
  const b = byId(id), lvl = G.lvl[id], r = b.roleData;
  if (G.build) return toast('Prorab band — avval joriy qurilishni tugating');
  if (lvl >= CAP) return;
  if (r.key !== 'hq' && lvl >= gateLvl()) return toast('Avval Rektoratni ko\'taring');
  if (r.key === 'hq' && sumLevels() < Math.round(14 * Math.pow(1.32, lvl - 1))) return toast('Kampusda umumiy daraja yetarli emas');
  const nm = costMablag(lvl), nb = costBilim(lvl);
  if (G.res.mablag < nm || G.res.bilim < nb) return toast('Resurs yetarli emas — Bilim sinovidan o\'ting');
  G.res.mablag -= nm; G.res.bilim -= nb;
  G.build = { id, startedAt: Date.now(), endsAt: Date.now() + buildTime(lvl) * 1000, toLvl: lvl + 1 };
  if (TG && TG.HapticFeedback) TG.HapticFeedback.impactOccurred('medium');
  save(); renderPanel(); drawHud();
};

window.__speed = function () {
  if (!G.build) return;
  if (G.res.bilim < 5) return toast('5 Bilim kerak');
  G.res.bilim -= 5; G.build.endsAt -= 5000;
  save(); drawHud();
};

function finishBuild() {
  const b = byId(G.build.id);
  G.lvl[b.id] = G.build.toLvl;
  G.build = null;
  G.res.nufuz += 25;
  if (TG && TG.HapticFeedback) TG.HapticFeedback.notificationOccurred('success');
  toast(`✅ ${b.roleData.name} — ${G.lvl[b.id]}-daraja!`);
  save(); drawHud(); refreshLabel(b); if (selected) renderPanel();
}

/* ---------------------------------------------------------------- egallash usullari */
/* B) Fakultet urushi */
function seasonTick() {
  const now = Date.now();
  const week = Math.floor(now / (7 * 864e5));
  if (G.season.week !== week) { G.season.week = week; G.season.pts = [0, 0, 0, 0, 0]; }
  // raqib fakultetlar sekin o'sadi (simulyatsiya)
  if (!seasonTick.t || now - seasonTick.t > 4000) {
    seasonTick.t = now;
    for (let i = 0; i < 5; i++) {
      if (i === G.faculty) continue;
      G.season.pts[i] += Math.random() * 2.2;
    }
  }
}
function addSeasonPts(n) { G.season.pts[G.faculty] += n; }

/* C) QR check-in */
const CHECKIN_CODES = {};
function initCheckinCodes() {
  for (const cp of CPS) {
    for (const b of cp.buildings) {
      if (!b.role) continue;
      CHECKIN_CODES[(cp.id === 'main' ? 'TDIU' : 'MOLIYA') + '-' + b.role.toUpperCase()] = b.id;
    }
  }
}
initCheckinCodes();

window.__checkin = function (id) {
  $('#checkin-id').value = id;
  $('#checkin').classList.add('open');
};
$('#checkin-close').onclick = () => $('#checkin').classList.remove('open');
$('#checkin-go').onclick = () => {
  const code = ($('#checkin-code').value || '').trim().toUpperCase();
  const id = CHECKIN_CODES[code];
  if (!id) return toast('Kod topilmadi. Masalan: TDIU-HQ, TDIU-EDU, MOLIYA-HQ');
  if (G.visited[id]) return toast('Bu bino allaqachon belgilangan');
  G.visited[id] = true;
  G.res.bilim += 80; G.res.nufuz += 15; addSeasonPts(12);
  if (TG && TG.HapticFeedback) TG.HapticFeedback.notificationOccurred('success');
  toast(`📍 Check-in: ${byId(id).roleData.name} — +80 Bilim`);
  $('#checkin').classList.remove('open');
  save(); drawHud(); if (selected) renderPanel(); refreshLabel(byId(id));
};

/* A/D) Egallash */
window.__claim = function (id) {
  const b = byId(id);
  if (G.owner[id] !== undefined) return toast('Bu bino allaqachon egallangan');
  const my = G.season.pts[G.faculty];
  const best = Math.max(...G.season.pts.filter((_, i) => i !== G.faculty));
  if (my < best) return toast('Egallash uchun fakultetingiz mavsumda yetakchi bo\'lishi kerak');
  if (G.res.nufuz < 50) return toast('50 Nufuz kerak');
  G.res.nufuz -= 50;
  G.owner[id] = G.faculty;
  b.ring.material.opacity = 0.55;
  b.ring.material.color = new THREE.Color(FACULTIES[G.faculty].c);
  toast(`🚩 ${b.roleData.name} — ${FACULTIES[G.faculty].n} fakulteti nazoratida!`);
  save(); renderPanel(); refreshLabel(b); drawHud();
};

/* ---------------------------------------------------------------- HUD */
function drawHud() {
  $('#r-mablag').textContent = fmt(G.res.mablag);
  $('#r-bilim').textContent = fmt(G.res.bilim);
  $('#r-nufuz').textContent = fmt(G.res.nufuz);
  $('#r-energy').textContent = Math.floor(G.res.energiya) + '/5';
  $('#hq-lvl').textContent = hqLvl();
  $('#fac-name').textContent = FACULTIES[G.faculty].n;
  $('#fac-dot').style.background = FACULTIES[G.faculty].c;
  const b = G.build;
  $('#queue').style.display = b ? 'flex' : 'none';
  if (b) {
    $('#q-name').textContent = byId(b.id).roleData.name + ' → ' + b.toLvl + '-daraja';
    $('#q-time').textContent = fmtT((b.endsAt - Date.now()) / 1000);
    $('#q-bar').style.width = Math.min(100, ((Date.now() - b.startedAt) / (b.endsAt - b.startedAt)) * 100) + '%';
  }
  $('#campus-name').textContent = (CPS.find(c => c.id === G.campus) || {}).name || 'Umumiy';
}

/* ---------------------------------------------------------------- resurs oqimi */
let last = performance.now();
function tick(now) {
  const dt = Math.min(0.25, (now - last) / 1000); last = now;
  const rate = { bilim: 0, mablag: 0, energiya: 0 };
  for (const b of ALL_B) {
    if (!b.role || !b.roleData.res) continue;
    if (G.build && G.build.id === b.id) continue;
    const bonus = G.owner[b.id] !== undefined ? 1.15 : 1;
    rate[b.roleData.res] += prodRate(b) * bonus;
  }
  G.res.bilim += rate.bilim * dt;
  G.res.mablag += rate.mablag * dt * MABLAG_MULT;
  G.res.energiya = Math.min(5, G.res.energiya + rate.energiya * dt + dt / 25);
  seasonTick();
  if (G.build && Date.now() >= G.build.endsAt) finishBuild();
}

/* ---------------------------------------------------------------- Bilim sinovi */
const QBANK = [
  { q: "Kampusda 1200 talaba bor. 45% i 1-kursda. Nechta 1-kurs talabasi?", a: ['480', '540', '600', '420'], c: 1 },
  { q: "Bino 12 qavatli, har qavat 4 m. Umumiy balandlik?", a: ['36 m', '44 m', '48 m', '52 m'], c: 2 },
  { q: "Talaba 240 000 so'mdan 15% chegirma oldi. Qancha to'laydi?", a: ['204 000', '210 000', '196 000', '225 000'], c: 0 },
  { q: "Narx 20% oshdi, keyin 20% tushdi. Yakuniy narx dastlabkisidan:", a: ['teng', '4% arzon', '4% qimmat', '2% arzon'], c: 1 },
  { q: "3 prorab 9 kunda 1 binoni qursa, 9 prorab necha kunda?", a: ['1 kun', '3 kun', '6 kun', '9 kun'], c: 1 },
  { q: "600 talabadan 5/6 qismi sinovga kirdi. Nechtasi kirmadi?", a: ['80', '100', '120', '60'], c: 1 },
  { q: "Bino maydoni 300 m², 40% i ma'ruza zali. Zal maydoni?", a: ['90 m²', '110 m²', '120 m²', '150 m²'], c: 2 },
  { q: "Yillik 12% omonat: 5 mln so'm 1 yilda qancha daromad beradi?", a: ['500 000', '600 000', '720 000', '1 200 000'], c: 1 },
  { q: "Ketma-ketlik: 2, 6, 18, 54, ?", a: ['108', '162', '216', '126'], c: 1 },
  { q: "1 km² da 400 talaba. 0,25 km² da?", a: ['80', '100', '160', '200'], c: 1 },
  { q: "Talaba 4 fandan 3.0, 3.6, 4.2, 4.2 ball oldi. O'rtacha?", a: ['3.5', '3.75', '3.8', '4.0'], c: 1 },
  { q: "Universitet 1931-yilda tashkil etilgan. 2026-yilda necha yoshda?", a: ['90', '93', '95', '96'], c: 2 },
  { q: "Budjet 1,2 mlrd so'm, 35% i ta'mirga. Ta'mirlash budjeti?", a: ['360 mln', '420 mln', '480 mln', '300 mln'], c: 1 },
  { q: "Bir talaba 1 daqiqada 3 savol yechadi. 15 talaba 20 daqiqada?", a: ['600', '900', '1200', '450'], c: 1 },
  { q: "Kapital 800 mln, xarajat 680 mln. Foyda marjasi?", a: ['10%', '12%', '15%', '18%'], c: 2 },
  { q: "2 ta bino 6 oyda qurildi. 6 ta bino necha oyda? (bir xil sur'at)", a: ['12', '18', '24', '36'], c: 1 },
];

let QZ = null;
function startQuiz() {
  if (G.res.energiya < 1) return toast('Energiya yo\'q — gimnaziya darajasini oshiring');
  G.res.energiya -= 1;
  QZ = { i: 0, pool: [...QBANK].sort(() => Math.random() - 0.5).slice(0, 8), combo: 0, correct: 0, gainB: 0, gainM: 0 };
  $('#quiz').classList.add('open');
  nextQ(); save(); drawHud();
}
function nextQ() {
  clearInterval(QZ.timer);
  if (QZ.i >= QZ.pool.length) return endQuiz();
  const q = QZ.pool[QZ.i];
  QZ.left = 15.0;
  $('#q-count').textContent = `${QZ.i + 1}/${QZ.pool.length}`;
  $('#q-combo').textContent = QZ.combo > 1 ? `x${QZ.combo} combo` : '';
  $('#q-text').textContent = q.q;
  $('#q-opts').innerHTML = q.a.map((t, i) => `<button class="opt" data-i="${i}">${t}</button>`).join('');
  document.querySelectorAll('#q-opts .opt').forEach(el => el.onclick = () => answer(parseInt(el.dataset.i, 10)));
  QZ.timer = setInterval(() => {
    QZ.left -= 0.1;
    $('#q-timer').style.width = Math.max(0, (QZ.left / 15) * 100) + '%';
    if (QZ.left <= 0) { clearInterval(QZ.timer); answer(-1); }
  }, 100);
}
function answer(chosen) {
  clearInterval(QZ.timer);
  const q = QZ.pool[QZ.i];
  const ok = chosen === q.c;
  const speed = Math.max(0, QZ.left / 15);
  if (ok) {
    QZ.combo++; QZ.correct++;
    QZ.gainB += Math.round(12 * (1 + speed) * Math.min(4, QZ.combo));
    QZ.gainM += Math.round(20 * (1 + speed) * Math.min(4, QZ.combo));
    if (TG && TG.HapticFeedback) TG.HapticFeedback.impactOccurred('light');
  } else QZ.combo = 0;
  document.querySelectorAll('#q-opts .opt').forEach(el => {
    const i = parseInt(el.dataset.i, 10);
    if (i === q.c) el.classList.add('good'); else if (i === chosen) el.classList.add('bad');
    el.disabled = true;
  });
  setTimeout(() => { QZ.i++; nextQ(); }, 600);
}
function endQuiz() {
  G.res.bilim += QZ.gainB; G.res.mablag += QZ.gainM; G.res.nufuz += QZ.correct * 4;
  addSeasonPts(QZ.correct * 3);
  G.quizBest = Math.max(G.quizBest, QZ.correct);
  $('#quiz').classList.remove('open');
  toast(`📘 +${QZ.gainB} · 💰 +${QZ.gainM} · ${QZ.correct}/${QZ.pool.length} to'g'ri`);
  save(); drawHud();
}
$('#quiz-close').onclick = () => { $('#quiz').classList.remove('open'); clearInterval(QZ && QZ.timer); };

/* ---------------------------------------------------------------- Darvoza (1v1 duel) */
let DUEL = null;
function startDuel() {
  if (G.res.energiya < 1) return toast('Energiya yo\'q');
  G.res.energiya -= 1;
  const opp = (G.faculty + 1 + Math.floor(Math.random() * 4)) % 5;
  DUEL = {
    hpP: 100, hpO: 100, i: 0, opp, oppName: FACULTIES[opp].n + ' fakulteti',
    pool: [...QBANK].sort(() => Math.random() - 0.5).slice(0, 6),
    acc: 0.55 + Math.random() * 0.25, dmg: 0, correct: 0,
  };
  $('#duel').classList.add('open');
  duelQ(); save(); drawHud();
}
function duelQ() {
  clearInterval(DUEL.timer);
  if (DUEL.i >= DUEL.pool.length || DUEL.hpP <= 0 || DUEL.hpO <= 0) return duelEnd();
  const q = DUEL.pool[DUEL.i];
  $('#d-hp-p').style.width = DUEL.hpP + '%';
  $('#d-hp-o').style.width = DUEL.hpO + '%';
  $('#d-hp-pv').textContent = Math.max(0, Math.round(DUEL.hpP));
  $('#d-hp-ov').textContent = Math.max(0, Math.round(DUEL.hpO));
  $('#d-n').textContent = `${DUEL.i + 1}/${DUEL.pool.length}`;
  $('#d-opp').textContent = DUEL.oppName;
  $('#d-text').textContent = q.q;
  $('#d-opts').innerHTML = q.a.map((t, i) => `<button class="opt" data-i="${i}">${t}</button>`).join('');
  DUEL.t0 = performance.now();
  document.querySelectorAll('#d-opts .opt').forEach(el => el.onclick = () => duelAnswer(parseInt(el.dataset.i, 10)));
  // raqib javobi
  DUEL.botAt = 3000 + Math.random() * 8000;
  DUEL.botTimer = setTimeout(() => {
    if (!DUEL) return;
    const ok = Math.random() < DUEL.acc;
    if (ok) DUEL.hpP -= 14;
    $('#d-hp-p').style.width = Math.max(0, DUEL.hpP) + '%';
    $('#d-hp-pv').textContent = Math.max(0, Math.round(DUEL.hpP));
    $('#d-log').textContent = ok ? '⚔️ Raqib to\'g\'ri javob berdi — 14 zarar!' : '🛡 Raqib xato qildi';
    if (DUEL.hpP <= 0) { clearInterval(DUEL.timer); setTimeout(duelEnd, 500); }
  }, DUEL.botAt);
}
function duelAnswer(i) {
  const q = DUEL.pool[DUEL.i];
  const ok = i === q.c;
  const speed = Math.max(0, 1 - (performance.now() - DUEL.t0) / 12000);
  document.querySelectorAll('#d-opts .opt').forEach(el => {
    const k = parseInt(el.dataset.i, 10);
    if (k === q.c) el.classList.add('good'); else if (k === i) el.classList.add('bad');
    el.disabled = true;
  });
  if (ok) {
    DUEL.correct++;
    const dmg = Math.round(10 + speed * 14);
    DUEL.hpO -= dmg;
    $('#d-hp-o').style.width = Math.max(0, DUEL.hpO) + '%';
    $('#d-hp-ov').textContent = Math.max(0, Math.round(DUEL.hpO));
    $('#d-log').textContent = `✅ To'g'ri! −${dmg} raqibga`;
    if (TG && TG.HapticFeedback) TG.HapticFeedback.impactOccurred('medium');
  } else {
    DUEL.hpP -= 8;
    $('#d-hp-p').style.width = Math.max(0, DUEL.hpP) + '%';
    $('#d-hp-pv').textContent = Math.max(0, Math.round(DUEL.hpP));
    $('#d-log').textContent = '❌ Xato — 8 zarar sizga';
  }
  clearTimeout(DUEL.botTimer);
  setTimeout(() => { DUEL.i++; duelQ(); }, 800);
}
function duelEnd() {
  clearTimeout(DUEL && DUEL.botTimer); clearInterval(DUEL && DUEL.timer);
  const win = DUEL.hpO <= 0 && DUEL.hpP > 0;
  const draw = DUEL.hpO > 0 && DUEL.hpP > 0;
  if (win) { G.duelWin++; G.res.nufuz += 60; G.res.bilim += 60; addSeasonPts(25); toast('🏆 G\'alaba! +60 Nufuz, +25 mavsum ball'); }
  else if (draw) { G.res.bilim += 25; addSeasonPts(8); toast('🤝 Durang — +25 Bilim'); }
  else { G.duelLose++; addSeasonPts(4); toast('💀 Mag\'lubiyat — keyingi safar!'); }
  $('#duel').classList.remove('open');
  save(); drawHud();
}
$('#duel-close').onclick = () => { clearTimeout(DUEL && DUEL.botTimer); $('#duel').classList.remove('open'); };

/* ---------------------------------------------------------------- Mavsum */
function renderSeason() {
  const max = Math.max(1, ...G.season.pts);
  const rows = FACULTIES.map((f, i) => {
    const mine = i === G.faculty;
    return `<button class="season-row ${mine ? 'me' : ''}" onclick="window.__setFaculty(${i})">
      <span class="dot" style="background:${f.c}"></span>
      <b>${f.n}${mine ? ' (siz)' : ''}</b>
      <span class="pts">⭐ ${fmt(G.season.pts[i])}</span>
      <i class="bar-mini"><u style="width:${(G.season.pts[i] / max) * 100}%;background:${f.c}"></u></i>
    </button>`;
  }).join('');
  const owned = ALL_B.filter(b => G.owner[b.id] !== undefined).length;
  const ctrl = ALL_B.filter(b => b.role).map(b => {
    const o = G.owner[b.id];
    return `<div class="ctrl-row">
      <span class="c-dot" style="background:${o !== undefined ? FACULTIES[o].c : 'rgba(255,255,255,.18)'}"></span>
      <b>${b.roleData.name}</b>
      <span class="c-lvl">L${G.lvl[b.id]}</span>
      <button class="btn ghost c-btn" onclick="window.__claim(${b.id})">${o !== undefined ? '✓' : 'Egallash'}</button>
    </div>`;
  }).join('');
  $('#season-list').innerHTML = rows + `
    <div class="ctrl-h">Nazorat ro'yxati (${ALL_B.filter(b => b.role).length} bino)</div>
    ${ctrl}
  ` + `
    <div class="season-note">
      Haftalik mavsum · egallangan binolar: <b>${owned}</b> · g'alabalar: ${G.duelWin} · mag'lubiyatlar: ${G.duelLose}
      <br>Yetakchi fakultet bino egallay oladi (50 Nufuz). Boshqa fakultetni tanlash uchun bosing.
    </div>`;
}
window.__setFaculty = function (i) { G.faculty = i; save(); renderSeason(); drawHud(); toast('Fakultet: ' + FACULTIES[i].n); };

/* ---------------------------------------------------------------- nav */
document.querySelectorAll('.nav button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const v = btn.dataset.v;
    if (v === 'map') { closePanel(); $('#campus').classList.add('open'); }
    if (v === 'quiz') startQuiz();
    if (v === 'duel') startDuel();
    if (v === 'season') { renderSeason(); $('#season').classList.add('open'); }
  };
});
$('#season-close').onclick = () => $('#season').classList.remove('open');
$('#campus-close').onclick = () => $('#campus').classList.remove('open');
document.querySelectorAll('.campus-card').forEach(el => {
  el.onclick = () => {
    const id = el.dataset.id;
    G.campus = id; save();
    flyTo(id); closePanel(); drawHud();
    $('#campus').classList.remove('open');
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('on'));
    document.querySelector('.nav button[data-v="map"]').classList.add('on');
    toast('📍 ' + (id === 'all' ? 'Umumiy ko\'rinish' : CPS.find(c => c.id === id).name));
  };
});

/* ---------------------------------------------------------------- loop */
let t = 0;
function loop(now) {
  requestAnimationFrame(loop);
  tick(now);
  t += 0.016;
  applyCam();
  if (selRing.visible) selRing.material.opacity = 0.5 + 0.35 * Math.sin(t * 3);

  for (const b of ALL_B) {
    if (!b.role) continue;
    const grp = roleMeshes.get(b.id);
    if (!grp) continue;
    let lvl = G.lvl[b.id];
    if (G.build && G.build.id === b.id) {
      const p = Math.min(1, (Date.now() - G.build.startedAt) / (G.build.endsAt - G.build.startedAt));
      lvl = G.lvl[b.id] + p * 0.999;
    }
    const target = 0.45 + 0.55 * Math.pow(Math.min(1.2, lvl / Math.max(1, b.levels)), 0.7);
    grp.scale.y += (target - grp.scale.y) * 0.08;
  }
  /* kampus nomi — faqat uzoqdan */
  for (const cp of CPS) {
    if (!cp.bigLabel) continue;
    cp.bigLabel.visible = cam.r > 620;
    if (cp.bigLabel.visible) {
      const d = camera.position.distanceTo(cp.bigLabel.position);
      const w = Math.min(520, Math.max(70, d * 0.075));
      cp.bigLabel.scale.set(w, w * 0.25, 1);
    }
    if (cp.disc) cp.disc.material.opacity = cam.r > 1500 ? 0.20 : 0.13;
  }

  /* tuman nomlari — ekranda doimiy o'lcham */
  for (const sp of DIST_LABELS) {
    const d = camera.position.distanceTo(sp.position);
    sp.visible = cam.r > 1400;
    const w = Math.min(1500, Math.max(260, d * 0.085));
    sp.scale.set(w, w * 0.25, 1);
  }

  const far = cam.r > 2200;
  for (const L of labels) {
    L.sp.visible = !far;
    const grp = roleMeshes.get(L.b.id);
    if (!grp) continue;
    L.sp.position.y += (Math.max(L.b.h * grp.scale.y + 9, 13) - L.sp.position.y) * 0.12;
    const d = camera.position.distanceTo(L.sp.position);
    const w = Math.min(180, Math.max(14, d * 0.058));
    L.sp.scale.set(w, w / L.sp.userData.aspect, 1);
  }
  /* egalik halqalari pulsatsiyasi */
  for (const b of ALL_B) {
    if (b.role && b.ring && G.owner[b.id] !== undefined) {
      b.ring.material.opacity = 0.35 + 0.2 * Math.sin(t * 2 + b.px);
    }
  }
  /* uzoqdan: barcha chunk'lar o'rniga bitta birlashtirilgan tom to'plami (10x tez) */
  const farMode = cam.r > 2600;
  if (farMode !== loop._farMode) {
    loop._farMode = farMode;
    for (const m of districtMeshes) m.visible = !farMode;
    if (farCityMesh) farCityMesh.visible = farMode;
    if (farTallMesh) farTallMesh.visible = farMode;
  }
  drawHud();
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});

setInterval(() => {
  if (selected && G.build && G.build.id === selected.id) {
    const el = document.getElementById('p-timer'), bar = document.getElementById('p-bar');
    if (el) el.textContent = fmtT((G.build.endsAt - Date.now()) / 1000);
    if (bar) bar.style.width = Math.min(100, ((Date.now() - G.build.startedAt) / (G.build.endsAt - G.build.startedAt)) * 100) + '%';
  }
}, 200);

drawHud();
setTimeout(() => {
  const nm = TG_USER && TG_USER.first_name ? `${TG_USER.first_name}, x` : 'X';
  toast(`${nm}ush kelibsiz! Binoni bosing → Yangilash · 📍 check-in · 🚩 egallash`);
}, 900);

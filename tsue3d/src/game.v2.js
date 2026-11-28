/* =====================================================================
   KAMPUS: TDIU — v0.2 "Digital Twin"
   • 2 kampus (Asosiy + Moliya), haqiqiy OSM geometriyasi
   • protsedural fasad teksturalari (deraza toʻrlari), landmark minora
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


/* ---------------------------------------------------------------- SVG ikonlar (emoji oʻrniga) */
const ICON_PATHS = {
  banknote: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M5.6 9.6h.01M18.4 14.4h.01"/>',
  book: '<path d="M2 5.4A2.4 2.4 0 0 1 4.4 3H11v15.2H4.4A2.4 2.4 0 0 0 2 20.6z"/><path d="M22 5.4A2.4 2.4 0 0 0 19.6 3H13v15.2h6.6A2.4 2.4 0 0 1 22 20.6z"/>',
  star: '<path d="M12 3l2.7 5.5 6 .9-4.35 4.2 1.05 6L12 16.9 6.6 19.6l1.05-6L3.3 9.4l6-.9z"/>',
  zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
  landmark: '<path d="M3 9.5L12 4l9 5.5"/><path d="M4 10h16"/><path d="M6 10v8M10.2 10v8M13.8 10v8M18 10v8"/><path d="M3 21h18"/>',
  pin: '<path d="M12 21s-7-5.4-7-11a7 7 0 0 1 14 0c0 5.6-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  map: '<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4L1 6z"/><path d="M8 2v16M16 6v16"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  trophy: '<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6.2H4.6a1.4 1.4 0 0 0 1.4 4.3H7M17 6.2h2.4a1.4 1.4 0 0 1-1.4 4.3H17"/>',
  cap: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14 2.5 9.5z"/><path d="M6.6 11.3V16c0 1.4 2.4 2.6 5.4 2.6s5.4-1.2 5.4-2.6v-4.7"/><path d="M21.5 9.5V15"/>',
  bulb: '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.9.7 1.6 1.5 1.6 2.7h4c0-1.2.7-2 1.6-2.7A6 6 0 0 0 12 3z"/>',
  flag: '<path d="M5 21V4"/><path d="M5 5h13l-2.5 4L18 13H5"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a13.6 13.6 0 0 1 3.5 9A13.6 13.6 0 0 1 12 21a13.6 13.6 0 0 1-3.5-9A13.6 13.6 0 0 1 12 3z"/>',
};
const ic = (n, s) => `<svg class="ic" viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[n] || ''}</svg>`;

/* ---------------------------------------------------------------- rollar */
const ROLE_DEF = {
  hq:         { icon: 'landmark', res: null,        base: 0,    name: 'Rektorat' },
  edu:        { icon: 'book', res: 'bilim',     base: 1.4,  name: "Oʻquv korpusi",       desc: "Maʻruza zallari — Bilim ishlab chiqaradi." },
  money:      { icon: 'banknote', res: 'mablag',    base: 2.6,  name: "Tijorat korpusi",     desc: "Kontrakt va tijorat — Mablag' ishlab chiqaradi." },
  flow:       { icon: 'cap', res: 'bilim',     base: 0.9,  name: "Akademik litsey",     desc: "Abituriyentlar oqimi — Bilim + Nufuz." },
  energy:     { icon: 'zap', res: 'energiya',  base: 0.05, name: "Gimnaziya",           desc: "Energiya (sinov urinishlari) tiklaydi." },
  innovation: { icon: 'bulb', res: 'mablag',    base: 1.6,  name: "Innovatsiya markazi", desc: "Startap laboratoriyalar — Mablag' + Bilim." },
};
/* kampus boʻyicha chiroyli nomlar */
const ROLE_NAME = {
  main: {
    hq: 'TDIU bosh binosi', edu: "1-oʻquv korpusi", money: '2-o\'quv korpusi',
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
  faculty: 0,                  // oʻyinchi fakulteti
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
  g.addColorStop(0, '#1c4e7e'); g.addColorStop(0.42, '#3f74a3'); g.addColorStop(0.78, '#8fb3cd'); g.addColorStop(1, '#d9e6ee');
  cx.fillStyle = g; cx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex;
})();

scene.fog = new THREE.Fog(0xa9bfcd, 900, 9000);

const hemi = new THREE.HemisphereLight(0xeaf4ff, 0x596b58, 1.35);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff3da, 2.15);
sun.position.set(-260, 420, 220);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xbdd8ee, 0.55);
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

/* fasad: 3 xil uslub. Bitta boʻlak = 1 oyna moduli (3.0 x 3.4 m) */
function facadeTexture(style) {
  const S = 128;
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d');
  const wall = style === 'glass' ? '#dfe6ec' : style === 'classic' ? '#f2ece1' : '#e9e7e2';
  c.fillStyle = wall; c.fillRect(0, 0, S, S);
  // gʻisht/panel boʻg'inlari
  c.strokeStyle = 'rgba(0,0,0,0.07)'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(0, S - 1); c.lineTo(S, S - 1); c.stroke();

  if (style === 'glass') {
    // vertikal oyna chizigʻi
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

/* ---------------------------------------------------------------- geometriya yigʻuvchi */
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

/** Poligonni ekstruziya qiladi va builderʻga qoʻshadi. */
function extrudeInto(sb, rb, pts, h, base, color, style) {
  const n = pts.length;
  let cx = 0, cz = 0;
  for (const p of pts) { cx += p[0]; cz += p[1]; }
  cx /= n; cz /= n;
  const col = [color.r, color.g, color.b];
  const rcol = [color.r * 0.72 + 0.13, color.g * 0.72 + 0.13, color.b * 0.72 + 0.13];

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
    const ids = ord.map(i => rb.vert(P[i], up, P[i][0] / 6, P[i][2] / 6, rcol));
    rb.tri(ids[0], ids[1], ids[2]);
  }
}

/* binoning toʻliq geometriyasi (devor + tom) */
function buildingMeshes(b) {
  const sb = new Builder(), rb = new Builder();
  const color = new THREE.Color(b.color);
  if (b.landmark && b.landmark.tower) {
    const lm = b.landmark;
    const podH = (lm.podiumFloors || 3) * 3.4;
    extrudeInto(sb, rb, b.pts, podH, 0, color, 'classic');
    // minora: markazga nisbatan toʻrtburchak
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
const ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ map: TEX.grass, color: 0x9aa687 }));
ground.position.y = -0.8;
scene.add(ground);

/* yoʻllar va maydonlar — kampus boʻyicha yigʻiladi */
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

/* bir nechta BufferGeometryʻni bitta geometriyaga qoʻshish */
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

  /* yoʻllar */
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
    b.wallsMesh = wm; b.roofMesh = rm;
    grp.userData.b = b;
    g.add(grp);
    pickables.push(wm, rm);
    roleMeshes.set(b.id, grp);

    // kontur chizigʻi
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(walls, 25),
      new THREE.LineBasicMaterial({ color: 0x7fd7ff, transparent: true, opacity: 0.18 })
    );
    b.edgesMesh = edges;
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


/* shahar toʻldiruvchisi olib tashlandi — v0.3 da haqiqiy OSM binolari */


/* tuman boʻyicha binolar palitrasi (haqiqiy shaharga yaqin) */
const DIST_STYLE = {
  chilonzor:     { h: 0.075, s: 0.13, l: 0.66 },   // bej panel
  yunusobod:     { h: 0.083, s: 0.11, l: 0.70 },   // och bej
  olmazor:       { h: 0.575, s: 0.055, l: 0.62 },  // kulrang-koʻk panel
  uchtepa:       { h: 0.095, s: 0.15, l: 0.66 },   // qaymoq
  mirzo_ulugbek: { h: 0.110, s: 0.10, l: 0.72 },   // oq
  mirobod:       { h: 0.048, s: 0.28, l: 0.52 },   // gʻisht-qizil
  shayxontohur:  { h: 0.070, s: 0.30, l: 0.58 },   // loy-toza eski shahar
  sergeli:       { h: 0.090, s: 0.07, l: 0.71 },   // och kulrang panel
  bektemir:      { h: 0.555, s: 0.045, l: 0.48 },  // sanoat kulrangi
  yashnobod:     { h: 0.080, s: 0.12, l: 0.63 },   // issiq bej
  yakkasaroy:    { h: 0.540, s: 0.11, l: 0.66 },   // koʻk-kulrang, zamonaviy
  yangihayot:    { h: 0.100, s: 0.08, l: 0.74 },   // yangi oq binolar
  _default:      { h: 0.085, s: 0.09, l: 0.66 },
};
const fract = x => x - Math.floor(x);

/* ---------------------------------------------------------------- TUMANLAR (Chilonzor + Yunusobod)
   Haqiqiy OSM binolari: base64 -> Int16 delta -> uchastkalar (chunk) boʻyicha merge. */
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
      const gm = new THREE.Mesh(gGeom, new THREE.MeshLambertMaterial({ color: 0x67706e }));
      gm.position.y = -0.25;
      world.add(gm);
      // chegara chizigʻi
      const pts = d.ring.map(([x, z]) => new THREE.Vector3(x, 0.15, z));
      const lg = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.LineLoop(lg, new THREE.LineBasicMaterial({ color: 0x5ea8c9, transparent: true, opacity: 0.5 }));
      world.add(line);

      /* tuman nomi (uzoqdan koʻrinadi) */
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


    /* uchastkalar: 950 m toʻr — stil boʻyicha 3 chelak, yuz -> bino xaritasi bilan */
    const CHUNK = 950;
    const cells = new Map();
    const campCenters = [[0, 0], [2857, -1668]];
    const STYLES = ['panel', 'classic', 'glass'];
    for (const b of blds) {
      let skip = false;
      for (const cc of campCenters) if (Math.hypot(b.cx - cc[0], b.cz - cc[1]) < 430) skip = true;
      if (skip) continue;
      const DS = DIST_STYLE[key] || DIST_STYLE._default;
      const hsh = fract(Math.sin(b.cx * 12.9898 + b.cz * 78.233) * 43758.5453);
      const hsh2 = fract(Math.sin(b.cx * 39.3468 + b.cz * 11.135) * 24634.6345);
      const t = Math.min(1, Math.max(0, (b.h - 3) / 46));
      const col = new THREE.Color().setHSL(
        DS.h + (hsh - 0.5) * 0.035,
        DS.s + (hsh - 0.5) * 0.05,
        Math.min(0.82, Math.max(0.34, DS.l + (hsh - 0.5) * 0.075 - t * 0.05))
      );
      const style = (b.h >= 20 && hsh > 0.88) ? 'glass' : (hsh > 0.87 ? 'classic' : 'panel');
      const k = Math.floor(b.cx / CHUNK) + ':' + Math.floor(b.cz / CHUNK);
      let cell = cells.get(k);
      if (!cell) {
        cell = { blds: [], panel: null, classic: null, glass: null };
        for (const s of STYLES) cell[s] = { sb: new Builder(), rb: new Builder(), infos: [] };
        cells.set(k, cell);
      }
      const c = cell[style];
      const w0 = c.sb.idx.length / 3, r0 = c.rb.idx.length / 3;
      const bIdx = cell.blds.length;
      cell.blds.push({ cx: b.cx, cz: b.cz, h: b.h, key, hsh, style });
      extrudeInto(c.sb, c.rb, b.pts, b.h, 0, col, style);
      /* tom ustidagi texnika bloki (lift/ventilyatsiya shoxobchasi) */
      if (b.h >= 11 && hsh2 > 0.52) {
        const bw = 2.6 + hsh2 * 3.2;
        const bx = b.cx + (hsh - 0.5) * 5.5, bz = b.cz + (hsh2 - 0.5) * 5.5;
        const grey = new THREE.Color(0x7d838b);
        extrudeInto(c.sb, c.rb,
          [[bx - bw, bz - bw * 0.7], [bx + bw, bz - bw * 0.7], [bx + bw, bz + bw * 0.7], [bx - bw, bz + bw * 0.7]],
          1.8, b.h, grey, 'panel');
      }
      c.infos.push({ w0, w1: c.sb.idx.length / 3, r0, r1: c.rb.idx.length / 3, b: bIdx });
      if (b.h >= 14) {
        if (!window.__farTall) window.__farTall = new Builder();
        extrudeInto(window.__farTall, window.__farTall, b.pts, b.h, 0, col, 'panel');
      }
    }
    for (const cell of cells.values()) {
      if (!window.__farRoof) window.__farRoof = new Builder();
      for (const style of STYLES) {
        const c = cell[style];
        if (!c.sb.idx.length && !c.rb.idx.length) continue;
        const fr = window.__farRoof;
        const off = fr.pos.length / 3;
        for (let i = 0; i < c.rb.pos.length; i++) fr.pos.push(c.rb.pos[i]);
        for (let i = 0; i < c.rb.nor.length; i++) fr.nor.push(c.rb.nor[i]);
        for (let i = 0; i < c.rb.uv.length; i++) fr.uv.push(c.rb.uv[i]);
        for (let i = 0; i < c.rb.col.length; i++) fr.col.push(c.rb.col[i]);
        for (let i = 0; i < c.rb.idx.length; i++) fr.idx.push(c.rb.idx[i] + off);

        if (c.sb.idx.length) {
          const wg = builderToGeometry({ pos: c.sb.pos, nor: c.sb.nor, uv: c.sb.uv, col: c.sb.col, idx: c.sb.idx });
          const wm = new THREE.Mesh(wg, matForStyle(style));
          wm.userData.kind = 'walls';
          wm.userData.blds = cell.blds;
          wm.userData.faceMap = c.infos.filter(r => r.w1 > r.w0).map(r => ({ a: r.w0, b: r.w1, bIdx: r.b }));
          world.add(wm); districtMeshes.push(wm);
        }
        if (c.rb.idx.length) {
          const rg = builderToGeometry({ pos: c.rb.pos, nor: c.rb.nor, uv: c.rb.uv, col: c.rb.col, idx: c.rb.idx });
          const rm = new THREE.Mesh(rg, cityRoofMat);
          rm.userData.kind = 'roof';
          rm.userData.blds = cell.blds;
          rm.userData.faceMap = c.infos.filter(r => r.r1 > r.r0).map(r => ({ a: r.r0, b: r.r1, bIdx: r.b }));
          world.add(rm); districtMeshes.push(rm);
        }
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

/* butun shahar boʻyicha avtomatik "umumiy koʻrinish" ramkasi */
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


/* ---------------------------------------------------------------- tuman koʻchalari */
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

/* ---------------------------------------------------------------- Shahar ekstralari: bogʻlar, daraxtlar, landmarklar */
const EXTRA = (window.DISTRICTS && window.DISTRICTS.landmarks) ? window.DISTRICTS : null;

/* bogʻlar — yashil ellipsisli maydon */
if (EXTRA && Array.isArray(EXTRA.parks)) {
  for (const p of EXTRA.parks) {
    const g = new THREE.CircleGeometry(1, 40);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0x55855a }));
    m.scale.set(p.rx, 1, p.rz);
    m.rotation.y = p.rot || 0;
    m.position.set(p.x, 0.055, p.z);
    world.add(m);
  }
}

/* protsedural tumanlardagi daraxtlar (instanced) */
if (EXTRA && Array.isArray(EXTRA.trees) && EXTRA.trees.length) {
  const T = EXTRA.trees;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.52, 3.6, 5), new THREE.MeshLambertMaterial({ color: 0x4a3826 }), T.length);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.9, 0), new THREE.MeshLambertMaterial({ color: 0x3e7443 }), T.length);
  const crown2 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.0, 0), new THREE.MeshLambertMaterial({ color: 0x527f3f }), T.length);
  const d = new THREE.Object3D();
  for (let i = 0; i < T.length; i++) {
    const [x, z, s] = T[i];
    d.rotation.set(0, (i * 2.399) % 6.283, 0);
    d.scale.setScalar(s);
    d.position.set(x, 1.8 * s, z); d.updateMatrix(); trunk.setMatrixAt(i, d.matrix);
    d.position.set(x, 4.3 * s, z); d.updateMatrix(); crown.setMatrixAt(i, d.matrix);
    d.position.set(x + 0.8 * s, 5.6 * s, z + 0.4 * s); d.updateMatrix(); crown2.setMatrixAt(i, d.matrix);
  }
  trunk.instanceMatrix.needsUpdate = crown.instanceMatrix.needsUpdate = crown2.instanceMatrix.needsUpdate = true;
  world.add(trunk, crown, crown2);
}

/* landmark modellari */
const landmarkAnims = [];
function makeLandmarkLabel(text, sub) {
  const cv = document.createElement('canvas'); cv.width = 640; cv.height = 176;
  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(7,13,23,0.82)';
  c.beginPath();
  if (c.roundRect) c.roundRect(6, 6, 628, 164, 30); else c.rect(6, 6, 628, 164);
  c.fill();
  c.strokeStyle = 'rgba(255,214,130,0.9)'; c.lineWidth = 5;
  c.beginPath();
  if (c.roundRect) c.roundRect(6, 6, 628, 164, 30); else c.rect(6, 6, 628, 164);
  c.stroke();
  c.textAlign = 'center';
  c.fillStyle = '#ffe9b0';
  c.font = '800 52px system-ui, sans-serif';
  c.fillText(text.toUpperCase(), 320, 74);
  c.fillStyle = '#cfe3f2';
  c.font = '600 30px system-ui, sans-serif';
  c.fillText(sub || '', 320, 126);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false }));
  sp.renderOrder = 12;
  return sp;
}
const lamGroup = new THREE.Group();
world.add(lamGroup);
if (EXTRA && Array.isArray(EXTRA.landmarks)) {
  for (const lm of EXTRA.landmarks) {
    const g = new THREE.Group();
    g.position.set(lm.x, 0, lm.z);
    if (lm.id === 'tashkent_city') buildTashkentCity(g);
    else if (lm.id === 'humo_arena') buildHumoArena(g);
    else if (lm.id === 'magic_city') buildMagicCity(g);
    else if (lm.id === 'ice_city') buildIceCity(g);
    lamGroup.add(g);
    const sp = makeLandmarkLabel(lm.name, lm.sub);
    const ly = lm.id === 'tashkent_city' ? lm.h * 0.62 + 30 : lm.h + 24;
    sp.position.set(0, ly, 0);
    sp.userData.world = { x: lm.x, y: ly, z: lm.z };
    g.add(sp);
    labels.push({ b: null, sp, landmark: true });
  }
}
function glassMat(color, emissive) {
  return new THREE.MeshPhongMaterial({ color, emissive: emissive || 0x11303e, specular: 0xbfe8ff, shininess: 64 });
}
function buildTashkentCity(g) {
  // Nest One — 266 m, pogʻonali art-deco minora
  const glass = glassMat(0x89b4c9, 0x16303c);
  const podium = new THREE.Mesh(new THREE.BoxGeometry(96, 13, 78), new THREE.MeshLambertMaterial({ color: 0xc9cfd6 }));
  podium.position.y = 6.5; g.add(podium);
  const podiumGlass = new THREE.Mesh(new THREE.BoxGeometry(97, 4.5, 79), glassMat(0x5d8398, 0x0e222c));
  podiumGlass.position.y = 9.2; g.add(podiumGlass);
  const t1 = new THREE.Mesh(new THREE.BoxGeometry(46, 132, 34), glass);
  t1.position.y = 13 + 66; g.add(t1);
  const t2 = new THREE.Mesh(new THREE.BoxGeometry(34, 74, 27), glass);
  t2.position.y = 13 + 132 + 37; g.add(t2);
  const t3 = new THREE.Mesh(new THREE.BoxGeometry(23, 26, 19), glass);
  t3.position.y = 13 + 132 + 74 + 13; g.add(t3);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(5, 11, 14, 4), new THREE.MeshPhongMaterial({ color: 0xd8c98a, emissive: 0x6b5a1e, shininess: 90 }));
  crown.rotation.y = Math.PI / 4;
  crown.position.y = 13 + 132 + 74 + 26 + 6; g.add(crown);
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 26, 6), new THREE.MeshLambertMaterial({ color: 0xe8edf2 }));
  spire.position.y = crown.position.y + 18; g.add(spire);
  // atrofdagi ikki minora (Tashkent City kompleksi)
  const side1 = new THREE.Mesh(new THREE.BoxGeometry(30, 96, 24), glassMat(0xa8c4d4, 0x142a34));
  side1.position.set(64, 48 + 6, -34); g.add(side1);
  const side2 = new THREE.Mesh(new THREE.BoxGeometry(26, 74, 22), glassMat(0x9db8c8, 0x122630));
  side2.position.set(-58, 37 + 6, 42); g.add(side2);
}
function buildHumoArena(g) {
  // Muz saroyi: elliptik gumbazli ovoz, oq marmar + koʻk halqa
  const base = new THREE.Mesh(new THREE.CylinderGeometry(58, 62, 9, 40), new THREE.MeshLambertMaterial({ color: 0xdfe3e8 }));
  base.scale.set(1.18, 1, 0.88); base.position.y = 4.5; g.add(base);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(54, 40, 22, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshPhongMaterial({ color: 0xf2f6fa, specular: 0xffffff, shininess: 38 }));
  dome.scale.set(1.18, 0.62, 0.88); dome.position.y = 8.6; g.add(dome);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(54.5, 1.5, 8, 60),
    new THREE.MeshBasicMaterial({ color: 0x37b6ff }));
  ring.rotation.x = Math.PI / 2; ring.scale.set(1.18, 0.88, 1); ring.position.y = 12.2; g.add(ring);
  const roof = new THREE.Mesh(new THREE.CircleGeometry(30, 30), new THREE.MeshPhongMaterial({ color: 0xe8edf4, shininess: 60 }));
  roof.rotation.x = -Math.PI / 2; roof.scale.set(1.18, 1, 0.88); roof.position.y = 8.6 + 54 * 0.62 - 0.4; g.add(roof);
  // HUMO yozuvi (kanvas) ikki tomonlama
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(10,20,34,0.0)'; c.fillRect(0, 0, 512, 128);
  c.font = '900 84px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = '#0d5f8f'; c.fillText('HUMO', 256, 66);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  for (const rot of [0, Math.PI]) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(52, 13),
      new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide }));
    sign.position.set(Math.sin(rot) * 61, 7.4, Math.cos(rot) * 46.5);
    sign.rotation.y = rot;
    g.add(sign);
  }
  // kirish soyaboni
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(34, 2.2, 14), new THREE.MeshLambertMaterial({ color: 0x164a6e }));
  canopy.position.set(0, 7.2, 60); g.add(canopy);
}
function buildMagicCity(g) {
  // Ertak qasri + charxpalak — koʻngilochar majmua
  const castle = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(19, 21, 15, 10), new THREE.MeshLambertMaterial({ color: 0xf3d9e2 }));
  wall.position.y = 7.5; castle.add(wall);
  const gate = new THREE.Mesh(new THREE.BoxGeometry(9, 9.5, 4), new THREE.MeshLambertMaterial({ color: 0xb04a6a }));
  gate.position.set(0, 4.75, 19.5); castle.add(gate);
  const towerOffsets = [[0, 0, 14, 26], [15.5, 7, 6.4, 20], [-15.5, 7, 6.4, 20], [9, -12, 6.4, 17], [-9, -12, 6.4, 17]];
  for (const [tx, tz, r, h] of towerOffsets) {
    const tw = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.12, h, 9), new THREE.MeshLambertMaterial({ color: 0xf6e3ea }));
    tw.position.set(tx, h / 2 + 6, tz); castle.add(tw);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 1.22, r * 2.6, 9), new THREE.MeshLambertMaterial({ color: 0xc65b82 }));
    cone.position.set(tx, h + 6 + r * 1.3, tz); castle.add(cone);
    const flag = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 5.4, 5), new THREE.MeshLambertMaterial({ color: 0x8a6d3b }));
    flag.position.set(tx, h + 6 + r * 2.6 + 2.4, tz); castle.add(flag);
  }
  castle.position.set(-30, 0, -8);
  g.add(castle);
  // Charxpalak
  const wheel = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(23, 1.7, 10, 44), new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x442044, shininess: 40 }));
  wheel.add(rim);
  const rim2 = new THREE.Mesh(new THREE.TorusGeometry(15, 1.2, 8, 40), new THREE.MeshLambertMaterial({ color: 0xffd166 }));
  wheel.add(rim2);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.9, 46, 0.9), new THREE.MeshLambertMaterial({ color: 0xfff3f7 }));
    spoke.rotation.z = a;
    wheel.add(spoke);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.6, 2.6),
      new THREE.MeshLambertMaterial({ color: [0xff8fa3, 0xffd166, 0x8ee6a8, 0x7fd7ff, 0xc3a6ff][i % 5] }));
    cab.position.set(Math.sin(a) * 23, Math.cos(a) * 23, 0);
    wheel.add(cab);
  }
  wheel.position.set(30, 25.5, 6);
  g.add(wheel);
  landmarkAnims.push({ obj: wheel, axis: 'z', speed: 0.16 });
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(2.6, 27, 2.6), new THREE.MeshLambertMaterial({ color: 0xe8e4da }));
    leg.position.set(30 + s * 10.5, 13.5, 6);
    leg.rotation.z = -s * 0.42;
    g.add(leg);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 4, 12), new THREE.MeshPhongMaterial({ color: 0xffd166, emissive: 0x553a00 }));
  hub.rotation.x = Math.PI / 2; hub.position.copy(wheel.position); g.add(hub);
  // kirish arka + pavilyonlar
  const arch = new THREE.Mesh(new THREE.TorusGeometry(12, 2.1, 8, 24, Math.PI), new THREE.MeshLambertMaterial({ color: 0xffd166, emissive: 0x40310a }));
  arch.position.set(-2, 12, 34); g.add(arch);
  const pavColors = [0xff9eb5, 0x8ee6a8, 0x7fd7ff, 0xffd166];
  for (let i = 0; i < 4; i++) {
    const pav = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.2, 7 + (i % 2) * 2.5, 8), new THREE.MeshLambertMaterial({ color: pavColors[i] }));
    const px = -52 + i * 34;
    pav.position.set(px, 4.5, 30 + (i % 2) * 12);
    g.add(pav);
    const roofc = new THREE.Mesh(new THREE.ConeGeometry(5.6, 4.2, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    roofc.position.set(px, 9.5 + (i % 2) * 2.5, 30 + (i % 2) * 12);
    g.add(roofc);
  }
}
function buildIceCity(g) {
  // Yopiq muz majmuasi: oq-koʻk barrel gumbaz + iCE CITY yozuvi
  const body = new THREE.Mesh(new THREE.BoxGeometry(78, 11, 48), new THREE.MeshLambertMaterial({ color: 0xe6eef4 }));
  body.position.y = 5.5; g.add(body);
  const vault = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 78, 24, 1, false, 0, Math.PI),
    new THREE.MeshPhongMaterial({ color: 0xbfe4f2, specular: 0xffffff, shininess: 72 }));
  vault.rotation.z = Math.PI / 2;
  vault.scale.set(0.62, 1, 1);
  vault.position.y = 11; g.add(vault);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(79.5, 2.6, 49.5), new THREE.MeshBasicMaterial({ color: 0x2f9fd8 }));
  stripe.position.y = 9.6; g.add(stripe);
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(6,24,38,0.0)'; c.fillRect(0, 0, 512, 128);
  c.font = '900 72px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillStyle = '#075a83'; c.fillText('ICE CITY', 256, 66);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(46, 11.5), new THREE.MeshBasicMaterial({ map: t, transparent: true, side: THREE.DoubleSide }));
  sign.position.set(0, 6.4, 24.4); g.add(sign);
  const door = new THREE.Mesh(new THREE.BoxGeometry(13, 8.4, 1.8),
    new THREE.MeshPhongMaterial({ color: 0x8fc6de, specular: 0xffffff, shininess: 80 }));
  door.position.set(0, 4.2, 24.2); g.add(door);
}

/* ---------------------------------------------------------------- Yangi ikonlar */
Object.assign(ICON_PATHS, {
  building: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 7h.01M12 7h.01M15 7h.01M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01"/>',
  tree: '<path d="M12 22v-5"/><path d="M12 2L6.8 11.5h10.4L12 2z"/><path d="M12 8L7.8 16h8.4L12 8z"/>',
  utensils: '<path d="M6 3v6a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V3M9 12v9"/><path d="M17 3c-2 0-3.5 2.2-3.5 5.2S15.3 13 17 13v8M17 3v18"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M9.2 14.3c.8 1.1 1.7 1.6 2.8 1.6s2-.5 2.8-1.6"/><path d="M9.3 9.6h.01M14.7 9.6h.01"/>',
});

/* ---------------------------------------------------------------- Shahar hayoti: avenjelar, chiroqlar, avtomobillar, bayroqlar, favvoralar */
const EXTRAS2 = window.DISTRICTS || {};

/* protsedural tumanlardagi asosiy avenjelar */
if (Array.isArray(EXTRAS2.avenues) && EXTRAS2.avenues.length) {
  const geos = [];
  for (const a of EXTRAS2.avenues) geos.push(ribbon([[a[0], a[1]], [a[2], a[3]]], 24));
  const merged = mergeGeos(geos);
  if (merged) {
    const m = new THREE.Mesh(merged, new THREE.MeshLambertMaterial({ map: TEX.asphalt, color: 0x59616b, side: THREE.DoubleSide }));
    m.position.y = 0.078;
    world.add(m);
  }
}

/* koʻcha chiroqlari */
if (Array.isArray(EXTRAS2.lamps) && EXTRAS2.lamps.length) {
  const L = EXTRAS2.lamps;
  const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.17, 0.27, 5.6, 5), new THREE.MeshLambertMaterial({ color: 0x363d46 }), L.length);
  const head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.44, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffe3a1 }), L.length);
  const d = new THREE.Object3D();
  for (let i = 0; i < L.length; i++) {
    d.position.set(L[i][0], 2.8, L[i][1]); d.scale.setScalar(1); d.rotation.set(0, 0, 0); d.updateMatrix();
    pole.setMatrixAt(i, d.matrix);
    d.position.y = 5.75; d.updateMatrix();
    head.setMatrixAt(i, d.matrix);
  }
  pole.instanceMatrix.needsUpdate = head.instanceMatrix.needsUpdate = true;
  world.add(pole, head);
}

/* avtomobillar (instanced, har frame yangilanadi) */
const cars = [];
const CAR_MAX = 26;
const carMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(2.1, 1.5, 4.6), new THREE.MeshLambertMaterial({ color: 0xffffff }), CAR_MAX);
const carPalette = [0xc94f4f, 0xe8e8e8, 0x3a6ea8, 0xe0b13e, 0x4f8f5a, 0x22262b, 0x8f5ac9, 0xd97a2b];
if (Array.isArray(EXTRAS2.avenues) && EXTRAS2.avenues.length) {
  for (const a of EXTRAS2.avenues) {
    const dx = a[2] - a[0], dz = a[3] - a[1];
    const L = Math.hypot(dx, dz) || 1;
    const ux = dx / L, uz = dz / L;
    for (let k = 0; k < 2 && cars.length < CAR_MAX; k++) {
      const dir = k === 0 ? 1 : -1;
      cars.push({
        x0: a[0], z0: a[1], x1: a[2], z1: a[3],
        nx: -uz, nz: ux, lane: dir * 4.8, t: Math.random(),
        speed: 0.000105 + Math.random() * 0.000075,
        yaw: Math.atan2(ux * dir, uz * dir),
        color: carPalette[cars.length % carPalette.length],
      });
    }
  }
  for (let i = 0; i < cars.length; i++) carMesh.setColorAt(i, new THREE.Color(cars[i].color));
  if (carMesh.instanceColor) carMesh.instanceColor.needsUpdate = true;
  carMesh.count = cars.length;
  world.add(carMesh);
}
const _carObj = new THREE.Object3D();
function updateCars() {
  if (!cars.length) return;
  for (let i = 0; i < cars.length; i++) {
    const c = cars[i];
    c.t += c.speed;
    if (c.t >= 1) c.t -= 1;
    const x = c.x0 + (c.x1 - c.x0) * c.t, z = c.z0 + (c.z1 - c.z0) * c.t;
    _carObj.position.set(x + c.nx * c.lane, 1.15, z + c.nz * c.lane);
    _carObj.rotation.set(0, c.yaw, 0);
    _carObj.updateMatrix();
    carMesh.setMatrixAt(i, _carObj.matrix);
  }
  carMesh.instanceMatrix.needsUpdate = true;
}

/* bayroqlar (TDIU + Moliya) — Oʻzbekiston bayrogʻi, shamolda hilpiraydi */
function uzFlagTexture() {
  const cv = document.createElement('canvas'); cv.width = 240; cv.height = 150;
  const c = cv.getContext('2d');
  c.fillStyle = '#0099b5'; c.fillRect(0, 0, 240, 48);
  c.fillStyle = '#ffffff'; c.fillRect(0, 48, 240, 54);
  c.fillStyle = '#1eb53a'; c.fillRect(0, 102, 240, 48);
  c.strokeStyle = '#ce1126'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(0, 48); c.lineTo(240, 48); c.moveTo(0, 102); c.lineTo(240, 102); c.stroke();
  c.fillStyle = '#ffffff';
  c.beginPath(); c.arc(50, 26, 15, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#0099b5';
  c.beginPath(); c.arc(55.5, 26, 12.6, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#ffffff';
  for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) {
    c.beginPath(); c.arc(84 + q * 25, 13 + r * 14.5, 3.1, 0, Math.PI * 2); c.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const flagMeshes = [];
for (const cp of CPS) {
  const hq = cp.buildings.find(b => b.role === 'hq');
  if (!hq) continue;
  const fx = hq.px + 17, fz = hq.pz + 11;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 16.5, 8), new THREE.MeshLambertMaterial({ color: 0xd9dfe7 }));
  pole.position.set(fx, 8.25, fz); world.add(pole);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.46, 8, 8), new THREE.MeshPhongMaterial({ color: 0xffd166, emissive: 0x40300a, shininess: 90 }));
  ball.position.set(fx, 16.9, fz); world.add(ball);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(6.3, 3.6), new THREE.MeshLambertMaterial({ map: uzFlagTexture(), side: THREE.DoubleSide, emissive: 0x141414 }));
  flag.position.set(fx + 3.35, 14.6, fz);
  world.add(flag);
  flagMeshes.push(flag);
}

/* Asosiy kampus favvora */
let fountainWater = null;
{
  const mainCp = CPS.find(c => c.id === 'main');
  const hq = mainCp && mainCp.buildings.find(b => b.role === 'hq');
  if (hq) {
    const FX = hq.px - 23, FZ = hq.pz + 20;
    const g = new THREE.Group();
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.1, 1.15, 20), new THREE.MeshLambertMaterial({ color: 0xc6cdd6 }));
    basin.position.set(FX, 0.58, FZ); g.add(basin);
    fountainWater = new THREE.Mesh(new THREE.CircleGeometry(3.15, 24), new THREE.MeshPhongMaterial({ color: 0x3f8fb8, emissive: 0x0d3040, transparent: true, opacity: 0.9, shininess: 90 }));
    fountainWater.rotation.x = -Math.PI / 2; fountainWater.position.set(FX, 1.18, FZ); g.add(fountainWater);
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.62, 2.4, 10), new THREE.MeshLambertMaterial({ color: 0xb8c1cb }));
    column.position.set(FX, 2.2, FZ); g.add(column);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.15, 0.42, 14), new THREE.MeshLambertMaterial({ color: 0xd0d7de }));
    top.position.set(FX, 3.55, FZ); g.add(top);
    world.add(g);
  }
}

/* ---------------------------------------------------------------- POI (shahar maskanlari) */
const POI_STYLE = {
  university:   { c: '#f5c542', ic: 'cap' },
  lyceum:       { c: '#b388ff', ic: 'book' },
  school:       { c: '#6ee7ff', ic: 'book' },
  kindergarten: { c: '#ff9eb5', ic: 'smile' },
  park:         { c: '#5ed69a', ic: 'tree' },
  food:         { c: '#ffb86b', ic: 'utensils' },
  educenter:    { c: '#64d8cb', ic: 'bulb' },
  spot:         { c: '#e8edf4', ic: 'pin' },
};
const POI_LABELS = [];
const POIS = (window.DISTRICTS && window.DISTRICTS.pois) || [];
const W_LAT0 = 41.3093, W_LON0 = 69.2499;
const K_LON = 111320 * Math.cos(W_LAT0 * Math.PI / 180), M_LAT = 110574;
const poiLatLon = (x, z) => ({ lat: W_LAT0 + (-z) / M_LAT, lon: W_LON0 + x / K_LON });

function poiLabelTexture(poi) {
  const st = POI_STYLE[poi.cat] || POI_STYLE.spot;
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 132;
  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(8,14,24,0.88)';
  c.beginPath();
  if (c.roundRect) c.roundRect(4, 8, 504, 116, 26); else c.rect(4, 8, 504, 116);
  c.fill();
  c.strokeStyle = st.c; c.lineWidth = 5;
  c.beginPath();
  if (c.roundRect) c.roundRect(4, 8, 504, 116, 26); else c.rect(4, 8, 504, 116);
  c.stroke();
  c.textAlign = 'left'; c.textBaseline = 'alphabetic';
  c.fillStyle = st.c; c.font = '800 22px system-ui, sans-serif';
  c.fillText((poi.catName || 'POI').toUpperCase(), 26, 47);
  c.fillStyle = '#f2f6fc'; c.font = '700 29px system-ui, sans-serif';
  const nm = poi.name.length > 30 ? poi.name.slice(0, 29) + '…' : poi.name;
  c.fillText(nm, 26, 93);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let _awnTex = null;
/* ================================================================ POI 3D modellari — har bir kategoriya o‘z ko‘rinishida */
const _matCache = new Map();
function matFor(c, opts) {
  const key = c + '|' + JSON.stringify(opts || {});
  if (!_matCache.has(key)) _matCache.set(key, new THREE.MeshLambertMaterial(Object.assign({ color: c }, opts)));
  return _matCache.get(key);
}
function _b(w, h, d, c, x, y, z, parent, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matFor(c, opts));
  m.position.set(x, y, z); parent.add(m); return m;
}
function _cyl(rt, rb, h, c, x, y, z, parent, seg, opts) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 12), matFor(c, opts));
  m.position.set(x, y, z); parent.add(m); return m;
}
function _sph(r, c, x, y, z, parent, sy) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), matFor(c));
  m.position.set(x, y, z); if (sy) m.scale.y = sy; parent.add(m); return m;
}
function _cone(r, h, c, x, y, z, parent, seg) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg || 10), matFor(c));
  m.position.set(x, y, z); parent.add(m); return m;
}
function _triPrism(w, h, d, c, x, y, z) {
  const tri = new THREE.Shape();
  tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, h); tri.closePath();
  const m = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: d, bevelEnabled: false }), matFor(c));
  m.position.set(x, y, z);
  return m;
}
function _plaza(g, r, c) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 28), matFor(c || 0xbcb7a9, { transparent: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.22; g.add(m); return m;
}
function _flagPole(g, x, z, hgt) {
  _cyl(0.22, 0.3, hgt, 0xd8d8d8, x, hgt / 2, z, g, 6);
  _sph(0.5, 0xe8c766, x, hgt + 0.4, z, g);
  const flag = _b(4.2, 2.4, 0.12, 0x0099b5, x + 2.3, hgt - 1.6, z, g);
  flag.userData.isPoiFlag = true;
  return flag;
}
function _tree(g, x, z, s) {
  _cyl(0.3 * s, 0.42 * s, 2.6 * s, 0x51402e, x, 1.3 * s, z, g, 5);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2 * s, 0), matFor(0x3e7a45));
  crown.position.set(x, 3.5 * s, z); g.add(crown);
}
function _fountain(g, x, z, s) {
  _cyl(2.6 * s, 3.0 * s, 0.9 * s, 0xcfccc0, x, 0.45 * s, z, g, 14);
  _cyl(2.15 * s, 2.15 * s, 0.2 * s, 0x2f6d8f, x, 0.85 * s, z, g, 14, { emissive: 0x0d3040 });
  _cyl(0.32 * s, 0.45 * s, 1.7 * s, 0xcfccc0, x, 1.2 * s, z, g, 8);
  _sph(0.5 * s, 0x7cc4e8, x, 2.15 * s, z, g);
}

const POI_BUILDERS = {
  university(poi) {
    const g = new THREE.Group();
    _plaza(g, 30, 0xcac6b8);
    /* asos va zinapoyalar */
    _b(64, 2.2, 30, 0xbdb9ab, 0, 1.1, 0, g);
    _b(58, 1.1, 26, 0xcac6b8, 0, 2.6, 0, g);
    /* qanotlar */
    _b(20, 8.5, 17, 0xe7e4d8, -26, 7.4, -2, g);
    _b(20, 8.5, 17, 0xe7e4d8, 26, 7.4, -2, g);
    _b(20, 1.1, 17, 0x8fb7d9, -26, 11.7, -2, g);
    _b(20, 1.1, 17, 0x8fb7d9, 26, 11.7, -2, g);
    /* markaziy blok */
    _b(26, 12.5, 19, 0xefece0, 0, 9.4, 0, g);
    /* ustunlar */
    for (let i = -2; i <= 2; i++) _cyl(1.05, 1.18, 9.5, 0xfaf8ee, i * 5.1, 7.6, 10.6, g, 10);
    /* fronton (uchburchak) — 3 qirrali silindr */
    g.add(_triPrism(21.6, 4.6, 18.6, 0xefece0, 0, 15.7, -9.3));
    /* gumbaz */
    _cyl(6.4, 6.9, 2.2, 0xd8d5c8, 0, 17.4, 0, g, 16);
    _sph(5.9, 0x2f6f9f, 0, 18.2, 0, g, 0.82);
    _cyl(0.16, 0.16, 3.4, 0xe8c766, 0, 22.6, 0, g, 6);
    /* kirish portal */
    _b(7.2, 6.4, 2.4, 0x8a6b3f, 0, 5.2, 10.9, g);
    _flagPole(g, 0, 15.5, 11);
    return g;
  },
  lyceum(poi) {
    const g = new THREE.Group();
    _plaza(g, 17, 0xc4c0b2);
    _b(30, 7.5, 13, 0xe8e6da, 0, 3.75, 0, g);
    _b(13, 10.5, 13, 0xdcdacf, -12.5, 5.25, 0, g);
    _b(30, 0.9, 13, 0x3f6d8f, 0, 7.95, 0, g);
    _b(13, 0.9, 13, 0x3f6d8f, -12.5, 10.9, 0, g);
    /* katta belgi paneli */
    _b(16, 2.2, 0.5, 0x2f6f9f, 4.5, 8.6, 6.6, g, { emissive: 0x10364a });
    /* oyna chizig‘i */
    _b(24, 1.6, 0.2, 0x27384a, 2, 4.6, 6.55, g);
    _b(6, 4.6, 0.3, 0x6b5324, 8.5, 2.3, 6.6, g);
    _flagPole(g, -12.5, 9.5, 8);
    return g;
  },
  school(poi) {
    const g = new THREE.Group();
    _plaza(g, 18, 0xc7c3b5);
    _b(32, 8, 15, 0xf0eee2, 0, 4, 0, g);
    _b(32, 0.8, 15.4, 0xc4553a, 0, 8.4, 0, g);
    /* sport zal */
    _b(15, 5.5, 11, 0xd9d6ca, 19.5, 2.75, -2, g);
    _b(15, 0.7, 11.4, 0x8a4a30, 19.5, 5.9, -2, g);
    /* oyna chiziqlar */
    _b(28, 1.4, 0.2, 0x27384a, 0, 5.4, 7.55, g);
    _b(28, 1.4, 0.2, 0x27384a, 0, 2.6, 7.55, g);
    /* kirish */
    _b(5.6, 4.2, 1.6, 0x33465a, 0, 2.1, 7.8, g);
    _flagPole(g, -11, 10.5, 9);
    /* futbol darvozasi (oddiy) */
    const wm = matFor(0xf5f5f5);
    const g1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.4, 5), wm); g1.position.set(-14, 1.2, -14); g.add(g1);
    const g2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.4, 5), wm); g2.position.set(-6, 1.2, -14); g.add(g2);
    const g3 = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.25, 5), wm); g3.position.set(-10, 2.5, -14); g.add(g3);
    return g;
  },
  kindergarten(poi) {
    const g = new THREE.Group();
    _plaza(g, 15, 0xd0ccbd);
    /* rang-barang uy */
    _b(17, 5, 12, 0xf2b035, 0, 2.5, 0, g);
    _b(17.6, 0.6, 12.6, 0xc4553a, 0, 5.3, 0, g);
    /* ikki qirrali tom — 3 qirrali silindr */
    g.add(_triPrism(18.2, 3.9, 13.2, 0xd0522e, 0, 5.3, -6.6));
    /* oyna va eshik */
    _b(2.4, 2.2, 0.2, 0xfff6d8, -5, 3.4, 6.05, g, { emissive: 0x554411 });
    _b(2.4, 2.2, 0.2, 0xfff6d8, 5, 3.4, 6.05, g, { emissive: 0x554411 });
    _b(3.4, 3.6, 0.3, 0x2e6f4f, 0, 1.8, 6.1, g);
    /* panjara */
    const fm = matFor(0xf7f3e6);
    for (const [w, d, x, z] of [[26, 0.28, 0, 11], [26, 0.28, 0, -11], [0.28, 22, 13, 0], [0.28, 22, -13, 0]]) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(w, 1.15, d), fm); f.position.set(x, 0.58, z); g.add(f);
    }
    /* qumdon + sharlar */
    _cyl(2.4, 2.4, 0.5, 0x8f7a54, 8.4, 0.25, 7.2, g, 14);
    _sph(0.85, 0xe05252, -8.4, 0.85, 7.6, g);
    _sph(0.7, 0x3f8fd0, 6.2, 0.7, -7.8, g);
    return g;
  },
  food(poi) {
    const g = new THREE.Group();
    _plaza(g, 16, 0xc9c2b2);
    _b(16, 4.6, 13, 0xe3dfd0, 0, 2.3, 0, g);
    /* chiziqli soyabon — kanvas teksturali egik quti */
    if (!_awnTex) {
      const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
      const c = cv.getContext('2d');
      for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f5f2e8' : '#c4452e'; c.fillRect(i * 32, 0, 32, 64); }
      _awnTex = new THREE.CanvasTexture(cv);
      _awnTex.colorSpace = THREE.SRGBColorSpace;
    }
    const awn = new THREE.Mesh(new THREE.BoxGeometry(17, 0.35, 3.6), new THREE.MeshLambertMaterial({ map: _awnTex }));
    awn.position.set(0, 4.6, 8.1); awn.rotation.x = 0.18; g.add(awn);
    /* peshlavha */
    _b(13, 1.7, 0.4, 0xb83a22, 0, 6.1, 6.55, g, { emissive: 0x471207 });
    _b(3.4, 3.4, 0.2, 0x2b2018, 0, 1.7, 6.55, g);
    /* tashqi stollar + soyabonlar */
    for (const tx of [-6.5, 0, 6.5]) {
      _cyl(0.18, 0.18, 1.15, 0x6b6b6b, tx, 0.58, 11.5, g, 6);
      _cyl(1.35, 1.35, 0.12, 0x8a5a30, tx, 1.18, 11.5, g, 10);
      _cyl(0.09, 0.09, 2.9, 0x8a8a8a, tx, 1.45, 11.5, g, 6);
      _cone(1.75, 1.05, tx < 0 ? 0xc4452e : 0x2e6f4f, tx, 3.15, 11.5, g, 10);
    }
    return g;
  },
  educenter(poi) {
    const g = new THREE.Group();
    _plaza(g, 15, 0xc2beb0);
    const glass = new THREE.MeshPhongMaterial({ color: 0x3d6f96, specular: 0xa8cdea, shininess: 60, emissive: 0x0a1f2e });
    _b(13, 17, 13, 0x3d6f96, 0, 8.5, 0, g, { emissive: 0x0a1f2e }).material = glass;
    _b(13.6, 0.9, 13.6, 0x1d2c3c, 0, 17.4, 0, g);
    /* neon chizig‘i */
    _b(11.5, 0.65, 0.3, 0x35e0c8, 0, 13.2, 6.55, g, { emissive: 0x18b09a });
    _b(11.5, 0.65, 0.3, 0x35e0c8, 0, 9.4, 6.55, g, { emissive: 0x18b09a });
    /* kirish soyaboni */
    _b(8, 0.4, 2.6, 0x1d2c3c, 0, 3.6, 7.6, g);
    _b(2.8, 3.4, 0.25, 0x101820, 0, 1.7, 6.55, g);
    return g;
  },
  spot(poi) {
    const g = new THREE.Group();
    const n = (poi.name || '').toLowerCase();
    if (n.includes('tv') || n.includes('minor')) {
      /* Toshkent TV minorasi — kichik nusxa */
      _plaza(g, 16, 0xb9b6ab);
      _cyl(2.6, 4.6, 6, 0x9aa3ab, 0, 3, 0, g, 12);
      _cyl(1.5, 2.6, 22, 0xb9c0c7, 0, 17, 0, g, 12);
      _cyl(3.3, 3.3, 2.6, 0xd4d9de, 0, 25, 0, g, 14);
      _cyl(0.9, 1.1, 11, 0xb9c0c7, 0, 31.5, 0, g, 8);
      _cyl(0.14, 0.2, 8, 0xe8c766, 0, 40.5, 0, g, 6);
      _sph(0.35, 0xff5544, 0, 44.6, 0, g);
    } else if (n.includes('oloy') || n.includes('bozor')) {
      /* Oloy bozori — gumbazli bozor */
      _plaza(g, 18, 0xc6b9a4);
      _b(24, 5, 17, 0xd9c9a8, 0, 2.5, 0, g);
      _cyl(5.4, 5.9, 2.4, 0xcbb98c, 0, 6.2, 0, g, 14);
      _sph(5.1, 0x3f7a54, 0, 7.1, 0, g, 0.78);
      _cyl(0.14, 0.14, 3.2, 0xe8c766, 0, 13.4, 0, g, 6);
      _sph(0.34, 0xe8c766, 0, 15.1, 0, g);
    } else {
      /* Mustaqillik maydoni — bayroq va xotiralar xiyoboni */
      _plaza(g, 22, 0xcac6ba);
      _cyl(7.5, 8.5, 1.6, 0xbdb9ab, 0, 0.8, 0, g, 18);
      _flagPole(g, 0, 0, 26);
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        _cyl(0.3, 0.3, 4.2, 0x8a8a8a, Math.cos(a) * 5.6, 2.1, Math.sin(a) * 5.6, g, 6);
      }
      /* abadiy olov */
      _cone(0.9, 1.6, 0xe07b2a, 0, 2.2, 0, g, 8).material = matFor(0xe07b2a, { emissive: 0xa33c00 });
    }
    return g;
  },
  park(poi) {
    const g = new THREE.Group();
    _plaza(g, 21, 0x9aa887);
    _fountain(g, 0, 0, 1.15);
    const offs = [[-12, -8], [12, -8], [-12, 8], [12, 8], [0, -13], [0, 13]];
    let i = 0;
    const rng = poi.seed || (i => (i * 2654435761 % 1000) / 1000);
    for (const [ox, oz] of offs) {
      _tree(g, ox, oz, 0.8 + ((i * 37) % 10) / 22);
      i++;
    }
    /* skameykalar */
    const bm = matFor(0x6b4a2a);
    for (const a of [0.5, 2.1, 3.6, 5.2]) {
      const sc = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.42, 0.9), bm);
      sc.position.set(Math.cos(a) * 8.6, 0.62, Math.sin(a) * 8.6);
      sc.rotation.y = -a + Math.PI / 2;
      g.add(sc);
    }
    return g;
  },
};

for (const poi of POIS) {
  const st = POI_STYLE[poi.cat] || POI_STYLE.spot;
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 56, 8), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(poi.x, 28, poi.z);
  hit.userData.poi = poi;
  world.add(hit); pickables.push(hit);
  /* koordinata-asoslangan burilish — bir xil turdagi binolar har xil qaraydi */
  const model = (POI_BUILDERS[poi.cat] || POI_BUILDERS.spot)(poi);
  model.position.set(poi.x, 0, poi.z);
  model.rotation.y = ((Math.abs(poi.x * 13.7 + poi.z * 7.3)) % 360) * Math.PI / 90;
  world.add(model);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: poiLabelTexture(poi), transparent: true, depthTest: false, depthWrite: false }));
  sp.position.set(poi.x, 42, poi.z);
  sp.scale.set(64, 16.5, 1); sp.renderOrder = 8;
  world.add(sp);
  POI_LABELS.push(sp);
}

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

const _tmpV = new THREE.Vector3();

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
  const L = labels.find(x => x.b && x.b.id === b.id);
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
  /* masofaga mos tuman (fog) — yaqin koʻrinishda atmosfera, uzoqda ochiq */
  scene.fog.near = Math.max(420, cam.r * 1.35);
  scene.fog.far = Math.max(1600, cam.r * 4.2);
  const y = Math.cos(cam.phi) * cam.r, rr = Math.sin(cam.phi) * cam.r;
  camera.position.set(cam.tx + Math.sin(cam.theta) * rr, Math.max(6, y), cam.tz + Math.cos(cam.theta) * rr);
  camera.lookAt(cam.tx, 4, cam.tz);
}
function flyTo(id) {
  const cp = CPS.find(c => c.id === id);
  let tx, tz, r, theta, phi;
  if (!cp) {                                  // umumiy koʻrinish
    tx = OVERVIEW.tx; tz = OVERVIEW.tz; r = OVERVIEW.r; theta = -1.043; phi = 0.40;
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
  cam.r = Math.min(26000, Math.max(60, cam.r * (1 + Math.sign(e.deltaY) * 0.09)));
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 2) {
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (pinch) cam.r = Math.min(26000, Math.max(60, cam.r * (pinch / d)));
    pinch = d;
  }
}, { passive: true });
canvas.addEventListener('touchend', () => { pinch = null; });

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();

/* merged tuman binolari: yuz indeksi -> bino */
function buildingInfoAt(mesh, faceIndex) {
  const map = mesh.userData.faceMap;
  if (!map || faceIndex === undefined || faceIndex === null) return null;
  let lo = 0, hi = map.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1, r = map[mid];
    if (faceIndex < r.a) hi = mid - 1;
    else if (faceIndex >= r.b) lo = mid + 1;
    else return { bld: mesh.userData.blds[r.bIdx], style: mesh.userData.kind };
  }
  return null;
}
const DIST_NAME = {};
for (const d of DISTRICTS) DIST_NAME[d.key] = d.name;
const REAL_DATA = { chilonzor: true, yunusobod: true, olmazor: true, uchtepa: true, mirzo_ulugbek: true, mirobod: true, shayxontohur: true, sergeli: true, bektemir: true, yashnobod: true, yakkasaroy: true, yangihayot: true };  // 2026-11-28: 12 tuman hammasi real OSM

function pick(cx, cy) {
  ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);

  /* 1) ichki koʻrinish: xona tanish */
  if (interior.active && interior.b) {
    const data = interiorCache.get(interior.b.id);
    const cur = data && data.groups[interior.floor - 1];
    if (cur) {
      const rh = ray.intersectObjects(cur.rooms, false);
      if (rh.length) { interiorRoomHit(rh[0].object); return; }
    }
  }

  /* 2) POI va rolli TDIU binolari */
  const hits = ray.intersectObjects(pickables, false);
  for (const h of hits) {
    const poi = h.object.userData.poi;
    if (poi) { selectPoi(poi); return; }
  }
  if (hits.length) {
    let o = hits[0].object;
    while (o && !o.userData.b) o = o.parent;
    if (o) { select(o.userData.b); return; }
  }

  /* 3) tuman binolari (merged geometriya, yuz -> bino) */
  const dhits = ray.intersectObjects(districtMeshes, false);
  if (dhits.length) {
    const info = buildingInfoAt(dhits[0].object, dhits[0].faceIndex);
    if (info) { genericBuildingPanel(dhits[0].point, info); return; }
  }
  closePanel();
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
  panelTab = 'info';
  if (interior.active) exitInterior();
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
function closePanel() {
  $('#panel').classList.remove('open'); selRing.visible = false; selected = null;
  if (interior.active) exitInterior();
}
window.__close = closePanel;

/* ================================================================ Tanlangan obyekt panellari: POI, umumiy bino, TDIU xonalari */
let panelTab = 'info';

/* ---- POI panel ---- */
const POI_CAT_IC = { university: 'cap', lyceum: 'book', school: 'book', kindergarten: 'smile', park: 'tree', food: 'utensils', educenter: 'bulb', spot: 'pin' };
function selectPoi(poi) {
  selected = null;
  if (interior.active) exitInterior();
  selRing.position.set(poi.x, 0.32, poi.z);
  selRing.scale.setScalar(9.5);
  selRing.visible = true;
  const st = POI_STYLE[poi.cat] || POI_STYLE.spot;
  const ll = poiLatLon(poi.x, poi.z);
  $('#panel').innerHTML = `
    <div class="p-head">
      <div class="p-icon${''}" style="border-color:${st.c}55;background:${st.c}1a;color:${st.c}">${ic(POI_CAT_IC[poi.cat] || 'pin', 22)}</div>
      <div>
        <div class="p-title">${poi.name}</div>
        <div class="p-sub"><b style="color:${st.c}">${poi.catName || 'Maskan'}</b> · Toshkent</div>
      </div>
      <button class="p-x" onclick="window.__close()">✕</button>
    </div>
    <p class="p-desc">${poi.info || ''}</p>
    <div class="kv"><span>Koordinata</span><b>${ll.lat.toFixed(4)}° N, ${ll.lon.toFixed(4)}° E</b></div>
    <div class="kv"><span>Joylashuv</span><b>taxminiy (oʻyin uchun)</b></div>
    <div class="p-row">
      <button class="btn btn-ic" onclick="window.__poiFly('${poi.id}')">${ic('map', 15)} Yanada yaqinlashtirish</button>
    </div>`;
  $('#panel').classList.add('open');
}
window.__poiFly = function (id) {
  const poi = POIS.find(p => p.id === id); if (!poi) return;
  cam.txT = cam.tx = poi.x; cam.tzT = cam.tz = poi.z;
  cam.r = 170; cam.phi = 0.62;
  if (TG && TG.HapticFeedback) TG.HapticFeedback.selectionChanged();
};

/* ---- umumiy (tuman) binosi paneli ---- */
function genericBuildingPanel(point, info) {
  selected = null;
  if (interior.active) exitInterior();
  const b = info.bld;
  selRing.position.set(point.x, 0.3, point.z);
  selRing.scale.setScalar(6.5);
  selRing.visible = true;
  const name = DIST_NAME[b.key] || 'Tuman';
  const real = REAL_DATA[b.key];
  const h = Math.round(b.h);
  const floors = Math.max(1, Math.round(b.h / 3.4));
  const mat = info.style === 'glass' ? 'Shisha fasad' : info.style === 'classic' ? "Gʻisht, klassik namuna" : 'Panel konstruksiya';
  let tur = 'Turarjoy / tijorat';
  if (b.key === 'bektemir') tur = 'Sanoat binolar';
  else if (b.key === 'shayxontohur') tur = 'Eski shahar, mahalla';
  else if (b.key === 'yakkasaroy') tur = "Markaziy turarjoy (baland)";
  else if (b.key === 'sergeli') tur = "Yangi panel turarjoy";
  else if (b.key === 'yangihayot') tur = "Yangi turarjoy massivi";
  else if (b.h >= 30) tur = "Ko‘p qavatli turarjoy";
  const num = 1 + Math.floor((b.hsh || 0.5) * 380);
  $('#panel').innerHTML = `
    <div class="p-head">
      <div class="p-icon">${ic('building', 22)}</div>
      <div>
        <div class="p-title">${name} — ${num}-bino</div>
        <div class="p-sub"><b>${h} m</b> · ~${floors} qavat · ${tur}</div>
      </div>
      <button class="p-x" onclick="window.__close()">✕</button>
    </div>
    <div class="kv"><span>Tuman</span><b>${name}</b></div>
    <div class="kv"><span>Balandligi</span><b>${h} m (~${floors} qavat)</b></div>
    <div class="kv"><span>Material</span><b>${mat}</b></div>
    <div class="kv"><span>Maʻlumot</span><b>${real ? 'OSM 2026-11' : 'Protsedural model — taxminiy'}</b></div>
    <div class="p-foot">Tuman binolarini bosing — har biri haqida maʻlumot chiqadi.</div>`;
  $('#panel').classList.add('open');
}

/* ---- TDIU binolari: ichki koʻrinish (dollhouse) ---- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ROOM_POOLS = {
  hq: ['Rektor xonasi', 'Qabulxona', 'Kengash zali', 'Dekanat', 'Protokol boʻlimi', 'Kutubxona', 'Arxiv', 'Xodimlar xonasi', 'Moliya boʻlimi', 'Buxgalteriya', 'Axborot markazi'],
  edu: ['Auditoriya', "Oʻquv xonasi", 'Laboratoriya', 'Metodbirma', "Oʻqituvchilar xonasi", 'Seminar zali', 'Kompyuter sinfi'],
  money: ['Buxgalteriya', "Moliya boʻlimi", 'Kassa', 'Audit', "Xodimlar boʻlimi", 'Arxiv', 'Auditoriya'],
  flow: ['Auditoriya', 'Qabul komissiyasi', 'Tayyorgarlik kursi', "Oʻquv xonasi", 'Kutubxona'],
  energy: ['Sport zali', 'Vrach xizmati', 'Jihozlar ombori', "Oʻquv xonasi", 'Dam olish xonasi'],
  innovation: ['Laboratoriya', 'Kovorking', 'Startap kafedrasi', 'Server xonasi', 'Rejalashtirish', 'Auditoriya'],
};
const ROOM_COLORS = { hall: '#6f9fd8', lab: '#63c184', lib: '#a58ae0', sport: '#8fd07a', fin: '#d9b253', office: '#d99a5f', common: '#93a2b6' };
function roomType(name) {
  if (/Kutubxona/.test(name)) return 'lib';
  if (/Laboratoriya|Server|Kompyuter/.test(name)) return 'lab';
  if (/Sport/.test(name)) return 'sport';
  if (/Buxgalteriya|Moliya|Kassa|Audit|Markaz/.test(name) && !/Axborot/.test(name)) return 'fin';
  if (/Rektor|Direktor|Dekanat|Qabulxona|Kengash|Xodimlar/.test(name)) return 'office';
  if (/Auditoriya|Seminar|Oʻquv/.test(name)) return 'hall';
  return 'common';
}
function roomNameFor(b, f, i, rng) {
  const pool = ROOM_POOLS[b.roleData.key] || ROOM_POOLS.edu;
  const base = pool[Math.floor(rng() * pool.length)];
  if (/Auditoriya|Laboratoriya|Oʻquv xonasi|Kompyuter sinfi|Auditoriya/.test(base)) return `${base} ${(f + 1) * 100 + i + 1}`;
  if (rng() < 0.3) return `${base} ${i + 1}`;
  return base;
}
const interiorCache = new Map();
const interior = { active: false, b: null, floor: 1 };
const _whiteMat = new THREE.MeshLambertMaterial({ color: 0xe9e7de });
const roomRing = new THREE.Mesh(new THREE.RingGeometry(0.82, 1.0, 40),
  new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthTest: false }));
roomRing.rotation.x = -Math.PI / 2;
roomRing.visible = false;
roomRing.renderOrder = 9;
scene.add(roomRing);

function ensureInterior(b) {
  if (interiorCache.has(b.id)) return interiorCache.get(b.id);
  const pts = b.pts;
  let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const p of pts) {
    if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
    if (p[1] < minZ) minZ = p[1]; if (p[1] > maxZ) maxZ = p[1];
  }
  const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
  const w = maxX - minX, d = maxZ - minZ;
  const axis = w >= d ? 'x' : 'z';
  const L = axis === 'x' ? w : d, perp = axis === 'x' ? d : w;
  const corridor = 2.1;
  const rd = Math.max(2.2, (perp - corridor) / 2 - 0.5);
  const levels = Math.max(1, Math.min(b.levels || 3, 24));
  const rng = mulberry32(b.id * 7919 + 101);
  const groups = [];
  for (let f = 0; f < levels; f++) {
    const g = new THREE.Group();
    const y = f * 3.4;
    const slabW = axis === 'x' ? L - 0.35 : perp - 0.35;
    const slabD = axis === 'x' ? perp - 0.35 : L - 0.35;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(slabW, 0.3, slabD), new THREE.MeshLambertMaterial({ color: 0xd7d4c9 }));
    slab.position.set(cx, y + 0.15, cz);
    g.add(slab);
    /* perimetr devorlar */
    const wallGeos = [];
    const t = 0.2, hh = 2.55, hw = hh / 2;
    wallGeos.push({ w: slabW + t, d: t, x: cx, z: cz - (perp - 0.35) / 2, y });
    wallGeos.push({ w: slabW + t, d: t, x: cx, z: cz + (perp - 0.35) / 2, y });
    wallGeos.push({ w: t, d: slabD + t, x: cx - (slabW) / 2, z: cz, y });
    wallGeos.push({ w: t, d: slabD + t, x: cx + (slabW) / 2, z: cz, y });
    /* xonalar + boʻluvchi devorlar */
    const n = Math.max(2, Math.floor(L / 5.6));
    const rw = L / n;
    const rooms = [];
    for (const side of [-1, 1]) {
      for (let i = 0; i < n; i++) {
        if (rng() < 0.07) continue;
        const along = -L / 2 + rw * (i + 0.5);
        const depthOff = side * (corridor / 2 + rd / 2);
        const wdt = rw - 0.34, dpt = rd - 0.22;
        const name = roomNameFor(b, f, i, rng);
        const type = roomType(name);
        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(axis === 'x' ? wdt : dpt, axis === 'x' ? dpt : wdt),
          new THREE.MeshLambertMaterial({ color: ROOM_COLORS[type] })
        );
        plane.rotation.x = -Math.PI / 2;
        const px = axis === 'x' ? cx + along : cx + depthOff;
        const pz = axis === 'x' ? cz + depthOff : cz + along;
        plane.position.set(px, y + 0.32, pz);
        plane.userData.room = { name, type, floor: f + 1, w: Math.round(wdt * 10) / 10, d: Math.round(dpt * 10) / 10, area: Math.round(wdt * dpt) };
        g.add(plane);
        rooms.push(plane);
      }
    }
    for (let i = 1; i < n; i++) {
      const along = -L / 2 + rw * i;
      for (const side of [-1, 1]) {
        const depthOff = side * (corridor / 2 + rd / 2);
        wallGeos.push({
          w: axis === 'x' ? 0.16 : rd, d: axis === 'x' ? rd : 0.16,
          x: axis === 'x' ? cx + along : cx + depthOff,
          z: axis === 'x' ? cz + depthOff : cz + along,
          y,
        });
      }
    }
    for (const wg of wallGeos) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(wg.w, hh, wg.d), _whiteMat);
      wall.position.set(wg.x, wg.y + 0.3 + hw, wg.z);
      g.add(wall);
    }
    g.visible = false;
    world.add(g);
    groups.push({ group: g, rooms });
  }
  const data = { groups, cx, cz, L, perp, levels,
    diag: Math.hypot(L, perp) };
  interiorCache.set(b.id, data);
  return data;
}
function showInteriorFloor(b, f) {
  const data = ensureInterior(b);
  interior.active = true; interior.b = b; interior.floor = f;
  for (let i = 0; i < data.groups.length; i++) data.groups[i].group.visible = (i === f - 1);
  if (b.wallsMesh) b.wallsMesh.visible = false;
  if (b.roofMesh) b.roofMesh.visible = false;
  if (b.edgesMesh) b.edgesMesh.visible = false;
  cam.txT = data.cx; cam.tzT = data.cz; cam.tx = data.cx; cam.tz = data.cz;
  cam.r = Math.max(26, data.diag * 0.78 + 12);
  cam.phi = 0.5;
}
function exitInterior() {
  const b = interior.b;
  if (b) {
    const data = interiorCache.get(b.id);
    if (data) for (const g of data.groups) g.group.visible = false;
    if (b.wallsMesh) b.wallsMesh.visible = true;
    if (b.roofMesh) b.roofMesh.visible = true;
    if (b.edgesMesh) b.edgesMesh.visible = true;
  }
  interior.active = false; interior.b = null;
  roomRing.visible = false;
}
function interiorRoomHit(mesh) {
  const r = mesh.userData.room; if (!r) return;
  roomRing.position.set(mesh.position.x, mesh.position.y + 0.03, mesh.position.z);
  roomRing.scale.setScalar(Math.max(r.w, r.d) * 0.62);
  roomRing.visible = true;
  const info = document.getElementById('room-info');
  if (info) info.innerHTML = `<b>${r.name}</b> · ${r.w}×${r.d} m · ~${r.area} m² · ${r.floor}-qavat`;
  if (TG && TG.HapticFeedback) TG.HapticFeedback.selectionChanged();
}

function renderPanel() {
  if (!selected) return;
  const b = selected, r = b.roleData, lvl = G.lvl[b.id];
  const owner = G.owner[b.id];
  const tabs = [['info', "Ma'lumot"], ['rooms', 'Xonalar'], ['inside', "Ichki ko'rinish"]];
  const tabHtml = tabs.map(([k, t]) => `<button class="p-tab${panelTab === k ? ' on' : ''}" onclick="window.__tab('${k}')">${t}</button>`).join('');
  const headHtml = `
    <div class="p-head">
      <div class="p-icon">${ic(r.icon, 22)}</div>
      <div>
        <div class="p-title">${r.name}</div>
        <div class="p-sub">${b.levels} qavat · ${b.area} m² · <b>${lvl}-daraja</b>${owner !== undefined ? ` · <span style="color:${FACULTIES[owner].c}">${FACULTIES[owner].n}</span>` : ''}</div>
      </div>
      <button class="p-x" onclick="window.__close()">✕</button>
    </div>
    <div class="p-tabs">${tabHtml}</div>`;

  let body = '';
  if (panelTab === 'info') {
    const isBuilding = G.build && G.build.id === b.id;
    const needM = costMablag(lvl), needB = costBilim(lvl);
    const gated = r.key !== 'hq' && lvl >= gateLvl();
    const hqReq = r.key === 'hq' ? Math.round(14 * Math.pow(1.32, lvl - 1)) : 0;
    const hqGated = r.key === 'hq' && sumLevels() < hqReq;
    const afford = G.res.mablag >= needM && G.res.bilim >= needB;
    const prod = r.res === 'bilim' ? `+${prodRate(b).toFixed(1)} Bilim/s`
      : r.res === 'mablag' ? `+${(prodRate(b) * MABLAG_MULT).toFixed(1)} Mablag'/s`
        : r.res === 'energiya' ? `+${(prodRate(b) * 60).toFixed(1)} Energiya/daq` : 'Kampus yadrosi';
    const visited = !!G.visited[b.id];
    const FCTS = {
      main: 'Islom Karimov koʻchasi 49, Toshkent · 1931 · ~15 000 talaba',
      finance: 'Moliya instituti binosida · ~1969 · ~9 000 talaba',
    };
    body = `
    <p class="p-desc">${r.desc || 'Kampus yadrosi — darajasi boshqa binolar chegarasini belgilaydi.'}</p>
    <div class="kv"><span>Manzil</span><b>${FCTS[b.campus] || 'Toshkent'}</b></div>
    <div class="p-prod">${prod}</div>
    ${isBuilding ? `
      <div class="p-build">
        <div class="p-build-row"><span>Qurilish ketmoqda…</span><b id="p-timer">${fmtT((G.build.endsAt - Date.now()) / 1000)}</b></div>
        <div class="bar"><i id="p-bar" style="width:0%"></i></div>
        <button class="btn ghost btn-ic" onclick="window.__speed()">${ic('zap', 15)} Tezlashtirish — 5 Bilim / 5s</button>
      </div>` : `
      <div class="p-costs">
        <div class="${G.res.mablag >= needM ? '' : 'lack'}"><span class="cost-ic">${ic('banknote', 15)}</span>${fmt(needM)}</div>
        <div class="${G.res.bilim >= needB ? '' : 'lack'}"><span class="cost-ic">${ic('book', 15)}</span>${fmt(needB)}</div>
        <div><span class="cost-ic">${ic('clock', 15)}</span>${fmtT(buildTime(lvl))}</div>
      </div>
      <button class="btn ${!gated && !hqGated && afford ? '' : 'disabled'}" onclick="window.__upgrade(${b.id})">
        ${lvl >= CAP ? 'Maksimal daraja' : gated ? "Rektorat darajasini koʻtaring" : hqGated ? `Kamida ${hqReq} umumiy daraja kerak` : 'Yangilash'}
      </button>`}
    <div class="p-row">
      <button class="btn ghost" onclick="window.__checkin(${b.id})" ${visited ? 'disabled' : ''}>
        <span class="btn-ic-in">${ic('pin', 15)}</span> QR check-in ${visited ? '✓' : ''}
      </button>
      <button class="btn ghost" onclick="window.__claim(${b.id})"><span class="btn-ic-in">${ic('flag', 15)}</span> Egallash</button>
    </div>
    <div class="p-foot">Har daraja binoni <b>vertikal oʻsadi</b> · Egallangan bino +15% produksiya beradi.</div>`;
  } else if (panelTab === 'rooms') {
    const data = ensureInterior(b);
    let rows = '';
    for (let f = 1; f <= data.levels; f++) {
      const rooms = data.groups[f - 1].rooms;
      const names = rooms.slice(0, 4).map(m => m.userData.room.name).join(' · ');
      rows += `<div class="room-row"><b>${f}-qavat</b><span>${rooms.length} xona — ${names}${rooms.length > 4 ? ' …' : ''}</span></div>`;
    }
    body = `<div class="rooms-list">${rows}</div>
      <button class="btn btn-ic" style="margin-top:10px" onclick="window.__tab('inside')">${ic('map', 15)} Ichki koʻrinishda ochish</button>`;
  } else if (panelTab === 'inside') {
    const data = ensureInterior(b);
    let fb = '';
    for (let f = 1; f <= data.levels; f++) fb += `<button class="floor-btn${interior.floor === f ? ' on' : ''}" onclick="window.__setFloor(${f})">${f}</button>`;
    body = `
      <div class="floor-btns">${fb}</div>
      <div class="room-info" id="room-info">Xonani bosing — nomi va oʻlchami chiqadi.</div>
      <p class="hint" style="margin-top:8px">Tom va tashqi devorlar yashirilgan — dollhouse kesma. Devorlar oq, xonalar rang-barang.</p>
      <button class="btn ghost" onclick="window.__exitInterior()">Tashqi koʻrinishga qaytish</button>`;
  }

  $('#panel').innerHTML = headHtml + body;
}
window.__tab = function (t) {
  if (!selected) return;
  if (panelTab === 'inside' && t !== 'inside' && interior.active) exitInterior();
  panelTab = t;
  renderPanel();
  if (t === 'inside') showInteriorFloor(selected, interior.floor || 1);
};
window.__setFloor = function (f) {
  interior.floor = f;
  if (selected && panelTab === 'inside') {
    showInteriorFloor(selected, f);
    renderPanel();
    showInteriorFloor(selected, f);
  }
};
window.__exitInterior = function () {
  exitInterior();
  panelTab = 'info';
  renderPanel();
};

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
  toast(`${b.roleData.name} — ${G.lvl[b.id]}-daraja boʻldi`);
  save(); drawHud(); refreshLabel(b); if (selected) renderPanel();
}

/* ---------------------------------------------------------------- egallash usullari */
/* B) Fakultet urushi */
function seasonTick() {
  const now = Date.now();
  const week = Math.floor(now / (7 * 864e5));
  if (G.season.week !== week) { G.season.week = week; G.season.pts = [0, 0, 0, 0, 0]; }
  // raqib fakultetlar sekin oʻsadi (simulyatsiya)
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
  toast(`Check-in: ${byId(id).roleData.name} — +80 Bilim`);
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
  toast(`${b.roleData.name} — ${FACULTIES[G.faculty].n} fakulteti nazoratida`);
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
  $('#campus-name').textContent = (CPS.find(c => c.id === G.campus) || {}).name || 'Butun shahar';
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
  { q: "Talaba 240 000 soʻmdan 15% chegirma oldi. Qancha toʻlaydi?", a: ['204 000', '210 000', '196 000', '225 000'], c: 0 },
  { q: "Narx 20% oshdi, keyin 20% tushdi. Yakuniy narx dastlabkisidan:", a: ['teng', '4% arzon', '4% qimmat', '2% arzon'], c: 1 },
  { q: "3 prorab 9 kunda 1 binoni qursa, 9 prorab necha kunda?", a: ['1 kun', '3 kun', '6 kun', '9 kun'], c: 1 },
  { q: "600 talabadan 5/6 qismi sinovga kirdi. Nechtasi kirmadi?", a: ['80', '100', '120', '60'], c: 1 },
  { q: "Bino maydoni 300 m², 40% i maʻruza zali. Zal maydoni?", a: ['90 m²', '110 m²', '120 m²', '150 m²'], c: 2 },
  { q: "Yillik 12% omonat: 5 mln soʻm 1 yilda qancha daromad beradi?", a: ['500 000', '600 000', '720 000', '1 200 000'], c: 1 },
  { q: "Ketma-ketlik: 2, 6, 18, 54, ?", a: ['108', '162', '216', '126'], c: 1 },
  { q: "1 km² da 400 talaba. 0,25 km² da?", a: ['80', '100', '160', '200'], c: 1 },
  { q: "Talaba 4 fandan 3.0, 3.6, 4.2, 4.2 ball oldi. Oʻrtacha?", a: ['3.5', '3.75', '3.8', '4.0'], c: 1 },
  { q: "Universitet 1931-yilda tashkil etilgan. 2026-yilda necha yoshda?", a: ['90', '93', '95', '96'], c: 2 },
  { q: "Budjet 1,2 mlrd soʻm, 35% i taʻmirga. Taʻmirlash budjeti?", a: ['360 mln', '420 mln', '480 mln', '300 mln'], c: 1 },
  { q: "Bir talaba 1 daqiqada 3 savol yechadi. 15 talaba 20 daqiqada?", a: ['600', '900', '1200', '450'], c: 1 },
  { q: "Kapital 800 mln, xarajat 680 mln. Foyda marjasi?", a: ['10%', '12%', '15%', '18%'], c: 2 },
  { q: "2 ta bino 6 oyda qurildi. 6 ta bino necha oyda? (bir xil surʻat)", a: ['12', '18', '24', '36'], c: 1 },
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
  toast(`Bilim +${QZ.gainB} · Mablag' +${QZ.gainM} · ${QZ.correct}/${QZ.pool.length} toʻg'ri javob`);
  save(); drawHud();
}
$('#quiz-close').onclick = () => { $('#quiz').classList.remove('open'); clearInterval(QZ && QZ.timer); };

/* ---------------------------------------------------------------- Darvoza (1v1 duel) */
let DUEL = null;
function startDuel() {
  if (G.res.energiya < 1) return toast('Energiya yetmaydi');
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
    $('#d-log').textContent = ok ? 'Raqib to\'g\'ri javob berdi — 14 zarar!' : 'Raqib xato qildi';
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
    $('#d-log').textContent = `Toʻg'ri! Raqibga −${dmg} zarar`;
    if (TG && TG.HapticFeedback) TG.HapticFeedback.impactOccurred('medium');
  } else {
    DUEL.hpP -= 8;
    $('#d-hp-p').style.width = Math.max(0, DUEL.hpP) + '%';
    $('#d-hp-pv').textContent = Math.max(0, Math.round(DUEL.hpP));
    $('#d-log').textContent = 'Xato — 8 zarar sizga';
  }
  clearTimeout(DUEL.botTimer);
  setTimeout(() => { DUEL.i++; duelQ(); }, 800);
}
function duelEnd() {
  clearTimeout(DUEL && DUEL.botTimer); clearInterval(DUEL && DUEL.timer);
  const win = DUEL.hpO <= 0 && DUEL.hpP > 0;
  const draw = DUEL.hpO > 0 && DUEL.hpP > 0;
  if (win) { G.duelWin++; G.res.nufuz += 60; G.res.bilim += 60; addSeasonPts(25); toast('G\'alaba! +60 Nufuz, +25 mavsum ball'); }
  else if (draw) { G.res.bilim += 25; addSeasonPts(8); toast('Durang — +25 Bilim'); }
  else { G.duelLose++; addSeasonPts(4); toast('Mag\'lubiyat — keyingi safar omad!'); }
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
      <span class="pts">${ic('star', 14)} ${fmt(G.season.pts[i])}</span>
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
    <div class="ctrl-h">Nazorat roʻyxati (${ALL_B.filter(b => b.role).length} bino)</div>
    ${ctrl}
  ` + `
    <div class="season-note">
      Haftalik mavsum · egallangan binolar: <b>${owned}</b> · gʻalabalar: ${G.duelWin} · magʻlubiyatlar: ${G.duelLose}
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
/* landmark tugmalari — kamerani landmarkga uchirish */
const LM_FLY = {
  tashkent_city: { r: 640, theta: -0.72, phi: 0.66 },
  humo_arena:    { r: 300, theta: -1.15, phi: 0.58 },
  magic_city:    { r: 260, theta: 0.9,   phi: 0.55 },
  ice_city:      { r: 170, theta: -0.8,  phi: 0.52 },
};
/* universitetlar — kamerani universitetga uchirish */
(function buildUniGrid() {
  const uniGrid = document.getElementById('uni-grid');
  const list = (window.DISTRICTS && window.DISTRICTS.pois || []).filter(p => p.cat === 'university');
  if (!uniGrid || !list.length) return;
  for (const poi of list) {
    const btn = document.createElement('button');
    btn.className = 'lm-card';
    const b = document.createElement('b');
    b.textContent = poi.name.length > 36 ? poi.name.slice(0, 35) + '…' : poi.name;
    const span = document.createElement('span');
    span.textContent = 'Kampus binolariga yaqinlashish';
    btn.appendChild(b); btn.appendChild(span);
    btn.addEventListener('click', () => {
      window.__poiFly(poi.id);
      $('#campus').classList.remove('open');
      document.querySelectorAll('.nav button').forEach(x => x.classList.remove('on'));
      const nb = document.querySelector('.nav button[data-v="map"]');
      if (nb) nb.classList.add('on');
      toast(poi.name);
    });
    uniGrid.appendChild(btn);
  }
})();
document.querySelectorAll('.lm-card').forEach(btn => {
  btn.addEventListener('click', () => {
    const lms = (window.DISTRICTS && window.DISTRICTS.landmarks) || [];
    const lm = lms.find(l => l.id === btn.dataset.lm);
    if (!lm) return;
    const f = LM_FLY[lm.id] || { r: 380, theta: -0.8, phi: 0.55 };
    cam.txT = cam.tx = lm.x; cam.tzT = cam.tz = lm.z;
    cam.r = f.r; cam.theta = f.theta; cam.phi = f.phi;
    $('#campus').classList.remove('open');
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('on'));
    document.querySelector('.nav button[data-v="map"]').classList.add('on');
    toast(lm.name + ' — ' + (lm.sub || 'landmark'));
  });
});

document.querySelectorAll('.campus-card').forEach(el => {
  el.onclick = () => {
    const id = el.dataset.id;
    G.campus = id; save();
    flyTo(id); closePanel(); drawHud();
    $('#campus').classList.remove('open');
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('on'));
    document.querySelector('.nav button[data-v="map"]').classList.add('on');
    toast(id === 'all' ? 'Butun shahar — umumiy ko\'rinish' : CPS.find(c => c.id === id).name);
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

  /* tuman nomlari — ekranda doimiy oʻlcham */
  for (const sp of DIST_LABELS) {
    const d = camera.position.distanceTo(sp.position);
    sp.visible = cam.r > 1400;
    const w = Math.min(1500, Math.max(260, d * 0.085));
    sp.scale.set(w, w * 0.25, 1);
  }

  const far = cam.r > 3600;
  for (const L of labels) {
    if (L.landmark) {
      const wpos = L.sp.userData.world;
      const d = camera.position.distanceTo(_tmpV.set(wpos.x, wpos.y, wpos.z));
      L.sp.visible = d < 14000;
      const w = Math.min(430, Math.max(90, d * 0.052));
      L.sp.scale.set(w, w * 0.275, 1);
      continue;
    }
    L.sp.visible = !far;
    const grp = roleMeshes.get(L.b.id);
    if (!grp) continue;
    L.sp.position.y += (Math.max(L.b.h * grp.scale.y + 9, 13) - L.sp.position.y) * 0.12;
    const d = camera.position.distanceTo(L.sp.position);
    const w = Math.min(180, Math.max(14, d * 0.058));
    L.sp.scale.set(w, w / L.sp.userData.aspect, 1);
  }
  for (const A of landmarkAnims) A.obj.rotation[A.axis] += A.speed * 0.016;
  updateCars();
  /* bayroqlar shamolda */
  for (const f of flagMeshes) f.rotation.y = f.userData.base + Math.sin(t * 2.1 + f.userData.ph) * 0.22;
  /* fontan suv tomchilari */
  if (fountainWater) {
    fountainWater.material.opacity = 0.72 + 0.22 * Math.sin(t * 2.6);
    fountainWater.rotation.z += 0.008;
  }
  /* POI yorliqlari — masofa bo‘yicha */
  for (const P of POI_LABELS) {
    const d = camera.position.distanceTo(P.position);
    P.visible = d < 2600;
    const w = Math.min(110, Math.max(16, d * 0.075));
    P.scale.set(w, w * 0.258, 1);
  }
  /* egalik halqalari pulsatsiyasi */
  for (const b of ALL_B) {
    if (b.role && b.ring && G.owner[b.id] !== undefined) {
      b.ring.material.opacity = 0.35 + 0.2 * Math.sin(t * 2 + b.px);
    }
  }
  /* uzoqdan: barcha chunkʻlar oʻrniga bitta birlashtirilgan tom toʻplami (10x tez) */
  const farMode = cam.r > 5200;
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
  toast(`${nm}ush kelibsiz! Binoni bosing → Yangilash · QR check-in · Egallash`);
}, 900);

/* =====================================================================
   KAMPUS: TDIU — 3D isometric boshqaruv prototipi (vertical slice)
   Haqiqiy OSM konturlari + Clash of Clans uslubidagi upgrade sikli
   + Bilim (quiz) resurs sikli
   ===================================================================== */
'use strict';

const C = window.CAMPUS;
const TG = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
if (TG) { try { TG.ready(); TG.expand(); TG.setHeaderColor && TG.setHeaderColor('#0b1220'); } catch (e) {} }

const B = C.buildings;
const byId = id => B.find(b => b.id === id);

/* ---------------------------------------------------------------- rollar */
const ROLES = {
  149530194: { key: 'hq',        icon: '🏛', name: 'Rektorat',            res: null,       base: 0,   desc: 'Kampus yadrosi. Darajasi boshqa binolar chegarasini belgilaydi.' },
  149530198: { key: 'edu',       icon: '📘', name: "1-o'quv korpusi",     res: 'bilim',    base: 1.4, desc: "Ma'ruza zallari. Bilim ishlab chiqaradi (passiv)." },
  180776564: { key: 'money',     icon: '💰', name: "2-o'quv korpusi",     res: 'mablag',   base: 2.6, desc: "To'lov-kontrakt va tijorat markazi. Mablag' ishlab chiqaradi." },
  1154762660:{ key: 'flow',      icon: '🎓', name: 'Akademik litsey',     res: 'bilim',    base: 0.9, desc: "Litsey abituriyentlari oqimi: Bilim + Nufuz." },
  181413037: { key: 'energy',    icon: '⚡', name: 'Iqtisodiyot gimnaziyasi', res: 'energiya', base: 0.05, desc: 'Energiya (quiz urinishlari) qayta tiklaydi.' },
  149530196: { key: 'innovation',icon: '🚀', name: 'Ilmiy-innovatsiya markazi', res: 'mablag', base: 1.6, desc: 'Startap laboratoriyalar: Mablag\' + Bilim bonusu.' },
};
for (const b of B) {
  const r = ROLES[b.id];
  b.role = r ? r.key : null;
  b.roleData = r || null;
  b.neutral = !r;
}

/* ---------------------------------------------------------------- holat */
const START = { mablag: 400, bilim: 260, nufuz: 0, energiya: 5 };
const G = {
  v: 3,
  res: { ...START },
  lvl: {},                       // id -> daraja
  build: null,                   // { id, endsAt, fromH, toH }
  speedCost: 0,
  quizBest: 0,
  lvlCap: 10,
};
for (const b of B) if (b.role) G.lvl[b.id] = 1;

function load() {
  try {
    const s = JSON.parse(localStorage.getItem('tsue_campus_save') || 'null');
    if (s && s.v === G.v) {
      Object.assign(G, s);
      for (const b of B) if (b.role && !G.lvl[b.id]) G.lvl[b.id] = 1;
    }
  } catch (e) {}
}
function save() { try { localStorage.setItem('tsue_campus_save', JSON.stringify(G)); } catch (e) {} }
load();

/* iqtisod formulalari (balans uchun bitta joyda) */
const MABLAG_MULT = 6;                                            // balans: mablag' ishlab chiqarish koef.
const costMablag = (n) => Math.round(240 * Math.pow(1.55, n - 1));
const costBilim  = (n) => Math.round(40 * Math.pow(1.45, n - 1));
const buildTime  = (n) => Math.round(8 * Math.pow(1.9, n - 1));       // soniya
const prodRate   = (b) => (b.roleData.base * G.lvl[b.id]);
const sumLevels  = () => B.filter(b => b.role).reduce((a, b) => a + G.lvl[b.id], 0);

/* ---------------------------------------------------------------- three */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.setClearColor(0x0b1220, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x16283c, 760, 1900);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 1, 3000);

/* osmon gradienti (canvas texture — tashqi faylsiz) */
(function sky() {
  const cv = document.createElement('canvas'); cv.width = 4; cv.height = 256;
  const cx = cv.getContext('2d');
  const g = cx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#0c1a2d'); g.addColorStop(0.5, '#17304a'); g.addColorStop(1, '#28455f');
  cx.fillStyle = g; cx.fillRect(0, 0, 4, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  scene.background = tex;
})();

const hemi = new THREE.HemisphereLight(0xdcefff, 0x3d5570, 1.55);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d6, 2.0);
sun.position.set(-160, 260, 120);
scene.add(sun);
const fill = new THREE.DirectionalLight(0x88aaff, 0.45);
fill.position.set(180, 120, -200);
scene.add(fill);

/* --- poligon -> Shape (yerga yotqizilgan, z o'qi) --- */
function shapeFrom(pts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], -pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], -pts[i][1]);
  s.closePath();
  return s;
}
/* --- ekstruziya: pastdan h gacha --- */
function extrude(pts, h) {
  const geo = new THREE.ExtrudeGeometry(shapeFrom(pts), { depth: h, bevelEnabled: false, curveSegments: 1 });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

/* --- yer --- */
const GROUND_R = 1500;
const groundGeo = new THREE.CircleGeometry(GROUND_R, 72);
groundGeo.rotateX(-Math.PI / 2);
const ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ color: 0x3a5642 }));
ground.position.y = -0.4;
scene.add(ground);

/* kampus egalik chegarasi */
(function boundary() {
  const g1 = new THREE.RingGeometry(C.meta.radius - 2.5, C.meta.radius, 128);
  g1.rotateX(-Math.PI / 2);
  const m1 = new THREE.Mesh(g1, new THREE.MeshBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: 0.22, side: THREE.DoubleSide }));
  m1.position.y = 0.16; scene.add(m1);
})();

/* yashil / asfalt maydonlar */
const flatMat = {
  grass: new THREE.MeshLambertMaterial({ color: 0x4c7a52 }),
  pitch: new THREE.MeshLambertMaterial({ color: 0x578a5c }),
  ground: new THREE.MeshLambertMaterial({ color: 0x3b4652 }),
  pavement: new THREE.MeshLambertMaterial({ color: 0x51565f }),
  water: new THREE.MeshLambertMaterial({ color: 0x1e4a6b }),
};
for (const g of C.greens) {
  try {
    const geo = new THREE.ShapeGeometry(shapeFrom(g.pts));
    geo.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(geo, flatMat[g.kind] || flatMat.grass);
    m.position.y = 0.06 + Math.random() * 0.02;
    m.renderOrder = 1;
    scene.add(m);
  } catch (e) {}
}

/* yo'llar — ribbon */
function ribbon(pts, w) {
  const pos = [], idx = [];
  const hw = w / 2;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const a = pts[Math.max(0, i - 1)], b2 = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b2[0] - a[0], dz = b2[1] - a[1];
    const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
    const nx = -dz, nz = dx;
    pos.push(p[0] + nx * hw, 0.1, p[1] + nz * hw);
    pos.push(p[0] - nx * hw, 0.1, p[1] - nz * hw);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}
const roadMat = new THREE.MeshLambertMaterial({ color: 0x28303a, side: THREE.DoubleSide });
const pathMat = new THREE.MeshLambertMaterial({ color: 0x555c66, side: THREE.DoubleSide });
for (const r of C.roads) {
  if (r.pts.length < 2) continue;
  const m = new THREE.Mesh(ribbon(r.pts, r.w), r.w >= 5 ? roadMat : pathMat);
  m.renderOrder = 2;
  scene.add(m);
}

/* --- binolar --- */
const wallMat = {};
function matFor(color) {
  if (!wallMat[color]) wallMat[color] = new THREE.MeshLambertMaterial({ color: new THREE.Color(color) });
  return wallMat[color];
}
const roofMat = new THREE.MeshLambertMaterial({ color: 0x76818f });
const roofMatHi = new THREE.MeshLambertMaterial({ color: 0x9aa7b6 });

const pickables = [];
const buildingMeshes = new Map();

for (const b of B) {
  const geo = extrude(b.pts, b.h);
  const sideM = b.role ? matFor(b.color) : matFor(b.color);
  const mesh = new THREE.Mesh(geo, [roofMat, sideM]);
  mesh.userData.b = b;
  mesh.position.y = 0.1;
  scene.add(mesh);
  buildingMeshes.set(b.id, mesh);
  if (b.role) {
    pickables.push(mesh);
    /* kontur chizig'i — tanlanadigan binolar uchun */
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo, 30),
      new THREE.LineBasicMaterial({ color: 0x8ab4ff, transparent: true, opacity: 0.22 })
    );
    mesh.add(edges);
  }
}

/* tanlash halqasi */
const ringGeo = new THREE.RingGeometry(1, 1.05, 64);
ringGeo.rotateX(-Math.PI / 2);
const selRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x6ee7ff, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
selRing.visible = false;
scene.add(selRing);

/* daraxtlar (instanced) */
(function trees() {
  const N = 260;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35, 0.45, 3, 5), new THREE.MeshLambertMaterial({ color: 0x4a3a2a }), N);
  const crown = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.6, 0), new THREE.MeshLambertMaterial({ color: 0x3f7a44 }), N);
  const d = new THREE.Object3D();
  let n = 0;
  for (const g of C.greens) {
    if (g.kind.search(/grass|pitch/) < 0) continue;
    const cs = g.pts, cx = cs.reduce((a, p) => a + p[0], 0) / cs.length, cz = cs.reduce((a, p) => a + p[1], 0) / cs.length;
    let rad = 0; for (const p of cs) rad = Math.max(rad, Math.hypot(p[0] - cx, p[1] - cz));
    const k = Math.min(14, Math.max(1, Math.round(rad / 6)));
    for (let i = 0; i < k && n < N; i++) {
      const ang = Math.random() * Math.PI * 2, rr = Math.random() * rad * 0.8;
      const x = cx + Math.cos(ang) * rr, z = cz + Math.sin(ang) * rr;
      const s = 0.7 + Math.random() * 0.8;
      d.position.set(x, 1.5 * s, z); d.scale.setScalar(s); d.rotation.set(0, Math.random() * 6, 0); d.updateMatrix();
      trunk.setMatrixAt(n, d.matrix);
      d.position.y = 3.4 * s; d.updateMatrix();
      crown.setMatrixAt(n, d.matrix);
      n++;
    }
  }
  trunk.count = crown.count = n;
  trunk.instanceMatrix.needsUpdate = crown.instanceMatrix.needsUpdate = true;
  scene.add(trunk, crown);
})();


/* --- bino yorliqlari (sprite: ikonka + daraja) --- */
function labelTexture(icon, lvl, name) {
  const W = 320, H = 112, A = W / H;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  c.fillStyle = 'rgba(10,17,30,0.84)';
  c.strokeStyle = 'rgba(110,231,255,0.5)';
  c.lineWidth = 3;
  c.beginPath();
  if (c.roundRect) c.roundRect(4, 4, W - 8, H - 8, 26); else c.rect(4, 4, W - 8, H - 8);
  c.fill(); c.stroke();
  c.beginPath(); c.arc(52, 56, 24, 0, Math.PI * 2);
  c.fillStyle = 'rgba(110,231,255,0.95)'; c.fill();
  c.fillStyle = '#06131f';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = '800 30px system-ui, sans-serif';
  c.fillText(String(lvl), 52, 58);
  c.fillStyle = '#eaf4ff';
  c.textAlign = 'left';
  c.font = '700 26px system-ui, sans-serif';
  const short = name.length > 17 ? name.slice(0, 16) + '…' : name;
  c.fillText(short, 88, 58);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.userData = { aspect: A };
  return tex;
}
const labels = [];
for (const b of B) {
  if (!b.role) continue;
  const mat = new THREE.SpriteMaterial({ map: labelTexture(b.roleData.icon, G.lvl[b.id], b.roleData.name), transparent: true, depthTest: false, depthWrite: false });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(26, 26 / (320 / 112), 1);
  sp.userData.aspect = 320 / 112;
  sp.position.set(b.px, b.h + 10, b.pz);
  sp.renderOrder = 10;
  scene.add(sp);
  labels.push({ b, sp });
}
function refreshLabels() {
  for (const L of labels) {
    const old = L.sp.material.map;
    L.sp.material.map = labelTexture(L.b.roleData.icon, G.lvl[L.b.id], L.b.roleData.name);
    L.sp.material.needsUpdate = true;
    if (old) old.dispose();
  }
}

/* --- kamera boshqaruvi (o'z orbitasi) --- */
const FIT = (window.innerHeight > window.innerWidth ? 720 : 560);   // portret/landshaft moslashuvi
const cam = { theta: -0.72, phi: 0.84, r: FIT, tx: 0, tz: 0, txT: 0, tzT: 0 };
function applyCam() {
  cam.tx += (cam.txT - cam.tx) * 0.12;
  cam.tz += (cam.tzT - cam.tz) * 0.12;
  const y = Math.cos(cam.phi) * cam.r, rr = Math.sin(cam.phi) * cam.r;
  camera.position.set(cam.tx + Math.sin(cam.theta) * rr, y, cam.tz + Math.cos(cam.theta) * rr);
  camera.lookAt(cam.tx, 4, cam.tz);
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
  cam.phi = Math.min(1.36, Math.max(0.34, cam.phi - dy * 0.004));
});
canvas.addEventListener('pointerup', e => {
  if (drag && e.pointerId === drag.id) {
    if (moved < 9 && performance.now() - drag.t < 420) pick(e.clientX, e.clientY);
    drag = null;
  }
});
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  cam.r = Math.min(820, Math.max(70, cam.r * (1 + Math.sign(e.deltaY) * 0.09)));
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 2) {
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    if (pinch) cam.r = Math.min(820, Math.max(70, cam.r * (pinch / d)));
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
  if (hits.length) select(hits[0].object.userData.b);
  else { /* bo'sh joy: panel yopish */ closePanel(); }
}

/* ---------------------------------------------------------------- UI */
const $ = s => document.querySelector(s);
const fmt = n => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e4 ? Math.round(n / 1000) + 'k' : Math.round(n).toFixed(0);
const fmtT = s => { s = Math.max(0, Math.ceil(s)); return s >= 60 ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : s + 's'; };

let selected = null;
function select(b) {
  selected = b;
  const m = buildingMeshes.get(b.id);
  const r = Math.max(...b.pts.map(p => Math.hypot(p[0] - b.px, p[1] - b.pz))) + 6;
  selRing.position.set(b.px, 0.4, b.pz);
  selRing.scale.setScalar(r);
  selRing.visible = true;
  cam.txT = b.px; cam.tzT = b.pz;
  cam.r = Math.min(cam.r, Math.max(300, r * 3.4));
  if (TG && TG.HapticFeedback) TG.HapticFeedback.selectionChanged();
  renderPanel();
  $('#panel').classList.add('open');
}
function closePanel() { $('#panel').classList.remove('open'); selRing.visible = false; selected = null; }

function renderPanel() {
  if (!selected) return;
  const b = selected, r = b.roleData, lvl = G.lvl[b.id];
  const isBuilding = G.build && G.build.id === b.id;
  const canUp = lvl < G.lvlCap && !isBuilding;
  const needM = costMablag(lvl), needB = costBilim(lvl);
  const gateLvl = r.key === 'hq' ? null : Math.min(G.lvl[149530194] + 1, G.lvlCap);
  const gated = r.key !== 'hq' && lvl >= gateLvl;
  const hqReq = r.key === 'hq' ? Math.round(14 * Math.pow(1.32, lvl - 1)) : 0;
  const hqGated = r.key === 'hq' && sumLevels() < hqReq;
  const afford = G.res.mablag >= needM && G.res.bilim >= needB;

  let prod = '';
  if (r.res === 'bilim') prod = `+${(prodRate(b)).toFixed(1)} Bilim/s`;
  else if (r.res === 'mablag') prod = `+${(prodRate(b) * MABLAG_MULT).toFixed(1)} Mablag'/s`;
  else if (r.res === 'energiya') prod = `+${(prodRate(b) * 60).toFixed(1)} Energiya/daq`;
  else prod = `Nazorat markazi`;

  $('#panel').innerHTML = `
    <div class="p-head">
      <div class="p-icon">${r.icon}</div>
      <div>
        <div class="p-title">${r.name}</div>
        <div class="p-sub">${b.levels} qavat · ${b.area} m² · <b>${lvl}-daraja</b></div>
      </div>
      <button class="p-x" onclick="window.__close()">✕</button>
    </div>
    <p class="p-desc">${r.desc}</p>
    <div class="p-prod">${prod}</div>
    ${isBuilding ? `
      <div class="p-build">
        <div class="p-build-row"><span>Qurilish ketmoqda…</span><b id="p-timer">${fmtT((G.build.endsAt - Date.now()) / 1000)}</b></div>
        <div class="bar"><i id="p-bar" style="width:0%"></i></div>
        <button class="btn ghost" onclick="window.__speed()">⚡ Tezlashtirish — ${G.speedCost ? '' : ''}5 Bilim / 5s</button>
      </div>` : `
      <div class="p-costs">
        <div class="${G.res.mablag >= needM ? '' : 'lack'}">💰 ${fmt(needM)}</div>
        <div class="${G.res.bilim >= needB ? '' : 'lack'}">📘 ${fmt(needB)}</div>
        <div>⏱ ${fmtT(buildTime(lvl))}</div>
      </div>
      <button class="btn ${canUp && afford && !gated && !hqGated ? '' : 'disabled'}"
        onclick="window.__upgrade(${b.id})">
        ${lvl >= G.lvlCap ? 'Maksimal daraja' : gated ? `Rektorat darajasini ko'taring` : hqGated ? `Kamida ${hqReq} umumiy daraja kerak` : 'Yangilash'}
      </button>`}
    <div class="p-foot">Daraja oshgani sari bino <b>vertikal o'sadi</b> — har daraja +1 qavat.</div>
  `;
  const bar = $('#p-bar');
  if (bar && G.build) {
    const total = (G.build.endsAt - G.build.startedAt);
    bar.style.width = Math.min(100, ((Date.now() - G.build.startedAt) / total) * 100).toFixed(1) + '%';
  }
}
window.__close = closePanel;

window.__upgrade = function (id) {
  const b = byId(id), lvl = G.lvl[id], r = b.roleData;
  if (G.build) return toast('Prorab band — avval joriy qurilishni tugating');
  if (lvl >= G.lvlCap) return;
  if (r.key !== 'hq' && lvl >= Math.min(G.lvl[149530194] + 1, G.lvlCap)) return toast('Avval Rektoratni ko\'taring');
  if (r.key === 'hq' && sumLevels() < Math.round(14 * Math.pow(1.32, lvl - 1))) return toast('Kampusda umumiy daraja yetarli emas');
  const nm = costMablag(lvl), nb = costBilim(lvl);
  if (G.res.mablag < nm || G.res.bilim < nb) return toast('Resurs yetarli emas — Bilim sinovidan o\'ting');
  G.res.mablag -= nm; G.res.bilim -= nb;
  G.build = { id, startedAt: Date.now(), endsAt: Date.now() + buildTime(lvl) * 1000, toLvl: lvl + 1 };
  G.speedCost = 0;
  if (TG && TG.HapticFeedback) TG.HapticFeedback.impactOccurred('medium');
  save(); renderPanel(); draw();
};

window.__speed = function () {
  if (!G.build) return;
  const cost = 5;
  if (G.res.bilim < cost) return toast('5 Bilim kerak');
  G.res.bilim -= cost;
  G.build.endsAt -= 5000;
  save(); draw();
};

function finishBuild() {
  const b = byId(G.build.id);
  const mesh = buildingMeshes.get(b.id);
  G.lvl[b.id] = G.build.toLvl;
  G.build = null;
  G.res.nufuz += 25;
  if (TG && TG.HapticFeedback) TG.HapticFeedback.notificationOccurred('success');
  toast(`✅ ${b.roleData.name} — ${G.lvl[b.id]}-daraja!`);
  save(); draw(); refreshLabels(); if (selected) renderPanel(); pulse(mesh);
}

let pulseT = 0, pulseM = null;
function pulse(m) { pulseM = m; pulseT = 1; }

/* ---------------------------------------------------------------- HUD */
function draw() {
  $('#r-mablag').textContent = fmt(G.res.mablag);
  $('#r-bilim').textContent = fmt(G.res.bilim);
  $('#r-nufuz').textContent = fmt(G.res.nufuz);
  $('#r-energy').textContent = Math.floor(G.res.energiya) + '/5';
  $('#hq-lvl').textContent = G.lvl[149530194];
  const b = G.build;
  $('#queue').style.display = b ? 'flex' : 'none';
  if (b) {
    $('#q-name').textContent = byId(b.id).roleData.name + ' → ' + b.toLvl + '-daraja';
    $('#q-time').textContent = fmtT((b.endsAt - Date.now()) / 1000);
    $('#q-bar').style.width = Math.min(100, ((Date.now() - b.startedAt) / (b.endsAt - b.startedAt)) * 100) + '%';
  }
}

/* ---------------------------------------------------------------- resurs oqimi */
let last = performance.now();
function tick(now) {
  const dt = Math.min(0.25, (now - last) / 1000); last = now;
  const rate = { bilim: 0, mablag: 0, energiya: 0 };
  for (const b of B) {
    if (!b.role || !b.roleData.res) continue;
    if (G.build && G.build.id === b.id) continue;
    rate[b.roleData.res] += prodRate(b);
  }
  G.res.bilim += rate.bilim * dt;
  G.res.mablag += rate.mablag * dt * MABLAG_MULT;
  G.res.energiya = Math.min(5, G.res.energiya + rate.energiya * dt);
  if (G.res.energiya < 5) G.res.energiya = Math.min(5, G.res.energiya + dt / 25);
  if (G.build && Date.now() >= G.build.endsAt) finishBuild();
}

/* ---------------------------------------------------------------- Bilim sinovi (quiz) */
const QBANK = [
  { q: "Kampusda 1200 talaba bor. Ularning 45% i 1-kursda. Nechta 1-kurs talabasi?", a: ['480', '540', '600', '420'], c: 1 },
  { q: "Bino 12 qavatli, har qavat 4 m. Umumiy balandlik?", a: ['36 m', '44 m', '48 m', '52 m'], c: 2 },
  { q: "Talaba 240 000 so'mdan 15% chegirma oldi. Qancha to'laydi?", a: ['204 000', '210 000', '196 000', '225 000'], c: 0 },
  { q: "Narx 20% oshdi, keyin 20% tushdi. Yakuniy narx dastlabkisidan:", a: ['teng', '4% arzon', '4% qimmat', '2% arzon'], c: 1 },
  { q: "3 ta prorab 9 kunda 1 binoni qursa, 9 prorab necha kunda?", a: ['1 kun', '3 kun', '6 kun', '9 kun'], c: 1 },
  { q: "600 talabadan 5/6 qismi quizga kirdi. Nechtasi kirmadi?", a: ['80', '100', '120', '60'], c: 1 },
  { q: "Bino maydoni 300 m², 40% i ma'ruza zali. Zal maydoni?", a: ['90 m²', '110 m²', '120 m²', '150 m²'], c: 2 },
  { q: "Yillik 12% omonat: 5 mln so'm 1 yilda qancha foiz daromad beradi?", a: ['500 000', '600 000', '720 000', '1 200 000'], c: 1 },
  { q: "Ketma-ketlik: 2, 6, 18, 54, ?", a: ['108', '162', '216', '126'], c: 1 },
  { q: "1 km² da 400 talaba. 0,25 km² da?", a: ['80', '100', '160', '200'], c: 1 },
  { q: "Talaba 4 ta fandan 3.0, 3.6, 4.2, 4.2 ball oldi. O'rtacha?", a: ['3.5', '3.75', '3.8', '4.0'], c: 1 },
  { q: "Universitet 1931-yilda tashkil etilgan. 2026-yilda necha yoshda?", a: ['90', '93', '95', '96'], c: 2 },
  { q: "Budjet 1,2 mlrd so'm, 35% i ta'mirga. Ta'mirlash budjeti?", a: ['360 mln', '420 mln', '480 mln', '300 mln'], c: 1 },
  { q: "Bir talaba 1 daqiqada 3 savol yechadi. 15 talaba 20 daqiqada?", a: ['600', '900', '1200', '450'], c: 1 },
  { q: "Kapital 800 mln, xarajat 680 mln. Foyda marjasi?", a: ['10%', '12%', '15%', '18%'], c: 2 },
];

let QZ = null;
function startQuiz() {
  if (G.res.energiya < 1) return toast('Energiya yo\'q — gimnaziya darajasini oshiring');
  G.res.energiya -= 1;
  const pool = [...QBANK].sort(() => Math.random() - 0.5).slice(0, 8);
  QZ = { i: 0, pool, combo: 0, correct: 0, gainB: 0, gainM: 0, t0: 0, timer: null };
  $('#quiz').classList.add('open');
  nextQ();
  save(); draw();
}
function nextQ() {
  clearTimeout(QZ.timer);
  if (QZ.i >= QZ.pool.length) return endQuiz();
  const q = QZ.pool[QZ.i];
  QZ.left = 15.0;
  $('#q-count').textContent = `${QZ.i + 1}/${QZ.pool.length}`;
  $('#q-combo').textContent = QZ.combo > 1 ? `x${QZ.combo} combo` : '';
  $('#q-text').textContent = q.q;
  $('#q-opts').innerHTML = q.a.map((t, i) => `<button class="opt" data-i="${i}">${t}</button>`).join('');
  document.querySelectorAll('.opt').forEach(el => el.onclick = () => answer(parseInt(el.dataset.i, 10)));
  clearInterval(QZ.timer);
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
    const gb = Math.round(12 * (1 + speed) * Math.min(4, QZ.combo));
    const gm = Math.round(20 * (1 + speed) * Math.min(4, QZ.combo));
    QZ.gainB += gb; QZ.gainM += gm;
    if (TG && TG.HapticFeedback) TG.HapticFeedback.impactOccurred('light');
  } else {
    QZ.combo = 0;
    if (TG && TG.HapticFeedback) TG.HapticFeedback.notificationOccurred('error');
  }
  document.querySelectorAll('.opt').forEach(el => {
    const i = parseInt(el.dataset.i, 10);
    if (i === q.c) el.classList.add('good');
    else if (i === chosen) el.classList.add('bad');
    el.disabled = true;
  });
  setTimeout(() => { QZ.i++; nextQ(); }, 620);
}
function endQuiz() {
  G.res.bilim += QZ.gainB;
  G.res.mablag += QZ.gainM;
  G.res.nufuz += QZ.correct * 4;
  G.quizBest = Math.max(G.quizBest, QZ.correct);
  $('#quiz').classList.remove('open');
  toast(`📘 +${QZ.gainB} Bilim · 💰 +${QZ.gainM} Mablag' · ${QZ.correct}/${QZ.pool.length} to'g'ri`);
  save(); draw();
}
$('#quiz-close').onclick = () => { $('#quiz').classList.remove('open'); clearInterval(QZ && QZ.timer); };

/* ---------------------------------------------------------------- toast */
let toastT = null;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2400);
}

/* ---------------------------------------------------------------- nav */
document.querySelectorAll('.nav button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.nav button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const v = btn.dataset.v;
    if (v === 'quiz') startQuiz();
    if (v === 'rank') showRank();
    if (v === 'map') { cam.txT = 0; cam.tzT = 0; cam.r = 520; closePanel(); toast('Kampus umumiy ko\'rinishi'); }
  };
});

function showRank() {
  const rows = [
    ['1', 'Iqtisodiyot fakulteti', 4820], ['2', 'Moliya fakulteti', 4410],
    ['3', 'Siz (Telegram)', Math.round(G.res.nufuz)], ['4', 'Biznes maktabi', 1980],
    ['5', 'Xalqaro dasturlar', 1620],
  ].sort((a, b) => b[2] - a[2]);
  $('#rank-list').innerHTML = rows.map((r, i) =>
    `<div class="rank-row ${r[1].indexOf('Siz') === 0 ? 'me' : ''}"><span>${i + 1}</span><b>${r[1]}</b><span>⭐ ${fmt(r[2])}</span></div>`).join('');
  $('#rank').classList.add('open');
}
$('#rank-close').onclick = () => $('#rank').classList.remove('open');

/* ---------------------------------------------------------------- render loop */
let t = 0;
function loop(now) {
  requestAnimationFrame(loop);
  tick(now);
  t += 0.016;
  /* kamera */
  applyCam();
  /* selektor halqasi pulsatsiyasi */
  if (selRing.visible) selRing.material.opacity = 0.55 + 0.35 * Math.sin(t * 3);
  /* bino o'sishi (vertikal progress) */
  for (const b of B) {
    if (!b.role) continue;
    const m = buildingMeshes.get(b.id);
    let target = G.lvl[b.id];
    if (G.build && G.build.id === b.id) {
      const p = Math.min(1, (Date.now() - G.build.startedAt) / (G.build.endsAt - G.build.startedAt));
      target = G.lvl[b.id] + p * 0.999;
    }
    const scaleY = Math.max(0.3, Math.pow(target / Math.max(1, b.levels), 0.55));
    m.scale.y += (scaleY - m.scale.y) * 0.09;
  }
  for (const L of labels) {
    const m = buildingMeshes.get(L.b.id);
    L.sp.position.y += (Math.max(L.b.h * m.scale.y + 9, 12) - L.sp.position.y) * 0.12;
    /* ekran o'lchami doimiy: masofaga qarab masshtab */
    const d = camera.position.distanceTo(L.sp.position);
    const w = Math.min(120, Math.max(16, d * 0.055));
    L.sp.scale.set(w, w / L.sp.userData.aspect, 1);
  }
  if (pulseM && pulseT > 0) {
    pulseT -= 0.02;
    pulseM.material[1].emissive = new THREE.Color(0x1b3a2a).multiplyScalar(Math.max(0, pulseT));
  }
  draw();
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});

/* panel ichidagi jonli taymer */
setInterval(() => {
  if (!selected || !G.build || G.build.id !== selected.id) return;
  const el = document.getElementById('p-timer'), bar = document.getElementById('p-bar');
  if (el) el.textContent = fmtT((G.build.endsAt - Date.now()) / 1000);
  if (bar) bar.style.width = Math.min(100, ((Date.now() - G.build.startedAt) / (G.build.endsAt - G.build.startedAt)) * 100) + '%';
}, 200);

/* birinchi yuklashda maslahat */
setTimeout(() => {
  if (!localStorage.getItem('tsue_seen')) {
    toast('Binoni bosing → Yangilash. Bilim sinovi orqali resurs yig\'ing 📘');
    localStorage.setItem('tsue_seen', '1');
  }
}, 900);
draw();

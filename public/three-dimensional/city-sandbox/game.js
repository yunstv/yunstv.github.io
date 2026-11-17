// 灰港 Greyport —— 原创开放世界小 demo（three.js，无外部素材，全部程序生成）
import * as THREE from './vendor/three.module.min.js';

/* ───────────── 基础工具 ───────────── */
let seed = 20261118;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rr = (a, b) => a + (b - a) * rnd();
const ri = (a, b) => Math.floor(rr(a, b + 1));
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const wrapPi = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
const $ = id => document.getElementById(id);

/* ───────────── 城市尺寸 ───────────── */
const N = 6;            // 街区数 N×N
const P = 76;           // 路中心间距
const ROAD = 7;         // 路半宽
const H = N * P / 2;    // 最外圈路中心
const E = H + ROAD + 4; // 岛的边界
const BLOCK = P / 2 - ROAD; // 街区半宽 31
const roadC = i => -H + i * P;
const nearRoad = v => roadC(clamp(Math.round((v + H) / P), 0, N));
const PARK = [2, 3];

/* ───────────── 渲染器 ───────────── */
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8f9aa6);
scene.fog = new THREE.FogExp2(0x8f9aa6, 0.0030);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.3, 1400);

const hemi = new THREE.HemisphereLight(0xcfd8e6, 0x3a3835, 1.2);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dd, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 10, far: 420 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.06;
scene.add(sun, sun.target);

/* ───────────── 合并几何的小工具 ───────────── */
class Buf {
  constructor() { this.p = []; this.n = []; this.u = []; this.i = []; }
  quad(a, b, c, d, n, uv) {
    // 保证绕序朝向 n
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    const flip = cx * n[0] + cy * n[1] + cz * n[2] < 0;
    const k = this.p.length / 3;
    this.p.push(...a, ...b, ...c, ...d);
    for (let j = 0; j < 4; j++) this.n.push(...n);
    this.u.push(...(uv || [0, 0, 1, 0, 1, 1, 0, 1]));
    if (flip) this.i.push(k, k + 2, k + 1, k, k + 3, k + 2); else this.i.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  // 盒子：sides → this，top → topBuf（可同一个）。us/vs 为每米 UV
  box(cx, y0, cz, w, h, d, topBuf, us = 1, vs = 1, uo = 0) {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2, y1 = y0 + h;
    const V = h * vs;
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], [uo, 0, uo + w * us, 0, uo + w * us, V, uo, V]);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], [uo, 0, uo + w * us, 0, uo + w * us, V, uo, V]);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], [uo, 0, uo + d * us, 0, uo + d * us, V, uo, V]);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], [uo, 0, uo + d * us, 0, uo + d * us, V, uo, V]);
    (topBuf || this).quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], [0, 0, w * us, 0, w * us, d * us, 0, d * us]);
  }
  flat(cx, cz, w, d, y) { // 贴地矩形
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    this.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0]);
  }
  mesh(mat, shadow = 0) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setIndex(this.i);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = !!(shadow & 1); m.receiveShadow = !!(shadow & 2);
    scene.add(m);
    return m;
  }
}

/* ───────────── 程序贴图 ───────────── */
function canvasTex(size, draw, repeat = true) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function facade(wall, glass, padX, padY, litRate) {
  const lit = [];
  for (let k = 0; k < 64; k++) lit.push(rnd() < litRate ? pick(['#ffd592', '#ffe6b8', '#d6e6ff', '#ffc978']) : null);
  const map = canvasTex(512, (g, s) => {
    g.fillStyle = wall; g.fillRect(0, 0, s, s);
    for (let k = 0; k < 2600; k++) { g.fillStyle = `rgba(${rnd() < .5 ? '0,0,0' : '255,255,255'},${rr(.02, .07)})`; g.fillRect(rnd() * s, rnd() * s, rr(1, 5), rr(1, 3)); }
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const gr = g.createLinearGradient(0, y * 64, 0, y * 64 + 64);
      gr.addColorStop(0, glass[0]); gr.addColorStop(1, glass[1]);
      g.fillStyle = gr; g.fillRect(x * 64 + padX, y * 64 + padY, 64 - padX * 2, 64 - padY * 2);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x * 64 + padX, y * 64 + 64 - padY, 64 - padX * 2, 3);
    }
  });
  const emis = canvasTex(512, (g, s) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const c = lit[y * 8 + x]; if (!c) continue;
      g.fillStyle = c; g.globalAlpha = rr(.55, 1); g.fillRect(x * 64 + padX, y * 64 + padY, 64 - padX * 2, 64 - padY * 2);
    }
    g.globalAlpha = 1;
  });
  return new THREE.MeshStandardMaterial({ map, emissiveMap: emis, emissive: 0xffffff, emissiveIntensity: 0.2, roughness: 0.88, metalness: 0.05 });
}
const facadeMats = [
  facade('#6d5346', ['#2a3441', '#161c24'], 16, 13, .30),  // 砖楼
  facade('#7d7f80', ['#33414d', '#1a222b'], 13, 15, .34),  // 混凝土
  facade('#3b4650', ['#4a6272', '#22303b'], 4, 5, .42),    // 玻璃幕墙
  facade('#8a7a63', ['#2c3238', '#15191d'], 18, 11, .26),  // 旧公寓
];
const asphaltTex = canvasTex(256, (g, s) => {
  g.fillStyle = '#34363a'; g.fillRect(0, 0, s, s);
  for (let k = 0; k < 5000; k++) { const v = ri(30, 75); g.fillStyle = `rgba(${v},${v},${v + 3},.5)`; g.fillRect(rnd() * s, rnd() * s, 2, 2); }
  for (let k = 0; k < 14; k++) { g.strokeStyle = 'rgba(15,15,16,.5)'; g.lineWidth = rr(.5, 1.5); g.beginPath(); let x = rnd() * s, y = rnd() * s; g.moveTo(x, y); for (let q = 0; q < 6; q++) { x += rr(-22, 22); y += rr(-22, 22); g.lineTo(x, y); } g.stroke(); }
});
asphaltTex.repeat.set(2 * E / 14, 2 * E / 14);
const paveTex = canvasTex(128, (g, s) => {
  g.fillStyle = '#8b8c8a'; g.fillRect(0, 0, s, s);
  for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(0,0,0,${rr(.02, .08)})`; g.fillRect(rnd() * s, rnd() * s, 3, 3); }
  g.strokeStyle = 'rgba(40,40,40,.55)'; g.lineWidth = 2; g.strokeRect(0, 0, s, s); g.strokeRect(0, 0, s / 2, s / 2); g.strokeRect(s / 2, s / 2, s / 2, s / 2);
});

/* ───────────── 造城 ───────────── */
const boxes = [];   // 碰撞盒 {x0,x1,z0,z1,h}
const lampPos = [];
{
  // 岛体 + 海
  const island = new THREE.Mesh(new THREE.BoxGeometry(2 * E, 4, 2 * E), new THREE.MeshLambertMaterial({ map: asphaltTex }));
  island.position.y = -2; island.receiveShadow = true; scene.add(island);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ color: 0x24333d, roughness: 0.35, metalness: 0.4 }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -2.6; scene.add(sea);

  const pave = new Buf(), grass = new Buf(), marks = new Buf(), roofs = new Buf(), rail = new Buf();
  const fb = facadeMats.map(() => new Buf());
  const SW = 0.12;

  const addBuilding = (cx, cz, w, d, h) => {
    w = Math.max(6, Math.round(w / 3) * 3); d = Math.max(6, Math.round(d / 3) * 3); h = Math.max(2, Math.round(h / 3.2)) * 3.2;
    const k = ri(0, facadeMats.length - 1);
    fb[k].box(cx, SW, cz, w, h, d, roofs, 1 / 24, 1 / 25.6, ri(0, 7) / 8);
    boxes.push({ x0: cx - w / 2, x1: cx + w / 2, z0: cz - d / 2, z1: cz + d / 2, h: h + SW });
    // 屋顶小机房
    if (h > 20 && rnd() < .7) roofs.box(cx + rr(-w / 5, w / 5), h + SW, cz + rr(-d / 5, d / 5), w * .3, rr(2, 4), d * .3, roofs);
  };

  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    const bx = roadC(i) + P / 2, bz = roadC(j) + P / 2;
    pave.box(bx, 0, bz, BLOCK * 2, SW, BLOCK * 2, pave, 1 / 4, 1 / 4);
    // 路灯：四角 + 四边中点
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]) lampPos.push([bx + sx * (BLOCK - 1.2), bz + sz * (BLOCK - 1.2)]);
    if (i === PARK[0] && j === PARK[1]) { grass.flat(bx, bz, 52, 52, SW + 0.02); continue; }
    const dc = Math.hypot(bx, bz) / (H * 1.2);           // 离市中心
    const tall = () => 9 + rr(0, 16) + Math.pow(1 - clamp(dc, 0, 1), 2) * rr(10, 95);
    const L = 26.5, lay = rnd();
    if (lay < .22) addBuilding(bx, bz, rr(34, 48), rr(34, 48), tall() * 1.25);
    else if (lay < .5) { const a = rnd() < .5; for (const s of [-1, 1]) a ? addBuilding(bx + s * 14, bz, rr(19, 24), rr(40, 51), tall()) : addBuilding(bx, bz + s * 14, rr(40, 51), rr(19, 24), tall()); }
    else for (const sx of [-1, 1]) for (const sz of [-1, 1]) { if (rnd() < .08) continue; addBuilding(bx + sx * L / 2, bz + sz * L / 2, rr(15, 24), rr(15, 24), tall()); }
  }
  // 外圈人行道 + 栏杆
  for (const s of [-1, 1]) {
    pave.box(s * (E - 2), 0, 0, 4, SW, 2 * E, pave, 1 / 4, 1 / 4); pave.box(0, 0, s * (E - 2), 2 * E - 8, SW, 4, pave, 1 / 4, 1 / 4);
    rail.box(s * (E - .2), SW, 0, .25, 1.0, 2 * E, rail); rail.box(0, SW, s * (E - .2), 2 * E, 1.0, .25, rail);
  }
  // 路面标线
  for (let i = 0; i <= N; i++) {
    const c = roadC(i);
    for (let s = -H + 3; s < H; s += 7) {
      if (Math.abs(s + 1.5 - nearRoad(s + 1.5)) < ROAD + 4) continue;
      marks.flat(c, s + 1.5, .22, 3, .03); marks.flat(s + 1.5, c, 3, .22, .03);
    }
    for (let j = 0; j <= N; j++) {               // 斑马线
      const cz = roadC(j);
      for (const sd of [-1, 1]) for (let k = -4; k <= 4; k++) {
        marks.flat(c + k * 1.4, cz + sd * (ROAD + 1.6), .6, 2.6, .03);
        marks.flat(c + sd * (ROAD + 1.6), cz + k * 1.4, 2.6, .6, .03);
      }
    }
  }
  pave.mesh(new THREE.MeshLambertMaterial({ map: paveTex }), 2);
  grass.mesh(new THREE.MeshLambertMaterial({ color: 0x4f6a3e }), 2);
  marks.mesh(new THREE.MeshBasicMaterial({ color: 0xb9b6a8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  roofs.mesh(new THREE.MeshLambertMaterial({ color: 0x45474a }), 3);
  rail.mesh(new THREE.MeshLambertMaterial({ color: 0x55585c }), 1);
  fb.forEach((b, k) => b.mesh(facadeMats[k], 3));

  // 公园的树
  const pbx = roadC(PARK[0]) + P / 2, pbz = roadC(PARK[1]) + P / 2, NT = 34;
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.22, .3, 3, 6), new THREE.MeshLambertMaterial({ color: 0x4a3a2c }), NT);
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(2.4, 1), new THREE.MeshLambertMaterial({ color: 0x3f5c33, flatShading: true }), NT);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let k = 0; k < NT; k++) {
    const x = pbx + rr(-24, 24), z = pbz + rr(-24, 24), s = rr(.8, 1.4);
    trunks.setMatrixAt(k, m4.compose(new THREE.Vector3(x, 1.5 * s, z), q, new THREE.Vector3(s, s, s)));
    crowns.setMatrixAt(k, m4.compose(new THREE.Vector3(x, 3 * s + 1.4 * s, z), q.setFromEuler(new THREE.Euler(0, rnd() * 6, 0)), new THREE.Vector3(s, s * rr(.8, 1.1), s)));
    boxes.push({ x0: x - .35, x1: x + .35, z0: z - .35, z1: z + .35, h: 3 });
  }
  trunks.castShadow = crowns.castShadow = true; scene.add(trunks, crowns);
}

// 路灯（实例化）+ 夜里的地面光斑
const bulbMat = new THREE.MeshBasicMaterial({ color: 0x555555 });
const poolMat = new THREE.MeshBasicMaterial({
  map: canvasTex(128, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,210,140,1)'); gr.addColorStop(.5, 'rgba(255,190,110,.35)'); gr.addColorStop(1, 'rgba(255,180,100,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); }, false),
  transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
});
{
  const n = lampPos.length;
  const poles = new THREE.InstancedMesh(new THREE.CylinderGeometry(.07, .1, 6, 5), new THREE.MeshLambertMaterial({ color: 0x2a2c2e }), n);
  const bulbs = new THREE.InstancedMesh(new THREE.BoxGeometry(.5, .16, .5), bulbMat, n);
  const pg = new THREE.PlaneGeometry(20, 20); pg.rotateX(-Math.PI / 2);
  const pools = new THREE.InstancedMesh(pg, poolMat, n);
  const m4 = new THREE.Matrix4();
  lampPos.forEach(([x, z], k) => {
    poles.setMatrixAt(k, m4.makeTranslation(x, 3.1, z));
    bulbs.setMatrixAt(k, m4.makeTranslation(x, 6.15, z));
    pools.setMatrixAt(k, m4.makeTranslation(x, .17, z));
  });
  pools.renderOrder = 2;
  scene.add(poles, bulbs, pools);
}

/* ───────────── 碰撞 ───────────── */
function resolveCircle(p, r) {  // p:{x,z}，返回法线或 null
  let hit = null;
  for (let k = 0; k < boxes.length; k++) {
    const b = boxes[k];
    if (p.x < b.x0 - r || p.x > b.x1 + r || p.z < b.z0 - r || p.z > b.z1 + r) continue;
    const cx = clamp(p.x, b.x0, b.x1), cz = clamp(p.z, b.z0, b.z1);
    let dx = p.x - cx, dz = p.z - cz; const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) { const d = Math.sqrt(d2); dx /= d; dz /= d; p.x = cx + dx * r; p.z = cz + dz * r; hit = { x: dx, z: dz }; }
    else { // 圆心在盒子里：从最近的边推出去
      const l = p.x - b.x0, rgt = b.x1 - p.x, f = p.z - b.z0, bk = b.z1 - p.z, m = Math.min(l, rgt, f, bk);
      if (m === l) { p.x = b.x0 - r; hit = { x: -1, z: 0 }; } else if (m === rgt) { p.x = b.x1 + r; hit = { x: 1, z: 0 }; }
      else if (m === f) { p.z = b.z0 - r; hit = { x: 0, z: -1 }; } else { p.z = b.z1 + r; hit = { x: 0, z: 1 }; }
    }
  }
  const lim = E - .4 - r;
  if (p.x > lim) { p.x = lim; hit = { x: -1, z: 0 }; } else if (p.x < -lim) { p.x = -lim; hit = { x: 1, z: 0 }; }
  if (p.z > lim) { p.z = lim; hit = { x: 0, z: -1 }; } else if (p.z < -lim) { p.z = -lim; hit = { x: 0, z: 1 }; }
  return hit;
}
const onBlock = (x, z) => Math.abs(x - nearRoad(x)) > ROAD && Math.abs(z - nearRoad(z)) > ROAD;
const groundY = (x, z) => onBlock(x, z) ? 0.12 : 0;

/* ───────────── 小人 ───────────── */
const figGeo = (() => {
  const g = {
    torso: new THREE.BoxGeometry(.5, .66, .28), head: new THREE.BoxGeometry(.27, .29, .27),
    leg: new THREE.BoxGeometry(.2, .9, .22), arm: new THREE.BoxGeometry(.14, .62, .16), hair: new THREE.BoxGeometry(.29, .1, .29),
  };
  g.leg.translate(0, -.45, 0); g.arm.translate(0, -.29, 0);
  return g;
})();
const lam = {}; const L = c => lam[c] || (lam[c] = new THREE.MeshLambertMaterial({ color: c }));
function makeFigure(shirt, pants, skin, hair) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const add = (geo, mat, x, y, z, parent = body) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  add(figGeo.torso, L(shirt), 0, 1.23, 0); add(figGeo.head, L(skin), 0, 1.72, 0); add(figGeo.hair, L(hair), 0, 1.88, 0);
  g.userData = {
    body,
    legL: add(figGeo.leg, L(pants), -.13, .9, 0), legR: add(figGeo.leg, L(pants), .13, .9, 0),
    armL: add(figGeo.arm, L(shirt), -.33, 1.53, 0), armR: add(figGeo.arm, L(shirt), .33, 1.53, 0), ph: rnd() * 6,
  };
  scene.add(g);
  return g;
}
function animFigure(g, speed, dt) {
  const u = g.userData; u.ph += speed * dt * 2.6;
  const a = Math.sin(u.ph) * clamp(speed / 3, 0, 1) * .75;
  u.legL.rotation.x = a; u.legR.rotation.x = -a; u.armL.rotation.x = -a * .8; u.armR.rotation.x = a * .8;
}

/* ───────────── 车 ───────────── */
const carGeo = {
  body: new THREE.BoxGeometry(1.9, .55, 4.4), cabin: new THREE.BoxGeometry(1.62, .52, 2.1), van: new THREE.BoxGeometry(1.86, .95, 3.0),
  wheel: new THREE.CylinderGeometry(.36, .36, .28, 12).rotateZ(Math.PI / 2), light: new THREE.BoxGeometry(.42, .16, .06), bar: new THREE.BoxGeometry(.5, .14, .3),
};
const glassMat = new THREE.MeshStandardMaterial({ color: 0x1c252d, roughness: .2, metalness: .1 });
const tyreMat = L(0x141414);
const headMat = new THREE.MeshBasicMaterial({ color: 0xfff3cf }), tailMat = new THREE.MeshBasicMaterial({ color: 0x5c0c07 }), brakeMat = new THREE.MeshBasicMaterial({ color: 0xff3a22 });
const barR = new THREE.MeshBasicMaterial({ color: 0x551111 }), barB = new THREE.MeshBasicMaterial({ color: 0x111a55 });
const paints = [0x7c2a25, 0x2d4257, 0x8d8f91, 0x1d1f22, 0xb9b3a3, 0x40513d, 0x6b5a3c, 0x9a6a2a, 0x2a3d4a, 0xd0d2d4];
const paintMat = {}; const PM = c => paintMat[c] || (paintMat[c] = new THREE.MeshStandardMaterial({ color: c, roughness: .42, metalness: .12 }));
const cars = [];
function makeCar(x, z, h, kind = 'sedan') {
  const g = new THREE.Group();
  const add = (geo, mat, px, py, pz, sh = false) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = sh; g.add(m); return m; };
  const color = kind === 'police' ? 0xe6e8ea : kind === 'cab' ? 0xc79a1e : pick(paints);
  add(carGeo.body, PM(color), 0, .62, 0, true);
  if (kind === 'van') add(carGeo.van, PM(color), 0, 1.32, -.6, true); else add(carGeo.cabin, glassMat, 0, 1.14, -.25, true);
  if (kind === 'van') add(carGeo.cabin, glassMat, 0, 1.1, 1.0).scale.set(1.1, .9, .5);
  const wheels = [[-.93, 1.42], [.93, 1.42], [-.93, -1.42], [.93, -1.42]].map(([wx, wz]) => add(carGeo.wheel, tyreMat, wx, .36, wz));
  add(carGeo.light, headMat, -.62, .7, 2.21); add(carGeo.light, headMat, .62, .7, 2.21);
  const tails = [add(carGeo.light, tailMat, -.62, .72, -2.21), add(carGeo.light, tailMat, .62, .72, -2.21)];
  let bars = null;
  if (kind === 'police') { add(carGeo.body, PM(0x1b2740), 0, .63, 0).scale.set(1.01, .5, .5); bars = [add(carGeo.bar, barR.clone(), -.3, 1.48, -.25), add(carGeo.bar, barB.clone(), .3, 1.48, -.25)]; }
  if (kind === 'cab') add(carGeo.bar, headMat, 0, 1.47, -.25).scale.set(.8, 1, .7);
  scene.add(g);
  const c = { g, kind, x, z, h, vx: 0, vz: 0, steer: 0, mode: 'parked', s: 0, kx: 0, kz: 0, wheels, tails, bars, maxV: kind === 'van' ? 30 : kind === 'police' ? 37 : 41, stuck: 0, roll: 0 };
  cars.push(c);
  return c;
}
const fwd = h => [Math.sin(h), Math.cos(h)];

// 交通 AI：沿格子路网右侧行驶
const LANE = 3.3, TURN = 10.5;
function aiTarget(c) {
  const nx = roadC(c.ni), nz = roadC(c.nj), [dx, dz] = c.dir;
  if (c.phase === 0) return [nx - dx * TURN - dz * LANE, nz - dz * TURN + dx * LANE];
  const [ex, ez] = c.nd; return [nx + ex * TURN - ez * LANE, nz + ez * TURN + ex * LANE];
}
function aiPickNext(c) {
  const [dx, dz] = c.dir, opts = [];
  for (const d of [[dx, dz], [dx, dz], [dz, -dx], [-dz, dx]]) { const i = c.ni + d[0], j = c.nj + d[1]; if (i >= 0 && i <= N && j >= 0 && j <= N) opts.push(d); }
  c.nd = opts.length ? pick(opts) : [-dx, -dz];
}
function spawnTraffic(kind) {
  for (let tries = 0; tries < 50; tries++) {
    const d = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), i = ri(0, N), j = ri(0, N), pi = i - d[0], pj = j - d[1];
    if (pi < 0 || pi > N || pj < 0 || pj > N) continue;
    const t = rr(.25, .75), x = lerp(roadC(pi), roadC(i), t) - d[1] * LANE, z = lerp(roadC(pj), roadC(j), t) + d[0] * LANE;
    if (cars.some(o => Math.hypot(o.x - x, o.z - z) < 12)) continue;
    const c = makeCar(x, z, Math.atan2(d[0], d[1]), kind);
    Object.assign(c, { mode: 'ai', ni: i, nj: j, dir: d, phase: 0, cruise: rr(8, 12), s: 8 });
    return c;
  }
}
for (let k = 0; k < 18; k++) spawnTraffic(rnd() < .2 ? 'cab' : rnd() < .2 ? 'van' : 'sedan');
// 路边停着的车
for (let k = 0; k < 16; k++) {
  const vert = rnd() < .5, i = ri(0, N), j = ri(0, N - 1), side = rnd() < .5 ? 1 : -1;
  const along = roadC(j) + P / 2 + rr(-18, 18), off = roadC(i) + side * 5.75;
  const x = vert ? off : along, z = vert ? along : off;
  if (cars.some(o => Math.hypot(o.x - x, o.z - z) < 7)) continue;
  makeCar(x, z, vert ? (side < 0 ? 0 : Math.PI) : (side > 0 ? Math.PI / 2 : -Math.PI / 2), rnd() < .25 ? 'van' : 'sedan');
}

/* ───────────── 行人 ───────────── */
const shirts = [0x5b6770, 0x7a3b33, 0x394a5c, 0x8a7d62, 0x2f3a33, 0x9c9c98, 0x5a4a6a, 0x3d3d3f], pantsC = [0x23262b, 0x3a4250, 0x4c4336, 0x1b1b1d], skins = [0xd9a886, 0xb98263, 0x8d5f45, 0xe6c0a2], hairs = [0x1a1512, 0x3a2a1c, 0x5e5e5e, 0x0e0e0e];
const peds = [];
const RING = BLOCK - 2.2;
const ringCorner = (p, k) => { const s = [[1, 1], [-1, 1], [-1, -1], [1, -1]][(k % 4 + 4) % 4]; return [roadC(p.bi) + P / 2 + s[0] * RING, roadC(p.bj) + P / 2 + s[1] * RING]; };
for (let k = 0; k < 40; k++) {
  const p = { g: makeFigure(pick(shirts), pick(pantsC), pick(skins), pick(hairs)), bi: ri(0, N - 1), bj: ri(0, N - 1), k: ri(0, 3), dirn: rnd() < .5 ? 1 : -1, state: 'walk', t: 0, sp: rr(1.1, 1.6), vx: 0, vz: 0, y: 0, vy: 0, h: 0 };
  const [ax, az] = ringCorner(p, p.k), [bx, bz] = ringCorner(p, p.k + p.dirn), t = rnd();
  p.x = lerp(ax, bx, t); p.z = lerp(az, bz, t); p.k += p.dirn;
  peds.push(p);
}

/* ───────────── 玩家 ───────────── */
const spawn = { x: roadC(PARK[0]) + P / 2, z: roadC(PARK[1]) - ROAD - 2 };
const player = { g: makeFigure(0x2e3b2f, 0x1e2126, 0xd9a886, 0x15110e), x: spawn.x, z: spawn.z, y: .12, vy: 0, h: 0, car: null, speed: 0 };
{ // 出生点旁边放一辆车
  const c = makeCar(spawn.x + 4.5, roadC(PARK[1]) - 5.75, -Math.PI / 2, 'sedan');
  for (const o of cars) if (o !== c && Math.hypot(o.x - c.x, o.z - c.z) < 9) { o.x += 30; }
}
const headLamp = new THREE.SpotLight(0xfff0d0, 0, 70, .55, .6, 1.4);
scene.add(headLamp, headLamp.target);

/* ───────────── 输入 ───────────── */
const keys = {};
let camYaw = 0, camPitch = 0.22, lastLook = -10, started = false, muted = false;
addEventListener('keydown', e => {
  if (e.repeat) return; keys[e.code] = true;
  if (e.code === 'KeyF') toggleCar();
  if (e.code === 'KeyR') rescue();
  if (e.code === 'KeyM') { muted = !muted; toast(muted ? '已静音' : '声音开'); }
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
addEventListener('mousemove', e => {
  if (document.pointerLockElement !== canvas && !(e.buttons & 1)) return;
  camYaw -= e.movementX * 0.0026; camPitch = clamp(camPitch + e.movementY * 0.002, -0.12, 1.1); lastLook = clock;
});
canvas.addEventListener('click', () => { if (started && document.pointerLockElement !== canvas) lockMouse(); });
$('start').addEventListener('click', () => { started = true; $('start').style.display = 'none'; lockMouse(); initAudio(); newJob(true); });
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
function lockMouse() { try { canvas.requestPointerLock?.()?.catch?.(() => {}); } catch (e) {} }
const ax = (pos, neg) => (keys[pos[0]] || keys[pos[1]] ? 1 : 0) - (keys[neg[0]] || keys[neg[1]] ? 1 : 0);

/* ───────────── 状态：钱 / 警戒 / 任务 ───────────── */
let clock = 0, hour = 16.4, cash = 0, heat = 0, heatCool = 0, bustT = 0, lastHeatAt = -9, job = null, busy = false;
let toastT = 0;
function toast(msg, color = '#e9e4d8') { const t = $('toast'); t.textContent = msg; t.style.color = color; t.style.opacity = 1; toastT = 2.6; }
function addHeat(n, why) {
  if (clock - lastHeatAt < 1.2) return; lastHeatAt = clock;
  heat = Math.min(5, heat + n); heatCool = 0; if (why) toast(why, '#e2553d');
}
const beacon = new THREE.Group();
{
  const col = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 60, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xe8b84a, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  col.position.y = 30;
  const ring = new THREE.Mesh(new THREE.RingGeometry(3.0, 3.6, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: .9, depthWrite: false }));
  ring.position.y = .06; beacon.add(col, ring); scene.add(beacon);
}
function newJob(first) {
  const [px, pz] = me();
  let x, z, d;
  do { x = roadC(ri(0, N)); z = roadC(ri(0, N)); d = Math.hypot(x - px, z - pz); } while (d < 140);
  job = { x, z, pay: 80 + Math.round(d / 10) * 5 };
  beacon.position.set(x, 0, z);
  $('job').innerHTML = `<b>跑腿</b>　把东西送到地图上的黄点　<b>$${job.pay}</b>` + (first ? '<br>先按 <b>F</b> 上旁边那辆车' : '');
}
const me = () => player.car ? [player.car.x, player.car.z] : [player.x, player.z];

/* ───────────── 上下车 ───────────── */
function toggleCar() {
  if (busy) return;
  if (player.car) {
    const c = player.car, [fx, fz] = fwd(c.h);
    for (const s of [1, -1]) { // 左门优先
      const p = { x: c.x + fz * 1.9 * s, z: c.z - fx * 1.9 * s }, q = { ...p };
      resolveCircle(q, .4); if (Math.hypot(q.x - p.x, q.z - p.z) > .05 && s === 1) continue;
      player.x = q.x; player.z = q.z; break;
    }
    c.mode = 'parked'; player.car = null; player.g.visible = true; player.h = c.h; $('speed').style.display = 'none';
    return;
  }
  let best = null, bd = 2.6;
  for (const c of cars) { const d = carDist(c, player.x, player.z); if (d < bd) { bd = d; best = c; } }
  if (!best) return;
  if (best.mode === 'ai') {       // 把司机请下车
    const [fx, fz] = fwd(best.h), p = peds.reduce((a, b) => Math.hypot(a.x - player.x, a.z - player.z) > Math.hypot(b.x - player.x, b.z - player.z) ? a : b);
    p.x = best.x - fz * 2; p.z = best.z + fx * 2; p.state = 'flee'; p.t = 5; p.h = Math.atan2(p.x - player.x, p.z - player.z);
    const [vx, vz] = fwd(best.h); best.vx = vx * best.s; best.vz = vz * best.s;
    addHeat(1, '抢车被看见了');
  } else if (best.mode === 'police') addHeat(2, '你开走了巡逻车');
  best.mode = 'player'; player.car = best; player.g.visible = false; $('speed').style.display = '';
  if (camYawFree()) camYaw = best.h;
  $('job').innerHTML = $('job').innerHTML.replace(/<br>.*/, '');
}
function carDist(c, x, z) { const dx = x - c.x, dz = z - c.z, [fx, fz] = fwd(c.h); return Math.hypot(Math.max(0, Math.abs(dx * fx + dz * fz) - 2.2), Math.max(0, Math.abs(-dx * fz + dz * fx) - .95)); }
const camYawFree = () => clock - lastLook > 1.2;
function rescue() {
  const [x, z] = me(), rx = nearRoad(x), rz = nearRoad(z);
  const vert = Math.abs(x - rx) < Math.abs(z - rz);
  if (player.car) { const c = player.car; if (vert) { c.x = rx - LANE; c.h = 0; } else { c.z = rz + LANE; c.h = Math.PI / 2; } c.vx = c.vz = 0; }
  else if (vert) player.x = rx; else player.z = rz;
}

/* ───────────── 车辆物理 ───────────── */
function driveCar(c, thr, steer, hb, dt) {
  const [fx, fz] = fwd(c.h), rx = -fz, rz = fx;
  let vf = c.vx * fx + c.vz * fz, vl = c.vx * rx + c.vz * rz;
  if (thr > 0) vf += (vf < 0 ? 24 : 15 * Math.max(0, 1 - vf / c.maxV)) * thr * dt;
  else if (thr < 0) vf -= (vf > .5 ? 28 : 8 * Math.max(0, 1 + vf / 13)) * -thr * dt;
  vf -= vf * (thr === 0 ? .55 : .12) * dt;
  if (thr === 0 && Math.abs(vf) < .4) vf = 0;
  if (hb) vf *= Math.exp(-1.3 * dt);
  const grip = hb ? 1.5 : 7.5 - Math.min(3.2, Math.abs(vf) / 13);
  vl *= Math.exp(-grip * dt);
  c.steer += (steer - c.steer) * Math.min(1, dt * 7);
  c.h += c.steer * (2.1 / (1 + Math.abs(vf) / 24)) * clamp(vf / 5, -1, 1) * (hb ? 1.45 : 1) * dt;
  c.vx = fx * vf + rx * vl; c.vz = fz * vf + rz * vl;
  c.x += c.vx * dt; c.z += c.vz * dt;
  c.roll = lerp(c.roll, clamp(-c.steer * vf * .006 + vl * .02, -.09, .09), Math.min(1, dt * 6));
  c.braking = thr < 0 && vf > .5 || hb;
  return vf;
}
const carVel = c => { if (c.mode === 'ai') { const [fx, fz] = fwd(c.h); return [fx * c.s + c.kx, fz * c.s + c.kz]; } return [c.vx, c.vz]; };
const carPush = (c, dx, dz) => { if (c.mode === 'ai') { c.kx += dx; c.kz += dz; c.s *= .4; } else { c.vx += dx; c.vz += dz; } };
function carWorld(c) {
  const [fx, fz] = fwd(c.h); let imp = 0;
  for (const s of [1.3, -1.3]) {
    const p = { x: c.x + fx * s, z: c.z + fz * s }, ox = p.x, oz = p.z, n = resolveCircle(p, 1.0);
    if (!n) continue;
    c.x += p.x - ox; c.z += p.z - oz;
    if (c.mode === 'ai') { c.kx *= .5; c.kz *= .5; continue; }
    const vn = c.vx * n.x + c.vz * n.z;
    if (vn < 0) { c.vx -= 1.25 * vn * n.x; c.vz -= 1.25 * vn * n.z; c.vx *= .9; c.vz *= .9; imp = Math.max(imp, -vn); }
  }
  return imp;
}
function carPair(a, b) {
  const dx = a.x - b.x, dz = a.z - b.z; if (dx * dx + dz * dz > 42) return 0;
  const [afx, afz] = fwd(a.h), [bfx, bfz] = fwd(b.h);
  for (const sa of [1.2, -1.2]) for (const sb of [1.2, -1.2]) {
    const ex = a.x + afx * sa - b.x - bfx * sb, ez = a.z + afz * sa - b.z - bfz * sb, d = Math.hypot(ex, ez);
    if (d >= 2.0 || d < 1e-4) continue;
    const nx = ex / d, nz = ez / d, pen = (2.0 - d) / 2;
    a.x += nx * pen; a.z += nz * pen; b.x -= nx * pen; b.z -= nz * pen;
    const va = carVel(a), vb = carVel(b), rel = (va[0] - vb[0]) * nx + (va[1] - vb[1]) * nz;
    if (rel < 0) { const j = -1.2 * rel / 2; carPush(a, nx * j, nz * j); carPush(b, -nx * j, -nz * j); return -rel; }
    return 0.01;
  }
  return 0;
}

/* ───────────── 声音（WebAudio 合成）───────────── */
let AC = null, eng, engGain, engFilt, siren, sirenGain, noiseBuf;
function initAudio() {
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    eng = AC.createOscillator(); eng.type = 'sawtooth'; const sub = AC.createOscillator(); sub.type = 'square';
    engFilt = AC.createBiquadFilter(); engFilt.type = 'lowpass'; engFilt.frequency.value = 500;
    engGain = AC.createGain(); engGain.gain.value = 0;
    eng.connect(engFilt); sub.connect(engFilt); engFilt.connect(engGain).connect(AC.destination);
    eng.start(); sub.start(); eng._sub = sub;
    siren = AC.createOscillator(); siren.type = 'triangle'; sirenGain = AC.createGain(); sirenGain.gain.value = 0;
    siren.connect(sirenGain).connect(AC.destination); siren.start();
    noiseBuf = AC.createBuffer(1, AC.sampleRate * .4, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.5);
  } catch (e) { AC = null; }
}
function crashSound(v) {
  if (!AC || muted) return;
  const s = AC.createBufferSource(); s.buffer = noiseBuf; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500 + v * 60;
  const g = AC.createGain(); g.gain.value = clamp(v / 22, .06, .5); s.connect(f).connect(g).connect(AC.destination); s.start();
}
function updateAudio(vf, thr, policeDist) {
  if (!AC) return;
  const t = AC.currentTime, inCar = !!player.car && !muted, v = Math.abs(vf);
  const gears = [0, 9, 17, 26, 34, 60]; let gi = 0; while (v > gears[gi + 1]) gi++;
  const frac = (v - gears[gi]) / (gears[gi + 1] - gears[gi]), f = 48 + 75 * frac + gi * 7 + (thr > 0 ? 8 : 0);
  eng.frequency.setTargetAtTime(f, t, .05); eng._sub.frequency.setTargetAtTime(f / 2, t, .05);
  engFilt.frequency.setTargetAtTime(350 + v * 22 + (thr > 0 ? 300 : 0), t, .08);
  engGain.gain.setTargetAtTime(inCar ? .05 + (thr > 0 ? .035 : 0) : 0, t, .1);
  siren.frequency.setTargetAtTime(Math.sin(clock * 5) > 0 ? 880 : 660, t, .04);
  sirenGain.gain.setTargetAtTime(muted || policeDist > 160 ? 0 : .05 * (1 - policeDist / 160), t, .2);
}

/* ───────────── 警车 ───────────── */
function policeCount() { return cars.filter(c => c.mode === 'police').length; }
function spawnPolice() {
  const [px, pz] = me();
  for (let t = 0; t < 30; t++) {
    const x = roadC(ri(0, N)), z = roadC(ri(0, N)), d = Math.hypot(x - px, z - pz);
    if (d < 130 || d > 280 || cars.some(o => Math.hypot(o.x - x, o.z - z) < 8)) continue;
    const c = makeCar(x, z, Math.atan2(px - x, pz - z), 'police'); c.mode = 'police'; return;
  }
}
function removeCar(c) { scene.remove(c.g); cars.splice(cars.indexOf(c), 1); }
function policeDrive(c, dt) {
  const [px, pz] = me(), d = Math.hypot(px - c.x, pz - c.z);
  let tx = px, tz = pz;
  if (d > 42) {
    const cx = nearRoad(c.x), cz = nearRoad(c.z), onV = Math.abs(c.x - cx) < 6, onH = Math.abs(c.z - cz) < 6;
    if (onV && onH) { if (Math.abs(px - c.x) > Math.abs(pz - c.z)) { tx = clamp(cx + Math.sign(px - c.x) * P, -H, H); tz = cz; } else { tx = cx; tz = clamp(cz + Math.sign(pz - c.z) * P, -H, H); } }
    else if (onV) { tx = cx; tz = Math.abs(c.z - nearRoad(pz)) < 6 ? cz : nearRoad(pz); if (Math.abs(tz - c.z) < 6) tz = c.z + Math.sign(pz - c.z || 1) * 20; }
    else if (onH) { tz = cz; tx = Math.abs(c.x - nearRoad(px)) < 6 ? cx : nearRoad(px); if (Math.abs(tx - c.x) < 6) tx = c.x + Math.sign(px - c.x || 1) * 20; }
    else { tx = cx; tz = cz; }
  }
  const diff = wrapPi(Math.atan2(tx - c.x, tz - c.z) - c.h), vf = c.vx * Math.sin(c.h) + c.vz * Math.cos(c.h);
  let thr = 1; if (Math.abs(diff) > .7 && vf > 9) thr = -1; if (d < 9 && vf > 6) thr = -1;
  if (heat === 0) thr = 0;
  // 卡墙了就倒一下
  if (Math.abs(vf) < .6 && thr > 0) c.stuck += dt; else if (c.stuck < 1.2) c.stuck = Math.max(0, c.stuck - dt);
  if (c.stuck > 1.2) { c.stuck += dt; if (c.stuck > 2.6) c.stuck = 0; driveCar(c, -1, -Math.sign(diff), false, dt); return d; }
  driveCar(c, thr, clamp(diff * 2.2, -1, 1), false, dt);
  return d;
}

/* ───────────── 主循环 ───────────── */
const tmpCol = new THREE.Color(), cNight = new THREE.Color(0x070a12), cDay = new THREE.Color(0x8f9aa6), cDusk = new THREE.Color(0xc98a5c), cSunLow = new THREE.Color(0xffa964), cSunHi = new THREE.Color(0xfff1dd), cMoon = new THREE.Color(0x6f86c0);
let nightF = 0, frame = 0, camDist = 6, camX = 0, camY = 0, camZ = 0;

function updateSky(dt) {
  hour = (hour + dt / 75 * (keys.KeyT ? 60 : 1)) % 24;
  const ang = (hour - 6) / 12 * Math.PI, elev = Math.sin(ang), dayF = smooth(-.15, .3, elev), dusk = Math.max(0, 1 - Math.abs(elev) / .32);
  nightF = 1 - dayF;
  tmpCol.copy(cNight).lerp(cDay, dayF).lerp(cDusk, dusk * .55 * (0.3 + 0.7 * dayF));
  scene.background.copy(tmpCol); scene.fog.color.copy(tmpCol);
  sun.color.copy(cSunLow).lerp(cSunHi, clamp(elev * 2, 0, 1)); sun.color.lerp(cMoon, nightF);
  sun.intensity = Math.max(3.2 * dayF, .5);
  const [px, pz] = me(), sx = dayF > .05 ? Math.cos(ang) * .8 : .4, sy = Math.max(.42, elev), sz = .45, l = Math.hypot(sx, sy, sz);
  sun.target.position.set(px, 0, pz); sun.position.set(px + sx / l * 200, sy / l * 200, pz + sz / l * 200);
  hemi.intensity = .75 + 1.9 * dayF;
  for (const m of facadeMats) m.emissiveIntensity = .12 + 1.7 * nightF;
  poolMat.opacity = nightF * .5; bulbMat.color.setRGB(lerp(.3, 1, nightF), lerp(.3, .88, nightF), lerp(.3, .62, nightF));
  headLamp.intensity = player.car ? 900 * smooth(.3, .8, nightF) : 0;
  const hh = Math.floor(hour), mm = Math.floor((hour - hh) * 60);
  $('clock').textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

function updatePlayer(dt) {
  let vf = 0, thr = 0;
  if (player.car) {
    const c = player.car; thr = busy ? 0 : ax(['KeyW', 'ArrowUp'], ['KeyS', 'ArrowDown']);
    vf = driveCar(c, thr, busy ? 0 : ax(['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']), !!keys.Space, dt);
    const imp = carWorld(c); if (imp > 4) crashSound(imp);
    player.x = c.x; player.z = c.z; player.speed = Math.abs(vf);
    $('speed').firstChild.nodeValue = Math.round(Math.abs(vf) * 3.6);
  } else {
    const f = busy ? 0 : ax(['KeyW', 'ArrowUp'], ['KeyS', 'ArrowDown']), s = busy ? 0 : ax(['KeyD', 'ArrowRight'], ['KeyA', 'ArrowLeft']);
    const [cx, cz] = fwd(camYaw); let mx = cx * f - cz * s, mz = cz * f + cx * s; const l = Math.hypot(mx, mz);
    const sp = l > 0 ? (keys.ShiftLeft || keys.ShiftRight ? 8.2 : 4.2) : 0;
    if (l > 0) { mx /= l; mz /= l; player.x += mx * sp * dt; player.z += mz * sp * dt; player.h += wrapPi(Math.atan2(mx, mz) - player.h) * Math.min(1, dt * 12); }
    resolveCircle(player, .4);
    for (const c of cars) { // 别穿车
      const dx = player.x - c.x, dz = player.z - c.z, [fx, fz] = fwd(c.h), lz = clamp(dx * fx + dz * fz, -2.2, 2.2), lx = clamp(-dx * fz + dz * fx, -.95, .95);
      const qx = c.x + fx * lz - fz * lx, qz = c.z + fz * lz + fx * lx, ex = player.x - qx, ez = player.z - qz, d = Math.hypot(ex, ez);
      if (d < .42 && d > 1e-4) { player.x = qx + ex / d * .42; player.z = qz + ez / d * .42; }
    }
    const gy = groundY(player.x, player.z);
    if (keys.Space && player.y <= gy + .01 && !busy) player.vy = 5.2;
    player.vy -= 16 * dt; player.y += player.vy * dt; if (player.y < gy) { player.y = gy; player.vy = 0; }
    player.speed = sp; animFigure(player.g, sp, dt);
    player.g.position.set(player.x, player.y, player.z); player.g.rotation.y = player.h;
  }
  return [vf, thr];
}

function updateCars(dt) {
  const [px, pz] = me(); let policeDist = 1e9;
  for (let k = cars.length - 1; k >= 0; k--) {
    const c = cars[k];
    if (c.mode === 'ai') {
      const [tx, tz] = aiTarget(c), dx = tx - c.x, dz = tz - c.z, dist = Math.hypot(dx, dz);
      if (dist < 3.2) { if (c.phase === 0) { aiPickNext(c); c.phase = 1; } else { c.ni += c.nd[0]; c.nj += c.nd[1]; c.dir = c.nd; c.phase = 0; } }
      const diff = wrapPi(Math.atan2(dx, dz) - c.h), [fx, fz] = fwd(c.h);
      // 前方有东西就刹车
      let blocked = false;
      const ahead = (ox, oz, w) => { const ex = ox - c.x, ez = oz - c.z, a = ex * fx + ez * fz, lat = Math.abs(-ex * fz + ez * fx); return a > 0 && a < 5 + c.s * .9 && lat < w; };
      if (c.stuck < 5) { for (const o of cars) if (o !== c && ahead(o.x, o.z, 1.9)) { blocked = true; break; } if (!player.car && ahead(player.x, player.z, 1.6)) blocked = true; }
      const want = blocked ? 0 : c.cruise * (Math.abs(diff) > .35 ? .5 : 1);
      c.s += clamp(want - c.s, -14 * dt, 5 * dt);
      c.stuck = c.s < .5 ? c.stuck + dt : (c.stuck > 5 && c.stuck < 7 ? c.stuck + dt : 0);
      c.h += clamp(diff, -1, 1) * Math.min(1, c.s / 3) * 2.4 * dt;
      c.x += (fx * c.s + c.kx) * dt; c.z += (fz * c.s + c.kz) * dt;
      const kd = Math.exp(-3 * dt); c.kx *= kd; c.kz *= kd;
      c.braking = blocked; c.roll = 0;
      if (Math.abs(c.kx) + Math.abs(c.kz) > .5) carWorld(c);
    } else if (c.mode === 'police') {
      const d = policeDrive(c, dt); carWorld(c); policeDist = Math.min(policeDist, d);
      if (heat === 0 && d > 90) { removeCar(c); continue; }
      const on = Math.sin(clock * 14) > 0; c.bars[0].material.color.setHex(on ? 0xff2a1a : 0x441010); c.bars[1].material.color.setHex(on ? 0x161d55 : 0x3a5cff);
    } else if (c.mode === 'parked') {
      if (c.vx || c.vz) { driveCar(c, 0, 0, false, dt); carWorld(c); if (Math.abs(c.vx) + Math.abs(c.vz) < .05) c.vx = c.vz = 0; }
    }
  }
  // 车与车
  for (let a = 0; a < cars.length; a++) for (let b = a + 1; b < cars.length; b++) {
    const A = cars[a], B = cars[b];
    if (A.mode === 'parked' && B.mode === 'parked' && !A.vx && !B.vx && !A.vz && !B.vz) continue;
    const imp = carPair(A, B);
    if (imp > 3 && (A === player.car || B === player.car)) {
      crashSound(imp);
      const o = A === player.car ? B : A;
      if (o.kind === 'police' && imp > 6) addHeat(1, '撞了巡逻车'); else if (imp > 11 && o.mode === 'ai') addHeat(1, '肇事');
    }
  }
  for (const c of cars) {
    const v = carVel(c), sp = Math.hypot(v[0], v[1]);
    c.g.position.set(c.x, 0, c.z); c.g.rotation.set(0, c.h, c.roll, 'YXZ');
    const spin = sp * dt / .36; for (const w of c.wheels) w.rotation.x += spin;
    const tm = c.braking ? brakeMat : tailMat; if (c.tails[0].material !== tm) c.tails[0].material = c.tails[1].material = tm;
  }
  return policeDist;
}

function updatePeds(dt) {
  const pc = player.car, pv = pc ? Math.hypot(pc.vx, pc.vz) : 0;
  for (const p of peds) {
    let sp = 0;
    if (p.state === 'walk') {
      const [tx, tz] = ringCorner(p, p.k), dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
      if (d < .6) { p.k += p.dirn; if (rnd() < .12) p.dirn = -p.dirn; }
      else { sp = p.sp; p.h += wrapPi(Math.atan2(dx, dz) - p.h) * Math.min(1, dt * 6); p.x += dx / d * sp * dt; p.z += dz / d * sp * dt; }
      p.y = groundY(p.x, p.z);
    } else if (p.state === 'flee') {
      sp = 5; const [fx, fz] = fwd(p.h); p.x += fx * sp * dt; p.z += fz * sp * dt; resolveCircle(p, .4); p.y = groundY(p.x, p.z);
      if ((p.t -= dt) <= 0) p.state = 'walk';
    } else { // down
      p.vy -= 18 * dt; p.y += p.vy * dt; const gy = groundY(p.x, p.z); if (p.y < gy) { p.y = gy; p.vy = 0; p.vx *= Math.exp(-6 * dt); p.vz *= Math.exp(-6 * dt); }
      p.x += p.vx * dt; p.z += p.vz * dt; resolveCircle(p, .4);
      if ((p.t -= dt) <= 0) { p.state = 'flee'; p.t = 3; p.g.userData.body.rotation.x = 0; p.g.userData.body.position.y = 0; }
    }
    // 和车的互动
    if (p.state !== 'down') for (const c of cars) {
      if (c.mode === 'parked' && !c.vx && !c.vz) continue;
      const dx = p.x - c.x, dz = p.z - c.z; if (dx * dx + dz * dz > 150) continue;
      const v = carVel(c), cs = Math.hypot(v[0], v[1]); if (cs < 3) continue;
      const [fx, fz] = fwd(c.h), lz = dx * fx + dz * fz, lx = -dx * fz + dz * fx;
      if (Math.abs(lz) < 2.5 && Math.abs(lx) < 1.25) {
        p.state = 'down'; p.t = 5; p.vx = v[0] * .8 + dx * .8; p.vz = v[1] * .8 + dz * .8; p.vy = 3 + cs * .15;
        p.g.userData.body.rotation.x = -Math.PI / 2; p.g.userData.body.position.y = .25;
        if (c === pc) { crashSound(cs * .6); addHeat(1, '撞到人了'); }
      } else if (c === pc && pv > 7 && p.state === 'walk' && lz > 0 && lz < 6 + pv * .7 && Math.abs(lx) < 2.6) {
        p.state = 'flee'; p.t = 1.4; p.h = Math.atan2(-fz * Math.sign(lx || 1), fx * Math.sign(lx || 1)); // 往两边躲
      }
    }
    animFigure(p.g, sp, dt);
    p.g.position.set(p.x, p.y, p.z); p.g.rotation.y = p.h;
  }
}

function updateRules(dt, policeDist) {
  // 警戒：视野里没巡逻车就慢慢降
  if (heat > 0) {
    const want = Math.min(heat, 3) + (heat >= 4 ? 1 : 0);
    if (policeCount() < want && frame % 40 === 0) spawnPolice();
    heatCool = policeDist < 75 ? 0 : heatCool + dt;
    if (heatCool > 9) { heat--; heatCool = 0; if (heat === 0) toast('甩掉了', '#8fd18a'); }
    if (policeDist < 7 && player.speed < 2.5 && !busy) { bustT += dt; if (bustT > 2) busted(); } else bustT = 0;
  }
  [...$('heat').children].forEach((el, k) => el.classList.toggle('on', k < heat));
  // 任务
  const [px, pz] = me();
  if (job && Math.hypot(px - job.x, pz - job.z) < 6.5 && started) { cash += job.pay; toast(`送到了　+$${job.pay}`, '#e8c36a'); crashSoundSoft(); newJob(); }
  $('cash').textContent = '$ ' + cash.toLocaleString();
  beacon.children[1].scale.setScalar(1 + .12 * Math.sin(clock * 4));
  // 提示
  let tip = '';
  if (!player.car) { for (const c of cars) if (carDist(c, player.x, player.z) < 2.6) { tip = '<kbd>F</kbd>上车'; break; } }
  $('prompt').innerHTML = tip || $('prompt').innerHTML; $('prompt').style.opacity = tip && started ? 1 : 0;
  if (toastT > 0 && (toastT -= dt) <= 0) $('toast').style.opacity = 0;
}
function crashSoundSoft() { if (!AC || muted) return; const o = AC.createOscillator(), g = AC.createGain(); o.frequency.value = 880; o.frequency.setTargetAtTime(1320, AC.currentTime + .08, .01); g.gain.value = .08; g.gain.setTargetAtTime(0, AC.currentTime + .12, .08); o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + .6); }
function busted() {
  busy = true; bustT = 0; const fine = Math.min(cash, 200);
  toast(`被拦下了　罚款 $${fine}`, '#e2553d'); $('fade').style.opacity = 1;
  setTimeout(() => {
    cash -= fine; heat = 0;
    for (const c of [...cars]) if (c.mode === 'police') removeCar(c);
    if (player.car) { player.car.mode = 'parked'; player.car.vx = player.car.vz = 0; player.car = null; player.g.visible = true; $('speed').style.display = 'none'; }
    player.x = spawn.x; player.z = spawn.z; camYaw = 0;
    $('fade').style.opacity = 0; busy = false;
  }, 1100);
}

function updateCamera(dt, vf) {
  const c = player.car, tx = player.x, tz = player.z, ty = c ? 1.5 : player.y + 1.55;
  if (c && camYawFree() && Math.abs(vf) > 1.5) camYaw += wrapPi(c.h + (vf < -1.5 ? Math.PI : 0) - camYaw) * Math.min(1, dt * 3.2);
  let want = c ? 8.5 + Math.abs(vf) * .06 : 5.2;
  const [fx, fz] = fwd(camYaw), cp = Math.cos(camPitch), sp = Math.sin(camPitch);
  // 镜头别钻进楼里
  for (let s = 1; s <= 12; s++) {
    const d = want * s / 12, x = tx - fx * cp * d, z = tz - fz * cp * d, y = ty + sp * d + .6;
    if (boxes.some(b => x > b.x0 - .4 && x < b.x1 + .4 && z > b.z0 - .4 && z < b.z1 + .4 && y < b.h)) { want = Math.max(.8, want * (s - 1) / 12); break; }
  }
  camDist += (want - camDist) * Math.min(1, dt * (want < camDist ? 20 : 4));
  const gx = tx - fx * cp * camDist, gy = Math.max(.4, ty + .6 + sp * camDist), gz = tz - fz * cp * camDist, k = Math.min(1, dt * 14);
  camX += (gx - camX) * k; camY += (gy - camY) * k; camZ += (gz - camZ) * k;
  camera.position.set(camX, camY, camZ); camera.lookAt(tx, ty + .5, tz);
  const fov = 58 + clamp(Math.abs(vf) * .45, 0, 16); if (Math.abs(fov - camera.fov) > .05) { camera.fov += (fov - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
  if (c) { const [hx, hz] = fwd(c.h); headLamp.position.set(c.x + hx * 2, 1.0, c.z + hz * 2); headLamp.target.position.set(c.x + hx * 22, 0, c.z + hz * 22); }
}

/* ───────────── 小地图 ───────────── */
const mapC = $('map'), mg = mapC.getContext('2d');
function drawMap() {
  const S = 352, R = S / 2, sc = 1.15, [px, pz] = me(), [fx, fz] = fwd(camYaw);
  const tf = (x, z) => { const dx = x - px, dz = z - pz; return [R + (-dx * fz + dz * fx) * -sc, R - (dx * fx + dz * fz) * sc]; };
  mg.clearRect(0, 0, S, S); mg.save(); mg.beginPath(); mg.arc(R, R, R, 0, 7); mg.clip();
  mg.fillStyle = 'rgba(28,32,36,.85)'; mg.fillRect(0, 0, S, S);
  mg.strokeStyle = '#6f757b'; mg.lineWidth = ROAD * 2 * sc * .8; mg.lineCap = 'butt';
  for (let i = 0; i <= N; i++) { const c = roadC(i); let a = tf(c, -H - ROAD), b = tf(c, H + ROAD); mg.beginPath(); mg.moveTo(...a); mg.lineTo(...b); mg.stroke(); a = tf(-H - ROAD, c); b = tf(H + ROAD, c); mg.beginPath(); mg.moveTo(...a); mg.lineTo(...b); mg.stroke(); }
  { const [x, y] = tf(roadC(PARK[0]) + P / 2, roadC(PARK[1]) + P / 2); mg.save(); mg.translate(x, y); mg.rotate(camYaw); mg.fillStyle = '#4c6b42'; mg.fillRect(-26 * sc, -26 * sc, 52 * sc, 52 * sc); mg.restore(); }
  const dot = (x, z, col, r, edge) => { let [mx, my] = tf(x, z); if (edge) { const dx = mx - R, dy = my - R, d = Math.hypot(dx, dy); if (d > R - 12) { mx = R + dx / d * (R - 12); my = R + dy / d * (R - 12); } } mg.fillStyle = col; mg.beginPath(); mg.arc(mx, my, r, 0, 7); mg.fill(); };
  for (const c of cars) if (c.mode === 'police') dot(c.x, c.z, Math.sin(clock * 12) > 0 ? '#ff4a3a' : '#4a6cff', 7, true);
  if (job) { dot(job.x, job.z, '#ffd36a', 10, true); }
  mg.restore();
  // 玩家箭头（朝向相对镜头）
  const ph = (player.car ? player.car.h : player.h) - camYaw;
  mg.save(); mg.translate(R, R); mg.rotate(-ph); mg.fillStyle = '#fff'; mg.beginPath(); mg.moveTo(0, -13); mg.lineTo(9, 10); mg.lineTo(0, 5); mg.lineTo(-9, 10); mg.closePath(); mg.fill(); mg.restore();
}

/* ───────────── 启动 ───────────── */
camYaw = Math.PI / 2; camX = player.x - 6; camY = 3; camZ = player.z;
let last = performance.now();
function tick(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; clock += dt; frame++;
  step(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
function step(dt) {
  updateSky(dt);
  const [vf, thr] = updatePlayer(dt);
  const pd = updateCars(dt);
  updatePeds(dt);
  updateRules(dt, pd);
  updateCamera(dt, vf);
  updateAudio(vf, thr, pd);
  if (frame % 2 === 0) drawMap();
}
requestAnimationFrame(tick);

// 调试用
window.G = { player, cars, peds, keys, step, renderer, scene, camera, get heat() { return heat; }, set heat(v) { heat = v; }, get hour() { return hour; }, set hour(v) { hour = v; }, get cash() { return cash; }, get job() { return job; }, toggleCar, set yaw(v) { camYaw = v; lastLook = clock; }, info: () => renderer.info.render };

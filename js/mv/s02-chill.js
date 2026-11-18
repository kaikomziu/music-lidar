// 特製MV その2: 落ち着いた曲・南国の曲(アコースティック・ピアノ・アンビエント・ゴスペル・ローファイ・レゲエ・トロピカル・ダブ・レゲトン)
import {
  TAU, frac, clamp01, ease, table, vgrad, text, twinkle, SKY, STARS, starfield, hills, birds, fluffyClouds, waves, radialLines,
  retroSun, sparkle, aurora, snowMountains, snowfall, rain, bokeh, palm, moon, stageBeams, eqBars, crowd, beatRipples,
  vinyl, skyline, BLDS, dotSphere, hash1, windowDrops, rainyCity, star5, confetti,
} from '../mv.js';

// ---- Morning Coffee: 朝の窓辺のコーヒー。湯気がのぼり、サビでカップの中に光が渦巻く ----
function cup(c, x, y, s) {
  const g = c.g;
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(x - s, y - s * 0.9); g.lineTo(x + s, y - s * 0.9); g.lineTo(x + s * 0.8, y); g.lineTo(x - s * 0.8, y); g.fill();
  g.strokeStyle = '#ffffff'; g.lineWidth = s * 0.15; g.beginPath(); g.arc(x + s * 1.05, y - s * 0.5, s * 0.3, -1.2, 1.2); g.stroke();
  g.fillStyle = '#6a3a1e'; g.beginPath(); g.ellipse(x, y - s * 0.9, s * 0.95, s * 0.18, 0, 0, TAU); g.fill();
  g.fillStyle = '#e8d0b0'; g.beginPath(); g.ellipse(x, y + s * 0.05, s * 1.5, s * 0.22, 0, 0, TAU); g.fill();
}
function steam(c, x, y, s, n = 3) {
  const g = c.g; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = Math.max(1.5, s * 0.08); g.lineCap = 'round';
  for (let k = 0; k < n; k++) {
    g.beginPath();
    for (let i = 0; i <= 20; i++) { const u = i / 20, yy = y - u * s * 2.6, xx = x + (k - (n - 1) / 2) * s * 0.4 + Math.sin(u * 6 - c.t * 2 + k) * s * 0.18 * u; i ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
    g.globalAlpha = 0.6; g.stroke();
  }
  g.globalAlpha = 1;
}
function windowFrame(c, sky) {
  const g = c.g; vgrad(c, sky);
  g.fillStyle = '#5a3a24'; g.fillRect(0, 0, c.w, c.h * 0.06); g.fillRect(0, c.h * 0.7, c.w, c.h); g.fillRect(c.w / 2 - c.w * 0.01, 0, c.w * 0.02, c.h * 0.7);
  g.fillStyle = '#7a5234'; g.fillRect(0, c.h * 0.7, c.w, c.h * 0.04);
}
const morningCoffee = {
  looks: [
    [0, (c) => { windowFrame(c, ['#ffd9a8', '#fff2dc']); retroSun(c, c.w * 0.75, c.h * 0.42, c.h * 0.1, '#fffbe0', '#ffc070', 'rgba(0,0,0,0)'); cup(c, c.w * 0.35, c.h * 0.72, c.h * 0.12); steam(c, c.w * 0.35, c.h * 0.58, c.h * 0.1); }],
    [1, (c) => { vgrad(c, ['#3a2214', '#6a4028']); for (let i = 0; i < 40; i++) { const y = frac(hash1(i) + c.t * (0.05 + hash1(i + 3) * 0.05)) * c.h, x = hash1(i + 7) * c.w; c.g.save(); c.g.translate(x, y); c.g.rotate(c.t + i); c.g.fillStyle = '#2a140a'; c.g.beginPath(); c.g.ellipse(0, 0, c.h * 0.025, c.h * 0.017, 0, 0, TAU); c.g.fill(); c.g.strokeStyle = '#6a3a1e'; c.g.lineWidth = 1; c.g.beginPath(); c.g.moveTo(-c.h * 0.02, 0); c.g.lineTo(c.h * 0.02, 0); c.g.stroke(); c.g.restore(); } cup(c, c.w / 2, c.h * 0.8, c.h * 0.16); steam(c, c.w / 2, c.h * 0.62, c.h * 0.13); }],
    [1, (c) => { windowFrame(c, ['#9fd8ff', '#fff2dc']); fluffyClouds(c, c.h * 0.2, 0.01); birds(c, '#3a4a5a'); cup(c, c.w * 0.3, c.h * 0.72, c.h * 0.12); steam(c, c.w * 0.3, c.h * 0.58, c.h * 0.1); cup(c, c.w * 0.62, c.h * 0.72, c.h * 0.1); steam(c, c.w * 0.62, c.h * 0.6, c.h * 0.08, 2); }],
    [2, (c) => { vgrad(c, ['#ffc98a', '#fff4e0']); radialLines(c, 18, '#ffffff', 0.25 + 0.3 * c.pulse, c.t * 0.2, 0.15); const g = c.g; g.fillStyle = '#6a3a1e'; g.beginPath(); g.arc(c.w / 2, c.h / 2, c.h * 0.32, 0, TAU); g.fill(); g.strokeStyle = '#f4e0c0'; g.lineWidth = c.h * 0.012; for (let i = 0; i < 3; i++) { g.beginPath(); for (let k = 0; k < 60; k++) { const a = k * 0.18 + c.t * 0.8 + i * TAU / 3, r = k / 60 * c.h * 0.28; k ? g.lineTo(c.w / 2 + Math.cos(a) * r, c.h / 2 + Math.sin(a) * r) : g.moveTo(c.w / 2, c.h / 2); } g.stroke(); } g.strokeStyle = '#ffffff'; g.lineWidth = c.h * 0.03; g.beginPath(); g.arc(c.w / 2, c.h / 2, c.h * 0.33, 0, TAU); g.stroke(); }],
  ],
};

// ---- Puddle Jump: 雨上がりの水たまりをぴょん。長ぐつと波紋、虹 ----
function rainbow(c, x, y, R, a) {
  const g = c.g; g.save(); g.globalAlpha = a;
  ['#ff5a5a', '#ffa53d', '#ffe14f', '#6dff8a', '#4fa3ff', '#9d7bff'].forEach((col, i) => { g.strokeStyle = col; g.lineWidth = R * 0.06; g.beginPath(); g.arc(x, y, R * (1 - i * 0.065), Math.PI, TAU); g.stroke(); });
  g.restore();
}
function boots(c, x, base, s, lift) {
  const g = c.g; g.fillStyle = '#ffd84a';
  for (const dx of [-0.35, 0.35]) { g.fillRect(x + dx * s - s * 0.2, base - s - lift, s * 0.4, s); g.fillRect(x + dx * s - s * 0.2, base - s * 0.2 - lift, s * 0.55, s * 0.2); }
}
const puddle = (i) => [0.2 + hash1(i) * 0.6, 0.78 + hash1(i + 4) * 0.12];
const puddleJump = {
  looks: [
    [0, (c) => { vgrad(c, ['#8a9ab8', '#c8d4e8']); rain(c, 'rgba(255,255,255,0.8)', 0.8); c.g.fillStyle = '#5a6a7a'; c.g.fillRect(0, c.h * 0.75, c.w, c.h); beatRipples(c, 4, puddle, '#ffffff', 0.25, 1); }],
    [1, (c) => { vgrad(c, ['#7fd4ff', '#e0f6ff']); fluffyClouds(c, c.h * 0.2, 0.015); rainbow(c, c.w / 2, c.h * 0.75, c.h * 0.6, 0.5); c.g.fillStyle = '#6aa860'; c.g.fillRect(0, c.h * 0.75, c.w, c.h); c.g.fillStyle = '#7fc4ff'; c.g.beginPath(); c.g.ellipse(c.w / 2, c.h * 0.86, c.w * 0.22, c.h * 0.05, 0, 0, TAU); c.g.fill(); boots(c, c.w / 2, c.h * 0.86, c.h * 0.12, Math.abs(Math.sin(c.beat * Math.PI)) * c.h * 0.12); beatRipples(c, 3, () => [0.5, 0.86], '#ffffff', 0.3, 2); }],
    [2, (c) => { vgrad(c, ['#5fc4ff', '#d8f4ff']); radialLines(c, 16, '#ffffff', 0.25 + 0.3 * c.pulse, c.t * 0.25, 0.1); rainbow(c, c.w / 2, c.h * 0.8, c.h * (0.7 + 0.03 * c.pulse), 0.9); c.g.fillStyle = '#6aa860'; c.g.fillRect(0, c.h * 0.8, c.w, c.h); for (let i = 0; i < 3; i++) boots(c, c.w * (0.25 + i * 0.25), c.h * 0.9, c.h * 0.1, Math.abs(Math.sin((c.beat + i / 3) * Math.PI)) * c.h * 0.14); beatRipples(c, 5, puddle, '#ffffff', 0.25, 1); }],
  ],
};

// ---- Piano Rain: 雨の窓と鍵盤。雨粒が鍵盤に落ちて光る ----
function keyboard(c, y, hh, lit) {
  const g = c.g, n = 21, w = c.w / n;
  for (let i = 0; i < n; i++) { const on = lit(i); g.fillStyle = on ? '#bfe0ff' : '#f4f6fa'; g.fillRect(i * w + 1, y, w - 2, hh); }
  g.fillStyle = '#14161e';
  for (let i = 0; i < n; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) g.fillRect(i * w + w * 0.68, y, w * 0.64, hh * 0.6);
}
const pianoRain = {
  looks: [
    [0, (c) => { rainyCity(c, false); windowDrops(c, 0.6); keyboard(c, c.h * 0.78, c.h * 0.22, (i) => Math.floor(c.beat) % 21 === i); }],
    [1, (c) => { vgrad(c, ['#1a2440', '#3a4a6a']); rain(c, 'rgba(200,220,255,0.8)', 1); keyboard(c, c.h * 0.7, c.h * 0.3, (i) => (Math.floor(c.beat * 2) * 7 + i * 3) % 21 < 2); }],
    [2, (c, P) => { vgrad(c, ['#2a3a6a', '#7a9ad0']); bokeh(c, ['#d0e4ff', '#ffffff', P.main], 0.45); rain(c, 'rgba(255,255,255,0.9)', 1.4); keyboard(c, c.h * 0.7, c.h * 0.3, (i) => Math.abs(i - 10 - Math.sin(c.t * 2) * 8) < 2 + c.pulse * 2); }],
  ],
};

// ---- Polar Night: 極夜の雪原。オーロラが揺れ、サビで空いっぱいに広がる ----
const polarNight = {
  looks: [
    [0, (c) => { vgrad(c, ['#02040e', '#0a1430', '#142a4a']); twinkle(c, SKY, '#fff'); aurora(c, c.h * 0.35, c.h * 0.05, 0.6); snowMountains(c, c.h * 0.78); snowfall(c, 0.3, 0.4); }],
    [1, (c) => { vgrad(c, ['#02040e', '#0c1838']); twinkle(c, SKY, '#fff', 0.5); aurora(c, c.h * 0.3, c.h * 0.08, 1); snowMountains(c, c.h * 0.8); }],
    [2, (c) => { vgrad(c, ['#03061a', '#102850']); twinkle(c, SKY, '#fff', 0.8); aurora(c, c.h * 0.25, c.h * 0.1, 1.6); aurora(c, c.h * 0.45, c.h * 0.06, 0.9 + 0.4 * c.pulse); snowMountains(c, c.h * 0.84); snowfall(c, 0.5, 0.5); }],
  ],
};

// ---- Gospel Light: 教会のステンドグラスから光が差し、聖歌隊がゆれる ----
function stainedGlass(c, x, y, w, h, glow) {
  const g = c.g; g.save();
  g.beginPath(); g.moveTo(x - w / 2, y + h); g.lineTo(x - w / 2, y + w / 2); g.arc(x, y + w / 2, w / 2, Math.PI, TAU); g.lineTo(x + w / 2, y + h); g.closePath(); g.clip();
  const cols = ['#ff5a5a', '#ffd84a', '#4fa3ff', '#6dff8a', '#c38bff'];
  for (let i = 0; i < 8; i++) for (let j = 0; j < 12; j++) { g.fillStyle = cols[(i * 3 + j * 2) % 5]; g.globalAlpha = 0.55 + 0.45 * glow; g.fillRect(x - w / 2 + i * w / 8, y + j * h / 12, w / 8 - 1, h / 12 - 1); }
  g.restore();
}
function lightRays(c, x, y, a) {
  const g = c.g; g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(x, y, x, c.h); gr.addColorStop(0, `rgba(255,240,170,${0.35 * a})`); gr.addColorStop(1, 'rgba(255,240,170,0)');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x - c.w * 0.04, y); g.lineTo(x + c.w * 0.04, y); g.lineTo(x + c.w * 0.25, c.h); g.lineTo(x - c.w * 0.25, c.h); g.fill(); g.restore();
}
function choir(c, base) {
  const g = c.g;
  for (let i = 0; i < 9; i++) { const x = c.w * (0.1 + i * 0.1), sway = Math.sin(c.beat * Math.PI / 2 + i * 0.3) * c.h * 0.01; g.fillStyle = '#6a2a8a'; g.fillRect(x - c.h * 0.04 + sway, base - c.h * 0.18, c.h * 0.08, c.h * 0.18); g.fillStyle = '#3a2214'; g.beginPath(); g.arc(x + sway, base - c.h * 0.21, c.h * 0.03, 0, TAU); g.fill(); g.fillStyle = '#fff0a0'; g.fillRect(x - c.h * 0.02 + sway, base - c.h * 0.15, c.h * 0.04, c.h * 0.03); }
}
const gospelLight = {
  looks: [
    [0, (c) => { vgrad(c, ['#1a1024', '#3a2440']); stainedGlass(c, c.w / 2, c.h * 0.08, c.h * 0.34, c.h * 0.5, 0.3); lightRays(c, c.w / 2, c.h * 0.4, 0.6); choir(c, c.h * 0.98); }],
    [1, (c) => { vgrad(c, ['#2a1834', '#4a3050']); for (const x of [0.25, 0.5, 0.75]) { stainedGlass(c, c.w * x, c.h * 0.08, c.h * 0.26, c.h * 0.4, 0.5); lightRays(c, c.w * x, c.h * 0.4, 0.5); } choir(c, c.h * 0.98); }],
    [2, (c) => { vgrad(c, ['#5a4060', '#fff0c8']); radialLines(c, 24, '#fff6c8', 0.3 + 0.3 * c.pulse, c.t * 0.1, 0.05); stainedGlass(c, c.w / 2, c.h * 0.05, c.h * 0.4, c.h * 0.55, 1); lightRays(c, c.w / 2, c.h * 0.45, 1 + c.pulse); choir(c, c.h * 0.98); for (let i = 0; i < 6; i++) sparkle(c, c.w * (0.1 + i * 0.16), c.h * (0.2 + 0.1 * Math.sin(c.t + i)), c.h * 0.02 * (0.5 + c.pulse), '#fff', 0.8); }],
  ],
};

// ---- Lofi Library: 夜の図書館の机。本棚、ランプ、窓の外の雨 ----
function shelves(c, alpha = 1) {
  const g = c.g; g.globalAlpha = alpha;
  for (let r = 0; r < 4; r++) {
    g.fillStyle = '#3a2418'; g.fillRect(0, c.h * (0.1 + r * 0.18), c.w, c.h * 0.015);
    for (let i = 0; i < 40; i++) { const w = c.w * (0.012 + hash1(i + r * 50) * 0.012), x = (i / 40) * c.w, h = c.h * (0.1 + hash1(i * 3 + r) * 0.05); g.fillStyle = ['#8a3a3a', '#3a5a8a', '#4a7a4a', '#a8884a', '#6a4a7a'][(i + r) % 5]; g.fillRect(x, c.h * (0.1 + r * 0.18) - h, w, h); }
  }
  g.globalAlpha = 1;
}
function deskLamp(c, x, y, s, on) {
  const g = c.g;
  const gl = g.createRadialGradient(x, y + s, 0, x, y + s, s * 5); gl.addColorStop(0, `rgba(255,200,120,${0.45 * on})`); gl.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gl; g.fillRect(x - s * 5, y - s * 4, s * 10, s * 10);
  g.fillStyle = '#2a6a5a'; g.beginPath(); g.moveTo(x - s, y + s * 0.6); g.lineTo(x + s, y + s * 0.6); g.lineTo(x + s * 0.4, y - s * 0.3); g.lineTo(x - s * 0.4, y - s * 0.3); g.fill();
  g.fillStyle = '#1a2a2a'; g.fillRect(x - s * 0.06, y + s * 0.6, s * 0.12, s * 1.6);
}
const libraryDesk = (c) => { vgrad(c, ['#141830', '#222844']); shelves(c, 0.6); c.g.fillStyle = '#4a2e1e'; c.g.fillRect(0, c.h * 0.78, c.w, c.h); deskLamp(c, c.w * 0.3, c.h * 0.58, c.h * 0.08, 1); vinyl(c, c.w * 0.7, c.h * 0.82, c.h * 0.12, c.t * 0.8, '#a0b8ff'); };
const lofiLibrary = {
  intro: libraryDesk,
  looks: [
    [1, libraryDesk],
    [0, (c) => { vgrad(c, ['#141830', '#222844']); shelves(c, 0.6); c.g.fillStyle = '#4a2e1e'; c.g.fillRect(0, c.h * 0.78, c.w, c.h); deskLamp(c, c.w * 0.3, c.h * 0.58, c.h * 0.08, 1); vinyl(c, c.w * 0.7, c.h * 0.82, c.h * 0.12, c.t * 0.8, '#a0b8ff'); }],
    [1, (c, P) => { rainyCity(c, true); windowDrops(c, 0.5); c.g.fillStyle = '#4a2e1e'; c.g.fillRect(0, c.h * 0.8, c.w, c.h); deskLamp(c, c.w * 0.2, c.h * 0.62, c.h * 0.08, 0.8 + 0.2 * c.pulse); }],
    [2, (c, P) => { vgrad(c, ['#1a2040', '#3a3060']); bokeh(c, ['#ffcf7a', P.main, '#ffffff'], 0.4); vinyl(c, c.w / 2, c.h / 2, c.h * (0.32 + 0.01 * c.pulse), c.t * 1.5, P.main); text(c, 'lo-fi', c.w / 2, c.h * 0.88, c.h * 0.05, '#ffffffaa', 0.8, { font: 'serif', weight: 400 }); }],
  ],
};

// ---- Island Signal: 南の島の夕暮れ。ラジオの電波が波紋になって広がる ----
function island(c, x, base, s) {
  const g = c.g; g.fillStyle = '#2a1a10'; g.beginPath(); g.ellipse(x, base, s, s * 0.18, 0, Math.PI, TAU); g.fill();
  palm(c, x - s * 0.2, base - s * 0.1, s * 0.8, '#1a0f08', 0.2);
}
const islandSignal = {
  looks: [
    [0, (c) => { vgrad(c, ['#ff9a5a', '#ff5f7e', '#5a2a6a']); retroSun(c, c.w / 2, c.h * 0.6, c.h * 0.2, '#fff1a8', '#ff8a3d', '#ff5f7e'); waves(c, 0.62, '#3a1a5a', '#24123e', 0.4); island(c, c.w * 0.72, c.h * 0.64, c.h * 0.25); }],
    [1, (c) => { vgrad(c, ['#2a1a4a', '#ff6f8e']); retroSun(c, c.w / 2, c.h * 0.6, c.h * 0.18, '#fff1a8', '#ff8a3d', '#ff6f8e'); waves(c, 0.62, '#2d1648', '#1c0e32', 0.6); island(c, c.w * 0.28, c.h * 0.64, c.h * 0.3); beatRipples(c, 4, () => [0.28, 0.4], '#6dff8a', 0.5, 2); }],
    [2, (c) => { vgrad(c, ['#0a2a1a', '#1a5a3a']); radialLines(c, 20, '#6dff8a', 0.15 + 0.25 * c.pulse, c.t * 0.2, 0.1); for (let i = 0; i < 6; i++) { const r = frac(c.beat / 4 + i / 6); c.g.strokeStyle = ['#6dff8a', '#ffd84a', '#ff5a5a'][i % 3]; c.g.globalAlpha = 1 - r; c.g.lineWidth = c.h * 0.012; c.g.beginPath(); c.g.arc(c.w / 2, c.h / 2, r * c.h * 0.6, 0, TAU); c.g.stroke(); } c.g.globalAlpha = 1; palm(c, c.w * 0.1, c.h, c.h * 0.7, '#05140a', 0.2); palm(c, c.w * 0.9, c.h, c.h * 0.6, '#05140a', -0.25); }],
  ],
};

// ---- Tropical Mango: マンゴーとフルーツが弾けるビーチ ----
function mango(c, x, y, s, rot) {
  const g = c.g; g.save(); g.translate(x, y); g.rotate(rot);
  const gr = g.createLinearGradient(-s, -s, s, s); gr.addColorStop(0, '#ffe14f'); gr.addColorStop(1, '#ff7a2a');
  g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, s, s * 0.75, 0.3, 0, TAU); g.fill();
  g.fillStyle = '#3a9a3a'; g.beginPath(); g.ellipse(s * 0.5, -s * 0.7, s * 0.4, s * 0.15, -0.6, 0, TAU); g.fill();
  g.restore();
}
const tropicalMango = {
  looks: [
    [0, (c) => { vgrad(c, ['#5fd0ff', '#c8f2ff', '#ffe8b0']); fluffyClouds(c, c.h * 0.2, 0.01); waves(c, 0.62, '#2fb0e0', '#1a90c8', 0.6); c.g.fillStyle = '#ffe0a0'; c.g.fillRect(0, c.h * 0.85, c.w, c.h); palm(c, c.w * 0.12, c.h * 0.9, c.h * 0.7, '#2a6a2a', 0.2); }],
    [1, (c) => { vgrad(c, ['#ffb347', '#ffe8b0']); retroSun(c, c.w * 0.7, c.h * 0.45, c.h * 0.16, '#fff8d0', '#ffb347', 'rgba(0,0,0,0)'); waves(c, 0.65, '#2fb0e0', '#1a90c8', 1); for (let i = 0; i < 6; i++) mango(c, frac(i / 6 + c.t * 0.04) * c.w, c.h * (0.3 + 0.2 * Math.sin(c.t + i)) - Math.abs(Math.sin((c.beat + i / 6) * Math.PI)) * c.h * 0.05, c.h * 0.06, c.t + i); }],
    [2, (c) => { vgrad(c, ['#ff9a3d', '#ffe14f']); radialLines(c, 20, '#fff4c0', 0.3 + 0.3 * c.pulse, c.t * 0.3, 0.1); for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + c.t * 0.6, r = c.h * (0.3 + 0.05 * c.pulse); mango(c, c.w / 2 + Math.cos(a) * r * 1.3, c.h / 2 + Math.sin(a) * r, c.h * 0.06, a); } mango(c, c.w / 2, c.h / 2, c.h * (0.14 + 0.03 * c.pulse), c.t * 0.3); }],
  ],
};

// ---- Dub Station: 低音がひびく夜の駅。スピーカーが脈打ち、エコーの輪が広がる ----
function speaker(c, x, y, s, k) {
  const g = c.g; g.fillStyle = '#14141a'; g.fillRect(x - s, y - s * 1.6, s * 2, s * 3.2);
  for (const [dy, r] of [[-0.8, 0.5], [0.5, 0.75]]) {
    g.fillStyle = '#2a2a34'; g.beginPath(); g.arc(x, y + dy * s, r * s * (1 + 0.08 * k), 0, TAU); g.fill();
    g.fillStyle = '#0a0a0e'; g.beginPath(); g.arc(x, y + dy * s, r * s * 0.4 * (1 + 0.12 * k), 0, TAU); g.fill();
  }
}
function echoRings(c, x, y, col, n = 5) {
  const g = c.g; g.strokeStyle = col;
  for (let i = 0; i < n; i++) { const r = frac(c.beat / 2 + i / n); g.globalAlpha = (1 - r) * 0.7; g.lineWidth = c.h * 0.008; g.beginPath(); g.arc(x, y, r * c.h * 0.8, 0, TAU); g.stroke(); }
  g.globalAlpha = 1;
}
const dubStation = {
  looks: [
    [0, (c, P) => { vgrad(c, ['#030806', '#0a1a10']); skyline(c, BLDS, c.h * 0.8, '#020604', '#5cff8f', 0.12); echoRings(c, c.w / 2, c.h * 0.6, P.main, 3); }],
    [1, (c, P) => { vgrad(c, ['#040a06', '#0e2214']); speaker(c, c.w * 0.25, c.h * 0.55, c.h * 0.16, c.pulse); speaker(c, c.w * 0.75, c.h * 0.55, c.h * 0.16, c.pulse); echoRings(c, c.w / 2, c.h * 0.5, P.main, 5); }],
    [2, (c, P) => { vgrad(c, ['#06140a', '#1a3a20']); echoRings(c, c.w / 2, c.h / 2, P.main, 8); for (let i = 0; i < 4; i++) speaker(c, c.w * (0.14 + i * 0.24), c.h * 0.6, c.h * 0.13, c.pulse); eqBars(c, 28, '#ffd84a', 0.6); }],
  ],
};

// ---- Dembow Lights: 夜の街のストリートパーティー。ネオンとビームが揺れる ----
function neonStrip(c, y, col, ph) {
  const g = c.g; g.save(); g.strokeStyle = col; g.lineWidth = c.h * 0.012; g.shadowColor = col; g.shadowBlur = 8;
  g.beginPath(); for (let i = 0; i <= 40; i++) { const x = i / 40 * c.w, yy = y + Math.sin(i * 0.6 + c.t * 3 + ph) * c.h * 0.03; i ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); g.restore();
}
const dembowLights = {
  looks: [
    [0, (c, P) => { vgrad(c, ['#120408', '#2a0a10']); skyline(c, BLDS, c.h * 0.85, '#08020a', '#ff6a3d', 0.2); neonStrip(c, c.h * 0.3, P.main, 0); }],
    [1, (c, P) => { vgrad(c, ['#10040a', '#300a18']); stageBeams(c, 5, [P.main, '#ffd84a'], 0.35, 1); neonStrip(c, c.h * 0.25, P.main, 0); neonStrip(c, c.h * 0.4, '#ffd84a', 2); crowd(c, '#08020a'); }],
    [2, (c, P) => { vgrad(c, ['#2a0610', '#5a1020']); stageBeams(c, 7, [P.main, '#ffd84a', '#ff3dd0'], 0.3 + 0.35 * c.pulse, 1.8); for (let i = 0; i < 4; i++) neonStrip(c, c.h * (0.15 + i * 0.12), [P.main, '#ffd84a', '#ff3dd0', '#3dd6ff'][i], i); confetti(c); crowd(c, '#08020a'); }],
  ],
};

export default {
  'morning-coffee': morningCoffee,
  'puddle-jump': puddleJump,
  'piano-rain': pianoRain,
  'polar-night': polarNight,
  'gospel-light': gospelLight,
  'lofi-library': lofiLibrary,
  'island-signal': islandSignal,
  'tropical-mango': tropicalMango,
  'dub-station': dubStation,
  'dembow-lights': dembowLights,
};

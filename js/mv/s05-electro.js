// 特製MV その5: エレクトロ(ニューディスコ・プログレッシブハウス・チル・チップチューン・ハウス・エレクトロスウィング・トラップ・テクノ・UKガラージ・フューチャーファンク)
import {
  TAU, frac, clamp01, ease, table, vgrad, text, twinkle, SKY, STARS, starfield, hills, fluffyClouds, waves, radialLines,
  retroSun, sparkle, bokeh, palm, moon, stageBeams, eqBars, crowd, beatRipples, vinyl, skyline, BLDS, hash1, ringSegments,
  grid, tunnel, pointTerrain, dotSphere, glitch, hexGrid, sprite, pixelScape, scanlines, jazzNote, neonSign, gear,
  mirrorball, lightSpots, wireCube, cloudBand, hsl, rain,
} from '../mv.js';

const bounce = (c, k = 1, ph = 0) => Math.abs(Math.sin((c.beat + ph) * Math.PI)) * c.h * 0.03 * k;

// ---- Ocean Drive: 海沿いの道をオープンカーで。夕日と並木、サビで海が光る ----
function car(c, x, base, s) {
  const g = c.g; g.fillStyle = '#ff3d8a'; g.beginPath(); g.moveTo(x - s, base - s * 0.15); g.lineTo(x - s * 0.9, base - s * 0.4); g.lineTo(x - s * 0.2, base - s * 0.45); g.lineTo(x + s * 0.2, base - s * 0.7); g.lineTo(x + s * 0.6, base - s * 0.45); g.lineTo(x + s, base - s * 0.38); g.lineTo(x + s, base - s * 0.15); g.fill();
  g.fillStyle = '#111'; for (const dx of [-0.6, 0.6]) { g.beginPath(); g.arc(x + dx * s, base - s * 0.12, s * 0.18, 0, TAU); g.fill(); }
  g.fillStyle = '#ffe0a0'; g.fillRect(x + s * 0.92, base - s * 0.34, s * 0.08, s * 0.08);
}
const coastRoad = (c, P) => { vgrad(c, ['#ff7a9a', '#ffb07a', '#ffe08a']); retroSun(c, c.w * 0.6, c.h * 0.55, c.h * 0.2, '#fff1a8', '#ff6a8a', '#ffb07a'); waves(c, 0.6, '#3a6aa8', '#2a4a8a', 0.6); c.g.fillStyle = '#2a1a3a'; c.g.fillRect(0, c.h * 0.84, c.w, c.h); for (let i = 0; i < 4; i++) palm(c, frac(i / 4 - c.t * 0.05) * c.w * 1.3 - c.w * 0.15, c.h * 0.86, c.h * 0.5, '#1a0a26', 0.15); car(c, c.w * 0.4, c.h * 0.9 - Math.abs(Math.sin(c.t * 8)) * 1.5, c.h * 0.12); };
const oceanDrive = {
  intro: coastRoad,
  looks: [
    [1, coastRoad],
    [1, (c, P) => { vgrad(c, ['#06142a', '#2a3a7a', '#ff7a9a']); twinkle(c, SKY, '#fff'); moon(c, c.w * 0.75, c.h * 0.25, c.h * 0.08, '#fff3d0'); waves(c, 0.62, '#1a2a5a', '#0e1a40', 0.6); for (let i = 0; i < 16; i++) { c.g.fillStyle = '#ffd27a'; c.g.globalAlpha = 0.5 + 0.5 * Math.sin(c.t * 3 + i); c.g.beginPath(); c.g.arc(c.w * (i + 0.5) / 16, c.h * 0.6, 2, 0, TAU); c.g.fill(); } c.g.globalAlpha = 1; }],
    [2, (c, P) => { vgrad(c, ['#3dd6ff', '#c8f6ff']); radialLines(c, 20, '#ffffff', 0.3 + 0.3 * c.pulse, c.t * 0.3, 0.1); retroSun(c, c.w / 2, c.h * 0.5, c.h * (0.18 + 0.02 * c.pulse), '#ffffff', '#ffd27a', 'rgba(0,0,0,0)'); waves(c, 0.65, '#1a8ad8', '#0a6ab8', 1.6); for (let i = 0; i < 8; i++) sparkle(c, c.w * (0.06 + i * 0.125), c.h * (0.72 + 0.08 * Math.sin(c.t * 2 + i)), c.h * 0.02 * (0.6 + c.pulse), '#fff', 0.9); }],
  ],
};

// ---- Ascent: 雲の上へのぼっていく。山の稜線、雲海、最後は宇宙へ ----
function peaks(c, base, col, amp, seed) {
  const g = c.g; g.fillStyle = col; g.beginPath(); g.moveTo(0, c.h);
  for (let i = 0; i <= 12; i++) { const x = i / 12 * c.w, y = base - (0.3 + 0.7 * hash1(i + seed)) * amp * (i % 2 ? 1 : 0.5); g.lineTo(x, y); }
  g.lineTo(c.w, c.h); g.fill();
}
const mountains = (c, P) => { vgrad(c, ['#2a4a8a', '#7ab8ff', '#d8ecff']); peaks(c, c.h * 0.75, '#3a5a8a', c.h * 0.35, 1); peaks(c, c.h * 0.85, '#2a3a6a', c.h * 0.3, 5); cloudBand(c, c.h * 0.82, '#ffffff', 0.02, 0.6); };
const progAscent = {
  intro: mountains,
  looks: [
    [1, mountains],
    [1, (c, P) => { vgrad(c, ['#7ab8ff', '#e8f4ff']); cloudBand(c, c.h * 0.6, '#ffffff', 0.03, 0.9); cloudBand(c, c.h * 0.75, '#e8f0ff', 0.05, 1); retroSun(c, c.w / 2, c.h * 0.35, c.h * 0.1, '#ffffff', '#fff1c0', 'rgba(0,0,0,0)'); }],
    [2, (c, P) => { vgrad(c, ['#0a1030', '#3a5aa8']); starfield(c, STARS, 0.6, '#fff'); radialLines(c, 24, P.main, 0.2 + 0.3 * c.pulse, c.t * 0.2, 0.2); dotSphere(c, c.w / 2, c.h * 1.1, c.h * 0.7, P.main, c.t * 0.1, 0.8); }],
    [0, (c) => { vgrad(c, ['#05081a', '#1a2a5a']); twinkle(c, SKY, '#fff'); peaks(c, c.h * 0.9, '#0a1020', c.h * 0.4, 9); }],
  ],
};

// ---- Cloud Point: 雲の点群。点でできた雲が流れ、形を変える ----
function pointCloud(c, cx, cy, R, col, t, n = 220) {
  const g = c.g; g.fillStyle = col;
  for (let i = 0; i < n; i++) { const a = hash1(i) * TAU, r = Math.sqrt(hash1(i + 1)) * R, x = cx + Math.cos(a) * r * 1.6 + Math.sin(t + i) * R * 0.03, y = cy + Math.sin(a) * r * 0.6; g.globalAlpha = 0.4 + 0.6 * hash1(i + 2); g.fillRect(x, y, 2, 2); }
  g.globalAlpha = 1;
}
const cloudSky = (c, P) => { vgrad(c, ['#04101a', '#0a2a3a']); for (let i = 0; i < 4; i++) pointCloud(c, frac(i / 4 + c.t * 0.01) * c.w * 1.4 - c.w * 0.2, c.h * (0.3 + (i % 2) * 0.3), c.h * 0.16, P.main, c.t, 160); };
const cloudPoint = {
  intro: cloudSky,
  looks: [
    [1, cloudSky],
    [1, (c, P) => { vgrad(c, ['#062030', '#0e3a4a']); pointTerrain(c, P.main, 0.3, 0.6, { alpha: 0.7 }); pointCloud(c, c.w / 2, c.h * 0.3, c.h * 0.2, '#ffffff', c.t, 200); }],
    [2, (c, P) => { vgrad(c, ['#0a3040', '#1a5a6a']); dotSphere(c, c.w / 2, c.h / 2, c.h * (0.3 + 0.02 * c.pulse), P.main, c.t * 0.4, 0.9); ringSegments(c, c.h * 0.42, 8, '#ffffff', c.t * 0.3, 0.4, 2); pointCloud(c, c.w / 2, c.h / 2, c.h * 0.4, '#ffffff', c.t, 120); }],
  ],
};

// ---- Pixel Quest: ドット絵の冒険。勇者が走り、宝箱、ボスの城 ----
const HERO = ['..aaa...', '.aaaaa..', '.bbcbc..', '.bbbbb..', '..ddd...', '.ddddd..', '.d.d.d..', '.e...e..'];
const HERO_PAL = { a: '#e83a3a', b: '#ffd8b8', c: '#1a1a2a', d: '#3a6ae8', e: '#5a3a1a' };
function hero(c, x, y, px, step) { sprite(c, x, y - (step ? px : 0), px, HERO, HERO_PAL); }
function chest(c, x, y, px, open) {
  const g = c.g; g.fillStyle = '#8a5a1a'; g.fillRect(x, y, px * 8, px * 5); g.fillStyle = '#ffd84a'; g.fillRect(x + px * 3.5, y + px * 2, px, px * 2);
  g.fillStyle = '#a86a2a'; g.fillRect(x, y - px * 2 - (open ? px * 2 : 0), px * 8, px * 2);
  if (open) { g.fillStyle = '#ffe14f'; g.globalAlpha = 0.6; g.beginPath(); g.moveTo(x + px * 4, y); g.lineTo(x - px * 4, y - px * 14); g.lineTo(x + px * 12, y - px * 14); g.fill(); g.globalAlpha = 1; }
}
const questField = (c, P) => { vgrad(c, ['#3a8aff', '#a8d8ff']); pixelScape(c, '#3a9a3a', '#ffffff', 1); const px = Math.max(3, Math.round(c.h / 60)); hero(c, c.w * 0.3, c.h * 0.62, px, Math.floor(c.beat * 2) % 2); };
const pixelQuest = {
  intro: questField,
  looks: [
    [1, questField],
    [1, (c, P) => { vgrad(c, ['#1a0a2a', '#3a1a4a']); const px = Math.max(3, Math.round(c.h / 60)); c.g.fillStyle = '#4a3a5a'; for (let x = 0; x < c.w; x += px * 4) c.g.fillRect(x, c.h * 0.75, px * 3.6, px * 3.6); hero(c, c.w * 0.25, c.h * 0.6, px, Math.floor(c.beat * 2) % 2); chest(c, c.w * 0.6, c.h * 0.65, px, frac(c.beat / 8) > 0.5); }],
    [2, (c, P) => { vgrad(c, ['#2a0a0a', '#6a1a1a']); tunnel(c, 4, 1.2, P.main, { rot: Math.PI / 4, lw: 4, n: 10 }); const px = Math.max(3, Math.round(c.h / 50)); for (let i = 0; i < 3; i++) hero(c, c.w * (0.25 + i * 0.25) - px * 4, c.h * 0.5 - bounce(c, 2, i / 3), px, 0); text(c, 'LEVEL UP!', c.w / 2, c.h * 0.22, c.h * 0.08, '#ffd84a', 0.6 + 0.4 * c.pulse, { glow: 8 }); }],
  ],
};

// ---- Pulse Grid: 光る格子が脈打つクラブの床。ピンクの波紋 ----
function pulseFloor(c, col, k) {
  const g = c.g, n = 12, m = 7, hy = c.h * 0.4;
  for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) {
    const z0 = j / m, z1 = (j + 1) / m, y0 = hy + (c.h - hy) * z0 * z0, y1 = hy + (c.h - hy) * z1 * z1;
    const w0 = c.w * (0.3 + 1.2 * z0 * z0) / n, w1 = c.w * (0.3 + 1.2 * z1 * z1) / n, x0 = c.w / 2 + (i - n / 2) * w0, x1 = c.w / 2 + (i - n / 2) * w1;
    const d = Math.hypot(i - n / 2, j - m) / 8, on = Math.abs(frac(c.beat / 2) - d) < 0.12;
    g.fillStyle = col; g.globalAlpha = (on ? 0.8 : 0.08) * (0.5 + 0.5 * z1) + 0.1 * k;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + w0, y0); g.lineTo(x1 + w1, y1); g.lineTo(x1, y1); g.fill();
  }
  g.globalAlpha = 1;
}
const gridClub = (c, P) => { vgrad(c, ['#05020a', '#1a0418']); pulseFloor(c, P.main, c.pulse); stageBeams(c, 3, [P.main], 0.25, 0.8); };
const pulseGrid = {
  intro: gridClub,
  looks: [
    [1, gridClub],
    [1, (c, P) => { vgrad(c, ['#0a0214', '#200830']); hexGrid(c, P.main, 0.15 + 0.2 * c.pulse); beatRipples(c, 4, () => [0.5, 0.5], P.main, 0.7, 1); }],
    [2, (c, P) => { vgrad(c, ['#2a0420', '#5a0a40']); pulseFloor(c, '#ffffff', c.pulse); stageBeams(c, 7, [P.main, '#7ab8ff', '#ffffff'], 0.3 + 0.35 * c.pulse, 1.6); crowd(c, '#05020a'); }],
    [0, (c, P) => { vgrad(c, ['#020104', '#0a0210']); grid(c, 0.55, P.main, 0.3, 0.5); }],
  ],
};

// ---- Swing Circuit: 1930年代のダンスホールが電子回路に。歯車と金のトランペット ----
function trumpet(c, x, y, s, rot) {
  const g = c.g; g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#ffcf4f';
  g.fillRect(-s, -s * 0.06, s * 1.4, s * 0.12); g.beginPath(); g.moveTo(s * 0.4, -s * 0.06); g.lineTo(s, -s * 0.35); g.lineTo(s, s * 0.35); g.lineTo(s * 0.4, s * 0.06); g.fill();
  g.fillRect(-s * 0.4, -s * 0.25, s * 0.08, s * 0.25); g.fillRect(-s * 0.2, -s * 0.25, s * 0.08, s * 0.25); g.fillRect(0, -s * 0.25, s * 0.08, s * 0.25);
  g.restore();
}
function circuit(c, col, alpha) {
  const g = c.g; g.strokeStyle = col; g.globalAlpha = alpha; g.lineWidth = 1.5;
  for (let i = 0; i < 18; i++) { const y = hash1(i) * c.h, x0 = hash1(i + 2) * c.w * 0.5; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + c.w * 0.2, y); g.lineTo(x0 + c.w * 0.25, y + c.h * 0.05); g.lineTo(x0 + c.w * 0.5, y + c.h * 0.05); g.stroke(); const k = frac(c.t * 0.5 + hash1(i + 4)); g.fillStyle = col; g.fillRect(x0 + c.w * 0.5 * k - 2, y + (k > 0.45 ? c.h * 0.05 : 0) - 2, 4, 4); }
  g.globalAlpha = 1;
}
const swingHall = (c, P) => { vgrad(c, ['#1a0a00', '#3a2000']); circuit(c, '#ffb84f', 0.4); gear(c, c.w * 0.2, c.h * 0.3, c.h * 0.15, 12, c.t * 0.5, '#8a6a2a', '#1a0a00'); gear(c, c.w * 0.8, c.h * 0.7, c.h * 0.18, 14, -c.t * 0.4, '#8a6a2a', '#1a0a00'); trumpet(c, c.w / 2, c.h / 2, c.h * 0.22, Math.sin(c.beat * Math.PI / 2) * 0.1); };
const swingCircuit = {
  intro: swingHall,
  looks: [
    [1, swingHall],
    [1, (c, P) => { vgrad(c, ['#2a1400', '#5a3000']); for (let i = 0; i < 4; i++) trumpet(c, c.w * (0.15 + i * 0.23), c.h * 0.5 - bounce(c, 1.5, i * 0.25), c.h * 0.12, -0.3 + Math.sin(c.beat * Math.PI + i) * 0.1); for (let i = 0; i < 6; i++) jazzNote(c, c.w * (0.1 + i * 0.16), c.h * (0.3 - frac(c.t * 0.2 + i / 6) * 0.25), c.h * 0.06, '#ffe0a0', 0.7); }],
    [2, (c, P) => { vgrad(c, ['#3a1a00', '#8a5000']); radialLines(c, 24, '#ffd84a', 0.25 + 0.3 * c.pulse, c.t * 0.4, 0.1); circuit(c, '#ffffff', 0.5); gear(c, c.w / 2, c.h / 2, c.h * (0.3 + 0.02 * c.pulse), 18, c.t, '#ffcf4f', '#3a1a00'); trumpet(c, c.w / 2, c.h / 2, c.h * 0.16, c.t); }],
  ],
};

// ---- Low Orbit: 地球の低軌道。宇宙ステーションと地球の夜景、重い低音で画面が揺れる ----
function earthLimb(c, col) {
  const g = c.g, R = c.w * 1.2, cx = c.w / 2, cy = c.h + R * 0.82;
  const gr = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.05); gr.addColorStop(0, '#0a1a3a'); gr.addColorStop(0.92, '#1a4a8a'); gr.addColorStop(0.96, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R * 1.05, 0, TAU); g.fill();
  g.fillStyle = '#ffd27a'; for (let i = 0; i < 60; i++) { const a = -Math.PI / 2 + (hash1(i) - 0.5) * 0.7 + c.t * 0.005, r = R * (0.9 + hash1(i + 3) * 0.08); g.globalAlpha = 0.5; g.fillRect(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.5, 1.5); }
  g.globalAlpha = 1;
}
function station(c, x, y, s, rot) {
  const g = c.g; g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = '#c8c8d0'; g.fillRect(-s * 0.2, -s * 0.08, s * 0.4, s * 0.16);
  g.fillStyle = '#2a3a8a'; for (const dx of [-1, 1]) { g.fillRect(dx * s * 0.25 - (dx < 0 ? s * 0.5 : 0), -s * 0.12, s * 0.5, s * 0.24); }
  g.strokeStyle = '#8a8a9a'; g.lineWidth = 1; g.beginPath(); g.moveTo(-s * 0.75, 0); g.lineTo(s * 0.75, 0); g.stroke();
  g.restore();
}
const orbit = (c, P) => { const sh = c.pulse * c.h * 0.006; c.g.save(); c.g.translate(0, sh); vgrad(c, ['#000004', '#05051a']); twinkle(c, SKY, '#fff'); earthLimb(c, P.main); station(c, c.w * 0.5, c.h * 0.35, c.h * 0.2, Math.sin(c.t * 0.1) * 0.2); c.g.restore(); };
const lowOrbit = {
  intro: orbit,
  looks: [
    [1, orbit],
    [1, (c, P) => { vgrad(c, ['#000002', '#0a0418']); starfield(c, STARS, 0.15, '#fff'); dotSphere(c, c.w * 0.65, c.h * 0.55, c.h * 0.32, P.main, c.t * 0.15, 0.8); station(c, c.w * 0.25, c.h * 0.3, c.h * 0.12, c.t * 0.2); }],
    [2, (c, P) => { const sh = c.pulse * c.h * 0.012; c.g.save(); c.g.translate(Math.sin(c.t * 53) * sh * 0.5, sh); vgrad(c, ['#0a0420', '#2a0a50']); tunnel(c, 6, 1, P.main, { rot: c.t * 0.2, lw: 2.4 }); starfield(c, STARS, 1, '#fff', 2.6); c.g.restore(); glitch(c, c.pulse * 0.4, Math.floor(c.beat * 2)); }],
  ],
};

// ---- Iron Pulse: 工場のテクノ。ピストンが上下し、溶けた鉄の火花 ----
function pistons(c, n, col, hot) {
  const g = c.g;
  for (let i = 0; i < n; i++) { const x = c.w * (i + 0.5) / n, k = Math.abs(Math.sin((c.beat + i / n) * Math.PI)), y = c.h * (0.2 + 0.3 * k); g.fillStyle = '#2a2e34'; g.fillRect(x - c.w * 0.03, 0, c.w * 0.06, y); g.fillStyle = col; g.fillRect(x - c.w * 0.045, y, c.w * 0.09, c.h * 0.06); g.fillStyle = hot; g.globalAlpha = k * 0.6; g.fillRect(x - c.w * 0.045, c.h * 0.85, c.w * 0.09, c.h * 0.03); g.globalAlpha = 1; }
  g.fillStyle = '#14161a'; g.fillRect(0, c.h * 0.88, c.w, c.h);
}
const factory = (c, P) => { vgrad(c, ['#06080a', '#141a1c']); pistons(c, 6, '#4a5258', P.main); };
const ironPulse = {
  intro: factory,
  looks: [
    [1, factory],
    [1, (c, P) => { vgrad(c, ['#040606', '#0e1414']); for (let i = 0; i < 3; i++) gear(c, c.w * (0.2 + i * 0.3), c.h * 0.5, c.h * (0.2 - i * 0.03), 10 + i * 2, c.t * (i % 2 ? -0.6 : 0.6), '#3a4248', '#040606'); hexGrid(c, P.main, 0.08 + 0.1 * c.pulse); }],
    [2, (c, P) => { vgrad(c, ['#0a0604', '#3a1a08']); pistons(c, 8, '#5a6268', '#ff8a2a'); for (let i = 0; i < 40; i++) { const k = frac(c.t * 0.8 + hash1(i)), x = c.w * hash1(i + 3), y = c.h * (0.85 - k * 0.6); c.g.fillStyle = '#ffb347'; c.g.globalAlpha = 1 - k; c.g.fillRect(x + Math.sin(i) * k * 30, y, 2, 2); } c.g.globalAlpha = 1; }],
  ],
};

// ---- Garage Shuffle: ロンドンの地下鉄と雨。2ステップのリズムで光がはねる ----
function tubeSign(c, x, y, R, label) {
  const g = c.g; g.strokeStyle = '#e8322a'; g.lineWidth = R * 0.25; g.beginPath(); g.arc(x, y, R, 0, TAU); g.stroke();
  g.fillStyle = '#1a3a9a'; g.fillRect(x - R * 1.4, y - R * 0.22, R * 2.8, R * 0.44); text(c, label, x, y, R * 0.3, '#ffffff', 1, { weight: 700 });
}
const londonTube = (c, P) => { vgrad(c, ['#0a0c14', '#1a1e2a']); rain(c, 'rgba(180,200,255,0.7)', 1); tubeSign(c, c.w / 2, c.h * 0.4, c.h * 0.16, 'GARAGE'); eqBars(c, 24, P.main, 0.4); };
const garageShuffle = {
  intro: londonTube,
  looks: [
    [1, londonTube],
    [1, (c, P) => { vgrad(c, ['#04100c', '#0a2a1e']); for (let i = 0; i < 2; i++) { const step = [0, 0.75][i]; const k = Math.exp(-frac(c.beat + step) * 5); c.g.fillStyle = P.main; c.g.globalAlpha = k * 0.6; c.g.beginPath(); c.g.arc(c.w * (0.35 + i * 0.3), c.h * 0.5, c.h * (0.15 + 0.1 * k), 0, TAU); c.g.fill(); } c.g.globalAlpha = 1; skyline(c, BLDS, c.h * 0.9, '#020806', '#5effc6', 0.15); }],
    [2, (c, P) => { vgrad(c, ['#0a2a20', '#1a5a40']); stageBeams(c, 6, [P.main, '#ffffff'], 0.3 + 0.3 * c.pulse, 1.4); vinyl(c, c.w / 2, c.h / 2, c.h * 0.3, c.t * 2.2, P.main); crowd(c, '#020806'); }],
  ],
};

// ---- Neon Boulevard: フューチャーファンク。ピンクのネオン街と80年代アニメ風の夕焼け ----
const neonStreet = (c, P) => { vgrad(c, ['#2a0a3a', '#ff5ec4', '#ffb0d0']); retroSun(c, c.w / 2, c.h * 0.5, c.h * 0.2, '#fff1a8', P.main, '#ff8ad0'); skyline(c, BLDS, c.h * 0.78, '#1a0628', '#ff7ad9', 0.35); grid(c, 0.78, '#ffffff', 0.8, 0.6); };
const neonBoulevard = {
  intro: neonStreet,
  looks: [
    [1, neonStreet],
    [1, (c, P) => { vgrad(c, ['#1a0428', '#3a0a50']); neonSign(c, 'ネオン', c.w * 0.3, c.h * 0.3, c.h * 0.1, P.main, 1); neonSign(c, 'BLVD', c.w * 0.7, c.h * 0.45, c.h * 0.1, '#7ad8ff', Math.sin(c.t * 8) > 0.9 ? 0.3 : 1); skyline(c, BLDS, c.h * 0.95, '#0a0214', '#ff7ad9', 0.3); }],
    [2, (c, P) => { vgrad(c, ['#ff5ec4', '#ffd0f0']); radialLines(c, 24, '#ffffff', 0.25 + 0.35 * c.pulse, c.t * 0.4, 0.05); vinyl(c, c.w / 2, c.h / 2, c.h * (0.3 + 0.015 * c.pulse), c.t * 2.5, '#7ad8ff'); for (let i = 0; i < 6; i++) sparkle(c, c.w * (0.1 + i * 0.16), c.h * (0.2 + 0.6 * hash1(i)), c.h * 0.03 * (0.6 + c.pulse), '#fff', 0.9); }],
  ],
};

export default {
  'ocean-drive': oceanDrive,
  'prog-ascent': progAscent,
  'cloud-point': cloudPoint,
  'pixel-quest': pixelQuest,
  'pulse-grid': pulseGrid,
  'swing-circuit': swingCircuit,
  'low-orbit': lowOrbit,
  'iron-pulse': ironPulse,
  'garage-shuffle': garageShuffle,
  'neon-boulevard': neonBoulevard,
};

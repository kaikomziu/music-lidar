// 特製MV その9: 音源ファイルの曲と、ポップ・ギミック系(サンフラワー・シャイニングスター・水の追憶・Hydrangea・蒼・SUMMER TRIANGLE・ハイパーポップ・ドラムンベース・ギミック2曲)
import {
  TAU, frac, clamp01, ease, table, vgrad, text, twinkle, SKY, STARS, starfield, hills, birds, fluffyClouds, waves, radialLines,
  retroSun, sparkle, bokeh, moon, stageBeams, eqBars, crowd, beatRipples, skyline, BLDS, hash1, ringSegments, grid, tunnel,
  pointTerrain, dotSphere, glitch, hexGrid, heart, candySwirl, risingBubbles, star5, confetti, scanlines, rain, firework,
  milkyWay, shootingStar, fireflies, cloudBand, gear, clockHand, snowCrystal, hsl,
} from '../mv.js';

const bounce = (c, k = 1, ph = 0) => Math.abs(Math.sin((c.beat + ph) * Math.PI)) * c.h * 0.03 * k;

// ---- Sunflower Road: ひまわり畑の一本道。青空と入道雲、ひまわりが拍でゆれる ----
function sunflower(c, x, base, s, ph) {
  const g = c.g, sw = Math.sin(c.beat * Math.PI / 2 + ph) * 0.08;
  g.strokeStyle = '#3a8a2a'; g.lineWidth = s * 0.06; g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x, base - s * 0.5, x + sw * s, base - s); g.stroke();
  g.save(); g.translate(x + sw * s, base - s); g.rotate(sw);
  g.fillStyle = '#ffd84a'; for (let i = 0; i < 14; i++) { g.save(); g.rotate(i * TAU / 14); g.beginPath(); g.ellipse(0, -s * 0.22, s * 0.06, s * 0.14, 0, 0, TAU); g.fill(); g.restore(); }
  g.fillStyle = '#5a3a14'; g.beginPath(); g.arc(0, 0, s * 0.12, 0, TAU); g.fill(); g.restore();
}
const flowerRoad = (c) => { vgrad(c, ['#3aa0ff', '#bfe6ff']); g_cumulus(c); hills(c, c.h * 0.62, '#6ab04a', c.h * 0.02, 0.01, 0); c.g.fillStyle = '#c8b080'; c.g.beginPath(); c.g.moveTo(c.w * 0.48, c.h * 0.62); c.g.lineTo(c.w * 0.52, c.h * 0.62); c.g.lineTo(c.w * 0.7, c.h); c.g.lineTo(c.w * 0.3, c.h); c.g.fill(); for (let i = 0; i < 8; i++) { sunflower(c, c.w * (0.03 + i * 0.035), c.h * 0.98, c.h * (0.2 + i * 0.02), i); sunflower(c, c.w * (0.97 - i * 0.035), c.h * 0.98, c.h * (0.2 + i * 0.02), i + 0.5); } };
function g_cumulus(c) { const g = c.g; g.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(c.w * (0.55 + i * 0.06), c.h * (0.4 - Math.sin(i / 5 * Math.PI) * 0.15), c.h * (0.08 + 0.04 * Math.sin(i / 5 * Math.PI)), 0, TAU); g.fill(); } }
const sunflowerRoad = {
  intro: flowerRoad,
  looks: [
    [1, flowerRoad],
    [1, (c) => { vgrad(c, ['#ffb84a', '#ffeec8']); retroSun(c, c.w / 2, c.h * 0.5, c.h * 0.18, '#fff6c8', '#ff9a3d', 'rgba(0,0,0,0)'); for (let i = 0; i < 12; i++) sunflower(c, c.w * (i + 0.5) / 12, c.h, c.h * (0.28 + 0.06 * hash1(i)), i); }],
    [2, (c) => { vgrad(c, ['#ffd84a', '#fff6d0']); radialLines(c, 24, '#ffffff', 0.3 + 0.3 * c.pulse, c.t * 0.3, 0.05); sunflower(c, c.w / 2, c.h * 1.25, c.h * (0.9 + 0.04 * c.pulse), 0); for (let i = 0; i < 6; i++) sparkle(c, c.w * (0.1 + i * 0.16), c.h * 0.2, c.h * 0.03 * (0.5 + c.pulse), '#fff', 0.9); }],
  ],
};

// ---- シャイニングスター: きらめく星のステージ。星が流れ、キラキラがはじける ----
const starStage = (c, P) => { vgrad(c, ['#0a0a30', '#2a1a5a', '#5a2a6a']); twinkle(c, SKY, '#fff', 0.8); for (let i = 0; i < 3; i++) shootingStar(c, Math.floor(c.beat / 4) * 3 + i, frac(c.beat / 4 + i / 3)); star5(c, c.w / 2, c.h * 0.45, c.h * (0.16 + 0.02 * c.pulse), P.main, 1, 1, c.t * 0.3); };
const shiningStar = {
  intro: starStage,
  looks: [
    [1, starStage],
    [1, (c, P) => { vgrad(c, ['#1a0a3a', '#4a1a5a']); stageBeams(c, 5, [P.main, '#ffffff'], 0.3, 0.8); for (let i = 0; i < 9; i++) star5(c, c.w * (0.06 + i * 0.11), c.h * (0.5 + 0.25 * Math.sin(c.t + i)) - bounce(c, 1, i / 9), c.h * 0.04, i % 2 ? P.main : '#ffffff', 0.9, 0.6, c.t + i); }],
    [2, (c, P) => { vgrad(c, ['#ffcf4a', '#ffeec8']); radialLines(c, 30, '#ffffff', 0.3 + 0.35 * c.pulse, c.t * 0.4, 0.05); star5(c, c.w / 2, c.h / 2, c.h * (0.26 + 0.04 * c.pulse), '#ffffff', 1, 1, c.t * 0.5); for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + c.t; star5(c, c.w / 2 + Math.cos(a) * c.h * 0.42, c.h / 2 + Math.sin(a) * c.h * 0.38, c.h * 0.04, '#ff8ac0', 0.9, 0.6, -c.t); } confetti(c); }],
    [0, (c, P) => { vgrad(c, ['#05051a', '#14143a']); milkyWay(c, 0.4); twinkle(c, SKY, '#fff', 0.5); }],
  ],
};

// ---- 水の追憶: 水の中の記憶。光の差す水中、しずくと波紋、ピアノの鍵盤が沈む ----
function caustics(c, a) { const g = c.g; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(160,230,255,${0.18 * a})`; g.lineWidth = 2; for (let k = 0; k < 6; k++) { g.beginPath(); for (let x = 0; x <= c.w; x += 10) { const y = c.h * (0.1 + k * 0.14) + Math.sin(x * 0.02 + c.t * 1.2 + k * 2) * c.h * 0.03 + Math.sin(x * 0.05 - c.t + k) * c.h * 0.01; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } g.restore(); }
function sunkKeys(c, y, s, rot) { const g = c.g; g.save(); g.translate(c.w / 2, y); g.rotate(rot); g.globalAlpha = 0.7; for (let i = 0; i < 14; i++) { g.fillStyle = '#e8f4ff'; g.fillRect(-s * 3.5 + i * s * 0.5, 0, s * 0.46, s * 1.6); } g.fillStyle = '#0a1a2a'; for (let i = 0; i < 13; i++) if ([0, 1, 3, 4, 5].includes(i % 7)) g.fillRect(-s * 3.5 + i * s * 0.5 + s * 0.32, 0, s * 0.3, s * 1); g.restore(); g.globalAlpha = 1; }
const underwater = (c, P) => { vgrad(c, ['#2a8ad0', '#0a3a6a', '#02142a']); caustics(c, 1); sunkKeys(c, c.h * 0.7, c.h * 0.06, Math.sin(c.t * 0.3) * 0.05); risingBubbles(c, 0.6, 0.4, 0.5); };
const mizuNoTsuioku = {
  intro: underwater,
  looks: [
    [1, underwater],
    [1, (c, P) => { vgrad(c, ['#0a2a4a', '#04142a']); beatRipples(c, 5, (i) => [0.2 + hash1(i) * 0.6, 0.3 + hash1(i + 9) * 0.4], '#bfe8ff', 0.35, 1); for (let i = 0; i < 12; i++) { const k = frac(c.t * 0.3 + hash1(i)); c.g.fillStyle = '#bfe8ff'; c.g.globalAlpha = 1 - k; c.g.beginPath(); c.g.arc(c.w * hash1(i + 3), k * c.h * 0.6, c.h * 0.008, 0, TAU); c.g.fill(); } c.g.globalAlpha = 1; }],
    [2, (c, P) => { vgrad(c, ['#4fc3ff', '#0a4a8a']); radialLines(c, 24, '#ffffff', 0.2 + 0.3 * c.pulse, c.t * 0.2, 0.1); caustics(c, 2); beatRipples(c, 4, () => [0.5, 0.5], '#ffffff', 0.7, 1); risingBubbles(c, 1.4, 0.6, 0.7); }],
    [0, (c) => { vgrad(c, ['#04142a', '#000510']); caustics(c, 0.5); }],
  ],
};

// ---- Hydrangea: 雨の日の紫陽花。花びらの集まりが色を変え、雨粒が光る ----
function hydrangeaBall(c, x, y, R, hue) {
  const g = c.g;
  for (let i = 0; i < 40; i++) { const a = hash1(i) * TAU, r = Math.sqrt(hash1(i + 1)) * R, px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.85, s = R * 0.16; g.fillStyle = hsl(hue + hash1(i + 2) * 40 - 20, 60, 62 + hash1(i + 3) * 15); g.save(); g.translate(px, py); g.rotate(a); for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.beginPath(); g.ellipse(0, -s * 0.5, s * 0.35, s * 0.5, 0, 0, TAU); g.fill(); } g.restore(); }
}
function bigLeaf(c, x, y, s, rot) { const g = c.g; g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#2a6a3a'; g.beginPath(); g.ellipse(0, 0, s, s * 0.5, 0, 0, TAU); g.fill(); g.strokeStyle = '#4a9a5a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.stroke(); g.restore(); }
const rainyGarden = (c, P) => { vgrad(c, ['#5a6a8a', '#9aa8c8']); rain(c, 'rgba(255,255,255,0.8)', 0.7); bigLeaf(c, c.w * 0.2, c.h * 0.85, c.h * 0.2, -0.4); bigLeaf(c, c.w * 0.8, c.h * 0.88, c.h * 0.22, 0.3); hydrangeaBall(c, c.w * 0.3, c.h * 0.6, c.h * 0.16, 250 + Math.sin(c.t * 0.2) * 20); hydrangeaBall(c, c.w * 0.65, c.h * 0.55, c.h * 0.2, 210 + Math.sin(c.t * 0.25) * 20); };
const hydrangea = {
  intro: rainyGarden,
  looks: [
    [1, rainyGarden],
    [1, (c, P) => { vgrad(c, ['#3a3a6a', '#7a7ab0']); beatRipples(c, 5, (i) => [0.15 + hash1(i) * 0.7, 0.75 + hash1(i + 4) * 0.2], '#ffffff', 0.25, 1); hydrangeaBall(c, c.w / 2, c.h * 0.45, c.h * 0.25, 270 + Math.sin(c.t * 0.3) * 40); rain(c, 'rgba(220,230,255,0.7)', 1); }],
    [2, (c, P) => { vgrad(c, ['#9b8cff', '#e0d8ff']); radialLines(c, 24, '#ffffff', 0.25 + 0.3 * c.pulse, c.t * 0.3, 0.1); for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + c.t * 0.3; hydrangeaBall(c, c.w / 2 + Math.cos(a) * c.h * 0.4, c.h / 2 + Math.sin(a) * c.h * 0.3, c.h * (0.12 + 0.015 * c.pulse), 200 + i * 25); } }],
    [0, (c) => { vgrad(c, ['#2a2a40', '#4a4a6a']); rain(c, 'rgba(200,210,240,0.6)', 0.5); hydrangeaBall(c, c.w * 0.7, c.h * 0.6, c.h * 0.14, 240); }],
  ],
};

// ---- 蒼: どこまでも青い空と海。風に流れる雲と鳥、サビで空が澄みわたる ----
function blueHorizon(c, sky, sea) { vgrad(c, sky); const g = c.g, y = c.h * 0.62; const gr = g.createLinearGradient(0, y, 0, c.h); gr.addColorStop(0, sea[0]); gr.addColorStop(1, sea[1]); g.fillStyle = gr; g.fillRect(0, y, c.w, c.h - y); g.fillStyle = '#ffffff'; for (let i = 0; i < 20; i++) { g.globalAlpha = 0.3; g.fillRect(c.w * frac(hash1(i) + c.t * 0.01 * (1 + hash1(i + 1))), y + (c.h - y) * hash1(i + 2), c.w * 0.04, 1.5); } g.globalAlpha = 1; }
const aoSky = (c, P) => { blueHorizon(c, ['#0a3a9a', '#3f8cff', '#bfe0ff'], ['#2a6ad0', '#0a2a7a']); cloudBand(c, c.h * 0.3, '#ffffff', 0.02, 0.7); birds(c, '#0a1a4a'); };
const ao = {
  intro: aoSky,
  looks: [
    [1, aoSky],
    [1, (c, P) => { blueHorizon(c, ['#02082a', '#0a1a5a', '#3f5aa8'], ['#0a1a4a', '#02061a']); twinkle(c, SKY, '#fff'); moon(c, c.w * 0.7, c.h * 0.28, c.h * 0.08, '#e8f0ff'); }],
    [2, (c, P) => { blueHorizon(c, ['#3f8cff', '#9ad0ff', '#ffffff'], ['#5aa0ff', '#1a5ac8']); radialLines(c, 24, '#ffffff', 0.25 + 0.3 * c.pulse, c.t * 0.2, 0.05); for (let i = 0; i < 8; i++) { const x = frac(i / 8 + c.t * 0.05) * c.w, y = c.h * (0.2 + 0.3 * hash1(i)); c.g.strokeStyle = '#ffffff'; c.g.lineWidth = 2; c.g.globalAlpha = 0.6; c.g.beginPath(); c.g.moveTo(x, y); c.g.quadraticCurveTo(x - c.w * 0.1, y + Math.sin(c.t + i) * c.h * 0.03, x - c.w * 0.2, y); c.g.stroke(); } c.g.globalAlpha = 1; birds(c, '#ffffff'); }],
    [0, (c) => { blueHorizon(c, ['#000818', '#02123a'], ['#020a24', '#000208']); twinkle(c, SKY, '#fff', 0.3); }],
  ],
};

// ---- SUMMER TRIANGLE: 夏の夜空の大三角。ベガ・アルタイル・デネブを結ぶ線と、天の川・花火 ----
const TRI = [[0.35, 0.25], [0.68, 0.38], [0.45, 0.62]];
function triangle(c, a, col) { const g = c.g; g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = 2; g.beginPath(); TRI.forEach(([x, y], i) => (i ? g.lineTo(x * c.w, y * c.h) : g.moveTo(x * c.w, y * c.h))); g.closePath(); g.stroke(); g.globalAlpha = 1; TRI.forEach(([x, y], i) => star5(c, x * c.w, y * c.h, c.h * (0.03 + 0.01 * c.pulse), '#ffffff', 1, 1, c.t + i)); }
const summerNight = (c, P) => { vgrad(c, ['#020818', '#0a1a3a', '#1a2a4a']); milkyWay(c, 0.5); twinkle(c, SKY, '#fff', 0.4); triangle(c, ease(c.p * 2), P.main); hills(c, c.h * 0.88, '#02040a', c.h * 0.03, 0.01, 0); fireflies(c, 0.6); };
const summerTriangle = {
  intro: summerNight,
  looks: [
    [1, summerNight],
    [1, (c, P) => { vgrad(c, ['#05102a', '#1a2a5a']); for (let i = 0; i < 4; i++) firework(c, c.w * (0.2 + i * 0.2), c.h * (0.3 + (i % 2) * 0.1), frac(c.beat / 4 + i / 4), [P.main, '#ffd84a', '#ff8ac0', '#ffffff'][i], c.h * 0.18); skyline(c, BLDS, c.h * 0.95, '#02040c', '#ffd27a', 0.2); }],
    [2, (c, P) => { vgrad(c, ['#0a2a6a', '#3a6ac8']); radialLines(c, 24, '#ffffff', 0.2 + 0.3 * c.pulse, c.t * 0.2, 0.2); milkyWay(c, 0.7); triangle(c, 1, '#ffffff'); for (let i = 0; i < 3; i++) shootingStar(c, Math.floor(c.beat / 2) * 3 + i, frac(c.beat / 2 + i / 3)); }],
  ],
};

// ---- Hyperpop Glitch: ハイパーポップ。ピンクのノイズ、絵文字みたいなハートとバグる文字 ----
const hyper = (c, P) => { candySwirl(c, ['#ff5ec4', '#ffb0e8', '#b0f0ff', '#fff0a0'], c.t * 0.8); glitch(c, 0.2 + 0.5 * c.pulse, Math.floor(c.beat * 2)); text(c, 'h y p e r', c.w / 2, c.h / 2, c.h * 0.14, '#ffffff', 0.9, { glow: 10 }); };
const hyperpopGlitch = {
  intro: hyper,
  looks: [
    [1, hyper],
    [1, (c, P) => { vgrad(c, ['#1a0428', '#4a0a60']); for (let i = 0; i < 10; i++) heart(c, c.w * hash1(i), c.h * hash1(i + 4) - bounce(c, 1, i / 10), c.h * 0.05, ['#ff5ec4', '#7af7ff', '#fff06a'][i % 3], 0.9); scanlines(c, 0.2); glitch(c, c.pulse * 0.6, Math.floor(c.beat * 4)); }],
    [2, (c, P) => { vgrad(c, ['#ff5ec4', '#7af7ff']); tunnel(c, 4, 2, '#ffffff', { rot: c.t * 1.5, lw: 3 }); heart(c, c.w / 2, c.h / 2, c.h * (0.18 + 0.05 * c.pulse), '#ffffff'); glitch(c, 0.5 + 0.5 * c.pulse, Math.floor(c.beat * 4)); }],
  ],
};

// ---- Circuit Breaker: 電子回路の中を高速で。基板の線と、ショートした火花 ----
function pcb(c, col, speed) {
  const g = c.g; g.strokeStyle = col; g.lineWidth = 2; g.globalAlpha = 0.5;
  for (let i = 0; i < 16; i++) { const y = c.h * (i + 0.5) / 16, off = frac(c.t * speed * (0.5 + hash1(i))) * c.w; g.beginPath(); g.moveTo(-c.w + off, y); for (let k = 0; k < 6; k++) { const x = -c.w + off + k * c.w * 0.4; g.lineTo(x + c.w * 0.25, y); g.lineTo(x + c.w * 0.3, y + (hash1(i + k) > 0.5 ? 1 : -1) * c.h / 32); g.lineTo(x + c.w * 0.4, y + (hash1(i + k) > 0.5 ? 1 : -1) * c.h / 32); } g.stroke(); }
  g.globalAlpha = 1;
}
const board = (c, P) => { vgrad(c, ['#020a04', '#0a1a0a']); pcb(c, P.main, 0.4); for (let i = 0; i < 4; i++) { c.g.fillStyle = '#14141a'; c.g.fillRect(c.w * (0.15 + i * 0.2), c.h * 0.4, c.w * 0.1, c.h * 0.2); c.g.fillStyle = P.main; c.g.globalAlpha = 0.5 + 0.5 * c.pulse; c.g.fillRect(c.w * (0.17 + i * 0.2), c.h * 0.45, c.w * 0.02, c.h * 0.02); c.g.globalAlpha = 1; } };
const circuitBreaker = {
  intro: board,
  looks: [
    [1, board],
    [1, (c, P) => { vgrad(c, ['#040a02', '#0e1e06']); tunnel(c, 4, 1.4, P.main, { rot: Math.PI / 4, lw: 2.5 }); pcb(c, '#ffffff', 1); }],
    [2, (c, P) => { vgrad(c, ['#0a2a04', '#2a5a0a']); pcb(c, '#ffffff', 2); for (let i = 0; i < 3; i++) { const k = frac(c.beat + i / 3); c.g.fillStyle = P.main; for (let j = 0; j < 12; j++) { const a = j * TAU / 12; c.g.globalAlpha = 1 - k; c.g.fillRect(c.w * (0.25 + i * 0.25) + Math.cos(a) * k * c.h * 0.2, c.h / 2 + Math.sin(a) * k * c.h * 0.2, 3, 3); } } c.g.globalAlpha = 1; glitch(c, c.pulse * 0.4, Math.floor(c.beat * 2)); }],
  ],
};

// ---- Mirage Shift: 砂漠の蜃気楼。地平線がゆらぎ、遠くの街が現れては消える ----
function heatHaze(c, y, col) { const g = c.g; g.fillStyle = col; for (let k = 0; k < 8; k++) { const yy = y + k * c.h * 0.012; g.globalAlpha = 0.25; g.beginPath(); g.moveTo(0, yy); for (let x = 0; x <= c.w; x += 8) g.lineTo(x, yy + Math.sin(x * 0.03 + c.t * 3 + k) * c.h * 0.006); g.lineTo(c.w, yy + c.h * 0.01); g.lineTo(0, yy + c.h * 0.01); g.fill(); } g.globalAlpha = 1; }
const mirage = (c, P) => { vgrad(c, ['#ffb84a', '#ffe8b0']); retroSun(c, c.w * 0.7, c.h * 0.35, c.h * 0.1, '#ffffff', '#ffd06f', 'rgba(0,0,0,0)'); c.g.globalAlpha = 0.3 + 0.3 * Math.sin(c.t * 0.5); skyline(c, BLDS, c.h * 0.55, '#c88a4a', '#ffffff', 0); c.g.globalAlpha = 1; c.g.fillStyle = '#e8b06a'; c.g.fillRect(0, c.h * 0.55, c.w, c.h); heatHaze(c, c.h * 0.55, '#ffe8b0'); };
const mirageShift = {
  intro: mirage,
  looks: [
    [1, mirage],
    [1, (c, P) => { c.g.save(); c.g.translate(Math.sin(c.t * 1.5) * c.w * 0.04, 0); mirage(c, P); c.g.restore(); for (let i = 0; i < 3; i++) { c.g.fillStyle = `rgba(255,255,255,${0.15})`; c.g.fillRect(0, c.h * (0.3 + i * 0.15 + 0.05 * Math.sin(c.t + i)), c.w, c.h * 0.02); } }],
    [2, (c, P) => { vgrad(c, ['#ffd06f', '#fff6d8']); radialLines(c, 24, '#ffffff', 0.25 + 0.3 * c.pulse, c.t * 0.4, 0.1); for (let k = 0; k < 4; k++) { c.g.globalAlpha = 0.25; skyline(c, BLDS, c.h * (0.5 + k * 0.1) + Math.sin(c.t * 2 + k) * c.h * 0.02, '#c88a4a', '#ffffff', 0); } c.g.globalAlpha = 1; heatHaze(c, c.h * 0.7, '#ffffff'); }],
  ],
};

// ---- Freeze Frame: 時間が止まる。凍りついた瞬間、時計と雪の結晶、ひびの入った画面 ----
function clockFace(c, x, y, R, t, stop) { const g = c.g; g.strokeStyle = '#e0d0ff'; g.lineWidth = R * 0.05; g.beginPath(); g.arc(x, y, R, 0, TAU); g.stroke(); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; g.beginPath(); g.moveTo(x + Math.cos(a) * R * 0.85, y + Math.sin(a) * R * 0.85); g.lineTo(x + Math.cos(a) * R * 0.95, y + Math.sin(a) * R * 0.95); g.stroke(); } const tt = stop ? Math.floor(t / 2) * 2 : t; clockHand(c, x, y, R * 0.75, tt * 0.8 - Math.PI / 2, R * 0.04, '#ffffff'); clockHand(c, x, y, R * 0.5, tt * 0.07 - Math.PI / 2, R * 0.06, '#c49bff'); }
const frozen = (c, P) => { vgrad(c, ['#0a0820', '#2a2050']); for (let i = 0; i < 6; i++) snowCrystal(c, c.w * (0.1 + i * 0.16), c.h * (0.2 + 0.6 * hash1(i)), c.h * 0.06, i, '#e0d8ff', 0.8, 0.5); clockFace(c, c.w / 2, c.h / 2, c.h * 0.25, c.t, frac(c.beat / 4) > 0.5); };
const freezeFrame = {
  intro: frozen,
  looks: [
    [1, frozen],
    [1, (c, P) => { const fr = Math.floor(c.beat / 2) * 2; const cc = { ...c, t: frac(c.beat / 2) > 0.5 ? fr * 60 / c.bpm : c.t }; vgrad(c, ['#140a30', '#3a2a6a']); starfield(cc, STARS, 0.5, '#fff'); ringSegments(cc, c.h * 0.32, 6, P.main, cc.t, 0.7); if (frac(c.beat / 2) > 0.5) text(c, '|| PAUSE', c.w / 2, c.h * 0.85, c.h * 0.05, '#ffffff', 0.8); }],
    [2, (c, P) => { vgrad(c, ['#3a2a7a', '#c49bff']); radialLines(c, 28, '#ffffff', 0.2 + 0.35 * c.pulse, c.t * 0.3, 0.2); snowCrystal(c, c.w / 2, c.h / 2, c.h * (0.35 + 0.03 * c.pulse), c.t * 0.3, '#ffffff', 1, 1); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; c.g.strokeStyle = 'rgba(255,255,255,0.6)'; c.g.lineWidth = 1.5; c.g.beginPath(); c.g.moveTo(c.w / 2, c.h / 2); c.g.lineTo(c.w / 2 + Math.cos(a + hash1(i)) * c.w, c.h / 2 + Math.sin(a + hash1(i)) * c.w); c.g.stroke(); } }],
  ],
};

export default {
  'sunflower-road': sunflowerRoad,
  'shining-star': shiningStar,
  'mizu-no-tsuioku': mizuNoTsuioku,
  'hydrangea': hydrangea,
  'ao': ao,
  'summer-triangle': summerTriangle,
  'hyperpop-glitch': hyperpopGlitch,
  'circuit-breaker': circuitBreaker,
  'mirage-shift': mirageShift,
  'freeze-frame': freezeFrame,
};

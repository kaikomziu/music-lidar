// 特製MV その3: ワールド・ソウル系(アフロ・ワルツ・ブルース・ポルカ・フォーク・R&B・ネオソウル・ヒップホップ・ボサノバ・ディープハウス)
import {
  TAU, frac, clamp01, ease, table, vgrad, text, twinkle, SKY, STARS, starfield, hills, birds, fluffyClouds, waves, radialLines,
  retroSun, sparkle, bokeh, palm, moon, stageBeams, eqBars, crowd, beatRipples, vinyl, skyline, BLDS, dotSphere, hash1,
  ringSegments, star5, confetti, lunares, grid, rain, jazzNote, neonSign, risingBubbles, milkyWay, shootingStar,
} from '../mv.js';

const bounce = (c, k = 1, ph = 0) => Math.abs(Math.sin((c.beat + ph) * Math.PI)) * c.h * 0.03 * k;

// ---- Afro Sunrise: サバンナの朝日。アカシアの木と動物のシルエット、太鼓のリズムで模様が跳ねる ----
function acacia(c, x, base, s, col) {
  const g = c.g; g.strokeStyle = col; g.lineWidth = s * 0.06; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, base); g.lineTo(x, base - s * 0.6); g.moveTo(x, base - s * 0.45); g.lineTo(x - s * 0.3, base - s * 0.75); g.moveTo(x, base - s * 0.5); g.lineTo(x + s * 0.35, base - s * 0.8); g.stroke();
  g.fillStyle = col; g.beginPath(); g.ellipse(x, base - s * 0.85, s * 0.7, s * 0.12, 0, 0, TAU); g.fill();
}
function giraffe(c, x, base, s, col, ph) {
  const g = c.g; g.fillStyle = col; const nod = Math.sin(c.t * 1.2 + ph) * s * 0.05;
  g.fillRect(x - s * 0.3, base - s * 0.9, s * 0.6, s * 0.3);
  for (const dx of [-0.25, -0.1, 0.12, 0.25]) g.fillRect(x + dx * s - s * 0.03, base - s * 0.62, s * 0.06, s * 0.62);
  g.beginPath(); g.moveTo(x + s * 0.2, base - s * 0.85); g.lineTo(x + s * 0.45, base - s * 1.7 + nod); g.lineTo(x + s * 0.55, base - s * 1.65 + nod); g.lineTo(x + s * 0.32, base - s * 0.8); g.fill();
  g.beginPath(); g.ellipse(x + s * 0.55, base - s * 1.72 + nod, s * 0.14, s * 0.07, 0.3, 0, TAU); g.fill();
}
function kente(c, alpha) { // ケンテ布のような模様の帯
  const g = c.g, cols = ['#ffd84a', '#2a8a3a', '#e83a2a', '#1a1a1a'], s = c.h * 0.06;
  g.globalAlpha = alpha;
  for (let y = 0; y < c.h; y += s) for (let x = 0; x < c.w; x += s) { g.fillStyle = cols[(Math.floor(x / s) + Math.floor(y / s) * 2 + Math.floor(c.beat)) % 4]; g.fillRect(x, y, s - 1, s - 1); }
  g.globalAlpha = 1;
}
const savannah = (c) => { vgrad(c, ['#ff8a3d', '#ffc06a', '#ffe0a0']); retroSun(c, c.w / 2, c.h * 0.6, c.h * 0.24, '#fff4c0', '#ff6a2a', 'rgba(0,0,0,0)'); c.g.fillStyle = '#3a1a08'; c.g.fillRect(0, c.h * 0.74, c.w, c.h); acacia(c, c.w * 0.75, c.h * 0.75, c.h * 0.4, '#3a1a08'); giraffe(c, c.w * 0.25, c.h * 0.75, c.h * 0.22, '#3a1a08', 0); };
const afroSunrise = {
  intro: savannah,
  looks: [
    [1, savannah],
    [1, (c) => { vgrad(c, ['#ffb347', '#ffe8b0']); birds(c, '#3a1a08'); c.g.fillStyle = '#4a2410'; c.g.fillRect(0, c.h * 0.72, c.w, c.h); for (let i = 0; i < 4; i++) giraffe(c, frac(i / 4 + c.t * 0.02) * c.w * 1.2 - c.w * 0.1, c.h * 0.72, c.h * 0.2, '#4a2410', i); acacia(c, c.w * 0.5, c.h * 0.72, c.h * 0.35, '#4a2410'); }],
    [2, (c) => { kente(c, 0.5); radialLines(c, 20, '#fff4c0', 0.3 + 0.3 * c.pulse, c.t * 0.3, 0.1); retroSun(c, c.w / 2, c.h / 2, c.h * (0.2 + 0.03 * c.pulse), '#fff4c0', '#ff6a2a', 'rgba(0,0,0,0)'); for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + c.t * 0.5; c.g.fillStyle = '#1a1a1a'; c.g.beginPath(); c.g.arc(c.w / 2 + Math.cos(a) * c.h * 0.36, c.h / 2 + Math.sin(a) * c.h * 0.32 - bounce(c, 1, i / 8), c.h * 0.04, 0, TAU); c.g.fill(); } }],
    [0, (c) => { vgrad(c, ['#2a1a3a', '#ff8a5a']); twinkle(c, SKY, '#fff'); c.g.fillStyle = '#1a0a04'; c.g.fillRect(0, c.h * 0.76, c.w, c.h); acacia(c, c.w * 0.3, c.h * 0.77, c.h * 0.45, '#1a0a04'); }],
  ],
};

// ---- Space Waltz: 宇宙の舞踏会。惑星がワルツ(3拍子)でくるくる回る ----
function planet(c, x, y, r, col, ring) {
  const g = c.g; const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, col); gr.addColorStop(1, '#0a0a20');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  if (ring) { g.strokeStyle = 'rgba(255,240,200,0.6)'; g.lineWidth = r * 0.12; g.beginPath(); g.ellipse(x, y, r * 1.7, r * 0.45, -0.3, 0, TAU); g.stroke(); }
}
const ballroom = (c, P) => { vgrad(c, ['#04051a', '#141a40']); twinkle(c, SKY, '#fff', 0.4); const b3 = c.beat / 3; planet(c, c.w / 2, c.h / 2, c.h * 0.12, '#ffd27a', true); for (let i = 0; i < 3; i++) { const a = b3 * TAU / 4 + i * TAU / 3; planet(c, c.w / 2 + Math.cos(a) * c.h * 0.38, c.h / 2 + Math.sin(a) * c.h * 0.2, c.h * 0.05, ['#7ab8ff', '#ff8ab0', '#9dff8a'][i], false); } };
const spaceWaltz = {
  intro: ballroom,
  looks: [
    [1, ballroom],
    [1, (c, P) => { vgrad(c, ['#020310', '#10163a']); milkyWay(c, 0.4); for (let i = 0; i < 2; i++) { const a = c.beat / 3 * TAU / 2 + i * Math.PI; planet(c, c.w / 2 + Math.cos(a) * c.h * 0.2, c.h * 0.5 + Math.sin(a) * c.h * 0.08, c.h * 0.08, i ? '#ff9de6' : '#7ad8ff', i === 0); } }],
    [2, (c, P) => { vgrad(c, ['#0a0a30', '#2a2a6a']); starfield(c, STARS, 0.4, '#fff'); ringSegments(c, c.h * 0.32, 3, P.main, c.beat / 3 * TAU / 3, 0.7, 4); ringSegments(c, c.h * 0.42, 6, '#ffd27a', -c.beat / 3 * TAU / 6, 0.5, 2); dotSphere(c, c.w / 2, c.h / 2, c.h * (0.2 + 0.02 * c.pulse), '#ffffff', c.t * 0.5, 0.8); }],
    [0, (c) => { vgrad(c, ['#010208', '#080c24']); twinkle(c, SKY, '#fff'); planet(c, c.w * 0.7, c.h * 0.4, c.h * 0.2, '#b0c4ff', true); }],
  ],
};

// ---- Blues Highway: 夜のハイウェイを走る。電柱が流れ、サビでギターの弦が震える ----
function road(c, speed, col) {
  const g = c.g, hy = c.h * 0.55;
  g.fillStyle = '#14141c'; g.beginPath(); g.moveTo(c.w * 0.48, hy); g.lineTo(c.w * 0.52, hy); g.lineTo(c.w, c.h); g.lineTo(0, c.h); g.fill();
  g.fillStyle = col; for (let i = 0; i < 8; i++) { const z = frac(i / 8 + c.t * speed), y = hy + (c.h - hy) * z * z, w = c.w * 0.005 + c.w * 0.02 * z * z; g.globalAlpha = z; g.fillRect(c.w / 2 - w / 2, y, w, c.h * 0.04 * z * z + 1); }
  g.globalAlpha = 1;
  g.strokeStyle = '#05050a'; g.lineWidth = 2; for (let i = 0; i < 5; i++) { const z = frac(i / 5 + c.t * speed * 0.6), x = c.w * 0.52 + c.w * 0.6 * z * z, y = hy + (c.h - hy) * z * z; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - c.h * 0.5 * z * z - 4); g.stroke(); }
}
function strings(c, amp) {
  const g = c.g; for (let i = 0; i < 6; i++) { const y = c.h * (0.3 + i * 0.08); g.strokeStyle = '#d8c8a0'; g.lineWidth = 1 + (5 - i) * 0.5; g.beginPath(); for (let x = 0; x <= c.w; x += 8) { const v = Math.sin(x * 0.05 + c.t * 30 + i) * amp * c.h * 0.02 * Math.sin(x / c.w * Math.PI); x ? g.lineTo(x, y + v) : g.moveTo(x, y); } g.stroke(); }
}
const highway = (c, P) => { vgrad(c, ['#05081a', '#1a2a5a', '#3a3a6a']); twinkle(c, SKY, '#fff'); moon(c, c.w * 0.25, c.h * 0.22, c.h * 0.08, '#fff3d0', 0.3); hills(c, c.h * 0.56, '#0a0c18', c.h * 0.04, 0.008, 0); road(c, 0.5, '#ffd84a'); };
const bluesHighway = {
  intro: highway,
  looks: [
    [1, highway],
    [1, (c, P) => { vgrad(c, ['#0a0c20', '#2a1a40']); neonSign(c, 'BLUES BAR', c.w / 2, c.h * 0.3, c.h * 0.08, P.main, Math.sin(c.t * 9) > 0.92 ? 0.3 : 1); skyline(c, BLDS, c.h * 0.85, '#05060c', '#ffcf7a', 0.2); rain(c, 'rgba(160,190,255,0.6)', 0.7); }],
    [2, (c, P) => { vgrad(c, ['#1a1030', '#4a2a50']); radialLines(c, 18, P.main, 0.15 + 0.25 * c.pulse, c.t * 0.2, 0.2); strings(c, 0.4 + c.pulse); for (let i = 0; i < 5; i++) jazzNote(c, c.w * (0.1 + i * 0.2), c.h * (0.8 - frac(c.t * 0.2 + i * 0.2) * 0.6), c.h * 0.07, '#ffd84a', 0.8); }],
    [0, (c) => { vgrad(c, ['#03040c', '#10142a']); twinkle(c, SKY, '#fff'); road(c, 0.25, '#ffd84a'); }],
  ],
};

// ---- Polka Party: 村のお祭り。アコーディオンのじゃばらが伸び縮みし、踊る人がくるくる ----
function accordion(c, x, y, s, open) {
  const g = c.g, w = s * (0.8 + 0.6 * open), n = 9;
  g.fillStyle = '#c42a3a'; g.fillRect(x - w / 2 - s * 0.35, y - s * 0.5, s * 0.35, s); g.fillRect(x + w / 2, y - s * 0.5, s * 0.35, s);
  for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? '#1a1a2a' : '#f4f0e8'; g.fillRect(x - w / 2 + i * w / n, y - s * 0.45, w / n, s * 0.9); }
  g.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(x + w / 2 + s * 0.17, y - s * 0.35 + i * s * 0.14, s * 0.04, 0, TAU); g.fill(); }
}
function dancer(c, x, base, s, ph, col) {
  const g = c.g, spin = Math.sin(c.beat * Math.PI + ph);
  g.fillStyle = col; g.beginPath(); g.moveTo(x, base - s * 0.9); g.lineTo(x + s * 0.4 * (0.7 + 0.3 * Math.abs(spin)), base - s * 0.2); g.lineTo(x - s * 0.4 * (0.7 + 0.3 * Math.abs(spin)), base - s * 0.2); g.fill();
  g.fillStyle = '#ffe0c0'; g.beginPath(); g.arc(x, base - s, s * 0.12, 0, TAU); g.fill();
  g.fillStyle = '#1a1a2a'; g.fillRect(x - s * 0.12, base - s * 0.2, s * 0.06, s * 0.2); g.fillRect(x + s * 0.06, base - s * 0.2, s * 0.06, s * 0.2);
}
const polkaVillage = (c) => { vgrad(c, ['#6ec6ff', '#e0f4ff']); fluffyClouds(c, c.h * 0.2, 0.012); hills(c, c.h * 0.72, '#6cc061', c.h * 0.04, 0.012, 0); c.g.fillStyle = '#5ab050'; c.g.fillRect(0, c.h * 0.78, c.w, c.h); for (let i = 0; i < 5; i++) dancer(c, c.w * (0.12 + i * 0.19), c.h * 0.9 - bounce(c, 1, i * 0.5), c.h * 0.2, i, ['#ff5050', '#4fa3ff', '#ffd84a', '#ff8ac0', '#6dff8a'][i]); };
const polkaParty = {
  intro: polkaVillage,
  looks: [
    [1, polkaVillage],
    [1, (c) => { lunares(c, '#ffffff', c.h * 0.02, 0.1, 0.4); vgrad(c, ['rgba(255,80,80,0.85)', 'rgba(255,140,120,0.85)']); accordion(c, c.w / 2, c.h / 2, c.h * 0.3, 0.5 + 0.5 * Math.sin(c.beat * Math.PI)); }],
    [2, (c) => { vgrad(c, ['#ff5050', '#ffd84a']); radialLines(c, 24, '#ffffff', 0.25 + 0.3 * c.pulse, c.t * 0.4, 0.1); for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + c.beat * Math.PI / 4; dancer(c, c.w / 2 + Math.cos(a) * c.h * 0.4, c.h * 0.6 + Math.sin(a) * c.h * 0.15, c.h * 0.18, i, ['#ffffff', '#1a1a2a'][i % 2]); } confetti(c); }],
    [0, (c) => { vgrad(c, ['#2a1a3a', '#ff9a6a']); twinkle(c, SKY, '#fff'); for (let i = 0; i < 12; i++) { const x = c.w * (i + 0.5) / 12, y = c.h * 0.2 + Math.sin((i + 0.5) / 12 * Math.PI) * c.h * 0.1; c.g.fillStyle = ['#ffd84a', '#ff5050', '#6dff8a'][i % 3]; c.g.globalAlpha = 0.6 + 0.4 * Math.sin(c.t * 2 + i); c.g.beginPath(); c.g.arc(x, y, c.h * 0.02, 0, TAU); c.g.fill(); } c.g.globalAlpha = 1; hills(c, c.h * 0.8, '#1a0a14', c.h * 0.03, 0.01, 0); }],
  ],
};

// ---- Harvest Moon: 秋の夜、大きな満月と実りの畑。稲穂が風にゆれる ----
function wheat(c, base, n, col, wind) {
  const g = c.g; g.strokeStyle = col; g.lineWidth = 1.5;
  for (let i = 0; i < n; i++) { const x = (i + 0.5) / n * c.w, h = c.h * (0.12 + hash1(i) * 0.08), sw = Math.sin(c.t * 1.5 + i * 0.3) * wind * c.h * 0.03; g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x, base - h * 0.6, x + sw, base - h); g.stroke(); g.fillStyle = col; g.beginPath(); g.ellipse(x + sw, base - h - c.h * 0.015, c.h * 0.008, c.h * 0.025, sw * 0.02, 0, TAU); g.fill(); }
}
const harvestField = (c) => { vgrad(c, ['#0a0c24', '#2a2a50', '#6a4a40']); twinkle(c, SKY, '#fff'); moon(c, c.w / 2, c.h * 0.38, c.h * 0.2, '#ffe0a0'); c.g.fillStyle = '#2a1a0a'; c.g.fillRect(0, c.h * 0.8, c.w, c.h); wheat(c, c.h * 0.85, 60, '#d8a85a', 1); };
const harvestMoon = {
  intro: harvestField,
  looks: [
    [1, harvestField],
    [1, (c) => { vgrad(c, ['#ff9a5a', '#ffd0a0']); retroSun(c, c.w * 0.3, c.h * 0.5, c.h * 0.14, '#fff4c0', '#ff8a3d', 'rgba(0,0,0,0)'); birds(c, '#3a2010'); hills(c, c.h * 0.7, '#c87a3a', c.h * 0.04, 0.01, 0); wheat(c, c.h * 0.9, 50, '#ffd27a', 1.5); }],
    [2, (c) => { vgrad(c, ['#1a1430', '#5a3a50']); moon(c, c.w / 2, c.h * 0.42, c.h * (0.26 + 0.01 * c.pulse), '#fff0b0'); for (let i = 0; i < 20; i++) { const y = frac(hash1(i) + c.t * 0.05) * c.h, x = hash1(i + 9) * c.w + Math.sin(c.t + i) * 10; c.g.save(); c.g.translate(x, y); c.g.rotate(c.t * 2 + i); c.g.fillStyle = ['#ff8a3d', '#ffd27a', '#c83a2a'][i % 3]; c.g.beginPath(); c.g.ellipse(0, 0, c.h * 0.02, c.h * 0.01, 0, 0, TAU); c.g.fill(); c.g.restore(); } wheat(c, c.h, 60, '#d8a85a', 2); }],
  ],
};

// ---- Velvet Night: 夜景の見えるラウンジ。紫のカーテンとグラスのきらめき ----
function curtains(c, col) {
  const g = c.g;
  for (const side of [0, 1]) { const gr = g.createLinearGradient(side ? c.w : 0, 0, side ? c.w * 0.75 : c.w * 0.25, 0); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(side ? c.w * 0.72 : 0, 0, c.w * 0.28, c.h); }
  g.strokeStyle = 'rgba(0,0,0,0.3)'; for (let i = 0; i < 10; i++) { const x = i < 5 ? i * c.w * 0.05 : c.w - (i - 5) * c.w * 0.05; g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + Math.sin(c.t + i) * 6, c.h / 2, x, c.h); g.stroke(); }
}
const velvetView = (c, P) => { vgrad(c, ['#08041a', '#1a0a30']); twinkle(c, SKY, '#fff'); skyline(c, BLDS, c.h * 0.9, '#05020c', '#c38bff', 0.25); curtains(c, '#5a1a6a'); };
const velvetRnb = {
  intro: velvetView,
  looks: [
    [1, velvetView],
    [1, (c, P) => { vgrad(c, ['#120820', '#2a1040']); bokeh(c, [P.main, '#ff8ac0', '#ffffff'], 0.4); vinyl(c, c.w * 0.5, c.h * 0.55, c.h * 0.3, c.t * 1.2, P.main); }],
    [2, (c, P) => { vgrad(c, ['#2a0a40', '#5a1a6a']); bokeh(c, [P.main, '#ffcf7a', '#ffffff'], 0.55); for (let i = 0; i < 7; i++) sparkle(c, c.w * (0.1 + i * 0.13), c.h * (0.4 + 0.2 * Math.sin(c.t + i)), c.h * 0.03 * (0.5 + c.pulse), '#ffffff', 0.9); curtains(c, '#7a2a8a'); }],
    [0, (c, P) => { vgrad(c, ['#05020c', '#140820']); bokeh(c, [P.main, '#ffffff'], 0.2); }],
  ],
};

// ---- Velvet Lounge: ネオソウルの小さなライブハウス。マイクとスポットライト ----
function mic(c, x, y, s) {
  const g = c.g; g.strokeStyle = '#c8c8d0'; g.lineWidth = s * 0.06; g.beginPath(); g.moveTo(x, y); g.lineTo(x, c.h); g.stroke();
  g.fillStyle = '#2a2a34'; g.beginPath(); g.ellipse(x, y - s * 0.2, s * 0.16, s * 0.25, 0, 0, TAU); g.fill();
  g.strokeStyle = '#8a8a9a'; g.lineWidth = 1; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x - s * 0.15, y - s * 0.2 + i * s * 0.07); g.lineTo(x + s * 0.15, y - s * 0.2 + i * s * 0.07); g.stroke(); }
}
function spotlight(c, x, a, col) {
  const g = c.g; g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(x, 0, x, c.h); gr.addColorStop(0, col.replace('A', 0.5 * a)); gr.addColorStop(1, col.replace('A', 0.05));
  g.fillStyle = gr; g.beginPath(); g.moveTo(x - c.w * 0.02, 0); g.lineTo(x + c.w * 0.02, 0); g.lineTo(x + c.w * 0.18, c.h); g.lineTo(x - c.w * 0.18, c.h); g.fill(); g.restore();
}
const loungeStage = (c) => { vgrad(c, ['#080410', '#1a0c24']); spotlight(c, c.w / 2, 0.8 + 0.2 * c.pulse, 'rgba(255,210,160,A)'); mic(c, c.w / 2, c.h * 0.5, c.h * 0.3); c.g.fillStyle = '#2a140a'; c.g.fillRect(0, c.h * 0.88, c.w, c.h); };
const velvetLounge = {
  intro: loungeStage,
  looks: [
    [1, loungeStage],
    [1, (c, P) => { vgrad(c, ['#0a0410', '#2a1030']); for (const x of [0.25, 0.5, 0.75]) spotlight(c, c.w * x, 0.6, 'rgba(195,139,255,A)'); for (let i = 0; i < 6; i++) jazzNote(c, c.w * (0.15 + i * 0.14), c.h * (0.75 - frac(c.t * 0.15 + i / 6) * 0.6), c.h * 0.06, '#ffcf7a', 0.7); }],
    [2, (c, P) => { vgrad(c, ['#2a0a3a', '#5a2060']); stageBeams(c, 5, [P.main, '#ffcf7a'], 0.3 + 0.3 * c.pulse, 0.6); mic(c, c.w / 2, c.h * 0.45, c.h * 0.32); bokeh(c, ['#ffcf7a', P.main], 0.4); }],
  ],
};

// ---- Boom Bap Days: 90年代のストリート。レンガの壁、ラジカセ、スプレーのタグ ----
function brickWall(c, col, line) {
  const g = c.g; g.fillStyle = col; g.fillRect(0, 0, c.w, c.h); g.strokeStyle = line; g.lineWidth = 1;
  const bh = c.h * 0.06, bw = bh * 2.2;
  for (let r = 0; r * bh < c.h; r++) { g.beginPath(); g.moveTo(0, r * bh); g.lineTo(c.w, r * bh); g.stroke(); for (let x = (r % 2) * bw / 2; x < c.w; x += bw) { g.beginPath(); g.moveTo(x, r * bh); g.lineTo(x, r * bh + bh); g.stroke(); } }
}
function boombox(c, x, y, s, k) {
  const g = c.g; g.fillStyle = '#2a2a30'; g.fillRect(x - s, y - s * 0.5, s * 2, s);
  g.fillStyle = '#c8c8d0'; g.fillRect(x - s * 0.4, y - s * 0.75, s * 0.8, s * 0.08);
  for (const dx of [-0.6, 0.6]) { g.fillStyle = '#111'; g.beginPath(); g.arc(x + dx * s, y + s * 0.05, s * 0.32 * (1 + 0.08 * k), 0, TAU); g.fill(); g.fillStyle = '#444'; g.beginPath(); g.arc(x + dx * s, y + s * 0.05, s * 0.12, 0, TAU); g.fill(); }
  g.fillStyle = '#ffd84a'; g.fillRect(x - s * 0.2, y - s * 0.35, s * 0.4, s * 0.2);
}
const streetWall = (c) => { brickWall(c, '#7a3a2a', '#5a2a1e'); text(c, 'BOOM BAP', c.w / 2, c.h * 0.3, c.h * 0.14, '#ffd84a', 0.85, { font: 'Impact', glow: 0 }); c.g.fillStyle = '#3a3a40'; c.g.fillRect(0, c.h * 0.8, c.w, c.h); boombox(c, c.w / 2, c.h * 0.7, c.h * 0.14, c.pulse); };
const boomBapDays = {
  intro: streetWall,
  looks: [
    [1, streetWall],
    [1, (c, P) => { vgrad(c, ['#1a1410', '#3a2a1a']); vinyl(c, c.w * 0.35, c.h * 0.5, c.h * 0.3, c.t * 2, '#e0c68a'); vinyl(c, c.w * 0.7, c.h * 0.5, c.h * 0.22, -c.t * 2, '#ff6a3d'); eqBars(c, 20, '#e0c68a', 0.5); }],
    [2, (c) => { brickWall(c, '#5a2a20', '#3a1a14'); for (let i = 0; i < 4; i++) text(c, ['YO!', 'BAP', 'BOOM', '90s'][i], c.w * (0.15 + i * 0.23), c.h * (0.35 + 0.1 * Math.sin(c.t + i)) - bounce(c, 1, i * 0.25), c.h * (0.1 + 0.02 * c.pulse), ['#ff5ea8', '#5effc6', '#ffd84a', '#7ab8ff'][i], 0.95, { font: 'Impact' }); boombox(c, c.w / 2, c.h * 0.75, c.h * 0.16, c.pulse); }],
  ],
};

// ---- Sunset Bossa: リオの夕暮れの海辺。波とヤシ、ギターの音が光る ----
const rioBeach = (c) => { vgrad(c, ['#ff8a5a', '#ffcf5e', '#ffe8b0']); retroSun(c, c.w / 2, c.h * 0.55, c.h * 0.18, '#fff4c0', '#ff8a3d', 'rgba(0,0,0,0)'); c.g.fillStyle = '#3a2a4a'; c.g.beginPath(); c.g.moveTo(c.w * 0.6, c.h * 0.6); c.g.quadraticCurveTo(c.w * 0.72, c.h * 0.25, c.w * 0.8, c.h * 0.6); c.g.fill(); waves(c, 0.6, '#ff9a6a', '#e86a5a', 0.5); palm(c, c.w * 0.1, c.h, c.h * 0.65, '#2a1a20', 0.2); };
const sunsetBossa = {
  intro: rioBeach,
  looks: [
    [1, rioBeach],
    [1, (c) => { vgrad(c, ['#5a2a6a', '#ff8a6a']); twinkle(c, SKY, '#fff'); waves(c, 0.6, '#5a2a5a', '#3a1a4a', 0.6); for (let i = 0; i < 12; i++) { c.g.fillStyle = '#ffd27a'; c.g.globalAlpha = 0.5 + 0.5 * Math.sin(c.t * 2 + i); c.g.beginPath(); c.g.arc(c.w * (i + 0.5) / 12, c.h * 0.58, 2, 0, TAU); c.g.fill(); } c.g.globalAlpha = 1; palm(c, c.w * 0.88, c.h, c.h * 0.6, '#1a0a14', -0.2); }],
    [2, (c, P) => { vgrad(c, ['#ff9a3d', '#ffe08a']); radialLines(c, 18, '#fff4c0', 0.3 + 0.25 * c.pulse, c.t * 0.2, 0.1); strings(c, 0.3 + c.pulse * 0.8); retroSun(c, c.w / 2, c.h * 0.5, c.h * 0.12, '#ffffff', '#ffcf5e', 'rgba(0,0,0,0)'); }],
  ],
};

// ---- Deep Blue Current: 深い海の流れ。光の筋と、ゆっくり泳ぐクジラ ----
function whale(c, x, y, s, ph) {
  const g = c.g; g.fillStyle = '#0a2a4a'; const tail = Math.sin(c.t * 1.2 + ph) * s * 0.15;
  g.beginPath(); g.ellipse(x, y, s, s * 0.32, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(x - s * 0.9, y); g.lineTo(x - s * 1.4, y - s * 0.3 + tail); g.lineTo(x - s * 1.3, y + tail * 0.3); g.lineTo(x - s * 1.4, y + s * 0.25 + tail); g.fill();
  g.beginPath(); g.ellipse(x + s * 0.1, y + s * 0.3, s * 0.3, s * 0.07, 0.4, 0, TAU); g.fill();
}
function godRays(c, a) {
  const g = c.g; g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) { const x = c.w * (0.1 + i * 0.17) + Math.sin(c.t * 0.3 + i) * c.w * 0.03; const gr = g.createLinearGradient(x, 0, x, c.h); gr.addColorStop(0, `rgba(120,220,255,${0.25 * a})`); gr.addColorStop(1, 'rgba(120,220,255,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - c.w * 0.02, 0); g.lineTo(x + c.w * 0.02, 0); g.lineTo(x + c.w * 0.08, c.h); g.lineTo(x - c.w * 0.04, c.h); g.fill(); }
  g.restore();
}
const deepSea = (c, P) => { vgrad(c, ['#0a4a7a', '#04182e', '#020812']); godRays(c, 0.8); whale(c, frac(c.t * 0.015) * c.w * 1.6 - c.w * 0.3, c.h * 0.55, c.h * 0.18, 0); risingBubbles(c, 0.5, 0.4, 0.4); };
const deepBlueCurrent = {
  intro: deepSea,
  looks: [
    [1, deepSea],
    [1, (c, P) => { vgrad(c, ['#04203a', '#020a18']); for (let i = 0; i < 5; i++) { c.g.strokeStyle = P.main; c.g.globalAlpha = 0.25 + 0.15 * i / 5; c.g.lineWidth = c.h * 0.01; c.g.beginPath(); for (let x = 0; x <= c.w; x += 10) { const y = c.h * (0.2 + i * 0.15) + Math.sin(x * 0.01 + c.t * 1.2 + i) * c.h * 0.05; x ? c.g.lineTo(x, y) : c.g.moveTo(x, y); } c.g.stroke(); } c.g.globalAlpha = 1; risingBubbles(c, 0.8, 0.4, 0.5); }],
    [2, (c, P) => { vgrad(c, ['#0a6a9a', '#04203a']); godRays(c, 1 + c.pulse); beatRipples(c, 5, () => [0.5, 0.5], '#ffffff', 0.6, 1); for (let i = 0; i < 3; i++) whale(c, c.w * (0.2 + i * 0.3), c.h * (0.4 + i * 0.12), c.h * (0.12 - i * 0.02), i); }],
    [0, (c) => { vgrad(c, ['#020a18', '#000206']); for (let i = 0; i < 30; i++) { c.g.fillStyle = '#6ff0ff'; c.g.globalAlpha = 0.3 + 0.5 * Math.sin(c.t * 2 + i); c.g.beginPath(); c.g.arc(hash1(i) * c.w, (hash1(i + 3) + c.t * 0.01) % 1 * c.h, 1.2, 0, TAU); c.g.fill(); } c.g.globalAlpha = 1; }],
  ],
};

export default {
  'afro-sunrise': afroSunrise,
  'space-waltz': spaceWaltz,
  'blues-highway': bluesHighway,
  'polka-party': polkaParty,
  'harvest-moon': harvestMoon,
  'velvet-rnb': velvetRnb,
  'velvet-lounge': velvetLounge,
  'boom-bap-days': boomBapDays,
  'sunset-bossa': sunsetBossa,
  'deep-blue-current': deepBlueCurrent,
};

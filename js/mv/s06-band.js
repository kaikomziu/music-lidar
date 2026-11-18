// 特製MV その6: バンド・民族・オーケストラ(ガムラン・サザンロック・ビッグバンド・和フュージョン・オーケストラ・ケルト・ビッグルーム・グリッチホップ・サルサ・ジャズ)
import {
  TAU, frac, clamp01, ease, table, vgrad, text, twinkle, SKY, STARS, starfield, hills, birds, fluffyClouds, waves, radialLines,
  retroSun, sparkle, bokeh, palm, moon, stageBeams, eqBars, crowd, beatRipples, vinyl, skyline, BLDS, hash1, ringSegments,
  grid, tunnel, glitch, hexGrid, jazzNote, jazzRoom, neonSign, lightning, sakura, fallingPetals, PETALS, torii, lantern,
  lanternRow, firework, confetti, flames, sparks, lunares, fan, rose, star5, milkyWay, cloudBand, pixelScape, dotSphere, rain,
} from '../mv.js';

const bounce = (c, k = 1, ph = 0) => Math.abs(Math.sin((c.beat + ph) * Math.PI)) * c.h * 0.03 * k;

// ---- Gamelan Moon: バリ島の夜の寺院。満月とゴングの金色の波紋 ----
function gong(c, x, y, R, k) {
  const g = c.g; const gr = g.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R); gr.addColorStop(0, '#fff2b0'); gr.addColorStop(0.5, '#e8b04a'); gr.addColorStop(1, '#7a4a10');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, R * (1 + 0.03 * k), 0, TAU); g.fill();
  g.fillStyle = '#c88a2a'; g.beginPath(); g.arc(x, y, R * 0.3, 0, TAU); g.fill();
  g.strokeStyle = '#ffe08a'; g.lineWidth = 2; g.globalAlpha = k; for (let i = 1; i <= 3; i++) { g.beginPath(); g.arc(x, y, R * (1 + i * 0.25 * (1 - k * 0.3)), 0, TAU); g.stroke(); } g.globalAlpha = 1;
}
function candiGate(c, base, s, col) { // バリの割れ門(チャンディ・ブンタル)
  const g = c.g; g.fillStyle = col;
  for (const side of [-1, 1]) { g.beginPath(); g.moveTo(c.w / 2 + side * s * 0.15, base); g.lineTo(c.w / 2 + side * s * 0.15, base - s * 1.3); for (let k = 0; k < 5; k++) { g.lineTo(c.w / 2 + side * s * (0.15 + 0.1 * k + 0.05), base - s * (1.3 - k * 0.2)); g.lineTo(c.w / 2 + side * s * (0.15 + 0.1 * (k + 1)), base - s * (1.3 - k * 0.2)); } g.lineTo(c.w / 2 + side * s * 0.75, base); g.fill(); }
}
const temple = (c) => { vgrad(c, ['#0a0418', '#2a1430', '#4a2a2a']); twinkle(c, SKY, '#fff'); moon(c, c.w / 2, c.h * 0.32, c.h * 0.18, '#fff0c0'); candiGate(c, c.h * 0.95, c.h * 0.55, '#0a0408'); };
const gamelanMoon = {
  intro: temple,
  looks: [
    [1, temple],
    [1, (c) => { vgrad(c, ['#1a0a08', '#3a1a10']); for (let i = 0; i < 5; i++) gong(c, c.w * (0.14 + i * 0.18), c.h * 0.55, c.h * 0.09, Math.exp(-frac(c.beat + i * 0.2) * 4)); }],
    [2, (c) => { vgrad(c, ['#3a2008', '#8a5010']); radialLines(c, 24, '#ffe08a', 0.25 + 0.3 * c.pulse, c.t * 0.2, 0.15); gong(c, c.w / 2, c.h / 2, c.h * 0.28, c.pulse); for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + c.t * 0.3; sparkle(c, c.w / 2 + Math.cos(a) * c.h * 0.42, c.h / 2 + Math.sin(a) * c.h * 0.36, c.h * 0.025, '#fff2b0', 0.9); } }],
  ],
};

// ---- Thunder Road: アメリカ南部の荒野を走るバイク。雷雲と夕焼け ----
function bike(c, x, base, s) {
  const g = c.g; g.strokeStyle = '#0a0604'; g.lineWidth = s * 0.08; for (const dx of [-0.6, 0.6]) { g.beginPath(); g.arc(x + dx * s, base - s * 0.3, s * 0.3, 0, TAU); g.stroke(); }
  g.fillStyle = '#0a0604'; g.beginPath(); g.moveTo(x - s * 0.5, base - s * 0.45); g.lineTo(x + s * 0.3, base - s * 0.6); g.lineTo(x + s * 0.6, base - s * 0.35); g.lineTo(x - s * 0.2, base - s * 0.3); g.fill();
  g.beginPath(); g.arc(x - s * 0.05, base - s * 1.15, s * 0.14, 0, TAU); g.fill(); g.fillRect(x - s * 0.2, base - s * 1.0, s * 0.3, s * 0.45);
}
const desertRoad = (c, P) => { vgrad(c, ['#3a1a3a', '#c85a3a', '#ffa05a']); retroSun(c, c.w * 0.7, c.h * 0.62, c.h * 0.16, '#fff1a8', '#ff6a2a', 'rgba(0,0,0,0)'); c.g.fillStyle = '#5a2a1a'; c.g.beginPath(); c.g.moveTo(c.w * 0.1, c.h * 0.68); c.g.lineTo(c.w * 0.18, c.h * 0.48); c.g.lineTo(c.w * 0.32, c.h * 0.48); c.g.lineTo(c.w * 0.4, c.h * 0.68); c.g.fill(); c.g.fillStyle = '#2a140a'; c.g.fillRect(0, c.h * 0.68, c.w, c.h); bike(c, c.w * 0.45, c.h * 0.9, c.h * 0.2); };
const thunderRoad = {
  intro: desertRoad,
  looks: [
    [1, desertRoad],
    [1, (c, P) => { vgrad(c, ['#0a0a14', '#2a2a3a']); for (let i = 0; i < 3; i++) lightning(c, Math.floor(c.beat / 2) + i, '#e8f0ff', frac(c.beat / 2) < 0.15 && i === Math.floor(c.beat / 2) % 3 ? 1 : 0); cloudBand(c, c.h * 0.2, '#3a3a4a', 0.02, 0.9); c.g.fillStyle = '#0a0806'; c.g.fillRect(0, c.h * 0.75, c.w, c.h); bike(c, frac(c.t * 0.05) * c.w * 1.3 - c.w * 0.15, c.h * 0.95, c.h * 0.16); }],
    [2, (c, P) => { vgrad(c, ['#1a0400', '#5a1a00']); stageBeams(c, 6, [P.main, '#ffffff'], 0.3 + 0.35 * c.pulse, 1.4); flames(c, c.h, c.h * 0.3, 0.7); lightning(c, Math.floor(c.beat), '#ffffff', c.pulse > 0.7 && Math.floor(c.beat) % 2 === 0 ? c.pulse : 0); crowd(c, '#000'); }],
  ],
};

// ---- Swing Kid: ビッグバンドのステージ。譜面台がずらり、サックスが光る ----
function bandStands(c, rows) {
  const g = c.g;
  for (let r = 0; r < rows; r++) for (let i = 0; i < 6; i++) { const x = c.w * (0.12 + i * 0.152), y = c.h * (0.6 + r * 0.14), sway = Math.sin(c.beat * Math.PI / 2 + i + r) * c.h * 0.006; g.fillStyle = '#c8303a'; g.fillRect(x - c.h * 0.06, y - c.h * 0.08, c.h * 0.12, c.h * 0.08); text(c, 'SK', x, y - c.h * 0.04, c.h * 0.035, '#ffd84a', 1, { font: 'serif', weight: 700 }); g.fillStyle = '#0a0606'; g.beginPath(); g.arc(x + sway, y - c.h * 0.14, c.h * 0.025, 0, TAU); g.fill(); }
}
const bandStage = (c) => { vgrad(c, ['#1a0604', '#3a100a']); stageBeams(c, 3, ['#ffd27a'], 0.3, 0.4); bandStands(c, 2); };
const swingKid = {
  intro: bandStage,
  looks: [
    [1, bandStage],
    [1, (c) => { jazzRoom(c); for (let i = 0; i < 7; i++) jazzNote(c, c.w * (0.1 + i * 0.13), c.h * (0.7 - frac(c.t * 0.25 + i / 7) * 0.55), c.h * 0.07, ['#ffd27a', '#ff8a3d', '#ffffff'][i % 3], 0.85); }],
    [2, (c, P) => { vgrad(c, ['#3a1004', '#8a3a0a']); radialLines(c, 24, '#ffd27a', 0.25 + 0.35 * c.pulse, c.t * 0.5, 0.1); text(c, 'SWING!', c.w / 2, c.h * 0.38 - bounce(c, 2), c.h * 0.18, '#ffd84a', 1, { font: 'serif', glow: 10 }); bandStands(c, 1); confetti(c); }],
  ],
};

// ---- Sakura Lattice: 格子窓ごしの夜桜。障子と提灯、サビで花吹雪 ----
function shoji(c, alpha) {
  const g = c.g; g.strokeStyle = '#3a2214'; g.globalAlpha = alpha; g.lineWidth = Math.max(2, c.h * 0.012);
  const n = 8, m = 5; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * c.w / n, 0); g.lineTo(i * c.w / n, c.h); g.stroke(); } for (let j = 0; j <= m; j++) { g.beginPath(); g.moveTo(0, j * c.h / m); g.lineTo(c.w, j * c.h / m); g.stroke(); }
  g.globalAlpha = 1;
}
const yozakura = (c, P) => { vgrad(c, ['#0a0418', '#2a0a30']); twinkle(c, SKY, '#fff'); moon(c, c.w * 0.7, c.h * 0.3, c.h * 0.12, '#fff0f4'); for (let i = 0; i < 6; i++) sakura(c, c.w * (0.05 + i * 0.18), c.h * (0.15 + 0.1 * (i % 2)), c.h * 0.08, c.t * 0.1 + i, '#ffb3c8', 0.8); fallingPetals(c, PETALS, '#ffb3c8', 0.6, 0.3); shoji(c, 0.9); };
const sakuraLattice = {
  intro: yozakura,
  looks: [
    [1, yozakura],
    [1, (c, P) => { vgrad(c, ['#1a0418', '#4a0a30']); lanternRow(c, c.h * 0.25, 6, c.h * 0.06, 6, c.t); for (let i = 8; i >= 0; i--) { const d = (i + 1 - frac(c.t * 0.4)) / 9, s = c.h * 0.25 / (0.15 + d); torii(c, c.w / 2, c.h * 0.55 + s * 0.48, s, '#e0384f', clamp01((1 - d) * 1.5)); } fallingPetals(c, PETALS, '#ffc4d6', 1, 0.5); }],
    [2, (c, P) => { vgrad(c, ['#4a0a30', '#ff8fb1']); radialLines(c, 20, '#ffffff', 0.2 + 0.3 * c.pulse, c.t * 0.3, 0.2); for (let r = 0; r < 3; r++) for (let i = 0; i < 6 + r * 4; i++) { const a = i * TAU / (6 + r * 4) + c.t * (r % 2 ? -0.5 : 0.5), R = c.h * (0.15 + r * 0.15) * (1 + 0.05 * c.pulse); sakura(c, c.w / 2 + Math.cos(a) * R * 1.2, c.h / 2 + Math.sin(a) * R, c.h * 0.05, a, r === 1 ? '#ffffff' : '#ffb3c8', 0.9); } fallingPetals(c, PETALS, '#ffffff', 1.8, 0.7); shoji(c, 0.35); }],
  ],
};

// ---- Last Horizon: 最後の地平線。荒野の夜明けに旗がはためき、光の柱が立つ ----
function flag(c, x, base, s) {
  const g = c.g; g.strokeStyle = '#2a1a10'; g.lineWidth = s * 0.03; g.beginPath(); g.moveTo(x, base); g.lineTo(x, base - s); g.stroke();
  g.fillStyle = '#c8303a'; g.beginPath(); g.moveTo(x, base - s);
  for (let i = 0; i <= 10; i++) g.lineTo(x + i / 10 * s * 0.6, base - s + Math.sin(i * 0.8 - c.t * 4) * s * 0.04);
  for (let i = 10; i >= 0; i--) g.lineTo(x + i / 10 * s * 0.6, base - s * 0.65 + Math.sin(i * 0.8 - c.t * 4) * s * 0.04);
  g.fill();
}
const dawnField = (c, P) => { vgrad(c, ['#1a1430', '#8a5a5a', '#ffd9a0']); retroSun(c, c.w / 2, c.h * 0.72, c.h * 0.2, '#fffbe0', '#ffb070', 'rgba(0,0,0,0)'); c.g.fillStyle = '#2a1a14'; c.g.fillRect(0, c.h * 0.72, c.w, c.h); flag(c, c.w * 0.3, c.h * 0.74, c.h * 0.45); birds(c, '#2a1a20'); };
const lastHorizon = {
  intro: dawnField,
  looks: [
    [1, dawnField],
    [1, (c, P) => { vgrad(c, ['#0a0c20', '#3a3a5a']); milkyWay(c, 0.4); hills(c, c.h * 0.78, '#0a0808', c.h * 0.04, 0.008, 0); for (let i = 0; i < 3; i++) flag(c, c.w * (0.25 + i * 0.25), c.h * 0.8, c.h * (0.3 - i * 0.04)); }],
    [2, (c, P) => { vgrad(c, ['#5a3a2a', '#ffd9a0']); radialLines(c, 30, '#ffffff', 0.3 + 0.3 * c.pulse, c.t * 0.1, 0.05); c.g.save(); c.g.globalCompositeOperation = 'lighter'; const gr = c.g.createLinearGradient(c.w / 2 - c.w * 0.05, 0, c.w / 2 + c.w * 0.05, 0); gr.addColorStop(0, 'rgba(255,240,200,0)'); gr.addColorStop(0.5, `rgba(255,240,200,${0.6 + 0.3 * c.pulse})`); gr.addColorStop(1, 'rgba(255,240,200,0)'); c.g.fillStyle = gr; c.g.fillRect(c.w / 2 - c.w * 0.05, 0, c.w * 0.1, c.h * 0.75); c.g.restore(); c.g.fillStyle = '#2a1a14'; c.g.fillRect(0, c.h * 0.75, c.w, c.h); flag(c, c.w / 2 - c.h * 0.15, c.h * 0.76, c.h * 0.5); }],
  ],
};

// ---- Celtic Run: 緑の丘を駆ける。ケルトの結び目模様と石の環 ----
function knot(c, x, y, R, rot, col) {
  const g = c.g; g.strokeStyle = col; g.lineWidth = R * 0.12; g.lineCap = 'round';
  for (let i = 0; i < 3; i++) { const a = rot + i * TAU / 3; g.beginPath(); g.ellipse(x + Math.cos(a) * R * 0.35, y + Math.sin(a) * R * 0.35, R * 0.55, R * 0.28, a, 0, TAU); g.stroke(); }
  g.beginPath(); g.arc(x, y, R * 0.8, 0, TAU); g.stroke();
}
function stones(c, base) { const g = c.g; g.fillStyle = '#5a6a6a'; for (let i = 0; i < 7; i++) { const x = c.w * (0.15 + i * 0.12), h = c.h * (0.12 + hash1(i) * 0.06); g.fillRect(x - c.w * 0.02, base - h, c.w * 0.04, h); } g.fillRect(c.w * 0.25, base - c.h * 0.2, c.w * 0.2, c.h * 0.03); }
const greenHills = (c) => { vgrad(c, ['#8ab8d8', '#e0f0e8']); fluffyClouds(c, c.h * 0.2, 0.015); hills(c, c.h * 0.62, '#5ab050', c.h * 0.06, 0.01, 0.1); hills(c, c.h * 0.75, '#3a9040', c.h * 0.05, 0.016, 0.25); stones(c, c.h * 0.7); };
const celticRun = {
  intro: greenHills,
  looks: [
    [1, greenHills],
    [1, (c) => { vgrad(c, ['#0a2a14', '#1a4a24']); knot(c, c.w / 2, c.h / 2, c.h * 0.3, c.t * 0.3, '#7dff6d'); for (let i = 0; i < 4; i++) knot(c, c.w * (0.1 + i * 0.27), c.h * 0.12, c.h * 0.06, -c.t * 0.5, '#ffd84a'); }],
    [2, (c) => { vgrad(c, ['#3aa040', '#c8f0b0']); radialLines(c, 24, '#ffffff', 0.25 + 0.3 * c.pulse, c.t * 0.3, 0.05); hills(c, c.h * 0.7, '#2a8030', c.h * 0.06, 0.014, 1); for (let i = 0; i < 3; i++) knot(c, c.w * (0.25 + i * 0.25), c.h * 0.4 - bounce(c, 1.5, i / 3), c.h * 0.12, c.t * (i % 2 ? -1 : 1), '#ffffff'); birds(c, '#1a3a1a'); }],
  ],
};

// ---- Big Room Blast: 巨大フェスのメインステージ。花火とレーザー、何万人の観客 ----
const mainStage = (c, P) => { vgrad(c, ['#05020a', '#200830']); stageBeams(c, 8, [P.main, '#3dd6ff'], 0.3, 0.8); eqBars(c, 40, P.main, 0.4); crowd(c, '#05020a'); };
const bigRoomBlast = {
  intro: mainStage,
  looks: [
    [1, mainStage],
    [1, (c, P) => { vgrad(c, ['#08020a', '#2a0430']); for (let i = 0; i < 5; i++) firework(c, c.w * (0.15 + i * 0.17), c.h * (0.2 + (i % 2) * 0.12), frac(c.beat / 2 + i / 5), [P.main, '#3dd6ff', '#ffd84a', '#ffffff', '#ff8a3d'][i], c.h * 0.16); crowd(c, '#05020a'); }],
    [2, (c, P) => { vgrad(c, ['#3a0440', '#7a0a80']); stageBeams(c, 10, [P.main, '#3dd6ff', '#ffffff'], 0.35 + 0.35 * c.pulse, 2.2); radialLines(c, 36, '#ffffff', 0.15 + 0.3 * c.pulse, c.t * 0.8, 0.3); for (let i = 0; i < 3; i++) firework(c, c.w * (0.25 + i * 0.25), c.h * 0.22, frac(c.beat + i / 3), '#ffffff', c.h * 0.2); crowd(c, '#000'); }],
    [0, (c, P) => { vgrad(c, ['#020104', '#0a0214']); stageBeams(c, 2, [P.main], 0.2, 0.3); crowd(c, '#020104'); }],
  ],
};

// ---- Glitch Garden: 電子の庭。デジタルの花が咲き、ノイズで形が崩れる ----
function pixelFlower(c, x, base, s, bloom, col) {
  const g = c.g, px = Math.max(2, s / 8);
  g.fillStyle = '#3a9a3a'; g.fillRect(x - px / 2, base - s * 1.2, px, s * 1.2);
  g.fillRect(x, base - s * 0.6, px * 3, px);
  const r = Math.round(3 * bloom);
  g.fillStyle = col; for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) if (Math.abs(i) + Math.abs(j) <= r && (i + j) % 2 === 0) g.fillRect(x + i * px - px / 2, base - s * 1.2 + j * px - px / 2, px, px);
  g.fillStyle = '#ffffff'; g.fillRect(x - px / 2, base - s * 1.2 - px / 2, px, px);
}
const garden = (c, P) => { vgrad(c, ['#0a1a0a', '#1a3a1a']); hexGrid(c, P.main, 0.08); c.g.fillStyle = '#0a140a'; c.g.fillRect(0, c.h * 0.82, c.w, c.h); for (let i = 0; i < 7; i++) pixelFlower(c, c.w * (0.08 + i * 0.14), c.h * 0.84, c.h * (0.25 + 0.08 * hash1(i)), ease(frac(c.t * 0.1 + hash1(i))), [P.main, '#ff5ec4', '#ffd84a', '#3dd6ff'][i % 4]); };
const glitchGarden = {
  intro: garden,
  looks: [
    [1, garden],
    [1, (c, P) => { garden(c, P); glitch(c, 0.3 + 0.4 * c.pulse, Math.floor(c.beat * 2)); }],
    [2, (c, P) => { vgrad(c, ['#1a3a0a', '#4a7a1a']); radialLines(c, 20, P.main, 0.2 + 0.3 * c.pulse, c.t * 0.3, 0.15); for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + c.t * 0.4; pixelFlower(c, c.w / 2 + Math.cos(a) * c.h * 0.4, c.h / 2 + Math.sin(a) * c.h * 0.3 + c.h * 0.15, c.h * 0.15, 1, ['#ffffff', '#ff5ec4'][i % 2]); } glitch(c, c.pulse * 0.7, Math.floor(c.beat * 4)); }],
  ],
};

// ---- Salsa Fuego: 情熱のサルサ。炎の赤、マラカス、回るスカート ----
function maraca(c, x, y, s, rot) {
  const g = c.g; g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = '#8a4a1a'; g.fillRect(-s * 0.06, 0, s * 0.12, s * 0.8);
  g.fillStyle = '#ff6a3d'; g.beginPath(); g.ellipse(0, -s * 0.2, s * 0.32, s * 0.42, 0, 0, TAU); g.fill();
  g.fillStyle = '#ffd84a'; for (let i = 0; i < 3; i++) g.fillRect(-s * 0.32, -s * 0.4 + i * s * 0.2, s * 0.64, s * 0.05);
  g.restore();
}
function skirt(c, x, y, R, spin, col) {
  const g = c.g, n = 16;
  for (let i = 0; i < n; i++) { const a0 = spin + i * TAU / n, a1 = a0 + TAU / n; g.fillStyle = i % 2 ? col : '#ffd84a'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a0) * R, y + Math.sin(a0) * R * 0.35 + R * 0.4); g.lineTo(x + Math.cos(a1) * R, y + Math.sin(a1) * R * 0.35 + R * 0.4); g.fill(); }
}
const fuegoNight = (c, P) => { vgrad(c, ['#1a0200', '#4a0800']); flames(c, c.h, c.h * 0.35, 0.8); maraca(c, c.w * 0.3, c.h * 0.45, c.h * 0.18, Math.sin(c.beat * Math.PI * 2) * 0.4 - 0.3); maraca(c, c.w * 0.7, c.h * 0.45, c.h * 0.18, -Math.sin(c.beat * Math.PI * 2) * 0.4 + 0.3); };
const salsaFuego = {
  intro: fuegoNight,
  looks: [
    [1, fuegoNight],
    [1, (c, P) => { vgrad(c, ['#2a0400', '#6a1000']); lunares(c, '#ffd84a', c.h * 0.015, 0.2, 0.3); skirt(c, c.w / 2, c.h * 0.4, c.h * 0.4, c.t * 2, P.main); }],
    [2, (c, P) => { vgrad(c, ['#ff3d00', '#ffd84a']); radialLines(c, 28, '#ffffff', 0.25 + 0.35 * c.pulse, c.t * 0.6, 0.1); for (let i = 0; i < 3; i++) skirt(c, c.w * (0.25 + i * 0.25), c.h * 0.35, c.h * 0.22, c.t * (i % 2 ? -3 : 3), ['#c41414', '#ff6a3d', '#c41414'][i]); sparks(c, '#ffffff', 2); }],
  ],
};

// ---- Blue Note Lane: 青い夜のジャズクラブの路地。ネオンの看板とウッドベース ----
function upright(c, x, base, s, k) {
  const g = c.g; g.fillStyle = '#7a3a1a'; g.beginPath(); g.ellipse(x, base - s * 0.35, s * 0.32, s * 0.38, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x, base - s * 0.8, s * 0.24, s * 0.25, 0, 0, TAU); g.fill();
  g.fillStyle = '#2a1408'; g.fillRect(x - s * 0.03, base - s * 1.6, s * 0.06, s * 1.2);
  g.strokeStyle = '#e8d8b0'; g.lineWidth = 1; for (let i = -1; i <= 2; i++) { g.beginPath(); g.moveTo(x + i * s * 0.02, base - s * 1.55); g.lineTo(x + i * s * 0.03 + Math.sin(c.t * 40 + i) * k * 2, base - s * 0.2); g.stroke(); }
}
const blueAlley = (c, P) => { vgrad(c, ['#02061a', '#0a1a40']); rain(c, 'rgba(140,180,255,0.6)', 0.6); neonSign(c, 'BLUE NOTE', c.w / 2, c.h * 0.3, c.h * 0.1, P.main, Math.sin(c.t * 7) > 0.93 ? 0.3 : 1); skyline(c, BLDS, c.h * 0.95, '#01030c', '#4fa3ff', 0.2); };
const blueNoteLane = {
  intro: blueAlley,
  looks: [
    [1, blueAlley],
    [1, (c, P) => { jazzRoom(c); upright(c, c.w * 0.3, c.h * 0.95, c.h * 0.5, c.pulse); for (let i = 0; i < 5; i++) jazzNote(c, c.w * (0.5 + i * 0.1), c.h * (0.7 - frac(c.t * 0.3 + i / 5) * 0.5), c.h * 0.07, P.main, 0.8); }],
    [2, (c, P) => { vgrad(c, ['#0a2a6a', '#4fa3ff']); radialLines(c, 24, '#ffffff', 0.2 + 0.3 * c.pulse, c.t * 0.4, 0.1); vinyl(c, c.w / 2, c.h / 2, c.h * (0.32 + 0.01 * c.pulse), c.t * 3, P.main); for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + c.t; jazzNote(c, c.w / 2 + Math.cos(a) * c.h * 0.42, c.h / 2 + Math.sin(a) * c.h * 0.4, c.h * 0.06, '#ffffff', 0.9); } }],
  ],
};

export default {
  'gamelan-moon': gamelanMoon,
  'thunder-road': thunderRoad,
  'swing-kid': swingKid,
  'sakura-lattice': sakuraLattice,
  'last-horizon': lastHorizon,
  'celtic-run': celticRun,
  'big-room-blast': bigRoomBlast,
  'glitch-garden': glitchGarden,
  'salsa-fuego': salsaFuego,
  'blue-note-lane': blueNoteLane,
};

// 特製MV その8: 激しめの曲(アニソン・和ロック・パワーメタル・ジャングル・フォンク・ロック/メタル・ハードスタイル・ダークシンセ・ブルーグラス・ハッピーハードコア)
import {
  TAU, frac, clamp01, ease, table, vgrad, text, twinkle, SKY, STARS, starfield, hills, birds, fluffyClouds, waves, radialLines,
  retroSun, sparkle, bokeh, palm, moon, stageBeams, eqBars, crowd, beatRipples, vinyl, skyline, BLDS, hash1, ringSegments,
  grid, tunnel, glitch, hexGrid, lightning, hazard, flames, sparks, sakura, fallingPetals, PETALS, torii, slash, samuraiFigure,
  neonMoon, scanlines, dotSphere, heart, candySwirl, star5, confetti, risingBubbles, cloudBand, pointTerrain,
} from '../mv.js';

const bounce = (c, k = 1, ph = 0) => Math.abs(Math.sin((c.beat + ph) * Math.PI)) * c.h * 0.03 * k;

// ---- Brave Horizon: アニメのオープニング。夕焼けの空へ飛び立つ主人公、流れる雲 ----
function heroCape(c, x, y, s, wind) {
  const g = c.g; g.fillStyle = '#e83a3a'; g.beginPath(); g.moveTo(x - s * 0.15, y - s * 0.6); g.quadraticCurveTo(x - s * 0.8, y - s * 0.3 + wind, x - s * 1.1, y + s * 0.1 + wind); g.lineTo(x - s * 0.1, y - s * 0.1); g.fill();
  g.fillStyle = '#1a2a5a'; g.fillRect(x - s * 0.15, y - s * 0.65, s * 0.3, s * 0.6); g.fillRect(x - s * 0.13, y - s * 0.05, s * 0.1, s * 0.4); g.fillRect(x + s * 0.03, y - s * 0.05, s * 0.1, s * 0.4);
  g.fillStyle = '#ffd8b8'; g.beginPath(); g.arc(x, y - s * 0.8, s * 0.15, 0, TAU); g.fill();
  g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(x, y - s * 0.85, s * 0.16, Math.PI, TAU); g.fill();
}
const skyward = (c, P) => { vgrad(c, ['#2a4aa8', '#ff9a6a', '#ffd9a0']); retroSun(c, c.w * 0.7, c.h * 0.6, c.h * 0.18, '#fff6c8', '#ff8a5a', 'rgba(0,0,0,0)'); cloudBand(c, c.h * 0.75, '#ffffff', 0.05, 0.8); heroCape(c, c.w * 0.3, c.h * 0.5 - Math.sin(c.t) * c.h * 0.03, c.h * 0.22, Math.sin(c.t * 4) * c.h * 0.03); };
const braveHorizon = {
  intro: skyward,
  looks: [
    [1, skyward],
    [1, (c, P) => { vgrad(c, ['#3aa0ff', '#c8eaff']); cloudBand(c, c.h * 0.3, '#ffffff', 0.08, 0.9); cloudBand(c, c.h * 0.7, '#e8f4ff', 0.12, 1); birds(c, '#2a3a5a'); heroCape(c, c.w / 2 + Math.sin(c.t * 0.7) * c.w * 0.2, c.h * 0.5, c.h * 0.18, Math.sin(c.t * 5) * c.h * 0.04); }],
    [2, (c, P) => { vgrad(c, ['#ff6a3a', '#ffe08a']); radialLines(c, 32, '#ffffff', 0.3 + 0.35 * c.pulse, c.t * 0.3, 0.05); heroCape(c, c.w / 2, c.h * 0.6 - bounce(c, 1), c.h * (0.3 + 0.02 * c.pulse), Math.sin(c.t * 6) * c.h * 0.05); for (let i = 0; i < 8; i++) sparkle(c, c.w * hash1(i), c.h * hash1(i + 3) * 0.6, c.h * 0.03 * (0.5 + c.pulse), '#fff', 0.9); }],
    [0, (c) => { vgrad(c, ['#0a1030', '#3a2a5a']); twinkle(c, SKY, '#fff'); hills(c, c.h * 0.8, '#0a0a1a', c.h * 0.04, 0.01, 0); heroCape(c, c.w * 0.5, c.h * 0.8, c.h * 0.14, Math.sin(c.t * 2) * c.h * 0.02); }],
  ],
};

// ---- Shamisen Storm: 嵐の夜の城。三味線の弦がはじけ、稲妻と桜吹雪 ----
function castle(c, base, s, col) {
  const g = c.g; g.fillStyle = col;
  g.fillRect(c.w / 2 - s * 0.6, base - s * 0.4, s * 1.2, s * 0.4);
  for (let k = 0; k < 3; k++) { const w = s * (1.1 - k * 0.25), y = base - s * (0.4 + k * 0.28); g.beginPath(); g.moveTo(c.w / 2 - w / 2 - s * 0.12, y); g.lineTo(c.w / 2 + w / 2 + s * 0.12, y); g.lineTo(c.w / 2 + w / 2 - s * 0.05, y - s * 0.12); g.lineTo(c.w / 2 - w / 2 + s * 0.05, y - s * 0.12); g.fill(); g.fillRect(c.w / 2 - w / 2 + s * 0.05, y - s * 0.28, w - s * 0.1, s * 0.16); }
}
function shamisenStrings(c, amp, col) {
  const g = c.g; for (let i = 0; i < 3; i++) { g.strokeStyle = col; g.lineWidth = 2 + i; g.beginPath(); for (let y = 0; y <= c.h; y += 6) { const x = c.w * (0.4 + i * 0.1) + Math.sin(y * 0.06 + c.t * 40 + i) * amp * c.w * 0.012 * Math.sin(y / c.h * Math.PI); y ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
}
const stormCastle = (c, P) => { vgrad(c, ['#05040c', '#1a1430']); lightning(c, Math.floor(c.beat / 2), '#e8f0ff', frac(c.beat / 2) < 0.12 ? 1 : 0); castle(c, c.h * 0.95, c.h * 0.6, '#08060e'); fallingPetals(c, PETALS, '#ffb3c8', 1.4, 0.8); };
const shamisenStorm = {
  intro: stormCastle,
  looks: [
    [1, stormCastle],
    [1, (c, P) => { vgrad(c, ['#1a0408', '#3a0a14']); shamisenStrings(c, 0.6 + c.pulse, '#f4e8d0'); for (let i = 0; i < 6; i++) sakura(c, c.w * hash1(i), c.h * (0.2 + 0.6 * hash1(i + 4)), c.h * 0.05, c.t + i, '#ff4f6e', 0.8); }],
    [2, (c, P) => { vgrad(c, ['#3a0410', '#8a0a24']); radialLines(c, 28, '#ffffff', 0.2 + 0.35 * c.pulse, c.t * 0.6, 0.2); slash(c, frac(c.beat), '#ffffff', -0.5 + (Math.floor(c.beat) % 2) * 1); samuraiFigure(c, c.w / 2, c.h * 0.95, c.h * 0.45, c.pulse); fallingPetals(c, PETALS, '#ffffff', 2, 1); }],
  ],
};

// ---- Crystal Fortress: 氷の城塞。クリスタルがきらめき、剣が光る ----
function crystal(c, x, base, s, col, a = 1) {
  const g = c.g; g.globalAlpha = a; const gr = g.createLinearGradient(x - s * 0.3, base - s, x + s * 0.3, base); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, col); gr.addColorStop(1, '#1a3a6a');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x, base - s); g.lineTo(x + s * 0.25, base - s * 0.7); g.lineTo(x + s * 0.2, base); g.lineTo(x - s * 0.2, base); g.lineTo(x - s * 0.25, base - s * 0.7); g.fill(); g.globalAlpha = 1;
}
function sword(c, x, y, s, rot, glow) {
  const g = c.g; g.save(); g.translate(x, y); g.rotate(rot); g.shadowColor = '#bfe8ff'; g.shadowBlur = glow * s * 0.4;
  g.fillStyle = '#e8f4ff'; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.06, -s * 0.85); g.lineTo(s * 0.06, s * 0.2); g.lineTo(-s * 0.06, s * 0.2); g.lineTo(-s * 0.06, -s * 0.85); g.fill();
  g.shadowBlur = 0; g.fillStyle = '#ffd84a'; g.fillRect(-s * 0.25, s * 0.2, s * 0.5, s * 0.06); g.fillStyle = '#5a3a2a'; g.fillRect(-s * 0.04, s * 0.26, s * 0.08, s * 0.25);
  g.restore();
}
const fortress = (c, P) => { vgrad(c, ['#04102a', '#1a3a6a', '#7ad0ff']); twinkle(c, SKY, '#fff'); for (let i = 0; i < 9; i++) crystal(c, c.w * (0.06 + i * 0.11), c.h * 0.95, c.h * (0.3 + 0.3 * Math.abs(Math.sin(i * 1.7))), P.main, 0.9); };
const crystalFortress = {
  intro: fortress,
  looks: [
    [1, fortress],
    [1, (c, P) => { vgrad(c, ['#081a3a', '#2a5a9a']); for (let i = 0; i < 20; i++) { const a = i * TAU / 20 + c.t * 0.3; crystal(c, c.w / 2 + Math.cos(a) * c.h * 0.4, c.h / 2 + Math.sin(a) * c.h * 0.35 + c.h * 0.05, c.h * 0.1, '#bfe8ff', 0.8); } sword(c, c.w / 2, c.h / 2, c.h * 0.3, Math.sin(c.t) * 0.1, 0.6); }],
    [2, (c, P) => { vgrad(c, ['#1a4a8a', '#bfe8ff']); radialLines(c, 32, '#ffffff', 0.3 + 0.35 * c.pulse, c.t * 0.5, 0.1); sword(c, c.w / 2, c.h * 0.55, c.h * (0.4 + 0.02 * c.pulse), 0, 1 + c.pulse); for (let i = 0; i < 10; i++) star5(c, c.w * hash1(i), c.h * hash1(i + 2) * 0.8, c.h * 0.025, '#ffffff', 0.9, 0.8, c.t + i); }],
  ],
};

// ---- Jungle Lights: 夜のジャングル。葉の影の向こうに光る目と、ホタルの光 ----
function leaves(c, col, sway) {
  const g = c.g; g.fillStyle = col;
  for (let i = 0; i < 18; i++) { const x = hash1(i) * c.w, y = (i % 2 ? 0 : c.h) + (hash1(i + 3) - 0.5) * c.h * 0.3, a = (i % 2 ? 1.2 : -1.6) + Math.sin(c.t * sway + i) * 0.1, L = c.h * (0.3 + hash1(i + 5) * 0.2); g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(L / 2, 0, L / 2, L * 0.13, 0, 0, TAU); g.fill(); g.restore(); }
}
function eyes(c, n, col) { const g = c.g; for (let i = 0; i < n; i++) { const blink = frac(c.t * 0.3 + hash1(i)) > 0.95 ? 0.1 : 1, x = c.w * (0.15 + hash1(i + 1) * 0.7), y = c.h * (0.3 + hash1(i + 2) * 0.4); g.fillStyle = col; for (const dx of [-1, 1]) { g.beginPath(); g.ellipse(x + dx * c.h * 0.025, y, c.h * 0.012, c.h * 0.012 * blink, 0, 0, TAU); g.fill(); } } }
const nightJungle = (c, P) => { vgrad(c, ['#020a04', '#0a2010']); eyes(c, 5, P.main); for (let i = 0; i < 30; i++) { c.g.fillStyle = '#e4ff8a'; c.g.globalAlpha = 0.3 + 0.6 * Math.max(0, Math.sin(c.t * 3 + i)); c.g.beginPath(); c.g.arc(hash1(i + 9) * c.w + Math.sin(c.t + i) * 10, hash1(i + 11) * c.h, 1.6, 0, TAU); c.g.fill(); } c.g.globalAlpha = 1; leaves(c, '#04140a', 1); };
const jungleLights = {
  intro: nightJungle,
  looks: [
    [1, nightJungle],
    [1, (c, P) => { vgrad(c, ['#04140a', '#0a3a1a']); pointTerrain(c, P.main, 1.2, 0.8, { alpha: 0.7 }); leaves(c, '#020a04', 2); }],
    [2, (c, P) => { vgrad(c, ['#0a3a14', '#3a8a2a']); stageBeams(c, 6, [P.main, '#ffffff'], 0.3 + 0.35 * c.pulse, 1.8); tunnel(c, 6, 1.4, P.main, { rot: c.t * 0.3, n: 10, alpha: 0.6 }); leaves(c, '#020a04', 3); }],
  ],
};

// ---- Phonk Garage: 深夜のガレージ。紫のネオン、低く構えた車、VHSのノイズ ----
function lowCar(c, x, base, s, bounceK) {
  const g = c.g, y = base - bounceK; g.fillStyle = '#0a0410'; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x - s * 0.95, y - s * 0.25); g.lineTo(x - s * 0.35, y - s * 0.3); g.lineTo(x - s * 0.15, y - s * 0.5); g.lineTo(x + s * 0.45, y - s * 0.5); g.lineTo(x + s * 0.65, y - s * 0.28); g.lineTo(x + s, y - s * 0.22); g.lineTo(x + s, y); g.fill();
  g.fillStyle = '#c04dff'; g.globalAlpha = 0.5; g.fillRect(x - s * 0.9, base + s * 0.02, s * 1.8, s * 0.04); g.globalAlpha = 1;
  g.fillStyle = '#111'; for (const dx of [-0.6, 0.6]) { g.beginPath(); g.arc(x + dx * s, base - s * 0.02, s * 0.15, 0, TAU); g.fill(); }
  g.fillStyle = '#ff3d3d'; g.fillRect(x - s, y - s * 0.2, s * 0.08, s * 0.06);
}
function vhsNoise(c, a) { const g = c.g; g.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { const y = frac(hash1(i + Math.floor(c.t * 12)) ) * c.h; g.globalAlpha = a * 0.15; g.fillRect(0, y, c.w, 1 + hash1(i) * 3); } g.globalAlpha = 1; text(c, 'REC ●', c.w * 0.12, c.h * 0.08, c.h * 0.035, '#ff3d3d', Math.sin(c.t * 4) > 0 ? 0.9 : 0.2); }
const garage = (c, P) => { vgrad(c, ['#08020e', '#1a0628']); for (let i = 0; i < 4; i++) { c.g.fillStyle = P.main; c.g.globalAlpha = 0.6; c.g.fillRect(c.w * (0.1 + i * 0.24), c.h * 0.08, c.w * 0.16, c.h * 0.012); } c.g.globalAlpha = 1; c.g.fillStyle = '#0e0616'; c.g.fillRect(0, c.h * 0.8, c.w, c.h); lowCar(c, c.w / 2, c.h * 0.82, c.h * 0.22, bounce(c, 0.5)); vhsNoise(c, 1); scanlines(c, 0.15); };
const phonkGarage = {
  intro: garage,
  looks: [
    [1, garage],
    [1, (c, P) => { vgrad(c, ['#05010a', '#14041e']); text(c, 'PHONK', c.w / 2, c.h * 0.45, c.h * 0.22, P.main, 0.9, { font: 'Impact', glow: 14 }); glitch(c, 0.2 + c.pulse * 0.5, Math.floor(c.beat * 2)); vhsNoise(c, 1); }],
    [2, (c, P) => { vgrad(c, ['#1a0430', '#4a0a70']); stageBeams(c, 5, [P.main, '#ff3d8a'], 0.3 + 0.35 * c.pulse, 1.4); lowCar(c, c.w / 2, c.h * 0.85, c.h * 0.26, bounce(c, 2)); glitch(c, c.pulse * 0.5, Math.floor(c.beat * 4)); scanlines(c, 0.2); }],
  ],
};

// ---- Overdrive Riot: ロックフェスのステージ。ギターの炎、モッシュ、アンプの壁 ----
function ampWall(c, base, col) { const g = c.g; for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { const x = c.w * (i + 0.5) / 8, y = base - (j + 1) * c.h * 0.14; g.fillStyle = '#14141a'; g.fillRect(x - c.w * 0.055, y, c.w * 0.11, c.h * 0.13); g.fillStyle = '#05050a'; g.beginPath(); g.arc(x, y + c.h * 0.065, c.h * 0.045 * (1 + 0.08 * c.pulse), 0, TAU); g.fill(); g.fillStyle = col; g.fillRect(x - c.w * 0.04, y + c.h * 0.008, c.w * 0.03, c.h * 0.008); } }
function guitar(c, x, y, s, rot) { const g = c.g; g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#e83a2a'; g.beginPath(); g.ellipse(0, s * 0.2, s * 0.3, s * 0.25, 0, 0, TAU); g.ellipse(0, -s * 0.1, s * 0.22, s * 0.18, 0, 0, TAU); g.fill(); g.fillStyle = '#2a1a10'; g.fillRect(-s * 0.04, -s * 0.9, s * 0.08, s * 0.85); g.fillStyle = '#111'; g.fillRect(-s * 0.08, -s, s * 0.16, s * 0.12); g.restore(); }
const rockStage = (c, P) => { vgrad(c, ['#0a0202', '#2a0806']); stageBeams(c, 6, [P.main, '#ffffff'], 0.3, 1); ampWall(c, c.h * 0.75, P.main); crowd(c, '#000'); };
const overdriveRiot = {
  intro: rockStage,
  looks: [
    [1, rockStage],
    [1, (c, P) => { vgrad(c, ['#1a0400', '#4a1000']); flames(c, c.h, c.h * 0.5, 0.9); guitar(c, c.w / 2, c.h * 0.5, c.h * 0.35, -0.6 + Math.sin(c.beat * Math.PI) * 0.1); sparks(c, '#ffd84a', 1.5); }],
    [2, (c, P) => { vgrad(c, ['#3a0a00', '#8a2000']); stageBeams(c, 9, [P.main, '#ffffff', '#ffd84a'], 0.35 + 0.35 * c.pulse, 2.2); lightning(c, Math.floor(c.beat), '#ffffff', c.pulse > 0.6 ? c.pulse : 0); flames(c, c.h, c.h * 0.3, 0.8); crowd(c, '#000'); }],
  ],
};

// ---- Hard Reflector: ハードスタイル。赤いレーザーが鏡で反射し、ピラミッドが光る ----
function reflectLasers(c, col, n) {
  const g = c.g; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = col; g.lineWidth = Math.max(1.5, c.h * 0.006);
  for (let i = 0; i < n; i++) { let x = c.w * (i + 0.5) / n, y = c.h, a = -Math.PI / 2 + Math.sin(c.t * 0.8 + i) * 0.6; g.globalAlpha = 0.7; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { const L = c.h * 0.4; x += Math.cos(a) * L; y += Math.sin(a) * L; g.lineTo(x, y); a = -a; } g.stroke(); }
  g.restore();
}
function pyramid(c, x, base, s, glow) { const g = c.g; g.fillStyle = '#14080a'; g.beginPath(); g.moveTo(x, base - s); g.lineTo(x + s * 0.9, base); g.lineTo(x - s * 0.9, base); g.fill(); g.strokeStyle = `rgba(255,80,80,${0.4 + 0.6 * glow})`; g.lineWidth = 2; g.stroke(); }
const reflector = (c, P) => { vgrad(c, ['#0a0204', '#200408']); reflectLasers(c, P.main, 6); pyramid(c, c.w / 2, c.h * 0.95, c.h * 0.4, c.pulse); };
const hardReflector = {
  intro: reflector,
  looks: [
    [1, reflector],
    [1, (c, P) => { vgrad(c, ['#05010a', '#180410']); hexGrid(c, P.main, 0.12 + 0.2 * c.pulse); ringSegments(c, c.h * 0.35, 6, P.main, c.t, 0.7, 5); }],
    [2, (c, P) => { vgrad(c, ['#3a0408', '#7a0a10']); reflectLasers(c, '#ffffff', 10); radialLines(c, 30, P.main, 0.2 + 0.35 * c.pulse, c.t * 0.8, 0.2); pyramid(c, c.w / 2, c.h, c.h * 0.5, 1); crowd(c, '#000'); }],
  ],
};

// ---- Dark Shinobi: 闇の忍者。赤い月の屋根の上、手裏剣が飛ぶ ----
function shuriken(c, x, y, s, rot) { const g = c.g; g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#c8c8d0'; for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.lineTo(s * 0.2, -s * 0.2); g.lineTo(0, -s); g.lineTo(-s * 0.2, -s * 0.2); g.fill(); } g.fillStyle = '#111'; g.beginPath(); g.arc(0, 0, s * 0.12, 0, TAU); g.fill(); g.restore(); }
function roofs(c, base, col) { const g = c.g; g.fillStyle = col; for (let i = 0; i < 4; i++) { const x = c.w * (i * 0.3 - 0.05), w = c.w * 0.32, y = base - c.h * (0.1 + (i % 2) * 0.06); g.beginPath(); g.moveTo(x, y + c.h * 0.05); g.quadraticCurveTo(x + w / 2, y - c.h * 0.03, x + w, y + c.h * 0.05); g.lineTo(x + w, c.h); g.lineTo(x, c.h); g.fill(); } }
const shinobiNight = (c, P) => { vgrad(c, ['#0a0204', '#2a060c']); neonMoon(c, c.h * 0.35, P.main); roofs(c, c.h * 0.85, '#05010a'); samuraiFigure(c, c.w * 0.6, c.h * 0.78, c.h * 0.25, 0); };
const darkShinobi = {
  intro: shinobiNight,
  looks: [
    [1, shinobiNight],
    [1, (c, P) => { vgrad(c, ['#05010a', '#1a0410']); for (let i = 0; i < 5; i++) { const k = frac(c.beat / 2 + i / 5); shuriken(c, -c.w * 0.1 + k * c.w * 1.2, c.h * (0.2 + i * 0.14), c.h * 0.05, c.t * 12 + i); } roofs(c, c.h * 0.95, '#000'); }],
    [2, (c, P) => { vgrad(c, ['#3a0410', '#8a0a20']); radialLines(c, 28, '#ffffff', 0.2 + 0.35 * c.pulse, c.t * 0.5, 0.2); slash(c, frac(c.beat), '#ffffff', (Math.floor(c.beat) % 2 ? 1 : -1) * 0.6); shuriken(c, c.w / 2, c.h / 2, c.h * (0.18 + 0.02 * c.pulse), c.t * 8); glitch(c, c.pulse * 0.4, Math.floor(c.beat * 2)); }],
  ],
};

// ---- Bluegrass Rush: 山あいの農場を駆け抜ける。バンジョー、納屋、走る機関車 ----
function barn(c, x, base, s) { const g = c.g; g.fillStyle = '#b8302a'; g.fillRect(x - s * 0.5, base - s * 0.6, s, s * 0.6); g.beginPath(); g.moveTo(x - s * 0.6, base - s * 0.6); g.lineTo(x, base - s * 1); g.lineTo(x + s * 0.6, base - s * 0.6); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.strokeRect(x - s * 0.2, base - s * 0.45, s * 0.4, s * 0.45); g.beginPath(); g.moveTo(x - s * 0.2, base - s * 0.45); g.lineTo(x + s * 0.2, base); g.moveTo(x + s * 0.2, base - s * 0.45); g.lineTo(x - s * 0.2, base); g.stroke(); }
function banjo(c, x, y, s, rot) { const g = c.g; g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#e8e0c8'; g.beginPath(); g.arc(0, 0, s * 0.35, 0, TAU); g.fill(); g.strokeStyle = '#8a6a3a'; g.lineWidth = s * 0.06; g.stroke(); g.fillStyle = '#5a3a1a'; g.fillRect(-s * 0.04, -s * 1.2, s * 0.08, s * 0.9); g.restore(); }
function train(c, x, base, s) { const g = c.g; g.fillStyle = '#1a1a1a'; g.fillRect(x - s, base - s * 0.5, s * 1.2, s * 0.4); g.fillRect(x + s * 0.2, base - s * 0.75, s * 0.4, s * 0.65); g.fillRect(x - s * 0.8, base - s * 0.75, s * 0.12, s * 0.25); g.fillStyle = '#c8302a'; g.fillRect(x - s, base - s * 0.15, s * 1.6, s * 0.05); g.fillStyle = '#333'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x - s * 0.8 + i * s * 0.45, base - s * 0.05, s * 0.12, 0, TAU); g.fill(); } for (let i = 0; i < 4; i++) { const k = frac(c.t * 1.2 + i / 4); g.fillStyle = `rgba(220,220,220,${0.5 * (1 - k)})`; g.beginPath(); g.arc(x - s * 0.74 - k * s * 1.2, base - s * 0.8 - k * s * 0.6, s * (0.08 + k * 0.2), 0, TAU); g.fill(); } }
const farm = (c) => { vgrad(c, ['#7ac8ff', '#e8f4ff']); fluffyClouds(c, c.h * 0.2, 0.02); hills(c, c.h * 0.6, '#5a9a4a', c.h * 0.08, 0.008, 0.2); hills(c, c.h * 0.75, '#3a8a3a', c.h * 0.05, 0.014, 0.5); barn(c, c.w * 0.75, c.h * 0.78, c.h * 0.22); train(c, frac(c.t * 0.06) * c.w * 1.6 - c.w * 0.3, c.h * 0.92, c.h * 0.18); };
const bluegrassRush = {
  intro: farm,
  looks: [
    [1, farm],
    [1, (c, P) => { vgrad(c, ['#ffb06a', '#ffe8c0']); retroSun(c, c.w * 0.3, c.h * 0.5, c.h * 0.14, '#fff6c8', '#ff9a4a', 'rgba(0,0,0,0)'); hills(c, c.h * 0.72, '#8a6a3a', c.h * 0.05, 0.01, 0.3); banjo(c, c.w * 0.65, c.h * 0.55, c.h * 0.3, 0.5 + Math.sin(c.beat * Math.PI) * 0.08); }],
    [2, (c, P) => { vgrad(c, ['#e8b04a', '#fff0c8']); radialLines(c, 24, '#ffffff', 0.25 + 0.35 * c.pulse, c.t * 0.5, 0.05); for (let i = 0; i < 3; i++) banjo(c, c.w * (0.25 + i * 0.25), c.h * 0.6 - bounce(c, 1.5, i / 3), c.h * 0.22, -0.4 + i * 0.4); train(c, frac(c.t * 0.15) * c.w * 1.6 - c.w * 0.3, c.h * 0.95, c.h * 0.15); }],
  ],
};

// ---- Sugar Rush Scan: お菓子の国を超高速で。キャンディとハート、星が飛び交う ----
function lollipop(c, x, y, s, rot) { const g = c.g; g.strokeStyle = '#ffffff'; g.lineWidth = s * 0.08; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + s * 1.4); g.stroke(); g.save(); g.translate(x, y); g.rotate(rot); for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#ff7ad9' : '#ffffff'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, s * 0.5, i * TAU / 6, (i + 1) * TAU / 6); g.fill(); } g.restore(); }
const candyLand = (c, P) => { vgrad(c, ['#ffc4f0', '#c8f0ff']); fluffyClouds(c, c.h * 0.2, 0.04); for (let i = 0; i < 6; i++) lollipop(c, c.w * (0.08 + i * 0.17), c.h * 0.55 - bounce(c, 1, i / 6), c.h * 0.12, c.t * 2 + i); };
const sugarRush = {
  intro: candyLand,
  looks: [
    [1, candyLand],
    [1, (c, P) => { candySwirl(c, ['#ff7ad9', '#ffe6f8', '#9ad8ff', '#fff4c0'], c.t * 1.2); risingBubbles(c, 2, 0.6, 0.8); }],
    [2, (c, P) => { vgrad(c, ['#ff5ec4', '#fff0c8']); tunnel(c, 5, 2, '#ffffff', { rot: c.t, lw: 3, n: 12 }); for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + c.t * 2; heart(c, c.w / 2 + Math.cos(a) * c.h * 0.4, c.h / 2 + Math.sin(a) * c.h * 0.35, c.h * 0.05, ['#ff3d8a', '#ffffff'][i % 2], 0.9); } star5(c, c.w / 2, c.h / 2, c.h * (0.12 + 0.03 * c.pulse), '#ffe14f', 1, 1, c.t * 2); }],
  ],
};

export default {
  'brave-horizon': braveHorizon,
  'shamisen-storm': shamisenStorm,
  'crystal-fortress': crystalFortress,
  'jungle-lights': jungleLights,
  'phonk-garage': phonkGarage,
  'overdrive-riot': overdriveRiot,
  'hard-reflector': hardReflector,
  'dark-shinobi': darkShinobi,
  'bluegrass-rush': bluegrassRush,
  'sugar-rush': sugarRush,
};

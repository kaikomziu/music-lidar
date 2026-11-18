// 特製MV その10: コア系(ニューロファンク・フレンチコア・トランスコア・ジャンプアップ・メタルコア・ギミック・ハイパーコア・ガバ・ハードコア・弾幕チップチューン)
import {
  TAU, frac, clamp01, ease, table, vgrad, text, twinkle, SKY, STARS, starfield, hills, radialLines, retroSun, sparkle,
  stageBeams, eqBars, crowd, beatRipples, skyline, BLDS, hash1, ringSegments, grid, tunnel, pointTerrain, dotSphere, glitch,
  hexGrid, hazard, lightning, flames, sparks, scanlines, gear, clockHand, bossEye, sprite, star5, confetti,
} from '../mv.js';

const bounce = (c, k = 1, ph = 0) => Math.abs(Math.sin((c.beat + ph) * Math.PI)) * c.h * 0.03 * k;
const shake = (c, k) => { c.g.translate(Math.sin(c.t * 61) * c.h * 0.01 * k, Math.cos(c.t * 47) * c.h * 0.01 * k); };

// ---- Fractal Storm: フラクタルの嵐。枝分かれする稲妻のような図形が増殖する ----
function branch(c, x, y, a, L, d, col) {
  if (d <= 0 || L < 2) return;
  const g = c.g, x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L;
  g.strokeStyle = col; g.lineWidth = d * 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
  const sp = 0.5 + 0.2 * Math.sin(c.t * 1.3);
  branch(c, x2, y2, a - sp, L * 0.68, d - 1, col); branch(c, x2, y2, a + sp, L * 0.68, d - 1, col);
}
const storm = (c, P) => { vgrad(c, ['#020a14', '#06203a']); for (let i = 0; i < 6; i++) { c.g.globalAlpha = 0.7; branch(c, c.w / 2, c.h / 2, i * TAU / 6 + c.t * 0.2, c.h * 0.16, 6, P.main); } c.g.globalAlpha = 1; };
const fractalStorm = {
  intro: storm,
  looks: [
    [1, storm],
    [1, (c, P) => { vgrad(c, ['#010610', '#041a2a']); pointTerrain(c, P.main, 1.6, 1.1); lightning(c, Math.floor(c.beat), '#bff0ff', c.pulse > 0.7 ? c.pulse : 0); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse); vgrad(c, ['#06304a', '#0a6a8a']); radialLines(c, 32, '#ffffff', 0.2 + 0.35 * c.pulse, c.t, 0.2); for (let i = 0; i < 8; i++) branch(c, c.w / 2, c.h / 2, i * TAU / 8 - c.t * 0.5, c.h * (0.15 + 0.03 * c.pulse), 7, '#ffffff'); c.g.restore(); glitch(c, c.pulse * 0.5, Math.floor(c.beat * 4)); }],
  ],
};

// ---- Kick Machinegun: キックの機関銃。画面に弾痕のような光の輪が連打される ----
function muzzle(c, x, y, k, col) { const g = c.g; g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = col; g.globalAlpha = k; for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a - 0.15) * c.h * 0.12 * k, y + Math.sin(a - 0.15) * c.h * 0.12 * k); g.lineTo(x + Math.cos(a + 0.15) * c.h * 0.12 * k, y + Math.sin(a + 0.15) * c.h * 0.12 * k); g.fill(); } g.restore(); }
const machinegun = (c, P) => { vgrad(c, ['#0a0400', '#2a0c00']); hazard(c, c.h * 0.05, c.h * 0.05, P.main, 1); hazard(c, c.h * 0.9, c.h * 0.05, P.main, -1); const b = Math.floor(c.beat * 4); for (let i = 0; i < 4; i++) muzzle(c, c.w * (0.15 + hash1(b - i) * 0.7), c.h * (0.25 + hash1(b - i + 5) * 0.5), Math.exp(-frac(c.beat * 4 + i) * 3) * (1 - i * 0.25), P.main); };
const kickMachinegun = {
  intro: machinegun,
  looks: [
    [1, machinegun],
    [1, (c, P) => { vgrad(c, ['#050200', '#1a0800']); for (let i = 0; i < 16; i++) { const k = Math.exp(-frac(c.beat * 4 - i / 16 * 4) * 6); c.g.fillStyle = P.main; c.g.globalAlpha = 0.2 + 0.8 * k; c.g.fillRect(c.w * (i + 0.5) / 16 - c.w * 0.02, c.h * (0.5 - 0.3 * k), c.w * 0.04, c.h * 0.6 * k + 2); } c.g.globalAlpha = 1; }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse * 1.5); vgrad(c, ['#3a1000', '#8a3000']); stageBeams(c, 8, [P.main, '#ffffff'], 0.35 + 0.35 * c.pulse, 3); machinegun(c, P); c.g.restore(); crowd(c, '#000'); }],
  ],
};

// ---- Velocity Zero: トランスコア。光速の手前、青い光のトンネルで時間が伸びる ----
const warp = (c, P) => { vgrad(c, ['#02041a', '#0a1a4a']); starfield(c, STARS, 1.4, '#fff', 3); tunnel(c, 12, 1.2, P.main, { lw: 1.5, n: 18, alpha: 0.6 }); };
const velocityZero = {
  intro: warp,
  looks: [
    [1, warp],
    [1, (c, P) => { vgrad(c, ['#04082a', '#1a2a6a']); ringSegments(c, c.h * 0.3, 12, P.main, c.t * 1.5, 0.7, 3); ringSegments(c, c.h * 0.4, 6, '#ffffff', -c.t, 0.5, 2); text(c, String(Math.max(0, 999 - Math.floor(c.beat * 7) % 1000)).padStart(3, '0') + ' km/s', c.w / 2, c.h * 0.85, c.h * 0.05, '#bfe0ff', 0.8); }],
    [2, (c, P) => { vgrad(c, ['#1a3aaa', '#bfe0ff']); radialLines(c, 48, '#ffffff', 0.3 + 0.35 * c.pulse, 0, 0.1); starfield(c, STARS, 3, '#fff', 4); dotSphere(c, c.w / 2, c.h / 2, c.h * (0.15 + 0.05 * c.pulse), '#ffffff', c.t * 2, 1); }],
  ],
};

// ---- Terminal Velocity: ジャンプアップ。黄色い警告と落下するゲージ、跳ねる低音 ----
const terminal = (c, P) => { vgrad(c, ['#0a0a00', '#2a2600']); for (let i = 0; i < 20; i++) { const y = frac(hash1(i) + c.t * 0.6) * c.h; c.g.strokeStyle = P.main; c.g.globalAlpha = 0.4; c.g.lineWidth = 2; c.g.beginPath(); c.g.moveTo(c.w * hash1(i + 3), y); c.g.lineTo(c.w * hash1(i + 3), y - c.h * 0.15); c.g.stroke(); } c.g.globalAlpha = 1; text(c, 'WARNING', c.w / 2, c.h * 0.5, c.h * 0.12, P.main, 0.5 + 0.5 * c.pulse, { font: 'Impact', spacing: 8 }); hazard(c, c.h * 0.3, c.h * 0.04, P.main, 0.8); hazard(c, c.h * 0.66, c.h * 0.04, P.main, -0.8); };
const terminalVelocity = {
  intro: terminal,
  looks: [
    [1, terminal],
    [1, (c, P) => { vgrad(c, ['#050500', '#141200']); eqBars(c, 24, P.main, 0.8 + 0.4 * c.pulse); for (let i = 0; i < 6; i++) { c.g.fillStyle = '#ffffff'; c.g.fillRect(c.w * (0.1 + i * 0.16), c.h * 0.3 - bounce(c, 3, i / 6), c.w * 0.06, c.w * 0.06); } }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse); vgrad(c, ['#3a3000', '#8a7a00']); tunnel(c, 4, 2, P.main, { rot: Math.PI / 4 + c.t, lw: 4, n: 10 }); radialLines(c, 30, '#ffffff', 0.2 + 0.3 * c.pulse, c.t, 0.25); c.g.restore(); glitch(c, c.pulse * 0.5, Math.floor(c.beat * 2)); }],
  ],
};

// ---- Metalcore Fury: 怒りのメタルコア。燃えるステージ、ヘドバンする観客、炎の柱 ----
function fireColumns(c, n, k) { const g = c.g; g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < n; i++) { const x = c.w * (i + 0.5) / n, h = c.h * (0.4 + 0.4 * k) * (0.8 + 0.2 * Math.sin(c.t * 10 + i)); const gr = g.createLinearGradient(0, c.h - h, 0, c.h); gr.addColorStop(0, 'rgba(255,200,60,0)'); gr.addColorStop(0.4, 'rgba(255,120,30,0.6)'); gr.addColorStop(1, 'rgba(255,40,20,0.9)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - c.w * 0.03, c.h); g.quadraticCurveTo(x + Math.sin(c.t * 9 + i) * c.w * 0.02, c.h - h * 0.6, x, c.h - h); g.quadraticCurveTo(x + Math.sin(c.t * 7 + i) * c.w * 0.02, c.h - h * 0.6, x + c.w * 0.03, c.h); g.fill(); } g.restore(); }
function headbang(c, col) { const g = c.g; g.fillStyle = col; for (let i = 0; i < 30; i++) { const x = (i + 0.5) / 30 * c.w, nod = Math.abs(Math.sin((c.beat + (i % 2) * 0.5) * Math.PI)) * c.h * 0.03; g.beginPath(); g.arc(x, c.h * 0.88 + nod, c.h * 0.025, 0, TAU); g.fill(); g.fillRect(x - c.h * 0.03, c.h * 0.9 + nod * 0.5, c.h * 0.06, c.h * 0.12); } }
const furyStage = (c, P) => { vgrad(c, ['#0a0000', '#2a0000']); stageBeams(c, 6, [P.main, '#ffffff'], 0.3, 1.2); fireColumns(c, 4, c.pulse); headbang(c, '#000'); };
const metalcoreFury = {
  intro: furyStage,
  looks: [
    [1, furyStage],
    [1, (c, P) => { vgrad(c, ['#050000', '#1a0000']); flames(c, c.h, c.h * 0.6, 1); text(c, 'FURY', c.w / 2, c.h * 0.4, c.h * 0.25, '#000000', 0.9, { font: 'Impact' }); sparks(c, '#ffb347', 2); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse * 1.2); vgrad(c, ['#4a0000', '#aa1000']); stageBeams(c, 10, [P.main, '#ffffff', '#ffb347'], 0.35 + 0.35 * c.pulse, 2.4); fireColumns(c, 7, 1); lightning(c, Math.floor(c.beat), '#ffffff', c.pulse > 0.6 ? c.pulse : 0); c.g.restore(); headbang(c, '#000'); }],
  ],
};

// ---- Time Twister: 時間がねじれる。時計の針が逆回りし、歯車の迷宮が回る ----
function twistClock(c, x, y, R, dir) { const g = c.g; g.strokeStyle = '#c8b8ff'; g.lineWidth = R * 0.05; g.beginPath(); g.arc(x, y, R, 0, TAU); g.stroke(); for (let i = 0; i < 12; i++) text(c, ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'][i], x + Math.cos(i * TAU / 12 - Math.PI / 2) * R * 0.8, y + Math.sin(i * TAU / 12 - Math.PI / 2) * R * 0.8, R * 0.12, '#e0d8ff', 0.9, { font: 'serif', weight: 400 }); clockHand(c, x, y, R * 0.7, dir * c.t * 2 - Math.PI / 2, R * 0.03, '#ffffff'); clockHand(c, x, y, R * 0.45, dir * c.t * 0.3 - Math.PI / 2, R * 0.05, '#9d7bff'); }
const clockMaze = (c, P) => { vgrad(c, ['#0a0620', '#1a1040']); gear(c, c.w * 0.15, c.h * 0.2, c.h * 0.15, 12, c.t * 0.6, '#3a2a6a', '#0a0620'); gear(c, c.w * 0.85, c.h * 0.8, c.h * 0.18, 14, -c.t * 0.5, '#3a2a6a', '#0a0620'); twistClock(c, c.w / 2, c.h / 2, c.h * 0.3, Math.sin(c.beat * Math.PI / 8) > 0 ? 1 : -1); };
const timeTwister = {
  intro: clockMaze,
  looks: [
    [1, clockMaze],
    [1, (c, P) => { vgrad(c, ['#05031a', '#140a30']); c.g.save(); c.g.translate(c.w / 2, c.h / 2); c.g.rotate(Math.sin(c.t * 0.5) * 0.5); c.g.translate(-c.w / 2, -c.h / 2); tunnel(c, 12, 0.6 * Math.sin(c.t * 0.4), P.main, { rot: c.t, lw: 2 }); c.g.restore(); for (let i = 0; i < 4; i++) twistClock(c, c.w * (0.2 + i * 0.2), c.h * 0.5 + Math.sin(c.t + i) * c.h * 0.2, c.h * 0.08, i % 2 ? 1 : -1); }],
    [2, (c, P) => { vgrad(c, ['#2a1a6a', '#9d7bff']); radialLines(c, 36, '#ffffff', 0.2 + 0.35 * c.pulse, -c.t * 2, 0.2); twistClock(c, c.w / 2, c.h / 2, c.h * (0.35 + 0.02 * c.pulse), -3); for (let i = 0; i < 3; i++) gear(c, c.w / 2, c.h / 2, c.h * (0.45 + i * 0.08), 20 + i * 6, c.t * (i % 2 ? -1 : 1), 'rgba(255,255,255,0.2)', 'rgba(0,0,0,0)'); }],
  ],
};

// ---- Hyper Scan Breaker: スキャナーの光が画面を走査し、データの壁を壊していく ----
function scanBar(c, y, col) { const g = c.g; g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createLinearGradient(0, y - c.h * 0.08, 0, y + c.h * 0.02); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, col); g.fillStyle = gr; g.fillRect(0, y - c.h * 0.08, c.w, c.h * 0.1); g.restore(); }
function dataWall(c, col, broken) { const g = c.g, n = 16, m = 9; for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { if (hash1(i * 31 + j) < broken) continue; g.fillStyle = col; g.globalAlpha = 0.15 + 0.3 * hash1(i + j * 7 + Math.floor(c.beat)); g.fillRect(i * c.w / n + 1, j * c.h / m + 1, c.w / n - 2, c.h / m - 2); } g.globalAlpha = 1; }
const scanner = (c, P) => { vgrad(c, ['#0a0400', '#1e0c00']); dataWall(c, P.main, 0); scanBar(c, frac(c.beat / 4) * c.h * 1.1, P.main); };
const hyperScanBreaker = {
  intro: scanner,
  looks: [
    [1, scanner],
    [1, (c, P) => { vgrad(c, ['#050200', '#140800']); dataWall(c, P.main, frac(c.beat / 16)); for (let i = 0; i < 2; i++) scanBar(c, frac(c.beat / 2 + i / 2) * c.h * 1.1, '#ffffff'); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse); vgrad(c, ['#3a1400', '#8a3a00']); dataWall(c, '#ffffff', 0.5 + 0.4 * c.pulse); radialLines(c, 30, P.main, 0.25 + 0.35 * c.pulse, c.t, 0.2); scanBar(c, frac(c.beat) * c.h * 1.1, '#ffffff'); c.g.restore(); glitch(c, 0.3 + c.pulse * 0.5, Math.floor(c.beat * 4)); }],
  ],
};

// ---- Gabber Storm: ガバの嵐。歪んだキックで画面がつぶれ、赤い竜巻が回る ----
function tornado(c, x, col, speed) { const g = c.g; for (let i = 0; i < 24; i++) { const y = c.h * (1 - i / 24), r = c.w * (0.02 + 0.2 * (i / 24) ** 1.5), a = c.t * speed + i * 0.4; g.strokeStyle = col; g.globalAlpha = 0.3 + 0.4 * (i / 24); g.lineWidth = 2; g.beginPath(); g.ellipse(x + Math.sin(c.t * 1.3 + i * 0.1) * c.w * 0.03, y, r, r * 0.2, 0, a, a + 4); g.stroke(); } g.globalAlpha = 1; }
const gabberZone = (c, P) => { const sq = 1 - 0.15 * c.pulse; c.g.save(); c.g.translate(0, c.h * (1 - sq) / 2); c.g.scale(1, sq); vgrad(c, ['#1a0000', '#4a0000']); tornado(c, c.w / 2, P.main, 3); c.g.restore(); };
const gabberStorm = {
  intro: gabberZone,
  looks: [
    [1, gabberZone],
    [1, (c, P) => { vgrad(c, ['#0a0000', '#200000']); for (let i = 0; i < 4; i++) { const k = Math.exp(-frac(c.beat + i * 0.25) * 4); c.g.fillStyle = P.main; c.g.globalAlpha = k; c.g.beginPath(); c.g.arc(c.w / 2, c.h / 2, c.h * (0.1 + (1 - k) * 0.5), 0, TAU); c.g.fill(); } c.g.globalAlpha = 1; text(c, 'GABBER', c.w / 2, c.h / 2, c.h * 0.16, '#000', 1, { font: 'Impact' }); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse * 2); vgrad(c, ['#5a0000', '#ff2a2a']); radialLines(c, 40, '#ffffff', 0.25 + 0.4 * c.pulse, c.t * 2, 0.2); tornado(c, c.w * 0.3, '#ffffff', 5); tornado(c, c.w * 0.7, '#ffffff', -5); c.g.restore(); glitch(c, c.pulse * 0.7, Math.floor(c.beat * 4)); crowd(c, '#000'); }],
  ],
};

// ---- Abyss Gate: 深淵の門。紫の裂け目が開き、目がこちらを見る ----
function rift(c, open, col) { const g = c.g; g.save(); g.translate(c.w / 2, c.h / 2); const w = c.w * 0.04 + c.w * 0.25 * open; g.fillStyle = '#000'; g.shadowColor = col; g.shadowBlur = c.h * 0.08; g.beginPath(); g.moveTo(0, -c.h * 0.45); for (let i = 0; i <= 10; i++) { const y = -c.h * 0.45 + i / 10 * c.h * 0.9; g.lineTo(w * Math.sin(i / 10 * Math.PI) + Math.sin(i * 3 + c.t * 2) * c.w * 0.01, y); } for (let i = 10; i >= 0; i--) { const y = -c.h * 0.45 + i / 10 * c.h * 0.9; g.lineTo(-w * Math.sin(i / 10 * Math.PI) + Math.sin(i * 2.7 - c.t * 2) * c.w * 0.01, y); } g.fill(); g.restore(); }
const abyss = (c, P) => { vgrad(c, ['#05010a', '#140428']); twinkle(c, SKY, '#c8a0ff', 0.3); rift(c, 0.3 + 0.3 * ease(c.p), P.main); };
const abyssGate = {
  intro: abyss,
  looks: [
    [1, abyss],
    [1, (c, P) => { vgrad(c, ['#05010a', '#1a0430']); rift(c, 0.7, P.main); bossEye(c, c.w / 2, c.h / 2, c.h * 0.12, P.main, c.t * 0.8); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse); vgrad(c, ['#2a0a5a', '#8a3dff']); radialLines(c, 36, '#000000', 0.3 + 0.3 * c.pulse, c.t * 0.8, 0.2); ringSegments(c, c.h * 0.42, 8, '#ffffff', c.t, 0.7); bossEye(c, c.w / 2, c.h / 2, c.h * (0.18 + 0.04 * c.pulse), '#ff3dff', c.t * 1.5); c.g.restore(); glitch(c, c.pulse * 0.5, Math.floor(c.beat * 2)); }],
  ],
};

// ---- Bullet Hell 404: 弾幕シューティング。自機のまわりに渦巻く弾の模様 ----
const SHIP = ['...a...', '..aba..', '.aabaa.', 'aaabaaa', 'a.c.c.a'];
const SHIP_PAL = { a: '#3dffb0', b: '#ffffff', c: '#ff5a5a' };
function bulletRing(c, cx, cy, n, R, rot, col, s) { const g = c.g; g.fillStyle = col; for (let i = 0; i < n; i++) { const a = rot + i * TAU / n; g.beginPath(); g.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, s, 0, TAU); g.fill(); } }
const shmup = (c, P) => { vgrad(c, ['#000a08', '#001a14']); starfield(c, STARS, 0.6, '#fff'); for (let k = 0; k < 5; k++) bulletRing(c, c.w / 2, c.h * 0.3, 16, c.h * 0.08 * (1 + frac(c.beat / 2 + k / 5) * 5), c.t * (k % 2 ? 1 : -1), k % 2 ? P.main : '#ff5ac8', c.h * 0.01); const px = Math.max(3, Math.round(c.h / 60)); sprite(c, c.w / 2 - px * 3.5 + Math.sin(c.t * 2) * c.w * 0.1, c.h * 0.8, px, SHIP, SHIP_PAL); };
const bulletHell404 = {
  intro: shmup,
  looks: [
    [1, shmup],
    [1, (c, P) => { vgrad(c, ['#000604', '#00140e']); for (let i = 0; i < 3; i++) { const cx = c.w * (0.25 + i * 0.25); for (let k = 0; k < 4; k++) bulletRing(c, cx, c.h * 0.25, 10, c.h * 0.05 * (1 + frac(c.beat / 2 + k / 4) * 6), c.t * 2 * (i % 2 ? 1 : -1), P.main, c.h * 0.008); } text(c, '404 NOT FOUND', c.w / 2, c.h * 0.9, c.h * 0.05, '#ffffff', 0.7); }],
    [2, (c, P) => { vgrad(c, ['#003a2a', '#3dffb0']); for (let k = 0; k < 8; k++) bulletRing(c, c.w / 2, c.h / 2, 24, c.h * 0.05 * (1 + frac(c.beat + k / 8) * 9), c.t * 3 * (k % 2 ? 1 : -1) + k, k % 2 ? '#ffffff' : '#ff5ac8', c.h * 0.012); text(c, 'SPELL CARD', c.w / 2, c.h * 0.12, c.h * 0.06, '#ffffff', 0.6 + 0.4 * c.pulse, { glow: 8 }); }],
  ],
};

export default {
  'fractal-storm': fractalStorm,
  'kick-machinegun': kickMachinegun,
  'velocity-zero': velocityZero,
  'terminal-velocity': terminalVelocity,
  'metalcore-fury': metalcoreFury,
  'time-twister': timeTwister,
  'hyper-scan-breaker': hyperScanBreaker,
  'gabber-storm': gabberStorm,
  'abyss-gate': abyssGate,
  'bullet-hell-404': bulletHell404,
};

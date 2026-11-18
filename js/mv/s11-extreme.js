// 特製MV その11: 超高難度の曲(シンフォニックメタル・ジャズフュージョン・和コア・ブレイクコア・スピードコア・ギミック・フラッシュコア・テラーコア・オーケストラコア)
import {
  TAU, frac, clamp01, ease, table, vgrad, text, twinkle, SKY, STARS, starfield, radialLines, retroSun, sparkle, stageBeams,
  eqBars, crowd, beatRipples, skyline, BLDS, hash1, ringSegments, grid, tunnel, pointTerrain, dotSphere, glitch, hexGrid,
  hazard, lightning, flames, sparks, scanlines, gear, bossEye, star5, sakura, fallingPetals, PETALS, torii, slash, jazzNote,
  vinyl, roseWindow, church, milkyWay, firework,
} from '../mv.js';

const bounce = (c, k = 1, ph = 0) => Math.abs(Math.sin((c.beat + ph) * Math.PI)) * c.h * 0.03 * k;
const shake = (c, k) => { c.g.translate(Math.sin(c.t * 61) * c.h * 0.01 * k, Math.cos(c.t * 47) * c.h * 0.01 * k); };
// 白い点滅。光に敏感な人への負担を減らすため、間隔は0.5秒以上(速い曲では拍をまとめる)、明るさも控えめにする
const strobe = (c, col, every = 1) => { every = Math.max(every, Math.ceil((c.bpm / 60) * 0.5)); const k = Math.exp(-frac(c.beat / every) * 8); if (k > 0.05) { c.g.fillStyle = col; c.g.globalAlpha = k * 0.2; c.g.fillRect(0, 0, c.w, c.h); c.g.globalAlpha = 1; } };

// ---- Thunder Requiem: 雷鳴の大聖堂。ステンドグラスのバラ窓と、パイプオルガンの柱 ----
function organPipes(c, base, col, k) { const g = c.g; for (let i = 0; i < 21; i++) { const h = c.h * (0.25 + 0.3 * Math.sin(i / 20 * Math.PI)) * (1 + 0.04 * k), x = c.w * (0.15 + i * 0.033); const gr = g.createLinearGradient(x, 0, x + c.w * 0.025, 0); gr.addColorStop(0, '#8a6a2a'); gr.addColorStop(0.5, col); gr.addColorStop(1, '#5a4010'); g.fillStyle = gr; g.fillRect(x, base - h, c.w * 0.025, h); g.fillStyle = '#1a1006'; g.fillRect(x + c.w * 0.004, base - h + c.h * 0.03, c.w * 0.017, c.h * 0.012); } }
const cathedral = (c, P) => { vgrad(c, ['#0a0604', '#2a1a08']); roseWindow(c, c.w / 2, c.h * 0.3, c.h * 0.2, c.t * 0.1, 0.5 + 0.5 * c.pulse); organPipes(c, c.h, P.main, c.pulse); lightning(c, Math.floor(c.beat / 4), '#fff6d0', frac(c.beat / 4) < 0.08 ? 1 : 0); };
const thunderRequiem = {
  intro: cathedral,
  looks: [
    [1, cathedral],
    [1, (c, P) => { vgrad(c, ['#05030a', '#1a1428']); for (let i = 0; i < 3; i++) lightning(c, Math.floor(c.beat) * 3 + i, '#fff6d0', frac(c.beat) < 0.2 ? 1 - frac(c.beat) * 5 : 0); church(c, c.w / 2, c.h, c.h * 0.6); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse); vgrad(c, ['#3a2a08', '#ffcc3d']); radialLines(c, 40, '#ffffff', 0.25 + 0.4 * c.pulse, c.t * 0.5, 0.15); roseWindow(c, c.w / 2, c.h / 2, c.h * (0.36 + 0.03 * c.pulse), c.t * 0.4, 1); c.g.restore(); strobe(c, '#ffffff', 2); }],
  ],
};

// ---- Jackhammer Jazz: 工事現場でジャズセッション。ドリルの振動とサックス、レコードが高速回転 ----
function sax(c, x, y, s, rot) { const g = c.g; g.save(); g.translate(x, y); g.rotate(rot); g.strokeStyle = '#ffcf4f'; g.lineWidth = s * 0.12; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -s); g.lineTo(0, s * 0.3); g.quadraticCurveTo(0, s * 0.7, s * 0.35, s * 0.6); g.lineTo(s * 0.5, s * 0.2); g.stroke(); g.fillStyle = '#ffcf4f'; g.beginPath(); g.ellipse(s * 0.52, s * 0.15, s * 0.15, s * 0.1, -0.5, 0, TAU); g.fill(); g.restore(); }
const site = (c, P) => { c.g.save(); shake(c, 0.3 + c.pulse * 0.5); vgrad(c, ['#1a1004', '#3a2408']); hazard(c, c.h * 0.85, c.h * 0.06, '#ffd84a', 2); sax(c, c.w * 0.35, c.h * 0.45, c.h * 0.25, -0.3 + Math.sin(c.beat * Math.PI) * 0.1); vinyl(c, c.w * 0.7, c.h * 0.45, c.h * 0.2, c.t * 6, P.main); c.g.restore(); };
const jackhammerJazz = {
  intro: site,
  looks: [
    [1, site],
    [1, (c, P) => { vgrad(c, ['#0a0602', '#24160a']); for (let i = 0; i < 12; i++) jazzNote(c, c.w * hash1(i), c.h * (1 - frac(c.t * 0.8 + hash1(i + 3))), c.h * 0.07, i % 2 ? P.main : '#ffffff', 0.85); eqBars(c, 32, P.main, 0.8 + 0.3 * c.pulse); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse * 1.5); vgrad(c, ['#5a2a0a', '#ffa05e']); radialLines(c, 36, '#ffffff', 0.25 + 0.35 * c.pulse, c.t * 2, 0.15); vinyl(c, c.w / 2, c.h / 2, c.h * (0.34 + 0.02 * c.pulse), c.t * 12, '#1a1004'); for (let i = 0; i < 4; i++) sax(c, c.w / 2 + Math.cos(i * TAU / 4 + c.t) * c.h * 0.42, c.h / 2 + Math.sin(i * TAU / 4 + c.t) * c.h * 0.38, c.h * 0.1, i * TAU / 4 + c.t); c.g.restore(); }],
  ],
};

// ---- Sakura Blizzard: 桜の吹雪。鳥居の連なりを抜け、花びらが嵐のように舞う ----
const blizzard = (c, P) => { vgrad(c, ['#2a0418', '#6a1040']); for (let i = 8; i >= 0; i--) { const d = (i + 1 - frac(c.t * 1.2)) / 9, s = c.h * 0.25 / (0.15 + d); torii(c, c.w / 2, c.h * 0.55 + s * 0.48, s, '#ff3d5e', clamp01((1 - d) * 1.5)); } fallingPetals(c, PETALS, '#ffc4d6', 3, 1.5); };
const sakuraBlizzard = {
  intro: blizzard,
  looks: [
    [1, blizzard],
    [1, (c, P) => { vgrad(c, ['#1a0410', '#3a0a24']); for (let i = 0; i < 40; i++) { const a = hash1(i) * TAU + c.t * 2, r = c.h * (0.1 + 0.4 * frac(hash1(i + 1) + c.t * 0.5)); sakura(c, c.w / 2 + Math.cos(a) * r * 1.3, c.h / 2 + Math.sin(a) * r, c.h * 0.035, a, i % 3 ? '#ffb3c8' : '#ffffff', 0.85); } }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse); vgrad(c, ['#ff7aa8', '#ffe0ec']); radialLines(c, 36, '#ffffff', 0.25 + 0.35 * c.pulse, c.t, 0.1); sakura(c, c.w / 2, c.h / 2, c.h * (0.3 + 0.04 * c.pulse), c.t, '#ff4f8a', 1); slash(c, frac(c.beat), '#ffffff', (Math.floor(c.beat) % 2 ? 0.7 : -0.7)); fallingPetals(c, PETALS, '#ffffff', 4, 2); c.g.restore(); }],
  ],
};

// ---- Breakcore Collapse: ブレイクコア。画面がブロックに崩れて落ちていく ----
function collapse(c, k, col) { const g = c.g, n = 10, m = 6; for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const fall = Math.max(0, k * 2 - hash1(i * 13 + j)) ** 2 * c.h, rot = fall * 0.002 * (hash1(i + j) - 0.5); g.save(); g.translate((i + 0.5) * c.w / n, (j + 0.5) * c.h / m + fall); g.rotate(rot); g.fillStyle = (i + j) % 3 ? col : '#ffffff'; g.globalAlpha = 0.25 + 0.5 * hash1(i * 7 + j * 3 + Math.floor(c.beat * 2)); g.fillRect(-c.w / n / 2 + 1, -c.h / m / 2 + 1, c.w / n - 2, c.h / m - 2); g.restore(); } g.globalAlpha = 1; }
const crumble = (c, P) => { vgrad(c, ['#060a00', '#121e04']); collapse(c, frac(c.beat / 8), P.main); glitch(c, c.pulse * 0.4, Math.floor(c.beat * 4)); };
const breakcoreCollapse = {
  intro: crumble,
  looks: [
    [1, crumble],
    [1, (c, P) => { vgrad(c, ['#040600', '#0e1402']); for (let i = 0; i < 8; i++) { const y = c.h * hash1(i + Math.floor(c.beat * 4)); c.g.fillStyle = i % 2 ? P.main : '#ffffff'; c.g.globalAlpha = 0.6; c.g.fillRect(0, y, c.w, c.h * 0.02 + hash1(i) * c.h * 0.05); } c.g.globalAlpha = 1; text(c, 'COLLAPSE', c.w / 2 + Math.sin(c.t * 40) * 4, c.h / 2, c.h * 0.14, '#ffffff', 0.9, { font: 'Impact' }); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse * 2); vgrad(c, ['#2a3a00', '#b0ff3d']); collapse(c, frac(c.beat / 2), '#000000'); radialLines(c, 30, '#000000', 0.2 + 0.3 * c.pulse, c.t * 3, 0.3); c.g.restore(); glitch(c, 0.5 + 0.5 * c.pulse, Math.floor(c.beat * 8)); strobe(c, '#ffffff', 0.5); }],
  ],
};

// ---- Overclock Ω: CPUがオーバークロック。温度計が振り切れ、コアが赤熱する ----
function cpu(c, x, y, s, heat) { const g = c.g; g.fillStyle = '#1a1a20'; g.fillRect(x - s, y - s, s * 2, s * 2); g.strokeStyle = '#8a8a9a'; g.lineWidth = 2; for (let i = 0; i < 8; i++) for (const side of [-1, 1]) { g.beginPath(); g.moveTo(x - s + (i + 0.5) * s / 4, y + side * s); g.lineTo(x - s + (i + 0.5) * s / 4, y + side * s * 1.25); g.stroke(); g.beginPath(); g.moveTo(x + side * s, y - s + (i + 0.5) * s / 4); g.lineTo(x + side * s * 1.25, y - s + (i + 0.5) * s / 4); g.stroke(); } const gr = g.createRadialGradient(x, y, 0, x, y, s * 0.8); gr.addColorStop(0, `rgba(255,${255 - heat * 200},${120 - heat * 120},1)`); gr.addColorStop(1, `rgba(255,59,92,${0.3 + 0.5 * heat})`); g.fillStyle = gr; g.fillRect(x - s * 0.7, y - s * 0.7, s * 1.4, s * 1.4); text(c, 'Ω', x, y, s * 0.8, '#ffffff', 0.9); }
const overclock = (c, P) => { vgrad(c, ['#0a0204', '#200408']); hexGrid(c, P.main, 0.1); const heat = clamp01(c.p * 1.2); cpu(c, c.w / 2, c.h / 2, c.h * 0.2, heat); text(c, `${Math.floor(40 + heat * 60 + Math.sin(c.t * 9) * 2)}°C`, c.w / 2, c.h * 0.88, c.h * 0.06, heat > 0.8 ? '#ff3b5c' : '#ffffff', 0.9); };
const overclockOmega = {
  intro: overclock,
  looks: [
    [1, overclock],
    [1, (c, P) => { vgrad(c, ['#050102', '#140206']); tunnel(c, 4, 2.2, P.main, { rot: Math.PI / 4, lw: 3, n: 12 }); text(c, `${(3.2 + c.beat * 0.01).toFixed(2)} GHz`, c.w / 2, c.h * 0.5, c.h * 0.1, '#ffffff', 0.8, { glow: 10 }); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse * 2); vgrad(c, ['#5a0010', '#ff3b5c']); radialLines(c, 40, '#ffffff', 0.25 + 0.4 * c.pulse, c.t * 3, 0.2); cpu(c, c.w / 2, c.h / 2, c.h * (0.22 + 0.02 * c.pulse), 1); flames(c, c.h, c.h * 0.3, 0.8); c.g.restore(); strobe(c, '#ffffff', 1); glitch(c, c.pulse * 0.6, Math.floor(c.beat * 4)); }],
  ],
};

// ---- Ultra Spiral: うずまきの世界。何重ものらせんが回り、吸い込まれる ----
function spiral(c, arms, col, rot, alpha) { const g = c.g; g.strokeStyle = col; g.globalAlpha = alpha; g.lineWidth = c.h * 0.012; for (let a = 0; a < arms; a++) { g.beginPath(); for (let i = 0; i <= 120; i++) { const t = i / 120, r = t * c.h * 0.7, ang = rot + a * TAU / arms + t * 10; const x = c.w / 2 + Math.cos(ang) * r, y = c.h / 2 + Math.sin(ang) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); } g.globalAlpha = 1; }
const spiralWorld = (c, P) => { vgrad(c, ['#0a0218', '#2a0840']); spiral(c, 3, P.main, -c.t * 1.2, 0.8); spiral(c, 3, '#ffffff', -c.t * 1.2 + 0.3, 0.3); };
const ultraSpiral = {
  intro: spiralWorld,
  looks: [
    [1, spiralWorld],
    [1, (c, P) => { vgrad(c, ['#05010c', '#1a0430']); spiral(c, 6, P.main, c.t * 2, 0.6); dotSphere(c, c.w / 2, c.h / 2, c.h * 0.12, '#ffffff', c.t, 0.9); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse); vgrad(c, ['#4a0a6a', '#e05eff']); spiral(c, 8, '#ffffff', -c.t * 4, 0.7); spiral(c, 4, '#2a0440', c.t * 3, 0.6); c.g.restore(); strobe(c, '#ffffff', 2); }],
  ],
};

// ---- Quantum Leap: 量子の跳躍。粒子がワープして別の場所に現れ、波と粒が入れかわる ----
function quantumDots(c, col, n = 60) { const g = c.g, step = Math.floor(c.beat); for (let i = 0; i < n; i++) { const k = frac(c.beat), a = hash1(i + step * 31), b = hash1(i + (step + 1) * 31); const x = (a + (b - a) * ease(k * 3 - 1)) * c.w, y = (hash1(i + step * 17 + 5) + (hash1(i + (step + 1) * 17 + 5) - hash1(i + step * 17 + 5)) * ease(k * 3 - 1)) * c.h; g.fillStyle = col; g.globalAlpha = 0.6 + 0.4 * Math.abs(Math.cos(k * Math.PI)); g.fillRect(x - 2, y - 2, 4, 4); } g.globalAlpha = 1; }
function waveFn(c, col, amp) { const g = c.g; g.strokeStyle = col; g.lineWidth = c.h * 0.008; for (let k = 0; k < 3; k++) { g.beginPath(); for (let x = 0; x <= c.w; x += 4) { const y = c.h / 2 + Math.sin(x * 0.03 * (k + 1) - c.t * 4) * Math.exp(-((x - c.w / 2) ** 2) / (c.w * c.w * 0.05)) * c.h * 0.25 * amp; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.globalAlpha = 0.6 - k * 0.15; g.stroke(); } g.globalAlpha = 1; }
const quantum = (c, P) => { vgrad(c, ['#001a14', '#003a2a']); hexGrid(c, P.main, 0.08); quantumDots(c, P.main); };
const quantumLeap = {
  intro: quantum,
  looks: [
    [1, quantum],
    [1, (c, P) => { vgrad(c, ['#000c0a', '#001e18']); waveFn(c, P.main, 0.6 + 0.4 * c.pulse); ringSegments(c, c.h * 0.4, 4, '#ffffff', c.t, 0.4, 2); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse); vgrad(c, ['#004a3a', '#5effd0']); radialLines(c, 30, '#ffffff', 0.2 + 0.35 * c.pulse, c.t, 0.2); quantumDots(c, '#ffffff', 120); waveFn(c, '#003a2a', 1); c.g.restore(); }],
  ],
};

// ---- Lightspeed Flash: 光速のフラッシュ。白い閃光が連続し、光の線が画面を貫く ----
function lightLines(c, n, col, speed) { const g = c.g; g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < n; i++) { const y = c.h * hash1(i), x = frac(hash1(i + 3) + c.t * speed * (0.5 + hash1(i + 5))) * c.w * 2 - c.w * 0.5, L = c.w * (0.2 + hash1(i + 7) * 0.4); const gr = g.createLinearGradient(x - L, 0, x, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, col); g.strokeStyle = gr; g.lineWidth = 1 + hash1(i + 9) * 3; g.beginPath(); g.moveTo(x - L, y); g.lineTo(x, y); g.stroke(); } g.restore(); }
const flash = (c, P) => { vgrad(c, ['#00080c', '#002030']); lightLines(c, 30, P.main, 1.5); strobe(c, '#ffffff', 4); };
const lightspeedFlash = {
  intro: flash,
  looks: [
    [1, flash],
    [1, (c, P) => { vgrad(c, ['#000408', '#001018']); starfield(c, STARS, 3, '#fff', 4); tunnel(c, 16, 2.4, P.main, { lw: 1.5, n: 20, alpha: 0.5 }); }],
    [2, (c, P) => { vgrad(c, ['#0a4a5a', '#ffffff']); lightLines(c, 60, '#ffffff', 3); radialLines(c, 60, P.main, 0.3 + 0.4 * c.pulse, 0, 0.05); strobe(c, '#ffffff', 0.5); }],
  ],
};

// ---- Event Horizon: ブラックホールの事象の地平線。光の輪(降着円盤)と、ゆがむ星 ----
function blackHole(c, R, col, spin) { const g = c.g, cx = c.w / 2, cy = c.h / 2; g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 30; k++) { const r = R * (1.3 + k * 0.05), a = spin + k * 0.3; g.strokeStyle = col; g.globalAlpha = 0.25 * (1 - k / 30); g.lineWidth = R * 0.05; g.beginPath(); g.ellipse(cx, cy, r * 1.8, r * 0.35, -0.15, a, a + 4); g.stroke(); } g.restore(); g.fillStyle = '#000'; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill(); g.strokeStyle = '#fff4e0'; g.globalAlpha = 0.8; g.lineWidth = R * 0.04; g.beginPath(); g.arc(cx, cy, R * 1.05, 0, TAU); g.stroke(); g.globalAlpha = 1; }
const horizon = (c, P) => { vgrad(c, ['#02000a', '#0a0220']); twinkle(c, SKY, '#fff', 0.3); blackHole(c, c.h * 0.14, P.main, c.t * 0.8); };
const eventHorizon = {
  intro: horizon,
  looks: [
    [1, horizon],
    [1, (c, P) => { vgrad(c, ['#010006', '#08001a']); starfield(c, STARS, -0.4, '#fff', 2); blackHole(c, c.h * (0.18 + 0.01 * c.pulse), '#ffb04a', c.t * 1.5); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse * 1.5); vgrad(c, ['#2a0050', '#b03dff']); radialLines(c, 40, '#000000', 0.3 + 0.35 * c.pulse, -c.t * 2, 0.3); blackHole(c, c.h * (0.22 + 0.03 * c.pulse), '#ffffff', c.t * 3); c.g.restore(); glitch(c, c.pulse * 0.6, Math.floor(c.beat * 4)); }],
  ],
};

// ---- Omega Requiem: 終焉の鎮魂歌。金色の光輪と天使の羽、最後の審判の光 ----
function wings(c, x, y, s, flap) { const g = c.g; for (const side of [-1, 1]) { for (let i = 0; i < 7; i++) { g.save(); g.translate(x, y); g.scale(side, 1); g.rotate(-0.3 - i * 0.18 - flap * 0.2); g.fillStyle = `rgba(255,248,220,${0.9 - i * 0.08})`; g.beginPath(); g.ellipse(s * (0.4 + i * 0.05), 0, s * (0.5 - i * 0.03), s * 0.07, 0, 0, TAU); g.fill(); g.restore(); } } }
function halo(c, x, y, R, col) { const g = c.g; g.save(); g.shadowColor = col; g.shadowBlur = R * 0.6; g.strokeStyle = col; g.lineWidth = R * 0.1; g.beginPath(); g.ellipse(x, y, R, R * 0.3, 0, 0, TAU); g.stroke(); g.restore(); }
const judgement = (c, P) => { vgrad(c, ['#0a0804', '#3a2a10']); for (let i = 0; i < 6; i++) { c.g.fillStyle = 'rgba(255,240,180,0.15)'; c.g.fillRect(c.w * (0.1 + i * 0.16), 0, c.w * 0.04, c.h); } wings(c, c.w / 2, c.h * 0.55, c.h * 0.35, Math.sin(c.t * 1.5)); halo(c, c.w / 2, c.h * 0.3, c.h * 0.1, P.main); };
const omegaRequiem = {
  intro: judgement,
  looks: [
    [1, judgement],
    [1, (c, P) => { vgrad(c, ['#05030a', '#1a1428']); milkyWay(c, 0.5); ringSegments(c, c.h * 0.36, 12, P.main, c.t * 0.5, 0.7, 3); text(c, 'Ω', c.w / 2, c.h / 2, c.h * 0.3, P.main, 0.8, { font: 'serif', glow: 16 }); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse); vgrad(c, ['#8a6a1a', '#fff6d0']); radialLines(c, 48, '#ffffff', 0.3 + 0.4 * c.pulse, c.t * 0.4, 0.05); wings(c, c.w / 2, c.h / 2, c.h * (0.45 + 0.03 * c.pulse), Math.sin(c.beat * Math.PI)); halo(c, c.w / 2, c.h * 0.22, c.h * 0.12, '#ffffff'); c.g.restore(); strobe(c, '#ffffff', 2); }],
  ],
};

// ---- Neutron Overdrive: 中性子星。高速で回転するパルサーのビームが画面をなぎ払う ----
function pulsar(c, R, col, spin) { const g = c.g, cx = c.w / 2, cy = c.h / 2; g.save(); g.globalCompositeOperation = 'lighter'; for (const s of [0, Math.PI]) { const a = spin + s; const gr = g.createLinearGradient(cx, cy, cx + Math.cos(a) * c.w, cy + Math.sin(a) * c.w); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a - 0.08) * c.w, cy + Math.sin(a - 0.08) * c.w); g.lineTo(cx + Math.cos(a + 0.08) * c.w, cy + Math.sin(a + 0.08) * c.w); g.fill(); } g.restore(); dotSphere(c, cx, cy, R, '#ffffff', spin * 0.3, 1); }
const neutron = (c, P) => { vgrad(c, ['#08000a', '#200410']); twinkle(c, SKY, '#fff', 0.3); pulsar(c, c.h * 0.1, 'rgba(255,45,85,0.7)', c.t * 4); };
const neutronOverdrive = {
  intro: neutron,
  looks: [
    [1, neutron],
    [1, (c, P) => { vgrad(c, ['#05000a', '#14020a']); starfield(c, STARS, 2, '#fff', 3); ringSegments(c, c.h * 0.3, 8, P.main, c.t * 3, 0.7, 4); ringSegments(c, c.h * 0.4, 16, '#ffffff', -c.t * 2, 0.4, 2); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse * 2); vgrad(c, ['#5a0014', '#ff2d55']); pulsar(c, c.h * (0.14 + 0.03 * c.pulse), 'rgba(255,255,255,0.8)', c.t * 10); radialLines(c, 40, '#000000', 0.2 + 0.3 * c.pulse, c.t * 5, 0.3); c.g.restore(); strobe(c, '#ffffff', 1); glitch(c, c.pulse * 0.5, Math.floor(c.beat * 4)); }],
  ],
};

// ---- Infinity Breaker: 無限を突き破る。∞の光のループが加速し、最後は画面ごと砕ける ----
function infinity(c, s, col, t, alpha) { const g = c.g; g.strokeStyle = col; g.globalAlpha = alpha; g.lineWidth = s * 0.08; g.beginPath(); for (let i = 0; i <= 100; i++) { const u = i / 100 * TAU, d = 1 + Math.sin(u) ** 2; const x = c.w / 2 + s * Math.cos(u) / d * 1.6, y = c.h / 2 + s * Math.sin(u) * Math.cos(u) / d * 1.6; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); const u = t, d = 1 + Math.sin(u) ** 2; g.fillStyle = '#ffffff'; g.globalAlpha = 1; g.beginPath(); g.arc(c.w / 2 + s * Math.cos(u) / d * 1.6, c.h / 2 + s * Math.sin(u) * Math.cos(u) / d * 1.6, s * 0.08, 0, TAU); g.fill(); }
function cracks(c, k, col) { const g = c.g; g.strokeStyle = col; g.lineWidth = 2; for (let i = 0; i < 10; i++) { let x = c.w / 2, y = c.h / 2, a = i * TAU / 10 + hash1(i); g.globalAlpha = k; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 6; s++) { x += Math.cos(a) * c.h * 0.12 * k; y += Math.sin(a) * c.h * 0.12 * k; a += (hash1(i * 7 + s) - 0.5) * 0.8; g.lineTo(x, y); } g.stroke(); } g.globalAlpha = 1; }
const loop = (c, P) => { vgrad(c, ['#0a0004', '#2a000a']); infinity(c, c.h * 0.22, P.main, c.t * 3, 0.9); infinity(c, c.h * 0.3, '#ffffff', -c.t * 2, 0.2); };
const infinityBreaker = {
  intro: loop,
  looks: [
    [1, loop],
    [1, (c, P) => { vgrad(c, ['#050002', '#140006']); tunnel(c, 8, 3, P.main, { rot: c.t * 2, lw: 2.5, n: 14 }); infinity(c, c.h * 0.15, '#ffffff', c.t * 6, 0.8); }],
    [2, (c, P) => { c.g.save(); shake(c, c.pulse * 2.5); vgrad(c, ['#6a0018', '#ff0040']); radialLines(c, 48, '#ffffff', 0.3 + 0.4 * c.pulse, c.t * 6, 0.2); infinity(c, c.h * (0.28 + 0.03 * c.pulse), '#ffffff', c.t * 10, 1); cracks(c, frac(c.beat / 2), '#ffffff'); c.g.restore(); strobe(c, '#ffffff', 0.5); glitch(c, 0.4 + 0.6 * c.pulse, Math.floor(c.beat * 8)); }],
  ],
};

export default {
  'thunder-requiem': thunderRequiem,
  'jackhammer-jazz': jackhammerJazz,
  'sakura-blizzard': sakuraBlizzard,
  'breakcore-collapse': breakcoreCollapse,
  'overclock-omega': overclockOmega,
  'ultra-spiral': ultraSpiral,
  'quantum-leap': quantumLeap,
  'lightspeed-flash': lightspeedFlash,
  'event-horizon': eventHorizon,
  'omega-requiem': omegaRequiem,
  'neutron-overdrive': neutronOverdrive,
  'infinity-breaker': infinityBreaker,
};

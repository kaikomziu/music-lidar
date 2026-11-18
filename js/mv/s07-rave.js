// 特製MV その7: レイブ・アイドル(リキッドファンク・トランス・フューチャーベース・アウトラン・リディム・アイドルポップ・ダブステップ・スカパンク・ユーロビート・サイトランス)
import {
  TAU, frac, clamp01, ease, table, vgrad, text, twinkle, SKY, STARS, starfield, hills, fluffyClouds, waves, radialLines,
  retroSun, sparkle, bokeh, palm, moon, stageBeams, eqBars, crowd, beatRipples, vinyl, skyline, BLDS, hash1, ringSegments,
  grid, tunnel, pointTerrain, dotSphere, glitch, hexGrid, heart, candySwirl, risingBubbles, star5, confetti, scanlines,
  lightning, hazard, wireCube, aurora, cloudBand, sparks, hsl,
} from '../mv.js';

const bounce = (c, k = 1, ph = 0) => Math.abs(Math.sin((c.beat + ph) * Math.PI)) * c.h * 0.03 * k;

// ---- Liquid Sky: 液体のような空。水の層がうねり、しずくが光る ----
function liquidLayers(c, cols, speed) {
  const g = c.g;
  cols.forEach((col, k) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, c.h); for (let x = 0; x <= c.w; x += 8) g.lineTo(x, c.h * (0.25 + k * 0.17) + Math.sin(x * 0.012 + c.t * speed * (1 + k * 0.3) + k) * c.h * 0.05 + Math.sin(x * 0.03 - c.t * speed) * c.h * 0.015); g.lineTo(c.w, c.h); g.fill(); });
}
function drops(c, col, n = 20) {
  const g = c.g; g.fillStyle = col;
  for (let i = 0; i < n; i++) { const y = frac(hash1(i) + c.t * (0.1 + hash1(i + 1) * 0.15)) * c.h, x = hash1(i + 2) * c.w, s = c.h * (0.008 + hash1(i + 3) * 0.01); g.beginPath(); g.moveTo(x, y - s * 2); g.quadraticCurveTo(x + s, y, x, y + s); g.quadraticCurveTo(x - s, y, x, y - s * 2); g.fill(); }
}
const liquid = (c, P) => { vgrad(c, ['#02101a', '#0a2a3a']); liquidLayers(c, ['rgba(111,240,255,0.25)', 'rgba(60,180,255,0.3)', 'rgba(20,100,200,0.4)', 'rgba(5,40,90,0.6)'], 0.8); drops(c, '#bff8ff'); };
const liquidSky = {
  intro: liquid,
  looks: [
    [1, liquid],
    [1, (c, P) => { vgrad(c, ['#06203a', '#1a5a8a']); beatRipples(c, 6, (i) => [0.2 + hash1(i) * 0.6, 0.3 + hash1(i + 9) * 0.5], '#bff8ff', 0.3, 0.5); risingBubbles(c, 1, 0.5, 0.5); }],
    [2, (c, P) => { vgrad(c, ['#0a4a7a', '#6ff0ff']); radialLines(c, 22, '#ffffff', 0.2 + 0.3 * c.pulse, c.t * 0.3, 0.1); liquidLayers(c, ['rgba(255,255,255,0.3)', 'rgba(111,240,255,0.35)', 'rgba(20,120,220,0.45)'], 1.8); drops(c, '#ffffff', 40); }],
  ],
};

// ---- Stellar Gate: 星の門。巨大なリングが開き、光速で抜けていく ----
function gate(c, R, open, col) {
  const g = c.g, cx = c.w / 2, cy = c.h / 2;
  g.strokeStyle = col; g.lineWidth = R * 0.08; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
  g.lineWidth = 2; for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + c.t * 0.2; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 1.05, cy + Math.sin(a) * R * 1.05); g.lineTo(cx + Math.cos(a) * R * 1.2, cy + Math.sin(a) * R * 1.2); g.stroke(); }
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.95); gr.addColorStop(0, `rgba(255,255,255,${0.8 * open})`); gr.addColorStop(1, `rgba(122,139,255,${0.3 * open})`);
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R * 0.95, 0, TAU); g.fill();
}
const stargate = (c, P) => { vgrad(c, ['#02020c', '#0a0c2a']); twinkle(c, SKY, '#fff', 0.4); gate(c, c.h * 0.32, 0.3 + 0.3 * ease(c.p), P.main); };
const stellarGate = {
  intro: stargate,
  looks: [
    [1, stargate],
    [1, (c, P) => { vgrad(c, ['#03031a', '#141a50']); starfield(c, STARS, 0.4, '#fff'); ringSegments(c, c.h * 0.35, 8, P.main, c.t * 0.4, 0.6); ringSegments(c, c.h * 0.25, 5, '#ffffff', -c.t * 0.6, 0.5, 2); }],
    [2, (c, P) => { vgrad(c, ['#0a0a40', '#2a2a8a']); tunnel(c, 24, 1.4, P.main, { lw: 2, n: 16 }); starfield(c, STARS, 1.4, '#fff', 3); gate(c, c.h * (0.2 + 0.03 * c.pulse), 0.8 + 0.2 * c.pulse, '#ffffff'); }],
    [0, (c, P) => { vgrad(c, ['#010108', '#05061a']); twinkle(c, SKY, '#fff'); dotSphere(c, c.w * 0.7, c.h * 0.4, c.h * 0.2, P.main, c.t * 0.1, 0.6); }],
  ],
};

// ---- Sky Prism: パステルの空にプリズムの光。三角形が分光して虹色に ----
function prism(c, x, y, s, rot, a) {
  const g = c.g; g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = `rgba(255,255,255,${0.5 * a})`; g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.87, s * 0.5); g.lineTo(-s * 0.87, s * 0.5); g.closePath(); g.fill(); g.stroke();
  g.globalCompositeOperation = 'lighter';
  ['#ff5a8a', '#ffa53d', '#ffe14f', '#6dff8a', '#4fa3ff', '#c38bff'].forEach((col, i) => { g.fillStyle = col; g.globalAlpha = 0.35 * a; g.beginPath(); g.moveTo(s * 0.4, 0); g.lineTo(s * 4, (i - 2.5) * s * 0.35 - s * 0.2); g.lineTo(s * 4, (i - 2.5) * s * 0.35 + s * 0.15); g.fill(); });
  g.restore();
}
const pastelSky = (c, P) => { vgrad(c, ['#ffc4f0', '#c8d8ff', '#d8f8ff']); fluffyClouds(c, c.h * 0.75, 0.01); prism(c, c.w * 0.3, c.h * 0.45, c.h * 0.12, Math.sin(c.t * 0.3) * 0.2, 1); };
const skyPrism = {
  intro: pastelSky,
  looks: [
    [1, pastelSky],
    [1, (c, P) => { vgrad(c, ['#d8b0ff', '#ffd0f0']); for (let i = 0; i < 5; i++) prism(c, c.w * (0.1 + i * 0.2), c.h * (0.3 + 0.3 * (i % 2)), c.h * 0.06, c.t * 0.5 + i, 0.8); fluffyClouds(c, c.h * 0.85, 0.02); }],
    [2, (c, P) => { candySwirl(c, ['#ff9df0', '#c8b0ff', '#b0e8ff', '#fff0b0'], c.t * 0.6); prism(c, c.w * 0.35, c.h / 2, c.h * (0.15 + 0.03 * c.pulse), c.t * 0.4, 1); for (let i = 0; i < 8; i++) sparkle(c, c.w * (0.1 + i * 0.12), c.h * (0.2 + 0.6 * hash1(i)), c.h * 0.03 * (0.6 + c.pulse), '#fff', 0.9); }],
  ],
};

// ---- Synth Racer: アウトランの夜のサーキット。グリッドの道と流れる街の光 ----
function racer(c, x, base, s) {
  const g = c.g; g.fillStyle = '#0a0418'; g.beginPath(); g.moveTo(x - s, base); g.lineTo(x - s * 0.9, base - s * 0.25); g.lineTo(x - s * 0.4, base - s * 0.45); g.lineTo(x + s * 0.4, base - s * 0.45); g.lineTo(x + s * 0.9, base - s * 0.25); g.lineTo(x + s, base); g.fill();
  g.fillStyle = '#ff3dd0'; g.fillRect(x - s * 0.95, base - s * 0.2, s * 0.25, s * 0.08); g.fillRect(x + s * 0.7, base - s * 0.2, s * 0.25, s * 0.08);
  g.fillStyle = '#3dd6ff'; g.fillRect(x - s * 0.35, base - s * 0.42, s * 0.7, s * 0.1);
}
const outrun = (c, P) => { vgrad(c, ['#0a0220', '#3a0a50', '#ff3dd0']); retroSun(c, c.w / 2, c.h * 0.52, c.h * 0.22, '#ffd84a', P.main, '#3a0a50'); c.g.fillStyle = '#0a0214'; c.g.fillRect(0, c.h * 0.6, c.w, c.h); grid(c, 0.6, P.main, 2.4); racer(c, c.w / 2, c.h * 0.92, c.h * 0.16); };
const synthRacer = {
  intro: outrun,
  looks: [
    [1, outrun],
    [1, (c, P) => { vgrad(c, ['#05010f', '#1a0430']); grid(c, 0.5, '#3dd6ff', 3); skyline(c, BLDS, c.h * 0.5, '#0a0218', P.main, 0.3); racer(c, c.w * (0.4 + 0.2 * Math.sin(c.t * 0.8)), c.h * 0.9, c.h * 0.14); }],
    [2, (c, P) => { vgrad(c, ['#2a0440', '#ff3dd0']); radialLines(c, 30, '#ffffff', 0.25 + 0.35 * c.pulse, 0, 0.2); tunnel(c, 4, 2, '#3dd6ff', { rot: Math.PI / 4, lw: 3, n: 12 }); racer(c, c.w / 2, c.h * 0.9, c.h * (0.17 + 0.01 * c.pulse)); scanlines(c, 0.12); }],
  ],
};

// ---- Riddim Riot: ゴツい低音のリディム。黄緑の警告ストライプとスピーカーの壁 ----
function wobble(c, col, amp) {
  const g = c.g; g.strokeStyle = col; g.lineWidth = c.h * 0.02;
  g.beginPath(); for (let x = 0; x <= c.w; x += 4) { const y = c.h / 2 + Math.sin(x * 0.04 * (1 + Math.floor(c.beat) % 3) + c.t * 10) * c.h * 0.12 * amp * Math.sin(x / c.w * Math.PI); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
}
const riotZone = (c, P) => { vgrad(c, ['#060a02', '#141e06']); hazard(c, c.h * 0.06, c.h * 0.06, P.main, 0.5); hazard(c, c.h * 0.88, c.h * 0.06, P.main, -0.5); wobble(c, P.main, 0.6 + 0.4 * c.pulse); };
const riddimRiot = {
  intro: riotZone,
  looks: [
    [1, riotZone],
    [1, (c, P) => { vgrad(c, ['#040802', '#101a04']); hexGrid(c, P.main, 0.1 + 0.15 * c.pulse); for (let i = 0; i < 6; i++) { const x = c.w * (i + 0.5) / 6, k = 1 + 0.12 * c.pulse; c.g.fillStyle = '#1a1e14'; c.g.fillRect(x - c.h * 0.1, c.h * 0.3, c.h * 0.2, c.h * 0.45); c.g.fillStyle = '#05060a'; c.g.beginPath(); c.g.arc(x, c.h * 0.6, c.h * 0.07 * k, 0, TAU); c.g.fill(); c.g.beginPath(); c.g.arc(x, c.h * 0.4, c.h * 0.04 * k, 0, TAU); c.g.fill(); } }],
    [2, (c, P) => { vgrad(c, ['#1a2a04', '#3a5a08']); stageBeams(c, 6, [P.main, '#ffffff'], 0.3 + 0.35 * c.pulse, 1.8); wobble(c, '#ffffff', 1 + c.pulse); glitch(c, c.pulse * 0.6, Math.floor(c.beat * 2)); crowd(c, '#040802'); }],
  ],
};

// ---- Glitter Idol: アイドルのステージ。キラキラとハート、ペンライトのウェーブ ----
function idolStage(c, P, big) {
  const g = c.g; g.fillStyle = '#ffffff'; g.globalAlpha = 0.15; g.beginPath(); g.ellipse(c.w / 2, c.h * 0.8, c.w * 0.4, c.h * 0.08, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
  for (let i = 0; i < 3; i++) { const x = c.w * (0.35 + i * 0.15), y = c.h * 0.78 - bounce(c, big ? 2 : 1, i * 0.3); g.fillStyle = [P.main, '#7ad8ff', '#ffe14f'][i]; g.beginPath(); g.moveTo(x, y - c.h * 0.2); g.lineTo(x + c.h * 0.07, y); g.lineTo(x - c.h * 0.07, y); g.fill(); g.fillStyle = '#ffe0d0'; g.beginPath(); g.arc(x, y - c.h * 0.23, c.h * 0.035, 0, TAU); g.fill(); }
}
const idolLive = (c, P) => { vgrad(c, ['#2a0a3a', '#ff9de6']); stageBeams(c, 5, [P.main, '#ffffff'], 0.3, 0.8); idolStage(c, P, false); for (let i = 0; i < 40; i++) { c.g.fillStyle = [P.main, '#7ad8ff', '#ffe14f'][i % 3]; const x = (i + 0.5) / 40 * c.w, a = Math.sin(c.beat * Math.PI + i * 0.3) * 0.5; c.g.fillRect(x + Math.sin(a) * c.h * 0.04, c.h * 0.9 - Math.cos(a) * c.h * 0.06, 3, c.h * 0.05); } };
const glitterIdol = {
  intro: idolLive,
  looks: [
    [1, idolLive],
    [1, (c, P) => { candySwirl(c, ['#ffc4f0', '#ffe6f8', '#c8e8ff', '#fff4c0'], c.t * 0.4); for (let i = 0; i < 9; i++) heart(c, c.w * (0.06 + i * 0.11), c.h * (0.5 + 0.3 * Math.sin(c.t * 1.5 + i)) - bounce(c, 1, i / 9), c.h * 0.05, ['#ff6fae', '#ff9fd0', '#ffffff'][i % 3], 0.9); }],
    [2, (c, P) => { vgrad(c, ['#ff5ec4', '#ffe6f8']); radialLines(c, 28, '#ffffff', 0.3 + 0.35 * c.pulse, c.t * 0.5, 0.05); for (let i = 0; i < 12; i++) star5(c, c.w * hash1(i), c.h * hash1(i + 4), c.h * 0.03 * (0.5 + c.pulse), '#ffffff', 0.9, 0.8, c.t + i); heart(c, c.w / 2, c.h / 2, c.h * (0.16 + 0.04 * c.pulse), '#ff3d8a'); confetti(c); }],
  ],
};

// ---- Wub Fracture: ダブステップ。画面が割れて破片が飛び、紫の稲妻 ----
function shards(c, col, k) {
  const g = c.g;
  for (let i = 0; i < 14; i++) { const a = hash1(i) * TAU, d = k * c.h * (0.2 + hash1(i + 3) * 0.5), x = c.w / 2 + Math.cos(a) * d, y = c.h / 2 + Math.sin(a) * d, s = c.h * (0.04 + hash1(i + 5) * 0.06); g.save(); g.translate(x, y); g.rotate(a + k * 3); g.fillStyle = col; g.globalAlpha = 0.8 * (1 - k * 0.5); g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.7, s * 0.6); g.lineTo(-s * 0.5, s * 0.3); g.fill(); g.restore(); }
  g.globalAlpha = 1;
}
const fracture = (c, P) => { vgrad(c, ['#0a0418', '#200a40']); shards(c, P.main, frac(c.beat / 2)); lightning(c, Math.floor(c.beat), '#e0c8ff', c.pulse > 0.8 ? c.pulse * 0.8 : 0); };
const wubFracture = {
  intro: fracture,
  looks: [
    [1, fracture],
    [1, (c, P) => { vgrad(c, ['#05020c', '#140828']); tunnel(c, 3, 0.8, P.main, { rot: c.t * 0.5, lw: 3 }); wobbleRing(c, P.main); }],
    [2, (c, P) => { vgrad(c, ['#2a0a50', '#5a1a90']); radialLines(c, 30, '#ffffff', 0.2 + 0.4 * c.pulse, c.t, 0.3); shards(c, '#ffffff', frac(c.beat)); glitch(c, 0.3 + 0.5 * c.pulse, Math.floor(c.beat * 4)); for (let i = 0; i < 2; i++) lightning(c, Math.floor(c.beat) * 2 + i, '#ffffff', c.pulse > 0.6 ? c.pulse : 0); }],
  ],
};
function wobbleRing(c, col) {
  const g = c.g; g.strokeStyle = col; g.lineWidth = c.h * 0.012; g.beginPath();
  for (let i = 0; i <= 80; i++) { const a = i / 80 * TAU, r = c.h * (0.25 + 0.05 * Math.sin(a * (3 + Math.floor(c.beat) % 4) + c.t * 8) * (0.5 + c.pulse)); const x = c.w / 2 + Math.cos(a) * r, y = c.h / 2 + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke();
}

// ---- Offbeat Skater: スケートパーク。チェッカーとスケボー、裏拍でジャンプ ----
function skater(c, x, base, s, air) {
  const g = c.g, y = base - air;
  g.fillStyle = '#ff5050'; g.fillRect(x - s * 0.5, y - s * 0.05, s, s * 0.06); g.fillStyle = '#222'; g.beginPath(); g.arc(x - s * 0.35, y + s * 0.05, s * 0.06, 0, TAU); g.arc(x + s * 0.35, y + s * 0.05, s * 0.06, 0, TAU); g.fill();
  g.fillStyle = '#1a1a2a'; g.fillRect(x - s * 0.2, y - s * 0.5, s * 0.1, s * 0.45); g.fillRect(x + s * 0.1, y - s * 0.5, s * 0.1, s * 0.45);
  g.fillStyle = '#5ef2a0'; g.fillRect(x - s * 0.22, y - s * 0.95, s * 0.44, s * 0.48);
  g.fillStyle = '#ffd8b8'; g.beginPath(); g.arc(x, y - s * 1.08, s * 0.13, 0, TAU); g.fill();
}
function checkers(c, y, hh) { const g = c.g, s = hh / 2; for (let x = 0; x < c.w; x += s) for (let k = 0; k < 2; k++) { g.fillStyle = (Math.floor(x / s) + k) % 2 ? '#111' : '#fff'; g.fillRect(x - frac(c.t * 0.5) * s * 2, y + k * s, s, s); } }
const offAir = (c) => Math.max(0, Math.sin((c.beat - 0.5) * Math.PI)) * c.h * 0.15; // 裏拍で跳ぶ
const skatepark = (c, P) => { vgrad(c, ['#3dd6ff', '#c8f6ff']); fluffyClouds(c, c.h * 0.2, 0.015); c.g.fillStyle = '#9aa0a8'; c.g.fillRect(0, c.h * 0.8, c.w, c.h); checkers(c, c.h * 0.8, c.h * 0.06); skater(c, c.w / 2, c.h * 0.8, c.h * 0.24, offAir(c)); };
const offbeatSkater = {
  intro: skatepark,
  looks: [
    [1, skatepark],
    [1, (c, P) => { vgrad(c, ['#0a2a1a', '#1a5a3a']); checkers(c, c.h * 0.05, c.h * 0.08); checkers(c, c.h * 0.87, c.h * 0.08); text(c, 'SKA!', c.w / 2, c.h / 2 - offAir(c) * 0.5, c.h * 0.22, P.main, 1, { font: 'Impact', glow: 8 }); }],
    [2, (c, P) => { vgrad(c, ['#5ef2a0', '#d0ffe8']); radialLines(c, 24, '#ffffff', 0.25 + 0.35 * c.pulse, c.t * 0.5, 0.05); for (let i = 0; i < 3; i++) skater(c, c.w * (0.25 + i * 0.25), c.h * 0.85, c.h * 0.2, Math.max(0, Math.sin((c.beat - 0.5 + i * 0.15) * Math.PI)) * c.h * 0.2); checkers(c, c.h * 0.88, c.h * 0.06); }],
  ],
};

// ---- Night Drift 95: 峠を攻めるユーロビート。ガードレールと流れる光、ドリフトの煙 ----
function guardrail(c, speed) {
  const g = c.g, hy = c.h * 0.45;
  g.strokeStyle = '#c8c8d0'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, c.h * 0.9); g.quadraticCurveTo(c.w * 0.4, c.h * 0.55, c.w * 0.5, hy); g.stroke();
  for (let i = 0; i < 10; i++) { const z = frac(i / 10 + c.t * speed), x = c.w * 0.5 - c.w * 0.5 * z * z, y = hy + (c.h * 0.45) * z * z; g.fillStyle = '#ffd84a'; g.globalAlpha = z; g.fillRect(x - 2, y - c.h * 0.03 * z, 4, c.h * 0.03 * z); }
  g.globalAlpha = 1;
}
function smoke(c, x, y) { const g = c.g; for (let i = 0; i < 8; i++) { const k = frac(c.t * 0.8 + i / 8); g.fillStyle = `rgba(220,220,230,${0.25 * (1 - k)})`; g.beginPath(); g.arc(x - k * c.w * 0.3, y - k * c.h * 0.05, c.h * (0.03 + k * 0.1), 0, TAU); g.fill(); } }
const touge = (c, P) => { vgrad(c, ['#05060f', '#141a30']); twinkle(c, SKY, '#fff'); hills(c, c.h * 0.5, '#0a0c14', c.h * 0.08, 0.008, 0); guardrail(c, 1.2); smoke(c, c.w * 0.6, c.h * 0.82); racerCar(c, c.w * 0.62, c.h * 0.85, c.h * 0.12); };
function racerCar(c, x, base, s) { const g = c.g; g.save(); g.translate(x, base); g.rotate(-0.15); g.fillStyle = '#ffffff'; g.fillRect(-s, -s * 0.35, s * 2, s * 0.3); g.fillStyle = '#ffe14f'; g.fillRect(-s * 0.5, -s * 0.6, s, s * 0.28); g.fillStyle = '#111'; g.beginPath(); g.arc(-s * 0.6, -s * 0.05, s * 0.15, 0, TAU); g.arc(s * 0.6, -s * 0.05, s * 0.15, 0, TAU); g.fill(); g.fillStyle = '#ff3030'; g.fillRect(-s, -s * 0.3, s * 0.12, s * 0.08); g.restore(); }
const nightDrift = {
  intro: touge,
  looks: [
    [1, touge],
    [1, (c, P) => { vgrad(c, ['#1a1400', '#3a2a00']); radialLines(c, 30, P.main, 0.2 + 0.25 * c.pulse, 0, 0.3); text(c, '95', c.w / 2, c.h / 2, c.h * 0.4, P.main, 0.2, { font: 'Impact' }); racerCar(c, c.w / 2 + Math.sin(c.t * 2) * c.w * 0.2, c.h * 0.7, c.h * 0.16); smoke(c, c.w / 2 + Math.sin(c.t * 2) * c.w * 0.2 - c.h * 0.1, c.h * 0.68); }],
    [2, (c, P) => { vgrad(c, ['#3a2a00', '#ffe14f']); tunnel(c, 6, 2.2, '#ffffff', { rot: c.t * 0.5, lw: 2 }); starfield(c, STARS, 1.6, '#fff', 3); racerCar(c, c.w / 2, c.h * 0.75, c.h * (0.18 + 0.01 * c.pulse)); }],
  ],
};

// ---- Psy Forest: サイケな森。光るきのこと、回るフラクタル模様 ----
function mushroom(c, x, base, s, col, glow) {
  const g = c.g; g.fillStyle = '#e8e0c8'; g.fillRect(x - s * 0.12, base - s * 0.6, s * 0.24, s * 0.6);
  g.save(); g.shadowColor = col; g.shadowBlur = glow * s * 0.6; g.fillStyle = col; g.beginPath(); g.arc(x, base - s * 0.6, s * 0.5, Math.PI, TAU); g.fill(); g.restore();
  g.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x - s * 0.3 + i * s * 0.2, base - s * 0.8 + (i % 2) * s * 0.1, s * 0.05, 0, TAU); g.fill(); }
}
function fractalFlower(c, x, y, R, rot, cols) {
  const g = c.g;
  for (let d = 0; d < 3; d++) { const n = 6 * (d + 1), r = R * (0.3 + d * 0.3); for (let i = 0; i < n; i++) { const a = rot * (d % 2 ? -1 : 1) + i * TAU / n; g.fillStyle = cols[(i + d) % cols.length]; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, R * 0.12, R * 0.05, a, 0, TAU); g.fill(); } }
  g.globalAlpha = 1;
}
const forest = (c, P) => { vgrad(c, ['#0a0418', '#1a0a2a', '#0a2a14']); for (let i = 0; i < 30; i++) { c.g.fillStyle = P.main; c.g.globalAlpha = 0.3 + 0.5 * Math.sin(c.t * 2 + i); c.g.beginPath(); c.g.arc(hash1(i) * c.w, hash1(i + 7) * c.h * 0.7, 1.5, 0, TAU); c.g.fill(); } c.g.globalAlpha = 1; for (let i = 0; i < 6; i++) mushroom(c, c.w * (0.1 + i * 0.16), c.h * 0.95, c.h * (0.18 + 0.08 * hash1(i)), ['#ff5ec4', P.main, '#3dd6ff', '#ffd84a'][i % 4], 0.5 + 0.5 * c.pulse); };
const psyForest = {
  intro: forest,
  looks: [
    [1, forest],
    [1, (c, P) => { vgrad(c, ['#0a0a20', '#1a2a1a']); fractalFlower(c, c.w / 2, c.h / 2, c.h * 0.4, c.t * 0.4, [P.main, '#ff5ec4', '#3dd6ff', '#ffd84a']); }],
    [2, (c, P) => { vgrad(c, ['#2a0a3a', '#3a6a1a']); tunnel(c, 8, 1.2, P.main, { rot: c.t * 0.6, lw: 2.4 }); fractalFlower(c, c.w / 2, c.h / 2, c.h * (0.45 + 0.05 * c.pulse), c.t, ['#ffffff', P.main, '#ff5ec4']); glitch(c, c.pulse * 0.3, Math.floor(c.beat * 2)); }],
  ],
};

export default {
  'liquid-sky': liquidSky,
  'stellar-gate': stellarGate,
  'sky-prism': skyPrism,
  'synth-racer': synthRacer,
  'riddim-riot': riddimRiot,
  'glitter-idol': glitterIdol,
  'wub-fracture': wubFracture,
  'offbeat-skater': offbeatSkater,
  'night-drift': nightDrift,
  'psy-forest': psyForest,
};

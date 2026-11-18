// 特製MV その4: ラテン・ポップ・ダンス(タンゴ・サンバ・ムーンバートン・J-POP・K-POP・シンセポップ・シティポップ・ファンク・マリアッチ・ボリウッド)
import {
  TAU, frac, clamp01, ease, table, vgrad, text, twinkle, SKY, STARS, starfield, hills, birds, fluffyClouds, waves, radialLines,
  retroSun, sparkle, bokeh, palm, moon, stageBeams, eqBars, crowd, beatRipples, vinyl, skyline, BLDS, hash1, ringSegments,
  star5, confetti, lunares, grid, rose, fallingRose, fan, candle, firework, mirrorball, lightSpots, discoFloor, dancers,
  heart, risingBubbles, scanlines, wireCube, vhsHud, neonSign, flames, sparks, arabesque, star8,
} from '../mv.js';

const bounce = (c, k = 1, ph = 0) => Math.abs(Math.sin((c.beat + ph) * Math.PI)) * c.h * 0.03 * k;

// ---- Tango Noir: 夜のブエノスアイレス。赤いバラ、白黒の床、踊る2人の影 ----
function checkerFloor(c, top) {
  const g = c.g, hy = c.h * top;
  for (let r = 0; r < 10; r++) { const y0 = hy + (c.h - hy) * (r / 10) ** 1.6, y1 = hy + (c.h - hy) * ((r + 1) / 10) ** 1.6; for (let i = -8; i < 8; i++) { const sx0 = c.w / 2 + i * c.w * 0.04 * (1 + r * 0.6), sx1 = sx0 + c.w * 0.04 * (1 + r * 0.6); g.fillStyle = (i + r) % 2 ? '#111' : '#e8e0d8'; g.fillRect(sx0, y0, sx1 - sx0, y1 - y0 + 1); } }
}
function tangoPair(c, x, base, s) {
  const g = c.g, lean = Math.sin(c.beat * Math.PI / 2) * 0.25;
  g.save(); g.translate(x, base); g.rotate(lean * 0.3); g.fillStyle = '#05030a';
  g.fillRect(-s * 0.3, -s * 1.5, s * 0.22, s * 0.8); g.fillRect(-s * 0.28, -s * 0.7, s * 0.08, s * 0.7); g.fillRect(-s * 0.16, -s * 0.7, s * 0.08, s * 0.7);
  g.beginPath(); g.arc(-s * 0.19, -s * 1.65, s * 0.12, 0, TAU); g.fill();
  g.fillStyle = '#c4141e'; g.beginPath(); g.moveTo(s * 0.05, -s * 1.45); g.lineTo(s * 0.25, -s * 1.45); g.lineTo(s * 0.5 + lean * s, 0); g.lineTo(-s * 0.05, 0); g.fill();
  g.fillStyle = '#05030a'; g.beginPath(); g.arc(s * 0.16, -s * 1.6, s * 0.11, 0, TAU); g.fill();
  g.strokeStyle = '#05030a'; g.lineWidth = s * 0.06; g.beginPath(); g.moveTo(-s * 0.1, -s * 1.35); g.lineTo(s * 0.1, -s * 1.3); g.stroke();
  g.restore();
}
const milonga = (c) => { vgrad(c, ['#0a0204', '#2a060a']); stageBeams(c, 1, ['#ff4f4f'], 0.35, 0.2); checkerFloor(c, 0.65); tangoPair(c, c.w / 2, c.h * 0.85, c.h * 0.32); };
const tangoNoir = {
  intro: milonga,
  looks: [
    [1, milonga],
    [1, (c) => { vgrad(c, ['#1a0204', '#3a0810']); fallingRose(c, 0.8, 0.9); rose(c, c.w / 2, c.h / 2, c.h * 0.2, 0.6 + 0.4 * Math.sin(c.t), c.t * 0.2); }],
    [2, (c) => { vgrad(c, ['#3a0408', '#7a0a14']); radialLines(c, 24, '#ff4f4f', 0.2 + 0.3 * c.pulse, c.t * 0.3, 0.2); fan(c, c.w / 2, c.h * 0.7, c.h * 0.5, 0.6 + 0.4 * Math.abs(Math.sin(c.beat * Math.PI / 2)), Math.sin(c.beat * Math.PI / 4) * 0.2, '#c4141e', '#111'); tangoPair(c, c.w / 2, c.h * 0.95, c.h * 0.3); }],
    [0, (c) => { vgrad(c, ['#050102', '#14030a']); moon(c, c.w * 0.7, c.h * 0.3, c.h * 0.1, '#ffe8e0'); skyline(c, BLDS, c.h * 0.9, '#020101', '#ff8a6a', 0.15); }],
  ],
};

// ---- Samba Carnival: リオのカーニバル。羽飾りと紙吹雪、山車の光 ----
function feathers(c, x, y, R, rot, cols) {
  const g = c.g;
  for (let i = 0; i < 13; i++) { const a = -Math.PI + i * Math.PI / 12 + rot; g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.fillStyle = cols[i % cols.length]; g.beginPath(); g.ellipse(0, -R * 0.55, R * 0.09, R * 0.5, 0, 0, TAU); g.fill(); g.restore(); }
  g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(x, y, R * 0.12, 0, TAU); g.fill();
}
const carnival = (c, P) => { vgrad(c, ['#0a1a3a', '#2a0a3a']); for (let i = 0; i < 4; i++) firework(c, c.w * (0.2 + i * 0.2), c.h * (0.25 + (i % 2) * 0.1), frac(c.beat / 4 + i / 4), ['#ffd84a', '#3ddc6e', '#ff5ea8', '#3dd6ff'][i], c.h * 0.18); feathers(c, c.w / 2, c.h * 0.9, c.h * 0.5, Math.sin(c.beat * Math.PI / 2) * 0.1, ['#3ddc6e', '#ffd84a', '#ff5ea8', '#3dd6ff']); };
const sambaCarnival = {
  intro: carnival,
  looks: [
    [1, carnival],
    [1, (c, P) => { vgrad(c, ['#3ddc6e', '#ffd84a']); confetti(c); for (let i = 0; i < 4; i++) feathers(c, c.w * (0.14 + i * 0.24), c.h * 0.95 - bounce(c, 1.5, i * 0.25), c.h * 0.3, Math.sin(c.beat * Math.PI + i) * 0.15, ['#ff5ea8', '#ffffff', '#3dd6ff']); }],
    [2, (c, P) => { vgrad(c, ['#ffd84a', '#ff5ea8']); radialLines(c, 28, '#ffffff', 0.25 + 0.35 * c.pulse, c.t * 0.5, 0.05); feathers(c, c.w / 2, c.h * 0.75, c.h * (0.55 + 0.04 * c.pulse), c.t * 0.2, ['#3ddc6e', '#3dd6ff', '#ffffff', '#ff8a3d']); confetti(c); }],
  ],
};

// ---- Moombah Heat: 灼熱の夜のフェス。炎と火の粉、低音で揺れる地平線 ----
const heatStage = (c, P) => { vgrad(c, ['#1a0400', '#4a1000']); flames(c, c.h, c.h * 0.4, 0.8); sparks(c, '#ffb347', 1); crowd(c, '#0a0200'); };
const moombahHeat = {
  intro: heatStage,
  looks: [
    [1, heatStage],
    [1, (c, P) => { vgrad(c, ['#2a0800', '#ff6a2a']); retroSun(c, c.w / 2, c.h * 0.55, c.h * (0.25 + 0.02 * c.pulse), '#fff4c0', '#ff3d00', '#ff6a2a'); hills(c, c.h * 0.7, '#1a0400', c.h * 0.03 * (1 + c.pulse), 0.03, 2); }],
    [2, (c, P) => { vgrad(c, ['#3a0a00', '#8a2a00']); stageBeams(c, 6, ['#ff8c3d', '#ffd84a'], 0.3 + 0.35 * c.pulse, 1.5); flames(c, c.h, c.h * (0.45 + 0.1 * c.pulse), 1); sparks(c, '#ffd84a', 2); crowd(c, '#000'); }],
  ],
};

// ---- Paper Planes: 青空を紙飛行機が飛んでいく。街の屋上から ----
function plane(c, x, y, s, rot, col = '#ffffff') {
  const g = c.g; g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = col; g.beginPath(); g.moveTo(s, 0); g.lineTo(-s, -s * 0.55); g.lineTo(-s * 0.55, 0); g.fill();
  g.fillStyle = '#d8e4f0'; g.beginPath(); g.moveTo(s, 0); g.lineTo(-s, s * 0.35); g.lineTo(-s * 0.55, 0); g.fill();
  g.restore();
}
const PLANES = table(10, 4401, (r) => ({ y: 0.1 + r() * 0.6, sp: 0.04 + r() * 0.05, s: 0.6 + r() * 0.6, ph: r() * TAU, x: r() }));
const skyPlanes = (c, n, speed) => { for (const p of PLANES.slice(0, n)) { const x = frac(p.x + c.t * p.sp * speed) * (c.w * 1.3) - c.w * 0.15, y = c.h * p.y + Math.sin(c.t * 1.2 + p.ph) * c.h * 0.04; plane(c, x, y, c.h * 0.04 * p.s, Math.cos(c.t * 1.2 + p.ph) * 0.2); } };
const rooftop = (c) => { vgrad(c, ['#4fb4ff', '#d8f1ff']); fluffyClouds(c, c.h * 0.25, 0.01); skyline(c, BLDS, c.h * 0.95, '#6a8ab0', '#ffffff', 0.05); skyPlanes(c, 4, 1); };
const paperPlanes = {
  intro: rooftop,
  looks: [
    [1, rooftop],
    [1, (c) => { vgrad(c, ['#ffb88a', '#ffe8d0']); fluffyClouds(c, c.h * 0.3, 0.015); skyPlanes(c, 8, 1.3); birds(c, '#5a4a4a'); }],
    [2, (c, P) => { vgrad(c, ['#3aa0ff', '#bfe6ff']); radialLines(c, 18, '#ffffff', 0.25 + 0.3 * c.pulse, c.t * 0.2, 0.08); skyPlanes(c, 10, 2); plane(c, c.w / 2, c.h / 2 - bounce(c), c.h * (0.12 + 0.02 * c.pulse), Math.sin(c.t) * 0.15, '#ffffff'); }],
    [0, (c) => { vgrad(c, ['#1a2040', '#ff9a8a']); twinkle(c, SKY, '#fff'); skyline(c, BLDS, c.h * 0.95, '#141830', '#ffd27a', 0.3); plane(c, c.w * 0.6, c.h * 0.35, c.h * 0.05, -0.1); }],
  ],
};

// ---- Seoul Signal: ソウルの夜。ペンライトの海とステージのLED ----
function penlights(c, col, n = 60) {
  const g = c.g; g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const x = (i + 0.5) / n * c.w + Math.sin(i) * 4, base = c.h * (0.82 + (i % 3) * 0.05), a = Math.sin(c.beat * Math.PI + i * 0.2) * 0.4; g.strokeStyle = col; g.globalAlpha = 0.7; g.lineWidth = Math.max(2, c.h * 0.012); g.beginPath(); g.moveTo(x, base); g.lineTo(x + Math.sin(a) * c.h * 0.08, base - Math.cos(a) * c.h * 0.08); g.stroke(); }
  g.restore();
}
function ledWall(c, cols) {
  const g = c.g, n = 24, m = 10, w = c.w / n, h = c.h * 0.6 / m;
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const v = Math.sin(i * 0.5 + j * 0.3 - c.t * 3) + Math.sin(c.beat * Math.PI) * 0.5; g.fillStyle = cols[(i + j + Math.floor(c.beat)) % cols.length]; g.globalAlpha = clamp01(0.2 + 0.4 * v); g.fillRect(i * w + 1, j * h + 1, w - 2, h - 2); }
  g.globalAlpha = 1;
}
const concert = (c, P) => { vgrad(c, ['#0a0210', '#2a0620']); ledWall(c, [P.main, '#ffffff', '#7ab8ff']); penlights(c, P.main); };
const seoulSignal = {
  intro: concert,
  looks: [
    [1, concert],
    [1, (c, P) => { vgrad(c, ['#0a0418', '#200830']); skyline(c, BLDS, c.h * 0.9, '#05020c', '#ff5ea8', 0.3); neonSign(c, '서울', c.w * 0.3, c.h * 0.3, c.h * 0.12, P.main, 1); neonSign(c, 'SIGNAL', c.w * 0.68, c.h * 0.4, c.h * 0.08, '#7ab8ff', Math.sin(c.t * 7) > 0.9 ? 0.3 : 1); }],
    [2, (c, P) => { vgrad(c, ['#2a0420', '#6a0a40']); stageBeams(c, 8, [P.main, '#ffffff', '#7ab8ff'], 0.3 + 0.35 * c.pulse, 1.6); for (let i = 0; i < 6; i++) heart(c, c.w * (0.1 + i * 0.16), c.h * (0.35 + 0.1 * Math.sin(c.t * 2 + i)), c.h * 0.05 * (0.8 + c.pulse * 0.4), P.main, 0.8); penlights(c, '#ffffff', 70); }],
  ],
};

// ---- Retro Arcade: ゲームセンターの筐体。ピンクのネオンとワイヤーの立体 ----
function cabinet(c, x, base, s, col, k) {
  const g = c.g; g.fillStyle = '#14081e'; g.beginPath(); g.moveTo(x - s * 0.4, base); g.lineTo(x - s * 0.4, base - s * 1.5); g.lineTo(x - s * 0.3, base - s * 1.8); g.lineTo(x + s * 0.3, base - s * 1.8); g.lineTo(x + s * 0.4, base - s * 1.5); g.lineTo(x + s * 0.4, base); g.fill();
  g.fillStyle = col; g.globalAlpha = 0.6 + 0.4 * k; g.fillRect(x - s * 0.28, base - s * 1.4, s * 0.56, s * 0.42); g.globalAlpha = 1;
  g.fillStyle = '#ff5ec4'; g.fillRect(x - s * 0.3, base - s * 1.75, s * 0.6, s * 0.1);
  g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(x - s * 0.12, base - s * 0.85, s * 0.05, 0, TAU); g.fill(); g.fillStyle = '#3dd6ff'; g.beginPath(); g.arc(x + s * 0.1, base - s * 0.85, s * 0.05, 0, TAU); g.fill();
}
const arcadeRoom = (c, P) => { vgrad(c, ['#0a0214', '#200a30']); grid(c, 0.7, P.main, 0.5, 0.6); for (let i = 0; i < 5; i++) cabinet(c, c.w * (0.12 + i * 0.19), c.h * 0.9, c.h * 0.35, ['#3dd6ff', '#ff5ec4', '#ffd84a', '#6dff8a', '#c38bff'][i], c.pulse); };
const retroArcade = {
  intro: arcadeRoom,
  looks: [
    [1, arcadeRoom],
    [1, (c, P) => { vgrad(c, ['#05010c', '#1a0628']); grid(c, 0.6, P.main, 1); retroSun(c, c.w / 2, c.h * 0.5, c.h * 0.2, '#ffd84a', P.main, '#1a0628'); wireCube(c, c.w * 0.2, c.h * 0.3, c.h * 0.08, c.t, c.t * 0.7, '#3dd6ff'); wireCube(c, c.w * 0.8, c.h * 0.3, c.h * 0.08, -c.t, c.t * 0.5, '#3dd6ff'); }],
    [2, (c, P) => { vgrad(c, ['#2a0430', '#5a0a50']); grid(c, 0.55, '#3dd6ff', 2); text(c, 'HIGH SCORE', c.w / 2, c.h * 0.25, c.h * 0.07, '#ffd84a', 0.9, { glow: 10 }); text(c, String(Math.floor(c.beat * 1234) % 1000000).padStart(6, '0'), c.w / 2, c.h * 0.38, c.h * (0.1 + 0.01 * c.pulse), P.main, 1, { glow: 14 }); scanlines(c, 0.15); }],
  ],
};

// ---- Midnight Avenue: 80年代シティポップ。夜の首都高、テールランプの光の帯 ----
function lightTrails(c, y, col, dir, speed) {
  const g = c.g; g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) { const x = frac(hash1(i) + c.t * speed * dir * (0.5 + hash1(i + 4))) * c.w * 1.4 - c.w * 0.2, L = c.w * (0.1 + hash1(i + 2) * 0.15); const gr = g.createLinearGradient(x, 0, x - L * dir, 0); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.strokeStyle = gr; g.lineWidth = c.h * 0.008; g.beginPath(); g.moveTo(x, y + i % 3 * c.h * 0.015); g.lineTo(x - L * dir, y + i % 3 * c.h * 0.015); g.stroke(); }
  g.restore();
}
const nightDrive = (c, P) => { vgrad(c, ['#0a0820', '#3a1a50', '#ff8a7a']); twinkle(c, SKY, '#fff'); skyline(c, BLDS, c.h * 0.7, '#120a20', '#ffd27a', 0.3); c.g.fillStyle = '#0a0612'; c.g.fillRect(0, c.h * 0.7, c.w, c.h); lightTrails(c, c.h * 0.76, 'rgba(255,80,80,0.9)', 1, 0.15); lightTrails(c, c.h * 0.84, 'rgba(255,240,200,0.9)', -1, 0.2); };
const midnightAvenue = {
  intro: nightDrive,
  looks: [
    [1, nightDrive],
    [1, (c, P) => { vgrad(c, ['#ff8a7a', '#ffd0a0']); retroSun(c, c.w / 2, c.h * 0.55, c.h * 0.22, '#fff1a8', P.main, '#ffb0a0'); waves(c, 0.62, '#5a3a8a', '#3a2a6a', 0.5); palm(c, c.w * 0.12, c.h, c.h * 0.6, '#2a1a3a', 0.2); }],
    [2, (c, P) => { vgrad(c, ['#2a0a3a', '#ff6a8a']); vinyl(c, c.w / 2, c.h / 2, c.h * (0.33 + 0.01 * c.pulse), c.t * 2, P.main); lightTrails(c, c.h * 0.88, 'rgba(255,200,240,0.9)', 1, 0.3); bokeh(c, [P.main, '#ffd27a'], 0.3); }],
  ],
};

// ---- Funky Station: 70年代のディスコ駅。ミラーボールとアフロのシルエット ----
const funkFloor = (c, P) => { vgrad(c, ['#1a0a00', '#3a1a00']); lightSpots(c, 0.5); mirrorball(c, c.w / 2, c.h * 0.2, c.h * 0.12, c.t); discoFloor(c, 0.66, 1); dancers(c, c.h * 0.9); };
const funkyStation = {
  intro: funkFloor,
  looks: [
    [1, funkFloor],
    [1, (c, P) => { vgrad(c, ['#ffb000', '#ff6a00']); lunares(c, '#ffffff', c.h * 0.03, 0.2, 0.35); text(c, 'FUNKY', c.w / 2, c.h * 0.4 - bounce(c, 2), c.h * 0.2, '#3a1000', 1, { font: 'Impact' }); text(c, 'STATION', c.w / 2, c.h * 0.65, c.h * 0.1, '#ffffff', 0.95, { font: 'Impact', spacing: 6 }); }],
    [2, (c, P) => { vgrad(c, ['#3a0a3a', '#ff6a3d']); radialLines(c, 24, '#ffd84a', 0.25 + 0.35 * c.pulse, c.t * 0.6, 0.1); mirrorball(c, c.w / 2, c.h * 0.4, c.h * (0.18 + 0.01 * c.pulse), c.t * 2); lightSpots(c, 0.7); dancers(c, c.h * 0.95); }],
  ],
};

// ---- Mariachi Sun: メキシコの太陽、サボテンと切り紙の旗(パペル・ピカド) ----
function cactus(c, x, base, s, col) {
  const g = c.g; g.fillStyle = col; g.lineCap = 'round';
  g.fillRect(x - s * 0.12, base - s, s * 0.24, s); g.beginPath(); g.arc(x, base - s, s * 0.12, Math.PI, TAU); g.fill();
  g.fillRect(x - s * 0.42, base - s * 0.6, s * 0.18, s * 0.3); g.fillRect(x - s * 0.42, base - s * 0.75, s * 0.15, s * 0.25); g.fillRect(x - s * 0.3, base - s * 0.42, s * 0.25, s * 0.13);
  g.fillRect(x + s * 0.24, base - s * 0.7, s * 0.18, s * 0.3); g.fillRect(x + s * 0.28, base - s * 0.85, s * 0.15, s * 0.3); g.fillRect(x + s * 0.05, base - s * 0.52, s * 0.25, s * 0.13);
}
function papelPicado(c, y, n) {
  const g = c.g;
  for (let i = 0; i < n; i++) { const x = (i + 0.5) / n * c.w, yy = y + Math.sin((i + 0.5) / n * Math.PI) * c.h * 0.05, sw = Math.sin(c.t * 2 + i) * 0.1; g.save(); g.translate(x, yy); g.rotate(sw); g.fillStyle = ['#ff3d6e', '#ffd84a', '#3ddc6e', '#3dd6ff', '#c38bff'][i % 5]; g.fillRect(-c.w / n * 0.4, 0, c.w / n * 0.8, c.h * 0.1); g.fillStyle = 'rgba(255,255,255,0.6)'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(-c.w / n * 0.2 + k * c.w / n * 0.2, c.h * 0.04, c.h * 0.012, 0, TAU); g.fill(); } g.restore(); }
}
const desertPlaza = (c) => { vgrad(c, ['#ffb02e', '#ffe08a']); retroSun(c, c.w / 2, c.h * 0.6, c.h * 0.22, '#fff8d0', '#ff7a2a', 'rgba(0,0,0,0)'); c.g.fillStyle = '#c8783a'; c.g.fillRect(0, c.h * 0.76, c.w, c.h); cactus(c, c.w * 0.18, c.h * 0.8, c.h * 0.3, '#2a6a3a'); cactus(c, c.w * 0.85, c.h * 0.8, c.h * 0.24, '#2a6a3a'); papelPicado(c, 0, 10); };
const mariachiSun = {
  intro: desertPlaza,
  looks: [
    [1, desertPlaza],
    [1, (c) => { vgrad(c, ['#3a0a3a', '#ff6a3d']); twinkle(c, SKY, '#fff'); for (let i = 0; i < 5; i++) candle(c, c.w * (0.15 + i * 0.17), c.h * 0.9, c.h * 0.12, i); papelPicado(c, c.h * 0.02, 12); }],
    [2, (c) => { vgrad(c, ['#ff3d6e', '#ffd84a']); radialLines(c, 22, '#ffffff', 0.25 + 0.35 * c.pulse, c.t * 0.4, 0.1); for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + c.t * 0.5; c.g.save(); c.g.translate(c.w / 2 + Math.cos(a) * c.h * 0.35, c.h / 2 + Math.sin(a) * c.h * 0.3); c.g.rotate(Math.sin(c.beat * Math.PI) * 0.3); text(c, '♪', 0, 0, c.h * 0.1, '#ffffff', 0.9, { font: 'serif' }); c.g.restore(); } papelPicado(c, 0, 10); papelPicado(c, c.h * 0.85, 10); }],
  ],
};

// ---- Bollywood Beat: 宮殿とマンダラ。花びらが舞い、色が弾ける ----
function mandala(c, x, y, R, rot, cols) {
  const g = c.g;
  for (let ring = 0; ring < 4; ring++) { const n = 8 + ring * 4, r = R * (0.25 + ring * 0.22); for (let i = 0; i < n; i++) { const a = rot * (ring % 2 ? -1 : 1) + i * TAU / n; g.save(); g.translate(x + Math.cos(a) * r, y + Math.sin(a) * r); g.rotate(a); g.fillStyle = cols[(ring + i) % cols.length]; g.beginPath(); g.ellipse(0, 0, R * 0.08, R * 0.035, 0, 0, TAU); g.fill(); g.restore(); } }
  g.fillStyle = cols[0]; g.beginPath(); g.arc(x, y, R * 0.12, 0, TAU); g.fill();
}
function palace(c, base, col) {
  const g = c.g; g.fillStyle = col;
  g.fillRect(c.w * 0.25, base - c.h * 0.25, c.w * 0.5, c.h * 0.25);
  g.beginPath(); g.arc(c.w / 2, base - c.h * 0.25, c.h * 0.14, Math.PI, TAU); g.fill(); g.beginPath(); g.moveTo(c.w / 2, base - c.h * 0.48); g.lineTo(c.w / 2 - c.h * 0.02, base - c.h * 0.38); g.lineTo(c.w / 2 + c.h * 0.02, base - c.h * 0.38); g.fill();
  for (const x of [0.22, 0.78]) { g.fillRect(c.w * x - c.h * 0.02, base - c.h * 0.42, c.h * 0.04, c.h * 0.42); g.beginPath(); g.arc(c.w * x, base - c.h * 0.42, c.h * 0.035, Math.PI, TAU); g.fill(); }
}
const palaceView = (c) => { vgrad(c, ['#ff7a3d', '#ffc86a', '#ffe8c0']); retroSun(c, c.w / 2, c.h * 0.4, c.h * 0.16, '#fff8d0', '#ff8a3d', 'rgba(0,0,0,0)'); palace(c, c.h * 0.85, '#5a1a3a'); c.g.fillStyle = '#ff9a5a'; c.g.fillRect(0, c.h * 0.85, c.w, c.h); };
const bollywoodBeat = {
  intro: palaceView,
  looks: [
    [1, palaceView],
    [1, (c) => { vgrad(c, ['#3a0a3a', '#8a1a5a']); mandala(c, c.w / 2, c.h / 2, c.h * 0.42, c.t * 0.3, ['#ffd84a', '#ff7a3d', '#ff3d8a', '#3dd6ff']); }],
    [2, (c) => { vgrad(c, ['#ff3d8a', '#ffd84a']); radialLines(c, 24, '#ffffff', 0.25 + 0.3 * c.pulse, c.t * 0.4, 0.05); mandala(c, c.w / 2, c.h / 2, c.h * (0.45 + 0.03 * c.pulse), c.t * 0.6, ['#ffffff', '#3ddc6e', '#7a1a8a', '#ff7a3d']); for (let i = 0; i < 30; i++) { const y = frac(hash1(i) + c.t * 0.1) * c.h, x = hash1(i + 3) * c.w; c.g.fillStyle = ['#ff3d6e', '#ffd84a', '#ff8a3d'][i % 3]; c.g.beginPath(); c.g.ellipse(x, y, c.h * 0.012, c.h * 0.02, c.t + i, 0, TAU); c.g.fill(); } }],
  ],
};

export default {
  'tango-noir': tangoNoir,
  'samba-carnival': sambaCarnival,
  'moombah-heat': moombahHeat,
  'paper-planes': paperPlanes,
  'seoul-signal': seoulSignal,
  'retro-arcade': retroArcade,
  'midnight-avenue': midnightAvenue,
  'funky-station': funkyStation,
  'mariachi-sun': mariachiSun,
  'bollywood-beat': bollywoodBeat,
};

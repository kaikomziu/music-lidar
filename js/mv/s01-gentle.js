// 特製MV その1: やさしい曲(BEGINNER・ポップ・冬・ラウンジ・マーチ)
import {
  TAU, frac, clamp01, ease, table, vgrad, text, twinkle, SKY, hills, birds, fluffyClouds, waves, radialLines,
  retroSun, sparkle, heart, candySwirl, risingBubbles, bubble, sakura, fallingPetals, PETALS, snowfall, star5,
  fireflies, moon, confetti, beatRipples, bokeh, hash1,
} from '../mv.js';

// ---- 共通の小物 ----
const TREES = table(14, 901, (r) => ({ x: r(), h: 0.25 + r() * 0.3, w: 0.05 + r() * 0.05 }));
function treeLine(c, base, col, sc = 1) {
  const g = c.g; g.fillStyle = col;
  for (const t of TREES) {
    const x = t.x * c.w, h = t.h * c.h * sc, w = t.w * c.w * sc;
    g.beginPath(); g.moveTo(x, base - h); g.lineTo(x + w, base); g.lineTo(x - w, base); g.fill();
  }
  g.fillRect(0, base, c.w, c.h - base);
}
function sea(c, y, col, glint) {
  const g = c.g; g.fillStyle = col; g.fillRect(0, y, c.w, c.h - y);
  g.fillStyle = glint;
  for (let i = 0; i < 26; i++) {
    const yy = y + (c.h - y) * (i / 26) ** 1.4, w = c.w * (0.04 + 0.12 * (i / 26)) * (0.6 + 0.4 * Math.sin(c.t * 1.5 + i));
    g.globalAlpha = 0.25 + 0.4 * (i / 26); g.fillRect(c.w / 2 - w / 2 + Math.sin(c.t + i * 1.7) * c.w * 0.03, yy, w, 1.5);
  }
  g.globalAlpha = 1;
}
const bob = (c, k = 1) => Math.abs(Math.sin(c.beat * Math.PI)) * c.h * 0.03 * k; // 拍に合わせて跳ねる

// ---- First Light: 夜明け。暗い海から日が昇り、最後は光があふれる ----
const firstLight = {
  intro: (c) => {
    const k = ease(c.p);
    vgrad(c, [`hsl(230,50%,${6 + k * 10}%)`, `hsl(${250 - k * 40},45%,${12 + k * 18}%)`, `hsl(${20 + k * 10},70%,${20 + k * 30}%)`]);
    twinkle(c, SKY, '#fff'); c.g.globalAlpha = 1;
    retroSun(c, c.w / 2, c.h * (0.78 - 0.14 * k), c.h * 0.16, '#fff6c8', '#ff9a5a', 'rgba(0,0,0,0)');
    sea(c, c.h * 0.66, '#0b1430', '#ffd9a0');
  },
  looks: [
    [0, (c, P) => { vgrad(c, ['#2a3b7a', '#f39a8a', '#ffd9a0']); retroSun(c, c.w / 2, c.h * 0.6, c.h * 0.17, '#fffbe0', '#ffb36b', 'rgba(0,0,0,0)'); sea(c, c.h * 0.66, '#1a2550', '#fff1c8'); birds(c, '#1a2040'); }],
    [1, (c, P) => { vgrad(c, ['#5aa8ff', '#bfe6ff', '#fff3d6']); fluffyClouds(c, c.h * 0.25, 0.01); retroSun(c, c.w * 0.5, c.h * 0.42, c.h * 0.13, '#ffffff', '#ffe08a', 'rgba(0,0,0,0)'); sea(c, c.h * 0.68, '#2b6fc2', '#ffffff'); birds(c, '#20304a'); }],
    [2, (c, P) => { vgrad(c, ['#ffd27a', '#fff3d6']); radialLines(c, 22, '#ffffff', 0.25 + 0.3 * c.pulse, c.t * 0.15, 0.08); retroSun(c, c.w / 2, c.h * 0.46, c.h * (0.15 + 0.02 * c.pulse), '#ffffff', '#ffd27a', 'rgba(0,0,0,0)'); sea(c, c.h * 0.7, '#4a8ad8', '#ffffff'); for (let i = 0; i < 6; i++) sparkle(c, c.w * (0.15 + i * 0.14), c.h * (0.25 + 0.08 * Math.sin(c.t + i)), c.h * 0.02 * (0.5 + c.pulse), '#fff', 0.9); }],
  ],
};

// ---- Hello, Lane: 4本のレーンが草原の向こうへ。音符がぴょんぴょん跳ねる ----
const LANE_C = ['#ff6b8a', '#ffd25e', '#6dffb0', '#6ab8ff'];
function lanes(c, speed, hop) {
  const g = c.g, hy = c.h * 0.48;
  for (let l = 0; l < 4; l++) {
    const x0 = c.w * (0.18 + l * 0.16), x1 = c.w * (0.47 + l * 0.02);
    g.fillStyle = LANE_C[l]; g.globalAlpha = 0.35;
    g.beginPath(); g.moveTo(x0 - c.w * 0.07, c.h); g.lineTo(x0 + c.w * 0.07, c.h); g.lineTo(x1 + c.w * 0.008, hy); g.lineTo(x1 - c.w * 0.008, hy); g.fill();
    for (let i = 0; i < 4; i++) { // 流れてくる音符
      const z = frac(i / 4 + c.t * speed * 0.25 + l * 0.13), x = x1 + (x0 - x1) * z * z, y = hy + (c.h - hy) * z * z - (hop ? Math.abs(Math.sin((c.beat + l * 0.5) * Math.PI)) * c.h * 0.05 * z : 0);
      g.globalAlpha = clamp01(z * 2); g.fillStyle = LANE_C[l];
      g.beginPath(); g.ellipse(x, y, c.w * 0.03 * z + 1, c.h * 0.02 * z + 1, 0, 0, TAU); g.fill();
    }
  }
  g.globalAlpha = 1;
}
const helloLane = {
  intro: (c) => { vgrad(c, ['#8fd8ff', '#e6f8ff']); fluffyClouds(c, c.h * 0.2, 0.01); hills(c, c.h * 0.5, '#9be08a', c.h * 0.03, 0.01, 0); c.g.fillStyle = '#7fcf72'; c.g.fillRect(0, c.h * 0.5, c.w, c.h); lanes(c, 0.6, false); },
  looks: [
    [0, (c) => { vgrad(c, ['#8fd8ff', '#e6f8ff']); fluffyClouds(c, c.h * 0.2, 0.015); c.g.fillStyle = '#7fcf72'; c.g.fillRect(0, c.h * 0.48, c.w, c.h); lanes(c, 0.8, false); }],
    [1, (c) => { vgrad(c, ['#6ec6ff', '#d8f1ff']); fluffyClouds(c, c.h * 0.18, 0.02); birds(c, '#2a3a4a'); c.g.fillStyle = '#6cc061'; c.g.fillRect(0, c.h * 0.48, c.w, c.h); lanes(c, 1, true); }],
    [2, (c) => { vgrad(c, ['#ffd27a', '#fff3d6']); radialLines(c, 16, '#ffffff', 0.25 + 0.3 * c.pulse, c.t * 0.2, 0.05); c.g.fillStyle = '#7fcf72'; c.g.fillRect(0, c.h * 0.48, c.w, c.h); lanes(c, 1.5, true); text(c, 'HELLO!', c.w / 2, c.h * 0.28 - bob(c), c.h * 0.11, '#ff6b8a', 0.9, { glow: 8 }); }],
  ],
};

// ---- Firefly Path: 夜の森の小道に蛍。サビで蛍がうずを巻く ----
function path(c) {
  const g = c.g; g.fillStyle = '#2a2a1a';
  g.beginPath(); g.moveTo(c.w * 0.3, c.h); g.quadraticCurveTo(c.w * 0.55, c.h * 0.75, c.w * 0.49, c.h * 0.6); g.lineTo(c.w * 0.51, c.h * 0.6); g.quadraticCurveTo(c.w * 0.6, c.h * 0.75, c.w * 0.75, c.h); g.fill();
}
function swirlFlies(c, n, R) {
  const g = c.g; g.fillStyle = '#e4ff8a';
  for (let i = 0; i < n; i++) {
    const a = c.t * (0.3 + hash1(i) * 0.4) + i * 2.4, r = R * (0.3 + hash1(i + 7) * 0.7) * (1 + 0.1 * Math.sin(c.t + i));
    g.globalAlpha = 0.4 + 0.6 * Math.max(0, Math.sin(c.t * 3 + i));
    g.beginPath(); g.arc(c.w / 2 + Math.cos(a) * r * 1.4, c.h * 0.45 + Math.sin(a) * r * 0.7, 1.6 + c.pulse, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
}
const fireflyPath = {
  looks: [
    [0, (c) => { vgrad(c, ['#04070e', '#0d1a22', '#14261e']); twinkle(c, SKY, '#fff'); moon(c, c.w * 0.75, c.h * 0.22, c.h * 0.08, '#fff8d8'); treeLine(c, c.h * 0.62, '#06100a'); path(c); fireflies(c, 0.9); }],
    [1, (c) => { vgrad(c, ['#050a12', '#0f2028']); twinkle(c, SKY, '#fff'); treeLine(c, c.h * 0.6, '#08140c', 1.2); path(c); fireflies(c, 1); swirlFlies(c, 24, c.h * 0.2); }],
    [2, (c) => { vgrad(c, ['#08121a', '#1a3020']); twinkle(c, SKY, '#fff', 0.5); moon(c, c.w * 0.5, c.h * 0.25, c.h * 0.1, '#fffbe0'); treeLine(c, c.h * 0.64, '#06100a', 0.9); swirlFlies(c, 70, c.h * 0.35); fireflies(c, 1); }],
  ],
};

// ---- Cotton Candy: 綿あめの雲と観覧車、ハートがぷかぷか ----
function ferris(c, x, y, R, rot) {
  const g = c.g; g.strokeStyle = '#ffffffcc'; g.lineWidth = Math.max(1, c.h * 0.006);
  g.beginPath(); g.arc(x, y, R, 0, TAU); g.stroke();
  for (let i = 0; i < 8; i++) {
    const a = rot + i * TAU / 8, px = x + Math.cos(a) * R, py = y + Math.sin(a) * R;
    g.beginPath(); g.moveTo(x, y); g.lineTo(px, py); g.stroke();
    g.fillStyle = ['#ff8ac0', '#ffd25e', '#8ad8ff', '#b8ff9e'][i % 4]; g.fillRect(px - R * 0.08, py, R * 0.16, R * 0.14);
  }
  g.beginPath(); g.moveTo(x, y); g.lineTo(x - R * 0.6, y + R * 1.4); g.moveTo(x, y); g.lineTo(x + R * 0.6, y + R * 1.4); g.stroke();
}
function candyClouds(c, y, speed, col) {
  const g = c.g; g.fillStyle = col;
  for (let i = 0; i < 5; i++) {
    const x = frac(i / 5 + c.t * speed) * (c.w + c.h) - c.h * 0.4, r = c.h * (0.09 + (i % 2) * 0.03);
    g.beginPath(); for (let k = 0; k < 6; k++) g.arc(x + Math.cos(k) * r * 0.8, y + Math.sin(k * 1.7) * r * 0.3, r * (0.6 + 0.1 * k % 0.4), 0, TAU); g.fill();
  }
}
const cottonCandy = {
  looks: [
    [0, (c, P) => { vgrad(c, [P.pa, '#ffe6f4', '#d6f0ff']); candyClouds(c, c.h * 0.3, 0.008, '#ffd1ea'); candyClouds(c, c.h * 0.75, 0.012, '#d9ecff'); ferris(c, c.w * 0.72, c.h * 0.55, c.h * 0.25, c.t * 0.15); }],
    [1, (c, P) => { vgrad(c, ['#ffc4e1', '#ffeaf6']); candyClouds(c, c.h * 0.2, 0.02, '#ffffffcc'); ferris(c, c.w * 0.5, c.h * 0.5, c.h * 0.3, c.t * 0.25); risingBubbles(c, 0.8, 0.6, 0.7); }],
    [2, (c, P) => { candySwirl(c, ['#ffb8d9', '#ffe6f4', '#c9e8ff', '#fff2c4'], c.t * 0.5); for (let i = 0; i < 7; i++) heart(c, c.w * (0.1 + i * 0.13), c.h * (0.5 + 0.25 * Math.sin(c.t * 1.5 + i)) - bob(c), c.h * (0.05 + 0.02 * c.pulse), ['#ff6fae', '#ff9fd0', '#ffd0ea'][i % 3], 0.9); }],
  ],
};

// ---- Cherry Picnic: 桜の公園でピクニック。チェックの敷物と花びら ----
function blossomTree(c, x, base, s) {
  const g = c.g; g.fillStyle = '#5a3a2a'; g.fillRect(x - s * 0.06, base - s * 0.7, s * 0.12, s * 0.7);
  for (let i = 0; i < 9; i++) { const a = i * 0.8, r = s * (0.22 + hash1(i + x) * 0.12); g.fillStyle = i % 2 ? '#ffc4d6' : '#ffdbe6'; g.beginPath(); g.arc(x + Math.cos(a) * s * 0.3, base - s * 0.8 + Math.sin(a) * s * 0.18, r, 0, TAU); g.fill(); }
}
function checker(c, top) {
  const g = c.g, n = 10;
  for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) { g.fillStyle = (i + j) % 2 ? '#ff6b8a' : '#fff3f6'; g.fillRect(c.w * (0.2 + i * 0.06), top + j * c.h * 0.05, c.w * 0.06, c.h * 0.05); }
}
const cherryPicnic = {
  looks: [
    [0, (c) => { vgrad(c, ['#bfe6ff', '#fff0f5']); hills(c, c.h * 0.7, '#a8e090', c.h * 0.03, 0.012, 0); blossomTree(c, c.w * 0.2, c.h * 0.72, c.h * 0.5); blossomTree(c, c.w * 0.8, c.h * 0.74, c.h * 0.45); fallingPetals(c, PETALS, '#ffc4d6', 0.5, 0.2); }],
    [1, (c) => { vgrad(c, ['#9fd8ff', '#fff0f5']); fluffyClouds(c, c.h * 0.18, 0.01); c.g.fillStyle = '#9ad884'; c.g.fillRect(0, c.h * 0.7, c.w, c.h); checker(c, c.h * 0.76); blossomTree(c, c.w * 0.12, c.h * 0.72, c.h * 0.55); fallingPetals(c, PETALS, '#ffb3c8', 0.9, 0.4); }],
    [2, (c) => { vgrad(c, ['#ffd9e6', '#fff6fa']); radialLines(c, 18, '#ffffff', 0.3 + 0.3 * c.pulse, c.t * 0.2, 0.1); for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + c.t * 0.4; sakura(c, c.w / 2 + Math.cos(a) * c.h * 0.32, c.h / 2 + Math.sin(a) * c.h * 0.28, c.h * (0.06 + 0.01 * c.pulse), a, '#ffb3c8', 0.95); } fallingPetals(c, PETALS, '#ff9fbd', 1.4, 0.5); }],
  ],
};

// ---- Lemon Soda: グラスのレモンソーダ。泡が上り、サビでレモンの輪切りが回る ----
function sodaGlass(c, x, y, w, h, fizz) {
  const g = c.g;
  g.fillStyle = 'rgba(255,240,140,0.55)'; g.fillRect(x - w / 2, y - h * 0.82, w, h * 0.82);
  g.strokeStyle = '#ffffffcc'; g.lineWidth = Math.max(1.5, c.h * 0.006); g.strokeRect(x - w / 2, y - h, w, h);
  for (let i = 0; i < 18; i++) { // 泡
    const yy = y - frac(hash1(i) + c.t * (0.15 + hash1(i + 9) * 0.2) * fizz) * h * 0.8, xx = x - w / 2 + w * (0.1 + 0.8 * hash1(i + 3));
    g.fillStyle = '#ffffffaa'; g.beginPath(); g.arc(xx, yy, 1 + hash1(i + 5) * 2.5, 0, TAU); g.fill();
  }
  lemonSlice(c, x + w * 0.42, y - h * 0.9, w * 0.32, c.t * 0.2);
}
function lemonSlice(c, x, y, r, rot) {
  const g = c.g; g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = '#ffe14f'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.fillStyle = '#fff6b0'; g.beginPath(); g.arc(0, 0, r * 0.86, 0, TAU); g.fill();
  g.fillStyle = '#ffe96a'; for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r * 0.78, i * TAU / 8 + 0.05, (i + 1) * TAU / 8 - 0.05); g.fill(); }
  g.restore();
}
function dots(c, col, alpha) {
  const g = c.g; g.fillStyle = col; g.globalAlpha = alpha;
  const s = c.h * 0.08;
  for (let y = 0; y < c.h + s; y += s) for (let x = (y / s) % 2 ? s / 2 : 0; x < c.w + s; x += s) { g.beginPath(); g.arc(x + frac(c.t * 0.05) * s, y, s * 0.12, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
}
const lemonSoda = {
  looks: [
    [0, (c) => { vgrad(c, ['#7fd8ff', '#e8fbff']); dots(c, '#ffffff', 0.35); sodaGlass(c, c.w / 2, c.h * 0.88, c.h * 0.32, c.h * 0.6, 0.7); }],
    [1, (c) => { vgrad(c, ['#ffe96a', '#fff8d0']); dots(c, '#ffffff', 0.5); sodaGlass(c, c.w * 0.35, c.h * 0.9, c.h * 0.28, c.h * 0.55, 1.2); sodaGlass(c, c.w * 0.68, c.h * 0.92, c.h * 0.24, c.h * 0.48, 1.4); }],
    [2, (c) => { vgrad(c, ['#5fd0ff', '#c8f2ff']); for (let i = 0; i < 9; i++) { const a = i * TAU / 9 + c.t * 0.5; lemonSlice(c, c.w / 2 + Math.cos(a) * c.h * 0.36, c.h / 2 + Math.sin(a) * c.h * 0.3, c.h * (0.07 + 0.015 * c.pulse), -c.t + i); } lemonSlice(c, c.w / 2, c.h / 2, c.h * (0.15 + 0.03 * c.pulse), c.t * 0.6); risingBubbles(c, 1.4, 0.5, 0.8); }],
  ],
};

// ---- Snow Globe: スノードームの中の小さな家。サビでドームをふって雪が舞う ----
function globe(c, cx, cy, R, shake) {
  const g = c.g;
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.clip();
  vgrad(c, ['#1a2a5a', '#3a5a9a']);
  g.fillStyle = '#f2f8ff'; g.beginPath(); g.ellipse(cx, cy + R * 0.75, R * 1.1, R * 0.35, 0, 0, TAU); g.fill();
  // 家
  g.fillStyle = '#c44a4a'; g.fillRect(cx - R * 0.22, cy + R * 0.18, R * 0.44, R * 0.36);
  g.fillStyle = '#5a2a2a'; g.beginPath(); g.moveTo(cx - R * 0.3, cy + R * 0.2); g.lineTo(cx, cy - R * 0.08); g.lineTo(cx + R * 0.3, cy + R * 0.2); g.fill();
  g.fillStyle = '#ffd27a'; g.fillRect(cx - R * 0.08, cy + R * 0.3, R * 0.12, R * 0.12);
  g.fillStyle = '#2f6a3a'; for (const s of [-0.55, 0.5]) { g.beginPath(); g.moveTo(cx + R * s, cy - R * 0.05); g.lineTo(cx + R * (s + 0.12), cy + R * 0.5); g.lineTo(cx + R * (s - 0.12), cy + R * 0.5); g.fill(); }
  g.fillStyle = '#fff';
  for (let i = 0; i < 60; i++) {
    const sp = 0.04 + hash1(i) * 0.06, y = frac(hash1(i + 1) + c.t * sp * (1 + shake * 3)), x = hash1(i + 2) + Math.sin(c.t * (1 + shake * 4) + i) * 0.05 * (1 + shake * 3);
    g.globalAlpha = 0.8; g.beginPath(); g.arc(cx + (x - 0.5) * R * 2, cy - R + y * R * 2, 1 + hash1(i + 3) * 1.6, 0, TAU); g.fill();
  }
  g.globalAlpha = 1; g.restore();
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = Math.max(1.5, R * 0.03); g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(cx - R * 0.25, cy - R * 0.25, R * 0.6, Math.PI * 1.05, Math.PI * 1.45); g.stroke();
  g.fillStyle = '#6a3a24'; g.fillRect(cx - R * 0.75, cy + R * 0.9, R * 1.5, R * 0.3);
}
const snowGlobe = {
  looks: [
    [0, (c) => { vgrad(c, ['#0a1024', '#1a2440']); snowfall(c, 0.4, 0.5); globe(c, c.w / 2, c.h * 0.45, c.h * 0.32, 0); }],
    [1, (c) => { vgrad(c, ['#0e1630', '#24345a']); twinkle(c, SKY, '#fff'); globe(c, c.w / 2 + Math.sin(c.t * 0.5) * c.w * 0.05, c.h * 0.45, c.h * 0.34, 0.3); snowfall(c, 0.6, 0.6); }],
    [2, (c) => { vgrad(c, ['#2a3a6a', '#6a8ac8']); radialLines(c, 16, '#ffffff', 0.15 + 0.25 * c.pulse, c.t * 0.2, 0.2); const sh = Math.sin(c.beat * Math.PI) * c.w * 0.015; globe(c, c.w / 2 + sh, c.h * 0.45, c.h * 0.36, 1); snowfall(c, 1.2, 0.8, 1.3); for (let i = 0; i < 5; i++) star5(c, c.w * (0.12 + i * 0.19), c.h * 0.12, c.h * 0.025 * (0.6 + c.pulse), '#fff6c8', 0.9, 0.6, c.t + i); }],
  ],
};

// ---- Bubble Bath: タイルのお風呂でアヒルがぷかぷか。シャボン玉 ----
function tiles(c, col, line) {
  const g = c.g; g.fillStyle = col; g.fillRect(0, 0, c.w, c.h);
  g.strokeStyle = line; g.lineWidth = 1; const s = c.h * 0.1;
  for (let x = 0; x < c.w; x += s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, c.h); g.stroke(); }
  for (let y = 0; y < c.h; y += s) { g.beginPath(); g.moveTo(0, y); g.lineTo(c.w, y); g.stroke(); }
}
function duck(c, x, y, s, tilt) {
  const g = c.g; g.save(); g.translate(x, y); g.rotate(tilt);
  g.fillStyle = '#ffd84a'; g.beginPath(); g.ellipse(0, 0, s, s * 0.6, 0, 0, TAU); g.fill();
  g.beginPath(); g.arc(s * 0.55, -s * 0.6, s * 0.42, 0, TAU); g.fill();
  g.fillStyle = '#ff8a3d'; g.beginPath(); g.moveTo(s * 0.9, -s * 0.62); g.lineTo(s * 1.25, -s * 0.52); g.lineTo(s * 0.9, -s * 0.45); g.fill();
  g.fillStyle = '#222'; g.beginPath(); g.arc(s * 0.65, -s * 0.72, s * 0.07, 0, TAU); g.fill();
  g.restore();
}
function tub(c, y) {
  const g = c.g; g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(c.w / 2, y, c.w * 0.45, c.h * 0.08, 0, 0, TAU); g.fill();
  g.fillStyle = '#8fd8ff'; g.beginPath(); g.ellipse(c.w / 2, y, c.w * 0.42, c.h * 0.06, 0, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.fillRect(c.w * 0.05, y, c.w * 0.9, c.h - y);
  for (let i = 0; i < 16; i++) bubble(c, c.w * (0.1 + i * 0.053), y - c.h * 0.02 - Math.sin(i * 2.1) * c.h * 0.02, c.h * (0.03 + 0.02 * hash1(i)), 0.9, '#ffffff');
}
const bubbleBath = {
  looks: [
    [0, (c) => { tiles(c, '#d6f4ff', '#b0e2f4'); bokeh(c, ['#ffffff', '#c8f0ff'], 0.3); tub(c, c.h * 0.72); duck(c, c.w * 0.45, c.h * 0.68 + Math.sin(c.t * 1.5) * c.h * 0.01, c.h * 0.07, Math.sin(c.t) * 0.1); }],
    [1, (c) => { tiles(c, '#c8eeff', '#a4dcef'); risingBubbles(c, 0.8, 0.8, 0.8); tub(c, c.h * 0.72); duck(c, c.w * (0.3 + 0.4 * (0.5 + 0.5 * Math.sin(c.t * 0.3))), c.h * 0.68 - bob(c, 0.5), c.h * 0.07, Math.sin(c.t * 1.3) * 0.15); }],
    [2, (c) => { vgrad(c, ['#9be8ff', '#e8fbff']); radialLines(c, 14, '#ffffff', 0.25 + 0.25 * c.pulse, c.t * 0.2, 0.15); risingBubbles(c, 1.6, 1.1, 0.9); for (let i = 0; i < 3; i++) duck(c, c.w * (0.25 + i * 0.25), c.h * 0.62 - bob(c) * (i % 2 ? 1 : 0.6), c.h * 0.08, Math.sin(c.t * 2 + i) * 0.2); }],
  ],
};

// ---- Sunny Parade: 青空の下のパレード。旗が並び、太鼓が進み、紙吹雪 ----
function bunting(c, y, sag, ph) {
  const g = c.g; const n = 14;
  g.strokeStyle = '#ffffffaa'; g.lineWidth = 1; g.beginPath();
  for (let i = 0; i <= n; i++) { const u = i / n, yy = y + Math.sin(u * Math.PI) * sag; i ? g.lineTo(u * c.w, yy) : g.moveTo(0, yy); } g.stroke();
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, yy = y + Math.sin(u * Math.PI) * sag, sw = Math.sin(c.t * 2 + i + ph) * 0.15;
    g.fillStyle = ['#ff5050', '#ffd84a', '#4fa3ff', '#6dff8a'][i % 4];
    g.save(); g.translate(u * c.w, yy); g.rotate(sw); g.beginPath(); g.moveTo(-c.w / n * 0.4, 0); g.lineTo(c.w / n * 0.4, 0); g.lineTo(0, c.h * 0.08); g.fill(); g.restore();
  }
}
function drummers(c, base, speed) {
  const g = c.g;
  for (let i = 0; i < 6; i++) {
    const x = frac(i / 6 + c.t * speed * 0.02) * (c.w * 1.2) - c.w * 0.1, step = Math.abs(Math.sin((c.beat + i * 0.5) * Math.PI)) * c.h * 0.015;
    g.fillStyle = '#c42a3a'; g.fillRect(x - c.h * 0.025, base - c.h * 0.2 - step, c.h * 0.05, c.h * 0.12);
    g.fillStyle = '#1a1a2a'; g.fillRect(x - c.h * 0.02, base - c.h * 0.08 - step, c.h * 0.015, c.h * 0.08); g.fillRect(x + c.h * 0.005, base - c.h * 0.08 + step * 0.5, c.h * 0.015, c.h * 0.08);
    g.fillStyle = '#ffe0c0'; g.beginPath(); g.arc(x, base - c.h * 0.23 - step, c.h * 0.025, 0, TAU); g.fill();
    g.fillStyle = '#1a1a2a'; g.fillRect(x - c.h * 0.022, base - c.h * 0.3 - step, c.h * 0.044, c.h * 0.05);
    g.fillStyle = '#ffd84a'; g.beginPath(); g.ellipse(x + c.h * 0.03, base - c.h * 0.12 - step, c.h * 0.035, c.h * 0.025, 0, 0, TAU); g.fill();
  }
}
const sunnyParade = {
  looks: [
    [0, (c) => { vgrad(c, ['#4fb4ff', '#c8ecff']); fluffyClouds(c, c.h * 0.25, 0.01); bunting(c, c.h * 0.05, c.h * 0.1, 0); c.g.fillStyle = '#e8d8b0'; c.g.fillRect(0, c.h * 0.8, c.w, c.h); }],
    [1, (c) => { vgrad(c, ['#3aa8ff', '#bfe8ff']); bunting(c, c.h * 0.04, c.h * 0.12, 0); bunting(c, c.h * 0.2, c.h * 0.08, 2); c.g.fillStyle = '#e8d8b0'; c.g.fillRect(0, c.h * 0.8, c.w, c.h); drummers(c, c.h * 0.82, 1); }],
    [2, (c) => { vgrad(c, ['#ffd84a', '#fff6c8']); radialLines(c, 20, '#ffffff', 0.25 + 0.3 * c.pulse, c.t * 0.25, 0.05); confetti(c); c.g.fillStyle = '#e8d8b0'; c.g.fillRect(0, c.h * 0.8, c.w, c.h); drummers(c, c.h * 0.82, 1.6); bunting(c, c.h * 0.05, c.h * 0.1, 1); }],
  ],
};

// ---- Toy Box March: おもちゃの兵隊が行進し、積み木が積み上がる ----
function soldier(c, x, base, s, step) {
  const g = c.g, lift = Math.abs(Math.sin(step * Math.PI)) * s * 0.15;
  g.fillStyle = '#1a2a6a'; g.fillRect(x - s * 0.18, base - s * 0.45 - lift, s * 0.14, s * 0.45); g.fillRect(x + s * 0.04, base - s * 0.45, s * 0.14, s * 0.45);
  g.fillStyle = '#e83a3a'; g.fillRect(x - s * 0.22, base - s * 1.05 - lift * 0.5, s * 0.44, s * 0.6);
  g.fillStyle = '#ffd84a'; g.fillRect(x - s * 0.22, base - s * 0.62 - lift * 0.5, s * 0.44, s * 0.06);
  g.fillStyle = '#ffd8b8'; g.beginPath(); g.arc(x, base - s * 1.18 - lift * 0.5, s * 0.15, 0, TAU); g.fill();
  g.fillStyle = '#111'; g.fillRect(x - s * 0.15, base - s * 1.6 - lift * 0.5, s * 0.3, s * 0.35);
  g.fillStyle = '#ff6b8a'; g.beginPath(); g.arc(x - s * 0.14, base - s * 1.18 - lift * 0.5, s * 0.04, 0, TAU); g.arc(x + s * 0.14, base - s * 1.18 - lift * 0.5, s * 0.04, 0, TAU); g.fill();
}
function blocks(c, n) {
  const g = c.g, s = c.h * 0.1;
  for (let i = 0; i < n; i++) {
    const col = i % 3, row = Math.floor(i / 3), x = c.w * 0.72 + (col - 1) * s * 1.05 + (row % 2) * s * 0.5, y = c.h * 0.86 - (row + 1) * s * 1.02;
    g.fillStyle = ['#ff6b6b', '#ffd84a', '#4fa3ff', '#6dff8a', '#c38bff'][i % 5]; g.fillRect(x - s / 2, y, s, s);
    text(c, 'ABCDE'[i % 5], x, y + s / 2, s * 0.6, '#ffffff', 0.9);
  }
}
const toyBoxMarch = {
  looks: [
    [0, (c) => { vgrad(c, ['#ffe2c8', '#fff4e8']); c.g.fillStyle = '#c8905a'; c.g.fillRect(0, c.h * 0.86, c.w, c.h); blocks(c, Math.min(12, 1 + Math.floor(c.lb / 4))); for (let i = 0; i < 3; i++) soldier(c, c.w * (0.12 + i * 0.13), c.h * 0.86, c.h * 0.22, c.beat + i * 0.5); }],
    [1, (c) => { vgrad(c, ['#ffd0a8', '#ffeedd']); c.g.fillStyle = '#b8804a'; c.g.fillRect(0, c.h * 0.86, c.w, c.h); for (let i = 0; i < 7; i++) soldier(c, frac(i / 7 + c.t * 0.03) * c.w * 1.1 - c.w * 0.05, c.h * 0.86, c.h * 0.22, c.beat + (i % 2) * 0.5); }],
    [2, (c) => { vgrad(c, ['#ff9a5c', '#ffe0c0']); radialLines(c, 18, '#fff3d6', 0.25 + 0.3 * c.pulse, c.t * 0.3, 0.1); blocks(c, 12); confetti(c); for (let i = 0; i < 5; i++) soldier(c, c.w * (0.08 + i * 0.12), c.h * 0.86 - Math.abs(Math.sin((c.beat + i * 0.25) * Math.PI)) * c.h * 0.04, c.h * 0.24, c.beat); c.g.fillStyle = '#b8804a'; c.g.fillRect(0, c.h * 0.86, c.w, c.h); }],
  ],
};

export default {
  'first-light': firstLight,
  'hello-lane': helloLane,
  'firefly-path': fireflyPath,
  'cotton-candy': cottonCandy,
  'cherry-picnic': cherryPicnic,
  'lemon-soda': lemonSoda,
  'snow-globe': snowGlobe,
  'bubble-bath': bubbleBath,
  'sunny-parade': sunnyParade,
  'toy-box-march': toyBoxMarch,
};

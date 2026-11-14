// オリジナル曲のMV(ミュージックビデオ)。プレイ画面の背景に流す(設定でON/OFF)。
// 曲ごとに「シーン」(拍の範囲と描き方)を並べる。曲の展開(イントロ・サビ・ブレイク…)に合わせて場面が変わり、
// 切り替わりの瞬間は白く光らせてカットが変わったように見せる。
// 描画は半分くらいの解像度の裏キャンバスに描いてから引き伸ばす(軽さ優先・少しにじんで背景らしくなる)。

const TAU = Math.PI * 2;
const frac = (x) => x - Math.floor(x);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}
// 固定の乱数表(毎フレーム同じ配置にするため、最初に1回だけ作る)
const table = (n, seed, f) => { const r = rng(seed); return Array.from({ length: n }, () => f(r)); };

// ---------------------------------------------------------------------------
// 共通の部品
// ---------------------------------------------------------------------------
function vgrad(c, stops) {
  const gr = c.g.createLinearGradient(0, 0, 0, c.h);
  stops.forEach((col, i) => gr.addColorStop(i / (stops.length - 1), col));
  c.g.fillStyle = gr;
  c.g.fillRect(0, 0, c.w, c.h);
}
function text(c, str, x, y, size, col, alpha = 1, { font = 'Orbitron', weight = 900, glow = 0, spacing = 0 } = {}) {
  const g = c.g;
  g.save();
  g.globalAlpha = clamp01(alpha);
  g.font = `${weight} ${size}px "${font}", "Noto Sans JP", sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (spacing) g.letterSpacing = spacing + 'px';
  g.fillStyle = col;
  if (glow) { g.shadowColor = col; g.shadowBlur = glow; }
  g.fillText(str, x, y);
  g.restore();
}
// 奥から飛んでくる星
function starfield(c, pts, speed, col, size = 2.2) {
  const g = c.g;
  g.fillStyle = col;
  for (const s of pts) {
    const z = 1 - frac(s.z + c.t * speed); // 1=奥 0=手前
    const k = 0.35 / (0.04 + z);
    const x = c.w / 2 + (s.x - 0.5) * c.w * k, y = c.h / 2 + (s.y - 0.5) * c.h * k;
    if (x < -4 || x > c.w + 4 || y < -4 || y > c.h + 4) continue;
    g.globalAlpha = clamp01((1 - z) * 1.4);
    const r = (1 - z) * size + 0.4;
    g.fillRect(x - r / 2, y - r / 2, r, r);
  }
  g.globalAlpha = 1;
}
// その場でまたたく星
function twinkle(c, pts, col, beatAmt = 0) {
  const g = c.g;
  g.fillStyle = col;
  for (const s of pts) {
    const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(c.t * s.sp + s.ph)) + beatAmt * c.pulse * s.big;
    g.globalAlpha = clamp01(a * s.vis);
    const r = s.r * (1 + beatAmt * c.pulse * s.big);
    g.fillRect(s.x * c.w - r / 2, s.y * c.h - r / 2, r, r);
  }
  g.globalAlpha = 1;
}
// 奥へ続く方眼の床(シンセウェーブ風)
function grid(c, horizon, col, speed, alpha = 1) {
  const g = c.g, hy = c.h * horizon;
  g.save();
  g.strokeStyle = col; g.lineWidth = 1.2;
  const n = 14, off = frac(c.t * speed);
  for (let i = 0; i < n; i++) {
    const d = (i + off) / n, y = hy + (c.h - hy) * d * d;
    g.globalAlpha = alpha * d;
    g.beginPath(); g.moveTo(0, y); g.lineTo(c.w, y); g.stroke();
  }
  g.globalAlpha = alpha * 0.8;
  for (let i = -12; i <= 12; i++) {
    g.beginPath(); g.moveTo(c.w / 2 + i * c.w * 0.02, hy); g.lineTo(c.w / 2 + i * c.w * 0.22, c.h); g.stroke();
  }
  g.restore();
}
// しましまの夕日
function retroSun(c, x, y, r, top, bottom, bg) {
  const g = c.g;
  const gr = g.createLinearGradient(0, y - r, 0, y + r);
  gr.addColorStop(0, top); gr.addColorStop(1, bottom);
  g.save();
  g.shadowColor = bottom; g.shadowBlur = r * 0.5;
  g.fillStyle = gr;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.restore();
  g.fillStyle = bg;
  for (let i = 0; i < 7; i++) {
    const yy = y + r * (0.05 + i * 0.14), hh = r * (0.02 + i * 0.016);
    g.fillRect(x - r - 2, yy, r * 2 + 4, hh);
  }
}
// ビルの影と窓
function skyline(c, blds, baseY, col, winCol, lit) {
  const g = c.g;
  g.fillStyle = col;
  for (const b of blds) g.fillRect(b.x * c.w, baseY - b.h * c.h, b.w * c.w, b.h * c.h + 2);
  g.fillStyle = winCol;
  for (const b of blds) {
    const cols = Math.max(1, Math.floor(b.w * c.w / 7)), rows = Math.floor(b.h * c.h / 9);
    for (let i = 0; i < cols; i++) for (let j = 1; j < rows; j++) {
      if (frac(Math.sin((i * 7.1 + j * 3.3 + b.s) * 12.9898) * 43758.5) > lit) continue;
      g.fillRect(b.x * c.w + 2 + i * 7, baseY - b.h * c.h + j * 9, 3, 4);
    }
  }
}
// 奥へ続く多角形のトンネル
function tunnel(c, sides, speed, col, { rot = 0, n = 14, lw = 2, alpha = 1, scale = 1 } = {}) {
  const g = c.g, cx = c.w / 2, cy = c.h / 2;
  g.save();
  g.strokeStyle = col;
  for (let i = 0; i < n; i++) {
    const z = 1 - frac(i / n + c.t * speed);
    const r = (0.06 / (0.02 + z * z)) * Math.min(c.w, c.h) * 0.12 * scale;
    if (r > c.w * 1.5) continue;
    g.globalAlpha = alpha * clamp01((1 - z) * 1.6);
    g.lineWidth = lw * (1.2 - z);
    g.beginPath();
    for (let k = 0; k <= sides; k++) {
      const a = rot + (k / sides) * TAU + z * 0.6;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (k) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.stroke();
  }
  g.restore();
}
// 点群の地形の上を飛ぶ(LiDARの見え方)
function pointTerrain(c, col, speed, amp, { horizon = 0.42, alpha = 1, rows = 26, colsN = 34 } = {}) {
  const g = c.g, hy = c.h * horizon;
  g.fillStyle = col;
  const off = frac(c.t * speed);
  for (let i = 0; i < rows; i++) {
    const d = (i + off) / rows; // 0=奥 1=手前
    const z = 1 - d, row = Math.floor(c.t * speed) - i;
    // 明るさは行ごとに同じなので、1行ぶんをまとめて1回で塗る(軽くするため)
    g.globalAlpha = alpha * clamp01(d * 1.3) * (0.5 + 0.5 * c.pulse * (1 - z));
    const r = 0.8 + d * 2.6;
    g.beginPath();
    for (let k = 0; k < colsN; k++) {
      const u = (k / (colsN - 1) - 0.5) * 2;
      const hgt = Math.sin(row * 0.35 + u * 3.1) * Math.cos(row * 0.17 - u * 1.7) * amp + Math.abs(u) * amp * 0.8;
      const y = hy + (c.h - hy) * d * d - hgt * d * c.h * 0.18;
      const x = c.w / 2 + u * c.w * (0.08 + d * 0.9);
      g.rect(x - r / 2, y - r / 2, r, r);
    }
    g.fill();
  }
  g.globalAlpha = 1;
}
// 回る点の球
function dotSphere(c, cx, cy, R, col, rot, alpha = 1) {
  const g = c.g;
  g.fillStyle = col;
  for (let i = 1; i < 12; i++) {
    const phi = (i / 12) * Math.PI;
    const n = Math.round(Math.sin(phi) * 26);
    for (let k = 0; k < n; k++) {
      const th = (k / n) * TAU + rot;
      const x = Math.sin(phi) * Math.cos(th), z = Math.sin(phi) * Math.sin(th), y = Math.cos(phi);
      const a = 0.25 + 0.75 * (z + 1) / 2;
      g.globalAlpha = alpha * a;
      const r = 1 + a * 1.6;
      g.fillRect(cx + x * R - r / 2, cy + y * R - r / 2, r, r);
    }
  }
  g.globalAlpha = 1;
}
// 花びら(5枚の桜)
function sakura(c, x, y, r, rot, col, alpha = 1) {
  const g = c.g;
  g.save();
  g.translate(x, y); g.rotate(rot);
  g.globalAlpha = alpha;
  g.fillStyle = col;
  for (let i = 0; i < 5; i++) {
    g.rotate(TAU / 5);
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(r * 0.5, -r * 0.25, r * 0.95, -r * 0.35, r, -r * 0.08);
    g.lineTo(r * 0.82, 0);
    g.lineTo(r, r * 0.08);
    g.bezierCurveTo(r * 0.95, r * 0.35, r * 0.5, r * 0.25, 0, 0);
    g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.8)';
  g.beginPath(); g.arc(0, 0, r * 0.12, 0, TAU); g.fill();
  g.restore();
}
function petal(c, x, y, s, rot, col, alpha) {
  const g = c.g;
  g.save();
  g.translate(x, y); g.rotate(rot); g.scale(1, 0.55 + 0.45 * Math.sin(rot * 2.3));
  g.globalAlpha = alpha;
  g.fillStyle = col;
  g.beginPath(); g.ellipse(0, 0, s, s * 0.6, 0, 0, TAU); g.fill();
  g.restore();
}
function fallingPetals(c, pts, col, speed = 1, wind = 0.15) {
  for (const p of pts) {
    const y = frac(p.y + c.t * 0.06 * speed * p.sp) * 1.2 - 0.1;
    const x = frac(p.x + c.t * 0.02 * wind * p.sp + Math.sin(c.t * p.sw + p.ph) * 0.03);
    petal(c, x * c.w, y * c.h, p.s, c.t * p.sw * 2 + p.ph, col, 0.85);
  }
}
// 鳥居
function torii(c, cx, base, s, col, alpha) {
  const g = c.g;
  g.save();
  g.globalAlpha = alpha;
  g.fillStyle = col;
  const w = s, h = s * 0.95;
  g.fillRect(cx - w * 0.36, base - h, w * 0.07, h); // 柱
  g.fillRect(cx + w * 0.29, base - h, w * 0.07, h);
  g.fillRect(cx - w * 0.44, base - h * 0.78, w * 0.88, w * 0.05); // 貫
  g.beginPath(); // 笠木(反り)
  g.moveTo(cx - w * 0.56, base - h * 0.98);
  g.quadraticCurveTo(cx, base - h * 0.88, cx + w * 0.56, base - h * 0.98);
  g.lineTo(cx + w * 0.5, base - h * 0.9);
  g.quadraticCurveTo(cx, base - h * 0.8, cx - w * 0.5, base - h * 0.9);
  g.fill();
  g.restore();
}
function moon(c, x, y, r, col, phase = 0) {
  const g = c.g;
  g.save();
  g.shadowColor = col; g.shadowBlur = r * 0.8;
  g.fillStyle = col;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.restore();
  if (phase) { // 三日月: 背景色で一部を隠す
    g.save();
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.arc(x + r * phase, y - r * 0.25, r * 0.92, 0, TAU); g.fill();
    g.restore();
  }
}
// 警告の斜めしま
function hazard(c, y, hh, col, speed) {
  const g = c.g;
  g.save();
  g.beginPath(); g.rect(0, y, c.w, hh); g.clip();
  g.fillStyle = '#000'; g.fillRect(0, y, c.w, hh);
  g.fillStyle = col;
  const step = hh * 1.6, off = frac(c.t * speed) * step;
  for (let x = -step * 2; x < c.w + step; x += step) {
    g.beginPath();
    g.moveTo(x + off, y + hh); g.lineTo(x + off + hh, y); g.lineTo(x + off + hh + step / 2, y); g.lineTo(x + off + step / 2, y + hh);
    g.fill();
  }
  g.restore();
}
// 画面を横に切ってずらす(グリッチ)
function glitch(c, amount, seed) {
  if (amount <= 0) return;
  const g = c.g, cv = g.canvas, r = rng(seed);
  const n = 3 + Math.floor(amount * 6);
  for (let i = 0; i < n; i++) {
    const y = r() * c.h, hh = 2 + r() * c.h * 0.08, dx = (r() - 0.5) * c.w * 0.12 * amount;
    g.drawImage(cv, 0, y * c.sx, cv.width, hh * c.sx, dx, y, c.w, hh);
  }
}
function radialLines(c, n, col, alpha, rot = 0, inner = 0.15) {
  const g = c.g, cx = c.w / 2, cy = c.h / 2, R = Math.hypot(c.w, c.h) / 2;
  g.save();
  g.strokeStyle = col; g.globalAlpha = alpha; g.lineWidth = 1.5;
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * R * inner, cy + Math.sin(a) * R * inner); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke();
  }
  g.restore();
}

// ---------------------------------------------------------------------------
// 各曲のMV
// ---------------------------------------------------------------------------
const STARS = table(220, 11, (r) => ({ x: r(), y: r(), z: r() }));
const SKY = table(150, 23, (r) => ({ x: r(), y: r() * 0.75, r: 0.8 + r() * 1.8, sp: 0.6 + r() * 2.4, ph: r() * TAU, big: r() < 0.15 ? 1.5 : 0.2, vis: 1 }));
const BLDS = (() => {
  const r = rng(31), out = [];
  for (let x = -0.02; x < 1.02;) { const w = 0.03 + r() * 0.06; out.push({ x, w, h: 0.12 + r() * 0.3, s: r() * 100 }); x += w + r() * 0.01; }
  return out;
})();
const PETALS = table(46, 47, (r) => ({ x: r(), y: r(), s: 2.2 + r() * 3.2, sp: 0.6 + r() * 0.9, sw: 0.5 + r() * 1.2, ph: r() * TAU }));
const LANTERNS = table(22, 59, (r) => ({ x: r(), y: r(), s: 0.6 + r() * 0.8, sp: 0.5 + r() * 0.8, ph: r() * TAU }));
const CONST = table(9, 71, (r) => ({ x: 0.15 + r() * 0.7, y: 0.12 + r() * 0.45 }));

// LiDAR Rush (DRUM & BASS 174): 計測ビームで世界をスキャンしながら突き進む
const lidarRush = {
  scenes: [
    { from: 0, to: 32, draw(c) { // 暗闇をレーダーのビームがなでて、点群が浮かび上がる
      vgrad(c, ['#010402', '#031008']);
      const a = -Math.PI / 2 + Math.sin(c.lb * Math.PI / 8) * 1.2;
      pointTerrain(c, '#9dff4f', 0.2, 0.6, { alpha: ease(c.lb / 12) * 0.8 });
      const g = c.g, cx = c.w / 2, cy = c.h * 1.02, R = c.h * 1.2;
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R);
      gr.addColorStop(0, 'rgba(157,255,79,0.35)'); gr.addColorStop(1, 'rgba(157,255,79,0)');
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a - 0.18, a + 0.02); g.fill();
      text(c, 'LiDAR RUSH', c.w / 2, c.h * 0.3, c.h * 0.11, '#d8ffc0', ease((c.lb - 8) / 6) * (1 - ease((c.lb - 28) / 4)), { glow: 16, spacing: 6 });
      text(c, 'SCANNING…', c.w / 2, c.h * 0.42, c.h * 0.035, '#9dff4f', (c.lb > 8 && c.lb < 28) ? 0.6 + 0.4 * c.pulse : 0, { weight: 600, spacing: 4 });
    } },
    { from: 32, to: 64, draw(c) { // 加速するトンネル
      vgrad(c, ['#020a04', '#000']);
      tunnel(c, 4, 0.25 + c.p * 1.2, '#9dff4f', { rot: Math.PI / 4, lw: 2.4 });
      starfield(c, STARS, 0.15 + c.p * 0.8, '#dfffd0');
      if (c.lb >= 24) { c.g.fillStyle = `rgba(157,255,79,${0.25 * c.pulse})`; c.g.fillRect(0, 0, c.w, c.h); }
    } },
    { from: 64, to: 128, draw(c) { // 点群の大地を低空で飛ぶ
      vgrad(c, ['#000', '#041407']);
      starfield(c, STARS, 0.08, '#9dff4f', 1.4);
      pointTerrain(c, '#9dff4f', 1.6, 1.1);
      const y = c.h * (0.45 + 0.55 * frac(c.beat / 4));
      c.g.fillStyle = 'rgba(200,255,170,0.35)'; c.g.fillRect(0, y, c.w, 2);
    } },
    { from: 128, to: 160, draw(c) { // ブレイク: 宇宙に浮かぶ点の球
      vgrad(c, ['#000206', '#02060a']);
      starfield(c, STARS, 0.03, '#cfe', 1.6);
      dotSphere(c, c.w / 2, c.h * 0.5, c.h * (0.3 + 0.02 * c.pulse), '#9dff4f', c.t * 0.25, 0.9);
    } },
    { from: 160, to: 192, draw(c) { // ふたたび加速、カウントダウン
      vgrad(c, ['#001014', '#000']);
      tunnel(c, 6, 0.3 + c.p * 1.4, '#4ff2ff', { rot: c.t * 0.3, lw: 2.2 });
      tunnel(c, 4, 0.2 + c.p, '#9dff4f', { rot: Math.PI / 4, n: 8, alpha: 0.6 });
      if (c.lb >= 28) text(c, String(32 - Math.floor(c.lb)), c.w / 2, c.h / 2, c.h * (0.3 + 0.1 * c.pulse), '#fff', 0.5 + 0.5 * c.pulse, { glow: 24 });
    } },
    { from: 192, to: 288, draw(c) { // ラストのドロップ: 大地とトンネルを16拍ごとに切り替え
      const alt = Math.floor(c.lb / 16) % 2;
      if (!alt) {
        vgrad(c, ['#000', '#06140a']);
        pointTerrain(c, '#c6ff7a', 2, 1.3);
        radialLines(c, 24, '#9dff4f', 0.12 + 0.2 * c.pulse, c.t * 0.2, 0.4);
      } else {
        vgrad(c, ['#00080a', '#000']);
        tunnel(c, 4, 1.4, '#9dff4f', { rot: Math.PI / 4 + c.t * 0.4, lw: 2.6 });
        tunnel(c, 4, 1.1, '#4ff2ff', { rot: -c.t * 0.4, n: 10, alpha: 0.7 });
        starfield(c, STARS, 0.9, '#fff');
      }
    } },
    { from: 288, to: 1e9, draw(c) { // おわり: 計測完了
      vgrad(c, ['#010402', '#031008']);
      pointTerrain(c, '#9dff4f', 0.25, 0.6, { alpha: 1 - ease((c.lb - 20) / 12) });
      text(c, 'SCAN COMPLETE', c.w / 2, c.h * 0.35, c.h * 0.08, '#d8ffc0', ease(c.lb / 4) * (1 - ease((c.lb - 28) / 6)), { glow: 16, spacing: 4 });
    } },
  ],
};

// Neon Highway (SYNTHWAVE 104): 夕日に向かって夜の高速を走る
const SYN_BG = ['#120326', '#3a0a4a', '#8a1d5c'];
const neonHighway = {
  scenes: [
    { from: 0, to: 16, draw(c) { // 夕日が昇る
      vgrad(c, SYN_BG);
      twinkle(c, SKY, '#fff');
      retroSun(c, c.w / 2, c.h * (0.85 - 0.25 * ease(c.lb / 12)), c.h * 0.22, '#ffe066', '#ff2f8a', '#3a0a4a');
      c.g.fillStyle = '#12021e'; c.g.fillRect(0, c.h * 0.6, c.w, c.h);
      grid(c, 0.6, '#ff4fd8', 0.3, ease(c.lb / 8));
      text(c, 'NEON HIGHWAY', c.w / 2, c.h * 0.22, c.h * 0.1, '#ffd6f0', ease((c.lb - 4) / 4) * (1 - ease((c.lb - 14) / 2)), { glow: 20, spacing: 5 });
    } },
    { from: 16, to: 48, draw(c) { // 山並みと方眼の道
      vgrad(c, SYN_BG);
      twinkle(c, SKY, '#fff');
      retroSun(c, c.w / 2, c.h * 0.55, c.h * 0.24, '#ffe066', '#ff2f8a', '#3a0a4a');
      const g = c.g;
      g.fillStyle = '#1d0533';
      g.beginPath(); g.moveTo(0, c.h * 0.6);
      for (let i = 0; i <= 20; i++) g.lineTo((i / 20) * c.w, c.h * 0.6 - Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * c.h * 0.16);
      g.lineTo(c.w, c.h * 0.6); g.fill();
      g.fillStyle = '#12021e'; g.fillRect(0, c.h * 0.6, c.w, c.h);
      grid(c, 0.6, '#ff4fd8', 0.9);
    } },
    { from: 48, to: 80, draw(c) { // サビ: ネオンの街、窓が拍で点く
      vgrad(c, ['#0b0220', '#2a0844', '#5c1260']);
      retroSun(c, c.w / 2, c.h * 0.5, c.h * 0.2, '#ffe066', '#ff2f8a', '#2a0844');
      skyline(c, BLDS, c.h * 0.62, '#0e0219', '#ffd36b', 0.25 + 0.35 * c.pulse);
      c.g.fillStyle = '#0b0118'; c.g.fillRect(0, c.h * 0.62, c.w, c.h);
      grid(c, 0.62, '#4ff2ff', 1.6);
    } },
    { from: 80, to: 112, draw(c) { // 2番: 道路の街灯が流れていく
      vgrad(c, ['#05010f', '#1a0530']);
      twinkle(c, SKY, '#fff');
      const g = c.g, hy = c.h * 0.55;
      g.fillStyle = '#0a0114'; g.fillRect(0, hy, c.w, c.h);
      g.fillStyle = '#1b0730';
      g.beginPath(); g.moveTo(c.w * 0.48, hy); g.lineTo(c.w * 0.52, hy); g.lineTo(c.w * 0.95, c.h); g.lineTo(c.w * 0.05, c.h); g.fill();
      for (let i = 0; i < 10; i++) { // 中央線
        const d = (i + frac(c.t * 1.2)) / 10, y = hy + (c.h - hy) * d * d;
        g.fillStyle = `rgba(255,220,120,${d})`; g.fillRect(c.w / 2 - 1 - d * 3, y, 2 + d * 6, 2 + d * 10);
      }
      for (let i = 0; i < 8; i++) { // 街灯
        const d = (i + frac(c.t * 0.9)) / 8, y = hy - d * d * c.h * 0.5;
        for (const sd of [-1, 1]) {
          const x = c.w / 2 + sd * (c.w * 0.04 + d * d * c.w * 0.6);
          const foot = hy + (c.h - hy) * d * d;
          g.strokeStyle = `rgba(60,40,90,${d})`; g.lineWidth = 0.5 + d * 2.5; // 柱
          g.beginPath(); g.moveTo(x, foot); g.lineTo(x, y); g.stroke();
          g.fillStyle = `rgba(79,242,255,${d})`;
          g.beginPath(); g.arc(x, y, 1 + d * 5, 0, TAU); g.fill();
        }
      }
      g.fillStyle = '#ff2f5a'; // 前を走る車のテールランプ
      const cx = c.w / 2 + Math.sin(c.t * 0.5) * c.w * 0.05, cy = c.h * 0.7;
      g.fillRect(cx - 22, cy, 9, 4); g.fillRect(cx + 13, cy, 9, 4);
    } },
    { from: 112, to: 128, draw(c) { // ブレイク: 大きな夕日をゆっくり
      vgrad(c, SYN_BG);
      twinkle(c, SKY, '#fff', 1);
      retroSun(c, c.w / 2, c.h * (0.62 - c.p * 0.08), c.h * (0.36 + c.p * 0.06), '#ffe066', '#ff2f8a', '#3a0a4a');
      c.g.fillStyle = '#12021e'; c.g.fillRect(0, c.h * 0.7, c.w, c.h);
      grid(c, 0.7, '#ff4fd8', 0.25, 0.7);
    } },
    { from: 128, to: 160, draw(c) { // ラストのサビ: 色が変わる街
      const hue = (c.lb * 12) % 360;
      vgrad(c, ['#0b0220', `hsl(${hue},60%,18%)`]);
      retroSun(c, c.w / 2, c.h * 0.5, c.h * (0.22 + 0.02 * c.pulse), '#ffe066', `hsl(${(hue + 300) % 360},90%,60%)`, `hsl(${hue},60%,16%)`);
      skyline(c, BLDS, c.h * 0.62, '#0e0219', '#ffd36b', 0.3 + 0.4 * c.pulse);
      c.g.fillStyle = '#0b0118'; c.g.fillRect(0, c.h * 0.62, c.w, c.h);
      grid(c, 0.62, `hsl(${(hue + 180) % 360},100%,65%)`, 1.8);
    } },
    { from: 160, to: 1e9, draw(c) { // おわり: 日が沈む
      vgrad(c, SYN_BG);
      twinkle(c, SKY, '#fff');
      retroSun(c, c.w / 2, c.h * (0.55 + 0.3 * ease(c.lb / 18)), c.h * 0.24, '#ffe066', '#ff2f8a', '#3a0a4a');
      c.g.fillStyle = '#12021e'; c.g.fillRect(0, c.h * 0.6, c.w, c.h);
      grid(c, 0.6, '#ff4fd8', 0.4 * (1 - ease(c.lb / 18)), 0.8);
    } },
  ],
};

// Hyper Sakura (J-CORE 175): 夜桜と鳥居をくぐり抜け、満開の万華鏡へ
const SAK_BG = ['#0d0420', '#2a0a3a', '#4a1240'];
const hyperSakura = {
  scenes: [
    { from: 0, to: 16, draw(c) { // 月夜の桜
      vgrad(c, SAK_BG);
      twinkle(c, SKY, '#fff');
      moon(c, c.w * 0.72, c.h * 0.28, c.h * 0.12, '#fff2f8');
      fallingPetals(c, PETALS, '#ffb6e6', 0.6);
      text(c, 'HYPER SAKURA', c.w / 2, c.h * 0.5, c.h * 0.1, '#ffe0f4', ease((c.lb - 2) / 4) * (1 - ease((c.lb - 13) / 3)), { glow: 20, spacing: 5 });
    } },
    { from: 16, to: 56, draw(c) { // 千本鳥居をくぐる
      vgrad(c, ['#12031c', '#3a0a2e']);
      const n = 9;
      for (let i = n - 1; i >= 0; i--) {
        const d = (i + 1 - frac(c.t * 0.5)) / n; // 1=奥
        const s = c.h * 0.25 / (0.15 + d);
        const a = clamp01((1 - d) * 1.5);
        torii(c, c.w / 2, c.h * 0.55 + s * 0.48, s, `rgba(${200 + 55 * (1 - d)},${40 + 20 * (1 - d)},${60},1)`, a);
      }
      fallingPetals(c, PETALS, '#ffc4ec', 1.2, 0.6);
    } },
    { from: 56, to: 64, draw(c) { // ため: 花びらが渦を巻く
      vgrad(c, SAK_BG);
      const g = c.g;
      for (const p of PETALS) {
        const a = p.ph + c.t * (1 + c.p * 5) * p.sp, r = (0.1 + p.y * 0.45) * c.h * (1 - c.p * 0.6);
        petal(c, c.w / 2 + Math.cos(a) * r, c.h / 2 + Math.sin(a) * r, p.s * 1.2, a, '#ffb6e6', 0.9);
      }
      g.fillStyle = `rgba(255,255,255,${c.p * c.p * 0.5})`; g.fillRect(0, 0, c.w, c.h);
    } },
    { from: 64, to: 128, draw(c) { // ドロップ: 桜の万華鏡
      vgrad(c, ['#1a0526', '#3d0b3a']);
      radialLines(c, 20, '#ff9de2', 0.18 + 0.25 * c.pulse, c.t * 0.3, 0.2);
      for (let ring = 0; ring < 3; ring++) {
        const n = 6 + ring * 4, R = c.h * (0.16 + ring * 0.16) * (1 + 0.06 * c.pulse);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + c.t * (ring % 2 ? -0.4 : 0.4);
          sakura(c, c.w / 2 + Math.cos(a) * R, c.h / 2 + Math.sin(a) * R, c.h * (0.05 + ring * 0.012), a + c.t, ring === 1 ? '#ffd6f0' : '#ff9de2', 0.9);
        }
      }
      sakura(c, c.w / 2, c.h / 2, c.h * (0.11 + 0.03 * c.pulse), c.t * 0.8, '#fff0fa');
    } },
    { from: 128, to: 144, draw(c) { // ブレイク: 静かな夜桜
      vgrad(c, SAK_BG);
      twinkle(c, SKY, '#fff', 0.6);
      moon(c, c.w * 0.5, c.h * 0.42, c.h * (0.2 + c.p * 0.04), '#fff2f8');
      fallingPetals(c, PETALS, '#ffb6e6', 0.4);
    } },
    { from: 144, to: 176, draw(c) { // ラスト: 鳥居と万華鏡が重なる
      vgrad(c, ['#12031c', '#3a0a2e']);
      for (let i = 8; i >= 0; i--) {
        const d = (i + 1 - frac(c.t * 0.9)) / 9, s = c.h * 0.25 / (0.15 + d);
        torii(c, c.w / 2, c.h * 0.55 + s * 0.48, s, '#e83a5a', clamp01((1 - d) * 1.5) * 0.8);
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + c.t * 0.6, R = c.h * 0.3 * (1 + 0.08 * c.pulse);
        sakura(c, c.w / 2 + Math.cos(a) * R, c.h / 2 + Math.sin(a) * R, c.h * 0.05, a, '#ffd6f0', 0.8);
      }
      fallingPetals(c, PETALS, '#ffc4ec', 1.6, 0.8);
    } },
    { from: 176, to: 1e9, draw(c) {
      vgrad(c, SAK_BG);
      moon(c, c.w * 0.5, c.h * 0.42, c.h * 0.22, '#fff2f8');
      fallingPetals(c, PETALS, '#ffb6e6', 0.3);
      c.g.fillStyle = `rgba(0,0,0,${ease(c.lb / 10)})`; c.g.fillRect(0, 0, c.w, c.h);
    } },
  ],
};

// Star Lullaby (MUSIC BOX 72): 星が灯り、星座をつなぎ、灯りが空へのぼっていく子守歌
const NIGHT = ['#030620', '#0a1640', '#1a2a5a'];
function cloudBand(c, y, col, speed, alpha) {
  const g = c.g;
  g.save(); g.globalAlpha = alpha; g.fillStyle = col;
  for (let i = 0; i < 7; i++) {
    const x = frac(i / 7 + c.t * speed) * (c.w + 200) - 100, r = c.h * (0.05 + (i % 3) * 0.02);
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.arc(x + r, y + r * 0.2, r * 0.8, 0, TAU); g.arc(x - r, y + r * 0.3, r * 0.7, 0, TAU); g.fill();
  }
  g.restore();
}
const starLullaby = {
  scenes: [
    { from: 0, to: 8, draw(c) { // 星がひとつずつ灯る
      vgrad(c, NIGHT);
      const g = c.g, shown = Math.floor(SKY.length * ease(c.lb / 8));
      g.fillStyle = '#fff8d8';
      for (let i = 0; i < shown; i++) { const s = SKY[i]; g.globalAlpha = 0.5 + 0.5 * Math.sin(c.t * s.sp + s.ph); g.fillRect(s.x * c.w, s.y * c.h, s.r, s.r); }
      g.globalAlpha = 1;
      text(c, 'Star Lullaby', c.w / 2, c.h * 0.45, c.h * 0.09, '#fff3b0', ease((c.lb - 1) / 3) * (1 - ease((c.lb - 6.5) / 1.5)), { font: 'Noto Sans JP', weight: 700, glow: 18 });
    } },
    { from: 8, to: 40, draw(c) { // 三日月がゆれる
      vgrad(c, NIGHT);
      twinkle(c, SKY, '#fff8d8', 0.8);
      moon(c, c.w * 0.5 + Math.sin(c.beat * Math.PI / 4) * c.w * 0.04, c.h * 0.32, c.h * 0.13, '#fff3b0', 0.45);
      cloudBand(c, c.h * 0.78, '#2a3a70', 0.01, 0.8);
    } },
    { from: 40, to: 72, draw(c) { // 星座を1本ずつつなぐ
      vgrad(c, NIGHT);
      twinkle(c, SKY, '#fff8d8', 0.5);
      const g = c.g, k = c.lb / 4;
      g.strokeStyle = '#fff3b0'; g.lineWidth = 1.4;
      for (let i = 0; i < CONST.length - 1; i++) {
        const a = CONST[i], b = CONST[i + 1], f = clamp01(k - i);
        if (f <= 0) break;
        g.globalAlpha = 0.7;
        g.beginPath(); g.moveTo(a.x * c.w, a.y * c.h); g.lineTo((a.x + (b.x - a.x) * f) * c.w, (a.y + (b.y - a.y) * f) * c.h); g.stroke();
      }
      g.globalAlpha = 1;
      for (let i = 0; i < CONST.length; i++) {
        const s = CONST[i], on = k >= i - 0.2;
        g.fillStyle = on ? '#fff' : 'rgba(255,255,255,0.3)';
        g.beginPath(); g.arc(s.x * c.w, s.y * c.h, on ? 3 + c.pulse * 2 : 2, 0, TAU); g.fill();
      }
      cloudBand(c, c.h * 0.82, '#2a3a70', 0.012, 0.8);
    } },
    { from: 72, to: 88, draw(c) { // 流れ星
      vgrad(c, NIGHT);
      twinkle(c, SKY, '#fff8d8');
      const g = c.g;
      for (let i = 0; i < 3; i++) {
        const f = frac((c.lb + i * 1.3) / 4);
        const x0 = c.w * (0.2 + i * 0.25), y0 = c.h * (0.08 + i * 0.07), x = x0 + f * c.w * 0.35, y = y0 + f * c.h * 0.25;
        const gr = g.createLinearGradient(x - c.w * 0.12, y - c.h * 0.085, x, y);
        gr.addColorStop(0, 'rgba(255,243,176,0)'); gr.addColorStop(1, `rgba(255,243,176,${1 - f})`);
        g.strokeStyle = gr; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x - c.w * 0.12, y - c.h * 0.085); g.lineTo(x, y); g.stroke();
      }
      moon(c, c.w * 0.8, c.h * 0.25, c.h * 0.08, '#fff3b0', 0.45);
    } },
    { from: 88, to: 120, draw(c) { // 灯りが空へのぼる
      vgrad(c, ['#060a28', '#14204e', '#3a2a50']);
      twinkle(c, SKY, '#fff8d8', 0.4);
      const g = c.g;
      for (const L of LANTERNS) {
        const y = 1.1 - frac(L.y + c.t * 0.025 * L.sp) * 1.25, x = L.x + Math.sin(c.t * 0.5 + L.ph) * 0.02;
        const s = c.h * 0.055 * L.s * (0.6 + 0.4 * y);
        g.save();
        g.shadowColor = '#ffb347'; g.shadowBlur = s * 2;
        g.fillStyle = '#ffcf7a';
        g.fillRect(x * c.w - s / 2, y * c.h - s * 0.7, s, s * 1.4);
        g.restore();
      }
      c.g.fillStyle = '#05081c'; // 遠くの丘
      g.beginPath(); g.moveTo(0, c.h);
      for (let i = 0; i <= 10; i++) g.lineTo((i / 10) * c.w, c.h * (0.86 - Math.sin(i * 0.9) * 0.04));
      g.lineTo(c.w, c.h); g.fill();
    } },
    { from: 120, to: 1e9, draw(c) { // おやすみ
      vgrad(c, NIGHT);
      twinkle(c, SKY, '#fff8d8');
      moon(c, c.w * 0.5, c.h * 0.35, c.h * 0.15, '#fff3b0', 0.45);
      text(c, 'おやすみ', c.w / 2, c.h * 0.62, c.h * 0.07, '#fff3b0', ease(c.lb / 2) * (1 - ease((c.lb - 8) / 3)), { font: 'Noto Sans JP', weight: 700, glow: 14 });
    } },
  ],
};

// Final Protocol (BOSS BATTLE 200): 警報、巨大な目、止まる時間。ラスボス戦
function bossEye(c, x, y, r, col, look) {
  const g = c.g;
  g.save();
  g.fillStyle = '#1a0006';
  g.beginPath(); g.ellipse(x, y, r * 1.6, r * 0.75, 0, 0, TAU); g.fill();
  g.strokeStyle = col; g.lineWidth = 3; g.shadowColor = col; g.shadowBlur = 18; g.stroke();
  g.beginPath(); g.ellipse(x, y, r * 1.6, r * 0.75, 0, 0, TAU); g.clip();
  const ix = x + Math.cos(look) * r * 0.5, iy = y + Math.sin(look * 1.3) * r * 0.2;
  g.fillStyle = col; g.beginPath(); g.arc(ix, iy, r * 0.55, 0, TAU); g.fill();
  g.fillStyle = '#000'; g.beginPath(); g.ellipse(ix, iy, r * 0.12, r * 0.45, 0, 0, TAU); g.fill();
  g.restore();
}
function ringSegments(c, r, n, col, rot, alpha, lw = 4) {
  const g = c.g;
  g.save(); g.strokeStyle = col; g.globalAlpha = alpha; g.lineWidth = lw;
  for (let i = 0; i < n; i++) { const a = rot + (i / n) * TAU; g.beginPath(); g.arc(c.w / 2, c.h / 2, r, a, a + (TAU / n) * 0.6); g.stroke(); }
  g.restore();
}
function hexGrid(c, col, alpha) {
  const g = c.g, s = c.h * 0.06;
  g.save(); g.strokeStyle = col; g.globalAlpha = alpha; g.lineWidth = 1;
  for (let y = 0, row = 0; y < c.h + s; y += s * 1.5, row++) for (let x = (row % 2) * s * 0.866; x < c.w + s; x += s * 1.732) {
    g.beginPath();
    for (let k = 0; k <= 6; k++) { const a = Math.PI / 6 + (k / 6) * TAU; const px = x + Math.cos(a) * s, py = y + Math.sin(a) * s; if (k) g.lineTo(px, py); else g.moveTo(px, py); }
    g.stroke();
  }
  g.restore();
}
const finalProtocol = {
  scenes: [
    { from: 0, to: 32, draw(c) { // 警報
      vgrad(c, ['#120004', '#2a0008']);
      hexGrid(c, '#ff3060', 0.15 + 0.15 * c.pulse);
      hazard(c, c.h * 0.08, c.h * 0.07, '#ff3060', 0.5);
      hazard(c, c.h * 0.85, c.h * 0.07, '#ff3060', -0.5);
      const blink = Math.floor(c.beat) % 2 === 0;
      text(c, 'WARNING', c.w / 2, c.h * 0.45, c.h * 0.15, '#ff3060', blink ? 1 : 0.25, { glow: 24, spacing: 8 });
      text(c, 'FINAL PROTOCOL', c.w / 2, c.h * 0.6, c.h * 0.05, '#ffb0c0', ease((c.lb - 16) / 4), { weight: 700, spacing: 6 });
    } },
    { from: 32, to: 64, draw(c) { // 巨大な目が開く
      vgrad(c, ['#0a0003', '#200008']);
      hexGrid(c, '#ff3060', 0.1);
      ringSegments(c, c.h * 0.42, 6, '#ff3060', c.t * 0.5, 0.6);
      ringSegments(c, c.h * 0.48, 10, '#ff8a3d', -c.t * 0.3, 0.4, 2);
      bossEye(c, c.w / 2, c.h / 2, c.h * 0.16 * (1 + 0.04 * c.pulse), '#ff3060', c.t * 0.8);
    } },
    { from: 64, to: 96, draw(c) { // スロー: 時間がゆっくり
      vgrad(c, ['#06040e', '#160818']);
      const tt = c.t * 0.3;
      ringSegments(c, c.h * 0.3, 4, '#8a6cff', tt, 0.7, 6);
      ringSegments(c, c.h * 0.4, 8, '#8a6cff', -tt * 0.6, 0.4, 3);
      starfield(c, STARS, 0.02, '#c8b8ff', 1.6);
      text(c, 'SLOW', c.w / 2, c.h / 2, c.h * 0.08, '#c8b8ff', 0.5, { spacing: 18 });
    } },
    { from: 96, to: 128, draw(c) { // 速弾き: 集中線と画面のずれ
      vgrad(c, ['#1a0006', '#000']);
      radialLines(c, 40, '#ff3060', 0.25 + 0.3 * c.pulse, c.t * 2, 0.25);
      starfield(c, STARS, 1.6, '#ffd0d8', 3);
      text(c, 'OVERDRIVE', c.w / 2, c.h / 2, c.h * 0.1, '#fff', 0.6 + 0.4 * c.pulse, { glow: 20, spacing: 6 });
      glitch(c, c.pulse, Math.floor(c.beat * 2));
    } },
    { from: 128, to: 160, draw(c) { // ストップ&ゴー: 4拍目で時間が止まる
      const stop = frac(c.lb / 4) >= 0.75;
      vgrad(c, stop ? ['#202020', '#080808'] : ['#120004', '#2a0008']);
      const frozenT = stop ? c.t - (frac(c.lb / 4) - 0.75) * 4 * (60 / c.bpm) : c.t;
      const cc = { ...c, t: frozenT };
      ringSegments(cc, c.h * 0.42, 6, stop ? '#888' : '#ff3060', frozenT * 1.2, 0.7);
      bossEye(cc, c.w / 2, c.h / 2, c.h * 0.15, stop ? '#aaa' : '#ff3060', frozenT * 1.5);
      if (stop) { text(c, 'STOP', c.w / 2, c.h * 0.82, c.h * 0.06, '#fff', 0.8, { spacing: 10 }); glitch(c, 0.6, Math.floor(c.lb)); }
    } },
    { from: 160, to: 224, draw(c) { // 総力戦: 目と光線
      vgrad(c, ['#0a0003', '#2a0008']);
      hexGrid(c, '#ff3060', 0.12 + 0.1 * c.pulse);
      const g = c.g;
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const a = c.t * (0.6 + i * 0.15) + i * 1.6;
        g.strokeStyle = i % 2 ? '#ff8a3d' : '#ff3060'; g.lineWidth = 2 + c.pulse * 3; g.globalAlpha = 0.5;
        g.beginPath(); g.moveTo(c.w / 2, c.h / 2); g.lineTo(c.w / 2 + Math.cos(a) * c.w, c.h / 2 + Math.sin(a) * c.w); g.stroke();
      }
      g.restore();
      ringSegments(c, c.h * 0.42, 8, '#ff3060', c.t, 0.7);
      bossEye(c, c.w / 2, c.h / 2, c.h * 0.17 * (1 + 0.06 * c.pulse), '#ff3060', c.t * 1.2);
      if (c.lb >= 62) glitch(c, 1, Math.floor(c.beat * 4));
    } },
    { from: 224, to: 256, draw(c) { // 最後の加速
      vgrad(c, ['#200008', '#000']);
      tunnel(c, 6, 0.3 + c.p * 2.2, '#ff3060', { rot: c.t * (0.5 + c.p * 2), lw: 2.6 });
      starfield(c, STARS, 0.2 + c.p * 2, '#ffd0d8', 2.6);
      if (c.lb < 4) text(c, 'FINAL', c.w / 2, c.h / 2, c.h * 0.16, '#fff', 1 - c.lb / 4, { glow: 24, spacing: 10 });
      c.g.fillStyle = `rgba(255,255,255,${Math.pow(c.p, 4) * 0.8})`; c.g.fillRect(0, 0, c.w, c.h);
    } },
    { from: 256, to: 1e9, draw(c) {
      vgrad(c, ['#120004', '#000']);
      hexGrid(c, '#ff3060', 0.15 * (1 - ease(c.lb / 12)));
      text(c, 'PROTOCOL COMPLETE', c.w / 2, c.h * 0.45, c.h * 0.06, '#ffb0c0', ease(c.lb / 2) * (1 - ease((c.lb - 10) / 4)), { weight: 700, spacing: 6 });
    } },
  ],
};

// Kawaii Bubble (KAWAII FUTURE BASS 160): パステルの空にシャボン玉。まんまるのキャラが跳ねて、ハートがはじける
const KW_BG = ['#ffd6ee', '#e6d4ff', '#c9e8ff'];
const BUBBLES = table(40, 83, (r) => ({ x: r(), y: r(), r: 0.025 + r() * 0.06, sp: 0.5 + r() * 0.9, sw: 0.4 + r() * 1.2, ph: r() * TAU }));
const KW_COLS = ['#ff8fcf', '#b18cff', '#7fd4ff', '#ffd36b', '#8ff0c4'];
function bubble(c, x, y, r, alpha = 1, tint = '#ffffff') {
  const g = c.g;
  g.save();
  g.globalAlpha = alpha;
  const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  gr.addColorStop(0, 'rgba(255,255,255,0.05)'); gr.addColorStop(0.8, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, tint);
  g.fillStyle = gr;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = Math.max(1, r * 0.06);
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.9)'; // 光の反射
  g.beginPath(); g.ellipse(x - r * 0.38, y - r * 0.42, r * 0.22, r * 0.12, -0.7, 0, TAU); g.fill();
  g.restore();
}
// はじけた瞬間の小さな線
function pop(c, x, y, r, k, col) {
  const g = c.g;
  g.save();
  g.strokeStyle = col; g.globalAlpha = 1 - k; g.lineWidth = 2; g.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU, r0 = r * (0.6 + k * 0.8), r1 = r * (0.9 + k * 1.1);
    g.beginPath(); g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); g.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1); g.stroke();
  }
  g.restore();
}
function risingBubbles(c, speed = 1, scale = 1, alpha = 1) {
  for (const b of BUBBLES) {
    const y = 1.15 - frac(b.y + c.t * 0.05 * speed * b.sp) * 1.3;
    const x = b.x + Math.sin(c.t * b.sw + b.ph) * 0.03;
    const r = b.r * c.h * scale * (1 + 0.08 * c.pulse);
    bubble(c, x * c.w, y * c.h, r, alpha, KW_COLS[Math.floor(b.ph * 10) % KW_COLS.length] + '66');
  }
}
function heart(c, x, y, s, col, alpha = 1) {
  const g = c.g;
  g.save();
  g.globalAlpha = alpha; g.fillStyle = col;
  g.beginPath();
  g.moveTo(x, y + s * 0.35);
  g.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.5, y - s * 1.05, x, y - s * 0.45);
  g.bezierCurveTo(x + s * 0.5, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
  g.fill();
  g.restore();
}
function sparkle(c, x, y, s, col, alpha = 1) {
  const g = c.g;
  g.save();
  g.globalAlpha = alpha; g.fillStyle = col;
  g.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU - Math.PI / 2, r = i % 2 ? s * 0.28 : s; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
  g.fill();
  g.restore();
}
// まんまるのキャラ(拍で跳ねて、着地でつぶれる)
function blob(c, x, base, r, col, phase = 0) {
  const g = c.g;
  const k = frac(c.beat + phase), jump = Math.sin(k * Math.PI) * r * 1.1;
  const squash = k < 0.12 ? 1 - (0.12 - k) * 2.2 : 1;
  const y = base - r * squash - jump;
  g.save();
  g.fillStyle = 'rgba(120,80,160,0.18)'; // 影
  g.beginPath(); g.ellipse(x, base + 2, r * (1 - jump / (r * 3)), r * 0.18, 0, 0, TAU); g.fill();
  g.translate(x, y); g.scale(1 / squash, squash);
  g.fillStyle = col;
  g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.beginPath(); g.ellipse(-r * 0.4, -r * 0.45, r * 0.25, r * 0.14, -0.6, 0, TAU); g.fill();
  g.fillStyle = '#3a2a4a'; // 目(ときどきまばたき)
  const blink = frac(c.t * 0.3 + phase) < 0.04;
  for (const sd of [-1, 1]) {
    if (blink) g.fillRect(sd * r * 0.32 - r * 0.1, -r * 0.05, r * 0.2, r * 0.05);
    else { g.beginPath(); g.arc(sd * r * 0.32, -r * 0.05, r * 0.1, 0, TAU); g.fill(); }
  }
  g.fillStyle = 'rgba(255,110,160,0.55)'; // ほっぺ
  for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * r * 0.55, r * 0.18, r * 0.14, r * 0.08, 0, 0, TAU); g.fill(); }
  g.strokeStyle = '#3a2a4a'; g.lineWidth = Math.max(1, r * 0.06); g.lineCap = 'round'; // 口
  g.beginPath(); g.arc(0, r * 0.12, r * 0.12, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  g.restore();
}
// 回るキャンディのうず(放射状のしま)
function candySwirl(c, cols, rot, alpha = 1) {
  const g = c.g, cx = c.w / 2, cy = c.h / 2, R = Math.hypot(c.w, c.h);
  g.save(); g.globalAlpha = alpha;
  const n = cols.length * 3;
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * TAU;
    g.fillStyle = cols[i % cols.length];
    g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a, a + TAU / n + 0.01); g.fill();
  }
  g.restore();
}
function fluffyClouds(c, y, speed) {
  const g = c.g;
  g.fillStyle = 'rgba(255,255,255,0.9)';
  for (let i = 0; i < 6; i++) {
    const x = frac(i / 6 + c.t * speed) * (c.w + c.h) - c.h * 0.5, r = c.h * (0.07 + (i % 3) * 0.02);
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.arc(x + r * 0.9, y + r * 0.15, r * 0.75, 0, TAU); g.arc(x - r * 0.9, y + r * 0.2, r * 0.7, 0, TAU); g.fill();
  }
}
const kawaiiBubble = {
  scenes: [
    { from: 0, to: 16, draw(c) { // パステルの空にシャボン玉がのぼっていく
      vgrad(c, KW_BG);
      fluffyClouds(c, c.h * 0.9, 0.01);
      risingBubbles(c, 0.7, 1, ease(c.lb / 4));
      const a = ease((c.lb - 2) / 3) * (1 - ease((c.lb - 13.5) / 2));
      text(c, 'Kawaii Bubble', c.w / 2, c.h * 0.42, c.h * 0.11, '#ff6fb8', a, { font: 'Noto Sans JP', weight: 700, glow: 10 });
      if (a > 0) { heart(c, c.w / 2 - c.h * 0.42, c.h * 0.42, c.h * 0.04, '#ff8fcf', a); heart(c, c.w / 2 + c.h * 0.42, c.h * 0.42, c.h * 0.04, '#b18cff', a); }
    } },
    { from: 16, to: 48, draw(c) { // まんまるキャラが拍で跳ねる
      vgrad(c, KW_BG);
      risingBubbles(c, 0.8, 0.8, 0.8);
      fluffyClouds(c, c.h * 0.86, 0.015);
      c.g.fillStyle = '#fff0f8'; c.g.fillRect(0, c.h * 0.86, c.w, c.h);
      blob(c, c.w * 0.5, c.h * 0.86, c.h * 0.13, '#ffb3e6');
      blob(c, c.w * 0.28, c.h * 0.86, c.h * 0.08, '#c9b3ff', 0.5);
      blob(c, c.w * 0.72, c.h * 0.86, c.h * 0.08, '#a8e2ff', 0.5);
      for (let i = 0; i < 5; i++) sparkle(c, c.w * (0.1 + i * 0.2), c.h * (0.15 + (i % 2) * 0.12), c.h * 0.025 * (0.6 + 0.6 * Math.max(0, Math.sin(c.t * 3 + i))), '#fff', 0.9);
    } },
    { from: 48, to: 64, draw(c) { // ため: シャボン玉が真ん中に集まる
      vgrad(c, ['#ffc4e6', '#d9c4ff']);
      for (const b of BUBBLES) {
        const a = b.ph + c.t * (0.5 + c.p * 3) * b.sp, r = (0.12 + b.y * 0.5) * c.h * (1 - c.p * 0.7);
        bubble(c, c.w / 2 + Math.cos(a) * r * 1.4, c.h / 2 + Math.sin(a) * r, b.r * c.h * 0.8, 0.9, KW_COLS[Math.floor(b.ph * 10) % 5] + '66');
      }
      heart(c, c.w / 2, c.h / 2 + c.h * 0.04, c.h * (0.05 + c.p * 0.08), '#ff6fb8', 0.9);
      if (c.lb >= 8) { c.g.fillStyle = `rgba(255,255,255,${0.35 * c.pulse})`; c.g.fillRect(0, 0, c.w, c.h); }
    } },
    { from: 64, to: 128, draw(c) { // ドロップ: ハートがはじける/みんなで跳ねる、を16拍ごとに
      const alt = Math.floor(c.lb / 16) % 2;
      if (!alt) {
        vgrad(c, ['#ffb8e0', '#d6b8ff']);
        const g = c.g;
        for (let i = 0; i < 5; i++) { // 拍ごとに広がる輪
          const k = frac(c.beat) + i, R = k * c.h * 0.22;
          g.strokeStyle = KW_COLS[(Math.floor(c.beat) + i) % 5]; g.globalAlpha = clamp01(1 - k / 5) * 0.8; g.lineWidth = 6;
          g.beginPath(); g.arc(c.w / 2, c.h / 2, R, 0, TAU); g.stroke();
        }
        g.globalAlpha = 1;
        risingBubbles(c, 1.6, 0.7, 0.85);
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU + c.t * 0.8, R = c.h * (0.3 + 0.04 * c.pulse);
          sparkle(c, c.w / 2 + Math.cos(a) * R * 1.3, c.h / 2 + Math.sin(a) * R, c.h * 0.03, '#fff', 0.9);
        }
        heart(c, c.w / 2, c.h / 2 + c.h * 0.05, c.h * (0.12 + 0.04 * c.pulse), '#ff4fa8');
      } else {
        vgrad(c, ['#c9e8ff', '#ffd6ee']);
        risingBubbles(c, 1.4, 0.7, 0.8);
        c.g.fillStyle = '#fff0f8'; c.g.fillRect(0, c.h * 0.8, c.w, c.h);
        for (let i = 0; i < 7; i++) blob(c, c.w * (0.08 + i * 0.14), c.h * 0.8, c.h * (i % 2 ? 0.07 : 0.09), ['#ffb3e6', '#c9b3ff', '#a8e2ff', '#ffe39b', '#b6f5d8'][i % 5], (i % 2) * 0.5);
        for (let i = 0; i < 6; i++) heart(c, c.w * (0.1 + i * 0.16), c.h * (0.2 + 0.05 * Math.sin(c.t * 2 + i)), c.h * 0.03, KW_COLS[i % 5], 0.8);
      }
    } },
    { from: 128, to: 144, draw(c) { // ブレイク: 大きなシャボン玉がふわふわ
      vgrad(c, ['#e6d4ff', '#c9e8ff']);
      risingBubbles(c, 0.3, 0.6, 0.6);
      const x = c.w / 2 + Math.sin(c.t * 0.6) * c.w * 0.05, y = c.h * 0.48 + Math.sin(c.t * 0.9) * c.h * 0.04, r = c.h * 0.26;
      const g = c.g; // 虹色の膜
      g.save(); g.globalAlpha = 0.35;
      const gr = g.createLinearGradient(x - r, y - r, x + r, y + r);
      KW_COLS.forEach((col, i) => gr.addColorStop(i / 4, col));
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.restore();
      bubble(c, x, y, r, 1);
      if (c.lb >= 8) blob(c, x, y + r * 0.45, r * 0.32, '#ffb3e6'); // 中にキャラ
    } },
    { from: 144, to: 176, draw(c) { // ラスト: キャンディのうずとハート
      candySwirl(c, ['#ffd6ee', '#e6d4ff', '#c9e8ff', '#fff2c4'], c.t * 0.4);
      risingBubbles(c, 1.8, 0.75, 0.9);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU - c.t * 0.9, R = c.h * 0.3;
        heart(c, c.w / 2 + Math.cos(a) * R * 1.4, c.h / 2 + Math.sin(a) * R, c.h * 0.04, KW_COLS[i % 5], 0.9);
      }
      heart(c, c.w / 2, c.h / 2 + c.h * 0.05, c.h * (0.13 + 0.05 * c.pulse), '#ff4fa8');
      blob(c, c.w / 2, c.h * 0.93, c.h * 0.07, '#ffb3e6');
    } },
    { from: 176, to: 1e9, draw(c) { // おわり: シャボン玉がひとつずつはじける
      vgrad(c, KW_BG);
      BUBBLES.slice(0, 16).forEach((b, i) => {
        const x = (0.1 + (i % 8) * 0.115) * c.w, y = (0.3 + Math.floor(i / 8) * 0.25) * c.h, r = c.h * 0.05;
        const k = (c.lb - i * 0.25) / 0.6;
        if (k < 0) bubble(c, x, y, r, 1, KW_COLS[i % 5] + '66');
        else if (k < 1) pop(c, x, y, r, k, KW_COLS[i % 5]);
      });
      text(c, '♡ THANK YOU ♡', c.w / 2, c.h * 0.82, c.h * 0.06, '#ff6fb8', ease((c.lb - 3) / 2), { weight: 800, spacing: 3 });
    } },
  ],
};

// ---------------------------------------------------------------------------
// Crimson Rumba(フラメンコ): ギターの飾り穴・扇と水玉・アーチの回廊・バラ・炎・アラベスク模様
// ---------------------------------------------------------------------------
const CR = { bg: ['#14020a', '#3d0713'], red: '#ff3d4f', deep: '#a3001b', gold: '#ffc857', cream: '#ffe8c2', ink: '#0b0105' };
const SPARKS = table(70, 211, (r) => ({ x: r(), y: r(), sp: 0.12 + r() * 0.3, wob: r() * TAU, s: 0.6 + r() * 1.6 }));
const ROSE_FALL = table(26, 223, (r) => ({ x: r(), y: r(), sp: 0.05 + r() * 0.07, rot: r() * TAU, rs: (r() - 0.5) * 2, s: 0.6 + r() * 0.8 }));

// 水玉(フラメンコの衣装の柄)。斜めにゆっくり流れる(2段で1周期なのでつなぎ目が出ない)
function lunares(c, col, size, speed, alpha = 1) {
  const g = c.g, step = size * 4.2, rowH = step * 0.866, k = frac(c.t * speed);
  const ox = k * step, oy = k * rowH * 2;
  g.fillStyle = col; g.globalAlpha = alpha;
  const r = size * (1 + 0.22 * c.pulse);
  for (let row = -3; row * rowH < c.h + step; row++) {
    const y = row * rowH + oy;
    for (let x = -step * 2; x < c.w + step; x += step) {
      g.beginPath(); g.arc(x + ox + (((row % 2) + 2) % 2) * step / 2, y, r, 0, TAU); g.fill();
    }
  }
  g.globalAlpha = 1;
}
// 扇(アバニコ)。open=0で閉じて 1で半円に開く
function fan(c, x, y, R, open, rot, colA, colB, alpha = 1) {
  const g = c.g, n = 14, span = Math.PI * (0.08 + 0.92 * clamp01(open)), a0 = -Math.PI / 2 - span / 2;
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = clamp01(alpha);
  for (let i = 0; i < n; i++) {
    const s = a0 + span * i / n, e = s + span / n;
    g.fillStyle = i % 2 ? colA : colB;
    g.beginPath(); g.arc(0, 0, R, s, e); g.arc(0, 0, R * 0.2, e, s, true); g.closePath(); g.fill();
  }
  g.fillStyle = CR.cream; // レースのふち
  for (let i = 0; i <= n * 2; i++) { const a = a0 + span * i / (n * 2); g.beginPath(); g.arc(Math.cos(a) * R, Math.sin(a) * R, R * 0.035, 0, TAU); g.fill(); }
  g.strokeStyle = CR.ink; g.lineWidth = Math.max(1, R * 0.014); // 骨
  for (let i = 0; i <= n; i++) { const a = a0 + span * i / n; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R * 0.97, Math.sin(a) * R * 0.97); g.stroke(); }
  g.fillStyle = CR.gold; g.beginPath(); g.arc(0, 0, R * 0.07, 0, TAU); g.fill();
  g.restore();
}
// ギターの飾り穴(ロゼッタ): 小さなタイルを同心円に並べる
function rosette(c, x, y, R, rot, glow = 0) {
  const g = c.g;
  g.save(); g.translate(x, y);
  g.fillStyle = CR.ink; g.beginPath(); g.arc(0, 0, R * 0.62, 0, TAU); g.fill();
  const rings = [[0.66, 40, CR.gold, CR.deep], [0.74, 48, CR.cream, CR.red], [0.82, 56, CR.deep, CR.gold], [0.9, 64, CR.red, CR.cream]];
  rings.forEach(([rr, n, a, b], j) => {
    for (let i = 0; i < n; i++) {
      const ang = rot * (j % 2 ? -1 : 1) + i * TAU / n;
      g.fillStyle = (i + j) % 2 ? a : b;
      g.globalAlpha = 0.75 + 0.25 * glow;
      g.save(); g.rotate(ang); g.fillRect(R * rr, -R * 0.03, R * 0.07, R * 0.06); g.restore();
    }
  });
  g.globalAlpha = 1;
  g.strokeStyle = CR.gold; g.lineWidth = Math.max(1, R * 0.015);
  for (const rr of [0.64, 0.98]) { g.beginPath(); g.arc(0, 0, R * rr, 0, TAU); g.stroke(); }
  g.restore();
}
// ろうそく
function candle(c, x, base, s, ph) {
  const g = c.g, fl = 1 + 0.18 * Math.sin(c.t * 11 + ph) + 0.1 * Math.sin(c.t * 23 + ph * 2);
  g.fillStyle = CR.cream; g.fillRect(x - s * 0.12, base - s, s * 0.24, s);
  const fy = base - s - s * 0.22 * fl;
  const gr = g.createRadialGradient(x, fy, 0, x, fy, s * 0.9);
  gr.addColorStop(0, 'rgba(255,200,87,0.45)'); gr.addColorStop(1, 'rgba(255,61,79,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, fy, s * 0.9, 0, TAU); g.fill();
  g.fillStyle = CR.gold;
  g.beginPath(); g.moveTo(x, fy - s * 0.25 * fl); g.quadraticCurveTo(x + s * 0.11, fy + s * 0.05, x, fy + s * 0.14); g.quadraticCurveTo(x - s * 0.11, fy + s * 0.05, x, fy - s * 0.25 * fl); g.fill();
}
// ムーア風の馬蹄形アーチが奥から近づいてくる回廊
function arcade(c, speed, col) {
  const g = c.g, n = 9, off = frac(c.t * speed), hy = c.h * 0.5;
  g.save(); g.lineCap = 'round';
  for (let i = n - 1; i >= 0; i--) {
    const d = (i + 1 - off) / n, k = 0.2 / d;
    const a = clamp01((1 - d) * 1.6) * clamp01((d - 0.03) * 7);
    if (a <= 0) continue;
    const w = c.w * 0.42 * k, base = hy + c.h * 0.42 * k, top = base - c.h * 0.8 * k;
    const r = (w / 2) * 1.16, cy = top + r, aL = Math.acos(-w / (2 * r)), aR = Math.acos(w / (2 * r));
    g.globalAlpha = a; g.strokeStyle = col; g.lineWidth = 0.6 + 3.2 * k;
    g.beginPath(); g.moveTo(c.w / 2 - w / 2, base); g.lineTo(c.w / 2 - w / 2, cy + Math.sin(aL) * r);
    g.arc(c.w / 2, cy, r, aL, aR); g.lineTo(c.w / 2 + w / 2, base); g.stroke();
    // ちょうちん(拍で明るくなる)
    const lx = c.w / 2 + Math.sin(c.t * 1.6 + i) * w * 0.05, ly = top + r * 0.55;
    g.fillStyle = CR.gold; g.shadowColor = CR.gold; g.shadowBlur = 6 + 10 * c.pulse;
    g.beginPath(); g.arc(lx, ly, Math.max(1, c.h * 0.012 * k * (1 + 0.3 * c.pulse)), 0, TAU); g.fill();
    g.shadowBlur = 0;
  }
  g.restore();
}
// バラ: 花びらをらせん状に重ねる。bloom=0でつぼみ 1で満開
function rose(c, x, y, R, bloom, rot, alpha = 1) {
  const g = c.g, N = 36, b = clamp01(bloom);
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = clamp01(alpha);
  for (let k = N - 1; k >= 0; k--) { // 外側から描いて内側を上に重ねる
    const u = k / N, ang = k * 2.39996;
    const r = R * (0.08 + 0.62 * Math.sqrt(u)) * (0.3 + 0.7 * b);
    const ps = R * (0.2 + 0.28 * u) * (0.45 + 0.55 * b);
    g.fillStyle = `hsl(352,85%,${16 + u * 34}%)`;
    g.strokeStyle = `hsl(350,90%,${8 + u * 14}%)`; g.lineWidth = Math.max(0.8, R * 0.012);
    g.beginPath(); g.ellipse(Math.cos(ang) * r, Math.sin(ang) * r, ps, ps * 0.66, ang, 0, TAU); g.fill(); g.stroke();
  }
  g.restore();
}
function fallingRose(c, speed = 1, alpha = 1) {
  const g = c.g;
  for (const p of ROSE_FALL) {
    const y = frac(p.y + c.t * p.sp * speed), x = p.x + Math.sin(c.t * 0.8 + p.rot) * 0.04;
    const s = c.h * 0.018 * p.s;
    g.save(); g.translate(x * c.w, y * c.h); g.rotate(p.rot + c.t * p.rs); g.globalAlpha = alpha * 0.85;
    g.fillStyle = CR.red; g.beginPath(); g.ellipse(0, 0, s, s * 0.6, 0, 0, TAU); g.fill();
    g.fillStyle = CR.deep; g.beginPath(); g.ellipse(-s * 0.3, 0, s * 0.45, s * 0.3, 0, 0, TAU); g.fill();
    g.restore();
  }
}
// 炎: 3色を重ね、波の足し合わせでゆらす
function flames(c, base, hgt, alpha = 1) {
  const g = c.g;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const [col, hk, sp] of [[CR.deep, 1, 0.9], [CR.red, 0.72, 1.3], [CR.gold, 0.42, 1.8]]) {
    const gr = g.createLinearGradient(0, base - hgt * hk * 1.3, 0, base);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, col);
    g.fillStyle = gr; g.globalAlpha = alpha * 0.85;
    g.beginPath(); g.moveTo(0, c.h);
    const N = 54;
    for (let i = 0; i <= N; i++) {
      const u = (i / N) * 9;
      const v = 0.55 + 0.22 * Math.sin(u * 1.7 + c.t * sp * 3) + 0.15 * Math.sin(u * 3.9 - c.t * sp * 5) + 0.1 * Math.sin(u * 7.3 + c.t * sp * 7);
      g.lineTo(c.w * i / N, base - hgt * hk * v * (1 + 0.35 * c.pulse) * (i % 2 ? 0.7 : 1));
    }
    g.lineTo(c.w, c.h); g.closePath(); g.fill();
  }
  g.restore();
}
function sparks(c, col, speed = 1) {
  const g = c.g;
  g.fillStyle = col;
  for (const p of SPARKS) {
    const y = 1 - frac(p.y + c.t * p.sp * speed), x = p.x + Math.sin(c.t * 2 + p.wob) * 0.02;
    g.globalAlpha = clamp01(y * 1.6) * 0.9;
    const s = p.s * c.h / 320;
    g.fillRect(x * c.w - s / 2, y * c.h - s / 2, s, s);
  }
  g.globalAlpha = 1;
}
// アラベスク: 8つの角の星を同心円に並べ、輪ごとに逆向きに回す
function star8(g, x, y, r, rot) {
  g.beginPath();
  for (let i = 0; i < 16; i++) { const a = rot + i * Math.PI / 8, rr = i % 2 ? r * 0.55 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill(); g.stroke();
}
function arabesque(c, rot, zoom, alpha = 1) {
  const g = c.g, cx = c.w / 2, cy = c.h / 2, U = c.h * 0.12 * zoom;
  g.save(); g.globalAlpha = clamp01(alpha); g.strokeStyle = CR.gold; g.lineWidth = Math.max(1, U * 0.05);
  for (let j = 6; j >= 0; j--) {
    const n = j ? j * 8 : 1, R = j * U, dir = j % 2 ? 1 : -1;
    for (let i = 0; i < n; i++) {
      const a = dir * rot + i * TAU / n;
      g.fillStyle = [CR.deep, '#5a0a18', CR.ink, CR.red][(i + j) % 4];
      star8(g, cx + Math.cos(a) * R, cy + Math.sin(a) * R, U * (j ? 0.42 : 0.7) * (1 + 0.15 * c.pulse), a);
    }
  }
  g.restore();
}
function ole(c, x, y, size, k) { // 「¡OLÉ!」が拍でポンと出る(k=0→1で表示→消える)
  if (k <= 0 || k >= 1) return;
  const s = 1 + 0.4 * (1 - ease(k * 4));
  text(c, '¡OLÉ!', x, y, size * s, CR.gold, 1 - ease((k - 0.6) / 0.4), { font: 'Georgia', weight: 'italic 700', glow: 14 });
}

const crimsonRumba = {
  scenes: [
    { from: 0, to: 32, draw(c) { // ギターの飾り穴が回り、ろうそくがゆれる。曲名
      vgrad(c, CR.bg);
      const spot = c.g.createRadialGradient(c.w / 2, c.h * 0.45, 0, c.w / 2, c.h * 0.45, c.h * 0.7);
      spot.addColorStop(0, 'rgba(255,61,79,0.25)'); spot.addColorStop(1, 'rgba(0,0,0,0)');
      c.g.fillStyle = spot; c.g.fillRect(0, 0, c.w, c.h);
      rosette(c, c.w / 2, c.h * 0.45, c.h * (0.32 + 0.02 * c.pulse), c.t * 0.15, c.pulse);
      for (let i = 0; i < 7; i++) candle(c, c.w * (0.08 + i * 0.14), c.h * 0.98, c.h * (0.1 + (i % 3) * 0.03), i * 1.7);
      const a = ease((c.lb - 4) / 3) * (1 - ease((c.lb - 28) / 3));
      text(c, 'Crimson Rumba', c.w / 2, c.h * 0.45, c.h * 0.1, CR.cream, a, { font: 'Georgia', weight: 'italic 700', glow: 16 });
      text(c, 'FLAMENCO', c.w / 2, c.h * 0.56, c.h * 0.035, CR.gold, a, { weight: 700, spacing: 8 });
    } },
    { from: 32, to: 64, draw(c) { // 水玉の上で3つの扇が開いたり閉じたり
      vgrad(c, ['#7a0414', '#c2112a']);
      lunares(c, 'rgba(255,232,194,0.85)', c.h * 0.03, 0.05);
      const sw = Math.sin(c.beat * Math.PI / 2);
      fan(c, c.w / 2, c.h * 0.78, c.h * 0.48, 0.65 + 0.35 * sw, Math.sin(c.t * 0.9) * 0.08, CR.ink, CR.deep);
      fan(c, c.w * 0.18, c.h * 0.85, c.h * 0.3, 0.65 - 0.35 * sw, -0.35, CR.gold, CR.ink);
      fan(c, c.w * 0.82, c.h * 0.85, c.h * 0.3, 0.65 - 0.35 * sw, 0.35, CR.gold, CR.ink);
    } },
    { from: 64, to: 96, draw(c) { // 夜のアーチの回廊を進む
      vgrad(c, ['#05010a', '#2a0612', '#14020a']);
      moon(c, c.w * 0.8, c.h * 0.18, c.h * 0.07, '#ffe8c2');
      const fl = c.g.createLinearGradient(0, c.h * 0.5, 0, c.h);
      fl.addColorStop(0, 'rgba(163,0,27,0)'); fl.addColorStop(1, 'rgba(163,0,27,0.45)');
      c.g.fillStyle = fl; c.g.fillRect(0, c.h * 0.5, c.w, c.h * 0.5);
      arcade(c, 0.22, CR.gold);
      fallingRose(c, 0.6, 0.5);
    } },
    { from: 96, to: 128, draw(c) { // ギターの独奏: 暗闇でバラが咲いていく
      vgrad(c, ['#0a0005', '#1e030b']);
      fallingRose(c, 0.8, 0.7);
      rose(c, c.w / 2, c.h * 0.5, c.h * (0.3 + 0.03 * c.pulse), ease(c.p * 1.15), c.t * 0.1);
      if (c.lb >= 24) { c.g.fillStyle = `rgba(255,61,79,${0.3 * c.pulse})`; c.g.fillRect(0, 0, c.w, c.h); }
    } },
    { from: 128, to: 160, draw(c) { // サビ: 炎の前で大きな扇が回る。¡OLÉ!
      vgrad(c, ['#0b0105', '#4a0814']);
      flames(c, c.h, c.h * 0.55);
      sparks(c, CR.gold, 1.4);
      fan(c, c.w / 2, c.h * 0.5, c.h * (0.36 + 0.03 * c.pulse), 1, c.beat * Math.PI / 8, CR.ink, CR.deep);
      fan(c, c.w / 2, c.h * 0.5, c.h * 0.36, 1, c.beat * Math.PI / 8 + Math.PI, CR.ink, CR.red, 0.95);
      ole(c, c.w / 2, c.h * 0.5, c.h * 0.13, (c.lb % 8 - 6) / 2);
    } },
    { from: 160, to: 192, draw(c) { // サビ後半: アラベスク模様の万華鏡と、まわりを回る扇
      vgrad(c, ['#14020a', '#2a0410']);
      arabesque(c, c.t * 0.25, 1 + 0.06 * c.pulse, 0.75);
      const vg = c.g.createRadialGradient(c.w / 2, c.h / 2, 0, c.w / 2, c.h / 2, c.h * 0.3); // 真ん中を暗くして文字を読みやすく
      vg.addColorStop(0, 'rgba(11,1,5,0.85)'); vg.addColorStop(1, 'rgba(11,1,5,0)');
      c.g.fillStyle = vg; c.g.fillRect(0, 0, c.w, c.h);
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + c.t * 0.5;
        fan(c, c.w / 2 + Math.cos(a) * c.h * 0.36, c.h / 2 + Math.sin(a) * c.h * 0.36, c.h * 0.12, 1, a + Math.PI / 2, CR.red, CR.ink);
      }
      flames(c, c.h, c.h * 0.22, 0.8);
      ole(c, c.w / 2, c.h * 0.5, c.h * 0.11, (c.lb % 16 - 14) / 2);
    } },
    { from: 192, to: 1e9, draw(c) { // 締め: 満開のバラと曲名
      vgrad(c, CR.bg);
      fallingRose(c, 0.5, 0.8);
      rose(c, c.w / 2, c.h * 0.44, c.h * 0.26, 1, c.t * 0.05, 1 - ease((c.lb - 6) / 3) * 0.6);
      ole(c, c.w / 2, c.h * 0.44, c.h * 0.16, c.lb / 3);
      text(c, 'Crimson Rumba', c.w / 2, c.h * 0.84, c.h * 0.07, CR.cream, ease((c.lb - 2) / 2), { font: 'Georgia', weight: 'italic 700', glow: 12 });
    } },
  ],
};

const MVS = {
  'lidar-rush': lidarRush,
  'neon-highway': neonHighway,
  'hyper-sakura': hyperSakura,
  'star-lullaby': starLullaby,
  'final-protocol': finalProtocol,
  'kawaii-bubble': kawaiiBubble,
  'crimson-rumba': crimsonRumba,
};
export const hasMV = (id) => !!MVS[id]; // 手作りのMVがあるか(曲リストの MV マーク用)

// ---------------------------------------------------------------------------
// 再生
// ---------------------------------------------------------------------------
// opts.scale / opts.maxW: 裏キャンバスの解像度(動画の書き出しでは高めにする)
// auto: 手作りのMVがない曲用の情報 { title, genre, color, sections }(あれば自動MVを作る)
export function createMV(id, bpm, offset = 0, { scale = 0.5, maxW = 800 } = {}, auto = null) {
  const def = MVS[id] || (auto ? autoDef(auto) : null);
  if (!def) return null;
  const cv = document.createElement('canvas');
  const og = cv.getContext('2d');
  const spb = 60 / bpm;
  return {
    // g に W×H で描く。t は曲の時刻(秒)
    draw(g, W, H, t) {
      // 裏キャンバスは画面の約半分(最大 800px 幅)
      const sx = Math.min(scale, maxW / Math.max(1, W));
      const w = Math.max(160, Math.round(W * sx)), h = Math.max(90, Math.round(H * sx));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      const beat = Math.max(0, (t - offset) / spb);
      const sc = def.scenes.find((s) => beat < s.to) || def.scenes[def.scenes.length - 1];
      const lb = beat - sc.from;
      const c = {
        g: og, w, h, sx: 1, t, beat, lb, bpm,
        p: clamp01(lb / Math.max(1, Math.min(sc.to, 1e6) - sc.from)),
        pulse: Math.exp(-frac(beat) * 5), // 拍の頭で1、すぐに0へ
      };
      og.setTransform(1, 0, 0, 1, 0, 0);
      og.globalAlpha = 1; og.globalCompositeOperation = 'source-over'; og.shadowBlur = 0;
      sc.draw(c);
      // 場面の切り替わりで白く光る(最初の場面は除く)
      if (sc.from > 0 && lb < 1.5) { og.fillStyle = `rgba(255,255,255,${0.55 * (1 - lb / 1.5) ** 2})`; og.fillRect(0, 0, w, h); }
      g.save();
      g.imageSmoothingEnabled = true;
      g.drawImage(cv, 0, 0, W, H);
      g.restore();
    },
  };
}

// ---------------------------------------------------------------------------
// 自動MV: 手作りのMVがない曲は、ジャンルからテーマを選び、曲の構成から場面を組み立てる
//  - 場面の切り替え: 曲の中のクラッシュ(シンバル)の拍
//  - 落ち着いた場面/盛り上がる場面: 区間ごとの音の多さ(0=静か 1=ふつう 2=サビ)
//  - 色: 曲のテーマカラー
// ---------------------------------------------------------------------------
const QUIET = new Set(['pad', 'riser', 'downer', 'crash']);
// 曲のイベント列 → [{ from, to, lvl }](拍)
export function analyzeSections(events, bpm, duration) {
  const end = Math.ceil(duration * bpm / 60);
  let cuts = [...new Set(events.filter((e) => e.type === 'crash').map((e) => Math.round(e.beat)))].sort((a, b) => a - b);
  const pts = [0];
  for (const b of cuts) if (b - pts[pts.length - 1] >= 8 && end - b >= 6) pts.push(b);
  // 区切りが少ない曲は32拍ごとに割る
  const out = [];
  pts.push(end);
  for (let i = 0; i < pts.length - 1; i++) {
    let a = pts[i];
    const b = pts[i + 1];
    while (b - a > 48) { out.push([a, a + 32]); a += 32; }
    out.push([a, b]);
  }
  const en = out.map(([a, b]) => {
    let s = 0;
    for (const e of events) if (!QUIET.has(e.type) && e.beat >= a && e.beat < b) s += e.vel ?? 1;
    return s / Math.max(1, b - a);
  });
  const mx = Math.max(...en, 1e-6);
  return out.map(([from, to], i) => ({ from, to, lvl: en[i] < mx * 0.5 ? 0 : en[i] < mx * 0.82 ? 1 : 2 }));
}

function hexHsl(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: d ? d / (1 - Math.abs(2 * l - 1)) : 0, l };
}
const hsl = (h, s, l, a = 1) => `hsla(${((h % 360) + 360) % 360},${s}%,${l}%,${a})`;

// --- 自動MV用の部品 ---
const BOKEH = table(26, 97, (r) => ({ x: r(), y: r(), r: 0.02 + r() * 0.06, sp: 0.2 + r() * 0.6, ph: r() * TAU, k: Math.floor(r() * 3) }));
const RAIN = table(90, 101, (r) => ({ x: r(), y: r(), l: 0.02 + r() * 0.05, sp: 0.8 + r() * 0.8 }));
const CROWD = table(40, 113, (r) => ({ x: r(), h: 0.05 + r() * 0.05, ph: r() * TAU }));
function eqBars(c, n, col, amp) {
  const g = c.g, w = c.w / n;
  g.fillStyle = col;
  for (let i = 0; i < n; i++) {
    const v = 0.15 + 0.45 * Math.abs(Math.sin(i * 1.7 + c.t * 3.1) * Math.cos(i * 0.6 - c.t * 1.3)) + 0.4 * c.pulse * Math.abs(Math.sin(i * 2.3));
    const h = v * c.h * 0.45 * amp;
    g.globalAlpha = 0.85;
    g.fillRect(i * w + 2, c.h - h, w - 4, h);
  }
  g.globalAlpha = 1;
}
function stageBeams(c, n, cols, alpha, speed = 1) {
  const g = c.g;
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = c.w * (i + 0.5) / n, a = Math.sin(c.t * speed * (0.7 + i * 0.13) + i) * 0.5;
    const len = c.h * 1.3, spread = 0.09;
    const gr = g.createLinearGradient(x, 0, x + Math.sin(a) * len, Math.cos(a) * len);
    gr.addColorStop(0, cols[i % cols.length]); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.globalAlpha = alpha;
    g.beginPath(); g.moveTo(x, 0);
    g.lineTo(x + Math.sin(a - spread) * len, Math.cos(a - spread) * len);
    g.lineTo(x + Math.sin(a + spread) * len, Math.cos(a + spread) * len);
    g.fill();
  }
  g.restore();
}
function crowd(c, col) {
  const g = c.g;
  g.fillStyle = col;
  for (const p of CROWD) {
    const jump = Math.max(0, Math.sin(c.beat * Math.PI * 2 + p.ph)) * c.h * 0.02;
    const x = p.x * c.w, y = c.h - p.h * c.h - jump;
    g.beginPath(); g.arc(x, y, c.h * 0.025, 0, TAU); g.fill();
    g.fillRect(x - c.h * 0.03, y + c.h * 0.02, c.h * 0.06, c.h * 0.2);
  }
}
function rain(c, col, speed = 1) {
  const g = c.g;
  g.strokeStyle = col; g.lineWidth = 1;
  g.beginPath();
  for (const p of RAIN) {
    const y = frac(p.y + c.t * 0.5 * speed * p.sp) * 1.1 - 0.05, x = frac(p.x + y * 0.08);
    g.moveTo(x * c.w, y * c.h); g.lineTo((x - 0.006) * c.w, (y - p.l) * c.h);
  }
  g.globalAlpha = 0.5; g.stroke(); g.globalAlpha = 1;
}
function bokeh(c, cols, alpha = 0.35) {
  const g = c.g;
  for (const b of BOKEH) {
    const x = frac(b.x + Math.sin(c.t * b.sp * 0.3 + b.ph) * 0.02), y = b.y + Math.sin(c.t * b.sp + b.ph) * 0.02;
    g.globalAlpha = alpha * (0.6 + 0.4 * Math.sin(c.t * b.sp * 2 + b.ph));
    g.fillStyle = cols[b.k % cols.length];
    g.beginPath(); g.arc(x * c.w, y * c.h, b.r * c.h, 0, TAU); g.fill();
  }
  g.globalAlpha = 1;
}
function waves(c, horizon, top, bottom, speed = 1) {
  const g = c.g, hy = c.h * horizon;
  for (let k = 0; k < 6; k++) {
    const y0 = hy + (c.h - hy) * (k / 6) ** 1.3;
    g.fillStyle = k % 2 ? top : bottom;
    g.beginPath(); g.moveTo(0, c.h);
    for (let x = 0; x <= c.w; x += 8) g.lineTo(x, y0 + Math.sin(x * 0.03 / (1 + k * 0.3) + c.t * speed * (1 + k * 0.2) + k) * (2 + k * 2));
    g.lineTo(c.w, c.h); g.fill();
  }
}
function palm(c, x, base, h, col, lean = 0.15) {
  const g = c.g, tx = x + h * lean, ty = base - h;
  g.strokeStyle = col; g.lineWidth = Math.max(2, h * 0.05); g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + h * lean * 0.2, base - h * 0.5, tx, ty); g.stroke();
  g.fillStyle = col;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.55 + Math.sin(c.t * 1.2 + i) * 0.05, L = h * 0.45;
    const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L + L * 0.35;
    g.beginPath(); g.moveTo(tx, ty);
    g.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty + Math.sin(a) * L * 0.6 - L * 0.15, ex, ey);
    g.quadraticCurveTo(tx + Math.cos(a) * L * 0.5, ty + Math.sin(a) * L * 0.5 + L * 0.05, tx, ty);
    g.fill();
  }
}
function hills(c, y, col, amp, freq, speed) {
  const g = c.g;
  g.fillStyle = col;
  g.beginPath(); g.moveTo(0, c.h);
  for (let x = 0; x <= c.w; x += 6) g.lineTo(x, y - Math.sin(x * freq + c.t * speed) * amp - Math.sin(x * freq * 2.3 + 1 + c.t * speed * 1.3) * amp * 0.4);
  g.lineTo(c.w, c.h); g.fill();
}
function birds(c, col) {
  const g = c.g;
  g.strokeStyle = col; g.lineWidth = 1.5;
  for (let i = 0; i < 5; i++) {
    const x = frac(i * 0.21 + c.t * 0.03) * c.w * 1.2 - c.w * 0.1, y = c.h * (0.2 + i * 0.05) + Math.sin(c.t + i) * 4;
    const f = Math.sin(c.t * 6 + i) * 4;
    g.beginPath(); g.moveTo(x - 7, y - f); g.lineTo(x, y); g.lineTo(x + 7, y - f); g.stroke();
  }
}
function lightning(c, seed, col, alpha) {
  if (alpha <= 0) return;
  const g = c.g, r = rng(seed);
  let x = c.w * (0.2 + r() * 0.6), y = 0;
  g.save();
  g.strokeStyle = col; g.lineWidth = 3; g.globalAlpha = alpha; g.shadowColor = col; g.shadowBlur = 16;
  g.beginPath(); g.moveTo(x, y);
  while (y < c.h * 0.8) { x += (r() - 0.5) * c.w * 0.08; y += c.h * (0.04 + r() * 0.06); g.lineTo(x, y); }
  g.stroke();
  g.restore();
}
function vinyl(c, x, y, r, rot, label) {
  const g = c.g;
  g.fillStyle = '#0b0b10'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 1;
  for (let k = 0.4; k < 0.98; k += 0.06) { g.beginPath(); g.arc(x, y, r * k, 0, TAU); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; // 光の反射
  g.beginPath(); g.arc(x, y, r * 0.8, rot, rot + 0.5); g.stroke();
  g.beginPath(); g.arc(x, y, r * 0.8, rot + Math.PI, rot + Math.PI + 0.5); g.stroke();
  g.fillStyle = label; g.beginPath(); g.arc(x, y, r * 0.3, 0, TAU); g.fill();
  g.fillStyle = '#0b0b10'; g.beginPath(); g.arc(x, y, r * 0.04, 0, TAU); g.fill();
}
function pixelScape(c, col, sky, speed) {
  const g = c.g, px = Math.max(4, Math.round(c.h / 45));
  g.fillStyle = sky;
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(frac(i * 0.137 - c.t * 0.01) * c.w / px) * px, y = Math.floor((i * 0.071 % 0.5) * c.h / px) * px;
    if ((Math.floor(c.t * 2) + i) % 5) g.fillRect(x, y, px, px);
  }
  g.fillStyle = col;
  const off = c.t * speed * 30;
  for (let x = 0; x < c.w + px; x += px) {
    const k = Math.floor((x + off) / px);
    const h = (3 + Math.floor(Math.abs(Math.sin(k * 0.21) * 6 + Math.sin(k * 0.05) * 4))) * px;
    g.fillRect(x - (off % px), c.h - h, px, h);
  }
}

// テーマ: [lvl, 描く関数(c, P)] の並び。P は曲の色から作った配色
const THEMES = {
  retro: [
    [0, (c, P) => { vgrad(c, [P.dk, P.mid, P.hot]); twinkle(c, SKY, '#fff'); retroSun(c, c.w / 2, c.h * 0.62, c.h * 0.22, '#ffe066', P.main, P.mid); c.g.fillStyle = P.dk; c.g.fillRect(0, c.h * 0.62, c.w, c.h); grid(c, 0.62, P.main, 0.4, 0.8); }],
    [1, (c, P) => { vgrad(c, [P.dk, P.mid, P.hot]); retroSun(c, c.w / 2, c.h * 0.55, c.h * 0.24, '#ffe066', P.main, P.mid); hills(c, c.h * 0.6, P.dk2, c.h * 0.08, 0.02, 0); c.g.fillStyle = P.dk; c.g.fillRect(0, c.h * 0.6, c.w, c.h); grid(c, 0.6, P.main, 1); }],
    [2, (c, P) => { vgrad(c, [P.dk, P.mid]); retroSun(c, c.w / 2, c.h * 0.5, c.h * (0.2 + 0.02 * c.pulse), '#ffe066', P.main, P.mid); skyline(c, BLDS, c.h * 0.62, P.dk2, '#ffd36b', 0.3 + 0.4 * c.pulse); c.g.fillStyle = P.dk; c.g.fillRect(0, c.h * 0.62, c.w, c.h); grid(c, 0.62, P.sub, 1.8); }],
  ],
  space: [
    [0, (c, P) => { vgrad(c, ['#010208', P.dk]); twinkle(c, SKY, '#fff', 0.5); dotSphere(c, c.w / 2, c.h / 2, c.h * 0.28, P.main, c.t * 0.2, 0.8); }],
    [1, (c, P) => { vgrad(c, ['#010208', P.dk]); starfield(c, STARS, 0.3, '#fff'); ringSegments(c, c.h * 0.3, 6, P.main, c.t * 0.4, 0.6); ringSegments(c, c.h * 0.4, 10, P.sub, -c.t * 0.3, 0.4, 2); }],
    [2, (c, P) => { vgrad(c, [P.dk, '#000']); tunnel(c, 6, 1.1, P.main, { rot: c.t * 0.3, lw: 2.4 }); starfield(c, STARS, 0.9, '#fff', 2.6); radialLines(c, 24, P.sub, 0.1 + 0.2 * c.pulse, c.t * 0.2, 0.35); }],
  ],
  cyber: [
    [0, (c, P) => { vgrad(c, ['#000', P.dk]); pointTerrain(c, P.main, 0.3, 0.6, { alpha: 0.7 }); }],
    [1, (c, P) => { vgrad(c, [P.dk, '#000']); tunnel(c, 4, 0.8, P.main, { rot: Math.PI / 4, lw: 2.4 }); starfield(c, STARS, 0.5, '#fff'); }],
    [2, (c, P) => { vgrad(c, ['#000', P.dk]); pointTerrain(c, P.main, 1.8, 1.2); radialLines(c, 24, P.sub, 0.12 + 0.2 * c.pulse, c.t * 0.3, 0.4); glitch(c, c.pulse * 0.6, Math.floor(c.beat * 2)); }],
    [2, (c, P) => { vgrad(c, [P.dk, '#000']); tunnel(c, 4, 1.4, P.main, { rot: Math.PI / 4 + c.t * 0.4, lw: 2.6 }); tunnel(c, 6, 1.1, P.sub, { rot: -c.t * 0.4, n: 10, alpha: 0.7 }); starfield(c, STARS, 1, '#fff'); }],
  ],
  club: [
    [0, (c, P) => { vgrad(c, ['#030308', P.dk]); bokeh(c, [P.main, P.sub, '#fff'], 0.25); eqBars(c, 24, P.main, 0.5); }],
    [1, (c, P) => { vgrad(c, ['#020206', P.dk]); stageBeams(c, 5, [P.main, P.sub], 0.35, 0.8); eqBars(c, 32, P.sub, 0.8); crowd(c, '#05050a'); }],
    [2, (c, P) => { vgrad(c, ['#000', P.dk]); stageBeams(c, 7, [P.main, P.sub, '#ffffff'], 0.3 + 0.35 * c.pulse, 1.6); tunnel(c, 4, 1.2, P.main, { n: 8, alpha: 0.5 }); crowd(c, '#000'); }],
  ],
  wa: [
    [0, (c, P) => { vgrad(c, ['#0d0420', P.dk, P.mid]); twinkle(c, SKY, '#fff'); moon(c, c.w * 0.72, c.h * 0.3, c.h * 0.12, '#fff4e8'); fallingPetals(c, PETALS, P.light, 0.5); }],
    [1, (c, P) => { vgrad(c, ['#12031c', P.dk]); for (let i = 8; i >= 0; i--) { const d = (i + 1 - frac(c.t * 0.5)) / 9, s = c.h * 0.25 / (0.15 + d); torii(c, c.w / 2, c.h * 0.55 + s * 0.48, s, '#e0384f', clamp01((1 - d) * 1.5)); } fallingPetals(c, PETALS, P.light, 1.1, 0.6); }],
    [2, (c, P) => { vgrad(c, [P.dk, P.mid]); radialLines(c, 20, P.main, 0.15 + 0.25 * c.pulse, c.t * 0.3, 0.2); for (let ring = 0; ring < 3; ring++) { const n = 6 + ring * 4, R = c.h * (0.16 + ring * 0.16) * (1 + 0.06 * c.pulse); for (let i = 0; i < n; i++) { const a = (i / n) * TAU + c.t * (ring % 2 ? -0.4 : 0.4); sakura(c, c.w / 2 + Math.cos(a) * R, c.h / 2 + Math.sin(a) * R, c.h * (0.05 + ring * 0.012), a + c.t, ring === 1 ? '#fff0f8' : P.light, 0.9); } } }],
  ],
  cute: [
    [0, (c, P) => { vgrad(c, [P.pa, P.pb, '#d6ecff']); fluffyClouds(c, c.h * 0.9, 0.01); risingBubbles(c, 0.7, 0.9, 0.9); }],
    [1, (c, P) => { vgrad(c, [P.pa, P.pb]); risingBubbles(c, 0.9, 0.7, 0.8); c.g.fillStyle = '#fff6fb'; c.g.fillRect(0, c.h * 0.82, c.w, c.h); for (let i = 0; i < 5; i++) blob(c, c.w * (0.14 + i * 0.18), c.h * 0.82, c.h * (i % 2 ? 0.07 : 0.09), [P.light, '#c9b3ff', '#a8e2ff', '#ffe39b', '#b6f5d8'][i], (i % 2) * 0.5); }],
    [2, (c, P) => { candySwirl(c, [P.pa, '#e6d4ff', '#c9e8ff', '#fff2c4'], c.t * 0.4); risingBubbles(c, 1.6, 0.7, 0.85); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + c.t * 0.8, R = c.h * 0.3; sparkle(c, c.w / 2 + Math.cos(a) * R * 1.3, c.h / 2 + Math.sin(a) * R, c.h * 0.03, '#fff', 0.9); } heart(c, c.w / 2, c.h / 2 + c.h * 0.05, c.h * (0.12 + 0.04 * c.pulse), P.main); }],
  ],
  night: [
    [0, (c, P) => { vgrad(c, ['#05060f', P.dk]); bokeh(c, [P.main, '#ffcf7a', P.sub], 0.3); rain(c, 'rgba(200,220,255,0.8)', 0.6); }],
    [1, (c, P) => { vgrad(c, ['#04050e', P.dk]); twinkle(c, SKY, '#fff'); moon(c, c.w * 0.75, c.h * 0.25, c.h * 0.1, '#fff3d0', 0.45); skyline(c, BLDS, c.h * 0.85, '#05060c', '#ffcf7a', 0.2); }],
    [2, (c, P) => { vgrad(c, ['#05060f', P.dk]); bokeh(c, [P.main, '#ffcf7a', P.sub], 0.45); vinyl(c, c.w / 2, c.h / 2, c.h * (0.32 + 0.01 * c.pulse), c.t * 2, P.main); }],
  ],
  tropical: [
    [0, (c, P) => { vgrad(c, ['#ff9a5a', '#ff5f7e', P.mid]); retroSun(c, c.w / 2, c.h * 0.58, c.h * 0.2, '#fff1a8', '#ff8a3d', '#ff5f7e'); waves(c, 0.6, '#3a1a5a', '#24123e', 0.6); }],
    [1, (c, P) => { vgrad(c, ['#ffb36b', '#ff6f8e', P.mid]); retroSun(c, c.w / 2, c.h * 0.55, c.h * 0.18, '#fff1a8', '#ff8a3d', '#ff6f8e'); waves(c, 0.62, '#2d1648', '#1c0e32', 1); palm(c, c.w * 0.1, c.h, c.h * 0.7, '#1a0a26', 0.2); palm(c, c.w * 0.9, c.h, c.h * 0.6, '#1a0a26', -0.25); }],
    [2, (c, P) => { vgrad(c, ['#ffd36b', '#ff6f8e']); radialLines(c, 18, '#fff4c0', 0.25 + 0.25 * c.pulse, c.t * 0.3, 0.1); retroSun(c, c.w / 2, c.h * 0.52, c.h * (0.22 + 0.02 * c.pulse), '#fff8d0', '#ffb347', '#ff8a6a'); waves(c, 0.64, '#2d1648', '#1c0e32', 1.6); palm(c, c.w * 0.08, c.h, c.h * 0.75, '#1a0a26', 0.2); palm(c, c.w * 0.92, c.h, c.h * 0.65, '#1a0a26', -0.25); }],
  ],
  rock: [
    [0, (c, P) => { vgrad(c, ['#000', '#0c0608']); stageBeams(c, 1, [P.main], 0.4, 0.3); crowd(c, '#000'); }],
    [1, (c, P) => { vgrad(c, ['#000', P.dk]); stageBeams(c, 6, [P.main, '#ffffff'], 0.35, 1.1); crowd(c, '#000'); }],
    [2, (c, P) => { vgrad(c, ['#000', P.dk]); stageBeams(c, 8, [P.main, P.sub, '#ffffff'], 0.3 + 0.35 * c.pulse, 2); lightning(c, Math.floor(c.beat), '#e8f0ff', c.pulse > 0.6 && Math.floor(c.beat) % 2 === 0 ? c.pulse : 0); crowd(c, '#000'); }],
  ],
  boss: [
    [0, (c, P) => { vgrad(c, ['#0a0003', P.dk]); hexGrid(c, P.main, 0.15 + 0.12 * c.pulse); hazard(c, c.h * 0.08, c.h * 0.06, P.main, 0.4); hazard(c, c.h * 0.86, c.h * 0.06, P.main, -0.4); }],
    [1, (c, P) => { vgrad(c, ['#0a0003', P.dk]); hexGrid(c, P.main, 0.1); ringSegments(c, c.h * 0.42, 6, P.main, c.t * 0.5, 0.6); bossEye(c, c.w / 2, c.h / 2, c.h * 0.15 * (1 + 0.04 * c.pulse), P.main, c.t * 0.8); }],
    [2, (c, P) => { vgrad(c, [P.dk, '#000']); radialLines(c, 36, P.main, 0.2 + 0.3 * c.pulse, c.t * 1.5, 0.25); ringSegments(c, c.h * 0.42, 8, P.sub, c.t, 0.7); bossEye(c, c.w / 2, c.h / 2, c.h * 0.17 * (1 + 0.06 * c.pulse), P.main, c.t * 1.2); glitch(c, c.pulse * 0.5, Math.floor(c.beat * 2)); }],
  ],
  field: [
    [0, (c, P) => { vgrad(c, ['#8fd3ff', '#ffe2b8']); retroSun(c, c.w * 0.7, c.h * 0.5, c.h * 0.14, '#fff6c8', '#ffc56b', '#ffe2b8'); hills(c, c.h * 0.7, '#7cc97a', c.h * 0.04, 0.012, 0.05); hills(c, c.h * 0.82, '#4fa865', c.h * 0.05, 0.018, 0.1); fluffyClouds(c, c.h * 0.22, 0.008); }],
    [1, (c, P) => { vgrad(c, ['#6ec6ff', '#d8f1ff']); fluffyClouds(c, c.h * 0.2, 0.02); birds(c, '#2a3a4a'); hills(c, c.h * 0.68, '#86d07f', c.h * 0.05, 0.014, 0.2); hills(c, c.h * 0.8, '#5cb86a', c.h * 0.06, 0.02, 0.35); hills(c, c.h * 0.92, '#3f9a55', c.h * 0.04, 0.03, 0.55); }],
    [2, (c, P) => { vgrad(c, ['#ffd27a', '#ffefc8']); radialLines(c, 20, '#fff8dc', 0.3 + 0.25 * c.pulse, c.t * 0.2, 0.05); retroSun(c, c.w / 2, c.h * 0.55, c.h * (0.18 + 0.02 * c.pulse), '#fffbe0', '#ffb347', '#ffefc8'); hills(c, c.h * 0.72, '#7cc97a', c.h * 0.05, 0.014, 0.4); hills(c, c.h * 0.86, '#4fa865', c.h * 0.05, 0.022, 0.7); birds(c, '#3a2a1a'); }],
  ],
  chip: [
    [0, (c, P) => { vgrad(c, ['#0a0a2a', P.dk]); pixelScape(c, P.main, '#fff', 0.5); }],
    [1, (c, P) => { vgrad(c, ['#0a0a2a', P.dk]); pixelScape(c, P.main, '#fff', 1.5); }],
    [2, (c, P) => { vgrad(c, ['#000', P.dk]); tunnel(c, 4, 1.2, P.main, { rot: Math.PI / 4, lw: 4, n: 10 }); pixelScape(c, P.sub, '#fff', 2.5); }],
  ],
};
const THEME_RULES = [
  ['boss', /BOSS BATTLE|ORCHESTRAL|SYMPHONIC|POWER METAL|TERROR/],
  ['wa', /^WA-|SAKURA|GAMELAN|CHINESE/],
  ['chip', /CHIP|GIMMICK/],
  ['cute', /KAWAII|IDOL|KIDS|TOY|HAPPY|J-CORE|BOUNCE|MUSIC BOX|K-POP|^POP$|J-POP|SPRING POP/],
  ['field', /BEGINNER|ACOUSTIC|SHIBUYA|FOLK|COUNTRY|BLUEGRASS|CELTIC|CAMPFIRE|MARCH|POLKA/],
  ['retro', /SYNTH|OUTRUN|CITY POP|FUTURE FUNK|VAPOR|EUROBEAT|DISCO|^FUNK/],
  ['tropical', /BOSSA|REGGAE|SAMBA|TROPICAL|MOOMBAH|^DUB$|AFRO|SALSA|FLAMENCO|MARIACHI|DEMBOW|ARABIAN|BOLLYWOOD|TANGO/],
  ['night', /LO-FI|JAZZ|LOUNGE|BALLAD|PIANO|R&B|SOUL|BLUES|CHILL|WALTZ|GOSPEL|WINTER|HIP HOP|BIG BAND|SWING/],
  ['rock', /ROCK|METAL|PUNK/],
  ['space', /TRANCE|PSY|PROGRESSIVE|AMBIENT/],
  ['cyber', /DRUM|JUNGLE|NEURO|LIQUID|CORE|SPEED|GABBER|BREAK|HARDSTYLE|FLASH|DARK|JUMP UP/],
];
export const themeOf = (genre) => (THEME_RULES.find(([, re]) => re.test(genre || '')) || ['club'])[0];

// 自動MVの定義({ scenes })を作る。info = { title, genre, color, sections }
function autoDef(info) {
  const { h } = hexHsl(info.color || '#5ef2ff');
  const P = {
    main: info.color || '#5ef2ff', sub: hsl(h + 150, 90, 65), light: hsl(h, 90, 82),
    dk: hsl(h, 55, 7), dk2: hsl(h, 50, 10), mid: hsl(h, 55, 18), hot: hsl(h + 20, 60, 34),
    pa: hsl(h, 90, 90), pb: hsl(h + 40, 80, 88),
  };
  const theme = THEMES[themeOf(info.genre)];
  const used = [0, 0, 0];
  const secs = info.sections?.length ? info.sections : [{ from: 0, to: 1e9, lvl: 1 }];
  const last = secs[secs.length - 1].to;
  const scenes = secs.map((s, i) => {
    const pool = theme.filter(([lv]) => lv === s.lvl);
    const list = pool.length ? pool : theme;
    const fn = list[used[s.lvl]++ % list.length][1];
    return {
      from: s.from, to: i === secs.length - 1 ? 1e9 : s.to,
      draw(c) {
        fn(c, P);
        if (i === 0 && c.lb < 12) { // はじめに曲名
          const a = ease((c.lb - 1) / 2) * (1 - ease((c.lb - 9) / 2));
          text(c, info.title, c.w / 2, c.h * 0.42, c.h * 0.09, '#ffffff', a, { glow: 16, spacing: 3 });
          text(c, info.genre, c.w / 2, c.h * 0.53, c.h * 0.035, '#ffffff', a * 0.75, { weight: 600, spacing: 5 });
        }
        if (c.beat > last - 8) { c.g.fillStyle = `rgba(0,0,0,${ease((c.beat - (last - 8)) / 8)})`; c.g.fillRect(0, 0, c.w, c.h); } // おわりは暗く
      },
    };
  });
  return { scenes };
}

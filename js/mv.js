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

const MVS = {
  'lidar-rush': lidarRush,
  'neon-highway': neonHighway,
  'hyper-sakura': hyperSakura,
  'star-lullaby': starLullaby,
  'final-protocol': finalProtocol,
};
export const hasMV = (id) => !!MVS[id];

// ---------------------------------------------------------------------------
// 再生
// ---------------------------------------------------------------------------
export function createMV(id, bpm, offset = 0) {
  const def = MVS[id];
  if (!def) return null;
  const cv = document.createElement('canvas');
  const og = cv.getContext('2d');
  const spb = 60 / bpm;
  return {
    // g に W×H で描く。t は曲の時刻(秒)
    draw(g, W, H, t) {
      // 裏キャンバスは画面の約半分(最大 800px 幅)
      const sx = Math.min(0.5, 800 / Math.max(1, W));
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

// 曲ジャケットの自動生成。曲の色・BPM・ジャンル・IDから点群っぽい絵を描く(結果はキャッシュ)
import { mulberry32, hashStr } from './composer.js';

const cache = new Map();
export const clearJackets = () => cache.clear();

export function jacketURL(entry, size = 256) {
  const key = entry.id + '@' + size;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), entry, size);
  const url = c.toDataURL('image/png');
  cache.set(key, url);
  return url;
}

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

function draw(g, e, S) {
  const rng = mulberry32(hashStr(e.id + 'jacket'));
  const [r, gg, b] = rgb(e.color || '#5ef2ff');
  const col = (a) => `rgba(${r},${gg},${b},${a})`;
  const fast = Math.min(1, Math.max(0, (e.bpm - 80) / 140)); // 0=ゆっくり 1=速い

  // 背景
  const bg = g.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, '#04060f');
  bg.addColorStop(1, `rgb(${Math.round(r * 0.12)},${Math.round(gg * 0.12)},${Math.round(b * 0.16) + 8})`);
  g.fillStyle = bg;
  g.fillRect(0, 0, S, S);

  const cx = S * (0.35 + rng() * 0.3), cy = S * (0.38 + rng() * 0.2);
  const style = hashStr(e.id) % 3;

  // 遠近グリッドの床
  g.strokeStyle = col(0.18);
  g.lineWidth = Math.max(1, S / 256);
  const hz = S * 0.62;
  for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(cx + i * S * 0.02, hz); g.lineTo(cx + i * S * 0.22, S); g.stroke(); }
  for (let k = 1; k < 9; k++) { const y = hz + (S - hz) * Math.pow(k / 9, 1.8); g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }

  g.globalCompositeOperation = 'lighter';
  // 点群(スタイル別)
  const N = Math.round(900 + fast * 1400);
  for (let i = 0; i < N; i++) {
    let x, y, a;
    if (style === 0) {
      // 同心のスキャンリング
      const ring = Math.floor(rng() * (5 + fast * 6));
      const rad = S * (0.08 + ring * 0.045) * (1 + (rng() - 0.5) * 0.04);
      const th = rng() * Math.PI * 2;
      x = cx + Math.cos(th) * rad; y = cy + Math.sin(th) * rad * 0.55;
      a = 0.25 + 0.6 * (1 - ring / 12);
    } else if (style === 1) {
      // 波形の地形
      x = rng() * S;
      const w = Math.sin(x / S * Math.PI * (2 + fast * 6) + rng() * 0.3) * S * 0.12 * (0.6 + fast);
      y = cy + w + (rng() - 0.5) * S * 0.05 + Math.floor(rng() * 4) * S * 0.05;
      a = 0.2 + rng() * 0.6;
    } else {
      // 球体
      const u = rng() * 2 - 1, th = rng() * Math.PI * 2, rad = S * (0.2 + fast * 0.08);
      const k = Math.sqrt(1 - u * u);
      x = cx + Math.cos(th) * k * rad; y = cy + u * rad;
      a = 0.15 + 0.7 * (0.5 + 0.5 * Math.sin(th));
    }
    const sz = Math.max(1, S / 256) * (rng() < 0.08 ? 2 : 1);
    g.fillStyle = rng() < 0.12 ? `rgba(255,255,255,${a})` : col(a);
    g.fillRect(x, y, sz, sz);
  }
  // 中心の光とスキャン線
  const glow = g.createRadialGradient(cx, cy, 0, cx, cy, S * 0.35);
  glow.addColorStop(0, col(0.35)); glow.addColorStop(1, col(0));
  g.fillStyle = glow;
  g.fillRect(0, 0, S, S);
  g.fillStyle = col(0.7);
  g.fillRect(0, cy + S * 0.18, S, Math.max(1, S / 160));
  g.globalCompositeOperation = 'source-over';

  // 走査線
  g.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 0; y < S; y += Math.max(2, S / 96)) g.fillRect(0, y, S, Math.max(1, S / 256));

  // 文字
  const pad = S * 0.07;
  g.fillStyle = col(0.95);
  g.font = `700 ${Math.round(S * 0.05)}px Orbitron, sans-serif`;
  g.textBaseline = 'top';
  g.fillText(String(e.genre || '').toUpperCase(), pad, pad);
  g.textAlign = 'right';
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.fillText(`${Math.round(e.bpm)} BPM`, S - pad, pad);
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#fff';
  const title = String(e.title || '');
  let fs = S * 0.12;
  g.font = `900 ${Math.round(fs)}px Orbitron, "Noto Sans JP", sans-serif`;
  while (g.measureText(title).width > S - pad * 2 && fs > S * 0.06) { fs *= 0.9; g.font = `900 ${Math.round(fs)}px Orbitron, "Noto Sans JP", sans-serif`; }
  g.shadowColor = col(1); g.shadowBlur = S * 0.04;
  g.fillText(title, pad, S - pad);
  g.shadowBlur = 0;
  // 角のブラケット
  g.strokeStyle = col(0.9);
  g.lineWidth = Math.max(1.5, S / 128);
  const L = S * 0.08, m = S * 0.03;
  [[m, m, 1, 1], [S - m, m, -1, 1], [m, S - m, 1, -1], [S - m, S - m, -1, -1]].forEach(([x, y, dx, dy]) => {
    g.beginPath(); g.moveTo(x, y + dy * L); g.lineTo(x, y); g.lineTo(x + dx * L, y); g.stroke();
  });
}

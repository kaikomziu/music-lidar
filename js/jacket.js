// 曲ジャケットの自動生成。ジャンルごとに絵柄を変え、曲の色・BPM・IDで細部を変える(結果はキャッシュ)
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

// ジャンル名 → 絵柄
const STYLE = {
  BEGINNER: 'sunrise', CHILL: 'clouds', HOUSE: 'equalizer', 'DRUM & BASS': 'terrain', POP: 'stars',
  GIMMICK: 'glitch', HYPERCORE: 'tunnel', SPEEDCORE: 'tunnel', CHIPTUNE: 'pixel', JAZZ: 'vinyl',
  TRANCE: 'rays', 'ROCK / METAL': 'lightning', 'FUNK / DISCO': 'mirrorball', DUBSTEP: 'wobble', SYNTHWAVE: 'retrosun',
};

function draw(g, e, S) {
  const rng = mulberry32(hashStr(e.id + 'jacket'));
  const [r, gg, b] = rgb(e.color || '#5ef2ff');
  const col = (a) => `rgba(${r},${gg},${b},${a})`;
  const fast = Math.min(1, Math.max(0, ((e.bpm || 120) - 80) / 140)); // 0=ゆっくり 1=速い
  const u = S / 256; // 線の太さなどの基準

  // 背景
  const bg = g.createLinearGradient(0, 0, S, S);
  bg.addColorStop(0, '#04060f');
  bg.addColorStop(1, `rgb(${Math.round(r * 0.14)},${Math.round(gg * 0.14)},${Math.round(b * 0.18) + 8})`);
  g.fillStyle = bg;
  g.fillRect(0, 0, S, S);

  const dot = (x, y, a, sz = 1) => { g.fillStyle = rng() < 0.12 ? `rgba(255,255,255,${a})` : col(a); g.fillRect(x, y, Math.max(1, u * sz), Math.max(1, u * sz)); };
  const floor = (hz, cx = S / 2, a = 0.18) => {
    g.strokeStyle = col(a); g.lineWidth = Math.max(1, u);
    for (let i = -10; i <= 10; i++) { g.beginPath(); g.moveTo(cx + i * S * 0.02, hz); g.lineTo(cx + i * S * 0.2, S); g.stroke(); }
    for (let k = 1; k < 9; k++) { const y = hz + (S - hz) * Math.pow(k / 9, 1.8); g.beginPath(); g.moveTo(0, y); g.lineTo(S, y); g.stroke(); }
  };
  const glowAt = (x, y, rad, a = 0.35) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, col(a)); gr.addColorStop(1, col(0));
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
  };

  const style = STYLE[String(e.genre || '').toUpperCase()] || ['rings', 'terrain', 'sphere'][hashStr(e.id) % 3];
  g.save();
  ART[style](g, { S, u, rng, col, fast, dot, floor, glowAt, r, gg, b });
  g.restore();
  g.globalCompositeOperation = 'source-over';

  // 走査線
  g.fillStyle = 'rgba(0,0,0,0.16)';
  for (let y = 0; y < S; y += Math.max(2, S / 96)) g.fillRect(0, y, S, Math.max(1, u));

  // 上下を少し暗くして文字を読みやすく
  const shade = g.createLinearGradient(0, S * 0.62, 0, S);
  shade.addColorStop(0, 'rgba(2,3,10,0)'); shade.addColorStop(1, 'rgba(2,3,10,0.75)');
  g.fillStyle = shade; g.fillRect(0, S * 0.62, S, S * 0.38);

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

// --------------------------------------------------------------------------
// 絵柄いろいろ。ctx = { S, u, rng, col, fast, dot, floor, glowAt }
// --------------------------------------------------------------------------
const ART = {
  // 地平線から昇る太陽(初心者向け)
  sunrise(g, { S, u, rng, col, dot, floor, glowAt }) {
    floor(S * 0.6, S / 2, 0.14);
    glowAt(S / 2, S * 0.6, S * 0.45, 0.4);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 900; i++) {
      const th = Math.PI + rng() * Math.PI, rad = S * (0.12 + Math.floor(rng() * 4) * 0.035);
      dot(S / 2 + Math.cos(th) * rad, S * 0.6 + Math.sin(th) * rad, 0.3 + rng() * 0.5, 1.4);
    }
    for (let i = 0; i < 16; i++) { // 光の筋
      const th = Math.PI + (i + 0.5) / 16 * Math.PI;
      g.strokeStyle = col(0.12); g.lineWidth = 2 * u;
      g.beginPath(); g.moveTo(S / 2 + Math.cos(th) * S * 0.28, S * 0.6 + Math.sin(th) * S * 0.28); g.lineTo(S / 2 + Math.cos(th) * S, S * 0.6 + Math.sin(th) * S); g.stroke();
    }
  },
  // ふわっとした雲と月(チル)
  clouds(g, { S, rng, col, dot, glowAt }) {
    glowAt(S * 0.72, S * 0.28, S * 0.2, 0.5);
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = col(0.6); g.beginPath(); g.arc(S * 0.72, S * 0.28, S * 0.07, 0, 7); g.fill();
    for (let c = 0; c < 6; c++) {
      const cx = rng() * S, cy = S * (0.35 + rng() * 0.35), w = S * (0.2 + rng() * 0.25);
      for (let i = 0; i < 260; i++) {
        const a = rng() * Math.PI * 2, rr = Math.sqrt(rng());
        dot(cx + Math.cos(a) * w * rr, cy + Math.sin(a) * w * 0.25 * rr, 0.15 + rng() * 0.35, 1.2);
      }
    }
  },
  // イコライザー(ハウス)
  equalizer(g, { S, u, rng, col, fast, floor }) {
    floor(S * 0.7, S / 2, 0.14);
    g.globalCompositeOperation = 'lighter';
    const n = 18, w = S / n;
    for (let i = 0; i < n; i++) {
      const h = S * (0.12 + Math.abs(Math.sin(i * 0.7 + rng())) * (0.35 + fast * 0.15));
      for (let y = 0; y < h; y += 5 * u) {
        const a = 0.25 + 0.7 * (y / h);
        g.fillStyle = y > h - 10 * u ? `rgba(255,255,255,${a})` : col(a);
        g.fillRect(i * w + w * 0.18, S * 0.7 - y, w * 0.64, 3 * u);
      }
    }
  },
  // 波打つ地形の点群(ドラムンベース)
  terrain(g, { S, rng, fast, dot, floor }) {
    floor(S * 0.66, S / 2, 0.14);
    g.globalCompositeOperation = 'lighter';
    for (let row = 0; row < 14; row++) {
      const z = row / 14, y0 = S * (0.3 + z * 0.4);
      for (let i = 0; i < 160; i++) {
        const x = rng() * S;
        const y = y0 + Math.sin(x / S * Math.PI * (3 + fast * 5) + row * 0.6) * S * 0.06 * (1 - z * 0.5);
        dot(x, y, 0.2 + z * 0.6, 1 + z);
      }
    }
  },
  // きらきらの星(ポップ)
  stars(g, { S, u, rng, col, dot, glowAt }) {
    glowAt(S / 2, S * 0.42, S * 0.4, 0.4);
    g.globalCompositeOperation = 'lighter';
    const star = (x, y, rad, a) => {
      g.fillStyle = col(a); g.beginPath();
      for (let k = 0; k < 10; k++) { const th = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? rad * 0.42 : rad; g.lineTo(x + Math.cos(th) * rr, y + Math.sin(th) * rr); }
      g.closePath(); g.fill();
    };
    star(S / 2, S * 0.42, S * 0.18, 0.75);
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 2 * u; g.stroke();
    for (let i = 0; i < 14; i++) star(rng() * S, rng() * S * 0.8, S * (0.015 + rng() * 0.035), 0.4 + rng() * 0.4);
    for (let i = 0; i < 400; i++) dot(rng() * S, rng() * S, rng() * 0.6, 1);
  },
  // ノイズとずれたブロック(ギミック)
  glitch(g, { S, rng, col, dot }) {
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const y = rng() * S * 0.85, h = S * (0.01 + rng() * 0.06), x = rng() * S * 0.5, w = S * (0.2 + rng() * 0.6);
      g.fillStyle = i % 3 ? col(0.15 + rng() * 0.35) : `rgba(255,255,255,${0.1 + rng() * 0.2})`;
      g.fillRect(x, y, w, h);
      g.fillStyle = `rgba(255,60,120,${0.15 * rng()})`; g.fillRect(x + S * 0.02, y, w, h * 0.5);
    }
    for (let i = 0; i < 700; i++) dot(rng() * S, rng() * S, rng() * 0.5, 1);
  },
  // 中心へ吸い込まれるスピード線(鬼畜曲)
  tunnel(g, { S, u, rng, col, fast, glowAt }) {
    glowAt(S / 2, S * 0.45, S * 0.3, 0.55);
    g.globalCompositeOperation = 'lighter';
    const n = Math.round(90 + fast * 120);
    for (let i = 0; i < n; i++) {
      const th = rng() * Math.PI * 2, r0 = S * (0.05 + rng() * 0.25), r1 = r0 + S * (0.15 + rng() * 0.5);
      g.strokeStyle = rng() < 0.2 ? 'rgba(255,255,255,0.5)' : col(0.2 + rng() * 0.5);
      g.lineWidth = (0.6 + rng() * 1.8) * u;
      g.beginPath(); g.moveTo(S / 2 + Math.cos(th) * r0, S * 0.45 + Math.sin(th) * r0); g.lineTo(S / 2 + Math.cos(th) * r1, S * 0.45 + Math.sin(th) * r1); g.stroke();
    }
    for (let k = 1; k <= 5; k++) { g.strokeStyle = col(0.12 + k * 0.04); g.lineWidth = u; g.strokeRect(S / 2 - k * S * 0.07, S * 0.45 - k * S * 0.07, k * S * 0.14, k * S * 0.14); }
  },
  // ドット絵の山と太陽(チップチューン)
  pixel(g, { S, rng, col }) {
    const p = S / 32;
    g.fillStyle = col(0.85);
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 10) g.fillRect((24 + x) * p, (8 + y) * p, p - 1, p - 1);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(255,255,255,${0.3 + rng() * 0.5})`; g.fillRect(Math.floor(rng() * 32) * p, Math.floor(rng() * 14) * p, p * 0.5, p * 0.5); }
    let h = 20;
    for (let x = 0; x < 32; x++) {
      h = Math.max(14, Math.min(24, h + Math.floor(rng() * 3) - 1));
      for (let y = h; y < 32; y++) { g.fillStyle = y === h ? col(0.9) : col(0.25 + (y - h) * 0.02); g.fillRect(x * p, y * p, p - 1, p - 1); }
    }
    // 小さなキャラ
    const hero = ['.XX.', 'XXXX', '.XX.', 'X..X'];
    hero.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'X') { g.fillStyle = '#fff'; g.fillRect((8 + x) * p, (h - 5 + y) * p, p - 1, p - 1); } }));
  },
  // レコード盤とスポットライト(ジャズ)
  vinyl(g, { S, u, col, glowAt }) {
    glowAt(S * 0.5, S * 0.05, S * 0.7, 0.25);
    const cx = S * 0.5, cy = S * 0.48, R = S * 0.32;
    g.fillStyle = '#05060c'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 26; k++) { g.strokeStyle = `rgba(255,255,255,${0.03 + (k % 3) * 0.02})`; g.lineWidth = u; g.beginPath(); g.arc(cx, cy, R * (0.38 + k * 0.024), 0, 7); g.stroke(); }
    g.strokeStyle = col(0.55); g.lineWidth = 3 * u; g.beginPath(); g.arc(cx, cy, R, -0.6, 0.4); g.stroke();
    g.fillStyle = col(0.75); g.beginPath(); g.arc(cx, cy, R * 0.32, 0, 7); g.fill();
    g.fillStyle = '#05060c'; g.beginPath(); g.arc(cx, cy, R * 0.04, 0, 7); g.fill();
    // 音符
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.beginPath(); g.ellipse(S * 0.8, S * 0.3, S * 0.035, S * 0.025, -0.4, 0, 7); g.fill();
    g.fillRect(S * 0.83, S * 0.14, 3 * u, S * 0.16);
    g.fillRect(S * 0.83, S * 0.14, S * 0.06, 3 * u);
  },
  // 放射状の光(トランス)
  rays(g, { S, u, rng, col, dot, glowAt }) {
    g.globalCompositeOperation = 'lighter';
    const cx = S / 2, cy = S * 0.45;
    for (let i = 0; i < 28; i++) {
      const th = i / 28 * Math.PI * 2 + rng() * 0.05, w = 0.03 + rng() * 0.04;
      g.fillStyle = col(0.06 + rng() * 0.1);
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(th - w) * S, cy + Math.sin(th - w) * S); g.lineTo(cx + Math.cos(th + w) * S, cy + Math.sin(th + w) * S); g.fill();
    }
    glowAt(cx, cy, S * 0.25, 0.8);
    g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, S * 0.025, 0, 7); g.fill();
    for (let i = 0; i < 500; i++) { const th = rng() * 7, rr = S * rng() * 0.6; dot(cx + Math.cos(th) * rr, cy + Math.sin(th) * rr, 0.2 + rng() * 0.5, 1); }
    g.strokeStyle = col(0.4); g.lineWidth = u; g.beginPath(); g.arc(cx, cy, S * 0.16, 0, 7); g.stroke();
  },
  // 稲妻とギザギザの山(ロック)
  lightning(g, { S, u, rng, col }) {
    g.fillStyle = col(0.12);
    g.beginPath(); g.moveTo(0, S); let x = 0;
    while (x < S) { g.lineTo(x, S * (0.55 + rng() * 0.2)); x += S * (0.05 + rng() * 0.08); }
    g.lineTo(S, S); g.fill();
    g.globalCompositeOperation = 'lighter';
    const bolt = (x0, w, a) => {
      g.strokeStyle = `rgba(255,255,255,${a})`; g.shadowColor = col(1); g.shadowBlur = 20 * u; g.lineWidth = w * u;
      g.beginPath(); let px = x0, py = S * 0.08; g.moveTo(px, py);
      while (py < S * 0.75) { px += (rng() - 0.5) * S * 0.12; py += S * (0.05 + rng() * 0.07); g.lineTo(px, py); }
      g.stroke(); g.shadowBlur = 0;
    };
    bolt(S * 0.52, 5, 0.95); bolt(S * 0.3, 2, 0.4); bolt(S * 0.75, 2, 0.4);
  },
  // ミラーボール(ディスコ)
  mirrorball(g, { S, u, rng, col, glowAt }) {
    const cx = S / 2, cy = S * 0.42, R = S * 0.24;
    glowAt(cx, cy, S * 0.5, 0.3);
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = u; g.beginPath(); g.moveTo(cx, 0); g.lineTo(cx, cy - R); g.stroke();
    for (let la = -6; la < 6; la++) for (let lo = 0; lo < 16; lo++) {
      const t1 = (la + 0.5) / 12 * Math.PI, ph = lo / 16 * Math.PI * 2;
      const zc = Math.cos(t1) * Math.cos(ph);
      if (zc < 0) continue;
      const x = cx + Math.cos(t1) * Math.sin(ph) * R, y = cy + Math.sin(t1) * R;
      const s = R * 0.13 * Math.cos(t1) * (0.6 + 0.4 * zc);
      const bright = 0.2 + 0.7 * zc * (rng() < 0.15 ? 1.4 : 1);
      g.fillStyle = rng() < 0.2 ? `rgba(255,255,255,${Math.min(1, bright)})` : col(Math.min(1, bright));
      g.fillRect(x - s / 2, y - R * 0.05, s, R * 0.1);
    }
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) { // 反射の光
      const th = rng() * 7, d = S * (0.3 + rng() * 0.3);
      g.fillStyle = `rgba(255,255,255,${0.2 + rng() * 0.5})`;
      const x = cx + Math.cos(th) * d, y = cy + Math.sin(th) * d * 0.8, s = (2 + rng() * 4) * u;
      g.fillRect(x - s, y - 0.5 * u, s * 2, u); g.fillRect(x - 0.5 * u, y - s, u, s * 2);
    }
  },
  // うねるLFOの線(ダブステップ)
  wobble(g, { S, u, rng, col }) {
    g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 9; k++) {
      const y0 = S * (0.22 + k * 0.06), amp = S * (0.02 + k * 0.012), f = 2 + (k % 3) * 2;
      g.strokeStyle = k === 4 ? 'rgba(255,255,255,0.9)' : col(0.2 + k * 0.06);
      g.lineWidth = (k === 4 ? 3 : 1.5) * u;
      g.beginPath();
      for (let x = 0; x <= S; x += 2 * u) { const y = y0 + Math.sin(x / S * Math.PI * f + k) * amp * Math.sin(x / S * Math.PI); x === 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.stroke();
    }
    for (let i = 0; i < 60; i++) { g.fillStyle = col(0.3 * rng()); g.fillRect(rng() * S, rng() * S, S * 0.08 * rng(), 2 * u); }
  },
  // 縞模様の太陽とグリッド(シンセウェイヴ)
  retrosun(g, { S, u, rng, col, floor }) {
    const cx = S / 2, cy = S * 0.5, R = S * 0.24;
    const sun = g.createLinearGradient(0, cy - R, 0, cy + R);
    sun.addColorStop(0, '#ffe36e'); sun.addColorStop(0.5, col(1)); sun.addColorStop(1, '#7a2cff');
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 7); g.clip();
    g.fillStyle = sun; g.fillRect(cx - R, cy - R, R * 2, R * 2);
    g.fillStyle = '#05060f';
    for (let k = 0; k < 7; k++) { const y = cy + R * (0.05 + k * 0.14), h = R * (0.02 + k * 0.018); g.fillRect(cx - R, y, R * 2, h); }
    g.restore();
    g.fillStyle = '#05060f'; g.fillRect(0, S * 0.62, S, S * 0.38);
    floor(S * 0.62, S / 2, 0.55);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,255,255,${rng() * 0.6})`; g.fillRect(rng() * S, rng() * S * 0.45, u, u); }
  },
  // ここから下は特定ジャンル以外(読み込み曲など)
  rings(g, { S, rng, fast, dot }) {
    g.globalCompositeOperation = 'lighter';
    const cx = S / 2, cy = S * 0.45;
    for (let i = 0; i < 1400; i++) {
      const ring = Math.floor(rng() * (5 + fast * 6)), rad = S * (0.08 + ring * 0.045), th = rng() * 7;
      dot(cx + Math.cos(th) * rad, cy + Math.sin(th) * rad * 0.55, 0.25 + 0.6 * (1 - ring / 12), 1);
    }
  },
  sphere(g, { S, rng, fast, dot }) {
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 1600; i++) {
      const v = rng() * 2 - 1, th = rng() * 7, rad = S * (0.2 + fast * 0.08), k = Math.sqrt(1 - v * v);
      dot(S / 2 + Math.cos(th) * k * rad, S * 0.45 + v * rad, 0.15 + 0.7 * (0.5 + 0.5 * Math.sin(th)), 1);
    }
  },
};

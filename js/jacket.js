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
  'LO-FI HIP HOP': 'rain', 'CITY POP': 'skyline', 'FUTURE BASS': 'prism', TECHNO: 'strobe', 'BOSSA NOVA': 'palms', HARDSTYLE: 'shards',
  'WA-FUSION': 'sakura', EUROBEAT: 'speedlines', REGGAE: 'waves', TRAP: 'smoke', 'ELECTRO SWING': 'deco', 'HAPPY HARDCORE': 'hearts',
  REGGAETON: 'rays', 'SKA PUNK': 'checker', ORCHESTRAL: 'aurora', VAPORWAVE: 'vapor', 'BOSS BATTLE': 'eye',
  'ACOUSTIC POP': 'cup', 'J-POP': 'ribbon', 'IDOL POP': 'hearts', 'WA-ROCK': 'sakura', 'DEEP HOUSE': 'equalizer', JUNGLE: 'terrain',
  FUNK: 'mirrorball', 'MUSIC BOX': 'gears', AMBIENT: 'aurora', 'BIG ROOM': 'strobe', TANGO: 'rose', CELTIC: 'knot', GABBER: 'shards',
  WALTZ: 'stars', BLUES: 'vinyl', 'KAWAII FUTURE BASS': 'prism',
  MARCH: 'sunrise', 'KIDS POP': 'stars', SALSA: 'rays', SAMBA: 'palms', ARABIAN: 'dunes', CHINESE: 'lantern', AFROBEATS: 'rays',
  GOSPEL: 'clouds', 'R&B': 'smoke', 'HIP HOP': 'skyline', 'LIQUID FUNK': 'clouds', HYPERPOP: 'glitch', BREAKCORE: 'glitch',
  PSYTRANCE: 'tunnel', 'PROGRESSIVE HOUSE': 'aurora', MOOMBAHTON: 'palms', 'UK GARAGE': 'equalizer', METALCORE: 'lightning', PIANO: 'piano',
  HARDCORE: 'tunnel', 'SYMPHONIC METAL': 'lightning', NEUROFUNK: 'terrain', FRENCHCORE: 'shards', 'JAZZ FUSION': 'vinyl',
  TRANCECORE: 'rays', 'JUMP UP': 'wobble', 'WA-CORE': 'sakura',
};

// 同じジャンルで見分けにくい曲だけ、曲ごとに絵柄を指定
const STYLE_BY_ID = { 'infinity-breaker': 'eye' };

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

  const style = STYLE_BY_ID[e.id] || STYLE[String(e.genre || '').toUpperCase()] || ['rings', 'terrain', 'sphere'][hashStr(e.id) % 3];
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
  // 雨の窓と、にじむ街の灯り(ローファイ)
  rain(g, { S, u, rng, col, glowAt }) {
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) { // ぼけた灯り
      const x = rng() * S, y = S * (0.35 + rng() * 0.4), rad = S * (0.02 + rng() * 0.06);
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      const warm = rng() < 0.4;
      gr.addColorStop(0, warm ? 'rgba(255,190,120,0.35)' : col(0.35)); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(200,220,255,0.18)'; g.lineWidth = Math.max(1, u);
    for (let i = 0; i < 90; i++) { const x = rng() * S, y = rng() * S, l = S * (0.03 + rng() * 0.06); g.beginPath(); g.moveTo(x, y); g.lineTo(x - l * 0.15, y + l); g.stroke(); }
    for (let i = 0; i < 40; i++) { // 窓の水滴
      const x = rng() * S, y = rng() * S, rr = S * (0.004 + rng() * 0.01);
      g.fillStyle = 'rgba(220,235,255,0.35)'; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x - rr * 0.4, y - rr * 0.5, Math.max(1, rr * 0.4), Math.max(1, rr * 0.4));
    }
    g.strokeStyle = 'rgba(10,12,24,0.9)'; g.lineWidth = S * 0.025; // 窓枠
    g.beginPath(); g.moveTo(S * 0.5, 0); g.lineTo(S * 0.5, S); g.moveTo(0, S * 0.3); g.lineTo(S, S * 0.3); g.stroke();
  },
  // 夜のビル街と月(シティポップ)
  skyline(g, { S, u, rng, col, glowAt }) {
    const sky = g.createLinearGradient(0, 0, 0, S);
    sky.addColorStop(0, '#120a2a'); sky.addColorStop(0.7, col(0.35)); sky.addColorStop(1, '#ffb38a');
    g.fillStyle = sky; g.fillRect(0, 0, S, S);
    glowAt(S * 0.72, S * 0.26, S * 0.18, 0.45);
    g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(S * 0.72, S * 0.26, S * 0.07, 0, 7); g.fill();
    let x = 0;
    while (x < S) {
      const w = S * (0.06 + rng() * 0.08), h = S * (0.18 + rng() * 0.4);
      g.fillStyle = '#0a0818'; g.fillRect(x, S - h, w, h);
      for (let wy = S - h + S * 0.02; wy < S - S * 0.02; wy += S * 0.03) for (let wx = x + S * 0.012; wx < x + w - S * 0.012; wx += S * 0.022) {
        if (rng() < 0.35) { g.fillStyle = rng() < 0.5 ? 'rgba(255,214,140,0.85)' : col(0.8); g.fillRect(wx, wy, S * 0.01, S * 0.012); }
      }
      x += w + S * 0.006;
    }
    g.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 40; i++) g.fillRect(rng() * S, rng() * S * 0.4, u, u);
  },
  // きらきらの多面体のかけら(フューチャーベース)
  prism(g, { S, u, rng, col, glowAt }) {
    glowAt(S / 2, S * 0.45, S * 0.5, 0.3);
    g.globalCompositeOperation = 'lighter';
    const hues = ['rgba(255,157,240,', 'rgba(140,200,255,', 'rgba(255,230,150,', 'rgba(170,255,230,'];
    for (let i = 0; i < 34; i++) {
      const cx = S * (0.15 + rng() * 0.7), cy = S * (0.1 + rng() * 0.6), rad = S * (0.04 + rng() * 0.14), rot = rng() * 7, n = 3 + Math.floor(rng() * 2);
      g.beginPath();
      for (let k = 0; k <= n; k++) { const a = rot + (k / n) * Math.PI * 2; g.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
      g.fillStyle = hues[i % 4] + (0.06 + rng() * 0.12) + ')'; g.fill();
      g.strokeStyle = hues[i % 4] + '0.6)'; g.lineWidth = Math.max(1, u); g.stroke();
    }
    for (let i = 0; i < 70; i++) { const x = rng() * S, y = rng() * S * 0.8, l = S * 0.015 * rng(); g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(x - l, y, l * 2, u); g.fillRect(x, y - l, u, l * 2); }
  },
  // 暗い倉庫に差し込むストロボと格子(テクノ)
  strobe(g, { S, u, rng, col, floor }) {
    floor(S * 0.66, S / 2, 0.2);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const x = S * (0.1 + i * 0.13), spread = S * (0.05 + rng() * 0.08);
      const gr = g.createLinearGradient(x, 0, x, S * 0.7);
      gr.addColorStop(0, col(0.5)); gr.addColorStop(1, col(0));
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - S * 0.004, 0); g.lineTo(x + S * 0.004, 0); g.lineTo(x + spread, S * 0.7); g.lineTo(x - spread, S * 0.7); g.fill();
    }
    for (let k = 1; k <= 6; k++) { const m = S * 0.07 * k; g.strokeStyle = col(0.08 + 0.04 * k); g.lineWidth = Math.max(1, u * 1.5); g.strokeRect(S / 2 - m, S * 0.38 - m * 0.6, m * 2, m * 1.2); }
  },
  // 夕日と海とヤシの木(ボサノバ)
  palms(g, { S, u, rng, col }) {
    const sky = g.createLinearGradient(0, 0, 0, S * 0.62);
    sky.addColorStop(0, '#1a0f30'); sky.addColorStop(1, col(0.75));
    g.fillStyle = sky; g.fillRect(0, 0, S, S * 0.62);
    g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(S * 0.5, S * 0.6, S * 0.14, Math.PI, 0); g.fill();
    g.fillStyle = '#0b1530'; g.fillRect(0, S * 0.6, S, S * 0.4);
    for (let i = 0; i < 14; i++) { const y = S * (0.62 + i * 0.022), w = S * (0.25 - i * 0.012); g.fillStyle = `rgba(255,220,150,${0.5 - i * 0.03})`; g.fillRect(S / 2 - w / 2 + (rng() - 0.5) * S * 0.04, y, w, Math.max(1, u * 1.5)); }
    const palm = (x, h, lean) => {
      g.strokeStyle = '#05060f'; g.lineWidth = S * 0.018; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, S * 0.62); g.quadraticCurveTo(x + lean * 0.5, S * 0.62 - h * 0.5, x + lean, S * 0.62 - h); g.stroke();
      g.fillStyle = '#05060f';
      for (let k = 0; k < 7; k++) {
        const a = -Math.PI / 2 + (k - 3) * 0.5, tx = x + lean, ty = S * 0.62 - h;
        g.beginPath(); g.moveTo(tx, ty);
        g.quadraticCurveTo(tx + Math.cos(a) * S * 0.12, ty + Math.sin(a) * S * 0.08 - S * 0.03, tx + Math.cos(a) * S * 0.18, ty + Math.sin(a) * S * 0.06 + S * 0.05);
        g.quadraticCurveTo(tx + Math.cos(a) * S * 0.1, ty + Math.sin(a) * S * 0.05, tx, ty); g.fill();
      }
    };
    palm(S * 0.14, S * 0.42, S * 0.05); palm(S * 0.86, S * 0.34, -S * 0.06);
  },
  // 鋭いかけらが飛び散る(ハードスタイル)
  shards(g, { S, u, rng, col, glowAt }) {
    glowAt(S / 2, S * 0.45, S * 0.35, 0.5);
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) {
      const a = rng() * Math.PI * 2, r0 = S * (0.05 + rng() * 0.1), r1 = r0 + S * (0.1 + rng() * 0.35), w = 0.03 + rng() * 0.06;
      const cx = S / 2, cy = S * 0.45;
      g.beginPath();
      g.moveTo(cx + Math.cos(a - w) * r0, cy + Math.sin(a - w) * r0);
      g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      g.lineTo(cx + Math.cos(a + w) * r0, cy + Math.sin(a + w) * r0);
      g.fillStyle = rng() < 0.2 ? 'rgba(255,255,255,0.5)' : col(0.15 + rng() * 0.35); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(S / 2, S * 0.45, S * 0.03, 0, 7); g.fill();
  },
  // 月と桜の花びら(和風)
  sakura(g, { S, u, rng, col, glowAt }) {
    glowAt(S * 0.5, S * 0.4, S * 0.4, 0.35);
    g.fillStyle = 'rgba(255,240,230,0.9)'; g.beginPath(); g.arc(S * 0.5, S * 0.4, S * 0.17, 0, 7); g.fill();
    g.strokeStyle = '#140812'; g.lineWidth = S * 0.02; g.lineCap = 'round';
    const branch = (x, y, a, len, w) => {
      if (len < S * 0.03) return;
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      branch(x2, y2, a - 0.4 - rng() * 0.3, len * 0.7, w * 0.7);
      branch(x2, y2, a + 0.3 + rng() * 0.3, len * 0.65, w * 0.7);
    };
    branch(0, S * 0.15, 0.25, S * 0.25, S * 0.03);
    for (let i = 0; i < 70; i++) {
      const x = rng() * S, y = rng() * S * 0.9, rr = S * (0.008 + rng() * 0.014);
      g.fillStyle = rng() < 0.5 ? 'rgba(255,170,200,0.85)' : col(0.8);
      g.beginPath(); g.ellipse(x, y, rr * 1.4, rr, rng() * 3, 0, 7); g.fill();
    }
  },
  // 夜の高速道路の光の筋(ユーロビート)
  speedlines(g, { S, u, rng, col }) {
    g.globalCompositeOperation = 'lighter';
    const vx = S * 0.5, vy = S * 0.45;
    for (let i = 0; i < 90; i++) {
      const a = rng() * Math.PI * 2, r0 = S * (0.05 + rng() * 0.15), r1 = r0 + S * (0.2 + rng() * 0.6);
      g.strokeStyle = rng() < 0.3 ? 'rgba(255,90,90,0.5)' : rng() < 0.5 ? 'rgba(255,255,255,0.4)' : col(0.6);
      g.lineWidth = Math.max(1, u * (0.5 + rng() * 2.5));
      g.beginPath(); g.moveTo(vx + Math.cos(a) * r0, vy + Math.sin(a) * r0 * 0.6); g.lineTo(vx + Math.cos(a) * r1, vy + Math.sin(a) * r1 * 0.6); g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#05060f'; g.beginPath(); g.moveTo(S * 0.3, S); g.lineTo(S * 0.48, S * 0.5); g.lineTo(S * 0.52, S * 0.5); g.lineTo(S * 0.7, S); g.fill();
    g.fillStyle = col(0.9); for (let k = 0; k < 6; k++) { const t = k / 6, y = S * 0.5 + (S * 0.5) * t * t, w = S * 0.004 + t * S * 0.012; g.fillRect(S / 2 - w / 2, y, w, S * 0.03 * (0.3 + t)); }
  },
  // 赤・黄・緑の夕日と波(レゲエ)
  waves(g, { S, u, rng, col }) {
    const bands = ['#ff4a4a', '#ffd84a', '#3ddc6e'];
    bands.forEach((c, i) => { g.fillStyle = c; g.globalAlpha = 0.18; g.fillRect(0, S * (0.1 + i * 0.15), S, S * 0.15); });
    g.globalAlpha = 1;
    g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(S / 2, S * 0.55, S * 0.16, Math.PI, 0); g.fill();
    for (let k = 0; k < 7; k++) {
      g.strokeStyle = k % 2 ? col(0.7) : 'rgba(255,255,255,0.35)'; g.lineWidth = Math.max(1, u * 2);
      g.beginPath();
      for (let x = 0; x <= S; x += S / 40) g.lineTo(x, S * (0.58 + k * 0.055) + Math.sin(x / S * 12 + k) * S * 0.012);
      g.stroke();
    }
  },
  // 煙と赤い月(トラップ)
  smoke(g, { S, u, rng, col, glowAt }) {
    glowAt(S * 0.62, S * 0.32, S * 0.25, 0.45);
    g.fillStyle = col(0.85); g.beginPath(); g.arc(S * 0.62, S * 0.32, S * 0.12, 0, 7); g.fill();
    g.fillStyle = '#05060f'; g.beginPath(); g.arc(S * 0.67, S * 0.29, S * 0.11, 0, 7); g.fill();
    for (let i = 0; i < 40; i++) {
      const x = rng() * S, y = S * (0.55 + rng() * 0.45), rr = S * (0.06 + rng() * 0.12);
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, 'rgba(180,160,220,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    g.fillStyle = 'rgba(255,255,255,0.6)'; for (let i = 0; i < 50; i++) g.fillRect(rng() * S, rng() * S * 0.5, u, u);
  },
  // アールデコの扇(エレクトロスウィング)
  deco(g, { S, u, col }) {
    const cx = S / 2, cy = S * 0.72;
    g.strokeStyle = col(0.85); g.lineWidth = Math.max(1, u * 1.6);
    for (let k = 1; k <= 6; k++) { g.beginPath(); g.arc(cx, cy, S * 0.07 * k, Math.PI, 0); g.stroke(); }
    for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * S * 0.42, cy + Math.sin(a) * S * 0.42); g.stroke(); }
    g.fillStyle = '#ffe9b0'; g.beginPath(); g.arc(cx, cy, S * 0.05, Math.PI, 0); g.fill();
    g.strokeStyle = 'rgba(255,233,176,0.5)'; g.lineWidth = Math.max(1, u);
    g.strokeRect(S * 0.08, S * 0.08, S * 0.84, S * 0.84); g.strokeRect(S * 0.11, S * 0.11, S * 0.78, S * 0.78);
  },
  // ハートと星がいっぱい(ハッピーハードコア)
  hearts(g, { S, u, rng, col, glowAt }) {
    glowAt(S / 2, S * 0.45, S * 0.5, 0.3);
    const heart = (x, y, r, c) => {
      g.fillStyle = c; g.beginPath(); g.moveTo(x, y + r * 0.9);
      g.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.6, y - r * 1.3, x, y - r * 0.4);
      g.bezierCurveTo(x + r * 0.6, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9); g.fill();
    };
    for (let i = 0; i < 26; i++) heart(rng() * S, rng() * S * 0.8, S * (0.02 + rng() * 0.05), rng() < 0.5 ? col(0.5 + rng() * 0.4) : `rgba(255,255,255,${0.3 + rng() * 0.4})`);
    heart(S / 2, S * 0.42, S * 0.16, col(0.95));
    g.fillStyle = '#fff'; for (let i = 0; i < 30; i++) { const x = rng() * S, y = rng() * S * 0.8, l = S * 0.012; g.fillRect(x - l, y, l * 2, u); g.fillRect(x, y - l, u, l * 2); }
  },
  // 白黒の市松模様(スカ)
  checker(g, { S, u, col }) {
    const n = 10, w = S / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if ((x + y) % 2) continue;
      g.save(); g.translate(S / 2, S / 2); g.rotate(-0.25); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect((x - n / 2) * w * 1.3, (y - n / 2) * w * 1.3, w * 1.3, w * 1.3); g.restore();
    }
    g.strokeStyle = col(0.9); g.lineWidth = S * 0.03;
    g.beginPath(); g.moveTo(0, S * 0.3); g.lineTo(S, S * 0.15); g.stroke();
    g.beginPath(); g.moveTo(0, S * 0.36); g.lineTo(S, S * 0.21); g.stroke();
  },
  // オーロラと山並み(オーケストラ)
  aurora(g, { S, u, rng, col }) {
    g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 4; k++) {
      g.strokeStyle = k % 2 ? col(0.25) : 'rgba(140,255,200,0.2)'; g.lineWidth = S * (0.05 + k * 0.02);
      g.beginPath();
      for (let x = -S * 0.1; x <= S * 1.1; x += S / 30) g.lineTo(x, S * (0.25 + k * 0.06) + Math.sin(x / S * 5 + k * 1.3) * S * 0.06);
      g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 70; i++) g.fillRect(rng() * S, rng() * S * 0.5, u, u);
    g.fillStyle = '#05060f'; g.beginPath(); g.moveTo(0, S);
    let x = 0; while (x <= S) { g.lineTo(x, S * (0.6 + rng() * 0.15)); x += S * (0.08 + rng() * 0.08); }
    g.lineTo(S, S); g.fill();
  },
  // パステルの空と格子と柱(ヴェイパーウェイヴ)
  vapor(g, { S, u, rng, col, floor }) {
    const sky = g.createLinearGradient(0, 0, 0, S * 0.6);
    sky.addColorStop(0, '#ff9ad5'); sky.addColorStop(1, '#8fd8ff');
    g.globalAlpha = 0.55; g.fillStyle = sky; g.fillRect(0, 0, S, S * 0.6); g.globalAlpha = 1;
    g.fillStyle = '#ffffff'; g.globalAlpha = 0.85;
    [[0.18, 0.22], [0.74, 0.3]].forEach(([cx, h]) => { g.fillRect(S * cx, S * (0.6 - h), S * 0.08, S * h); g.fillRect(S * (cx - 0.02), S * (0.6 - h), S * 0.12, S * 0.025); });
    g.globalAlpha = 1;
    g.fillStyle = '#1a0f30'; g.fillRect(0, S * 0.6, S, S * 0.4);
    floor(S * 0.6, S / 2, 0.6);
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = `700 ${Math.round(S * 0.07)}px "Noto Sans JP", sans-serif`; g.fillText('ヴェイパー', S * 0.3, S * 0.3);
  },
  // 巨大な目のようなターゲット(ボス戦)
  eye(g, { S, u, rng, col, glowAt }) {
    glowAt(S / 2, S * 0.45, S * 0.45, 0.4);
    g.strokeStyle = col(0.9); g.lineWidth = Math.max(1.5, u * 2);
    g.beginPath(); g.moveTo(S * 0.1, S * 0.45); g.quadraticCurveTo(S / 2, S * 0.12, S * 0.9, S * 0.45); g.quadraticCurveTo(S / 2, S * 0.78, S * 0.1, S * 0.45); g.stroke();
    g.fillStyle = col(0.9); g.beginPath(); g.arc(S / 2, S * 0.45, S * 0.12, 0, 7); g.fill();
    g.fillStyle = '#05060f'; g.beginPath(); g.ellipse(S / 2, S * 0.45, S * 0.025, S * 0.1, 0, 0, 7); g.fill();
    g.strokeStyle = col(0.35); g.lineWidth = Math.max(1, u);
    for (let k = 1; k < 4; k++) { g.beginPath(); g.arc(S / 2, S * 0.45, S * (0.2 + k * 0.08), 0, 7); g.stroke(); }
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.beginPath(); g.moveTo(S / 2 + Math.cos(a) * S * 0.25, S * 0.45 + Math.sin(a) * S * 0.25); g.lineTo(S / 2 + Math.cos(a) * S * 0.48, S * 0.45 + Math.sin(a) * S * 0.48); g.stroke(); }
    g.fillStyle = 'rgba(255,40,80,0.9)'; g.font = `800 ${Math.round(S * 0.045)}px Orbitron, sans-serif`; g.fillText('WARNING', S * 0.36, S * 0.82);
  },
  // 湯気の立つコーヒーカップ(アコースティック)
  cup(g, { S, u, rng, col, glowAt }) {
    glowAt(S * 0.5, S * 0.55, S * 0.4, 0.3);
    g.fillStyle = col(0.9);
    g.beginPath(); g.moveTo(S * 0.3, S * 0.45); g.lineTo(S * 0.66, S * 0.45); g.lineTo(S * 0.62, S * 0.7); g.quadraticCurveTo(S * 0.48, S * 0.76, S * 0.34, S * 0.7); g.closePath(); g.fill();
    g.strokeStyle = col(0.9); g.lineWidth = S * 0.025; g.beginPath(); g.arc(S * 0.68, S * 0.54, S * 0.06, -1.3, 1.3); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); g.ellipse(S * 0.48, S * 0.76, S * 0.26, S * 0.04, 0, 0, 7); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = Math.max(1, u * 2); g.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const x = S * (0.4 + k * 0.08); g.beginPath(); g.moveTo(x, S * 0.4); g.bezierCurveTo(x - S * 0.04, S * 0.32, x + S * 0.04, S * 0.26, x, S * 0.16); g.stroke(); }
    g.fillStyle = 'rgba(255,230,180,0.6)'; for (let i = 0; i < 40; i++) g.fillRect(rng() * S, rng() * S * 0.4, u, u);
  },
  // 流れるリボンと音符(J-POP)
  ribbon(g, { S, u, rng, col }) {
    g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 5; k++) {
      g.strokeStyle = k % 2 ? col(0.5) : 'rgba(255,255,255,0.35)'; g.lineWidth = S * (0.02 + k * 0.006);
      g.beginPath();
      for (let x = -S * 0.1; x <= S * 1.1; x += S / 40) g.lineTo(x, S * (0.3 + k * 0.08) + Math.sin(x / S * 6 + k) * S * 0.08);
      g.stroke();
    }
    g.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 9; i++) {
      const x = S * (0.1 + rng() * 0.8), y = S * (0.12 + rng() * 0.55), r = S * (0.02 + rng() * 0.02);
      g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(x, y, r * 1.2, r, -0.4, 0, 7); g.fill();
      g.fillRect(x + r * 0.9, y - r * 4, Math.max(1, u * 2), r * 4);
    }
  },
  // 赤いバラ(タンゴ)
  rose(g, { S, u, rng, col, glowAt }) {
    glowAt(S / 2, S * 0.42, S * 0.35, 0.4);
    const cx = S / 2, cy = S * 0.42;
    for (let k = 0; k < 7; k++) {
      const r = S * (0.2 - k * 0.025), a0 = k * 1.1;
      g.fillStyle = k % 2 ? col(0.85) : 'rgba(120,10,30,0.9)';
      g.beginPath(); g.arc(cx + Math.cos(a0) * S * 0.01, cy + Math.sin(a0) * S * 0.01, r, a0, a0 + Math.PI * 1.6); g.fill();
    }
    g.strokeStyle = 'rgba(60,140,80,0.9)'; g.lineWidth = S * 0.015;
    g.beginPath(); g.moveTo(cx, cy + S * 0.18); g.quadraticCurveTo(cx + S * 0.06, S * 0.75, cx - S * 0.02, S * 0.95); g.stroke();
    g.fillStyle = 'rgba(60,140,80,0.9)'; g.beginPath(); g.ellipse(cx + S * 0.07, S * 0.7, S * 0.06, S * 0.025, -0.5, 0, 7); g.fill();
  },
  // ケルトの結び目(ケルト)
  knot(g, { S, u, col, glowAt }) {
    glowAt(S / 2, S * 0.45, S * 0.4, 0.3);
    g.strokeStyle = col(0.9); g.lineWidth = S * 0.025;
    for (let k = 0; k < 3; k++) {
      const a = k * Math.PI * 2 / 3 - Math.PI / 2;
      g.beginPath(); g.ellipse(S / 2 + Math.cos(a) * S * 0.09, S * 0.45 + Math.sin(a) * S * 0.09, S * 0.16, S * 0.07, a, 0, 7); g.stroke();
    }
    g.lineWidth = Math.max(1, u * 1.5); g.strokeStyle = col(0.5);
    g.beginPath(); g.arc(S / 2, S * 0.45, S * 0.3, 0, 7); g.stroke();
    g.beginPath(); g.arc(S / 2, S * 0.45, S * 0.33, 0, 7); g.stroke();
  },
  // オルゴールの歯車と星(オルゴール)
  gears(g, { S, u, rng, col, glowAt }) {
    glowAt(S / 2, S * 0.4, S * 0.4, 0.3);
    const gear = (cx, cy, r, n, a0) => {
      g.beginPath();
      for (let i = 0; i <= n * 2; i++) { const a = a0 + (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 1.18; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      g.fill(); g.fillStyle = '#05060f'; g.beginPath(); g.arc(cx, cy, r * 0.35, 0, 7); g.fill();
    };
    g.fillStyle = col(0.8); gear(S * 0.38, S * 0.45, S * 0.14, 12, 0);
    g.fillStyle = 'rgba(255,230,160,0.8)'; gear(S * 0.62, S * 0.36, S * 0.09, 9, 0.2);
    g.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 30; i++) { const x = rng() * S, y = rng() * S * 0.8, l = S * 0.01; g.fillRect(x - l, y, l * 2, u); g.fillRect(x, y - l, u, l * 2); }
  },
  // 月と砂丘(アラビアン)
  dunes(g, { S, u, rng, col, glowAt }) {
    glowAt(S * 0.7, S * 0.25, S * 0.2, 0.4);
    g.fillStyle = 'rgba(255,240,200,0.9)'; g.beginPath(); g.arc(S * 0.7, S * 0.25, S * 0.07, 0, 7); g.fill();
    g.fillStyle = '#05060f'; g.beginPath(); g.arc(S * 0.73, S * 0.23, S * 0.06, 0, 7); g.fill();
    for (let k = 0; k < 4; k++) {
      g.fillStyle = k % 2 ? col(0.25 + k * 0.12) : `rgba(255,190,110,${0.15 + k * 0.1})`;
      g.beginPath(); g.moveTo(0, S);
      for (let x = 0; x <= S; x += S / 30) g.lineTo(x, S * (0.55 + k * 0.1) + Math.sin(x / S * 4 + k * 2) * S * 0.05);
      g.lineTo(S, S); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 60; i++) g.fillRect(rng() * S, rng() * S * 0.45, u, u);
  },
  // 赤いちょうちん(中華風)
  lantern(g, { S, u, rng, col, glowAt }) {
    const lamp = (x, y, r) => {
      glowAt(x, y, r * 2.2, 0.35);
      g.fillStyle = col(0.9); g.beginPath(); g.ellipse(x, y, r, r * 0.8, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,220,120,0.7)'; g.lineWidth = Math.max(1, u);
      for (let k = -2; k <= 2; k++) { g.beginPath(); g.ellipse(x, y, r * Math.abs(k) / 2.5, r * 0.8, 0, 0, 7); g.stroke(); }
      g.fillStyle = '#ffd25e'; g.fillRect(x - r * 0.35, y - r * 0.9, r * 0.7, r * 0.15); g.fillRect(x - r * 0.35, y + r * 0.75, r * 0.7, r * 0.15);
      g.strokeStyle = '#ffd25e'; g.beginPath(); g.moveTo(x, y + r * 0.9); g.lineTo(x, y + r * 1.3); g.stroke();
    };
    g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = Math.max(1, u); g.beginPath(); g.moveTo(0, S * 0.15); g.quadraticCurveTo(S / 2, S * 0.3, S, S * 0.15); g.stroke();
    lamp(S * 0.22, S * 0.32, S * 0.08); lamp(S * 0.5, S * 0.4, S * 0.11); lamp(S * 0.78, S * 0.32, S * 0.08);
  },
  // 鍵盤(ピアノ)
  piano(g, { S, u, rng, col, glowAt }) {
    glowAt(S / 2, S * 0.3, S * 0.4, 0.3);
    g.save(); g.translate(S / 2, S * 0.62); g.transform(1, 0, -0.35, 0.55, 0, 0);
    const n = 10, w = S * 1.1 / n;
    for (let i = 0; i < n; i++) { g.fillStyle = 'rgba(235,240,255,0.9)'; g.fillRect(-S * 0.55 + i * w, -S * 0.3, w - S * 0.006, S * 0.6); }
    for (let i = 0; i < n - 1; i++) { if (i % 7 === 2 || i % 7 === 6) continue; g.fillStyle = '#05060f'; g.fillRect(-S * 0.55 + (i + 1) * w - w * 0.3, -S * 0.3, w * 0.6, S * 0.36); }
    g.restore();
    g.fillStyle = col(0.6); for (let i = 0; i < 50; i++) { const x = rng() * S, y = rng() * S * 0.4; g.fillRect(x, y, Math.max(1, u), S * 0.02 * rng()); }
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

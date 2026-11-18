// 着せ替え(見た目と音)。値段と入手方法はサーバー(mlidar_skins)、見た目はここで決める
// note: ノーツの色(左から4レーン) / line: 判定ラインの色 / tap: 叩いた音 / hit: PERFECT のときの光り方
export const KIND = { note: 'ノーツ', line: '判定ライン', tap: 'タップ音', hit: 'ヒット演出' };
export const KIND_ORDER = ['note', 'line', 'tap', 'hit'];

export const LOOK = {
  // ノーツ(左右のレーン, 中の2レーン の順に4色)
  note_default: ['#5ef2ff', '#ff4fd8', '#ff4fd8', '#5ef2ff'],
  note_sunset: ['#ffb347', '#ff5e7e', '#ff5e7e', '#ffb347'],
  note_mint: ['#7dffc8', '#c8ff7d', '#c8ff7d', '#7dffc8'],
  note_mono: ['#f2f4ff', '#9aa3c0', '#9aa3c0', '#f2f4ff'],
  note_gold: ['#ffd76a', '#fff2b0', '#fff2b0', '#ffd76a'],
  note_rainbow: ['#ff5e7e', '#ffd76a', '#7dffc8', '#7da8ff'],
  note_aurora: ['#5effb1', '#7d8cff', '#c77dff', '#5effe8'],
  note_invite: ['#ff9ad5', '#9ae0ff', '#9ae0ff', '#ff9ad5'],
  note_crown: ['#ffd76a', '#b77dff', '#b77dff', '#ffd76a'],
  note_sakura: ['#ffc2df', '#fff0f6', '#fff0f6', '#ffc2df'],
  note_pumpkin: ['#ff8a2a', '#9b5cff', '#9b5cff', '#ff8a2a'],
  // 判定ライン [芯の色, 光の色]
  line_default: ['rgba(220,255,255,0.95)', '#7ff9ff'],
  line_pink: ['rgba(255,220,245,0.95)', '#ff6fe0'],
  line_lime: ['rgba(240,255,215,0.95)', '#a8ff4f'],
  line_gold: ['rgba(255,246,210,0.95)', '#ffc94a'],
  line_fire: ['rgba(255,230,200,0.95)', '#ff6a2a'],
  line_ice: ['rgba(235,250,255,0.95)', '#9fe6ff'],
  line_invite: ['rgba(255,240,250,0.95)', '#ff9ad5'],
  line_summer: ['rgba(255,245,225,0.95)', '#ff9f43'],
  line_xmas: ['rgba(235,255,240,0.95)', '#2fdc6a'],
};

// いまの着せ替え(ゲーム・プレビューが読む)
let equip = { note: 'default', line: 'default', tap: 'default', hit: 'default' };
const listeners = new Set();
export function setEquip(e) {
  equip = { note: 'default', line: 'default', tap: 'default', hit: 'default', ...(e || {}) };
  listeners.forEach((fn) => fn(equip));
}
export const getEquip = () => equip;
export const onEquip = (fn) => listeners.add(fn);
export const noteColors = () => LOOK[equip.note] || LOOK.note_default;
export const lineColors = () => LOOK[equip.line] || LOOK.line_default;
export const hitKind = () => (equip.hit && equip.hit !== 'default' ? equip.hit.slice(4) : 'spark');
export const tapKind = () => (equip.tap && equip.tap !== 'default' ? equip.tap.slice(4) : 'default');

// タップ音を作る(kind ごとに短い音)
export function makeTap(c, kind) {
  const sr = c.sampleRate;
  const len = Math.floor(sr * (kind === 'bell' ? 0.25 : kind === 'drum' ? 0.12 : 0.07));
  const b = c.createBuffer(1, len, sr), d = b.getChannelData(0);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    let v;
    switch (kind) {
      case 'click': v = (Math.random() * 2 - 1) * Math.exp(-t * 300) * 0.9 + Math.sin(2 * Math.PI * 4200 * t) * Math.exp(-t * 200) * 0.3; break;
      case 'drum': { const f = 180 * Math.exp(-t * 30) + 60; ph += 2 * Math.PI * f / sr; v = Math.sin(ph) * Math.exp(-t * 28) * 0.9 + (Math.random() * 2 - 1) * Math.exp(-t * 120) * 0.25; break; }
      case 'bell': v = (Math.sin(2 * Math.PI * 1568 * t) * 0.5 + Math.sin(2 * Math.PI * 3920 * t) * 0.25 + Math.sin(2 * Math.PI * 2349 * t) * 0.2) * Math.exp(-t * 16); break;
      case 'chip': v = (Math.sin(2 * Math.PI * (t < 0.025 ? 1760 : 2640) * t) > 0 ? 0.35 : -0.35) * Math.exp(-t * 35); break;
      case 'clap': { const k = [0, 0.008, 0.017].reduce((s, o) => s + (t >= o ? Math.exp(-(t - o) * 180) : 0), 0); v = (Math.random() * 2 - 1) * k * 0.55; break; }
      default: v = (Math.sin(2 * Math.PI * 2100 * t) * 0.5 + (Math.random() * 2 - 1) * 0.35) * Math.exp(-t * 90);
    }
    d[i] = v;
  }
  return b;
}

// ヒット演出の粒(game.js が呼ぶ)。kind ごとの形で描く
export function drawPart(g, kind, x, y, k, c, p) {
  switch (kind) {
    case 'ring': {
      if (p.i > 0) return; // 輪は1つの粒だけで描く
      const r = 6 + (1 - k) * 46;
      g.strokeStyle = c; g.globalAlpha = k; g.lineWidth = 3 * k + 1;
      g.beginPath(); g.ellipse(p.bx, p.by, r, r * 0.45, 0, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
      return;
    }
    case 'star': star(g, x, y, 3 + 5 * k, c, k, p.rot + (1 - k) * 4); return;
    case 'heart': heart(g, x, y, 4 + 5 * k, c, k); return;
    case 'petal': g.save(); g.translate(x, y); g.rotate(p.rot + (1 - k) * 6); g.fillStyle = c; g.globalAlpha = k; g.beginPath(); g.ellipse(0, 0, 5, 2.4, 0, 0, Math.PI * 2); g.fill(); g.restore(); return;
    case 'bubble': g.strokeStyle = c; g.globalAlpha = k; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 2 + (1 - k) * 7, 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; return;
    case 'pixel': { const s = 6 * k + 2; g.fillStyle = c; g.globalAlpha = k; g.fillRect(Math.round(x / 4) * 4 - s / 2, Math.round(y / 4) * 4 - s / 2, s, s); g.globalAlpha = 1; return; }
    default: g.fillStyle = c; g.globalAlpha = k; g.fillRect(x - 2, y - 2, 4 * k + 1, 4 * k + 1); g.globalAlpha = 1;
  }
}
// 粒の色(花びら・ハートは決まった色)
export const partColor = (kind, laneColor) => (kind === 'petal' ? '#ffb7d9' : kind === 'heart' ? '#ff6fa8' : kind === 'bubble' ? '#bff4ff' : laneColor);

function star(g, x, y, r, c, a, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = c; g.globalAlpha = a;
  g.beginPath();
  for (let i = 0; i < 10; i++) { const rr = i % 2 ? r * 0.45 : r, an = (i / 10) * Math.PI * 2 - Math.PI / 2; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
  g.closePath(); g.fill(); g.restore();
}
function heart(g, x, y, r, c, a) {
  g.save(); g.translate(x, y); g.fillStyle = c; g.globalAlpha = a;
  g.beginPath(); g.moveTo(0, r * 0.35);
  g.bezierCurveTo(-r, -r * 0.3, -r * 0.45, -r, 0, -r * 0.4);
  g.bezierCurveTo(r * 0.45, -r, r, -r * 0.3, 0, r * 0.35);
  g.fill(); g.restore();
}

// 着せ替えの見本(ショップのカード用に小さく描く)
export function drawSample(cv, id, kind) {
  const g = cv.getContext('2d'), w = cv.width, h = cv.height;
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#070a1c'; g.fillRect(0, 0, w, h);
  const key = id === 'default' ? kind + '_default' : id;
  if (kind === 'note') {
    const cs = LOOK[key] || LOOK.note_default;
    cs.forEach((c, i) => {
      const x = 8 + i * ((w - 16) / 4), y = h * (0.25 + (i % 2) * 0.3), ww = (w - 16) / 4 - 6;
      const gr = g.createLinearGradient(0, y, 0, y + 12);
      gr.addColorStop(0, '#fff'); gr.addColorStop(0.35, c); gr.addColorStop(1, c);
      g.shadowColor = c; g.shadowBlur = 8; g.fillStyle = gr; g.fillRect(x, y, ww, 12); g.shadowBlur = 0;
    });
  } else if (kind === 'line') {
    const [core, glow] = LOOK[key] || LOOK.line_default;
    g.shadowColor = glow; g.shadowBlur = 14; g.strokeStyle = core; g.lineWidth = 4;
    g.beginPath(); g.moveTo(8, h / 2); g.lineTo(w - 8, h / 2); g.stroke(); g.shadowBlur = 0;
    g.strokeStyle = glow; g.globalAlpha = 0.5; g.lineWidth = 1; g.beginPath(); g.moveTo(8, h / 2 - 6); g.lineTo(w - 8, h / 2 - 6); g.stroke(); g.globalAlpha = 1;
  } else if (kind === 'hit') {
    const hk = id === 'default' ? 'spark' : id.slice(4);
    let s = 7;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    g.globalCompositeOperation = 'lighter';
    if (hk === 'ring') drawPart(g, 'ring', 0, 0, 0.5, '#5ef2ff', { i: 0, bx: w / 2, by: h / 2 });
    else for (let i = 0; i < 14; i++) {
      const a = -Math.PI / 2 + (rnd() - 0.5) * 2.6, d = 8 + rnd() * 26;
      drawPart(g, hk, w / 2 + Math.cos(a) * d * 1.4, h * 0.7 + Math.sin(a) * d, 0.5 + rnd() * 0.5, partColor(hk, i % 2 ? '#5ef2ff' : '#ff4fd8'), { i: i + 1, rot: rnd() * 6 });
    }
    g.globalCompositeOperation = 'source-over';
  } else {
    // タップ音は波形の絵
    g.strokeStyle = '#5ef2ff'; g.lineWidth = 1.5; g.beginPath();
    const tk = id === 'default' ? 'default' : id.slice(4);
    for (let x = 0; x < w; x++) {
      const t = x / w, env = Math.exp(-t * (tk === 'bell' ? 3 : tk === 'drum' ? 6 : 10));
      const f = tk === 'drum' ? 6 : tk === 'chip' ? 18 : tk === 'bell' ? 26 : 30;
      const v = tk === 'chip' ? Math.sign(Math.sin(t * f * 6.28)) : Math.sin(t * f * 6.28 + (tk === 'click' || tk === 'clap' ? Math.sin(x * 7.3) * 3 : 0));
      g.lineTo(x, h / 2 + v * env * h * 0.38);
    }
    g.stroke();
  }
}

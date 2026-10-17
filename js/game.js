// ゲーム本体: 判定・スコア・3D風レーン描画・LiDAR演出
import { getCtx, bgmOut, nowAudio, playTap } from './audio.js';

export const LANE_COLORS = ['#5ef2ff', '#ff4fd8', '#ff4fd8', '#5ef2ff'];
export const KEYS = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
export const KEY_LABELS = ['D', 'F', 'J', 'K'];

const W_PERFECT = 0.045, W_GREAT = 0.09, W_GOOD = 0.135;
const SCORE_W = { PERFECT: 1, GREAT: 0.75, GOOD: 0.4, MISS: 0 };
const ACC_W = { PERFECT: 1, GREAT: 0.7, GOOD: 0.3, MISS: 0 };
const JUDGE_COLOR = { PERFECT: '#7ff9ff', GREAT: '#ff7ce6', GOOD: '#b6ff7a', MISS: '#ff5a6e' };

const Z_J = 10, Z_FAR = 34;

export function rankOf(score) {
  if (score >= 1000000) return 'MAX';
  if (score >= 975000) return 'S+';
  if (score >= 950000) return 'S';
  if (score >= 900000) return 'AA';
  if (score >= 850000) return 'A';
  if (score >= 750000) return 'B';
  if (score >= 600000) return 'C';
  return 'D';
}

export function visibleTime(hs) { return (Z_FAR - Z_J) / (hs * 4.4); }

// ---------------------------------------------------------------------------
// 背景の点群 (選曲画面とゲーム中で共通)
// ---------------------------------------------------------------------------
const CLOUD_L = 140;
export class PointCloud {
  constructor() {
    const pts = [];
    let seed = 7;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    // 地形
    for (let i = 0; i < 1500; i++) {
      const side = r() < 0.5 ? -1 : 1;
      const x = side * (3.5 + Math.pow(r(), 1.4) * 34);
      const z = r() * CLOUD_L;
      const y = Math.max(0, (Math.abs(x) - 4) * 0.18) * (0.6 + 0.6 * Math.sin(z * 0.11 + x * 0.21)) + r() * 0.2;
      pts.push({ x, y, z, h: 0 });
    }
    // 床のグリッド
    for (let i = 0; i < 260; i++) pts.push({ x: (r() - 0.5) * 7, y: 0, z: r() * CLOUD_L, h: 0 });
    // ビル(箱の輪郭)
    for (let b = 0; b < 46; b++) {
      const side = r() < 0.5 ? -1 : 1;
      const bx = side * (7 + r() * 26), bz = r() * CLOUD_L, w = 1 + r() * 2.5, d = 1 + r() * 3, hh = 3 + r() * 16;
      const n = Math.floor(18 + hh * 4);
      for (let i = 0; i < n; i++) {
        const e = Math.floor(r() * 4);
        const px = bx + (e & 1 ? w : 0) * (r() < 0.7 ? 1 : r());
        const pz = bz + (e & 2 ? d : 0) * (r() < 0.7 ? 1 : r());
        pts.push({ x: px, y: r() * hh, z: pz, h: 1 });
      }
      for (let i = 0; i < 10; i++) pts.push({ x: bx + r() * w, y: hh, z: bz + r() * d, h: 1 });
    }
    this.pts = pts;
  }

  // t: 秒, bpm, energy: 0..1(演出の強さ), color
  draw(g, W, H, t, bpm, energy = 0.5, color = '#5ef2ff') {
    const spb = 60 / bpm;
    const beatPh = ((t / spb) % 1 + 1) % 1;
    const pulse = Math.exp(-beatPh * 5) * energy;
    const travel = t * (bpm / 60) * 2.2;
    const horizon = H * 0.4, F = H * 0.95, camH = 2.6, cx = W / 2;
    const barPh = ((t / (spb * 4)) % 1 + 1) % 1;
    const scanZ = 2 + barPh * 70;
    const sway = Math.sin(t * 0.13) * 0.8;
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (const p of this.pts) {
      let z = (p.z - travel) % CLOUD_L;
      if (z < 0) z += CLOUD_L;
      z += 1.5;
      const sx = cx + (F * (p.x + sway)) / z;
      const sy = horizon + (F * (camH - p.y)) / z;
      if (sx < -4 || sx > W + 4 || sy < -4 || sy > H + 4) continue;
      const fade = Math.min(1, (CLOUD_L - z) / 40) * Math.min(1, z / 4);
      const scan = Math.max(0, 1 - Math.abs(z - scanZ) / 2.6);
      const a = (0.28 + pulse * 0.45 + scan * 0.9) * fade;
      if (a < 0.02) continue;
      const sz = Math.max(1, Math.min(3.4, 30 / z)) * (1 + scan * 0.6);
      g.globalAlpha = Math.min(1, a);
      g.fillStyle = scan > 0.2 ? '#e8ffff' : p.h ? color : '#5f7cff';
      g.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
    }
    g.restore();
  }
}

// ---------------------------------------------------------------------------
export class Game {
  constructor(canvas, { buffer, notes, settings, bpm, title, diff, color, cloud, onEnd }) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d');
    this.buffer = buffer;
    this.settings = settings;
    this.bpm = bpm;
    this.title = title;
    this.diff = diff;
    this.color = color;
    this.cloud = cloud;
    this.onEnd = onEnd;

    this.notes = notes.map((n) => ({ ...n, done: false, res: null, holding: false, tailDone: !n.end, tailRes: null }));
    this.byLane = [[], [], [], []];
    for (const n of this.notes) this.byLane[n.lane].push(n);
    this.laneIdx = [0, 0, 0, 0];
    this.drawStart = 0;
    this.total = this.notes.length + this.notes.filter((n) => n.end).length;
    this.counts = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
    this.fast = 0; this.slow = 0;
    this.sumScore = 0; this.sumAcc = 0; this.judged = 0;
    this.combo = 0; this.maxCombo = 0;
    this.pressed = [false, false, false, false];
    this.pressT = [-9, -9, -9, -9];
    this.fx = { lasers: [], scans: [], parts: [], judge: null, comboPop: 0 };
    this.paused = false;
    this.ended = false;
    this.v = settings.hs * 4.4;
    this.T = visibleTime(settings.hs);
    this.lastNoteT = this.notes.length ? Math.max(...this.notes.map((n) => n.end ?? n.t)) : 0;
  }

  start() {
    const ctx = getCtx();
    const first = this.notes.length ? this.notes[0].t : 2;
    this.leadIn = Math.max(1.6, this.T + 0.6 - first);
    this.src = ctx.createBufferSource();
    this.src.buffer = this.buffer;
    this.src.connect(bgmOut());
    this.startAt = ctx.currentTime + this.leadIn;
    this.src.start(this.startAt);
    this.endAt = Math.max(this.buffer.duration, this.lastNoteT + 1.5);
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  songTime(perfNow) { return nowAudio(perfNow) - this.startAt; }

  pause() {
    if (this.paused || this.ended) return;
    this.paused = true;
    getCtx().suspend();
  }
  resume() {
    if (!this.paused) return;
    this.paused = false;
    getCtx().resume();
    this.pressed = [false, false, false, false];
  }
  destroy() {
    this.ended = true;
    cancelAnimationFrame(this.raf);
    try { this.src.stop(); } catch { /* not started */ }
    getCtx().resume();
  }

  // --- 入力 ---------------------------------------------------------------
  press(lane, perfTime) {
    if (this.paused || this.ended || this.pressed[lane]) return;
    this.pressed[lane] = true;
    const t = this.songTime(perfTime);
    this.pressT[lane] = t;
    playTap();
    const list = this.byLane[lane];
    for (let i = this.laneIdx[lane]; i < list.length; i++) {
      const n = list[i];
      if (n.done) continue;
      const d = t - n.t;
      if (d < -W_GOOD) break;
      if (d > W_GOOD) continue;
      const res = judgeOf(d);
      n.done = true;
      n.res = res;
      this.applyJudge(res, d, lane);
      if (n.end) n.holding = true;
      break;
    }
  }

  release(lane, perfTime) {
    if (!this.pressed[lane]) return;
    this.pressed[lane] = false;
    if (this.paused || this.ended) return;
    const t = this.songTime(perfTime);
    for (const n of this.byLane[lane]) {
      if (!n.holding) continue;
      n.holding = false;
      n.tailDone = true;
      const d = t - n.end;
      if (d < -W_GOOD) { n.tailRes = 'MISS'; this.applyJudge('MISS', null, lane); }
      else { n.tailRes = judgeOf(Math.min(0, d)); this.applyJudge(n.tailRes, null, lane); }
    }
  }

  applyJudge(res, d, lane) {
    this.counts[res]++;
    this.judged++;
    this.sumScore += SCORE_W[res];
    this.sumAcc += ACC_W[res];
    if (res === 'MISS') this.combo = 0;
    else {
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.fx.comboPop = 1;
    }
    let tag = '';
    if (d != null && res !== 'PERFECT' && res !== 'MISS') {
      if (d < 0) { this.fast++; tag = 'FAST'; } else { this.slow++; tag = 'SLOW'; }
    }
    this.fx.judge = { res, tag, at: performance.now() };
    if (res !== 'MISS') this.spawnHit(lane, res);
  }

  get score() {
    if (!this.total) return 0;
    return Math.round((950000 * this.sumScore) / this.total + (50000 * this.maxCombo) / this.total);
  }
  get accuracy() { return this.judged ? (this.sumAcc / this.judged) * 100 : 100; }

  // --- 進行 ---------------------------------------------------------------
  update(t) {
    for (let l = 0; l < 4; l++) {
      const list = this.byLane[l];
      for (let i = this.laneIdx[l]; i < list.length; i++) {
        const n = list[i];
        if (!n.done) {
          if (t - n.t > W_GOOD) {
            n.done = true; n.res = 'MISS';
            this.applyJudge('MISS', null, l);
            if (n.end) { n.tailDone = true; n.tailRes = 'MISS'; this.applyJudge('MISS', null, l); }
          } else break;
        }
        if (n.holding && t >= n.end) {
          n.holding = false; n.tailDone = true; n.tailRes = 'PERFECT';
          this.applyJudge('PERFECT', null, l);
        }
      }
      while (this.laneIdx[l] < list.length && list[this.laneIdx[l]].done && list[this.laneIdx[l]].tailDone) this.laneIdx[l]++;
    }
    if (t > this.endAt + 0.8 && !this.ended) this.finish();
  }

  finish() {
    this.ended = true;
    cancelAnimationFrame(this.raf);
    const score = this.score;
    const r = {
      score,
      accuracy: this.total ? (this.sumAcc / this.total) * 100 : 0,
      maxCombo: this.maxCombo,
      counts: { ...this.counts },
      fast: this.fast, slow: this.slow,
      fc: this.counts.MISS === 0 && this.total > 0 && this.judged === this.total,
      ap: this.counts.PERFECT === this.total && this.total > 0,
      total: this.total,
    };
    r.rank = rankOf(score);
    this.onEnd?.(r);
  }

  // --- 描画 ---------------------------------------------------------------
  geom() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = this.canvas.clientWidth, H = this.canvas.clientHeight;
    if (this.canvas.width !== Math.round(W * dpr) || this.canvas.height !== Math.round(H * dpr)) {
      this.canvas.width = Math.round(W * dpr); this.canvas.height = Math.round(H * dpr);
    }
    const J = H * this.settings.judgePos;
    const laneW = Math.min(this.settings.laneW, (W - 24) / 4);
    const topY = H * 0.06;
    const r = Z_J / Z_FAR;
    const hz = (topY - J * r) / (1 - r);
    return { W, H, dpr, J, laneW, hz, cx: W / 2 };
  }

  proj(G, u, z) { return [G.cx + (u * G.laneW * Z_J) / z, G.hz + ((G.J - G.hz) * Z_J) / z]; }

  quad(G, u0, u1, z0, z1) {
    const g = this.g;
    const a = this.proj(G, u0, z0), b = this.proj(G, u1, z0), c = this.proj(G, u1, z1), d = this.proj(G, u0, z1);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(c[0], c[1]); g.lineTo(d[0], d[1]); g.closePath();
  }

  zOf(t, now) { return Z_J + (t - now) * this.v; }

  spawnHit(lane, res) {
    const now = performance.now();
    this.fx.lasers.push({ lane, at: now, res });
    this.fx.scans.push({ lane, at: now, wide: res === 'PERFECT' });
    if (res === 'PERFECT') {
      const n = 14;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
        const sp = 140 + Math.random() * 360;
        this.fx.parts.push({ lane, ox: (Math.random() - 0.5) * 0.8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, at: now, life: 380 + Math.random() * 300, c: LANE_COLORS[lane] });
      }
    }
  }

  loop(perfNow) {
    if (this.ended) return;
    this.raf = requestAnimationFrame(this.loop);
    if (this.paused) return;
    const t = this.songTime(perfNow);
    this.update(t);
    if (!this.ended) this.render(t, perfNow);
  }

  render(t, perfNow) {
    const G = this.geom();
    const g = this.g;
    g.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    const { W, H } = G;
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#02030a'); bg.addColorStop(1, '#070a1c');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const energy = 0.35 + Math.min(1, this.combo / 60) * 0.65;
    this.cloud.draw(g, W, H, Math.max(0, t), this.bpm, energy, this.color);

    // レーン床
    const zNear = Z_J * 0.82;
    g.save();
    this.quad(G, -2.06, 2.06, zNear, Z_FAR);
    g.fillStyle = 'rgba(3,6,18,0.82)';
    g.fill();
    for (let l = 0; l < 4; l++) {
      const u0 = l - 2, u1 = u0 + 1;
      if (this.pressed[l]) {
        this.quad(G, u0, u1, Z_J, Z_J + 9);
        const [, y0] = this.proj(G, 0, Z_J), [, y1] = this.proj(G, 0, Z_J + 9);
        const gr = g.createLinearGradient(0, y0, 0, y1);
        gr.addColorStop(0, hexA(LANE_COLORS[l], 0.38)); gr.addColorStop(1, hexA(LANE_COLORS[l], 0));
        g.fillStyle = gr; g.fill();
      }
    }
    // 区切り線
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i <= 4; i++) {
      const u = i - 2;
      const [x0, y0] = this.proj(G, u, zNear), [x1, y1] = this.proj(G, u, Z_FAR);
      const gr = g.createLinearGradient(x0, y0, x1, y1);
      const edge = i === 0 || i === 4;
      gr.addColorStop(0, edge ? 'rgba(94,242,255,0.9)' : 'rgba(150,170,255,0.35)');
      gr.addColorStop(1, 'rgba(150,170,255,0)');
      g.strokeStyle = gr; g.lineWidth = edge ? 2.2 : 1;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
    // 拍線
    const spb = 60 / this.bpm;
    const firstBeat = Math.ceil(t / spb);
    for (let b = firstBeat; ; b++) {
      const z = this.zOf(b * spb, t);
      if (z > Z_FAR) break;
      const [x0, y] = this.proj(G, -2, z), [x1] = this.proj(G, 2, z);
      g.strokeStyle = `rgba(120,140,255,${(b % 4 === 0 ? 0.28 : 0.1) * Math.min(1, (Z_FAR - z) / 6)})`;
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    }
    g.restore();

    // スキャン線(ヒット時、判定ラインから奥へ走る)
    g.save();
    g.globalCompositeOperation = 'lighter';
    this.fx.scans = this.fx.scans.filter((s) => perfNow - s.at < 420);
    for (const s of this.fx.scans) {
      const k = (perfNow - s.at) / 420;
      const z = Z_J + k * (Z_FAR - Z_J);
      const u0 = s.wide ? -2 : s.lane - 2, u1 = s.wide ? 2 : s.lane - 1;
      this.quad(G, u0, u1, z, z + 0.35);
      g.fillStyle = hexA(LANE_COLORS[s.lane], (1 - k) * (s.wide ? 0.55 : 0.8));
      g.fill();
    }
    // レーザー
    this.fx.lasers = this.fx.lasers.filter((s) => perfNow - s.at < 260);
    for (const s of this.fx.lasers) {
      const k = (perfNow - s.at) / 260;
      const u = s.lane - 1.5;
      const [x0, y0] = this.proj(G, u, Z_J), [x1, y1] = this.proj(G, u, Z_FAR);
      g.strokeStyle = hexA(LANE_COLORS[s.lane], 1 - k);
      g.lineWidth = (1 - k) * G.laneW * 0.5;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = `rgba(255,255,255,${1 - k})`;
      g.lineWidth = 2;
      g.stroke();
    }
    g.restore();

    // ノーツ
    while (this.drawStart < this.notes.length) {
      const n = this.notes[this.drawStart];
      if ((n.end ?? n.t) < t - 0.5 && n.done && n.tailDone) this.drawStart++;
      else break;
    }
    const vis = [];
    for (let i = this.drawStart; i < this.notes.length; i++) {
      const n = this.notes[i];
      if (n.t > t + this.T + 0.2) break;
      vis.push(n);
    }
    g.save();
    for (let i = vis.length - 1; i >= 0; i--) this.drawNote(G, vis[i], t);
    g.restore();

    // 判定ライン
    g.save();
    g.globalCompositeOperation = 'lighter';
    const [jx0, jy] = this.proj(G, -2.06, Z_J), [jx1] = this.proj(G, 2.06, Z_J);
    g.shadowColor = '#7ff9ff'; g.shadowBlur = 16;
    g.strokeStyle = 'rgba(220,255,255,0.95)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(jx0, jy); g.lineTo(jx1, jy); g.stroke();
    g.shadowBlur = 0;
    for (let l = 0; l < 4; l++) {
      const [x0, y0] = this.proj(G, l - 2 + 0.08, Z_J), [x1] = this.proj(G, l - 1 - 0.08, Z_J);
      g.fillStyle = this.pressed[l] ? hexA(LANE_COLORS[l], 0.9) : 'rgba(140,160,255,0.18)';
      g.fillRect(x0, y0 + 6, x1 - x0, 5);
      g.font = `600 ${Math.round(G.laneW * 0.16)}px "Orbitron", sans-serif`;
      g.textAlign = 'center';
      g.fillStyle = this.pressed[l] ? '#fff' : 'rgba(170,190,255,0.35)';
      g.fillText(KEY_LABELS[l], (x0 + x1) / 2, y0 + 32);
    }
    g.restore();

    // パーティクル
    g.save();
    g.globalCompositeOperation = 'lighter';
    this.fx.parts = this.fx.parts.filter((p) => perfNow - p.at < p.life);
    for (const p of this.fx.parts) {
      const s = (perfNow - p.at) / 1000;
      const [bx, by] = this.proj(G, p.lane - 1.5 + p.ox * 0.5, Z_J);
      const x = bx + p.vx * s, y = by + p.vy * s + 900 * s * s;
      const k = 1 - (perfNow - p.at) / p.life;
      g.fillStyle = hexA(p.c, k);
      g.fillRect(x - 2, y - 2, 4 * k + 1, 4 * k + 1);
    }
    g.restore();

    this.drawHud(G, t, perfNow);
  }

  drawNote(G, n, t) {
    const g = this.g;
    const c = LANE_COLORS[n.lane];
    const u0 = n.lane - 2 + 0.05, u1 = n.lane - 1 - 0.05;
    const thick = 0.55;
    const fade = (z) => Math.max(0, Math.min(1, (Z_FAR - z) / 4));
    if (n.end) {
      if (n.tailDone && n.tailRes !== 'MISS' && !n.holding) return;
      const failed = n.res === 'MISS' || n.tailRes === 'MISS';
      let zh = this.zOf(n.t, t);
      const zt = Math.min(Z_FAR, this.zOf(n.end, t));
      if (n.holding) zh = Z_J;
      if (zt <= Z_J * 0.82) return;
      const zhc = Math.max(Z_J * 0.82, Math.min(Z_FAR, zh));
      if (zhc < zt) {
        this.quad(G, u0 + 0.08, u1 - 0.08, zhc, zt);
        const [, y0] = this.proj(G, 0, zhc), [, y1] = this.proj(G, 0, zt);
        const gr = g.createLinearGradient(0, y0, 0, y1);
        const base = failed ? 'rgba(110,110,130,' : null;
        gr.addColorStop(0, failed ? base + '0.35)' : hexA(c, n.holding ? 0.75 : 0.45));
        gr.addColorStop(1, failed ? base + '0)' : hexA(c, 0.05));
        g.fillStyle = gr;
        g.fill();
        if (n.holding) {
          g.save(); g.globalCompositeOperation = 'lighter';
          g.strokeStyle = hexA(c, 0.8); g.lineWidth = 2; g.stroke();
          g.restore();
        }
      }
      // 終端
      if (zt < Z_FAR) {
        this.quad(G, u0, u1, zt, zt + 0.3);
        g.fillStyle = failed ? 'rgba(120,120,140,0.6)' : hexA(c, 0.7 * fade(zt));
        g.fill();
      }
      if (!n.done || n.res === 'MISS') this.drawHead(G, n, zh, failed ? '#777a88' : c, fade(zh));
      else if (n.holding) this.drawHead(G, n, Z_J, c, 1);
      return;
    }
    if (n.done) return;
    const z = this.zOf(n.t, t);
    if (z > Z_FAR + thick || z < Z_J * 0.75) return;
    this.drawHead(G, n, z, c, fade(z));
  }

  drawHead(G, n, z, c, alpha) {
    if (z > Z_FAR || z < Z_J * 0.75) return;
    const g = this.g;
    const u0 = n.lane - 2 + 0.05, u1 = n.lane - 1 - 0.05;
    const behind = z < Z_J ? Math.max(0, (z - Z_J * 0.75) / (Z_J * 0.25)) : 1;
    g.save();
    g.globalAlpha = alpha * behind;
    this.quad(G, u0, u1, z, z + 0.55);
    g.shadowColor = c; g.shadowBlur = 14;
    g.fillStyle = c;
    g.fill();
    g.shadowBlur = 0;
    this.quad(G, u0 + 0.12, u1 - 0.12, z + 0.14, z + 0.38);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fill();
    g.restore();
  }

  drawHud(G, t, perfNow) {
    const g = this.g;
    const { W, H } = G;
    const small = W < 700;
    // 進行バー
    const p = Math.max(0, Math.min(1, t / this.endAt));
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, W, 3);
    g.fillStyle = this.color; g.fillRect(0, 0, W * p, 3);

    g.save();
    g.textBaseline = 'top';
    // 左上: 曲名
    g.textAlign = 'left';
    g.fillStyle = 'rgba(220,235,255,0.9)';
    g.font = `700 ${small ? 13 : 16}px "Orbitron", sans-serif`;
    g.fillText(this.title, 16, 16);
    g.font = `600 ${small ? 11 : 12}px "Orbitron", sans-serif`;
    g.fillStyle = DIFF_COLOR[this.diff];
    g.fillText(this.diff.toUpperCase(), 16, small ? 34 : 38);
    // 右上: スコア
    g.textAlign = 'right';
    g.font = `700 ${small ? 20 : 30}px "Orbitron", sans-serif`;
    g.fillStyle = '#fff';
    g.shadowColor = this.color; g.shadowBlur = 12;
    g.fillText(String(this.score).padStart(7, '0'), W - 16, 14);
    g.shadowBlur = 0;
    g.font = `600 ${small ? 11 : 14}px "Orbitron", sans-serif`;
    g.fillStyle = 'rgba(200,220,255,0.85)';
    g.fillText(this.accuracy.toFixed(2) + '%', W - 16, small ? 40 : 50);
    g.restore();

    // コンボ
    const midY = G.J - (G.J - G.H * 0.06) * 0.5;
    if (this.combo >= 3) {
      this.fx.comboPop *= 0.85;
      const s = 1 + this.fx.comboPop * 0.18;
      g.save();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.translate(G.cx, midY);
      g.scale(s, s);
      g.font = `800 ${Math.round(G.laneW * 0.62)}px "Orbitron", sans-serif`;
      g.fillStyle = 'rgba(255,255,255,0.22)';
      g.fillText(this.combo, 0, 0);
      g.font = `700 ${Math.round(G.laneW * 0.13)}px "Orbitron", sans-serif`;
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillText('COMBO', 0, G.laneW * 0.45);
      g.restore();
    }
    // 判定
    const j = this.fx.judge;
    if (j && perfNow - j.at < 500) {
      const k = (perfNow - j.at) / 500;
      const s = 1 + Math.max(0, 0.25 - k) * 1.2;
      g.save();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.translate(G.cx, G.J - Math.min(140, (G.J - midY) * 0.55));
      g.scale(s, s);
      g.globalAlpha = 1 - Math.max(0, k - 0.6) / 0.4;
      g.font = `800 ${Math.round(Math.min(34, G.laneW * 0.3))}px "Orbitron", sans-serif`;
      g.fillStyle = JUDGE_COLOR[j.res];
      g.shadowColor = JUDGE_COLOR[j.res]; g.shadowBlur = 18;
      g.fillText(j.res, 0, 0);
      if (j.tag) {
        g.shadowBlur = 0;
        g.font = `700 12px "Orbitron", sans-serif`;
        g.fillStyle = j.tag === 'FAST' ? '#6fb8ff' : '#ff9a5c';
        g.fillText(j.tag, 0, 24);
      }
      g.restore();
    }
    // カウントダウン
    if (t < 0) {
      g.save();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '700 18px "Orbitron", sans-serif';
      g.fillStyle = `rgba(200,240,255,${0.5 + 0.5 * Math.sin(perfNow / 120)})`;
      g.fillText('READY', G.cx, H * 0.4);
      g.restore();
    }
  }

  // 現在の画面座標から、どのレーンか
  laneAt(x) {
    const G = this.geom();
    const l = Math.floor((x - G.cx) / G.laneW + 2);
    return Math.max(0, Math.min(3, l));
  }
}

export const DIFF_COLOR = { easy: '#6dffb0', normal: '#ffd25e', hard: '#ff5a8a' };

function judgeOf(d) {
  const a = Math.abs(d);
  if (a <= W_PERFECT) return 'PERFECT';
  if (a <= W_GREAT) return 'GREAT';
  if (a <= W_GOOD) return 'GOOD';
  return 'MISS';
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
}

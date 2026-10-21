// ゲーム本体: 判定・スコア・3D風レーン描画・LiDAR演出
import { getCtx, bgmOut, bgmOutFor, nowAudio, playTap } from './audio.js';
import { NO_SCROLL } from './gimmick.js';

export const LANE_COLORS = ['#5ef2ff', '#ff4fd8', '#ff4fd8', '#5ef2ff'];
export const KEYS = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'];
export const KEY_LABELS = ['D', 'F', 'J', 'K'];

const W_PERFECT = 0.045, W_GREAT = 0.09, W_GOOD = 0.135;
const SCORE_W = { PERFECT: 1, GREAT: 0.75, GOOD: 0.4, MISS: 0 };
const ACC_W = { PERFECT: 1, GREAT: 0.7, GOOD: 0.3, MISS: 0 };
const JUDGE_COLOR = { PERFECT: '#7ff9ff', GREAT: '#ff7ce6', GOOD: '#b6ff7a', MISS: '#ff5a6e' };

const Z_J = 10, Z_FAR = 34;

export const IS_TOUCH = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

// 演出の強さ (settings.fx): 0=オフ 1=控えめ 2=派手
export const FX_LEVELS = ['オフ', '控えめ', '派手'];
const FX = [
  { cloud: 0.18, pulse: 0, laser: 0, scan: 0, parts: 0, glow: 0, judgeGlow: 0 },
  { cloud: 0.4, pulse: 0.25, laser: 0.3, scan: 0.35, parts: 4, glow: 4, judgeGlow: 6 },
  { cloud: 1, pulse: 1, laser: 1, scan: 1, parts: 14, glow: 14, judgeGlow: 18 },
];

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

  // t: 秒, bpm, energy: 0..1(拍の脈動), amount: 0..1(全体の明るさ。演出設定)
  draw(g, W, H, t, bpm, energy = 0.5, color = '#5ef2ff', amount = 1) {
    if (amount <= 0) return;
    const step = IS_TOUCH || W < 700 ? 2 : 1;
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
    for (let i = 0; i < this.pts.length; i += step) {
      const p = this.pts[i];
      let z = (p.z - travel) % CLOUD_L;
      if (z < 0) z += CLOUD_L;
      z += 1.5;
      const sx = cx + (F * (p.x + sway)) / z;
      const sy = horizon + (F * (camH - p.y)) / z;
      if (sx < -4 || sx > W + 4 || sy < -4 || sy > H + 4) continue;
      const fade = Math.min(1, (CLOUD_L - z) / 40) * Math.min(1, z / 4);
      const scan = Math.max(0, 1 - Math.abs(z - scanZ) / 2.6);
      const a = (0.28 + pulse * 0.45 + scan * 0.9) * fade * amount;
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
  constructor(canvas, { buffer, notes, settings, bpm, title, diff, color, cloud, onEnd, team, scroll, offset, jacket, label, rivals, captions }) {
    this.captions = captions || null; // チュートリアル: [{ t, until, text, sub }]
    this.rivals = rivals || null; // みんなでライブ: () => [{ name, combo, me, done }]
    this.label = label || String(diff || '').toUpperCase();
    if (jacket) { this.jacketImg = new Image(); this.jacketImg.src = jacket; }
    this.introAt = performance.now();
    this.scroll = scroll || NO_SCROLL;
    this.offset = offset || 0; // 1拍目の位置(秒)。拍線をそろえる
    this.nowS = 0;
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
    // 編成効果あり側の集計(表示・コイン用)。上の counts/sumScore/combo は効果なしの素の値(ランキング用)
    this.team = { score: 0, judge: 0, guard: 0, ...(team || {}) };
    this.guardLeft = this.team.guard;
    this.tCounts = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
    this.tSum = 0; this.tCombo = 0; this.tMaxCombo = 0;
    this.pressed = [false, false, false, false];
    this.pressT = [-9, -9, -9, -9];
    this.fx = { lasers: [], scans: [], parts: [], judge: null, comboPop: 0, flash: [-1e9, -1e9, -1e9, -1e9], finishAt: 0 };
    this.paused = false;
    this.ended = false;
    this.v = settings.hs * 4.4;
    this.T = visibleTime(settings.hs);
    this.lastNoteT = this.notes.length ? Math.max(...this.notes.map((n) => n.end ?? n.t)) : 0;
  }

  // startFrom: 曲の途中から始める(譜面メーカーのテストプレイ用)。ノーツは呼び出し側で絞っておく
  // syncAt: みんなでライブ用。曲の頭(0秒)を鳴らす performance.now() の時刻。過ぎていたらその位置から途中で始める
  start(startFrom = 0, syncAt = null) {
    const ctx = getCtx();
    this.introAt = performance.now();
    const first = this.notes.length ? this.notes[0].t - startFrom : 2;
    this.leadIn = Math.max(1.6, this.T + 0.6 - first);
    if (syncAt != null) {
      this.live = true;
      const lead = (syncAt - performance.now()) / 1000;
      if (lead >= 0.3) { this.leadIn = lead; startFrom = 0; }
      else { this.leadIn = 0.3; startFrom = 0.3 - lead; }
    }
    this.src = ctx.createBufferSource();
    this.src.buffer = this.buffer;
    this.src.connect(bgmOutFor(this.buffer));
    this.startAt = ctx.currentTime + this.leadIn - startFrom;
    this.src.start(ctx.currentTime + this.leadIn, Math.min(startFrom, Math.max(0, this.buffer.duration - 0.05)));
    // 表示・判定用の時計。performance.now() で滑らかに進め、オーディオ時計に少しずつ合わせる
    const p = performance.now();
    this.anchorPerf = p;
    this.anchorSong = nowAudio(p) - this.startAt;
    this.holdSyncUntil = 0;
    this.endAt = Math.max(this.buffer.duration, this.lastNoteT + 1.5);
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  songTime(perfNow) { return this.anchorSong + (perfNow - this.anchorPerf) / 1000; }

  syncClock(perfNow) {
    if (perfNow < this.holdSyncUntil) return;
    const target = nowAudio(perfNow) - this.startAt;
    const err = target - this.songTime(perfNow);
    if (!Number.isFinite(err)) return;
    if (Math.abs(err) > 0.06) { this.anchorPerf = perfNow; this.anchorSong = target; }
    else this.anchorSong += err * 0.08;
  }

  pause() {
    if (this.paused || this.ended) return;
    this.paused = true;
    const p = performance.now();
    this.anchorSong = this.songTime(p);
    this.anchorPerf = p;
    getCtx().suspend();
  }
  resume() {
    if (!this.paused) return;
    this.paused = false;
    const p = performance.now();
    this.anchorPerf = p;
    // 再開直後はオーディオ側の時刻情報が古いことがあるので少し待ってから合わせる
    this.holdSyncUntil = p + 400;
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
      const res = judgeOf(d, this.team.judge);
      n.done = true;
      n.res = res;
      this.applyJudge(res, judgeOf(d), d, lane);
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
      if (d < -W_GOOD) { n.tailRes = 'MISS'; this.applyJudge('MISS', 'MISS', null, lane); }
      else { n.tailRes = judgeOf(Math.min(0, d), this.team.judge); this.applyJudge(n.tailRes, judgeOf(Math.min(0, d)), null, lane); }
    }
  }

  // res: 編成効果込みの判定 / raw: 効果なしの判定
  applyJudge(res, raw, d, lane) {
    this.counts[raw]++;
    this.judged++;
    this.sumScore += SCORE_W[raw];
    this.sumAcc += ACC_W[raw];
    if (raw === 'MISS') this.combo = 0;
    else { this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo); }

    this.tCounts[res]++;
    this.tSum += SCORE_W[res];
    let tag = '';
    if (res === 'MISS') {
      if (this.guardLeft > 0) { this.guardLeft--; tag = 'GUARD'; } else this.tCombo = 0;
    } else {
      this.tCombo++;
      this.tMaxCombo = Math.max(this.tMaxCombo, this.tCombo);
      this.fx.comboPop = 1;
    }
    if (d != null && res !== 'PERFECT' && res !== 'MISS') {
      if (d < 0) { this.fast++; tag = 'FAST'; } else { this.slow++; tag = 'SLOW'; }
    }
    this.fx.judge = { res, tag, at: performance.now() };
    if (this.judged === this.total && this.total > 0 && !this.fx.finishAt) this.fx.finishAt = performance.now();
    if (res !== 'MISS') this.spawnHit(lane, res);
  }

  get score() {
    if (!this.total) return 0;
    return Math.round((950000 * this.sumScore) / this.total + (50000 * this.maxCombo) / this.total);
  }
  // 編成効果込みのスコア(100万点を超えることがある)
  get teamScore() {
    if (!this.total) return 0;
    const base = (950000 * this.tSum) / this.total + (50000 * this.tMaxCombo) / this.total;
    return Math.round(base * (1 + this.team.score / 100));
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
            this.applyJudge('MISS', 'MISS', null, l);
            if (n.end) { n.tailDone = true; n.tailRes = 'MISS'; this.applyJudge('MISS', 'MISS', null, l); }
          } else break;
        }
        if (n.holding && t >= n.end) {
          n.holding = false; n.tailDone = true; n.tailRes = 'PERFECT';
          this.applyJudge('PERFECT', 'PERFECT', null, l);
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
      hits: this.counts.PERFECT + this.counts.GREAT,
      teamScore: this.teamScore,
      tCounts: { ...this.tCounts },
      tMaxCombo: this.tMaxCombo,
      hasTeam: this.team.score > 0 || this.team.judge > 0 || this.team.guard > 0,
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

  // ノーツの奥行き。時刻ではなくスクロール量で決める(停止・変速ギミック用)。render の最初で nowS を更新する
  zOf(t) { return Z_J + (this.scroll.S(t) - this.nowS) * this.v; }

  get F() { return FX[this.settings.fx ?? 1] || FX[1]; }

  spawnHit(lane, res) {
    const now = performance.now();
    this.fx.flash[lane] = now;
    const F = this.F;
    const beam = !!this.settings.hitBeam;
    if (beam && F.laser > 0) this.fx.lasers.push({ lane, at: now, res });
    if (beam && F.scan > 0) this.fx.scans.push({ lane, at: now, wide: res === 'PERFECT' && F.scan >= 1 });
    if (res === 'PERFECT') {
      const n = F.parts;
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
    this.syncClock(perfNow);
    const t = this.songTime(perfNow);
    this.update(t);
    if (!this.ended) this.render(t, perfNow);
  }

  render(t, perfNow) {
    this.nowS = this.scroll.S(t);
    const G = this.geom();
    const g = this.g;
    g.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    const { W, H } = G;
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#02030a'); bg.addColorStop(1, '#070a1c');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const F = this.F;
    const energy = (0.35 + Math.min(1, this.tCombo / 60) * 0.65) * F.pulse;
    this.cloud.draw(g, W, H, Math.max(0, t), this.bpm, energy, this.color, F.cloud);

    // レーン床(始まりは奥へ伸びていく)
    const zNear = Z_J * 0.82;
    const intro = Math.min(1, (perfNow - this.introAt) / 750);
    const zLim = zNear + (Z_FAR - zNear) * (1 - Math.pow(1 - intro, 3));
    g.save();
    this.quad(G, -2.06, 2.06, zNear, zLim);
    const [, fy0] = this.proj(G, 0, zNear), [, fy1] = this.proj(G, 0, zLim);
    const floorGr = g.createLinearGradient(0, fy0, 0, fy1);
    floorGr.addColorStop(0, 'rgba(8,12,32,0.95)'); floorGr.addColorStop(1, 'rgba(3,5,16,0.9)');
    g.fillStyle = floorGr;
    g.fill();
    for (let l = 1; l < 4; l += 2) { // 1本おきに少しだけ明るく
      this.quad(G, l - 2, l - 1, zNear, zLim);
      g.fillStyle = 'rgba(120,140,255,0.025)';
      g.fill();
    }
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
      const [x0, y0] = this.proj(G, u, zNear), [x1, y1] = this.proj(G, u, zLim);
      const gr = g.createLinearGradient(x0, y0, x1, y1);
      const edge = i === 0 || i === 4;
      gr.addColorStop(0, edge ? 'rgba(94,242,255,0.9)' : 'rgba(150,170,255,0.35)');
      gr.addColorStop(1, 'rgba(150,170,255,0)');
      g.strokeStyle = gr; g.lineWidth = edge ? 2.2 : 1;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
    // 両脇のレール: 流れる速さに合わせて手前へ流れる目印
    const spb = 60 / this.bpm;
    const railStart = Math.ceil((t - this.offset) / (spb / 2));
    for (let k = railStart; k < railStart + 200; k++) {
      const z = this.zOf(this.offset + k * spb / 2);
      if (z > zLim) break;
      if (z < zNear) continue;
      const a = 0.5 * Math.min(1, (zLim - z) / 6) * (k % 2 ? 0.5 : 1);
      for (const [ua, ub] of [[-2.32, -2.16], [2.16, 2.32]]) {
        this.quad(G, ua, ub, z, z + 0.45);
        g.fillStyle = `rgba(94,242,255,${a})`;
        g.fill();
      }
    }
    // 拍線
    const firstBeat = Math.ceil((t - this.offset) / spb);
    for (let b = firstBeat; b < firstBeat + 400; b++) {
      const z = this.zOf(this.offset + b * spb);
      if (z > zLim) break;
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
      g.fillStyle = hexA(LANE_COLORS[s.lane], (1 - k) * (s.wide ? 0.55 : 0.8) * F.scan);
      g.fill();
    }
    // レーザー
    this.fx.lasers = this.fx.lasers.filter((s) => perfNow - s.at < 260);
    for (const s of this.fx.lasers) {
      const k = (perfNow - s.at) / 260;
      const u = s.lane - 1.5;
      const [x0, y0] = this.proj(G, u, Z_J), [x1, y1] = this.proj(G, u, Z_FAR);
      g.strokeStyle = hexA(LANE_COLORS[s.lane], (1 - k) * F.laser);
      g.lineWidth = (1 - k) * G.laneW * 0.5 * F.laser;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      g.strokeStyle = `rgba(255,255,255,${(1 - k) * F.laser})`;
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
      if (this.scroll.S(n.t) - this.nowS > (Z_FAR - Z_J) / this.v + 0.2) break;
      vis.push(n);
    }
    g.save();
    for (let i = vis.length - 1; i >= 0; i--) this.drawNote(G, vis[i], t);
    g.restore();

    // 隠し(サドゥン)ギミック: レーンの奥を覆う
    const cover = this.scroll.coverAt(t);
    if (cover > 0.01) {
      const zc = Z_FAR - cover * (Z_FAR - Z_J);
      g.save();
      this.quad(G, -2.08, 2.08, zc, Z_FAR + 1);
      g.fillStyle = 'rgba(4,6,16,0.97)';
      g.fill();
      const [x0, y] = this.proj(G, -2.08, zc), [x1] = this.proj(G, 2.08, zc);
      g.strokeStyle = 'rgba(196,155,255,0.8)';
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
      g.restore();
    }

    // 判定ラインの下のキー(押すと光る)
    g.save();
    for (let l = 0; l < 4; l++) {
      const c = LANE_COLORS[l], on = this.pressed[l];
      const flash = Math.max(0, 1 - (perfNow - this.fx.flash[l]) / 160);
      this.quad(G, l - 2 + 0.06, l - 1 - 0.06, Z_J * 0.915, Z_J * 0.985);
      const [, ky0] = this.proj(G, 0, Z_J * 0.915), [, ky1] = this.proj(G, 0, Z_J * 0.985);
      const kg = g.createLinearGradient(0, ky1, 0, ky0);
      if (on) { kg.addColorStop(0, hexA(c, 0.95)); kg.addColorStop(1, hexA(c, 0.45)); }
      else { kg.addColorStop(0, 'rgba(30,40,80,0.9)'); kg.addColorStop(1, 'rgba(10,14,34,0.9)'); }
      g.fillStyle = kg; g.fill();
      g.strokeStyle = hexA(c, on ? 1 : 0.45); g.lineWidth = 1.2; g.stroke();
      if (flash > 0) { g.fillStyle = `rgba(255,255,255,${flash * 0.7})`; g.fill(); }
      if (!IS_TOUCH) {
        const [kx0] = this.proj(G, l - 2, Z_J * 0.95), [kx1] = this.proj(G, l - 1, Z_J * 0.95);
        g.font = `700 ${Math.round(G.laneW * 0.15)}px "Orbitron", sans-serif`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = on ? '#fff' : 'rgba(170,190,255,0.5)';
        g.fillText(KEY_LABELS[l], (kx0 + kx1) / 2, (ky0 + ky1) / 2);
      }
    }
    // 判定ライン(光が左右に走る)
    g.globalCompositeOperation = 'lighter';
    const [jx0, jy] = this.proj(G, -2.06, Z_J), [jx1] = this.proj(G, 2.06, Z_J);
    g.shadowColor = '#7ff9ff'; g.shadowBlur = F.judgeGlow;
    g.strokeStyle = 'rgba(220,255,255,0.95)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(jx0, jy); g.lineTo(jx1, jy); g.stroke();
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(94,242,255,0.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(jx0, jy - 5); g.lineTo(jx1, jy - 5); g.stroke();
    const sx = jx0 + (jx1 - jx0) * ((perfNow / 1700) % 1);
    const sh = g.createLinearGradient(sx - 60, 0, sx + 60, 0);
    sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.9)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    g.strokeStyle = sh; g.lineWidth = 3;
    g.beginPath(); g.moveTo(Math.max(jx0, sx - 60), jy); g.lineTo(Math.min(jx1, sx + 60), jy); g.stroke();
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
      let zh = this.zOf(n.t);
      const zt = Math.min(Z_FAR, this.zOf(n.end));
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
        g.save();
        g.globalCompositeOperation = 'lighter';
        g.strokeStyle = failed ? 'rgba(140,140,160,0.4)' : hexA(c, n.holding ? 0.9 : 0.5);
        g.lineWidth = n.holding ? 2 : 1.2;
        g.stroke();
        if (!failed) { // 帯の中を光が流れる
          const step = 1.4, ph = ((performance.now() / 1000) * (n.holding ? 9 : 4)) % step;
          for (let z = zhc + step - ph; z < zt; z += step) {
            this.quad(G, u0 + 0.14, u1 - 0.14, z, Math.min(zt, z + 0.18));
            g.fillStyle = `rgba(255,255,255,${(n.holding ? 0.4 : 0.18) * Math.min(1, (Z_FAR - z) / 5)})`;
            g.fill();
          }
        }
        g.restore();
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
    const z = this.zOf(n.t);
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
    const [, yb] = this.proj(G, 0, z), [, yt] = this.proj(G, 0, z + 0.55);
    const ng = g.createLinearGradient(0, yt, 0, yb);
    ng.addColorStop(0, '#ffffff'); ng.addColorStop(0.3, c); ng.addColorStop(1, hexA(c, 0.55));
    g.shadowColor = c; g.shadowBlur = this.F.glow;
    g.fillStyle = ng;
    g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1;
    g.stroke();
    this.quad(G, u0 + 0.16, u1 - 0.16, z + 0.2, z + 0.32);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.fill();
    g.restore();
  }

  drawHud(G, t, perfNow) {
    const g = this.g;
    const { W, H } = G;
    const small = W < 700;
    const tc = this.tCounts;
    // フルコンボ/オールパーフェクトが続いているか
    const status = tc.MISS === 0 ? (tc.GREAT === 0 && tc.GOOD === 0 ? 'AP' : 'FC') : '';
    const stColor = status === 'AP' ? '#ffd25e' : status === 'FC' ? '#7ff9ff' : this.color;

    // 進行バー
    const p = Math.max(0, Math.min(1, t / this.endAt));
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, 0, W, 3);
    g.fillStyle = stColor; g.fillRect(0, 0, W * p, 3);
    g.fillStyle = '#fff'; g.fillRect(W * p - 2, 0, 2, 3);

    g.save();
    g.textBaseline = 'top';
    // 左上: ジャケット・曲名・難易度
    let x = 14;
    const js = small ? 36 : 46;
    if (this.jacketImg?.complete && this.jacketImg.naturalWidth) {
      g.drawImage(this.jacketImg, x, 12, js, js);
      g.strokeStyle = hexA(this.color, 0.8); g.lineWidth = 1; g.strokeRect(x + 0.5, 12.5, js - 1, js - 1);
      x += js + 10;
    }
    g.textAlign = 'left';
    g.fillStyle = 'rgba(230,240,255,0.95)';
    g.font = `700 ${small ? 13 : 16}px "Orbitron", "Noto Sans JP", sans-serif`;
    g.fillText(this.title, x, 14);
    g.font = `700 ${small ? 10 : 11}px "Orbitron", sans-serif`;
    const lw = g.measureText(this.label).width + 14;
    const dc = DIFF_COLOR[this.diff] || this.color;
    g.strokeStyle = dc; g.lineWidth = 1;
    g.strokeRect(x + 0.5, (small ? 33 : 38) + 0.5, lw, small ? 15 : 17);
    g.fillStyle = dc;
    g.fillText(this.label, x + 7, (small ? 33 : 38) + (small ? 3 : 4));

    // 右上: スコア・精度・FC/AP
    g.textAlign = 'right';
    g.font = `700 ${small ? 9 : 10}px "Orbitron", sans-serif`;
    g.fillStyle = 'rgba(160,180,230,0.7)';
    g.fillText('S C O R E', W - 16, 10);
    g.font = `800 ${small ? 20 : 30}px "Orbitron", sans-serif`;
    g.fillStyle = '#fff';
    g.shadowColor = this.color; g.shadowBlur = this.F.glow;
    g.fillText(String(this.teamScore).padStart(7, '0'), W - 16, small ? 22 : 24);
    g.shadowBlur = 0;
    g.font = `600 ${small ? 11 : 13}px "Orbitron", sans-serif`;
    g.fillStyle = 'rgba(200,220,255,0.85)';
    const accY = small ? 46 : 60;
    g.fillText(this.accuracy.toFixed(2) + '%', W - 16, accY);
    if (status) {
      const aw = g.measureText(this.accuracy.toFixed(2) + '%').width;
      g.font = `800 ${small ? 10 : 11}px "Orbitron", sans-serif`;
      g.fillStyle = stColor;
      g.fillText(status, W - 26 - aw, accY + 1);
    }
    g.restore();

    if (this.rivals) this.drawRivals(g, W, small, perfNow);
    // コンボ
    const midY = G.J - (G.J - G.H * 0.06) * 0.5;
    if (this.tCombo >= 3) {
      this.fx.comboPop *= 0.85;
      const s = 1 + this.fx.comboPop * 0.18;
      g.save();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.translate(G.cx, midY);
      g.scale(s, s);
      const fs = Math.round(G.laneW * 0.62);
      g.font = `900 ${fs}px "Orbitron", sans-serif`;
      const cg = g.createLinearGradient(0, -fs / 2, 0, fs / 2);
      cg.addColorStop(0, 'rgba(255,255,255,0.4)'); cg.addColorStop(1, hexA(stColor, 0.22));
      g.fillStyle = cg;
      g.fillText(this.tCombo, 0, 0);
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1;
      g.strokeText(this.tCombo, 0, 0);
      g.font = `700 ${Math.round(G.laneW * 0.12)}px "Orbitron", sans-serif`;
      g.fillStyle = hexA(stColor, 0.55);
      g.fillText('C O M B O', 0, G.laneW * 0.45);
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
      g.font = `900 ${Math.round(Math.min(34, G.laneW * 0.3))}px "Orbitron", sans-serif`;
      g.lineWidth = 4; g.strokeStyle = 'rgba(2,3,10,0.85)';
      g.strokeText(j.res, 0, 0);
      g.fillStyle = JUDGE_COLOR[j.res];
      g.shadowColor = JUDGE_COLOR[j.res]; g.shadowBlur = this.F.judgeGlow;
      g.fillText(j.res, 0, 0);
      if (j.tag) {
        g.shadowBlur = 0;
        g.font = `800 12px "Orbitron", sans-serif`;
        g.fillStyle = j.tag === 'FAST' ? '#6fb8ff' : j.tag === 'GUARD' ? '#ffd25e' : '#ff9a5c';
        g.fillText(j.tag, 0, 24);
      }
      g.restore();
    }
    // READY → GO
    if (t < 0.25) {
      g.save();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (t < -0.6) {
        g.font = '800 22px "Orbitron", sans-serif';
        g.fillStyle = `rgba(200,240,255,${0.55 + 0.45 * Math.sin(perfNow / 110)})`;
        g.fillText('R E A D Y', G.cx, H * 0.4);
        if (this.live && t < -1.1) {
          // みんなでライブ: 全員そろって始まるまでのカウントダウン
          const n = Math.ceil(-t - 0.6);
          const k = (-t - 0.6) % 1;
          g.font = `900 ${Math.round(48 + k * 20)}px "Orbitron", sans-serif`;
          g.fillStyle = `rgba(255,255,255,${0.35 + 0.65 * k})`;
          g.shadowColor = this.color; g.shadowBlur = 20;
          g.fillText(String(n), G.cx, H * 0.4 + 56);
          g.shadowBlur = 0;
          g.font = '700 11px "Orbitron", "Noto Sans JP", sans-serif';
          g.fillStyle = 'rgba(255,120,160,0.9)';
          g.fillText('MULTI LIVE ・ 全員同時にスタート', G.cx, H * 0.4 - 34);
        }
      } else {
        const k = Math.min(1, (t + 0.6) / 0.85);
        g.globalAlpha = 1 - Math.max(0, k - 0.6) / 0.4;
        g.translate(G.cx, H * 0.4);
        g.scale(1 + k * 0.6, 1 + k * 0.6);
        g.font = '900 34px "Orbitron", sans-serif';
        g.fillStyle = '#fff'; g.shadowColor = this.color; g.shadowBlur = 24;
        g.fillText('GO!', 0, 0);
      }
      g.restore();
    }
    if (this.captions) this.drawCaption(g, W, H, t, small);
    // 最後のノーツの後: FULL COMBO / ALL PERFECT
    if (this.fx.finishAt && status) {
      const k = Math.min(1, (perfNow - this.fx.finishAt) / 450);
      const text = status === 'AP' ? 'ALL PERFECT' : 'FULL COMBO';
      g.save();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const y = H * 0.42, bw = W * k;
      g.fillStyle = hexA(stColor, 0.14);
      g.fillRect(G.cx - bw / 2, y - 34, bw, 68);
      g.fillStyle = hexA(stColor, 0.8);
      g.fillRect(G.cx - bw / 2, y - 35, bw, 1.5); g.fillRect(G.cx - bw / 2, y + 34, bw, 1.5);
      g.beginPath(); g.rect(G.cx - bw / 2, y - 40, bw, 80); g.clip();
      g.font = `900 ${small ? 28 : 40}px "Orbitron", sans-serif`;
      g.fillStyle = '#fff'; g.shadowColor = stColor; g.shadowBlur = 26;
      g.fillText(text.split('').join(' '), G.cx, y);
      g.restore();
    }
  }

  // チュートリアルの説明(画面上のほうに大きく)
  drawCaption(g, W, H, t, small) {
    const c = this.captions.find((x) => t >= x.t && t < x.until);
    if (!c) return;
    const a = Math.min(1, (t - c.t) / 0.35, (c.until - t) / 0.35);
    const y = H * (small ? 0.2 : 0.18);
    g.save();
    g.globalAlpha = Math.max(0, a);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 ${small ? 17 : 24}px "Noto Sans JP", sans-serif`;
    const w1 = g.measureText(c.text).width;
    g.font = `500 ${small ? 11 : 14}px "Noto Sans JP", sans-serif`;
    const w2 = c.sub ? g.measureText(c.sub).width : 0;
    const bw = Math.min(W - 20, Math.max(w1, w2) + 48), bh = c.sub ? (small ? 62 : 78) : (small ? 40 : 52);
    g.fillStyle = 'rgba(4,8,22,0.82)';
    g.fillRect(W / 2 - bw / 2, y - bh / 2, bw, bh);
    g.fillStyle = this.color; g.fillRect(W / 2 - bw / 2, y - bh / 2, bw, 2); g.fillRect(W / 2 - bw / 2, y + bh / 2 - 2, bw, 2);
    g.font = `800 ${small ? 17 : 24}px "Noto Sans JP", sans-serif`;
    g.fillStyle = '#fff'; g.shadowColor = this.color; g.shadowBlur = 12;
    g.fillText(c.text, W / 2, c.sub ? y - (small ? 11 : 14) : y);
    g.shadowBlur = 0;
    if (c.sub) {
      g.font = `500 ${small ? 11 : 14}px "Noto Sans JP", sans-serif`;
      g.fillStyle = 'rgba(210,225,255,0.9)';
      g.fillText(c.sub, W / 2, y + (small ? 14 : 18), W - 30);
    }
    g.restore();
  }

  // みんなでライブ: 左側にみんなのコンボ(数秒おきに更新)
  drawRivals(g, W, small, perfNow) {
    const list = this.rivals();
    if (!list.length) return;
    const rows = list.slice().sort((a, b) => b.combo - a.combo).slice(0, 8);
    const x = 14, y0 = small ? 60 : 72, rh = small ? 15 : 18, w = small ? 120 : 160;
    g.save();
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(4,8,22,0.55)';
    g.fillRect(x, y0, w, 16 + rows.length * rh + 4);
    g.fillStyle = hexA(this.color, 0.8); g.fillRect(x, y0, 2, 16 + rows.length * rh + 4);
    g.font = `700 ${small ? 8 : 9}px "Orbitron", sans-serif`;
    g.fillStyle = `rgba(255,90,140,${0.6 + 0.4 * Math.sin(perfNow / 300)})`;
    g.textAlign = 'left';
    g.beginPath(); g.arc(x + 11, y0 + 9, 2.5, 0, Math.PI * 2); g.fill();
    g.fillText('LIVE', x + 17, y0 + 9);
    g.fillStyle = 'rgba(160,180,230,0.7)';
    g.textAlign = 'right';
    g.fillText('COMBO', x + w - 8, y0 + 9);
    rows.forEach((r, i) => {
      const y = y0 + 16 + i * rh + rh / 2;
      if (r.me) { g.fillStyle = hexA(this.color, 0.16); g.fillRect(x + 2, y - rh / 2, w - 2, rh); }
      g.textAlign = 'left';
      g.font = `${r.me ? 700 : 500} ${small ? 10 : 12}px "Noto Sans JP", sans-serif`;
      g.fillStyle = r.me ? '#fff' : 'rgba(210,225,255,0.85)';
      let name = r.name;
      while (name.length > 1 && g.measureText(name).width > w - 64) name = name.slice(0, -1);
      g.fillText((i + 1) + ' ' + (name !== r.name ? name + '…' : name), x + 8, y);
      g.textAlign = 'right';
      g.font = `800 ${small ? 10 : 12}px "Orbitron", sans-serif`;
      g.fillStyle = r.done ? '#ffd25e' : r.me ? this.color : '#9fe8ff';
      g.fillText(r.done ? 'FIN' : String(r.combo), x + w - 8, y);
    });
    g.restore();
  }

  // 現在の画面座標から、どのレーンか
  laneAt(x) {
    const G = this.geom();
    const l = Math.floor((x - G.cx) / G.laneW + 2);
    return Math.max(0, Math.min(3, l));
  }
}

export const DIFF_COLOR = { easy: '#6dffb0', normal: '#ffd25e', hard: '#ff5a8a', custom: '#c49bff', test: '#9fe8ff' };

// extraMs: 編成の判定サポートで PERFECT/GREAT 幅を広げる量
function judgeOf(d, extraMs = 0) {
  const a = Math.abs(d), x = extraMs / 1000;
  if (a <= W_PERFECT + x) return 'PERFECT';
  if (a <= W_GREAT + x) return 'GREAT';
  if (a <= W_GOOD) return 'GOOD';
  return 'MISS';
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`;
}

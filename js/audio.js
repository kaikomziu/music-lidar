// Web Audio: リアルタイム再生系 + 内蔵曲のオフライン合成

import { makeTap, tapKind, onEquip } from './skins.js';
let ctx = null, bgmGain = null, seGain = null, tapBuf = null;
// 着せ替えでタップ音を変えたら作り直す
onEquip(() => { if (ctx) tapBuf = makeTap(ctx, tapKind()); });

export function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    bgmGain = ctx.createGain();
    seGain = ctx.createGain();
    bgmGain.connect(ctx.destination);
    seGain.connect(ctx.destination);
    tapBuf = makeTap(ctx, tapKind());
  }
  // 別のタブを開いている間は、ほかの処理が呼んでも鳴らし直さない(戻ったときに下の visibilitychange で再開する)
  if (ctx.state === 'suspended' && !document.hidden) ctx.resume();
  return ctx;
}

export function setVolumes(bgm, se) {
  getCtx();
  if (hiddenMuted) { hiddenMuted = [bgm * bgm, se * se]; return; } // 消音中は戻すときの音量だけ覚える
  bgmGain.gain.value = bgm * bgm;
  seGain.gain.value = se * se;
}

// --- 別のタブを開いている間は音を出さない ---
// ふつうは AudioContext を止める(曲の試聴・きくだけ・効果音もまとめて止まる)。戻ったら、止めたのがここなら再開する。
// みんなでライブのプレイ中は時計を止めるとずれるので、止めずに音量だけ 0 にする。
// どちらにするか・再開してよいかは main.js が setHiddenAudioPolicy で決める(ゲームを一時停止中なら再開しない)
let hiddenSuspended = false, hiddenMuted = null;
const hiddenPolicy = { keepRunning: () => false, canResume: () => true };
export function setHiddenAudioPolicy(p) { Object.assign(hiddenPolicy, p); }
document.addEventListener('visibilitychange', () => {
  if (!ctx || ctx.state === 'closed') return;
  if (document.hidden) {
    if (hiddenPolicy.keepRunning()) {
      hiddenMuted = [bgmGain.gain.value, seGain.gain.value];
      bgmGain.gain.value = 0; seGain.gain.value = 0;
    } else {
      hiddenSuspended = true;
      ctx.suspend();
    }
  } else {
    if (hiddenMuted) { [bgmGain.gain.value, seGain.gain.value] = hiddenMuted; hiddenMuted = null; }
    if (hiddenSuspended) { hiddenSuspended = false; if (hiddenPolicy.canResume()) ctx.resume(); }
  }
});

export const bgmOut = () => (getCtx(), bgmGain);
// 録画用: 曲とタップ音をまとめた MediaStream(stop で外す)
export function recordTap() {
  getCtx();
  const d = ctx.createMediaStreamDestination();
  bgmGain.connect(d); seGain.connect(d);
  return { stream: d.stream, stop() { try { bgmGain.disconnect(d); seGain.disconnect(d); } catch { /* noop */ } } };
}

// 静かな曲(オルゴール・ピアノなど)だけ音量を持ち上げて、ほかの曲と聞こえ方をそろえる
// 平均の大きさ(RMS)が目標より小さいときだけ上げる。ピークが割れない範囲まで
const loudCache = new WeakMap();
export function loudnessGain(buffer) {
  if (loudCache.has(buffer)) return loudCache.get(buffer);
  let sum = 0, peak = 0, n = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const d = buffer.getChannelData(ch);
    for (let i = 0; i < d.length; i += 16) { const v = d[i]; sum += v * v; n++; const a = Math.abs(v); if (a > peak) peak = a; }
  }
  const rms = Math.sqrt(sum / Math.max(1, n));
  const g = rms > 0 && rms < 0.15 ? Math.max(1, Math.min(0.2 / rms, 0.95 / Math.max(peak, 1e-3), 4)) : 1;
  loudCache.set(buffer, g);
  return g;
}
// 曲を鳴らす出口(曲ごとの音量補正つき)
export function bgmOutFor(buffer) {
  const c = getCtx();
  const g = loudnessGain(buffer);
  if (g === 1) return bgmGain;
  const node = c.createGain();
  node.gain.value = g;
  node.connect(bgmGain);
  return node;
}

// 今スピーカーから出ている音のコンテキスト時刻(出力レイテンシ込み)
export function nowAudio(perfNow = performance.now()) {
  const c = ctx || getCtx(); // getCtx() は suspend 中だと resume してしまうので直接参照
  if (c.getOutputTimestamp) {
    const ts = c.getOutputTimestamp();
    if (ts.performanceTime > 0 && ts.contextTime > 0) return ts.contextTime + (perfNow - ts.performanceTime) / 1000;
  }
  return c.currentTime - (c.outputLatency || c.baseLatency || 0);
}

export function playTap() {
  if (!ctx) return;
  const s = ctx.createBufferSource();
  s.buffer = tapBuf;
  s.connect(seGain);
  s.start();
}

// ---------------------------------------------------------------------------
// プレビュー再生
// ---------------------------------------------------------------------------
let preview = null;
export function playPreview(buffer, offset = 0, length = 14) {
  stopPreview();
  const c = getCtx();
  const src = c.createBufferSource();
  const g = c.createGain();
  src.buffer = buffer;
  src.loop = true;
  src.loopStart = Math.min(offset, buffer.duration - 1);
  src.loopEnd = Math.min(offset + length, buffer.duration);
  src.connect(g); g.connect(bgmOutFor(buffer));
  const t = c.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.85, t + 0.6);
  src.start(t, src.loopStart);
  preview = { src, g };
}
export function stopPreview() {
  if (!preview) return;
  const { src, g } = preview;
  const t = ctx.currentTime;
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(g.gain.value, t);
  g.gain.linearRampToValueAtTime(0, t + 0.25);
  src.stop(t + 0.3);
  preview = null;
}

// ---------------------------------------------------------------------------
// オフライン合成
// ---------------------------------------------------------------------------
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

function makeNoise(oc) {
  const len = oc.sampleRate * 2;
  const b = oc.createBuffer(1, len, oc.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

function makeIR(oc, secs, decay) {
  const len = Math.floor(oc.sampleRate * secs);
  const b = oc.createBuffer(2, len, oc.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return b;
}

function env(oc, t, peak, a, hold, rel) {
  const g = oc.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  if (hold > 0) g.gain.setValueAtTime(peak, t + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + hold + rel);
  return g;
}

function osc(oc, type, freq, t, stop, detune = 0) {
  const o = oc.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  o.start(t);
  o.stop(stop);
  return o;
}

function noise(S, t, dur) {
  const n = S.oc.createBufferSource();
  n.buffer = S.noise;
  n.start(t, Math.random() * 1.5, dur + 0.05);
  return n;
}

function filt(oc, type, freq, q = 0.7) {
  const f = oc.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  return f;
}

function send(S, node, amt) {
  const g = S.oc.createGain();
  g.gain.value = amt;
  node.connect(g); g.connect(S.verb);
}

// パルス波(8bit音源用)。duty=0.125/0.25/0.5 など
function pulseWave(S, duty) {
  const key = 'pw' + duty;
  if (S[key]) return S[key];
  const N = 48, re = new Float32Array(N), im = new Float32Array(N);
  for (let n = 1; n < N; n++) re[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
  return (S[key] = S.oc.createPeriodicWave(re, im));
}

function distCurve(k) {
  const c = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) { const x = (i / 1023) * 2 - 1; c[i] = ((1 + k) * x) / (1 + k * Math.abs(x)); }
  return c;
}

const VOICES = {
  // 歪ませたキック(ハードコア/スピードコア用)
  hardkick(S, e) {
    const { oc } = S, t = e.t;
    const o = osc(oc, 'sine', 220, t, t + 0.4);
    o.frequency.setValueAtTime(240, t);
    o.frequency.exponentialRampToValueAtTime(52, t + 0.07);
    const pre = oc.createGain();
    pre.gain.value = 3.2;
    const ws = oc.createWaveShaper();
    ws.curve = S.dist || (S.dist = distCurve(30));
    const lp = filt(oc, 'lowpass', 3200, 0.7);
    const g = env(oc, t, 0.5 * e.vel, 0.002, 0.06, 0.2);
    o.connect(pre); pre.connect(ws); ws.connect(lp); lp.connect(g); g.connect(S.drums);
  },

  // ---- ここから「いろんなジャンル」用の音色 ----
  // 8bit: パルス波(duty で音色が変わる)
  chip(S, e) {
    const { oc } = S, t = e.t, end = t + e.dur + 0.05;
    const o = oc.createOscillator();
    o.setPeriodicWave(pulseWave(S, e.duty || 0.25));
    o.frequency.value = mtof(e.midi);
    o.start(t); o.stop(end);
    const g = env(oc, t, 0.075 * e.vel, 0.002, Math.max(0, e.dur * 0.92 - 0.002), 0.03);
    o.connect(g); g.connect(S.music); send(S, g, 0.08);
  },
  chipbass(S, e) {
    const { oc } = S, t = e.t, end = t + e.dur + 0.04;
    const o = osc(oc, 'triangle', mtof(e.midi), t, end);
    const g = env(oc, t, 0.32 * e.vel, 0.002, Math.max(0, e.dur * 0.9), 0.02);
    o.connect(g); g.connect(S.music);
  },
  chipkick(S, e) {
    const { oc } = S, t = e.t;
    const o = osc(oc, 'triangle', 180, t, t + 0.25);
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.09);
    const g = env(oc, t, 0.7 * e.vel, 0.001, 0.02, 0.15);
    o.connect(g); g.connect(S.drums);
  },
  chipsnare(S, e) {
    const { oc } = S, t = e.t;
    const n = noise(S, t, 0.2), f = filt(oc, 'bandpass', 3200, 0.5), g = env(oc, t, 0.32 * e.vel, 0.001, 0.01, 0.12);
    n.connect(f); f.connect(g); g.connect(S.drums);
    const o = oc.createOscillator();
    o.setPeriodicWave(pulseWave(S, 0.5)); o.frequency.value = 220; o.start(t); o.stop(t + 0.08);
    const g2 = env(oc, t, 0.08 * e.vel, 0.001, 0, 0.05);
    o.connect(g2); g2.connect(S.drums);
  },
  chiphat(S, e) {
    const { oc } = S, t = e.t;
    const n = noise(S, t, 0.05), f = filt(oc, 'highpass', 9000), g = env(oc, t, 0.14 * e.vel, 0.001, 0, 0.03);
    n.connect(f); f.connect(g); g.connect(S.drums);
  },
  // エレピ(ジャズ・ファンク)
  keys(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi);
    const len = Math.max(0.5, e.dur + 0.6);
    [[1, 0.13, 1], [2, 0.04, 0.6], [3, 0.012, 0.35], [7, 0.01, 0.04]].forEach(([r, a, dm]) => {
      const o = osc(oc, 'sine', f0 * r, t, t + len + 0.1);
      const g = env(oc, t, a * e.vel, 0.004, 0, len * dm);
      o.connect(g); g.connect(S.music); send(S, g, 0.25);
    });
  },
  upright(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + e.dur + 0.2;
    const lp = filt(oc, 'lowpass', 900, 0.8);
    const g = oc.createGain();
    const v = 0.42 * e.vel;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.008);
    g.gain.exponentialRampToValueAtTime(v * 0.45, t + 0.18);
    g.gain.setValueAtTime(v * 0.45, t + Math.max(0.2, e.dur));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.2, e.dur) + 0.12);
    osc(oc, 'sine', f0, t, end).connect(lp);
    const o2 = osc(oc, 'triangle', f0 * 2, t, end), g2 = oc.createGain();
    g2.gain.value = 0.25; o2.connect(g2); g2.connect(lp);
    lp.connect(g); g.connect(S.music);
  },
  // トランスのスーパーソウ
  supersaw(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + e.dur + 0.4;
    const lp = filt(oc, 'lowpass', 5200, 0.7);
    const g = env(oc, t, 0.05 * e.vel, 0.012, Math.max(0, e.dur - 0.02), 0.28);
    for (const d of [-26, -15, -7, 0, 7, 15, 26]) osc(oc, 'sawtooth', f0, t, end, d).connect(lp);
    lp.connect(g); g.connect(S.music); send(S, g, 0.45);
  },
  // 歪んだギターのコード(パワーコード)。dur が短いとブリッジミュート
  guitar(S, e) {
    const { oc } = S, t = e.t, end = t + e.dur + 0.15;
    const pre = oc.createGain(); pre.gain.value = 2.5;
    const ws = oc.createWaveShaper(); ws.curve = S.dist60 || (S.dist60 = distCurve(60));
    const lp = filt(oc, 'lowpass', e.dur < 0.2 ? 1300 : 3300, 1);
    const hp = filt(oc, 'highpass', 90, 0.7);
    const g = env(oc, t, 0.11 * e.vel, 0.003, Math.max(0, e.dur - 0.03), e.dur < 0.2 ? 0.05 : 0.12);
    for (const m of e.midis) {
      osc(oc, 'sawtooth', mtof(m), t, end, -7).connect(pre);
      osc(oc, 'sawtooth', mtof(m), t, end, 7).connect(pre);
    }
    pre.connect(ws); ws.connect(hp); hp.connect(lp); lp.connect(g); g.connect(S.music); send(S, g, 0.15);
  },
  gtrlead(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + e.dur + 0.2;
    const pre = oc.createGain(); pre.gain.value = 3;
    const ws = oc.createWaveShaper(); ws.curve = S.dist60 || (S.dist60 = distCurve(60));
    const lp = filt(oc, 'lowpass', 4200, 1.2);
    const g = env(oc, t, 0.075 * e.vel, 0.005, Math.max(0, e.dur - 0.03), 0.15);
    const o1 = osc(oc, 'sawtooth', f0, t, end), o2 = osc(oc, 'square', f0, t, end, 5);
    if (e.dur > 0.3) { // 伸ばす音にビブラート
      const lfo = osc(oc, 'sine', 5.5, t + 0.2, end), lg = oc.createGain();
      lg.gain.value = 18; lfo.connect(lg); lg.connect(o1.detune); lg.connect(o2.detune);
    }
    o1.connect(pre); o2.connect(pre); pre.connect(ws); ws.connect(lp); lp.connect(g); g.connect(S.music); send(S, g, 0.3);
  },
  // ファンク: スラップベースとクラビネット
  slap(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + e.dur + 0.1;
    const lp = filt(oc, 'lowpass', 3000, 6);
    lp.frequency.setValueAtTime(3200, t);
    lp.frequency.exponentialRampToValueAtTime(320, t + 0.09);
    const hold = Math.min(e.dur, 0.14);
    const g = env(oc, t, 0.32 * e.vel, 0.002, hold, 0.08);
    osc(oc, 'sawtooth', f0, t, end).connect(lp);
    lp.connect(g); g.connect(S.music);
    const sub = osc(oc, 'sine', f0, t, end), g2 = env(oc, t, 0.3 * e.vel, 0.002, hold, 0.08);
    sub.connect(g2); g2.connect(S.music);
  },
  clav(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + e.dur + 0.05;
    const hp = filt(oc, 'highpass', 400, 0.7), lp = filt(oc, 'lowpass', 4000, 3);
    lp.frequency.setValueAtTime(4500, t);
    lp.frequency.exponentialRampToValueAtTime(1400, t + 0.06);
    const g = env(oc, t, 0.075 * e.vel, 0.001, Math.max(0, e.dur * 0.6), 0.03);
    const o = oc.createOscillator();
    o.setPeriodicWave(pulseWave(S, 0.2)); o.frequency.value = f0; o.start(t); o.stop(end);
    o.connect(hp); hp.connect(lp); lp.connect(g); g.connect(S.music); send(S, g, 0.12);
  },
  // ダブステップのワブルベース。e.lfo = 揺れの速さ(Hz)
  wobble(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + e.dur + 0.1;
    const lp = filt(oc, 'lowpass', 300, 9);
    const lfo = osc(oc, 'sine', e.lfo || 4, t, end), depth = oc.createGain();
    depth.gain.value = 1500;
    lfo.connect(depth); depth.connect(lp.frequency);
    lp.frequency.setValueAtTime(1600, t);
    const pre = oc.createGain(); pre.gain.value = 1.8;
    const ws = oc.createWaveShaper(); ws.curve = S.dist60 || (S.dist60 = distCurve(60));
    const g = env(oc, t, 0.13 * e.vel, 0.005, Math.max(0, e.dur - 0.03), 0.06);
    osc(oc, 'sawtooth', f0, t, end, -10).connect(lp);
    osc(oc, 'sawtooth', f0, t, end, 10).connect(lp);
    osc(oc, 'square', f0 / 2, t, end).connect(lp);
    lp.connect(pre); pre.connect(ws); ws.connect(g); g.connect(S.music);
    const sub = osc(oc, 'sine', f0 / 2, t, end), g2 = env(oc, t, 0.34 * e.vel, 0.005, Math.max(0, e.dur - 0.03), 0.06);
    sub.connect(g2); g2.connect(S.music);
  },
  kick(S, e) {
    const { oc } = S, t = e.t;
    const o = osc(oc, 'sine', 160, t, t + 0.5);
    o.frequency.setValueAtTime(165, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.12);
    const g = env(oc, t, 1.0 * e.vel, 0.002, 0.03, 0.38);
    o.connect(g); g.connect(S.drums);
    const n = noise(S, t, 0.03), f = filt(oc, 'highpass', 3000), g2 = env(oc, t, 0.22 * e.vel, 0.001, 0, 0.02);
    n.connect(f); f.connect(g2); g2.connect(S.drums);
  },
  snare(S, e) {
    const { oc } = S, t = e.t;
    const n = noise(S, t, 0.25), f = filt(oc, 'bandpass', 1900, 0.7), g = env(oc, t, 0.5 * e.vel, 0.001, 0, 0.18);
    n.connect(f); f.connect(g); g.connect(S.drums); send(S, g, 0.25);
    const o = osc(oc, 'triangle', 190, t, t + 0.15);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.1);
    const g2 = env(oc, t, 0.35 * e.vel, 0.001, 0, 0.09);
    o.connect(g2); g2.connect(S.drums);
  },
  clap(S, e) {
    const { oc } = S, t = e.t;
    const n = noise(S, t, 0.3), f = filt(oc, 'bandpass', 1150, 1.1), g = oc.createGain();
    const v = 0.55 * e.vel;
    g.gain.setValueAtTime(0, t);
    [0, 0.011, 0.022].forEach((o) => { g.gain.setValueAtTime(v, t + o); g.gain.exponentialRampToValueAtTime(v * 0.15, t + o + 0.009); });
    g.gain.setValueAtTime(v, t + 0.032);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    n.connect(f); f.connect(g); g.connect(S.drums); send(S, g, 0.3);
  },
  hat(S, e) {
    const { oc } = S, t = e.t;
    const n = noise(S, t, 0.06), f = filt(oc, 'highpass', 7500), g = env(oc, t, 0.2 * e.vel, 0.001, 0, 0.045);
    n.connect(f); f.connect(g); g.connect(S.drums);
  },
  ohat(S, e) {
    const { oc } = S, t = e.t;
    const n = noise(S, t, 0.35), f = filt(oc, 'highpass', 6500), g = env(oc, t, 0.16 * e.vel, 0.002, 0.02, 0.26);
    n.connect(f); f.connect(g); g.connect(S.drums);
  },
  ride(S, e) {
    const { oc } = S, t = e.t;
    const n = noise(S, t, 0.5), f = filt(oc, 'bandpass', 8500, 1.5), g = env(oc, t, 0.13 * e.vel, 0.001, 0, 0.4);
    n.connect(f); f.connect(g); g.connect(S.drums);
    const o = osc(oc, 'sine', 4200, t, t + 0.5), g2 = env(oc, t, 0.02 * e.vel, 0.001, 0, 0.35);
    o.connect(g2); g2.connect(S.drums);
  },
  crash(S, e) {
    const { oc } = S, t = e.t;
    const n = noise(S, t, 2), f = filt(oc, 'highpass', 4200), g = env(oc, t, 0.3 * e.vel, 0.002, 0, 1.7);
    n.connect(f); f.connect(g); g.connect(S.drums); send(S, g, 0.4);
  },
  bass(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + e.dur + 0.1;
    const o1 = osc(oc, 'sawtooth', f0, t, end), o2 = osc(oc, 'sine', f0, t, end);
    const lp = filt(oc, 'lowpass', 1200, 4);
    lp.frequency.setValueAtTime(1500, t);
    lp.frequency.exponentialRampToValueAtTime(230, t + 0.2);
    const g = env(oc, t, 0.32 * e.vel, 0.004, Math.max(0, e.dur - 0.06), 0.07);
    const g2 = env(oc, t, 0.38 * e.vel, 0.004, Math.max(0, e.dur - 0.06), 0.07);
    o1.connect(lp); lp.connect(g); g.connect(S.music);
    o2.connect(g2); g2.connect(S.music);
  },
  reese(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + e.dur + 0.15;
    const lp = filt(oc, 'lowpass', 520, 1.5);
    const g = env(oc, t, 0.2 * e.vel, 0.01, Math.max(0, e.dur - 0.05), 0.1);
    osc(oc, 'sawtooth', f0, t, end, -14).connect(lp);
    osc(oc, 'sawtooth', f0, t, end, 14).connect(lp);
    lp.connect(g); g.connect(S.music);
    const sub = osc(oc, 'sine', f0 / 2, t, end), g2 = env(oc, t, 0.42 * e.vel, 0.01, Math.max(0, e.dur - 0.05), 0.1);
    sub.connect(g2); g2.connect(S.music);
  },
  lead(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + e.dur + 0.2;
    const lp = filt(oc, 'lowpass', 3000, 2);
    lp.frequency.setValueAtTime(5200, t);
    lp.frequency.exponentialRampToValueAtTime(2400, t + 0.25);
    const g = env(oc, t, 0.11 * e.vel, 0.008, Math.max(0, e.dur - 0.05), 0.14);
    osc(oc, 'sawtooth', f0, t, end, -8).connect(lp);
    osc(oc, 'sawtooth', f0, t, end, 8).connect(lp);
    osc(oc, 'square', f0 / 2, t, end).connect(lp);
    lp.connect(g); g.connect(S.music); send(S, g, 0.35);
  },
  square(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + e.dur + 0.15;
    const lp = filt(oc, 'lowpass', 2600, 1);
    const g = env(oc, t, 0.1 * e.vel, 0.005, Math.max(0, e.dur - 0.04), 0.1);
    osc(oc, 'square', f0, t, end, -4).connect(lp);
    osc(oc, 'square', f0, t, end, 5).connect(lp);
    lp.connect(g); g.connect(S.music); send(S, g, 0.3);
  },
  pluck(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + 0.6;
    const lp = filt(oc, 'lowpass', 4000, 3);
    lp.frequency.setValueAtTime(4500, t);
    lp.frequency.exponentialRampToValueAtTime(420, t + 0.28);
    const g = env(oc, t, 0.2 * e.vel, 0.002, Math.min(e.dur, 0.04), 0.38);
    osc(oc, 'sawtooth', f0, t, end).connect(lp);
    osc(oc, 'triangle', f0 * 2, t, end).connect(lp);
    lp.connect(g); g.connect(S.music); send(S, g, 0.35);
  },
  bell(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi);
    const rel = Math.max(0.9, e.dur + 0.6);
    [[1, 0.17, 1], [2.76, 0.05, 0.45], [5.4, 0.025, 0.25], [2, 0.04, 0.8]].forEach(([r, a, dm]) => {
      const o = osc(oc, 'sine', f0 * r, t, t + rel + 0.1);
      const g = env(oc, t, a * e.vel, 0.003, 0, rel * dm);
      o.connect(g); g.connect(S.music); send(S, g, 0.45);
    });
  },
  pad(S, e) {
    const { oc } = S, t = e.t, end = t + e.dur + 1.1;
    const lp = filt(oc, 'lowpass', 1300, 0.5);
    const g = env(oc, t, 0.045 * e.vel, Math.min(0.5, e.dur / 2), Math.max(0, e.dur - 0.5), 0.9);
    for (const m of e.midis) {
      osc(oc, 'sawtooth', mtof(m), t, end, -11).connect(lp);
      osc(oc, 'sawtooth', mtof(m), t, end, 11).connect(lp);
    }
    lp.connect(g); g.connect(S.music); send(S, g, 0.55);
  },
  stab(S, e) {
    const { oc } = S, t = e.t, end = t + e.dur + 0.2;
    const lp = filt(oc, 'lowpass', 2400, 2);
    lp.frequency.setValueAtTime(3400, t);
    lp.frequency.exponentialRampToValueAtTime(700, t + 0.18);
    const g = env(oc, t, 0.065 * e.vel, 0.003, Math.max(0, e.dur - 0.05), 0.1);
    for (const m of e.midis) {
      osc(oc, 'sawtooth', mtof(m), t, end, -6).connect(lp);
      osc(oc, 'square', mtof(m), t, end, 6).connect(lp);
    }
    lp.connect(g); g.connect(S.music); send(S, g, 0.4);
  },
  riser(S, e) {
    const { oc } = S, t = e.t, d = e.dur;
    const n = noise(S, t, d), f = filt(oc, 'bandpass', 400, 2.5), g = oc.createGain();
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(7500, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28 * e.vel, t + d);
    g.gain.linearRampToValueAtTime(0, t + d + 0.02);
    n.connect(f); f.connect(g); g.connect(S.drums); send(S, g, 0.5);
  },
  downer(S, e) {
    const { oc } = S, t = e.t, d = e.dur;
    const o = osc(oc, 'sine', 220, t, t + d + 0.1);
    o.frequency.exponentialRampToValueAtTime(30, t + d);
    const g = env(oc, t, 0.5 * e.vel, 0.005, 0, d);
    o.connect(g); g.connect(S.drums); send(S, g, 0.4);
  },
  // ---- 1.87.0: 生楽器ふうの音色。ジャンルごとの「楽器の組み合わせ」(PALETTES)で、lead・pad・pluck などをこれに置き換えて鳴らす ----
  // (イベントの種類を置き換えるのは音を作るときだけ。譜面はもとのイベントから作るので変わらない)
  // ピアノ: 少しずれた倍音(弦の硬さ)+ハンマーの音。高い音ほど早く減衰
  piano(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi);
    const len = Math.max(0.6, Math.min(3.2, e.dur + 1.4 - (e.midi - 60) * 0.03));
    [[1, 0.16, 1], [2.003, 0.07, 0.7], [3.01, 0.035, 0.45], [4.02, 0.02, 0.3], [5.04, 0.01, 0.2]].forEach(([r, a, dm]) => {
      const o = osc(oc, r === 1 ? 'triangle' : 'sine', f0 * r, t, t + len + 0.1);
      const g = env(oc, t, a * e.vel, 0.003, 0, len * dm);
      o.connect(g); g.connect(S.music); send(S, g, 0.22);
    });
    const n = noise(S, t, 0.03), f = filt(oc, 'bandpass', Math.min(5000, f0 * 6), 1.2), g = env(oc, t, 0.05 * e.vel, 0.001, 0, 0.025);
    n.connect(f); f.connect(g); g.connect(S.music);
  },
  // ピアノの和音(stab・pad の代わり)
  pianochord(S, e) {
    for (const m of e.midis) VOICES.piano(S, { ...e, midi: m, vel: e.vel * 0.55 });
  },
  // 弦楽合奏(pad の代わり): ゆっくり立ち上がるのこぎり波を何本も重ね、ビブラート
  strings(S, e) {
    const { oc } = S, t = e.t, end = t + e.dur + 1.0;
    const lp = filt(oc, 'lowpass', 2600, 0.6), hp = filt(oc, 'highpass', 180, 0.6);
    const g = env(oc, t, 0.042 * e.vel, Math.min(0.35, e.dur / 2), Math.max(0, e.dur - 0.35), 0.7);
    const lfo = osc(oc, 'sine', 5.2, t, end), lg = oc.createGain();
    lg.gain.value = 9; lfo.connect(lg);
    for (const m of e.midis) for (const d of [-9, 0, 10]) { const o = osc(oc, 'sawtooth', mtof(m), t, end, d); lg.connect(o.detune); o.connect(hp); }
    hp.connect(lp); lp.connect(g); g.connect(S.music); send(S, g, 0.6);
  },
  // バイオリンの独奏(lead の代わり): のこぎり波を胴鳴りのフィルターに通し、少し遅れてビブラート
  strlead(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + e.dur + 0.4;
    const b1 = filt(oc, 'peaking', 2800, 1.5); b1.gain.value = 6;
    const lp = filt(oc, 'lowpass', 5200, 0.7), hp = filt(oc, 'highpass', 250, 0.7);
    const g = env(oc, t, 0.075 * e.vel, Math.min(0.08, e.dur / 3), Math.max(0, e.dur - 0.08), 0.25);
    const o = osc(oc, 'sawtooth', f0, t, end), o2 = osc(oc, 'sawtooth', f0, t, end, 6);
    if (e.dur > 0.25) { const lfo = osc(oc, 'sine', 5.6, t + 0.15, end), lg = oc.createGain(); lg.gain.value = 16; lfo.connect(lg); lg.connect(o.detune); lg.connect(o2.detune); }
    o.connect(hp); o2.connect(hp); hp.connect(b1); b1.connect(lp); lp.connect(g); g.connect(S.music); send(S, g, 0.45);
  },
  // トランペット・ブラス(lead の代わり): 吹き始めにフィルターが開き、音程が少し下からしゃくり上がる
  brass(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + e.dur + 0.25;
    const lp = filt(oc, 'lowpass', 900, 1.2);
    lp.frequency.setValueAtTime(700, t);
    lp.frequency.linearRampToValueAtTime(2600 + 1800 * e.vel, t + 0.06);
    lp.frequency.exponentialRampToValueAtTime(1700, t + 0.3);
    const g = env(oc, t, 0.085 * e.vel, 0.025, Math.max(0, e.dur - 0.04), 0.12);
    for (const d of [-5, 5]) {
      const o = osc(oc, 'sawtooth', f0, t, end, d);
      o.detune.setValueAtTime(d - 60, t); o.detune.linearRampToValueAtTime(d, t + 0.05);
      o.connect(lp);
    }
    lp.connect(g); g.connect(S.music); send(S, g, 0.3);
  },
  // ブラスセクションの和音(stab の代わり)
  brasssec(S, e) {
    const { oc } = S, t = e.t, end = t + e.dur + 0.25;
    const lp = filt(oc, 'lowpass', 900, 1);
    lp.frequency.setValueAtTime(800, t);
    lp.frequency.linearRampToValueAtTime(3600, t + 0.05);
    lp.frequency.exponentialRampToValueAtTime(1500, t + 0.25);
    const g = env(oc, t, 0.05 * e.vel, 0.02, Math.max(0, e.dur - 0.04), 0.12);
    for (const m of e.midis) for (const d of [-7, 6]) { const o = osc(oc, 'sawtooth', mtof(m), t, end, d); o.detune.setValueAtTime(d - 40, t); o.detune.linearRampToValueAtTime(d, t + 0.04); o.connect(lp); }
    lp.connect(g); g.connect(S.music); send(S, g, 0.35);
  },
  // サックス(lead の代わり): 鼻にかかった帯域と息の音、ビブラート
  sax(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + e.dur + 0.25;
    const b1 = filt(oc, 'peaking', 1300, 2); b1.gain.value = 9;
    const lp = filt(oc, 'lowpass', 3800, 0.8);
    const g = env(oc, t, 0.07 * e.vel, 0.02, Math.max(0, e.dur - 0.04), 0.14);
    const o = osc(oc, 'square', f0, t, end), o2 = osc(oc, 'sawtooth', f0, t, end, -4);
    if (e.dur > 0.3) { const lfo = osc(oc, 'sine', 5, t + 0.2, end), lg = oc.createGain(); lg.gain.value = 14; lfo.connect(lg); lg.connect(o.detune); lg.connect(o2.detune); }
    o.connect(b1); o2.connect(b1); b1.connect(lp); lp.connect(g); g.connect(S.music); send(S, g, 0.3);
    const n = noise(S, t, e.dur + 0.1), nf = filt(oc, 'bandpass', f0 * 3, 3), ng = env(oc, t, 0.018 * e.vel, 0.02, Math.max(0, e.dur - 0.04), 0.1);
    n.connect(nf); nf.connect(ng); ng.connect(S.music);
  },
  // フルート・尺八(lead の代わり): 柔らかい音と息の音。e.breath で息の多さ
  flute(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), end = t + e.dur + 0.3, br = e.breath || 1;
    const g = env(oc, t, 0.11 * e.vel, 0.04, Math.max(0, e.dur - 0.06), 0.16);
    const o = osc(oc, 'sine', f0, t, end), o2 = osc(oc, 'triangle', f0 * 2, t, end), g2 = oc.createGain();
    g2.gain.value = 0.18; o2.connect(g2);
    if (e.dur > 0.3) { const lfo = osc(oc, 'sine', 4.8, t + 0.25, end), lg = oc.createGain(); lg.gain.value = 12; lfo.connect(lg); lg.connect(o.detune); lg.connect(o2.detune); }
    o.connect(g); g2.connect(g); g.connect(S.music); send(S, g, 0.45);
    const n = noise(S, t, e.dur + 0.2), nf = filt(oc, 'bandpass', f0 * 2, 1.5), ng = env(oc, t, 0.03 * br * e.vel, 0.02, Math.max(0, e.dur - 0.05), 0.12);
    n.connect(nf); nf.connect(ng); ng.connect(S.music); send(S, ng, 0.3);
  },
  shaku(S, e) { VOICES.flute(S, { ...e, breath: 2.6 }); },
  // ナイロン弦のギター(pluck・bell の代わり)
  nylon(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), len = Math.max(0.5, Math.min(1.6, e.dur + 0.9));
    const lp = filt(oc, 'lowpass', 3200, 0.9);
    lp.frequency.setValueAtTime(3600, t);
    lp.frequency.exponentialRampToValueAtTime(900, t + len * 0.6);
    const g = env(oc, t, 0.19 * e.vel, 0.002, 0, len);
    osc(oc, 'triangle', f0, t, t + len + 0.1).connect(lp);
    const o2 = osc(oc, 'sawtooth', f0, t, t + len + 0.1), g2 = oc.createGain(); g2.gain.value = 0.35; o2.connect(g2); g2.connect(lp);
    lp.connect(g); g.connect(S.music); send(S, g, 0.3);
  },
  // 琴(pluck の代わり): 明るいはじく音で、弾いた直後に音程が少し上ずる
  koto(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), len = Math.max(0.5, Math.min(1.8, e.dur + 1));
    const bp = filt(oc, 'peaking', 2400, 1.4); bp.gain.value = 7;
    const g = env(oc, t, 0.17 * e.vel, 0.001, 0, len);
    for (const [r, a] of [[1, 1], [2, 0.5], [3, 0.3]]) {
      const o = osc(oc, r === 1 ? 'sawtooth' : 'triangle', f0 * r, t, t + len + 0.1);
      o.detune.setValueAtTime(35, t); o.detune.exponentialRampToValueAtTime(1, t + 0.08);
      const ga = oc.createGain(); ga.gain.value = a * 0.6; o.connect(ga); ga.connect(bp);
    }
    bp.connect(g); g.connect(S.music); send(S, g, 0.4);
  },
  // マリンバ(pluck・bell の代わり): 木の板を叩いた丸い音
  marimba(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), len = Math.max(0.35, Math.min(1.1, 1.3 - (e.midi - 60) * 0.02));
    [[1, 0.22, 1], [3.98, 0.06, 0.25], [10.1, 0.015, 0.08]].forEach(([r, a, dm]) => {
      const o = osc(oc, 'sine', f0 * r, t, t + len + 0.05);
      const g = env(oc, t, a * e.vel, 0.002, 0, len * dm);
      o.connect(g); g.connect(S.music); send(S, g, 0.25);
    });
  },
  // ハープ(pluck の代わり): 柔らかくはじいて長く残る
  harp(S, e) {
    const { oc } = S, t = e.t, f0 = mtof(e.midi), len = Math.max(0.9, Math.min(2.4, e.dur + 1.6));
    [[1, 0.17, 1], [2, 0.05, 0.6], [3, 0.02, 0.35]].forEach(([r, a, dm]) => {
      const o = osc(oc, r === 1 ? 'triangle' : 'sine', f0 * r, t, t + len + 0.05);
      const g = env(oc, t, a * e.vel, 0.004, 0, len * dm);
      o.connect(g); g.connect(S.music); send(S, g, 0.5);
    });
  },
  // オルガン(pad・stab の代わり): ドローバーのように倍音を足し、ゆっくり揺らす
  organ(S, e) {
    const { oc } = S, t = e.t, end = t + e.dur + 0.2;
    const g = env(oc, t, 0.03 * e.vel, 0.01, Math.max(0, e.dur - 0.02), 0.08);
    const lfo = osc(oc, 'sine', 6.2, t, end), lg = oc.createGain(); lg.gain.value = 7; lfo.connect(lg);
    for (const m of e.midis || [e.midi]) for (const [r, a] of [[0.5, 0.6], [1, 1], [2, 0.7], [3, 0.35], [4, 0.25]]) {
      const o = osc(oc, 'sine', mtof(m) * r, t, end), ga = oc.createGain(); ga.gain.value = a; lg.connect(o.detune); o.connect(ga); ga.connect(g);
    }
    g.connect(S.music); send(S, g, 0.3);
  },
  // ---- 生ドラムふう(打ち込みのキット kick・snare・hat などの代わり)。サンプルにして使う(DRUM_LEN) ----
  akick(S, e) {
    const { oc } = S, t = e.t;
    const o = osc(oc, 'sine', 110, t, t + 0.4);
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.08);
    const g = env(oc, t, 0.9 * e.vel, 0.002, 0.01, 0.26);
    o.connect(g); g.connect(S.drums);
    const n = noise(S, t, 0.02), f = filt(oc, 'bandpass', 2500, 0.8), g2 = env(oc, t, 0.35 * e.vel, 0.001, 0, 0.015);
    n.connect(f); f.connect(g2); g2.connect(S.drums);
  },
  asnare(S, e) {
    const { oc } = S, t = e.t;
    const n = noise(S, t, 0.3), f = filt(oc, 'highpass', 1500, 0.6), g = env(oc, t, 0.42 * e.vel, 0.001, 0.01, 0.2);
    n.connect(f); f.connect(g); g.connect(S.drums);
    for (const [fr, a] of [[185, 0.35], [330, 0.18]]) {
      const o = osc(oc, 'triangle', fr, t, t + 0.12), g2 = env(oc, t, a * e.vel, 0.001, 0, 0.07);
      o.connect(g2); g2.connect(S.drums);
    }
  },
  // ブラシ(ジャズ): ザッとこする音
  brush(S, e) {
    const { oc } = S, t = e.t;
    const n = noise(S, t, 0.3), f = filt(oc, 'bandpass', 3500, 0.5), g = env(oc, t, 0.3 * e.vel, 0.02, 0.03, 0.18);
    n.connect(f); f.connect(g); g.connect(S.drums);
  },
  ahat(S, e) {
    const { oc } = S, t = e.t;
    const bp = filt(oc, 'bandpass', 10000, 0.8), hp = filt(oc, 'highpass', 7000), g = env(oc, t, 0.16 * e.vel, 0.001, 0, 0.05);
    for (const fr of [205, 304, 370, 523, 540, 800]) osc(oc, 'square', fr, t, t + 0.08).connect(bp);
    bp.connect(hp); hp.connect(g); g.connect(S.drums);
  },
  aohat(S, e) {
    const { oc } = S, t = e.t;
    const bp = filt(oc, 'bandpass', 10000, 0.8), hp = filt(oc, 'highpass', 6500), g = env(oc, t, 0.13 * e.vel, 0.002, 0.03, 0.3);
    for (const fr of [205, 304, 370, 523, 540, 800]) osc(oc, 'square', fr, t, t + 0.4).connect(bp);
    bp.connect(hp); hp.connect(g); g.connect(S.drums);
  },
  aride(S, e) {
    const { oc } = S, t = e.t;
    const bp = filt(oc, 'bandpass', 6000, 1.2), g = env(oc, t, 0.09 * e.vel, 0.001, 0, 0.6);
    for (const fr of [310, 455, 590, 780]) osc(oc, 'square', fr, t, t + 0.7).connect(bp);
    bp.connect(g); g.connect(S.drums);
    const o = osc(oc, 'sine', 3800, t, t + 0.6), g2 = env(oc, t, 0.025 * e.vel, 0.001, 0, 0.5);
    o.connect(g2); g2.connect(S.drums);
  },
};

// ---- ジャンルごとの楽器の組み合わせ(1.87.0〜) ----
// 内蔵曲はどれも同じシンセの音色(lead・pad・pluck…)で鳴っていて、ジャンルが違っても似た音に聞こえやすかったので、
// 生楽器が似合うジャンルでは、音を作るときにイベントの種類を置き換える。電子音楽のジャンルは今までどおり。
// 譜面はもとのイベントから作るので変わらない(置き換えるのはここだけ)。曲ファイルの palette で組み合わせを指定・'none' で置き換えなし
const ACOUSTIC_KIT = { kick: 'akick', snare: 'asnare', hat: 'ahat', ohat: 'aohat', ride: 'aride' };
const PALETTES = {
  orchestra: { ...ACOUSTIC_KIT, pad: 'strings', lead: 'strlead', supersaw: 'strlead', square: 'brass', stab: 'brasssec', pluck: 'harp', keys: 'piano' },
  jazz: { ...ACOUSTIC_KIT, snare: 'brush', lead: 'sax', square: 'brass', supersaw: 'sax', stab: 'brasssec', pad: 'strings', pluck: 'piano', bass: 'upright' },
  soul: { ...ACOUSTIC_KIT, lead: 'sax', stab: 'brasssec', pad: 'organ', square: 'brass', pluck: 'piano' },
  funk: { stab: 'brasssec', square: 'brass', lead: 'sax', pad: 'strings' },
  latin: { ...ACOUSTIC_KIT, pluck: 'nylon', bell: 'marimba', lead: 'brass', square: 'brass', stab: 'brasssec', pad: 'strings' },
  bossa: { ...ACOUSTIC_KIT, snare: 'brush', pluck: 'nylon', bell: 'nylon', lead: 'flute', square: 'flute', pad: 'strings', bass: 'upright' },
  folk: { ...ACOUSTIC_KIT, pluck: 'nylon', bell: 'nylon', lead: 'strlead', square: 'flute', pad: 'organ', keys: 'piano', stab: 'pianochord' },
  celtic: { ...ACOUSTIC_KIT, pluck: 'harp', bell: 'harp', lead: 'flute', square: 'strlead', pad: 'strings' },
  wa: { pluck: 'koto', bell: 'koto', lead: 'shaku', square: 'shaku', pad: 'strings' },
  piano: { lead: 'piano', square: 'piano', pluck: 'piano', keys: 'piano', bell: 'piano', stab: 'pianochord', pad: 'strings' },
  rock: { ...ACOUSTIC_KIT, pad: 'organ', keys: 'piano' },
  symphonic: { ...ACOUSTIC_KIT, pad: 'strings', stab: 'brasssec', square: 'brass', pluck: 'harp', keys: 'piano' },
  march: { ...ACOUSTIC_KIT, lead: 'brass', square: 'brass', supersaw: 'brass', stab: 'brasssec', pad: 'strings', pluck: 'marimba' },
  toy: { pluck: 'marimba', bell: 'marimba', square: 'flute', pad: 'strings' },
  world: { ...ACOUSTIC_KIT, pluck: 'marimba', lead: 'flute', stab: 'organ', pad: 'strings' },
  reggae: { ...ACOUSTIC_KIT, stab: 'organ', pluck: 'nylon', pad: 'organ', lead: 'brass' },
  strings: { pad: 'strings', lead: 'strlead', pluck: 'harp', keys: 'piano', stab: 'pianochord' },
};
// ジャンル名 → 組み合わせ(上から順に見て最初に当てはまったもの)。どれにも当てはまらなければ置き換えない
const GENRE_PALETTE = [
  [/SYMPHONIC|ORCHESTRAL CORE|POWER METAL/, 'symphonic'],
  [/^WA-|CHINESE|GAMELAN/, 'wa'],
  [/METAL|ROCK|PUNK/, 'rock'],
  [/ORCHESTRAL|BOSS BATTLE|WALTZ|TANGO|CHRISTMAS POP|WINTER/, 'orchestra'],
  [/CELTIC/, 'celtic'],
  [/BOSSA|SAMBA|LOUNGE/, 'bossa'],
  [/JAZZ|BIG BAND|SWING|BLUES/, 'jazz'],
  [/GOSPEL|NEO SOUL|R&B/, 'soul'],
  [/^FUNK|DISCO|CITY POP/, 'funk'],
  [/SALSA|MARIACHI|FLAMENCO|LATIN/, 'latin'],
  [/FOLK|COUNTRY|BLUEGRASS|ACOUSTIC|CAMPFIRE|POLKA/, 'folk'],
  [/^PIANO$|BALLAD/, 'piano'],
  [/MARCH/, 'march'],
  [/REGGAE$|DUB$/, 'reggae'],
  [/AFROBEATS|ARABIAN|BOLLYWOOD/, 'world'],
  [/KIDS POP|TOY POP|MUSIC BOX/, 'toy'],
  [/SPRING POP|SHIBUYA-KEI|ANISON|J-POP/, 'strings'],
];
// 置き換えたときの音量合わせ(もとの音と同じ大きさになる倍率。tools で1音ずつ合成して RMS を比べて決めた)
const MATCH = {"pad":{"strings":0.72,"organ":0.61},"lead":{"strlead":2.1,"brass":1.94,"sax":1.46,"flute":1.5,"shaku":1.49,"piano":2.22},"supersaw":{"strlead":1.14,"sax":0.79,"brass":1.06},"square":{"brass":2.06,"flute":1.59,"shaku":1.58,"strlead":2.22,"piano":2.35},"stab":{"brasssec":1.88,"pianochord":2.11,"organ":2.14},"pluck":{"harp":0.78,"piano":0.95,"nylon":0.77,"koto":1.55,"marimba":0.78},"bell":{"nylon":0.81,"marimba":0.82,"harp":0.82,"koto":1.64,"piano":1},"keys":{"piano":0.77},"bass":{"upright":1.98},"kick":{"akick":1.47},"snare":{"asnare":0.56,"brush":0.85},"hat":{"ahat":2.22},"ohat":{"aohat":1.9},"ride":{"aride":0.89}};
export function paletteOf(genre, override = null) {
  if (override === 'none') return null;
  if (override) return typeof override === 'string' ? PALETTES[override] || null : override;
  const g = String(genre || '').toUpperCase();
  for (const [re, name] of GENRE_PALETTE) if (re.test(g)) return PALETTES[name];
  return null;
}

// 区間ごとに並列でオフライン合成する。
// - ノイズ・残響用のバッファは一度だけ作って使い回す
// - 残響は区間ごとではなく、最後に曲全体へ1回だけかける(区間は「ドライ」と「残響へ送る音」の4chで書き出す)
const SEG = 8, TAIL = 2.2, SR = 44100;
let sharedNoise = null, sharedIR = null;

function workerCount() {
  const n = navigator.hardwareConcurrency || 4;
  return Math.max(2, Math.min(6, n - 1));
}

// ドラムは毎回ノードを組むと重いので、1音ずつ先に録っておいてサンプルとして鳴らす
const DRUM_LEN = { kick: 0.45, hardkick: 0.4, snare: 0.25, clap: 0.26, hat: 0.07, ohat: 0.34, ride: 0.5, crash: 1.8, chipkick: 0.26, chipsnare: 0.2, chiphat: 0.05, akick: 0.4, asnare: 0.3, brush: 0.3, ahat: 0.08, aohat: 0.4, aride: 0.7 };
const DRUM_SEND = { snare: 0.25, clap: 0.3, crash: 0.4, asnare: 0.22, brush: 0.2, aride: 0.15 };
let drumSamples = null;
async function prepareDrums() {
  if (drumSamples) return drumSamples;
  const out = {};
  await Promise.all(Object.entries(DRUM_LEN).map(async ([type, len]) => {
    const oc = new OfflineAudioContext(1, Math.ceil(len * SR), SR);
    const sink = oc.createGain();
    sink.connect(oc.destination);
    const S = { oc, noise: sharedNoise, drums: sink, music: sink, verb: oc.createGain() };
    VOICES[type](S, { type, t: 0, vel: 1, dur: 0 });
    out[type] = await oc.startRendering();
  }));
  return (drumSamples = out);
}
function playDrum(S, e) {
  const src = S.oc.createBufferSource();
  src.buffer = drumSamples[e.type];
  const g = S.oc.createGain();
  g.gain.value = e.vel;
  src.connect(g); g.connect(S.drums);
  if (DRUM_SEND[e.type]) send(S, g, DRUM_SEND[e.type]);
  src.start(e.t);
}

// onProgress(0〜1) で進み具合を知らせる
// opts.genre(と opts.palette)があれば、ジャンルの楽器の組み合わせで鳴らす(paletteOf)。もとの events は書き換えない
export async function renderEvents(events, duration, opts = {}, onProgress = null) {
  const pal = paletteOf(opts.genre, opts.palette);
  if (pal) events = events.map((e) => (pal[e.type] ? { ...e, type: pal[e.type], vel: e.vel * (MATCH[e.type]?.[pal[e.type]] ?? 1) } : e));
  sharedNoise ||= makeNoise(new OfflineAudioContext(1, 1, SR));
  sharedIR ||= makeIR(new OfflineAudioContext(2, 1, SR), 2.6, 2.6);
  await prepareDrums();
  const segs = [];
  for (let a = 0; a < duration; a += SEG) {
    const evs = events.filter((e) => e.t >= a && e.t < a + SEG);
    if (!evs.length) continue;
    let end = a + SEG;
    for (const e of evs) end = Math.max(end, e.t + e.dur);
    segs.push({ a, len: Math.min(duration - a, end - a + TAIL), evs });
  }
  const total = Math.ceil(duration * SR);
  const ch = [0, 1, 2, 3].map(() => new Float32Array(total)); // ドライL, ドライR, 送りL, 送りR
  let next = 0;
  const worker = async () => {
    while (next < segs.length) {
      const s = segs[next++];
      const buf = await renderSegment(s.evs, s.a, s.len, opts);
      const off = Math.round(s.a * SR);
      for (let c = 0; c < 4; c++) {
        const src = buf.getChannelData(c), dst = ch[c];
        const n = Math.min(src.length, total - off);
        for (let i = 0; i < n; i++) dst[off + i] += src[i];
      }
      onProgress?.(0.85 * (++doneSegs / segs.length));
    }
  };
  let doneSegs = 0;
  await Promise.all(Array.from({ length: workerCount() }, worker));

  // 仕上げ: 残響 → コンプ
  const oc = new OfflineAudioContext(2, total, SR);
  const dry = oc.createBuffer(2, total, SR), wet = oc.createBuffer(2, total, SR);
  dry.copyToChannel(ch[0], 0); dry.copyToChannel(ch[1], 1);
  wet.copyToChannel(ch[2], 0); wet.copyToChannel(ch[3], 1);
  const comp = oc.createDynamicsCompressor();
  comp.threshold.value = -12; comp.knee.value = 6; comp.ratio.value = 4;
  comp.attack.value = 0.003; comp.release.value = 0.2;
  const out = oc.createGain();
  out.gain.value = 0.9;
  comp.connect(out); out.connect(oc.destination);
  const d = oc.createBufferSource(); d.buffer = dry; d.connect(comp);
  const w = oc.createBufferSource(); w.buffer = wet;
  const verb = oc.createConvolver(); verb.buffer = sharedIR;
  const wg = oc.createGain(); wg.gain.value = 0.75;
  w.connect(verb); verb.connect(wg); wg.connect(comp);
  d.start(); w.start();
  const result = await oc.startRendering();
  onProgress?.(1);
  return result;
}

async function renderSegment(events, a, len, opts) {
  const oc = new OfflineAudioContext(4, Math.ceil(len * SR), SR);
  const merger = oc.createChannelMerger(4);
  merger.connect(oc.destination);
  const stereo = (node) => { node.channelCount = 2; node.channelCountMode = 'explicit'; node.channelInterpretation = 'speakers'; return node; };
  const master = stereo(oc.createGain());
  master.gain.value = 0.75;
  const ms = oc.createChannelSplitter(2);
  master.connect(ms); ms.connect(merger, 0, 0); ms.connect(merger, 1, 1);
  const verbIn = stereo(oc.createGain());
  verbIn.gain.value = opts.reverb ?? 0.35;
  const vs = oc.createChannelSplitter(2);
  verbIn.connect(vs); vs.connect(merger, 0, 2); vs.connect(merger, 1, 3);
  events = events.map((e) => ({ ...e, t: e.t - a }));

  const drums = oc.createGain(); drums.connect(master);
  const music = oc.createGain(); music.connect(master);
  const S = { oc, noise: sharedNoise, drums, music, verb: verbIn };

  if (opts.sidechain) {
    let lastK = -1;
    for (const e of events) {
      if ((e.type !== 'kick' && e.type !== 'akick') || e.t - lastK < 0.2) continue;
      lastK = e.t;
      music.gain.setValueAtTime(1, e.t);
      music.gain.linearRampToValueAtTime(0.35, e.t + 0.012);
      music.gain.linearRampToValueAtTime(1, e.t + 0.19);
    }
  }
  for (const e of events) {
    if (drumSamples[e.type]) playDrum(S, e);
    else VOICES[e.type]?.(S, e);
  }
  return oc.startRendering();
}

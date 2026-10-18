// Web Audio: リアルタイム再生系 + 内蔵曲のオフライン合成

let ctx = null, bgmGain = null, seGain = null, tapBuf = null;

export function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    bgmGain = ctx.createGain();
    seGain = ctx.createGain();
    bgmGain.connect(ctx.destination);
    seGain.connect(ctx.destination);
    tapBuf = makeTapBuffer(ctx);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setVolumes(bgm, se) {
  getCtx();
  bgmGain.gain.value = bgm * bgm;
  seGain.gain.value = se * se;
}

export const bgmOut = () => (getCtx(), bgmGain);

// 今スピーカーから出ている音のコンテキスト時刻(出力レイテンシ込み)
export function nowAudio(perfNow = performance.now()) {
  const c = ctx || getCtx(); // getCtx() は suspend 中だと resume してしまうので直接参照
  if (c.getOutputTimestamp) {
    const ts = c.getOutputTimestamp();
    if (ts.performanceTime > 0 && ts.contextTime > 0) return ts.contextTime + (perfNow - ts.performanceTime) / 1000;
  }
  return c.currentTime - (c.outputLatency || c.baseLatency || 0);
}

function makeTapBuffer(c) {
  const sr = c.sampleRate, len = Math.floor(sr * 0.06);
  const b = c.createBuffer(1, len, sr), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    d[i] = (Math.sin(2 * Math.PI * 2100 * t) * 0.5 + (Math.random() * 2 - 1) * 0.35) * Math.exp(-t * 90);
  }
  return b;
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
  src.connect(g); g.connect(bgmGain);
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
};

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
const DRUM_LEN = { kick: 0.45, hardkick: 0.4, snare: 0.25, clap: 0.26, hat: 0.07, ohat: 0.34, ride: 0.5, crash: 1.8, chipkick: 0.26, chipsnare: 0.2, chiphat: 0.05 };
const DRUM_SEND = { snare: 0.25, clap: 0.3, crash: 0.4 };
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
export async function renderEvents(events, duration, opts = {}, onProgress = null) {
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
      if (e.type !== 'kick' || e.t - lastK < 0.2) continue;
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

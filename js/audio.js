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
  const c = getCtx();
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

const VOICES = {
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

// 1つのOfflineAudioContextに全ノードを詰めると「ノード数×曲の長さ」で重くなるので、
// 数秒ごとの区間に分けて並列に合成し、最後に足し合わせてからコンプをかける。
const SEG = 4, TAIL = 3.2, SR = 44100;

export async function renderEvents(events, duration, opts = {}) {
  const segs = [];
  for (let a = 0; a < duration; a += SEG) {
    const evs = events.filter((e) => e.t >= a && e.t < a + SEG);
    if (!evs.length) continue;
    let end = a + SEG;
    for (const e of evs) end = Math.max(end, e.t + e.dur);
    segs.push({ a, len: Math.min(duration - a, end - a + TAIL), evs });
  }
  const total = Math.ceil(duration * SR);
  const L = new Float32Array(total), R = new Float32Array(total);
  let next = 0;
  const worker = async () => {
    while (next < segs.length) {
      const s = segs[next++];
      const buf = await renderSegment(s.evs, s.a, s.len, opts);
      const off = Math.round(s.a * SR);
      const l = buf.getChannelData(0), r = buf.getChannelData(1);
      const n = Math.min(l.length, total - off);
      for (let i = 0; i < n; i++) { L[off + i] += l[i]; R[off + i] += r[i]; }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);

  const oc = new OfflineAudioContext(2, total, SR);
  const mix = oc.createBuffer(2, total, SR);
  mix.copyToChannel(L, 0); mix.copyToChannel(R, 1);
  const src = oc.createBufferSource();
  src.buffer = mix;
  const comp = oc.createDynamicsCompressor();
  comp.threshold.value = -12; comp.knee.value = 6; comp.ratio.value = 4;
  comp.attack.value = 0.003; comp.release.value = 0.2;
  const g = oc.createGain();
  g.gain.value = 0.9;
  src.connect(comp); comp.connect(g); g.connect(oc.destination);
  src.start();
  return oc.startRendering();
}

async function renderSegment(events, a, len, opts) {
  const oc = new OfflineAudioContext(2, Math.ceil(len * SR), SR);
  const master = oc.createGain();
  master.gain.value = 0.75;
  master.connect(oc.destination);
  events = events.map((e) => ({ ...e, t: e.t - a }));

  const verb = oc.createConvolver();
  verb.buffer = makeIR(oc, 2.6, 2.6);
  const verbIn = oc.createGain();
  verbIn.gain.value = opts.reverb ?? 0.35;
  verbIn.connect(verb); verb.connect(master);

  const drums = oc.createGain(); drums.connect(master);
  const music = oc.createGain(); music.connect(master);
  const S = { oc, noise: makeNoise(oc), drums, music, verb: verbIn };

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
  for (const e of events) VOICES[e.type]?.(S, e);
  return oc.startRendering();
}

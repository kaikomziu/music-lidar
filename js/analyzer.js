// 読み込んだ音声ファイルから譜面候補を作る(3帯域のオンセット検出 + BPM推定)
import { getCtx } from './audio.js';

const HOP = 512;

export async function hashFile(arrayBuffer) {
  const head = arrayBuffer.slice(0, Math.min(arrayBuffer.byteLength, 4 * 1024 * 1024));
  const d = await crypto.subtle.digest('SHA-256', head);
  return [...new Uint8Array(d)].slice(0, 10).map((b) => b.toString(16).padStart(2, '0')).join('') + arrayBuffer.byteLength.toString(36);
}

export async function analyzeFile(arrayBuffer) {
  const ctx = getCtx();
  const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  const sr = buffer.sampleRate;

  // 低域/中域/高域に分けた信号をオフラインで作る
  const oc = new OfflineAudioContext(3, buffer.length, sr);
  const src = oc.createBufferSource();
  src.buffer = buffer;
  const merger = oc.createChannelMerger(3);
  const mk = (type, f, q) => { const n = oc.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; };
  const lo = mk('lowpass', 160, 0.7), mid = mk('bandpass', 1100, 0.6), hi = mk('highpass', 6000, 0.7);
  src.connect(lo); src.connect(mid); src.connect(hi);
  lo.connect(merger, 0, 0); mid.connect(merger, 0, 1); hi.connect(merger, 0, 2);
  merger.connect(oc.destination);
  src.start();
  const bands = await oc.startRendering();

  const frames = Math.floor(buffer.length / HOP);
  const hopSec = HOP / sr;
  const envs = [0, 1, 2].map((ch) => {
    const d = bands.getChannelData(ch), e = new Float32Array(frames);
    for (let f = 0; f < frames; f++) {
      let s = 0;
      for (let i = f * HOP, end = i + HOP; i < end; i++) s += d[i] * d[i];
      e[f] = Math.log1p(200 * Math.sqrt(s / HOP));
    }
    return e;
  });

  const onsets = envs.map((e) => pickOnsets(e, hopSec));
  const flux = new Float32Array(frames);
  envs.forEach((e) => { for (let f = 1; f < frames; f++) flux[f] += Math.max(0, e[f] - e[f - 1]); });
  const bpm = estimateBpm(flux, hopSec);

  // 候補化
  const kinds = ['kick', 'snare', 'hat'];
  const all = [];
  onsets.forEach((list, b) => list.forEach((o) => all.push({ ...o, kind: kinds[b], band: b })));
  all.sort((a, b) => a.t - b.t);
  const cands = [];
  for (const o of all) {
    const last = cands[cands.length - 1];
    if (last && o.t - last.t < 0.03) { last.kinds.add(o.kind); last.str = Math.max(last.str, o.str); last.count++; continue; }
    cands.push({ t: o.t, kinds: new Set([o.kind]), str: o.str, count: 1, frame: o.frame, midi: null, dur: 0 });
  }
  const spb = 60 / bpm;
  for (const c of cands) {
    // 中域が持続していればロングノーツ候補(メロディ扱い)
    const e = envs[1];
    const peak = e[c.frame] || 0;
    let f = c.frame;
    while (f < frames - 1 && e[f] > peak * 0.82 && f - c.frame < 4 / hopSec) f++;
    const sus = (f - c.frame) * hopSec;
    if (sus > 0.3 && c.kinds.has('snare')) { c.kinds.add('melodic'); c.dur = sus; c.midi = 60 + Math.round(envs[2][c.frame] * 6) - Math.round(envs[0][c.frame] * 3); }
    if (c.count >= 3 && c.str > 1.6) c.kinds.add('crash');
    const k = c.kinds;
    let sc = 1.2 + c.str * 1.6;
    if (k.has('kick')) sc += 0.8;
    if (k.has('snare')) sc += 0.6;
    if (k.has('melodic')) sc += 0.6;
    if (k.size === 1 && k.has('hat')) sc -= 0.9;
    const ph = ((c.t / spb) % 1 + 1) % 1;
    c.onBeat = ph < 0.08 || ph > 0.92;
    c.score = sc + (c.onBeat ? 0.6 : 0);
  }
  return { buffer, cands, bpm };
}

function pickOnsets(e, hopSec) {
  const n = e.length, flux = new Float32Array(n);
  for (let i = 1; i < n; i++) flux[i] = Math.max(0, e[i] - e[i - 1]);
  const sorted = Float32Array.from(flux).sort();
  const norm = sorted[Math.floor(n * 0.985)] || 1;
  const W = Math.round(0.35 / hopSec);
  const out = [];
  let sum = 0;
  for (let i = 0; i < Math.min(n, W); i++) sum += flux[i];
  for (let i = 1; i < n - 1; i++) {
    const a = i - W - 1, b = i + W;
    if (b < n) sum += flux[b];
    if (a >= 0) sum -= flux[a];
    const mean = sum / (2 * W + 1);
    const v = flux[i];
    if (v < mean * 1.6 + norm * 0.12) continue;
    let isMax = true;
    for (let j = Math.max(0, i - 3); j <= Math.min(n - 1, i + 3); j++) if (flux[j] > v) { isMax = false; break; }
    if (!isMax) continue;
    if (out.length && (i - out[out.length - 1].frame) * hopSec < 0.06) continue;
    out.push({ t: i * hopSec, frame: i, str: Math.min(2, v / norm) });
  }
  return out;
}

function estimateBpm(flux, hopSec) {
  let best = 120, bestV = -1;
  for (let bpm = 70; bpm <= 190; bpm += 0.5) {
    const lag = 60 / bpm / hopSec;
    const l0 = Math.floor(lag), fr = lag - l0;
    let v = 0;
    for (let i = 0; i + l0 + 1 < flux.length; i += 2) v += flux[i] * (flux[i + l0] * (1 - fr) + flux[i + l0 + 1] * fr);
    // 遅すぎ/速すぎを少し嫌う
    v *= Math.exp(-Math.pow(Math.log2(bpm / 130), 2) * 0.8);
    if (v > bestV) { bestV = v; best = bpm; }
  }
  return best;
}

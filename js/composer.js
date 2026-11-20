// 曲データ(トラッカー風DSL) → イベント列、イベント列 → 譜面 を作るモジュール

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function toMidi(n) {
  if (typeof n === 'number') return n;
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
  if (!m) throw new Error('bad note: ' + n);
  return 12 * (+m[3] + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// ---------------------------------------------------------------------------
// 作曲API。song.compose(s) の s に渡される。拍(beat)単位で書く。
// ---------------------------------------------------------------------------
export function composeSong(def) {
  const spb = 60 / def.bpm;
  const events = [];
  const add = (type, beat, o = {}) => {
    if (swing && Math.abs((((beat % 1) + 1) % 1) - 0.5) < 1e-6) beat += swing;
    events.push({ vel: 1, ...o, type, beat, t: beat * spb, dur: (o.dur || 0) * spb });
  };
  const drumTypes = ['kick', 'hardkick', 'snare', 'clap', 'hat', 'ohat', 'crash', 'ride', 'chipkick', 'chipsnare', 'chiphat'];
  let swing = 0; // 裏の8分を遅らせる量(拍)。1/6 で3連のハネ

  const s = {
    bpm: def.bpm,
    spb,
    rng: mulberry32(hashStr(def.id)),
    bar: (n) => n * 4,
    kick: (b, vel = 1) => add('kick', b, { vel }),
    hardkick: (b, vel = 1) => add('hardkick', b, { vel }),
    chipkick: (b, vel = 1) => add('chipkick', b, { vel }),
    chipsnare: (b, vel = 1) => add('chipsnare', b, { vel }),
    chiphat: (b, vel = 1) => add('chiphat', b, { vel }),
    chip: (b, n, d, vel = 1, duty = 0.25) => add('chip', b, { midi: toMidi(n), dur: d, vel, duty }),
    chipbass: (b, n, d, vel = 1) => add('chipbass', b, { midi: toMidi(n), dur: d, vel }),
    keys: (b, n, d, vel = 1) => add('keys', b, { midi: toMidi(n), dur: d, vel }),
    upright: (b, n, d, vel = 1) => add('upright', b, { midi: toMidi(n), dur: d, vel }),
    supersaw: (b, n, d, vel = 1) => add('supersaw', b, { midi: toMidi(n), dur: d, vel }),
    gtrlead: (b, n, d, vel = 1) => add('gtrlead', b, { midi: toMidi(n), dur: d, vel }),
    slap: (b, n, d, vel = 1) => add('slap', b, { midi: toMidi(n), dur: d, vel }),
    clav: (b, n, d, vel = 1) => add('clav', b, { midi: toMidi(n), dur: d, vel }),
    guitar: (b, notes, d, vel = 1) => add('guitar', b, { midis: notes.map(toMidi), dur: d, vel }),
    // rate = 1拍に何回揺れるか
    wobble: (b, n, d, rate = 1, vel = 1) => add('wobble', b, { midi: toMidi(n), dur: d, vel, lfo: rate / spb }),
    setSwing: (x) => { swing = x; },
    snare: (b, vel = 1) => add('snare', b, { vel }),
    clap: (b, vel = 1) => add('clap', b, { vel }),
    hat: (b, vel = 1) => add('hat', b, { vel }),
    ohat: (b, vel = 1) => add('ohat', b, { vel }),
    ride: (b, vel = 1) => add('ride', b, { vel }),
    crash: (b, vel = 1) => add('crash', b, { vel }),
    bass: (b, n, d, vel = 1) => add('bass', b, { midi: toMidi(n), dur: d, vel }),
    reese: (b, n, d, vel = 1) => add('reese', b, { midi: toMidi(n), dur: d, vel }),
    lead: (b, n, d, vel = 1) => add('lead', b, { midi: toMidi(n), dur: d, vel }),
    square: (b, n, d, vel = 1) => add('square', b, { midi: toMidi(n), dur: d, vel }),
    pluck: (b, n, d, vel = 1) => add('pluck', b, { midi: toMidi(n), dur: d, vel }),
    bell: (b, n, d, vel = 1) => add('bell', b, { midi: toMidi(n), dur: d, vel }),
    pad: (b, notes, d, vel = 1) => add('pad', b, { midis: notes.map(toMidi), dur: d, vel }),
    stab: (b, notes, d, vel = 1) => add('stab', b, { midis: notes.map(toMidi), dur: d, vel }),
    riser: (b, d, vel = 1) => add('riser', b, { dur: d, vel }),
    downer: (b, d, vel = 1) => add('downer', b, { dur: d, vel }),
    // 背景用(譜面に乗せない)の装飾音
    ghost: (fn) => { const n = events.length; fn(); for (let i = n; i < events.length; i++) events[i].nochart = true; },

    // ドラムパターン。1小節16ステップ。 X=強 x=普通 g=ゴースト .=休
    // map = { kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.' }
    drums(startBar, bars, map) {
      for (let bar = 0; bar < bars; bar++) {
        for (const [type, pat0] of Object.entries(map)) {
          if (!drumTypes.includes(type)) throw new Error('unknown drum ' + type);
          const pat = pat0.replace(/[\s|]/g, '');
          const steps = pat.length;
          const barsInPat = Math.max(1, Math.round(steps / 16));
          const localBar = bar % barsInPat;
          for (let i = 0; i < 16; i++) {
            const ch = pat[localBar * 16 + i];
            if (!ch || ch === '.') continue;
            const vel = ch === 'X' ? 1 : ch === 'g' ? 0.4 : 0.8;
            const beat = (startBar + bar) * 4 + i / 4;
            if (type === 'hat' && ch === 'o') add('ohat', beat, { vel: 0.8 });
            else add(type, beat, { vel });
          }
        }
      }
    },

    // メロディ。トークン: 音名で発音、'-' で前の音を伸ばす、'.' で休符、'|' は無視。
    // 和音は 'C4+E4+G4' のように + でつなぐ。
    seq(type, startBeat, step, str, vel = 1) {
      const toks = str.split(/[\s|]+/).filter(Boolean);
      let cur = null;
      const flush = () => {
        if (!cur) return;
        if (cur.notes.length > 1) {
          if (type === 'pad' || type === 'stab' || type === 'guitar') s[type](cur.beat, cur.notes, cur.len * step, vel);
          else for (const n of cur.notes) s[type](cur.beat, n, cur.len * step, vel);
        } else if (type === 'pad' || type === 'stab' || type === 'guitar') s[type](cur.beat, cur.notes, cur.len * step, vel);
        else s[type](cur.beat, cur.notes[0], cur.len * step, vel);
        cur = null;
      };
      toks.forEach((tk, i) => {
        if (tk === '-') { if (cur) cur.len++; return; }
        flush();
        if (tk === '.') return;
        cur = { beat: startBeat + i * step, notes: tk.split('+'), len: 1 };
      });
      flush();
      return startBeat + toks.length * step;
    },
  };

  def.compose(s);
  events.sort((a, b) => a.t - b.t);
  let last = 0;
  for (const e of events) last = Math.max(last, e.t + e.dur);
  return { events, duration: last + (def.tail ?? 3) };
}

// ---------------------------------------------------------------------------
// 譜面候補。同じ時刻のイベントをまとめて「どれだけノーツに向いているか」のスコアを付ける
// ---------------------------------------------------------------------------
const KIND = {
  chipkick: 'kick', chipsnare: 'snare', chiphat: 'hat', chip: 'melodic', chipbass: 'bass', keys: 'melodic', upright: 'bass',
  supersaw: 'melodic', gtrlead: 'melodic', slap: 'bass', clav: 'melodic', guitar: 'stab', wobble: 'melodic',
  kick: 'kick', hardkick: 'kick', snare: 'snare', clap: 'snare', hat: 'hat', ohat: 'hat', ride: 'hat', crash: 'crash',
  bass: 'bass', reese: 'bass', lead: 'melodic', square: 'melodic', pluck: 'melodic', bell: 'melodic', stab: 'stab',
};

export function candidatesFromEvents(events) {
  const map = new Map();
  for (const e of events) {
    const kind = KIND[e.type];
    if (!kind || e.nochart) continue;
    const key = Math.round(e.t * 200);
    let c = map.get(key);
    if (!c) { c = { t: e.t, beat: e.beat, kinds: new Set(), midi: null, dur: 0, vel: 0 }; map.set(key, c); }
    c.kinds.add(kind);
    c.vel = Math.max(c.vel, e.vel);
    if (kind === 'melodic' && (c.midi == null || e.midi > c.midi)) { c.midi = e.midi; c.dur = Math.max(c.dur, e.dur); }
  }
  for (const c of map.values()) {
    const frac = ((c.beat % 1) + 1) % 1;
    const k = c.kinds;
    let sc = 0;
    if (k.has('melodic')) sc += 3.2;
    if (k.has('kick')) sc += 2.4;
    if (k.has('snare')) sc += 2.4;
    if (k.has('stab')) sc += 1.6;
    if (k.has('bass')) sc += 1.0;
    if (k.has('hat')) sc += 0.9;
    if (k.has('crash')) sc += 2.0;
    sc += frac < 0.01 ? 1.0 : Math.abs(frac - 0.5) < 0.01 ? 0.45 : 0;
    c.onBeat = frac < 0.01;
    c.score = sc * (0.55 + 0.45 * c.vel);
  }
  return [...map.values()].sort((a, b) => a.t - b.t);
}

// ---------------------------------------------------------------------------
// 譜面生成
// ---------------------------------------------------------------------------
export const DIFFS = ['easy', 'normal', 'hard'];
const PARAM = {
  easy: { minGap: 0.34, minScore: 3.0, maxNps: 2.1, chordMax: 2, chordP: 0.0, lnMin: 0.55, sameGap: 0.42, lnExclusive: true },
  normal: { minGap: 0.165, minScore: 2.2, maxNps: 4.0, chordMax: 2, chordP: 0.2, lnMin: 0.4, sameGap: 0.21, lnExclusive: false },
  hard: { minGap: 0.105, minScore: 0.9, maxNps: 7.5, chordMax: 3, chordP: 0.36, lnMin: 0.3, sameGap: 0.105, lnExclusive: false },
};

// key で小さい順に並べる(key は1要素1回だけ計算。同じ値ならもとの順)
function byKey(arr, key) {
  return arr.map((v, i) => ({ v, i, k: key(v) })).sort((a, b) => a.k - b.k || a.i - b.i).map((o) => o.v);
}

function lowerBound(arr, x) {
  let lo = 0, hi = arr.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] < x) lo = m + 1; else hi = m; }
  return lo;
}

// override: 曲ごとの調整 (例: { minGap: 0.07, maxNps: 12 })。曲ファイルの chart: { hard: {...} } から渡される
export function generateChart(cands, diff, duration, seed = 1, override = null) {
  const P = { ...PARAM[diff], ...(override || {}) };
  const rng = mulberry32((seed ^ hashStr(diff)) >>> 0);

  // 1) 重要度順に拾い、最小間隔と密度上限を守る
  const pool = cands.filter((c) => c.score >= P.minScore).map((c) => ({ c, r: c.score + rng() * 0.35 }));
  pool.sort((a, b) => b.r - a.r);
  const maxN = Math.floor(P.maxNps * duration);
  const times = [], picked = [];
  for (const { c } of pool) {
    if (picked.length >= maxN) break;
    const i = lowerBound(times, c.t);
    if (i > 0 && c.t - times[i - 1] < P.minGap) continue;
    if (i < times.length && times[i] - c.t < P.minGap) continue;
    times.splice(i, 0, c.t);
    picked.splice(i, 0, c);
  }

  // 2) レーン割り当て
  const notes = [];
  const free = [-1, -1, -1, -1];
  let prevLane = 1, prevMidi = null, lastT = -9, lnUntil = -1;
  for (let i = 0; i < picked.length; i++) {
    const c = picked[i];
    const next = picked[i + 1];
    if (P.lnExclusive && c.t < lnUntil) continue;
    const k = c.kinds;

    let n = 1;
    if (k.has('crash')) n = diff === 'easy' ? 2 : Math.min(P.chordMax, 2 + (rng() < 0.5 ? 1 : 0));
    else if (diff !== 'easy' && k.size >= 2 && c.onBeat && rng() < P.chordP) n = diff === 'hard' && rng() < 0.2 ? 3 : 2;
    else if (diff === 'easy' && k.has('kick') && k.has('melodic') && c.onBeat && rng() < 0.08) n = 2;
    n = Math.min(n, P.chordMax);

    let len = 0;
    if (k.has('melodic') && c.dur >= P.lnMin) {
      len = c.dur * 0.9;
      if (P.lnExclusive && next) {
        len = Math.min(len, next.t - c.t - 0.3);
        if (len < P.lnMin * 0.8) len = 0;
      }
    }

    let want;
    if (k.has('melodic') && c.midi != null) {
      if (prevMidi == null) want = rng() < 0.5 ? 1 : 2;
      else {
        const d = c.midi - prevMidi;
        const step = d === 0 ? 0 : Math.sign(d) * (Math.abs(d) > 4 && rng() < 0.6 ? 2 : 1);
        want = prevLane + step;
        if (want < 0) want = 1 + (rng() < 0.5 ? 1 : 0);
        if (want > 3) want = 2 - (rng() < 0.5 ? 1 : 0);
        if (d === 0 && c.t - lastT < P.sameGap * 1.5) want = prevLane + (prevLane < 2 ? 1 : -1);
      }
      prevMidi = c.midi;
    } else if (k.has('kick')) want = rng() < 0.5 ? 0 : 3;
    else if (k.has('snare')) want = rng() < 0.5 ? 1 : 2;
    else want = Math.floor(rng() * 4);

    // 乱数は先に1レーン1回ずつ引いてから並べる(比べるたびに乱数を引く sort は、ブラウザやそのバージョンで結果が変わり、譜面がずれる)
    const order = byKey([0, 1, 2, 3], (l) => Math.abs(l - want) + (rng() - 0.5) * 0.35);
    const primary = order.find((l) => free[l] <= c.t);
    if (primary == null) continue;
    const lanes = [primary];
    for (let j = 1; j < n; j++) {
      const opts = [0, 1, 2, 3].filter((l) => !lanes.includes(l) && free[l] <= c.t);
      if (!opts.length) break;
      lanes.push(byKey(opts, (l) => -Math.abs(l - primary) + (rng() - 0.5) * 1.6)[0]);
    }
    for (const l of lanes) {
      const note = { t: c.t, lane: l };
      if (l === primary && len > 0) note.end = c.t + len;
      free[l] = (note.end ?? c.t) + (note.end ? Math.max(P.sameGap, 0.12) : P.sameGap);
      if (note.end && P.lnExclusive) lnUntil = note.end + 0.12;
      notes.push(note);
    }
    prevLane = primary;
    lastT = c.t;
  }
  notes.sort((a, b) => a.t - b.t || a.lane - b.lane);
  return notes;
}

// ---------------------------------------------------------------------------
// のばす音の表現(「あ〜〜」のような伸ばし)
// 生成した譜面(内蔵曲)と音源曲の譜面の両方に、あとからかける。ロングノーツを、前後の盛り上がりに合わせて形を変える:
//   - 静かな所 … ロングノーツのまま(ゆったり押しっぱなし)
//   - 盛り上がっている所 … トリル(となりの2レーンを交互に。NORMAL は8分、HARD は高レベルなら16分)
//   - HARD のとても長い伸ばしで特に盛り上がる所 … うねり(3レーンを 0→1→2→1… と往復する。こぶしや声の揺れのイメージ)
//   - とても長い伸ばし … トリルのあと、最後のノーツを押しっぱなしにして締める
//   - 歌い終わりの伸ばし(後ろが2拍以上あく) … ロングのまま、最後に離す所を残す
// その前に untangleHolds で、何本も重なったロングをほどく(EASY も)
// EASY は変えない。同じ形ばかり続かないように、トリルの次の伸ばしはロングに戻しやすくする
// opts: { bpm, level(その難易度のレベル), seed }
// 重なったロングノーツをほどく: ロングを押している間に別のロングが始まる所(歌の音節ごとの伸ばしが何本も重なる所)は、
// 前のロングを次のロングの始まりの 1/4 拍前で切る(声は同時に1音なので、次の音節で前の伸ばしは終わる)。1拍より短くなったら普通のノーツ
function untangleHolds(notes, spb) {
  const list = notes.map((n) => ({ ...n })).sort((a, b) => a.t - b.t || a.lane - b.lane);
  for (const n of list) {
    if (!n.end) continue;
    const nx = list.find((o) => o !== n && o.end && o.t > n.t + 0.01 && o.t < n.end - 0.01);
    if (!nx) continue;
    const end = nx.t - spb / 4;
    if (end - n.t < spb - 0.01) delete n.end;
    else n.end = end;
  }
  return list;
}

export function shapeHolds(notes, diff, opts) {
  if (!opts?.bpm || notes.length < 8) return notes;
  const spb = 60 / opts.bpm;
  const hard = diff === 'hard';
  const rng = mulberry32(((opts.seed || 1) ^ hashStr('hold-' + diff)) >>> 0);
  const list = untangleHolds(notes, spb);
  if (diff === 'easy') return list;
  const span = Math.max(1, list[list.length - 1].t - list[0].t);
  const avgNps = list.length / span;
  // トリルの間隔: 速すぎない範囲で細かく
  let iv = hard ? spb / 4 : spb / 2;
  const minIv = hard ? (opts.level >= 10 ? 0.1 : 0.15) : 0.2;
  while (iv < minIv) iv *= 2;
  const sameGap = hard ? 0.1 : 0.2;

  const busyLane = (lane, a, b, self) => list.some((o) => o !== self && o.lane === lane && o.t < b && (o.end ?? o.t) > a);
  // 1) 形を変えられる伸ばしを集め、前後の盛り上がりを測る
  const elig = [];
  for (const n of list) {
    if (!n.end) continue;
    const L = n.end - n.t;
    if (L < (hard ? 1 : 1.5) * spb - 0.01) continue;
    // 伸ばしている間にほかのノーツがある(押しながら叩く形)ならそのまま。押し始めと同時の和音は数えない
    if (list.some((o) => o !== n && o.t > n.t + 0.01 && o.t < n.end - 0.01)) continue;
    if (list.some((o) => o !== n && o.end && o.t <= n.t + 0.01 && o.end > n.t + 0.05)) continue;
    // 盛り上がり: 前4秒と後2秒のノーツの密度(伸ばしている間は空なので数えない)を曲全体の平均とくらべる
    const near = list.filter((o) => o !== n && ((o.t >= n.t - 4 && o.t < n.t - 0.01) || (o.t > n.end && o.t <= n.end + 2))).length;
    const next = list.find((o) => o.t > n.t + 0.01);
    elig.push({ n, L, it: near / 6 / avgNps, tail: next ? next.t - n.end : 99 });
  }
  if (!elig.length) return list;
  // その曲の中で盛り上がっている方の伸ばしを選ぶ(HARD は上位55%、NORMAL は上位35%。ただし静かすぎる所は除く)
  const sorted = elig.map((e) => e.it).sort((x, y) => x - y);
  const cut = Math.max(hard ? 0.35 : 0.5, sorted[Math.floor(sorted.length * (hard ? 0.45 : 0.65))] ?? 0);

  const out = [];
  const removed = new Set();
  let prevStyle = 'hold';
  for (const { n, L, it: intensity, tail } of elig) {
    // 歌い終わり(後ろが2拍以上あく)はロングで締める
    if (tail >= 2 * spb && intensity < cut * 1.4) { prevStyle = 'hold'; continue; }
    if (intensity < cut) { prevStyle = 'hold'; continue; }
    // 同じ形ばかり続かないように
    if (prevStyle !== 'hold' && rng() < 0.45) { prevStyle = 'hold'; continue; }

    // 形を決める
    const wave = hard && L >= 2.5 * spb && intensity >= cut * 1.3 && rng() < 0.5;
    const pad = sameGap;
    const free = (l) => l >= 0 && l <= 3 && !busyLane(l, n.t - pad, n.end + pad, n);
    let lanes = null;
    if (wave) {
      // 元のレーンを含む3レーンを選び、元のレーンから往復する
      const starts = [n.lane - 2, n.lane - 1, n.lane].filter((s) => s >= 0 && s <= 1);
      if (starts.length > 1 && rng() < 0.5) starts.reverse(); // 乱数つきの sort はブラウザで結果が変わるので使わない
      const s = starts.find((s0) => [s0, s0 + 1, s0 + 2].every((l) => l === n.lane || free(l)));
      if (s != null) {
        if (n.lane === s) lanes = [s, s + 1, s + 2, s + 1];
        else if (n.lane === s + 2) lanes = [s + 2, s + 1, s, s + 1];
        else lanes = rng() < 0.5 ? [s + 1, s + 2, s + 1, s] : [s + 1, s, s + 1, s + 2];
      }
    }
    if (!lanes) {
      const side = (rng() < 0.5 ? [n.lane + 1, n.lane - 1] : [n.lane - 1, n.lane + 1]).find((l) => free(l));
      if (side == null) { prevStyle = 'hold'; continue; }
      lanes = [n.lane, side];
    }
    // とても長い伸ばしは、トリルを最大 HARD 3拍・NORMAL 2拍で止め、最後のノーツをそのまま押しっぱなしにして締める
    const trillEnd = Math.min(n.end, n.t + (hard ? 3 : 2) * spb);
    const taps = [];
    for (let k = 0; n.t + k * iv <= trillEnd - iv * 0.4; k++) taps.push({ t: n.t + k * iv, lane: lanes[k % lanes.length] });
    if (taps.length < (hard ? 4 : 3)) { prevStyle = 'hold'; continue; }
    const last = taps[taps.length - 1];
    if (n.end - last.t >= spb - 0.01) last.end = n.end;
    removed.add(n);
    out.push(...taps);
    prevStyle = lanes.length > 2 ? 'wave' : 'trill';
  }
  if (!removed.size) return list;
  return list.filter((n) => !removed.has(n)).concat(out).sort((a, b) => a.t - b.t || a.lane - b.lane);
}

export function chartStats(notes) {
  let ln = 0;
  for (const n of notes) if (n.end) ln++;
  return { notes: notes.length, ln, judgments: notes.length + ln };
}

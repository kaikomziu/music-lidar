// 譜面ギミック: 停止・変速・隠し(サドゥン)・揺れ、画面が動くもの(移動・判定ライン・上下反転・回転・揺れ・フラッシュ・点滅)
// 曲ファイルの gimmicks: [
//   { beat: 46, type: 'stop', beats: 2 },              // 2拍のあいだ譜面が止まる(音楽は進む)
//   { beat: 64, type: 'speed', to: 0.5, beats: 0 },    // 流れる速さを0.5倍に(beats>0 ならその拍数かけてなめらかに変化)
//   { beat: 144, type: 'cover', to: 0.45, beats: 2 },  // レーンの奥45%を隠す(0で解除)
//   { beat: 160, type: 'hidden', to: 0.35, beats: 2 }, // 判定ラインの手前35%でノーツが消える(0で解除)
//   { beat: 176, type: 'sway', to: 0.6, beats: 4 },    // レーン全体が左右に揺れる。to は揺れ幅(レーン幅の何倍か。0で止まる)。4拍で1往復
//   --- 画面が動くギミック(1.80.0〜。光の点滅・画面の動きがあるので、曲ファイルに photosensitive: true を付けて注意を出す) ---
//   { beat: 32, type: 'shift', to: -1.2, beats: 4 },   // レーン全体を横へずらす(レーン幅の何倍か。0で真ん中)。タッチの判定も一緒に動く
//   { beat: 48, type: 'judge', to: -0.25, beats: 4 },  // 判定ラインの高さを変える(画面の高さの割合。マイナスで上へ。0で元の位置)
//   { beat: 96, type: 'flip', to: 1, beats: 2 },       // 上下反転(1 で逆さま、0 で戻る。途中は潰れてからひっくり返る)
//   { beat: 64, type: 'spin', to: 180, beats: 8 },     // 画面を回す(角度。360 で1回転して元どおり。値はつぎのギミックまで残る)
//   { beat: 112, type: 'shake', to: 0.6, beats: 1 },   // 画面が揺れる(強さ 0〜1。0で止まる)
//   { beat: 64, type: 'flash', to: 0.8 },              // その拍で画面が白く光る(強さ 0〜1)。一瞬で消える
//   { beat: 128, type: 'strobe', to: 0.7, beats: 0 },  // 点滅(強さ 0〜1。0で止まる)。拍ごとに光る。光るのは1秒に3回未満に抑える
// ]
// ノーツの位置は「スクロール量 S(t)」で決める。判定はこれまでどおり時刻で行う。

const ZERO = () => 0;
export const NO_SCROLL = { S: (t) => t, coverAt: ZERO, hideAt: ZERO, swayAt: ZERO, shiftAt: ZERO, judgeAt: ZERO, flipAt: ZERO, spinAt: ZERO, shakeAt: ZERO, flashAt: ZERO, strobeAt: ZERO, stops: [], has: false, moves: false, intense: false };

export function buildScroll(gimmicks, bpm) {
  if (!gimmicks?.length) return NO_SCROLL;
  const spb = 60 / bpm;
  const list = [...gimmicks].sort((a, b) => (a.t ?? a.beat * spb) - (b.t ?? b.beat * spb));

  // 速度の変化点 { t, m }
  const changes = [];
  const stops = [];
  let cur = 1;
  for (const g of list) {
    // 拍(beat/beats)でも秒(t/dur)でも指定できる。譜面メーカーは秒で保存する
    const t0 = g.t ?? g.beat * spb, dur = g.dur ?? (g.beats || 0) * spb;
    if (g.type === 'stop') {
      changes.push({ t: t0, m: 0 }, { t: t0 + dur, m: cur });
      stops.push([t0, t0 + dur]);
    } else if (g.type === 'speed') {
      if (dur > 0) {
        const steps = Math.max(4, Math.round((dur / spb) * 8));
        for (let k = 1; k <= steps; k++) changes.push({ t: t0 + ((k - 1) / steps) * dur, m: cur + ((g.to - cur) * k) / steps });
      } else changes.push({ t: t0, m: g.to });
      cur = g.to;
    }
  }
  changes.sort((a, b) => a.t - b.t);
  const segs = [{ t: -1e4, s: -1e4, m: 1 }];
  for (const c of changes) {
    const p = segs[segs.length - 1];
    segs.push({ t: c.t, s: p.s + p.m * (c.t - p.t), m: c.m });
  }
  const S = (t) => {
    let lo = 0, hi = segs.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (segs[mid].t <= t) lo = mid; else hi = mid - 1; }
    const g = segs[lo];
    return g.s + g.m * (t - g.t);
  };

  // 隠し・消える・揺れるは「値がなめらかに to へ変わる」同じ形なので、まとめて作る
  const level = (type) => {
    const arr = list.filter((g) => g.type === type).map((g) => ({ t: g.t ?? g.beat * spb, to: g.to, dur: Math.max(0.001, g.dur ?? (g.beats || 0) * spb) }));
    return (t) => {
      let v = 0;
      for (const c of arr) {
        if (t < c.t) break;
        const k = Math.min(1, (t - c.t) / c.dur);
        v = v + (c.to - v) * k;
        if (k < 1) break;
      }
      return v;
    };
  };
  // フラッシュ: その拍で光って 0.3 秒ほどで消える
  const flashes = list.filter((g) => g.type === 'flash').map((g) => ({ t: g.t ?? g.beat * spb, to: g.to ?? 0.8 }));
  const flashAt = (t) => {
    let v = 0;
    for (const f of flashes) { if (f.t > t) break; v = Math.max(v, f.to * Math.exp(-(t - f.t) / 0.12)); }
    return v;
  };
  // 点滅: 拍ごとに光る(速い曲は2拍ごと)。光るのは1秒に3回未満
  const strobeLv = level('strobe');
  const every = 60 / bpm < 1 / 3 ? spb * 2 : spb;
  const strobeAt = (t) => {
    const a = strobeLv(t);
    if (a <= 0.001) return 0;
    const ph = ((t % every) + every) % every;
    return a * Math.exp(-ph / 0.09);
  };
  const types = new Set(list.map((g) => g.type));
  return {
    S, coverAt: level('cover'), hideAt: level('hidden'), swayAt: level('sway'), stops, has: true,
    shiftAt: level('shift'), judgeAt: level('judge'), flipAt: level('flip'), spinAt: level('spin'), shakeAt: level('shake'), flashAt, strobeAt,
    moves: ['shift', 'judge', 'flip', 'spin', 'shake', 'flash', 'strobe'].some((k) => types.has(k)),
    intense: ['flip', 'spin', 'shake', 'flash', 'strobe'].some((k) => types.has(k)), // 光の点滅・画面の動きの注意を出すもの
  };
}

// 停止中に来るはずのノーツは見えないまま判定ラインで固まってしまうので取り除く
export function dropNotesInStops(notes, stops) {
  if (!stops.length) return notes;
  return notes.filter((n) => !stops.some(([a, b]) => n.t > a + 0.02 && n.t < b - 0.02));
}

export function gimmickLabel(gimmicks) {
  if (!gimmicks?.length) return '';
  const names = { stop: '停止', speed: '変速', cover: '隠し', hidden: '消える', sway: '揺れる', shift: '移動', judge: '判定ライン移動', flip: '上下反転', spin: '回転', shake: '画面揺れ', flash: 'フラッシュ', strobe: '点滅' };
  return [...new Set(gimmicks.map((g) => names[g.type]).filter(Boolean))].join('・');
}

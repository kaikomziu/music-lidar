// 譜面ギミック: 停止・変速・隠し(サドゥン)
// 曲ファイルの gimmicks: [
//   { beat: 46, type: 'stop', beats: 2 },              // 2拍のあいだ譜面が止まる(音楽は進む)
//   { beat: 64, type: 'speed', to: 0.5, beats: 0 },    // 流れる速さを0.5倍に(beats>0 ならその拍数かけてなめらかに変化)
//   { beat: 144, type: 'cover', to: 0.45, beats: 2 },  // レーンの奥45%を隠す(0で解除)
// ]
// ノーツの位置は「スクロール量 S(t)」で決める。判定はこれまでどおり時刻で行う。

export const NO_SCROLL = { S: (t) => t, coverAt: () => 0, stops: [], has: false };

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

  const covers = list.filter((g) => g.type === 'cover').map((g) => ({ t: g.t ?? g.beat * spb, to: g.to, dur: Math.max(0.001, g.dur ?? (g.beats || 0) * spb) }));
  const coverAt = (t) => {
    let v = 0;
    for (const c of covers) {
      if (t < c.t) break;
      const k = Math.min(1, (t - c.t) / c.dur);
      v = v + (c.to - v) * k;
      if (k < 1) break;
    }
    return v;
  };
  return { S, coverAt, stops, has: true };
}

// 停止中に来るはずのノーツは見えないまま判定ラインで固まってしまうので取り除く
export function dropNotesInStops(notes, stops) {
  if (!stops.length) return notes;
  return notes.filter((n) => !stops.some(([a, b]) => n.t > a + 0.02 && n.t < b - 0.02));
}

export function gimmickLabel(gimmicks) {
  if (!gimmicks?.length) return '';
  const names = { stop: '停止', speed: '変速', cover: '隠し' };
  return [...new Set(gimmicks.map((g) => names[g.type]).filter(Boolean))].join('・');
}

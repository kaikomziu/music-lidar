// 内蔵曲の EXTRA のレベル表(js/songs/extra-levels.js)と INFERNO のレベル表(js/songs/inferno-levels.js)を作る
// INFERNO は INFERNO_SONGS の曲だけ(はじめの3曲と HARD Lv13 以上。EXTRA より1以上上・最大17)。音源曲の INFERNO のレベルは推定値を表示するだけ(曲ファイルの levels.inferno に手で書く)
// 使い方: node tools/extra-levels.mjs
// - 各曲の HARD と EXTRA の譜面を作り、EXTRA が HARD よりノーツが15%以上多い曲だけ EXTRA を出す
// - レベルは、今ある全曲・全難易度の「平均の密度」と「多い所の密度(1秒あたり・上位10%)」から、近いレベルを選ぶ(HARD より1以上上、最大15)
// 曲や譜面の作り方を変えたら作り直す
import { pathToFileURL } from 'url';
import { writeFileSync } from 'fs';

const root = pathToFileURL(process.cwd() + '/').href;
const { default: SONGS } = await import(root + 'js/songs/index.js');
const C = await import(root + 'js/composer.js');

const unpack = (arr) => arr.map(([t, lane, e]) => (e ? { t: t / 1000, lane, end: e / 1000 } : { t: t / 1000, lane }));
const holds = (notes, d, def) => (def.holdStyle === false ? notes : C.shapeHolds(notes, d === 'extra' || d === 'inferno' ? 'hard' : d, { bpm: def.bpm, level: def.levels?.[d], seed: C.hashStr(def.id) }));
function dens(notes, dur) {
  const ts = notes.map((n) => n.t).sort((a, b) => a - b), w = [];
  for (let i = 0, j = 0; i < ts.length; i++) { while (ts[j] < ts[i] - 1) j++; w.push(i - j + 1); }
  w.sort((a, b) => a - b);
  return [notes.length / dur, w[Math.floor(w.length * 0.9)] || 0];
}

// 1) 今のレベルと密度の対応(レベルごとの中央値)
const by = {}, byHi = {};
const built = new Map();
for (const def of SONGS) {
  let charts = {}, dur;
  if (def.audio) { dur = def.duration; for (const d of C.DIFFS) charts[d] = unpack(def.fixedCharts[d]); }
  else {
    const r = C.composeSong(def); dur = r.duration;
    const cands = C.candidatesFromEvents(r.events);
    for (const d of C.DIFFS) charts[d] = holds(C.generateChart(cands, d, dur, C.hashStr(def.id), def.chart?.[d]), d, def);
    built.set(def.id, { cands, dur });
  }
  for (const d of C.DIFFS) (by[def.levels[d]] ||= []).push(dens(charts[d], dur));
  // INFERNO の推定用には、音源曲の EXTRA も対応に入れる(高いレベルの見本を増やす。EXTRA の推定には使わない)
  if (def.audio && def.fixedCharts.extra && def.levels.extra) (byHi[def.levels.extra] ||= []).push(dens(unpack(def.fixedCharts.extra), dur));
}
const med = {};
for (const [lv, a] of Object.entries(by)) {
  const m = (k) => a.map((x) => x[k]).sort((x, y) => x - y)[Math.floor(a.length / 2)];
  med[lv] = [m(0), m(1)];
}
const medHi = { ...med };
for (const [lv, a] of Object.entries(byHi)) {
  const all = [...(by[lv] || []), ...a];
  const m = (k) => all.map((x) => x[k]).sort((x, y) => x - y)[Math.floor(all.length / 2)];
  medHi[lv] = [m(0), m(1)];
}
const estimate = ([avg, p90], table = med) => {
  let best = 1, bd = 1e9;
  for (const [lv, [ma, mp]] of Object.entries(table)) { const dd = Math.abs(avg - ma) + 0.3 * Math.abs(p90 - mp); if (dd < bd) { bd = dd; best = +lv; } }
  return best;
};

// 2) 内蔵曲の EXTRA(1.85.0 から全曲)
// - すでに表にある曲は、レベルも譜面も変えない(遊んだ記録があるため)
// - 新しく足す曲: ふつうの EXTRA が HARD より15%以上多ければそのまま。足りなければ、拍の頭でない音・1種類の音も
//   同時押しにする確率(chordAnyP)を 0.15 → 0.25 → 0.35 → 0.5 と上げて、15%以上多くなる最小の値を BOOST に書く
const { default: OLD, BOOST: OLD_BOOST = {} } = await import(root + 'js/songs/extra-levels.js?' + Date.now());
const out = {}, boost = { ...OLD_BOOST };
let kept = 0, plain = 0, boosted = 0;
for (const def of SONGS) {
  if (def.audio) continue;
  if (OLD[def.id]) { out[def.id] = OLD[def.id]; kept++; continue; }
  const { cands, dur } = built.get(def.id);
  const hard = holds(C.generateChart(cands, 'hard', dur, C.hashStr(def.id), def.chart?.hard), 'hard', def);
  // EXTRA の下限(最小間隔 0.07 秒・同じレーン 0.09 秒)が HARD の値より粗いときは、HARD の値にそろえる
  const h = C.hardParam(def.chart?.hard), x0 = C.extraParam(def.chart?.hard, def.chart?.extra), fix = {};
  if (x0.minGap > h.minGap) fix.minGap = h.minGap;
  if (x0.sameGap > h.sameGap) fix.sameGap = h.sameGap;
  const ovOf = (p) => ({ ...fix, ...(p ? { chordAnyP: p } : {}) });
  const exOf = (p) => holds(C.generateChart(cands, 'extra', dur, C.hashStr(def.id), C.extraParam(def.chart?.hard, { ...ovOf(p), ...(def.chart?.extra || {}) })), 'extra', def);
  let p = 0, ex = exOf(0);
  for (const q of [0.15, 0.25, 0.35, 0.5]) { if (ex.length >= hard.length * 1.15) break; p = q; ex = exOf(q); }
  if (Object.keys(ovOf(p)).length) { boost[def.id] = ovOf(p); boosted++; } else plain++;
  out[def.id] = Math.min(16, Math.max(def.levels.hard + 1, estimate(dens(ex, dur))));
  console.log('extra+', def.id, 'HARD', hard.length, 'EXTRA', ex.length, `(${((ex.length / hard.length - 1) * 100).toFixed(0)}%)`, JSON.stringify(ovOf(p)), 'Lv', def.levels.hard, '→', out[def.id]);
}
// 3) 内蔵曲の INFERNO(5つ目の難易度)
// - 対象: はじめの3曲(LiDAR Rush・Hyperpop Glitch・Chip Dungeon)と、HARD が Lv13 以上の曲(1.86.0〜)
// - すでに表にある曲は、レベルも譜面も変えない
// - 譜面は EXTRA の値(BOOST 込み)から作る。EXTRA より20%以上多くならなければ、INFERNO の chordAnyP を 0.3 → 0.4 → 0.5 → 0.6 → 0.7 と上げ、
//   それでも足りなければ最小間隔・同じレーンの間隔も EXTRA の値の0.9倍にして、20%以上多くなる最小の組み合わせを INFERNO の BOOST に書く
// - レベルは EXTRA+1 以上・最大17(EXTRA が16の曲もあるため、INFERNO だけ17まで)
const { default: OLD_INF, BOOST: OLD_INF_BOOST = {} } = await import(root + 'js/songs/inferno-levels.js?' + Date.now());
const INFERNO_SONGS = [...new Set(['lidar-rush', 'hyperpop-glitch', 'chip-dungeon', ...SONGS.filter((d) => !d.audio && d.levels.hard >= 13).map((d) => d.id)])];
const inferno = {}, infBoost = { ...OLD_INF_BOOST };
for (const id of INFERNO_SONGS) {
  if (OLD_INF[id]) { inferno[id] = OLD_INF[id]; continue; }
  const def = SONGS.find((x) => x.id === id);
  const { cands, dur } = built.get(id);
  const xo = { ...(boost[id] || {}), ...(def.chart?.extra || {}) };
  const exP = C.extraParam(def.chart?.hard, xo);
  const exN = holds(C.generateChart(cands, 'extra', dur, C.hashStr(id), exP), 'extra', def).length;
  const tries = [];
  for (const p of [0.3, 0.4, 0.5, 0.6, 0.7]) tries.push({ ...(p !== 0.3 ? { chordAnyP: p } : {}) });
  for (const p of [0.5, 0.7]) tries.push({ chordAnyP: p, minGap: +(exP.minGap * 0.9).toFixed(3), sameGap: +(exP.sameGap * 0.9).toFixed(3) });
  let ov = {}, inf = null;
  for (const t of tries) {
    ov = t;
    inf = holds(C.generateChart(cands, 'inferno', dur, C.hashStr(id), C.infernoParam(def.chart?.hard, xo, { ...t, ...(def.chart?.inferno || {}) })), 'inferno', def);
    if (inf.length >= exN * 1.2) break;
  }
  if (Object.keys(ov).length) infBoost[id] = ov;
  const ex = out[id] || def.levels.hard + 1;
  const est = estimate(dens(inf, dur), medHi);
  inferno[id] = Math.min(17, Math.max(ex + 1, est));
  console.log('inferno+', id, inf.length, 'notes(EXTRA', exN, `${((inf.length / exN - 1) * 100).toFixed(0)}%)`, JSON.stringify(ov), 'EXTRA', ex, '推定', est, '→', inferno[id]);
}
writeFileSync('js/songs/inferno-levels.js',
  '// 内蔵曲の INFERNO のレベル(tools/extra-levels.mjs で作る。手で直さない)。ここにある曲だけ INFERNO を出す\n' +
  'export default ' + JSON.stringify(inferno) + ';\n' +
  '// INFERNO を作るときに infernoParam の3つ目に足す値(EXTRA より20%以上多くするため。chordAnyP・minGap・sameGap)\n' +
  'export const BOOST = ' + JSON.stringify(infBoost) + ';\n');
// 4) 音源曲の INFERNO のレベルの推定(表示だけ)
for (const def of SONGS) {
  if (!def.audio || !def.fixedCharts.inferno) continue;
  const ch = unpack(def.fixedCharts.inferno), ex = def.levels.extra || def.levels.hard;
  const est = estimate(dens(ch, def.duration), medHi);
  console.log('audio-inferno', def.id, ch.length, 'notes', dens(ch, def.duration).map((v) => v.toFixed(2)).join('/'), 'EXTRA', ex, '推定', est, '→', Math.min(16, Math.max(ex + 1, est)));
}
writeFileSync('js/songs/extra-levels.js',
  '// 内蔵曲の EXTRA のレベル(tools/extra-levels.mjs で作る。手で直さない)。1.85.0 から全曲\n' +
  'export default ' + JSON.stringify(out) + ';\n' +
  '// ふつうの作り方では HARD とノーツ数がほぼ同じになる曲: EXTRA を作るときの chordAnyP(拍の頭でない音・1種類の音も同時押しにする確率)\n' +
  'export const BOOST = ' + JSON.stringify(boost) + ';\n');
console.log('extra', Object.keys(out).length, 'songs / kept', kept, 'plain', plain, 'boosted', boosted);
const hist = {};
for (const v of Object.values(out)) hist[v] = (hist[v] || 0) + 1;
console.log('levels', JSON.stringify(hist));

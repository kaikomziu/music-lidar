// 内蔵曲の EXTRA のレベル表(js/songs/extra-levels.js)と INFERNO のレベル表(js/songs/inferno-levels.js)を作る
// INFERNO は INFERNO_SONGS の曲だけ(EXTRA より1以上上)。音源曲の INFERNO のレベルは推定値を表示するだけ(曲ファイルの levels.inferno に手で書く)
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

// 2) 内蔵曲の EXTRA
const out = {};
let skipped = 0;
for (const def of SONGS) {
  if (def.audio) continue;
  const { cands, dur } = built.get(def.id);
  const hard = holds(C.generateChart(cands, 'hard', dur, C.hashStr(def.id), def.chart?.hard), 'hard', def);
  const ex = holds(C.generateChart(cands, 'extra', dur, C.hashStr(def.id), C.extraParam(def.chart?.hard, def.chart?.extra)), 'extra', def);
  if (ex.length < hard.length * 1.15) { skipped++; continue; }
  out[def.id] = Math.min(15, Math.max(def.levels.hard + 1, estimate(dens(ex, dur))));
}
// 3) 内蔵曲の INFERNO(5つ目の難易度)。選んだ曲だけ
const INFERNO_SONGS = ['lidar-rush', 'hyperpop-glitch', 'chip-dungeon'];
const inferno = {};
for (const id of INFERNO_SONGS) {
  const def = SONGS.find((x) => x.id === id);
  const { cands, dur } = built.get(id);
  const inf = holds(C.generateChart(cands, 'inferno', dur, C.hashStr(id), C.infernoParam(def.chart?.hard, def.chart?.extra, def.chart?.inferno)), 'inferno', def);
  const ex = out[id] || def.levels.hard + 1;
  const est = estimate(dens(inf, dur), medHi);
  const exN = holds(C.generateChart(cands, 'extra', dur, C.hashStr(id), C.extraParam(def.chart?.hard, def.chart?.extra)), 'extra', def).length;
  inferno[id] = Math.min(16, Math.max(ex + 1, est));
  console.log('inferno', id, inf.length, 'notes(EXTRA', exN, ')', dens(inf, dur).map((v) => v.toFixed(2)).join('/'), 'EXTRA', ex, '推定', est, '→', inferno[id]);
}
writeFileSync('js/songs/inferno-levels.js',
  '// 内蔵曲の INFERNO のレベル(tools/extra-levels.mjs で作る。手で直さない)。ここにある曲だけ INFERNO を出す\n' +
  'export default ' + JSON.stringify(inferno) + ';\n');
// 4) 音源曲の INFERNO のレベルの推定(表示だけ)
for (const def of SONGS) {
  if (!def.audio || !def.fixedCharts.inferno) continue;
  const ch = unpack(def.fixedCharts.inferno), ex = def.levels.extra || def.levels.hard;
  const est = estimate(dens(ch, def.duration), medHi);
  console.log('audio-inferno', def.id, ch.length, 'notes', dens(ch, def.duration).map((v) => v.toFixed(2)).join('/'), 'EXTRA', ex, '推定', est, '→', Math.min(16, Math.max(ex + 1, est)));
}
writeFileSync('js/songs/extra-levels.js',
  '// 内蔵曲の EXTRA のレベル(tools/extra-levels.mjs で作る。手で直さない)。ここにある曲だけ EXTRA を出す\n' +
  'export default ' + JSON.stringify(out) + ';\n');
console.log('extra', Object.keys(out).length, 'songs / skipped', skipped);
const hist = {};
for (const v of Object.values(out)) hist[v] = (hist[v] || 0) + 1;
console.log('levels', JSON.stringify(hist));

// 内蔵曲の EXTRA のレベル表(js/songs/extra-levels.js)を作る
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
const holds = (notes, d, def) => (def.holdStyle === false ? notes : C.shapeHolds(notes, d === 'extra' ? 'hard' : d, { bpm: def.bpm, level: def.levels?.[d], seed: C.hashStr(def.id) }));
function dens(notes, dur) {
  const ts = notes.map((n) => n.t).sort((a, b) => a - b), w = [];
  for (let i = 0, j = 0; i < ts.length; i++) { while (ts[j] < ts[i] - 1) j++; w.push(i - j + 1); }
  w.sort((a, b) => a - b);
  return [notes.length / dur, w[Math.floor(w.length * 0.9)] || 0];
}

// 1) 今のレベルと密度の対応(レベルごとの中央値)
const by = {};
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
}
const med = {};
for (const [lv, a] of Object.entries(by)) {
  const m = (k) => a.map((x) => x[k]).sort((x, y) => x - y)[Math.floor(a.length / 2)];
  med[lv] = [m(0), m(1)];
}
const estimate = ([avg, p90]) => {
  let best = 1, bd = 1e9;
  for (const [lv, [ma, mp]] of Object.entries(med)) { const dd = Math.abs(avg - ma) + 0.3 * Math.abs(p90 - mp); if (dd < bd) { bd = dd; best = +lv; } }
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
writeFileSync('js/songs/extra-levels.js',
  '// 内蔵曲の EXTRA のレベル(tools/extra-levels.mjs で作る。手で直さない)。ここにある曲だけ EXTRA を出す\n' +
  'export default ' + JSON.stringify(out) + ';\n');
console.log('extra', Object.keys(out).length, 'songs / skipped', skipped);
const hist = {};
for (const v of Object.values(out)) hist[v] = (hist[v] || 0) + 1;
console.log('levels', JSON.stringify(hist));

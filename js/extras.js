// 追加の遊び方・便利機能
//  - デイリーチャレンジ(毎日みんな同じ曲・同じ条件で勝負)
//  - コースモード(自分で曲を選んで、体力つきで続けてプレイ。URLで共有)
//  - リザルトの判定グラフ / 共有用の画像
//  - 判定タイミングの自動調整
//  - ゲームパッド
import { mulberry32, hashStr } from './composer.js';
import { getCtx, nowAudio } from './audio.js';
import { fetchRanking, submitScore } from './ranking.js';
import { createMV, mvTag } from './mv.js';
import { load, save } from './storage.js';

const $ = (id) => document.getElementById(id);
let ui = null;
// ui = { entries, play(entry, diff, custom, extra), show, toast, esc, jacketURL, overlay, settings(), saveSettings(s),
//        rankId(), playerName(), rankRows(rows), fmtScore(n), state(), game(), goHome(liveMenu), pickSong(o) }

export function initExtras(api) {
  ui = api;
  initCourse();
  initCalib();
  startGamepad();
  $('btn-daily').addEventListener('click', playDaily);
  $('btn-rshare').addEventListener('click', shareResult);
}

// ---------------------------------------------------------------------------
// デイリーチャレンジ
// ---------------------------------------------------------------------------
const DAILY_OPTS = [
  { lane: 'normal', vis: 'none', label: 'オプションなし' },
  { lane: 'mirror', vis: 'none', label: 'MIRROR(左右反転)' },
  { lane: 'random', vis: 'none', label: 'RANDOM(レーン入れ替え)' },
  { lane: 'normal', vis: 'hidden', label: 'HIDDEN(手前で消える)' },
  { lane: 'normal', vis: 'sudden', label: 'SUDDEN(奥が隠れる)' },
];
// 日本時間の日付から、今日の曲・難易度・条件を決める(みんな同じになる)
export function dailyOf(date = new Date()) {
  const ymd = new Date(date.getTime() + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
  const pool = ui.entries.filter((e) => !e.local && e.urlId);
  const r = mulberry32(hashStr('daily-' + ymd));
  const entry = pool[Math.floor(r() * pool.length)];
  const diff = r() < 0.45 ? 'normal' : 'hard';
  const o = DAILY_OPTS[Math.floor(r() * DAILY_OPTS.length)];
  return { key: 'daily-' + ymd, ymd, entry, diff, opts: { lane: o.lane, vis: o.vis }, optLabel: o.label };
}

export function renderDaily() {
  const d = dailyOf();
  const box = $('daily-info');
  if (!box || !d.entry) return;
  box.innerHTML = `<img src="${ui.jacketURL(d.entry, 96)}" alt=""><span><b>${ui.esc(d.entry.title)}${mvTag(d.entry.id)}</b>
    <small>${d.diff.toUpperCase()} Lv${d.entry.levels[d.diff]} ・ ${d.optLabel}</small><small class="daily-top" id="daily-top">ランキングを読み込み中…</small></span>`;
  fetchRanking(d.key, d.diff, ui.rankId(), 3).then((rows) => {
    const el = $('daily-top');
    if (!el) return;
    const top = rows.filter((x) => x.rank <= 3);
    el.textContent = top.length ? '今日のトップ: ' + top.map((x) => `${x.rank}. ${x.name} ${x.score.toLocaleString()}`).join(' / ') : 'まだ誰も挑戦していません。一番乗りしよう';
  }).catch(() => { const el = $('daily-top'); if (el) el.textContent = ''; });
}

function playDaily() {
  const d = dailyOf();
  if (!d.entry) return;
  ui.play(d.entry, d.diff, null, null, { daily: d });
}

// リザルト: デイリーのランキングへ送信して表示
export function dailyResult(daily, r, isCurrent) {
  const box = $('r-daily');
  box.hidden = false;
  const name = ui.playerName();
  if (!name) { box.innerHTML = '<p class="r-msg">デイリーチャレンジのランキングに参加するには、ログインするか設定でゲスト名を入れてください。</p>'; return; }
  box.innerHTML = '<p class="r-msg">デイリーチャレンジのランキングに送信中…</p>';
  submitScore(daily.key, daily.diff, ui.rankId(), name, r).then(async (rank) => {
    const rows = await fetchRanking(daily.key, daily.diff, ui.rankId(), 5);
    if (!isCurrent()) return;
    box.innerHTML = `<p>DAILY CHALLENGE ${daily.ymd.slice(4, 6)}/${daily.ymd.slice(6)} ・ ${ui.esc(daily.optLabel)} ・ 今日の順位 <span class="r-myrank">#${rank}</span></p><ol class="rank-list">${ui.rankRows(rows)}</ol>`;
  }).catch((e) => { console.error(e); box.innerHTML = '<p class="r-msg">デイリーチャレンジのランキングに送信できませんでした</p>'; });
}

// ---------------------------------------------------------------------------
// リザルトの判定グラフ: 左はズレの分布(早い←→遅い)、右は曲のどこでミスしたか
// ---------------------------------------------------------------------------
export function drawJudgeGraph(r, duration) {
  const cv = $('r-graph'), note = $('r-graph-note');
  const log = r.log || [];
  const offs = log.filter(([, , d]) => d != null).map(([, , d]) => d * 1000);
  cv.hidden = !log.length;
  if (!log.length) { note.textContent = ''; return; }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = cv.clientWidth || 520, H = 120;
  cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  g.font = '600 10px "Orbitron", "Noto Sans JP", sans-serif';
  // 左: ズレの分布
  const hw = Math.floor(W * 0.48), bins = 27, lim = 135;
  const hist = new Array(bins).fill(0);
  for (const o of offs) hist[Math.max(0, Math.min(bins - 1, Math.floor(((o + lim) / (2 * lim)) * bins)))]++;
  const mx = Math.max(1, ...hist), bw = hw / bins;
  hist.forEach((v, i) => {
    const c = (i + 0.5) / bins * 2 * lim - lim, a = Math.abs(c);
    g.fillStyle = a <= 45 ? '#7ff9ff' : a <= 90 ? '#ff7ce6' : '#b6ff7a';
    const h = (v / mx) * (H - 34);
    g.fillRect(i * bw + 1, H - 18 - h, bw - 2, h);
  });
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(hw / 2, 8, 1, H - 26);
  g.fillStyle = 'rgba(200,215,255,0.75)';
  g.textAlign = 'left'; g.fillText('← FAST', 0, H - 4);
  g.textAlign = 'right'; g.fillText('SLOW →', hw, H - 4);
  // 右: 曲の時間に沿ったミス
  const x0 = Math.floor(W * 0.54), tw = W - x0, segs = 40;
  const miss = new Array(segs).fill(0), all = new Array(segs).fill(0);
  const dur = Math.max(1, duration);
  for (const [t, res] of log) { const k = Math.max(0, Math.min(segs - 1, Math.floor((t / dur) * segs))); all[k]++; if (res === 'MISS') miss[k]++; }
  const am = Math.max(1, ...all), sw = tw / segs;
  for (let k = 0; k < segs; k++) {
    const h = (all[k] / am) * (H - 34);
    g.fillStyle = 'rgba(120,140,220,0.35)'; g.fillRect(x0 + k * sw + 1, H - 18 - h, sw - 2, h);
    if (miss[k]) { const mh = Math.max(3, (miss[k] / am) * (H - 34)); g.fillStyle = '#ff5a6e'; g.fillRect(x0 + k * sw + 1, H - 18 - mh, sw - 2, mh); }
  }
  g.fillStyle = 'rgba(200,215,255,0.75)';
  g.textAlign = 'left'; g.fillText('ノーツの量 / ミス(赤)', x0, 10);
  g.fillText('0:00', x0, H - 4);
  g.textAlign = 'right'; g.fillText(`${Math.floor(dur / 60)}:${String(Math.floor(dur % 60)).padStart(2, '0')}`, W, H - 4);
  // 平均のズレと、調整のすすめ
  if (offs.length >= 10) {
    const avg = offs.reduce((a, b) => a + b, 0) / offs.length;
    const ms = Math.round(avg);
    note.textContent = `平均のズレ ${ms > 0 ? '+' : ''}${ms}ms(${Math.abs(ms) <= 8 ? 'ほぼぴったり' : ms > 0 ? '遅め' : '早め'})` +
      (Math.abs(ms) > 15 ? ` ・ 設定の「判定タイミング」を ${ms > 0 ? '+' : ''}${ms + (ui.settings().offset || 0)}ms にすると合いやすくなります` : '');
  } else note.textContent = '';
}

// ---------------------------------------------------------------------------
// 共有用の画像(MVの1場面 + ジャケット + スコア)
// ---------------------------------------------------------------------------
let shareCtx = null; // { entry, label, r }
export function setShareResult(entry, label, r) { shareCtx = { entry, label, r }; }

async function buildShareImage({ entry, label, r }) {
  const W = 1200, H = 630;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  await document.fonts?.ready;
  g.fillStyle = '#060918'; g.fillRect(0, 0, W, H);
  // 背景: 曲のMVのいちばん盛り上がる場面
  const info = entry.mvAuto?.();
  const mv = createMV(entry.id, entry.bpm, entry.offset || 0, { scale: 0.75, maxW: 900 }, info);
  if (mv) {
    const s = info?.sections?.find((x) => x.lvl === 2);
    const t = s ? ((s.from + s.to) / 2) * 60 / entry.bpm : entry.previewAt || 30;
    mv.draw(g, W, H, t);
  }
  const shade = g.createLinearGradient(0, 0, W, 0);
  shade.addColorStop(0, 'rgba(4,6,16,0.92)'); shade.addColorStop(0.62, 'rgba(4,6,16,0.75)'); shade.addColorStop(1, 'rgba(4,6,16,0.25)');
  g.fillStyle = shade; g.fillRect(0, 0, W, H);
  // ジャケット
  const img = new Image();
  img.src = ui.jacketURL(entry, 256);
  await img.decode().catch(() => {});
  g.save(); g.shadowColor = entry.color; g.shadowBlur = 30;
  g.drawImage(img, 64, 150, 260, 260);
  g.restore();
  g.strokeStyle = entry.color; g.lineWidth = 3; g.strokeRect(64, 150, 260, 260);
  // 文字
  const x = 370;
  g.textBaseline = 'alphabetic';
  g.fillStyle = 'rgba(200,215,255,0.85)'; g.font = '700 26px "Orbitron", "Noto Sans JP", sans-serif';
  g.fillText('MUSIC LiDAR', 64, 90);
  g.fillStyle = '#fff'; g.font = '800 54px "Orbitron", "Noto Sans JP", sans-serif';
  let title = entry.title;
  while (g.measureText(title).width > W - x - 50 && title.length > 4) title = title.slice(0, -2) + '…';
  g.fillText(title, x, 200);
  g.fillStyle = entry.color; g.font = '700 26px "Orbitron", "Noto Sans JP", sans-serif';
  g.fillText(label, x, 245);
  g.fillStyle = '#fff'; g.font = '800 104px "Orbitron", sans-serif';
  g.save(); g.shadowColor = entry.color; g.shadowBlur = 24;
  g.fillText(ui.fmtScore(r.score), x, 360);
  g.restore();
  g.font = '900 64px "Orbitron", sans-serif'; g.fillStyle = '#ffd25e';
  g.fillText(r.rank, x, 450);
  const badge = r.ap ? 'ALL PERFECT' : r.fc ? 'FULL COMBO' : '';
  g.font = '800 30px "Orbitron", sans-serif';
  if (badge) { g.fillStyle = r.ap ? '#7ff9ff' : '#ffd25e'; g.fillText(badge, x + 130, 440); }
  g.fillStyle = 'rgba(220,230,255,0.9)'; g.font = '600 24px "Orbitron", "Noto Sans JP", sans-serif';
  g.fillText(`ACC ${r.accuracy.toFixed(2)}%  ・  COMBO ${r.maxCombo}/${r.total}`, x, 500);
  const C = { PERFECT: '#7ff9ff', GREAT: '#ff7ce6', GOOD: '#b6ff7a', MISS: '#ff5a6e' };
  let cx = x;
  g.font = '700 22px "Orbitron", sans-serif';
  for (const [k, v] of Object.entries(r.counts)) { g.fillStyle = C[k]; const s = `${k} ${v}`; g.fillText(s, cx, 545); cx += g.measureText(s).width + 26; }
  g.fillStyle = 'rgba(200,215,255,0.6)'; g.font = '500 20px "Noto Sans JP", sans-serif';
  g.fillText('music-lidar.com', 64, H - 40);
  return new Promise((res) => cv.toBlob(res, 'image/png'));
}

async function shareResult() {
  if (!shareCtx) return;
  const btn = $('btn-rshare');
  btn.disabled = true;
  try {
    const blob = await buildShareImage(shareCtx);
    const file = new File([blob], `music-lidar-${shareCtx.entry.id}.png`, { type: 'image/png' });
    const text = `MUSIC LiDAR で「${shareCtx.entry.title}」${shareCtx.label} をプレイ! スコア ${shareCtx.r.score.toLocaleString()}(${shareCtx.r.rank})`;
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: text + ' https://music-lidar.com/' }).catch(() => {});
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = file.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      ui.toast('共有用の画像を保存しました');
    }
  } catch (e) { console.error(e); ui.toast('画像を作れませんでした'); } finally { btn.disabled = false; }
}

// ---------------------------------------------------------------------------
// コースモード: 好きな曲を2〜6曲選んで、体力つきで続けてプレイ。URL で共有できる
// ---------------------------------------------------------------------------
const LIFE = {
  easy: { label: 'やさしい', start: 100, miss: 3, good: 0.5, great: 0.05, perfect: 0.15 },
  normal: { label: 'ふつう', start: 100, miss: 6, good: 1.2, great: 0.05, perfect: 0.12 },
  hard: { label: 'きびしい', start: 100, miss: 10, good: 2.5, great: 0.03, perfect: 0.1 },
};
const course = { items: [], life: 'normal', running: false, results: null };
const playable = () => ui.entries.filter((e) => !e.local && e.levels); // e.charts を見ると全曲の譜面づくりが走るので levels で見る
const DIFFS = ['easy', 'normal', 'hard'];

function initCourse() {
  $('btn-course').addEventListener('click', () => openCourse());
  $('course').addEventListener('click', onCourseClick);
  $('course').addEventListener('change', onCourseChange);
}

// URL の ?course=id.n,id.h&life=hard で開かれたら、そのコースを読み込む
// (画面が変わると URL が書き換わるので、ページを開いた時点の URL を覚えておく)
const START_Q = new URLSearchParams(location.search);
export function courseFromUrl() {
  const q = START_Q;
  const c = q.get('course');
  if (!c) return false;
  const items = c.split(',').map((s) => { const [id, d] = s.split('.'); return { id, diff: { e: 'easy', n: 'normal', h: 'hard' }[d] || 'normal' }; })
    .filter((x) => playable().some((e) => e.id === x.id)).slice(0, 6);
  q.delete('course'); // 一度読んだら忘れる(タイトルに戻ったときにまた開かないように)
  if (items.length < 2) return false;
  course.items = items;
  course.life = LIFE[q.get('life')] ? q.get('life') : 'normal';
  q.delete('life');
  openCourse(true);
  return true;
}

function randomCourse() {
  const list = playable();
  const r = Math.random;
  course.items = Array.from({ length: 4 }, () => ({ id: list[Math.floor(r() * list.length)].id, diff: 'normal' }));
}

function openCourse(keep = false) {
  if (!keep && !course.items.length) {
    const saved = load('courseDraft', null);
    if (saved?.items?.length) Object.assign(course, saved); else randomCourse();
  }
  course.results = null;
  renderCourse();
  ui.overlay('course', true);
}

function courseUrl() {
  const enc = course.items.map((x) => `${x.id}.${x.diff[0]}`).join(',');
  return `${location.origin}${new URL('./', document.baseURI).pathname}?course=${encodeURIComponent(enc)}&life=${course.life}`;
}

function renderCourse() {
  const esc = ui.esc, list = playable();
  const rows = course.items.map((it, i) => {
    const e = list.find((x) => x.id === it.id);
    return `<li data-i="${i}" style="--c:${e?.color || '#888'}"><span class="cs-no">${i + 1}</span>
      <button class="cs-song" data-act="pick" title="曲を選び直す"><img src="${e ? ui.jacketURL(e, 64) : ''}" alt="">
        <span class="cs-text"><b>${e ? esc(e.title) : '(見つからない曲)'}</b><small>${e ? esc(e.genre) + ' ・ BPM ' + Math.round(e.bpm) + mvTag(e.id) : ''}</small></span>
        <span class="cs-lv ${it.diff}">${it.diff.toUpperCase()} ${e ? e.levels[it.diff] : ''}</span></button>
      <span class="cs-move"><button data-act="up" ${i === 0 ? 'disabled' : ''} aria-label="上へ">▲</button><button data-act="down" ${i === course.items.length - 1 ? 'disabled' : ''} aria-label="下へ">▼</button></span>
      <button class="cs-del" data-act="del" ${course.items.length <= 2 ? 'disabled' : ''} aria-label="外す">×</button></li>`;
  }).join('');
  const res = course.results;
  $('course-box').innerHTML = `<div class="panel-label"><span>COURSE</span><span>コースモード</span></div>
    <p class="muted small">好きな曲を2〜6曲選んで、続けてプレイします。体力は曲をまたいで続き、0になったらそこで終わり。リンクを送れば友だちも同じコースで遊べます。曲を押すと選曲画面で選び直せます。</p>
    <ol class="course-list">${rows}</ol>
    <div class="course-row">
      <button class="btn-line small" data-act="add" ${course.items.length >= 6 ? 'disabled' : ''}>＋ 曲を追加</button>
      <button class="btn-line small" data-act="random">おまかせ</button>
      <label>体力 <select data-k="life">${Object.entries(LIFE).map(([k, v]) => `<option value="${k}" ${k === course.life ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
    </div>
    ${res ? `<div class="course-result ${res.cleared ? 'pass' : 'fail'}"><b>${res.cleared ? 'コースクリア!' : `${res.list.length}曲目で体力がなくなりました`}</b>
      <span>合計スコア ${res.list.reduce((a, x) => a + x.r.score, 0).toLocaleString()} ・ 残り体力 ${Math.max(0, res.life).toFixed(1)}%</span>
      <ol>${res.list.map((x, k) => `<li>${k + 1}. ${esc(x.e.title)} <small>${x.r.failed ? 'FAILED' : x.r.score.toLocaleString()}</small></li>`).join('')}</ol></div>` : ''}
    <div class="modal-actions"><button class="btn-line" data-act="close">閉じる</button><button class="btn-line" data-act="share">リンクをコピー</button><button class="btn-glow" data-act="play">プレイ</button></div>`;
}

const saveDraft = () => save('courseDraft', { items: course.items, life: course.life });

function onCourseChange(ev) {
  if (ev.target.dataset.k !== 'life') return;
  course.life = ev.target.value;
  saveDraft();
  renderCourse();
}

// いつもの選曲画面を開いて曲を選んでもらう(i を渡すとその曲を入れ替え、null なら最後に追加)
function pickInto(i) {
  const cur = course.items[i] || course.items.at(-1) || { diff: 'normal' };
  ui.overlay('course', false);
  ui.pickSong({
    label: i == null ? `${course.items.length + 1}曲目を追加` : `${i + 1}曲目を選び直す`,
    id: course.items[i]?.id, diff: cur.diff,
    done: (e, diff) => {
      const it = { id: e.id, diff };
      if (i == null) course.items.push(it); else course.items[i] = it;
      saveDraft();
      ui.goHome(true);
      course.results = null;
      renderCourse();
      ui.overlay('course', true);
    },
    cancel: () => { renderCourse(); ui.overlay('course', true); },
  });
}

async function onCourseClick(ev) {
  if (ev.target === $('course')) { ui.overlay('course', false); return; }
  const b = ev.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act, i = +b.closest('li')?.dataset.i;
  if (act === 'close') { ui.overlay('course', false); return; }
  if (act === 'add') { pickInto(null); return; }
  if (act === 'pick') { pickInto(i); return; }
  if (act === 'del') course.items.splice(i, 1);
  if (act === 'up' || act === 'down') {
    const j = act === 'up' ? i - 1 : i + 1;
    [course.items[i], course.items[j]] = [course.items[j], course.items[i]];
  }
  if (act === 'random') randomCourse();
  if (act === 'share') {
    const url = courseUrl();
    try { await navigator.clipboard.writeText(url); ui.toast('コースのリンクをコピーしました'); } catch { prompt('このリンクを送ってください', url); }
    return;
  }
  if (act === 'play') { ui.overlay('course', false); runCourse(); return; }
  saveDraft();
  renderCourse();
}

async function runCourse() {
  if (course.running) return;
  course.running = true;
  const rule = LIFE[course.life];
  const list = [];
  let life = rule.start, quit = false;
  try {
    for (let i = 0; i < course.items.length; i++) {
      const it = course.items[i], e = playable().find((x) => x.id === it.id);
      if (!e) continue;
      const r = await new Promise((resolve) => ui.play(e, it.diff, {
        kind: 'dan', label: `COURSE ${i + 1}/${course.items.length} ・ ${it.diff.toUpperCase()}`, title: e.title, notes: e.charts[it.diff], scroll: e.scroll,
        life: { ...rule, start: life }, onExit: resolve,
      }));
      if (!r) { quit = true; break; }
      list.push({ e, r });
      life = r.life;
      if (r.failed) break;
    }
  } finally { course.running = false; }
  ui.goHome(true);
  if (quit && !list.length) return;
  course.results = { list, life, cleared: !quit && list.length === course.items.length && !list.at(-1)?.r.failed };
  renderCourse();
  ui.overlay('course', true);
}

// ---------------------------------------------------------------------------
// 判定タイミングの自動調整: クリック音に合わせて叩き、ズレの中央値を調整値にする
// ---------------------------------------------------------------------------
const CAL = { BEATS: 20, SKIP: 4, INT: 0.6 };
let cal = null;
function initCalib() {
  $('btn-calib').addEventListener('click', () => { ui.overlay('calib', true); calReset(); });
  $('calib-start').addEventListener('click', calStart);
  $('calib-close').addEventListener('click', () => { calStop(); ui.overlay('calib', false); });
  $('calib-pad').addEventListener('pointerdown', (ev) => { ev.preventDefault(); calTap(ev.timeStamp); });
  window.addEventListener('keydown', (ev) => {
    if (!cal?.running || ev.repeat) return;
    if (ev.code === 'Escape') return;
    ev.preventDefault(); ev.stopImmediatePropagation();
    calTap(ev.timeStamp);
  }, true);
}
function calReset() {
  $('calib-msg').textContent = 'スタートを押すと、カッ・カッ…と音が鳴ります。音に合わせて、どのキーでもいいので叩いてください(画面のパッドをタップでもOK)。';
  $('calib-start').disabled = false;
  $('calib-pad').textContent = 'TAP';
}
function calStart() {
  const ctx = getCtx();
  const t0 = ctx.currentTime + 1.0;
  const clicks = [];
  for (let i = 0; i < CAL.BEATS; i++) {
    const t = t0 + i * CAL.INT;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = i % 4 === 0 ? 1760 : 1320;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + 0.1);
    clicks.push(t);
  }
  cal = { running: true, clicks, diffs: [], end: t0 + CAL.BEATS * CAL.INT + 0.4 };
  $('calib-start').disabled = true;
  $('calib-msg').textContent = '音に合わせて叩いてください…';
  const tick = () => {
    if (!cal?.running) return;
    const left = Math.max(0, Math.ceil((cal.end - getCtx().currentTime) / CAL.INT));
    $('calib-pad').textContent = left ? `TAP(あと${left})` : '…';
    if (getCtx().currentTime >= cal.end) calFinish(); else setTimeout(tick, 100);
  };
  tick();
}
function calTap(perf) {
  if (!cal?.running) return;
  const t = nowAudio(perf);
  let best = null;
  cal.clicks.forEach((c, i) => { if (i >= CAL.SKIP && (best == null || Math.abs(t - c) < Math.abs(t - best))) best = c; });
  if (best != null && Math.abs(t - best) < 0.25) cal.diffs.push(t - best);
  const pad = $('calib-pad');
  pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit');
}
function calStop() { if (cal) cal.running = false; }
function calFinish() {
  cal.running = false;
  const d = cal.diffs.sort((a, b) => a - b);
  $('calib-start').disabled = false;
  $('calib-pad').textContent = 'TAP';
  if (d.length < 8) { $('calib-msg').textContent = `叩いた回数が少なかったので測れませんでした(${d.length}回)。もう一度スタートを押してください。`; return; }
  const med = d[Math.floor(d.length / 2)];
  const ms = Math.round(med * 1000);
  const s = ui.settings();
  s.offset = Math.max(-150, Math.min(150, ms));
  ui.saveSettings(s);
  $('calib-msg').textContent = `あなたのズレは ${ms > 0 ? '+' : ''}${ms}ms(${Math.abs(ms) <= 8 ? 'ほぼぴったり' : ms > 0 ? '遅め' : '早め'})でした。判定タイミングを ${s.offset > 0 ? '+' : ''}${s.offset}ms に設定しました。`;
}

// ---------------------------------------------------------------------------
// ゲームパッド
//  プレイ中: ←/LB → D、↓・↑/LT → F、X・A/RT → J、B・Y/RB → K、START → 一時停止
//  メニュー: 十字キー → ボタンの選択を移動(選曲画面では矢印キー)、A → 決定、B → 戻る(Esc)
// ---------------------------------------------------------------------------
const PAD_LANE = { 14: 0, 4: 0, 13: 1, 12: 1, 6: 1, 2: 2, 0: 2, 7: 2, 1: 3, 3: 3, 5: 3 };
const PAD_DIR = { 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight' };
// 今見えている、押せるボタン(いちばん手前の窓 or 今の画面の中)
function focusables() {
  const root = document.querySelector('.overlay.modal.on') || document.querySelector('.screen.active') || document.body;
  return [...root.querySelectorAll('button, [href], select, input')].filter((el) => !el.disabled && el.offsetParent !== null);
}
function padMenu(i) {
  const key = (k) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code: k, bubbles: true, cancelable: true }));
  const st = ui.state();
  if (PAD_DIR[i]) {
    if (st === 'select' && !document.querySelector('.overlay.modal.on')) { key(PAD_DIR[i]); return; }
    const list = focusables();
    if (!list.length) return;
    const at = list.indexOf(document.activeElement);
    const step = i === 12 || i === 14 ? -1 : 1;
    list[(at < 0 ? 0 : at + step + list.length) % list.length].focus();
    return;
  }
  if (i === 0) {
    const el = document.activeElement;
    if (el && el !== document.body && /^(BUTTON|A)$/.test(el.tagName)) el.click(); else key('Enter');
  } else if (i === 1 || i === 9) key('Escape');
}
const prevPad = {};
export const padConnected = () => [...(navigator.getGamepads?.() || [])].some(Boolean);
function startGamepad() {
  if (!navigator.getGamepads) return;
  const key = (k, code) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, code, bubbles: true, cancelable: true }));
  window.addEventListener('gamepadconnected', () => ui.toast('ゲームパッドをつなぎました(設定に操作方法があります)'));
  const loop = () => {
    requestAnimationFrame(loop);
    for (const pad of navigator.getGamepads()) {
      if (!pad) continue;
      const prev = prevPad[pad.index] || [];
      const now = pad.buttons.map((b) => b.pressed || b.value > 0.5);
      const inGame = ui.state() === 'game' && ui.game();
      now.forEach((on, i) => {
        if (on === !!prev[i]) return;
        if (inGame) {
          const lane = PAD_LANE[i];
          if (lane != null) { if (on) ui.game().press(lane, performance.now()); else ui.game().release(lane, performance.now()); return; }
          if (i === 9 && on) key('Escape', 'Escape');
        } else if (on) padMenu(i);
      });
      prevPad[pad.index] = now;
    }
  };
  requestAnimationFrame(loop);
}

// プレイヤーを増やすための機能(1.62.0)
//  - すぐ遊べる導線: はじめての人はタイトルから「いますぐ1曲」で EASY の曲を字幕つきで始める
//  - 次のおすすめ: リザルトで、今の結果から「次はこれ」を3曲出す
//  - X に投稿: リザルトの結果を X(旧 Twitter)の投稿画面に送る
//  - デイリーの絵文字シェア: 曲を10区間に分けた出来を絵文字にして共有(Wordle 風)。連続挑戦の日数も数える
//  - オンラインのゴースト: ランキング1位・すぐ上のライバルのプレイ記録と競う(サーバー mlidar_ghost_*)
import { rpc } from './ranking.js';
import { load, save } from './storage.js';

const $ = (id) => document.getElementById(id);
let ui = null;
// ui = { entries, esc, toast, play(entry, d, custom, live, extra), bestOf(id, d), rankId(), playerName(), isTouch, settings(), enterQuiet() }

export const SITE = 'https://music-lidar.com/';

export function initSocial(api) {
  ui = api;
  const q = $('btn-quick');
  // はじめての人(チュートリアルも記録もない)だけに出す
  const fresh = !load('tutorialDone', false) && !Object.keys(load('best', {}) || {}).length;
  if (q) {
    q.hidden = !fresh;
    q.addEventListener('click', (ev) => { ev.stopPropagation(); quickPlay(); });
  }
  $('r-next')?.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-next]');
    if (!b) return;
    const [id, d] = b.dataset.next.split('/');
    const e = ui.entries.find((x) => x.id === id);
    if (e) ui.play(e, d);
  });
}

// ---------------------------------------------------------------------------
// すぐ遊べる導線
// ---------------------------------------------------------------------------
const pool = () => ui.entries.filter((e) => !e.local && !e.event && e.urlId && e.levels);
// はじめの1曲: EASY がいちばんやさしく、テンポがゆったりめの曲
export function starterSong() {
  const list = pool().filter((e) => e.levels.easy && e.prepare); // 音源ファイルの曲は読み込みが重いので内蔵曲から
  list.sort((a, b) => (a.levels.easy - b.levels.easy) || (Math.abs(a.bpm - 110) - Math.abs(b.bpm - 110)));
  return list[0];
}
function starterCaptions() {
  const key = ui.isTouch ? '左から4つのレーンをタップ' : 'D F J K キーで叩く';
  return [
    { t: 0, until: 6, text: 'ノーツが光る線に重なったら押す', sub: key },
    { t: 6, until: 12, text: 'ぴったりほど高得点', sub: 'PERFECT → GREAT → GOOD → MISS' },
    { t: 12, until: 18, text: 'MISS しないで続けるとコンボ', sub: ui.isTouch ? '一時停止は右上のボタン' : 'Esc で一時停止' },
  ];
}
export function quickPlay() {
  const e = starterSong();
  if (!e) return;
  ui.enterQuiet();
  save('quickPlayed', true);
  ui.play(e, 'easy', null, null, { captions: starterCaptions(), quick: true });
}

// ---------------------------------------------------------------------------
// 次のおすすめ
// ---------------------------------------------------------------------------
const DIFFS = ['easy', 'normal', 'hard'];
// 精度から「次にちょうどいいレベル」を決めて、まだ遊んでいない曲を優先して選ぶ
export function recommend(entry, d, r, n = 3) {
  const lv = entry.levels?.[d] || 3;
  const target = r.accuracy >= 96 ? lv + 2 : r.accuracy >= 90 ? lv + 1 : r.accuracy >= 80 ? lv : Math.max(1, lv - 2);
  const cands = [];
  for (const e of pool()) {
    if (e.id === entry.id) continue;
    for (const dd of DIFFS) {
      const L = e.levels[dd];
      if (!L) continue;
      const played = !!ui.bestOf(e.id, dd);
      // レベルの近さ + まだ遊んでいない曲 + 同じジャンルを少しだけ優先。曲IDのハッシュで毎回少し変わる
      const h = (hash(e.id + dd + (r.score % 997)) % 100) / 100;
      const sc = Math.abs(L - target) * 2 + (played ? 3 : 0) + (e.genre === entry.genre ? -0.5 : 0) + h;
      cands.push({ e, d: dd, sc });
    }
  }
  cands.sort((a, b) => a.sc - b.sc);
  const out = [], used = new Set();
  for (const c of cands) {
    if (used.has(c.e.id)) continue;
    used.add(c.e.id); out.push(c);
    if (out.length >= n) break;
  }
  return out;
}
function hash(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

export function renderNext(entry, d, r) {
  const box = $('r-next');
  if (!box) return;
  if (!entry || entry.local) { box.hidden = true; return; }
  const list = recommend(entry, d, r);
  box.hidden = !list.length;
  const C = { easy: '#7dffb0', normal: '#ffd25e', hard: '#ff5a8e' };
  box.innerHTML = `<p class="rn-head">NEXT ▶ <span>次はこれがおすすめ</span></p><div class="rn-list">${list.map(({ e, d: dd }) =>
    `<button class="rn-card" data-next="${e.id}/${dd}" style="--c:${e.color}"><img src="${ui.jacketURL(e, 96)}" alt="" loading="lazy">
      <span><b>${ui.esc(e.title)}</b><small style="color:${C[dd]}">${dd.toUpperCase()} Lv${e.levels[dd]}</small></span></button>`).join('')}</div>`;
}

// ---------------------------------------------------------------------------
// X に投稿
// ---------------------------------------------------------------------------
export function postX(text, url = SITE) {
  const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=MUSICLiDAR`;
  window.open(u, '_blank', 'noopener,width=600,height=520');
}
export function resultText(entry, label, r) {
  const badge = r.ap ? ' ALL PERFECT!' : r.fc ? ' FULL COMBO!' : '';
  return `MUSIC LiDAR で「${entry.title}」${label} をプレイ!\nスコア ${r.score.toLocaleString()}(${r.rank})${badge}`;
}

// ---------------------------------------------------------------------------
// デイリーの絵文字シェア
// ---------------------------------------------------------------------------
// 曲を10区間に分けて、区間ごとの精度を絵文字に
export function dailyGrid(r, duration) {
  const log = r.log || [];
  const seg = 10, dur = Math.max(1, duration);
  const sum = new Array(seg).fill(0), cnt = new Array(seg).fill(0);
  const W = { PERFECT: 1, GREAT: 0.7, GOOD: 0.3, MISS: 0 };
  for (const [t, res] of log) { const k = Math.max(0, Math.min(seg - 1, Math.floor((t / dur) * seg))); sum[k] += W[res] ?? 0; cnt[k]++; }
  return sum.map((s, k) => {
    if (!cnt[k]) return '⬛';
    const a = s / cnt[k];
    return a >= 0.999 ? '🟪' : a >= 0.9 ? '🟦' : a >= 0.75 ? '🟩' : a >= 0.5 ? '🟨' : '🟥';
  }).join('');
}
// デイリーに挑戦した連続日数(端末に保存)
export function dailyStreak(ymd) {
  const s = load('dailyStreak', { last: '', n: 0 });
  if (s.last === ymd) return s.n;
  const prev = new Date(Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6) - 1)).toISOString().slice(0, 10).replace(/-/g, '');
  const n = s.last === prev ? s.n + 1 : 1;
  save('dailyStreak', { last: ymd, n });
  return n;
}
export function dailyShareText(daily, r, duration, rank) {
  const n = dailyStreak(daily.ymd);
  return `MUSIC LiDAR デイリー ${+daily.ymd.slice(4, 6)}/${+daily.ymd.slice(6)}${rank ? ` #${rank}位` : ''}${n >= 2 ? ` 🔥${n}日連続` : ''}\n` +
    `${daily.entry.title} ${daily.diff.toUpperCase()}\n${dailyGrid(r, duration)}\n${r.score.toLocaleString()}(${r.rank})`;
}
// デイリーのリザルトに付けるシェアのボタン
export function dailyShareButtons(daily, r, duration, rank) {
  const text = dailyShareText(daily, r, duration, rank);
  const wrap = document.createElement('div');
  wrap.className = 'daily-share';
  wrap.innerHTML = `<pre>${ui.esc(text)}</pre><div><button class="btn-line small" data-ds="copy">コピー</button><button class="btn-line small x-btn" data-ds="x">𝕏 に投稿</button></div>`;
  wrap.addEventListener('click', async (ev) => {
    const b = ev.target.closest('[data-ds]');
    if (!b) return;
    const url = SITE + '?daily=1';
    if (b.dataset.ds === 'x') { postX(text, url); return; }
    try { await navigator.clipboard.writeText(text + '\n' + url); ui.toast('コピーしました'); } catch { prompt('コピーしてください', text + '\n' + url); }
  });
  return wrap;
}

// ---------------------------------------------------------------------------
// オンラインのゴースト
// ---------------------------------------------------------------------------
// 端末のゴーストと同じ「判定の頭文字 + 時刻(10ms・36進)」。サーバーへは小文字(p/g/o/m)で送る
const UP = { PERFECT: 'p', GREAT: 'g', GOOD: 'o', MISS: 'm' }, DOWN = { p: 'PERFECT', g: 'GREAT', o: 'GOOD', m: 'MISS' };
const encode = (log) => log.map(([t, res]) => UP[res] + Math.max(0, Math.round(t * 100)).toString(36)).join(',');
const decode = (s) => s.split(',').map((x) => [parseInt(x.slice(1), 36) / 100, DOWN[x[0]]]);

export const GHOST_MODES = { self: '自己ベスト', rival: 'すぐ上のライバル', top: 'ランキング1位', off: 'なし' };
export function ghostMode() {
  const s = ui.settings();
  if (s.ghostMode) return s.ghostMode;
  return s.ghost === false ? 'off' : 'self';
}

// 遊ぶ前に呼ぶ。{ log, name } か null(1.5秒で返らなければ自己ベストにする)
export async function ghostFor(entry, d, localLog) {
  const mode = ghostMode();
  const self = localLog ? { log: localLog, name: 'BEST' } : null;
  if (mode === 'off') return null;
  if (mode === 'self' || entry.local) return self;
  try {
    const res = await Promise.race([
      rpc('mlidar_ghost_get', { p_song: entry.id, p_diff: d, p_client: ui.rankId(), p_mode: mode }),
      new Promise((r) => setTimeout(() => r('TIMEOUT'), 1500)),
    ]);
    if (res && res !== 'TIMEOUT' && res.log) return { log: decode(res.log), name: String(res.name || 'RIVAL').slice(0, 12) };
  } catch { /* オフラインなど */ }
  return self;
}

// 自己ベストを出したら、ランキングへ送ったあとに呼ぶ
export function uploadGhost(entry, d, r) {
  if (entry.local || !r.log?.length) return;
  const name = ui.playerName();
  if (!name) return;
  rpc('mlidar_ghost_put', { p_song: entry.id, p_diff: d, p_client: ui.rankId(), p_name: name, p_score: r.score, p_log: encode(r.log) }).catch(() => {});
}

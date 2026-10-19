import SONGS from './songs/index.js';
import { composeSong, candidatesFromEvents, generateChart, chartStats, DIFFS, hashStr } from './composer.js';
import { getCtx, setVolumes, playPreview, stopPreview } from './audio.js';
import { loadSongAudio } from './audio-cache.js';
import { showLoading, hideLoading } from './loading.js';
import { analyzeFile, hashFile } from './analyzer.js';
import { buildScroll, dropNotesInStops, gimmickLabel } from './gimmick.js';
import { jacketURL, clearJackets } from './jacket.js';
import { CHANGELOG, VERSION } from './changelog.js';
import { Game, PointCloud, KEYS, DIFF_COLOR, visibleTime, IS_TOUCH, FX_LEVELS } from './game.js';
import { load, save, getSettings, setSettings, DEFAULT_SETTINGS, clientId, getBest, recordBest } from './storage.js';
import { fetchRanking, submitScore } from './ranking.js';
import * as acc from './account.js';
import { initMeta, openAccount, renderHeader, gachaResultOpen, closeGacha, openScreen as openMetaScreen } from './meta.js';
import { initMaker, openCharts, openEditor, makerKeydown } from './maker.js';
import { fetchChartRanking, submitChartScore } from './maker-api.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtScore = (n) => String(n).padStart(7, '0');

const canvas = $('stage');
const cloud = new PointCloud();
let settings = getSettings();
let state = 'title'; // title | select | game | result | quest | gacha | team
let game = null;
let lastResult = null;

// ---------------------------------------------------------------------------
// 曲の準備
// ---------------------------------------------------------------------------
// 音源ファイルの曲(def.audio)。譜面は def.fixedCharts、音は fetch して展開
function fileSongEntry(def) {
  const charts = {}, stats = {};
  const unpack = (arr) => arr.map(([t, lane, e]) => (e ? { t: t / 1000, lane, end: e / 1000 } : { t: t / 1000, lane }));
  const scroll = buildScroll(def.gimmicks, def.bpm);
  for (const d of DIFFS) {
    charts[d] = dropNotesInStops(unpack(def.fixedCharts[d]), scroll.stops);
    stats[d] = chartStats(charts[d]);
  }
  const onsets = onsetList(DIFFS.flatMap((d) => charts[d].map((n) => n.t)));
  return {
    id: def.id, urlId: def.urlId, title: def.title, artist: def.artist, genre: def.genre, bpm: def.bpm, offset: def.offset || 0, color: def.color,
    levels: def.levels, charts, stats, local: false, duration: def.duration, scroll, gimmick: gimmickLabel(def.gimmicks), gimmicks: def.gimmicks || [],
    previewAt: def.previewAt ?? def.duration * 0.3, credit: def.credit, creditUrl: def.creditUrl, onsets,
    buffer: null, rendering: null,
    load() {
      if (this.buffer) return Promise.resolve(this.buffer);
      if (!this.rendering) {
        this.rendering = (async () => {
          const res = await fetch(def.audio);
          if (!res.ok) throw new Error('audio ' + res.status);
          const total = +res.headers.get('content-length') || 0;
          let ab;
          if (total && res.body) {
            const reader = res.body.getReader(), parts = [];
            let got = 0;
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              parts.push(value); got += value.length;
              this.progress = 0.85 * (got / total);
            }
            const u8 = new Uint8Array(got);
            let o = 0;
            for (const p of parts) { u8.set(p, o); o += p.length; }
            ab = u8.buffer;
          } else ab = await res.arrayBuffer();
          // AudioContext を使わずに展開(ユーザー操作前でも可)
          const buf = await new OfflineAudioContext(2, 1, 44100).decodeAudioData(ab);
          this.progress = 1;
          return (this.buffer = buf);
        })();
        this.rendering.catch(() => { this.rendering = null; });
      }
      return this.rendering;
    },
  };
}

// 譜面メーカーの録音補正用: 音が鳴る時刻の一覧(昇順・近いものはまとめる)
function onsetList(times) {
  const s = [...times].sort((a, b) => a - b), out = [];
  for (const t of s) if (!out.length || t - out[out.length - 1] > 0.012) out.push(t);
  return out;
}
const NOT_ONSET = new Set(['pad', 'riser', 'downer']);

const entries = SONGS.map((def) => {
  if (def.audio) return fileSongEntry(def);
  const { events, duration } = composeSong(def);
  const cands = candidatesFromEvents(events);
  const onsets = onsetList(events.filter((e) => !NOT_ONSET.has(e.type)).map((e) => e.t));
  const scroll = buildScroll(def.gimmicks, def.bpm);
  const charts = {}, stats = {};
  for (const d of DIFFS) {
    charts[d] = dropNotesInStops(generateChart(cands, d, duration, hashStr(def.id), def.chart?.[d]), scroll.stops);
    stats[d] = chartStats(charts[d]);
  }
  return {
    id: def.id, urlId: def.urlId, title: def.title, artist: def.artist, genre: def.genre, bpm: def.bpm, color: def.color,
    levels: def.levels, charts, stats, local: false, duration, scroll, gimmick: gimmickLabel(def.gimmicks), gimmicks: def.gimmicks || [],
    previewAt: (def.preview ?? 32) * 60 / def.bpm, onsets,
    buffer: null, rendering: null,
    load() {
      if (this.buffer) return Promise.resolve(this.buffer);
      if (!this.rendering) this.rendering = loadSongAudio(def.id, events, duration, { sidechain: !!def.sidechain }, (p) => { this.progress = p; }).then((b) => (this.buffer = b));
      return this.rendering;
    },
  };
});

let sel = Math.max(0, Math.min(entries.length - 1, load('sel', 0)));
// 曲ページ(music/<urlId>/)から来たらその曲を選んだ状態で始める
const ROOT_PATH = new URL('./', document.baseURI).pathname;
const urlSongId = document.querySelector('meta[name="song-id"]')?.content;
// ログインしていない人が曲URLを開いたときは、普通のトップ(タイトル画面・トップURL)として扱う
const openedBySongUrl = !!urlSongId && !!load('token', null);
if (urlSongId && !openedBySongUrl) {
  try {
    history.replaceState(null, '', ROOT_PATH + location.search.replace(/([?&])v=[^&]*&?/, '$1').replace(/[?&]$/, '') + location.hash);
    document.title = 'MUSIC LiDAR｜ブラウザで遊べる無料4キー音ゲー(リズムゲーム)';
  } catch { /* file:// など */ }
}
if (openedBySongUrl) {
  const i = entries.findIndex((e) => e.id === urlSongId);
  if (i >= 0) sel = i;
}
const songUrl = (e) => (e?.urlId ? `${location.origin}${ROOT_PATH}music/${e.urlId}/` : `${location.origin}${ROOT_PATH}`);
// 選んだ曲に合わせてアドレスバーを曲ページのURLにする(共有しやすいように)
function syncUrl(e) {
  try {
    const path = e?.urlId ? `${ROOT_PATH}music/${e.urlId}/` : ROOT_PATH;
    if (location.pathname !== path) history.replaceState(null, '', path);
    document.title = e?.urlId ? `${e.title}｜MUSIC LiDAR` : 'MUSIC LiDAR｜ブラウザで遊べる無料4キー音ゲー(リズムゲーム)';
  } catch { /* file:// など */ }
}
let diff = DIFFS.includes(load('diff', 'normal')) ? load('diff', 'normal') : 'normal';

// 起動後に全曲をバックグラウンドで順に合成しておく
let warmed = false;
async function warmup() {
  if (warmed) return;
  warmed = true;
  const order = [entries[sel], ...entries.filter((e, i) => i !== sel && !e.local)];
  for (const e of order) {
    // プレイ中は重い合成をしない(音飛び・カクつき防止)
    while (state === 'game' || state === 'retry') await new Promise((r) => setTimeout(r, 500));
    try { await e.load(); } catch (err) { console.error(err); }
  }
}

// ---------------------------------------------------------------------------
// 背景アニメーション(ゲーム中以外)
// ---------------------------------------------------------------------------
function bgLoop(now) {
  requestAnimationFrame(bgLoop);
  if (state === 'game') return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#02030a'); grd.addColorStop(1, '#070a1c');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  const e = entries[sel] || entries[0];
  const amt = [0.15, 0.45, 1][settings.fx ?? 1];
  cloud.draw(g, W, H, now / 1000, e?.bpm || 120, (state === 'select' ? 0.6 : 0.4) * amt, e?.color || '#5ef2ff', amt);
}
requestAnimationFrame(bgLoop);
// タイトル画面の間から裏で音源を用意しておく(2回目以降はブラウザに保存した音を使うので一瞬)
setTimeout(() => warmup(), 300);

// ---------------------------------------------------------------------------
// 画面切り替え
// ---------------------------------------------------------------------------
// 画面ごとのURL(譜面メーカー・ガチャ・みんなの譜面)
// 画面・パネルごとのURL。選曲画面は曲ページのURL、タイトルはトップのURL
const SCREEN_URL = {
  editor: ['maker/', '譜面メーカー'],
  gacha: ['gacha/', 'ガチャ'],
  charts: ['charts/', 'みんなの譜面'],
  quest: ['quest/', 'クエスト'],
  team: ['team/', '編成'],
  result: ['result/', 'リザルト'],
  settings: ['settings/', '設定'],
  account: ['account/', 'アカウント'],
  changelog: ['changelog/', '更新履歴'],
};
function setScreenUrl(key) {
  const su = SCREEN_URL[key];
  try {
    if (su) {
      if (location.pathname !== ROOT_PATH + su[0]) history.replaceState(null, '', ROOT_PATH + su[0]);
      document.title = `${su[1]}｜MUSIC LiDAR`;
    } else if (key === 'select' || key === 'game') syncUrl(entries[sel]);
  } catch { /* file:// など */ }
}
function show(name) {
  // 画面が変わるときはスキャン線のワイプ演出(プレイ開始・終了時は読み込み画面やリザルト演出があるので除く)
  if (name !== state && name !== 'game' && state !== 'game' && !(state === 'title' && name === 'title')) {
    const w = $('wipe');
    w.classList.remove('go'); void w.offsetWidth; w.classList.add('go');
    clearTimeout(show.wt);
    show.wt = setTimeout(() => w.classList.remove('go'), 600); // アニメが止まっていても必ず消す
  }
  state = name;
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === name);
  document.body.classList.toggle('playing', name === 'game');
  if (name !== 'game') setScreenUrl(name);
}
// 設定・アカウントのパネルを開いている間はそのURL、閉じたら元の画面のURLに戻す
for (const [id, key] of [['settings', 'settings'], ['account-modal', 'account'], ['changelog', 'changelog']]) {
  new MutationObserver(() => {
    if (state === 'title') return;
    if ($(id).classList.contains('on')) setScreenUrl(key);
    else if (!document.querySelector('#settings.on, #account-modal.on, #changelog.on')) setScreenUrl(state);
  }).observe($(id), { attributes: true, attributeFilter: ['class'] });
}

function toast(msg, ms = 2600) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast.tid);
  toast.tid = setTimeout(() => t.classList.remove('on'), ms);
}

function overlay(id, on) { $(id).classList.toggle('on', on); }
const modalOpen = () => document.querySelector('.overlay.modal.on');

// ---------------------------------------------------------------------------
// タイトル
// ---------------------------------------------------------------------------
function enterFromTitle(opts = {}) {
  getCtx();
  setVolumes(settings.bgm, settings.se);
  show('select');
  renderList();
  selectSong(sel, true);
  warmup();
  if (!opts.quiet && !acc.isLoggedIn() && !load('nameSkipped', false)) openAccount();
}
$('btn-start').addEventListener('click', () => enterFromTitle());

// ---------------------------------------------------------------------------
// バージョン表記・更新履歴
// ---------------------------------------------------------------------------
$('ver-label').textContent = 'v' + VERSION;
$('title-ver').textContent = 'v' + VERSION;
$('ver-new').hidden = load('seenVersion', null) === VERSION;
function openChangelog() {
  const seen = load('seenVersion', null);
  const seenIdx = CHANGELOG.findIndex((c) => c.version === seen);
  $('cl-current').textContent = 'CURRENT v' + VERSION;
  $('cl-list').innerHTML = CHANGELOG.map((c, i) => `<li class="cl-item ${i === 0 ? 'latest' : ''} ${seen && (seenIdx < 0 || i < seenIdx) ? 'unseen' : ''}">
    <div class="cl-head"><span class="cl-ver">v${c.version}</span><span class="cl-date">${c.date}</span>${i === 0 ? '<span class="cl-tag">最新</span>' : ''}</div>
    <ul>${c.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></li>`).join('');
  overlay('changelog', true);
  save('seenVersion', VERSION);
  $('ver-new').hidden = true;
}
$('btn-version').addEventListener('click', openChangelog);
$('btn-cl-close').addEventListener('click', () => overlay('changelog', false));
$('title-changelog').addEventListener('click', (ev) => { ev.preventDefault(); enterFromTitle({ quiet: true }); openChangelog(); });

// タイトルのブートログ(飾り)
(function bootLog() {
  const v = document.querySelector('meta[name="app-version"]')?.content || 'dev';
  $('tt-ver').textContent = `VER ${VERSION} / BUILD ${v}`;
  const lines = ['INIT AUDIO ENGINE', `LOAD ${entries.length} TRACKS`, 'CALIBRATE LIDAR ARRAY', 'SYNC CLOCK', 'READY'];
  const el = $('tt-boot');
  let i = 0;
  const tick = () => {
    if (i >= lines.length || state !== 'title') return;
    el.innerHTML += `${lines[i]} ${i < lines.length - 1 ? '<b>.... OK</b>' : '<b class="ok">■</b>'}<br>`;
    i++;
    setTimeout(tick, 260 + Math.random() * 220);
  };
  setTimeout(tick, 500);
})();
// フォント読み込み後にジャケットを描き直す(最初はフォント未読込のことがある)
document.fonts?.ready.then(() => { clearJackets(); if (state === 'select') { renderList(); renderDetail(); } });

// ---------------------------------------------------------------------------
// 選曲画面
// ---------------------------------------------------------------------------
// ログイン中はサーバーの記録と端末の記録の良いほう
function bestOf(id, d) {
  const l = getBest(id, d);
  const s = acc.getState()?.best?.[id + '/' + d];
  if (!s) return l;
  if (!l) return { ...s, plays: 0 };
  const top = s.score > l.score ? { ...l, score: s.score, rank: s.rank, acc: s.acc } : { ...l };
  return { ...top, combo: Math.max(l.combo, s.combo), fc: l.fc || s.fc, ap: l.ap || s.ap };
}

// --- 検索・並び替え・絞り込み ---
const songView = { q: '', sort: load('songSort', 'default'), lv: load('songLv', 'all'), status: load('songStatus', 'all') };
const LV_FILTERS = [['all', 'すべて'], ['1-4', 'Lv1〜4'], ['5-9', 'Lv5〜9'], ['10-', 'Lv10以上']];
const STATUS_FILTERS = [['all', 'すべて'], ['new', '未プレイ'], ['nofc', '未フルコンボ'], ['fc', 'フルコンボ済'], ['local', '読み込んだ曲']];

function visibleSongs() {
  const q = songView.q.trim().toLowerCase();
  let idx = entries.map((e, i) => i).filter((i) => {
    const e = entries[i];
    if (q && !`${e.title} ${e.genre} ${e.artist} ${Math.round(e.bpm)}`.toLowerCase().includes(q)) return false;
    const lv = e.levels[diff];
    if (songView.lv === '1-4' && lv > 4) return false;
    if (songView.lv === '5-9' && (lv < 5 || lv > 9)) return false;
    if (songView.lv === '10-' && lv < 10) return false;
    const b = bestOf(e.id, diff);
    if (songView.status === 'new' && b) return false;
    if (songView.status === 'nofc' && b?.fc) return false;
    if (songView.status === 'fc' && !b?.fc) return false;
    if (songView.status === 'local' && !e.local) return false;
    return true;
  });
  const by = {
    level: (a, b) => entries[a].levels[diff] - entries[b].levels[diff],
    'level-desc': (a, b) => entries[b].levels[diff] - entries[a].levels[diff],
    bpm: (a, b) => entries[a].bpm - entries[b].bpm,
    'bpm-desc': (a, b) => entries[b].bpm - entries[a].bpm,
    name: (a, b) => entries[a].title.localeCompare(entries[b].title, 'ja'),
    score: (a, b) => (bestOf(entries[b].id, diff)?.score ?? -1) - (bestOf(entries[a].id, diff)?.score ?? -1),
    'score-asc': (a, b) => (bestOf(entries[a].id, diff)?.score ?? -1) - (bestOf(entries[b].id, diff)?.score ?? -1),
  }[songView.sort];
  if (by) idx = idx.sort((a, b) => by(a, b) || a - b);
  return idx;
}

function renderFilters() {
  const chip = (group, [v, label]) => `<button class="f-chip ${songView[group] === v ? 'sel' : ''}" data-g="${group}" data-v="${v}">${label}</button>`;
  $('song-filters').innerHTML =
    `<span class="f-label">${diff.toUpperCase()}</span>${LV_FILTERS.map((f) => chip('lv', f)).join('')}<span class="f-sep"></span>${STATUS_FILTERS.filter(([v]) => v !== 'local' || entries.some((e) => e.local)).map((f) => chip('status', f)).join('')}`;
}

function renderList() {
  renderFilters();
  const list = $('song-list');
  list.innerHTML = '';
  const view = visibleSongs();
  if (!view.length) {
    const p = document.createElement('p');
    p.className = 'list-empty';
    p.textContent = '条件に合う曲がありません';
    list.appendChild(p);
  }
  view.forEach((i) => {
    const e = entries[i];
    const b = document.createElement('button');
    b.className = 'song-card' + (i === sel ? ' sel' : '');
    b.dataset.i = i;
    b.style.setProperty('--c', e.color);
    const lv = DIFFS.map((d) => {
      const best = bestOf(e.id, d);
      const mark = best?.ap ? 'AP' : best?.fc ? 'FC' : '';
      return `<span class="lv ${d}">${e.levels[d]}${mark ? `<span class="mark">${mark}</span>` : ''}</span>`;
    }).join('');
    b.innerHTML = `<img class="sc-jacket" src="${jacketURL(e, 128)}" alt=""><div class="sc-text"><div class="sc-title">${esc(e.title)}</div><div class="sc-sub">${esc(e.genre)} ・ BPM ${Math.round(e.bpm)}${e.local ? ' ・ LOCAL' : ''}</div></div><div class="sc-lv">${lv}</div>`;
    b.addEventListener('click', () => { if (sel === i) startGame(); else selectSong(i); });
    list.appendChild(b);
  });
  const up = document.createElement('button');
  up.className = 'song-card upload';
  up.innerHTML = '<div class="sc-title">＋ 音声ファイルを読み込む</div><div class="sc-sub">mp3 / wav / ogg など。ドラッグ&ドロップでもOK。譜面は自動生成(記録はこの端末のみ)</div>';
  up.addEventListener('click', () => $('file-input').click());
  list.appendChild(up);
}

function selectSong(i, force = false) {
  if (i === sel && !force) return;
  sel = i;
  save('sel', entries[i].local ? 0 : i);
  syncUrl(entries[i]);
  for (const c of $('song-list').querySelectorAll('.song-card[data-i]')) c.classList.toggle('sel', +c.dataset.i === i);
  $('song-list').querySelector(`.song-card[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  renderDetail();
  const e = entries[i];
  stopPreview();
  const token = (selectSong.token = {});
  e.load().then((buf) => {
    if (selectSong.token !== token || state !== 'select') return;
    playPreview(buf, e.previewAt);
    renderDetail();
  }).catch((err) => { console.error(err); toast('音源の生成に失敗しました'); });
}

function setDiff(d) {
  diff = d;
  save('diff', d);
  renderDetail();
  renderList(); // レベル・自己ベストの並び替えや絞り込みは難易度で変わる
}

$('song-search').addEventListener('input', () => { songView.q = $('song-search').value; renderList(); });
$('song-sort').value = songView.sort;
$('song-sort').addEventListener('change', () => { songView.sort = $('song-sort').value; save('songSort', songView.sort); renderList(); });
$('song-filters').addEventListener('click', (ev) => {
  const b = ev.target.closest('.f-chip');
  if (!b) return;
  songView[b.dataset.g] = b.dataset.v;
  save(b.dataset.g === 'lv' ? 'songLv' : 'songStatus', b.dataset.v);
  renderList();
});

function renderDetail() {
  const e = entries[sel];
  document.documentElement.style.setProperty('--accent', e.color);
  $('d-genre').textContent = e.genre;
  $('d-jacket').src = jacketURL(e, 256);
  $('d-index').textContent = `${String(sel + 1).padStart(2, '0')} / ${String(entries.length).padStart(2, '0')}`;
  $('d-title').textContent = e.title;
  $('d-meta').textContent = `${e.artist} ・ BPM ${Math.round(e.bpm)} ・ ${fmtTime(e.duration)}${e.gimmick ? ` ・ ギミック: ${e.gimmick}` : ''}`;
  $('d-credit').innerHTML = e.credit ? `${esc(e.credit)}${e.creditUrl ? ` <a href="${esc(e.creditUrl)}" target="_blank" rel="noopener">${esc(e.creditUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>` : ''}` : '';
  $('diffs').innerHTML = DIFFS.map((d) => `
    <button class="diff-btn ${d}${d === diff ? ' sel' : ''}" data-d="${d}">
      <div class="dn">${d.toUpperCase()}</div><div class="dl">${e.levels[d]}</div><div class="dc">${e.stats[d].notes} notes</div>
    </button>`).join('');
  for (const b of $('diffs').children) b.addEventListener('click', () => setDiff(b.dataset.d));
  const best = bestOf(e.id, diff);
  const bx = $('best');
  if (best) {
    bx.className = 'best';
    bx.innerHTML = `<div class="b-rank" style="color:${DIFF_COLOR[diff]}">${best.rank}</div>
      <div class="b-score">${fmtScore(best.score)}</div>
      <div class="b-badges">${best.ap ? '<span class="badge ap">ALL PERFECT</span>' : best.fc ? '<span class="badge fc">FULL COMBO</span>' : ''}</div>
      <div class="b-sub">自己ベスト ・ ${Number(best.acc).toFixed(2)}% ・ MAX ${best.combo} COMBO${best.plays ? ` ・ ${best.plays} プレイ` : ''}</div>`;
  } else {
    bx.className = 'best none';
    bx.textContent = 'まだプレイしていません';
  }
  const ready = !!e.buffer;
  $('btn-play').classList.toggle('wait', !ready);
  $('play-sub').textContent = ready ? 'ENTER' : '音源を準備中…(初回のみ)';
  loadRanking();
}

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// --- ランキング ---
const rankCache = new Map();
const myRankId = () => acc.getState()?.id || clientId();
function rankRows(rows) {
  if (!rows.length) return '<li class="empty">まだ記録がありません。一番乗りしよう</li>';
  return rows.map((r) => `<li class="${r.is_me ? 'me' : ''}"><span class="rk">${r.rank}</span><span class="nm">${esc(r.name)}</span>
    <span>${r.ap ? '<span class="badge ap">AP</span>' : r.fc ? '<span class="badge fc">FC</span>' : ''}</span><span class="sc">${fmtScore(r.score)}</span></li>`).join('');
}
function loadRanking(force = false) {
  const e = entries[sel];
  const list = $('rank-list');
  if (e.local) { list.innerHTML = '<li class="empty">読み込んだ曲はランキング対象外です</li>'; return; }
  const key = e.id + '/' + diff;
  const c = rankCache.get(key);
  if (c && !force && Date.now() - c.at < 30000) { list.innerHTML = rankRows(c.rows); return; }
  list.innerHTML = '<li class="empty">読み込み中…</li>';
  clearTimeout(loadRanking.tid);
  loadRanking.tid = setTimeout(async () => {
    try {
      const rows = await fetchRanking(e.id, diff, myRankId());
      rankCache.set(key, { rows, at: Date.now() });
      if (entries[sel] === e && (e.id + '/' + diff) === key) list.innerHTML = rankRows(rows);
    } catch (err) {
      console.error(err);
      list.innerHTML = '<li class="empty">ランキングを取得できませんでした</li>';
    }
  }, 200);
}
$('btn-rank-reload').addEventListener('click', () => loadRanking(true));
$('btn-play').addEventListener('click', () => startGame());
// この曲のURLを共有
$('btn-share').addEventListener('click', async () => {
  const e = entries[sel];
  if (!e.urlId) { toast('読み込んだ曲は共有できません'); return; }
  const url = songUrl(e), text = `MUSIC LiDAR で「${e.title}」をプレイしよう!`;
  try {
    if (navigator.share && IS_TOUCH) { await navigator.share({ title: `${e.title}｜MUSIC LiDAR`, text, url }); return; }
    await navigator.clipboard.writeText(url);
    toast('この曲のURLをコピーしました: ' + url, 3500);
  } catch (err) {
    if (err?.name !== 'AbortError') prompt('この曲のURL', url);
  }
});
// 曲ページで開いたときはタイトル画面に曲名を出す
if (openedBySongUrl && entries[sel]?.id === urlSongId) {
  $('title-song').textContent = `♪ ${entries[sel].title}`;
  $('title-song').hidden = false;
}

// --- 曲ファイル読み込み ---
async function loadFile(file) {
  if (!file) return;
  if (!/^audio\//.test(file.type) && !/\.(mp3|wav|ogg|m4a|flac|aac|opus|webm)$/i.test(file.name)) { toast('音声ファイルを選んでください'); return; }
  stopPreview();
  showLoading({ title: file.name.replace(/\.[^.]+$/, ''), sub: '音声ファイルを解析して譜面を作っています', status: 'ANALYZING...' });
  try {
    const ab = await file.arrayBuffer();
    const hash = await hashFile(ab);
    const id = 'file-' + hash;
    const existing = entries.findIndex((e) => e.id === id);
    if (existing >= 0) { hideLoading(); selectSong(existing, true); return; }
    const { buffer, cands, bpm } = await analyzeFile(ab);
    const charts = {}, stats = {}, levels = {};
    for (const d of DIFFS) {
      charts[d] = generateChart(cands, d, buffer.duration, hashStr(hash));
      stats[d] = chartStats(charts[d]);
      const nps = stats[d].notes / Math.max(10, buffer.duration);
      levels[d] = Math.max(1, Math.min(15, Math.round(nps * 2.1 + (d === 'hard' ? 1 : 0))));
    }
    const title = file.name.replace(/\.[^.]+$/, '');
    entries.push({
      id, title, artist: 'LOCAL FILE', genre: 'IMPORT', bpm, color: '#ffd25e', levels, charts, stats, local: true, onsets: onsetList(cands.map((c) => c.t)),
      duration: buffer.duration, previewAt: buffer.duration * 0.35, buffer, load() { return Promise.resolve(buffer); },
    });
    renderList();
    selectSong(entries.length - 1, true);
    toast(`「${title}」の譜面を生成しました(推定 BPM ${Math.round(bpm)})`);
  } catch (err) {
    console.error(err);
    toast('このファイルは読み込めませんでした');
  } finally {
    hideLoading();
  }
}
$('file-input').addEventListener('change', (ev) => { loadFile(ev.target.files[0]); ev.target.value = ''; });
let dragDepth = 0;
window.addEventListener('dragenter', (ev) => { if (state !== 'select') return; ev.preventDefault(); dragDepth++; $('drop-veil').classList.add('on'); });
window.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('drop-veil').classList.remove('on'); } });
window.addEventListener('dragover', (ev) => ev.preventDefault());
window.addEventListener('drop', (ev) => {
  ev.preventDefault();
  dragDepth = 0;
  $('drop-veil').classList.remove('on');
  if (state === 'select') loadFile(ev.dataTransfer.files[0]);
});

// ---------------------------------------------------------------------------
// プレイ
// ---------------------------------------------------------------------------
let playing = null; // { entry, diff }
let starting = false;
// custom: 譜面メーカーの譜面 { kind: 'custom'|'test', notes, scroll, title, level, chartId, startFrom, onExit(result?) }
async function startGame(entry = entries[sel], d = diff, custom = null) {
  if (state === 'game' || starting) return;
  starting = true;
  try { await startGameInner(entry, d, custom); } finally { starting = false; }
}
async function startGameInner(entry, d, custom) {
  document.activeElement?.blur?.();
  getCtx();
  stopPreview();
  // 読み込み中画面(準備済みでも曲名とTipsを少し見せる)
  const isRetry = state === 'retry';
  const label = custom ? (custom.kind === 'test' ? 'TEST PLAY' : `CUSTOM Lv${custom.level}`) : `${d.toUpperCase()} Lv${entry.levels[d]}`;
  showLoading({
    entry, title: custom ? custom.title : entry.title, sub: label,
    status: entry.buffer ? 'READY' : '音源を準備中…(初回のみ少しかかります)',
    getProgress: () => (entry.buffer ? 1 : entry.progress || 0),
  });
  if (!entry.buffer) {
    try { await entry.load(); } catch (err) { console.error(err); toast('音源の生成に失敗しました'); hideLoading(); return; }
  }
  await hideLoading(isRetry ? 500 : 1400);
  playing = { entry, diff: d, custom };
  show('game');
  setVolumes(settings.bgm, settings.se);
  game = new Game(canvas, {
    buffer: entry.buffer, notes: custom ? custom.notes : entry.charts[d], settings, bpm: entry.bpm,
    title: custom ? custom.title : entry.title, diff: custom ? custom.kind : d, color: entry.color, cloud,
    onEnd: (r) => onGameEnd(r),
    team: !custom && acc.isLoggedIn() ? acc.teamFx() : null,
    scroll: custom ? custom.scroll : entry.scroll,
    offset: entry.offset || 0,
    jacket: jacketURL(entry, 128),
    label: custom ? (custom.kind === 'test' ? 'TEST PLAY' : `CUSTOM Lv${custom.level}`) : `${d.toUpperCase()} Lv${entry.levels[d]}`,
  });
  game.start(custom?.startFrom || 0);
}

function quitGame() {
  overlay('pause', false);
  game?.destroy();
  game = null;
  if (playing?.custom) { stopPreview(); playing.custom.onExit(null); return; }
  show('select');
  renderList();
  selectSong(sel, true);
}

function retry() {
  overlay('pause', false);
  game?.destroy();
  game = null;
  state = 'retry';
  startGame(playing.entry, playing.diff, playing.custom);
}

// 数字を数え上げる演出
function countUp(el, to, ms, fmtFn) {
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    el.textContent = fmtFn(Math.round(to * (1 - Math.pow(1 - k, 3))));
    if (k < 1 && el.isConnected) requestAnimationFrame(step);
  };
  el.textContent = fmtFn(0);
  requestAnimationFrame(step);
  setTimeout(() => { el.textContent = fmtFn(to); }, ms + 50); // タブが裏にあっても最終値にする
}

function onGameEnd(r) {
  const { entry, diff: d, custom } = playing;
  game = null;
  lastResult = r;
  if (custom?.kind === 'test') { custom.onExit(r); return; }
  const isNew = custom ? false : recordBest(entry.id, d, r);
  show('result');
  document.documentElement.style.setProperty('--accent', entry.color);
  $('r-title').textContent = entry.title;
  const rd = $('r-diff');
  rd.textContent = custom ? `CUSTOM Lv${custom.level}` : `${d.toUpperCase()} ${entry.levels[d]}`;
  rd.style.color = DIFF_COLOR[custom ? 'custom' : d];
  if (custom) $('r-title').textContent = `${custom.title} (${entry.title})`;
  $('r-rank').textContent = r.rank;
  $('r-jacket').src = jacketURL(entry, 256);
  $('r-stamp').textContent = new Date().toLocaleString('ja-JP', { hour12: false }).replace(/\//g, '.');
  const banner = r.ap ? 'ALL PERFECT' : r.fc ? 'FULL COMBO' : r.score >= 600000 ? 'CLEAR' : 'FAILED';
  const bn = $('r-banner');
  bn.textContent = banner;
  bn.className = 'r-banner ' + banner.toLowerCase().replace(' ', '-');
  // 演出をやり直すためにクラスを付け直す
  const panel = document.querySelector('.result-panel');
  panel.classList.remove('reveal'); void panel.offsetWidth; panel.classList.add('reveal');
  countUp($('r-score'), r.score, 900, fmtScore);
  $('r-new').classList.toggle('on', isNew);
  $('r-badges').innerHTML = ''; // FC/AP は上のバナーで表示
  $('r-acc').textContent = r.accuracy.toFixed(2) + '%';
  $('r-combo').textContent = `${r.maxCombo} / ${r.total}`;
  const C = { PERFECT: '#7ff9ff', GREAT: '#ff7ce6', GOOD: '#b6ff7a', MISS: '#ff5a6e' };
  $('r-team').innerHTML = r.hasTeam
    ? `編成スコア <b>${r.teamScore.toLocaleString()}</b> <span class="muted">(ランキング・自己ベストは編成効果なしの ${fmtScore(r.score)} で記録)</span>`
    : '';
  $('r-reward').innerHTML = '';
  $('r-counts').innerHTML = Object.entries(r.counts).map(([k, v]) => `<div><small style="color:${C[k]}">${k}</small><b>${v}</b></div>`).join('') +
    `<div class="fs">FAST ${r.fast} ・ SLOW ${r.slow}</div>`;
  const on = $('r-online');
  const name = load('name', '');
  if (custom) {
    const who = acc.getState()?.name || name;
    if (!who) { on.innerHTML = '<p class="r-msg">ログインするか設定でゲスト名を入れると、この譜面のランキングに参加できます。</p>'; return; }
    on.innerHTML = '<p class="r-msg">ランキングに送信中…</p>';
    submitChartScore(custom.chartId, myRankId(), who, r).then(async (rank) => {
      const rows = await fetchChartRanking(custom.chartId, myRankId(), 10);
      if (state !== 'result' || lastResult !== r) return;
      on.innerHTML = `<p>この譜面のランク <span class="r-myrank">#${rank}</span></p><ol class="rank-list">${rankRows(rows)}</ol>`;
    }).catch((err) => { console.error(err); on.innerHTML = '<p class="r-msg">ランキングに送信できませんでした</p>'; });
    return;
  }
  if (acc.isLoggedIn()) {
    on.innerHTML = '<p class="r-msg">記録を送信中…</p>';
    acc.playResult(entry.id, d, !entry.local, r).then(async (res) => {
      if (state !== 'result' || lastResult !== r) return;
      const n = acc.claimableCount();
      $('r-reward').innerHTML = `<span class="coin-ico">◎</span> +${res.gained} コイン` +
        (res.gained === 0 ? ' <span class="muted">(連続送信のため報酬なし)</span>' : '') +
        (n ? ` ・ <button class="link-btn" data-nav-q>受け取れるクエストが ${n} 件</button>` : '');
      $('r-reward').querySelector('[data-nav-q]')?.addEventListener('click', () => { import('./meta.js').then((m) => m.openScreen('quest')); });
      if (entry.local) { on.innerHTML = '<p class="r-msg">読み込んだ曲はランキング対象外です。</p>'; return; }
      rankCache.delete(entry.id + '/' + d);
      const rows = await fetchRanking(entry.id, d, myRankId(), 10);
      if (state !== 'result' || lastResult !== r) return;
      on.innerHTML = `<p>ONLINE RANK <span class="r-myrank">#${res.online}</span></p><ol class="rank-list">${rankRows(rows)}</ol>`;
    }).catch((err) => { console.error(err); on.innerHTML = `<p class="r-msg">${esc(acc.errText(err))}(記録は端末に保存済み)</p>`; });
  } else if (entry.local) on.innerHTML = '<p class="r-msg">読み込んだ曲の記録はこの端末にだけ保存されます。</p>';
  else if (!name) on.innerHTML = '<p class="r-msg">ログインするとコインがもらえ、オンラインランキングにも参加できます(右上のアカウントから)。</p>';
  else {
    on.innerHTML = '<p class="r-msg">ランキングに送信中…</p>';
    submitScore(entry.id, d, clientId(), name, r)
      .then(async (myRank) => {
        rankCache.delete(entry.id + '/' + d);
        const rows = await fetchRanking(entry.id, d, clientId(), 10);
        if (state !== 'result' || lastResult !== r) return;
        on.innerHTML = `<p>ONLINE RANK <span class="r-myrank">#${myRank}</span></p><ol class="rank-list">${rankRows(rows)}</ol>`;
      })
      .catch((err) => { console.error(err); on.innerHTML = '<p class="r-msg">ランキングに送信できませんでした(記録は端末に保存済み)</p>'; });
  }
}
$('btn-retry').addEventListener('click', retry);
$('btn-back').addEventListener('click', quitGame);
$('btn-resume').addEventListener('click', () => { overlay('pause', false); game?.resume(); });
$('btn-p-retry').addEventListener('click', retry);
$('btn-p-quit').addEventListener('click', quitGame);

// ---------------------------------------------------------------------------
// 入力
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (ev) => {
  if (ev.target.tagName === 'INPUT' && ['text', 'password', 'search'].includes(ev.target.type)) {
    if (ev.target.type === 'search' && (ev.key === 'Escape' || ev.key === 'Enter')) ev.target.blur();
    else if (ev.key === 'Escape') closeModals();
    return;
  }
  if (modalOpen()) { if (ev.key === 'Escape') closeModals(); return; }

  if (state === 'game' && game) {
    const lane = KEYS.indexOf(ev.code);
    if (lane >= 0) { ev.preventDefault(); if (!ev.repeat) game.press(lane, ev.timeStamp); return; }
    if (ev.key === 'Escape') {
      if (game.paused) { overlay('pause', false); game.resume(); } else { game.pause(); overlay('pause', true); }
    }
    return;
  }
  if (state === 'title' && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); enterFromTitle(); return; }
  if (state === 'select') {
    const view = visibleSongs();
    const pos = view.indexOf(sel);
    if (ev.key === 'ArrowDown' && view.length) { ev.preventDefault(); selectSong(view[(pos + 1) % view.length]); }
    else if (ev.key === 'ArrowUp' && view.length) { ev.preventDefault(); selectSong(view[(pos - 1 + view.length) % view.length]); }
    else if (ev.key === '/' ) { ev.preventDefault(); $('song-search').focus(); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); setDiff(DIFFS[Math.min(2, DIFFS.indexOf(diff) + 1)]); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); setDiff(DIFFS[Math.max(0, DIFFS.indexOf(diff) - 1)]); }
    else if (ev.key === 'Enter') { ev.preventDefault(); startGame(); }
    return;
  }
  if (state === 'editor' || state === 'charts') { makerKeydown(ev); return; }
  if (state === 'quest' || state === 'gacha' || state === 'team') {
    if (ev.key === 'Escape') { if (gachaResultOpen()) closeGacha(); else backToSelect(); }
    return;
  }
  if (state === 'result') {
    if (ev.key === 'Enter' || ev.key === 'Escape') { ev.preventDefault(); quitGame(); }
    else if (ev.code === 'KeyR') { ev.preventDefault(); retry(); }
  }
});
window.addEventListener('keyup', (ev) => {
  if (state !== 'game' || !game) return;
  const lane = KEYS.indexOf(ev.code);
  if (lane >= 0) game.release(lane, ev.timeStamp);
});
function pauseGame() {
  if (state === 'game' && game && !game.paused) { game.pause(); overlay('pause', true); }
}
window.addEventListener('blur', pauseGame);
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });
$('btn-pause-game').addEventListener('click', pauseGame);
if (IS_TOUCH) {
  document.body.classList.add('touch');
  $('btn-start').textContent = 'TAP TO START';
}

// タッチ(スマホ)
const touchLane = new Map();
canvas.addEventListener('touchstart', (ev) => {
  if (state !== 'game' || !game) return;
  ev.preventDefault();
  for (const t of ev.changedTouches) {
    const l = game.laneAt(t.clientX);
    touchLane.set(t.identifier, l);
    game.press(l, ev.timeStamp);
  }
}, { passive: false });
const touchEnd = (ev) => {
  if (!game) return;
  for (const t of ev.changedTouches) {
    const l = touchLane.get(t.identifier);
    touchLane.delete(t.identifier);
    if (l != null && ![...touchLane.values()].includes(l)) game.release(l, ev.timeStamp);
  }
};
canvas.addEventListener('touchmove', (ev) => {
  if (state !== 'game' || !game) return;
  ev.preventDefault();
  // 指をスライドして隣のレーンへ移動できるように
  for (const t of ev.changedTouches) {
    const old = touchLane.get(t.identifier);
    const l = game.laneAt(t.clientX);
    if (old == null || old === l) continue;
    touchLane.set(t.identifier, l);
    if (![...touchLane.values()].includes(old)) game.release(old, ev.timeStamp);
    game.press(l, ev.timeStamp);
  }
}, { passive: false });
canvas.addEventListener('touchend', touchEnd);
canvas.addEventListener('touchcancel', touchEnd);

// ---------------------------------------------------------------------------
// アカウント・メタ画面
// ---------------------------------------------------------------------------
function closeModals() {
  if ($('settings').classList.contains('on')) closeSettings();
  overlay('account-modal', false);
  overlay('changelog', false);
}
function backToSelect() {
  show('select');
  renderList();
  selectSong(sel, true);
}
initMeta({ show: (n) => { stopPreview(); show(n); }, toast, back: backToSelect, current: () => state });
initMaker({
  entries, show: (n) => { stopPreview(); show(n); }, toast, back: backToSelect, current: () => state, overlay,
  play: (entry, custom) => startGame(entry, custom.kind, custom), rankRows, myRankId, esc,
  selectedEntry: () => entries[sel],
});
$('btn-charts').addEventListener('click', () => openCharts());
$('btn-maker').addEventListener('click', () => openEditor(entries[sel]));
acc.onChange(() => { if (state === 'select') { renderList(); renderDetail(); } });
const accReady = acc.init();

// 画面のURL(maker/ gacha/ charts/)で開いたときは、タイトルを飛ばしてその画面を開く
(async function openFromScreenUrl() {
  await Promise.resolve(); // このファイルの残り(設定など)を読み終えてから動かす
  const screen = document.querySelector('meta[name="screen"]')?.content;
  if (!screen) return;
  const needLogin = ['gacha', 'quest', 'team'].includes(screen);
  if (needLogin && !load('token', null)) {
    // ガチャ・クエスト・編成はログインが必要。ログインしていない人は普通のトップ扱い(曲URLと同じ)
    try { history.replaceState(null, '', ROOT_PATH); document.title = 'MUSIC LiDAR｜ブラウザで遊べる無料4キー音ゲー(リズムゲーム)'; } catch { /* noop */ }
    return;
  }
  enterFromTitle({ quiet: true });
  if (screen === 'editor') openEditor(entries[sel]);
  else if (screen === 'charts') openCharts();
  else if (screen === 'settings') openSettings();
  else if (screen === 'account') openAccount();
  else if (screen === 'changelog') openChangelog();
  else if (needLogin) {
    await accReady;
    if (acc.isLoggedIn()) openMetaScreen(screen);
    else { syncUrl(entries[sel]); openAccount(); }
  }
  // result/ はプレイ結果が残っていないので選曲画面のまま
})();

// ---------------------------------------------------------------------------
// 設定
// ---------------------------------------------------------------------------
const SLIDERS = [
  ['s-fx', 'fx', (v) => FX_LEVELS[v]],
  ['s-hs', 'hs', (v) => `${v.toFixed(1)}`],
  ['s-bgm', 'bgm', (v) => `${Math.round(v * 100)}`],
  ['s-se', 'se', (v) => `${Math.round(v * 100)}`],
  ['s-lane', 'laneW', (v) => `${v}px`],
  ['s-judge', 'judgePos', (v) => `${Math.round(v * 100)}%`],
];
function syncSettingsUI() {
  for (const [id, key, fmt] of SLIDERS) {
    $(id).value = settings[key];
    $(id.replace('s-', 'o-')).textContent = fmt(+settings[key]);
  }
  $('o-hs').title = `表示時間 ${visibleTime(settings.hs).toFixed(2)}秒`;
  $('s-name').value = load('name', '');
  $('s-beam').checked = !!settings.hitBeam;
  $('o-beam').textContent = settings.hitBeam ? 'ON' : 'OFF';
}
$('s-beam').addEventListener('change', () => {
  settings.hitBeam = $('s-beam').checked;
  $('o-beam').textContent = settings.hitBeam ? 'ON' : 'OFF';
  setSettings(settings);
});
for (const [id, key, fmt] of SLIDERS) {
  $(id).addEventListener('input', () => {
    settings[key] = +$(id).value;
    $(id.replace('s-', 'o-')).textContent = fmt(settings[key]);
    setSettings(settings);
    if (key === 'bgm' || key === 'se') setVolumes(settings.bgm, settings.se);
  });
}
$('s-se').addEventListener('change', () => import('./audio.js').then((a) => a.playTap()));

let previewRaf = 0, previewGame = null;
function openSettings() {
  syncSettingsUI();
  overlay('settings', true);
  const pc = $('s-preview');
  const fake = [];
  for (let i = 0; i < 200; i++) {
    const t = i * 0.3;
    const lane = [0, 1, 2, 3, 2, 1, 3, 0][i % 8];
    fake.push(i % 10 === 4 ? { t, lane, end: t + 0.9 } : { t, lane });
  }
  previewGame = new Game(pc, { buffer: null, notes: fake, settings, bpm: 100, title: 'PREVIEW', diff: 'normal', color: '#5ef2ff', cloud, onEnd: null });
  previewGame.endAt = 60;
  const loop = (now) => {
    previewRaf = requestAnimationFrame(loop);
    const scale = pc.clientWidth / Math.max(1, window.innerWidth);
    previewGame.settings = { ...settings, laneW: settings.laneW * scale };
    previewGame.v = settings.hs * 4.4;
    previewGame.T = visibleTime(settings.hs);
    const t = (now / 1000) % 50 + 2;
    for (const n of previewGame.notes) { n.done = false; n.tailDone = !n.end; n.holding = false; }
    previewGame.drawStart = 0;
    previewGame.render(t, now);
  };
  previewRaf = requestAnimationFrame(loop);
}
function closeSettings() {
  const v = $('s-name').value.trim().slice(0, 16);
  if (v !== load('name', '')) { save('name', v); renderHeader(); }
  cancelAnimationFrame(previewRaf);
  previewGame = null;
  overlay('settings', false);
}
$('btn-settings').addEventListener('click', openSettings);
$('btn-s-close').addEventListener('click', closeSettings);
$('btn-s-reset').addEventListener('click', () => {
  settings = { ...DEFAULT_SETTINGS };
  setSettings(settings);
  setVolumes(settings.bgm, settings.se);
  syncSettingsUI();
});
for (const m of document.querySelectorAll('.overlay.modal')) {
  m.addEventListener('click', (ev) => { if (ev.target === m) closeModals(); });
}

// 想定外のエラーは画面に出す(不具合報告用)
window.addEventListener('error', (ev) => toast('エラー: ' + (ev.message || ev.error), 6000));
window.addEventListener('unhandledrejection', (ev) => toast('エラー: ' + (ev.reason?.message || ev.reason), 6000));

// デバッグ用
window.MLIDAR = { entries, get game() { return game; } };

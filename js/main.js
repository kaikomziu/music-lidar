import SONGS from './songs/index.js';
import { composeSong, candidatesFromEvents, generateChart, chartStats, DIFFS, hashStr } from './composer.js';
import { getCtx, setVolumes, renderEvents, playPreview, stopPreview } from './audio.js';
import { analyzeFile, hashFile } from './analyzer.js';
import { Game, PointCloud, KEYS, DIFF_COLOR, visibleTime, IS_TOUCH, FX_LEVELS } from './game.js';
import { load, save, getSettings, setSettings, DEFAULT_SETTINGS, clientId, getBest, recordBest } from './storage.js';
import { fetchRanking, submitScore } from './ranking.js';
import * as acc from './account.js';
import { initMeta, openAccount, renderHeader, gachaResultOpen, closeGacha } from './meta.js';

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
const entries = SONGS.map((def) => {
  const { events, duration } = composeSong(def);
  const cands = candidatesFromEvents(events);
  const charts = {}, stats = {};
  for (const d of DIFFS) {
    charts[d] = generateChart(cands, d, duration, hashStr(def.id));
    stats[d] = chartStats(charts[d]);
  }
  return {
    id: def.id, title: def.title, artist: def.artist, genre: def.genre, bpm: def.bpm, color: def.color,
    levels: def.levels, charts, stats, local: false, duration,
    previewAt: (def.preview ?? 32) * 60 / def.bpm,
    buffer: null, rendering: null,
    load() {
      if (this.buffer) return Promise.resolve(this.buffer);
      if (!this.rendering) this.rendering = renderEvents(events, duration, { sidechain: def.sidechain }).then((b) => (this.buffer = b));
      return this.rendering;
    },
  };
});

let sel = Math.max(0, Math.min(entries.length - 1, load('sel', 0)));
let diff = DIFFS.includes(load('diff', 'normal')) ? load('diff', 'normal') : 'normal';

// 起動後に全曲をバックグラウンドで順に合成しておく
async function warmup() {
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

// ---------------------------------------------------------------------------
// 画面切り替え
// ---------------------------------------------------------------------------
function show(name) {
  state = name;
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === name);
  document.body.classList.toggle('playing', name === 'game');
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
function enterFromTitle() {
  getCtx();
  setVolumes(settings.bgm, settings.se);
  show('select');
  renderList();
  selectSong(sel, true);
  warmup();
  if (!acc.isLoggedIn() && !load('nameSkipped', false)) openAccount();
}
$('btn-start').addEventListener('click', enterFromTitle);

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

function renderList() {
  const list = $('song-list');
  list.innerHTML = '';
  entries.forEach((e, i) => {
    const b = document.createElement('button');
    b.className = 'song-card' + (i === sel ? ' sel' : '');
    b.style.setProperty('--c', e.color);
    const lv = DIFFS.map((d) => {
      const best = bestOf(e.id, d);
      const mark = best?.ap ? 'AP' : best?.fc ? 'FC' : '';
      return `<span class="lv ${d}">${e.levels[d]}${mark ? `<span class="mark">${mark}</span>` : ''}</span>`;
    }).join('');
    b.innerHTML = `<div class="sc-title">${esc(e.title)}</div><div class="sc-sub">${esc(e.genre)} ・ BPM ${Math.round(e.bpm)}${e.local ? ' ・ LOCAL' : ''}</div><div class="sc-lv">${lv}</div>`;
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
  [...$('song-list').children].forEach((c, j) => c.classList.toggle('sel', j === i));
  $('song-list').children[i]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
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
}

function renderDetail() {
  const e = entries[sel];
  document.documentElement.style.setProperty('--accent', e.color);
  $('d-genre').textContent = e.genre;
  $('d-title').textContent = e.title;
  $('d-meta').textContent = `${e.artist} ・ BPM ${Math.round(e.bpm)} ・ ${fmtTime(e.duration)}`;
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
  $('play-sub').textContent = ready ? 'ENTER' : '音源を生成中…';
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

// --- 曲ファイル読み込み ---
async function loadFile(file) {
  if (!file) return;
  if (!/^audio\//.test(file.type) && !/\.(mp3|wav|ogg|m4a|flac|aac|opus|webm)$/i.test(file.name)) { toast('音声ファイルを選んでください'); return; }
  stopPreview();
  $('loading-text').textContent = 'ANALYZING...';
  overlay('loading', true);
  try {
    const ab = await file.arrayBuffer();
    const hash = await hashFile(ab);
    const id = 'file-' + hash;
    const existing = entries.findIndex((e) => e.id === id);
    if (existing >= 0) { overlay('loading', false); selectSong(existing, true); return; }
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
      id, title, artist: 'LOCAL FILE', genre: 'IMPORT', bpm, color: '#ffd25e', levels, charts, stats, local: true,
      duration: buffer.duration, previewAt: buffer.duration * 0.35, buffer, load() { return Promise.resolve(buffer); },
    });
    renderList();
    selectSong(entries.length - 1, true);
    toast(`「${title}」の譜面を生成しました(推定 BPM ${Math.round(bpm)})`);
  } catch (err) {
    console.error(err);
    toast('このファイルは読み込めませんでした');
  } finally {
    overlay('loading', false);
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
async function startGame(entry = entries[sel], d = diff) {
  if (state === 'game' || starting) return;
  starting = true;
  try { await startGameInner(entry, d); } finally { starting = false; }
}
async function startGameInner(entry, d) {
  document.activeElement?.blur?.();
  getCtx();
  stopPreview();
  if (!entry.buffer) {
    $('loading-text').textContent = 'SCANNING...';
    overlay('loading', true);
    try { await entry.load(); } catch (err) { console.error(err); toast('音源の生成に失敗しました'); overlay('loading', false); return; }
    overlay('loading', false);
  }
  playing = { entry, diff: d };
  show('game');
  setVolumes(settings.bgm, settings.se);
  game = new Game(canvas, {
    buffer: entry.buffer, notes: entry.charts[d], settings, bpm: entry.bpm, title: entry.title, diff: d, color: entry.color, cloud,
    onEnd: (r) => onGameEnd(r),
    team: acc.isLoggedIn() ? acc.teamFx() : null,
  });
  game.start();
}

function quitGame() {
  overlay('pause', false);
  game?.destroy();
  game = null;
  show('select');
  renderList();
  selectSong(sel, true);
}

function retry() {
  overlay('pause', false);
  game?.destroy();
  game = null;
  state = 'retry';
  startGame(playing.entry, playing.diff);
}

function onGameEnd(r) {
  const { entry, diff: d } = playing;
  game = null;
  lastResult = r;
  const isNew = recordBest(entry.id, d, r);
  show('result');
  document.documentElement.style.setProperty('--accent', entry.color);
  $('r-title').textContent = entry.title;
  const rd = $('r-diff');
  rd.textContent = `${d.toUpperCase()} ${entry.levels[d]}`;
  rd.style.color = DIFF_COLOR[d];
  $('r-rank').textContent = r.rank;
  $('r-score').textContent = fmtScore(r.score);
  $('r-new').classList.toggle('on', isNew);
  $('r-badges').innerHTML = r.ap ? '<span class="badge ap">ALL PERFECT</span>' : r.fc ? '<span class="badge fc">FULL COMBO</span>' : '';
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
  if (ev.target.tagName === 'INPUT' && (ev.target.type === 'text' || ev.target.type === 'password')) {
    if (ev.key === 'Escape') closeModals();
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
    if (ev.key === 'ArrowDown') { ev.preventDefault(); selectSong((sel + 1) % entries.length); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); selectSong((sel - 1 + entries.length) % entries.length); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); setDiff(DIFFS[Math.min(2, DIFFS.indexOf(diff) + 1)]); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); setDiff(DIFFS[Math.max(0, DIFFS.indexOf(diff) - 1)]); }
    else if (ev.key === 'Enter') { ev.preventDefault(); startGame(); }
    return;
  }
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
}
function backToSelect() {
  show('select');
  renderList();
  selectSong(sel, true);
}
initMeta({ show: (n) => { stopPreview(); show(n); }, toast, back: backToSelect, current: () => state });
acc.onChange(() => { if (state === 'select') { renderList(); renderDetail(); } });
acc.init();

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

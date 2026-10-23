// みんなでライブ: 同じ曲を同時にプレイ。プレイ中は数秒おきに相手のコンボだけ届き、最後は編成込みスコアで競う
// サーバーへの問い合わせを減らすため、Realtime は使わず数秒おきの RPC 1本(mlidar_live_poll)だけにしている
import { rpc } from './ranking.js';
import { load } from './storage.js';
import * as acc from './account.js';

const $ = (id) => document.getElementById(id);
const LEAD_MS = 4000; // サーバーの開始時刻から曲の頭までの時間(全員この時刻に曲が始まる)
const POLL_LOBBY = 5000, POLL_ROOM = 2500, POLL_GAME = 3000, POLL_RESULT = 3000;
const ERR = { NO_ROOM: 'ルームが見つかりません(解散したか、コードが違います)', ROOM_FULL: 'ルームが満員です(8人まで)', NOT_HOST: 'ホストだけが操作できます' };
const errText = (e) => ERR[e?.message] || acc.errText(e);

let ui = null; // { entries, show, toast, back, current, esc, jacketURL, startLive, openAccount, diffColor, isFav, toggleFav, bestOf }
let room = null; // サーバーから来た部屋の状態
let timer = 0;
let mode = 'off'; // off | lobby | room | game | result
let playedRound = 0;
let startTimer = 0;
let clockOff = 0; // サーバー時刻 - 手元の時刻
let liveGame = null; // { getCombo(), round, entry, diff }
let busy = false;

const token = () => load('token', null);
const serverNow = () => Date.now() + clockOff;
const entryOf = (id) => ui.entries.find((e) => e.id === id && !e.local);
const me = () => room?.members.find((m) => m.id === room.me);
const isHost = () => room && room.host === room.me;

async function call(fn, args) {
  const t0 = Date.now();
  const r = await rpc(fn, { p_token: token(), ...args });
  if (r && r.now) {
    const off = r.now - (t0 + Date.now()) / 2;
    clockOff = clockOff ? clockOff * 0.7 + off * 0.3 : off;
  }
  return r;
}

export function initLive(api) {
  ui = api;
  $('btn-live').addEventListener('click', openLive);
  $('live-create').addEventListener('click', createRoom);
  $('live-join-form').addEventListener('submit', (ev) => { ev.preventDefault(); joinRoom($('live-code').value); });
  $('live-rooms').addEventListener('click', (ev) => { const b = ev.target.closest('[data-code]'); if (b) joinRoom(b.dataset.code); });
  $('live-leave').addEventListener('click', leaveRoom);
  $('live-start').addEventListener('click', startRound);
  $('live-search').addEventListener('input', () => { pick.q = $('live-search').value; renderPick(true); });
  $('live-sort').addEventListener('change', () => { pick.sort = $('live-sort').value; renderPick(true); });
  $('live-filters').addEventListener('click', (ev) => { const b = ev.target.closest('.f-chip'); if (b) { pick[b.dataset.g] = b.dataset.v; renderPick(true); } });
  $('live-list').addEventListener('click', (ev) => {
    const star = ev.target.closest('.sc-fav');
    const card = ev.target.closest('.song-card[data-id]');
    if (!card) return;
    const e = entryOf(card.dataset.id);
    if (star) { ui.toggleFav(e); renderPick(true); return; }
    if (isHost() && room.status !== 'play' && e.id !== room.song) configRoom(e.id, room.diff);
  });
  $('live-diffs').addEventListener('click', (ev) => { const b = ev.target.closest('[data-diff]'); if (b && !b.disabled) setMyDiff(b.dataset.diff); });
  $('live-copy').addEventListener('click', () => {
    const text = `MUSIC LiDAR「みんなでライブ」ルームコード: ${room.code}`;
    navigator.clipboard?.writeText(room.code).then(() => ui.toast('ルームコードをコピーしました'), () => ui.toast(text));
  });
  $('live-back').addEventListener('click', () => { const r = room; stop(); room = null; mode = 'off'; clearTimeout(startTimer); ui.back(); if (r) call('mlidar_live_leave', { p_room: r.id }).catch(() => {}); });
  // ページを閉じたら抜ける
  window.addEventListener('pagehide', () => {
    if (!room || !token()) return;
    try {
      fetch('https://kifnzvktwbomxthzvvgy.supabase.co/rest/v1/rpc/mlidar_live_leave', {
        method: 'POST', keepalive: true,
        headers: { apikey: API_KEY, Authorization: 'Bearer ' + API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_token: token(), p_room: room.id }),
      });
    } catch { /* noop */ }
  });
}
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZm56dmt0d2JvbXh0aHp2dmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzgxMzgsImV4cCI6MjA5MzQxNDEzOH0.M7nXP-u--6J_6rRpgz1cJj21_7KX6MtfTmZy77Xf_IE';

function stop() { clearTimeout(timer); timer = 0; }
function schedule(fn, ms) { clearTimeout(timer); timer = setTimeout(fn, ms); }

// ---------------------------------------------------------------------------
// ロビー
// ---------------------------------------------------------------------------
export function openLive() {
  if (!acc.isLoggedIn()) { ui.toast('みんなでライブはログインすると遊べます'); ui.openAccount(); return; }
  ui.show('live');
  if (room) { mode = 'room'; renderRoom(); pollRoom(); return; }
  mode = 'lobby';
  renderView();
  pollLobby();
}

async function pollLobby() {
  if (mode !== 'lobby' || ui.current() !== 'live') return;
  try {
    const list = await call('mlidar_live_list', {});
    if (mode !== 'lobby') return;
    renderRooms(list);
  } catch (e) { console.error(e); $('live-rooms').innerHTML = `<li class="empty">${ui.esc(errText(e))}</li>`; }
  schedule(pollLobby, POLL_LOBBY);
}

function renderRooms(list) {
  $('live-rooms').innerHTML = list.length ? list.map((r) => {
    const e = entryOf(r.song);
    return `<li><button class="live-room" data-code="${ui.esc(r.code)}">
      ${e ? `<img src="${ui.jacketURL(e, 96)}" alt="">` : '<i></i>'}
      <span class="lr-main"><b>${ui.esc(e?.title || r.song)}</b><small style="color:${ui.diffColor[r.diff]}">${r.diff.toUpperCase()}${e ? ' Lv' + e.levels[r.diff] : ''}</small></span>
      <span class="lr-host">${ui.esc(r.host || '')} のルーム</span>
      <span class="lr-n">${r.n}/8</span>
      <span class="lr-st ${r.status}">${r.status === 'play' ? 'ライブ中' : '募集中'}</span>
    </button></li>`;
  }).join('') : '<li class="empty">いま開いているルームはありません。ルームを作ってみんなを呼ぼう!</li>';
}

function renderView() {
  $('live-lobby').hidden = !!room;
  $('live-roombox').hidden = !room;
}

async function createRoom() {
  if (busy) return;
  const cur = ui.selected();
  const e = cur && !cur.local ? cur : ui.entries.find((x) => !x.local);
  busy = true;
  try { room = await call('mlidar_live_create', { p_song: e.id, p_diff: ui.diff() }); enterRoom(); }
  catch (err) { ui.toast(errText(err)); }
  finally { busy = false; }
}

async function joinRoom(code) {
  code = String(code || '').trim().toUpperCase();
  if (!code || busy) return;
  busy = true;
  try { room = await call('mlidar_live_join', { p_code: code }); playedRound = room.round; enterRoom(); }
  catch (err) { ui.toast(errText(err)); }
  finally { busy = false; }
}

function enterRoom() {
  mode = 'room';
  pick.key = '';
  renderView();
  renderRoom();
  prepare();
  schedule(pollRoom, 300);
}

async function leaveRoom() {
  const r = room;
  room = null; mode = 'lobby'; playedRound = 0;
  clearTimeout(startTimer);
  renderView();
  pollLobby();
  if (r) call('mlidar_live_leave', { p_room: r.id }).catch(() => {});
}

// ---------------------------------------------------------------------------
// ルーム(待機)
// ---------------------------------------------------------------------------
function prepare() {
  const e = entryOf(room?.song);
  if (e && !e.buffer && !e.rendering) e.load().then(() => { if (mode === 'room') renderRoom(); }).catch(() => {});
}
const isReady = () => !!entryOf(room?.song)?.buffer;

async function pollRoom() {
  if (!room || mode !== 'room') return;
  try {
    room = await call('mlidar_live_poll', { p_room: room.id, p_ready: isReady(), p_combo: null });
  } catch (e) {
    if (e.message === 'NO_ROOM') { ui.toast('ルームから外れました'); room = null; if (ui.current() === 'live') { mode = 'lobby'; renderView(); pollLobby(); } return; }
    console.error(e);
  }
  if (mode !== 'room') return;
  if (ui.current() === 'live') { prepare(); renderRoom(); }
  checkStart();
  schedule(pollRoom, POLL_ROOM);
}

function renderRoom() {
  if (!room) return;
  const e = entryOf(room.song);
  const host = isHost();
  $('live-room-code').textContent = room.code;
  $('live-jacket').src = e ? ui.jacketURL(e, 256) : '';
  $('live-title').textContent = e?.title || room.song;
  $('live-genre').textContent = e ? `${e.genre} ・ BPM ${Math.round(e.bpm)}` : '';
  // 曲はホストだけが変えられる(左の曲リスト)。難易度は人ごとに選ぶ
  $('live-roombox').classList.toggle('host', host);
  $('live-pickmsg').textContent = host ? (room.status === 'play' ? 'ライブ中は曲を変えられません' : '曲リストから選べます') : '曲はホストが選びます';
  renderPick();
  const my = me();
  const lockDiff = room.status === 'play' && my?.in && !my.done;
  $('live-diffs').innerHTML = ['easy', 'normal', 'hard'].map((d) =>
    `<button class="diff-btn ${d}${my?.diff === d ? ' sel' : ''}" data-diff="${d}" ${lockDiff ? 'disabled' : ''}><div class="dn">${d.toUpperCase()}</div><div class="dl">${e ? e.levels[d] : '-'}</div><div class="dc">${e ? e.stats[d].notes + ' notes' : ''}</div></button>`).join('');
  // メンバー
  const playing = room.status === 'play';
  $('live-members').innerHTML = room.members.map((m) => {
    let st;
    if (playing && m.in) st = m.done ? `<span class="lm-st done">${(m.score ?? 0).toLocaleString()}</span>` : `<span class="lm-st play">ライブ中 ${m.combo} COMBO</span>`;
    else st = m.ready ? '<span class="lm-st ok">READY</span>' : '<span class="lm-st wait">準備中…</span>';
    return `<li class="${m.id === room.me ? 'me' : ''}"><span class="lm-name">${m.id === room.host ? '<i class="lm-host">HOST</i>' : ''}${ui.esc(m.name)}</span>${diffTag(m.diff)}${st}</li>`;
  }).join('');
  $('live-count').textContent = `${room.members.length}/8`;
  // スタート
  const btn = $('live-start');
  const anyPlaying = playing && room.members.some((m) => m.in && !m.done);
  const notReady = room.members.filter((m) => !m.ready).length;
  btn.hidden = !host;
  btn.disabled = anyPlaying || !isReady();
  btn.innerHTML = anyPlaying ? 'ライブ中…' : !isReady() ? '音源を準備中…' : notReady ? `スタート <small>(準備中 ${notReady}人)</small>` : 'ライブ スタート!';
  const cd = 0;
  $('live-msg').textContent = cd ? `まもなく開始… ${cd}` :
    anyPlaying ? (me()?.in ? '' : '次の曲から参加できます。終わるまで待っていてね') :
    host ? (room.members.length < 2 ? 'ルームコードを友だちに教えて呼ぼう。1人でもスタートできます' : '全員そろったらスタート!') :
    'ホストがスタートするのを待っています…';
}

// --- 曲リスト(ひとりでライブの選曲画面と同じ見た目)。ホストだけに出す ---
const pick = { q: '', sort: 'default', lv: 'all', status: 'all', key: '' };
const LV_FILTERS = [['all', 'すべて'], ['1-4', 'Lv1〜4'], ['5-9', 'Lv5〜9'], ['10-', 'Lv10以上']];
const STATUS_FILTERS = [['all', 'すべて'], ['fav', '★ お気に入り'], ['new', '未プレイ'], ['nofc', '未フルコンボ']];

function pickSongs(d) {
  const q = pick.q.trim().toLowerCase();
  const list = ui.entries.filter((e) => {
    if (e.local) return false;
    if (q && !`${e.title} ${e.genre} ${e.artist} ${Math.round(e.bpm)}`.toLowerCase().includes(q)) return false;
    const lv = e.levels[d];
    if (pick.lv === '1-4' && lv > 4) return false;
    if (pick.lv === '5-9' && (lv < 5 || lv > 9)) return false;
    if (pick.lv === '10-' && lv < 10) return false;
    const b = ui.bestOf(e.id, d);
    if (pick.status === 'fav' && !ui.isFav(e)) return false;
    if (pick.status === 'new' && b) return false;
    if (pick.status === 'nofc' && b?.fc) return false;
    return true;
  });
  const by = {
    level: (a, b) => a.levels[d] - b.levels[d], 'level-desc': (a, b) => b.levels[d] - a.levels[d],
    bpm: (a, b) => a.bpm - b.bpm, 'bpm-desc': (a, b) => b.bpm - a.bpm, name: (a, b) => a.title.localeCompare(b.title, 'ja'),
  }[pick.sort];
  return by ? list.sort(by) : list;
}

// ポーリングのたびに作り直すとスクロールがずれるので、条件が変わったときだけ描き直す
function renderPick(force = false) {
  if (!room || !isHost()) return;
  const d = me()?.diff || room.diff;
  const key = [room.song, d, room.status === 'play', pick.q, pick.sort, pick.lv, pick.status].join('|');
  if (!force && key === pick.key) return;
  const songChanged = pick.key.split('|')[0] !== room.song;
  pick.key = key;
  const chip = (g, [v, label]) => `<button class="f-chip ${pick[g] === v ? 'sel' : ''}" data-g="${g}" data-v="${v}">${label}</button>`;
  $('live-filters').innerHTML = `<span class="f-label">${d.toUpperCase()}</span>${LV_FILTERS.map((f) => chip('lv', f)).join('')}<span class="f-sep"></span>${STATUS_FILTERS.map((f) => chip('status', f)).join('')}`;
  const list = pickSongs(d);
  const locked = room.status === 'play';
  $('live-list').classList.toggle('locked', locked);
  $('live-list').innerHTML = list.length ? list.map((e) => {
    const lv = ['easy', 'normal', 'hard'].map((x) => {
      const b = ui.bestOf(e.id, x);
      const mark = b?.ap ? 'AP' : b?.fc ? 'FC' : '';
      return `<span class="lv ${x}">${e.levels[x]}${mark ? `<span class="mark">${mark}</span>` : ''}</span>`;
    }).join('');
    const fav = ui.isFav(e);
    return `<button class="song-card${e.id === room.song ? ' sel' : ''}" data-id="${ui.esc(e.id)}" style="--c:${e.color}">
      <img class="sc-jacket" src="${ui.jacketURL(e, 128)}" alt="" loading="lazy"><div class="sc-text"><span class="sc-fav${fav ? ' on' : ''}" title="${fav ? 'お気に入りから外す' : 'お気に入りにする'}">${fav ? '★' : '☆'}</span>
      <div class="sc-title">${ui.esc(e.title)}</div><div class="sc-sub">${ui.esc(e.genre)} ・ BPM ${Math.round(e.bpm)}</div></div><div class="sc-lv">${lv}</div></button>`;
  }).join('') : '<p class="list-empty">条件に合う曲がありません</p>';
  if (songChanged) $('live-list').querySelector('.song-card.sel')?.scrollIntoView({ block: 'nearest' });
}

const diffTag = (d) => `<i class="lm-diff" style="--dc:${ui.diffColor[d] || '#fff'}">${String(d || '').toUpperCase()}${entryOf(room?.song) ? ' ' + entryOf(room.song).levels[d] : ''}</i>`;

async function setMyDiff(d) {
  if (!room || busy || me()?.diff === d) return;
  const m = me();
  if (m) { m.diff = d; renderRoom(); } // 先に見た目だけ変える
  busy = true;
  try { room = await call('mlidar_live_diff', { p_room: room.id, p_diff: d }); renderRoom(); }
  catch (e) { ui.toast(errText(e)); }
  finally { busy = false; }
}

async function configRoom(song, diff) {
  if (!isHost() || busy) return;
  busy = true;
  try { room = await call('mlidar_live_config', { p_room: room.id, p_song: song, p_diff: diff }); prepare(); renderRoom(); }
  catch (e) { ui.toast(errText(e)); }
  finally { busy = false; }
}

async function startRound() {
  if (!isHost() || busy) return;
  busy = true;
  try { room = await call('mlidar_live_start', { p_room: room.id }); renderRoom(); checkStart(); }
  catch (e) { ui.toast(errText(e)); }
  finally { busy = false; }
}

// 開始の合図が来たらすぐ読み込みに入り、曲の頭は全員「サーバーの開始時刻 + LEAD_MS」にそろえる
// (読み込みが間に合わなかった人は、その時点の位置から途中参加になる)
function checkStart() {
  if (!room || room.status !== 'play' || room.round <= playedRound) return;
  const m = me();
  if (!m?.in || m.done) return;
  playedRound = room.round;
  const e = entryOf(room.song);
  if (!e) return;
  const diff = m.diff || room.diff, round = room.round;
  mode = 'game';
  stop();
  liveGame = { round, entry: e, diff, getCombo: () => 0 };
  liveHooks.syncAt = performance.now() + (room.start_at + LEAD_MS - serverNow());
  ui.startLive(e, diff, liveHooks);
  schedule(pollGame, POLL_GAME);
}

// ---------------------------------------------------------------------------
// プレイ中: 数秒おきに自分のコンボを送り、相手のコンボを受け取る
// ---------------------------------------------------------------------------
const liveHooks = {
  attach(game) { liveGame.getCombo = () => game.tCombo; liveGame.game = game; },
  rivals() {
    if (!room) return [];
    return room.members.filter((m) => m.in).map((m) => ({
      name: m.name, me: m.id === room.me, done: m.done, diff: m.diff,
      combo: m.id === room.me && liveGame?.game && !liveGame.game.ended ? liveGame.game.tCombo : m.combo,
    }));
  },
  finish: (r) => finishRound(r),
  quit: () => quitRound(),
};

async function pollGame() {
  if (!room || mode !== 'game') return;
  try { room = await call('mlidar_live_poll', { p_room: room.id, p_ready: true, p_combo: liveGame.getCombo() }); }
  catch (e) { console.error(e); }
  if (mode === 'game') schedule(pollGame, POLL_GAME);
}

async function finishRound(r) {
  mode = 'result';
  stop();
  const round = liveGame.round;
  liveGame.game = null;
  renderResult();
  try {
    room = await call('mlidar_live_finish', {
      p_room: room.id, p_round: round, p_score: r.teamScore, p_raw: r.score, p_max_combo: r.tMaxCombo ?? r.maxCombo,
      p_fc: r.fc, p_ap: r.ap, p_combo: liveGame.getCombo?.() || 0,
    });
  } catch (e) { console.error(e); }
  pollResult();
}

// 途中でやめた: その時点のスコアで終わったことにしてルームへ
async function quitRound() {
  const g = liveGame?.game;
  if (g && room) {
    const r = { teamScore: g.teamScore, score: g.score, tMaxCombo: g.tMaxCombo, fc: false, ap: false };
    mode = 'result';
    try {
      room = await call('mlidar_live_finish', { p_room: room.id, p_round: liveGame.round, p_score: r.teamScore, p_raw: r.score, p_max_combo: r.tMaxCombo, p_fc: false, p_ap: false, p_combo: g.tCombo });
    } catch (e) { console.error(e); }
  }
  backToRoom();
}

async function pollResult() {
  if (!room || mode !== 'result') return;
  renderResult();
  if (ui.current() !== 'result') return;
  // ホストが次の曲を始めたら、リザルトからそのままルームへ
  if (room.status === 'play' && room.round > playedRound) { backToRoom(); return; }
  schedule(async () => {
    if (mode !== 'result' || !room) return;
    try { room = await call('mlidar_live_poll', { p_room: room.id, p_ready: true, p_combo: null }); } catch (e) { console.error(e); }
    pollResult();
  }, POLL_RESULT);
}

function renderResult() {
  const box = $('r-live');
  if (!box || !room) return;
  const list = room.members.filter((m) => m.in).sort((a, b) => (b.done - a.done) || ((b.score ?? -1) - (a.score ?? -1)));
  const waiting = list.filter((m) => !m.done).length;
  let rank = 0, prev = null;
  const rows = list.map((m, i) => {
    if (m.done && m.score !== prev) { rank = i + 1; prev = m.score; }
    const mark = m.ap ? '<i class="lv-mark ap">AP</i>' : m.fc ? '<i class="lv-mark fc">FC</i>' : '';
    return `<li class="${m.id === room.me ? 'me' : ''} ${m.done && rank === 1 && list.length > 1 ? 'win' : ''}">
      <span class="rk">${m.done ? rank : '…'}</span><span class="nm">${ui.esc(m.name)}${diffTag(m.diff)}${mark}</span>
      <span class="cb">${m.done ? `MAX ${m.max_combo ?? '-'}` : `${m.combo} COMBO`}</span>
      <span class="sc">${m.done ? (m.score ?? 0).toLocaleString() : 'プレイ中…'}</span></li>`;
  }).join('');
  const my = list.find((m) => m.id === room.me);
  const myRank = my?.done ? 1 + list.filter((m) => m.done && (m.score ?? 0) > (my.score ?? 0)).length : 0;
  const head = waiting ? `みんなの結果を待っています…(残り ${waiting}人)` :
    list.length < 2 ? 'ソロライブ' : myRank === 1 ? '🏆 あなたが1位!' : `あなたは ${myRank}位`;
  box.innerHTML = `<div class="lv-head"><b>LIVE RESULT</b><span>${head}</span></div>
    <p class="muted small">編成の効果込みのスコアで競います</p><ol class="rank-list lv-list">${rows}</ol>`;
}

export function backToRoom() {
  liveGame = null;
  pick.key = ''; // 記録(FC など)が変わっているかもしれない
  if (!room) { openLive(); return; }
  mode = 'room';
  ui.show('live');
  renderView();
  renderRoom();
  schedule(pollRoom, 200);
}

export const inRoom = () => !!room;

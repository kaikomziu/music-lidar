// みんなでライブ: 同じ曲を同時にプレイ。プレイ中はみんなのコンボがほぼリアルタイムで届き、最後は編成込みスコアで競う
// 通信は WebRTC(ブラウザどうしの直接通信)。ルームを作った人(ホスト)のブラウザがルームの状態を持ち、
// 参加した人はホストとだけつながる。最初につながるための仲介(シグナリング)だけ PeerJS の公開サーバーを使う。
// (サーバーにデータを置かないので、ルームはホストがいる間だけ。ホストが抜けると解散)
import { jacketImg } from './jacket.js';
import { load } from './storage.js';
import * as acc from './account.js';

const $ = (id) => document.getElementById(id);
const LEAD_MS = 4000; // スタートの合図から曲の頭までの時間(全員この時刻に曲が始まる)
const MAX_MEMBERS = 8;
const COMBO_MS = 500; // プレイ中にコンボを送る間隔
const PEER_SRC = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
const ID_PREFIX = 'mlidar-live-'; // ホストの接続ID = これ + ルームコード
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 見間違えやすい 0/O・1/I/L は使わない
const PEER_OPTS = { config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] } };
const ERR = {
  NO_ROOM: 'ルームが見つかりません(解散したか、コードが違います)', ROOM_FULL: 'ルームが満員です(8人まで)',
  NET: 'つながりませんでした。通信環境を確かめて、もう一度試してください', CLOSED: 'ホストとの接続が切れました(ルームが解散しました)',
};
const errText = (e) => ERR[e?.message] || String(e?.message || e);

let ui = null; // { entries, show, toast, back, current, esc, jacketURL, startLive, openAccount, diffColor, isFav, toggleFav, bestOf, selected, diff }
let room = null; // ルームの状態(ホストが持っていて、変わるたびに全員へ配る)
let mode = 'off'; // off | lobby | room | game | result
let playedRound = 0;
let clockOff = 0; // ホストの時計 - 自分の時計(ホストは 0)
let bestRtt = Infinity;
let liveGame = null; // { getCombo(), round, entry, diff, game }
let busy = false;
let net = null; // { peer, host, conns: Map(相手ID → 接続)(ホスト), conn(参加者) }
let comboTimer = 0, pingTimer = 0, castTimer = 0;

const hostNow = () => Date.now() + clockOff;
const entryOf = (id) => ui.entries.find((e) => e.id === id && !e.local);
const me = () => room?.members.find((m) => m.id === room.me);
const isHost = () => !!(room && net?.host);
const myName = () => acc.getState()?.name || load('name', '') || 'ゲスト';

export function initLive(api) {
  ui = api;
  $('btn-live').addEventListener('click', openLive);
  $('live-create').addEventListener('click', createRoom);
  $('live-join-form').addEventListener('submit', (ev) => { ev.preventDefault(); joinRoom($('live-code').value); });
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
    if (isHost() && room.status !== 'play' && e.id !== room.song) configRoom(e.id);
  });
  $('live-diffs').addEventListener('click', (ev) => { const b = ev.target.closest('[data-diff]'); if (b && !b.disabled) setMyDiff(b.dataset.diff); });
  $('live-copy').addEventListener('click', () => {
    const text = `MUSIC LiDAR「みんなでライブ」ルームコード: ${room.code}`;
    navigator.clipboard?.writeText(room.code).then(() => ui.toast('ルームコードをコピーしました'), () => ui.toast(text));
  });
  $('live-back').addEventListener('click', () => { closeNet(); room = null; mode = 'off'; ui.back(); });
  window.addEventListener('pagehide', () => closeNet()); // ページを閉じたら抜ける
}

// ---------------------------------------------------------------------------
// 通信(WebRTC / PeerJS)
// ---------------------------------------------------------------------------
function loadPeerJs() {
  if (window.Peer) return Promise.resolve();
  return (loadPeerJs.p ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = PEER_SRC; s.async = true;
    s.onload = () => res();
    s.onerror = () => { loadPeerJs.p = null; s.remove(); rej(new Error('NET')); };
    document.head.appendChild(s);
  }));
}

// 接続IDを決めてシグナリングサーバーに登録する(id なしなら自動で決まる)
async function openPeer(id) {
  await loadPeerJs();
  return new Promise((res, rej) => {
    const p = id ? new window.Peer(id, PEER_OPTS) : new window.Peer(PEER_OPTS);
    const to = setTimeout(() => { p.destroy(); rej(new Error('NET')); }, 12000);
    p.once('open', () => { clearTimeout(to); res(p); });
    p.once('error', (e) => { clearTimeout(to); p.destroy(); rej(new Error(e.type === 'unavailable-id' ? 'TAKEN' : 'NET')); });
  });
}

function closeNet() {
  clearInterval(comboTimer); clearInterval(pingTimer); clearTimeout(castTimer);
  comboTimer = pingTimer = castTimer = 0;
  if (!net) return;
  const n = net;
  net = null;
  try { if (!n.host) n.conn?.send({ t: 'leave' }); } catch { /* noop */ }
  setTimeout(() => n.peer.destroy(), 100); // 「抜けます」を送り切ってから閉じる
}

// 自分の操作をホストへ(ホスト自身は直接処理する)
function send(msg) {
  if (!net) return;
  if (net.host) hostHandle(room.me, msg);
  else if (net.conn?.open) net.conn.send(msg);
}

// --- ホスト側 ---
const newMember = (id, name, diff) => ({
  id, name: String(name || 'ゲスト').slice(0, 16), diff: ['easy', 'normal', 'hard'].includes(diff) ? diff : 'normal',
  ready: false, in: false, done: false, combo: 0, score: null, raw: null, max_combo: null, fc: false, ap: false,
});

function randomCode() {
  let s = '';
  for (let i = 0; i < 5; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

// 状態が変わったら全員に配る(短い間にまとめて1回)
function broadcast() {
  if (!net?.host || castTimer) return;
  castTimer = setTimeout(() => {
    castTimer = 0;
    if (!net?.host || !room) return;
    const data = { t: 'state', room: { ...room, me: undefined } };
    for (const c of net.conns.values()) if (c.open) c.send(data);
    onRoomUpdate();
  }, 60);
}

function hostAccept(conn) {
  conn.on('data', (msg) => {
    if (!msg || typeof msg !== 'object') return;
    if (msg.t === 'hello') {
      if (room.members.length >= MAX_MEMBERS) { conn.send({ t: 'err', e: 'ROOM_FULL' }); setTimeout(() => conn.close(), 300); return; }
      net.conns.set(conn.peer, conn);
      if (!room.members.some((m) => m.id === conn.peer)) room.members.push(newMember(conn.peer, msg.name, msg.diff));
      conn.send({ t: 'welcome', id: conn.peer });
      broadcast();
      return;
    }
    if (net.conns.get(conn.peer) !== conn) return;
    hostHandle(conn.peer, msg, conn);
  });
  conn.on('close', () => hostDrop(conn.peer, conn));
  conn.on('error', () => hostDrop(conn.peer, conn));
}

function hostDrop(id, conn) {
  if (!net?.host || net.conns.get(id) !== conn) return;
  net.conns.delete(id);
  room.members = room.members.filter((m) => m.id !== id);
  broadcast();
}

// 参加者(とホスト自身)からの操作を反映する
function hostHandle(id, msg, conn = null) {
  const m = room?.members.find((x) => x.id === id);
  if (msg.t === 'ping') { conn?.send({ t: 'pong', c: msg.c, h: Date.now() }); return; }
  if (!m) return;
  switch (msg.t) {
    case 'ready': m.ready = !!msg.v; break;
    case 'diff':
      if (room.status === 'play' && m.in && !m.done) return; // プレイ中は変えられない
      if (['easy', 'normal', 'hard'].includes(msg.d)) m.diff = msg.d;
      break;
    case 'combo': m.combo = Math.max(0, msg.v | 0); break;
    case 'finish':
      if (msg.round !== room.round || !m.in || m.done) return;
      Object.assign(m, {
        done: true, score: msg.score | 0, raw: msg.raw | 0, max_combo: msg.max_combo | 0,
        fc: !!msg.fc, ap: !!msg.ap, combo: msg.combo | 0,
      });
      break;
    case 'leave':
      net.conns.get(id)?.close();
      net.conns.delete(id);
      room.members = room.members.filter((x) => x.id !== id);
      break;
    default: return;
  }
  broadcast();
}

// --- 参加者側 ---
function clientListen(conn) {
  conn.on('data', (msg) => {
    if (!msg || typeof msg !== 'object' || !net || net.conn !== conn) return;
    if (msg.t === 'state') {
      room = { ...msg.room, me: net.id };
      onRoomUpdate();
    } else if (msg.t === 'pong') {
      // 往復が一番短かったときの値を使う(いちばん正確)
      const now = Date.now(), rtt = now - msg.c;
      if (rtt <= bestRtt * 1.2) { bestRtt = Math.min(bestRtt, rtt); clockOff = msg.h - (msg.c + now) / 2; }
    }
  });
  conn.on('close', () => {
    if (!net || net.conn !== conn) return;
    closeNet();
    room = null;
    ui.toast(ERR.CLOSED, 3500);
    if (mode === 'room' && ui.current() === 'live') { mode = 'lobby'; renderView(); }
    else if (mode === 'result') renderResult();
  });
}
function ping() { if (net?.conn?.open) net.conn.send({ t: 'ping', c: Date.now() }); }

// ルームの状態が届いた(ホストは自分で変えた)ときの処理
function onRoomUpdate() {
  if (!room) return;
  // 音源の準備ができたかどうかをホストに知らせる
  const m = me();
  if (m && m.ready !== isReady()) send({ t: 'ready', v: isReady() });
  if (mode === 'room') {
    if (ui.current() === 'live') { prepare(); renderRoom(); }
    checkStart();
  } else if (mode === 'result') {
    renderResult();
    // ホストが次の曲を始めたら、リザルトからそのままルームへ
    if (ui.current() === 'result' && room.status === 'play' && room.round > playedRound) backToRoom();
  }
}

// ---------------------------------------------------------------------------
// ロビー
// ---------------------------------------------------------------------------
export function openLive() {
  if (!acc.isLoggedIn()) { ui.toast('みんなでライブはログインすると遊べます'); ui.openAccount(); return; }
  ui.show('live');
  if (room) { mode = 'room'; renderView(); renderRoom(); return; }
  mode = 'lobby';
  renderView();
  loadPeerJs().catch(() => {}); // 先に読み込んでおく
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
  $('live-create').disabled = true;
  try {
    let peer = null, code = '';
    for (let k = 0; k < 4 && !peer; k++) {
      code = randomCode();
      try { peer = await openPeer(ID_PREFIX + code); } catch (err) { if (err.message !== 'TAKEN') throw err; }
    }
    if (!peer) throw new Error('NET');
    net = { peer, host: true, id: peer.id, conns: new Map() };
    clockOff = 0;
    peer.on('connection', hostAccept);
    peer.on('disconnected', () => { try { peer.reconnect(); } catch { /* noop */ } }); // 仲介サーバーとだけ切れた(つながっている人とは続く)
    room = {
      id: code, code, host: peer.id, me: peer.id, song: e.id, diff: ui.diff(), status: 'wait', round: 0, start_at: 0,
      members: [newMember(peer.id, myName(), ui.diff())],
    };
    playedRound = 0;
    enterRoom();
  } catch (err) { closeNet(); room = null; ui.toast(errText(err)); }
  finally { busy = false; $('live-create').disabled = false; }
}

async function joinRoom(code) {
  code = String(code || '').trim().toUpperCase();
  if (!code || busy) return;
  busy = true;
  try {
    const peer = await openPeer();
    net = { peer, host: false, id: peer.id, conn: null };
    bestRtt = Infinity; clockOff = 0;
    const conn = peer.connect(ID_PREFIX + code, { reliable: true });
    net.conn = conn;
    // ホストとつながって、最初の状態が届くまで待つ
    await new Promise((res, rej) => {
      const to = setTimeout(() => rej(new Error('NO_ROOM')), 12000);
      peer.on('error', (e) => { clearTimeout(to); rej(new Error(e.type === 'peer-unavailable' ? 'NO_ROOM' : 'NET')); });
      conn.on('open', () => conn.send({ t: 'hello', name: myName(), diff: ui.diff() }));
      conn.on('data', (msg) => {
        if (msg?.t === 'err') { clearTimeout(to); rej(new Error(msg.e)); }
        if (msg?.t === 'state') { clearTimeout(to); room = { ...msg.room, me: peer.id }; res(); }
      });
    });
    clientListen(conn);
    // 時計合わせ: 最初に何回か、その後も時々
    for (let i = 0; i < 5; i++) setTimeout(ping, i * 250);
    pingTimer = setInterval(ping, 5000);
    playedRound = room.status === 'play' ? room.round : 0; // ライブ中に入ったら次の曲から
    enterRoom();
  } catch (err) { closeNet(); room = null; ui.toast(errText(err)); }
  finally { busy = false; }
}

function enterRoom() {
  mode = 'room';
  pick.key = '';
  renderView();
  prepare();
  renderRoom();
  if (isHost()) broadcast(); else onRoomUpdate();
}

function leaveRoom() {
  closeNet();
  room = null; mode = 'lobby'; playedRound = 0;
  renderView();
}

// ---------------------------------------------------------------------------
// ルーム(待機)
// ---------------------------------------------------------------------------
function prepare() {
  const e = entryOf(room?.song);
  if (e && !e.buffer && !e.rendering) e.load().then(() => { if (room) onRoomUpdate(); }).catch(() => {});
}
const isReady = () => !!entryOf(room?.song)?.buffer;

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
  $('live-count').textContent = `${room.members.length}/${MAX_MEMBERS}`;
  // スタート
  const btn = $('live-start');
  const anyPlaying = playing && room.members.some((m) => m.in && !m.done);
  const notReady = room.members.filter((m) => !m.ready).length;
  btn.hidden = !host;
  btn.disabled = anyPlaying || !isReady();
  btn.innerHTML = anyPlaying ? 'ライブ中…' : !isReady() ? '音源を準備中…' : notReady ? `スタート <small>(準備中 ${notReady}人)</small>` : 'ライブ スタート!';
  $('live-msg').textContent =
    anyPlaying ? (me()?.in ? '' : '次の曲から参加できます。終わるまで待っていてね') :
    host ? (room.members.length < 2 ? 'ルームコードを友だちに教えて呼ぼう。1人でもスタートできます(このページを閉じるとルームは解散します)' : '全員そろったらスタート!') :
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

// 状態が届くたびに作り直すとスクロールがずれるので、条件が変わったときだけ描き直す
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
      ${jacketImg(e, 128, 'sc-jacket')}<div class="sc-text"><span class="sc-fav${fav ? ' on' : ''}" title="${fav ? 'お気に入りから外す' : 'お気に入りにする'}">${fav ? '★' : '☆'}</span>
      <div class="sc-title">${ui.esc(e.title)}</div><div class="sc-sub">${ui.esc(e.genre)} ・ BPM ${Math.round(e.bpm)}</div></div><div class="sc-lv">${lv}</div></button>`;
  }).join('') : '<p class="list-empty">条件に合う曲がありません</p>';
  if (songChanged) $('live-list').querySelector('.song-card.sel')?.scrollIntoView({ block: 'nearest' });
}

const diffTag = (d) => `<i class="lm-diff" style="--dc:${ui.diffColor[d] || '#fff'}">${String(d || '').toUpperCase()}${entryOf(room?.song) ? ' ' + entryOf(room.song).levels[d] : ''}</i>`;

function setMyDiff(d) {
  const m = me();
  if (!room || !m || m.diff === d) return;
  m.diff = d; // 先に見た目だけ変える
  renderRoom();
  send({ t: 'diff', d });
}

// 曲を変える(ホストだけ)。みんな新しい曲の準備からやり直し
function configRoom(song) {
  if (!isHost() || room.status === 'play' && room.members.some((m) => m.in && !m.done)) return;
  room.song = song;
  for (const m of room.members) m.ready = false;
  prepare();
  broadcast();
}

function startRound() {
  if (!isHost() || room.members.some((m) => m.in && !m.done) && room.status === 'play') return;
  room.round++;
  room.status = 'play';
  room.start_at = Date.now();
  for (const m of room.members) Object.assign(m, { in: true, done: false, combo: 0, score: null, raw: null, max_combo: null, fc: false, ap: false });
  broadcast();
}

// 開始の合図が来たらすぐ読み込みに入り、曲の頭は全員「ホストの開始時刻 + LEAD_MS」にそろえる
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
  liveGame = { round, entry: e, diff, getCombo: () => 0 };
  liveHooks.syncAt = performance.now() + (room.start_at + LEAD_MS - hostNow());
  ui.startLive(e, diff, liveHooks);
  // 自分のコンボを送る(変わったときだけ)
  let last = -1;
  clearInterval(comboTimer);
  comboTimer = setInterval(() => {
    if (mode !== 'game' || !liveGame) { clearInterval(comboTimer); return; }
    const v = liveGame.getCombo();
    if (v !== last) { last = v; send({ t: 'combo', v }); }
  }, COMBO_MS);
}

// ---------------------------------------------------------------------------
// プレイ中
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

function finishRound(r) {
  mode = 'result';
  clearInterval(comboTimer);
  const round = liveGame.round;
  liveGame.game = null;
  send({ t: 'finish', round, score: r.teamScore, raw: r.score, max_combo: r.tMaxCombo ?? r.maxCombo, fc: r.fc, ap: r.ap, combo: liveGame.getCombo?.() || 0 });
  renderResult();
}

// 途中でやめた: その時点のスコアで終わったことにしてルームへ
function quitRound() {
  const g = liveGame?.game;
  clearInterval(comboTimer);
  if (g && room) send({ t: 'finish', round: liveGame.round, score: g.teamScore, raw: g.score, max_combo: g.tMaxCombo, fc: false, ap: false, combo: g.tCombo });
  backToRoom();
}

function renderResult() {
  const box = $('r-live');
  if (!box) return;
  if (!room) { box.innerHTML = `<div class="lv-head"><b>LIVE RESULT</b><span>${ERR.CLOSED}</span></div>`; return; }
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
  clearInterval(comboTimer);
  pick.key = ''; // 記録(FC など)が変わっているかもしれない
  if (!room) { openLive(); return; }
  mode = 'room';
  ui.show('live');
  renderView();
  renderRoom();
  onRoomUpdate();
}

export const inRoom = () => !!room;

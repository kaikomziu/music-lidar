// みんなでライブ: 同じ曲を同時にプレイ。プレイ中はみんなのコンボがほぼリアルタイムで届き、最後は編成込みスコアで競う
// 通信は WebRTC(ブラウザどうしの直接通信)。ルームを作った人(ホスト)のブラウザがルームの状態を持ち、
// 参加した人はホストとだけつながる。最初につながるための仲介(シグナリング)だけ PeerJS の公開サーバーを使う。
// (対戦のデータはサーバーに置かないので、ルームはホストがいる間だけ。ホストが抜けると解散)
// 人数が多いとき(SFU_AT 人以上)は Daily.co の SFU に切り替えられる(今は無効。8人までブラウザどうし)。ホストが全員へ配る負担をサーバーに任せる
// (最初のつながり=あいさつは PeerJS のまま。ルームの状態に Daily の部屋が書かれたら、各自そちらへ移る)
// Supabase には「公開中のルーム一覧」(コード・曲・人数・状態)だけを載せる。ホストが20秒ごとに更新し、来なくなれば消える
import { jacketImg } from './jacket.js';
import { mvTag } from './mv.js';
import { load } from './storage.js';
import { eventActive } from './event.js';
import * as acc from './account.js';

const $ = (id) => document.getElementById(id);
const LEAD_MS = 4000; // スタートの合図から曲の頭までの時間(全員この時刻に曲が始まる)
const MAX_MEMBERS = 8; // 1ルームの上限(SFU を使う場合は 16 などに上げる)
const P2P_MAX = 8; // SFU が使えないとき(ブラウザどうしだけ)の上限
const SFU_AT = Infinity; // この人数以上で SFU(Daily.co)へ切り替える。今は使わない(Daily は支払い方法の登録が必要)。使うなら 5 などに
const DAILY_SRC = 'https://unpkg.com/@daily-co/daily-js';
const DAILY_FN = 'https://kifnzvktwbomxthzvvgy.supabase.co/functions/v1/mlidar-daily';
const COMBO_MS = 500; // プレイ中にコンボを送る間隔
const ALIVE_MS = 5000; // 生存確認(ping)の間隔
const DEAD_MS = 16000; // これだけ何も届かなければ切れたとみなす
const LOBBY_MS = 20000; // ホストが部屋一覧を更新する間隔
const LIST_MS = 10000; // ロビーで一覧を読み直す間隔
const PEER_SRC = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
const ID_PREFIX = 'mlidar-live-'; // ホストの接続ID = これ + ルームコード
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 見間違えやすい 0/O・1/I/L は使わない
const PEER_OPTS = { config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] } };
const ERR = {
  NO_ROOM: 'ルームが見つかりません(解散したか、コードが違います)', ROOM_FULL: 'ルームが満員です',
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
let comboTimer = 0, pingTimer = 0, castTimer = 0, cbTimer = 0, aliveTimer = 0;
let lastHeard = 0;
let sfu = null; // SFU(Daily.co)の通話 { call, peers: Map(Daily のID → メンバーID)(ホスト) }
let sfuTrying = false, sfuFailed = false;
let reportedRound = 0;
let lobbyTimer = 0, listTimer = 0, lobbyKey = ''; // 部屋一覧(Supabase)の掲示・読み込み // 参加者: 最後にホストから何か届いた時刻

const hostNow = () => Date.now() + clockOff;
const entryOf = (id) => ui.entries.find((e) => e.id === id && !e.local);
const me = () => room?.members.find((m) => m.id === room.me);
const isHost = () => !!(room && net?.host);
const myName = () => acc.getState()?.name || load('name', '') || 'ゲスト';

export function initLive(api) {
  ui = api;
  $('btn-live').addEventListener('click', openLive);
  $('live-create').addEventListener('click', () => createRoom());
  $('live-join-form').addEventListener('submit', (ev) => { ev.preventDefault(); joinRoom($('live-code').value); });
  $('live-leave').addEventListener('click', leaveRoom);
  $('live-reload').addEventListener('click', () => loadRooms());
  $('live-rooms').addEventListener('click', (ev) => { const b = ev.target.closest('[data-code]'); if (b) joinRoom(b.dataset.code); });
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
  // 招待リンク(?room=CODE)。開いた人はそのままこのルームに入る
  $('live-link').addEventListener('click', async () => {
    const url = roomUrl(room.code), text = `MUSIC LiDAR で一緒にライブしよう!ルームコード ${room.code}`;
    try {
      if (navigator.share && document.body.classList.contains('touch')) { await navigator.share({ text, url }); return; }
      await navigator.clipboard.writeText(`${text}
${url}`);
      ui.toast('招待リンクをコピーしました。送った相手はリンクを開くだけでこのルームに入れます', 4500);
    } catch (e) { if (e?.name !== 'AbortError') prompt('このリンクを送ってください', url); }
  });
  $('live-x').addEventListener('click', () => {
    const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`MUSIC LiDAR で一緒にライブしよう!ルームコード ${room.code}`)}&url=${encodeURIComponent(roomUrl(room.code))}&hashtags=MUSICLiDAR`;
    window.open(u, '_blank', 'noopener,width=600,height=520');
  });
  acc.onChange(() => { if (pendingRoom && acc.isLoggedIn()) { const c = pendingRoom; pendingRoom = ''; joinFromLink(c); } });
  $('live-back').addEventListener('click', () => { closeNet(); room = null; mode = 'off'; ui.back(); });
  window.addEventListener('pagehide', () => closeNet()); // ページを閉じたら抜ける
}

const roomUrl = (code) => `https://music-lidar.com/?room=${encodeURIComponent(code)}`;
let pendingRoom = '';
// 招待リンクから: ログインしていなければログインのあとで入る
export async function joinFromLink(code) {
  code = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  if (!code) return;
  if (!acc.isLoggedIn()) {
    pendingRoom = code;
    ui.toast(`ルーム ${code} に招待されています。ログインすると、そのまま入れます`, 6000);
    ui.openAccount();
    return;
  }
  openLive();
  if (room) return;
  if (await joinRoom(code)) ui.toast(`ルーム ${code} に入りました`);
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
  clearInterval(comboTimer); clearInterval(pingTimer); clearTimeout(castTimer); clearTimeout(cbTimer); clearInterval(aliveTimer);
  comboTimer = pingTimer = castTimer = cbTimer = aliveTimer = 0;
  const s = sfu;
  sfu = null; sfuFailed = false;
  if (!net) { endCall(s?.call); return; }
  const n = net;
  if (n.host) unpublish();
  net = null;
  try { if (!n.host) n.conn?.send({ t: 'leave' }); } catch { /* noop */ }
  setTimeout(() => { n.peer.destroy(); endCall(s?.call); }, 100); // 「抜けます」を送り切ってから閉じる
}

// 自分の操作をホストへ(ホスト自身は直接処理する)
function send(msg) {
  if (!net) return;
  if (net.host) hostHandle(room.me, msg);
  else if (net.conn?.open) net.conn.send(msg);
}

// --- ホスト側 ---
// 選べる難易度(1.86.0 から EXTRA・INFERNO も)。曲に無い難易度を選んでいる人は、その曲では ui.diffFor で1つ下(INFERNO → EXTRA → HARD)を遊ぶ
const LIVE_DIFFS = ['easy', 'normal', 'hard', 'extra', 'inferno'];
const newMember = (id, name, diff) => ({
  id, name: String(name || 'ゲスト').slice(0, 16), diff: LIVE_DIFFS.includes(diff) ? diff : 'normal',
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
    clearTimeout(cbTimer); cbTimer = 0; // 全体の状態にコンボも入っているので別送はいらない
    toAll({ t: 'state', room: pack(room) });
    onRoomUpdate();
    publish();
    if (room.members.length >= SFU_AT) upgradeSfu();
  }, 60);
}

// コンボだけが変わったときは、ルーム全体ではなく「ID → コンボ」だけを配る(通信量を大きく減らす)
function castCombos() {
  if (!net?.host || castTimer || cbTimer) return;
  cbTimer = setTimeout(() => {
    cbTimer = 0;
    if (!net?.host || !room) return;
    toAll({ t: 'cb', c: Object.fromEntries(room.members.filter((m) => m.in && !m.done).map((m) => [m.id, m.combo])) });
    onCombos();
  }, COMBO_MS / 2);
}

function hostAccept(conn) {
  conn.on('data', (msg) => {
    if (!msg || typeof msg !== 'object') return;
    conn.seen = Date.now();
    if (msg.t === 'hello') {
      if (room.members.length >= (room.cap || (room.sfu ? MAX_MEMBERS : P2P_MAX))) { conn.send({ t: 'err', e: 'ROOM_FULL' }); setTimeout(() => conn.close(), 300); return; }
      net.conns.set(conn.peer, conn);
      if (!room.members.some((m) => m.id === conn.peer)) room.members.push(newMember(conn.peer, msg.name, room.match ? room.diff : msg.diff));
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
      if (room.match) return; // 1対1は同じ難易度で勝負
      if (room.status === 'play' && m.in && !m.done) return; // プレイ中は変えられない
      if (LIVE_DIFFS.includes(msg.d)) m.diff = msg.d;
      break;
    case 'combo': m.combo = Math.max(0, msg.v | 0); castCombos(); return;
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

// 全員へ送る。SFU に移った人の分は Daily で1回だけ('*' = 全員)、まだの人には直接
function toAll(data) {
  let viaSfu = false;
  for (const c of net.conns.values()) { if (c.sfu) viaSfu = true; else if (c.open) c.send(data); }
  if (viaSfu && sfu) sfu.call.sendAppMessage(data, '*');
}

// 送る量を減らす(Daily の1通は 4KB まで): 初期値(null・false・0)の項目は省き、受け取った側で補う
const pack = (r) => ({ ...r, me: undefined, members: r.members.map((m) => Object.fromEntries(Object.entries(m).filter(([, v]) => v !== null && v !== false && v !== 0))) });
const unpack = (r, meId) => ({ ...r, me: meId, members: r.members.map((m) => ({ ...newMember(m.id, m.name, m.diff), ...m })) });

// ---------------------------------------------------------------------------
// SFU(Daily.co)。映像・音声は使わず、データ(app message)だけ
// ---------------------------------------------------------------------------
function loadDaily() {
  if (window.DailyIframe) return Promise.resolve();
  return (loadDaily.p ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = DAILY_SRC; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = () => res();
    s.onerror = () => { loadDaily.p = null; s.remove(); rej(new Error('NET')); };
    document.head.appendChild(s);
  }));
}

// Daily の部屋を作る(create)/入るためのトークンをもらう(join)。APIキーはサーバー側(Edge Function)にだけある
async function sfuTicket(action, roomName) {
  const res = await fetch(DAILY_FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: acc.getToken(), action, room: roomName }) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.url) throw new Error(j.error || 'SFU');
  return j;
}

async function joinDaily(ticket) {
  await loadDaily();
  const call = window.DailyIframe.createCallObject({ videoSource: false, audioSource: false, subscribeToTracksAutomatically: false });
  call.on('error', (ev) => console.warn('Daily:', ev?.errorMsg)); // 受け手がないと Daily が余計なエラーを出すので受けておく
  try { await call.join({ url: ticket.url, token: ticket.token, startVideoOff: true, startAudioOff: true }); }
  catch (e) { endCall(call); throw e; }
  return call;
}

function endCall(call) {
  if (!call) return;
  Promise.resolve().then(() => call.leave()).catch(() => {}).finally(() => { try { call.destroy(); } catch { /* noop */ } });
}

// ホスト: 人数が増えたら Daily の部屋を作って移る。失敗したらブラウザどうしのまま(上限 8人)
async function upgradeSfu() {
  if (!net?.host || !room || room.sfu || sfuTrying || sfuFailed) return;
  sfuTrying = true;
  const myNet = net;
  try {
    const ticket = await sfuTicket('create');
    const call = await joinDaily(ticket);
    if (net !== myNet || !room) { endCall(call); return; }
    sfu = { call, peers: new Map() };
    call.on('app-message', (ev) => hostSfuMsg(ev.fromId, ev.data));
    call.on('participant-left', (ev) => {
      const id = sfu?.peers.get(ev.participant.session_id);
      if (id && net?.host) hostDrop(id, net.conns.get(id));
    });
    room.sfu = { room: ticket.room, host: call.participants().local.session_id };
    broadcast();
  } catch (e) {
    console.warn('SFU に切り替えられませんでした', e);
    if (net === myNet && room) { sfuFailed = true; room.cap = P2P_MAX; broadcast(); }
  } finally { sfuTrying = false; }
}

// ホスト: Daily で届いたメッセージ。最初の 'hi' で「どのメンバーか」を覚え、以後はその人の接続を Daily に差し替える
function hostSfuMsg(from, msg) {
  if (!net?.host || !sfu || !msg || typeof msg !== 'object') return;
  if (msg.t === 'hi') {
    const id = String(msg.id || '');
    if (!room.members.some((m) => m.id === id)) return;
    sfu.peers.set(from, id);
    const call = sfu.call;
    const conn = { peer: id, open: true, sfu: true, seen: Date.now(), send: (m) => call.sendAppMessage(m, from), close() {} };
    const old = net.conns.get(id);
    net.conns.set(id, conn);
    try { old?.close(); } catch { /* noop */ } // 直接の接続はもう使わない(差し替え済みなので抜けた扱いにはならない)
    broadcast(); // 移る間に届かなかったかもしれないので、最新の状態を送り直す
    return;
  }
  const id = sfu.peers.get(from);
  const conn = id && net.conns.get(id);
  if (!conn?.sfu) return;
  conn.seen = Date.now();
  hostHandle(id, msg, conn);
}

// 参加者: ルームの状態に Daily の部屋が書かれたら移る。失敗したら直接つながったまま続ける
async function clientSfu(info) {
  if (!net || net.host || sfu || sfuTrying || sfuFailed) return;
  sfuTrying = true;
  const myNet = net;
  try {
    const call = await joinDaily(await sfuTicket('join', info.room));
    if (net !== myNet || room?.sfu?.room !== info.room) { endCall(call); return; }
    sfu = { call };
    const conn = { open: true, sfu: true, send: (m) => call.sendAppMessage(m, info.host), close() {} };
    call.on('app-message', (ev) => { if (ev.fromId === info.host) clientMsg(conn, ev.data); });
    call.on('participant-left', (ev) => { if (ev.participant.session_id === info.host && net?.conn === conn) lostHost(); });
    call.on('left-meeting', () => { if (net?.conn === conn) lostHost(); });
    call.sendAppMessage({ t: 'hi', id: net.id }, info.host);
    net.conn = conn; // 直接の接続はホストが閉じる
  } catch (e) {
    console.warn('SFU に移れませんでした(直接つながったまま続けます)', e);
    if (net === myNet) sfuFailed = true;
  } finally { sfuTrying = false; }
}

// --- 部屋一覧への掲示(ホストだけ)。人数・曲・状態が変わったときと、20秒ごとの生存報告 ---
function publish(force = false) {
  if (!net?.host || !room || room.match) return;
  const playing = room.status === 'play' && room.members.some((m) => m.in && !m.done);
  const key = [room.song, room.members.length, playing].join('|');
  if (!force && key === lobbyKey) return;
  lobbyKey = key;
  acc.lobbyPut(room.code, room.song, room.members.length, playing ? 'play' : 'wait').catch(() => {});
  clearTimeout(lobbyTimer);
  lobbyTimer = setTimeout(() => publish(true), LOBBY_MS);
}
function unpublish() {
  clearTimeout(lobbyTimer); lobbyTimer = 0; lobbyKey = '';
  if (room?.code) acc.lobbyClose(room.code);
}

// --- 参加者側 ---
function clientListen(conn) {
  conn.on('data', (msg) => clientMsg(conn, msg));
  conn.on('close', () => { if (net?.conn === conn) lostHost(); });
}

// ホストから届いたメッセージ(直接でも Daily でも同じ)
function clientMsg(conn, msg) {
  {
    if (!msg || typeof msg !== 'object' || !net || net.conn !== conn) return;
    lastHeard = Date.now();
    if (msg.t === 'state') {
      room = unpack(msg.room, net.id);
      onRoomUpdate();
    } else if (msg.t === 'cb') {
      for (const m of room?.members || []) if (m.id in msg.c && m.id !== room.me) m.combo = msg.c[m.id] | 0;
      onCombos();
    } else if (msg.t === 'pong') {
      // 往復が一番短かったときの値を使う(いちばん正確)
      const now = Date.now(), rtt = now - msg.c;
      if (rtt <= bestRtt * 1.2) { bestRtt = Math.min(bestRtt, rtt); clockOff = msg.h - (msg.c + now) / 2; }
    }
  }
}

// ホストとの接続が切れた(閉じた・黙って消えた)
function lostHost() {
  closeNet();
  room = null;
  ui.toast(ERR.CLOSED, 3500);
  if (mode === 'room' && ui.current() === 'live') { mode = 'lobby'; renderView(); loadRooms(); }
  else if (mode === 'result') renderResult();
}

function ping() {
  if (!net?.conn) return;
  if (Date.now() - lastHeard > DEAD_MS) { lostHost(); return; } // 返事がない = 切れている
  if (net.conn.open) net.conn.send({ t: 'ping', c: Date.now() });
}

// ホスト: しばらく何も送ってこない参加者は外す(回線が切れても close が来ないことがある)
function sweepDead() {
  if (!net?.host) return;
  const now = Date.now();
  for (const [id, c] of net.conns) if (now - (c.seen || 0) > DEAD_MS) { c.close(); hostDrop(id, c); }
}

// コンボだけ届いたとき: 見えている所だけ描き直す(プレイ中の画面は毎フレーム rivals() を読む)
function onCombos() {
  if (mode === 'room' && ui.current() === 'live') renderRoom();
  else if (mode === 'result') renderResult();
}

// ルームの状態が届いた(ホストは自分で変えた)ときの処理
function onRoomUpdate() {
  if (!room) return;
  // 音源の準備ができたかどうかをホストに知らせる
  const m = me();
  if (m && m.ready !== isReady()) send({ t: 'ready', v: isReady() });
  if (room.sfu && !isHost()) clientSfu(room.sfu);
  if (mode === 'room') {
    if (ui.current() === 'live') { prepare(); renderRoom(); }
    matchAutoStart();
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
  loadRooms();
  loadPeerJs().catch(() => {}); // 先に読み込んでおく
}

// 公開中のルーム一覧(Supabase から読むだけ。参加は WebRTC でホストへ直接つなぐ)
async function loadRooms() {
  clearTimeout(listTimer); listTimer = 0;
  if (mode !== 'lobby' || ui.current() !== 'live') return;
  const box = $('live-rooms');
  try {
    const list = await acc.lobbyList();
    if (mode !== 'lobby') return;
    box.innerHTML = list.length ? list.map((r) => {
      const e = entryOf(r.song);
      const full = r.n >= MAX_MEMBERS;
      return `<li><button class="live-room" data-code="${ui.esc(r.code)}" ${full ? 'disabled' : ''}>
        ${e ? jacketImg(e, 128, '') : '<i></i>'}
        <span class="lr-main"><b>${ui.esc(e?.title || r.song || '曲を選び中')}</b><small>CODE ${ui.esc(r.code)}</small></span>
        <span class="lr-host">${ui.esc(r.host || '')}</span><span class="lr-n">${r.n}/${MAX_MEMBERS}</span>
        <span class="lr-st ${r.status === 'play' ? 'play' : ''}">${full ? '満員' : r.status === 'play' ? 'ライブ中' : '募集中'}</span></button></li>`;
    }).join('') : '<li class="empty">いま公開中のルームはありません。「ルームを作る」で作れます</li>';
  } catch { box.innerHTML = '<li class="empty">一覧を読み込めませんでした(ルームコードでは参加できます)</li>'; }
  listTimer = setTimeout(loadRooms, LIST_MS);
}

function renderView() {
  $('live-lobby').hidden = !!room;
  $('live-roombox').hidden = !room;
}

// opts.match: ランダムマッチ用の1対1ルーム(一覧に出さない・曲と難易度はホストが決めて固定・そろったら自動スタート)
async function createRoom(opts = {}) {
  if (busy) return null;
  const cur = ui.selected();
  const e = (opts.song && entryOf(opts.song)) || (cur && !cur.local ? cur : ui.entries.find((x) => !x.local));
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
    aliveTimer = setInterval(sweepDead, ALIVE_MS);
    peer.on('disconnected', () => { try { peer.reconnect(); } catch { /* noop */ } }); // 仲介サーバーとだけ切れた(つながっている人とは続く)
    const diff = opts.diff || ui.diff();
    room = {
      id: code, code, host: peer.id, me: peer.id, song: e.id, diff, status: 'wait', round: 0, start_at: 0,
      members: [newMember(peer.id, myName(), diff)],
      ...(opts.match ? { match: true, cap: 2 } : {}),
    };
    playedRound = 0;
    enterRoom();
    if (!room.match) publish(true);
    return code;
  } catch (err) { closeNet(); room = null; ui.toast(errText(err)); return null; }
  finally { busy = false; $('live-create').disabled = false; }
}

async function joinRoom(code) {
  code = String(code || '').trim().toUpperCase();
  if (!code || busy) return false;
  busy = true;
  try {
    const peer = await openPeer();
    net = { peer, host: false, id: peer.id, conn: null };
    bestRtt = Infinity; clockOff = 0;
    const conn = peer.connect(ID_PREFIX + code, { reliable: true });
    net.conn = conn;
    // ホストとつながって、最初の状態が届くまで待つ
    await new Promise((res, rej) => {
      const onErr = (e) => end(new Error(e.type === 'peer-unavailable' ? 'NO_ROOM' : 'NET'));
      const onOpen = () => conn.send({ t: 'hello', name: myName(), diff: ui.diff() });
      const onData = (msg) => {
        if (msg?.t === 'err') end(new Error(msg.e));
        if (msg?.t === 'state') { room = unpack(msg.room, peer.id); end(); }
      };
      const to = setTimeout(() => end(new Error('NO_ROOM')), 12000);
      // 待ち受け用のリスナーは終わったら外す(残すと同じ状態を二重に処理してしまう)
      function end(err) {
        clearTimeout(to);
        peer.off('error', onErr); conn.off('open', onOpen); conn.off('data', onData);
        err ? rej(err) : res();
      }
      peer.on('error', onErr); conn.on('open', onOpen); conn.on('data', onData);
    });
    lastHeard = Date.now();
    clientListen(conn);
    // 時計合わせ: 最初に何回か、その後も時々
    for (let i = 0; i < 5; i++) setTimeout(ping, i * 250);
    pingTimer = setInterval(ping, ALIVE_MS);
    playedRound = room.status === 'play' ? room.round : 0; // ライブ中に入ったら次の曲から
    enterRoom();
    return true;
  } catch (err) { closeNet(); room = null; ui.toast(errText(err)); return false; }
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
  loadRooms();
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
  $('live-genre').innerHTML = e ? `${ui.esc(e.genre)} ・ BPM ${Math.round(e.bpm)}${mvTag(e.id)}` : '';
  // 曲はホストだけが変えられる(左の曲リスト)。難易度は人ごとに選ぶ
  $('live-roombox').classList.toggle('host', host);
  $('live-pickmsg').textContent = host ? (room.status === 'play' ? 'ライブ中は曲を変えられません' : '曲リストから選べます') : '曲はホストが選びます';
  renderPick();
  const my = me();
  const lockDiff = room.match || room.status === 'play' && my?.in && !my.done;
  const myD = e && my ? ui.diffFor(e, my.diff) : my?.diff;
  $('live-diffs').innerHTML = (e ? ui.diffsOf(e) : ['easy', 'normal', 'hard']).map((d) =>
    `<button class="diff-btn ${d}${myD === d ? ' sel' : ''}" data-diff="${d}" ${lockDiff ? 'disabled' : ''}><div class="dn">${d.toUpperCase()}</div><div class="dl">${e ? e.levels[d] : '-'}</div><div class="dc">${e?.stats?.[d] ? e.stats[d].notes + ' notes' : ''}</div></button>`).join('');
  // メンバー
  const playing = room.status === 'play';
  $('live-members').innerHTML = room.members.map((m) => {
    let st;
    if (playing && m.in) st = m.done ? `<span class="lm-st done">${(m.score ?? 0).toLocaleString()}</span>` : `<span class="lm-st play">ライブ中 ${m.combo} COMBO</span>`;
    else st = m.ready ? '<span class="lm-st ok">READY</span>' : '<span class="lm-st wait">準備中…</span>';
    return `<li class="${m.id === room.me ? 'me' : ''}"><span class="lm-name">${m.id === room.host ? '<i class="lm-host">HOST</i>' : ''}${ui.esc(m.name)}</span>${diffTag(m.diff)}${st}</li>`;
  }).join('');
  $('live-count').textContent = `${room.members.length}/${room.cap || MAX_MEMBERS}${room.sfu ? ' ・ SFU' : ''}`;
  // スタート
  const btn = $('live-start');
  const anyPlaying = playing && room.members.some((m) => m.in && !m.done);
  const notReady = room.members.filter((m) => !m.ready).length;
  btn.hidden = !host;
  btn.disabled = anyPlaying || !isReady();
  btn.innerHTML = anyPlaying ? 'ライブ中…' : !isReady() ? '音源を準備中…' : notReady ? `スタート <small>(準備中 ${notReady}人)</small>` : 'ライブ スタート!';
  $('live-msg').textContent = room.match && room.round === 0 && !anyPlaying
    ? (room.members.length < 2 ? '対戦相手がルームに入るのを待っています…' : '2人そろいました。準備ができたら自動でスタートします')
    : anyPlaying ? (me()?.in ? '' : '次の曲から参加できます。終わるまで待っていてね') :
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
    const lv = e.levels[ui.diffFor(e, d)];
    if (pick.lv === '1-4' && lv > 4) return false;
    if (pick.lv === '5-9' && (lv < 5 || lv > 9)) return false;
    if (pick.lv === '10-' && lv < 10) return false;
    const b = ui.bestOf(e.id, ui.diffFor(e, d));
    if (pick.status === 'fav' && !ui.isFav(e)) return false;
    if (pick.status === 'new' && b) return false;
    if (pick.status === 'nofc' && b?.fc) return false;
    return true;
  });
  const by = {
    level: (a, b) => a.levels[ui.diffFor(a, d)] - b.levels[ui.diffFor(b, d)], 'level-desc': (a, b) => b.levels[ui.diffFor(b, d)] - a.levels[ui.diffFor(a, d)],
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
    const lv = ui.diffsOf(e).map((x) => {
      const b = ui.bestOf(e.id, x);
      const mark = b?.ap ? 'AP' : b?.fc ? 'FC' : '';
      return `<span class="lv ${x}">${e.levels[x]}${mark ? `<span class="mark">${mark}</span>` : ''}</span>`;
    }).join('');
    const fav = ui.isFav(e);
    return `<button class="song-card${e.id === room.song ? ' sel' : ''}" data-id="${ui.esc(e.id)}" style="--c:${e.color}">
      ${jacketImg(e, 128, 'sc-jacket')}<div class="sc-text"><span class="sc-fav${fav ? ' on' : ''}" title="${fav ? 'お気に入りから外す' : 'お気に入りにする'}">${fav ? '★' : '☆'}</span>
      <div class="sc-title">${ui.esc(e.title)}</div><div class="sc-sub">${ui.esc(e.genre)} ・ BPM ${Math.round(e.bpm)}${mvTag(e.id)}</div></div><div class="sc-lv">${lv}</div></button>`;
  }).join('') : '<p class="list-empty">条件に合う曲がありません</p>';
  if (songChanged) $('live-list').querySelector('.song-card.sel')?.scrollIntoView({ block: 'nearest' });
}

const diffTag = (d0) => {
  const e = entryOf(room?.song), d = e ? ui.diffFor(e, d0) : d0;
  return `<i class="lm-diff" style="--dc:${ui.diffColor[d] || '#fff'}">${String(d || '').toUpperCase()}${e ? ' ' + e.levels[d] : ''}</i>`;
};

// 1対1: 2人そろって準備ができたら、少し待って自動でスタート(最初の1曲だけ。2曲目からはホストが押す)
let autoTimer = 0;
function matchAutoStart() {
  const ok = isHost() && room?.match && room.round === 0 && room.status === 'wait' && room.members.length === 2 && room.members.every((m) => m.ready);
  if (ok && !autoTimer) autoTimer = setTimeout(() => { autoTimer = 0; if (isHost() && room?.match && room.round === 0 && room.members.length === 2) startRound(); }, 2500);
  if (!ok && autoTimer) { clearTimeout(autoTimer); autoTimer = 0; }
}

function setMyDiff(d) {
  const m = me();
  if (!room || !m || m.diff === d || room.match) return;
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
  const diff = ui.diffFor(e, m.diff || room.diff), round = room.round;
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
  if (room.match && !waiting && list.length === 2 && my?.done && reportedRound !== room.round) {
    reportedRound = room.round;
    const rival = list.find((m) => m.id !== room.me);
    ui.onMatchResult?.((my.score ?? 0) >= (rival?.score ?? 0), rival?.name || '');
  }
  const head = room.match && !waiting && list.length === 2 ? (myRank === 1 ? '🏆 対戦に勝ちました!' : '対戦に負けました…もう一戦!') : waiting ? `みんなの結果を待っています…(残り ${waiting}人)` :
    list.length < 2 ? 'ソロライブ' : myRank === 1 ? '🏆 あなたが1位!' : `あなたは ${myRank}位`;
  // バレンタインの期間に2人で遊んだら、2人の合計(ペアスコア)と相性を出す(対戦は除く)
  let pair = '';
  if (eventActive('valentine') && !room.match && list.length === 2 && !waiting) {
    const sum = list.reduce((t, m) => t + (m.score ?? 0), 0);
    const gap = Math.abs((list[0].score ?? 0) - (list[1].score ?? 0));
    const love = Math.max(1, Math.min(100, Math.round(100 - gap / 6000 + (sum > 1800000 ? 5 : 0))));
    pair = `<div class="lv-pair">💝 ペアスコア <b>${sum.toLocaleString()}</b> ・ 2人の相性 <b>${love}%</b></div>`;
  }
  box.innerHTML = `<div class="lv-head"><b>LIVE RESULT</b><span>${head}</span></div>${pair}
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
// 配信者モードで画面に出す参加コード(1対1のランダムマッチは出さない)
export const roomCode = () => (room && !room.match ? room.code : '');

// --- ランダムマッチ(match.js)から使う ---
export async function matchHost(song, diff) {
  if (room) leaveRoom();
  reportedRound = 0;
  ui.show('live');
  mode = 'room';
  return createRoom({ song, diff, match: true });
}
export async function matchJoin(code) {
  if (room) leaveRoom();
  reportedRound = 0;
  ui.show('live');
  mode = 'lobby';
  renderView();
  return joinRoom(code);
}
export const memberCount = () => room?.members.length || 0;
export function leaveMatch() { if (room?.match) leaveRoom(); }

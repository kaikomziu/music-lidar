// フレンド: 名前で申請 → 相手が承認するとフレンド。フレンドの一覧(オンラインかどうか・今いる画面)と、曲ごとのフレンドランキング
// サーバー: mlidar_friend_request / _respond / _remove / _list / _ranking(テーブル mlidar_friends)
import * as acc from './account.js';
import { rpc } from './ranking.js';

const $ = (id) => document.getElementById(id);
let ui = null; // { esc, toast, overlay, openAccount, openProfile, titleTag }
let cache = null; // { at, data }

// 今いる画面(mlidar_ping の place)の表示名
const PLACE = {
  title: 'タイトル', home: 'ホーム', select: '選曲中', game: 'プレイ中', result: 'リザルト', live: 'みんなでライブ', gacha: 'ガチャ',
  team: '編成', quest: 'クエスト', editor: '譜面メーカー', charts: 'みんなの譜面', dan: '段位道場', player: 'きくだけ', pass: 'シーズンパス',
};
const ERR = { FRIEND_NONE: 'その名前のプレイヤーが見つかりません', FRIEND_SELF: '自分には申請できません', FRIEND_MAX: 'フレンドは100人までです', FRIEND_MANY: '今日はもう申請できません(1日30件まで)' };

export function initFriends(api) {
  ui = api;
  const m = document.createElement('div');
  m.id = 'fr-modal';
  m.className = 'overlay modal';
  m.innerHTML = '<div class="modal-box fr-box hud" id="fr-box"></div>';
  document.body.appendChild(m);
  m.addEventListener('click', onClick);
  m.addEventListener('submit', onSubmit);
  acc.onChange((s) => { if (!s) cache = null; });
}

export async function friendList(force = false) {
  if (!acc.getToken()) return null;
  if (!force && cache && Date.now() - cache.at < 30000) return cache.data;
  const data = await rpc('mlidar_friend_list', { p_token: acc.getToken() });
  cache = { at: Date.now(), data };
  return data;
}

// ホームのボタンに「申請が届いている数」を出す
export async function refreshFriendBadge() {
  const el = $('fr-count');
  if (!el) return;
  try {
    const d = await friendList();
    const n = d?.incoming?.length || 0;
    el.textContent = n;
    el.hidden = !n;
  } catch { el.hidden = true; }
}

export async function openFriends() {
  if (!acc.getToken()) { ui.toast('フレンドはログインすると使えます'); ui.openAccount(); return; }
  $('fr-box').innerHTML = '<div class="panel-label"><span>FRIENDS</span></div><p class="muted">読み込み中…</p>';
  ui.overlay('fr-modal', true);
  render(await friendList(true).catch(() => null));
}

function render(d) {
  const esc = ui.esc;
  if (!d) { $('fr-box').innerHTML = '<div class="panel-label"><span>FRIENDS</span></div><p>読み込めませんでした</p><div class="modal-actions"><button class="btn-glow" data-close>閉じる</button></div>'; return; }
  const on = d.friends.filter((f) => f.online).length;
  const ago = (s) => { if (!s) return ''; const m = Math.round((Date.now() - new Date(s)) / 60000); return m < 60 ? `${m}分前` : m < 1440 ? `${Math.round(m / 60)}時間前` : `${Math.round(m / 1440)}日前`; };
  $('fr-box').innerHTML = `<div class="panel-label"><span>FRIENDS</span><span>${d.friends.length}人 ・ オンライン ${on}人</span></div>
    <h2>フレンド</h2>
    <form class="fr-add" data-fr-add><input id="fr-name" maxlength="24" placeholder="プレイヤーの名前" autocomplete="off"><button class="btn-glow small">申請する</button></form>
    <p class="muted small">ランキングの名前を押して開くプロフィールからも申請できます。フレンドになると、曲のランキングを「フレンド」に切り替えて比べられます</p>
    ${d.incoming.length ? `<h3 class="pf-h">届いた申請 <i class="fr-count">${d.incoming.length}</i></h3><ul class="fr-list">${d.incoming.map((n) => `<li><span class="nm" data-player="${esc(n)}">${esc(n)}</span><span class="fr-act"><button class="btn-glow small" data-ok="${esc(n)}">承認</button><button class="btn-line small" data-no="${esc(n)}">断る</button></span></li>`).join('')}</ul>` : ''}
    <h3 class="pf-h">フレンド</h3>
    <ul class="fr-list">${d.friends.map((f) => `<li class="${f.online ? 'on' : ''}"><i class="fr-dot" title="${f.online ? 'オンライン' : 'オフライン'}"></i>
      <span class="nm" data-player="${esc(f.name)}">${esc(f.name)}</span>${ui.titleTag(f.rate || 0)}
      <small class="muted">${f.online ? esc(PLACE[f.place] || 'オンライン') : ago(f.seen)}</small>
      <button class="ib-close" data-rm="${esc(f.name)}" title="フレンドを解除" aria-label="${esc(f.name)} さんとのフレンドを解除">✕</button></li>`).join('') || '<li class="empty">まだフレンドはいません。名前を入れて申請してみよう</li>'}</ul>
    ${d.outgoing.length ? `<h3 class="pf-h">送った申請(承認待ち)</h3><ul class="fr-list">${d.outgoing.map((n) => `<li><span class="nm" data-player="${esc(n)}">${esc(n)}</span><button class="btn-line small" data-cancel="${esc(n)}">取り消す</button></li>`).join('')}</ul>` : ''}
    <div class="modal-actions"><button class="btn-glow" data-close>閉じる</button></div>`;
}

export async function requestFriend(name) {
  try {
    const r = await rpc('mlidar_friend_request', { p_token: acc.getToken(), p_name: name });
    cache = null;
    ui.toast(r.status === 'ok' ? `${r.name} さんとフレンドになりました!` : `${r.name} さんにフレンド申請しました`);
    return r.status;
  } catch (e) { ui.toast(ERR[e.message] || acc.errText(e)); return null; }
}

async function act(fn, args, msg) {
  try { await rpc(fn, { p_token: acc.getToken(), ...args }); cache = null; if (msg) ui.toast(msg); render(await friendList(true)); refreshFriendBadge(); }
  catch (e) { ui.toast(acc.errText(e)); }
}

async function onClick(ev) {
  const t = ev.target;
  if (t === $('fr-modal') || t.closest('[data-close]')) { ui.overlay('fr-modal', false); return; }
  const b = t.closest('button');
  if (b?.dataset.ok) return act('mlidar_friend_respond', { p_name: b.dataset.ok, p_ok: true }, `${b.dataset.ok} さんとフレンドになりました!`);
  if (b?.dataset.no) return act('mlidar_friend_respond', { p_name: b.dataset.no, p_ok: false }, '申請を断りました');
  if (b?.dataset.cancel) return act('mlidar_friend_remove', { p_name: b.dataset.cancel }, '申請を取り消しました');
  if (b?.dataset.rm) { if (confirm(`${b.dataset.rm} さんとのフレンドを解除しますか？`)) act('mlidar_friend_remove', { p_name: b.dataset.rm }, 'フレンドを解除しました'); return; }
  const n = t.closest('.nm[data-player]');
  if (n) { ui.overlay('fr-modal', false); ui.openProfile(n.dataset.player); }
}

async function onSubmit(ev) {
  if (!ev.target.closest('[data-fr-add]')) return;
  ev.preventDefault();
  const v = $('fr-name').value.trim();
  if (!v) return;
  if (await requestFriend(v)) { render(await friendList(true)); refreshFriendBadge(); }
}

// 曲のフレンドランキング(ranking.js の fetchRanking と同じ形の行)
export function fetchFriendRanking(song, diff) {
  return rpc('mlidar_friend_ranking', { p_token: acc.getToken(), p_song: song, p_diff: diff });
}

export const closeFriends = () => ui && ui.overlay('fr-modal', false);

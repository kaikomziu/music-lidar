// ランダムマッチ(1対1): ルームコードなしで、レートの近い相手とすぐ対戦する
// 相手探しはサーバー(mlidar_match_poll)、見つかったら「みんなでライブ」の仕組み(WebRTC)で2人だけのルームを作って対戦
import * as acc from './account.js';
import { rpc } from './ranking.js';
import { matchHost, matchJoin, memberCount, leaveMatch } from './live.js';

const $ = (id) => document.getElementById(id);
const POLL_MS = 2000;
let ui = null; // { entries, toast, overlay, openAccount, rate(), esc, jacketURL }
let timer = 0, searching = false, hosting = null, joining = false, t0 = 0;

export function initMatch(api) {
  ui = api;
  $('btn-match').addEventListener('click', openMatch);
  $('match-cancel').addEventListener('click', cancelMatch);
}

export function openMatch() {
  if (!acc.isLoggedIn()) { ui.toast('ランダムマッチはログインすると遊べます'); ui.openAccount(); return; }
  if (searching) return;
  searching = true; hosting = null; joining = false; t0 = Date.now();
  status('対戦相手をさがしています…', `あなたのレート ${ui.rate().toFixed(2)} ・ 近いレートの人から順に探します`);
  ui.overlay('match-modal', true);
  poll();
}

function status(title, sub = '') {
  $('match-title').textContent = title;
  $('match-sub').textContent = sub;
}

// 相手の強さに合わせて、曲と難易度を決める(2人のレートの平均くらいのレベル)
function pickSong(avg) {
  const target = Math.max(1, Math.min(14, Math.round(avg)));
  const pool = [];
  for (const e of ui.entries) {
    if (e.local || !e.levels || !e.urlId) continue;
    for (const d of ['easy', 'normal', 'hard']) if (Math.abs(e.levels[d] - target) <= 1) pool.push({ e, d });
  }
  const easy = ui.entries.filter((e) => !e.local && e.levels && e.urlId).map((e) => ({ e, d: 'easy' }));
  const list = pool.length ? pool : easy;
  return list[Math.floor(Math.random() * list.length)];
}

async function poll() {
  clearTimeout(timer);
  if (!searching) return;
  let r;
  try {
    r = await rpc('mlidar_match_poll', { p_token: acc.getToken(), p_rate: ui.rate(), p_code: hosting?.code || null });
  } catch (e) { status('通信できませんでした', acc.errText(e)); timer = setTimeout(poll, POLL_MS * 2); return; }
  if (!searching) return;
  const waited = Math.round((Date.now() - t0) / 1000);
  if (r.status === 'wait') {
    if (hosting && memberCount() >= 2) { done(); return; } // 相手はもうルームに入った(相手が先に待ち行列から抜けた)
    if (hosting) { leaveMatch(); hosting = null; } // 相手がいなくなった
    status('対戦相手をさがしています…', `${waited}秒 ・ いま探している人 ${r.queue}人 ・ 時間がたつほど、レートの差が大きい相手とも組みます`);
  } else if (r.role === 'host') {
    // ホスト: 2人だけのルームを作り、コードをサーバーに置く。相手が入ってきたら待ち行列から抜ける
    if (!hosting) {
      const pk = pickSong(((ui.rate() + Number(r.rival_rate || 0)) / 2));
      status(`${r.rival} さんと対戦!`, `曲: ${pk.e.title}(${pk.d.toUpperCase()} ${pk.e.levels[pk.d]}) ・ ルームを準備中…`);
      hosting = { code: null, at: Date.now(), rival: r.rival };
      const code = await matchHost(pk.e.id, pk.d);
      if (!code) { hosting = null; status('ルームを作れませんでした', 'もう一度さがします'); }
      else hosting.code = code;
      ui.overlay('match-modal', true);
    } else if (memberCount() >= 2) {
      done();
      return;
    } else if (Date.now() - hosting.at > 25000) {
      // 相手が来なかった: ルームを閉じて探し直し
      leaveMatch(); hosting = null;
      await rpc('mlidar_match_cancel', { p_token: acc.getToken() }).catch(() => {});
      t0 = Date.now();
      status('相手がつながりませんでした', 'もう一度さがします…');
    } else status(`${hosting.rival} さんと対戦!`, '相手がルームに入るのを待っています…');
  } else if (r.role === 'guest') {
    status(`${r.rival} さんと対戦!`, r.code ? 'ルームに入っています…' : '相手がルームを準備しています…');
    if (r.code && !joining) {
      joining = true;
      const ok = await matchJoin(r.code);
      if (ok) { done(); return; }
      joining = false;
    }
  }
  timer = setTimeout(poll, POLL_MS);
}

function done() {
  searching = false;
  clearTimeout(timer);
  rpc('mlidar_match_cancel', { p_token: acc.getToken() }).catch(() => {});
  ui.overlay('match-modal', false);
  ui.toast('対戦相手とつながりました。準備ができたら自動でスタートします');
}

export function cancelMatch() {
  if (!searching) { ui.overlay('match-modal', false); return; }
  searching = false;
  clearTimeout(timer);
  if (hosting) { leaveMatch(); hosting = null; }
  rpc('mlidar_match_cancel', { p_token: acc.getToken() }, { keepalive: true }).catch(() => {});
  ui.overlay('match-modal', false);
}

// 対戦が終わったら勝ち負けを記録(コイン: 勝ち80・負け30)
export async function reportMatch(win) {
  try {
    acc.applyState(await rpc('mlidar_match_done', { p_token: acc.getToken(), p_win: win }));
    ui.toast(win ? '対戦に勝ちました! +80 コイン' : '対戦おつかれさま! +30 コイン');
  } catch { /* noop */ }
}
window.addEventListener('pagehide', () => { if (searching) cancelMatch(); });

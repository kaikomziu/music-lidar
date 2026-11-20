// 記念日のイベント(ホームのお知らせ)
// - お正月おみくじ(1/1〜1/7): 1日1回。ログイン中はサーバー mlidar_omikuji(大吉 500 コイン + 判定ライン「初日の出」/ 中吉 300 / 小吉 200 / 吉 100 / 末吉 50)。
//   ゲストは端末だけで引ける(報酬なし)。結果は 𝕏 でシェアできる
// - 周年記念ウィーク(10/17〜10/23。公開日 2026-10-17): プレイのコイン2倍(サーバーの mlidar_play_result_core)と、
//   記念プレゼント(年に1回: ノーツ「アニバーサリー」+ ガチャ1回。mlidar_anniv_gift)
// - 期間外に確かめたいときは ?event=newyear / anniv(戻すときは ?event=off)。サーバーの報酬は本当の期間だけ
import { rpc } from './ranking.js';
import { load, save } from './storage.js';
import * as acc from './account.js';
import { PREVIEW, eventActive } from './event.js';
import { postX } from './social.js';

const $ = (id) => document.getElementById(id);
const jstYear = () => new Date(Date.now() + 9 * 3600e3).getUTCFullYear();
const jstDate = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const LAUNCH_YEAR = 2026;
let ui = null; // { esc, toast, openAccount, showGiftGacha }

export function initSpecials(api) {
  ui = api;
  if (eventActive('newyear')) newYear();
  if (eventActive('anniv')) anniversary();
}

function banner(id, color, html, btn) {
  const main = $('home-main');
  if (!main || $(id)) return null;
  (($('season-banner') || main)).insertAdjacentHTML($('season-banner') ? 'afterend' : 'beforebegin',
    `<div class="season-banner" id="${id}" style="--sc:${color}"><div class="sb-text">${html}</div><button class="btn-glow" id="${id}-btn">${btn}</button></div>`);
  return $(id + '-btn');
}

// ---------------------------------------------------------------------------
// お正月おみくじ
// ---------------------------------------------------------------------------
const FORTUNE = { 大吉: '最高の一年!フルコンボも夢じゃない', 中吉: 'いい流れ。新しい曲に挑戦してみよう', 小吉: 'こつこつ練習が実を結ぶ年', 吉: '楽しく叩けば運も上向き', 末吉: 'あとからぐんぐん伸びる年' };
function newYear() {
  const b = banner('newyear-banner', '#ff7a3d', `<small>NEW YEAR ・ 1/1〜1/7</small><b>🎍 あけましておめでとう!おみくじを引こう</b><span>1日1回。ログインしていると、結果に合わせてコインがもらえます(大吉は限定の判定ライン「初日の出」も)</span>`, 'おみくじを引く');
  if (!b) return;
  b.addEventListener('click', drawOmikuji);
}
async function drawOmikuji() {
  let res, coins = 0, skin = null, already = false;
  if (acc.isLoggedIn()) {
    try {
      const r = await rpc('mlidar_omikuji', { p_token: acc.getToken() });
      if (r?.state) acc.applyState(r.state);
      res = r.result; coins = r.coins || 0; skin = r.skin; already = r.already;
    } catch (e) {
      if (e.message !== 'EVENT_CLOSED') { ui.toast('おみくじを引けませんでした'); return; }
      res = localDraw(); // 確認用の表示(期間外)では端末だけで引く
    }
  } else res = localDraw();
  showFortune(res, coins, skin, already);
}
function localDraw() {
  const o = load('omikuji', null);
  if (o?.date === jstDate()) return o.result;
  const r = Math.random();
  const result = r < 0.08 ? '大吉' : r < 0.25 ? '中吉' : r < 0.5 ? '小吉' : r < 0.82 ? '吉' : '末吉';
  save('omikuji', { date: jstDate(), result });
  return result;
}
function showFortune(res, coins, skin, already) {
  document.getElementById('omikuji-box')?.remove();
  const reward = already ? '今日はもう引きました。また明日!' : coins ? `◎ ${coins} コインをもらいました${skin ? '。限定の判定ライン「初日の出」も!' : ''}` : acc.isLoggedIn() ? '' : 'ログインして引くとコインがもらえます';
  document.body.insertAdjacentHTML('beforeend', `<div class="overlay modal on" id="omikuji-box"><div class="modal-box calib-box hud omikuji">
    <div class="panel-label"><span>OMIKUJI</span><span>${jstYear()}年のおみくじ</span></div>
    <div class="omk-paper"><small>MUSIC LiDAR みくじ</small><b class="omk-${res === '大吉' ? 'top' : 'n'}">${res}</b><p>${FORTUNE[res] || ''}</p></div>
    <p class="muted small">${ui.esc(reward)}</p>
    <div class="modal-actions"><button class="btn-line" id="omk-close">閉じる</button><button class="btn-line x-btn" id="omk-x">𝕏 でシェア</button></div>
  </div></div>`);
  $('omk-close').addEventListener('click', () => $('omikuji-box').remove());
  $('omk-x').addEventListener('click', () => postX(`${jstYear()}年の MUSIC LiDAR おみくじは「${res}」でした!${FORTUNE[res] || ''}`));
}

// ---------------------------------------------------------------------------
// 周年記念ウィーク
// ---------------------------------------------------------------------------
function anniversary() {
  const n = Math.max(1, jstYear() - LAUNCH_YEAR);
  const b = banner('anniv-banner', '#ffd76a', `<small>ANNIVERSARY ・ 10/17〜10/23</small><b>🎉 MUSIC LiDAR ${n}周年記念ウィーク!</b><span>期間中はプレイでもらえるコインが2倍。記念プレゼントでガチャ1回無料と、記念のノーツ「アニバーサリー」がもらえます(ログインが必要・1回だけ)</span>`, '記念プレゼントを受け取る');
  if (!b) return;
  b.addEventListener('click', async () => {
    if (!acc.isLoggedIn()) { ui.toast('記念プレゼントはログインすると受け取れます'); ui.openAccount?.(); return; }
    b.disabled = true;
    try {
      const r = await rpc('mlidar_anniv_gift', { p_token: acc.getToken() });
      if (r?.state) acc.applyState(r.state);
      ui.toast('🎉 記念のノーツ「アニバーサリー」をもらいました!ガチャの結果をどうぞ', 5000);
      ui.showGiftGacha?.(r.results);
      b.textContent = '受け取りました';
    } catch (e) {
      b.disabled = false;
      ui.toast(e.message === 'ALREADY' ? '記念プレゼントはもう受け取っています' : e.message === 'EVENT_CLOSED' ? '周年記念ウィーク(10/17〜10/23)の間だけ受け取れます' : '受け取れませんでした');
      if (e.message === 'ALREADY') { b.textContent = '受け取りました'; b.disabled = true; }
    }
  });
}
export const isPreview = () => !!PREVIEW;

// 七夕の願いごと(7/1〜7/7)。ホームの七夕イベントのお知らせの下に、みんなの短冊が流れる
// - 書けるのはログインした人だけ。1年に1つ(書き直すと確認待ちに戻る)
// - 管理者が管理者ページで「出す」にしたものだけ流れる(サーバー mlidar_wishes / mlidar_wish_*)
import { rpc } from './ranking.js';
import * as acc from './account.js';

const $ = (id) => document.getElementById(id);
const COLORS = ['#ff9ad5', '#9ae0ff', '#ffe27a', '#a8ff9a', '#c7a8ff'];

export async function initWishes(ui) {
  const banner = $('season-banner');
  if (!banner || $('tanzaku')) return;
  banner.insertAdjacentHTML('afterend', `<div class="tanzaku" id="tanzaku">
    <div class="tz-view"><div class="tz-track" id="tz-track"><span class="tz-empty">短冊を読み込み中…</span></div></div>
    <div class="tz-form"><input id="tz-input" maxlength="40" placeholder="🎋 願いごと(40文字まで)"><button class="btn-line small" id="tz-send">短冊を飾る</button><span class="muted small" id="tz-msg"></span></div>
  </div>`);
  const list = await rpc('mlidar_wish_list', {}).catch(() => []);
  const track = $('tz-track');
  if (!list?.length) track.innerHTML = '<span class="tz-empty">まだ短冊がありません。最初の願いごとを書いてみよう</span>';
  else {
    const cards = list.map((w, i) => `<span class="tz-card" style="--tc:${COLORS[i % COLORS.length]}"><b>${ui.esc(w.text)}</b><small>${ui.esc(w.name)}</small></span>`).join('');
    track.innerHTML = cards + cards; // 2回並べて途切れずに流す
    track.style.animationDuration = Math.max(20, list.length * 4) + 's';
  }
  const msg = $('tz-msg');
  if (acc.isLoggedIn()) {
    const mine = await rpc('mlidar_wish_mine', { p_token: acc.getToken() }).catch(() => null);
    if (mine) { $('tz-input').value = mine.text; msg.textContent = mine.status === 'ok' ? '飾られています' : mine.status === 'ng' ? '飾れませんでした。書き直せます' : '確認待ちです'; }
  } else msg.textContent = 'ログインすると書けます';
  $('tz-send').addEventListener('click', async () => {
    if (!acc.isLoggedIn()) { ui.toast('願いごとを書くにはログインしてください'); return; }
    const t = $('tz-input').value.trim();
    if (!t) { ui.toast('願いごとを書いてください'); return; }
    try {
      await rpc('mlidar_wish_post', { p_token: acc.getToken(), p_text: t });
      msg.textContent = '確認待ちです';
      ui.toast('🎋 短冊を飾りました。確認が済むと、みんなの画面に流れます', 4000);
    } catch (e) { ui.toast(e.message === 'EVENT_CLOSED' ? '七夕の期間(7/1〜7/7)だけ書けます' : '送れませんでした'); }
  });
}

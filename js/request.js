// お問い合わせ(リクエスト箱): 追加してほしい機能・曲・改善点・不具合を送る。送ったものの状態と運営からの返信も見られる
// 送り先はサーバー(Supabase RPC mlidar_request_*)。ログインしていなくても送れる(同じ端末から1時間に5件まで)
import { rpc } from './ranking.js';
import { load, clientId } from './storage.js';
import * as acc from './account.js';

const $ = (id) => document.getElementById(id);
export const KIND = { feature: '新しい機能', song: '曲のリクエスト', improve: '改善してほしい所', bug: '不具合の報告', other: 'その他' };
export const STATUS = { new: '受付', doing: '対応中', done: '対応済み', wont: '見送り' };
const ERR = { TOO_SHORT: '5文字以上で書いてください', TOO_LONG: '1000文字までで書いてください', TOO_MANY: '送りすぎです。しばらくしてからもう一度送ってください' };
const PLACEHOLDER = {
  feature: '例: 曲ごとにハイスピードを覚えてほしい / フレンドと記録をくらべたい',
  song: '例: こんなジャンル・雰囲気の曲がほしい / BPM200くらいの和風の曲',
  improve: '例: 選曲画面で、曲をもっと探しやすくしてほしい',
  bug: '例: どの画面で・何をしたら・どうなったか(使っている端末やブラウザも書いてもらえると助かります)',
  other: '例: 感想や応援メッセージもどうぞ',
};
let esc = (s) => String(s);
let toast = () => {};
let sending = false;

export function initRequest(api) {
  esc = api.esc; toast = api.toast;
  $('rq-kind').innerHTML = Object.entries(KIND).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  $('rq-kind').addEventListener('change', placeholder);
  $('rq-body').addEventListener('input', count);
  $('rq-form').addEventListener('submit', (ev) => { ev.preventDefault(); send(); });
  $('btn-rq-close').addEventListener('click', closeRequest);
  for (const b of document.querySelectorAll('[data-request]')) b.addEventListener('click', openRequest);
}

function placeholder() { $('rq-body').placeholder = PLACEHOLDER[$('rq-kind').value] || ''; }
function count() { const n = $('rq-body').value.trim().length; $('rq-count').textContent = `${n} / 1000`; $('rq-count').classList.toggle('over', n > 1000); }

export function openRequest() {
  const name = acc.getState()?.name;
  $('rq-name-row').hidden = !!name;
  $('rq-who').textContent = name ? `「${name}」として送ります` : 'ログインしていなくても送れます(名前は空でもOK)';
  if (!name && !$('rq-name').value) $('rq-name').value = load('name', '') || '';
  $('rq-msg').textContent = '';
  placeholder(); count();
  $('rq-modal').classList.add('on');
  loadMine();
}
export function closeRequest() { $('rq-modal').classList.remove('on'); }

async function send() {
  if (sending) return;
  const body = $('rq-body').value.trim();
  if (body.length < 5) { $('rq-msg').textContent = ERR.TOO_SHORT; return; }
  sending = true; $('rq-send').disabled = true; $('rq-msg').textContent = '送信中…';
  try {
    await rpc('mlidar_request_send', { p_token: load('token', null), p_client: clientId(), p_name: $('rq-name').value, p_kind: $('rq-kind').value, p_body: body });
    $('rq-body').value = ''; count();
    $('rq-msg').textContent = '';
    toast('送信しました。ありがとうございます!');
    loadMine();
  } catch (e) {
    $('rq-msg').textContent = ERR[e.message] || '送れませんでした。通信環境を確かめて、もう一度試してください';
  } finally { sending = false; $('rq-send').disabled = false; }
}

// この端末から送ったリクエスト(状態と返信つき)
async function loadMine() {
  const box = $('rq-mine');
  try {
    const list = await rpc('mlidar_request_mine', { p_client: clientId() });
    $('rq-mine-h').hidden = !list.length;
    box.innerHTML = list.map((r) => `<li>
      <div class="rq-top"><span class="rq-kind">${KIND[r.kind] || ''}</span><span class="rq-st st-${r.status}">${STATUS[r.status] || ''}</span><small>${new Date(r.at).toLocaleDateString('ja-JP')}</small></div>
      <p>${esc(r.body)}</p>${r.reply ? `<p class="rq-reply"><b>運営より</b>${esc(r.reply)}</p>` : ''}</li>`).join('');
  } catch { box.innerHTML = ''; $('rq-mine-h').hidden = true; }
}

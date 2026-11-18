// 配信者モードの「視聴者リクエスト投票」
//  配信者: 選曲画面の「📊 視聴者投票」で候補を4曲出して投票を始める → 投票リンク(?vote=CODE)を配信のチャットに貼る
//          投票の途中経過は画面の左上に出る(配信の画面に映る)。「締め切る」で一番票の多い曲を選んだ状態になる
//  視聴者: リンクを開くと投票画面が出る。1人1票(あとから変えられる)。そのままゲームも遊べる
//  サーバー: mlidar_poll_create / _vote / _get / _close(テーブル mlidar_polls。3時間で締め切り、1日で消える)
import { rpc } from './ranking.js';
import { clientId } from './storage.js';

const $ = (id) => document.getElementById(id);
let ui = null; // { entries, esc, toast, overlay, jacketURL, selectSong(id), settings(), enter() }
let mine = null; // 配信者が開いている投票 { code, options }
let timer = 0;
let viewing = ''; // 視聴者として見ている投票のコード
const POLL_MS = 3000;

export function initPoll(api) {
  ui = api;
  $('btn-poll').addEventListener('click', openHost);
  $('poll').addEventListener('click', onClick);
  $('poll').addEventListener('click', onVoteClick);
  const code = new URLSearchParams(location.search).get('vote');
  if (code) openVote(code);
}
// 配信者モードのときだけボタンを出す
export function syncPollButton() { if (ui) $('btn-poll').hidden = !ui.settings().stream; }

const pool = () => ui.entries.filter((e) => !e.local && e.urlId && e.levels);
function pick4() {
  const list = pool().slice();
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list.slice(0, 4).map((e) => e.id);
}
const voteUrl = (code) => `https://music-lidar.com/?vote=${code}`;

// ---------------------------------------------------------------------------
// 配信者
// ---------------------------------------------------------------------------
let draft = [];
function openHost() {
  if (mine) { renderHost(); ui.overlay('poll', true); return; }
  draft = pick4();
  renderDraft();
  ui.overlay('poll', true);
}
function songRow(id, extra = '') {
  const e = ui.entries.find((x) => x.id === id);
  if (!e) return '';
  return `<img src="${ui.jacketURL(e, 64)}" alt=""><span class="pl-t"><b>${ui.esc(e.title)}</b><small>${ui.esc(e.genre)} ・ BPM ${Math.round(e.bpm)}</small></span>${extra}`;
}
function renderDraft() {
  $('poll-box').innerHTML = `<div class="panel-label"><span>VIEWER POLL</span><span>視聴者リクエスト投票</span></div>
    <p class="muted small">配信を見ている人に、次に遊ぶ曲を投票してもらいます。投票リンクをチャットに貼ってください(ログインなしで投票できます)。</p>
    <ol class="poll-list">${draft.map((id) => `<li>${songRow(id)}</li>`).join('')}</ol>
    <div class="modal-actions"><button class="btn-line" data-p="close">閉じる</button><button class="btn-line" data-p="reroll">候補を入れ替え</button><button class="btn-glow" data-p="start">投票を始める</button></div>`;
}
function renderHost(res) {
  const counts = res?.counts || mine.options.map(() => 0);
  const total = counts.reduce((a, b) => a + b, 0);
  $('poll-box').innerHTML = `<div class="panel-label"><span>VIEWER POLL</span><span>CODE ${mine.code}</span></div>
    <div class="poll-link"><input readonly value="${voteUrl(mine.code)}"><button class="btn-line small" data-p="copy">コピー</button></div>
    <ol class="poll-list">${mine.options.map((id, i) => `<li style="--w:${total ? (counts[i] / total) * 100 : 0}%">${songRow(id, `<em>${counts[i]}票</em>`)}</li>`).join('')}</ol>
    <p class="muted small">合計 ${total}票 ・ 3秒ごとに更新 ・ 途中経過は画面の左上にも出ます</p>
    <div class="modal-actions"><button class="btn-line" data-p="hide">閉じる(投票は続く)</button><button class="btn-line" data-p="cancel">やめる</button><button class="btn-glow" data-p="end">締め切って1位の曲を選ぶ</button></div>`;
  renderMini(counts);
}
// 配信の画面に映る小さな途中経過
function renderMini(counts) {
  const box = $('poll-mini');
  if (!mine) { box.hidden = true; return; }
  const total = counts.reduce((a, b) => a + b, 0);
  box.hidden = false;
  box.innerHTML = `<b>📊 次の曲を投票中</b><small>music-lidar.com/?vote=${mine.code}</small>` + mine.options.map((id, i) => {
    const e = ui.entries.find((x) => x.id === id);
    return `<div style="--w:${total ? (counts[i] / total) * 100 : 0}%"><span>${i + 1}. ${ui.esc(e?.title || id)}</span><em>${counts[i]}</em></div>`;
  }).join('');
}
async function tick() {
  clearTimeout(timer);
  if (!mine) return;
  try {
    const res = await rpc('mlidar_poll_get', { p_code: mine.code, p_client: null });
    mine.last = res;
    if ($('poll').classList.contains('on')) renderHost(res); else renderMini(res.counts);
  } catch { /* 一時的な失敗は次で */ }
  timer = setTimeout(tick, POLL_MS);
}
async function onClick(ev) {
  if (ev.target === $('poll')) { ui.overlay('poll', false); return; }
  const b = ev.target.closest('[data-p]');
  if (!b) return;
  const act = b.dataset.p;
  if (act === 'close' || act === 'hide') { ui.overlay('poll', false); return; }
  if (act === 'reroll') { draft = pick4(); renderDraft(); return; }
  if (act === 'start') {
    b.disabled = true;
    try {
      const code = await rpc('mlidar_poll_create', { p_client: clientId(), p_options: draft });
      mine = { code, options: draft.slice() };
      renderHost();
      tick();
    } catch (e) { ui.toast(e?.message === 'TOO_MANY' ? '投票を作りすぎです。しばらく待ってください' : '投票を始められませんでした'); b.disabled = false; }
    return;
  }
  if (act === 'copy') { try { await navigator.clipboard.writeText(voteUrl(mine.code)); ui.toast('投票リンクをコピーしました'); } catch { prompt('投票リンク', voteUrl(mine.code)); } return; }
  if (act === 'cancel' || act === 'end') {
    const p = mine;
    rpc('mlidar_poll_close', { p_code: p.code, p_client: clientId() }).catch(() => {});
    mine = null; clearTimeout(timer); renderMini([]);
    ui.overlay('poll', false);
    if (act === 'end') {
      const counts = p.last?.counts || p.options.map(() => 0);
      const max = Math.max(...counts);
      const win = p.options[counts.indexOf(max)];
      const e = ui.entries.find((x) => x.id === win);
      ui.selectSong(win);
      ui.toast(`投票の結果: 「${e?.title || win}」(${max}票)`, 4000);
    }
  }
}

// ---------------------------------------------------------------------------
// 視聴者
// ---------------------------------------------------------------------------
async function openVote(code) {
  viewing = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  $('poll-box').innerHTML = '<p class="r-msg">投票を読み込み中…</p>';
  ui.overlay('poll', true);
  await refreshVote();
}
async function refreshVote(voteIdx) {
  clearTimeout(timer);
  if (!viewing) return;
  let res;
  try {
    res = voteIdx != null
      ? await rpc('mlidar_poll_vote', { p_code: viewing, p_client: clientId(), p_idx: voteIdx })
      : await rpc('mlidar_poll_get', { p_code: viewing, p_client: clientId() });
  } catch (e) {
    const m = e?.message === 'CLOSED' ? 'この投票は締め切られました' : 'この投票は見つかりません(締め切られたか、リンクが違います)';
    $('poll-box').innerHTML = `<div class="panel-label"><span>VIEWER POLL</span><span>${viewing}</span></div><p>${m}</p>
      <div class="modal-actions"><button class="btn-glow" data-v="play">MUSIC LiDAR で遊ぶ</button></div>`;
    viewing = '';
    return;
  }
  const total = res.counts.reduce((a, b) => a + b, 0);
  $('poll-box').innerHTML = `<div class="panel-label"><span>VIEWER POLL</span><span>${res.code}</span></div>
    <h2>配信者が次に遊ぶ曲を投票</h2>
    <p class="muted small">${res.closed ? '締め切られました' : 'タップで投票(あとから変えられます)'}</p>
    <ol class="poll-list vote">${res.options.map((id, i) => `<li style="--w:${total ? (res.counts[i] / total) * 100 : 0}%" class="${res.mine === i ? 'mine' : ''}">
      <button data-v="${i}" ${res.closed ? 'disabled' : ''}>${songRow(id, `<em>${res.counts[i]}票${res.mine === i ? ' ✓' : ''}</em>`)}</button></li>`).join('')}</ol>
    <div class="modal-actions"><button class="btn-line" data-v="close">閉じる</button><button class="btn-glow" data-v="play">自分も遊んでみる(無料)</button></div>`;
  if (!res.closed) timer = setTimeout(() => refreshVote(), POLL_MS);
}
function onVoteClick(ev) {
  const b = ev.target.closest('[data-v]');
  if (!b) return;
  const v = b.dataset.v;
  if (v === 'close' || v === 'play') { viewing = ''; clearTimeout(timer); ui.overlay('poll', false); if (v === 'play') ui.enter(); return; }
  refreshVote(+v);
}

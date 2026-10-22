// 管理者ページ: 登録ユーザー・いまオンラインの人・みんなでライブ・最近の記録
// 中身はサーバー(mlidar_admin_overview)が管理者かどうかを確かめてから返す
import { rpc } from './ranking.js';
import { load } from './storage.js';

const $ = (id) => document.getElementById(id);
let ui = null; // { entries, show, back, current, esc, toast }
let timer = 0, data = null, sortKey = 'last_seen';
const ONLINE_MS = 2.5 * 60 * 1000; // 最後のやりとりからこの時間以内なら「オンライン」

const PLACE = {
  title: 'タイトル', home: 'ホーム', select: '選曲', game: 'プレイ中', result: 'リザルト', live: 'みんなでライブ', gacha: 'ガチャ',
  team: '編成', quest: 'クエスト', editor: '譜面メーカー', charts: 'みんなの譜面', player: 'きくだけ', admin: '管理ページ',
};
const DIFF = { easy: 'EASY', normal: 'NORMAL', hard: 'HARD', custom: 'CUSTOM' };
const jst = (ms) => (ms ? new Date(ms).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-');
function ago(ms, now) {
  if (!ms) return '-';
  const m = Math.floor((now - ms) / 60000);
  if (m < 1) return 'たった今';
  if (m < 60) return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

export function initAdmin(api) {
  ui = api;
  $('adm-back').addEventListener('click', () => { stop(); ui.back(); });
  $('adm-reload').addEventListener('click', () => refresh());
  $('adm-body').addEventListener('click', (ev) => { const th = ev.target.closest('[data-sort]'); if (th) { sortKey = th.dataset.sort; render(); } });
}

export function openAdmin() {
  ui.show('admin');
  $('adm-body').innerHTML = '<p class="muted">読み込み中…</p>';
  refresh();
}

function stop() { clearTimeout(timer); timer = 0; }

async function refresh() {
  stop();
  try {
    data = await rpc('mlidar_admin_overview', { p_token: load('token', null) });
    render();
  } catch (e) {
    const msg = e.message === 'NOT_ADMIN' ? 'このページは管理者だけが見られます' : e.message === 'AUTH' ? 'ログインしてください' : 'エラー: ' + e.message;
    $('adm-body').innerHTML = `<p class="adm-deny">${ui.esc(msg)}</p>`;
    return;
  }
  // 開いている間は20秒ごとに更新
  timer = setTimeout(() => { if (ui.current() === 'admin' && !document.hidden) refresh(); else if (ui.current() === 'admin') timer = setTimeout(refresh, 5000); }, 20000);
}

function render() {
  if (!data) return;
  const now = data.now, esc = ui.esc;
  const title = (id) => ui.entries.find((e) => e.id === id)?.title || id;
  const online = data.accounts.filter((a) => a.last_seen && now - a.last_seen < ONLINE_MS);
  const today = data.accounts.filter((a) => a.last_seen && now - a.last_seen < 86400000);
  const t = data.totals;
  const card = (label, val, sub = '') => `<div class="adm-card"><small>${label}</small><b>${val}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
  const sorted = [...data.accounts].sort((a, b) => sortKey === 'name' ? a.name.localeCompare(b.name, 'ja') : (b[sortKey] || 0) - (a[sortKey] || 0));
  const th = (key, label) => `<th data-sort="${key}" class="${sortKey === key ? 'on' : ''}">${label}</th>`;

  $('adm-updated').textContent = `更新 ${jst(now)}(20秒ごとに自動更新)`;
  $('adm-body').innerHTML = `
    <div class="adm-cards">
      ${card('いまオンライン', online.length, '2〜3分以内')}
      ${card('24時間以内', today.length, '人')}
      ${card('登録ユーザー', t.accounts, `ゲスト ${t.guests}人`)}
      ${card('累計プレイ', t.plays.toLocaleString(), 'ログイン中のみ')}
      ${card('累計ガチャ', t.gacha.toLocaleString(), '回')}
      ${card('ランキング記録', t.records, `投稿譜面 ${t.charts}`)}
    </div>

    <h3 class="adm-h">いまオンライン</h3>
    ${online.length ? `<ul class="adm-online">${online.map((a) => `<li><i class="dot"></i><b>${esc(a.name)}</b><span>${esc(PLACE[a.place] || a.place || '-')}</span><small>${ago(a.last_seen, now)}</small></li>`).join('')}</ul>`
      : '<p class="muted small">いまオンラインの人はいません(ログインしていない人は数えません)</p>'}

    <h3 class="adm-h">みんなでライブ</h3>
    ${data.live.length ? `<ul class="adm-online">${data.live.map((r) => `<li><b>${esc(r.code)}</b><span>${esc(title(r.song))}</span><small>${r.status === 'play' ? 'ライブ中' : '待機中'} ・ ${(r.members || []).map(esc).join('、')}</small></li>`).join('')}</ul>`
      : '<p class="muted small">開いているルームはありません</p>'}

    <h3 class="adm-h">登録ユーザー(${data.accounts.length}人)</h3>
    <div class="adm-table-wrap"><table class="adm-table" id="adm-users-t">
      <thead><tr>${th('name', '名前')}${th('last_seen', '最後のアクセス')}<th>いた画面</th>${th('joined', '登録日')}${th('plays', 'プレイ')}${th('gacha', 'ガチャ')}${th('units', 'キャラ')}${th('coins', 'コイン')}${th('dan', '段位')}</tr></thead>
      <tbody>${sorted.map((a) => {
        const on = a.last_seen && now - a.last_seen < ONLINE_MS;
        return `<tr class="${on ? 'on' : ''}"><td>${on ? '<i class="dot"></i>' : ''}${esc(a.name)}${a.admin ? ' <span class="adm-badge">管理者</span>' : ''}</td>
          <td>${ago(a.last_seen, now)}<small>${jst(a.last_seen)}</small></td><td>${esc(PLACE[a.place] || a.place || '-')}</td><td>${jst(a.joined)}</td>
          <td class="n">${a.plays}</td><td class="n">${a.gacha}</td><td class="n">${a.units}</td><td class="n">${a.coins.toLocaleString()}</td><td>${['', '初段', '二段', '三段', '四段', '五段', '六段', '七段', '八段', '九段', '十段', '皆伝'][a.dan || 0] || '-'}</td></tr>`;
      }).join('')}</tbody></table></div>

    <h3 class="adm-h">最近のランキング記録</h3>
    <div class="adm-table-wrap"><table class="adm-table">
      <thead><tr><th>いつ</th><th>名前</th><th>曲</th><th>難易度</th><th>スコア</th></tr></thead>
      <tbody>${data.recent.map((r) => `<tr><td>${ago(r.at, now)}</td><td>${esc(r.name)}</td><td>${esc(title(r.song))}</td><td>${DIFF[r.diff] || esc(r.diff)}</td>
        <td class="n">${r.score.toLocaleString()}${r.ap ? ' <span class="adm-badge ap">AP</span>' : r.fc ? ' <span class="adm-badge fc">FC</span>' : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">まだありません</td></tr>'}</tbody></table></div>
    <p class="muted small">「最後のアクセス」はログイン中の画面から1分おきに届く合図と、プレイ結果・ガチャなどの時刻です。ログインしていないゲストは「最近のランキング記録」にだけ出ます。</p>`;
}

export const stopAdmin = stop;

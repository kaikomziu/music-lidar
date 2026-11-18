// 続けたくなる要素: レートと称号・連続プレイ日数とログインボーナス・シーズンパス・着せ替え・
// 週替わりスコアアタック・みんなの統計・招待コード・プレイヤーページ
// コインがからむものは全部サーバー(Supabase RPC)で決める。ここは表示と呼び出しだけ
import * as acc from './account.js';
import { rpc, fetchRanking, submitScore } from './ranking.js';
import { load, save } from './storage.js';
import { setEquip, getEquip, KIND, KIND_ORDER, drawSample } from './skins.js';
import { mulberry32, hashStr } from './composer.js';
import { openFriends, refreshFriendBadge, requestFriend, friendList } from './friends.js';
import { badgesHtml } from './badges.js';

const $ = (id) => document.getElementById(id);
let ui = null; // { entries, bestOf, esc, toast, show, back, current, overlay, jacketURL, play, openAccount, renderHome, diffColor }

// ---------------------------------------------------------------------------
// レートと称号
// ---------------------------------------------------------------------------
// 1譜面の値: スコア 1,000,000 で「レベル+2」、950,000 で「レベル」、それより下は 25,000 ごとに -1(0未満にはしない)
export function chartRate(level, score) {
  if (!level || !score) return 0;
  return Math.max(0, Math.min(level + 2, level + (score - 950000) / 25000));
}
export const RATE_N = 30; // 上位いくつの平均か
export function calcRate() {
  const list = [];
  for (const e of ui.entries) {
    if (e.local || !e.levels) continue;
    for (const d of ['easy', 'normal', 'hard']) {
      const b = ui.bestOf(e.id, d);
      if (b?.score) list.push({ e, d, score: b.score, fc: b.fc, ap: b.ap, v: chartRate(e.levels[d], b.score) });
    }
  }
  list.sort((a, b) => b.v - a.v);
  const top = list.slice(0, RATE_N);
  return { rate: Math.floor((top.reduce((s, x) => s + x.v, 0) / RATE_N) * 100) / 100, top };
}
export const TITLES = [
  [0, 'ルーキー', '#9aa3c0'], [2, 'ブロンズ', '#d08a4f'], [4, 'シルバー', '#cfd8ea'], [6, 'ゴールド', '#ffd34f'],
  [8, 'プラチナ', '#7fffe0'], [10, 'ダイヤ', '#7fd0ff'], [12, 'マスター', '#c77dff'], [14, 'グランドマスター', '#ff6fa8'], [16, 'レジェンド', '#ff4f4f'],
];
export function titleOf(rate) {
  let t = TITLES[0];
  for (const x of TITLES) if (rate >= x[0]) t = x;
  const i = TITLES.indexOf(t), next = TITLES[i + 1];
  return { name: t[1], color: t[2], next: next ? { name: next[1], at: next[0] } : null };
}
export const titleTag = (rate) => { const t = titleOf(rate); return `<span class="g-title" style="--tc:${t.color}">${t.name} <b>${Number(rate).toFixed(2)}</b></span>`; };

let lastRate = null;
// レートを計算し直し、ログイン中で変わっていればサーバーへ(プロフィールとランダムマッチで使う)
export function syncRate() {
  const { rate } = calcRate();
  const s = acc.getState();
  if (s && Math.abs((s.meta?.rate ?? -1) - rate) >= 0.01) rpc('mlidar_rate_set', { p_token: acc.getToken(), p_rate: rate }).catch(() => {});
  const prev = lastRate;
  lastRate = rate;
  return { rate, prev };
}
export const currentRate = () => (lastRate ?? calcRate().rate);

// ---------------------------------------------------------------------------
// 初期化
// ---------------------------------------------------------------------------
let bonusChecked = '';
export function initGrowth(api) {
  ui = api;
  acc.onChange((s) => {
    setEquip(s?.meta?.equip);
    if (s && bonusChecked !== s.id) { bonusChecked = s.id; afterLogin(); }
    if (ui.current() === 'pass') renderPass();
  });
  $('btn-pass').addEventListener('click', openPass);
  $('pass-tabs').addEventListener('click', (ev) => { const b = ev.target.closest('[data-tab]'); if (b) { passTab = b.dataset.tab; renderPass(); } });
  $('pass-body').addEventListener('click', onPassClick);
  $('weekly-card').addEventListener('click', (ev) => { const b = ev.target.closest('[data-wd]'); if (b) playWeekly(b.dataset.wd); });
  $('btn-weekly-hall').addEventListener('click', (ev) => { ev.stopPropagation(); openHall(); });
  $('pf-modal').addEventListener('click', onProfileClick);
  $('pf-modal').addEventListener('submit', onRedeemSubmit);
  $('lb-modal').addEventListener('click', (ev) => { if (ev.target.closest('[data-close]') || ev.target === $('lb-modal')) ui.overlay('lb-modal', false); });
  // ランキングの名前を押すとプレイヤーページ
  document.addEventListener('click', (ev) => {
    const n = ev.target.closest('.rank-list .nm[data-player]');
    if (n) openProfile(n.dataset.player);
  });
  // 招待リンク(?invite=CODE)と、プレイヤーページのリンク(?player=名前)
  const q = new URLSearchParams(location.search);
  if (q.get('invite')) { save('inviteCode', q.get('invite').toUpperCase().slice(0, 8)); showInviteBanner(load('inviteCode', '')); }
  if (q.get('player')) setTimeout(() => openProfile(q.get('player')), 1500);
  renderWeekly();
}

// ログインしたとき: ログインボーナス・先週の報酬・招待コード
async function afterLogin() {
  syncRate();
  try {
    const r = await rpc('mlidar_login_bonus', { p_token: acc.getToken() });
    if (r.got) { acc.applyState(r.state); showLoginBonus(r.day, r.reward); }
  } catch (e) { console.error(e); }
  try {
    const w = await rpc('mlidar_weekly_claim', { p_token: acc.getToken() });
    if (w.reward > 0) {
      acc.applyState(w.state);
      setTimeout(() => ui.toast(`先週のスコアアタック: ${w.diff.toUpperCase()} で ${w.rank}位(${w.players}人中) ・ +${w.reward} コイン`, 5000), 2800);
    }
  } catch (e) { console.error(e); }
  const code = load('inviteCode', '');
  const s = acc.getState();
  if (code && s && !s.meta?.invited_by && Date.now() - new Date(s.meta?.created).getTime() < 14 * 864e5) redeemInvite(code, true);
}

function showLoginBonus(day, reward) {
  const REW = [30, 30, 50, 30, 30, 50, 150];
  const cur = ((day - 1) % 7) + 1;
  $('lb-box').innerHTML = `<div class="panel-label"><span>LOGIN BONUS</span><span>${day}日連続</span></div>
    <h2>ログインボーナス</h2>
    <ol class="lb-days">${REW.map((c, i) => `<li class="${i + 1 < cur ? 'got' : i + 1 === cur ? 'now' : ''}"><small>${i + 1}日目</small><b>◎${c}</b></li>`).join('')}</ol>
    <p>今日のボーナス <b class="lb-get">◎ +${reward}</b></p>
    <p class="muted small">毎日ログインすると7日目に多めにもらえます。1日1曲遊ぶと「連続プレイ日数」も伸びます</p>
    <div class="modal-actions"><button type="button" class="btn-glow" data-close>受け取った!</button></div>`;
  ui.overlay('lb-modal', true);
}

// ホームの「WELCOME BACK」の横に出す: 称号・連続日数・シーズン
export function playerBadges() {
  const s = acc.getState();
  const rate = currentRate();
  const st = s?.meta?.streak;
  const alive = st && (st.last === s.meta.today || st.last === yesterday(s.meta.today));
  return `${titleTag(rate)}${s ? `<span class="g-streak${alive && st.last !== s.meta.today ? ' warn' : ''}" title="連続プレイ日数(1日1曲でつながる)">🔥 ${alive ? st.days : 0}日</span>` : ''}<button class="chip g-prof" id="btn-myprof" type="button">プロフィール</button>${s ? '<button class="chip g-prof" id="btn-friends" type="button">フレンド<i class="fr-count" id="fr-count" hidden></i></button>' : ''}`;
}
export function bindBadges() {
  if ($('btn-friends')) { $('btn-friends').addEventListener('click', openFriends); refreshFriendBadge(); }
  $('btn-myprof')?.addEventListener('click', () => { const s = acc.getState(); if (s) openProfile(s.name); else { ui.toast('プロフィールはログインすると作られます'); ui.openAccount(); } });
  const s = acc.getState();
  const se = s?.meta?.season;
  if ($('h-pass')) $('h-pass').textContent = s ? `シーズン ${tierOf(se)}/30 段 ・ ${unclaimed(se)} 件受け取れます`.replace(' ・ 0 件受け取れます', '') : '遊んでXPをためて報酬をもらう';
}
const yesterday = (ymd) => { const d = new Date(ymd + 'T00:00:00+09:00'); d.setDate(d.getDate() - 1); return new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10); };

// ---------------------------------------------------------------------------
// リザルトに出す: XP・連続日数・レート
// ---------------------------------------------------------------------------
const rateOfResult = new WeakMap(); // 同じリザルトで2回呼ばれても、レートの上がり方は最初に測ったものを使う
export function resultGrowth(res, result) {
  if (!rateOfResult.has(result)) rateOfResult.set(result, syncRate());
  const { rate, prev } = rateOfResult.get(result);
  const parts = [];
  if (prev != null && rate > prev) parts.push(`<span class="g-up">レート ${prev.toFixed(2)} → <b>${rate.toFixed(2)}</b></span>`);
  if (res?.xp) {
    const se = res.state?.meta?.season;
    parts.push(`<span>シーズン +${res.xp} XP${res.tier_up ? ` ・ <b class="g-up">${tierOf(se)}段に到達!</b>` : ''}</span>`);
  }
  if (res?.streak?.new) parts.push(`<span>🔥 連続 ${res.streak.days}日${res.streak.reward ? ` ・ <b class="g-up">ボーナス +${res.streak.reward} コイン</b>` : ''}</span>`);
  const t = titleOf(rate), pt = prev != null ? titleOf(prev) : t;
  if (t.name !== pt.name && rate > prev) parts.push(`<span class="g-up">称号「${t.name}」になりました!</span>`);
  return parts.join(' ・ ');
}

// ---------------------------------------------------------------------------
// みんなの統計(選曲画面)
// ---------------------------------------------------------------------------
const statCache = new Map();
export async function renderSongStats(e, d) {
  const box = $('d-stats');
  if (!box) return;
  if (!e || e.local) { box.innerHTML = ''; return; }
  const show = (st) => {
    const x = st?.[d];
    if (!x) { box.innerHTML = '<span class="muted">まだ誰もこの難易度の記録がありません。一番乗りしよう</span>'; return; }
    const pct = Math.round((x.clear / x.players) * 100);
    box.innerHTML = `<span title="この難易度で記録を残した人の数">挑戦 <b>${x.players.toLocaleString()}</b>人</span>
      <span title="スコア 600,000 以上">クリア率 <b>${pct}%</b></span>
      <span>フルコンボ <b>${x.fc}</b>人</span>${x.ap ? `<span>ALL PERFECT <b>${x.ap}</b>人</span>` : ''}
      <span class="muted">平均 ${Number(x.avg).toLocaleString()}</span>`;
  };
  const c = statCache.get(e.id);
  if (c && Date.now() - c.at < 60000) { show(c.st); return; }
  box.innerHTML = '<span class="muted">みんなの記録を読み込み中…</span>';
  try {
    const st = await rpc('mlidar_song_stats', { p_song: e.id });
    statCache.set(e.id, { st, at: Date.now() });
    if ($('d-stats') === box) show(st);
  } catch { box.innerHTML = ''; }
}

// ---------------------------------------------------------------------------
// 週替わりスコアアタック
// ---------------------------------------------------------------------------
// 週は月曜はじまり(日本時間)。曲は週ごとにみんな同じ。難易度は3つから選べて、難易度ごとにランキング
export function weeklyOf(date = new Date()) {
  const jst = new Date(date.getTime() + 9 * 3600e3);
  const dow = (jst.getUTCDay() + 6) % 7; // 月曜=0
  const mon = new Date(jst.getTime() - dow * 864e5);
  const key = mon.toISOString().slice(0, 10).replace(/-/g, '');
  const end = new Date(Date.UTC(mon.getUTCFullYear(), mon.getUTCMonth(), mon.getUTCDate() + 7) - 9 * 3600e3);
  const pool = ui.entries.filter((e) => !e.local && e.urlId && e.levels && e.levels.hard >= 5).sort((a, b) => (a.id < b.id ? -1 : 1));
  const r = mulberry32(hashStr('weekly-' + key));
  return { key, song: 'weekly-' + key, entry: pool[Math.floor(r() * pool.length)], end };
}
function leftText(end) {
  const ms = end - Date.now(), d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 3600e3);
  return d > 0 ? `残り ${d}日${h}時間` : `残り ${h}時間`;
}
export function renderWeekly() {
  const w = weeklyOf();
  const box = $('weekly-info');
  if (!box || !w.entry) return;
  box.innerHTML = `<img src="${ui.jacketURL(w.entry, 96)}" alt=""><span><b>${ui.esc(w.entry.title)}</b>
    <small>${leftText(w.end)} ・ 難易度ごとに順位</small><small class="daily-top" id="weekly-top">読み込み中…</small></span>`;
  $('weekly-diffs').innerHTML = ['easy', 'normal', 'hard'].map((d) => `<button type="button" class="wk-d" data-wd="${d}" style="--dc:${ui.diffColor[d]}">${d.toUpperCase()} <b>${w.entry.levels[d]}</b></button>`).join('');
  Promise.all(['easy', 'normal', 'hard'].map((d) => fetchRanking(w.song, d, ui.rankId(), 1).catch(() => []))).then((all) => {
    const el = $('weekly-top');
    if (!el) return;
    const tops = all.map((rows, i) => [['EASY', 'NORMAL', 'HARD'][i], rows.find((x) => x.rank === 1)]).filter(([, x]) => x);
    el.textContent = tops.length ? '1位: ' + tops.map(([d, x]) => `${d} ${x.name} ${x.score.toLocaleString()}`).join(' / ') : 'まだ誰も挑戦していません。1位をとるチャンス!';
  });
}
export function playWeekly(d = 'normal') {
  const w = weeklyOf();
  if (!w.entry) return;
  ui.play(w.entry, d, null, null, { weekly: w });
}
// リザルト: 週替わりのランキングへ送る(ログイン中は参加賞あり)
export function weeklyResult(w, d, r, isCurrent) {
  const box = $('r-weekly');
  box.hidden = false;
  const done = async (rank, extra = '') => {
    const rows = await fetchRanking(w.song, d, ui.rankId(), 5);
    if (!isCurrent()) return;
    box.innerHTML = `<p>今週のスコアアタック ${d.toUpperCase()} ・ 今の順位 <span class="r-myrank">#${rank}</span>${extra}</p><ol class="rank-list">${ui.rankRows(rows)}</ol>
      <p class="muted small">月曜0時に締め切り。順位に応じてコイン(1位 1000・2位 700・3位 500・10位まで 300・上位30% 150)</p>`;
  };
  const raw = { p_score: r.score, p_accuracy: Math.round(r.accuracy * 100) / 100, p_max_combo: r.maxCombo, p_fc: r.fc, p_ap: r.ap };
  box.innerHTML = '<p class="r-msg">スコアアタックのランキングに送信中…</p>';
  if (acc.isLoggedIn()) {
    rpc('mlidar_weekly_submit', { p_token: acc.getToken(), p_week: w.key, p_diff: d, ...raw })
      .then((x) => { acc.applyState(x.state); return done(x.rank, x.reward ? ` ・ 参加賞 +${x.reward} コイン` : ''); })
      .catch((e) => { box.innerHTML = `<p class="r-msg">${e.message === 'WEEK_OVER' ? 'この週のスコアアタックは締め切られました' : '送信できませんでした'}</p>`; });
    return;
  }
  const name = ui.playerName();
  if (!name) { box.innerHTML = '<p class="r-msg">スコアアタックのランキングに参加するには、ログインするか設定でゲスト名を入れてください(報酬はログイン中のみ)。</p>'; return; }
  submitScore(w.song, d, ui.rankId(), name, r).then((rank) => done(rank, ' ・ ログインすると参加賞と順位の報酬がもらえます')).catch(() => { box.innerHTML = '<p class="r-msg">送信できませんでした</p>'; });
}
async function openHall() {
  const box = $('pf-box');
  box.innerHTML = '<div class="panel-label"><span>HALL OF FAME</span><span>殿堂</span></div><h2>スコアアタック 殿堂</h2><p class="muted">読み込み中…</p>';
  ui.overlay('pf-modal', true);
  try {
    const rows = await rpc('mlidar_weekly_hall', {});
    const weeks = [...new Set(rows.map((x) => x.week))];
    box.innerHTML = `<div class="panel-label"><span>HALL OF FAME</span><span>殿堂</span></div><h2>スコアアタック 殿堂</h2>
      ${weeks.length ? `<ol class="hall">${weeks.map((wk) => {
        const e = weeklyOf(new Date(`${wk.slice(0, 4)}-${wk.slice(4, 6)}-${wk.slice(6)}T12:00:00+09:00`)).entry;
        return `<li><div class="hall-h"><b>${wk.slice(4, 6)}/${wk.slice(6)} の週</b><span>${ui.esc(e?.title || '')}</span></div>${rows.filter((x) => x.week === wk).map((x) =>
          `<div class="hall-r"><i class="lm-diff" style="--dc:${ui.diffColor[x.diff]}">${x.diff.toUpperCase()}</i><span class="nm" data-player="${ui.esc(x.name)}">👑 ${ui.esc(x.name)}</span><span class="sc">${x.score.toLocaleString()}</span>${x.ap ? '<span class="badge ap">AP</span>' : x.fc ? '<span class="badge fc">FC</span>' : ''}</div>`).join('')}</li>`;
      }).join('')}</ol>` : '<p class="muted">まだ締め切られた週がありません。今週の1位を目指そう!</p>'}
      <div class="modal-actions"><button type="button" class="btn-glow" data-close>閉じる</button></div>`;
  } catch { box.innerHTML += '<p class="muted">読み込めませんでした</p>'; }
}

// ---------------------------------------------------------------------------
// シーズンパスと着せ替え(画面 #pass)
// ---------------------------------------------------------------------------
const XP_PER = 300, TIERS = 30;
const tierOf = (se) => Math.min(TIERS, Math.floor((se?.xp || 0) / XP_PER));
const unclaimed = (se) => { const t = tierOf(se); let n = 0; for (let i = 1; i <= t; i++) if (!(se?.claimed || []).includes(i)) n++; return n; };
// サーバーの mlidar_season_reward と同じ
const SEASON_SKINS = ['note_aurora', 'hit_petal', 'line_fire', 'tap_clap', 'hit_bubble', 'line_ice'];
const rewardOf = (t) => (t % 5 === 0 ? { skin: SEASON_SKINS[t / 5 - 1] } : { coins: t % 5 === 4 ? 150 : t % 2 === 0 ? 100 : 60 });

let passTab = 'season';
let skinList = null;
async function loadSkins() {
  if (!skinList) { try { skinList = await rpc('mlidar_skin_list', {}); } catch { skinList = []; } }
  return skinList;
}
export function openPass(tab) {
  if (!acc.isLoggedIn()) { ui.toast('シーズンパスと着せ替えはログインすると使えます'); ui.openAccount(); return; }
  if (typeof tab === 'string') passTab = tab;
  ui.show('pass');
  renderPass();
  loadSkins().then(() => { if (ui.current() === 'pass') renderPass(); });
}
const skinName = (id) => (id === 'default' ? 'いつもの' : skinList?.find((x) => x.id === id)?.name || id);

function renderPass() {
  const s = acc.getState();
  if (!s) return;
  for (const b of document.querySelectorAll('#pass-tabs [data-tab]')) b.classList.toggle('sel', b.dataset.tab === passTab);
  const body = $('pass-body');
  if (passTab === 'season') {
    const se = s.meta?.season || { xp: 0, claimed: [] };
    const tier = tierOf(se), n = unclaimed(se);
    const [y, mo] = (s.meta?.season_id || '').split('-');
    const end = new Date(+y, +mo, 1);
    const days = Math.max(0, Math.ceil((end - Date.now()) / 864e5));
    const inTier = tier >= TIERS ? XP_PER : (se.xp || 0) % XP_PER;
    body.innerHTML = `<div class="ps-head hud">
        <div><small>SEASON ${y}.${mo}</small><b>${tier} <i>/ ${TIERS} 段</i></b><span class="muted small">シーズン終了まで あと${days}日(毎月1日に新しいシーズン)</span></div>
        <div class="ps-bar"><i style="width:${(inTier / XP_PER) * 100}%"></i><span>${tier >= TIERS ? 'MAX!' : `次の段まで ${XP_PER - inTier} XP`}</span></div>
        <button class="btn-glow" data-claim ${n ? '' : 'disabled'}>${n ? `報酬を ${n} 件まとめて受け取る` : '受け取れる報酬はありません'}</button>
      </div>
      <p class="muted small">1曲遊ぶごとに XP(60〜140。スコアが高いほど・フルコンボ・難しい難易度ほど多め)。5段ごとにシーズン限定の着せ替え</p>
      <ol class="ps-tiers">${Array.from({ length: TIERS }, (_, i) => {
        const t = i + 1, rw = rewardOf(t), got = (se.claimed || []).includes(t), open = t <= tier;
        const owned = rw.skin && (s.meta?.skins || []).includes(rw.skin) && !got;
        return `<li class="${got ? 'got' : open ? 'open' : ''}${rw.skin ? ' big' : ''}"><small>${t}</small>${rw.skin ? `<canvas width="96" height="40" data-sample="${rw.skin}"></canvas><b>${skinName(rw.skin)}</b><em>${KIND[rw.skin.split('_')[0]]}</em>${owned ? '<em>持っている → 200コイン</em>' : ''}` : `<b>◎${rw.coins}</b>`}${got ? '<i>✓</i>' : ''}</li>`;
      }).join('')}</ol>`;
  } else {
    const owned = new Set(s.meta?.skins || []);
    const eq = { note: 'default', line: 'default', tap: 'default', hit: 'default', ...(s.meta?.equip || {}) };
    const list = skinList || [];
    body.innerHTML = KIND_ORDER.map((k) => `<section class="sk-group"><h3>${KIND[k]}</h3><ul class="sk-list">${[{ id: 'default', name: 'いつもの', price: 0, source: 'base' }, ...list.filter((x) => x.kind === k)].map((x) => {
      const has = x.id === 'default' || owned.has(x.id), on = eq[k] === x.id;
      const how = has ? '' : x.source === 'shop' ? `<button class="btn-line small" data-buy="${x.id}">◎${x.price.toLocaleString()} で買う</button>` : `<span class="muted small">${x.source === 'season' ? 'シーズンパスの報酬' : x.source === 'event' ? '季節イベントに参加するともらえる' : x.id === 'line_invite' ? '友だちを3人招待するともらえる' : x.id === 'note_crown' ? '友だちを10人招待するともらえる' : '友だち招待でもらえる'}</span>`;
      return `<li class="${on ? 'on' : ''}${has ? '' : ' lock'}"><canvas width="120" height="48" data-sample="${x.id}" data-kind="${k}"></canvas><b>${ui.esc(x.name)}</b>
        ${has ? (on ? '<span class="sk-on">装備中</span>' : `<button class="btn-line small" data-equip="${x.id}" data-kind="${k}">装備する</button>`) : how}
        ${k === 'tap' ? `<button class="link-btn small" data-hear="${x.id}">試聴</button>` : ''}</li>`;
    }).join('')}</ul></section>`).join('') + '<p class="muted small">着せ替えは見た目と音だけで、スコアには関係ありません。装備はアカウントに保存され、どの端末でも同じになります</p>';
  }
  for (const cv of body.querySelectorAll('canvas[data-sample]')) drawSample(cv, cv.dataset.sample, cv.dataset.kind || cv.dataset.sample.split('_')[0]);
}

async function onPassClick(ev) {
  const t = acc.getToken();
  const claim = ev.target.closest('[data-claim]');
  const buy = ev.target.closest('[data-buy]');
  const eq = ev.target.closest('[data-equip]');
  const hear = ev.target.closest('[data-hear]');
  try {
    if (claim) {
      claim.disabled = true;
      const r = await rpc('mlidar_season_claim', { p_token: t });
      acc.applyState(r.state);
      const skins = r.rewards.filter((x) => x.skin).map((x) => `「${skinName(x.skin)}」`);
      ui.toast(`受け取りました: ◎${r.coins}${skins.length ? ' と着せ替え ' + skins.join('') : ''}`, 4000);
    } else if (buy) {
      const x = skinList.find((k) => k.id === buy.dataset.buy);
      if (!confirm(`「${x.name}」(${KIND[x.kind]})を ◎${x.price.toLocaleString()} で買いますか?`)) return;
      acc.applyState(await rpc('mlidar_skin_buy', { p_token: t, p_id: x.id }));
      ui.toast(`「${x.name}」を買いました。装備するとプレイに反映されます`);
    } else if (eq) {
      acc.applyState(await rpc('mlidar_skin_equip', { p_token: t, p_kind: eq.dataset.kind, p_id: eq.dataset.equip }));
    } else if (hear) {
      const { getCtx } = await import('./audio.js');
      const { makeTap } = await import('./skins.js');
      const c = getCtx(), s = c.createBufferSource();
      s.buffer = makeTap(c, hear.dataset.hear === 'default' ? 'default' : hear.dataset.hear.slice(4));
      s.connect(c.destination); s.start();
    }
  } catch (e) { ui.toast(acc.errText(e)); renderPass(); }
}

// ---------------------------------------------------------------------------
// プレイヤーページ(モーダル)・招待コード
// ---------------------------------------------------------------------------
const DAN = ['', '初段', '二段', '三段', '四段', '五段', '六段', '七段', '八段', '九段', '十段', '皆伝'];
// サイトのトップ(曲ページ・画面ページでも <base> でトップを指している)
const shareUrl = (q) => `${new URL('.', document.baseURI).href}?${q}`;

export async function openProfile(name) {
  if (!name) return;
  const box = $('pf-box');
  box.innerHTML = '<div class="panel-label"><span>PLAYER</span></div><p class="muted">読み込み中…</p>';
  ui.overlay('pf-modal', true);
  let p = null;
  try { p = await rpc('mlidar_profile', { p_name: name }); } catch { /* 下で表示 */ }
  if (!p) {
    box.innerHTML = `<div class="panel-label"><span>PLAYER</span></div><h2>${ui.esc(name)}</h2><p class="muted">プレイヤーページはありません(ログインしていない人の記録です)</p><div class="modal-actions"><button class="btn-glow" data-close>閉じる</button></div>`;
    return;
  }
  const mine = acc.getState()?.name === p.name;
  // ベスト(内蔵曲)から得意ジャンル・上位の記録をこちらで計算する
  const list = [];
  for (const [k, b] of Object.entries(p.best || {})) {
    const [id, d] = k.split('/');
    const e = ui.entries.find((x) => x.id === id && !x.local);
    if (e?.levels) list.push({ e, d, score: b.score, fc: b.fc, ap: b.ap, v: chartRate(e.levels[d], b.score) });
  }
  list.sort((a, b) => b.v - a.v);
  const genres = {};
  for (const x of list.slice(0, RATE_N)) genres[x.e.genre] = (genres[x.e.genre] || 0) + 1;
  const fav = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);
  const st = p.stats || {}, mt = p.match || {};
  const rate = Number(p.rate || 0);
  const t = titleOf(rate);
  box.innerHTML = `<div class="panel-label"><span>PLAYER PROFILE</span><span>${p.since?.replace(/-/g, '.')} から</span></div>
    <div class="pf-head"><div class="pf-ava" style="--tc:${t.color}">${ui.esc(p.name.slice(0, 1))}</div><div><h2>${ui.esc(p.name)}</h2>${titleTag(rate)}
      ${st.dan ? `<span class="hp-dan">${DAN[st.dan] || ''}</span>` : ''}${t.next ? `<small class="muted">次の称号「${t.next.name}」まで ${(t.next.at - rate).toFixed(2)}</small>` : ''}</div></div>
    <div class="pf-stats">
      <div><small>プレイ</small><b>${(st.plays || 0).toLocaleString()}</b></div><div><small>フルコンボ</small><b>${st.fc || 0}</b></div><div><small>ALL PERFECT</small><b>${st.ap || 0}</b></div>
      <div><small>最大コンボ</small><b>${st.max_combo || 0}</b></div><div><small>連続プレイ最高</small><b>${p.streak?.best || 0}日</b></div><div><small>対戦</small><b>${mt.win || 0}勝 ${mt.lose || 0}敗</b></div>
      <div><small>キャラ</small><b>${p.units || 0}種</b></div><div><small>着せ替え</small><b>${p.skins || 0}個</b></div><div><small>招待した人</small><b>${p.invites || 0}人</b></div>
    </div>
    ${fav.length ? `<p class="pf-fav">得意ジャンル: ${fav.map((g) => `<i>${ui.esc(g)}</i>`).join('')}</p>` : ''}
    <h3 class="pf-h">ベスト(レート対象の上位)</h3>
    <ol class="pf-best">${list.slice(0, 10).map((x) => `<li><img src="${ui.jacketURL(x.e, 64)}" alt=""><span class="nm2">${ui.esc(x.e.title)}<i class="lm-diff" style="--dc:${ui.diffColor[x.d]}">${x.d.toUpperCase()} ${x.e.levels[x.d]}</i></span>
      <span>${x.ap ? '<span class="badge ap">AP</span>' : x.fc ? '<span class="badge fc">FC</span>' : ''}</span><span class="sc">${x.score.toLocaleString()}</span><span class="pf-v">${x.v.toFixed(2)}</span></li>`).join('') || '<li class="empty">まだ記録がありません</li>'}</ol>
    ${badgesHtml(p, ui.entries, ui.esc, mine)}
    ${mine ? inviteHtml() : ''}
    <div class="modal-actions">${!mine && acc.getToken() ? `<button class="btn-line" data-friend="${ui.esc(p.name)}" hidden>＋ フレンド申請</button>` : ''}<button class="btn-line" data-share="${ui.esc(p.name)}">このページのリンクをコピー</button><button class="btn-glow" data-close>閉じる</button></div>`;
  if (mine) loadInviteCode();
  else if (acc.getToken()) friendButton(p.name);
}
function inviteHtml() {
  const s = acc.getState();
  const canRedeem = !s.meta?.invited_by && Date.now() - new Date(s.meta?.created).getTime() < 14 * 864e5;
  return `<section class="pf-inv hud"><h3>友だちを招待</h3>
    <p class="small">招待コードかリンクで友だちが始めると、<b>2人とも ◎300</b> と限定の着せ替え「フレンド」がもらえます(コインは20人まで)</p>
    ${inviteSteps(Number(s.meta?.invites || 0))}
    <div class="pf-code"><b id="inv-code">……</b><button class="btn-line small" data-copy-inv>リンクをコピー</button><button class="btn-line small x-btn" data-x-inv>𝕏 で誘う</button></div>
    ${canRedeem ? `<form class="pf-redeem" data-redeem><input id="inv-input" maxlength="8" placeholder="もらった招待コード" autocomplete="off"><button class="btn-line small">使う</button></form><p class="muted small">招待コードは、始めてから14日以内に1回だけ使えます</p>`
      : s.meta?.invited_by ? `<p class="muted small">${ui.esc(s.meta.invited_by)} さんの招待で始めました</p>` : ''}</section>`;
}
// 招待の段階報酬(1人・3人・10人)と進み具合
const INVITE_STEPS = [[1, '着せ替え「フレンド」'], [3, '判定ライン「アンバサダー」'], [10, 'ノーツ「クラウン」とバッジ「アンバサダー」']];
function inviteSteps(n) {
  const next = INVITE_STEPS.find(([k]) => n < k);
  return `<ol class="inv-steps">${INVITE_STEPS.map(([k, what]) => `<li class="${n >= k ? 'done' : ''}"><b>${k}人</b><span>${what}</span></li>`).join('')}</ol>
    <p class="muted small">いま ${n}人${next ? ` ・ あと${next[0] - n}人で${next[1]}` : ' ・ すべての報酬を受け取りました'}</p>`;
}
// 招待リンクで来た人に「〇〇さんから招待されました」を画面の上に出す(まだログインしていない人だけ。ログイン中なら自動で使われてお知らせが出る)
async function showInviteBanner(code) {
  if (!code || acc.getToken() || document.body.classList.contains('embed')) return;
  let r = null;
  try { r = await rpc('mlidar_invite_lookup', { p_code: code }); } catch { return; }
  if (!r?.name || acc.getToken()) return;
  const bar = document.createElement('div');
  bar.id = 'invite-banner';
  bar.className = 'invite-banner';
  bar.setAttribute('role', 'status');
  bar.innerHTML = `<span class="ivb-ico" aria-hidden="true">🎁</span>
    <span class="ivb-text"><b><em>${ui.esc(r.name)}</em> さんから招待されました!</b>${r.rate > 0 ? titleTag(r.rate) : ''}
      <small>ログインして始めると、2人とも ◎300 と限定の着せ替え「フレンド」がもらえます</small></span>
    <button type="button" class="btn-glow small" data-ivb-login>ログインして受け取る</button>
    <button type="button" class="ib-close" data-ivb-close aria-label="閉じる">✕</button>`;
  bar.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-ivb-close]')) bar.remove();
    else if (ev.target.closest('[data-ivb-login]')) ui.openAccount();
  });
  document.body.appendChild(bar);
  acc.onChange((st) => { if (st) bar.remove(); }); // ログインしたら消す(招待コードはログイン後に自動で使う)
}
// プロフィールの「フレンド申請」ボタン: もうフレンド・申請中ならその表示にする
async function friendButton(name) {
  const b = document.querySelector('#pf-box [data-friend]');
  if (!b) return;
  try {
    const d = await friendList();
    const has = (arr) => arr.some((n) => n.toLowerCase() === name.toLowerCase());
    if (d.friends.some((f) => f.name.toLowerCase() === name.toLowerCase())) { b.textContent = '✓ フレンド'; b.disabled = true; }
    else if (has(d.outgoing)) { b.textContent = '申請中'; b.disabled = true; }
    else if (has(d.incoming)) b.textContent = '＋ 申請を承認する';
  } catch { /* そのまま出す */ }
  b.hidden = false;
}
async function loadInviteCode() {
  try { const c = await rpc('mlidar_invite_code', { p_token: acc.getToken() }); if ($('inv-code')) $('inv-code').textContent = c; } catch { /* noop */ }
}
async function redeemInvite(code, auto = false) {
  try {
    const r = await rpc('mlidar_invite_redeem', { p_token: acc.getToken(), p_code: code });
    acc.applyState(r.state);
    save('inviteCode', '');
    ui.toast(`${r.inviter} さんの招待コードを使いました。◎300 と着せ替え「フレンド」をもらいました!`, 5000);
    return true;
  } catch (e) {
    if (auto) { save('inviteCode', ''); return false; }
    const M = { INVITE_BAD: '招待コードが見つかりません', INVITE_SELF: '自分の招待コードは使えません', INVITE_USED: '招待コードはもう使っています', INVITE_OLD: '招待コードは始めてから14日以内だけ使えます' };
    ui.toast(M[e.message] || acc.errText(e));
    return false;
  }
}
async function onProfileClick(ev) {
  if (ev.target === $('pf-modal') || ev.target.closest('[data-close]')) { ui.overlay('pf-modal', false); return; }
  const sh = ev.target.closest('[data-share]');
  if (sh) { copy(shareUrl('player=' + encodeURIComponent(sh.dataset.share)), 'プレイヤーページのリンクをコピーしました'); return; }
  const fb = ev.target.closest('[data-friend]');
  if (fb) { fb.disabled = true; const r = await requestFriend(fb.dataset.friend); fb.textContent = r === 'ok' ? '✓ フレンド' : r ? '申請中' : '＋ フレンド申請'; fb.disabled = !!r; return; }
  if (ev.target.closest('[data-copy-inv]')) {
    const c = $('inv-code').textContent;
    copy(`MUSIC LiDAR で一緒に遊ぼう!招待コード ${c} ${shareUrl('invite=' + c)}`, '招待リンクをコピーしました');
    return;
  }
  if (ev.target.closest('[data-x-inv]')) {
    const c = $('inv-code').textContent;
    const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`無料のブラウザ音ゲー MUSIC LiDAR で一緒に遊ぼう!このリンクから始めると2人とも◎300コインと限定の着せ替えがもらえます`)}&url=${encodeURIComponent('https://music-lidar.com/?invite=' + c)}&hashtags=MUSICLiDAR`;
    window.open(u, '_blank', 'noopener,width=600,height=520');
    return;
  }
}
async function onRedeemSubmit(ev) {
  ev.preventDefault();
  if (!ev.target.closest('[data-redeem]')) return;
  const v = $('inv-input').value.trim();
  if (v && await redeemInvite(v)) openProfile(acc.getState().name);
}
function copy(text, msg) { navigator.clipboard?.writeText(text).then(() => ui.toast(msg), () => ui.toast(text, 6000)); }
export const closeGrowth = () => { ui.overlay('pf-modal', false); ui.overlay('lb-modal', false); };
export { getEquip };

// クエスト・ガチャ・編成・アカウント画面
import * as acc from './account.js';
import { unitIcon, skillText, fxText, stars, KIND_LABEL, RARITY_COLOR } from './units.js';
import { load, save } from './storage.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let ui = null; // { show, toast, back }

export function initMeta(api) {
  ui = api;
  acc.onChange(() => { renderHeader(); if (ui.current() === 'quest') renderQuest(); if (ui.current() === 'team') renderTeam(); if (ui.current() === 'gacha') renderGachaInfo(); });

  for (const b of document.querySelectorAll('[data-nav]')) b.addEventListener('click', () => openScreen(b.dataset.nav));
  for (const b of document.querySelectorAll('[data-back]')) b.addEventListener('click', () => ui.back());

  // アカウント
  $('btn-name').addEventListener('click', openAccount);
  for (const t of document.querySelectorAll('.acc-tab')) t.addEventListener('click', () => setAccTab(t.dataset.tab));
  $('acc-form').addEventListener('submit', (ev) => { ev.preventDefault(); submitAccount(); });
  $('btn-acc-guest').addEventListener('click', () => { save('nameSkipped', true); closeAccount(); });
  $('btn-acc-logout').addEventListener('click', async () => { await acc.logout(); ui.toast('ログアウトしました'); closeAccount(); });
  $('btn-acc-close').addEventListener('click', closeAccount);

  // クエスト
  for (const t of document.querySelectorAll('.q-tab')) t.addEventListener('click', () => { qTab = t.dataset.tab; renderQuest(); });

  // ガチャ
  $('btn-gacha-1').addEventListener('click', () => pull(1));
  $('btn-gacha-10').addEventListener('click', () => pull(10));
  $('gacha-result').addEventListener('click', (ev) => { if (ev.target.closest('.btn-gacha-close')) closeGachaResult(); });

  // 編成
  $('team-sort').addEventListener('change', renderTeam);
  renderHeader();
}

// ---------------------------------------------------------------------------
function needLogin() {
  if (acc.isLoggedIn()) return false;
  ui.toast('クエスト・ガチャ・編成はログインすると使えます');
  openAccount();
  return true;
}

export function openScreen(name) {
  if (needLogin()) return;
  ui.show(name);
  if (name === 'quest') renderQuest();
  if (name === 'gacha') renderGachaInfo();
  if (name === 'team') { teamSlot = null; renderTeam(); }
  acc.refresh().catch(() => {});
}

export function renderHeader() {
  const s = acc.getState();
  $('name-label').textContent = s ? s.name : (load('name', '') || 'ゲスト') + ' (未ログイン)';
  for (const el of document.querySelectorAll('.coin-val')) el.textContent = s ? s.coins.toLocaleString() : '-';
  const n = acc.claimableCount();
  for (const el of document.querySelectorAll('.q-badge')) { el.textContent = n; el.hidden = !n; }
  const fx = acc.teamFx();
  $('team-fx-mini').textContent = s ? '編成: ' + fxText(fx) : '';
}

// ---------------------------------------------------------------------------
// アカウント
// ---------------------------------------------------------------------------
let accTab = 'login';
export function openAccount() {
  const s = acc.getState();
  $('acc-in').hidden = !!s;
  $('acc-out').hidden = !s;
  if (s) {
    $('acc-who').textContent = s.name;
    $('acc-stats').textContent = `コイン ${s.coins.toLocaleString()} ・ キャラ ${Object.keys(s.units).length}種類 ・ 累計 ${s.stats.plays || 0} プレイ`;
  } else setAccTab(accTab);
  $('acc-msg').textContent = '';
  document.getElementById('account-modal').classList.add('on');
  if (!s) setTimeout(() => $('acc-name').focus(), 50);
}
function closeAccount() { document.getElementById('account-modal').classList.remove('on'); }
function setAccTab(t) {
  accTab = t;
  for (const b of document.querySelectorAll('.acc-tab')) b.classList.toggle('sel', b.dataset.tab === t);
  $('acc-submit').textContent = t === 'login' ? 'ログイン' : '登録してはじめる';
  $('acc-pass').autocomplete = t === 'login' ? 'current-password' : 'new-password';
  $('acc-pass2-row').hidden = t === 'login';
  $('acc-note').textContent = t === 'login' ? '' : '登録すると1000コインと★1キャラ3体がもらえます。パスワードは忘れると戻せないので注意。';
}
async function submitAccount() {
  const name = $('acc-name').value.trim(), pass = $('acc-pass').value;
  const msg = $('acc-msg');
  if (accTab === 'register' && pass !== $('acc-pass2').value) { msg.textContent = 'パスワードが一致しません'; return; }
  msg.textContent = '通信中…';
  $('acc-submit').disabled = true;
  try {
    if (accTab === 'login') await acc.login(name, pass); else await acc.register(name, pass);
    $('acc-pass').value = ''; $('acc-pass2').value = '';
    closeAccount();
    ui.toast(accTab === 'login' ? `おかえりなさい、${name}` : `ようこそ、${name}! 1000コインを受け取りました`);
  } catch (e) {
    msg.textContent = acc.errText(e);
  } finally {
    $('acc-submit').disabled = false;
  }
}

// ---------------------------------------------------------------------------
// クエスト
// ---------------------------------------------------------------------------
let qTab = 'daily';
function renderQuest() {
  const s = acc.getState();
  if (!s) return;
  for (const t of document.querySelectorAll('.q-tab')) t.classList.toggle('sel', t.dataset.tab === qTab);
  const list = s.missions.filter((m) => (qTab === 'daily' ? m.type === 'daily' : m.type !== 'daily'));
  list.sort((a, b) => rankM(a) - rankM(b));
  $('quest-list').innerHTML = list.map((m) => {
    const done = m.progress >= m.goal;
    const pct = Math.round((m.progress / m.goal) * 100);
    return `<li class="quest ${m.claimed ? 'claimed' : done ? 'ready' : ''}">
      <div class="q-main"><div class="q-title">${esc(m.title)}</div>
        <div class="q-bar"><span style="width:${pct}%"></span></div>
        <div class="q-prog">${m.progress.toLocaleString()} / ${m.goal.toLocaleString()}</div></div>
      <div class="q-reward"><span class="coin-ico">◎</span>${m.reward}</div>
      <button class="q-claim" data-id="${m.id}" ${!done || m.claimed ? 'disabled' : ''}>${m.claimed ? '受取済' : done ? '受け取る' : '未達成'}</button>
    </li>`;
  }).join('');
  for (const b of $('quest-list').querySelectorAll('.q-claim:not([disabled])')) {
    b.addEventListener('click', async () => {
      b.disabled = true;
      try { const r = await acc.claim(b.dataset.id); ui.toast(`◎ ${r} コインを受け取りました`); } catch (e) { ui.toast(acc.errText(e)); b.disabled = false; }
    });
  }
  $('q-reset').textContent = qTab === 'daily' ? 'デイリーミッションは毎日0時(日本時間)に更新' : '';
}
const rankM = (m) => (m.claimed ? 2 : m.progress >= m.goal ? 0 : 1);

// ---------------------------------------------------------------------------
// ガチャ
// ---------------------------------------------------------------------------
function renderGachaInfo() {
  const s = acc.getState();
  if (!s) return;
  $('gacha-pity').textContent = `★4確定まであと ${100 - s.pity} 回`;
  $('btn-gacha-1').disabled = s.coins < 100;
  $('btn-gacha-10').disabled = s.coins < 900;
  const cat = acc.getCatalog();
  const owned = Object.keys(s.units).length;
  $('gacha-collect').textContent = `図鑑 ${owned} / ${cat.length}`;
  $('gacha-lineup').innerHTML = [4, 3, 2, 1].map((r) => `<div class="lineup-row"><b style="color:${RARITY_COLOR[r]}">${stars(r)}</b>${
    cat.filter((u) => u.rarity === r).map((u) => `<span class="lineup-u ${s.units[u.id] ? '' : 'unowned'}" title="${esc(u.name)}">${unitIcon(u, 34)}</span>`).join('')}</div>`).join('');
}

let pulling = false;
async function pull(n) {
  if (pulling) return;
  pulling = true;
  try {
    const res = await acc.gacha(n);
    showGachaResult(res);
  } catch (e) {
    ui.toast(acc.errText(e));
  } finally {
    pulling = false;
  }
}

function showGachaResult(res) {
  const box = $('gacha-result');
  const best = Math.max(...res.map((r) => r.rarity));
  box.className = 'gacha-result on best' + best;
  box.innerHTML = `<div class="gr-inner"><div class="gr-cards">${res.map((r, i) => {
    const u = acc.unitById(r.id) || { id: r.id, name: r.id, rarity: r.rarity, kind: 'score' };
    return `<div class="gr-card r${r.rarity}" style="animation-delay:${0.15 + i * 0.12}s">
      ${r.new ? '<span class="gr-new">NEW</span>' : ''}
      ${unitIcon(u, 72)}
      <div class="gr-stars" style="color:${RARITY_COLOR[r.rarity]}">${stars(r.rarity)}</div>
      <div class="gr-name">${esc(u.name)}</div>
      <div class="gr-sub">${r.coinBack ? `Lv MAX → ◎${r.coinBack}` : r.new ? KIND_LABEL[u.kind] : `Lv ${r.lv}`}</div>
    </div>`;
  }).join('')}</div><button class="btn-glow btn-gacha-close">OK</button></div>`;
}
function closeGachaResult() { $('gacha-result').className = 'gacha-result'; renderGachaInfo(); }
export function gachaResultOpen() { return $('gacha-result').classList.contains('on'); }
export function closeGacha() { closeGachaResult(); }

// ---------------------------------------------------------------------------
// 編成
// ---------------------------------------------------------------------------
let teamSlot = null; // 選択中の枠(0〜4)
function renderTeam() {
  const s = acc.getState();
  if (!s) return;
  const team = s.team.slice(0, 5);
  $('team-slots').innerHTML = [0, 1, 2, 3, 4].map((i) => {
    const id = team[i];
    const u = id && acc.unitById(id);
    const lv = id ? s.units[id]?.lv || 1 : 0;
    return `<button class="slot ${i === 0 ? 'leader' : ''} ${teamSlot === i ? 'sel' : ''}" data-i="${i}">
      <span class="slot-tag">${i === 0 ? 'LEADER' : 'MEMBER'}</span>
      ${u ? `${unitIcon(u, i === 0 ? 76 : 60)}<span class="slot-name">${esc(u.name)}</span><span class="slot-lv">Lv${lv}</span><span class="slot-skill">${skillText(u, lv, i === 0)}</span>` : '<span class="slot-empty">＋</span>'}
    </button>`;
  }).join('');
  for (const b of $('team-slots').querySelectorAll('.slot')) {
    b.addEventListener('click', () => {
      const i = +b.dataset.i;
      teamSlot = teamSlot === i ? null : i;
      renderTeam();
    });
  }
  $('team-fx').textContent = fxText(s.fx);
  $('team-hint').textContent = teamSlot == null ? '枠を選んでから下のキャラを選ぶと入れ替わります。リーダーはスキル1.5倍。'
    : `${teamSlot === 0 ? 'リーダー' : 'メンバー' + teamSlot}に入れるキャラを選んでください`;

  const sort = $('team-sort').value;
  const owned = acc.getCatalog().filter((u) => s.units[u.id]);
  owned.sort((a, b) => sort === 'kind' ? a.kind.localeCompare(b.kind) || b.rarity - a.rarity
    : sort === 'lv' ? (s.units[b.id].lv - s.units[a.id].lv) || b.rarity - a.rarity
    : b.rarity - a.rarity || a.sort - b.sort);
  $('team-units').innerHTML = owned.map((u) => {
    const lv = s.units[u.id].lv;
    const pos = team.indexOf(u.id);
    return `<button class="unit-card ${pos >= 0 ? 'in-team' : ''}" data-id="${u.id}">
      ${pos >= 0 ? `<span class="in-tag">${pos === 0 ? 'L' : pos}</span>` : ''}
      ${unitIcon(u, 56)}
      <div class="uc-name">${esc(u.name)}</div>
      <div class="uc-meta"><span style="color:${RARITY_COLOR[u.rarity]}">${stars(u.rarity)}</span> Lv${lv}</div>
      <div class="uc-skill">${skillText(u, lv)}</div>
    </button>`;
  }).join('');
  for (const b of $('team-units').querySelectorAll('.unit-card')) b.addEventListener('click', () => pickUnit(b.dataset.id));
}

async function pickUnit(id) {
  const s = acc.getState();
  const team = s.team.slice(0, 5);
  const pos = team.indexOf(id);
  if (teamSlot == null) {
    // 枠未選択: 編成にいれば外す、いなければ空き枠へ
    if (pos >= 0) team.splice(pos, 1);
    else if (team.length < 5) team.push(id);
    else { ui.toast('枠を選んでから入れ替えてください'); return; }
  } else {
    if (pos >= 0) team.splice(pos, 1, team[teamSlot]);
    if (teamSlot < team.length) team[teamSlot] = id;
    else team.push(id);
    teamSlot = null;
  }
  try { await acc.setTeam(team.filter(Boolean)); } catch (e) { ui.toast(acc.errText(e)); }
}

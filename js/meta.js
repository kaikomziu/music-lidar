// クエスト・ガチャ・編成・アカウント画面
import * as acc from './account.js';
import { unitIcon, skillText, skillValue, fxText, stars, KIND_LABEL, KIND_COLOR, KIND_DESC, RARITY_COLOR } from './units.js';
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
  initTeamDnd();
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
// 編成 (ドラッグ&ドロップ / タップ)
// ---------------------------------------------------------------------------
let teamSlot = null; // タップ操作で選択中の枠(0〜4)
let kindFilter = 'all';
let localTeam = null; // 通信待ちの間に表示する編成

const curTeam = () => (localTeam || acc.getState()?.team || []).slice(0, 5);

// サーバー(mlidar_team_fx)と同じ計算。通信を待たずに表示するため
function calcFx(team, units) {
  const fx = { score: 0, judge: 0, guard: 0, coin: 0 };
  team.forEach((id, i) => {
    const u = acc.unitById(id);
    if (u) fx[u.kind] += skillValue(u, units[id]?.lv || 1, i === 0);
  });
  return { score: Math.round(fx.score * 10) / 10, judge: Math.min(20, Math.round(fx.judge * 10) / 10), guard: Math.floor(fx.guard), coin: Math.round(fx.coin * 10) / 10 };
}

function renderTeam() {
  const s = acc.getState();
  if (!s) return;
  const team = curTeam();
  $('team-slots').innerHTML = [0, 1, 2, 3, 4].map((i) => {
    const id = team[i];
    const u = id && acc.unitById(id);
    const lv = id ? s.units[id]?.lv || 1 : 0;
    const label = (i === 0 ? 'リーダー枠' : 'メンバー枠' + i) + (u ? ': ' + u.name : ' (空き)');
    return `<div class="slot ${i === 0 ? 'leader' : ''} ${teamSlot === i ? 'sel' : ''} ${u ? 'filled' : ''}" data-i="${i}" ${u ? `data-drag="slot" data-id="${u.id}"` : ''} role="button" tabindex="0" aria-label="${esc(label)}">
      <span class="slot-tag">${i === 0 ? '★ LEADER ×1.5' : 'MEMBER ' + i}</span>
      ${u ? `<button class="slot-x" data-x="${i}" aria-label="外す">×</button>
        ${unitIcon(u, i === 0 ? 76 : 60)}<span class="slot-name">${esc(u.name)}</span>
        <span class="kind-chip" style="--k:${KIND_COLOR[u.kind]}">${KIND_LABEL[u.kind]}</span>
        <span class="slot-skill">${skillText(u, lv, i === 0)}</span>`
      : '<span class="slot-empty">＋<small>ここへドラッグ</small></span>'}
    </div>`;
  }).join('');

  // 効果のまとめ
  const fx = calcFx(team, s.units);
  const tiles = [
    ['score', 'スコア', fx.score ? `+${fx.score}%` : '-'],
    ['judge', '判定の幅', fx.judge ? `+${fx.judge}ms` : '-'],
    ['guard', 'コンボガード', fx.guard ? `${fx.guard}回` : '-'],
    ['coin', 'コイン', fx.coin ? `+${fx.coin}%` : '-'],
  ];
  $('team-fx-grid').innerHTML = tiles.map(([k, label, v]) => `<div class="fx-tile ${v === '-' ? 'off' : ''}" style="--k:${KIND_COLOR[k]}">
    <div class="fx-label">${label}</div><div class="fx-val">${v}</div><div class="fx-desc">${KIND_DESC[k]}</div></div>`).join('');

  // 所持キャラ
  const owned = acc.getCatalog().filter((u) => s.units[u.id]);
  const counts = { all: owned.length };
  for (const u of owned) counts[u.kind] = (counts[u.kind] || 0) + 1;
  $('kind-tabs').innerHTML = ['all', 'score', 'judge', 'guard', 'coin'].map((k) =>
    `<button class="kind-tab ${kindFilter === k ? 'sel' : ''}" data-k="${k}" style="--k:${k === 'all' ? 'var(--accent)' : KIND_COLOR[k]}">${k === 'all' ? 'すべて' : KIND_LABEL[k]} <small>${counts[k] || 0}</small></button>`).join('');
  $('team-count').textContent = `${owned.length} / ${acc.getCatalog().length}`;
  const sort = $('team-sort').value;
  const list = owned.filter((u) => kindFilter === 'all' || u.kind === kindFilter);
  list.sort((a, b) => sort === 'lv' ? (s.units[b.id].lv - s.units[a.id].lv) || b.rarity - a.rarity : b.rarity - a.rarity || s.units[b.id].lv - s.units[a.id].lv || a.sort - b.sort);
  $('team-units').innerHTML = list.map((u) => {
    const lv = s.units[u.id].lv;
    const pos = team.indexOf(u.id);
    return `<div class="unit-card ${pos >= 0 ? 'in-team' : ''}" data-drag="unit" data-id="${u.id}" role="button" tabindex="0" aria-label="${esc(u.name)}">
      ${pos >= 0 ? `<span class="in-tag">${pos === 0 ? 'L' : pos}</span>` : ''}
      ${unitIcon(u, 56)}
      <div class="uc-name">${esc(u.name)}</div>
      <div class="uc-meta"><span style="color:${RARITY_COLOR[u.rarity]}">${stars(u.rarity)}</span> Lv${lv}</div>
      <span class="kind-chip" style="--k:${KIND_COLOR[u.kind]}">${KIND_LABEL[u.kind]}</span>
      <div class="uc-skill">${skillText(u, lv)}</div>
    </div>`;
  }).join('') || '<p class="muted">このスキルのキャラはまだいません。ガチャで集めよう</p>';

  const hint = $('team-hint');
  hint.hidden = teamSlot == null;
  hint.textContent = teamSlot == null ? '' : `${teamSlot === 0 ? 'リーダー枠' : 'メンバー枠' + teamSlot}を選択中 → 入れたいキャラをタップ`;
}

// 編成を変えて保存(表示は先に更新)
async function commitTeam(team) {
  localTeam = team.filter(Boolean).slice(0, 5);
  renderTeam();
  try { await acc.setTeam(localTeam); } catch (e) { ui.toast(acc.errText(e)); }
  localTeam = null;
  renderTeam();
}

function placeUnit(id, slot) {
  const team = curTeam();
  const pos = team.indexOf(id);
  if (pos === slot) return;
  if (pos >= 0) {
    // 編成内での移動 = 入れ替え
    if (slot < team.length) [team[pos], team[slot]] = [team[slot], team[pos]];
    else { team.splice(pos, 1); team.push(id); }
  } else if (slot < team.length) team[slot] = id;
  else team.push(id);
  commitTeam(team);
}

function removeAt(i) {
  const team = curTeam();
  team.splice(i, 1);
  commitTeam(team);
}

// タップ操作
function onTap(el) {
  if (el.classList.contains('slot')) {
    const i = +el.dataset.i;
    teamSlot = teamSlot === i ? null : i;
    renderTeam();
  } else if (el.classList.contains('unit-card')) {
    const id = el.dataset.id;
    const team = curTeam();
    if (teamSlot != null) { const sl = teamSlot; teamSlot = null; placeUnit(id, sl); }
    else if (team.includes(id)) removeAt(team.indexOf(id));
    else if (team.length < 5) placeUnit(id, team.length);
    else ui.toast('枠がいっぱいです。枠を選ぶか、ドラッグで入れ替えてください');
  }
}

// --- ドラッグ&ドロップ (Pointer Events: マウスもタッチも) ---
let drag = null;
const LONG_PRESS = 220;

function initTeamDnd() {
  const root = $('team');
  root.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0 || ev.target.closest('.slot-x')) return;
    const el = ev.target.closest('[data-drag]') || ev.target.closest('.slot');
    if (!el) return;
    drag = { el, x: ev.clientX, y: ev.clientY, id: ev.pointerId, touch: ev.pointerType !== 'mouse', started: false, ready: ev.pointerType === 'mouse' };
    if (drag.touch) {
      drag.timer = setTimeout(() => {
        if (drag && !drag.started && drag.el.dataset.drag) { drag.ready = true; el.classList.add('lift'); navigator.vibrate?.(15); }
      }, LONG_PRESS);
    }
  });
  window.addEventListener('pointermove', (ev) => {
    if (!drag || ev.pointerId !== drag.id) return;
    const dist = Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y);
    if (!drag.started) {
      if (!drag.ready) { if (dist > 8) cancelDrag(); return; } // 長押し前に動いた = スクロール
      if (dist < 6 || !drag.el.dataset.drag) return;
      startDrag(ev);
    }
    moveGhost(ev.clientX, ev.clientY);
  });
  window.addEventListener('pointerup', (ev) => {
    if (!drag || ev.pointerId !== drag.id) return;
    const d = drag;
    if (d.started) finishDrag(ev.clientX, ev.clientY);
    else { cancelDrag(); onTap(d.el); }
  });
  window.addEventListener('pointercancel', () => cancelDrag());
  // ドラッグ中はスクロールさせない
  root.addEventListener('touchmove', (ev) => { if (drag && (drag.started || drag.ready)) ev.preventDefault(); }, { passive: false });
  root.addEventListener('contextmenu', (ev) => { if (ev.target.closest('[data-drag]')) ev.preventDefault(); });
  root.addEventListener('click', (ev) => {
    const x = ev.target.closest('.slot-x');
    if (x) { ev.stopPropagation(); removeAt(+x.dataset.x); }
  });
  root.addEventListener('keydown', (ev) => {
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('.slot, .unit-card')) { ev.preventDefault(); onTap(ev.target); }
  });
  $('kind-tabs').addEventListener('click', (ev) => { const b = ev.target.closest('.kind-tab'); if (b) { kindFilter = b.dataset.k; renderTeam(); } });
  $('btn-team-auto').addEventListener('click', autoTeam);
  $('btn-team-clear').addEventListener('click', () => commitTeam([]));
}

function startDrag(ev) {
  drag.started = true;
  const src = drag.el;
  const icon = src.querySelector('.unit-icon');
  const g = document.createElement('div');
  g.className = 'drag-ghost';
  g.innerHTML = icon ? icon.outerHTML : '';
  document.body.appendChild(g);
  drag.ghost = g;
  src.classList.add('dragging-src');
  document.body.classList.add('team-dragging');
  moveGhost(ev.clientX, ev.clientY);
}

function moveGhost(x, y) {
  if (!drag?.ghost) return;
  drag.ghost.style.transform = `translate(${x - 36}px, ${y - 36}px)`;
  const over = document.elementFromPoint(x, y)?.closest('.slot');
  for (const s of document.querySelectorAll('.slot.over')) if (s !== over) s.classList.remove('over');
  over?.classList.add('over');
  document.body.classList.toggle('drop-remove', drag.el.dataset.drag === 'slot' && !over);
}

function finishDrag(x, y) {
  const d = drag;
  const target = document.elementFromPoint(x, y)?.closest('.slot');
  cancelDrag();
  if (target) placeUnit(d.el.dataset.id, +target.dataset.i);
  else if (d.el.dataset.drag === 'slot') removeAt(+d.el.dataset.i);
}

function cancelDrag() {
  if (!drag) return;
  clearTimeout(drag.timer);
  drag.ghost?.remove();
  drag.el.classList.remove('dragging-src', 'lift');
  document.body.classList.remove('team-dragging', 'drop-remove');
  for (const s of document.querySelectorAll('.slot.over')) s.classList.remove('over');
  drag = null;
}

// 強さの目安でざっくり上位5体。いちばん強いキャラをリーダーに
function autoTeam() {
  const s = acc.getState();
  const norm = { score: 7, judge: 12, guard: 5, coin: 20 };
  const owned = acc.getCatalog().filter((u) => s.units[u.id]);
  owned.sort((a, b) => skillValue(b, s.units[b.id].lv) / norm[b.kind] - skillValue(a, s.units[a.id].lv) / norm[a.kind]);
  commitTeam(owned.slice(0, 5).map((u) => u.id));
  ui.toast('おまかせで編成しました');
}

// キーコンフィグ: 4つのレーンそれぞれに、メインのキーと連打用の2つ目のキーを好きに割り当てる
// 割り当ては settings.keys = [[メイン, 2つ目], ×4](KeyboardEvent.code。2つ目は空でもよい)
import { DEFAULT_KEYS, setKeymap, keyLabel } from './game.js';

const $ = (id) => document.getElementById(id);
const LANE_NAME = ['左', '2番目', '3番目', '右'];
// 割り当てられないキー(メニューや一時停止に使う・OSが使う)
const BANNED = new Set(['Escape', 'Tab', 'MetaLeft', 'MetaRight', 'OSLeft', 'OSRight', 'ContextMenu', 'F5', 'F11', 'F12']);
// よく使われる並び
export const PRESETS = {
  std: { name: '標準(D F J K + S G H L)', keys: DEFAULT_KEYS },
  sdkl: { name: 'S D K L', keys: [['KeyS', 'KeyA'], ['KeyD', 'KeyF'], ['KeyK', 'KeyJ'], ['KeyL', 'Semicolon']] },
  upper: { name: 'D F J K + 上の段 E R U I', keys: [['KeyD', 'KeyE'], ['KeyF', 'KeyR'], ['KeyJ', 'KeyU'], ['KeyK', 'KeyI']] },
  arrows: { name: '矢印キー(← ↓ ↑ →)', keys: [['ArrowLeft', 'KeyD'], ['ArrowDown', 'KeyF'], ['ArrowUp', 'KeyJ'], ['ArrowRight', 'KeyK']] },
};

// 保存されている割り当てが壊れていても、必ず4レーン×2つの形に直す
export function normalizeKeys(keys) {
  const ok = Array.isArray(keys) && keys.length === 4 && keys.every((k) => Array.isArray(k) && typeof k[0] === 'string' && k[0]);
  return (ok ? keys : DEFAULT_KEYS).map((k) => [k[0], typeof k[1] === 'string' ? k[1] : '']);
}

let api = null;
let waiting = null; // { lane, slot } キーを押してもらうのを待っている所

// api = { settings(), saveSettings(s), toast(msg) }
export function initKeyConfig(a) {
  api = a;
  apply();
  $('s-keypreset').innerHTML = '<option value="">プリセットから選ぶ…</option>' + Object.entries(PRESETS).map(([k, p]) => `<option value="${k}">${p.name}</option>`).join('');
  $('s-keypreset').addEventListener('change', (ev) => {
    const p = PRESETS[ev.target.value];
    ev.target.value = '';
    if (p) save(p.keys.map((k) => [...k]), `キー配置を「${p.name}」にしました`);
  });
  $('s-keys').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-slot]');
    if (!b) return;
    const lane = +b.dataset.lane, slot = +b.dataset.slot;
    if (waiting && waiting.lane === lane && waiting.slot === slot) { stop(); return; }
    waiting = { lane, slot };
    render();
  });
  $('btn-keys-reset').addEventListener('click', () => save(DEFAULT_KEYS.map((k) => [...k]), 'キー配置を初期値に戻しました'));
  // 待っている間は、ほかの操作(Esc で設定が閉じる など)より先にキーを受け取る
  window.addEventListener('keydown', onKey, true);
  // キー表の外を触ったら待つのをやめる
  document.addEventListener('pointerdown', (ev) => { if (waiting && !ev.target.closest('#s-keys')) stop(); }, true);
}

const keys = () => normalizeKeys(api.settings().keys);
// 設定を読み直したとき(クラウドから戻したときなど)にも呼ぶ
export function apply() { if (api) setKeymap(keys()); }
export const isWaiting = () => !!waiting;

function save(next, msg) {
  const s = api.settings();
  s.keys = next;
  api.saveSettings(s);
  apply();
  waiting = null;
  render();
  if (msg) api.toast(msg);
}
function stop() { waiting = null; render(); }

function onKey(ev) {
  if (!waiting) return;
  if (!$('settings').classList.contains('on')) { stop(); return; }
  ev.preventDefault(); ev.stopImmediatePropagation();
  if (ev.repeat) return;
  const { lane, slot } = waiting;
  if (ev.code === 'Escape') { stop(); return; }
  const next = keys();
  // Backspace / Delete: 2つ目のキーを外す(メインは外せない)
  if ((ev.code === 'Backspace' || ev.code === 'Delete') && slot === 1) { next[lane][1] = ''; save(next); return; }
  if (!ev.code || BANNED.has(ev.code)) { api.toast(`「${keyLabel(ev.code) || ev.key}」は割り当てられません`); return; }
  const old = next[lane][slot];
  if (old === ev.code) { stop(); return; }
  // ほかで使っているキーなら入れ替える
  for (let l = 0; l < 4; l++) for (let s = 0; s < 2; s++) {
    if ((l !== lane || s !== slot) && next[l][s] === ev.code) {
      if (!old && s === 0) { api.toast(`「${keyLabel(ev.code)}」は${LANE_NAME[l]}のレーンのメインです。先にそちらを変えてください`); return; }
      next[l][s] = old;
    }
  }
  next[lane][slot] = ev.code;
  save(next);
}

// 設定画面のキー表(開くたび・変えるたびに描き直す)
export function render() {
  const box = $('s-keys');
  if (!box || !api) return;
  box.innerHTML = keys().map((pair, l) => `<div class="kc-lane"><span class="kc-name">${LANE_NAME[l]}</span>${pair.map((code, s) => {
    const w = waiting && waiting.lane === l && waiting.slot === s;
    return `<button type="button" class="kc-key${s ? ' alt' : ''}${w ? ' wait' : ''}${code ? '' : ' empty'}" data-lane="${l}" data-slot="${s}" title="${s ? '連打用の2つ目のキー' : 'メインのキー'}(押して変える)">${w ? '押す…' : code ? keyLabel(code) : '−'}</button>`;
  }).join('')}</div>`).join('');
  $('s-keys-help').textContent = waiting
    ? `${LANE_NAME[waiting.lane]}のレーンの${waiting.slot ? '2つ目' : 'メイン'}にするキーを押してください(Esc でやめる${waiting.slot ? '・Backspace で外す' : ''})`
    : 'ボタンを押してから、割り当てたいキーを押します。下の段は連打用の2つ目のキー(2本の指で交互に押すと速く叩けます)';
}

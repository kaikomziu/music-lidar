// 「ホーム画面に追加」の案内: 何回か遊んでくれた人にだけ、ホーム画面に小さく出す
// - Chrome / Edge(PC・Android): ブラウザのインストール画面を出す(beforeinstallprompt)
// - iPhone / iPad の Safari: 共有ボタン →「ホーム画面に追加」の手順を出す
// - すでにアプリとして開いている・閉じてから14日以内・3回未満のプレイ なら出さない
import { load, save } from './storage.js';

const $ = (id) => document.getElementById(id);
const NEED_PLAYS = 3;
const SNOOZE_MS = 14 * 864e5;
let deferred = null; // ブラウザのインストール画面(あとで出す)
let ui = null; // { toast }

const installed = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function initInstall(api) {
  ui = api;
  window.addEventListener('beforeinstallprompt', (ev) => { ev.preventDefault(); deferred = ev; });
  window.addEventListener('appinstalled', () => { save('installDone', true); hide(); ui.toast('ホーム画面に追加しました。次からはアイコンから開けます'); });
  $('install-bar').addEventListener('click', onClick);
}

// 1曲遊び終わるたびに呼ぶ
export function countPlay() { save('playCount', (load('playCount', 0) || 0) + 1); }

// ホーム画面を出したときに呼ぶ。出せる条件なら案内を出す
export function maybeShowInstall() {
  const bar = $('install-bar');
  if (!bar) return;
  const ok = !installed() && !load('installDone', false) && (load('playCount', 0) || 0) >= NEED_PLAYS
    && Date.now() - (load('installSnooze', 0) || 0) > SNOOZE_MS && (deferred || isIOS());
  if (!ok) { bar.hidden = true; return; }
  bar.innerHTML = `<span class="ib-ico" aria-hidden="true">📲</span>
    <span class="ib-text"><b>ホーム画面に追加すると、アプリみたいに遊べます</b><small>全画面で開けて、オフラインでも遊べます(無料・インストールはすぐ終わります)</small></span>
    <button type="button" class="btn-glow small" data-install>${deferred ? '追加する' : '追加のしかた'}</button>
    <button type="button" class="ib-close" data-later aria-label="あとで">✕</button>`;
  bar.hidden = false;
}
function hide() { const bar = $('install-bar'); if (bar) bar.hidden = true; }

async function onClick(ev) {
  if (ev.target.closest('[data-later]')) { save('installSnooze', Date.now()); hide(); return; }
  if (!ev.target.closest('[data-install]')) return;
  if (deferred) {
    deferred.prompt();
    const r = await deferred.userChoice.catch(() => null);
    deferred = null;
    if (r?.outcome === 'accepted') save('installDone', true); else save('installSnooze', Date.now());
    hide();
    return;
  }
  // iPhone / iPad: 手順を出す
  $('install-bar').innerHTML = `<span class="ib-ico" aria-hidden="true">📲</span>
    <span class="ib-text"><b>Safari で、画面下の <span class="ib-share" aria-label="共有">⬆︎</span>(共有)→「ホーム画面に追加」</b><small>iPad は画面右上の共有ボタンです。ほかのブラウザで開いているときは、Safari で開き直してください</small></span>
    <button type="button" class="ib-close" data-later aria-label="閉じる">✕</button>`;
}

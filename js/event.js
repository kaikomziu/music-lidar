// 季節イベント。クリスマス: 毎年 12/1 〜 1/31(日本時間)
//  - 見た目をクリスマス仕様に(雪・飾り・色)
//  - 期間限定のクリスマス曲(songs の event: 'xmas')が遊べる
//  - クリスマスガチャはサーバーの mlidar_banners(theme 'xmas')で期間を決めている
// 期間外に確かめたいときは URL に ?event=xmas(戻すときは ?event=off)
const KEY = 'mlidar:eventPreview';
const q = new URLSearchParams(location.search).get('event');
if (q) { try { q === 'off' ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, q); } catch { /* noop */ } }
let preview = '';
try { preview = localStorage.getItem(KEY) || ''; } catch { /* noop */ }
export const PREVIEW = preview;

// 日本時間の月(1〜12)
const jstMonth = (ms = Date.now()) => new Date(ms + 9 * 3600e3).getUTCMonth() + 1;
// 期間限定曲の期間(日本時間の [月, 日] から [月, 日] まで)。季節イベント(season.js)と同じ
const WINDOWS = { valentine: [[2, 1], [2, 14]], tanabata: [[7, 1], [7, 7]], newyear: [[1, 1], [1, 7]], anniv: [[10, 17], [10, 23]] };
export function eventActive(id, ms = Date.now()) {
  if (PREVIEW === id) return true;
  if (id === 'xmas') { const m = jstMonth(ms); return m === 12 || m === 1; }
  const w = WINDOWS[id];
  if (w) { const d = new Date(ms + 9 * 3600e3), md = (d.getUTCMonth() + 1) * 100 + d.getUTCDate(); return md >= w[0][0] * 100 + w[0][1] && md <= w[1][0] * 100 + w[1][1]; }
  return false;
}
export const xmasActive = () => eventActive('xmas');
// 期間の表示用(12/1〜1/31)
export const XMAS_PERIOD = '12/1〜1/31';

// ---------------------------------------------------------------------------
// 見た目
// ---------------------------------------------------------------------------
export function initEvent({ songs = [] } = {}) {
  if (!xmasActive()) return;
  document.body.classList.add('xmas');
  addHat();
  addHomeBanner(songs);
  startSnow();
}

// タイトルロゴの「L」にサンタ帽
function addHat() {
  const b = document.querySelector('.logo-big b');
  if (!b || b.querySelector('.xmas-hat')) return;
  b.insertAdjacentHTML('beforeend', `<svg class="xmas-hat" viewBox="0 0 100 80" aria-hidden="true">
    <path d="M10 62q8-48 52-52 24 4 30 34l-10 4q-6-18-22-20-28 6-34 36z" fill="#ff3b4e"/>
    <path d="M62 10q24 4 30 34l-10 4q-4-20-20-30z" fill="#c81f33"/>
    <rect x="4" y="56" width="64" height="16" rx="8" fill="#fff"/><circle cx="88" cy="50" r="9" fill="#fff"/></svg>`);
}

// ホームのいちばん上にイベントのお知らせ
function addHomeBanner(songs) {
  const main = document.getElementById('home-main');
  if (!main || document.getElementById('xmas-banner')) return;
  const names = songs.map((s) => `「${s.title}」`).join('');
  main.insertAdjacentHTML('beforebegin', `<div class="xmas-banner" id="xmas-banner">
    <div class="xb-lights" aria-hidden="true"></div>
    <div class="xb-text"><small>CHRISTMAS EVENT ・ ${XMAS_PERIOD}</small><b>🎄 クリスマスイベント開催中!</b>
    <span>期間限定曲${names ? ' ' + names : ''} ・ クリスマスガチャ ・ 特製MV</span></div></div>`);
}

// 雪(プレイ中と、タブが裏にあるときは止める)
function startSnow() {
  const cv = document.createElement('canvas');
  cv.className = 'xmas-snow';
  cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const g = cv.getContext('2d');
  const flakes = [];
  let W = 0, H = 0, last = performance.now();
  const resize = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(110, (W * H) / 14000));
    while (flakes.length < n) flakes.push(newFlake(true));
    flakes.length = n;
  };
  const newFlake = (any) => ({
    x: Math.random() * (W || innerWidth), y: any ? Math.random() * (H || innerHeight) : -10,
    r: 0.8 + Math.random() ** 2 * 2.6, v: 18 + Math.random() * 40, w: Math.random() * Math.PI * 2, a: 0.35 + Math.random() * 0.55,
  });
  resize();
  addEventListener('resize', resize);
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (document.hidden || document.body.classList.contains('playing')) return;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#fff';
    for (const f of flakes) {
      f.y += f.v * dt * (0.6 + f.r / 3);
      f.w += dt * 1.2;
      f.x += Math.sin(f.w) * 12 * dt;
      if (f.y > H + 6) Object.assign(f, newFlake(false));
      g.globalAlpha = f.a;
      g.beginPath(); g.arc(f.x, f.y, f.r, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  };
  requestAnimationFrame(frame);
}

// 訪問とプレイを数える(個人は特定しない)
// 端末ごとのランダムID(clientId)と「どこから来たか」だけを1日1行でサーバー(mlidar_hit)に送る
// 来た元: URL の ?from=xxx(または utm_source)> 前のページのサイト > direct
import { rpc } from './ranking.js';
import { load, save, clientId } from './storage.js';

// 前のページのサイト → 来た元の名前
const HOSTS = [
  [/(^|\.)note\.com$/, 'note'],
  [/(^|\.)qiita\.com$/, 'qiita'],
  [/(^|\.)scratch\.mit\.edu$/, 'scratch'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
  [/(^|\.)(x\.com|twitter\.com|t\.co)$/, 'x'],
  [/(^|\.)discord(app)?\.(com|gg)$/, 'discord'],
  [/^kaikomziu\.github\.io$/, 'karuwaka'],
  [/(^|\.)google\./, 'google'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)yahoo\.(co\.jp|com)$/, 'yahoo'],
  [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
];

function detectSource() {
  const q = new URLSearchParams(location.search);
  const tag = (q.get('from') || q.get('utm_source') || '').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40);
  if (tag) return tag;
  if (q.has('embed')) return 'embed';
  if (q.has('invite')) return 'invite';
  let host = '';
  try { host = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch { /* 壊れた referrer */ }
  if (!host || host === location.hostname.replace(/^www\./, '')) return 'direct';
  for (const [re, name] of HOSTS) if (re.test(host)) return name;
  return host.replace(/[^a-z0-9._-]/g, '').slice(0, 40) || 'other';
}

// 管理者の端末・ロボットは数えない
const skip = () => load('noCount', false) || navigator.webdriver || /bot|crawl|spider|lighthouse/i.test(navigator.userAgent);

// 数え始める前から遊んでいた端末は「初めて」にしない(読み込んだ時点で端末IDや記録があるか)
const OLD = load('client', null) != null || load('best', null) != null || load('settings', null) != null;
if (OLD && !load('seen', false)) save('seen', true);

let source = 'direct';
function send(play) {
  if (skip()) return;
  const isNew = !load('seen', false);
  rpc('mlidar_hit', { p_vid: clientId(), p_source: source, p_new: isNew, p_play: play }, { keepalive: true })
    .then(() => { if (isNew) save('seen', true); }).catch(() => {});
}

// 起動時に1回。同じタブで読み直したときは最初の来た元を使う
export function countVisit() {
  try {
    source = sessionStorage.getItem('mlidar:src') || detectSource();
    sessionStorage.setItem('mlidar:src', source);
  } catch { source = detectSource(); }
  send(false);
}

// 1曲始めるたびに
export function countPlay() { send(true); }

// 管理者ページを開いた端末は、これから数えない
export function markNoCount() { save('noCount', true); }

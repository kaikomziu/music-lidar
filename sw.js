// オフライン対応: 一度読み込んだファイルを端末に保存しておき、ネットがなくても遊べるようにする
// (内蔵曲の音はブラウザで合成するので、ページと JS がそろえばオフラインでも遊べる。ランキングなどはオンラインのみ)
const CACHE = 'mlidar-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return; // ランキング・アカウントは保存しない
  const same = url.origin === location.origin;
  const font = /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !font) return;
  if (same && url.pathname.includes('/tools/')) return; // 書き出しツールは対象外
  const page = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.endsWith('version.json');
  if (page) {
    // ページはネット優先(更新をすぐ反映)。つながらないときは保存しておいた版
    e.respondWith(fetch(req)
      .then((res) => { if (res.ok) put(req, res.clone()); return res; })
      .catch(async () => (await caches.match(req, { ignoreSearch: true })) || caches.match(self.registration.scope)));
    return;
  }
  // バージョン付きの JS・CSS や画像・音源・フォントは、保存しておいた版を優先
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok || res.type === 'opaque') put(req, res.clone());
    return res;
  })));
});

async function put(req, res) {
  const c = await caches.open(CACHE);
  await c.put(req, res);
  // 同じファイルの古い版(?v= が違うもの)は消す
  const url = new URL(req.url);
  if (!url.search || url.origin !== location.origin) return;
  for (const k of await c.keys()) {
    const u = new URL(k.url);
    if (u.pathname === url.pathname && u.search !== url.search) c.delete(k);
  }
}

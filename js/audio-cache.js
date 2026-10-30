// 合成した曲の音をブラウザ(IndexedDB)に保存して、2回目以降は合成を飛ばす。
// キーは「曲ID + 曲データのハッシュ + 合成エンジンの版」。曲を作り直すと自動で作り直される。
import { renderEvents } from './audio.js';
import { hashStr } from './composer.js';

const SYNTH_VERSION = 3; // 音色や合成方法を変えたら上げる
const DB = 'mlidar-audio', STORE = 'songs', USED = 'used';
const MAX_CACHED = 24; // 端末に保存しておく曲数(1曲 約10〜20MB)。古く使ったものから消す

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      if (!db.objectStoreNames.contains(USED)) db.createObjectStore(USED); // key → 最後に使った時刻
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close(); // 新しい版のページが開いたら道をあける
      resolve(db);
    };
    // 古い版のページが別タブで開いていて更新できないときは、保存なしで進める(読み込みが止まらないように)
    req.onblocked = () => resolve(null);
    req.onerror = () => reject(req.error);
  });
}
const dbp = (() => { try { return openDB().catch(() => null); } catch { return Promise.resolve(null); } })();

function tx(db, mode, fn, stores = STORE) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(stores, mode);
    const r = Array.isArray(stores) ? fn(...stores.map((n) => t.objectStore(n))) : fn(t.objectStore(stores));
    t.oncomplete = () => resolve(r?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export function songKey(id, events, opts) {
  const sig = JSON.stringify([SYNTH_VERSION, opts, events.map((e) => [e.type, +e.t.toFixed(4), +(e.dur || 0).toFixed(4), e.vel, e.midi ?? e.midis ?? 0])]);
  return `${id}:${hashStr(sig).toString(36)}`;
}

async function readCache(key) {
  const db = await dbp;
  if (!db) return null;
  const rec = await tx(db, 'readonly', (st) => st.get(key));
  if (!rec) return null;
  tx(db, 'readwrite', (u) => u.put(Date.now(), key), USED).catch(() => {});
  // AudioContext を使わずに作る(ユーザー操作前でも読めるように)
  const buf = new AudioBuffer({ numberOfChannels: 2, length: rec.length, sampleRate: rec.sr });
  [rec.L, rec.R].forEach((pcm, c) => {
    const i16 = new Int16Array(pcm), out = buf.getChannelData(c);
    for (let i = 0; i < i16.length; i++) out[i] = i16[i] / 32767;
  });
  return buf;
}

async function writeCache(key, buf) {
  const db = await dbp;
  if (!db) return;
  const id = key.split(':')[0];
  const pack = (c) => {
    const f = buf.getChannelData(c), i16 = new Int16Array(f.length);
    for (let i = 0; i < f.length; i++) i16[i] = Math.max(-1, Math.min(1, f[i])) * 32767;
    return i16.buffer;
  };
  // 同じ曲の古い版と、長く使っていない曲は消す
  const keys = (await tx(db, 'readonly', (st) => st.getAllKeys())) || [];
  const used = new Map();
  await tx(db, 'readonly', (u) => { const c = u.openCursor(); c.onsuccess = () => { const r = c.result; if (r) { used.set(r.key, r.value); r.continue(); } }; }, USED);
  const drop = new Set(keys.filter((k) => String(k).startsWith(id + ':') && k !== key));
  const rest = keys.filter((k) => k !== key && !drop.has(k)).sort((a, b) => (used.get(a) || 0) - (used.get(b) || 0));
  for (const k of rest.slice(0, Math.max(0, rest.length - (MAX_CACHED - 1)))) drop.add(k);
  await tx(db, 'readwrite', (st, u) => {
    for (const k of drop) { st.delete(k); u.delete(k); }
    st.put({ sr: buf.sampleRate, length: buf.length, L: pack(0), R: pack(1) }, key);
    u.put(Date.now(), key);
  }, [STORE, USED]);
}

export async function loadSongAudio(id, events, duration, opts, onProgress = null) {
  const key = songKey(id, events, opts);
  try {
    const hit = await readCache(key);
    if (hit) { onProgress?.(1); return hit; }
  } catch (e) { console.warn('audio cache read', e); }
  const buf = await renderEvents(events, duration, opts, onProgress);
  writeCache(key, buf).catch((e) => console.warn('audio cache write', e));
  return buf;
}

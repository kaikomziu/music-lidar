// 合成した曲の音をブラウザ(IndexedDB)に保存して、2回目以降は合成を飛ばす。
// キーは「曲ID + 曲データのハッシュ + 合成エンジンの版」。曲を作り直すと自動で作り直される。
import { renderEvents } from './audio.js';
import { hashStr } from './composer.js';

const SYNTH_VERSION = 3; // 音色や合成方法を変えたら上げる
const DB = 'mlidar-audio', STORE = 'songs';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
const dbp = (() => { try { return openDB().catch(() => null); } catch { return Promise.resolve(null); } })();

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const st = t.objectStore(STORE);
    const r = fn(st);
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
  // 同じ曲の古い版は消す
  const keys = await tx(db, 'readonly', (st) => st.getAllKeys());
  await tx(db, 'readwrite', (st) => {
    for (const k of keys || []) if (String(k).startsWith(id + ':') && k !== key) st.delete(k);
    st.put({ sr: buf.sampleRate, length: buf.length, L: pack(0), R: pack(1) }, key);
  });
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

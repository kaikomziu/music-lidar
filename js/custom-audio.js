// 譜面メーカーで使う「自分で選んだ音声」(管理者だけが置ける)
// しくみ:
//   - 置くとき: 音声ファイルをブラウザで AES-GCM(256bit・曲ごとにランダムな鍵)で暗号化し、Edge Function mlidar-audio が返す
//     署名つきURLで storage の mlidar-audio/<id>.bin へ直接送る。暗号化前の音声はどこにも送らない
//   - 遊ぶとき: mlidar_audio_get で鍵と曲の情報を受け取り、.bin を取ってきてブラウザで復号する
//   - 譜面の曲は 'a:<音声id>'。曲一覧(entries)には入れず、このモジュールで作ったエントリーを使う
import { rpc, KEY } from './ranking.js';
import { load } from './storage.js';
import { analyzeFile } from './analyzer.js';
import { generateChart, chartStats, DIFFS, hashStr } from './composer.js';

const SUPA = 'https://kifnzvktwbomxthzvvgy.supabase.co';
const FN = SUPA + '/functions/v1/mlidar-audio';
const FILE_URL = (id) => `${SUPA}/storage/v1/object/public/mlidar-audio/${id}.bin`;
export const MAX_AUDIO_MB = 25;
const token = () => load('token', null);

const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode(...u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

// 暗号化: [iv 12バイト][暗号文+認証タグ]
export async function encryptAudio(bytes) {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const k = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, bytes));
  const out = new Uint8Array(12 + ct.length);
  out.set(iv); out.set(ct, 12);
  return { data: out, key: b64(raw) };
}
export async function decryptAudio(buf, keyB64) {
  const u8 = new Uint8Array(buf);
  const k = await crypto.subtle.importKey('raw', unb64(keyB64), 'AES-GCM', false, ['decrypt']);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: u8.subarray(0, 12) }, k, u8.subarray(12));
}

async function callFn(body) {
  const res = await fetch(FN, { method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token(), ...body }) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || 'UPLOAD ' + res.status);
  return j;
}

// 音声を暗号化して置く。meta: { title, artist, bpm, offset, duration }。戻り値は音声id
export async function uploadAudio(bytes, meta, onStep) {
  if (bytes.byteLength > MAX_AUDIO_MB * 1048576) throw new Error('TOO_BIG');
  onStep?.('暗号化しています…');
  const { data, key } = await encryptAudio(bytes);
  onStep?.('アップロードの準備…');
  const b = await callFn({ action: 'begin', ...meta, size: data.byteLength, key });
  onStep?.(`アップロード中…(${(data.byteLength / 1048576).toFixed(1)}MB)`);
  const up = await fetch(`${SUPA}/storage/v1/object/upload/sign/mlidar-audio/${b.path}?token=${encodeURIComponent(b.uploadToken)}`, {
    method: 'PUT', headers: { apikey: KEY, 'Content-Type': 'application/octet-stream', 'x-upsert': 'false' }, body: data,
  });
  if (!up.ok) throw new Error('UPLOAD ' + up.status);
  await callFn({ action: 'done', id: b.id });
  return b.id;
}

export const AUDIO_ERR = {
  NOT_ADMIN: '音声を使えるのは管理者だけです', AUTH: 'ログインが必要です', BAD_AUDIO: '曲名・BPM・長さを確かめてください',
  TOO_BIG: `音声ファイルは ${MAX_AUDIO_MB}MB までです`, NOT_OWNER: '自分が置いた音声ではありません', NOT_UPLOADED: 'アップロードが終わっていません',
};

// 音声と、それを使う譜面を消す
export async function deleteAudio(id) { const r = await callFn({ action: 'delete', id }); cache.delete(id); return r; }
export const listMyAudio = () => rpc('mlidar_audio_list', { p_token: token() });
export const saveAudioMeta = (id, m) => rpc('mlidar_audio_meta', { p_token: token(), p_id: id, p_title: m.title, p_artist: m.artist || '', p_bpm: m.bpm, p_offset: m.offset || 0 });

// --- エントリー(ゲームと譜面メーカーで使う曲の形) ---
const COLOR = '#c58bff';
const cache = new Map();

function makeEntry(info, opts = {}) {
  const e = {
    id: 'a:' + info.id, audioId: info.id, uploaded: true, local: true, // local: 曲のランキング・MV・コースの対象外
    title: info.title, artist: info.artist || '', genre: 'UPLOAD', color: COLOR, bpm: +info.bpm, offset: +info.offset || 0,
    duration: +info.duration, previewAt: +info.duration * 0.35, levels: { easy: 1, normal: 1, hard: 1 }, charts: null, onsets: [],
    buffer: opts.buffer || null, bytes: opts.bytes || null, rendering: null, progress: 0,
    load() {
      if (this.buffer) return Promise.resolve(this.buffer);
      return (this.rendering ||= (async () => {
        const res = await fetch(FILE_URL(info.id));
        if (!res.ok) throw new Error('audio ' + res.status);
        this.progress = 0.6;
        const key = info.key || (await rpc('mlidar_audio_get', { p_id: info.id }))?.key;
        if (!key) throw new Error('NO_KEY');
        this.bytes = await decryptAudio(await res.arrayBuffer(), key);
        this.buffer = await new OfflineAudioContext(2, 1, 44100).decodeAudioData(this.bytes.slice(0));
        this.progress = 1;
        return this.buffer;
      })().catch((err) => { this.rendering = null; throw err; }));
    },
  };
  return e;
}

// 置いてある音声のエントリー(なければ情報を取りに行く)
export async function audioEntry(id) {
  if (cache.has(id)) return cache.get(id);
  const info = await rpc('mlidar_audio_get', { p_id: id });
  if (!info) throw new Error('NOT_FOUND');
  const e = makeEntry(info);
  cache.set(id, e);
  return e;
}
export function entryFromInfo(info) {
  if (!cache.has(info.id)) cache.set(info.id, makeEntry(info));
  return cache.get(info.id);
}

// 手元のファイルから、まだ置いていないエントリーを作る(譜面メーカー用。投稿するときに暗号化して置く)
export async function pendingEntry(file) {
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > MAX_AUDIO_MB * 1048576) throw new Error('TOO_BIG');
  const a = await analyzeFile(bytes);
  const hash = hashStr(file.name + ':' + bytes.byteLength).toString(36);
  const e = {
    id: 'up-' + hash, uploaded: false, local: true, pending: true, fileBytes: bytes,
    title: file.name.replace(/\.[^.]+$/, '').slice(0, 80), artist: '', genre: 'UPLOAD', color: COLOR, bpm: Math.round(a.bpm * 100) / 100, offset: 0,
    duration: a.buffer.duration, previewAt: a.buffer.duration * 0.35, buffer: a.buffer, load() { return Promise.resolve(a.buffer); },
  };
  fillCharts(e, a.cands, hash);
  return e;
}

// 置いたあとのエントリーへ移す(音声はもう手元にあるので読み直さない)
export function promote(pend, id) {
  const e = makeEntry({ id, title: pend.title, artist: pend.artist, bpm: pend.bpm, offset: pend.offset, duration: pend.duration }, { buffer: pend.buffer, bytes: pend.fileBytes });
  e.charts = pend.charts; e.levels = pend.levels; e.onsets = pend.onsets;
  cache.set(id, e);
  return e;
}

// 譜面メーカー用: 自動譜面(下敷き)と、録音補正に使う音の位置を用意する
export async function prepareForEditor(e) {
  if (e.charts) return e;
  await e.load();
  const a = await analyzeFile(e.bytes.slice(0));
  fillCharts(e, a.cands, e.audioId);
  return e;
}

function fillCharts(e, cands, seed) {
  e.charts = {}; e.stats = {}; e.levels = {};
  for (const d of DIFFS) {
    e.charts[d] = generateChart(cands, d, e.duration, hashStr(String(seed)));
    e.stats[d] = chartStats(e.charts[d]);
    e.levels[d] = Math.max(1, Math.min(15, Math.round((e.stats[d].notes / Math.max(10, e.duration)) * 2.1 + (d === 'hard' ? 1 : 0))));
  }
  const ts = [...cands.map((c) => c.t)].sort((x, y) => x - y);
  e.onsets = ts.filter((t, i) => !i || t - ts[i - 1] > 0.012);
}

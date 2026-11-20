// 歌詞(プレイ中に画面の上に出す)。サーバーの mlidar_lyrics に曲ごとに置き、管理者が譜面メーカーで時刻を合わせて保存する
// 形: [[歌い始めの秒, 歌い終わりの秒, 行], ...]
import { rpc } from './ranking.js';
import { load } from './storage.js';

const cache = new Map(); // 曲id → Promise<lines | null>
let withLyrics = null; // 歌詞のある曲の id(読めたら、ない曲は問い合わせない)
const index = rpc('mlidar_lyrics_songs', {}).then((a) => { withLyrics = new Set(a || []); }).catch(() => {});
export const hasLyrics = (songId) => !!withLyrics?.has(songId);
export const lyricsIndexReady = () => index;

export function lyricsFor(songId) {
  if (withLyrics && !withLyrics.has(songId)) return Promise.resolve(null);
  if (!cache.has(songId)) {
    cache.set(songId, rpc('mlidar_lyrics_get', { p_song: songId })
      .then((r) => (Array.isArray(r) && r.length ? r : null))
      .catch(() => { cache.delete(songId); return null; }));
  }
  return cache.get(songId);
}

// 遊ぶ前に読む。通信が遅いときはゲームを待たせない(歌詞なしで始める)
export function lyricsQuick(songId, ms = 1500) {
  return Promise.race([lyricsFor(songId), new Promise((r) => setTimeout(() => r(null), ms))]);
}

export async function saveLyrics(songId, lines) {
  await rpc('mlidar_lyrics_save', { p_token: load('token', null), p_song: songId, p_lines: lines });
  cache.set(songId, Promise.resolve(lines.length ? lines : null));
  if (withLyrics) { if (lines.length) withLyrics.add(songId); else withLyrics.delete(songId); }
}

// 歌い終わりを決める: 行の長さ(文字数)からの目安と、次の行の少し前の早い方。長くても8秒
export function fillEnds(lines) {
  const sorted = lines.slice().sort((x, y) => x[0] - y[0]);
  return sorted.map(([a, , s], i) => {
    const next = sorted[i + 1]?.[0];
    const est = Math.max(1.5, [...s.replace(/[\s()（）!！?？、。]/g, '')].length * 0.28 + 0.6);
    let end = a + Math.min(8, est);
    if (next != null) end = Math.min(end, next - 0.05);
    return [round(a), round(Math.max(a + 0.3, end)), s];
  });
}
const round = (x) => Math.round(x * 100) / 100;

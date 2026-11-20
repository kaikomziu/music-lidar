// リプレイ: プレイ中のキーの押し・離し [判定に使った曲の時刻(秒), レーン, 1=押す/0=離す] を記録して、あとで同じ入力を流し直す
// - 自己ベストを更新したら、端末(最大 15 譜面)とサーバー(mlidar_replays・ランキングに記録したスコアだけ)に残す
// - レーンがランダムのプレイは同じ配置を作れないので残さない
import { rpc } from './ranking.js';
import { load, save } from './storage.js';

// 「レーンと押し/離し(a〜h)」+「前の操作からのミリ秒(36進数)」をカンマでつなぐ
export function encodeInputs(inp) {
  let prev = 0;
  return inp.map(([t, l, d]) => {
    const ms = Math.max(prev, Math.round(t * 1000));
    const s = String.fromCharCode(97 + l * 2 + (d ? 0 : 1)) + (ms - prev).toString(36);
    prev = ms;
    return s;
  }).join(',');
}
export function decodeInputs(str) {
  let ms = 0;
  return String(str || '').split(',').filter(Boolean).map((s) => {
    const c = s.charCodeAt(0) - 97;
    ms += parseInt(s.slice(1), 36) || 0;
    return [ms / 1000, c >> 1, c & 1 ? 0 : 1];
  });
}

const KEY = (id, d) => `replay:${id}/${d}`;
export const localReplay = (id, d) => load(KEY(id, d), null);
export function saveLocalReplay(id, d, score, inputs) {
  save(KEY(id, d), { score, inputs: encodeInputs(inputs), at: Date.now() });
  const list = load('replays', []).filter((k) => k !== KEY(id, d));
  list.push(KEY(id, d));
  while (list.length > 15) save(list.shift(), null); // 古いものから消す(容量のため)
  save('replays', list);
}
export function uploadReplay(id, d, client, name, score, inputs) {
  return rpc('mlidar_replay_put', { p_song: id, p_diff: d, p_client: client, p_name: name, p_score: score, p_inputs: encodeInputs(inputs) }).catch(() => false);
}
export const topReplays = (id, d) => rpc('mlidar_replay_top', { p_song: id, p_diff: d, p_limit: 10 }).catch(() => []);
export const getReplay = (rid) => rpc('mlidar_replay_get', { p_id: rid });

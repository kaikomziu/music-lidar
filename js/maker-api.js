// みんなの譜面 (Supabase RPC)
import { rpc } from './ranking.js';
import { load } from './storage.js';

const token = () => load('token', null);

export const CHART_ERR = {
  TOO_FEW_NOTES: 'ノーツが10個以上ないと投稿できません',
  TOO_MANY: 'ノーツ(5000個まで)かギミック(300個まで)が多すぎます',
  TOO_MANY_CHARTS: '投稿できる譜面は1人50個までです',
  NOT_OWNER: '自分の譜面ではありません',
  BAD_CHART: '譜面データが正しくありません',
  AUTH: 'ログインが必要です',
};

// notes: [{t, lane, end?}] (秒) → [[ms, lane, endMs|null]]
export const packNotes = (notes) => notes.map((n) => [Math.round(n.t * 1000), n.lane, n.end ? Math.round(n.end * 1000) : null]);
export const unpackNotes = (arr) => arr.map(([t, lane, e]) => (e ? { t: t / 1000, lane, end: e / 1000 } : { t: t / 1000, lane })).sort((a, b) => a.t - b.t || a.lane - b.lane);

export function saveChart({ id, song, title, level, notes, gimmicks }) {
  return rpc('mlidar_chart_save', { p_token: token(), p_id: id || null, p_song: song, p_title: title, p_level: level, p_notes: packNotes(notes), p_gimmicks: gimmicks });
}
export const deleteChart = (id) => rpc('mlidar_chart_delete', { p_token: token(), p_id: id });
export const listCharts = ({ song = '', sort = 'new', q = '', limit = 50, offset = 0 } = {}) =>
  rpc('mlidar_chart_list', { p_song: song, p_sort: sort, p_q: q, p_token: token(), p_limit: limit, p_offset: offset });
export async function getChart(id) {
  const c = await rpc('mlidar_chart_get', { p_id: id });
  if (!c) throw new Error('NOT_FOUND');
  return { ...c, notes: unpackNotes(c.notes) };
}
export const likeChart = (id) => rpc('mlidar_chart_like', { p_token: token(), p_id: id });
export const countPlay = (id) => rpc('mlidar_chart_play', { p_id: id }).catch(() => {});
export const fetchChartRanking = (id, client, limit = 20) => rpc('mlidar_chart_ranking', { p_id: id, p_client: client, p_limit: limit });
export const submitChartScore = (id, client, name, r) =>
  rpc('mlidar_chart_submit', { p_id: id, p_client: client, p_name: name, p_score: r.score, p_accuracy: Math.round(r.accuracy * 100) / 100, p_max_combo: r.maxCombo, p_fc: r.fc, p_ap: r.ap });

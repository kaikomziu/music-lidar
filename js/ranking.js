// オンラインランキング (Supabase RPC)
const URL = 'https://kifnzvktwbomxthzvvgy.supabase.co/rest/v1/rpc/';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZm56dmt0d2JvbXh0aHp2dmd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzgxMzgsImV4cCI6MjA5MzQxNDEzOH0.M7nXP-u--6J_6rRpgz1cJj21_7KX6MtfTmZy77Xf_IE';

async function rpc(fn, body) {
  const res = await fetch(URL + fn, {
    method: 'POST',
    headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(fn + ' ' + res.status);
  return res.json();
}

export function fetchRanking(song, diff, client, limit = 20) {
  return rpc('mlidar_ranking', { p_song: song, p_diff: diff, p_client: client, p_limit: limit });
}

export function submitScore(song, diff, client, name, r) {
  return rpc('mlidar_submit', {
    p_song: song, p_diff: diff, p_client: client, p_name: name,
    p_score: r.score, p_accuracy: Math.round(r.accuracy * 100) / 100, p_max_combo: r.maxCombo, p_fc: r.fc, p_ap: r.ap,
  });
}

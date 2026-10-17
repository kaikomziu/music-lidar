// アカウント・コイン・ガチャ・編成・クエスト (サーバー: Supabase RPC)
import { rpc } from './ranking.js';
import { load, save } from './storage.js';

const ERR = {
  AUTH: 'ログインの有効期限が切れました。もう一度ログインしてください',
  BAD_NAME: '名前は1〜16文字で入力してください',
  BAD_PASS: 'パスワードは6〜72文字で入力してください',
  NAME_TAKEN: 'その名前はもう使われています',
  BAD_LOGIN: '名前かパスワードが違います',
  NO_COINS: 'コインが足りません',
  BAD_TEAM: '編成が正しくありません',
  NOT_CLAIMABLE: 'まだ受け取れません',
};
export const errText = (e) => ERR[e?.message] || 'エラー: ' + (e?.message || e);

let token = load('token', null);
let state = null;
let catalog = null;
const listeners = new Set();

export const onChange = (fn) => listeners.add(fn);
const emit = () => listeners.forEach((fn) => fn(state));

export const isLoggedIn = () => !!token && !!state;
export const getState = () => state;
export const getCatalog = () => catalog || [];
export const unitById = (id) => getCatalog().find((u) => u.id === id);

function setSession(r) {
  token = r.token;
  save('token', token);
  state = r.state;
  emit();
}

async function call(fn, args) {
  try {
    return await rpc(fn, { p_token: token, ...args });
  } catch (e) {
    if (e.message === 'AUTH') { token = null; state = null; save('token', null); emit(); }
    throw e;
  }
}

export async function init() {
  try { catalog = await rpc('mlidar_catalog', {}); } catch (e) { console.error(e); }
  if (token) {
    try { state = await call('mlidar_state', {}); } catch (e) { console.error(e); }
  }
  emit();
}

export async function register(name, pass) { setSession(await rpc('mlidar_register', { p_name: name, p_pass: pass })); }
export async function login(name, pass) { setSession(await rpc('mlidar_login', { p_name: name, p_pass: pass })); }
export async function logout() {
  const t = token;
  token = null; state = null; save('token', null); emit();
  try { await rpc('mlidar_logout', { p_token: t }); } catch { /* already gone */ }
}

export async function refresh() { if (token) { state = await call('mlidar_state', {}); emit(); } }

export async function gacha(count) {
  const r = await call('mlidar_gacha', { p_count: count });
  state = r.state; emit();
  return r.results;
}

export async function setTeam(ids) {
  state = await call('mlidar_set_team', { p_team: ids });
  emit();
}

export async function claim(id) {
  const r = await call('mlidar_claim', { p_id: id });
  state = r.state; emit();
  return r.reward;
}

export async function playResult(song, diff, builtin, r) {
  const raw = { score: r.score, accuracy: Math.round(r.accuracy * 100) / 100, maxCombo: r.maxCombo, fc: r.fc, ap: r.ap, hits: r.hits, rank: r.rank };
  const res = await call('mlidar_play_result', { p_song: song, p_diff: diff, p_builtin: builtin, p_raw: raw, p_team_score: r.teamScore });
  state = res.state; emit();
  return res;
}

export const teamFx = () => state?.fx || { score: 0, judge: 0, guard: 0, coin: 0 };
export const claimableCount = () => (state?.missions || []).filter((m) => !m.claimed && m.progress >= m.goal).length;

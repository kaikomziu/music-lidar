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
  BANNER_CLOSED: 'このガチャは終了しました',
  KA_USED: 'このかるわかGAMESアカウントは、すでに別のMUSIC LiDARアカウントと紐づいています',
  ALREADY_LINKED: 'そのMUSIC LiDARアカウントは、すでに別のかるわかGAMESアカウントに引き継がれています',
  LOCKED: '失敗が続いたため、しばらくしてからお試しください',
  KA_LOAD: 'かるわかGAMESアカウントの読み込みに失敗しました。通信環境を確認してください',
  MOVED: 'ログイン方法が変わりました。「かるわかGAMESアカウント」でログインしてください',
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
  autoKaLogin();
}

// ---- かるわかGAMESアカウントでのログイン ----
// 共通部品(game-links の karuwaka-account.js)を読み込んで使う。ログイン状態は kaikomziu.github.io の全ゲームで共通。
const KA_SRC = 'https://kaikomziu.github.io/game-links/js/karuwaka-account.js';
let kaPromise = null;
function loadKa() {
  if (window.KaAccount) return Promise.resolve(window.KaAccount);
  if (!kaPromise) {
    kaPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = KA_SRC;
      s.setAttribute('data-badge', 'off'); // 右下の「ログイン」ボタンは出さない
      s.onload = () => resolve(window.KaAccount);
      s.onerror = () => { kaPromise = null; reject(new Error('KA_LOAD')); };
      document.head.appendChild(s);
    });
  }
  return kaPromise;
}
export const kaProfile = () => window.KaAccount?.user() || null;

// ログイン画面を出し、ログインできたらMUSIC LiDARにもログインする。'ok' | 'unlinked'(初めて: 新規か引き継ぎを選ぶ) | null(閉じた)
export async function kaLogin() {
  const KA = await loadKa();
  await KA.ready;
  if (!(await KA.requireLogin())) return null;
  const r = await rpc('mlidar_ka_login', { p_ka_token: KA.token() });
  if (!r.linked) return 'unlinked';
  setSession(r);
  return 'ok';
}
// 新しく始める(コインとキャラ3体つき)
export async function kaNew() {
  const KA = await loadKa();
  setSession(await rpc('mlidar_ka_new', { p_ka_token: KA.token() }));
  return true;
}
// 以前のMUSIC LiDARのアカウントを、名前とパスワードで引き継ぐ
export async function kaClaim(name, pass) {
  const KA = await loadKa();
  const r = await rpc('mlidar_ka_claim', { p_ka_token: KA.token(), p_name: name, p_pass: pass });
  if (r.error) throw new Error(r.error);
  setSession(r);
  return true;
}
// 以前の方式でログイン中の人が、いまのアカウントをかるわかGAMESアカウントに紐づける
export async function kaLink() {
  const KA = await loadKa();
  await KA.ready;
  if (!(await KA.requireLogin())) return null;
  state = await rpc('mlidar_ka_link', { p_token: token, p_ka_token: KA.token() });
  emit();
  return true;
}
// ほかのゲームでかるわかGAMESアカウントにログイン済みなら、MUSIC LiDARにも自動でログインする(紐づけ済みの場合だけ)
async function autoKaLogin() {
  if (token) return;
  try {
    const KA = await loadKa();
    if (!(await KA.ready)) return;
    const r = await rpc('mlidar_ka_login', { p_ka_token: KA.token() });
    if (r.linked) setSession(r);
  } catch (e) { /* 通信できなくても、そのままゲストで遊べる */ }
}
// ログアウトは、かるわかGAMESアカウントからのログアウトも兼ねる(ほかのゲームでもログアウトされる)
export async function logout() {
  const t = token;
  token = null; state = null; save('token', null); emit();
  try { await rpc('mlidar_logout', { p_token: t }); } catch { /* already gone */ }
  try { await window.KaAccount?.logout(); } catch { /* ignore */ }
}

export async function refresh() { if (token) { state = await call('mlidar_state', {}); emit(); } }

export async function gacha(count) {
  const r = await call('mlidar_gacha', { p_count: count });
  state = r.state; emit();
  return r.results;
}

// イベントガチャ(期間限定)
export async function gachaEvent(banner, count) {
  const r = await call('mlidar_gacha_event', { p_banner: banner, p_count: count });
  state = r.state; emit();
  return r.results;
}
// ログイン中は1分おきに「いまどの画面にいるか」を送る(管理者ページの「いまオンライン」用)
export function ping(place) {
  if (!token) return;
  rpc('mlidar_ping', { p_token: token, p_place: place }).catch(() => {});
}
export const isAdmin = () => !!state?.admin;
// みんなでライブの部屋一覧(部屋の掲示だけ。対戦の通信は WebRTC)
export const lobbyList = () => rpc('mlidar_lobby_list', {});
export const lobbyPut = (code, song, n, status) => call('mlidar_lobby_put', { p_code: code, p_song: song, p_n: n, p_status: status });
export const lobbyClose = (code) => { if (token) rpc('mlidar_lobby_close', { p_token: token, p_code: code }).catch(() => {}); };
// 開催中・開催予定のガチャ(ログイン不要)
export const fetchBanners = () => rpc('mlidar_banners', {});

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

// 実績バッジ: プレイの記録から「できたこと」をバッジにして、プロフィールに飾る
// 判定はすべて、サーバーにある記録(best・stats・meta)からこの画面で計算する(バッジ自体は保存しない)
// 自分のバッジが増えたら、ホームに戻ったときにお知らせを出す(覚えておくのは端末の mlidar:badges)
import { load, save } from './storage.js';

// test(c): c は ctx()。数を返すものは goal と比べる
export const BADGES = [
  { id: 'first', icon: '🎵', name: 'はじめの一歩', desc: '1曲プレイする', n: (c) => c.plays, goal: 1 },
  { id: 'play100', icon: '🔁', name: '常連さん', desc: '累計100プレイ', n: (c) => c.plays, goal: 100 },
  { id: 'play1000', icon: '🏟️', name: '音ゲーの住人', desc: '累計1000プレイ', n: (c) => c.plays, goal: 1000 },
  { id: 'fc', icon: '⭐', name: 'フルコンボ', desc: 'はじめてのフルコンボ', n: (c) => c.fc, goal: 1 },
  { id: 'fc_hard10', icon: '🌟', name: 'HARD 制圧', desc: 'HARD で10譜面フルコンボ', n: (c) => c.fcHard, goal: 10 },
  { id: 'ap', icon: '💎', name: 'パーフェクト', desc: 'はじめての ALL PERFECT', n: (c) => c.ap, goal: 1 },
  { id: 'ap10', icon: '💠', name: '精密機械', desc: '10譜面で ALL PERFECT', n: (c) => c.apCharts, goal: 10 },
  { id: 's30', icon: '🏆', name: 'S ハンター', desc: '30譜面でランク S 以上', n: (c) => c.sCharts, goal: 30 },
  { id: 'lv13s', icon: '😈', name: '鬼畜を超えて', desc: 'Lv13 以上の HARD でランク S 以上', n: (c) => c.hardS, goal: 1 },
  { id: 'combo1000', icon: '💥', name: '1000 コンボ', desc: '1曲で1000コンボ', n: (c) => c.maxCombo, goal: 1000 },
  { id: 'genre10', icon: '🎼', name: 'ジャンル旅行', desc: '10ジャンルの曲で記録を残す', n: (c) => c.genres, goal: 10 },
  { id: 'allsongs', icon: '👑', name: '全曲制覇', desc: 'いつでも遊べる曲をすべてプレイ', n: (c) => c.songs, goal: (c) => c.songTotal },
  { id: 'streak7', icon: '🔥', name: '1週間つづけた', desc: '連続プレイ7日', n: (c) => c.streak, goal: 7 },
  { id: 'streak30', icon: '☄️', name: '1か月つづけた', desc: '連続プレイ30日', n: (c) => c.streak, goal: 30 },
  { id: 'win10', icon: '⚔️', name: '勝負師', desc: 'ランダムマッチで10勝', n: (c) => c.wins, goal: 10 },
  { id: 'invite1', icon: '🤝', name: '仲間を呼んだ', desc: '友だちを1人招待する', n: (c) => c.invites, goal: 1 },
  { id: 'invite5', icon: '📣', name: '広め隊', desc: '友だちを5人招待する', n: (c) => c.invites, goal: 5 },
  { id: 'invite10', icon: '👑', name: 'アンバサダー', desc: '友だちを10人招待する', n: (c) => c.invites, goal: 10 },
  { id: 'invited', icon: '🎟️', name: '招待で参加', desc: '友だちの招待コードで始める', n: (c) => c.invited, goal: 1 },
  { id: 'event1', icon: '🎉', name: 'イベント参加', desc: '季節イベントのスコアアタックに挑戦する', n: (c) => c.events, goal: 1 },
  { id: 'event4', icon: '🗓️', name: '四季めぐり', desc: '春・夏・ハロウィン・クリスマスのイベントすべてに参加', n: (c) => c.eventKinds, goal: 4 },
  { id: 'units20', icon: '🧩', name: 'キャラ収集家', desc: 'キャラを20種類集める', n: (c) => c.units, goal: 20 },
  { id: 'skins10', icon: '👗', name: 'おしゃれさん', desc: '着せ替えを10個持つ', n: (c) => c.skins, goal: 10 },
  { id: 'dan1', icon: '🥋', name: '有段者', desc: '段位道場で初段に合格', n: (c) => c.dan, goal: 1 },
  { id: 'dan10', icon: '🐉', name: '十段', desc: '段位道場で十段に合格', n: (c) => c.dan, goal: 10 },
  { id: 'gold', icon: '🥇', name: 'ゴールド到達', desc: 'レート 6.00 以上', n: (c) => c.rate, goal: 6 },
  { id: 'master', icon: '🎖️', name: 'マスター到達', desc: 'レート 12.00 以上', n: (c) => c.rate, goal: 12 },
];

// 記録 → バッジ判定に使う数。src は自分の state(acc.getState())でも、プロフィール(mlidar_profile)でもよい
//  state: { best, stats, units:{}, meta:{ skins:[], streak, match, invites, rate, rate_best } }
//  profile: { best, stats, units:数, skins:数, streak, match, invites, rate, rate_best }
export function ctx(src, entries) {
  const best = src.best || {}, st = src.stats || {}, m = src.meta || src;
  const songs = new Set(), genres = new Set();
  let fcHard = 0, apCharts = 0, sCharts = 0, hardS = 0;
  for (const [k, b] of Object.entries(best)) {
    const [id, d] = k.split('/');
    const e = entries.find((x) => x.id === id && !x.local);
    if (!e) continue;
    songs.add(id); genres.add(e.genre);
    if (b.fc && d === 'hard') fcHard++;
    if (b.ap) apCharts++;
    if (b.score >= 950000) { sCharts++; if (d === 'hard' && (e.levels?.hard || 0) >= 13) hardS++; }
  }
  const pool = entries.filter((e) => !e.local && !e.event && e.urlId);
  return {
    plays: st.plays || 0, fc: st.fc || 0, ap: st.ap || 0, maxCombo: st.max_combo || 0, dan: st.dan || 0,
    fcHard, apCharts, sCharts, hardS, genres: genres.size,
    songs: pool.filter((e) => songs.has(e.id)).length, songTotal: pool.length,
    invited: (m.invited_by || src.invited) ? 1 : 0,
    events: (m.events || []).length,
    eventKinds: new Set((m.events || []).map((x) => String(x).replace(/[0-9]+$/, '')).filter((k) => ['spring', 'summer', 'halloween', 'xmas'].includes(k))).size, // 四季めぐりは4つの季節だけ数える
    streak: m.streak?.best || 0, wins: m.match?.win || 0, invites: Number(m.invites || 0),
    units: typeof src.units === 'number' ? src.units : Object.keys(src.units || {}).length,
    skins: typeof src.skins === 'number' ? src.skins : (m.skins || []).length,
    rate: Math.max(Number(m.rate || 0), Number(m.rate_best || 0)),
  };
}

// バッジごとの { b, got, n, goal }
export function evaluate(src, entries) {
  const c = ctx(src, entries);
  return BADGES.map((b) => {
    const goal = typeof b.goal === 'function' ? b.goal(c) : b.goal;
    const n = b.n(c);
    return { b, n, goal, got: goal > 0 && n >= goal };
  });
}

// プロフィールに出すHTML。自分のときはまだのバッジも薄く出す(あとどれくらいかつき)
export function badgesHtml(src, entries, esc, mine) {
  const list = evaluate(src, entries);
  const got = list.filter((x) => x.got).length;
  const show = mine ? list : list.filter((x) => x.got);
  const fmt = (v) => (Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2));
  return `<h3 class="pf-h">実績バッジ <small class="muted">${got} / ${list.length}</small></h3>
    ${show.length ? `<ul class="bdg-list">${show.map((x) => `<li class="${x.got ? 'got' : ''}" title="${esc(x.b.desc)}${x.got ? '' : `(${fmt(Math.min(x.n, x.goal))} / ${fmt(x.goal)})`}">
      <span class="bdg-ico" aria-hidden="true">${x.b.icon}</span><b>${esc(x.b.name)}</b><small>${esc(x.b.desc)}</small>
      ${!x.got && mine ? `<i class="bdg-bar"><i style="width:${Math.min(100, (x.n / x.goal) * 100).toFixed(0)}%"></i></i>` : ''}</li>`).join('')}</ul>`
      : '<p class="muted small">まだバッジはありません</p>'}`;
}

// 自分のバッジが前より増えていたら、増えたものを返す(はじめて見たときは覚えるだけ)
export function newBadges(state, entries) {
  if (!state?.id) return [];
  const got = evaluate(state, entries).filter((x) => x.got).map((x) => x.b.id);
  const key = 'badges:' + state.id;
  const old = load(key, null);
  save(key, got);
  if (!old) return [];
  return BADGES.filter((b) => got.includes(b.id) && !old.includes(b.id));
}

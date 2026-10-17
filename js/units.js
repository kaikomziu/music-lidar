// キャラのアイコン(SVG)とスキル表示
import { hashStr, mulberry32 } from './composer.js';

export const RARITY_COLOR = { 1: '#8fa3c8', 2: '#5ef2ff', 3: '#ff4fd8', 4: '#ffd25e' };
export const KIND_LABEL = { score: 'スコアUP', judge: '判定サポート', guard: 'コンボガード', coin: 'コインUP' };
export const KIND_COLOR = { score: '#ff9a5c', judge: '#5ef2ff', guard: '#9dff4f', coin: '#ffd25e' };
export const KIND_DESC = {
  score: '編成スコアがこの%だけ増える',
  judge: 'PERFECT・GREATになる幅が広がり、少しズレても良い判定に',
  guard: 'MISSしても、この回数まではコンボが切れない',
  coin: 'プレイ後にもらえるコインがこの%だけ増える',
};

// サーバー(mlidar_team_fx)と同じ式。表示用
const BASE = { score: [1, 2, 4, 7], judge: [2, 4, 7, 12], guard: [1, 2, 3, 5], coin: [3, 6, 12, 20] };
export function skillValue(u, lv = 1, leader = false) {
  return BASE[u.kind][u.rarity - 1] * (1 + 0.2 * (lv - 1)) * (leader ? 1.5 : 1);
}
export function skillText(u, lv = 1, leader = false) {
  const v = skillValue(u, lv, leader);
  const r = (x) => Math.round(x * 10) / 10;
  if (u.kind === 'score') return `スコア +${r(v)}%`;
  if (u.kind === 'judge') return `PERFECT/GREAT判定 +${r(v)}ms`;
  if (u.kind === 'guard') return `MISSでもコンボ継続 ${r(v)}回分`;
  return `獲得コイン +${r(v)}%`;
}
export function fxText(fx) {
  const parts = [];
  if (fx.score) parts.push(`スコア +${fx.score}%`);
  if (fx.judge) parts.push(`判定 +${fx.judge}ms`);
  if (fx.guard) parts.push(`ガード ${fx.guard}回`);
  if (fx.coin) parts.push(`コイン +${fx.coin}%`);
  return parts.length ? parts.join(' / ') : '効果なし';
}

export const stars = (n) => '★'.repeat(n);

const EMBLEM = {
  score: '<path d="M80 70l6 10-6 10-6-10z" />',
  judge: '<circle cx="80" cy="80" r="6" fill="none" stroke-width="2.5"/><circle cx="80" cy="80" r="2"/>',
  guard: '<path d="M80 71l7 3v6c0 5-3 8-7 10-4-2-7-5-7-10v-6z"/>',
  coin: '<circle cx="80" cy="80" r="7" fill="none" stroke-width="2.5"/><path d="M80 76v8"/>',
};

export function unitIcon(u, size = 64) {
  if (!u) return '';
  const c = RARITY_COLOR[u.rarity];
  const rng = mulberry32(hashStr(u.id));
  const type = hashStr(u.id + 'shape') % 4;
  const gid = 'g' + hashStr(u.id).toString(36);
  let body = '';
  if (type === 0) {
    // ロボットの頭
    body = `<line x1="50" y1="18" x2="50" y2="30"/><circle cx="50" cy="16" r="3" fill="${c}"/>
      <rect x="27" y="30" width="46" height="38" rx="9" fill="url(#${gid})"/>
      <rect x="35" y="43" width="10" height="6" rx="2" fill="${c}" stroke="none"/><rect x="55" y="43" width="10" height="6" rx="2" fill="${c}" stroke="none"/>
      <line x1="40" y1="58" x2="60" y2="58"/>`;
  } else if (type === 1) {
    // ドローン
    body = `<line x1="30" y1="34" x2="44" y2="46"/><line x1="70" y1="34" x2="56" y2="46"/><line x1="30" y1="66" x2="44" y2="56"/><line x1="70" y1="66" x2="56" y2="56"/>
      <ellipse cx="30" cy="32" rx="11" ry="3"/><ellipse cx="70" cy="32" rx="11" ry="3"/><ellipse cx="30" cy="68" rx="11" ry="3"/><ellipse cx="70" cy="68" rx="11" ry="3"/>
      <circle cx="50" cy="51" r="12" fill="url(#${gid})"/><circle cx="50" cy="51" r="4" fill="${c}" stroke="none"/>`;
  } else if (type === 2) {
    // センサー(目)
    body = `<circle cx="50" cy="50" r="27" fill="url(#${gid})"/><circle cx="50" cy="50" r="15"/>
      <circle cx="50" cy="50" r="6" fill="${c}" stroke="none"/><path d="M23 50a27 27 0 0 1 9-20" stroke-width="4" opacity="0.7"/>`;
  } else {
    // けもの
    body = `<path d="M28 42l4-22 14 14M72 42l-4-22-14 14"/><circle cx="50" cy="52" r="23" fill="url(#${gid})"/>
      <path d="M38 50l6 3-6 3z" fill="${c}" stroke="none"/><path d="M62 50l-6 3 6 3z" fill="${c}" stroke="none"/><path d="M45 64q5 4 10 0"/>`;
  }
  let dots = '';
  for (let i = 0; i < 14; i++) {
    const x = 8 + rng() * 84, y = 8 + rng() * 84;
    dots += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="1.6" height="1.6" fill="${c}" opacity="${(0.2 + rng() * 0.5).toFixed(2)}"/>`;
  }
  const halo = u.rarity === 4 ? `<circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-width="1" stroke-dasharray="3 4" opacity="0.8"/>` : '';
  return `<svg class="unit-icon r${u.rarity}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-label="${u.name}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="0.35"/><stop offset="1" stop-color="#05081a" stop-opacity="0.9"/></linearGradient></defs>
    <rect x="1" y="1" width="98" height="98" rx="14" fill="#070b1f" stroke="${c}" stroke-opacity="0.6"/>
    ${dots}${halo}
    <g fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${body}</g>
    <g fill="${c}" stroke="${c}">${EMBLEM[u.kind]}</g>
  </svg>`;
}

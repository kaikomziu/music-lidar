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
  const k = KIND_COLOR[u.kind] || c;
  const rng = mulberry32(hashStr(u.id));
  const type = hashStr(u.id + 'shape') % 6;
  const id = 'u' + hashStr(u.id).toString(36);
  const R = u.rarity;

  // 背景の模様(スキルの種類ごと)
  let pat = '';
  if (u.kind === 'score') for (let i = -100; i < 100; i += 9) pat += `<line x1="${i}" y1="100" x2="${i + 100}" y2="0"/>`;
  else if (u.kind === 'judge') pat = '<circle cx="50" cy="50" r="38"/><circle cx="50" cy="50" r="28"/><line x1="50" y1="4" x2="50" y2="22"/><line x1="50" y1="78" x2="50" y2="96"/><line x1="4" y1="50" x2="22" y2="50"/><line x1="78" y1="50" x2="96" y2="50"/>';
  else if (u.kind === 'guard') for (let y = 0; y < 110; y += 15) for (let x = (y / 15) % 2 ? 9 : 0; x < 110; x += 18) pat += `<path d="M${x} ${y - 6}l7 4v8l-7 4-7-4v-8z"/>`;
  else for (let r2 = 10; r2 < 70; r2 += 10) pat += `<circle cx="50" cy="50" r="${r2}" stroke-dasharray="2 4"/>`;

  // 体(6種類)
  const F = `url(#${id}b)`;
  const eye = (x, y, w = 9, h = 6) => `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="2" fill="${c}" filter="url(#${id}g)"/>`;
  const bodies = [
    // ロボットの頭
    `<line x1="50" y1="16" x2="50" y2="29"/><circle cx="50" cy="14" r="3.5" fill="${k}" stroke="none" filter="url(#${id}g)"/>
     <rect x="25" y="29" width="50" height="40" rx="10" fill="${F}"/><rect x="31" y="38" width="38" height="15" rx="5" fill="#03050f" stroke-width="1.5"/>
     ${eye(41, 45.5)}${eye(59, 45.5)}<path d="M40 61h20" stroke-width="2"/><path d="M25 46h-5v10h5M75 46h5v10h-5" stroke-width="2"/>`,
    // ドローン
    `<path d="M33 37 44 46M67 37 56 46M33 65 44 56M67 65 56 56" stroke-width="2.5"/>
     <ellipse cx="30" cy="34" rx="13" ry="3.2" stroke-width="2"/><ellipse cx="70" cy="34" rx="13" ry="3.2" stroke-width="2"/><ellipse cx="30" cy="68" rx="13" ry="3.2" stroke-width="2"/><ellipse cx="70" cy="68" rx="13" ry="3.2" stroke-width="2"/>
     <circle cx="50" cy="51" r="14" fill="${F}"/><circle cx="50" cy="51" r="6" fill="#03050f" stroke-width="1.5"/><circle cx="50" cy="51" r="3.5" fill="${c}" stroke="none" filter="url(#${id}g)"/>`,
    // センサー(大きな目)
    `<circle cx="50" cy="50" r="27" fill="${F}"/><circle cx="50" cy="50" r="16" fill="#03050f" stroke-width="2"/>
     <circle cx="50" cy="50" r="8" fill="${c}" stroke="none" filter="url(#${id}g)"/><circle cx="46" cy="46" r="2.5" fill="#fff" stroke="none"/>
     <path d="M23 50a27 27 0 0 1 9-20M77 50a27 27 0 0 1-9 20" stroke-width="4" opacity="0.6"/>`,
    // けもの
    `<path d="M29 42 33 18 47 33M71 42 67 18 53 33" fill="${F}"/><circle cx="50" cy="53" r="23" fill="${F}"/>
     <path d="M36 50l9 3-9 4z" fill="${c}" stroke="none" filter="url(#${id}g)"/><path d="M64 50l-9 3 9 4z" fill="${c}" stroke="none" filter="url(#${id}g)"/>
     <path d="M45 65q5 4 10 0" stroke-width="2"/><path d="M27 58h-8M27 62h-7M73 58h8M73 62h7" stroke-width="1.5" opacity="0.7"/>`,
    // 騎士のかぶと
    `<path d="M28 70V44q0-22 22-24 22 2 22 24v26z" fill="${F}"/><path d="M50 20v50" stroke-width="1.5" opacity="0.6"/>
     <path d="M33 47h34v7H33z" fill="#03050f" stroke-width="1.5"/>${eye(50, 50.5, 28, 3)}
     <path d="M50 12q8 2 6 9" stroke-width="2.5"/><path d="M28 70h44" stroke-width="3"/>`,
    // 結晶コア
    `<path d="M50 14 72 40 50 86 28 40z" fill="${F}"/><path d="M28 40h44M50 14v72M39 40l11-26 11 26-11 46z" stroke-width="1.2" opacity="0.7"/>
     <circle cx="50" cy="44" r="6" fill="${c}" stroke="none" filter="url(#${id}g)"/>`,
  ];
  // レア度の飾り
  const wings = R >= 3 ? `<g opacity="0.85" stroke-width="2"><path d="M22 52q-12-6-14-20 8 6 16 8M22 58q-12 0-16-10 8 4 16 3"/><path d="M78 52q12-6 14-20-8 6-16 8M78 58q12 0 16-10-8 4-16 3"/></g>` : '';
  const crown = R >= 4 ? `<ellipse cx="50" cy="9" rx="13" ry="3" stroke="${c}" stroke-width="1.8" fill="none" filter="url(#${id}g)"/>` : '';
  let sparks = '';
  for (let i = 0; i < 10 + R * 4; i++) {
    const x = 6 + rng() * 88, y = 6 + rng() * 88, s = 0.8 + rng() * (R >= 4 ? 2.2 : 1.2);
    sparks += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="${rng() < 0.5 ? c : k}" opacity="${(0.25 + rng() * 0.6).toFixed(2)}"/>`;
  }
  const frameStroke = R >= 4 ? `url(#${id}h)` : c;
  const frameW = [0, 1, 1.5, 2.5, 3][R];
  const gems = R >= 3 ? [[6, 6], [94, 6], [6, 94], [94, 94]].map(([x, y]) => `<path d="M${x} ${y - 3}l3 3-3 3-3-3z" fill="${R >= 4 ? '#fff' : c}"/>`).join('') : '';
  const inner = R >= 2 ? `<rect x="5" y="5" width="90" height="90" rx="11" fill="none" stroke="${c}" stroke-opacity="0.35" stroke-width="0.8"/>` : '';

  return `<svg class="unit-icon r${R}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-label="${u.name}">
    <defs>
      <radialGradient id="${id}bg" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="${k}" stop-opacity="${R >= 4 ? 0.45 : 0.28}"/><stop offset="1" stop-color="#05081a" stop-opacity="1"/></radialGradient>
      <linearGradient id="${id}b" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="0.55"/><stop offset="0.55" stop-color="${c}" stop-opacity="0.12"/><stop offset="1" stop-color="#05081a" stop-opacity="0.95"/></linearGradient>
      <linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5ef2ff"/><stop offset="0.35" stop-color="#ff4fd8"/><stop offset="0.7" stop-color="#ffd25e"/><stop offset="1" stop-color="#5ef2ff"/></linearGradient>
      <filter id="${id}g" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <clipPath id="${id}c"><rect x="1" y="1" width="98" height="98" rx="14"/></clipPath>
    </defs>
    <rect x="1" y="1" width="98" height="98" rx="14" fill="url(#${id}bg)"/>
    <g clip-path="url(#${id}c)" fill="none" stroke="${k}" stroke-width="0.8" opacity="0.22">${pat}</g>
    ${sparks}
    <g fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${wings}${crown}${bodies[type]}</g>
    <g fill="${k}" stroke="${k}">${EMBLEM[u.kind]}</g>
    ${inner}
    <rect x="1" y="1" width="98" height="98" rx="14" fill="none" stroke="${frameStroke}" stroke-width="${frameW}" stroke-opacity="${R >= 2 ? 0.95 : 0.6}"/>
    ${gems}
  </svg>`;
}

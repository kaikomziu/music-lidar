// 段位道場: 4曲を続けてプレイ。体力ゲージは曲をまたいで引き継ぎ、0になったら不合格
// 編成の効果は使わない(素の腕前で挑戦)
import { load, save } from './storage.js';
import * as acc from './account.js';
import { rpc } from './ranking.js';

const $ = (id) => document.getElementById(id);
export const DAN_NAMES = ['', '初段', '二段', '三段', '四段', '五段', '六段', '七段', '八段', '九段', '十段', '皆伝'];

// 課題曲(すべて HARD)。だんだん難しくなるように並べる
const COURSES = [
  ['hello-lane', 'blues-highway', 'jazz-cafe', 'neon-highway'],
  ['sunflower-road', 'polka-party', 'paper-planes', 'disco-mirrorball'],
  ['sunset-bossa', 'retro-arcade', 'funky-station', 'dragon-gate'],
  ['thunder-road', 'midnight-avenue', 'blue-note-lane', 'stellar-gate'],
  ['pulse-grid', 'pixel-quest', 'sky-prism', 'lidar-rush'],
  ['glitter-idol', 'brave-horizon', 'night-drift', 'neon-samurai'],
  ['hard-reflector', 'shamisen-storm', 'overdrive-riot', 'hyper-sakura'],
  ['chip-dungeon', 'freeze-frame', 'kick-machinegun', 'metalcore-fury'],
  ['fractal-storm', 'hyper-scan-breaker', 'abyss-gate', 'bullet-hell-404'],
  ['thunder-requiem', 'jackhammer-jazz', 'overclock-omega', 'sakura-blizzard'],
  ['omega-requiem', 'event-horizon', 'neutron-overdrive', 'infinity-breaker'],
];
// 体力の増減(%)。上の段ほど MISS が痛い
const lifeRule = (rank) => ({ start: 100, miss: +(3 + (rank - 1) * 0.7).toFixed(1), good: +(0.5 + (rank - 1) * 0.15).toFixed(2), great: 0.05, perfect: 0.15 });

let ui = null; // { entries, show, back, current, esc, jacketURL, play(entry, diff, custom), toast, overlay }
let running = null;

export const bestDan = () => Math.max(acc.getState()?.stats?.dan || 0, load('danBest', 0));
export const danName = (n) => DAN_NAMES[n] || '';

export function initDan(api) {
  ui = api;
  $('dan-back').addEventListener('click', () => ui.back());
  $('dan-list').addEventListener('click', (ev) => { const b = ev.target.closest('[data-rank]'); if (b) startCourse(+b.dataset.rank); });
  $('dan-result').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-act]');
    if (!b) return;
    ui.overlay('dan-result', false);
    if (b.dataset.act === 'retry') startCourse(+b.dataset.rank); else openDan();
  });
}

const entryOf = (id) => ui.entries.find((e) => e.id === id);

export function openDan() {
  ui.show('dan');
  const best = bestDan();
  $('dan-best').textContent = best ? `あなたの段位: ${danName(best)}` : 'まだ段位はありません';
  $('dan-list').innerHTML = COURSES.map((ids, i) => {
    const rank = i + 1, rule = lifeRule(rank), cleared = best >= rank;
    const songs = ids.map((id) => entryOf(id)).filter(Boolean);
    return `<li class="dan-card ${cleared ? 'cleared' : ''} ${rank === 11 ? 'kaiden' : ''}" style="--dn:${rank}">
      <div class="dan-name"><b>${danName(rank)}</b>${cleared ? '<span class="dan-pass">合格</span>' : ''}</div>
      <ol class="dan-songs">${songs.map((e, k) => `<li><img src="${ui.jacketURL(e, 64)}" alt=""><span><b>${k + 1}. ${ui.esc(e.title)}</b><small>HARD Lv${e.levels.hard} ・ BPM ${Math.round(e.bpm)}</small></span></li>`).join('')}</ol>
      <div class="dan-rule">MISS −${rule.miss}% ・ GOOD −${rule.good}% ・ PERFECT +${rule.perfect}%</div>
      <button class="btn-glow dan-go" data-rank="${rank}">挑戦する</button></li>`;
  }).join('');
}

// 1曲ずつ順番に遊ぶ。どこかで体力が0になったら、そこで終わり
async function startCourse(rank) {
  if (running) return;
  const ids = COURSES[rank - 1];
  const rule = lifeRule(rank);
  const results = [];
  let life = rule.start;
  running = { rank };
  try {
    for (let i = 0; i < ids.length; i++) {
      const e = entryOf(ids[i]);
      const r = await new Promise((resolve) => {
        ui.play(e, 'hard', {
          kind: 'dan', label: `${danName(rank)} ${i + 1}/${ids.length}`, title: e.title, notes: e.charts.hard, scroll: e.scroll,
          life: { ...rule, start: life }, onExit: resolve,
        });
      });
      if (!r) { running = null; openDan(); return; } // 途中でやめた
      results.push({ entry: e, r });
      life = r.life;
      if (r.failed) break;
    }
  } finally { running = null; }
  const passed = results.length === ids.length && !results.at(-1).r.failed;
  showResult(rank, results, passed, life);
}

async function showResult(rank, results, passed, life) {
  openDan();
  const esc = ui.esc;
  const box = $('dan-result-box');
  box.className = 'modal-box dan-result-box hud ' + (passed ? 'pass' : 'fail');
  box.innerHTML = `<div class="panel-label"><span>段位道場</span><span>${danName(rank)}</span></div>
    <div class="dan-verdict">${passed ? '合格' : '不合格'}</div>
    <p class="dan-sub">${passed ? `${danName(rank)} に認定されました!` : `${results.length}曲目で体力がなくなりました`} ・ 残り体力 ${Math.max(0, life).toFixed(1)}%</p>
    <ol class="dan-res">${results.map(({ entry, r }, k) => `<li class="${r.failed ? 'failed' : ''}"><b>${k + 1}. ${esc(entry.title)}</b>
      <span>${r.failed ? 'FAILED' : r.score.toLocaleString()}</span><small>P ${r.counts.PERFECT} ・ GR ${r.counts.GREAT} ・ GD ${r.counts.GOOD} ・ MISS ${r.counts.MISS} ・ 体力 ${Math.max(0, r.life).toFixed(1)}%</small></li>`).join('')}</ol>
    <p class="dan-reward" id="dan-reward"></p>
    <div class="modal-actions"><button class="btn-line" data-act="list">段位一覧へ</button><button class="btn-glow" data-act="retry" data-rank="${rank}">もう一度</button></div>`;
  ui.overlay('dan-result', true);
  if (!passed) return;
  if (rank > load('danBest', 0)) save('danBest', rank);
  if (acc.isLoggedIn()) {
    try {
      const res = await rpc('mlidar_dan_clear', { p_token: load('token', null), p_rank: rank });
      await acc.refresh();
      if (res.reward) $('dan-reward').innerHTML = `はじめての合格ボーナス <span class="coin-ico">◎</span> +${res.reward} コイン`;
    } catch (e) { console.error(e); }
  } else $('dan-reward').textContent = 'ログインすると段位が保存され、はじめての合格でコインがもらえます';
  openDan();
}

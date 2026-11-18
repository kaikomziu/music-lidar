// 季節イベント(1.62.0〜): 春(3/20〜4/15)・夏(7/20〜8/31)・ハロウィン(10/15〜10/31)・クリスマス(12/1〜1/31)
//  - 期間中はホームにお知らせと「イベント曲」のスコアアタック。曲はイベントIDから乱数で1曲(HARD)。ランキングは mlidar_scores の song = 'ev-<イベントID>'
//  - 1回挑戦すると限定の着せ替えと、プロフィールの限定バッジ(サーバー mlidar_event_join。meta.events にイベントIDが残る)
//  - 春・夏・ハロウィンは画面に季節の粒(花びら・花火・こうもり)。クリスマスの見た目は event.js
//  - イベントID は '種類 + 年'(クリスマスの1月は前の年)。期間の判定はサーバーの mlidar_event_open と同じ
//  - 期間外に確かめたいときは ?event=spring / summer / halloween / xmas(戻すときは ?event=off)
import { mulberry32, hashStr } from './composer.js';
import { fetchRanking, submitScore, rpc } from './ranking.js';
import { PREVIEW } from './event.js';
import * as acc from './account.js';
import { LANG } from './i18n.js';

const $ = (id) => document.getElementById(id);
export const SEASONS = {
  spring: { name: '春のさくらイベント', en: 'Spring Sakura Event', period: '3/20〜4/15', icon: '🌸', color: '#ff9ad5', skin: 'ノーツ「さくら」', from: [3, 20], to: [4, 15] },
  summer: { name: '夏の花火イベント', en: 'Summer Fireworks Event', period: '7/20〜8/31', icon: '🎆', color: '#ffb347', skin: '判定ライン「花火」', from: [7, 20], to: [8, 31] },
  halloween: { name: 'ハロウィンイベント', en: 'Halloween Event', period: '10/15〜10/31', icon: '🎃', color: '#ff8a2a', skin: 'ノーツ「パンプキン」', from: [10, 15], to: [10, 31] },
  xmas: { name: 'クリスマスイベント', en: 'Christmas Event', period: '12/1〜1/31', icon: '🎄', color: '#ff5a6e', skin: '判定ライン「ホーリーナイト」', from: [12, 1], to: [1, 31] },
};
let ui = null; // { entries, esc, toast, jacketURL, play(entry, d, custom, live, extra), rankId(), playerName(), rankRows(rows) }

// いま開催中のイベント { kind, id, ...SEASONS[kind] } か null
export function currentSeason(ms = Date.now()) {
  const d = new Date(ms + 9 * 3600e3);
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
  const md = m * 100 + day;
  if (PREVIEW && SEASONS[PREVIEW]) return { kind: PREVIEW, id: PREVIEW + (PREVIEW === 'xmas' && m === 1 ? y - 1 : y), ...SEASONS[PREVIEW] };
  for (const [kind, s] of Object.entries(SEASONS)) {
    const a = s.from[0] * 100 + s.from[1], b = s.to[0] * 100 + s.to[1];
    const on = a <= b ? md >= a && md <= b : md >= a || md <= b;
    if (on) return { kind, id: kind + (kind === 'xmas' && m === 1 ? y - 1 : y), ...s };
  }
  return null;
}

// イベント曲(イベントIDから決める。みんな同じ)
export function seasonSong(ev) {
  const pool = ui.entries.filter((e) => !e.local && e.urlId && (e.levels?.hard || 0) >= 5).sort((a, b) => (a.id < b.id ? -1 : 1));
  const r = mulberry32(hashStr('season-' + ev.id));
  return pool[Math.floor(r() * pool.length)];
}

export function initSeason(api) {
  ui = api;
  const ev = currentSeason();
  if (!ev) return;
  document.body.classList.add('season-' + ev.kind);
  if (ev.kind !== 'xmas') startParticles(ev.kind);
  renderSeasonBanner(ev);
}

function renderSeasonBanner(ev) {
  const main = $('home-main');
  const e = seasonSong(ev);
  if (!main || !e || $('season-banner')) return;
  const ja = LANG === 'ja';
  main.insertAdjacentHTML('beforebegin', `<div class="season-banner" id="season-banner" style="--sc:${ev.color}">
    <div class="sb-text"><small>EVENT ・ ${ev.period}</small><b>${ev.icon} ${ja ? ev.name + '開催中!' : ev.en}</b>
    <span>${ja ? `イベント曲「${ui.esc(e.title)}」HARD のスコアアタック。1回挑戦すると限定の${ev.skin}と限定バッジ` : `Score attack on “${ui.esc(e.title)}” (HARD). Play once to get a limited skin and badge`}</span>
    <span class="sb-top" id="sb-top"></span></div>
    <button class="btn-glow" id="btn-season">挑戦する</button></div>`);
  $('btn-season').addEventListener('click', () => ui.play(e, 'hard', null, null, { season: ev }));
  fetchRanking('ev-' + ev.id, 'hard', ui.rankId(), 3).then((rows) => {
    const el = $('sb-top');
    if (el) el.textContent = rows.length ? 'トップ: ' + rows.filter((x) => x.rank <= 3).map((x) => `${x.rank}. ${x.name} ${x.score.toLocaleString()}`).join(' / ') : 'まだ誰も挑戦していません';
  }).catch(() => {});
}

// リザルト: イベントのランキングへ送って、参加の報酬を受け取る
export async function seasonResult(ev, r, isCurrent) {
  const box = $('r-season');
  box.hidden = false;
  const name = ui.playerName();
  if (!name) { box.innerHTML = '<p class="r-msg">イベントのランキングと報酬は、ログインすると受け取れます。</p>'; return; }
  box.innerHTML = '<p class="r-msg">イベントのランキングに送信中…</p>';
  try {
    const rank = await submitScore('ev-' + ev.id, 'hard', ui.rankId(), name, r);
    const rows = await fetchRanking('ev-' + ev.id, 'hard', ui.rankId(), 5);
    if (!isCurrent()) return;
    box.innerHTML = `<p>${ev.icon} ${ui.esc(ev.name)} ・ 順位 <span class="r-myrank">#${rank}</span></p><ol class="rank-list">${ui.rankRows(rows)}</ol>`;
  } catch (e) { console.error(e); box.innerHTML = '<p class="r-msg">イベントのランキングに送信できませんでした</p>'; }
  if (!acc.isLoggedIn()) { box.insertAdjacentHTML('beforeend', '<p class="r-msg">ログインすると限定の着せ替えとバッジがもらえます。</p>'); return; }
  try {
    const res = await rpc('mlidar_event_join', { p_token: acc.getToken(), p_event: ev.id });
    if (res?.state) acc.applyState(res.state);
    if (res?.first) ui.toast(`${ev.icon} イベント参加!限定の${ev.skin}と限定バッジをもらいました`, 5000);
  } catch (e) { console.warn(e); }
}

// ---------------------------------------------------------------------------
// 季節の粒(プレイ中・タブが裏のときは止める)
// ---------------------------------------------------------------------------
function startParticles(kind) {
  const cv = document.createElement('canvas');
  cv.className = 'season-fx';
  cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const g = cv.getContext('2d');
  const ps = [];
  let W = 0, H = 0, last = performance.now(), boomT = 0;
  const resize = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (kind !== 'summer') {
      const n = Math.round(Math.min(kind === 'halloween' ? 14 : 50, (W * H) / (kind === 'halloween' ? 90000 : 26000)));
      while (ps.length < n) ps.push(fresh(true));
      ps.length = n;
    }
  };
  const fresh = (any) => ({
    x: Math.random() * (W || innerWidth), y: any ? Math.random() * (H || innerHeight) : -20,
    s: 0.6 + Math.random() * 0.9, v: 20 + Math.random() * 30, w: Math.random() * 6.28, rot: Math.random() * 6.28, a: 0.4 + Math.random() * 0.5,
  });
  resize();
  addEventListener('resize', resize);
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (document.hidden || document.body.classList.contains('playing')) return;
    g.clearRect(0, 0, W, H);
    if (kind === 'summer') {
      // 花火: 数秒ごとに画面の上のほうで1つ開く
      boomT -= dt;
      if (boomT <= 0) {
        boomT = 2.2 + Math.random() * 2.5;
        const cx = W * (0.15 + Math.random() * 0.7), cy = H * (0.12 + Math.random() * 0.25);
        const hue = Math.floor(Math.random() * 360);
        for (let i = 0; i < 40; i++) { const an = (i / 40) * 6.28, sp = 60 + Math.random() * 40; ps.push({ x: cx, y: cy, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, life: 1.6, hue }); }
      }
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 30 * dt; p.vx *= 0.985; p.vy *= 0.985;
        if (p.life <= 0) { ps.splice(i, 1); continue; }
        g.globalAlpha = Math.min(1, p.life) * 0.7;
        g.fillStyle = `hsl(${p.hue},100%,70%)`;
        g.fillRect(p.x - 1.2, p.y - 1.2, 2.4, 2.4);
      }
      g.globalAlpha = 1;
      return;
    }
    for (const p of ps) {
      p.w += dt * 1.3; p.rot += dt * (kind === 'halloween' ? 0 : 1.5);
      if (kind === 'halloween') { p.x += p.v * dt * 1.6; p.y += Math.sin(p.w * 2) * 14 * dt; if (p.x > W + 30) Object.assign(p, fresh(true), { x: -30 }); }
      else { p.y += p.v * dt; p.x += Math.sin(p.w) * 18 * dt; if (p.y > H + 20) Object.assign(p, fresh(false)); }
      g.save(); g.translate(p.x, p.y); g.globalAlpha = p.a;
      if (kind === 'spring') { g.rotate(p.rot); g.fillStyle = '#ffc2df'; g.beginPath(); g.ellipse(0, 0, 6 * p.s, 3.2 * p.s, 0, 0, 6.28); g.fill(); }
      else { // こうもり
        const f = Math.sin(p.w * 8) * 0.5 + 0.5, s = 9 * p.s;
        g.fillStyle = 'rgba(20,10,30,0.85)'; g.strokeStyle = 'rgba(255,138,42,0.5)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-s, -s * f, -s * 1.8, -s * 0.2 * f); g.quadraticCurveTo(-s, s * 0.3, 0, s * 0.3);
        g.quadraticCurveTo(s, s * 0.3, s * 1.8, -s * 0.2 * f); g.quadraticCurveTo(s, -s * f, 0, 0); g.fill(); g.stroke();
      }
      g.restore();
    }
    g.globalAlpha = 1;
  };
  requestAnimationFrame(frame);
}

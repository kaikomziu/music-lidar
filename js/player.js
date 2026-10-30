// きくだけモード: オリジナル曲を音楽プレーヤーとして聴く(音ゲーではない)
// シャイニングスターなど外部の曲・読み込んだ曲は出さない(作者が MUSIC LiDAR の内蔵曲だけ)
import { getCtx, bgmOutFor, stopPreview } from './audio.js';
import { load, save } from './storage.js';
import { jacketImg } from './jacket.js';

const $ = (id) => document.getElementById(id);
let ui = null; // { entries, show, back, current, esc, jacketURL, toast }
let tracks = [];
let cur = -1; // tracks の何番目を再生中か
let src = null, analyser = null, outNode = null;
let startedAt = 0, offset = 0, playing = false, loadingIdx = -1;
let shuffle = load('plShuffle', false), repeat = load('plRepeat', 'all'); // all | one | off
let query = '';
let raf = 0;

const isOriginal = (e) => !e.local && !e.credit && e.artist === 'MUSIC LiDAR';
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const pos = () => (playing ? getCtx().currentTime - startedAt : offset);

export function initPlayer(api) {
  ui = api;
  tracks = ui.entries.filter(isOriginal);
  $('pl-play').addEventListener('click', toggle);
  $('pl-prev').addEventListener('click', prev);
  $('pl-next').addEventListener('click', () => next(true));
  $('pl-shuffle').addEventListener('click', () => { shuffle = !shuffle; save('plShuffle', shuffle); renderModes(); });
  $('pl-repeat').addEventListener('click', () => { repeat = repeat === 'all' ? 'one' : repeat === 'one' ? 'off' : 'all'; save('plRepeat', repeat); renderModes(); });
  $('pl-seek').addEventListener('input', () => { const t = tracks[cur]; if (t?.buffer) seek((+$('pl-seek').value / 1000) * t.buffer.duration); });
  $('pl-search').addEventListener('input', () => { query = $('pl-search').value.trim().toLowerCase(); renderList(); });
  $('pl-list').addEventListener('click', (ev) => { const b = ev.target.closest('[data-i]'); if (b) playIndex(+b.dataset.i); });
  $('pl-back').addEventListener('click', () => { stop(); ui.back(); });
  if ('mediaSession' in navigator) {
    const ms = navigator.mediaSession;
    try {
      ms.setActionHandler('play', () => { if (!playing) toggle(); });
      ms.setActionHandler('pause', () => { if (playing) toggle(); });
      ms.setActionHandler('previoustrack', prev);
      ms.setActionHandler('nexttrack', () => next(true));
    } catch { /* 未対応のブラウザ */ }
  }
}

export function openPlayer() {
  stopPreview();
  ui.show('player');
  $('pl-count').textContent = `${tracks.length}曲`;
  renderList();
  renderModes();
  if (cur < 0) showTrack(Math.max(0, tracks.findIndex((t) => t.id === load('plLast', null))));
  else showTrack(cur);
  loop();
}

export function playerKeydown(ev) {
  if (ev.key === ' ') { ev.preventDefault(); toggle(); }
  else if (ev.key === 'ArrowRight') { ev.preventDefault(); next(true); }
  else if (ev.key === 'ArrowLeft') { ev.preventDefault(); prev(); }
  else if (ev.key === 'Escape') { stop(); ui.back(); }
}

// ほかの画面へ移るときは止める
export function stop() {
  if (src) { try { src.onended = null; src.stop(); } catch { /* noop */ } src = null; }
  if (playing) offset = pos();
  playing = false;
  cancelAnimationFrame(raf);
  renderPlay();
}

function renderModes() {
  $('pl-shuffle').classList.toggle('on', shuffle);
  $('pl-repeat').classList.toggle('on', repeat !== 'off');
  $('pl-repeat').textContent = repeat === 'one' ? '🔂' : '🔁';
  $('pl-repeat').title = { all: '全曲くり返し', one: '1曲くり返し', off: 'くり返しなし' }[repeat];
}
function renderPlay() {
  $('pl-play').textContent = playing ? '❚❚' : '▶';
  $('pl-play').title = playing ? '一時停止' : '再生';
  document.querySelector('#player .pl-now')?.classList.toggle('playing', playing);
  for (const li of document.querySelectorAll('#pl-list [data-i]')) li.classList.toggle('cur', +li.dataset.i === cur);
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
}

function renderList() {
  const rows = tracks.map((t, i) => ({ t, i })).filter(({ t }) => !query || `${t.title} ${t.genre}`.toLowerCase().includes(query));
  $('pl-list').innerHTML = rows.length ? rows.map(({ t, i }) => `<li><button data-i="${i}" class="${i === cur ? 'cur' : ''}" style="--c:${t.color}">
      ${jacketImg(t, 96)}
      <span class="pl-tt"><b>${ui.esc(t.title)}</b><small>${ui.esc(t.genre)} ・ BPM ${Math.round(t.bpm)}</small></span>
      <span class="pl-len">${fmt(t.duration)}</span></button></li>`).join('') : '<li class="empty">見つかりませんでした</li>';
}

function showTrack(i) {
  const t = tracks[i];
  if (!t) return;
  cur = i;
  document.documentElement.style.setProperty('--accent', t.color);
  $('pl-jacket').src = ui.jacketURL(t, 512);
  $('pl-title').textContent = t.title;
  $('pl-genre').textContent = `${t.genre} ・ BPM ${Math.round(t.bpm)}`;
  $('pl-dur').textContent = fmt(t.buffer?.duration ?? t.duration);
  renderPlay();
}

async function playIndex(i, from = 0) {
  const t = tracks[i];
  if (!t) return;
  stop();
  showTrack(i);
  offset = from;
  save('plLast', t.id);
  if (!t.buffer) {
    loadingIdx = i;
    $('pl-status').textContent = '音を準備中… 0%';
    const tick = setInterval(() => { if (loadingIdx === i) $('pl-status').textContent = `音を準備中… ${Math.round((t.progress || 0) * 100)}%`; }, 200);
    try { await t.load(); } catch (e) { console.error(e); ui.toast('音を準備できませんでした'); return; } finally { clearInterval(tick); }
    if (loadingIdx !== i || ui.current() !== 'player') return; // 待っている間に別の曲・画面へ
  }
  loadingIdx = -1;
  $('pl-status').textContent = '';
  start(t.buffer, from);
  if ('mediaSession' in navigator && window.MediaMetadata) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: 'MUSIC LiDAR', album: t.genre, artwork: [{ src: ui.jacketURL(t, 512), sizes: '512x512', type: 'image/png' }] });
  }
  // 次の曲を裏で用意しておく
  const n = nextIndex();
  if (n >= 0 && !tracks[n].buffer) setTimeout(() => tracks[n].load().catch(() => {}), 1500);
}

function start(buffer, from) {
  const c = getCtx();
  if (!analyser) { analyser = c.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.8; }
  analyser.disconnect();
  outNode = bgmOutFor(buffer);
  analyser.connect(outNode);
  src = c.createBufferSource();
  src.buffer = buffer;
  src.connect(analyser);
  const at = Math.max(0, Math.min(from, buffer.duration - 0.05));
  startedAt = c.currentTime - at;
  src.start(0, at);
  src.onended = () => { if (playing && pos() >= buffer.duration - 0.2) { playing = false; src = null; offset = 0; ended(); } };
  playing = true;
  renderPlay();
  loop();
}

function toggle() {
  if (cur < 0) return;
  const t = tracks[cur];
  if (playing) { stop(); return; }
  if (t.buffer && offset > 0) start(t.buffer, offset);
  else playIndex(cur, offset);
}

function seek(t) {
  const b = tracks[cur]?.buffer;
  if (!b) return;
  if (playing) { stop(); start(b, t); } else { offset = t; updateTime(); }
}

function nextIndex() {
  if (!tracks.length) return -1;
  if (shuffle) {
    if (tracks.length === 1) return 0;
    let r;
    do r = Math.floor(Math.random() * tracks.length); while (r === cur);
    return r;
  }
  return (cur + 1) % tracks.length;
}
function next(manual = false) {
  const n = nextIndex();
  if (!manual && repeat === 'off' && !shuffle && n === 0) { stop(); offset = 0; showTrack(cur); updateTime(); return; }
  playIndex(n);
}
function prev() {
  if (pos() > 3) { seek(0); return; }
  playIndex((cur - 1 + tracks.length) % tracks.length);
}
function ended() {
  if (repeat === 'one') playIndex(cur);
  else next(false);
}

function updateTime() {
  const t = tracks[cur];
  const d = t?.buffer?.duration ?? t?.duration ?? 1;
  const p = Math.max(0, Math.min(d, pos()));
  $('pl-time').textContent = fmt(p);
  if (document.activeElement !== $('pl-seek')) $('pl-seek').value = Math.round((p / d) * 1000);
}

// ジャケットのまわりの円形ビジュアライザー
function loop() {
  cancelAnimationFrame(raf);
  const cv = $('pl-vis');
  const g = cv.getContext('2d');
  const data = new Uint8Array(128);
  const draw = () => {
    if (ui.current() !== 'player') return;
    updateTime();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    if (analyser && playing) analyser.getByteFrequencyData(data); else data.fill(0);
    const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#5ef2ff';
    const cx = W / 2, cy = H / 2, r0 = Math.min(W, H) * 0.36;
    const n = 72;
    g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const k = i < n / 2 ? i : n - 1 - i; // 左右対称
      const v = data[Math.floor((k / (n / 2)) * 90)] / 255;
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const len = 4 + v * r0 * 0.38;
      g.strokeStyle = color; g.globalAlpha = 0.35 + v * 0.65; g.lineWidth = 3;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * (r0 + 6), cy + Math.sin(a) * (r0 + 6));
      g.lineTo(cx + Math.cos(a) * (r0 + 6 + len), cy + Math.sin(a) * (r0 + 6 + len));
      g.stroke();
    }
    g.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
}

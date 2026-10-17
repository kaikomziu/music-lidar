// 譜面メーカー(エディタ)と「みんなの譜面」
import { getCtx, bgmOut, nowAudio, playTap, stopPreview } from './audio.js';
import { buildScroll } from './gimmick.js';
import { load, save } from './storage.js';
import * as acc from './account.js';
import { LANE_COLORS, KEYS } from './game.js';
import * as api from './maker-api.js';
import { openAccount } from './meta.js';

const $ = (id) => document.getElementById(id);
let ui = null;

const ed = {
  entry: null, notes: [], gimmicks: [], title: '', level: 5, chartId: null,
  bpm: 120, offset: 0, snap: 2, zoom: 240, cur: 0, tool: 'note',
  playing: false, rec: false, undo: [], redo: [],
  src: null, playStartCur: 0, playStartCtx: 0, lastGuide: 0,
  placing: null, scrub: null, held: [null, null, null, null], raf: 0, gEdit: null,
};

const spb = () => 60 / ed.bpm;
const beatOf = (t) => (t - ed.offset) / spb();
const timeOfBeat = (b) => ed.offset + b * spb();
const snapT = (t) => Math.max(0, timeOfBeat(Math.round(beatOf(t) * ed.snap) / ed.snap));
const stepT = () => spb() / ed.snap;
const duration = () => ed.entry?.buffer?.duration || ed.entry?.duration || 120;

// ---------------------------------------------------------------------------
export function initMaker(api_) {
  ui = api_;
  const lv = $('ed-level');
  for (let i = 1; i <= 15; i++) lv.insertAdjacentHTML('beforeend', `<option value="${i}">${i}</option>`);

  $('ed-back').addEventListener('click', closeEditor);
  $('ed-song').addEventListener('change', () => {
    const e = ui.entries.find((x) => x.id === $('ed-song').value);
    if (e) openEditor(e);
  });
  $('ed-title').addEventListener('input', () => { ed.title = $('ed-title').value; changed(false); });
  lv.addEventListener('change', () => { ed.level = +lv.value; changed(false); });
  $('ed-snap').addEventListener('change', () => { ed.snap = +$('ed-snap').value; save('edSnap', ed.snap); });
  $('ed-zoom').addEventListener('input', () => { ed.zoom = +$('ed-zoom').value; save('edZoom', ed.zoom); });
  $('ed-play').addEventListener('click', () => togglePlay());
  $('ed-rec').addEventListener('click', () => toggleRec());
  $('ed-test').addEventListener('click', testPlay);
  $('ed-undo').addEventListener('click', undo);
  $('ed-redo').addEventListener('click', redo);
  $('ed-clear').addEventListener('click', () => {
    if (!ed.notes.length && !ed.gimmicks.length) return;
    if (!confirm('ノーツとギミックをすべて消しますか?(元に戻すで復元できます)')) return;
    pushUndo(); ed.notes = []; ed.gimmicks = []; changed();
  });
  $('ed-auto').addEventListener('change', () => {
    const d = $('ed-auto').value;
    $('ed-auto').value = '';
    if (!d || !ed.entry) return;
    if (ed.notes.length && !confirm(`今のノーツを ${d.toUpperCase()} の自動譜面で置き換えますか?(元に戻すで復元できます)`)) return;
    pushUndo();
    ed.notes = ed.entry.charts[d].map((n) => ({ ...n }));
    if (!ed.gimmicks.length && ed.entry.gimmicks?.length) {
      ed.gimmicks = ed.entry.gimmicks.map((g) => ({ t: g.beat * (60 / ed.entry.bpm), type: g.type, dur: (g.beats || 0) * (60 / ed.entry.bpm), to: g.to ?? 0 }));
    }
    changed();
    ui.toast(`${d.toUpperCase()} の譜面を読み込みました。自由に手直ししてください`);
  });
  for (const b of $('ed-tools').querySelectorAll('button')) b.addEventListener('click', () => setTool(b.dataset.tool));
  $('ed-bpm').addEventListener('change', () => { const v = +$('ed-bpm').value; if (v >= 40 && v <= 300) { ed.bpm = v; changed(false); } });
  $('ed-offset').addEventListener('change', () => { ed.offset = +$('ed-offset').value || 0; changed(false); });
  $('ed-pos').addEventListener('input', () => { if (ed.playing) stopPlay(); ed.cur = (+$('ed-pos').value / 1000) * duration(); });
  $('ed-post').addEventListener('click', post);

  // ギミック編集パネル
  $('gp-type').addEventListener('change', syncGimmickForm);
  $('gp-ok').addEventListener('click', applyGimmick);
  $('gp-del').addEventListener('click', () => { if (ed.gEdit?.index != null) { pushUndo(); ed.gimmicks.splice(ed.gEdit.index, 1); changed(); } closeGimmick(); });
  $('gp-cancel').addEventListener('click', closeGimmick);

  const cv = $('ed-canvas');
  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointercancel', () => { ed.placing = null; ed.scrub = null; });
  cv.addEventListener('contextmenu', (ev) => ev.preventDefault());
  cv.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    if (ev.ctrlKey) { ed.zoom = Math.max(80, Math.min(700, ed.zoom * (ev.deltaY < 0 ? 1.12 : 0.89))); $('ed-zoom').value = ed.zoom; return; }
    if (ed.playing) stopPlay();
    ed.cur = clampT(ed.cur - (ev.deltaY / ed.zoom) * 0.9);
  }, { passive: false });
  window.addEventListener('keyup', (ev) => { if (ui.current() === 'editor') recRelease(ev); });

  // みんなの譜面
  $('charts-new').addEventListener('click', () => openEditor(ui.selectedEntry()));
  $('charts-q').addEventListener('input', () => { clearTimeout(chartsQ.t); chartsQ.t = setTimeout(loadCharts, 300); });
  $('charts-song').addEventListener('change', loadCharts);
  $('charts-sort').addEventListener('change', loadCharts);
  $('chart-list').addEventListener('click', onChartAction);
}
const chartsQ = {};

const clampT = (t) => Math.max(0, Math.min(duration(), t));

// ---------------------------------------------------------------------------
// 開く・保存
// ---------------------------------------------------------------------------
export async function openEditor(entry, opts = {}) {
  if (!entry) return;
  if (ed.entry && ed.entry !== entry) saveDraft();
  stopPlay();
  stopPreview();
  ed.entry = entry;
  ed.undo = []; ed.redo = [];
  ed.snap = load('edSnap', 2); ed.zoom = load('edZoom', 240);
  $('ed-snap').value = ed.snap; $('ed-zoom').value = ed.zoom;
  const d = opts.chart ? null : load('draft:' + entry.id, null);
  if (opts.chart) {
    const c = opts.chart;
    Object.assign(ed, { notes: c.notes, gimmicks: c.gimmicks || [], title: c.title, level: c.level, chartId: c.id, bpm: entry.bpm, offset: 0 });
  } else if (d) {
    Object.assign(ed, { notes: api.unpackNotes(d.notes || []), gimmicks: d.gimmicks || [], title: d.title || '', level: d.level || 5, chartId: d.chartId || null, bpm: d.bpm || entry.bpm, offset: d.offset || 0 });
  } else {
    Object.assign(ed, { notes: [], gimmicks: [], title: '', level: Math.min(15, entry.levels?.normal || 5), chartId: null, bpm: entry.bpm, offset: 0 });
  }
  if (!entry.local) { ed.bpm = entry.bpm; ed.offset = 0; }
  ed.cur = 0;
  $('ed-song').innerHTML = ui.entries.map((e) => `<option value="${e.id}">${ui.esc(e.title)}${e.local ? '(読込曲・投稿不可)' : ''}</option>`).join('');
  $('ed-song').value = entry.id;
  $('ed-title').value = ed.title;
  $('ed-level').value = ed.level;
  $('ed-bpm-wrap').hidden = !entry.local;
  $('ed-bpm').value = ed.bpm.toFixed(2); $('ed-offset').value = ed.offset.toFixed(3);
  $('ed-post').textContent = ed.chartId ? '更新して投稿' : '投稿';
  $('ed-post').disabled = !!entry.local;
  ui.show('editor');
  if (opts.chart) saveDraft();
  updateInfo();
  cancelAnimationFrame(ed.raf);
  ed.raf = requestAnimationFrame(frame);
  if (!entry.buffer) {
    $('ed-saved').textContent = '音源を準備中…';
    try { await entry.load(); } catch { ui.toast('音源を準備できませんでした'); }
    $('ed-saved').textContent = '';
  }
}

function closeEditor() {
  stopPlay();
  saveDraft();
  closeGimmick();
  cancelAnimationFrame(ed.raf);
  ui.back();
}

function saveDraft() {
  if (!ed.entry) return;
  save('draft:' + ed.entry.id, { notes: api.packNotes(ed.notes), gimmicks: ed.gimmicks, title: ed.title, level: ed.level, chartId: ed.chartId, bpm: ed.bpm, offset: ed.offset });
  $('ed-saved').textContent = '下書き保存済み';
}

function changed(sort = true) {
  if (sort) ed.notes.sort((a, b) => a.t - b.t || a.lane - b.lane);
  updateInfo();
  clearTimeout(changed.t);
  $('ed-saved').textContent = '…';
  changed.t = setTimeout(saveDraft, 400);
}

function pushUndo() {
  ed.undo.push(JSON.stringify({ n: ed.notes, g: ed.gimmicks }));
  if (ed.undo.length > 200) ed.undo.shift();
  ed.redo = [];
}
function undo() {
  if (!ed.undo.length) return;
  ed.redo.push(JSON.stringify({ n: ed.notes, g: ed.gimmicks }));
  const s = JSON.parse(ed.undo.pop());
  ed.notes = s.n; ed.gimmicks = s.g; changed();
}
function redo() {
  if (!ed.redo.length) return;
  ed.undo.push(JSON.stringify({ n: ed.notes, g: ed.gimmicks }));
  const s = JSON.parse(ed.redo.pop());
  ed.notes = s.n; ed.gimmicks = s.g; changed();
}

function estLevel() {
  const n = ed.notes;
  if (n.length < 5) return null;
  const dur = Math.max(20, n[n.length - 1].t - n[0].t);
  let peak = 0;
  for (let i = 0, j = 0; i < n.length; i++) { while (j < n.length && n[j].t < n[i].t + 2) j++; peak = Math.max(peak, (j - i) / 2); }
  return Math.max(1, Math.min(15, Math.round((n.length / dur) * 1.6 + peak * 0.35)));
}

function updateInfo() {
  const n = ed.notes;
  const ln = n.filter((x) => x.end).length;
  const est = estLevel();
  $('ed-estlv').textContent = est ? `(目安 ${est})` : '';
  const cnt = { stop: 0, speed: 0, cover: 0 };
  for (const g of ed.gimmicks) cnt[g.type]++;
  $('ed-info').innerHTML = `<div><b>${n.length}</b> ノーツ(ロング ${ln})</div>
    <div>ギミック: 停止 ${cnt.stop} / 変速 ${cnt.speed} / 隠し ${cnt.cover}</div>
    <div>BPM ${ed.bpm.toFixed(ed.entry?.local ? 2 : 0)} ・ ${fmt(duration())}</div>`;
}
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function setTool(t) {
  ed.tool = t;
  for (const b of $('ed-tools').querySelectorAll('button')) b.classList.toggle('sel', b.dataset.tool === t);
}

// ---------------------------------------------------------------------------
// 再生・録音
// ---------------------------------------------------------------------------
function togglePlay() { if (ed.playing) stopPlay(); else startPlay(); }
function startPlay() {
  const buf = ed.entry?.buffer;
  if (!buf) { ui.toast('音源を準備中です'); return; }
  const ctx = getCtx();
  if (ed.cur >= buf.duration - 0.1) ed.cur = 0;
  ed.src = ctx.createBufferSource();
  ed.src.buffer = buf;
  ed.src.connect(bgmOut());
  ed.playStartCtx = ctx.currentTime + 0.05;
  ed.playStartCur = ed.cur;
  ed.lastGuide = ed.cur;
  ed.src.start(ed.playStartCtx, ed.cur);
  ed.src.onended = () => { if (ed.playing && ed.src?.buffer === buf) stopPlay(); };
  ed.playing = true;
  $('ed-play').innerHTML = '■ 停止 <kbd>Space</kbd>';
}
function stopPlay() {
  if (!ed.playing) return;
  ed.playing = false;
  try { ed.src.onended = null; ed.src.stop(); } catch { /* already stopped */ }
  ed.src = null;
  if (ed.rec) toggleRec(false);
  $('ed-play').innerHTML = '▶ 再生 <kbd>Space</kbd>';
}
function toggleRec(on = !ed.rec) {
  ed.rec = on;
  $('ed-rec').classList.toggle('on', on);
  $('ed-rec').innerHTML = on ? '● 録音中 <kbd>R</kbd>' : '● 録音 <kbd>R</kbd>';
  if (on) {
    if (!ed.playing) { ed.cur = Math.max(0, ed.cur - 2 * spb()); startPlay(); }
    pushUndo();
    ui.toast('録音中: 曲に合わせて D F J K を叩くとノーツが入ります(長く押すとロング)');
  }
}
const playTime = (perf = performance.now()) => ed.playStartCur + Math.max(0, nowAudio(perf) - ed.playStartCtx);

function recPress(lane, ev) {
  const t = snapT(playTime(ev.timeStamp));
  ed.held[lane] = { t, raw: playTime(ev.timeStamp) };
  ed.notes = ed.notes.filter((n) => !(n.lane === lane && Math.abs(n.t - t) < 0.001));
  ed.notes.push({ t, lane });
  playTap();
  changed();
}
function recRelease(ev) {
  const lane = KEYS.indexOf(ev.code);
  if (lane < 0 || !ed.held[lane]) return;
  const h = ed.held[lane];
  ed.held[lane] = null;
  if (!ed.playing) return;
  const end = snapT(playTime(ev.timeStamp));
  if (playTime(ev.timeStamp) - h.raw > 0.25 && end > h.t) {
    const n = ed.notes.find((x) => x.lane === lane && Math.abs(x.t - h.t) < 0.001);
    if (n) { n.end = end; changed(); }
  }
}

// ---------------------------------------------------------------------------
// テストプレイ・投稿
// ---------------------------------------------------------------------------
function engineGimmicks() { return ed.gimmicks.map((g) => ({ t: g.t, type: g.type, dur: g.dur || 0, to: g.to ?? 0 })); }

function testPlay() {
  if (!ed.notes.length) { ui.toast('ノーツを置いてからテストできます'); return; }
  stopPlay();
  saveDraft();
  const from = ed.cur < 1 ? 0 : Math.max(0, ed.cur - 1);
  const notes = ed.notes.filter((n) => n.t >= from).map((n) => ({ ...n }));
  if (!notes.length) { ui.toast('この位置より後にノーツがありません'); return; }
  const back = ed.cur;
  ui.play(ed.entry, {
    kind: 'test', notes, scroll: buildScroll(engineGimmicks(), ed.bpm), title: ed.title || 'テストプレイ', level: ed.level, startFrom: from,
    onExit: (r) => {
      // 下書きと元に戻す履歴はそのままエディタへ戻る
      ui.show('editor');
      ed.cur = back;
      cancelAnimationFrame(ed.raf);
      ed.raf = requestAnimationFrame(frame);
      if (r) ui.toast(`テスト結果: ${r.rank} ・ ${r.score.toLocaleString()} ・ MISS ${r.counts.MISS}`, 4000);
    },
  });
}

async function post() {
  if (ed.entry.local) { ui.toast('読み込んだ曲の譜面は投稿できません(内蔵曲のみ)'); return; }
  if (!acc.isLoggedIn()) { ui.toast('投稿するにはログインしてください'); openAccount(); return; }
  if (!ed.title.trim()) { ui.toast('譜面のタイトルを入れてください'); $('ed-title').focus(); return; }
  if (ed.notes.length < 10) { ui.toast('ノーツを10個以上置いてください'); return; }
  if (ed.chartId && !confirm('投稿済みの譜面を更新します。この譜面のランキング記録はリセットされます。よろしいですか?')) return;
  $('ed-post').disabled = true;
  try {
    const id = await api.saveChart({ id: ed.chartId, song: ed.entry.id, title: ed.title.trim(), level: ed.level, notes: ed.notes, gimmicks: engineGimmicks() });
    const wasNew = !ed.chartId;
    ed.chartId = id;
    saveDraft();
    $('ed-post').textContent = '更新して投稿';
    ui.toast(wasNew ? '投稿しました!「みんなの譜面」から遊べます' : '譜面を更新しました');
  } catch (e) {
    if (e.message === 'NOT_OWNER') { ed.chartId = null; saveDraft(); }
    ui.toast(api.CHART_ERR[e.message] || acc.errText(e));
  } finally {
    $('ed-post').disabled = false;
  }
}

// ---------------------------------------------------------------------------
// キャンバス
// ---------------------------------------------------------------------------
function layout() {
  const cv = $('ed-canvas');
  const W = cv.clientWidth, H = cv.clientHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ruler = 46, gW = W < 520 ? 74 : 104;
  const laneW = Math.max(36, Math.min(92, (W - ruler - gW - 24) / 4));
  const x0 = ruler + Math.max(8, (W - ruler - gW - 16 - laneW * 4) / 2);
  return { W, H, dpr, ruler, laneW, x0, gx: x0 + laneW * 4 + 10, gW, playY: H * 0.8 };
}
const yOf = (L, t) => L.playY - (t - ed.cur) * ed.zoom;
const tOf = (L, y) => ed.cur + (L.playY - y) / ed.zoom;

function frame() {
  ed.raf = requestAnimationFrame(frame);
  if (ui.current() !== 'editor') return;
  if (ed.playing) {
    const now = playTime();
    if ($('ed-guide').checked) {
      if (ed.notes.some((n) => n.t > ed.lastGuide && n.t <= now)) playTap();
    }
    ed.lastGuide = now;
    ed.cur = now;
  }
  $('ed-pos').value = Math.round((ed.cur / duration()) * 1000);
  draw();
}

export function draw() {
  const L = layout();
  const g = $('ed-canvas').getContext('2d');
  g.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
  g.fillStyle = '#060918';
  g.fillRect(0, 0, L.W, L.H);
  // レーン
  for (let l = 0; l < 4; l++) {
    g.fillStyle = l % 2 ? 'rgba(20,28,60,0.55)' : 'rgba(14,20,46,0.55)';
    g.fillRect(L.x0 + l * L.laneW, 0, L.laneW, L.H);
  }
  g.fillStyle = 'rgba(196,155,255,0.06)';
  g.fillRect(L.gx, 0, L.gW, L.H);
  // 停止区間はレーンにも薄く色を付ける
  for (const gm of ed.gimmicks) {
    if (gm.type !== 'stop') continue;
    const y1 = yOf(L, gm.t), y2 = yOf(L, gm.t + gm.dur);
    g.fillStyle = 'rgba(196,155,255,0.10)';
    g.fillRect(L.x0, y2, L.laneW * 4, y1 - y2);
  }
  // グリッド
  const tTop = tOf(L, 0), tBot = tOf(L, L.H);
  const b0 = Math.floor(beatOf(Math.max(0, tBot)) * ed.snap), b1 = Math.ceil(beatOf(tTop) * ed.snap);
  g.font = '600 11px "Orbitron", sans-serif';
  g.textAlign = 'right';
  for (let k = b0; k <= b1 && k - b0 < 2000; k++) {
    const t = timeOfBeat(k / ed.snap);
    if (t < 0 || t > duration()) continue;
    const y = yOf(L, t);
    const measure = k % (ed.snap * 4) === 0, beat = k % ed.snap === 0;
    g.strokeStyle = measure ? 'rgba(160,180,255,0.55)' : beat ? 'rgba(130,150,230,0.28)' : 'rgba(110,130,210,0.10)';
    g.lineWidth = measure ? 1.5 : 1;
    g.beginPath(); g.moveTo(L.x0, y); g.lineTo(L.gx + L.gW, y); g.stroke();
    if (measure) { g.fillStyle = 'rgba(170,190,255,0.75)'; g.fillText(String(k / (ed.snap * 4) + 1), L.ruler - 6, y + 4); }
  }
  // 曲の終わり
  const yEnd = yOf(L, duration());
  if (yEnd > 0) { g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, L.W, yEnd); }
  // ギミック
  g.textAlign = 'left';
  ed.gimmicks.forEach((gm) => {
    const y = yOf(L, gm.t);
    if (y < -40 || (y > L.H + 40 && yOf(L, gm.t + (gm.dur || 0)) > L.H)) return;
    const col = gm.type === 'stop' ? '#c49bff' : gm.type === 'speed' ? '#ffd25e' : '#5ef2ff';
    if (gm.dur > 0) {
      const y2 = yOf(L, gm.t + gm.dur);
      g.fillStyle = col + '33';
      g.fillRect(L.gx + 2, y2, L.gW - 4, y - y2);
    }
    g.strokeStyle = col; g.lineWidth = 2;
    g.beginPath(); g.moveTo(L.gx, y); g.lineTo(L.gx + L.gW, y); g.stroke();
    g.fillStyle = col;
    g.font = '700 11px "Noto Sans JP", sans-serif';
    g.fillText(gimmickText(gm), L.gx + 4, y - 4);
  });
  // ノーツ
  const drawNote = (n, ghost) => {
    const x = L.x0 + n.lane * L.laneW + 4, w = L.laneW - 8, y = yOf(L, n.t);
    const c = LANE_COLORS[n.lane];
    if (n.end) {
      const ye = yOf(L, n.end);
      g.fillStyle = c + (ghost ? '44' : '66');
      g.fillRect(x + w * 0.2, ye, w * 0.6, y - ye);
      g.fillStyle = c; g.fillRect(x, ye - 3, w, 6);
    }
    g.globalAlpha = ghost ? 0.6 : 1;
    g.fillStyle = c;
    g.fillRect(x, y - 6, w, 12);
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.fillRect(x + 6, y - 2, w - 12, 4);
    g.globalAlpha = 1;
  };
  for (const n of ed.notes) {
    const y = yOf(L, n.t);
    if (y < -20 && (!n.end || yOf(L, n.end) < -20)) continue;
    if (yOf(L, n.end || n.t) > L.H + 20) continue;
    drawNote(n);
  }
  if (ed.placing) drawNote(ed.placing, true);
  // 判定位置(現在位置)
  g.strokeStyle = ed.rec ? '#ff4f6e' : '#7ff9ff';
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, L.playY); g.lineTo(L.W, L.playY); g.stroke();
  const b = beatOf(ed.cur);
  g.fillStyle = ed.rec ? '#ff4f6e' : '#7ff9ff';
  g.font = '700 11px "Orbitron", sans-serif';
  g.textAlign = 'left';
  g.fillText(`${fmtMs(ed.cur)}  小節${Math.floor(b / 4) + 1}.${(Math.floor(((b % 4) + 4) % 4) + 1)}`, 6, L.playY + 16);
  if (ed.rec) { g.fillStyle = '#ff4f6e'; g.fillText('● REC', 6, 18); }
  // 下のレーン名
  g.textAlign = 'center';
  g.font = '700 12px "Orbitron", sans-serif';
  ['D', 'F', 'J', 'K'].forEach((k, l) => { g.fillStyle = 'rgba(200,215,255,0.5)'; g.fillText(k, L.x0 + l * L.laneW + L.laneW / 2, L.H - 8); });
  g.fillStyle = 'rgba(196,155,255,0.6)';
  g.fillText('ギミック', L.gx + L.gW / 2, L.H - 8);
}
const fmtMs = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;

function gimmickText(gm) {
  const beats = (gm.dur || 0) / spb();
  const bs = Math.round(beats * 100) / 100;
  if (gm.type === 'stop') return `停止 ${bs}拍`;
  if (gm.type === 'speed') return `速さ ×${gm.to}${bs ? ` (${bs}拍で)` : ''}`;
  return gm.to > 0 ? `隠し ${Math.round(gm.to * 100)}%` : '隠し 解除';
}

// --- 操作 ---
function hitNote(L, x, y) {
  const lane = Math.floor((x - L.x0) / L.laneW);
  if (lane < 0 || lane > 3) return -1;
  return ed.notes.findIndex((n) => {
    if (n.lane !== lane) return false;
    const yh = yOf(L, n.t);
    if (Math.abs(y - yh) <= 9) return true;
    return n.end && y < yh && y > yOf(L, n.end) - 4;
  });
}

function onDown(ev) {
  const L = layout();
  const r = ev.currentTarget.getBoundingClientRect();
  const x = ev.clientX - r.left, y = ev.clientY - r.top;
  ev.currentTarget.setPointerCapture(ev.pointerId);
  if (x < L.ruler || (ev.pointerType !== 'mouse' && ev.button === 0 && x < L.x0)) {
    if (ed.playing) stopPlay();
    ed.scrub = { y, cur: ed.cur };
    return;
  }
  if (x >= L.gx - 4 || ed.tool === 'gimmick') {
    const t = tOf(L, y);
    const idx = ed.gimmicks.findIndex((gm) => Math.abs(yOf(L, gm.t) - y) < 10);
    openGimmick(idx >= 0 ? idx : null, snapT(t), ev.clientX, ev.clientY);
    return;
  }
  const lane = Math.floor((x - L.x0) / L.laneW);
  const t = snapT(tOf(L, y));
  // クリック位置に描かれているノーツ、またはスナップ先に既にあるノーツは消す
  let hit = hitNote(L, x, y);
  if (hit < 0) hit = ed.notes.findIndex((n) => n.lane === lane && Math.abs(n.t - t) < 0.001);
  if (hit >= 0) { pushUndo(); ed.notes.splice(hit, 1); changed(); return; }
  if (ev.button === 2) return;
  if (lane < 0 || lane > 3) return;
  if (t > duration()) return;
  ed.placing = { t, lane, id: ev.pointerId };
}
function onMove(ev) {
  const L = layout();
  const r = ev.currentTarget.getBoundingClientRect();
  const y = ev.clientY - r.top;
  if (ed.scrub) { ed.cur = clampT(ed.scrub.cur + (y - ed.scrub.y) / ed.zoom); return; }
  if (!ed.placing || ev.pointerId !== ed.placing.id) return;
  const e = snapT(tOf(L, y));
  if (e >= ed.placing.t + stepT() * 0.99) ed.placing.end = Math.min(e, duration()); else delete ed.placing.end;
}
function onUp(ev) {
  if (ed.scrub) { ed.scrub = null; return; }
  const p = ed.placing;
  if (!p || ev.pointerId !== p.id) return;
  ed.placing = null;
  pushUndo();
  ed.notes = ed.notes.filter((n) => !(n.lane === p.lane && Math.abs(n.t - p.t) < 0.001));
  const n = { t: p.t, lane: p.lane };
  if (p.end) n.end = p.end;
  ed.notes.push(n);
  changed();
}

// --- ギミック編集パネル ---
function openGimmick(index, t, cx, cy) {
  const gm = index != null ? ed.gimmicks[index] : { t, type: 'stop', dur: spb(), to: 0.5 };
  ed.gEdit = { index, t: gm.t };
  $('gp-type').value = gm.type;
  $('gp-dur').value = Math.round(((gm.dur || 0) / spb()) * 100) / 100;
  $('gp-to').value = gm.type === 'cover' ? Math.round((gm.to ?? 0.4) * 100) : gm.to ?? 1;
  $('gp-title').textContent = `${fmtMs(gm.t)} のギミック`;
  $('gp-del').hidden = index == null;
  syncGimmickForm(true);
  const pop = $('ed-gpop');
  pop.hidden = false;
  const r = pop.getBoundingClientRect();
  pop.style.left = Math.max(8, Math.min(window.innerWidth - r.width - 8, cx - r.width / 2)) + 'px';
  pop.style.top = Math.max(8, Math.min(window.innerHeight - r.height - 8, cy - r.height - 12)) + 'px';
}
function syncGimmickForm(keep) {
  const type = $('gp-type').value;
  $('gp-to-row').hidden = type === 'stop';
  $('gp-dur-label').textContent = type === 'stop' ? '止まる長さ(拍)' : '変化にかける拍(0で一瞬)';
  $('gp-to-label').textContent = type === 'speed' ? '速さの倍率(0.1〜4)' : '隠す割合(%・0で解除)';
  if (keep !== true) {
    if (type === 'speed') { $('gp-to').value = 0.5; $('gp-dur').value = 0; }
    if (type === 'cover') { $('gp-to').value = 40; $('gp-dur').value = 1; }
    if (type === 'stop') $('gp-dur').value = 1;
  }
  $('gp-help').textContent = {
    stop: '音楽は進んだまま、ノーツの流れだけが止まります。',
    speed: 'ここから流れる速さが変わります(1が普通)。',
    cover: 'レーンの奥側を隠して、ノーツが手前で現れるようにします。',
  }[type];
}
function applyGimmick() {
  const type = $('gp-type').value;
  const dur = Math.max(0, +$('gp-dur').value || 0) * spb();
  let to = +$('gp-to').value;
  if (type === 'speed') to = Math.max(0.1, Math.min(4, to || 1));
  if (type === 'cover') to = Math.max(0, Math.min(0.8, (to || 0) / 100));
  if (type === 'stop' && dur <= 0) { ui.toast('止まる長さを入れてください'); return; }
  pushUndo();
  const gm = { t: ed.gEdit.t, type, dur, to: type === 'stop' ? 0 : to };
  if (ed.gEdit.index != null) ed.gimmicks[ed.gEdit.index] = gm; else ed.gimmicks.push(gm);
  ed.gimmicks.sort((a, b) => a.t - b.t);
  changed(false);
  closeGimmick();
}
function closeGimmick() { $('ed-gpop').hidden = true; ed.gEdit = null; }

// --- キーボード(main.js から呼ばれる) ---
export function makerKeydown(ev) {
  const st = ui.current();
  if (st === 'charts') { if (ev.key === 'Escape') ui.back(); return; }
  const tag = ev.target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') { if (ev.key === 'Escape') ev.target.blur(); return; }
  if (!$('ed-gpop').hidden) { if (ev.key === 'Escape') closeGimmick(); if (ev.key === 'Enter') applyGimmick(); return; }
  const lane = KEYS.indexOf(ev.code);
  if (lane >= 0) {
    ev.preventDefault();
    if (ev.repeat) return;
    if (ed.rec && ed.playing) { recPress(lane, ev); return; }
    // 停止中: 今の位置にノーツを置く/消す
    const t = snapT(ed.cur);
    const i = ed.notes.findIndex((n) => n.lane === lane && Math.abs(n.t - t) < 0.001);
    pushUndo();
    if (i >= 0) ed.notes.splice(i, 1); else ed.notes.push({ t, lane });
    changed();
    return;
  }
  const k = ev.key;
  if (k === ' ') { ev.preventDefault(); togglePlay(); }
  else if (k === 'r' || k === 'R') toggleRec();
  else if (k === 't' || k === 'T') testPlay();
  else if ((ev.ctrlKey || ev.metaKey) && (k === 'z' || k === 'Z')) { ev.preventDefault(); if (ev.shiftKey) redo(); else undo(); }
  else if ((ev.ctrlKey || ev.metaKey) && (k === 'y' || k === 'Y')) { ev.preventDefault(); redo(); }
  else if (k === 'ArrowUp' || k === 'ArrowDown') { ev.preventDefault(); if (ed.playing) stopPlay(); ed.cur = clampT(snapT(ed.cur) + (k === 'ArrowUp' ? 1 : -1) * stepT()); }
  else if (k === 'PageUp' || k === 'PageDown') { ev.preventDefault(); if (ed.playing) stopPlay(); ed.cur = clampT(ed.cur + (k === 'PageUp' ? 4 : -4) * spb()); }
  else if (k === 'Home') { if (ed.playing) stopPlay(); ed.cur = 0; }
  else if (k === 'Escape') { if (ed.playing) stopPlay(); else closeEditor(); }
}

// ---------------------------------------------------------------------------
// みんなの譜面
// ---------------------------------------------------------------------------
export function openCharts() {
  ui.show('charts');
  const sel = $('charts-song');
  const keep = sel.value;
  sel.innerHTML = '<option value="">すべての曲</option>' + ui.entries.filter((e) => !e.local).map((e) => `<option value="${e.id}">${ui.esc(e.title)}</option>`).join('');
  sel.value = keep || '';
  loadCharts();
}

let chartRows = [];
async function loadCharts() {
  const list = $('chart-list');
  list.innerHTML = '<li class="list-empty">読み込み中…</li>';
  const sort = $('charts-sort').value;
  if (sort === 'mine' && !acc.isLoggedIn()) { list.innerHTML = '<li class="list-empty">自分の譜面を見るにはログインしてください</li>'; return; }
  try {
    chartRows = await api.listCharts({ song: $('charts-song').value, sort, q: $('charts-q').value.trim() });
    renderCharts();
  } catch (e) {
    console.error(e);
    list.innerHTML = '<li class="list-empty">読み込めませんでした</li>';
  }
}

function renderCharts() {
  const list = $('chart-list');
  if (!chartRows.length) {
    list.innerHTML = '<li class="list-empty">まだ譜面がありません。「＋ 譜面を作る」から最初の1つを作ってみよう</li>';
    return;
  }
  const songTitle = (id) => ui.entries.find((e) => e.id === id)?.title || id;
  const color = (id) => ui.entries.find((e) => e.id === id)?.color || '#5ef2ff';
  list.innerHTML = chartRows.map((c) => `<li class="chart-row" data-id="${c.id}" style="--c:${color(c.song)}">
    <div class="cr-lv"><small>Lv</small>${c.level}</div>
    <div class="cr-main">
      <div class="cr-title">${ui.esc(c.title)}</div>
      <div class="cr-sub">${ui.esc(songTitle(c.song))} ・ by ${ui.esc(c.author)} ・ ${c.note_count} ノーツ ・ ▶ ${c.plays}</div>
    </div>
    <div class="cr-actions">
      <button class="btn-glow cr-play" data-act="play">▶ プレイ</button>
      <button class="cr-btn ${c.liked ? 'liked' : ''}" data-act="like" aria-label="いいね">♥ ${c.likes}</button>
      <button class="cr-btn" data-act="rank">ランキング</button>
      ${c.mine ? '<button class="cr-btn" data-act="edit">編集</button><button class="cr-btn danger" data-act="del">削除</button>' : ''}
    </div>
    <ol class="rank-list cr-rank" hidden></ol>
  </li>`).join('');
}

async function onChartAction(ev) {
  const b = ev.target.closest('[data-act]');
  if (!b) return;
  const li = b.closest('.chart-row');
  const id = li.dataset.id;
  const row = chartRows.find((c) => c.id === id);
  const act = b.dataset.act;
  try {
    if (act === 'play') {
      b.disabled = true;
      const c = await api.getChart(id);
      const entry = ui.entries.find((e) => e.id === c.song && !e.local);
      if (!entry) { ui.toast('この曲が見つかりません'); return; }
      api.countPlay(id);
      ui.play(entry, {
        kind: 'custom', notes: c.notes, scroll: buildScroll(c.gimmicks, entry.bpm), title: c.title, level: c.level, chartId: id,
        onExit: () => openCharts(),
      });
    } else if (act === 'like') {
      if (!acc.isLoggedIn()) { ui.toast('いいねするにはログインしてください'); openAccount(); return; }
      const r = await api.likeChart(id);
      row.liked = r.liked; row.likes = r.likes;
      b.classList.toggle('liked', r.liked);
      b.textContent = `♥ ${r.likes}`;
    } else if (act === 'rank') {
      const ol = li.querySelector('.cr-rank');
      ol.hidden = !ol.hidden;
      if (!ol.hidden) {
        ol.innerHTML = '<li class="empty">読み込み中…</li>';
        ol.innerHTML = ui.rankRows(await api.fetchChartRanking(id, ui.myRankId(), 10));
      }
    } else if (act === 'edit') {
      const c = await api.getChart(id);
      const entry = ui.entries.find((e) => e.id === c.song && !e.local);
      if (entry) openEditor(entry, { chart: c });
    } else if (act === 'del') {
      if (!confirm(`「${row.title}」を削除しますか?(元に戻せません)`)) return;
      await api.deleteChart(id);
      ui.toast('削除しました');
      loadCharts();
    }
  } catch (e) {
    console.error(e);
    ui.toast(api.CHART_ERR[e.message] || acc.errText(e));
  } finally {
    b.disabled = false;
  }
}

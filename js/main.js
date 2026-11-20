import { langPref, setLang } from './i18n.js'; // 多言語表示(いちばん先に読んで、画面の文字を置き換える)
import SONGS from './songs/index.js';
import { composeSong, candidatesFromEvents, generateChart, shapeHolds, chartStats, DIFFS, hashStr, extraParam } from './composer.js';
import EXTRA_LEVELS from './songs/extra-levels.js'; // 内蔵曲の EXTRA のレベル(tools/extra-levels.mjs で作る)
import { getCtx, setVolumes, playPreview, stopPreview, bgmOutFor } from './audio.js';
import { loadSongAudio } from './audio-cache.js';
import { loadExternalAudio } from './external-audio.js';
import { showLoading, hideLoading } from './loading.js';
import { analyzeFile, hashFile } from './analyzer.js';
import { buildScroll, dropNotesInStops, gimmickLabel } from './gimmick.js';
import { jacketURL, jacketImg, clearJackets } from './jacket.js';
import { mvTag, createMV, analyzeSections, prepareMV, chartSections } from './mv.js';
import { CHANGELOG, VERSION } from './changelog.js';
import { Game, PointCloud, laneOf, DIFF_COLOR, visibleTime, IS_TOUCH, FX_LEVELS } from './game.js';
import { load, save, getSettings, setSettings, DEFAULT_SETTINGS, clientId, getBest, recordBest } from './storage.js';
import { fetchRanking, submitScore } from './ranking.js';
import * as acc from './account.js';
import { initMeta, openAccount, renderHeader, gachaResultOpen, closeGacha, openScreen as openMetaScreen, showGiftGacha } from './meta.js';
import { initMaker, openCharts, openEditor, makerKeydown, homeFeatured } from './maker.js';
import { fetchChartRanking, submitChartScore } from './maker-api.js';
import { fxText } from './units.js';
import { initLive, openLive, backToRoom, roomCode, joinFromLink } from './live.js';
import { initPlayer, openPlayer, playerKeydown, stop as stopPlayer } from './player.js';
import { TUTORIAL_DEF, TUT_NOTES, tutCaptions } from './tutorial.js';
import { lyricsQuick, lyricsFor } from './lyrics.js';
import { decodeInputs, localReplay, saveLocalReplay, uploadReplay, topReplays, getReplay } from './replay.js';
import { initAdmin, openAdmin, stopAdmin } from './admin.js';
import { initRequest, closeRequest } from './request.js';
import { initMotion, replay } from './motion.js';
import { initGrowth, playerBadges, bindBadges, renderSongStats, renderWeekly, weeklyResult, resultGrowth, closeGrowth, currentRate, openProfile, titleTag } from './growth.js';
import { initFriends, closeFriends, fetchFriendRanking } from './friends.js';
import { newBadges } from './badges.js';
import { initMatch, cancelMatch, reportMatch } from './match.js';
import { initInstall, countPlay, maybeShowInstall } from './install.js';
import { initKeyConfig, render as renderKeys, apply as applyKeys } from './keyconfig.js';
import { initDan, openDan, bestDan, danName } from './dan.js';
import { initEvent, eventActive } from './event.js';
import { initSeason, seasonResult } from './season.js';
import { initSpecials } from './specials.js';
import { initPoll, syncPollButton } from './poll.js';
import { initExtras, renderDaily, dailyResult, drawJudgeGraph, setShareResult, courseFromUrl, playDaily } from './extras.js';
import { initSocial, renderNext, postX, resultText, ghostFor, uploadGhost, SITE } from './social.js';
import { arm as armRecord, startRecording, stopRecording, saveVideo, recordSupported } from './recorder.js';

const APP_ROOT_URL = new URL('../', import.meta.url);

// ゴースト(自己ベストの判定の記録)を端末に保存。1判定 =「判定の頭文字 + 時刻(10ms単位・36進)」
const GH = { PERFECT: 'P', GREAT: 'G', GOOD: 'D', MISS: 'M' }, GH_R = { P: 'PERFECT', G: 'GREAT', D: 'GOOD', M: 'MISS' };
const saveGhost = (id, d, log) => { try { save(`ghost:${id}:${d}`, log.map(([t, res]) => GH[res] + Math.max(0, Math.round(t * 100)).toString(36)).join(',')); } catch { /* 容量オーバー */ } };
const loadGhost = (id, d) => { const s = load(`ghost:${id}:${d}`, ''); return s ? s.split(',').map((x) => [parseInt(x.slice(1), 36) / 100, GH_R[x[0]]]) : null; };
const OPT_TAG = { mirror: 'MIRROR', random: 'RANDOM', hidden: 'HIDDEN', sudden: 'SUDDEN' };
const optTag = (o) => [OPT_TAG[o.lane], OPT_TAG[o.vis]].filter(Boolean).map((x) => ' ・ ' + x).join('');

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtScore = (n) => String(n).padStart(7, '0');

const canvas = $('stage');
const cloud = new PointCloud();
let settings = getSettings();
let state = 'title'; // title | select | game | result | quest | gacha | team
let game = null;
let lastResult = null;

// ---------------------------------------------------------------------------
// 曲の準備
// ---------------------------------------------------------------------------
// 音源ファイルの曲(def.audio)。譜面は def.fixedCharts、音源取得と展開は外部音源ローダーに任せる
// 音源はメモリを大きく使う(1曲 数十MB)ので、最近使った数曲だけ持っておく。
// 外した曲はまた使うときに読み直す(合成した曲は端末に保存してあるので速い)
const KEEP_BUFFERS = 3;
const recentBuf = [];
function touchBuffer(e) {
  const i = recentBuf.indexOf(e);
  if (i >= 0) recentBuf.splice(i, 1);
  recentBuf.push(e);
  while (recentBuf.length > KEEP_BUFFERS) { const old = recentBuf.shift(); old.buffer = null; old.rendering = null; }
}

// のばす音をトリルなどに変える(composer.js の shapeHolds)。曲ファイルで holdStyle: false にすると今までのロングノーツのまま
const holds = (notes, d, def) => (def.holdStyle === false ? notes : shapeHolds(notes, d === 'extra' ? 'hard' : d, { bpm: def.bpm, level: def.levels?.[d], seed: hashStr(def.id) }));
// その曲で選べる難易度(EXTRA は譜面がある曲だけ)
const diffsOf = (e) => (e?.levels?.extra ? [...DIFFS, 'extra'] : DIFFS);

function fileSongEntry(def) {
  const charts = {}, stats = {};
  const unpack = (arr) => arr.map(([t, lane, e]) => (e ? { t: t / 1000, lane, end: e / 1000 } : { t: t / 1000, lane }));
  const scroll = buildScroll(def.gimmicks, def.bpm);
  for (const d of [...DIFFS, ...(def.fixedCharts.extra ? ['extra'] : [])]) {
    charts[d] = dropNotesInStops(holds(unpack(def.fixedCharts[d]), d, def), scroll.stops);
    stats[d] = chartStats(charts[d]);
  }
  const onsets = onsetList(DIFFS.flatMap((d) => charts[d].map((n) => n.t)));
  return {
    id: def.id, urlId: def.urlId, title: def.title, artist: def.artist, genre: def.genre, bpm: def.bpm, offset: def.offset || 0, color: def.color,
    event: def.event || null, levels: def.levels, charts, stats, local: false, duration: def.duration, scroll, gimmick: gimmickLabel(def.gimmicks), gimmicks: def.gimmicks || [],
    previewAt: def.previewAt ?? def.duration * 0.3, credit: def.credit, creditUrl: def.creditUrl, onsets, lyrics: def.lyrics || null,
    // MV用の情報(区間は譜面の密度から)
    mvAuto() { return (this._mv ||= { title: def.title, artist: def.artist, genre: def.genre, color: def.color, sections: chartSections(charts.normal, def.bpm, def.offset || 0, def.duration) }); },
    buffer: null, rendering: null,
    load() {
      if (this.buffer) { touchBuffer(this); return Promise.resolve(this.buffer); }
      if (!this.rendering) {
        this.loadFailed = false;
        this.rendering = loadExternalAudio(new URL(def.audio, APP_ROOT_URL), def.audioKey, (p) => { this.progress = p; }).then((buf) => {
          this.progress = 1;
          this.loadFailed = false;
          this.buffer = buf;
          touchBuffer(this);
          return buf;
        }).catch((err) => { this.rendering = null; this.progress = 0; this.loadFailed = true; throw err; });
      }
      return this.rendering;
    },
  };
}

// 譜面メーカーの録音補正用: 音が鳴る時刻の一覧(昇順・近いものはまとめる)
function onsetList(times) {
  const s = [...times].sort((a, b) => a - b), out = [];
  for (const t of s) if (!out.length || t - out[out.length - 1] > 0.012) out.push(t);
  return out;
}
const NOT_ONSET = new Set(['pad', 'riser', 'downer']);

// 内蔵曲。曲データ(イベント)と譜面は、使うときにはじめて作る(起動時に全曲ぶん作ると、スマホでは数秒かかるため)
// 起動後は手が空いたときに少しずつ作っておく(prepareIdle)
function builtinEntry(def) {
  let built = null;
  const build = () => {
    if (built) return built;
    const { events, duration } = composeSong(def);
    const cands = candidatesFromEvents(events);
    const onsets = onsetList(events.filter((e) => !NOT_ONSET.has(e.type)).map((e) => e.t));
    const charts = {}, stats = {};
    for (const d of DIFFS) {
      charts[d] = dropNotesInStops(holds(generateChart(cands, d, duration, hashStr(def.id), def.chart?.[d]), d, def), scroll.stops);
      stats[d] = chartStats(charts[d]);
    }
    if (levels.extra) { // EXTRA: HARD の値から細かく・多くした譜面
      charts.extra = dropNotesInStops(holds(generateChart(cands, 'extra', duration, hashStr(def.id), extraParam(def.chart?.hard, def.chart?.extra)), 'extra', def), scroll.stops);
      stats.extra = chartStats(charts.extra);
    }
    return (built = { events, duration, onsets, charts, stats });
  };
  const scroll = buildScroll(def.gimmicks, def.bpm);
  const levels = EXTRA_LEVELS[def.id] ? { ...def.levels, extra: EXTRA_LEVELS[def.id] } : def.levels;
  return {
    id: def.id, urlId: def.urlId, title: def.title, artist: def.artist, genre: def.genre, bpm: def.bpm, color: def.color,
    event: def.event || null, levels, local: false, scroll, gimmick: gimmickLabel(def.gimmicks), gimmicks: def.gimmicks || [],
    get charts() { return build().charts; },
    get stats() { return build().stats; },
    get duration() { return build().duration; },
    get onsets() { return build().onsets; },
    get built() { return !!built; },
    prepare() { build(); },
    previewAt: (def.preview ?? 32) * 60 / def.bpm,
    // 手作りMVがない曲の自動MV用(曲の構成は使うときに調べる)
    mvAuto() { const b = build(); return (this._mv ||= { title: def.title, genre: def.genre, color: def.color, sections: analyzeSections(b.events, def.bpm, b.duration) }); },
    buffer: null, rendering: null,
    load() {
      if (this.buffer) { touchBuffer(this); return Promise.resolve(this.buffer); }
      if (!this.rendering) {
        const b = build();
        this.rendering = loadSongAudio(def.id, b.events, b.duration, { sidechain: !!def.sidechain }, (p) => { this.progress = p; })
          .then((buf) => { this.buffer = buf; touchBuffer(this); return buf; })
          .catch((err) => { this.rendering = null; this.progress = 0; throw err; }); // 失敗したら次に選んだときやり直せるように
      }
      return this.rendering;
    },
  };
}
// 手が空いたときに、まだ作っていない曲の譜面を1曲ずつ作っておく(選曲画面をすぐ開けるように)
function prepareIdle() {
  const ric = window.requestIdleCallback || ((f) => setTimeout(() => f({ timeRemaining: () => 8 }), 50));
  const step = (dl) => {
    const rest = entries.filter((e) => e.prepare && !e.built);
    if (!rest.length) return;
    const first = rest.indexOf(entries[sel]) >= 0 ? entries[sel] : rest[0]; // 選んでいる曲から
    first.prepare();
    for (const e of rest) { if (dl.timeRemaining() < 6) break; if (!e.built) e.prepare(); }
    ric(step, { timeout: 2000 });
  };
  ric(step, { timeout: 2000 });
}
// 期間限定の曲(event つき)は、そのイベントの期間だけ出す
const entries = SONGS.filter((def) => !def.event || eventActive(def.event)).map((def) => (def.audio ? fileSongEntry(def) : builtinEntry(def)));
let tutorialEntry = null; // 使うときに作る

// 前回選んでいた曲。番号だと曲の追加や期間限定曲の出入りでずれるので、曲IDで覚える(昔の保存は番号)
let sel = (() => {
  const i = entries.findIndex((e) => e.id === load('selId', null));
  return i >= 0 ? i : Math.max(0, Math.min(entries.length - 1, load('sel', 0)));
})();
// 曲ページ(music/<urlId>/)から来たらその曲を選んだ状態で始める
const ROOT_PATH = new URL('./', document.baseURI).pathname;
const urlSongId = document.querySelector('meta[name="song-id"]')?.content;
// ログインしていない人が曲URLを開いたときは、普通のトップ(タイトル画面・トップURL)として扱う
// 埋め込み(よそのサイトの <iframe> の中。曲ページ + ?embed=1): その曲の選曲・プレイ・リザルトだけ
const EMBED = new URLSearchParams(location.search).has('embed');
// 歌詞の時刻合わせモード(?lyricsync=1): プレイ中に各行の歌い始めで Enter を押すと、その時刻に置き直して、全体をクリップボードにコピーする
const LYRIC_SYNC = new URLSearchParams(location.search).has('lyricsync');
let lyricMarks = { game: null, n: 0 };
// 押した時刻を次の行の歌い始めにする(行の長さはそのまま)。全体をクリップボードにコピー
function lyricStamp(ts) {
  if (state !== 'game' || !game?.lyrics) return;
  if (lyricMarks.game !== game) lyricMarks = { game, n: 0 }; // プレイごとに最初の行から
  const L = game.lyrics, k = lyricMarks.n++;
  if (k >= L.length) { toast('最後の行まで記録しました。コピーした内容をチャットに貼ってください'); return; }
  const at = Math.round(game.songTime(ts) * 100) / 100, d = at - L[k][0];
  L[k][0] = at; L[k][1] = Math.round((L[k][1] + d) * 100) / 100;
  const json = JSON.stringify(L);
  navigator.clipboard?.writeText(json).catch(() => {});
  save('lyricSync', { song: playing?.entry?.id, lyrics: json });
  toast(`歌詞 ${k + 1}/${L.length}「${L[k][2]}」${at.toFixed(2)}秒(全体をコピーしました)`, 1500);
  syncBadge();
}
// 時刻合わせモードの表示(画面の上)。プレイ中はスマホでも押せる「歌い始め」ボタンになる
function syncBadge() {
  if (!LYRIC_SYNC) return;
  let b = document.getElementById('lyric-sync');
  if (!b) {
    b = document.createElement('button');
    b.id = 'lyric-sync'; b.type = 'button';
    b.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:9999;padding:8px 16px;border-radius:999px;border:1px solid #ffd25e;background:rgba(20,16,4,.9);color:#ffd25e;font:700 13px system-ui,sans-serif;touch-action:manipulation';
    b.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); lyricStamp(ev.timeStamp); });
    document.body.appendChild(b);
  }
  const inGame = state === 'game' && game?.lyrics;
  const n = lyricMarks.game === game ? lyricMarks.n : 0;
  b.textContent = inGame ? `🎤 歌い始め(Enter)${n}/${game.lyrics.length}` : '🎤 歌詞の時刻合わせモード: 歌詞のある曲を遊び、各行の歌い始めで Enter かこのボタン';
  b.style.pointerEvents = inGame ? 'auto' : 'none';
}
if (LYRIC_SYNC) { syncBadge(); setInterval(syncBadge, 500); }
if (EMBED) document.body.classList.add('embed');
const openedBySongUrl = !!urlSongId && (EMBED || !!load('token', null));
if (urlSongId && !openedBySongUrl) {
  try {
    history.replaceState(null, '', ROOT_PATH + location.search.replace(/([?&])v=[^&]*&?/, '$1').replace(/[?&]$/, '') + location.hash);
    document.title = 'MUSIC LiDAR｜ブラウザで遊べる無料4キー音ゲー(リズムゲーム)';
  } catch { /* file:// など */ }
}
if (openedBySongUrl) {
  const i = entries.findIndex((e) => e.id === urlSongId);
  if (i >= 0) sel = i;
}
const songUrl = (e) => (e?.urlId ? `${location.origin}${ROOT_PATH}music/${e.urlId}/` : `${location.origin}${ROOT_PATH}`);
// 選んだ曲に合わせてアドレスバーを曲ページのURLにする(共有しやすいように)
function syncUrl(e) {
  try {
    const path = e?.urlId ? `${ROOT_PATH}music/${e.urlId}/` : ROOT_PATH;
    if (location.pathname !== path) history.replaceState(null, '', path);
    document.title = e?.urlId ? `${e.title}｜MUSIC LiDAR` : 'MUSIC LiDAR｜ブラウザで遊べる無料4キー音ゲー(リズムゲーム)';
  } catch { /* file:// など */ }
}
let diff = [...DIFFS, 'extra'].includes(load('diff', 'normal')) ? load('diff', 'normal') : 'normal';

// 起動後に、選んでいる曲の音源だけ裏で用意しておく。
// (全曲を合成すると初回はCPUを数分使い続け、メモリも数GBになるのでしない。ほかの曲は選んだときに用意する)
let warmed = false;
function warmup() {
  if (warmed) return;
  warmed = true;
  const e = entries[sel];
  if (e && !e.local) e.load().catch((err) => console.error(err));
}

// ---------------------------------------------------------------------------
// 背景アニメーション(ゲーム中以外)
// ---------------------------------------------------------------------------
function bgLoop(now) {
  requestAnimationFrame(bgLoop);
  if (state === 'game') return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#02030a'); grd.addColorStop(1, '#070a1c');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  const e = entries[sel] || entries[0];
  const amt = [0.15, 0.45, 1][settings.fx ?? 1];
  cloud.draw(g, W, H, now / 1000, e?.bpm || 120, (state === 'select' ? 0.6 : 0.4) * amt, e?.color || '#5ef2ff', amt);
}
requestAnimationFrame(bgLoop);
// タイトル画面の間から裏で音源を用意しておく(2回目以降はブラウザに保存した音を使うので一瞬)
setTimeout(() => warmup(), 300);
setTimeout(prepareIdle, 1200);

// ---------------------------------------------------------------------------
// 画面切り替え
// ---------------------------------------------------------------------------
// 画面ごとのURL(譜面メーカー・ガチャ・みんなの譜面)
// 画面・パネルごとのURL。選曲画面は曲ページのURL、タイトルはトップのURL
const SCREEN_URL = {
  editor: ['maker/', '譜面メーカー'],
  gacha: ['gacha/', 'ガチャ'],
  charts: ['charts/', 'みんなの譜面'],
  quest: ['quest/', 'クエスト'],
  team: ['team/', '編成'],
  result: ['result/', 'リザルト'],
  settings: ['settings/', '設定'],
  account: ['account/', 'アカウント'],
  changelog: ['changelog/', '更新履歴'],
  live: ['live/', 'みんなでライブ'],
  home: ['home/', 'ホーム'],
  player: ['listen/', 'きくだけ'],
  admin: ['admin/', '管理'],
  dan: ['dan/', '段位道場'],
};
function setScreenUrl(key) {
  const su = SCREEN_URL[key];
  try {
    if (su) {
      if (location.pathname !== ROOT_PATH + su[0]) history.replaceState(null, '', ROOT_PATH + su[0]);
      document.title = `${su[1]}｜MUSIC LiDAR`;
    } else if (key === 'select' || key === 'game') syncUrl(entries[sel]);
  } catch { /* file:// など */ }
}
function show(name) {
  // 画面が変わるときはスキャン線のワイプ演出(プレイ開始・終了時は読み込み画面やリザルト演出があるので除く)
  if (name !== state && name !== 'game' && state !== 'game' && !(state === 'title' && name === 'title')) {
    const w = $('wipe');
    w.classList.remove('go'); void w.offsetWidth; w.classList.add('go');
    clearTimeout(show.wt);
    show.wt = setTimeout(() => w.classList.remove('go'), 600); // アニメが止まっていても必ず消す
  }
  if (state === 'player' && name !== 'player') stopPlayer();
  if (state === 'admin' && name !== 'admin') stopAdmin();
  const changed = state !== name;
  state = name;
  if (changed) pingSoon();
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === name);
  document.body.classList.toggle('playing', name === 'game');
  if (name !== 'game') setScreenUrl(name);
}
// 設定・アカウントのパネルを開いている間はそのURL、閉じたら元の画面のURLに戻す
for (const [id, key] of [['settings', 'settings'], ['account-modal', 'account'], ['changelog', 'changelog']]) {
  new MutationObserver(() => {
    if (state === 'title') return;
    if ($(id).classList.contains('on')) setScreenUrl(key);
    else if (!document.querySelector('#settings.on, #account-modal.on, #changelog.on')) setScreenUrl(state);
  }).observe($(id), { attributes: true, attributeFilter: ['class'] });
}

function toast(msg, ms = 2600) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast.tid);
  toast.tid = setTimeout(() => t.classList.remove('on'), ms);
}

function overlay(id, on) { $(id).classList.toggle('on', on); }
const modalOpen = () => document.querySelector('.overlay.modal.on');

// ---------------------------------------------------------------------------
// タイトル
// ---------------------------------------------------------------------------
let enteredOnce = false;
let START_DAILY = new URLSearchParams(location.search).has('daily');
let START_ROOM = new URLSearchParams(location.search).get('room') || '';
// ---------------------------------------------------------------------------
// チュートリアル
// ---------------------------------------------------------------------------
function startTutorial() {
  closeModals();
  overlay('tut-offer', false);
  if (!tutorialEntry) tutorialEntry = builtinEntry(TUTORIAL_DEF);
  startGame(tutorialEntry, 'easy', {
    kind: 'tutorial', label: 'TUTORIAL', title: 'チュートリアル', notes: TUT_NOTES, captions: tutCaptions(IS_TOUCH),
    onExit: (r) => {
      game = null;
      if (!r) { goHome(); return; } // 途中でやめた
      save('tutorialDone', true);
      goHome();
      $('tut-result').innerHTML = `<b>${r.rank}</b> ・ 精度 ${r.accuracy.toFixed(1)}% ・ MAX COMBO ${r.maxCombo}` +
        (r.fc ? ' ・ <span class="tut-fc">FULL COMBO!</span>' : '');
      overlay('tut-done', true);
    },
  });
}
function offerTutorial() { overlay('tut-offer', true); }

function enterFromTitle(opts = {}) {
  getCtx();
  setVolumes(settings.bgm, settings.se);
  // 曲ページから来たときは最初だけ、その曲の選曲画面へ。普段はホーム(モード選択)へ
  if (EMBED || (openedBySongUrl && !enteredOnce && !opts.home)) goSelect(); else goHome();
  enteredOnce = true;
  if (EMBED) { warmup(); return; } // 埋め込みではチュートリアルやログインの案内を出さない
  // コースの共有リンク(?course=…)から来たら、そのコースを開く
  if (courseFromUrl()) { homeLive(true); return; }
  // みんなでライブの招待リンク(?room=CODE)から来たら、そのルームへ
  if (START_ROOM && !opts.quiet) { const c = START_ROOM; START_ROOM = ''; warmup(); accReady.then(() => joinFromLink(c)); return; }
  // デイリーの共有リンク(?daily=1)から来たら、今日のデイリーをすぐ始める
  if (START_DAILY && !opts.quiet) { START_DAILY = false; warmup(); playDaily(); return; }
  warmup();
  // はじめての人にはチュートリアルをすすめる(アカウントの案内はそのあと)
  if (!opts.quiet && !load('tutorialDone', false) && !load('tutorialSkipped', false)) offerTutorial();
  else if (!opts.quiet && !acc.isLoggedIn() && !load('nameSkipped', false)) openAccount();
}
$('btn-start').addEventListener('click', () => enterFromTitle());

// ---------------------------------------------------------------------------
// バージョン表記・更新履歴
// ---------------------------------------------------------------------------
$('ver-label').textContent = 'v' + VERSION;
$('title-ver').textContent = 'v' + VERSION;
$('ver-new').hidden = load('seenVersion', null) === VERSION;
function openChangelog() {
  const seen = load('seenVersion', null);
  const seenIdx = CHANGELOG.findIndex((c) => c.version === seen);
  $('cl-current').textContent = 'CURRENT v' + VERSION;
  $('cl-list').innerHTML = CHANGELOG.map((c, i) => `<li class="cl-item ${i === 0 ? 'latest' : ''} ${seen && (seenIdx < 0 || i < seenIdx) ? 'unseen' : ''}">
    <div class="cl-head"><span class="cl-ver">v${c.version}</span><span class="cl-date">${c.date}</span>${i === 0 ? '<span class="cl-tag">最新</span>' : ''}</div>
    <ul>${c.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></li>`).join('');
  overlay('changelog', true);
  save('seenVersion', VERSION);
  $('ver-new').hidden = true;
}
$('btn-version').addEventListener('click', openChangelog);
$('btn-cl-close').addEventListener('click', () => overlay('changelog', false));
$('title-changelog').addEventListener('click', (ev) => { ev.preventDefault(); enterFromTitle({ quiet: true }); openChangelog(); });

// タイトルのブートログ(飾り)
(function bootLog() {
  const v = document.querySelector('meta[name="app-version"]')?.content || 'dev';
  $('tt-ver').textContent = `VER ${VERSION} / BUILD ${v}`;
  const lines = ['INIT AUDIO ENGINE', `LOAD ${entries.length} TRACKS`, 'CALIBRATE LIDAR ARRAY', 'SYNC CLOCK', 'READY'];
  const el = $('tt-boot');
  let i = 0;
  const tick = () => {
    if (i >= lines.length || state !== 'title') return;
    el.innerHTML += `${lines[i]} ${i < lines.length - 1 ? '<b>.... OK</b>' : '<b class="ok">■</b>'}<br>`;
    i++;
    setTimeout(tick, 260 + Math.random() * 220);
  };
  setTimeout(tick, 500);
})();
// フォント読み込み後にジャケットを描き直す(最初はフォント未読込のことがある)
document.fonts?.ready.then(() => { clearJackets(); if (state === 'select') { renderList(); renderDetail(); } });

// ---------------------------------------------------------------------------
// 選曲画面
// ---------------------------------------------------------------------------
// ログイン中はサーバーの記録と端末の記録の良いほう
function bestOf(id, d) {
  const l = getBest(id, d);
  const s = acc.getState()?.best?.[id + '/' + d];
  if (!s) return l;
  if (!l) return { ...s, plays: 0 };
  const top = s.score > l.score ? { ...l, score: s.score, rank: s.rank, acc: s.acc } : { ...l };
  return { ...top, combo: Math.max(l.combo, s.combo), fc: l.fc || s.fc, ap: l.ap || s.ap };
}

// --- 検索・並び替え・絞り込み ---
const songView = { q: '', sort: load('songSort', 'default'), lv: load('songLv', 'all'), status: load('songStatus', 'all') };
const LV_FILTERS = [['all', 'すべて'], ['1-4', 'Lv1〜4'], ['5-9', 'Lv5〜9'], ['10-', 'Lv10以上']];
const STATUS_FILTERS = [['all', 'すべて'], ['fav', '★ お気に入り'], ['new', '未プレイ'], ['nofc', '未フルコンボ'], ['fc', 'フルコンボ済'], ['local', '読み込んだ曲']];

// お気に入り(☆)。この端末に曲IDの一覧で保存する
const favs = new Set(load('favs', []));
const isFav = (e) => favs.has(e.id);
function toggleFav(e) {
  if (favs.has(e.id)) favs.delete(e.id); else favs.add(e.id);
  save('favs', [...favs]);
  toast(favs.has(e.id) ? `★ ${e.title} をお気に入りにしました` : `${e.title} をお気に入りから外しました`);
  if (songView.status === 'fav') renderList();
  else for (const c of $('song-list').querySelectorAll('.song-card[data-i]')) if (entries[+c.dataset.i] === e) c.querySelector('.sc-fav').replaceWith(favMark(e));
  renderFav();
}
function favMark(e) {
  const s = document.createElement('span');
  s.className = 'sc-fav' + (isFav(e) ? ' on' : '');
  s.textContent = isFav(e) ? '★' : '☆';
  s.title = isFav(e) ? 'お気に入りから外す' : 'お気に入りにする';
  s.addEventListener('click', (ev) => { ev.stopPropagation(); toggleFav(e); });
  return s;
}
function renderFav() {
  const e = entries[sel], on = isFav(e);
  $('d-fav').classList.toggle('on', on);
  $('d-fav').setAttribute('aria-pressed', on);
  $('d-fav').textContent = on ? '★ お気に入り' : '☆ お気に入りにする';
}

// 曲一覧で使う難易度: EXTRA を選んでいるとき、EXTRA のない曲は HARD で見る
const dOf = (e) => (diff === 'extra' && !e.levels.extra ? 'hard' : diff);
function visibleSongs() {
  const q = songView.q.trim().toLowerCase();
  let idx = entries.map((e, i) => i).filter((i) => {
    const e = entries[i];
    if (q && !`${e.title} ${e.genre} ${e.artist} ${Math.round(e.bpm)}`.toLowerCase().includes(q)) return false;
    const lv = e.levels[dOf(e)];
    if (songView.lv === '1-4' && lv > 4) return false;
    if (songView.lv === '5-9' && (lv < 5 || lv > 9)) return false;
    if (songView.lv === '10-' && lv < 10) return false;
    const b = bestOf(e.id, dOf(e));
    if (songView.status === 'new' && b) return false;
    if (songView.status === 'nofc' && b?.fc) return false;
    if (songView.status === 'fc' && !b?.fc) return false;
    if (songView.status === 'local' && !e.local) return false;
    if (songView.status === 'fav' && !isFav(e)) return false;
    return true;
  });
  const by = {
    level: (a, b) => entries[a].levels[dOf(entries[a])] - entries[b].levels[dOf(entries[b])],
    'level-desc': (a, b) => entries[b].levels[dOf(entries[b])] - entries[a].levels[dOf(entries[a])],
    bpm: (a, b) => entries[a].bpm - entries[b].bpm,
    'bpm-desc': (a, b) => entries[b].bpm - entries[a].bpm,
    name: (a, b) => entries[a].title.localeCompare(entries[b].title, 'ja'),
    score: (a, b) => (bestOf(entries[b].id, dOf(entries[b]))?.score ?? -1) - (bestOf(entries[a].id, dOf(entries[a]))?.score ?? -1),
    'score-asc': (a, b) => (bestOf(entries[a].id, dOf(entries[a]))?.score ?? -1) - (bestOf(entries[b].id, dOf(entries[b]))?.score ?? -1),
  }[songView.sort];
  if (by) idx = idx.sort((a, b) => by(a, b) || a - b);
  return idx;
}

function renderFilters() {
  const chip = (group, [v, label]) => `<button class="f-chip ${songView[group] === v ? 'sel' : ''}" data-g="${group}" data-v="${v}">${label}</button>`;
  $('song-filters').innerHTML =
    `<span class="f-label"${diff === 'extra' ? ' title="EXTRA のない曲は HARD のレベルで絞り込み・並べ替えます"' : ''}>${diff.toUpperCase()}</span>${LV_FILTERS.map((f) => chip('lv', f)).join('')}<span class="f-sep"></span>${STATUS_FILTERS.filter(([v]) => v !== 'local' || entries.some((e) => e.local)).map((f) => chip('status', f)).join('')}`;
}

function renderList() {
  renderFilters();
  const list = $('song-list');
  list.innerHTML = '';
  const view = visibleSongs();
  if (!view.length) {
    const p = document.createElement('p');
    p.className = 'list-empty';
    p.textContent = songView.status === 'fav' && !favs.size ? '曲の ☆ を押すとお気に入りに入ります' : '条件に合う曲がありません';
    list.appendChild(p);
  }
  list.classList.add('stagger'); // 上から順に流れ込む(motion)
  view.forEach((i, k) => {
    const e = entries[i];
    const b = document.createElement('button');
    b.className = 'song-card' + (i === sel ? ' sel' : '');
    if (k < 16) { b.classList.add('anim'); b.style.setProperty('--k', k); } // 流れ込むのは画面に見える最初の16枚だけ(全部動かすと重い)
    b.dataset.i = i;
    b.style.setProperty('--c', e.color);
    const lv = diffsOf(e).map((d) => { // EXTRA のある曲は4つ目に紫で出す
      const best = bestOf(e.id, d);
      const mark = best?.ap ? 'AP' : best?.fc ? 'FC' : '';
      return `<span class="lv ${d}">${e.levels[d]}${mark ? `<span class="mark">${mark}</span>` : ''}</span>`;
    }).join('');
    b.innerHTML = `${jacketImg(e, 128, 'sc-jacket')}<div class="sc-text"><div class="sc-title">${e.event ? '<span class="ev-tag">期間限定</span>' : ''}${esc(e.title)}</div><div class="sc-sub">${esc(e.genre)} ・ BPM ${Math.round(e.bpm)}${e.local ? ' ・ LOCAL' : ''}${mvTag(e.id)}</div></div><div class="sc-lv">${lv}</div>`;
    b.querySelector('.sc-text').prepend(favMark(e));
    b.addEventListener('click', () => { if (sel === i) startGame(); else selectSong(i); });
    list.appendChild(b);
  });
  const up = document.createElement('button');
  up.className = 'song-card upload';
  up.innerHTML = '<div class="sc-title">＋ 音声ファイルを読み込む</div><div class="sc-sub">mp3 / wav / ogg など。ドラッグ&ドロップでもOK。譜面は自動生成(記録はこの端末のみ)</div>';
  up.addEventListener('click', () => $('file-input').click());
  list.appendChild(up);
}

function selectSong(i, force = false) {
  if (entries[i] && !entries[i].local) lyricsFor(entries[i].id); // 歌詞のある曲は先に読んでおく(ない曲は問い合わせない)
  if (i === sel && !force) return;
  sel = i;
  save('sel', entries[i].local ? 0 : i);
  if (!entries[i].local) save('selId', entries[i].id);
  syncUrl(entries[i]);
  for (const c of $('song-list').querySelectorAll('.song-card[data-i]')) c.classList.toggle('sel', +c.dataset.i === i);
  $('song-list').querySelector(`.song-card[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  renderDetail();
  const e = entries[i];
  stopPreview();
  const token = (selectSong.token = {});
  e.load().then((buf) => {
    if (selectSong.token !== token || state !== 'select') return;
    playPreview(buf, e.previewAt);
    renderDetail();
  }).catch((err) => {
    console.error(err);
    if (selectSong.token !== token || state !== 'select') return;
    renderDetail();
    toast('音源の読み込みに失敗しました。プレイを押すともう一度試せます');
  });
}

function setDiff(d) {
  diff = d;
  save('diff', d);
  renderDetail();
  renderList(); // レベル・自己ベストの並び替えや絞り込みは難易度で変わる
}

$('song-search').addEventListener('input', () => { songView.q = $('song-search').value; renderList(); });
$('song-sort').value = songView.sort;
$('song-sort').addEventListener('change', () => { songView.sort = $('song-sort').value; save('songSort', songView.sort); renderList(); });
$('d-fav').addEventListener('click', () => toggleFav(entries[sel]));
$('song-filters').addEventListener('click', (ev) => {
  const b = ev.target.closest('.f-chip');
  if (!b) return;
  songView[b.dataset.g] = b.dataset.v;
  save(b.dataset.g === 'lv' ? 'songLv' : 'songStatus', b.dataset.v);
  renderList();
});

let detailId = null;
function renderDetail() {
  const e = entries[sel];
  // 曲が変わったときだけ、ジャケットと曲名を入れ替える動きを出す(難易度を変えただけでは動かさない)
  if (detailId !== e.id) { detailId = e.id; requestAnimationFrame(() => { for (const id of ['d-jacket', 'd-title', 'd-genre', 'd-meta', 'diffs']) replay($(id), 'swap'); }); }
  document.documentElement.style.setProperty('--accent', e.color);
  $('d-genre').innerHTML = esc(e.genre) + mvTag(e.id);
  $('d-jacket').src = jacketURL(e, 256);
  $('d-index').textContent = `${String(sel + 1).padStart(2, '0')} / ${String(entries.length).padStart(2, '0')}`;
  $('d-title').textContent = e.title;
  renderFav();
  $('d-meta').textContent = `${e.artist} ・ BPM ${Math.round(e.bpm)} ・ ${fmtTime(e.duration)}${e.gimmick ? ` ・ ギミック: ${e.gimmick}` : ''}`;
  $('d-credit').innerHTML = e.credit ? `${esc(e.credit)}${e.creditUrl ? ` <a href="${esc(e.creditUrl)}" target="_blank" rel="noopener">${esc(e.creditUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</a>` : ''}` : '';
  if (diff === 'extra' && !e.levels.extra) diff = 'hard'; // EXTRA のない曲では HARD を見せる
  $('diffs').innerHTML = diffsOf(e).map((d) => `
    <button class="diff-btn ${d}${d === diff ? ' sel' : ''}" data-d="${d}">
      <div class="dn">${d.toUpperCase()}</div><div class="dl">${e.levels[d]}</div><div class="dc">${e.stats[d].notes} notes</div>
    </button>`).join('');
  for (const b of $('diffs').children) b.addEventListener('click', () => setDiff(b.dataset.d));
  const best = bestOf(e.id, diff);
  const bx = $('best');
  if (best) {
    bx.className = 'best';
    bx.innerHTML = `<div class="b-rank" style="color:${DIFF_COLOR[diff]}">${best.rank}</div>
      <div class="b-score">${fmtScore(best.score)}</div>
      <div class="b-badges">${best.ap ? '<span class="badge ap">ALL PERFECT</span>' : best.fc ? '<span class="badge fc">FULL COMBO</span>' : ''}</div>
      <div class="b-sub">自己ベスト ・ ${Number(best.acc).toFixed(2)}% ・ MAX ${best.combo} COMBO${best.plays ? ` ・ ${best.plays} プレイ` : ''}</div>`;
  } else {
    bx.className = 'best none';
    bx.textContent = 'まだプレイしていません';
  }
  const ready = !!e.buffer;
  $('btn-play').classList.toggle('wait', !ready);
  $('play-sub').textContent = ready ? 'ENTER' : e.loadFailed ? '読み込み失敗・押して再試行' : '音源を準備中…(初回のみ)';
  loadRanking();
  renderSongStats(e, diff);
}

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// --- ランキング ---
const rankCache = new Map();
const myRankId = () => acc.getState()?.id || clientId();
function rankRows(rows) {
  if (!rows.length) return '<li class="empty">まだ記録がありません。一番乗りしよう</li>';
  return rows.map((r) => `<li class="${r.is_me ? 'me' : ''}"><span class="rk">${r.rank}</span><span class="nm" data-player="${esc(r.name)}" title="プレイヤーページを見る">${esc(r.name)}</span>
    <span>${r.ap ? '<span class="badge ap">AP</span>' : r.fc ? '<span class="badge fc">FC</span>' : ''}</span><span class="sc">${fmtScore(r.score)}</span></li>`).join('');
}
// ランキングの表示: 'all'(みんな)/ 'friend'(フレンドと自分)
let rankMode = load('rankMode', 'all');
function syncRankTabs() {
  for (const b of document.querySelectorAll('#rank-tabs [data-rmode]')) b.classList.toggle('sel', b.dataset.rmode === rankMode);
}
for (const b of document.querySelectorAll('#rank-tabs [data-rmode]')) b.addEventListener('click', () => {
  if (b.dataset.rmode === 'friend' && !acc.getToken()) { toast('フレンドのランキングはログインすると見られます'); openAccount(); return; }
  rankMode = b.dataset.rmode; save('rankMode', rankMode); syncRankTabs(); loadRanking();
});
syncRankTabs();
function loadRanking(force = false) {
  const e = entries[sel];
  const list = $('rank-list');
  if (e.local) { list.innerHTML = '<li class="empty">読み込んだ曲はランキング対象外です</li>'; return; }
  const friend = rankMode === 'friend' && !!acc.getToken();
  const key = e.id + '/' + diff + (friend ? '/f' : '');
  const c = rankCache.get(key);
  if (c && !force && Date.now() - c.at < 30000) { list.innerHTML = rankRows(c.rows); return; }
  list.innerHTML = '<li class="empty">読み込み中…</li>';
  clearTimeout(loadRanking.tid);
  loadRanking.tid = setTimeout(async () => {
    try {
      const rows = friend ? await fetchFriendRanking(e.id, diff) : await fetchRanking(e.id, diff, myRankId());
      rankCache.set(key, { rows, at: Date.now() });
      if (entries[sel] === e && (e.id + '/' + diff + (friend ? '/f' : '')) === key) {
        list.innerHTML = friend && rows.length <= 1 && !rows.some((r) => !r.is_me)
          ? rankRows(rows) + '<li class="empty">フレンドの記録はまだありません。ホームの「フレンド」から友だちを追加しよう</li>' : rankRows(rows);
      }
    } catch (err) {
      console.error(err);
      list.innerHTML = '<li class="empty">ランキングを取得できませんでした</li>';
    }
  }, 200);
}
$('btn-rank-reload').addEventListener('click', () => loadRanking(true));
$('btn-play').addEventListener('click', () => startGame());

// ---------------------------------------------------------------------------
// 練習モード(区間をくり返す・ゆっくりにする)。記録・ランキングには残らない
// ---------------------------------------------------------------------------
const fmtPr = (e, t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}(小節 ${Math.max(1, Math.floor((t - (e.offset || 0)) / (240 / e.bpm)) + 1)})`;
function openPractice() {
  const e = entries[sel];
  if (!e) return;
  const dur = e.buffer?.duration || e.duration || 120;
  const saved = load('practice:' + e.id, null);
  const notes = e.charts[diff] || [];
  const first = notes.length ? Math.max(0, notes[0].t - 1) : 0;
  $('pr-song').textContent = `${e.title} ・ ${diff.toUpperCase()} Lv${e.levels[diff]}`;
  for (const id of ['pr-from', 'pr-to']) $(id).max = dur.toFixed(1);
  $('pr-from').value = saved?.from ?? first.toFixed(1);
  $('pr-to').value = saved?.to ?? Math.min(dur, first + 20).toFixed(1);
  $('pr-rate').value = String(saved?.rate ?? 1);
  $('pr-loop').checked = saved?.loop ?? true;
  syncPractice();
  overlay('practice', true);
}
function syncPractice(which) {
  const e = entries[sel];
  let a = +$('pr-from').value, b = +$('pr-to').value;
  if (b - a < 2) { if (which === 'pr-to') a = Math.max(0, b - 2); else b = Math.min(+$('pr-to').max, a + 2); $('pr-from').value = a; $('pr-to').value = b; }
  $('o-pr-from').textContent = fmtPr(e, a);
  $('o-pr-to').textContent = fmtPr(e, b);
}
for (const id of ['pr-from', 'pr-to']) $(id).addEventListener('input', () => syncPractice(id));
$('btn-practice').addEventListener('click', openPractice);
$('pr-close').addEventListener('click', () => overlay('practice', false));
$('pr-start').addEventListener('click', () => {
  const e = entries[sel], d = diff;
  const from = +$('pr-from').value, to = +$('pr-to').value, rate = +$('pr-rate').value, loop = $('pr-loop').checked;
  save('practice:' + e.id, { from, to, rate, loop });
  overlay('practice', false);
  const notes = (e.charts[d] || []).filter((n) => n.t >= from - 0.001 && n.t <= to);
  if (!notes.length) { toast('この区間にはノーツがありません'); return; }
  const custom = {
    kind: 'practice', label: `PRACTICE ×${rate}`, title: `${e.title}(練習)`, level: e.levels[d], notes, scroll: e.scroll, startFrom: from,
    practice: { from, to, rate },
    onExit: (r) => {
      if (r) toast(`練習: PERFECT ${r.counts.PERFECT} ・ GREAT ${r.counts.GREAT} ・ GOOD ${r.counts.GOOD} ・ MISS ${r.counts.MISS}(${r.accuracy.toFixed(1)}%)`, 3000);
      if (r && loop) { state = 'retry'; setTimeout(() => startGame(e, d, custom), 700); return; } // くり返す(やめるときは Esc →「選曲へ」)
      show('select'); renderList(); selectSong(sel, true);
    },
  };
  startGame(e, d, custom);
});
// 区間だけを WAV にして <audio> で鳴らす(同じ区間なら作り直さない)
let prMedia = null;
async function practiceMedia(e, from, to) {
  const buf = e.buffer, sr = buf.sampleRate;
  const segStart = Math.max(0, from - 3), segEnd = Math.min(buf.duration, to + 2);
  const key = `${e.id}|${segStart}|${segEnd}`;
  if (prMedia?.key === key) return { media: prMedia.media, segStart };
  if (prMedia) { prMedia.media.pause(); URL.revokeObjectURL(prMedia.url); try { prMedia.node.disconnect(); } catch { /* noop */ } }
  const i0 = Math.floor(segStart * sr), n = Math.max(1, Math.floor(segEnd * sr) - i0), ch = Math.min(2, buf.numberOfChannels);
  const out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const wr = (o, s) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  wr(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); wr(8, 'WAVE'); wr(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true);
  out.setUint16(22, ch, true); out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true);
  wr(36, 'data'); out.setUint32(40, n * ch * 2, true);
  const data = [...Array(ch)].map((_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, data[c][i0 + i])); out.setInt16(o, v < 0 ? v * 32768 : v * 32767, true); o += 2; }
  const url = URL.createObjectURL(new Blob([out], { type: 'audio/wav' }));
  const media = new Audio(url);
  media.preload = 'auto';
  const node = getCtx().createMediaElementSource(media);
  node.connect(bgmOutFor(buf));
  await new Promise((res, rej) => { media.oncanplaythrough = res; media.onerror = () => rej(new Error('media')); media.load(); });
  prMedia = { key, media, url, node };
  return { media, segStart };
}
// この曲のURLを共有
$('btn-share').addEventListener('click', async () => {
  const e = entries[sel];
  if (!e.urlId) { toast('読み込んだ曲は共有できません'); return; }
  const url = songUrl(e), text = `MUSIC LiDAR で「${e.title}」をプレイしよう!`;
  try {
    if (navigator.share && IS_TOUCH) { await navigator.share({ title: `${e.title}｜MUSIC LiDAR`, text, url }); return; }
    await navigator.clipboard.writeText(url);
    toast('この曲のURLをコピーしました: ' + url, 3500);
  } catch (err) {
    if (err?.name !== 'AbortError') prompt('この曲のURL', url);
  }
});
// よそのサイトに貼るための埋め込みコード(軽いカード / ゲームまるごと)
$('btn-embed').addEventListener('click', () => {
  const e = entries[sel];
  if (!e.urlId) { toast('読み込んだ曲は埋め込めません'); return; }
  const t = e.title.replace(/"/g, '');
  const card = `<iframe src="https://music-lidar.com/card.html?s=${e.urlId}" width="480" height="140" style="border:0;max-width:100%" loading="lazy" title="MUSIC LiDAR「${t}」"></iframe>`;
  const full = `<iframe src="${songUrl(e)}?embed=1" width="800" height="450" style="border:0;max-width:100%;aspect-ratio:16/9;height:auto" allow="autoplay; fullscreen" loading="lazy" title="MUSIC LiDAR「${t}」"></iframe>`;
  $('em-card').value = card; $('em-full').value = full;
  $('em-preview').src = `${ROOT_PATH}card.html?s=${e.urlId}`;
  overlay('embed-modal', true);
});
$('embed-modal').addEventListener('click', async (ev) => {
  if (ev.target === $('embed-modal') || ev.target.closest('[data-em-close]')) { overlay('embed-modal', false); return; }
  const b = ev.target.closest('[data-em]');
  if (!b) return;
  const v = $(b.dataset.em).value;
  try { await navigator.clipboard.writeText(v); toast('埋め込みコードをコピーしました。ブログなどの HTML に貼ってください', 4000); } catch { $(b.dataset.em).select(); }
});
// 埋め込みの「フルで遊ぶ」は、いま選んでいる曲のページを新しいタブで開く
if (EMBED) $('embed-full').addEventListener('click', (ev) => { ev.currentTarget.href = songUrl(entries[sel]); });

// 曲ページで開いたときはタイトル画面に曲名を出す
if (openedBySongUrl && entries[sel]?.id === urlSongId) {
  $('title-song').textContent = `♪ ${entries[sel].title}`;
  $('title-song').hidden = false;
}

// --- 曲ファイル読み込み ---
async function loadFile(file) {
  if (!file) return;
  if (!/^audio\//.test(file.type) && !/\.(mp3|wav|ogg|m4a|flac|aac|opus|webm)$/i.test(file.name)) { toast('音声ファイルを選んでください'); return; }
  stopPreview();
  showLoading({ title: file.name.replace(/\.[^.]+$/, ''), sub: '音声ファイルを解析して譜面を作っています', status: 'ANALYZING...' });
  try {
    const ab = await file.arrayBuffer();
    const hash = await hashFile(ab);
    const id = 'file-' + hash;
    const existing = entries.findIndex((e) => e.id === id);
    if (existing >= 0) { hideLoading(); selectSong(existing, true); return; }
    const { buffer, cands, bpm } = await analyzeFile(ab);
    const charts = {}, stats = {}, levels = {};
    for (const d of DIFFS) {
      charts[d] = generateChart(cands, d, buffer.duration, hashStr(hash));
      stats[d] = chartStats(charts[d]);
      const nps = stats[d].notes / Math.max(10, buffer.duration);
      levels[d] = Math.max(1, Math.min(15, Math.round(nps * 2.1 + (d === 'hard' ? 1 : 0))));
    }
    const title = file.name.replace(/\.[^.]+$/, '');
    entries.push({
      id, title, artist: 'LOCAL FILE', genre: 'IMPORT', bpm, color: '#ffd25e', levels, charts, stats, local: true, onsets: onsetList(cands.map((c) => c.t)),
      duration: buffer.duration, previewAt: buffer.duration * 0.35, buffer, load() { return Promise.resolve(buffer); },
    });
    renderList();
    selectSong(entries.length - 1, true);
    toast(`「${title}」の譜面を生成しました(推定 BPM ${Math.round(bpm)})`);
  } catch (err) {
    console.error(err);
    toast('このファイルは読み込めませんでした');
  } finally {
    hideLoading();
  }
}
$('file-input').addEventListener('change', (ev) => { loadFile(ev.target.files[0]); ev.target.value = ''; });
let dragDepth = 0;
window.addEventListener('dragenter', (ev) => { if (state !== 'select') return; ev.preventDefault(); dragDepth++; $('drop-veil').classList.add('on'); });
window.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('drop-veil').classList.remove('on'); } });
window.addEventListener('dragover', (ev) => ev.preventDefault());
window.addEventListener('drop', (ev) => {
  ev.preventDefault();
  dragDepth = 0;
  $('drop-veil').classList.remove('on');
  if (state === 'select') loadFile(ev.dataTransfer.files[0]);
});

// ---------------------------------------------------------------------------
// プレイ
// ---------------------------------------------------------------------------
let playing = null; // { entry, diff }
let starting = false;
// custom: 譜面メーカーの譜面 { kind: 'custom'|'test', notes, scroll, title, level, chartId, startFrom, onExit(result?) }
// live: みんなでライブのつなぎ口 { attach(game), rivals(), finish(r), quit() }
// extra: { daily }(デイリーチャレンジ)
async function startGame(entry = entries[sel], d = diff, custom = null, live = null, extra = null) {
  if (state === 'game' || starting) return;
  // コースの曲選び中は、遊ぶ代わりにその曲・難易度をコースに入れる
  if (pick && state === 'select' && !custom && !live && !extra) {
    if (entry.local) { toast('読み込んだ曲はコースに入れられません'); return; }
    const p = pick;
    endPick();
    p.done(entry, d);
    return;
  }
  starting = true;
  try { await startGameInner(entry, d, custom, live, extra); } finally { starting = false; }
}
async function startGameInner(entry, d, custom, live, extra) {
  document.activeElement?.blur?.();
  getCtx();
  stopPreview();
  // 読み込み中画面(準備済みでも曲名とTipsを少し見せる)
  const isRetry = state === 'retry';
  // プレイオプション(デイリーチャレンジは決まった条件。チュートリアルはなし)
  const opts = extra?.daily ? extra.daily.opts : custom?.kind === 'tutorial' ? {} : custom?.kind === 'replay' ? { lane: custom.opts?.lane || 'normal', vis: 'none' } : { lane: settings.lane, vis: settings.vis };
  const label = (custom ? (custom.label || (custom.kind === 'test' ? 'TEST PLAY' : `CUSTOM Lv${custom.level}`)) : `${extra?.daily ? 'DAILY ' : extra?.season ? 'EVENT ' : ''}${d.toUpperCase()} Lv${entry.levels[d]}`) + optTag(opts);
  showLoading({
    entry, title: custom ? custom.title : entry.title, sub: label,
    status: entry.buffer ? 'READY' : '音源を準備中…(初回のみ少しかかります)',
    getProgress: () => (entry.buffer ? 1 : entry.progress || 0),
  });
  const mvReady = entry.local ? null : prepareMV(entry.id); // 特製MVは音源と並行して読み込む
  if (!entry.buffer) {
    try { await entry.load(); } catch (err) { console.error(err); toast('音源の読み込みに失敗しました。通信を確認して、もう一度プレイを押してください'); hideLoading(); if (state === 'select') renderDetail(); return; }
  }
  await mvReady;
  // ゴースト(自己ベスト・ライバル・1位)。ライブ・譜面メーカーなどでは使わない
  const ghost = !custom && !live ? await ghostFor(entry, d, loadGhost(entry.id, d)) : null;
  // 歌詞: 譜面メーカーのテストプレイは編集中の歌詞、ほかはサーバーの歌詞(曲ファイルの lyrics があればそれ)
  const lyrics = settings.lyrics === false || custom?.kind === 'tutorial' ? null
    : custom?.lyrics || entry.lyrics || (!entry.local ? await lyricsQuick(entry.id) : null);
  // 練習モード: 遅くするときは、区間だけを <audio> にして音の高さを保ったまま再生する
  let practice = null;
  if (custom?.practice) {
    practice = { ...custom.practice };
    if (practice.rate < 1) {
      try { Object.assign(practice, await practiceMedia(entry, practice.from, practice.to)); } catch (err) { console.error(err); practice.rate = 1; toast('ゆっくり再生を準備できなかったので、そのままの速さで始めます'); }
    }
  }
  await hideLoading(isRetry ? 500 : 1400);
  playing = { entry, diff: d, custom, live, extra, label };
  document.body.classList.toggle('live', !!live || custom?.kind === 'dan');
  show('game');
  setVolumes(settings.bgm, settings.se);
  game = new Game(canvas, {
    buffer: entry.buffer, notes: custom ? custom.notes : entry.charts[d], settings, bpm: entry.bpm,
    title: custom ? custom.title : entry.title, diff: custom ? custom.kind : d, color: entry.color, cloud,
    onEnd: (r) => onGameEnd(r),
    team: !custom && acc.isLoggedIn() ? acc.teamFx() : null,
    scroll: custom ? custom.scroll : entry.scroll,
    offset: entry.offset || 0,
    jacket: jacketURL(entry, 128),
    label,
    captions: custom?.captions || extra?.captions || null,
    lyrics: lyrics ? lyrics.map((x) => x.slice()) : null,
    life: custom?.life || null,
    rivals: live ? () => live.rivals() : null,
    mv: entry.local || custom?.kind === 'tutorial' ? null : createMV(entry.id, entry.bpm, entry.offset || 0, {}, entry.mvAuto?.()),
    opts,
    ghost,
    practice,
    replay: custom?.replay || null,
  });
  live?.attach(game);
  $('btn-p-quit').textContent = live ? 'ライブを抜ける' : '選曲へ';
  $('btn-resume').innerHTML = live ? '戻る <small>ESC</small>' : '再開 <small>ESC</small>';
  game.start(custom?.startFrom || 0, live ? live.syncAt : null);
  if (!custom && !live) startRecording(game, canvas, { entry, label, jacket: jacketURL(entry, 256) });
}

function quitGame() {
  overlay('pause', false);
  stopRecording(); // 途中でやめたら録画は捨てる
  if (playing?.live) {
    const live = playing.live, inGame = !!game;
    game?.destroy();
    game = null;
    document.body.classList.remove('live');
    if (inGame) live.quit(); else backToRoom();
    return;
  }
  game?.destroy();
  game = null;
  if (playing?.custom) { stopPreview(); document.body.classList.remove('live'); playing.custom.onExit(null); return; }
  show('select');
  renderList();
  selectSong(sel, true);
}

function retry() {
  if (playing?.live || playing?.custom?.kind === 'dan') return; // ライブ・段位道場はリトライなし
  overlay('pause', false);
  stopRecording();
  game?.destroy();
  game = null;
  state = 'retry';
  startGame(playing.entry, playing.diff, playing.custom, null, playing.extra);
}

// 数字を数え上げる演出
function countUp(el, to, ms, fmtFn) {
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    el.textContent = fmtFn(Math.round(to * (1 - Math.pow(1 - k, 3))));
    if (k < 1 && el.isConnected) requestAnimationFrame(step);
  };
  el.textContent = fmtFn(0);
  requestAnimationFrame(step);
  setTimeout(() => { el.textContent = fmtFn(to); }, ms + 50); // タブが裏にあっても最終値にする
}

function onGameEnd(r) {
  const { entry, diff: d, custom } = playing;
  countPlay();
  game = null;
  lastResult = r;
  if (custom?.kind === 'test' || custom?.kind === 'tutorial' || custom?.kind === 'dan' || custom?.kind === 'practice' || custom?.kind === 'replay') {
    document.body.classList.remove('live');
    if (custom.kind === 'dan') state = 'retry'; // 段位道場は続けて次の曲を始めるので「プレイ中」を外す
    custom.onExit(r); return;
  }
  $('r-live').hidden = !playing.live;
  $('btn-back').innerHTML = playing.live ? 'ルームへ <small>ENTER</small>' : '選曲へ <small>ENTER</small>';
  if (playing.live) playing.live.finish(r);
  const isNew = custom ? false : recordBest(entry.id, d, r);
  if (isNew && r.log?.length) saveGhost(entry.id, d, r.log);
  // リプレイ: いまのプレイを見返せるようにし、自己ベストなら端末に残す(レーンがランダムのプレイは同じ配置を作れないので残さない)
  const canReplay = !custom && !playing.live && r.inputs?.length && r.opts?.lane !== 'random';
  lastReplay = canReplay ? { entry, d, inputs: r.inputs, score: r.score, opts: r.opts } : null;
  $('btn-rreplay').hidden = !lastReplay;
  if (canReplay && isNew && !entry.local) saveLocalReplay(entry.id, d, r.score, r.inputs);
  show('result');
  // 縦動画を録っていたら、保存ボタンを出す
  const rv = $('r-video');
  rv.hidden = true;
  stopRecording().then((v) => {
    if (!v || state !== 'result' || lastResult !== r) return;
    rv.hidden = false;
    rv.innerHTML = `<span>🎬 縦型のプレイ動画ができました(${(v.blob.size / 1048576).toFixed(1)}MB)</span><button class="btn-glow small" id="btn-rv-save">動画を保存・共有</button>`;
    $('btn-rv-save').addEventListener('click', () => saveVideo(v, toast));
  });
  renderNext(custom ? null : entry, d, r);
  document.documentElement.style.setProperty('--accent', entry.color);
  $('r-title').textContent = entry.title;
  const rd = $('r-diff');
  rd.textContent = custom ? `CUSTOM Lv${custom.level}` : `${d.toUpperCase()} ${entry.levels[d]}`;
  rd.style.color = DIFF_COLOR[custom ? 'custom' : d];
  if (custom) $('r-title').textContent = `${custom.title} (${entry.title})`;
  $('r-rank').textContent = r.rank;
  $('r-jacket').src = jacketURL(entry, 256);
  $('r-stamp').textContent = new Date().toLocaleString('ja-JP', { hour12: false }).replace(/\//g, '.');
  const banner = r.ap ? 'ALL PERFECT' : r.fc ? 'FULL COMBO' : r.score >= 600000 ? 'CLEAR' : 'FAILED';
  const bn = $('r-banner');
  bn.textContent = banner;
  bn.className = 'r-banner ' + banner.toLowerCase().replace(' ', '-');
  // 演出をやり直すためにクラスを付け直す
  const panel = document.querySelector('.result-panel');
  panel.classList.remove('reveal'); void panel.offsetWidth; panel.classList.add('reveal');
  countUp($('r-score'), r.score, 900, fmtScore);
  $('r-new').classList.toggle('on', isNew);
  $('r-badges').innerHTML = ''; // FC/AP は上のバナーで表示
  $('r-acc').textContent = r.accuracy.toFixed(2) + '%';
  $('r-combo').textContent = `${r.maxCombo} / ${r.total}`;
  const C = { PERFECT: '#7ff9ff', GREAT: '#ff7ce6', GOOD: '#b6ff7a', MISS: '#ff5a6e' };
  $('r-team').innerHTML = r.hasTeam
    ? `編成スコア <b>${r.teamScore.toLocaleString()}</b> <span class="muted">(ランキング・自己ベストは編成効果なしの ${fmtScore(r.score)} で記録)</span>`
    : '';
  $('r-reward').innerHTML = '';
  offsetHint(r);
  $('r-counts').innerHTML = Object.entries(r.counts).map(([k, v]) => `<div><small style="color:${C[k]}">${k}</small><b>${v}</b></div>`).join('') +
    `<div class="fs">FAST ${r.fast} ・ SLOW ${r.slow}</div>`;
  drawJudgeGraph(r, entry.buffer?.duration || entry.duration || 120);
  setShareResult(entry, playing.label, r);
  $('r-daily').hidden = true;
  $('r-weekly').hidden = true;
  $('r-season').hidden = true;
  if (playing.extra?.season) seasonResult(playing.extra.season, r, () => state === 'result' && lastResult === r);
  $('r-growth').innerHTML = custom ? '' : resultGrowth(null, r); // ログイン中は記録を送ったあとに XP なども足して出し直す
  if (playing.extra?.daily) dailyResult(playing.extra.daily, r, () => state === 'result' && lastResult === r);
  if (playing.extra?.weekly) weeklyResult(playing.extra.weekly, d, r, () => state === 'result' && lastResult === r);
  const on = $('r-online');
  const name = load('name', '');
  if (custom) {
    const who = acc.getState()?.name || name;
    if (!who) { on.innerHTML = '<p class="r-msg">ログインするか設定でゲスト名を入れると、この譜面のランキングに参加できます。</p>'; return; }
    on.innerHTML = '<p class="r-msg">ランキングに送信中…</p>';
    submitChartScore(custom.chartId, myRankId(), who, r).then(async (rank) => {
      const rows = await fetchChartRanking(custom.chartId, myRankId(), 10);
      if (state !== 'result' || lastResult !== r) return;
      on.innerHTML = `<p>この譜面のランク <span class="r-myrank">#${rank}</span></p><ol class="rank-list">${rankRows(rows)}</ol>`;
    }).catch((err) => { console.error(err); on.innerHTML = '<p class="r-msg">ランキングに送信できませんでした</p>'; });
    return;
  }
  if (acc.isLoggedIn()) {
    on.innerHTML = '<p class="r-msg">記録を送信中…</p>';
    acc.playResult(entry.id, d, !entry.local, r).then(async (res) => {
      if (state !== 'result' || lastResult !== r) return;
      const n = acc.claimableCount();
      $('r-reward').innerHTML = `<span class="coin-ico">◎</span> +${res.gained} コイン` +
        (res.gained === 0 ? ' <span class="muted">(連続送信のため報酬なし)</span>' : '') +
        (n ? ` ・ <button class="link-btn" data-nav-q>受け取れるクエストが ${n} 件</button>` : '');
      $('r-reward').querySelector('[data-nav-q]')?.addEventListener('click', () => { import('./meta.js').then((m) => m.openScreen('quest')); });
      $('r-growth').innerHTML = resultGrowth(res, r);
      if (entry.local) { on.innerHTML = '<p class="r-msg">読み込んだ曲はランキング対象外です。</p>'; return; }
      rankCache.delete(entry.id + '/' + d);
      const rows = await fetchRanking(entry.id, d, myRankId(), 10);
      if (state !== 'result' || lastResult !== r) return;
      on.innerHTML = `<p>ONLINE RANK <span class="r-myrank">#${res.online}</span></p><ol class="rank-list">${rankRows(rows)}</ol>`;
      if (isNew) { uploadGhost(entry, d, r); if (r.inputs?.length && r.opts?.lane !== 'random') uploadReplay(entry.id, d, myRankId(), acc.getState()?.name || load('name', ''), r.score, r.inputs); }
    }).catch((err) => { console.error(err); on.innerHTML = `<p class="r-msg">${esc(acc.errText(err))}(記録は端末に保存済み)</p>`; });
  } else if (entry.local) on.innerHTML = '<p class="r-msg">読み込んだ曲の記録はこの端末にだけ保存されます。</p>';
  else if (!name) on.innerHTML = '<p class="r-msg">ログインするとコインがもらえ、オンラインランキングにも参加できます(右上のアカウントから)。</p>';
  else {
    on.innerHTML = '<p class="r-msg">ランキングに送信中…</p>';
    submitScore(entry.id, d, clientId(), name, r)
      .then(async (myRank) => {
        rankCache.delete(entry.id + '/' + d);
        const rows = await fetchRanking(entry.id, d, clientId(), 10);
        if (state !== 'result' || lastResult !== r) return;
        on.innerHTML = `<p>ONLINE RANK <span class="r-myrank">#${myRank}</span></p><ol class="rank-list">${rankRows(rows)}</ol>`;
        if (isNew) { uploadGhost(entry, d, r); if (r.inputs?.length && r.opts?.lane !== 'random') uploadReplay(entry.id, d, myRankId(), acc.getState()?.name || load('name', ''), r.score, r.inputs); }
      })
      .catch((err) => { console.error(err); on.innerHTML = '<p class="r-msg">ランキングに送信できませんでした(記録は端末に保存済み)</p>'; });
  }
}
$('btn-retry').addEventListener('click', retry);
// X に投稿 / 縦動画で録ってもう一度
$('btn-rx').addEventListener('click', () => { if (!playing || !lastResult) return; const e = playing.entry; postX(resultText(e, playing.label, lastResult), e.urlId ? songUrl(e) : SITE); });
$('btn-rrec').hidden = !recordSupported();
// ---------------------------------------------------------------------------
// リプレイ(キーの押し・離しの記録を流し直す。記録・ランキングには残らない)
// ---------------------------------------------------------------------------
let lastReplay = null;
function playReplay(entry, d, rp, back) {
  const custom = {
    kind: 'replay', label: `REPLAY ・ ${rp.name}`, title: entry.title, level: entry.levels[d], notes: entry.charts[d], scroll: entry.scroll,
    replay: rp.inputs, opts: rp.opts,
    onExit: (r) => {
      if (r) toast(`${rp.name} のプレイ: ${fmtScore(r.score)}(${r.rank})`, 3000);
      if (back === 'result' && lastResult) { show('result'); return; }
      show('select'); renderList(); selectSong(sel, true);
    },
  };
  startGame(entry, d, custom);
}
$('btn-rreplay').addEventListener('click', () => { if (lastReplay) playReplay(lastReplay.entry, lastReplay.d, { inputs: lastReplay.inputs, name: 'いまのプレイ', opts: lastReplay.opts }, 'result'); });
async function openReplays() {
  const e = entries[sel];
  if (!e || e.local) { toast('この曲のリプレイはありません'); return; }
  const d = diff;
  $('rp-song').textContent = `${e.title} ・ ${d.toUpperCase()}`;
  const list = $('rp-list');
  list.innerHTML = '<li class="empty">読み込み中…</li>';
  overlay('replays', true);
  const mine = localReplay(e.id, d);
  const top = await topReplays(e.id, d);
  const rows = [];
  if (mine) rows.push(`<li data-local="1"><span class="r-name">自分のベスト(この端末)</span><span class="r-score">${fmtScore(mine.score)}</span><button class="mini">▶ 見る</button></li>`);
  for (const [i, x] of (top || []).entries()) rows.push(`<li data-rid="${esc(x.id)}" data-name="${esc(x.name)}"><span class="r-rank">#${i + 1}</span><span class="r-name">${esc(x.name)}</span><span class="r-score">${fmtScore(x.score)}</span><button class="mini">▶ 見る</button></li>`);
  list.innerHTML = rows.join('') || '<li class="empty">まだリプレイがありません。自己ベストを更新すると残ります</li>';
}
$('btn-replays').addEventListener('click', openReplays);
$('rp-close').addEventListener('click', () => overlay('replays', false));
$('rp-list').addEventListener('click', async (ev) => {
  const li = ev.target.closest('li[data-local], li[data-rid]');
  if (!li) return;
  const e = entries[sel], d = diff;
  try {
    let rp;
    if (li.dataset.local) { const m = localReplay(e.id, d); rp = { inputs: decodeInputs(m.inputs), name: '自分のベスト' }; }
    else { const x = await getReplay(li.dataset.rid); if (!x) throw new Error('NOT_FOUND'); rp = { inputs: decodeInputs(x.inputs), name: x.name }; }
    overlay('replays', false);
    playReplay(e, d, rp);
  } catch (err) { console.error(err); toast('リプレイを読み込めませんでした'); }
});

$('btn-rrec').addEventListener('click', () => {
  if (playing?.live || playing?.custom) { toast('この遊び方では録画できません'); return; }
  armRecord();
  toast('もう一度遊ぶあいだ、縦型の動画を録ります(音も入ります)', 3500);
  retry();
});
$('btn-back').addEventListener('click', quitGame);
$('btn-resume').addEventListener('click', () => { overlay('pause', false); game?.resume(); });
$('btn-p-retry').addEventListener('click', retry);
$('btn-p-quit').addEventListener('click', quitGame);

// ---------------------------------------------------------------------------
// 入力
// ---------------------------------------------------------------------------
window.addEventListener('keydown', (ev) => {
  if (ev.target.tagName === 'INPUT' && ['text', 'password', 'search'].includes(ev.target.type)) {
    if (ev.target.type === 'search' && (ev.key === 'Escape' || ev.key === 'Enter')) ev.target.blur();
    else if (ev.key === 'Escape') closeModals();
    return;
  }
  if (modalOpen()) { if (ev.key === 'Escape') closeModals(); return; }

  if (state === 'game' && game) {
    const lane = laneOf(ev.code);
    if (lane >= 0) {
      ev.preventDefault();
      if (ev.repeat) return;
      const set = laneDown[lane];
      if (!game.pressed[lane]) set.clear(); // 一時停止などで離した通知を取りこぼしていても、ここで元に戻す
      set.add(ev.code);
      game.press(lane, ev.timeStamp, set.size > 1);
      return;
    }
    if (LYRIC_SYNC && ev.key === 'Enter' && game.lyrics) { ev.preventDefault(); lyricStamp(ev.timeStamp); return; }
    if (ev.key === 'Escape') {
      // みんなでライブは止めない(全員同時に進むため)。メニューだけ出す
      if (playing?.live) overlay('pause', !$('pause').classList.contains('on'));
      else if (game.paused) { overlay('pause', false); game.resume(); } else { game.pause(); overlay('pause', true); }
    }
    return;
  }
  if (state === 'title' && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); enterFromTitle(); return; }
  if (state === 'home') {
    const onBtn = document.activeElement?.tagName === 'BUTTON';
    if (homeLiveOpen()) {
      if (ev.key === 'Escape' || ev.key === 'Backspace') { ev.preventDefault(); $('h-live-back').click(); }
      else if (ev.key === '1') { ev.preventDefault(); goSelect(); }
      else if (ev.key === '2') { ev.preventDefault(); $('btn-live').click(); }
      else if (ev.key === '3') { ev.preventDefault(); openDan(); }
      else if (ev.key === '4') { ev.preventDefault(); $('btn-daily').click(); }
      else if (ev.key === '5') { ev.preventDefault(); $('btn-course').click(); }
      else if (ev.key === '6') { ev.preventDefault(); $('btn-match').click(); }
      else if (ev.key === 'Enter' && !onBtn) { ev.preventDefault(); goSelect(); }
    } else if (ev.key === 'Enter' && !onBtn) { ev.preventDefault(); homeLive(true); }
    return;
  }
  if (state === 'select') {
    const view = visibleSongs();
    const pos = view.indexOf(sel);
    if (ev.key === 'ArrowDown' && view.length) { ev.preventDefault(); selectSong(view[(pos + 1) % view.length]); }
    else if (ev.key === 'ArrowUp' && view.length) { ev.preventDefault(); selectSong(view[(pos - 1 + view.length) % view.length]); }
    else if (ev.key === '/' ) { ev.preventDefault(); $('song-search').focus(); }
    else if (ev.key === 'Escape') { ev.preventDefault(); goHome(true); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); { const L = diffsOf(entries[sel]); setDiff(L[Math.min(L.length - 1, L.indexOf(diff) + 1)]); } }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); { const L = diffsOf(entries[sel]); setDiff(L[Math.max(0, L.indexOf(diff) - 1)]); } }
    else if (ev.key === 'Enter') { ev.preventDefault(); startGame(); }
    return;
  }
  if (state === 'editor' || state === 'charts') { makerKeydown(ev); return; }
  if (state === 'live') { if (ev.key === 'Escape') { $('live-back').click(); } return; }
  if (state === 'player') { playerKeydown(ev); return; }
  if (state === 'admin') { if (ev.key === 'Escape') $('adm-back').click(); return; }
  if (state === 'dan') { if (ev.key === 'Escape' && !modalOpen()) $('dan-back').click(); return; }
  if (state === 'quest' || state === 'gacha' || state === 'team' || state === 'pass') {
    if (ev.key === 'Escape') { if (gachaResultOpen()) closeGacha(); else goHome(); }
    return;
  }
  if (state === 'result') {
    if (ev.key === 'Enter' || ev.key === 'Escape') { ev.preventDefault(); quitGame(); }
    else if (ev.code === 'KeyR') { ev.preventDefault(); retry(); }
  }
});
// レーンごとに、いま押しているキー(D と S のように2つある)。全部離したときだけ「離した」にする
const laneDown = [new Set(), new Set(), new Set(), new Set()];
window.addEventListener('keyup', (ev) => {
  if (state !== 'game' || !game) return;
  const lane = laneOf(ev.code);
  if (lane < 0) return;
  laneDown[lane].delete(ev.code);
  if (!laneDown[lane].size) game.release(lane, ev.timeStamp);
});
function pauseGame() {
  if (state === 'game' && game && !game.paused) { game.pause(); overlay('pause', true); }
}
// みんなでライブ中はよそ見しても止めない
const autoPause = () => { if (!playing?.live) pauseGame(); };
window.addEventListener('blur', autoPause);
document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
$('btn-pause-game').addEventListener('click', () => { if (playing?.live && state === 'game') overlay('pause', true); else pauseGame(); });
if (IS_TOUCH) {
  document.body.classList.add('touch');
  $('btn-start').textContent = 'TAP TO START';
}

// タッチ(スマホ)
const touchLane = new Map();
canvas.addEventListener('touchstart', (ev) => {
  if (state !== 'game' || !game) return;
  ev.preventDefault();
  for (const t of ev.changedTouches) {
    const l = game.laneAt(t.clientX);
    touchLane.set(t.identifier, l);
    game.press(l, ev.timeStamp);
  }
}, { passive: false });
const touchEnd = (ev) => {
  if (!game) return;
  for (const t of ev.changedTouches) {
    const l = touchLane.get(t.identifier);
    touchLane.delete(t.identifier);
    if (l != null && ![...touchLane.values()].includes(l)) game.release(l, ev.timeStamp);
  }
};
canvas.addEventListener('touchmove', (ev) => {
  if (state !== 'game' || !game) return;
  ev.preventDefault();
  // 指をスライドして隣のレーンへ移動できるように
  for (const t of ev.changedTouches) {
    const old = touchLane.get(t.identifier);
    const l = game.laneAt(t.clientX);
    if (old == null || old === l) continue;
    touchLane.set(t.identifier, l);
    if (![...touchLane.values()].includes(old)) game.release(old, ev.timeStamp);
    game.press(l, ev.timeStamp);
  }
}, { passive: false });
canvas.addEventListener('touchend', touchEnd);
canvas.addEventListener('touchcancel', touchEnd);

// ---------------------------------------------------------------------------
// アカウント・メタ画面
// ---------------------------------------------------------------------------
function closeModals() {
  if ($('settings').classList.contains('on')) closeSettings();
  overlay('account-modal', false);
  overlay('changelog', false);
  closeRequest();
  overlay('tut-offer', false);
  overlay('tut-done', false);
  overlay('dan-result', false);
  overlay('course', false);
  overlay('calib', false);
  closeGrowth();
  closeFriends();
  if ($('match-modal').classList.contains('on')) cancelMatch();
}
function goSelect() {
  homeLive(false);
  show('select');
  renderList();
  selectSong(sel, true);
}
const backToSelect = goSelect;

// ---------------------------------------------------------------------------
// ホーム(モード選択)
// ---------------------------------------------------------------------------
function goHome(liveMenu = false) {
  if (EMBED) { goSelect(); return; } // 埋め込みにはホームがない
  // 曲選びの途中でホームに戻ったら、選ばずにコース画面へ戻る
  const cancelPick = pick?.cancel;
  if (pick) endPick();
  stopPreview();
  show('home');
  homeLive(liveMenu);
  renderHome();
  cancelPick?.();
}

// コースモードの曲選び: いつもの選曲画面で曲と難易度を選んでもらう
// o = { label, id, diff, done(entry, diff), cancel() }
var pick = null; // goHome から先に呼ばれることがあるので var
function pickSong(o) {
  pick = o;
  const i = entries.findIndex((e) => e.id === o.id);
  if (i >= 0) sel = i;
  if (DIFFS.includes(o.diff)) diff = o.diff;
  goSelect();
  document.body.classList.add('picking');
  $('sel-title').textContent = 'コースの曲を選ぶ';
  $('pick-bar').hidden = false;
  $('pick-bar').innerHTML = `<b>${esc(o.label)}</b><span>曲と難易度を選んで「決定」</span><button class="chip" id="pick-cancel">やめる</button>`;
  $('pick-cancel').addEventListener('click', () => goHome(true));
  $('btn-play').firstElementChild.textContent = '決定';
}
function endPick() {
  pick = null;
  document.body.classList.remove('picking');
  $('sel-title').textContent = 'ひとりでライブ';
  $('pick-bar').hidden = true;
  $('btn-play').firstElementChild.textContent = 'PLAY';
}
function homeLive(on) {
  $('home-main').hidden = on;
  $('home-live').hidden = !on;
  $('h-live').classList.toggle('open', on);
  if (on) { renderDaily(); renderWeekly(); }
  if (on) setTimeout(() => { if (state === 'home') $('btn-solo').focus({ preventScroll: true }); }, 30);
}
const homeLiveOpen = () => !$('home-live').hidden;
function renderHome() {
  homeFeatured().catch(() => {}); // CHARTS の札に今週のおすすめ譜面
  const s = acc.getState();
  const jk = $('h-jackets');
  if (!jk.childElementCount) {
    const pick = entries.filter((e) => !e.local).slice(0, 16);
    jk.innerHTML = pick.map((e) => `<img src="${jacketURL(e, 128)}" alt="">`).join('');
  }
  $('h-player').innerHTML = s
    ? `<span class="hp-hi">WELCOME BACK</span><b>${esc(s.name)}</b>${playerBadges()}${bestDan() ? `<span class="hp-dan">${danName(bestDan())}</span>` : ''}<span class="hp-sep"></span><span class="coin-ico">◎</span>${s.coins.toLocaleString()}<span class="hp-sep"></span><span class="muted">編成: ${esc(fxText(acc.teamFx()))}</span>`
    : `<span class="hp-hi">GUEST</span>${playerBadges()}<span class="muted">ログインすると 編成・ガチャ・クエスト・みんなでライブ が遊べます(はじめに 1000 コイン)</span><button class="btn-line hp-login" id="hp-login">ログイン / 新規登録</button>`;
  $('hp-login')?.addEventListener('click', () => openAccount());
  bindBadges();
  maybeShowInstall();
  // 実績バッジが増えていたらお知らせ
  const nb = newBadges(s, entries);
  if (nb.length) setTimeout(() => toast(`実績バッジを手に入れました: ${nb.map((b) => b.icon + ' ' + b.name).join(' / ')}(プロフィールで見られます)`, 5000), 900);
  for (const t of document.querySelectorAll('#home .need-login')) t.classList.toggle('locked', !s);
  $('h-team').textContent = s ? fxText(acc.teamFx()) : 'キャラ5人でスキルを組み合わせる';
  $('btn-admin').hidden = !acc.isAdmin();
}
$('h-live').addEventListener('click', () => homeLive(true));
$('h-live-back').addEventListener('click', () => { homeLive(false); $('h-live').focus({ preventScroll: true }); });
$('btn-solo').addEventListener('click', goSelect);
$('btn-dan').addEventListener('click', () => openDan());
for (const b of document.querySelectorAll('[data-tutorial]')) b.addEventListener('click', () => startTutorial());
$('btn-tut-skip').addEventListener('click', () => { save('tutorialSkipped', true); overlay('tut-offer', false); if (!acc.isLoggedIn() && !load('nameSkipped', false)) openAccount(); });
$('btn-tut-home').addEventListener('click', () => overlay('tut-done', false));
$('btn-tut-play').addEventListener('click', () => { overlay('tut-done', false); goHome(true); goSelect(); });
for (const b of document.querySelectorAll('[data-home]')) b.addEventListener('click', () => goHome());
initEvent({ songs: SONGS.filter((d) => d.event === 'xmas' && eventActive('xmas')) });
initSeason({
  entries, esc, toast, jacketURL, rankRows,
  play: (entry, d, custom, live, extra) => startGame(entry, d, custom, live, extra),
  rankId: () => myRankId(), playerName: () => acc.getState()?.name || load('name', ''),
});
initSpecials({ esc, toast, openAccount, showGiftGacha }); // お正月おみくじ・周年記念ウィーク
initMeta({ show: (n) => { stopPreview(); show(n); }, toast, back: () => goHome(), current: () => state });
initMaker({
  entries, show: (n) => { stopPreview(); show(n); }, toast, back: () => goHome(), current: () => state, overlay,
  play: (entry, custom) => startGame(entry, custom.kind, custom), rankRows, myRankId, esc,
  selectedEntry: () => entries[sel],
});
$('btn-charts').addEventListener('click', () => openCharts());
initPlayer({ entries, show: (n) => { stopPreview(); show(n); }, back: () => goHome(), current: () => state, esc, jacketURL, toast });
$('btn-player').addEventListener('click', () => openPlayer());
initAdmin({ entries, show: (n) => { stopPreview(); show(n); }, back: () => goHome(), current: () => state, esc, toast });
$('btn-admin').addEventListener('click', () => openAdmin());
initMotion();
initRequest({ esc, toast });
initGrowth({
  entries, bestOf, esc, toast, overlay, jacketURL, openAccount, rankRows, diffColor: DIFF_COLOR,
  show: (n) => { stopPreview(); show(n); }, back: () => goHome(), current: () => state,
  play: (entry, d, custom, live, extra) => startGame(entry, d, custom, live, extra),
  rankId: () => myRankId(), playerName: () => acc.getState()?.name || load('name', ''),
});
initMatch({ entries, toast, overlay, openAccount, esc, jacketURL, rate: () => currentRate() });
initFriends({ esc, toast, overlay, openAccount, openProfile, titleTag });
initInstall({ toast });
initKeyConfig({ settings: () => settings, saveSettings: (s) => { settings = s; setSettings(s); }, toast });
initDan({ entries, show: (n) => { stopPreview(); show(n); }, back: () => goHome(true), current: () => state, esc, jacketURL, toast, overlay,
  play: (entry, d, custom) => startGame(entry, d, custom) });
initExtras({
  entries, esc, jacketURL, toast, overlay, rankRows, fmtScore,
  play: (entry, d, custom, live, extra) => startGame(entry, d, custom, live, extra),
  settings: () => settings, saveSettings: (s) => { settings = s; setSettings(s); syncSettingsUI(); },
  rankId: () => myRankId(), playerName: () => acc.getState()?.name || load('name', ''),
  state: () => state, game: () => game, goHome: (liveMenu) => goHome(liveMenu),
  pickSong: (o) => pickSong(o),
});

initSocial({
  entries, esc, toast, jacketURL, bestOf, isTouch: IS_TOUCH, settings: () => settings,
  play: (entry, d, custom, live, extra) => startGame(entry, d, custom, live, extra),
  rankId: () => myRankId(), playerName: () => acc.getState()?.name || load('name', ''),
  enterQuiet: () => enterFromTitle({ quiet: true, home: true }),
});

initPoll({
  entries, esc, toast, overlay, jacketURL, settings: () => settings,
  selectSong: (id) => { const i = entries.findIndex((e) => e.id === id); if (i < 0) return; if (state !== 'select') goSelect(); selectSong(i, true); },
  enter: () => enterFromTitle({ quiet: true }),
});
syncPollButton();

// オフライン対応: 一度読み込んだファイルを端末に保存しておく(公開サイトのみ。ローカル開発では古いファイルが残らないよう使わない)
if (!EMBED && 'serviceWorker' in navigator && (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.search.includes('sw=1'))) {
  navigator.serviceWorker.register(ROOT_PATH + 'sw.js', { scope: ROOT_PATH }).catch((e) => console.warn('sw', e));
}

// ログイン中は1分おきにサーバーへ合図(管理者ページの「いまオンライン」)。画面が変わったときも少し後に送る
function pingNow() { if (acc.isLoggedIn() && !document.hidden) acc.ping(state); }
var pingT = 0; // show() から先に呼ばれることがあるので var
function pingSoon() { clearTimeout(pingT); pingT = setTimeout(pingNow, 1500); }
setInterval(pingNow, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) pingSoon(); });
initLive({
  entries, show: (n) => { stopPreview(); show(n); }, toast, back: () => goHome(true), current: () => state, esc, jacketURL, openAccount,
  diffColor: DIFF_COLOR, selected: () => entries[sel], diff: () => diff, isFav, toggleFav, bestOf,
  startLive: (entry, d, hooks) => startGame(entry, d, null, hooks),
  onMatchResult: (win) => reportMatch(win),
});
$('btn-maker').addEventListener('click', () => openEditor(entries[sel]));
acc.onChange(() => { if (state === 'select') { renderList(); renderDetail(); } if (state === 'home') renderHome(); });
const accReady = acc.init();

// 画面のURL(maker/ gacha/ charts/)で開いたときは、タイトルを飛ばしてその画面を開く
(async function openFromScreenUrl() {
  await Promise.resolve(); // このファイルの残り(設定など)を読み終えてから動かす
  const screen = document.querySelector('meta[name="screen"]')?.content;
  if (!screen) return;
  const needLogin = ['gacha', 'quest', 'team', 'live', 'admin'].includes(screen);
  if (needLogin && !load('token', null)) {
    // ガチャ・クエスト・編成はログインが必要。ログインしていない人は普通のトップ扱い(曲URLと同じ)
    try { history.replaceState(null, '', ROOT_PATH); document.title = 'MUSIC LiDAR｜ブラウザで遊べる無料4キー音ゲー(リズムゲーム)'; } catch { /* noop */ }
    return;
  }
  enterFromTitle({ quiet: true });
  if (screen === 'editor') openEditor(entries[sel]);
  else if (screen === 'charts') openCharts();
  else if (screen === 'settings') openSettings();
  else if (screen === 'account') openAccount();
  else if (screen === 'changelog') openChangelog();
  else if (screen === 'player') openPlayer();
  else if (screen === 'dan') openDan();
  // home/ はホームのまま
  else if (needLogin) {
    await accReady;
    if (acc.isLoggedIn()) { if (screen === 'live') openLive(); else if (screen === 'admin') openAdmin(); else openMetaScreen(screen); }
    else { syncUrl(entries[sel]); openAccount(); }
  }
  // result/ はプレイ結果が残っていないので選曲画面のまま
})();

// リザルト: 叩いたタイミングのずれ(中央値)が大きければ、判定タイミングの調整をすすめる
// ずれ d は今の判定タイミングを差し引いたあとの値なので、新しい値 = 今の値 + 中央値
function offsetHint(r) {
  const box = $('r-offset');
  box.hidden = true;
  const ds = (r.log || []).filter((x) => x[2] != null && x[1] !== 'MISS').map((x) => x[2]).sort((a, b) => a - b);
  if (ds.length < 40) return;
  const med = Math.round(ds[Math.floor(ds.length / 2)] * 1000);
  if (Math.abs(med) < 12) return;
  const next = Math.max(-150, Math.min(150, (settings.offset || 0) + med));
  if (next === (settings.offset || 0)) return;
  box.hidden = false;
  box.innerHTML = `<span>⏱ このプレイでは、平均して <b>${Math.abs(med)}ms ${med > 0 ? '遅め' : '早め'}</b> に叩いていました</span><button class="btn-line small" id="btn-roff">判定タイミングを ${next > 0 ? '+' : ''}${next}ms にする</button>`;
  $('btn-roff').addEventListener('click', () => {
    settings.offset = next; setSettings(settings); syncSettingsUI();
    box.innerHTML = `<span>判定タイミングを ${next > 0 ? '+' : ''}${next}ms にしました(設定でいつでも戻せます)</span>`;
  });
}

// ---------------------------------------------------------------------------
// 設定
// ---------------------------------------------------------------------------
const SLIDERS = [
  ['s-fx', 'fx', (v) => FX_LEVELS[v]],
  ['s-hs', 'hs', (v) => `${v.toFixed(1)}`],
  ['s-bgm', 'bgm', (v) => `${Math.round(v * 100)}`],
  ['s-se', 'se', (v) => `${Math.round(v * 100)}`],
  ['s-lane', 'laneW', (v) => `${v}px`],
  ['s-judge', 'judgePos', (v) => `${Math.round(v * 100)}%`],
  ['s-offset', 'offset', (v) => `${v > 0 ? '+' : ''}${v}ms`],
  ['s-dim', 'bgDim', (v) => `${v}%`],
];
function syncSettingsUI() {
  for (const [id, key, fmt] of SLIDERS) {
    $(id).value = settings[key];
    $(id.replace('s-', 'o-')).textContent = fmt(+settings[key]);
  }
  $('o-hs').title = `表示時間 ${visibleTime(settings.hs).toFixed(2)}秒`;
  $('s-name').value = load('name', '');
  $('s-beam').checked = !!settings.hitBeam;
  $('o-beam').textContent = settings.hitBeam ? 'ON' : 'OFF';
  $('s-laneopt').value = settings.lane || 'normal';
  $('s-vis').value = settings.vis || 'none';
  $('s-stream').value = settings.stream || '';
  applyStream();
  $('s-ghost').value = settings.ghostMode || (settings.ghost === false ? 'off' : 'self');
  $('s-mv').checked = settings.mv !== false;
  $('s-lyrics').checked = settings.lyrics !== false;
  $('s-notesize').value = settings.noteSize || 'normal';
  $('s-palette').value = settings.palette || 'skin';
  $('o-mv').textContent = settings.mv !== false ? 'ON' : 'OFF';
  applyKeys(); renderKeys();
}
$('s-laneopt').addEventListener('change', () => { settings.lane = $('s-laneopt').value; setSettings(settings); });
$('s-vis').addEventListener('change', () => { settings.vis = $('s-vis').value; setSettings(settings); });
$('s-lang').value = langPref();
$('s-lang').addEventListener('change', () => setLang($('s-lang').value));
$('s-stream').addEventListener('change', () => { settings.stream = $('s-stream').value; setSettings(settings); applyStream(); });
// 配信者モード: body に印を付け、みんなでライブの参加コードを画面の上に出し続ける
function applyStream() {
  document.body.classList.toggle('stream', !!settings.stream);
  syncPollButton();
  document.body.classList.toggle('stream-green', settings.stream === 'green');
}
setInterval(() => {
  const el = $('stream-code');
  const code = settings.stream ? roomCode() : '';
  const show = !!code && (state === 'game' || state === 'live' || state === 'result');
  if (show) el.innerHTML = `<small>みんなでライブ 参加コード</small><b>${esc(code)}</b><small>「MUSIC LiDAR」で検索 → みんなでライブ → コードで参加</small>`;
  el.hidden = !show;
}, 1000);
applyStream();
$('s-ghost').addEventListener('change', () => { settings.ghostMode = $('s-ghost').value; settings.ghost = settings.ghostMode !== 'off'; setSettings(settings); });
$('s-lyrics').addEventListener('change', () => { settings.lyrics = $('s-lyrics').checked; setSettings(settings); });
$('s-notesize').addEventListener('change', () => { settings.noteSize = $('s-notesize').value; setSettings(settings); });
$('s-palette').addEventListener('change', () => { settings.palette = $('s-palette').value; setSettings(settings); });
$('s-mv').addEventListener('change', () => {
  settings.mv = $('s-mv').checked;
  $('o-mv').textContent = settings.mv ? 'ON' : 'OFF';
  setSettings(settings);
});
$('s-beam').addEventListener('change', () => {
  settings.hitBeam = $('s-beam').checked;
  $('o-beam').textContent = settings.hitBeam ? 'ON' : 'OFF';
  setSettings(settings);
});
for (const [id, key, fmt] of SLIDERS) {
  $(id).addEventListener('input', () => {
    settings[key] = +$(id).value;
    $(id.replace('s-', 'o-')).textContent = fmt(settings[key]);
    setSettings(settings);
    if (key === 'bgm' || key === 'se') setVolumes(settings.bgm, settings.se);
  });
}
$('s-se').addEventListener('change', () => import('./audio.js').then((a) => a.playTap()));

let previewRaf = 0, previewGame = null;
function openSettings() {
  syncSettingsUI();
  overlay('settings', true);
  const pc = $('s-preview');
  const fake = [];
  for (let i = 0; i < 200; i++) {
    const t = i * 0.3;
    const lane = [0, 1, 2, 3, 2, 1, 3, 0][i % 8];
    fake.push(i % 10 === 4 ? { t, lane, end: t + 0.9 } : { t, lane });
  }
  previewGame = new Game(pc, { buffer: null, notes: fake, settings, bpm: 100, title: 'PREVIEW', diff: 'normal', color: '#5ef2ff', cloud, onEnd: null });
  previewGame.endAt = 60;
  const loop = (now) => {
    previewRaf = requestAnimationFrame(loop);
    const scale = pc.clientWidth / Math.max(1, window.innerWidth);
    previewGame.settings = { ...settings, laneW: settings.laneW * scale };
    previewGame.v = settings.hs * 4.4;
    previewGame.T = visibleTime(settings.hs);
    const t = (now / 1000) % 50 + 2;
    for (const n of previewGame.notes) { n.done = false; n.tailDone = !n.end; n.holding = false; }
    previewGame.drawStart = 0;
    previewGame.render(t, now);
  };
  previewRaf = requestAnimationFrame(loop);
}
function closeSettings() {
  const v = $('s-name').value.trim().slice(0, 16);
  if (v !== load('name', '')) { save('name', v); renderHeader(); }
  cancelAnimationFrame(previewRaf);
  previewGame = null;
  overlay('settings', false);
}
for (const b of document.querySelectorAll('[data-settings]')) b.addEventListener('click', openSettings);
$('btn-s-close').addEventListener('click', closeSettings);
$('btn-s-reset').addEventListener('click', () => {
  // キー配置は「キー配置」の初期値ボタンで戻す(ここでは消さない)
  settings = { ...DEFAULT_SETTINGS, keys: settings.keys };
  setSettings(settings);
  setVolumes(settings.bgm, settings.se);
  syncSettingsUI();
});
for (const m of document.querySelectorAll('.overlay.modal')) {
  m.addEventListener('click', (ev) => { if (ev.target === m) closeModals(); });
}

// 想定外のエラーは画面に出す(不具合報告用)
window.addEventListener('error', (ev) => toast('エラー: ' + (ev.message || ev.error), 6000));
window.addEventListener('unhandledrejection', (ev) => toast('エラー: ' + (ev.reason?.message || ev.reason), 6000));

// 起動時のロード画面を閉じる(フォントの読み込みを少しだけ待つ)
Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1200))]).then(() => window.__bootDone?.());

// デバッグ用
window.MLIDAR = { entries, get game() { return game; } };

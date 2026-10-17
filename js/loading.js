// 読み込み中画面(ジャケット・進み具合・Tips)
import { jacketURL } from './jacket.js';

export const TIPS = [
  'ハイスピードは設定で変えられます。ノーツが速すぎる・遅すぎると感じたら調整してみよう。',
  'ロングノーツは最後まで押しっぱなし。終わりより早く離すと MISS になります。',
  'ゲーム中は Esc(スマホは左上の ❚❚)で一時停止できます。',
  'リザルト画面で R を押すとすぐにリトライできます。',
  '選曲画面では ↑↓ で曲、←→ で難易度、Enter でプレイ。/ キーで検索欄に飛べます。',
  'FAST / SLOW 表示で、自分が早押し気味か遅押し気味かが分かります。',
  '「叩いた時に上へ伸びる光」や演出の強さは設定で変えられます。見にくい時はオフに。',
  '編成のリーダー(1人目)はスキルが1.5倍。強いキャラをリーダーにしよう。',
  '判定サポートのキャラを入れると、少しズレても PERFECT になりやすくなります。',
  'コンボガードがあれば、MISS してもその回数まではコンボが切れません。',
  'ランキングには編成効果なしの「素のスコア」が載ります。腕前で勝負!',
  'デイリーミッションは毎日0時(日本時間)に更新。忘れずに受け取ろう。',
  'ガチャは100回引くと★4が必ず出ます。10連は★2以上が1体確定。',
  '同じキャラが出るとLvアップ。Lv5を超えた分はコインに変わります。',
  '譜面メーカーでは R で録音、T でテストプレイ。曲に合わせて叩くだけで譜面が作れます。',
  '譜面メーカーの右の紫の列をクリックすると、停止・変速・隠しのギミックを置けます。',
  '自分の譜面を「投稿」すると、みんなの譜面から誰でも遊べるようになります。',
  '手持ちの音声ファイルをドラッグ&ドロップすると、自動で譜面ができます。',
  '一度準備した曲の音はブラウザに保存されるので、次からはすぐに始まります。',
  'Freeze Frame は譜面が止まったり速くなったりするギミック曲。見た目に惑わされないで!',
  'うまく合わないと感じたら、BGMを少し小さくしてタップ音を聞くとリズムを取りやすいかも。',
  'スマホでは指を横にスライドすると隣のレーンへ移れます。',
];

const $ = (id) => document.getElementById(id);
let tipTimer = 0, progTimer = 0, shownAt = 0, tipIdx = Math.floor(Math.random() * TIPS.length);

function nextTip() {
  const el = $('ld-tip');
  el.classList.remove('in');
  void el.offsetWidth;
  tipIdx = (tipIdx + 1) % TIPS.length;
  el.textContent = TIPS[tipIdx];
  el.classList.add('in');
}

// info: { entry?, title?, sub?, status, getProgress?() } getProgress が無ければ進み具合は流れるバー
export function showLoading(info) {
  const e = info.entry;
  const box = $('loading');
  box.style.setProperty('--accent', e?.color || '#5ef2ff');
  $('ld-jacket').hidden = !e;
  if (e) $('ld-jacket').src = jacketURL(e, 256);
  $('ld-genre').textContent = e?.genre || '';
  $('ld-title').textContent = info.title || e?.title || '';
  $('ld-diff').textContent = info.sub || '';
  $('loading-text').textContent = info.status || 'NOW LOADING';
  const bar = $('ld-bar');
  bar.classList.toggle('indeterminate', !info.getProgress);
  $('ld-fill').style.width = '0%';
  $('ld-pct').textContent = info.getProgress ? '0%' : '';
  clearInterval(progTimer);
  if (info.getProgress) {
    progTimer = setInterval(() => {
      const p = Math.max(0, Math.min(1, info.getProgress() || 0));
      $('ld-fill').style.width = (p * 100).toFixed(1) + '%';
      $('ld-pct').textContent = Math.round(p * 100) + '%';
    }, 80);
  }
  nextTip();
  clearInterval(tipTimer);
  tipTimer = setInterval(nextTip, 4500);
  box.classList.add('on');
  shownAt = performance.now();
}

// minMs: 一瞬で消えるとチラつくので最低限表示する時間
export async function hideLoading(minMs = 0) {
  const wait = minMs - (performance.now() - shownAt);
  if (wait > 0) {
    $('ld-fill').style.width = '100%';
    if ($('ld-pct').textContent) $('ld-pct').textContent = '100%';
    $('loading-text').textContent = 'READY';
    await new Promise((r) => setTimeout(r, wait));
  }
  clearInterval(tipTimer);
  clearInterval(progTimer);
  $('loading').classList.remove('on');
}

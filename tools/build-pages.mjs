// 曲ごとのページ music/<urlId>/index.html と sitemap.xml を作る(tools/release.py から呼ばれる)
// - 中身は index.html と同じゲーム。<base href="../../"> で css/js/audio はルートを参照する
// - タイトル・説明・共有画像(og)を曲ごとに差し替える。music/<urlId>/og.png があればそれを使う
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://kaikomziu.github.io/music-lidar/';
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

const songs = (await import(pathToFileURL(path.join(root, 'js/songs/index.js')).href)).default;
const base = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(">)`);
  if (!re.test(html)) throw new Error('meta not found: ' + key);
  return html.replace(re, `$1${esc(value)}$2`);
}

const seen = new Set();
const urls = [SITE, SITE + 'guide.html'];
for (const s of songs) {
  if (!s.urlId || !/^[a-z0-9]{6,16}$/.test(s.urlId)) throw new Error('urlId がない/不正: ' + s.id);
  if (seen.has(s.urlId)) throw new Error('urlId が重複: ' + s.urlId);
  seen.add(s.urlId);
  const dir = path.join(root, 'music', s.urlId);
  fs.mkdirSync(dir, { recursive: true });
  const url = `${SITE}music/${s.urlId}/`;
  const lv = s.levels;
  const title = `${s.title}(${s.genre} / BPM ${Math.round(s.bpm)})｜MUSIC LiDAR 無料ブラウザ音ゲー`;
  const desc = `「${s.title}」${s.artist && s.artist !== 'MUSIC LiDAR' ? `(${s.artist})` : ''}をブラウザで今すぐプレイ。` +
    `EASY Lv${lv.easy} / NORMAL Lv${lv.normal} / HARD Lv${lv.hard}。MUSIC LiDAR はインストール不要・無料の4キー音ゲー(リズムゲーム)。PC・スマホ対応。` +
    (s.credit ? ` ${s.credit}` : '');
  const og = fs.existsSync(path.join(dir, 'og.png')) ? `${url}og.png` : `${SITE}og.png`;

  let h = base.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<base href="../../">');
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  h = setMeta(h, 'name', 'description', desc);
  h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  h = setMeta(h, 'property', 'og:title', title);
  h = setMeta(h, 'property', 'og:description', desc);
  h = setMeta(h, 'property', 'og:url', url);
  h = setMeta(h, 'property', 'og:image', og);
  h = setMeta(h, 'name', 'twitter:title', title);
  h = setMeta(h, 'name', 'twitter:description', desc);
  h = setMeta(h, 'name', 'twitter:image', og);
  h = h.replace('<meta name="app-version"', `<meta name="song-id" content="${esc(s.id)}">\n<meta name="app-version"`);
  h = h.replace(/<h1 class="title-lead">[^<]*<\/h1>/, `<h1 class="title-lead">「${esc(s.title)}」をプレイ ― 無料・インストール不要のブラウザ音ゲー</h1>`);
  fs.writeFileSync(path.join(dir, 'index.html'), h);
  urls.push(url);
}

// 画面ごとのページ(譜面メーカー・ガチャ・みんなの譜面)
const SCREENS = [
  { dir: 'maker', screen: 'editor', title: '譜面メーカー｜MUSIC LiDAR 無料ブラウザ音ゲー',
    desc: 'MUSIC LiDAR の譜面メーカー。ブラウザだけで4キー音ゲーの譜面を作れます。クリックで配置、曲に合わせて叩いて録音(ズレは自動補正)、自動譜面の手直し、譜面停止・変速などのギミック、テストプレイ、みんなへの投稿に対応。無料・PC/スマホ対応。' },
  { dir: 'gacha', screen: 'gacha', title: 'ガチャ｜MUSIC LiDAR 無料ブラウザ音ゲー',
    desc: 'MUSIC LiDAR のキャラガチャ。プレイで貯めたコインで★1〜★4の全26キャラを集め、5人編成でスコアUP・判定サポート・コンボガード・コインUPのスキルを発動。10連は★2以上確定、100回で★4確定。' },
  { dir: 'charts', screen: 'charts', title: 'みんなの譜面｜MUSIC LiDAR 無料ブラウザ音ゲー',
    desc: 'MUSIC LiDAR のプレイヤーが譜面メーカーで作って投稿した譜面を遊べます。新着・プレイ数・いいね順で探せて、譜面ごとのランキングも。無料のブラウザ4キー音ゲー。' },
  { dir: 'quest', screen: 'quest', title: 'クエスト｜MUSIC LiDAR 無料ブラウザ音ゲー',
    desc: 'MUSIC LiDAR のクエスト。毎日更新のデイリーミッションと、フルコンボやガチャ回数などの実績を達成してコインをもらおう。' },
  { dir: 'team', screen: 'team', title: '編成｜MUSIC LiDAR 無料ブラウザ音ゲー',
    desc: 'MUSIC LiDAR の編成。ガチャで集めたキャラをドラッグ&ドロップで5人まで編成し、スコアUP・判定サポート・コンボガード・コインUPのスキルを組み合わせよう。' },
  { dir: 'changelog', screen: 'changelog', title: '更新履歴｜MUSIC LiDAR 無料ブラウザ音ゲー',
    desc: 'MUSIC LiDAR の更新履歴。新曲の追加、新機能、見た目の刷新、不具合の修正などをバージョンごとにまとめています。' },
  { dir: 'live', screen: 'live', title: 'みんなでライブ｜MUSIC LiDAR 無料ブラウザ音ゲー',
    desc: 'MUSIC LiDAR の「みんなでライブ」。最大8人で同じ曲を同時にプレイし、プレイ中はみんなのコンボがリアルタイムに見える。最後は編成の効果込みのスコアで順位を競う、ブラウザで遊べる無料のオンライン音ゲー。' },
  { dir: 'listen', screen: 'player', title: 'きくだけ(オリジナル曲プレーヤー)｜MUSIC LiDAR',
    desc: 'MUSIC LiDAR のオリジナル曲を音楽プレーヤーで聴けます。ローファイ・ジャズ・シティポップ・和風・スピードコアなど、いろいろなジャンルのオリジナルBGMをシャッフルやくり返しで。無料・ブラウザだけで再生。' },
  { dir: 'dan', screen: 'dan', title: '段位道場｜MUSIC LiDAR 無料ブラウザ音ゲー',
    desc: 'MUSIC LiDAR の段位道場。4曲を続けてプレイし、体力ゲージが0にならずに最後まで行けたら合格。初段から十段、皆伝まで11段階の段位認定に挑戦しよう。' },
  // ここから下は検索に出さない画面
  { dir: 'admin', screen: 'admin', noindex: true, title: '管理｜MUSIC LiDAR', desc: 'MUSIC LiDAR の管理者ページ。' },
  { dir: 'home', screen: 'home', noindex: true, title: 'ホーム｜MUSIC LiDAR', desc: 'MUSIC LiDAR のホーム。ライブ・編成・ガチャ・クエスト・みんなの譜面・譜面メーカーを選べます。' },
  { dir: 'result', screen: 'result', noindex: true, title: 'リザルト｜MUSIC LiDAR', desc: 'MUSIC LiDAR のプレイ結果。' },
  { dir: 'settings', screen: 'settings', noindex: true, title: '設定｜MUSIC LiDAR', desc: 'MUSIC LiDAR の設定。' },
  { dir: 'account', screen: 'account', noindex: true, title: 'アカウント｜MUSIC LiDAR', desc: 'MUSIC LiDAR のログイン・新規登録。' },
];
for (const sc of SCREENS) {
  const dir = path.join(root, sc.dir);
  fs.mkdirSync(dir, { recursive: true });
  const url = `${SITE}${sc.dir}/`;
  let h = base.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<base href="../">');
  h = h.replace(/<title>[^<]*<\/title>/, `<title>${esc(sc.title)}</title>`);
  h = setMeta(h, 'name', 'description', sc.desc);
  h = h.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  h = setMeta(h, 'property', 'og:title', sc.title);
  h = setMeta(h, 'property', 'og:description', sc.desc);
  h = setMeta(h, 'property', 'og:url', url);
  h = setMeta(h, 'name', 'twitter:title', sc.title);
  h = setMeta(h, 'name', 'twitter:description', sc.desc);
  h = h.replace('<meta name="app-version"', `<meta name="screen" content="${sc.screen}">\n<meta name="app-version"`);
  if (sc.noindex) h = h.replace('<meta name="screen"', '<meta name="robots" content="noindex">\n<meta name="screen"');
  fs.writeFileSync(path.join(dir, 'index.html'), h);
  if (!sc.noindex) urls.splice(2, 0, url);
}

fs.writeFileSync(path.join(root, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n') + '\n</urlset>\n');
console.log(`song pages: ${songs.length} / screen pages: ${SCREENS.length} / sitemap: ${urls.length} urls`);

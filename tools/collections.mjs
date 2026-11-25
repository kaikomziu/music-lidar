// 曲のまとめページ(collections/<slug>/)と、曲ページに足す「似た曲」「構造化データ」を作る
// build-pages.mjs から呼ばれる。見た目は guide.html と同じスタイル
import fs from 'node:fs';
import path from 'node:path';

const has = (g, words) => words.some((w) => g.includes(w));
// まとめの定義。match(曲) が true の曲が載る(1曲が複数のまとめに入ってよい)
export const COLLECTIONS = [
  { slug: 'beginner', name: '初心者向けのやさしい曲', short: 'やさしい曲',
    lead: 'はじめての人や音ゲーが苦手な人でも遊びやすい、ゆっくりでノーツの少ない曲を集めました。まずは EASY から挑戦してみましょう。',
    match: (s) => s.levels.normal <= 4 },
  { slug: 'hard', name: '鬼畜・高難易度の曲', short: '鬼畜曲',
    lead: 'HARD のレベルが12以上の、腕に自信がある人向けの曲。高速の連打、同時押しの嵐、譜面停止や変速などのギミックに挑戦しよう。',
    match: (s) => s.levels.hard >= 12 },
  { slug: 'fast', name: 'BPM180以上の速い曲', short: '速い曲',
    lead: 'テンポ(BPM)が180以上のスピード感のある曲。ドラムンベース・ハードコア・スピードコアなど、駆け抜ける気持ちよさを味わえます。',
    match: (s) => s.bpm >= 180 },
  { slug: 'chill', name: 'ゆったり・チルな曲', short: 'チルな曲',
    lead: 'BPM100以下や、ローファイ・アンビエント・ラウンジなど、のんびり遊べる落ち着いた曲。作業の合間や寝る前にも。',
    match: (s) => s.bpm <= 100 || has(s.genre, ['LO-FI', 'AMBIENT', 'LOUNGE', 'CHILL', 'PIANO', 'MUSIC BOX', 'BALLAD']) },
  { slug: 'wa', name: '和風の曲', short: '和風',
    lead: '三味線や和太鼓、和音階を使った和風の曲。和ポップから和ロック、和風コアまで。',
    match: (s) => s.genre.startsWith('WA-') || /sakura|shinobi|samurai|shamisen|koi-pond/.test(s.id) },
  { slug: 'jazz', name: 'ジャズ・スウィングの曲', short: 'ジャズ',
    lead: 'ジャズ・ビッグバンド・ボサノヴァ・ブルース・エレクトロスウィングなど、おしゃれでグルーヴィーな曲。裏拍のリズムに乗って叩こう。',
    match: (s) => has(s.genre, ['JAZZ', 'BIG BAND', 'SWING', 'BOSSA', 'BLUES', 'LOUNGE', 'NEO SOUL']) },
  { slug: 'edm', name: 'EDM・クラブミュージックの曲', short: 'EDM',
    lead: 'ハウス・トランス・ダブステップ・ドラムンベース・フューチャーベースなど、クラブで流れるような電子音楽の曲。',
    match: (s) => has(s.genre, ['HOUSE', 'TRANCE', 'DUBSTEP', 'DRUM & BASS', 'TECHNO', 'FUTURE BASS', 'BIG ROOM', 'HARDSTYLE', 'RIDDIM', 'GARAGE', 'JUNGLE', 'TRAP', 'GLITCH', 'MOOMBAHTON', 'EUROBEAT', 'JUMP UP', 'NEUROFUNK', 'LIQUID FUNK']) },
  { slug: 'core', name: 'ハードコア・○○コアの曲', short: 'コア系',
    lead: 'ハードコア・J-CORE・スピードコア・ブレイクコア・ガバなど、激しく速い「コア系」の曲。音ゲーの花形ジャンルです。',
    match: (s) => /CORE|GABBER|BOSS/.test(s.genre) },
  { slug: 'rock', name: 'ロック・メタルの曲', short: 'ロック',
    lead: 'ギターが鳴り響くロック・パンク・メタルの曲。パワーメタルからメタルコアまで。',
    match: (s) => has(s.genre, ['ROCK', 'METAL', 'PUNK']) },
  { slug: 'world', name: '世界の音楽(ワールドミュージック)の曲', short: 'ワールド',
    lead: 'タンゴ・サンバ・サルサ・マリアッチ・フラメンコ・ケルト・ガムラン・ボリウッドなど、世界各地の音楽をもとにした曲。',
    match: (s) => has(s.genre, ['TANGO', 'ARABIAN', 'SAMBA', 'MARIACHI', 'BOLLYWOOD', 'CHINESE', 'GAMELAN', 'CELTIC', 'SALSA', 'FLAMENCO', 'POLKA', 'REGGAE', 'AFRO', 'BLUEGRASS', 'COUNTRY', 'FOLK', 'WALTZ', 'DUB']) },
  { slug: 'pop', name: 'J-POP・アイドル・ポップの曲', short: 'ポップ',
    lead: 'J-POP・K-POP・アイドルポップ・シティポップ・アニソン風・Kawaii Future Bass など、明るく親しみやすいポップスの曲。',
    match: (s) => has(s.genre, ['J-POP', 'K-POP', 'IDOL', 'KAWAII', 'ANISON', 'CITY POP', 'SYNTH POP', 'SHIBUYA', 'HYPERPOP', 'BOUNCE POP', 'SPRING POP', 'KIDS POP', 'TOY POP', 'ACOUSTIC POP', 'WA-POP']) || s.genre === 'POP' },
  { slug: 'retro', name: 'レトロ・チップチューンの曲', short: 'レトロ',
    lead: '8bitのチップチューン、80年代風のシンセウェイブ・アウトラン、ヴェイパーウェイブ、ディスコなど、懐かしい雰囲気の曲。',
    match: (s) => has(s.genre, ['CHIPTUNE', 'SYNTHWAVE', 'OUTRUN', 'VAPORWAVE', 'FUTURE FUNK', 'DARKSYNTH', 'DISCO']) },
];

// 曲ごとに入っているまとめ
export function collectionsOf(s) { return COLLECTIONS.filter((c) => c.match(s)); }

// 似た曲: 同じまとめに入っていて、BPMとレベルが近い曲から4つ(決まった順なので毎回同じ結果になる)
export function relatedOf(s, songs) {
  const mine = new Set(collectionsOf(s).map((c) => c.slug));
  return songs.filter((x) => x !== s && x.urlId)
    .map((x) => ({ x, d: (collectionsOf(x).some((c) => mine.has(c.slug)) ? 0 : 50) + Math.abs(x.bpm - s.bpm) / 10 + Math.abs(x.levels.hard - s.levels.hard) * 2 + (x.genre === s.genre ? -5 : 0) }))
    .sort((a, b) => a.d - b.d || (a.x.id < b.x.id ? -1 : 1)).slice(0, 4).map((r) => r.x);
}

// 曲ページの構造化データ(曲・パンくず)
export function songJsonLd(s, url, SITE) {
  const rec = {
    '@context': 'https://schema.org', '@type': 'MusicRecording', name: s.title, url, genre: s.genre, inLanguage: 'ja',
    byArtist: { '@type': 'MusicGroup', name: s.artist || 'MUSIC LiDAR' },
    isPartOf: { '@type': 'VideoGame', name: 'MUSIC LiDAR', url: SITE },
    description: `ブラウザ音ゲー MUSIC LiDAR の収録曲「${s.title}」(${s.genre} / BPM ${Math.round(s.bpm)})。EASY Lv${s.levels.easy}・NORMAL Lv${s.levels.normal}・HARD Lv${s.levels.hard}。`,
  };
  const c = collectionsOf(s)[0];
  const crumbs = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'MUSIC LiDAR', item: SITE },
      ...(c ? [{ '@type': 'ListItem', position: 2, name: c.name, item: `${SITE}collections/${c.slug}/` }] : []),
      { '@type': 'ListItem', position: c ? 3 : 2, name: s.title, item: url },
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(rec)}</script>\n<script type="application/ld+json">${JSON.stringify(crumbs)}</script>`;
}

// 曲ページのタイトル画面に出す「似た曲・まとめ」のリンク(検索エンジンが曲どうしをたどれるように)
export function songLinksHtml(s, songs, esc) {
  const rel = relatedOf(s, songs);
  const cols = collectionsOf(s);
  return `<p class="title-related">${s.genre} ・ BPM ${Math.round(s.bpm)} ・ EASY ${s.levels.easy} / NORMAL ${s.levels.normal} / HARD ${s.levels.hard}<br>` +
    `似た曲: ${rel.map((x) => `<a href="music/${x.urlId}/">${esc(x.title)}</a>`).join(' ・ ')}` +
    (cols.length ? `<br>まとめ: ${cols.map((c) => `<a href="collections/${c.slug}/">${esc(c.short)}</a>`).join(' ・ ')}` : '') + '</p>';
}

// まとめページ一式を書き出す。書いたURLの一覧を返す
export function writeCollections({ root, SITE, songs, esc, today }) {
  const guide = fs.readFileSync(path.join(root, 'guide.html'), 'utf8');
  const style = guide.match(/<style>[\s\S]*?<\/style>/)[0].replace('</style>', `
.cols { display: flex; flex-wrap: wrap; gap: 8px; margin: 12px 0; padding: 0; list-style: none; }
.cols a { display: inline-block; padding: 4px 12px; border: 1px solid var(--line); border-radius: 999px; text-decoration: none; font-size: 14px; }
.cols a.on { border-color: var(--cyan); background: rgba(94, 242, 255, 0.12); }
.count { color: var(--muted); font-size: 14px; }
</style>`);
  // 読みもののページ共通の見た目と上のナビ(2026-11-25〜)。guide.html の読み込みをそのまま写すので、バージョンもそろう
  const pageAssets = (guide.match(/<link rel="stylesheet" href="css\/pages\.css[^"]*">\s*<script src="js\/page-nav\.js[^"]*" defer><\/script>/) || [''])[0];
  const avail = songs.filter((s) => s.urlId && !s.event);
  const nav = (cur) => `<ul class="cols">${COLLECTIONS.map((c) => `<li><a href="collections/${c.slug}/"${c.slug === cur ? ' class="on"' : ''}>${esc(c.short)}</a></li>`).join('')}</ul>`;
  const page = ({ title, desc, url, h1, body, ld }) => `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<base href="${url.endsWith('collections/') ? '../' : '../../'}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="MUSIC LiDAR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#02030a">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
${ld}
${style}
${pageAssets}
</head>
<body>
<div class="wrap">
  <header>
    <p class="logo"><small>MUSIC</small>LiDAR</p>
    <h1 class="lead">${esc(h1)}</h1>
    <a class="play" href="./">▶ 今すぐ遊ぶ(無料・インストール不要)</a>
  </header>
${body}
  <footer>
    <p><a class="play" href="./">▶ MUSIC LiDAR で遊ぶ</a></p>
    <p><a href="guide.html">遊び方・全曲リスト</a> ・ <a href="collections/">曲のまとめ一覧</a> ・ 更新 ${today}</p>
    <p>制作:かるわか ・ <a href="https://kaikomziu.github.io/game-links/">ほかの自作ゲーム一覧</a></p>
  </footer>
</div>
</body>
</html>
`;
  const table = (list) => `<div class="table-wrap"><table>
    <thead><tr><th>曲名</th><th>ジャンル</th><th>BPM</th><th>レベル(EASY / NORMAL / HARD)</th></tr></thead>
    <tbody>
${list.map((s) => `      <tr><td><a href="music/${s.urlId}/">${esc(s.title)}</a></td><td>${esc(s.genre)}</td><td>${Math.round(s.bpm)}</td><td class="lv">${s.levels.easy} / ${s.levels.normal} / ${s.levels.hard}</td></tr>`).join('\n')}
    </tbody>
  </table></div>`;
  const urls = [];
  // 一覧ページ
  {
    const url = `${SITE}collections/`;
    const dir = path.join(root, 'collections');
    fs.mkdirSync(dir, { recursive: true });
    const body = `
  <h2>曲のまとめ</h2>
  <p>無料のブラウザ音ゲー MUSIC LiDAR の収録曲(全${avail.length}曲)を、難易度・テンポ・ジャンルでまとめました。曲名を押すと、その曲のページが開きます。</p>
  ${COLLECTIONS.map((c) => { const n = avail.filter(c.match).length; return `<h3><a href="collections/${c.slug}/">${esc(c.name)}</a> <span class="count">${n}曲</span></h3>\n  <p>${esc(c.lead)}</p>`; }).join('\n  ')}`;
    const ld = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'MUSIC LiDAR 曲のまとめ', url,
      hasPart: COLLECTIONS.map((c) => ({ '@type': 'CollectionPage', name: c.name, url: `${SITE}collections/${c.slug}/` })) })}</script>`;
    fs.writeFileSync(path.join(dir, 'index.html'), page({ title: '曲のまとめ(難易度・ジャンル別)｜MUSIC LiDAR 無料ブラウザ音ゲー', url, ld, body,
      desc: `無料のブラウザ音ゲー MUSIC LiDAR の全${avail.length}曲を、初心者向け・鬼畜曲・BPM180以上・和風・ジャズ・EDM・ハードコア・ロックなど12のまとめで紹介。`,
      h1: 'ブラウザ音ゲー MUSIC LiDAR の曲を、難易度・ジャンル別にまとめました' }));
    urls.push(url);
  }
  for (const c of COLLECTIONS) {
    const list = avail.filter(c.match).sort((a, b) => a.levels.hard - b.levels.hard || a.bpm - b.bpm);
    const url = `${SITE}collections/${c.slug}/`;
    const dir = path.join(root, 'collections', c.slug);
    fs.mkdirSync(dir, { recursive: true });
    const top = list.slice(0, 3).map((s) => `「${s.title}」`).join('');
    const body = `
  ${nav(c.slug)}
  <h2>${esc(c.name)}(${list.length}曲)</h2>
  <p>${esc(c.lead)}</p>
  <p>MUSIC LiDAR はインストール不要・無料で遊べる4キー音ゲーです。PCは <strong>D F J K</strong> キー、スマホはタップで遊べます。下の曲名を押すと、その曲のページが開いてすぐに遊べます。</p>
  ${table(list)}
  <h2>ほかのまとめ</h2>
  ${nav(c.slug)}`;
    const ld = `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'ItemList', name: c.name, url, numberOfItems: list.length,
      itemListElement: list.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}music/${s.urlId}/`, name: s.title })) })}</script>`;
    fs.writeFileSync(path.join(dir, 'index.html'), page({ title: `${c.name}一覧(${list.length}曲)｜MUSIC LiDAR 無料ブラウザ音ゲー`, url, ld, body,
      desc: `${c.lead.slice(0, 70)} ${top}など${list.length}曲を、ブラウザで無料ですぐに遊べます。`, h1: `ブラウザで遊べる音ゲーの${c.name}` }));
    urls.push(url);
  }
  return urls;
}

// 英語表示(海外から来た人向け)。まずはメニュー・ボタン・説明など、画面の決まった文字だけを英語にする
// しくみ: 画面の文字(テキストと title / placeholder / aria-label)が下の辞書の日本語と「まるごと同じ」なら英語に置き換える。
//         あとから JS が出した文字も MutationObserver で置き換える(辞書にない文は日本語のまま)
// 言語の決め方: URL の ?lang=en / ?lang=ja > 設定で選んだ言語(mlidar:lang)> ブラウザの言語(日本語以外なら英語)
// 新しいボタンや見出しを足したら、ここに英語も足す
import { load, save } from './storage.js';

const q = new URLSearchParams(location.search).get('lang');
if (q === 'en' || q === 'ja') save('lang', q);
const pref = load('lang', 'auto');
export const LANG = pref === 'en' || pref === 'ja' ? pref : (navigator.languages?.[0] || navigator.language || 'ja').toLowerCase().startsWith('ja') ? 'ja' : 'en';
export const langPref = () => load('lang', 'auto');
export function setLang(v) { save('lang', v); location.reload(); }

const EN = {
  // タイトル・共通
  '無料・インストール不要で遊べるブラウザ音ゲー': 'A free browser rhythm game — no install needed',
  '遊び方・収録曲': 'How to play & songs', '実況・配信ガイドライン': 'Streaming guidelines', '曲のまとめ': 'Song collections', '更新履歴': 'Changelog',
  '設定': 'Settings', 'チュートリアル': 'Tutorial', 'リクエスト': 'Feedback', '管理': 'Admin', '閉じる': 'Close',
  '← 戻る': '← Back', '← ホーム': '← Home', 'ホームへ': 'Home', 'あとで': 'Later', 'スタート': 'Start', '読み込み中…': 'Loading…',
  '↻ 更新': '↻ Refresh', '決定': 'OK', '削除': 'Delete', 'やめる': 'Cancel', 'もう一度': 'Again',
  'コイン': 'Coins', 'アカウント': 'Account', '遊び方を練習': 'Practice how to play', '追加してほしい機能・曲・不具合などを送る': 'Send requests and bug reports',
  '管理者ページ': 'Admin page', '一時停止': 'Pause', '読み込み中': 'Loading',
  // ホーム
  'ライブ': 'LIVE', 'ひとりでライブ ・ みんなでライブ': 'Solo live ・ Multiplayer live',
  '編成': 'Team', 'キャラ5人でスキルを組み合わせる': 'Combine skills with 5 characters',
  'ガチャ': 'Gacha', 'コインで★1〜★4のキャラを集める': 'Collect ★1–★4 characters with coins',
  'クエスト': 'Quests', 'デイリーと実績でコインをもらう': 'Earn coins from daily quests and achievements',
  'シーズン・着せ替え': 'Season & skins', '遊んでXPをためて報酬をもらう': 'Play to earn XP and rewards',
  'みんなの譜面': 'Community charts', '投稿された譜面を遊ぶ': 'Play charts made by players',
  '譜面メーカー': 'Chart maker', '自分で譜面を作って投稿': 'Make and share your own charts',
  'きくだけ': 'Listen', 'オリジナル曲を音楽プレーヤーで聴く': 'Listen to the original songs',
  'はじめての人は チュートリアル ▶': 'New here? Tutorial ▶',
  'ひとりでライブ': 'Solo live', '好きな曲と難易度を選んでプレイ。自己ベストとオンラインランキングに挑戦': 'Pick a song and difficulty. Beat your best and climb the online ranking',
  'みんなでライブ': 'Multiplayer live', '最大8人で同じ曲を同時にプレイ。みんなのコンボを見ながら、編成込みのスコアで勝負': 'Up to 8 players play the same song at once. Watch everyone’s combo and compete on team score',
  '段位道場': 'Dan course', '4曲を続けてプレイ。体力が0にならずに最後まで行けたら合格。初段〜十段、皆伝まで': 'Play 4 songs in a row without running out of life to pass. From 1st dan up to Kaiden',
  '今日の1曲': 'Song of the day', 'コースモード': 'Course mode', '好きな曲を2〜6曲選んで、体力つきで続けてプレイ。リンクで友だちとコースを共有': 'Pick 2–6 songs and play them in a row with a life gauge. Share the course with a link',
  '今週のスコアアタック': 'Weekly score attack', '🏆 殿堂を見る': '🏆 Hall of fame',
  'ランダムマッチ': 'Random match', 'ルームコードなしで、レートの近い相手とすぐ1対1。曲は2人の実力に合わせて自動で決まります。勝つと80コイン': 'Instant 1v1 against a player with a similar rating. The song is picked for both of you. Win 80 coins',
  'シーズンパス': 'Season pass', '着せ替え': 'Skins', 'プロフィール': 'Profile', 'フレンド': 'Friends', 'ログイン / 新規登録': 'Log in / Sign up',
  'ログインすると 編成・ガチャ・クエスト・みんなでライブ が遊べます(はじめに 1000 コイン)': 'Log in to unlock team, gacha, quests and multiplayer (1000 coins to start)',
  // 選曲
  '標準の順': 'Default order', 'レベル順(選択中の難易度)': 'By level (selected difficulty)', 'レベル高い順': 'Level: high to low', 'BPM遅い順': 'BPM: slow to fast',
  'BPM速い順': 'BPM: fast to slow', '名前順': 'By name', '自己ベスト高い順': 'Best score: high to low', '自己ベスト低い順': 'Best score: low to high',
  '☆ お気に入りにする': '☆ Add to favorites', '🔗 この曲のURLを共有': '🔗 Share this song', '⧉ 埋め込みコード': '⧉ Embed code', 'みんな': 'All',
  '↑↓ 曲を選ぶ ・ ←→ 難易度 ・ Enter プレイ ・ ゲーム中 Esc で一時停止': '↑↓ Song ・ ←→ Difficulty ・ Enter Play ・ Esc to pause in game',
  '音声ファイルをドロップして譜面を生成': 'Drop an audio file to generate a chart',
  '曲名・ジャンルで検索': 'Search by title or genre', '曲を検索': 'Search songs', '並び順': 'Sort', 'この曲のURLをコピー/共有': 'Copy / share this song’s URL',
  'ブログやサイトに貼れる埋め込みコードをコピー': 'Copy embed code for your blog or site', '更新': 'Refresh',
  'まだ記録がありません。一番乗りしよう': 'No records yet. Be the first!', 'ランキングを取得できませんでした': 'Could not load the ranking',
  // リザルト
  '画像で共有': 'Share image', '選曲へ': 'Song select', 'リトライ': 'Retry', '再開': 'Resume',
  // ガチャ・編成・クエスト
  'デイリー': 'Daily', '実績': 'Achievements', '点群の奥から新しいユニットを呼び出す': 'Summon new units from the point cloud',
  '1回': '1 pull', '10連': '10 pulls', 'ラインナップ': 'Lineup', 'おまかせ編成': 'Auto team', 'すべて外す': 'Remove all', '所持キャラ': 'Your characters',
  'レア度順': 'By rarity', 'スキルが強い順': 'By skill', 'Lv順': 'By level', '図鑑番号順': 'By number', 'キャラ名で検索': 'Search characters', 'キャラを検索': 'Search characters',
  // みんなでライブ・譜面
  'みんなで同じ曲を同時にプレイ': 'Play the same song together', '＋ ルームを作る': '+ Create room', '(曲はルームの中で選べます)': '(Pick the song inside the room)',
  '参加': 'Join', '公開中のルーム': 'Open rooms', '遊び方': 'How it works', 'ライブ スタート!': 'Start live!', 'ルームを抜ける': 'Leave room',
  'ルームコード': 'Room code', '一覧を更新': 'Refresh list', 'コードをコピー': 'Copy code',
  '1. だれか1人が「ルームを作る」→ 出てきた5文字のルームコードを友だちに送る': '1. One player creates a room and sends the 5-letter room code to friends',
  '2. ほかの人は「公開中のルーム」から選ぶか、ルームコードを入れて「参加」': '2. Others pick it from “Open rooms” or enter the code and press “Join”',
  '3. ホストが曲を選んで「ライブ スタート!」。全員同時に曲が始まります': '3. The host picks a song and presses “Start live!”. Everyone starts at the same time',
  '＋ 譜面を作る': '+ Make a chart', '新着順': 'Newest', 'プレイ数順': 'Most played', 'いいね順': 'Most liked', '自分の譜面': 'My charts',
  'タイトル・作者で検索': 'Search by title or author', '譜面を検索': 'Search charts',
  // 設定
  '演出の強さ': 'Effects', '叩いた時に上へ伸びる光': 'Hit beams', 'MV(背景の映像)': 'Music video background', 'ハイスピード': 'Note speed',
  'BGM 音量': 'Music volume', 'タップ音 音量': 'Tap sound volume', 'レーン幅': 'Lane width', '判定ライン位置': 'Judgment line position',
  'レーン配置': 'Lane option', '通常': 'Normal', 'MIRROR(左右反転)': 'MIRROR', 'RANDOM(毎回入れ替え)': 'RANDOM', '見え方': 'Visibility',
  'HIDDEN(手前で消える)': 'HIDDEN (notes fade near the line)', 'SUDDEN(奥が隠れる)': 'SUDDEN (far side hidden)', '配信者モード': 'Streamer mode',
  'オフ': 'Off', 'オン': 'On', 'オン(グリーンバック)': 'On (green screen)', 'ゴースト(自己ベストとの差を表示)': 'Ghost (gap to your best)',
  '判定タイミング': 'Timing offset', '叩くのが遅めならプラス。音に合わせて叩くだけで測れます': 'Use plus if you tend to hit late. Tap along to measure it',
  '自動で合わせる': 'Auto-adjust', 'キー配置': 'Key config', '初期値': 'Default', 'ゲスト名': 'Guest name', '初期値に戻す': 'Reset to default',
  'ゲームパッド: ←/LB=D ・ ↓↑/LT=F ・ X A/RT=J ・ B Y/RB=K ・ START=一時停止(メニューは十字キーとA/B)': 'Gamepad: ←/LB=D ・ ↓↑/LT=F ・ X A/RT=J ・ B Y/RB=K ・ START=pause (menus: D-pad and A/B)',
  'キー配置のプリセット': 'Key presets', '未ログイン時のランキング名': 'Ranking name when not logged in', '空でもOK': 'Optional',
  '言語 / Language': 'Language / 言語', '自動(ブラウザに合わせる)': 'Auto (browser)',
  'プレイ中の背景にMV(曲に合わせた映像)を流します。MVマークの曲は特製MV、ほかの内蔵曲はジャンルに合わせた映像': 'Show a music video behind the notes. Songs marked MV have a special video; others get one that matches the genre',
  '配信・録画向け: スコアとコンボを大きく、みんなでライブの参加コードを画面に出します。グリーンバックは背景を緑にして配信ソフトで抜けるようにします': 'For streaming: bigger score and combo, and the room code on screen. Green screen makes the background green for chroma key',
  // チュートリアル・ランダムマッチ
  '対戦相手をさがしています…': 'Looking for an opponent…', '約1分': 'About 1 min', 'はじめてですか?': 'First time here?',
  'ゆっくりの練習曲で、遊び方をひとつずつ覚えられます。': 'Learn the basics step by step with a slow practice song.',
  '光る線に重なったら押す': 'Hit when notes reach the glowing line', '流れてくる順に押す': 'Hit them in order', '同時押し': 'Chords',
  'ロングノーツ(押しっぱなし)': 'Long notes (hold)', '判定とコンボ': 'Judgments and combo', 'チュートリアルを始める': 'Start tutorial',
  'ホーム右上の「チュートリアル」からいつでもできます': 'You can open it anytime from “Tutorial” at the top right of Home',
  'チュートリアル完了!': 'Tutorial complete!', '曲を選んで遊ぶ': 'Pick a song',
  'これで準備OK。まずは「ひとりでライブ」で EASY の曲から遊んでみよう。ログインするとコインがもらえて、ガチャや「みんなでライブ」も遊べます。': 'You are ready! Try an EASY song in “Solo live”. Log in to get coins and unlock gacha and multiplayer.',
  // お問い合わせ・アカウント
  'お問い合わせ': 'Feedback', 'リクエスト・お問い合わせ': 'Requests & feedback', '内容': 'Message', '名前(任意)': 'Name (optional)', '送信': 'Send', '送ったリクエスト': 'Your requests',
  '追加してほしい機能・曲、改善してほしい所、不具合などを気軽に送ってください。全部読んでいます。返信や対応状況は、この画面の下に出ます。': 'Send us feature or song requests, ideas and bug reports. We read everything. Replies appear at the bottom of this screen. (Japanese or English is fine.)',
  'ログイン': 'Log in', '新規登録': 'Sign up', 'プレイヤー名': 'Player name', 'パスワード': 'Password', 'パスワード(確認)': 'Password (again)', 'ゲストで遊ぶ': 'Play as guest', 'ログアウト': 'Log out',
  'ログインするとコイン・ガチャ・編成・クエストが使え、データはサーバーに保存されて別の端末からも続きを遊べます。': 'Log in to use coins, gacha, teams and quests. Your data is saved online so you can continue on other devices.',
  'MUSIC LiDAR をフルで遊ぶ ↗': 'Play the full MUSIC LiDAR ↗', 'MUSIC LiDAR オリジナル': 'MUSIC LiDAR originals',
  'スペース 再生/停止 ・ ←→ 前/次の曲': 'Space play/pause ・ ←→ prev/next', '判定タイミングの自動調整': 'Auto timing adjustment',
  // 選曲の絞り込み・称号など(JS が出す短い文字)
  'すべて': 'All', 'Lv10以上': 'Lv10+', '★ お気に入り': '★ Favorites', '未プレイ': 'Unplayed', '未フルコンボ': 'Not FC yet', 'フルコンボ済': 'Full combo',
  '効果なし': 'No effects', '編成: 効果なし': 'Team: no effects', 'まだプレイしていません': 'Not played yet',
  'ルーキー': 'Rookie', 'ブロンズ': 'Bronze', 'シルバー': 'Silver', 'ゴールド': 'Gold', 'プラチナ': 'Platinum', 'ダイヤ': 'Diamond', 'マスター': 'Master', 'グランドマスター': 'Grandmaster', 'レジェンド': 'Legend',
  'ホーム': 'Home', 'リザルト': 'Result', 'ブラウザで遊べる無料4キー音ゲー(リズムゲーム)': 'Free 4-key browser rhythm game', '承認': 'Accept', '断る': 'Decline', '申請する': 'Send request', 'プレイヤーの名前': 'Player name',
  'ログインして受け取る': 'Log in to claim', '受け取った!': 'Got it!', 'このページのリンクをコピー': 'Copy link to this page', 'リンクをコピー': 'Copy link',
  '再生位置': 'Position', 'シャッフル': 'Shuffle', '前の曲': 'Previous', '再生': 'Play', '次の曲': 'Next', 'くり返し': 'Repeat',
};

const ATTRS = ['title', 'placeholder', 'aria-label'];
const JP = /[぀-ヿ一-鿿]/;

function tText(node) {
  const v = node.nodeValue;
  if (!v || !JP.test(v)) return;
  const k = v.trim().replace(/\s+/g, ' ');
  const en = EN[k];
  if (en) node.nodeValue = v.replace(v.trim(), en);
}
function tEl(el) {
  for (const a of ATTRS) { const v = el.getAttribute?.(a); if (v && EN[v.trim()]) el.setAttribute(a, EN[v.trim()]); }
}
function walk(root) {
  if (root.nodeType === 3) { tText(root); return; }
  if (root.nodeType !== 1 || root.tagName === 'SCRIPT' || root.tagName === 'STYLE') return;
  tEl(root);
  const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = it.nextNode(); n; n = it.nextNode()) { if (n.nodeType === 3) tText(n); else tEl(n); }
}

if (LANG === 'en') {
  document.documentElement.lang = 'en';
  document.body.classList.add('lang-en');
  walk(document.body);
  // タブの題名(「ホーム｜MUSIC LiDAR」など)も、｜で区切った部分ごとに置き換える
  const tEl2 = document.querySelector('title');
  const tTitle = () => { const parts = document.title.split('｜'); if (parts.some((x) => EN[x])) document.title = parts.map((x) => EN[x] || x).join('｜'); };
  tTitle();
  if (tEl2) new MutationObserver(tTitle).observe(tEl2, { childList: true, characterData: true, subtree: true });
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') tText(m.target);
      else if (m.type === 'attributes') tEl(m.target);
      else for (const n of m.addedNodes) walk(n);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

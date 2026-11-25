# MUSIC LiDAR の仕組み(作業前にまずこれを読む)

このファイルは、コードを毎回読み直さなくても全体がわかるようにするための解説です。

- **書いていないことが必要になったら、コードを読んでこのファイルに追記する。** 仕組みを変えたら、同じコミットでここも直す
- コードと食い違っていたら、コードが正しい。気づいたらここを直す
- 最終更新: 2026-11-25(1.92.2 時点)

---

## 1. 全体像

| 項目 | 内容 |
|---|---|
| 何か | ブラウザで遊ぶ4キー音ゲー。奥から来るノーツを D F J K(スマホはタップ)で叩く |
| 制作者の表記 | **かるわか**(ページの「制作:」・JSON-LD の author など)。kaikomziu は GitHub のアカウント名なので、制作者名としては使わない |
| 公開URL | https://music-lidar.com/(GitHub Pages。リポジトリ kaikomziu/music-lidar の main ブランチ直下をそのまま配信) |
| 旧URL | https://kaikomziu.github.io/music-lidar/ → GitHub が新URLへ301で転送する(パスとクエリはそのまま) |
| フロント | 素の HTML / CSS / ES Modules。ビルドなし(`tools/release.py` がバージョン付けとページ生成だけ行う) |
| サーバー | Supabase(プロジェクト `kifnzvktwbomxthzvvgy`)。テーブルは `mlidar_*`。ブラウザは RPC(`/rest/v1/rpc/<関数名>`)だけを呼ぶ |
| 曲 | ほとんどは `js/songs/*.js` の楽譜データから Web Audio でその場で合成するオリジナル曲。少しだけ音源ファイルの曲がある |
| 譜面 | 曲のイベント(キック・メロディなど)から `composer.js` が自動生成する。手作りの譜面(fixedCharts)も使える |

### ドメインまわり
- DNS は Xserverドメイン(NS は ns1〜3.xdomain.ne.jp)。`@` に A レコード 185.199.108〜111.153 の4つ、`www` は CNAME で kaikomziu.github.io
- リポジトリ直下の `CNAME` ファイル(`music-lidar.com`)と、GitHub Pages の設定(custom domain・HTTPS必須)で配信している
- **旧URLからの引っ越し**: ブラウザの保存領域(localStorage)はアドレスごとに別なので、`index.html` の先頭のスクリプトで引き継ぐ
  1. music-lidar.com を初めて開いた人(`mlidar:moved` がない)は、`https://kaikomziu.github.io/game-links/mlidar-move.html?ret=…` に1回だけ飛ぶ
  2. そのページ(旧アドレス側。リポジトリは game-links)が `mlidar:*` と `ka_session` を読み、`#mlmove=<base64url の JSON>` を付けて戻す。戻す先は music-lidar.com と www だけ
  3. 戻ってきたら、まだない値だけ保存して `mlidar:moved=1` を立て、URL の # を消す
  - 埋め込み(`?embed`)・iframe の中・検索ロボットのときは飛ばない。戻れなかったときは sessionStorage の `mlidar:moveTry` で2回目は飛ばない
  - `?invite=` などのクエリは往復しても残る

---

## 2. フォルダ構成

| 場所 | 中身 |
|---|---|
| `index.html` | ゲーム本体のHTML(全画面・全モーダルが入っている)。先頭に「引っ越し」と「バージョン確認」のスクリプト |
| `css/style.css` | 全部のCSS(1ファイル) |
| `js/` | ES Modules。役割は「4. モジュール一覧」 |
| `js/songs/` | 内蔵曲。`index.js` が曲の並び順。`kit.js` は曲づくりの部品。`*.data.js` は音源ファイル曲の譜面データ |
| `home/` `live/` `gacha/` など | 画面ごとのURL用のページ。中身は `index.html` のコピー(`tools/build-pages.mjs` が作る。直接編集しない) |
| `music/<urlId>/` | 曲ごとのページ(SEO用)。これも自動生成。`og.png`(前に作った16曲ぶん)か `og.jpg`(`tools/og.html` で作る)があれば og:image になる(og.png が優先)。**曲を足したら og.jpg も作る** |
| `collections/` | 曲のまとめページ(自動生成。定義は `tools/collections.mjs`) |
| `guide.html` | 遊び方と全曲一覧(曲の行は自動で更新される) |
| `submit-music.html` | 作曲者さん向けの楽曲募集ページ(日本語・英語)。フォームは `mlidar_request_send`(種類 `song`、本文の頭に【楽曲の応募】)で、管理者ページのお問い合わせに届く |
| `card.html` | ブログに貼る軽い「曲カード」(`?s=<urlId>`、`&theme=light`)。ゲーム本体は読まず、`data/cards.json` と曲の共有画像だけを使う |
| `data/cards.json` | 曲カード用の曲の一覧(自動生成。`build-pages.mjs`) |
| `music-guidelines.html` | オリジナル曲の使用ガイドライン(動画・配信の BGM・ゲーム・アレンジ・収益化 OK、クレジット必須、音源の再配布は NG だが Scratch の作品は OK、音源は公開では配らず「きくだけ」の録音で使ってもらう。mp3 がほしい人はページのフォームから申請 → `mlidar_audio_request` がメールアドレスを pgcrypto で暗号化して `mlidar_requests.email_enc` に保存(鍵は Supabase Vault の `mlidar_request_key`。`kind = 'audio'`)。管理者ページの「リクエスト・お問い合わせ」で復号して表示され、メールで音源を送る)。クレジットページ・遊び方・配信ガイドラインからリンク |
| 公式Discord | 招待リンク https://discord.gg/aMnvqcHzNG(期限なし・#ルール チャンネル行き)。タイトル画面の参加ボタン(`.btn-discord`)と下のタスクバー(`.title-links`)、ホームのドックの「公式Discord」(`a.h-tile.h-discord`)、`guide.html` の案内枠(`.dc-banner`)、`guide.html`・`streaming.html`・`credits.html`・`submit-music.html`・`music-guidelines.html` のお問い合わせの近くに載せている |
| `credits.html` | クレジットページ(ほかの作者さんの曲・フォント・ライブラリ)。外部の曲を足したら表に足す。タイトル画面・ガイド・楽曲募集のリンクから入る |
| `streaming.html` | 実況・配信ガイドライン(日本語と英語)。外部の曲12曲の収益化の扱いもここに書いてある。外部の曲を足したら表に足す |
| `audio/` `video/` | 音源ファイル曲の音・動画MV。ライセンスの都合で並べ替えた `.bin`(`tools/scramble_audio.py`)か、AES-GCM で暗号化した `.bin`(`tools/encrypt_audio.mjs`)。**平文の mp3 / mp4 は絶対にコミットしない**(2026-11-18 に履歴から取り除き、強制 push 済み。鍵は公開JSにあるので完全な防止ではない) |
| `sw.js` | Service Worker(オフライン対応)。ページはネット優先、`?v=` 付きの JS・CSS・画像はキャッシュ優先 |
| `version.json` | 今のバージョン。ページが起動時に読み、HTMLが古ければ `?v=` を付けて読み直す |
| `sitemap.xml` | 自動生成 |
| `supabase/functions/mlidar-daily/` | Edge Function(Daily.co の SFU 部屋を発行。今は使っていない) |
| `supabase/functions/mlidar-audio/` | Edge Function(譜面メーカーで管理者が選んだ音声の置き場所を発行・確認・削除。下の「自分で選んだ音声」) |
| `tools/` | `release.py`(公開前に必ず実行)、`build-pages.mjs`、`collections.mjs`、`export.py` / `export.html`(mp3・mp4 書き出し)、`scramble_audio.py`、`promo.py` / `promo.html` / `promo-plan.json`(TikTok などの宣伝動画。下の「宣伝動画」)、`og.html`(曲ごとの共有画像。受け取って保存するローカルサーバー `og_save_server.py` と一緒に使う。手順はファイルの先頭)、`make_zh_hant.py`(繁体字の辞書を簡体字から作る) |
| `AI_GUIDE.md` | ほかの仕組みが自動で作るメモ。**コミットしない** |

---

## 3. 起動から画面表示まで

1. `index.html` の先頭のスクリプト: 旧URLからの引っ越し(上の 1. を参照)
2. 次のスクリプト: `version.json` を `no-store` で読み、`<meta name="app-version">` と違えば `?v=` を付けて読み直す(古いHTMLと新しいJSが混ざらないように)
3. import map で全モジュールに `?v=<バージョン>` を付けて読む(`release.py` が書き換える)。`<!--PRELOAD-->` の `<link rel="modulepreload">` で、main.js から静的に import される全モジュール(約170)を最初に並行して読み始める(import をたどると5段の待ち合わせになるため。これも `release.py` が作る)
   - Google Fonts の CSS は `rel="preload" as="style"` で読み、表示を止めない
4. `js/main.js` が起動する
   - `SONGS`(js/songs/index.js)から曲一覧 `entries` を作る。期間限定曲は `eventActive()` のときだけ入れる
   - **内蔵曲の曲データと譜面は、使うときにはじめて作る**(`builtinEntry` の `charts` / `stats` / `duration` / `onsets` はゲッター)。起動後は `prepareIdle()` が手の空いたときに1曲ずつ作る。全曲まとめて作ると起動に 0.5〜1秒(スマホでは数秒)かかるので、**全曲の `e.charts` などを一度に触る処理を書かない**(曲があるかの判定は `e.levels` で行う)
   - 起動画面(`#boot`)は main.js の最後で `__bootDone()` を呼ぶと消える。ロゴの演出のため、最低 0.9 秒は表示する
   - 曲ページ(`<meta name="song-id">` がある)から来たら、その曲を選んだ状態にする。**ただし、ログインしていない人はトップ(タイトル画面)として扱う**(埋め込みは別)
   - `initGrowth` / `initMatch` / `initInstall` / `initKeyConfig` / `initDan` / `initExtras` などで各機能を初期化する
   - Service Worker を `ROOT_PATH + 'sw.js'` で登録する(埋め込み時は登録しない)
5. タイトル画面で Enter(またはタップ)を押すと音が使えるようになる(ブラウザの自動再生の制限のため。テストで音を読ませるときも、本物の操作が要る)
   - **ホーム画面(2026-11-25〜、案2)**: 大きい LIVE(`#h-live`)と、その下のアイコンの列(ドック `#h-dock`)。ドックの中身は前と同じタイル(`.h-tile`。`data-nav`・`id`・`need-login` もそのまま)で、CSS だけでアイコン+名前にしている。並びは CSS の `order`(先頭にライブ `#h-dock-live`(押すと `#h-live` と同じ)→ みんなの譜面・譜面メーカー・きくだけ → ログインが要る4つ → Discord)。説明文(`p`。JS が書き換える)は乗せたときの吹き出し(スマホでは出さない)。ログインが要るものはうすくしてアイコンの角に 🔒、ログインしていないときだけ下に「🔒 の4つはログインで遊べます」(`#h-dock-note`、ボタンでログイン画面)。ドックの角を切る形は `::before` で描く(ドックに clip-path を付けると吹き出しが切れるため)。スマホは5つ×2段
   - **ホームの大きい枠のスライド(2026-11-25〜)**: `js/home-hero.js` の `initHomeHero`。`#h-hero` の中で LIVE(`#h-live`)と、ドックの8つの機能の大きいスライド(`.h-slide-feature`。左に名前、右に大きなアイコン)を5秒ごとに切り替える。スライドを押すとドックの同じタイルを `click()` するので、動きは今までと同じ(ログインが要るものはログイン画面)。説明文とログインの状態は見せるたびにタイルから写す。下の細い棒(`#h-hero-bars`)で今の1枚と残り時間を出し、押すとその1枚へ。ドックでは今の機能のアイコンを光らせる(`.h-cur`。LIVE のときは先頭の「ライブ」)。マウスを乗せている間・枠の中にフォーカスがある間・タブが隠れている間・ホーム以外では進めない
   - **選曲画面(2026-11-25〜、案4)**: 曲の一覧はジャケットのグリッド(`#song-list` が `display: grid`、`grid-auto-rows: max-content`。overflow: hidden のタイルは行の高さが 0 になるため)。曲カード(`.song-card`)の中身は前と同じで、CSS でジャケットを全面に、曲名を下に、☆ を左上に、レベルを右上に出す。レベルは今の難易度のもの(`renderList` が付ける `.lv.cur`。EXTRA などがない曲は `dOf(e)` のもの)だけ。絞り込みのボタン(`#song-filters`)は「絞り込み」(`#btn-filter`)を押したときだけ出し、絞り込んでいる数をボタンに出す(`#bf-n`)。右の引き出し(`#detail`)は大きいジャケット(16:10 に切り抜き)→ 曲名 → 難易度 → PLAY → 小さいボタン4つ(`#d-tools`、2×2)→ ランキング。スマホは3列で、詳しい情報は今までどおり下の引き出し(「記録・ランキング」で `#d-tools` も出る)。キー操作は前と同じ(↑↓ で曲、←→ で難易度)
   - **リザルト画面(2026-11-25〜、案3)**: `.result-panel.r3` は画面いっぱいの grid(上の帯 `.r-top` に曲名・難易度・日時 / `.r-cols` の3列 / 下の帯 `.r-buttons`)。左の列(`.r-col-l`)はジャケットを列幅の正方形で出し、その下にランクと FULL COMBO などの帯(`#r-banner`)。真ん中(`.r-col-c`、はみ出すと縦にスクロール)は NEW RECORD → スコア → 精度・コンボ → 判定の数(左の線は判定の色。`onGameEnd` が各マスに `--jc` を付ける)→ グラフ → コイン・成長 → デイリーなど。右(`.r-col-r`)はランキング(`#r-online`。「ONLINE RANK #N」の #N を大きく出す)と「次はこれがおすすめ」(`#r-next`)。中身が空の行(NEW RECORD でないとき・ログインしていないときのコインなど)は場所を空けない。要素の id は前と同じなので JS は並びを知らない。1100px 以下は右の列を下に回し(`grid-auto-rows: max-content`)、760px 以下は全部1列で、ボタンは共有などを3つずつ小さく・RETRY(1/3)と「選曲へ」(2/3)を一番下に。パネルの grid は `grid-template-columns: minmax(0, 1fr)` にしておく(列が `auto` だと、叩いたずれの分布のボタンなど縮まない中身に合わせて画面より広がり、スマホで右が見切れる)
   - **LIVE のモード選択(2026-11-25〜、案4)**: `#home-live` の `.hl-body` は左にメニュー(`#hl-menu`)、右にカード(`.hl-cards`)。メニューは `main.js` の `liveMenu` が8つのカードから作る(並び: ひとり・みんな・ランダムマッチ・今日の1曲・スコアアタック・段位・コース・レベル診断)。アイコンはカードの `.hl-ico` を `hl-card <種類> hl-mini` の入れ物に入れて縮める(形の CSS が `.hl-card.<種類>` に書いてあるため。入れ物は `all: unset`)。右は選んでいるカード(`.cur`)だけを大きく出し、`.h-go` を START ボタンの見た目にする。マウスは乗せると選び押すと始まる / タッチは1回目で選び2回目(か START)で始まる(`pointerdown` の時点で選ばれていたかで分ける)/ キーは ↑↓ で選び Enter、数字キー 1〜6 は前と同じ。スコアアタックは押すと難易度ボタンにフォーカスを移す。開くたびに 🔒 と「今日の1曲」の曲名・スコアアタックの残り時間をカードから写す(`sync`)。スマホは上にカード、下にメニューを2列
   - **スマホのウィンドウの × (2026-11-25〜)**: 760px 以下で、開いているウィンドウ(`.overlay.modal.on`。`#tb-window` は除く)の右上に、固定の × (`.modal-x`。`main.js` が body に1つ作る)を出す。押すと、そのウィンドウの `[data-close]` / `[data-em-close]` か、`.modal-actions` の「閉じる・やめる・あとで・キャンセル・受け取った!」のボタンを `click()` する(閉じ方はウィンドウごとに今までどおり)。そういうボタンがないウィンドウでは出さない。出す・消すは `MutationObserver`(class と hidden の変化、1フレームにまとめる)で決める。× とウィンドウが重ならないよう、そのときは overlay の上を 64px 空ける
   - **全体のイージング(2026-11-25〜)**: `style.css` の末尾「全体のイージング」。曲線は `--ease-out`(すっと止まる)・`--ease-spring`(少し行き過ぎて戻る)・`--ease-in-out`。押せるもの全部(`:where(button, a, input…)`)の色・背景・枠・影・位置をなめらかに変え、カード類は乗せると少し浮く。画面に入ったときは topbar・中身(`.meta-body`・`.select-body`・`.home-body`・`.home-main`)・ドックのアイコン・LIVE のモード選択のカード・一覧(`.quest-list` `.rank-list` `.chart-list` など。10行目以降はまとめて)が順に出る。`:where()` で詳しさ 0 にしているので、個別に決めてある transition があればそちらが勝つ(ドラッグする編成の枠などは個別の速い transition のまま)。「動きを減らす」設定では出さない
   - **タイトルの登場演出(2026-11-25〜)**: `index.html` の `#title` の直後のインラインスクリプトと `<canvas id="intro-dots">`。起動画面の文字のロゴの代わりに、ドットが集まって真ん中に MUSIC LiDAR を作る。ドットの行き先は、真ん中へ `transform` で移した本物のロゴ(`.logo-big`)を1文字ずつ(`Range.getBoundingClientRect`)別のキャンバスに描いて拾うので、ロゴに変わるときにずれない(フォントの読み込み後・画面の大きさが変わったときは行き先を取り直す)。起動画面の `__bootDone` が `__introWait()`(集まり終わるまでの残り時間)だけ待ってから `__introGo()` を呼ぶ → `#title.logo-on` でロゴが光って出てドットが消える → ロゴを左上へ(CSS の transition は止まったままになることがあったので `element.animate`。1秒、イーズアウト)→ ロゴの移動が終わったら(`animate().finished`。念のため4秒で打ち切り)`#title.intro-done` でボタン類がロゴの下から順に出て、タスクバーが下からせり上がる。演出中は `body.intro`。タイトル以外の画面から始まるとき・埋め込み・「動きを減らす」設定のときは演出しない(すぐ `intro-done`)
   - タイトル画面の配置(2026-11-25〜、UI 全体の作り直しの1つ目): ロゴ(`.title-logo` の中の `.logo-big`・`.logo-rule`・ビルド表示 `.tele.tl`)は左上。`#title` は縦並びの flex で、スタートボタンなど(`.title-inner`)もロゴにそろえて左寄せ、ロゴのすぐ下にくっつける(`margin-top: 0`・`padding-top: 28px`、スマホは 22px)。サイト内リンク(遊び方・曲のまとめ・配信ガイドライン…更新履歴)は、画面の下に浮かぶ PC のタスクバー風のガラスの帯(`nav.title-links.title-taskbar`。角を切った HUD 風で、上の縁を光が流れる)。左にロゴのマーク(4本のレーンが揺れる `.tb-mark`。幅 1380px 以下の PC は文字を消してマークだけ)、まん中にアイコン付きのリンク(乗せると下の目印が伸びて光る)、右にバージョンの札と時計・日付(`#title-clock` / `#title-date`)。タスクバーの「更新履歴」(`#title-changelog`)はホームへ進まず、タイトルのまま上に重ねて開く。ほかのリンク(遊び方・曲のまとめ・配信ガイドライン・楽曲募集・クレジット)も、タイトルの上に PC のアプリ風のウィンドウ(`#tb-window`。中は iframe `#tbw-frame`、タイトルバーに「別のタブで開く」と閉じる)で開く。Discord(別のタブ)と Ctrl/Shift/中クリックはふつうに開く。ウィンドウの中でゲーム本体(`#stage` があるページ)へ移ったら、ウィンドウを閉じて画面ごとそこへ移る。Esc・外側のクリックでも閉じる(`closeModals` からも閉じる)。スマホではアイコンの下に名前を出し、横にスクロールする。時計は `main.js` がタイトル画面を出している間だけ10秒ごとに更新する。タスクバーの高さの分、下の飾りと角の枠を上げている。「いますぐ1曲遊ぶ」「公式Discordに参加」も PRESS ENTER と同じ HUD 風(角を切った枠・うすい塗り。差し色はピンクと Discord の青紫)。2026-11-25 に全体を大きくした(「タイトル: 全体的に大きく」。PC で高さ 860px 以下はロゴを画面の高さに合わせ、すき間を詰めてタスクバーに重ならないようにしている)。CSS は `style.css` の末尾「タイトル: ロゴを左上…」「ボタン類もロゴにそろえて左寄せ」。起動ログ(`.tele.bl`)は左のボタン類と重ならないよう右下(緯度経度の上)に置く

### 画面とURL
- 画面は `index.html` の `.screen` 要素で、`show(name)` が `.active` を切り替える。今の画面は `state`
- 画面ごとのURLは `main.js` の `SCREEN_URL`(`home/`, `live/`, `gacha/`, `charts/`, `quest/`, `team/`, `result/`, `settings/`, `account/`, `changelog/`, `listen/`, `admin/`, `dan/`, `maker/`)。`history.replaceState` で書き換えるだけで、ページ遷移はしない
- 選曲画面とプレイ中は、曲ページのURL(`music/<urlId>/`)にする
- パスはすべて `ROOT_PATH = new URL('./', document.baseURI).pathname` を基準にしている(曲ページは `<base href="../../">`)。**絶対パス `/music-lidar/` は使わない**

---

## 4. モジュール一覧(js/)

| ファイル | 役割 |
|---|---|
| `main.js` | 起動・画面切り替え・選曲・詳細・ランキング表示・プレイ開始・リザルト・キー入力の振り分け |
| `game.js` | プレイ本体(`class Game`)。判定・スコア・体力・描画(3D風レーン・点群 `PointCloud`)。キー配置(`DEFAULT_KEYS`, `setKeymap`, `laneOf`) |
| `audio.js` | Web Audio。内蔵曲のオフライン合成(`renderEvents`。1.87.0 からジャンルごとの楽器の組み合わせ `paletteOf` で音色を置き換える。下の「ジャンルごとの楽器」)、タップ音、試聴、音量。**別のタブを開いている間は音を出さない**(1.83.1〜。`visibilitychange` で AudioContext を止め、戻ったら止めたのが自分なら再開。`getCtx()` も隠れている間は再開しない。みんなでライブのプレイ中だけは時計がずれないよう止めずに音量を0。どちらにするか・再開してよいか〔ゲームを一時停止中なら再開しない〕は `main.js` が `setHiddenAudioPolicy` で渡す) |
| `audio-cache.js` | 合成した音を IndexedDB に保存。キーは「曲ID + 曲データのハッシュ + `SYNTH_VERSION`」。**音色を変えたら `SYNTH_VERSION` を上げる** |
| `external-audio.js` | 音源ファイル曲の読み込み(並べ替えの復元・失敗時の再試行) |
| `composer.js` | 曲の楽譜(トラッカー風)→ イベント列 → 譜面。`generateChart`、乱数 `mulberry32` / `hashStr` |
| `gimmick.js` | 譜面ギミック(停止・変速・隠し)。ノーツ位置は「スクロール量 S(t)」で決める |
| `analyzer.js` | 手持ちの音声ファイルから譜面候補を作る(オンセット検出と BPM 推定) |
| `mv.js` | 背景のMV。曲ごとの特製MV(`MVS`)、動画MV(`VIDEO_MVS`)、それ以外はジャンル別の自動MV |
| `jacket.js` | ジャケット画像の自動生成(画面に見えてから描く)。曲ファイルに `jacket`(リポジトリ直下からのパス。`img/jackets/<id>.jpg`・512×512)があればその画像を使う(今は a new world with form と MARETU さんの3曲。作者さんの許可を得たものだけ) |
| `storage.js` | localStorage の読み書き(キーの頭に `mlidar:`)、設定、端末内の自己ベスト |
| `account.js` | ログイン状態・アカウントの状態(`getState`)・かるわかGAMESアカウント連携 |
| `ranking.js` | `rpc()`(Supabase RPC 呼び出しの共通関数)、ランキングの取得と送信 |
| `meta.js` | ガチャ・編成・クエスト・アカウント画面 |
| `units.js` | キャラのアイコン(SVG)とスキルの説明 |
| `growth.js` | レート・称号・ログインボーナス・連続日数・シーズンパス・着せ替え画面・週替わりスコアアタック・曲の統計・プロフィール・招待・殿堂 |
| `skins.js` | 着せ替えの見た目と音(`LOOK`)。値段と入手方法はサーバーの `mlidar_skins` |
| `live.js` | みんなでライブ(WebRTC)。ランダムマッチの部屋もここで作る |
| `match.js` | ランダムマッチの相手探し(`mlidar_match_poll`) |
| `dan.js` | 段位道場(初段〜皆伝の11段) |
| `extras.js` | デイリーチャレンジ・コースモード・判定グラフ・共有画像・判定タイミングの自動調整・ゲームパッド |
| `maker.js` / `maker-api.js` | 譜面メーカーと「みんなの譜面」 |
| `replay.js` | リプレイ(入力の記録の符号化・端末とサーバーへの保存・読み込み) |
| `specials.js` | お正月おみくじ・周年記念ウィーク(ホームのお知らせ) |
| `tanabata.js` | 七夕の願いごとの短冊 |
| `lyrics.js` | 歌詞の読み込み・保存(サーバーの `mlidar_lyrics`)と歌い終わりの自動決め |
| `custom-audio.js` | 譜面メーカーで管理者が自分で選んだ音声(暗号化・アップロード・復号、曲のエントリー) |
| `player.js` | きくだけモード(音楽プレーヤー) |
| `event.js` | 季節イベント(クリスマス 12/1〜1/31。`?event=xmas` / `?event=off` で確認できる) |
| `keyconfig.js` | キー配置の設定 |
| `install.js` | 「ホーム画面に追加」の案内 |
| `friends.js` | フレンド(申請・承認・一覧・オンライン表示・フレンドランキング) |
| `badges.js` | 実績バッジ(記録から計算する。保存はしない) |
| `i18n.js` | 多言語表示(英語・韓国語・中国語。辞書で画面の文字を置き換える)。main.js の最初に読む。辞書は `EN`(この中)・`i18n-ko.js`・`i18n-zh-hans.js`・`i18n-zh-hant.js`(自動生成) |
| `social.js` | すぐ遊べる導線(いますぐ1曲)・次のおすすめ・X に投稿・デイリーの絵文字シェアと連続日数・オンラインのゴースト |
| `recorder.js` | プレイ動画の録画(縦 1080×1920・横 1920×1080。リプレイから書き出す「動画で保存」) |
| `season.js` | 季節イベント(春・夏・ハロウィン・クリスマス)のスコアアタック・限定の着せ替えとバッジ・季節の粒 |
| `poll.js` | 配信者モードの視聴者リクエスト投票 |
| `request.js` | お問い合わせ(リクエスト箱) |
| `admin.js` | 管理者ページ |
| `traffic.js` | 訪問とプレイの集計(来た元を見分けて `mlidar_hit` に送る) |
| `tutorial.js` | チュートリアル(専用のゆっくりの曲と手作りの譜面) |
| `loading.js` / `motion.js` | 読み込み画面 / 画面の動き |
| `changelog.js` | 更新履歴。**いちばん上が今のバージョン** |

---

## 5. 曲と譜面

### 曲ファイル(`js/songs/<id>.js`)
```js
export default {
  id: 'abyss-gate',          // 英小文字・数字・ハイフン。ランキングのキーなので変えない
  urlId: 'xfrpw4577',        // 曲ページのURL。英数字9文字くらいのランダム。公開後は変えない
  title, artist, genre, bpm, color,
  levels: { easy: 5, normal: 10, hard: 13 },
  preview: 128,              // 試聴を始める拍
  chart: { hard: { minGap, maxNps, chordP, ... } },  // 譜面の密度の調整(composer.js の PARAM を上書き)
  gimmicks: [{ beat, type: 'stop'|'speed'|'cover'|'hidden'|'sway', ... }],  // 任意。下の「譜面ギミック」
  event: 'xmas',             // 任意。期間限定曲
  compose(s) { ... },        // s.seq / s.drums / s.crash などでイベントを並べる。部品は kit.js
};
```
- 音源ファイル曲は `audio` / `bpm` / `offset` / `fixedCharts`(または `*.data.js`)を使う
  - 譜面は `tools/audiochart`(`analyze.py` → `tempo.py [BPMの下限 上限]` → `chart.py <wav> <出力> [T_END] [長さ] [曲名]`)で作る。`tempo.py` は引数なしなら 70〜200 を探す
  - **暗号化を求められた曲(かめりあさんの GHOST 2曲・MARETU さんの3曲(しう・ホワイトハッピー・ニャン。クレジットは作者さんの指定で「音楽：MARETU」、リンクは YouTube チャンネル))と Crying Red は `node tools/encrypt_audio.mjs 入力.mp3 audio/<id>.bin`** で AES-GCM 暗号化し、表示された `aes:...` を `audioKey` に書く(`external-audio.js` が `aes:` で始まる鍵なら復号する)。鍵は公開JSに入るので完全な防止ではない。m4a は Firefox でも鳴るように mp3 にしてから、埋め込みのジャケット画像を外して暗号化する
  - (1.83.0 からは GHOST も varied.py で作っている。以下は以前の作り方)**高難易度で裏の音も拾う譜面(GHOST 2曲の NORMAL・HARD)は `python tools/audiochart/layered.py <既存の.data.js> <T_END> <HARDの目標nps> <NORMALの目標nps>`**(chart.py のあと、同じ作業フォルダで)。左手(D・F)=低い音(キック・ベース)、右手(J・K)=中高い音(シンセ・声・ハット)で別々に拾って重ねる。8分まで・同じ手で8分が続けば2つのキーを交互・同じキーは 0.2 秒以上あける。NORMAL は同じ手の8分の連続を作らない。EASY は既存のまま
  - **繰り返しが多い曲で飽きない譜面にするときは `python tools/audiochart/varied.py <wav> <既存の.data.js> <T_END> normal=3,hard=5,extra=7`**(chart.py のあと、同じ作業フォルダで。指定した難易度だけ書き戻す)。
    - まず曲をイントロ・Aメロ・Bメロ・サビ・間奏・落ち・アウトロに区切る。自動(小節ごとの音量・左右の広がり・高音・低音・和音を測り、そろった区切りに分け、2回以上出てくるいちばん大きい音の組をサビ、その直前を Bメロ)は下書き程度なので、**曲ごとの区切りの表 `tools/audiochart/sections/<曲>.txt`(1行に「秒 区切り名」)を作り、`SECTIONS=表のパス` で実行する**。`SEC_ONLY=1` で区切りだけ表示。表を作るときは、小節ごとの音量と左右の広がりの変わり目を見る
    - 区切りごとの傾向(`STYLE`): Aメロ=歌を追う単音(HARD 以下は8分だけ)・同時押しなし・密度0.7倍 / Bメロ=階段・グルーヴ、最後の小節を詰める / サビ=1.4倍・拍の頭に同時押し(EXTRA は8分にも) / イントロ・間奏=トリルや刻み / 落ち=0.5倍 / アウトロ=軽め。実行すると区切りの種類ごとの密度と同時押しの割合を表示する
    - **2番以降のサビは1番サビの強化版**: 1番サビ(Aメロか Bメロのすぐあとの最初のサビ。曲の頭のサビ頭は数えない)の完成したノーツを小節ごとにそのまま写し、その上に自分で作ったノーツから「1番の15%×何番目か」だけ足す(1番に無い細かい刻みを先に、次に同時押し)。最後に同じレーンの間隔と同時押しの上限を確かめ直す
    - 区切りの中では4小節ごとに拾う音(melody・stairs・bass・hats・groove・trill)を変える。サビ以外は、同じ区切りの同じ位置で前回使った声部を避ける。同じ形の小節が直前8小節にあれば、左右反転・手の入れ替え・回転で変える。目標の密度に近づくまで数回やり直す
    - **音源曲は全部(34曲)、NORMAL・HARD・EXTRA・INFERNO をこれで作り、曲ごとに区切りの表を作る**(EASY はそのまま)。MARETU さんの3曲は 1.82.3 から、ほかの13曲は 1.83.0 から、ナツメダ ユキさんの6曲(時間旅行・日々の映画・動きだす他人・標めいた、・うつせみ は 1.88.0、雷と蜃気楼 は 1.88.1)、御箸ねくらぁ。さんの劇用BGM 9曲(1.89.0。blue fire は前半・後半の2ファイルを、1.89.1 で前半の12小節のあとに後半を1拍目がそろうようにつないで1曲にした。PeriTune さんの Sanctilia は 1.89.2。歌ありと inst があり、inst の音で譜面を作った。テンポの解析が半分の 70 に出たので 140 で合わせ直し、1拍目は強い音の位置に手で直した。作者さんのリンクはないので creditUrl なし)は追加したときから。これから足す音源曲も同じ。**新しい曲**は chart.py の NORMAL・HARD の密度を目標にし、EXTRA は HARD の1.5倍・INFERNO は EXTRA の1.3倍を目標にする。レベルは音源曲の密度とレベルの対応から推定して決める。目標の密度は今までの譜面と同じ(ノーツ数÷最後のノーツの秒)にして、レベルを変えない
    - 速い曲(BPM 200 以上、または `CHART_FAST=1`)は HARD・EXTRA も8分まで(NORMAL はもともと8分まで)
    - 目標の密度に届かないとき(遅い曲の EXTRA や GHOST の HARD のように、左右の手を重ねた同時押しが多かった譜面)は、区切りごとの差(`alpha`)を 1 → 0.6 → 0.3 → 0 と弱めて作り直し、2つ同時押しをどの位置にも入れてよくする
    - 今までの譜面のロングノーツを引き継ぐ: 同じ時刻のノーツをロングにする(のばしている間あいているレーンへ移してもよい)。近くにノーツがなければ、あいているレーンに新しく置く。置いたぶんで3%以上多くなれば全体を減らして作り直す。レーンがあかない所は引き継げない(shining-star・summer-triangle は3〜4割、inmu-king は約3分の2)
    - 区切りの表は、小節ごとの音量・左右の広がり・高音(6kHz〜)・低音(〜150Hz)の変わり目を見て決めた。耳では確かめていないので、ずれていると言われたら表を直して作り直す。歌のない曲(GHOST)は、盛り上げ=B・ドロップ=chorus・静かな所=break にした
  - 速い曲(BPM 200 前後より上)の譜面は `CHART_FAST=1 python chart.py …` で作る(HARD は8分まで・NORMAL は4分まで・EASY は2分まで、時刻は拍の格子どおり、同じキーの8分連打なし)。キーボードで叩ける細かさにするため
  - ライセンスで「取り出しにくくする」必要がある曲は `tools/scramble_audio.py` で並べ替えて `.bin` + `audioKey`。**CC BY の曲は技術的な制限をかけてはいけないので、並べ替えずに mp3 のまま置く**(`audioKey` なし。`.gitignore` の `!audio/<名前>.mp3` で個別に許す)
  - **OpenTracks の曲(SUMMER TRIANGLE)**: OpenTracks は、音楽ゲーム・リズムゲームでの利用を通常ライセンスの範囲外としている(2026-11-11 のお知らせ。範囲内に含めるかは検討中)。2026-11-11 より前に公開したゲームに入っている音源は、そこから3年をめどに使ってよい猶予がある。SUMMER TRIANGLE は 2026-10-23 に入れたので猶予の対象。**OpenTracks の曲を新しく足すのは不可**。2029-11 ごろまでに、OpenTracks の方針を確かめて、使い続けてよいか(または外すか)を決める。並べ替えて「通常の操作で取り出せない」形にしておくこと、「きくだけ」に入れないことも続ける
  - ほかの作者さんの曲を足したら、`credit`(と `creditUrl`)、**`credits.html`(クレジットページ)の表**、`streaming.html` の表、README のクレジットにも足す(タイトル画面と `guide.html` のフッターにはクレジットを書かず、クレジットページへのリンクだけ)
- 曲を足す手順: ファイルを作る → `js/songs/index.js` に import を1行 → `tools/og.html?ids=曲ID` で共有画像 `og.jpg` を作る(曲ページのフォルダが要るので、先に `python tools/release.py` を1回。og.html は画像を onload で待つので、ブラウザのペインが隠れていても動く) → `python tools/release.py`(曲ページとサイトマップができる)→ `python tools/export.py` で `D:\MUSIC_LiDAR_export` に mp3 / mp4 を書き出す
- 週替わりスコアアタックとデイリーは、曲一覧から乱数で選ぶ。**曲を足すと、選ばれる曲が変わることがある**

### 受信メール(管理者ページ)
- 公開している連絡先は `contact@music-lidar.com`。ドメインは Xserver ドメインで、DNS も Xserver(ns1〜3.xdomain.ne.jp)。MX を ImprovMX(mx1 / mx2.improvmx.com)に向け、ImprovMX が karubiwakame@gmail.com に転送する。遊び方・配信ガイドライン・クレジット・楽曲募集・使用ガイドラインのページに載せている(`data-mail="contact|music-lidar.com"` を開いたときに組み立てて mailto にする。迷惑メールを集めるプログラム対策)
- karubiwakame@gmail.com に届いたメールを、管理者ページの「受信メール」に出す。Gmail のアカウントに入れた Google Apps Script(`tools/gmail-to-mlidar.gs`)が5分ごとに受信トレイの直近2日のメールを `mlidar_mail_put` に送る(合言葉は Vault の `mlidar_mail_secret`。同じメールは `gmail_id` で1回だけ入る)
- **合言葉入りの Apps Script はリポジトリの外**(`C:\Users\4yoma\Desktop\Claude\music-lidar-private\gmail-to-mlidar.gs`)。リポジトリの `tools/gmail-to-mlidar.gs` は合言葉なしのひな形。合言葉を変えたら Vault の値と Apps Script の両方を直す
- 管理者は `mlidar_mail_list`(復号して新しい順に100通)・`mlidar_mail_read`(既読/未読)。返信はメールソフトで(mailto のリンク)

### 記念日・季節のイベント(1.72.0 で追加したもの)
| イベント | 期間(日本時間) | 中身 | 場所 |
|---|---|---|---|
| お正月おみくじ | 1/1〜1/7 | 1日1回。大吉 500 コイン + 判定ライン「初日の出」(`line_newyear`)/ 中吉 300 / 小吉 200 / 吉 100 / 末吉 50。ゲストは端末だけで引ける(報酬なし)。𝕏 でシェア | `specials.js`、サーバー `mlidar_omikuji`(`meta.omikuji` に日付と結果) |
| バレンタイン | 2/1〜2/14 | 季節イベント(`season.js` の `SEASONS.valentine`)。限定曲「Sweet Ribbon」(`sweet-ribbon.js`、`event: 'valentine'`)の HARD でスコアアタック、参加でノーツ「チョコ」(`note_choco`)。みんなでライブを2人で遊ぶと、結果にペアスコア(2人の合計)と相性(スコアの差から)を出す(`live.js`。対戦は除く)。ハートが降る | `season.js` / `live.js` |
| 七夕 | 7/1〜7/7 | 季節イベント(`SEASONS.tanabata`)。Space Waltz の EXTRA でスコアアタック、参加で判定ライン「天の川」(`line_tanabata`)。星がまたたき流れ星。お知らせの下にみんなの短冊が流れ、ログインした人は1年に1つ願いごとを書ける(40文字。書き直すと確認待ち)。**管理者ページで「出す」にした短冊だけ流れる** | `tanabata.js`、サーバー `mlidar_wishes` / `mlidar_wish_post` / `_list` / `_mine` / `_admin` / `_set` |
| 周年記念ウィーク | 10/17〜10/23(公開日 2026-10-17) | プレイのコイン2倍(`mlidar_play_result_core` が `mlidar_event_open('anniv…')` を見る)。記念プレゼント(年に1回): ノーツ「アニバーサリー」(`note_anniv`)+ ガチャ1回(`mlidar_anniv_gift` が100コイン足して `mlidar_gacha` を1回引く。結果は `meta.js` の `showGiftGacha`) | `specials.js` |
- 期間の判定はサーバーの `mlidar_event_open`(`newyear` / `valentine` / `tanabata` / `anniv` + 年)と、ブラウザの `event.js`(`WINDOWS`)・`season.js`(`SEASONS`)が同じ。期間外の確認は `?event=newyear` / `valentine` / `tanabata` / `anniv`(戻すときは `?event=off`。サーバーの報酬は本当の期間だけ)
- 季節イベントの `song` / `diff` でイベント曲と難易度を決められる(ないときは今までどおり乱数で HARD)。ランキングは今までどおり `ev-<イベントID>` の `hard` に入る
- バッジ「四季めぐり」は春・夏・ハロウィン・クリスマスの4つだけを数える

### エイプリルフール
- 日本時間の4月1日だけ、名前を「Booing LiDAR」(ブーイング ライダー)にする。`index.html` の起動画面のすぐ後のインラインのスクリプトで、起動画面のロゴ(MUSIC → BOOING)・タイトルのロゴ・左上の表示・タブの題名(`<title>` を MutationObserver で見張って置き換え)を入れ替え、ロゴの下に「ブーイング ライダー ・ 4月1日だけ」と出す。`window.APRIL_FOOL` が true になる
- ほかの日に確かめるときは `?event=aprilfool`(季節イベントと同じ `mlidar:eventPreview`。戻すときは `?event=off`)。曲ページ・共有画像・検索向けの情報(meta)は変えない

### 歌詞の表示(`lyrics.js`)
- 歌詞はサーバーの `mlidar_lyrics`(曲id → `[[歌い始めの秒, 歌い終わりの秒, 行], ...]`)に置く。読むのは `mlidar_lyrics_get`(だれでも)、歌詞のある曲の一覧は `mlidar_lyrics_songs`、保存は `mlidar_lyrics_save`(管理者だけ)
- 起動時に一覧を読み、歌詞のない曲は問い合わせない。曲を選んだときに先読みし、遊ぶ直前に最大 1.5 秒だけ待つ(`lyricsQuick`。遅ければ歌詞なしで始める)。曲ファイルに `lyrics` を書いた場合はそちらを使う
- プレイ中は画面の上に今の行を出し、歌っている所までを曲の色でぬる。次の行は4秒前から下に小さく出す(`game.js` の `drawLyrics`)。チュートリアルの字幕が出ている間は字幕を優先。設定の「歌詞を表示」(`settings.lyrics`)で消せる
- **時刻は管理者が譜面メーカーで合わせる**: 「🎤 歌詞」(管理者で、内蔵曲・音源曲のときだけ出る)→ 右側に歌詞の欄。歌詞を貼って「文字を反映」→ 再生しながら次の行の歌い始めで Enter。行をクリックすると、次に Enter で入れる行になる。時刻の数字を直接直す・右の列の黄色い線をドラッグする、もできる(前後の行は追い越さない)。「歌詞つきでテスト」で確かめ、「保存して公開」でみんなに出る。歌い終わりは保存のときに文字数と次の行から自動で決める(`fillEnds`)。保存前の作業は localStorage の `mlidar:lyrDraft:<曲id>` に残る
- 最初の時刻は `tools/audiochart/lyrics_align.py` で仮に合わせられる(歌声だけの音があれば精度が高い。暮らし泳ぐは全体の音から合わせた仮のもの)
- `?lyricsync=1` で、ゲームのプレイ中に Enter(スマホは画面の上のボタン)で時刻を記録してクリップボードにコピーする方法もある(サーバーには保存しない)
- **歌詞の表示にも作者さんの許可が要る**。送られた歌詞の権利は送った人が確かめる

### 譜面メーカーで自分で選んだ音声(`custom-audio.js`)
- **管理者だけ**が使える(`acc.isAdmin()`、サーバーでは `mlidar_is_admin`)。譜面メーカーの曲の選択の「自分で選んだ音声」→「＋ 音声ファイルを選ぶ…」
- 選んだ時点では手元で解析するだけ(推定 BPM・自動譜面の下敷き・録音補正の音の位置)。曲名・BPM・1拍目の位置を直して作り、**投稿したときに**音声を暗号化して置く
- 暗号化: ブラウザの WebCrypto で AES-GCM(256bit・音声ごとにランダムな鍵)。ファイルは `[iv 12バイト][暗号文]`。Edge Function `mlidar-audio` の `begin` が `mlidar_audio` に行(鍵つき・`uploaded=false`)を作って署名つきアップロードURLを返し、ブラウザが storage の公開バケット `mlidar-audio/<id>.bin` へ直接送り、`done` で `uploaded=true`。**暗号化前の音声はどこにも送らない**
- 遊ぶとき: `mlidar_audio_get` で鍵を受け取り、`.bin` を取ってきて復号する。鍵は遊ぶ人のブラウザに届くので、内蔵の音源の並べ替え(`audioKey`)と同じく「そのままでは取り出せない」ための仕組みで、完全な防止ではない
- 譜面の曲は `a:<音声id>`(`mlidar_charts_song_check` で許可。`mlidar_chart_save` は音声を置いた本人の管理者だけ通す)。曲一覧(`entries`)には入れず、`audioEntry(id)` で作るエントリー(`genre: 'UPLOAD'`・`local: true` なので曲のランキング・MV・コースの対象外)。みんなの譜面から遊べる
- 「音声を削除」で、音声のファイル・鍵・それを使う譜面(記録・いいねも)を消す(`mlidar-audio` の `delete`)。大きさは 25MB まで
- **使う音声の権利は管理者が確かめる**(だれでも遊べる場所に出るため)

### 譜面ギミック(`gimmick.js`)
| type | 内容 | to |
|---|---|---|
| `stop` | `beats` 拍のあいだノーツの流れが止まる(音楽は進む)。止まっている間のノーツは取り除く | なし |
| `speed` | 流れる速さを変える(`beats` > 0 ならその拍数でなめらかに) | 倍率(0.1〜4) |
| `cover` | レーンの奥を隠す(サドゥン) | 隠す割合(0で解除) |
| `hidden` | 判定ラインの手前でノーツが消える | 消える範囲(0〜0.6。0で解除) |
| `sway` | レーン全体が左右に揺れる(4拍で1往復)。タッチのレーン判定も一緒に動く | 揺れ幅(レーン幅の倍率。0で止まる) |
| `shift` | レーン全体を横へずらす(1.80.0〜)。タッチの判定も一緒に動く | ずらす量(レーン幅の倍率。0で真ん中) |
| `judge` | 判定ラインの高さを変える(1.80.0〜。設定の判定位置に足す。0.4〜0.95 に収める) | 画面の高さの割合(マイナスで上へ。0で戻る) |
| `flip` | 上下反転(1.80.0〜。画面の真ん中を軸に、潰れてからひっくり返る) | 1 で逆さま、0 で戻る |
| `spin` | 画面を回す(1.80.0〜。画面の真ん中を軸に。値は次のギミックまで残るので、360 で1回転して元どおり) | 角度 |
| `shake` | 画面が揺れる(1.80.0〜) | 強さ(0〜1。0で止まる) |
| `flash` | その拍で画面全体が白く光って一瞬で消える(1.80.0〜) | 強さ(0〜1。省略で 0.8) |
| `strobe` | 拍ごとに光る点滅(1.80.0〜。**光るのは1秒に3回未満**: 1拍が 1/3 秒より短い曲は2拍ごと) | 強さ(0〜1。0で止まる) |
- 曲ファイルは拍(`beat` / `beats`)、譜面メーカーは秒(`t` / `dur`)で保存する。`buildScroll` が `S(t)`(スクロール量)と `coverAt` / `hideAt` / `swayAt` を返す
- `cover` / `hidden` / `sway` は「値がなめらかに `to` へ変わる」同じ形(`level(type)`)
- **画面が動くギミック(1.80.0〜)**: `game.js` の `render` が、レーン床からパーティクルまでを `flip`(上下の拡大率 cos)・`spin`(回転)・`shake`(揺れ)の変換の中で描く(画面の真ん中が軸。HUD は動かさない)。`flash` / `strobe` は HUD の上に白を重ねる。`shift` は `swayX` に足し、`judge` は `geom()` の判定ラインの高さに足す。`laneAt(x, y)` は回転を戻した座標でレーンを決める(回転中だけ、その高さでの遠近のレーン幅を使う。縦長画面で90度回ると見えているのは奥側のため)。`shift` / `sway` でずれている間は、`geom()` がレーン幅を `(W-24)/(4+2×ずれ幅)` まで細くして、スマホでも端のレーンが画面外に出ない(ずれ幅は `render` の `swayMax`。揺れの瞬間値ではなく揺れ幅なので、幅は揺れのたびに変わらない)(1.81.1)
- **光の点滅の注意**: 画面が動くギミックを使う曲は、曲ファイルに `photosensitive: true` を付ける。選曲画面の曲の情報に「⚠ 光の点滅・画面の動きあり」、始める前に注意の画面(`#ps-warn`。光過敏性発作の注意、「やめる」「点滅・揺れを減らして遊ぶ」「このまま遊ぶ」)。同じ曲は開いている間に1回、「次から表示しない」で端末の `mlidar:psWarnOff`
- 設定の「光の点滅・画面の揺れを減らす」(`settings.calm`)がオンなら、`shake` / `flash` / `strobe` を出さない(回転・上下反転はゲームの中身なのでそのまま)
- ギミック曲では流れる速さを1倍より速くしない(`speed` は 1 以下だけ使う。遅くする・止めるのはよい)
- **譜面メーカー(1.80.1〜)**: ギミックの種類に「画面が動く」7つ(移動・判定ライン移動・上下反転・回転・画面揺れ・フラッシュ・点滅)を追加(`maker.js` の `syncGimmickForm` / `applyGimmick` / `gimmickText`)。判定ライン移動は%で入れる。サーバー(`mlidar_chart_save`)はギミックの種類を見ないので、そのまま保存できる
- 譜面を差し替えて遊ぶとき(みんなの譜面・テストプレイ・練習・リプレイ)は、その譜面のギミックに `flip` / `spin` / `shake` / `flash` / `strobe` があれば(`buildScroll` の `intense`)、始める前に同じ注意を出す(`confirmPhotosensitive(entry, custom)`)

### ジャンルごとの楽器(`audio.js` の `PALETTES`・1.87.0〜)
- 内蔵曲はどれも同じシンセの音色(lead・pad・pluck・bell・stab…)で鳴っていて、ジャンルが違っても似て聞こえたので、生楽器が似合うジャンルでは、音を作るときにイベントの種類を置き換える(ピアノ・弦楽合奏・バイオリン・ブラス・サックス・フルート・尺八・ナイロンギター・琴・マリンバ・ハープ・オルガン・生ドラム・ブラシ)
- ジャンル名 → 組み合わせは `GENRE_PALETTE`(正規表現。上から最初に当てはまったもの)。今は内蔵曲133曲のうち61曲が対象で、電子音楽のジャンル(72曲)は今までどおり。曲ファイルに `palette`(組み合わせの名前か `{ lead: 'brass', … }`。`'none'` で置き換えなし)を書けば曲ごとに変えられる
- **置き換えるのは `renderEvents` の中だけ**(もとの events は書き換えない)。譜面・MV・録音補正はもとのイベントから作るので変わらない。音量は `MATCH`(もとの音と同じ RMS になる倍率。1音ずつ合成して比べた)で `vel` を掛けて合わせる。曲全体の音量は前と ±1dB 以内
- `renderEvents(events, duration, { sidechain, genre, palette })`。呼ぶ所(`main.js`・`tools/export.html`・`promo.html`・`trailer.html`)はジャンルを渡す。合成結果のキャッシュは `audio-cache.js` の `SYNTH_VERSION`(4)と opts(ジャンル込み)で作り直される。音色を変えたら `SYNTH_VERSION` を上げる

### 譜面の自動生成(`composer.js`)
- `composeSong` で楽譜 → イベント列。`candidatesFromEvents` でノーツ候補(強さの点数つき)
- `generateChart(cands, diff, duration, seed, override)` が難易度ごとに間引く。主な値: `minGap`(ノーツの最小間隔[秒])、`maxNps`(1秒あたりの上限)、`minScore`(候補の点数の下限)、`chordP` / `chordMax`(同時押し)、`lnMin`(ロングノーツの最短)、`sameGap`(同じレーンの最小間隔)
- 同じ曲データなら毎回同じ譜面になる(乱数の種は固定)。**比べるたびに乱数を引く `sort((a, b) => … rng() …)` は使わない**: 並べ替えの手順はブラウザやそのバージョンで違うので、乱数の引き方がずれて譜面が変わる(1.63.0 まで Chrome と Node でレーンが違っていた)。乱数は先に1要素1回ずつ引き、`byKey` で並べる
- **のばす音の表現(`shapeHolds`)**: 生成した譜面(内蔵曲)と音源曲の `fixedCharts` の両方に、`main.js` の `holds()` があとからかける(曲ファイルで `holdStyle: false` にすると今までのロングノーツのまま)。手作りの譜面(チュートリアル・譜面メーカー)にはかけない
  - まず `untangleHolds`(EASY も): ロングを押している間に別のロングが始まる所は、前のロングを次の始まりの 1/4 拍前で切る(1拍未満になったら普通のノーツ)。歌の音節ごとの伸ばしが何本も重なるのを防ぐ
  - NORMAL(2拍以上)・HARD(1拍以上)で、伸ばしている間にほかのノーツがない(押しながら叩く形でない)ロングを集め、前4秒と後2秒の密度を曲の平均とくらべた「盛り上がり」が、その曲の中で上位(HARD 55%・NORMAL 35%)のものだけ形を変える。歌い終わり(後ろが2拍以上あく)はロングで締める。形を変えた次の伸ばしはロングに戻しやすい
  - 形: トリル(となりの2レーンを交互。NORMAL は8分、HARD は16分。間隔は NORMAL 0.2秒・HARD 0.15秒〔レベル10以上は 0.1秒〕より細かくしない)/ うねり(HARD の2.5拍以上で特に盛り上がる所。3レーンを往復)。トリルは HARD 3拍・NORMAL 2拍まで、残りが1拍以上あれば最後のノーツをロングにして締める

---

## 6. プレイ(`game.js`)

- 判定の幅(秒): PERFECT ±0.045 / GREAT ±0.09 / GOOD ±0.135。それより外は MISS。編成の「判定サポート」で PERFECT・GREAT の幅が広がる
- スコア = 950,000 × (判定の点の合計 ÷ ノーツ数) + 50,000 × (最大コンボ ÷ ノーツ数)。判定の点は PERFECT 1 / GREAT 0.75 / GOOD 0.4 / MISS 0
- 精度(accuracy)は PERFECT 1 / GREAT 0.7 / GOOD 0.3 / MISS 0 の平均
- ランク: MAX(100万)/ S+ 975,000 / S 950,000 / AA 900,000 / A 850,000 / B 750,000 / C 600,000 / D
- FC = MISS 0、AP = 全部 PERFECT
- **ランキングに出すのは素のスコア**。編成の効果を入れたスコア(`teamScore`)は表示とコイン用で、別に集計している
- 体力(`life`)は段位・コースのときだけ使う。0 になったら不合格
- キー: レーンごとに [メイン, 連打用の2つ目]。初期は D/S・F/G・J/H・K/L。同じレーンの2つのキーを交互に押すと、速い連打ができる
- 別のタブに移ったり窓から離れたりすると、ゲームは自動で一時停止する(みんなでライブ中は止めない。音は `audio.js` が消す)
- 演出の強さは `settings.fx`(0 オフ / 1 控えめ / 2 派手)
- 見やすさの設定: `settings.noteSize`(small / normal / large。ノーツの厚みと横の余白、`NOTE_SIZE`)、`settings.palette`(skin / cvd。cvd は外側を青・内側をオレンジにした色覚に配慮した配色 `CVD_COLORS` で、着せ替えより優先。ノーツの色は `game.colors()` から取る)、`settings.bgDim`(0〜80%。MV・点群の上に黒を重ねる)
- **叩いたずれの分布(1.86.0〜)**: リザルトの `#r-offset` に、そのプレイの叩いたずれ(`r.log` の3つ目。MISS は数えない)を -135〜+135ms・10ms ごとの棒グラフで出す(棒の色は PERFECT・GREAT・GOOD の幅、ピンクの線が中央値)。下に FAST(45ms より早い)・中央値・SLOW(45ms より遅い)の数。20回以上叩いたときだけ。リプレイ・オートプレイでは出さない(`offsetHint`)
- **判定タイミングのおすすめ**: リザルトで、そのプレイの叩いたずれ(`r.log` の3つ目、今の判定タイミングを引いたあとの値)の中央値が 12ms 以上なら「判定タイミングを ±Nms にする」ボタンを出す(40 回以上叩いたときだけ。`offsetHint`)。音に合わせて叩いて測る画面(設定の「タイミング調整」`extras.js`)も前からある
- **練習モード**(選曲画面の「🎯 練習モード」): 区間(はじめ・おわり)・速さ(×0.5〜1.0)・くり返しを選ぶ。`custom.kind = 'practice'`、記録・ランキング・ゴースト・録画なし。遅くするときは、区間の前後を WAV にして `<audio>`(`preservesPitch`)で鳴らし、ゲームの時計をその再生位置に合わせる(`Game.startMedia`、`this.rate`。`songTime` は rate 倍で進む)。くり返すときは終わるたびに同じ条件でもう一度始める(やめるときは Esc →「選曲へ」)。選んだ条件は `mlidar:practice:<曲id>`
- **オートプレイ**(選曲画面の「🤖 オートプレイ」、`main.js` の `playAuto`): 譜面から全部ぴったりに押す入力を `autoInputs` で作り、リプレイと同じ `custom.kind = 'replay'` で流す(だから記録・ランキング・ゴースト・コインには残らない)。離すのはノーツの 0.06 秒後(ロングノーツは終わりの 0.02 秒後)、同じレーンの次のノーツより前。スマホでは練習モードと同じく「記録・ランキング」のシートの中に出る
- **リプレイ**(`replay.js`): ふつうのプレイ中はキーの押し・離し `[判定の時刻, レーン, 1/0]` を `game.inputs` に記録。リプレイは `custom.kind = 'replay'` で `replay` を渡し、その時刻が来たら `pressAt` / `releaseAt` を呼ぶ(キー入力は受け付けない)。自己ベストを更新したら、端末(`mlidar:replay:<曲id>/<難易度>`、最大 15 譜面)とサーバー(`mlidar_replays`。ランキングに記録したスコア以下だけ受け付ける。**各譜面のスコア上位20人分だけ残し、それより下は保存するときに消す**)に残す。レーンがランダムのプレイは残さない。選曲画面の「▶ リプレイ」で自分のベストと上位 10 人、リザルトの「▶ リプレイを見る」でいまのプレイを見られる
- **EXTRA**(4つ目の難易度): `levels.extra` がある曲だけ。**音源曲**は曲ファイルの `levels.extra` と `fixedCharts.extra`(Crying Red・暮らし泳ぐ・INMU KING・シャイニングスター・SUMMER TRIANGLE・水の追憶・Hydrangea・蒼。GHOST 2曲は 1.85.0 で追加)。**内蔵曲**は `composer.js` の `extraParam`(HARD の値から最小間隔×0.72・上限×1.45・点数の下限×0.45・同時押し+0.16)で `generateChart(…, 'extra', …)` を作り、レベルは `js/songs/extra-levels.js`(`node tools/extra-levels.mjs` で作る。EXTRA が HARD より15%以上ノーツが多い曲だけ。レベルは全曲の密度とレベルの対応から推定し、HARD+1 以上)。曲や譜面の作り方を変えたら `node tools/extra-levels.mjs` を作り直す。ひとりでライブだけ(みんなでライブ・週替わり・段位などは3つのまま)。曲一覧のカードには EXTRA のレベルも紫で出す。EXTRA を選んでいるとき、EXTRA のない曲は HARD のレベルで絞り込み・並べ替える(`dOf`)。EXTRA のない曲では HARD を見せる。サーバーの `mlidar_scores.diff` と `mlidar_play_result_core` は `extra` も受け付ける(コインは HARD より少し多い)。譜面は `LAYERED_TARGET=extra python tools/audiochart/layered.py <data.js> <T_END> <目標nps> 0`(遅い曲は `LAYERED_GRID=16` で16分まで)
  - **1.85.0 から全曲に EXTRA がある**(内蔵曲133曲・音源曲16曲)。内蔵曲で前からあった48曲は、レベルも譜面も変えていない(`tools/extra-levels.mjs` は表にある曲を作り直さない)。新しく足した85曲のうち82曲は、ふつうの EXTRA だと HARD とノーツ数がほぼ同じ(曲の音から拾えるノーツを HARD でほぼ使い切っている)ので、`extra-levels.js` の `BOOST` にある値を EXTRA の値に足す: `chordAnyP`(拍の頭でない音・1種類の音も同時押しにする確率。0.15〜0.5 のうち、HARD より15%以上多くなる最小の値)と、EXTRA の下限(最小間隔 0.07 秒・同じレーン 0.09 秒)が HARD より粗い曲は `minGap`・`sameGap` を HARD の値に。`main.js`・`tools/promo.html`・`tools/trailer.html` は `extraParam(hard, { ...BOOST[id], ...chart.extra })` で作る。新しく足した曲のレベルは HARD+1 以上・最大16
  - GHOST 2曲の EXTRA は varied.py で、HARD の1.12倍の密度(GHOST 14・VIP 15)。そのぶん INFERNO を1つ上げた(15・16)
- **INFERNO**(5つ目の難易度・EXTRA の上。1.84.0〜。色はオレンジ #ff7a45): `levels.inferno` がある曲だけ。選べる難易度は `composer.js` の `ALL_DIFFS` から、その曲にある譜面だけ(`main.js` の `diffsOf`)。その曲に無い難易度を選んでいるときは1つ下を見せる(INFERNO → EXTRA → HARD。`diffFor`)
  - **音源曲(34曲全部)**: `fixedCharts.inferno`(`*.data.js` の `inferno`)と曲ファイルの `levels.inferno`。譜面は varied.py の `inferno`(16分まで・同じレーン 0.15 秒・同時押し多め・3つまで)で、目標の密度は EXTRA の1.3倍(EXTRA のない GHOST 2曲は HARD の1.25倍)。速い曲は8分まで。実際は EXTRA より16〜31%多い
  - **内蔵曲**: `tools/extra-levels.mjs` の `INFERNO_SONGS`(LiDAR Rush・Hyperpop Glitch・Chip Dungeon と、1.86.0 から HARD が Lv13 以上の22曲)だけ。`composer.js` の `infernoParam`(EXTRA の値から最小間隔×0.82・上限×1.3・点数の下限×0.55・同時押し+0.1、さらに `chordAnyP: 0.3` で拍の頭でない音・1種類の音も同時押しにする)で作る。EXTRA の時点で曲の音から拾えるノーツをほぼ使い切っているので、INFERNO の増え方は主に同時押し(EXTRA より26〜30%多い)。`chordAnyP` が無い難易度は乱数の引き方も今までどおり
  - 1.86.0 で足した22曲は、EXTRA の値に `extra-levels.js` の `BOOST` を足したものから作り、さらに `inferno-levels.js` の `BOOST`(INFERNO の chordAnyP 0.5〜0.7、足りない曲は最小間隔・同じレーンも EXTRA の0.9倍)を `infernoParam` の3つ目に足して、EXTRA より20〜31%多くした。レベルは EXTRA+1 以上・**INFERNO だけ最大17**(EXTRA が16の曲があるため)。前からある3曲は変えていない(表にある曲は作り直さない)。`main.js` は `infernoParam(hard, { ...EXTRA_BOOST[id], ...chart.extra }, { ...INFERNO_BOOST[id], ...chart.inferno })`
  - レベル: `node tools/extra-levels.mjs` が、全曲の密度とレベルの対応(INFERNO 用には音源曲の EXTRA も見本に入れる)から推定する。内蔵曲は `js/songs/inferno-levels.js` に書く(EXTRA+1 以上・最大16)。音源曲は推定値を表示するだけなので、曲ファイルの `levels.inferno` に手で書く。**このツールは `extra-levels.js` も書き直す**(今は EXTRA の対象曲・レベルが少し変わる。EXTRA を変えたくないときは実行後に `git checkout -- js/songs/extra-levels.js`)
  - ひとりでライブと、1.86.0 からみんなでライブ(週替わり・段位・ランダムマッチは3つのまま)。レート(`growth.js`)は今までどおり EASY〜HARD だけで計算する
  - サーバー: `mlidar_scores.diff` の制約と `mlidar_play_result_core` が `inferno` を受け付ける(コインは EXTRA +30 より多い +40)。Discord の記録のお知らせ(`mlidar_scores_feed`)は INFERNO の初フルコンボも出す
  - 曲ページの収録曲一覧は「/ INF 14」のように出す(`build-pages.mjs`)。共有画像(`tools/og.html`)も5つ並べられる(5つのときは右端からはみ出さない幅にする)。1.88.0 で足した5曲は5つ入りで作った。それより前の曲の画像は作り直していない

---

## 7. 端末に保存するもの(localStorage)

キーはすべて `mlidar:` で始まる(`storage.js` の `load` / `save`)。主なもの:

| キー | 中身 |
|---|---|
| `token` | ログインのセッショントークン(サーバーの `mlidar_sessions`) |
| `settings` | 設定(速さ・音量・判定位置・キー配置 `keys`・配信者モード `stream` など) |
| `best` | 端末内の自己ベスト(`曲ID/難易度` → スコアなど) |
| `client` | 端末ID(ログインしていない人のランキング用) |
| `selId` / `diff` | 前回選んだ曲と難易度 |
| `inviteCode` | 招待リンク(`?invite=`)のコード。ログインしたら自動で使う |
| `playCount` / `installSnooze` / `installDone` | ホーム画面に追加の案内 |
| `moved` | 旧URLからの引っ越しが済んだか |
| `lang` | 表示の言語(`auto` / `ja` / `en` / `ko` / `zh-Hans` / `zh-Hant`) |
| `rankMode` | 選曲画面のランキングの表示(`all` / `friend`) |
| `dailyStreak` | デイリーに挑戦した連続日数 `{ last: 'YYYYMMDD', n }`(シェアの文に出す) |
| `quickPlayed` | 「いますぐ1曲」を使ったか |
| `ghost:<曲ID>:<難易度>` | 自己ベストのゴースト(判定の記録) |
| `badges:<アカウントID>` | 前に見たときに持っていたバッジ(増えたらお知らせするため) |

`ka_session`(頭に `mlidar:` が付かない)は、かるわかGAMESアカウントの共通ログイン。

---

## 8. アカウントとサーバー

### ログイン
- アカウントは `mlidar_accounts`。セッションは `mlidar_sessions`(90日使わなければ無効)。関数の中で `mlidar_auth(p_token)` がアカウントIDを返し、だめなら `AUTH` エラーを出す
- 今のログインは「かるわかGAMESアカウント」(Google・Discord・GitHub・MixAll)。共通部品 `https://kaikomziu.github.io/game-links/js/karuwaka-account.js` を読み込んで使い、`mlidar_ka_login` / `mlidar_ka_new` / `mlidar_ka_claim`(昔の名前+パスワードのアカウントを引き継ぐ)/ `mlidar_ka_link` で MUSIC LiDAR のアカウントにつなぐ
- OAuth のあとは game-links の `oauth.html` / `mixall-login.html` を通って戻ってくる。**戻れるサイトは、そのファイルの `ALLOWED` に書いたものだけ**(music-lidar.com と www は追加済み)
- 昔の名前+パスワード方式(`mlidar_register` / `mlidar_login`)も残っている

### コインなどは全部サーバーで決める
- ブラウザは結果を送るだけ。コイン・報酬・在庫は `security definer` の関数がチェックして決める
- アカウントの状態は `mlidar_state_of(a)` がまとめて返し(コイン・キャラ・編成・ミッション・`meta` など)、ブラウザは `acc.applyState(state)` で受け取る
- `meta`(jsonb)に入っているもの: `streak`, `login`, `season`, `skins`, `equip`, `rate`, `rate_best`, `invites`, `invited_by`, `invited_by_id`, `invited_at`, `match`, `weekly_join`, `weekly_claimed`。`mlidar_meta_view` が表示用に整えて返す

### 1曲遊んだとき(`mlidar_play_result` → `mlidar_play_result_core`)
- 入力の範囲チェック(スコア0〜100万など)をしてから集計する
- コイン = (30 + 90 × min(編成込みスコア, 110万) ÷ 100万 + FC 15 + HARD 20 / NORMAL 10) × (1 + 編成のコインボーナス%)。**前の報酬から30秒以内なら0**(連打対策)
- `stats`(累計プレイ・FC・AP・最大コンボなど)、`daily`(今日のミッション用)、`best`(サーバー側の自己ベスト)を更新し、内蔵曲ならランキング(`mlidar_submit`)にも送る
- 外側の `mlidar_play_result` が、連続日数とシーズンXPを足して返す(`xp`, `tier_up`, `streak`)。`_core` はブラウザから直接呼べない

### 報酬の数字
| もの | 内容 |
|---|---|
| ガチャ | 1回100 / 10連900。★4 2% / ★3 8% / ★2 30% / ★1 60%。10連の10回目は★2以上確定。100回で★4確定(`pity`)。被りはレベル+1(最大5)、それ以上はコインが戻る(10/30/100/300) |
| 編成の効果(`mlidar_team_fx`) | キャラの種類ごとに score / judge(最大20)/ guard / coin。レベル1上がるごとに+20%、リーダー(1人目)は1.5倍 |
| ミッション(`mlidar_missions`) | デイリー4つ(3曲プレイ・PERFECT/GREAT 300回・HARD C以上・FC)と実績。受け取りは `mlidar_claim` |
| 段位 | 初めて合格した段 × 100 コイン(`mlidar_dan_clear`) |
| ログインボーナス | 7日で1周: 30, 30, 50, 30, 30, 50, 150 |
| 連続プレイ日数 | 3日 100 / 7日 300 / 14日 500 / 30日 1000 / 50日 1500 / 100日ごと 3000 |
| シーズンパス | 1か月ごと。1段 300XP・30段。1曲のXP = 60 + min(50, スコア÷20000) + FC 20 + HARD 10 / NORMAL 5(コインが出たときだけ)。5段ごとに限定の着せ替え、ほかはコイン |
| 週替わりスコアアタック | 参加で100(週1回)。翌週に順位で 1位1000 / 2位700 / 3位500 / 10位まで300 / 上位30%で150 / それ以外50 |
| ランダムマッチ | 勝ち80 / 負け30(60秒に1回まで) |
| 招待 | 招待した人・された人の両方に300と着せ替え「フレンド」。招待した側のコインは20人まで。使えるのは始めて14日以内のアカウントが1回だけ |

### レートと称号(`growth.js`)
- 1譜面の値 = max(0, min(レベル+2, レベル + (スコア − 950,000) ÷ 25,000))。レート = 上位30譜面の平均
- 称号: ルーキー(0)/ ブロンズ(2)/ シルバー(4)/ ゴールド(6)/ プラチナ(8)/ ダイヤ(10)/ マスター(12)/ グランドマスター(14)/ レジェンド(16)
- ブラウザで計算して `mlidar_rate_set` で保存する(マッチングとプロフィール用)

---

## 9. 各機能の仕組み

### みんなでライブ(`live.js`)
- 通信は WebRTC。部屋を作った人(ホスト)のブラウザが部屋の状態を持ち、参加者はホストとだけつながる。最初のつなぎ(シグナリング)だけ PeerJS の公開サーバーを使う
- サーバー(`mlidar_live_lobby`)に載せるのは「公開中の部屋一覧」だけ。ホストが20秒ごとに更新し、来なくなれば消える
- 難易度は人ごとに5つ(`LIVE_DIFFS`。1.86.0 から EXTRA・INFERNO も)。その曲に無い難易度を選んでいる人は、`ui.diffFor` で1つ下(INFERNO → EXTRA → HARD)を遊び、ボタン・メンバーの札もその難易度で出す。古い版の人には EXTRA・INFERNO が NORMAL に見える(遊ぶのは本人の端末なので結果は正しい)
- 最大8人。コンボは0.5秒ごとに送り、5秒ごとに生存確認、16秒届かなければ切れたとみなす
- Daily.co の SFU に切り替える仕組み(Edge Function `mlidar-daily`)があるが、今は使っていない
- `mlidar_live_rooms` / `mlidar_live_members` などのテーブルは昔の方式のもの。消さずに残す

### ランダムマッチ(`match.js`)
- `mlidar_match_poll(p_token, p_rate, p_code)` を何度も呼ぶ。レートの差が 1.5 + 0.15 × 待った秒数 以内の相手と組む
- 先に待っていた方がホストになり、部屋コードをサーバーに書く。もう1人はそのコードで入る
- 部屋は `room.match = true`, `cap: 2`。ロビーには出さず、難易度は固定、1回目は2.5秒後に自動で始まる。結果は `mlidar_match_done`

### 週替わりスコアアタック
- 曲は `weeklyOf()`: HARD がLv5以上の曲を id 順に並べ、`mulberry32(hashStr('weekly-' + 月曜の日付))` で選ぶ
- 記録は `mlidar_scores` の `song = 'weekly-YYYYMMDD'`(日本時間の月曜)。殿堂は過去8週

### デイリーチャレンジ(`extras.js` の `dailyOf`)
- 日付(日本時間)から乱数で、曲・難易度(NORMAL 45% / HARD)・条件(レーンや見え方の変化)を決める。みんな同じになる

### 段位道場(`dan.js`)
- 4曲続けて HARD。体力は曲をまたいで引き継ぐ。編成の効果は使わない。課題曲は `COURSES`

### 着せ替え(`skins.js`)
- 種類は note(ノーツの色)/ line(判定ライン)/ tap(叩いた音)/ hit(PERFECT の光り方)
- 見た目は `LOOK`。値段と入手方法はサーバーの `mlidar_skins`。購入 `mlidar_skin_buy`、装備 `mlidar_skin_equip`。タップ音を変えたら `audio.js` が音を作り直す

### Discord 認証(1.77.0)
- プロフィールの「Discordで認証」(`growth.js` の `discordHtml` / `showDiscordCode`)で `mlidar_discord_code` が6文字のコード(15分有効、`mlidar_discord_codes`)を出す。つないでいれば `linked: true` を返す
- ふだんは公式Discordでスラッシュコマンド `/verify コード` を打ってもらう(`mlidar-discord-cmd` がすぐ `mlidar_discord_redeem` してロールを付け、本人にだけ見える返事をする。2026-11-23〜)。「✅｜認証」チャンネル(ID 1573672597730893904)に貼る方法も残していて、pg_cron のジョブ `mlidar-discord-verify` が**10分ごと**(Supabase の節約のため。前は1分ごと)に Edge Function `mlidar-discord`(`supabase/functions/mlidar-discord/`、verify_jwt なし。ヘッダー `x-mlidar-cron` を Vault の `mlidar_discord_cron` と比べる)を呼ぶ
- Edge Function は前回の続き(`mlidar_discord_state` の `last`)からメッセージを読み、`mlidar_discord_redeem`(service_role だけ)でつなぐ → ◎500・`meta.discord = {name, at}`・`mlidar_discord_links`(アカウントと Discord ID はどちらも1回だけ)。ロール「✅ 認証済み」を付け、返事をして、貼られたメッセージは消す。ボットの返事は10分で消す(ピン留めの案内は残す)
- ボットのトークンは Vault の `mlidar_discord_bot_token`(`mlidar_discord_config` で Edge Function だけが読む)。このボットは公式Discordでは「**MUSIC LiDAR bot**」(Supabase で24時間動く)。Claude Code の Discord プラグインのボット(「claudecodeちゃん」。PC で動き、許可した1人の DM だけ受け付ける)とは別のアプリ(2026-11-23 に、スコア報告を投稿している名前で確かめた)。以前は同じアプリと書いていたが誤り。interactions endpoint(スラッシュコマンド)を MUSIC LiDAR bot に設定しても、プラグイン側には影響しない
- **スラッシュコマンド(2026-11-23〜)**: Edge Function `mlidar-discord-cmd`(`supabase/functions/mlidar-discord-cmd/`、verify_jwt なし)が MUSIC LiDAR bot の Interactions Endpoint。Discord からのリクエストはアプリの公開鍵(`/applications/@me` の `verify_key`)で Ed25519 の署名を確かめる。コマンドは公式サーバーだけに登録: `/help`・`/verify コード`・`/me`(`mlidar_discord_links` でつないだアカウントの記録)・`/profile 名前`(`mlidar_profile`)・`/ranking 曲 難易度`(`mlidar_scores` の上位10人。曲名は `data/cards.json` から候補を出す)・`/song ジャンル`(ランダムに1曲)。返事は公開、エラーや未認証の案内は本人だけに見える形。**コマンドを変えたら**デプロイしてから、SQL で `net.http_post` に Vault の `mlidar_discord_cron` を `x-mlidar-cron` ヘッダーで付けて `{"action":"setup"}` を送る(コマンドの登録と Interactions Endpoint URL の設定をやり直す。結果は `net._http_response`)メッセージを読むのに Message Content Intent を使っている
- ブラウザはコードを出したあと15秒ごとに `acc.refresh()` して、`meta.discord` が入ったら表示を変える
- **記録のお知らせ(1.79.0〜)**: `mlidar_scores` のトリガー `mlidar_scores_feed` が、Discord 認証した人の「ほかの人もいる譜面でランキング1位になった」「その譜面で初めて ALL PERFECT」「HARD・EXTRA で初めてフルコンボ」を `mlidar_discord_feed` に入れる(同じ人・譜面・種類は1時間に1回まで。30日で消す)
- ジョブ `mlidar-discord-feed` が1分ごとに、**投稿していないお知らせがあるときだけ** `mlidar-discord` を `{"mode":"feed"}` で呼び、公式Discordの「🏆｜スコア報告」チャンネルに埋め込みで投稿する(何もない分は関数を呼ばない)。チャンネルは `mlidar_discord_state` の `feed_channel`。なければ名前に「スコア報告」、それもなければ「記録」か record が入ったテキストチャンネルを探して覚える(**まだなければ投稿せずに待つ**)。曲名・色・曲ページはサイトの `data/cards.json`(`i` = 曲の id)から引く。メンションの通知はしない

### 招待
- 段階報酬: 1人目で着せ替え「フレンド」、3人で判定ライン「アンバサダー」(`line_invite`)、10人でノーツ「クラウン」(`note_crown`)。プロフィールに進み具合と「𝕏 で誘う」
- コードは `mlidar_invite_code`(6文字。0/O/1/I/L などまぎらわしい字は使わない)。リンクは `https://music-lidar.com/?invite=CODE`
- `?invite=` を開くとコードを保存。ログインしていなければ、`mlidar_invite_lookup` で招待した人の名前と称号を調べて「〇〇さんから招待されました」の帯を出す。ログインしたら `mlidar_invite_redeem` で自動で使う
- 管理者ページの「友だち招待」は `mlidar_admin_invites`

### フレンド(`friends.js`)
- テーブル `mlidar_friends`(`a` が `b` に申請。`status` は `pending` / `ok`)。名前で申請し、相手が承認するとフレンド。相手からの申請が来ている人に申請すると、そのままフレンドになる
- 上限: フレンドと申請あわせて100人、申請は1日30件まで
- 一覧(`mlidar_friend_list`)は、セッションの `last_used` が3分以内ならオンライン、`place`(`mlidar_ping` が1分ごとと画面が変わったときに送る今の画面)を表示する
- 曲のフレンドランキング(`mlidar_friend_ranking`)は `mlidar_scores` から自分とフレンドの行だけを出す(ログイン中の記録は `client_id` = アカウントID)
- 入口: ホームの「フレンド」(届いた申請の数のバッジつき)、プロフィールの「＋ フレンド申請」、選曲画面のランキングの「みんな / フレンド」

### 実績バッジ(`badges.js`)
- `BADGES` に31種類(1.86.0 で EXTRA 制圧・INFERNO 挑戦者・業火を越えて・灼熱の覇者を追加)。サーバーの記録(`best` / `stats` / `meta`)から、その場で計算する。自分の state(`acc.getState()`)でも、他人のプロフィール(`mlidar_profile`)でも同じ関数で計算できる
- プロフィールでは、自分のときはまだのバッジも薄く(進み具合のバーつき)、他人のときは持っているものだけ出す
- ホームを出すたびに、前に覚えた一覧(`mlidar:badges:<ID>`)と比べ、増えていればお知らせを出す
- バッジを足すときは `BADGES` に `{ id, icon, name, desc, n: (c) => 数, goal }` を足す。必要な数は `ctx()` に足す

### 多言語表示(`i18n.js`)
- 言語の決め方: `?lang=en` などの `?lang=`(`ja` `en` `ko` `zh-Hans` `zh-Hant`)> 設定の「言語 / Language」(`mlidar:lang`)> ブラウザの言語(日本語→ja、韓国語→ko、中国語→台湾・香港は zh-Hant、ほかは zh-Hans、それ以外は英語)
- 韓国語・中国語は、その言語の辞書を `await import` で読み、ない文は英語にする(`DICT = { ...EN, ...その言語 }`)。`body` には `lang-en`(日本語以外の共通)と `lang-<言語>` が付く
- **新しいボタンや見出しを足したら、`EN`・`i18n-ko.js`・`i18n-zh-hans.js` に足し、`python tools/make_zh_hant.py` で繁体字を作り直す**(要 `pip install opencc-python-reimplemented`)
- 画面の文字(テキストと `title` / `placeholder` / `aria-label`)が辞書 `EN` の日本語と**まるごと同じ**なら英語に置き換える。あとから JS が出した文字も MutationObserver で置き換える。タブの題名も `｜` で区切った部分ごとに置き換える
- 辞書にない文(トーストやリザルトの細かい文など)は日本語のまま
- 言語を変えたらページを読み直す(`setLang`)

### 埋め込み(`?embed=1`)
- 曲ページ + `?embed=1` を iframe に入れて使う。`body.embed` が付き、その曲の選曲・プレイ・リザルトだけになる。チュートリアル・ログイン案内・Service Worker なし
- 選曲画面の「⧉ 埋め込みコード」でコピーできる

### 配信者モード(`settings.stream`)
- `'on'`: スコアとコンボを大きく、ライブの参加コードを画面の上に出す。`'green'`: さらに背景を #00ff00 にして、MVと点群を描かない
- 配信者モードのときだけ、選曲画面に「📊 視聴者投票」(`poll.js`)。候補4曲で投票を作り(`mlidar_poll_create`、作った人は端末ID)、リンク `?vote=CODE` をチャットに貼ってもらう。途中経過は3秒ごとに `mlidar_poll_get` で読み、画面の左上(`#poll-mini`)にも出す。締め切ると1位の曲を選曲画面で選ぶ
- 視聴者は `?vote=CODE` を開くとすぐ投票画面(ログイン不要。端末IDで1人1票、変更可)。投票は3時間で締め切り、1日で消える

### すぐ遊べる導線・おすすめ(`social.js`)
- 記録もチュートリアルもない人には、タイトルに「▶ いますぐ1曲遊ぶ」。内蔵曲で EASY がいちばん低く BPM が110に近い曲を、短い字幕(`extra.captions`)つきで始める
- リザルトの「次はこれがおすすめ」(`recommend`): 精度から目標レベルを決め(96%以上 +2、90%以上 +1、80%以上 同じ、それ未満 −2)、レベルの近さ・まだ遊んでいない・同じジャンルで点数をつけて3曲

### X に投稿・デイリーのシェア
- リザルトの「𝕏 に投稿」は `twitter.com/intent/tweet` を開くだけ(曲ページのURLとハッシュタグ #MUSICLiDAR)
- デイリーのリザルトには、曲を10区間に分けた精度の絵文字(🟪 全部PERFECT / 🟦 90% / 🟩 75% / 🟨 50% / 🟥)と連続日数のシェア文。リンク `?daily=1` を開くと、その日のデイリーがすぐ始まる

### 宣伝動画(`tools/promo.py`)
- `python tools/promo.py`(番号を付けるとその番号だけ)で、`tools/promo-plan.json` の動画を `D:\MUSIC_LiDAR_export\promo` に縦 1080×1920・30fps の mp4 で作る。しくみは `export.py` と同じ(ローカルサーバー + ページで描画 + ffmpeg)。リアルタイムではないので、タブが裏でも止まらない
- 種類(`type`): `auto`(いちばん密な15.5秒を自動プレイ。`hook`・`sub` の文字)、`song`(上に MV を大きく、下に小さいプレイ画面。曲名・ジャンル・BPM)、`intro`(`captions` の文字を順に切り替え)、`diff`(同じ約5秒・小節単位を `diffs` の3つの難易度でくり返す)。`range`(いろんな難易度: `scenes` の曲・難易度・言葉(「かんたん」「鬼」など)を約3秒ずつ切り替え、Lv1〜15 の線で今どこかを見せる。各場面はその譜面でいちばん密な所)、`gimmick`(ギミック譜面: `scenes` の曲・難易度・見せたい拍 `beat`・言葉 `label`。1曲なら1場面。いま始まったギミックの名前を「回転!」のように出す)。最後に2.5秒のエンド画面(ロゴ・music-lidar.com)
- プレイ画面は game.js ではなく、譜面(`builtinEntry` と同じ作り方)から時刻ごとに描く簡易版(全部 PERFECT)。`song` 以外はタップ音を足す
- ノーツの流れる速さはレベルで決める(`speedOf`: Lv1 は奥から判定まで 0.92 秒、Lv15 は 0.56 秒)。難しい譜面ほど速く流して、ノーツの間を広げて見やすくする
- **オリジナル曲だけ**(音源ファイルの曲は宣伝に使う許可がないので弾く)。ギミックのある曲は `gimmick` 型でだけ使える(ほかの型は弾く)
- `gimmick` 型: `drawPlay` に `opt.sc`(`buildScroll` の結果)を渡すと、ノーツの位置をスクロール量で決め(停止・変速)、隠し・消える・揺れ・移動・判定ライン・上下反転・回転・画面揺れを描く(COMBO・PERFECT の文字は回さない)。フラッシュ・点滅は `drawFrame` で白を重ねる(動画では強さ 0.6 倍)。**`photosensitive` の曲が入る動画は、頭に2.8秒の「光の点滅・画面の回転や揺れがあります」の注意画面(`drawWarn`。音は無音)を入れ、プレイ中も下に「※光の点滅・画面の動きがあります」を出す**
- 英語版: plan に `"lang": "en"` を付けると、注意画面・ギミック名(`GNAME_EN`)・注意書き・エンド画面の文字が英語になり、ファイル名の後ろに `-en` が付く(いまは `gimmick` 型だけ対応。見出し・場面の言葉は plan に英語で書く)
- 大事な文字は TikTok の画面の部品に隠れないよう x 60〜920・y 180〜1480 に置く
- **掛け合い(`type: talk`。ゆっくり・VOICEVOX の声の宣伝ショート)**: plan に `scenes`(曲・難易度・`beat`(なければ密な所))と `lines`(`who`・`text`(字幕)・`read`(読み。英字や数字の読みを直すとき)・`scene`(この行から何番目の場面に切り替えるか))を書く。`promo.py` がページを開く前にセリフを読み上げて wav にし(`CHARS`: zundamon・metan・tsumugi は VOICEVOX、reimu・marisa は YMM4 の AquesTalk を koe-exo 経由。**どちらも VOICEVOX エンジンの起動が必要**。漢字の読みを VOICEVOX に聞くため)、`/x/config` の `voices` と `/x/voice/<番号>_<行>` でページに渡す。ページはセリフを 0.35 秒から 0.12 秒あけて並べ、長さはセリフで決まる(最後 + 0.6 秒 + エンド画面)。セリフの間は曲とタップ音を 0.3 倍に下げる。下に吹き出し(名前の札はキャラの色)、上に見出し・曲名・難易度、動画のあいだずっと下にクレジット(「VOICEVOX:ずんだもん」など。**VOICEVOX はキャラごとの表記が必要**)。立ち絵はない。**AquesTalk(ゆっくり)は営利目的の利用に株式会社アクエストのライセンスが必要**なので、収益化するアカウントでは VOICEVOX の動画を使う
- **横の紹介動画**: `python tools/promo.py --page trailer.html` で `tools/trailer.html` を開き、1920×1080・約2分30秒の紹介動画(YouTube 向け)を1本作る(`trailer-music-lidar.mp4`)。場面(`SCENES`: オープニング・遊び方・曲の多さ・ジャンル・難易度・機能・見せ場・エンド)ごとに曲を変えてつなぐ。台本・タイトル・説明文はリポジトリの外の `music-lidar-promo/youtube-trailer.md`
- 紹介動画の効果音は手元のフォルダ(`--sfx`。既定は `04_音楽・動画/動画編集/効果音`)を promo.py が `/sfx/` で配る。**効果音ラボは再配布禁止なので、効果音のファイルはリポジトリに入れない**。動画の説明文に「効果音:OtoLogic(CC BY 4.0)、効果音ラボ」と書く

### プレイ動画(`recorder.js`)
- **動画で保存(1.75.0〜)**: リザルトの「🎞 動画で保存」→ 縦(1080×1920)か横(1920×1080)を選ぶ → いまのプレイのリプレイ(`lastReplay`)を `playReplay(..., { record: 'v'|'h' })` で流しながら録る(曲の長さぶんかかる)。終わると `onExit` が `stopRecording()` して、リザルトの `#r-video` に保存ボタンを出す(`showVideo`)。Esc → 選曲へで中止すると捨てる。録っている間は `body.rec` で「● REC」(`#rec-badge`。DOM なので動画には映らない)。動画にはふつうのプレイと同じラベル(`EASY Lv1` など)を出す
- リプレイを作れないプレイ(レーンがランダム)では「🎞 動画で保存」の代わりに「🎬 縦動画で録る」を出す(もう一度遊ぶあいだ録画。`arm()`)
- 描き方: 縦は `#stage` の真ん中を切り抜き、上に曲名・下にスコア。横は `#stage` を縦横比そのままで入れ、左右の余白が 320px 以上(スマホを縦に持っているとき)なら左に曲名、右にスコアを置く。透かしはプレイ画面の右下の内側。30fps、音は `audio.js` の `recordTap()`(BGM とタップ音の出口を MediaStreamDestination にもつなぐ)
- mp4 が録れるブラウザ(Chrome・Edge・Safari)は mp4、ほかは webm(`mp4Supported()`)。ビットレートは横 5Mbps・縦 4.5Mbps(1分半の曲で横 50MB 前後)。ライブ・譜面メーカーでは録らない
- **requestAnimationFrame で描くので、タブが裏に回ると止まる**(プレイも自動で一時停止する)。ブラウザ確認で裏のタブ扱いになるときは、`document.hidden` と rAF を差し替えて確かめる

### 譜面の密度グラフ(1.79.0〜)
- 選曲画面の難易度の下(`#d-density`)。`main.js` の `drawDensity` が、選んだ難易度の譜面を曲の長さで48に分けて区間ごとのノーツ数を棒で描く。右上は2秒の窓でいちばん多い所の1秒あたりのノーツ数。画面の大きさが変わったら描き直す

### 週末ボーナス(1.79.0〜)
- 日本時間の土曜・日曜はプレイのコインが1.5倍(サーバーの `mlidar_play_result_core` の `v_mul`。判定は `mlidar_is_weekend()`)。周年記念ウィーク(2倍)と重なったら2倍だけ
- 結果に `bonus`(`'weekend'` / `'anniv'`)を返し、リザルトのコインの横に「週末ボーナス ×1.5」を出す。ホームには週末だけお知らせ(`specials.js` の `weekend()`。`?event=weekend` でいつでも見られる)

### 人気曲(1.79.0〜)
- 遊んだら1人1曲1日1回だけ `mlidar_play_ping`(ゲストも。端末の `mlidar:pinged` で重複を防ぐ)→ `mlidar_song_daily`(曲・日ごとの回数。90日より古い分は消す)
- `mlidar_popular()` が曲ごとに [今週(直近7日の回数 + 今週ランキングを更新した人数), 累計(90日の回数 + 挑戦した人数)] を返す。選曲の並び順「🔥 人気順(今週)」「人気順(累計)」と、今週の上位10曲の曲名の前の 🔥(`main.js` の `loadPopular`。5分ごとに読み直す)

### プロフィールカード(1.79.0〜)
- プレイヤーページの「🪪 カード画像」で、名前・称号とレート・段位・プレイ数など4つ・得意ジャンル・ベスト3曲を 1200×630 の画像にして共有(スマホ)か保存(`growth.js` の `buildProfileCard`)

### レベル診断(1.79.0〜)
- LIVE の「レベル診断」→ `midnight-avenue` の盛り上がる所 48 秒を、12 秒ずつ EASY → NORMAL → HARD → EXTRA の譜面でつないで叩く(`main.js` の `startDiagnosis`。練習モードと同じ `kind: 'practice'` なので記録・ランキングには残らない)
- 判定の記録(`r.log`)を区間に分けて精度(PERFECT 1・GREAT 0.75・GOOD 0.35)を出し、80% 以上で叩けたいちばん難しい区間と、次の区間の精度から「ちょうどいいレベル」を決める(`showDiagnosis`。端末の `mlidar:diagLevel` に残す)。その範囲の譜面から、まだ遊んでいない曲を優先して3つすすめる

### 訪問とプレイの集計(1.81.2〜)
- ログインしていない人も含めて「何人来て、何人遊んだか、どこから来たか」を数える。サーバーの `mlidar_hits`(日本時間の日付 × 端末ID で1行。`source`・`is_new`・`plays`)。400日より古い行は `mlidar_hit` がたまに消す
- 送るもの: `clientId()`(端末ごとのランダムな UUID)・来た元・初めてかどうか・プレイかどうか。**名前やメールアドレスは送らない**
- `traffic.js` の `countVisit()` を起動時に1回(`main.js` の `initInstall` の後)、`countPlay()` を `startGameInner` の `game.start` の直後に呼ぶ(リプレイを見るときは数えない)
- 来た元: URL の `?from=xxx`(または `utm_source`)> `?embed`(embed)・`?invite`(invite)> 前のページのサイト(`HOSTS` で note / qiita / scratch / tiktok / youtube / x / discord / karuwaka / google / bing / yahoo など。ほかは host 名そのまま)> direct。同じタブでは最初の来た元を sessionStorage の `mlidar:src` に残す。1日の行の来た元は、その日最初に来たときのもの
- 初めてかどうか: 端末の `mlidar:seen`。集計を入れる前から遊んでいた端末(`client`・`best`・`settings` がある)は初めてにしない
- 数えない: 管理者ページを開けた端末(`mlidar:noCount`。`admin.js` が `mlidar_admin_overview` に成功したら立てる)、`navigator.webdriver`、bot っぽい UA
- 管理者ページの「訪問とプレイ」(`mlidar_admin_traffic`。管理者だけ): きょう・7日・30日の人数、来た元ごとの人数と遊んだ割合(30日)、日ごとの数(30日)
- 宣伝に貼るリンクは `https://music-lidar.com/?from=tiktok` のように来た元を付けると、アプリ内ブラウザ(referrer が来ない)からでも分かる

### サーバーの容量(1.77.1〜)
- 無料プランのデータベースは 500MB(目安)。このプロジェクトは MixAll・Discord ボット・Mod Wiki なども同じデータベースを使っている(2026-11-21 時点で全体 32MB、MUSIC LiDAR は 1.5MB)
- 1人あたりで大きいのはリプレイ(1譜面 約6KB)とゴースト(約5KB)。どちらも各譜面の上位20人だけ残すので、人が増えても「全譜面 × 20人」で頭打ちになる
- 管理者ページの「サーバーの容量」に、データベース・ファイル置き場の使用量と大きいテーブルを出す(`mlidar_admin_storage`。管理者だけ)。300MB(`warn_bytes`)を超えると黄色、450MB で赤
- 管理者がホームを開いたとき、300MB を超えていたらトーストで知らせる(1日1回。`main.js` の `checkStorage`、端末の `mlidar:storageCheck`)
- 人が増えると、容量より先に通信量(無料枠 月5GB くらい)が効くことがある。Supabase の管理画面の Usage で見る

### オンラインのゴースト
- 設定の「ゴースト」(`settings.ghostMode`: `self` / `rival` / `top` / `off`。古い `settings.ghost` は true/false)
- 自己ベストを出すと、ランキングへ送ったあとに判定の記録を `mlidar_ghost_put` で送る(ランキングにそれ以上のスコアがあるときだけ受け付ける)。形は端末のゴーストと同じで、頭文字を小文字(p/g/o/m)に
- 遊ぶ前に `mlidar_ghost_get`(rival = 自分のすぐ上、top = 1位。自分より上の人がいなければ null)。1.5秒で返らなければ自己ベスト。画面には「名前 ±差」
- サーバーのゴーストも、リプレイと同じく**各譜面の上位20人分だけ**残す(`mlidar_ghost_put` が保存のときに21位以下を消す)。21位以下の人のライバルは「残っている中でいちばん下(20位)」になる

### みんなでライブの招待リンク
- ルームの「🔗 招待リンク」は `https://music-lidar.com/?room=CODE`。開いてタイトルを抜けると、ログイン済みならそのルームへ入る。ログインしていなければログインのあとで入る(`live.js` の `joinFromLink`)

### 季節イベント(`season.js`)
- 期間(日本時間): 春 3/20〜4/15・夏 7/20〜8/31・ハロウィン 10/15〜10/31・クリスマス 12/1〜1/31。イベントID は「種類+年」(クリスマスの1月は前の年)。`?event=spring` などで期間外でも見られる(`event.js` の PREVIEW と共通)
- ホームのお知らせから、イベント曲(イベントIDから乱数で選ぶ HARD Lv5以上)を遊ぶ。ランキングは `mlidar_scores` の `song = 'ev-<イベントID>'`
- ログイン中なら `mlidar_event_join` で `meta.events` にイベントIDが入り、限定の着せ替え(春 ノーツ「さくら」/ 夏 判定ライン「花火」/ ハロウィン ノーツ「パンプキン」/ クリスマス 判定ライン「ホーリーナイト」)。期間はサーバーの `mlidar_event_open` でも確かめる
- バッジ「イベント参加」「四季めぐり」は `meta.events` から計算する
- クリスマスの見た目(雪・帽子)は今までどおり `event.js`

### 埋め込みカード
- 選曲画面の「⧉ 埋め込みコード」で、「カード」(`card.html`)と「ゲームまるごと」(`?embed=1`)の2つのコードを出す

### ホーム画面に追加(`install.js`)
- 3曲遊んだ人にホームで案内する。Chrome / Edge はブラウザのインストール画面、iPhone / iPad は手順を出す。閉じたら14日出さない

### 曲ページ・まとめ・SEO(`tools/build-pages.mjs`, `tools/collections.mjs`)
- `release.py` の最後に動く。`index.html` をもとに、曲ページ(タイトル・説明・共有画像・JSON-LD・似た曲とまとめへのリンク)、画面ページ、まとめページ12種類と一覧、`sitemap.xml` を作る
- サイトのURLは `build-pages.mjs` の `SITE`(`https://music-lidar.com/`)

### MV(`mv.js` と `js/mv/*.js`)
- **全曲に特製MVがある**(2026-11-19)。どの曲にも、曲に合わせた絵の場面がある
- 古い20曲の特製MV: `mv.js` の `MVS`(曲ごとにシーン `{ from, to, draw(c) }` を拍で並べたもの)
- 動画MV: `VIDEO_MVS`(INMU KING。並べ替えた `.bin` を元に戻して再生)
- それ以外の112曲: `js/mv/s01-gentle.js` 〜 `s11-extreme.js`。**曲を遊ぶときにだけ読み込む**(`prepareMV(id)` を `createMV` の前に await。`main.js` の `startGame` と `tools/export.html` で呼んでいる)。書き方は `js/mv/README.md`
  - 形は `{ intro, outro, looks: [[lvl, (c, P, k) => 描く], ...] }`。`customDef` が、曲の区間(内蔵曲は `analyzeSections`、音源の曲は譜面の密度から `chartSections`)の盛り上がり(lvl 0〜2)に合う場面を割り当てる。同じ場面が続かないように、となりの盛り上がりの場面を借りる。曲名の表示(後ろに薄い帯)・場面の切り替わりの光・最後のフェードアウトは共通
  - どのファイルに入っているか(`MV_INDEX`)は、`tools/release.py` が `js/mv/*.js` の `export default` から自動で作る
  - 部品(`vgrad` `text` `tunnel` など)は `mv.js` の最後でまとめて export している
  - 確かめ方: `tools/mv-preview.html?ids=曲ID`(区間ごとのコマを並べる)、`?check=1`(全曲を0.25秒ごとに描いて、エラーがないか)
  - 白い点滅は 0.5 秒以上の間隔・控えめの明るさにする(光に敏感な人への配慮)。乱数(`Math.random`)は使わない(書き出しの動画が毎回同じになるように)
- どれもない曲(読み込んだ曲など)は、ジャンルに合わせた自動MV(`themeOf` / `autoDef`)

---

## 10. Supabase の一覧

### テーブル
| テーブル | 中身 |
|---|---|
| `mlidar_accounts` | アカウント(名前・コイン・キャラ `units`・編成 `team`・`stats`・`daily`・受け取り済み `claimed`・`best`・`meta`・`invite_code`・`is_admin`・`ka_account_id`) |
| `mlidar_sessions` | ログインのトークン |
| `mlidar_scores` | ランキング(`song`, `diff`, `client_id`, 名前, スコアなど)。週替わりも `weekly-YYYYMMDD` でここ |
| `mlidar_units` / `mlidar_banners` | キャラ図鑑 / 期間限定ガチャ |
| `mlidar_skins` | 着せ替えの一覧(値段・入手方法) |
| `mlidar_charts` / `mlidar_chart_scores` / `mlidar_chart_likes` | みんなの譜面(`song` は曲の id か `a:<音声id>`) |
| `mlidar_replays` | リプレイ(1人1譜面1つ。キーの押し・離しの記録。各譜面の上位20人だけ) |
| `mlidar_song_daily` | 人気曲: 曲・日ごとのプレイ回数(90日まで) |
| `mlidar_discord_feed` | Discord の「記録」チャンネルへのお知らせの順番待ち(30日まで) |
| `mlidar_mails` | 受信メール(karubiwakame@gmail.com)。差出人・件名・本文は暗号化(鍵は Vault の `mlidar_request_key`)。500通を超えたら古いものから消す |
| `mlidar_wishes` | 七夕の願いごと(1人1年1つ。管理者が出す/出さないを決める) |
| `mlidar_lyrics` | 曲の歌詞と時刻(RLS でポリシーなし。関数からだけ触る) |
| `mlidar_audio` | 管理者が置いた音声の情報と復号の鍵(RLS でポリシーなし。関数からだけ触る) |
| `mlidar_live_lobby` | 公開中の部屋一覧(今使っている) |
| `mlidar_live_rooms` / `mlidar_live_members` | 昔のライブ方式。**消さない** |
| `mlidar_match_queue` | ランダムマッチの待ち行列 |
| `mlidar_requests` | お問い合わせ |
| `mlidar_friends` | フレンド(`a` → `b` の申請。`status` = `pending` / `ok`) |
| `mlidar_ghosts` | オンラインのゴースト(曲・難易度・端末/アカウントID ごとに1つ。いちばん良いスコアの判定の記録) |
| `mlidar_polls` | 配信の視聴者投票(候補 `options`、票 `votes` = 端末ID → 何番目) |

### ブラウザから呼ぶ関数(主なもの)
- アカウント: `mlidar_state`, `mlidar_catalog`, `mlidar_ka_*`, `mlidar_login`, `mlidar_register`, `mlidar_logout`, `mlidar_ping`
- プレイ: `mlidar_play_result`, `mlidar_submit`, `mlidar_ranking`, `mlidar_song_stats`, `mlidar_profile`, `mlidar_rate_set`
- ガチャ・編成・ミッション: `mlidar_gacha`, `mlidar_gacha_event`, `mlidar_banners`, `mlidar_set_team`, `mlidar_claim`, `mlidar_dan_clear`
- 続けたくなる要素: `mlidar_login_bonus`, `mlidar_season_claim`, `mlidar_skin_list` / `_buy` / `_equip`, `mlidar_weekly_submit` / `_claim` / `_hall`, `mlidar_invite_code` / `_lookup` / `_redeem`
- 対戦: `mlidar_lobby_put` / `_list` / `_close`, `mlidar_match_poll` / `_cancel` / `_done`
- フレンド: `mlidar_friend_request` / `_respond` / `_remove` / `_list` / `_ranking`
- ゴースト・投票・イベント: `mlidar_ghost_put` / `_get`, `mlidar_poll_create` / `_vote` / `_get` / `_close`, `mlidar_event_join`
- 譜面: `mlidar_chart_save` / `_list` / `_get` / `_delete` / `_like` / `_play` / `_ranking` / `_submit`。今週のおすすめ: `mlidar_chart_feature`(管理者)/ `mlidar_chart_featured`(選んでから14日・最大3つ。みんなの譜面の上とホームの CHARTS の札に出る)
- リプレイ: `mlidar_replay_put` / `_top` / `_get`
- 自分で選んだ音声: `mlidar_audio_get`(だれでも。曲の情報と鍵)/ `mlidar_audio_list` / `mlidar_audio_meta`(管理者)。置く・消すは Edge Function `mlidar-audio`
- お問い合わせ・管理: `mlidar_request_send` / `_mine` / `_list` / `_set`, `mlidar_admin_overview`
- 訪問とプレイの集計: `mlidar_hit`(だれでも)/ `mlidar_admin_traffic`(管理者)。テーブル `mlidar_hits`
- 内部用(ブラウザから呼ばない): `mlidar_auth`, `mlidar_friend_ids`, `mlidar_state_of`, `mlidar_play_result_core`, `mlidar_missions`, `mlidar_team_fx`, `mlidar_daily`, `mlidar_today`, `mlidar_week_key`, `mlidar_season_key`, `mlidar_season_reward`, `mlidar_give_skin`, `mlidar_event_open`

新しい関数を足すときは `security definer` と `set search_path = public` を付け、`revoke all … from public` してから、必要なら `grant execute … to anon, authenticated`。

---

## 11. 作業のルール

### 公開の手順
1. `js/changelog.js` の先頭に1つ足す(大きな機能 = 2つ目の数字、修正・小さな改善 = 3つ目の数字)
2. `python tools/release.py`(バージョン付け・`version.json`・曲ページ・まとめ・サイトマップ)
3. `git fetch` で先に進んでいないか確かめる
4. `git add -A -- . ':!AI_GUIDE.md'` → コミット → `git push origin main`(GitHub Pages に1〜2分で出る)
- **Discord への自動投稿**: `js/changelog.js` が変わった push を main に送ると、GitHub Actions(`.github/workflows/discord-update.yml` → `tools/discord-update.mjs`)が、増えたバージョンを公式Discordの「🆕｜アップデート」チャンネルに投稿する。どこで編集しても push されれば投稿される。投稿先の Webhook は GitHub の Secret `DISCORD_UPDATE_WEBHOOK`。Actions のページから手動で動かすと、いちばん新しいバージョンを投稿する
- 生成されたページ(`home/` `music/` など)は手で直さず、`index.html` や `tools/` を直して `release.py` で作り直す

### 確かめ方
- `python <scratchpad>/range_server.py 8765 "C:/Users/4yoma/Desktop/Claude"` で配信し、`http://localhost:8765/music-lidar/` を開く(`file://` では動かない)
- ログインが要るテストは、SQL でテスト用のアカウントとセッション(決まったトークン)を作り、localStorage の `mlidar:token` に入れる。**終わったらテスト用の行(scores・sessions・accounts)を消す**
- 音を読ませるには、タイトル画面で本物のキー操作(Enter)が要る

### スマホ(タッチ)
- タッチの端末では `body.touch` が付く。CSS の最後の「スマホ(タッチ)の操作感」で、ボタンを押しやすい大きさ(36px 以上)にし、入力欄を 16px にしている(iPhone は 16px 未満の入力欄を押すと画面を拡大してしまう)
- **画面の端の余白(1.88.4〜)**: スマホ・タブレット(`IS_TOUCH`)は `game.geom()` でレーンの左右を 32px ずつあける(PC は 12px)。画面の端からのスワイプは iPhone・Android の「戻る」操作に取られ、いちばん左のレーンが押せない・固まると報告があったため
- **押したままの取りこぼし対策(1.88.4〜)**: 離した通知を取りこぼすとレーンが押したまま(`game.pressed`)になり、`pressAt` が押し直しを受け付けない。タッチもキーも、押したときにそのレーンをほかの指・キーが押していないのに押したままなら、いったん `release` してから押す
- **消えた指の記録を捨てる(1.89.3〜)**: iPhone の Chrome などは画面の左端を「戻る」操作に使うので、左レーンの指の `touchend` / `touchcancel` が届かないことがある。すると `touchLane` に古い指が残り、上の対策でも「ほかの指が押している」扱いになって左レーンが固まっていた。`touchstart` / `touchmove` / `touchend` のたびに `dropLostTouches` が、`ev.touches`(いま画面にある指)にない記録を消してそのレーンを離す
- プレイ中のタッチは `main.js` の `touchstart` / `touchmove` / `touchend`。レーンは `lanesOfTouch` → `game.lanesAt(x, y, edge)`(キャンバス内の座標。ふだんは横の位置だけで決め、回転ギミック中は縦の位置も使う。指をすべらせて隣のレーンに移れる)。`touchLane` は指ごとに押しているレーンの配列で、ほかの指が押しているレーンは離さない
- **境目タップ(1.87.0〜)**: 2つのレーンの境目からレーン幅の18%以内(`EDGE_TAP`)を押すと、両隣の2レーンを押したことにする(キーボードは2キー同時に押せるので、スマホでも1本の指で同時押しを取れるように)。設定「境目タップで2レーン押す」(`settings.edgeTap`。初期はオン)。回転ギミック中は1レーンだけ。何もないレーンを押しても空振り(タップ音だけ)だが、隣のレーンのノーツが GOOD の幅に入っていれば早めに取ってしまうことはある
- **プレイ中は横画面(1.87.0〜)**: 設定「プレイ中は横画面にする」(`settings.landscape`。初期はオフ)。`startGame` の頭(押した操作の中)で `enterLandscape()` が全画面にして `screen.orientation.lock('landscape')`。固定できない端末(iPhone など)で縦向きなら、横にするよう案内を出す。リザルトまでは横のまま、ほかの画面に移ると `leaveLandscape()` で戻す。みんなでライブは開始の合図で始まるので自動では横にしない。プレイ画面は `game.geom()` が毎フレーム画面の大きさから作るので、横向きでもそのまま描ける
- 画面の切り欠き(ノッチ)は `.screen` の `env(safe-area-inset-*)` で避けている
- **スマホの選曲画面(幅 760px 以下、1.73.0〜)**: 曲は縦のリスト(`.song-list` の中だけスクロール)、下の `.detail` は「曲名・難易度・PLAY」だけを出す。自己ベスト・統計・練習・共有・ランキングは「記録・ランキング」ボタン(`#d-more`)で下から引き出すシート(`.detail.open`、`main.js` の `setDetailOpen`)。外を押すと閉じ(その1回は下の曲を押さない)、選曲画面を出ると `show()` が閉じる。CSS は style.css の最後の「スマホの画面(1.73.0)」
- スマホのリザルトのボタンは2列で、RETRY と「選曲へ」を下に大きく出す。ホームなどの `.topbar .nav` は折り返さず横にすべらせる

### 気をつけること
- 外部の曲(魔王魂・INMU KING〔ニコニ・コモンズ〕・しゃろう〔OpenTracks〕・ああああ さん〔水の追憶・僕たちの旅とエピローグ。〕・かめりあ さん〔許可を得て使用。音源は必ず暗号化〕・御箸ねくらぁ。さん〔ゲーム使用可の BGM〕・ナツメダ ユキさん〔暮らし泳ぐ・飛行白書。許可を得て使用〕)のクレジットを消さない。広告や収益のある場所に出すときはライセンスを確かめ直す(ああああ さんの曲は収益化のとき連絡が必要)
- 全曲の先読みはしない(合成にCPUを数分・メモリを数GB使うため)。選んだ曲だけ用意する
- 曲の `id` と `urlId` は公開後に変えない(ランキングと曲ページのURLが変わってしまう)
- 関係するほかのリポジトリ: **game-links**(ポータル・かるわかGAMESアカウント・`oauth.html` の `ALLOWED`・`mlidar-move.html`・ポータルの MUSIC LiDAR へのリンク)

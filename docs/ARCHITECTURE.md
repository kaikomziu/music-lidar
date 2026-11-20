# MUSIC LiDAR の仕組み(作業前にまずこれを読む)

このファイルは、コードを毎回読み直さなくても全体がわかるようにするための解説です。

- **書いていないことが必要になったら、コードを読んでこのファイルに追記する。** 仕組みを変えたら、同じコミットでここも直す
- コードと食い違っていたら、コードが正しい。気づいたらここを直す
- 最終更新: 2026-11-19(1.62.0 時点)

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
| `streaming.html` | 実況・配信ガイドライン(日本語と英語)。外部の曲9曲の収益化の扱いもここに書いてある。外部の曲を足したら表に足す |
| `audio/` `video/` | 音源ファイル曲の音・動画MV。ライセンスの都合で並べ替えた `.bin`(`tools/scramble_audio.py`)か、AES-GCM で暗号化した `.bin`(`tools/encrypt_audio.mjs`)。**平文の mp3 / mp4 は絶対にコミットしない**(2026-11-18 に履歴から取り除き、強制 push 済み。鍵は公開JSにあるので完全な防止ではない) |
| `sw.js` | Service Worker(オフライン対応)。ページはネット優先、`?v=` 付きの JS・CSS・画像はキャッシュ優先 |
| `version.json` | 今のバージョン。ページが起動時に読み、HTMLが古ければ `?v=` を付けて読み直す |
| `sitemap.xml` | 自動生成 |
| `supabase/functions/mlidar-daily/` | Edge Function(Daily.co の SFU 部屋を発行。今は使っていない) |
| `supabase/functions/mlidar-audio/` | Edge Function(譜面メーカーで管理者が選んだ音声の置き場所を発行・確認・削除。下の「自分で選んだ音声」) |
| `tools/` | `release.py`(公開前に必ず実行)、`build-pages.mjs`、`collections.mjs`、`export.py` / `export.html`(mp3・mp4 書き出し)、`scramble_audio.py`、`og.html`(曲ごとの共有画像。受け取って保存するローカルサーバー `og_save_server.py` と一緒に使う。手順はファイルの先頭)、`make_zh_hant.py`(繁体字の辞書を簡体字から作る) |
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
| `audio.js` | Web Audio。内蔵曲のオフライン合成(`renderEvents`)、タップ音、試聴、音量 |
| `audio-cache.js` | 合成した音を IndexedDB に保存。キーは「曲ID + 曲データのハッシュ + `SYNTH_VERSION`」。**音色を変えたら `SYNTH_VERSION` を上げる** |
| `external-audio.js` | 音源ファイル曲の読み込み(並べ替えの復元・失敗時の再試行) |
| `composer.js` | 曲の楽譜(トラッカー風)→ イベント列 → 譜面。`generateChart`、乱数 `mulberry32` / `hashStr` |
| `gimmick.js` | 譜面ギミック(停止・変速・隠し)。ノーツ位置は「スクロール量 S(t)」で決める |
| `analyzer.js` | 手持ちの音声ファイルから譜面候補を作る(オンセット検出と BPM 推定) |
| `mv.js` | 背景のMV。曲ごとの特製MV(`MVS`)、動画MV(`VIDEO_MVS`)、それ以外はジャンル別の自動MV |
| `jacket.js` | ジャケット画像の自動生成(画面に見えてから描く) |
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
| `custom-audio.js` | 譜面メーカーで管理者が自分で選んだ音声(暗号化・アップロード・復号、曲のエントリー) |
| `player.js` | きくだけモード(音楽プレーヤー) |
| `event.js` | 季節イベント(クリスマス 12/1〜1/31。`?event=xmas` / `?event=off` で確認できる) |
| `keyconfig.js` | キー配置の設定 |
| `install.js` | 「ホーム画面に追加」の案内 |
| `friends.js` | フレンド(申請・承認・一覧・オンライン表示・フレンドランキング) |
| `badges.js` | 実績バッジ(記録から計算する。保存はしない) |
| `i18n.js` | 多言語表示(英語・韓国語・中国語。辞書で画面の文字を置き換える)。main.js の最初に読む。辞書は `EN`(この中)・`i18n-ko.js`・`i18n-zh-hans.js`・`i18n-zh-hant.js`(自動生成) |
| `social.js` | すぐ遊べる導線(いますぐ1曲)・次のおすすめ・X に投稿・デイリーの絵文字シェアと連続日数・オンラインのゴースト |
| `recorder.js` | 縦型のプレイ動画(1080×1920)の録画 |
| `season.js` | 季節イベント(春・夏・ハロウィン・クリスマス)のスコアアタック・限定の着せ替えとバッジ・季節の粒 |
| `poll.js` | 配信者モードの視聴者リクエスト投票 |
| `request.js` | お問い合わせ(リクエスト箱) |
| `admin.js` | 管理者ページ |
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
  - **暗号化を求められた曲(かめりあさんの GHOST 2曲)と Crying Red は `node tools/encrypt_audio.mjs 入力.mp3 audio/<id>.bin`** で AES-GCM 暗号化し、表示された `aes:...` を `audioKey` に書く(`external-audio.js` が `aes:` で始まる鍵なら復号する)。鍵は公開JSに入るので完全な防止ではない。m4a は Firefox でも鳴るように mp3 にしてから、埋め込みのジャケット画像を外して暗号化する
  - **高難易度で裏の音も拾う譜面(GHOST 2曲の NORMAL・HARD)は `python tools/audiochart/layered.py <既存の.data.js> <T_END> <HARDの目標nps> <NORMALの目標nps>`**(chart.py のあと、同じ作業フォルダで)。左手(D・F)=低い音(キック・ベース)、右手(J・K)=中高い音(シンセ・声・ハット)で別々に拾って重ねる。8分まで・同じ手で8分が続けば2つのキーを交互・同じキーは 0.2 秒以上あける。NORMAL は同じ手の8分の連続を作らない。EASY は既存のまま
  - 速い曲(BPM 200 前後より上)の譜面は `CHART_FAST=1 python chart.py …` で作る(HARD は8分まで・NORMAL は4分まで・EASY は2分まで、時刻は拍の格子どおり、同じキーの8分連打なし)。キーボードで叩ける細かさにするため
  - ライセンスで「取り出しにくくする」必要がある曲は `tools/scramble_audio.py` で並べ替えて `.bin` + `audioKey`。**CC BY の曲は技術的な制限をかけてはいけないので、並べ替えずに mp3 のまま置く**(`audioKey` なし。`.gitignore` の `!audio/<名前>.mp3` で個別に許す)
  - **OpenTracks の曲(SUMMER TRIANGLE)**: OpenTracks は、音楽ゲーム・リズムゲームでの利用を通常ライセンスの範囲外としている(2026-11-11 のお知らせ。範囲内に含めるかは検討中)。2026-11-11 より前に公開したゲームに入っている音源は、そこから3年をめどに使ってよい猶予がある。SUMMER TRIANGLE は 2026-10-23 に入れたので猶予の対象。**OpenTracks の曲を新しく足すのは不可**。2029-11 ごろまでに、OpenTracks の方針を確かめて、使い続けてよいか(または外すか)を決める。並べ替えて「通常の操作で取り出せない」形にしておくこと、「きくだけ」に入れないことも続ける
  - ほかの作者さんの曲を足したら、`credit`(と `creditUrl`)、タイトル右下のクレジット、`guide.html` のフッター、`streaming.html` の表、README のクレジットにも足す
- 曲を足す手順: ファイルを作る → `js/songs/index.js` に import を1行 → `tools/og.html?ids=曲ID` で共有画像 `og.jpg` を作る → `python tools/release.py`(曲ページとサイトマップができる)→ `python tools/export.py` で `D:\MUSIC_LiDAR_export` に mp3 / mp4 を書き出す
- 週替わりスコアアタックとデイリーは、曲一覧から乱数で選ぶ。**曲を足すと、選ばれる曲が変わることがある**

### 歌詞の表示
- 曲ファイルに `lyrics`(`js/songs/<id>.lyrics.js`: `[[歌い始めの秒, 歌い終わりの秒, 行], ...]`)があると、プレイ中に画面の上に今の行を出し、歌っている所までを曲の色でぬる。次の行は4秒前から下に小さく出す(`game.js` の `drawLyrics`)。チュートリアルの字幕が出ている間は字幕を優先
- 設定の「歌詞を表示」(`settings.lyrics`、初期は表示)。チュートリアルでは出さない。今あるのは INMU KING だけ
- 時刻は `tools/audiochart/lyrics_align.py <歌声だけの.wav> <歌詞.txt> <BPM> <1拍目> <出力> [ずらす秒]` で自動で合わせる。歌声は「原曲 − インスト」(INMU KING は `_vtmp/` のオリジナルとインストが1サンプルもずれていないので引き算で取れる)。歌声の立ち上がりを2拍ごとに数え、行の長さ(モーラ数の目安)に見合う数の半小節を順に割り当てる。声のない半小節は間奏として飛ばす
- **耳で直すとき**: `?lyricsync=1` を付けて開き、遊びながら各行の歌い始めで Enter を押す。押した時刻にその行を置き直し(行の長さはそのまま)、全体の JSON をクリップボードにコピーする。それを `.lyrics.js` に貼る
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
- 曲ファイルは拍(`beat` / `beats`)、譜面メーカーは秒(`t` / `dur`)で保存する。`buildScroll` が `S(t)`(スクロール量)と `coverAt` / `hideAt` / `swayAt` を返す
- `cover` / `hidden` / `sway` は「値がなめらかに `to` へ変わる」同じ形(`level(type)`)

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
- 演出の強さは `settings.fx`(0 オフ / 1 控えめ / 2 派手)

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
- `BADGES` に27種類。サーバーの記録(`best` / `stats` / `meta`)から、その場で計算する。自分の state(`acc.getState()`)でも、他人のプロフィール(`mlidar_profile`)でも同じ関数で計算できる
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

### 縦型のプレイ動画(`recorder.js`)
- リザルトの「🎬 縦動画で録る」→ もう一度遊ぶあいだ録画。`#stage` の真ん中を切り抜き、上に曲名・下にスコアを足した 1080×1920 の canvas を 30fps で描き、音は `audio.js` の `recordTap()`(BGM とタップ音の出口を MediaStreamDestination にもつなぐ)
- mp4 が録れるブラウザは mp4、ほかは webm。途中でやめたら捨てる。ライブ・譜面メーカーでは録らない

### オンラインのゴースト
- 設定の「ゴースト」(`settings.ghostMode`: `self` / `rival` / `top` / `off`。古い `settings.ghost` は true/false)
- 自己ベストを出すと、ランキングへ送ったあとに判定の記録を `mlidar_ghost_put` で送る(ランキングにそれ以上のスコアがあるときだけ受け付ける)。形は端末のゴーストと同じで、頭文字を小文字(p/g/o/m)に
- 遊ぶ前に `mlidar_ghost_get`(rival = 自分のすぐ上、top = 1位。自分より上の人がいなければ null)。1.5秒で返らなければ自己ベスト。画面には「名前 ±差」

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
- 譜面: `mlidar_chart_save` / `_list` / `_get` / `_delete` / `_like` / `_play` / `_ranking` / `_submit`
- 自分で選んだ音声: `mlidar_audio_get`(だれでも。曲の情報と鍵)/ `mlidar_audio_list` / `mlidar_audio_meta`(管理者)。置く・消すは Edge Function `mlidar-audio`
- お問い合わせ・管理: `mlidar_request_send` / `_mine` / `_list` / `_set`, `mlidar_admin_overview`
- 内部用(ブラウザから呼ばない): `mlidar_auth`, `mlidar_friend_ids`, `mlidar_state_of`, `mlidar_play_result_core`, `mlidar_missions`, `mlidar_team_fx`, `mlidar_daily`, `mlidar_today`, `mlidar_week_key`, `mlidar_season_key`, `mlidar_season_reward`, `mlidar_give_skin`, `mlidar_event_open`

新しい関数を足すときは `security definer` と `set search_path = public` を付け、`revoke all … from public` してから、必要なら `grant execute … to anon, authenticated`。

---

## 11. 作業のルール

### 公開の手順
1. `js/changelog.js` の先頭に1つ足す(大きな機能 = 2つ目の数字、修正・小さな改善 = 3つ目の数字)
2. `python tools/release.py`(バージョン付け・`version.json`・曲ページ・まとめ・サイトマップ)
3. `git fetch` で先に進んでいないか確かめる
4. `git add -A -- . ':!AI_GUIDE.md'` → コミット → `git push origin main`(GitHub Pages に1〜2分で出る)
- 生成されたページ(`home/` `music/` など)は手で直さず、`index.html` や `tools/` を直して `release.py` で作り直す

### 確かめ方
- `python <scratchpad>/range_server.py 8765 "C:/Users/4yoma/Desktop/Claude"` で配信し、`http://localhost:8765/music-lidar/` を開く(`file://` では動かない)
- ログインが要るテストは、SQL でテスト用のアカウントとセッション(決まったトークン)を作り、localStorage の `mlidar:token` に入れる。**終わったらテスト用の行(scores・sessions・accounts)を消す**
- 音を読ませるには、タイトル画面で本物のキー操作(Enter)が要る

### スマホ(タッチ)
- タッチの端末では `body.touch` が付く。CSS の最後の「スマホ(タッチ)の操作感」で、ボタンを押しやすい大きさ(36px 以上)にし、入力欄を 16px にしている(iPhone は 16px 未満の入力欄を押すと画面を拡大してしまう)
- プレイ中のタッチは `main.js` の `touchstart` / `touchmove` / `touchend`。レーンは `game.laneAt(x)`(横の位置だけで決める。指をすべらせて隣のレーンに移れる)
- 画面の切り欠き(ノッチ)は `.screen` の `env(safe-area-inset-*)` で避けている

### 気をつけること
- 外部の曲(魔王魂・INMU KING〔ニコニ・コモンズ〕・しゃろう〔OpenTracks〕・ああああ さん・かめりあ さん〔許可を得て使用。音源は必ず暗号化〕・御箸ねくらぁ。さん〔ゲーム使用可の BGM〕)のクレジットを消さない。広告や収益のある場所に出すときはライセンスを確かめ直す(ああああ さんの曲は収益化のとき連絡が必要)
- 全曲の先読みはしない(合成にCPUを数分・メモリを数GB使うため)。選んだ曲だけ用意する
- 曲の `id` と `urlId` は公開後に変えない(ランキングと曲ページのURLが変わってしまう)
- 関係するほかのリポジトリ: **game-links**(ポータル・かるわかGAMESアカウント・`oauth.html` の `ALLOWED`・`mlidar-move.html`・ポータルの MUSIC LiDAR へのリンク)

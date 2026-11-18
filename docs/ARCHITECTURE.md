# MUSIC LiDAR の仕組み(作業前にまずこれを読む)

このファイルは、コードを毎回読み直さなくても全体がわかるようにするための解説です。

- **書いていないことが必要になったら、コードを読んでこのファイルに追記する。** 仕組みを変えたら、同じコミットでここも直す
- コードと食い違っていたら、コードが正しい。気づいたらここを直す
- 最終更新: 2026-11-18(1.59.0 時点)

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
| `music/<urlId>/` | 曲ごとのページ(SEO用)。これも自動生成。`og.png` を置くと共有画像になる |
| `collections/` | 曲のまとめページ(自動生成。定義は `tools/collections.mjs`) |
| `guide.html` | 遊び方と全曲一覧(曲の行は自動で更新される) |
| `streaming.html` | 実況・配信ガイドライン(日本語と英語)。外部の曲4曲の収益化の扱いもここに書いてある。外部の曲を足したら表に足す |
| `audio/` `video/` | 音源ファイル曲の音・動画MV。ライセンスの都合で並べ替えた `.bin`(`tools/scramble_audio.py`)。**平文の mp3 / mp4 は絶対にコミットしない**(2026-11-18 に履歴から取り除き、強制 push 済み。鍵は公開JSにあるので完全な防止ではない) |
| `sw.js` | Service Worker(オフライン対応)。ページはネット優先、`?v=` 付きの JS・CSS・画像はキャッシュ優先 |
| `version.json` | 今のバージョン。ページが起動時に読み、HTMLが古ければ `?v=` を付けて読み直す |
| `sitemap.xml` | 自動生成 |
| `supabase/functions/mlidar-daily/` | Edge Function(Daily.co の SFU 部屋を発行。今は使っていない) |
| `tools/` | `release.py`(公開前に必ず実行)、`build-pages.mjs`、`collections.mjs`、`export.py` / `export.html`(mp3・mp4 書き出し)、`scramble_audio.py` |
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
| `player.js` | きくだけモード(音楽プレーヤー) |
| `event.js` | 季節イベント(クリスマス 12/1〜1/31。`?event=xmas` / `?event=off` で確認できる) |
| `keyconfig.js` | キー配置の設定 |
| `install.js` | 「ホーム画面に追加」の案内 |
| `friends.js` | フレンド(申請・承認・一覧・オンライン表示・フレンドランキング) |
| `badges.js` | 実績バッジ(記録から計算する。保存はしない) |
| `i18n.js` | 英語表示(辞書で画面の文字を置き換える)。main.js の最初に読む |
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
  - ライセンスで「取り出しにくくする」必要がある曲は `tools/scramble_audio.py` で並べ替えて `.bin` + `audioKey`。**CC BY の曲は技術的な制限をかけてはいけないので、並べ替えずに mp3 のまま置く**(`audioKey` なし。`.gitignore` の `!audio/<名前>.mp3` で個別に許す)
  - ほかの作者さんの曲を足したら、`credit`(と `creditUrl`)、タイトル右下のクレジット、`guide.html` のフッター、`streaming.html` の表、README のクレジットにも足す
- 曲を足す手順: ファイルを作る → `js/songs/index.js` に import を1行 → `python tools/release.py`(曲ページとサイトマップができる)→ `python tools/export.py` で `D:\MUSIC_LiDAR_export` に mp3 / mp4 を書き出す
- 週替わりスコアアタックとデイリーは、曲一覧から乱数で選ぶ。**曲を足すと、選ばれる曲が変わることがある**

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
- 同じ曲データなら毎回同じ譜面になる(乱数の種は固定)

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
| `lang` | 表示の言語(`auto` / `ja` / `en`) |
| `rankMode` | 選曲画面のランキングの表示(`all` / `friend`) |
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
- `BADGES` に23種類。サーバーの記録(`best` / `stats` / `meta`)から、その場で計算する。自分の state(`acc.getState()`)でも、他人のプロフィール(`mlidar_profile`)でも同じ関数で計算できる
- プロフィールでは、自分のときはまだのバッジも薄く(進み具合のバーつき)、他人のときは持っているものだけ出す
- ホームを出すたびに、前に覚えた一覧(`mlidar:badges:<ID>`)と比べ、増えていればお知らせを出す
- バッジを足すときは `BADGES` に `{ id, icon, name, desc, n: (c) => 数, goal }` を足す。必要な数は `ctx()` に足す

### 英語表示(`i18n.js`)
- 言語の決め方: `?lang=en` / `?lang=ja` > 設定の「言語 / Language」(`mlidar:lang`)> ブラウザの言語(日本語以外なら英語)
- 画面の文字(テキストと `title` / `placeholder` / `aria-label`)が辞書 `EN` の日本語と**まるごと同じ**なら英語に置き換える。あとから JS が出した文字も MutationObserver で置き換える。タブの題名も `｜` で区切った部分ごとに置き換える
- 辞書にない文(トーストやリザルトの細かい文など)は日本語のまま。**新しいボタンや見出しを足したら、`EN` にも英語を足す**
- 言語を変えたらページを読み直す(`setLang`)

### 埋め込み(`?embed=1`)
- 曲ページ + `?embed=1` を iframe に入れて使う。`body.embed` が付き、その曲の選曲・プレイ・リザルトだけになる。チュートリアル・ログイン案内・Service Worker なし
- 選曲画面の「⧉ 埋め込みコード」でコピーできる

### 配信者モード(`settings.stream`)
- `'on'`: スコアとコンボを大きく、ライブの参加コードを画面の上に出す。`'green'`: さらに背景を #00ff00 にして、MVと点群を描かない

### ホーム画面に追加(`install.js`)
- 3曲遊んだ人にホームで案内する。Chrome / Edge はブラウザのインストール画面、iPhone / iPad は手順を出す。閉じたら14日出さない

### 曲ページ・まとめ・SEO(`tools/build-pages.mjs`, `tools/collections.mjs`)
- `release.py` の最後に動く。`index.html` をもとに、曲ページ(タイトル・説明・共有画像・JSON-LD・似た曲とまとめへのリンク)、画面ページ、まとめページ12種類と一覧、`sitemap.xml` を作る
- サイトのURLは `build-pages.mjs` の `SITE`(`https://music-lidar.com/`)

### MV(`mv.js`)
- 特製MV: `MVS` に曲IDとシーン(`{ from, to, draw(c) }`。拍の範囲ごとの描き方)を登録する
- 動画MV: `VIDEO_MVS`(並べ替えた `.bin` を元に戻して再生)
- どちらもない曲は、ジャンルに合わせた自動MV(`themeOf`)

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
| `mlidar_charts` / `mlidar_chart_scores` / `mlidar_chart_likes` | みんなの譜面 |
| `mlidar_live_lobby` | 公開中の部屋一覧(今使っている) |
| `mlidar_live_rooms` / `mlidar_live_members` | 昔のライブ方式。**消さない** |
| `mlidar_match_queue` | ランダムマッチの待ち行列 |
| `mlidar_requests` | お問い合わせ |
| `mlidar_friends` | フレンド(`a` → `b` の申請。`status` = `pending` / `ok`) |

### ブラウザから呼ぶ関数(主なもの)
- アカウント: `mlidar_state`, `mlidar_catalog`, `mlidar_ka_*`, `mlidar_login`, `mlidar_register`, `mlidar_logout`, `mlidar_ping`
- プレイ: `mlidar_play_result`, `mlidar_submit`, `mlidar_ranking`, `mlidar_song_stats`, `mlidar_profile`, `mlidar_rate_set`
- ガチャ・編成・ミッション: `mlidar_gacha`, `mlidar_gacha_event`, `mlidar_banners`, `mlidar_set_team`, `mlidar_claim`, `mlidar_dan_clear`
- 続けたくなる要素: `mlidar_login_bonus`, `mlidar_season_claim`, `mlidar_skin_list` / `_buy` / `_equip`, `mlidar_weekly_submit` / `_claim` / `_hall`, `mlidar_invite_code` / `_lookup` / `_redeem`
- 対戦: `mlidar_lobby_put` / `_list` / `_close`, `mlidar_match_poll` / `_cancel` / `_done`
- フレンド: `mlidar_friend_request` / `_respond` / `_remove` / `_list` / `_ranking`
- 譜面: `mlidar_chart_save` / `_list` / `_get` / `_delete` / `_like` / `_play` / `_ranking` / `_submit`
- お問い合わせ・管理: `mlidar_request_send` / `_mine` / `_list` / `_set`, `mlidar_admin_overview`
- 内部用(ブラウザから呼ばない): `mlidar_auth`, `mlidar_friend_ids`, `mlidar_state_of`, `mlidar_play_result_core`, `mlidar_missions`, `mlidar_team_fx`, `mlidar_daily`, `mlidar_today`, `mlidar_week_key`, `mlidar_season_key`, `mlidar_season_reward`, `mlidar_give_skin`

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
- 外部の曲(魔王魂・INMU KING〔ニコニ・コモンズ〕・しゃろう〔OpenTracks〕・ああああ さん)のクレジットを消さない。広告や収益のある場所に出すときはライセンスを確かめ直す(ああああ さんの曲は収益化のとき連絡が必要)
- 全曲の先読みはしない(合成にCPUを数分・メモリを数GB使うため)。選んだ曲だけ用意する
- 曲の `id` と `urlId` は公開後に変えない(ランキングと曲ページのURLが変わってしまう)
- 関係するほかのリポジトリ: **game-links**(ポータル・かるわかGAMESアカウント・`oauth.html` の `ALLOWED`・`mlidar-move.html`・ポータルの MUSIC LiDAR へのリンク)

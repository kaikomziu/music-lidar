// 更新履歴(新しい順)。更新したら先頭に1つ足す。いちばん上が現在のバージョン
// 大きな機能追加 = 2つ目の数字を上げる / 不具合修正や小さな改善 = 3つ目の数字を上げる
export const CHANGELOG = [
  {
    version: '1.35.0', date: '2026-10-23',
    notes: ['しゃろうさんの「SUMMER TRIANGLE」を追加(OpenTracks より。音源を解析して BPM175 のリズムに合わせた譜面)'],
  },
  {
    version: '1.34.0', date: '2026-10-23',
    notes: [
      'YAJU-MC(やじゅまん)さんの「INMU KING」を追加(ニコニ・コモンズ nc499430 より。音源を解析して BPM133 のリズムに合わせた譜面)',
    ],
  },
  {
    version: '1.33.0', date: '2026-10-22',
    notes: [
      '段位道場を追加(ホーム → LIVE → 段位道場): 4曲を続けてプレイし、体力ゲージが0にならずに最後まで行けたら合格',
      '初段〜十段・皆伝の11段階。上の段ほど課題曲が難しく、MISSで減る体力も大きい。編成の効果なし・リトライなし',
      '合格した段位はアカウントに保存され、ホームの名前の横に表示。はじめての合格で「段位×100」コインのボーナス',
    ],
  },
  {
    version: '1.32.0', date: '2026-10-22',
    notes: [
      '新曲15曲を追加(全115曲)',
      'やさしめ: Cherry Picnic(春ポップ)、Starlit Camp(キャンプファイヤー)、Puddle Jump(バウンスポップ)、Lofi Library(ローファイ)',
      'ふつう: Polka Party(ポルカ)、Seoul Signal(K-POP)、Mariachi Sun(マリアッチ)、Bollywood Beat(ボリウッド)、Neon Boulevard(フューチャーファンク)',
      'むずかしめ: Synth Racer(アウトラン)、Riddim Riot(リディム)、Brave Horizon(アニソン)、Shamisen Storm(津軽三味線ロック)',
      '鬼畜: Quantum Leap(瞬間移動するギミック曲・Lv15)、Omega Requiem(オーケストラコア BPM210・Lv14)',
    ],
  },
  {
    version: '1.31.0', date: '2026-10-22',
    notes: [
      '管理者ページを追加(管理者のアカウントだけ、ホーム右上の「管理」から開けます)',
      'ログイン中は1分おきに今いる画面をサーバーへ送るように(管理者ページの「いまオンライン」表示用)',
    ],
  },
  {
    version: '1.30.0', date: '2026-10-22',
    notes: [
      '新曲15曲を追加して、ついに全100曲!',
      'やさしめ: Snow Globe(冬)、Bubble Bath(ラウンジ)、Toy Box March(トイポップ)、Sunflower Road(カントリー)',
      'ふつう: Harvest Moon(フォーク)、Velvet Lounge(ネオソウル)、Koi Pond(和ポップ)、Retro Arcade(シンセポップ)、Ocean Drive(ニューディスコ)、Thunder Road(サザンロック)、Glitch Garden(グリッチホップ)',
      'むずかしめ: Crystal Fortress(パワーメタル)、Hyper Sakura(Jコア)',
      '鬼畜: Clockwork Chaos(秒針のように止まるギミック曲・Lv14)、Event Horizon(テラーコア BPM230・Lv15)',
    ],
  },
  {
    version: '1.29.0', date: '2026-10-22',
    notes: [
      'ハロウィンガチャの期間限定キャラを8体追加(全14体)',
      '★4 Phantom Conductor(コインUP)・Werewolf DJ(コンボガード)、★3 Black Cat Familiar(判定サポート)・Skeleton Drummer(スコアUP)',
      '★2 Spider Weaver・Candle Imp・Frank Bolt・Haunted TV。限定★4がすべてのスキルの種類でそろいました',
    ],
  },
  {
    version: '1.28.0', date: '2026-10-22',
    notes: [
      'ガチャを「通常ガチャ」と「イベントガチャ」に分けた。ガチャ画面の上で切り替えられます',
      '🎃 ハロウィンガチャ開催(10/20〜11/11): 期間限定キャラ6体(★4 Pumpkin Reaper・Midnight Witch、★3 Ghost Lantern・Count Dracodrone、★2 Candy Golem・Mummy Bot)',
      'ハロウィンガチャは★4が3%(うち70%が限定キャラ)、100回で限定★4確定(通常ガチャとは別カウント)。限定キャラは通常ガチャには出ません',
    ],
  },
  {
    version: '1.27.0', date: '2026-10-22',
    notes: [
      'チュートリアルを追加(約1分): ゆっくりの練習曲で、押し方・同時押し・ロングノーツ・判定とコンボを説明を見ながら練習できる',
      'はじめて遊ぶ人には最初にチュートリアルを案内。ホーム右上の「チュートリアル」からいつでもできます',
    ],
  },
  {
    version: '1.26.0', date: '2026-10-21',
    notes: [
      '「きくだけ」モードを追加: ホームの MUSIC から、オリジナル曲を音楽プレーヤーとして聴ける(音ゲーではありません)',
      '再生・一時停止・前後の曲・シャッフル・くり返し(全曲/1曲)・シーク・検索、音に合わせて動くビジュアライザー',
      'スマホのロック画面やイヤホンのボタンからも操作できる。外部の曲(シャイニングスターなど)は入りません',
    ],
  },
  {
    version: '1.25.0', date: '2026-10-21',
    notes: [
      '鬼畜曲12曲を追加(全85曲)。最高難易度 Lv15 が登場',
      'Lv15: Infinity Breaker(BPM260・最難関)、Neutron Overdrive(BPM240)、Sakura Blizzard(和風コア BPM222)、Ultra Spiral(らせん変速ギミック)',
      'Lv14: Bullet Hell 404(弾幕STG風チップチューン)、Jackhammer Jazz(BPM230のジャズフュージョン)',
      'Lv13: Abyss Gate(ハードコア)、Thunder Requiem(シンフォニックメタル)',
      'Lv12: Fractal Storm(ニューロファンク)、Kick Machinegun(フレンチコア)、Velocity Zero(トランスコア)、Terminal Velocity(ジャンプアップ)',
    ],
  },
  {
    version: '1.24.0', date: '2026-10-21',
    notes: [
      '新曲20曲を追加(全73曲)',
      'やさしめ: Cotton Candy(キッズポップ)、Sunny Parade(マーチ)、Piano Rain(ピアノ)、Gospel Light(ゴスペル)、Velvet Night(R&B)、Boom Bap Days(ヒップホップ)',
      'ふつう: Afro Sunrise(アフロビーツ)、Desert Wind(アラビアン)、Samba Carnival(サンバ)、Moombah Heat(ムーンバートン)、Ascent(プログレッシブハウス)、Dragon Gate(中華風)、Garage Shuffle(UKガラージ)',
      'むずかしめ: Salsa Fuego(サルサ)、Liquid Sky(リキッドファンク)、Psy Forest(サイトランス)',
      '鬼畜・ギミック: Hyperpop Glitch(ハイパーポップ)、Metalcore Fury(メタルコア)、Time Twister(ギミック)、Breakcore Collapse(ブレイクコア・Lv14)',
      'ピアノやオルゴールなど静かな曲は、自動で音量を持ち上げてほかの曲と聞こえ方をそろえるように',
    ],
  },
  {
    version: '1.23.0', date: '2026-10-21',
    notes: [
      '新曲20曲を追加(全53曲)',
      'やさしめ: Star Lullaby(オルゴール)、Morning Coffee(アコースティック)、Polar Night(アンビエント)、Space Waltz(3拍子のワルツ)、Blues Highway(ブルース)、Midnight Jazz Cafe(ジャズ)',
      'ふつう: Paper Planes(J-POP)、Deep Blue Current(ディープハウス)、Tango Noir(タンゴ)、Funky Station(ファンク)、Celtic Run(ケルト)、Big Room Blast(ビッグルーム)',
      'むずかしめ: Glitter Idol(アイドル)、Kawaii Bubble(カワイイ・フューチャーベース)、Neon Samurai(和ロック)、Jungle Lights(ジャングル)',
      '鬼畜・ギミック: Chip Dungeon(チップチューン)、Circuit Breaker(ドラムンベース)、Mirage Shift(ギミック)、Gabber Storm(ガバ BPM200)',
      '選曲画面の標準の並びを、やさしい順に整理',
    ],
  },
  {
    version: '1.22.0', date: '2026-10-21',
    notes: [
      '新曲11曲を追加(全33曲): Plaza 1995(ヴェイパーウェイヴ)、Island Signal(レゲエ)、Dembow Lights(レゲトン)、Swing Circuit(エレクトロスウィング)、Low Orbit(トラップ)、Sakura Lattice(和風)、Last Horizon(オーケストラ)、Offbeat Skater(スカパンク)、Night Drift 95(ユーロビート)、Sugar Rush Scan(ハッピーハードコア)',
      'ギミック付きのボス曲「Final Protocol」(BPM200、譜面停止・変速・隠し)を追加',
      '新しいジャンルのジャケット絵柄を11種類追加',
    ],
  },
  {
    version: '1.21.0', date: '2026-10-20',
    notes: [
      '新曲6曲を追加(全22曲): Rainy Window(ローファイ・ヒップホップ)、Midnight Avenue(シティポップ)、Sunset Bossa(ボサノバ)、Iron Pulse(テクノ)、Sky Prism(フューチャーベース)、Hard Reflector(ハードスタイル)',
      '新しいジャンルのジャケット絵柄(雨の窓・夜のビル街・ヤシの木の夕日・ストロボ・きらきらのかけら・飛び散る破片)',
    ],
  },
  {
    version: '1.20.0', date: '2026-10-20',
    notes: [
      'みんなでライブ: 難易度(EASY/NORMAL/HARD)を人ごとに選べるように。メンバー一覧と結果に各自の難易度を表示',
      'みんなでライブ: 全員の曲がぴったり同じ時刻に始まるように(サーバーの時計に合わせてカウントダウン)。読み込みが遅れた人も同じ位置から途中参加',
      'みんなでライブ中は一時停止で曲が止まらないように(全員同時に進むため)',
    ],
  },
  {
    version: '1.19.0', date: '2026-10-20',
    notes: [
      'ホーム画面(モード選択)を追加: タイトルの次に「ライブ・編成・ガチャ・クエスト・みんなの譜面・譜面メーカー」から選ぶ形に',
      '「ライブ」を押すと「ひとりでライブ」(これまでの選曲画面)と「みんなでライブ」を選べる',
      '選曲画面の上のボタンを整理して見やすく(Escでホームへ戻る)',
    ],
  },
  {
    version: '1.18.0', date: '2026-10-20',
    notes: [
      '「みんなでライブ」を追加: 最大8人のルームで同じ曲を同時にプレイ。プレイ中は数秒おきにみんなのコンボが見え、最後は編成の効果込みのスコアで順位を競う',
      'ルームはコードで参加、または開いているルームの一覧から参加。曲と難易度はホストが選ぶ',
    ],
  },
  {
    version: '1.17.0', date: '2026-10-19',
    notes: ['バージョン表記と更新履歴を追加(選曲画面右上のバージョンから見られます)'],
  },
  {
    version: '1.16.0', date: '2026-10-19',
    notes: [
      'ジャケットをジャンルごとの絵柄に(レトロな夕日・ミラーボール・ドット絵・レコード盤など)',
      'キャラアイコンを精細に。★3以上は羽、★4は天使の輪と虹色の枠',
      'プレイ画面を刷新: 立体的なノーツ、光が流れるロングノーツ、光るキー、流れるレール、READY→GO!、FULL COMBO/ALL PERFECTの帯',
      'クエスト・編成・みんなの譜面の見た目を刷新、画面切り替えにスキャン線の演出',
    ],
  },
  {
    version: '1.15.0', date: '2026-10-19',
    notes: [
      '新曲7曲を追加(全16曲): Neon Highway(シンセウェイヴ)、Disco Mirrorball(ファンク/ディスコ)、Pixel Quest(チップチューン)、Blue Note Lane(ジャズ)、Stellar Gate(トランス)、Wub Fracture(ダブステップ)、Overdrive Riot(ロック/メタル)',
      '8bit音源・エレピ・ウッドベース・スーパーソウ・歪みギター・スラップベース・ワブルベースなどの音色と、ハネるリズムに対応',
    ],
  },
  {
    version: '1.14.0', date: '2026-10-18',
    notes: ['画面ごとにURLを付けた(譜面メーカー・ガチャ・みんなの譜面・クエスト・編成・リザルト・設定・アカウント)'],
  },
  {
    version: '1.13.1', date: '2026-10-18',
    notes: ['ログインしていない人が曲のURLを開いたときは、普通のトップ画面になるように'],
  },
  {
    version: '1.13.0', date: '2026-10-18',
    notes: ['曲ごとのURL(music/〜/)と共有画像を追加。選んだ曲に合わせてURLが変わり、共有ボタンでコピーできる'],
  },
  {
    version: '1.12.0', date: '2026-10-18',
    notes: ['譜面メーカーの録音で少しのズレを自動補正(曲の音か拍に合わせる)、押すクセを学習して差し引く、「全体を補正」ボタン'],
  },
  {
    version: '1.11.0', date: '2026-10-18',
    notes: ['検索に出やすくした(ページ説明・共有画像・アイコン)、「遊び方・収録曲」ページを追加'],
  },
  {
    version: '1.10.0', date: '2026-10-18',
    notes: ['魔王魂さんの「シャイニングスター」を追加(音源を解析してBPM158のリズムに合わせた譜面)'],
  },
  {
    version: '1.9.0', date: '2026-10-17',
    notes: ['読み込み中画面を追加(ジャケット・進み具合・Tips)'],
  },
  {
    version: '1.8.1', date: '2026-10-17',
    notes: ['曲の読み込みを高速化(一度作った音をブラウザに保存、タイトル画面から裏で準備)'],
  },
  {
    version: '1.8.0', date: '2026-10-17',
    notes: ['見た目を刷新: 曲ジャケット、タイトル画面の演出、リザルトとガチャの演出'],
  },
  {
    version: '1.7.0', date: '2026-10-17',
    notes: ['譜面メーカーを追加(クリックで配置・録音・自動譜面の手直し・ギミック・テストプレイ)', '「みんなの譜面」を追加(投稿・いいね・譜面ごとのランキング)'],
  },
  {
    version: '1.6.0', date: '2026-10-17',
    notes: ['譜面ギミック(停止・変速・隠し)と、ギミック曲「Freeze Frame」を追加'],
  },
  {
    version: '1.5.0', date: '2026-10-17',
    notes: ['選曲画面と編成のキャラ一覧に、検索・並び替え・絞り込みを追加'],
  },
  {
    version: '1.4.1', date: '2026-10-17',
    notes: ['更新直後に編成画面でエラーが出ることがある問題を修正'],
  },
  {
    version: '1.4.0', date: '2026-10-17',
    notes: ['鬼畜曲2曲(Overclock Ω・Hyper Scan Breaker)と初心者向け2曲(First Light・Hello, Lane)を追加'],
  },
  {
    version: '1.3.0', date: '2026-10-17',
    notes: ['編成をドラッグ&ドロップでできるように、効果の表示とおまかせ編成'],
  },
  {
    version: '1.2.0', date: '2026-10-17',
    notes: ['アカウント(名前とパスワード)、コイン、キャラガチャ、5人編成、デイリーミッションと実績を追加'],
  },
  {
    version: '1.1.1', date: '2026-10-17',
    notes: ['PCでのカクつき・音ズレ・一時停止まわりの不具合を修正'],
  },
  {
    version: '1.1.0', date: '2026-10-17',
    notes: ['演出の強さを設定できるように(初期は控えめ)', 'スマホのタッチ操作に対応'],
  },
  {
    version: '1.0.0', date: '2026-10-17',
    notes: ['MUSIC LiDAR 公開! 4キー音ゲー、内蔵3曲、オンラインランキング、手持ちの曲の自動譜面'],
  },
];

export const VERSION = CHANGELOG[0].version;

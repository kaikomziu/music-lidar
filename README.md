# MUSIC LiDAR

ブラウザで遊べる4キー音ゲー。奥から迫るノーツを **D F J K** で叩く。

- 内蔵曲3曲(CHILL / HOUSE / DRUM & BASS)。音はすべて Web Audio でその場で合成
- 各曲 EASY / NORMAL / HARD、通常ノーツ・ロングノーツ・同時押し
- 手持ちの音声ファイルを読み込むと譜面を自動生成
- 自己ベスト・FC/AP はブラウザに保存、内蔵曲はオンラインランキング(Supabase)

## 曲の追加

1. `js/songs/` の既存ファイルをコピーして新しい曲ファイルを作る(`id` は英小文字・数字・ハイフン)
2. `js/songs/index.js` に import を1行足す
3. 曲ファイルに `urlId`(ランダムな英数字9文字)を付ける → `python tools/release.py` で曲ページ `music/<urlId>/` が作られる

譜面はイベント(キック・スネア・メロディ等)から自動生成される。

### 曲を作ったら書き出す(mp3 / mp4)

新しい曲を作ったら(MVを付けたら)、毎回 `D:\MUSIC_LiDAR_export` に書き出す。

```
python tools/export.py              # まだ書き出していない曲だけ(ふだんはこれ)
python tools/export.py <id> <id>    # 作り直した曲を書き出し直す
python tools/export.py --all        # 全曲を書き出し直す
```

- ブラウザで `tools/export.html` が開き、曲の合成・MVの描画をして、ffmpeg で `mp3/<曲名>.mp3` と `mp4/<曲名>.mp4`(MV入り。特製MVがない曲はジャンル別の自動MV)にする。終わるまでタブは閉じない
- ファイル名は曲名だけ(曲順の番号は付けない。曲を足すと番号がずれるため)
- 音源ファイルの曲(`audio` を指定した外部音源の曲)はライセンスのため対象外
- ffmpeg が必要(`winget install Gyan.FFmpeg`)

## ローカル実行

ES modules を使うので http サーバー経由で開く:

```
python -m http.server 8765
```

## クレジット

- 「シャイニングスター」 音楽: [魔王魂](https://maou.audio/)(フリー素材。利用時はクレジット表記が必要)。`audio/shining-star.bin`
- 「INMU KING」 音楽: YAJU-MC(やじゅまん) [ニコニ・コモンズ nc499430](https://commons.nicovideo.jp/works/nc499430)(非収益での組み込み可。`audio/inmu-king.bin`)
- 「SUMMER TRIANGLE」 音楽: しゃろう([OpenTracks](https://opentracks.com/) 音源利用ライセンス)。ライセンス上、音源をそのまま取り出せる形で置けないため `tools/scramble_audio.py` で並べ替えた `audio/summer-triangle.bin` を置き、ゲーム内で元に戻して再生する。「きくだけ」モードには入れない
- 外部音源は `audio/*.bin` に難読化して保存し、曲定義の `audioKey` で再生時に復元する。これは平文MP3への直接リンクを避けるための措置で、鍵は公開JavaScriptから取得できるため、暗号学的なダウンロード防止ではない。過去のコミットにあった平文の音源(`audio/inmu-king.mp3`・`audio/shining-star.mp3`・`video/inmu-king.mp4`)は、2026-11-18 に git filter-repo で履歴から取り除いた。**平文の音源は絶対にコミットしない**(並べ替えた `.bin` だけを置く)。
- 「GHOST」「GHOST (2020 Halloween+++++++++ VIP)」 音楽: かめりあ(Camellia)。作者さんから許可をもらって使用(2026-11-20)。音源は `tools/encrypt_audio.mjs` で AES-GCM 暗号化した `audio/camellia-ghost.bin`・`audio/camellia-ghost-vip.bin` を置き、ゲーム内で復号して再生する(鍵は曲ファイルの `audioKey`)。「きくだけ」モードには入れない
- 「Crying Red」 音楽: 御箸ねくらぁ。([YouTube](https://youtu.be/PWKgh4ZqHTg))。ゲームで使ってよい BGM。音源は `tools/encrypt_audio.mjs` で AES-GCM 暗号化した `audio/crying-red.bin` を置き、ゲーム内で復号して再生する。「きくだけ」モードには入れない
- 「暮らし泳ぐ」 音楽: [ナツメダ ユキ](https://piapro.jp/YukiNatsumeda)(歌: 音街ウナ)。音源は AES-GCM 暗号化した `audio/kurashi-oyogu.bin`。歌詞はサーバー(`mlidar_lyrics`)に置き、管理者が譜面メーカーで時刻を合わせる。「きくだけ」モードには入れない
- 「飛行白書」 音楽: [ナツメダ ユキ](https://piapro.jp/YukiNatsumeda)(歌: 音街ウナ)。音源は AES-GCM 暗号化した `audio/hikou-hakusho.bin`。歌詞はまだなし。「きくだけ」モードには入れない
- 「僕たちの旅とエピローグ。」 音楽: ああああ(Long ver.。アルバム「セーブデータとほうき星」)。作者さんのガイドライン(ゲームでの非商用利用は許諾なしで可)。音源は MP3 192kbps を AES-GCM 暗号化した `audio/bokutachi-epilogue.bin`。収益化のときは作者さんへ連絡が必要。「きくだけ」モードには入れない
- 「A new world with form」 音楽: Patençial公式。作者さんの許可を得て使用し、ゲーム実況・配信の収益化もクレジット必須でOKです。元の MP3 は AES-GCM 暗号化した `audio/a-new-world-with-form.bin` として保存(平文の音源は置かない)。配信条件は [`streaming.html`](streaming.html#songs)
- 「しう」「ホワイトハッピー」「ニャン」 音楽: [MARETU](https://www.youtube.com/@MARETUch)。作者さんの許可を得て使用し、ゲーム実況・配信の収益化もクレジット(「音楽：MARETU」)必須でOKです。m4a を mp3 にしてから AES-GCM 暗号化した `audio/maretu-*.bin` として保存(平文の音源は置かない)。「きくだけ」モードには入れない
- 「Hydrangea」「蒼」 音楽: 全て蝶々の所為です。([CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.ja))。CC BY は技術的な制限をかけてはいけないので、並べ替えずに `audio/hydrangea.mp3`・`audio/ao.mp3` のまま置く
- そのほかの内蔵曲はブラウザ内でその場で合成しているオリジナル曲です。

音源ファイルを使う曲は `js/songs/shining-star.js` のように `audio` / `bpm` / `offset` / `fixedCharts` を指定して追加できます。

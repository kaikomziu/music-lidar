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

- ブラウザで `tools/export.html` が開き、曲の合成・MVの描画をして、ffmpeg で `mp3/<曲名>.mp3` と `mp4/<曲名>.mp4`(MVがある曲のみ)にする。終わるまでタブは閉じない
- ファイル名は曲名だけ(曲順の番号は付けない。曲を足すと番号がずれるため)
- 音源ファイルの曲(`audio` を指定した外部音源の曲)はライセンスのため対象外
- ffmpeg が必要(`winget install Gyan.FFmpeg`)

## ローカル実行

ES modules を使うので http サーバー経由で開く:

```
python -m http.server 8765
```

## クレジット

- 「シャイニングスター」 音楽: [魔王魂](https://maou.audio/)(フリー音楽素材。`audio/shining-star.mp3`)
- 「INMU KING」 音楽: YAJU-MC(やじゅまん) [ニコニ・コモンズ nc499430](https://commons.nicovideo.jp/works/nc499430)(非収益での組み込み可。`audio/inmu-king.mp3`)
- 「SUMMER TRIANGLE」 音楽: しゃろう([OpenTracks](https://opentracks.com/) 音源利用ライセンス)。ライセンス上、音源をそのまま取り出せる形で置けないため `tools/scramble_audio.py` で並べ替えた `audio/summer-triangle.bin` を置き、ゲーム内で元に戻して再生する。「きくだけ」モードには入れない
- そのほかの内蔵曲はブラウザ内でその場で合成しているオリジナル曲です。

音源ファイルを使う曲は `js/songs/shining-star.js` のように `audio` / `bpm` / `offset` / `fixedCharts` を指定して追加できます。

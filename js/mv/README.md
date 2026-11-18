# 特製MV(js/mv/*.js)の書き方

曲ごとの特製MVです。プレイするときにだけ読み込みます(`mv.js` の `prepareMV`)。1つのファイルに、ジャンルの近い曲をいくつかまとめて書きます。

## 登録

1. このフォルダのファイル(例: `s01-gentle.js`)の `export default` に、曲ID → 定義 を書く
2. `python tools/release.py` を実行すると、`js/mv.js` の `MV_INDEX`(曲ID → ファイル名)が自動で作り直される
3. `tools/mv-preview.html?ids=曲ID` で、区間ごとのコマを並べて確かめる(`&check=1` で全区間のエラー確認)

## 定義の形

```js
'lemon-soda': {
  intro: (c, P) => { ... },          // 最初の区間(なくてもよい。ないときは looks から選ぶ)
  outro: (c, P) => { ... },          // 最後の区間(なくてもよい)
  looks: [                            // 場面。曲の区間の盛り上がり(lvl)に合うものを順番に使う
    [0, (c, P, k) => { ... }],        // 0 = 静か
    [1, (c, P, k) => { ... }],        // 1 = ふつう
    [2, (c, P, k) => { ... }],        // 2 = サビ(いちばん盛り上がる所)
  ],
  titleCol: '#fff',                   // はじめに出る曲名の色(なくてもよい)
},
```

- 区間は、内蔵曲はクラッシュ(シンバル)の位置で区切った `analyzeSections`、音源の曲は譜面の密度から作る `chartSections`
- 曲名の表示・場面の切り替わりの白い光・最後のフェードアウトは、共通の仕組み(`customDef`)が付ける
- `k` は、その場面が何回目に出てきたか(2回目以降に色や向きを少し変えるのに使う)

## 描くときに使えるもの

- `c`: `g`(2Dコンテキスト)、`w` `h`(裏キャンバスの大きさ)、`t`(曲の秒)、`beat`(拍)、`lb`(区間の中の拍)、`p`(区間の進み 0→1)、`pulse`(拍の頭で1→すぐ0)、`bpm`
- `P`: 曲の色から作った配色 `main` `sub` `light` `dk` `dk2` `mid` `hot` `pa` `pb`、色相 `h`
- 部品は `../mv.js` から import する(`vgrad` `text` `starfield` `twinkle` `grid` `retroSun` `skyline` `tunnel` `hills` `waves` `palm` `bokeh` `rain` `stageBeams` `eqBars` `crowd` `firework` `beatRipples` `snowfall` `aurora` `sakura` など。一覧は `mv.js` の最後の export)
- 乱数で配置を決めるものは、`table(個数, 種, (r) => ({...}))` でファイルの最初に1回だけ作る(毎フレーム同じ配置になるように)
- 重くしない: 1コマで数百回以上の図形は描かない。`shadowBlur` は多用しない

# 音源ファイルから譜面を作る(水の追憶 で使用)

作業フォルダで順に実行する(feat.npz / grid.npy はその場に作られる)。

1. `python analyze.py <曲.wav> feat.npz` — 低・中・高の帯域ごとの立ち上がりを出し、テンポの候補と区間ごとの音量を表示
2. `python tempo.py` — BPM と1拍目の位置を細かく合わせ、20秒ごとのずれと拍の頭を表示 → grid.npy
3. `python dump.py` — 1小節ごとに16分のどこで音が鳴っているかを文字で表示(構成の確認用)
4. `python chart.py <曲.wav> <曲名>.data.js` — 3難易度の譜面を作る

tempo.py の探索範囲(126.5〜127.3)、chart.py の T_END・タイトル文字列は曲ごとに書き換える。
テンポが途中で変わる曲には使えない(tempo.py のずれ表示で確かめる)。

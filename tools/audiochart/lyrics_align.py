# 歌詞の各行の時刻を、歌声から自動で合わせる
# 使い方: python lyrics_align.py <歌声だけの.wav> <歌詞.txt> <BPM> <1拍目の秒> <出力 .lyrics.js> [ずらす秒]
#   歌声だけの wav: 原曲 − インスト(時刻がそろっていれば引き算で取り出せる)
#   歌詞.txt: 1行 = 画面に一度に出す1かたまり。空行と [Verse] などの見出しは無視する
#   ずらす秒: ゲームの音源と wav の時刻の差(ゲームの方が早ければマイナス)
# しくみ: 歌声の音の立ち上がり(だいたい1音節に1つ)を拾い、2拍(半小節)ごとに数える。各行に、行の長さ(モーラ数の目安)に
#         見合う数の半小節を順に割り当てる(動的計画法)。声のない半小節は間奏として飛ばせる。行は小節の頭から始まりやすくする
import sys, re, json
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft

VOC, TXT, BPM, OFF, OUT = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
SHIFT = float(sys.argv[6]) if len(sys.argv) > 6 else 0.0

lines = []
for raw in open(TXT, encoding='utf-8'):
    s = re.sub(r'\[([^\]]+)\]\(https?://[^)]+\)', r'\1', raw.strip())  # [文字](URL) → 文字
    if not s or re.fullmatch(r'\[[^\]]*\]', s): continue
    lines.append(s)

def mora(s):
    # 長さの目安: かな1・漢字2・英単語は母音のかたまりの数。カッコ内(合いの手)は半分
    def count(x):
        n = 0
        for w in re.findall(r'[A-Za-z]+', x): n += max(1, len(re.findall(r'[aeiouyAEIOUY]+', w)))
        x = re.sub(r'[A-Za-z]+', '', x)
        for ch in x:
            if ch in 'ゃゅょぁぃぅぇぉャュョァィゥェォ': continue
            if '぀' <= ch <= 'ヿ': n += 1
            elif '一' <= ch <= '鿿': n += 2
        return n
    inner = ''.join(re.findall(r'\(([^)]*)\)', s))
    return max(1.0, count(re.sub(r'\([^)]*\)', '', s)) + 0.5 * count(inner))
W = np.array([mora(s) for s in lines])

sr, v = wavfile.read(VOC)
v = v.astype(np.float32)
if v.ndim > 1: v = v.mean(1)
hop = 480
f, t, Z = stft(v, fs=sr, nperseg=2048, noverlap=2048 - hop)
S = np.log1p(np.abs(Z[(f > 150) & (f < 5000)]) * 50)
flux = np.maximum(0, np.diff(S, axis=1)).sum(0); flux = np.concatenate([[0], flux])
flux = flux - np.convolve(flux, np.ones(40) / 40, 'same'); flux[flux < 0] = 0
flux /= np.percentile(flux, 99) + 1e-9
en = np.sqrt((np.abs(Z[(f > 150) & (f < 4000)]) ** 2).mean(0)); en /= np.percentile(en, 95) + 1e-9
dt = t[1] - t[0]
ons = []
mind = int(0.09 / dt)
for i in range(1, len(flux) - 1):
    if flux[i] > 0.12 and en[i] > 0.08 and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]:
        if ons and i - ons[-1] < mind:
            if flux[i] > flux[ons[-1]]: ons[-1] = i
            continue
        ons.append(i)
O = t[ons]
M, K = len(O), len(lines)
print('onsets', M, 'lines', K)

# --- 2拍(半小節)単位で、行を順に置いていく ---
# 歌の行は小節の頭(か2拍目)から始まり、直前の数個の16分に「入り(アウフタクト)」が来ることが多いので、
# 立ち上がりを 3/16 小節ぶん後ろにずらしてから数える。声のない半小節は「間奏」として飛ばせる
bar = 240 / BPM; half = bar / 2
N = int((t[-1] - OFF) / half) + 1
cnt = np.zeros(N)
for x in O:
    i = int((x + bar * 3 / 16 - OFF) // half)
    if 0 <= i < N: cnt[i] += 1
act = np.zeros(N)  # 声の量(0〜1)
for i in range(N):
    a0 = OFF + i * half; m = (t >= a0) & (t < a0 + half)
    act[i] = min(1.0, en[m].mean() / 0.3) if m.any() else 0

def solve(r):
    INF = 1e18
    cost = np.full((K + 1, N + 1), INF); back = np.zeros((K + 1, N + 1, 2), int)
    cost[0][0] = 0
    for k in range(K + 1):
        for p in range(N):
            c0 = cost[k][p]
            if c0 >= INF: continue
            # 間奏として半小節を飛ばす(声があるほど高くつく)
            v = c0 + 3.0 * act[p] + (0.3 if 0 < k < K else 0)
            if v < cost[k][p + 1]: cost[k][p + 1] = v; back[k][p + 1] = (k, p)
            if k == K: continue
            e = W[k] * r
            for h in range(1, 9):
                q = p + h
                if q > N: break
                c = cnt[p:q].sum()
                pen = (c - e) ** 2 / (e + 2)
                pen += 1.5 * (1 - act[p])            # 行の頭に声がないのはおかしい
                pen += 0.6 if p % 2 else 0           # 小節の頭から始まる方が自然
                pen += 5.0 * (act[p:q - 1] < 0.25).sum()  # 行の途中(最後の半小節以外)に声のない半小節をはさまない
                v = c0 + pen
                if v < cost[k + 1][q]: cost[k + 1][q] = v; back[k + 1][q] = (k, p)
    return cost[K][N], back

best = None
for r in np.linspace(0.5, 1.8, 27) * (cnt.sum() / W.sum()):
    c, b = solve(r)
    if best is None or c < best[0]: best = (c, b, r)
c, back, r = best
spans = []; k, p = K, N
while p > 0:
    pk, pp = back[k][p]
    if pk == k - 1: spans.append((pp, p))
    k, p = pk, pp
spans.reverse()
out = []
for k, (p, q) in enumerate(spans):
    a0 = OFF + p * half - bar * 3 / 16; b0 = OFF + q * half - bar * 3 / 16
    inside = O[(O >= a0) & (O < b0)]
    a = inside[0] if len(inside) else OFF + p * half
    z = inside[-1] if len(inside) else b0
    out.append([round(a + SHIFT, 2), round(z + 0.35 + SHIFT, 2), lines[k], int(p), int(q)])
print('ratio', round(r / (cnt.sum() / W.sum()), 2), 'cost', round(c, 1))
for a, z, s, p, q in out: print(f'{a:7.2f} {z:7.2f} bar {p / 2:5.1f}-{q / 2:5.1f}  {s}')
out = [x[:3] for x in out]
open(OUT, 'w', encoding='utf-8').write(
    '// 歌詞(画面の上に出す)。[歌い始めの秒, 歌い終わりの秒, 行]。tools/audiochart/lyrics_align.py で歌声から自動で合わせたもの。ずれは ?lyricsync=1 で遊びながら Enter で直せる\n'
    'export default ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')

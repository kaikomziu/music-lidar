# 水の追憶: 鳴っている音(オンセット)を16分の格子で拾い、メロディの高さでレーンを決めて3難易度の譜面を作る
import sys, json
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft

SRC, OUT = sys.argv[1], sys.argv[2]
d = np.load('feat.npz'); t = d['t']; dt = t[1] - t[0]
low, mid, high = d['low'], d['mid'], d['high']
bpm, ph = np.load('grid.npy'); spb = 60 / bpm; step = spb / 4
T_END = 221.9

# 音の高さ用のスペクトル(周波数の細かいもの)
sr, x = wavfile.read(SRC)
mono = x.astype(np.float32).mean(axis=1) / 32768
HOP = 441
f2, t2, Z2 = stft(mono, fs=sr, nperseg=8192, noverlap=8192 - HOP, boundary=None, padded=False)
S2 = np.abs(Z2)
fm = (f2 >= 70) & (f2 <= 2400)
F2 = f2[fm]; S2 = S2[fm]
midband = S2.sum(axis=0)

def at(v, tm, w=2):
    i = int(round((tm - t[0]) / dt))
    if i < 0 or i >= len(v): return 0, tm
    lo, hi = max(0, i - w), min(len(v), i + w + 1)
    k = lo + int(np.argmax(v[lo:hi]))
    return v[k], t[0] + k * dt

def pitch(tm):
    # 立ち上がりの直後に増えた成分から基本周波数を探す(倍音の和)
    i = int(round((tm - t2[0]) / (t2[1] - t2[0])))
    if i < 3 or i + 6 >= S2.shape[1]: return None
    new = np.maximum(0, S2[:, i + 4] - S2[:, i - 3])
    if new.sum() < 1e-6: new = S2[:, i + 4]
    best, bf = 0, None
    for f0 in np.geomspace(90, 1100, 160):
        s = 0
        for h in range(1, 6):
            j = np.searchsorted(F2, f0 * h)
            if j >= len(F2): break
            s += new[max(0, j - 1):j + 2].max() / h
        if s > best: best, bf = s, f0
    return 69 + 12 * np.log2(bf / 440) if bf else None

# --- 候補: 16分ごとの音の強さ ---
cands = []
k = 0
while True:
    g = ph + k * step
    if g > T_END: break
    if g >= 0.15:
        vm, tm = at(mid, g); vh, th = at(high, g); vl, tl = at(low, g)
        score = max(vm, 0.75 * vh, 0.55 * vl)
        # 一番強い帯域の実際の立ち上がり時刻に寄せる(格子から±20ms以内)
        real = [tm, th, tl][int(np.argmax([vm, 0.75 * vh, 0.55 * vl]))]
        if abs(real - g) > 0.021: real = g
        cands.append(dict(k=k, g=g, t=real, s=score, m=vm, h=vh, l=vl, pos=k % 16))
    k += 1
print('candidates', len(cands))

# 区間の盛り上がり(1小節の平均の強さ)で、1小節に置ける数を変える
bar_len = 16
bars = {}
for c in cands: bars.setdefault(c['k'] // bar_len, []).append(c)
def energy(b):
    cs = bars.get(b, [])
    return np.mean([c['s'] for c in cs]) if cs else 0
E = {b: energy(b) for b in bars}
emax = np.percentile(list(E.values()), 95)

HOLD_GAP = {'easy': 4, 'normal': 3, 'hard': 2}  # ロングノーツにする、次の音までのあき(拍)
LEVEL = {
    #       置ける位置(16分の何個おき)、1小節の最大数(静か→最大)、最低限の強さ、最小間隔(16分の数)
    'easy':   dict(grid=4, nmin=1, nmax=4, thr=0.28, gap=4),
    'normal': dict(grid=2, nmin=2, nmax=7, thr=0.22, gap=2),
    'hard':   dict(grid=1, nmin=3, nmax=12, thr=0.18, gap=1),
}

def pick(lv):
    P = LEVEL[lv]
    out = []
    for b in sorted(bars):
        cs = [c for c in bars[b] if c['pos'] % P['grid'] == 0 and c['s'] >= P['thr']]
        if not cs: continue
        e = min(1, E[b] / emax)
        n = int(round(P['nmin'] + (P['nmax'] - P['nmin']) * e ** 1.2))
        cs = sorted(cs, key=lambda c: -c['s'])
        chosen = []
        for c in cs:
            if len(chosen) >= n: break
            if all(abs(c['k'] - o['k']) >= P['gap'] for o in chosen): chosen.append(c)
        out += sorted(chosen, key=lambda c: c['k'])
    # 小節をまたぐ間隔も守る
    res = []
    for c in out:
        if res and c['k'] - res[-1]['k'] < P['gap']: continue
        res.append(c)
    return res

charts = {}
for lv in ('easy', 'normal', 'hard'):
    notes = pick(lv)
    # --- レーン: 前後の音の高さの幅の中で、その音が高いほど右のレーンにする ---
    for c in notes: c['p'] = pitch(c['t'])
    ps = [c['p'] for c in notes]
    seq, lane, prevk = [], 1, -99
    for i, c in enumerate(notes):
        p = c['p']
        win = [q for q in ps[max(0, i - 6):i + 7] if q is not None]
        gap = c['k'] - prevk
        if p is None or len(win) < 3 or max(win) - min(win) < 1:
            nl = (lane + 2) % 4 if gap > 4 else (lane + 1) % 4
        else:
            # 周りの音の中で何番目に高いか(順位)で決めると、4レーンが均等に使われる
            below = sum(1 for q in win if q < p - 0.3) + 0.5 * sum(1 for q in win if abs(q - p) <= 0.3)
            nl = int(min(3, below / len(win) * 4))
        # 速い同じレーンの連打は避ける(高さが同じなら隣へずらす)
        if nl == lane and gap < (4 if lv == 'hard' else 6):
            nl = lane + (1 if lane == 0 or (lane < 3 and i % 2 == 0) else -1)
        lane = nl
        prevk = c['k']
        seq.append([c, lane])
    # --- 同時押し: 小節の頭など、全帯域が強く鳴る所 ---
    out = []
    for c, ln in seq:
        out.append([round(c['t'] * 1000), ln])
        strong = c['l'] > 0.75 and c['m'] > 0.6 and c['pos'] in (0, 8)
        if lv == 'hard' and strong and c['pos'] == 0 or lv == 'hard' and strong and c['h'] > 0.9:
            out.append([round(c['t'] * 1000), 3 - ln if 3 - ln != ln else (ln + 2) % 4])
        elif lv == 'normal' and c['pos'] == 0 and c['l'] > 0.85 and c['m'] > 0.8 and c['k'] % 64 == 0:
            out.append([round(c['t'] * 1000), 3 - ln])
    # --- ロングノーツ: 次の音まで2拍以上あき、音が伸びている所 ---
    by_t = sorted(out)
    final = []
    for i, (ms, ln) in enumerate(by_t):
        nxt = next((n[0] for n in by_t[i + 1:] if n[0] > ms), None)
        tsec = ms / 1000
        if nxt and (nxt - ms) / 1000 >= spb * HOLD_GAP[lv] and not any(n[0] == ms and n[1] != ln for n in by_t):
            j0 = int(round((tsec - t2[0]) / (t2[1] - t2[0])))
            j1 = int(round(((nxt / 1000 - spb / 2) - t2[0]) / (t2[1] - t2[0])))
            if 0 <= j0 < j1 < len(midband):
                peak = midband[j0:j0 + 10].max()
                tail = midband[j1 - 5:j1].mean()
                if tail > peak * 0.35:
                    end = round(min(nxt / 1000 - spb / 2, tsec + spb * 4) * 1000)
                    final.append([ms, ln, end]); continue
        final.append([ms, ln])
    # 同じレーンが近すぎる所(ロングノーツの最中も含む)は、近くで使っていないレーンへ逃がす
    MIN_SAME = {'easy': 600, 'normal': 300, 'hard': 200}[lv]
    final = sorted(final)
    for i, n in enumerate(final):
        def busy(ln):
            for o in final[:i]:
                end = o[2] if len(o) == 3 else o[0]
                if o[1] == ln and n[0] - end < MIN_SAME: return True
            return any(o[1] == ln for o in final[i + 1:] if o[0] == n[0])
        if busy(n[1]):
            same_t = {o[1] for o in final if o[0] == n[0] and o is not n}
            for alt in sorted(range(4), key=lambda x: abs(x - n[1])):
                if alt not in same_t and not busy(alt): n[1] = alt; break
    charts[lv] = sorted(final)
    nps = len(final) / T_END
    holds = sum(1 for n in final if len(n) == 3)
    print(lv, len(final), 'notes', f'{nps:.2f} nps', holds, 'holds', 'lanes', np.bincount([n[1] for n in final], minlength=4).tolist())

data = {'bpm': round(float(bpm), 3), 'offset': round(float(ph), 4), 'duration': 225.6, 'charts': charts}
open(OUT, 'w', encoding='utf-8').write(
    '// 水の追憶の譜面データ(音源の立ち上がりを低・中・高の帯域ごとに拾い、BPM126.685の16分格子にそろえ、メロディの高さでレーンを決めて生成)。[ms, レーン, 終端ms?]\n'
    'export default ' + json.dumps(data, separators=(',', ':')) + ';\n')

# 水の追憶: 音の立ち上がり(オンセット)を帯域ごとに出し、テンポと拍の位置を測る
import sys, json
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft

SRC = sys.argv[1]
OUT = sys.argv[2]
sr, x = wavfile.read(SRC)
x = x.astype(np.float32) / 32768
mono = x.mean(axis=1)
HOP = 441  # 10ms
f, t, Z = stft(mono, fs=sr, nperseg=2048, noverlap=2048 - HOP, boundary=None, padded=False)
S = np.abs(Z)
t = t  # 各フレームの中心時刻
L = np.log1p(S * 100)
def band(lo, hi):
    m = (f >= lo) & (f < hi)
    d = np.diff(L[m], axis=1)
    d[d < 0] = 0
    return np.concatenate([[0], d.sum(axis=0)])
low, mid, high = band(30, 160), band(160, 2500), band(2500, 11000)
full = low + mid + high
def norm(v):
    v = v - np.convolve(v, np.ones(50) / 50, 'same')  # ゆっくりした変化を引く
    v[v < 0] = 0
    return v / (np.percentile(v, 99) + 1e-9)
env = norm(full)
# テンポ: 自己相関
ac = np.correlate(env, env, 'full')[len(env) - 1:]
lags = np.arange(len(ac)) * HOP / sr
best = []
for bpm in np.arange(60, 200, 0.05):
    lag = 60 / bpm / (HOP / sr)
    i = int(round(lag))
    score = sum(ac[int(round(lag * k))] for k in (1, 2, 4) if int(round(lag * k)) < len(ac))
    best.append((score, bpm))
best.sort(reverse=True)
print('tempo candidates', [(round(b, 2), round(s, 1)) for s, b in best[:8]])
np.savez(OUT, t=t, low=norm(low), mid=norm(mid), high=norm(high), env=env, f=f, rms=np.sqrt((S ** 2).mean(axis=0)))
# 時間ごとの音量(構成を見る)
rms = np.sqrt((S ** 2).mean(axis=0))
for sec in range(0, int(t[-1]), 8):
    m = (t >= sec) & (t < sec + 8)
    print(f'{sec:4d}s vol {rms[m].mean():.3f} onset {env[m].mean():.3f} low {norm(low)[m].mean():.3f} high {norm(high)[m].mean():.3f}')

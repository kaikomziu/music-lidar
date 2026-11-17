import numpy as np
d = np.load('feat.npz'); t, env, low = d['t'], d['env'], d['low']
dt = t[1] - t[0]
def val(v, times):
    i = np.clip(np.round((times - t[0]) / dt).astype(int), 0, len(v) - 1)
    # ±20ms の最大
    return np.max([v[np.clip(i + k, 0, len(v) - 1)] for k in (-2, -1, 0, 1, 2)], axis=0)
T = t[-1]
best = (0, 0, 0)
for bpm in np.arange(126.5, 127.3, 0.005):
    spb = 60 / bpm
    for ph in np.arange(0, spb, 0.005):
        g = np.arange(ph, T, spb / 2)
        s = val(env, g).sum()
        if s > best[0]: best = (s, bpm, ph)
s, bpm, ph = best
print('best bpm %.3f phase %.3f' % (bpm, ph))
spb = 60 / bpm
# 区間ごとのずれ(各20秒で最適な位相のずれ)
for a in range(0, int(T) - 20, 20):
    bs = (0, 0)
    for off in np.arange(-0.08, 0.081, 0.005):
        g = np.arange(ph + off, T, spb / 2); g = g[(g >= a) & (g < a + 20)]
        v = val(env, g).sum()
        if v > bs[0]: bs = (v, off)
    print(f'{a:4d}-{a+20}s  best offset {bs[1]*1000:+.0f} ms')
# 拍の頭(1拍目)をキックの多さで決める: 4つの位置のどれがキックが強いか
for k in range(4):
    g = np.arange(ph + k * spb, T, spb * 4)
    print('beat', k, 'low', round(val(low, g).mean(), 3), 'env', round(val(env, g).mean(), 3))
np.save('grid.npy', np.array([bpm, ph]))

import numpy as np
d = np.load('feat.npz'); t = d['t']; dt = t[1]-t[0]
bpm, ph = np.load('grid.npy'); spb = 60/bpm; step = spb/4
def val(v, tm):
    i = int(round((tm - t[0]) / dt)); return max(v[max(0,i-2):i+3]) if 0 <= i < len(v) else 0
ch = lambda x: ' .:-=+*#%@'[min(9, int(x*6))]
bar = spb*4
nb = int((t[-1]-ph)/bar)
for b in range(0, nb, 1):
    s0 = ph + b*bar
    rows = []
    for name in ('low','mid','high'):
        rows.append(''.join(ch(val(d[name], s0 + k*step)) for k in range(16)))
    print(f'bar{b:3d} {s0:6.1f}s  L|{rows[0]}| M|{rows[1]}| H|{rows[2]}|')

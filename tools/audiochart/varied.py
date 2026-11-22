# 飽きにくい譜面: 4小節(フレーズ)ごとに「どの音を拾うか(声部)」を切り替え、同じ形の小節が近くにあれば形を変える
# - 声部: melody(歌・メロディの高さでレーン)/ stairs(メロディの上がり下がりで階段)/ bass(低い音を左手中心)/
#         hats(高い音を右手で刻み、キックを左手)/ groove(キック左・スネア右の同時押しあり)/ trill(2つのレーンの往復。ペアは小節ごとに変える)
# - フレーズごとに、鳴っている帯域の強さから使える声部を選び、直前2フレーズと同じものは避ける。同じ場面(2回目のサビなど)でも違う声部になる
# - 1小節の形(リズム+レーン)が直前8小節に出ていたら、左右反転・手の入れ替え・回転で変える
# 使い方: 作業フォルダ(feat.npz と grid.npy がある所)で
#   python varied.py <曲.wav> <既存の .data.js> <T_END> [難易度=目標nps,...]
#   例: python varied.py song.wav maretu-nyan.data.js 200 normal=3.0,hard=5.0,extra=7.0
#   指定した難易度だけ作り直して同じファイルに書き戻す(ほかの難易度はそのまま)
import sys, json, re, random
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft

SRC, DATA, T_END = sys.argv[1], sys.argv[2], float(sys.argv[3])
TARGETS = dict((k, float(v)) for k, v in (x.split('=') for x in (sys.argv[4] if len(sys.argv) > 4 else 'normal=3,hard=5,extra=7').split(',')))
rng = random.Random(7)
d = np.load('feat.npz'); t = d['t']; dt = t[1] - t[0]
low, mid, high = d['low'], d['mid'], d['high']
bpm, ph = np.load('grid.npy'); spb = 60 / bpm; step = spb / 4

# 音の高さ(chart.py と同じやり方)
sr, x = wavfile.read(SRC)
mono = x.astype(np.float32).mean(axis=1) / 32768
HOP = 441
f2, t2, Z2 = stft(mono, fs=sr, nperseg=8192, noverlap=8192 - HOP, boundary=None, padded=False)
S2 = np.abs(Z2); fm = (f2 >= 70) & (f2 <= 2400); F2 = f2[fm]; S2 = S2[fm]
def pitch(tm):
    i = int(round((tm - t2[0]) / (t2[1] - t2[0])))
    if i < 3 or i + 6 >= S2.shape[1]: return None
    new = np.maximum(0, S2[:, i + 4] - S2[:, i - 3])
    if new.sum() < 1e-6: new = S2[:, i + 4]
    best, bf = 0, None
    for f0 in np.geomspace(90, 1100, 120):
        s = 0
        for h in range(1, 6):
            j = np.searchsorted(F2, f0 * h)
            if j >= len(F2): break
            s += new[max(0, j - 1):j + 2].max() / h
        if s > best: best, bf = s, f0
    return 69 + 12 * np.log2(bf / 440) if bf else None

def at(v, tm, w=2):
    i = int(round((tm - t[0]) / dt))
    if i < 0 or i >= len(v): return 0.0
    return float(v[max(0, i - w):i + w + 1].max())

# 16分の格子ごとの各帯域の強さ(帯域ごとに 95% 点で 0〜1 にそろえる)
slots = []
k = 0
while True:
    g = ph + k * step
    if g > T_END: break
    if g >= 0.15: slots.append(dict(k=k, g=g, l=at(low, g), m=at(mid, g), h=at(high, g), pos=k % 16))
    k += 1
for b in 'lmh':
    q = np.percentile([s[b] for s in slots], 95) or 1
    for s in slots: s[b] = min(1.0, s[b] / q)
bars = {}
for s in slots: bars.setdefault(s['k'] // 16, []).append(s)
BAR_IDS = sorted(bars)
E = {b: np.mean([max(s['l'], s['m'], s['h']) for s in bars[b]]) for b in BAR_IDS}
emax = np.percentile(list(E.values()), 90) or 1
print('bpm', round(float(bpm), 3), 'bars', len(BAR_IDS))

# --- フレーズ(4小節)ごとに声部を決める ---
VOICES = ['melody', 'stairs', 'bass', 'hats', 'groove', 'trill']
def band_profile(bs):
    ss = [s for b in bs for s in bars[b]]
    return dict(l=np.mean([s['l'] for s in ss]), m=np.mean([s['m'] for s in ss]), h=np.mean([s['h'] for s in ss]),
                hat16=np.mean([s['h'] for s in ss if s['pos'] % 2 == 1]))
phrases = [BAR_IDS[i:i + 4] for i in range(0, len(BAR_IDS), 4)]
plan, recent = [], []
for i, bs in enumerate(phrases):
    pr = band_profile(bs)
    e = np.mean([E[b] for b in bs]) / emax
    ok = ['melody', 'stairs']
    if pr['l'] > 0.25: ok += ['bass', 'groove']
    if pr['hat16'] > 0.15 or pr['h'] > 0.25: ok += ['hats']
    if e > 0.55: ok += ['trill', 'groove']
    cand = [v for v in ok if v not in recent[-2:]] or ok
    # 静かなところ(e が低い)はメロディ寄り、盛り上がるところは裏の音寄り
    w = [(2.0 if v in ('melody', 'stairs') else 1.0) * (1.6 if e < 0.45 and v in ('melody', 'stairs') else 1.0) * (1.4 if e > 0.7 and v in ('groove', 'hats', 'bass') else 1.0) for v in cand]
    v = rng.choices(cand, weights=w)[0]
    plan.append(v); recent.append(v)
print('phrases', ' '.join(f'{v[:3]}' for v in plan))

def score(s, v):
    if v in ('melody', 'stairs'): return s['m'] * 1.0 + s['h'] * 0.2
    if v == 'bass': return s['l'] * 1.0 + s['m'] * 0.15
    if v == 'hats': return max(s['h'], 0.9 * s['l'] if s['pos'] % 4 == 0 else 0)
    if v == 'groove': return max(s['l'], s['m'] * s['h'] * 1.3 if s['pos'] in (4, 12) else s['m'] * 0.5)
    if v == 'trill': return s['h'] * 0.6 + s['m'] * 0.6
    return s['m']

LV = {
    # grid: 置ける位置(16分の何個おき) / gap: 同じ手の最小間隔(16分の数) / same: 同じレーンの最小間隔(秒) / chord: 同時押しの多さ
    'normal': dict(grid=2, same=0.30, chord=0.05, maxc=2, thr=0.15),
    'hard':   dict(grid=1, same=0.20, chord=0.12, maxc=2, thr=0.08),
    'extra':  dict(grid=1, same=0.18, chord=0.22, maxc=3, thr=0.03),
}

def build(lv, target):
    P = LV[lv]
    # 1小節の数: 盛り上がりに合わせ、全体で目標 nps になるように係数を探す
    bar_sec = spb * 4
    lo_s, hi_s = 0.1, 20.0
    for _ in range(30):
        mid_s = (lo_s + hi_s) / 2
        n = sum(min(16 // P['grid'], int(round(mid_s * bar_sec * (0.35 + 0.65 * min(1, E[b] / emax) ** 1.3)))) for b in BAR_IDS)
        if n / T_END * (1 + P['chord'] * 0.8) > target: hi_s = mid_s
        else: lo_s = mid_s
    scale = lo_s
    notes = []
    hist = []  # 直前の小節の形
    lane_state = {'melody': 1, 'stairs': 0, 'dir': 1, 'trill': (0, 2), 'alt': 0}
    for pi, bs in enumerate(phrases):
        v = plan[pi]
        for bi, b in enumerate(bs):
            n = min(16 // P['grid'], int(round(scale * bar_sec * (0.35 + 0.65 * min(1, E[b] / emax) ** 1.3))))
            cs = [s for s in bars[b] if s['pos'] % P['grid'] == 0]
            # 8分の裏(16分の位置)は、強い音のときだけ
            cs = sorted(cs, key=lambda s: -(score(s, v) * (1.0 if s['pos'] % 2 == 0 else 0.8)))
            chosen = []
            for s in cs:
                if len(chosen) >= n: break
                if score(s, v) < P['thr']: break
                chosen.append(s)
            chosen.sort(key=lambda s: s['k'])
            # --- レーン ---
            row = []
            if v == 'trill':  # 2つのレーンの往復。ペアは小節ごとに変える
                pairs = [(0, 2), (1, 3), (0, 3), (1, 2), (0, 1), (2, 3)]
                pr = pairs[(pi * 4 + bi) % len(pairs)]
                for j, s in enumerate(chosen): row.append([s, pr[j % 2]])
            elif v == 'stairs':  # メロディの上がり下がりで階段。向きは音の高さの変化に合わせる
                prevp = None; ln = lane_state['stairs']
                for s in chosen:
                    p = pitch(s['g'])
                    if p is not None and prevp is not None and abs(p - prevp) > 0.5: lane_state['dir'] = 1 if p > prevp else -1
                    if p is not None: prevp = p
                    ln = ln + lane_state['dir']
                    if ln > 3: ln = 2; lane_state['dir'] = -1
                    if ln < 0: ln = 1; lane_state['dir'] = 1
                    row.append([s, ln])
                lane_state['stairs'] = ln
            elif v == 'melody':  # 周りの音の中で何番目に高いか
                ps = [pitch(s['g']) for s in chosen]
                for j, s in enumerate(chosen):
                    p = ps[j]; win = [q for q in ps[max(0, j - 5):j + 6] if q is not None]
                    if p is None or len(win) < 3 or max(win) - min(win) < 1:
                        ln = (lane_state['melody'] + 1 + (j % 2)) % 4
                    else:
                        below = sum(1 for q in win if q < p - 0.3) + 0.5 * sum(1 for q in win if abs(q - p) <= 0.3)
                        ln = int(min(3, below / len(win) * 4))
                    lane_state['melody'] = ln
                    row.append([s, ln])
            elif v == 'bass':  # 低い音は左手(D・F)を交互、強い頭は右手も
                for s in chosen:
                    lane_state['alt'] ^= 1
                    ln = lane_state['alt'] if s['l'] >= s['m'] * 0.7 else 2 + lane_state['alt']
                    row.append([s, ln])
            elif v == 'hats':  # キック(拍の頭の低い音)は左手、ハイハットは右手を交互
                for s in chosen:
                    if s['pos'] % 4 == 0 and s['l'] > 0.45: row.append([s, (s['pos'] // 4) % 2])
                    else:
                        lane_state['alt'] ^= 1; row.append([s, 2 + lane_state['alt']])
            elif v == 'groove':  # キック左・スネア(2拍目・4拍目)右
                for s in chosen:
                    if s['pos'] in (4, 12) and s['m'] > 0.4: row.append([s, 2 if (s['pos'] == 4) ^ (bi % 2 == 1) else 3])
                    elif s['l'] >= max(s['m'], s['h']) * 0.8: lane_state['alt'] ^= 1; row.append([s, lane_state['alt']])
                    else: row.append([s, 1 + (s['pos'] // 2) % 3])
            # --- 同じ形の小節が直前8小節にあれば形を変える ---
            shape = tuple((s['pos'], ln) for s, ln in row)
            tries = [lambda l: 3 - l, lambda l: (l + 2) % 4, lambda l: (l + 1) % 4, lambda l: (l + 3) % 4]
            ti = 0
            while shape in hist[-8:] and ti < len(tries):
                f = tries[ti]; row = [[s, f(ln)] for s, ln in row]; shape = tuple((s['pos'], ln) for s, ln in row); ti += 1
            hist.append(shape)
            for s, ln in row:
                notes.append([s['g'], ln, s])
                # 同時押し: 全帯域が強い所(拍の頭・スネア)
                strong = (s['l'] > 0.7 and s['m'] > 0.55) or (s['pos'] in (4, 12) and s['m'] > 0.75 and s['h'] > 0.6)
                if strong and rng.random() < P['chord'] * 3 and s['pos'] % 4 == 0:
                    notes.append([s['g'], 3 - ln if 3 - ln != ln else (ln + 2) % 4, s])
                    if P['maxc'] >= 3 and s['pos'] == 0 and bi == 0 and s['l'] > 0.8 and s['m'] > 0.7 and s['h'] > 0.6:
                        rest = [q for q in range(4) if q not in (ln, 3 - ln)]
                        notes.append([s['g'], rest[pi % len(rest)], s])
    # --- 同じレーンが近すぎる所は、近くで使っていないレーンへ逃がす。逃がせなければ消す ---
    notes.sort(key=lambda n: (n[0], n[1]))
    out, last = [], {0: -9, 1: -9, 2: -9, 3: -9}
    for tm, ln, s in notes:
        same_t = {o[1] for o in out if abs(o[0] / 1000 - tm) < 1e-3}
        if ln in same_t or tm - last[ln] < P['same']:
            alts = [a for a in sorted(range(4), key=lambda a: abs(a - ln)) if a not in same_t and tm - last[a] >= P['same']]
            if not alts: continue
            ln = alts[0]
        if len(same_t) >= P['maxc']: continue
        out.append([round(tm * 1000), ln]); last[ln] = tm
    return out

src = open(DATA, encoding='utf-8').read()
m = re.search(r'export default (\{.*\});', src, re.S)
data = json.loads(m.group(1))
for lv, target in TARGETS.items():
    # 重なりで消えるぶんがあるので、目標の密度に近づくまで数回やり直す
    want = target
    for _ in range(5):
        c = build(lv, want)
        got = len(c) / T_END
        if abs(got - target) < 0.15: break
        want *= target / max(got, 0.1)
    data['charts'][lv] = c
    print(lv, len(c), 'notes', f'{len(c) / T_END:.2f} nps', 'lanes', np.bincount([n[1] for n in c], minlength=4).tolist())
head = src[:m.start()].rstrip('\n')
if 'varied.py' not in head: head += '\n// ' + '・'.join(TARGETS) + ' は varied.py(4小節ごとに拾う音を歌・ベース・ハイハット・キックとスネアなどに切り替え、同じ形の小節が続かないようにした譜面)。'
open(DATA, 'w', encoding='utf-8').write(head + '\nexport default ' + json.dumps(data, separators=(',', ':')) + ';\n')

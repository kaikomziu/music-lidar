# 飽きにくい譜面: 曲をイントロ・Aメロ・Bメロ・サビ・間奏・落ち・アウトロに区切り、区切りごとに譜面の傾向(拾う音・密度・同時押し)を変える。
# さらに4小節(フレーズ)ごとに「どの音を拾うか(声部)」を切り替え、同じ形の小節が近くにあれば形を変える
# - 区切り: 自動で探す(下書き)。正確にしたいときは区切りの表(秒と区切り名)を tools/audiochart/sections/<曲>.txt に書き、SECTIONS=その表 で実行する
# - 傾向: Aメロ=歌を追う単音(HARD 以下は8分)・同時押しなし / Bメロ=階段やグルーヴで最後の小節を詰める / サビ=いちばん濃く、拍の頭に同時押し /
#         イントロ・間奏=トリルや刻み / 落ち=まばら / アウトロ=軽め
# - 2番以降のサビは1番サビの強化版(1番のノーツをそのまま写し、何番目かに応じて刻みと同時押しを足す)
# - 声部: melody(歌・メロディの高さでレーン)/ stairs(メロディの上がり下がりで階段)/ bass(低い音を左手中心)/
#         hats(高い音を右手で刻み、キックを左手)/ groove(キック左・スネア右の同時押しあり)/ trill(2つのレーンの往復。ペアは小節ごとに変える)
# - フレーズごとに、鳴っている帯域の強さから使える声部を選び、直前2フレーズと同じものは避ける。同じ場面(2回目のサビなど)でも違う声部になる
# - 1小節の形(リズム+レーン)が直前8小節に出ていたら、左右反転・手の入れ替え・回転で変える
# 使い方: 作業フォルダ(feat.npz と grid.npy がある所)で
#   python varied.py <曲.wav> <既存の .data.js> <T_END> [難易度=目標nps,...]
#   例: SECTIONS=../../music-lidar/tools/audiochart/sections/maretu-nyan.txt python varied.py song.wav maretu-nyan.data.js 200 normal=3.0,hard=5.0,extra=7.0
#   区切りだけ確かめる: SEC_ONLY=1 を付けると、見つけた区切りを表示して終わる
#   指定した難易度だけ作り直して同じファイルに書き戻す(ほかの難易度はそのまま)
import sys, json, re, random
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft

SRC, DATA, T_END = sys.argv[1], sys.argv[2], float(sys.argv[3])
TARGETS = dict((k, float(v)) for k, v in (x.split('=') for x in (sys.argv[4] if len(sys.argv) > 4 else 'normal=3,hard=5,extra=7').split(',')))
rng = random.Random(7)
import os
SIM_Q = float(os.environ.get('SIM_Q', '0.18'))
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

# --- 曲の区切り(イントロ・Aメロ・Bメロ・サビ・間奏・アウトロ)を見つける ---
# 1) 小節ごとに「音量・左右の広がり・高音(シンバル)・低音(ベース)・和音の響き」を測る
# 2) 小節を、中身がそろった区切り(2小節単位・4〜16小節)に分ける(動的計画法。区切りの数は平均8小節前後になるよう調整)
# 3) 似た区切りを同じ組にし、2回以上出てくる組のうちいちばん大きい音の組をサビ、サビの直前の別の組を Bメロ、その前を Aメロとする
VOICES = ['melody', 'stairs', 'bass', 'hats', 'groove', 'trill']
xf = x.astype(np.float32) / 32768
if xf.ndim == 1: xf = np.stack([xf, xf], axis=1)
MID, SIDE = (xf[:, 0] + xf[:, 1]) / 2, (xf[:, 0] - xf[:, 1]) / 2
PC = np.round(69 + 12 * np.log2(np.maximum(F2, 1) / 440)).astype(int) % 12
def band_profile(bs):
    ss = [s for b in bs for s in bars[b]]
    return dict(l=np.mean([s['l'] for s in ss]), m=np.mean([s['m'] for s in ss]), h=np.mean([s['h'] for s in ss]),
                hat16=np.mean([s['h'] for s in ss if s['pos'] % 2 == 1]))
bar_sec = spb * 4
def bar_feat(b):
    g0 = ph + b * bar_sec
    a0, a1 = int(g0 * sr), int((g0 + bar_sec) * sr)
    m, sd = MID[a0:a1], SIDE[a0:a1]
    vol = 20 * np.log10(np.sqrt(np.mean(m ** 2)) + 1e-9)
    side = 20 * np.log10(np.sqrt(np.mean(sd ** 2)) + 1e-9) - vol
    ss = bars[b]
    hi = np.mean([s['h'] for s in ss]); lo = np.mean([s['l'] for s in ss])
    i0, i1 = np.searchsorted(t2, g0), np.searchsorted(t2, g0 + bar_sec)
    ch = np.bincount(PC, weights=S2[:, i0:max(i1, i0 + 1)].mean(axis=1), minlength=12); ch = ch / (np.linalg.norm(ch) or 1)
    return vol, np.array([vol, side, hi, lo]), ch
BF = [bar_feat(b) for b in BAR_IDS]
VOL = np.array([f[0] for f in BF])
X4 = np.array([f[1] for f in BF]); X4 = (X4 - X4.mean(0)) / (X4.std(0) + 1e-9)
CHR = np.array([f[2] for f in BF])
XB = np.concatenate([X4, 1.2 * CHR], axis=1)  # 和音は区切りの中でも動くので少し弱め
NB = len(BAR_IDS)
cs1 = np.vstack([np.zeros(XB.shape[1]), np.cumsum(XB, axis=0)]); cs2 = np.concatenate([[0], np.cumsum((XB ** 2).sum(axis=1))])
def seg_cost(i, j):  # 小節 i..j-1 のばらつき
    n = j - i; mu = (cs1[j] - cs1[i]) / n
    return (cs2[j] - cs2[i]) - n * float(mu @ mu)
LENS = [4, 6, 8, 10, 12, 16]  # 2小節単位。最初と最後の区切りだけは弱起などで半端な長さを許す
def segment(lam):
    best = [0.0] + [1e18] * NB; prev = [0] * (NB + 1)
    for j in range(1, NB + 1):
        for L in (list(range(1, 17)) if j <= 16 else []) + LENS + (list(range(1, 17)) if j == NB else []):
            i = j - L
            if i < 0: continue
            if L not in LENS and i != 0 and j != NB: continue
            c = best[i] + seg_cost(i, j) + lam * (1.0 if L in LENS else 1.3)
            if c < best[j]: best[j] = c; prev[j] = i
    cuts, j = [], NB
    while j > 0: cuts.append((prev[j], j)); j = prev[j]
    return cuts[::-1]
lo_l, hi_l = 0.1, 400.0
for _ in range(30):
    mid_l = (lo_l + hi_l) / 2
    if len(segment(mid_l)) > NB / 8: lo_l = mid_l
    else: hi_l = mid_l
SEGS = segment(hi_l)
# 区切りの組分け(中身の平均が近いものを同じ組に)
SF = [XB[i:j].mean(axis=0) for i, j in SEGS]
SV = [VOL[i:j].mean() for i, j in SEGS]
def sdist(p, q): return float(np.linalg.norm(SF[p] - SF[q]))
dd = sorted(sdist(p, q) for p in range(len(SF)) for q in range(p + 1, len(SF)))
TH = dd[int(len(dd) * SIM_Q)] if dd else 1
group, members = [], []
for p in range(len(SF)):
    bg = min(range(len(members)), key=lambda g: np.mean([sdist(p, q) for q in members[g]]), default=None)
    if bg is not None and np.mean([sdist(p, q) for q in members[bg]]) <= TH: group.append(bg); members[bg].append(p)
    else: group.append(len(members)); members.append([p])
vmed = float(np.median(VOL))
rep = [g for g in range(len(members)) if len(members[g]) >= 2]
CH = max(rep or range(len(members)), key=lambda g: np.mean([SV[p] for p in members[g]]))
CHS = {CH}
lab = ['chorus' if group[p] in CHS else '' for p in range(len(SEGS))]
if lab[0] == '' and SV[0] < vmed - 2: lab[0] = 'intro'
if lab[-1] == '' and SV[-1] < vmed - 2: lab[-1] = 'outro'
first_ch = lab.index('chorus'); last_ch = len(lab) - 1 - lab[::-1].index('chorus')
INTRO_G = {group[p] for p in range(len(lab)) if lab[p] == 'intro'}
p = 0
while p < len(lab):
    if lab[p]: p += 1; continue
    e = p
    while e < len(lab) and not lab[e]: e += 1
    run = list(range(p, e))
    before_ch = e < len(lab) and lab[e] == 'chorus'
    after_ch = p > 0 and lab[p - 1] == 'chorus'
    if before_ch:
        lab[run[-1]] = 'B'
        # 直前の区切りも同じ組なら Bメロの続き
        for q in reversed(run[:-1]):
            if group[q] == group[run[-1]]: lab[q] = 'B'
            else: break
        rest = [q for q in run if not lab[q]]
        # サビの直後の、Aメロともイントロとも違う区切りは間奏
        if after_ch and len(rest) >= 2 and group[rest[0]] != group[rest[1]]: lab[rest[0]] = 'interlude'
        for q in rest:
            if not lab[q]: lab[q] = 'A'
    elif p > last_ch:  # 最後のサビのあと
        for q in run: lab[q] = 'outro' if q == len(lab) - 1 or SV[q] < vmed - 1.5 else 'interlude'
    else:
        for q in run: lab[q] = 'interlude' if group[q] in INTRO_G or after_ch else 'A'
    p = e
# 曲の途中のとても静かな区切りは「落ち」(まばらな譜面にする)
for q in range(1, len(lab) - 1):
    if lab[q] in ('A', 'interlude') and SV[q] < vmed - 4: lab[q] = 'break'
# 手で直す: 区切りの表(1行に「秒 区切り名」。区切り名は intro/A/B/chorus/interlude/break/outro)があれば、それを使う
# 表の場所は環境変数 SECTIONS(なければ作業フォルダの sections.txt)。曲ごとの表は tools/audiochart/sections/ に置く
SEC_FILE = os.environ.get('SECTIONS', 'sections.txt')
if os.path.exists(SEC_FILE):
    marks = []
    for line in open(SEC_FILE, encoding='utf-8'):
        w = line.split('#')[0].split()
        if len(w) >= 2: marks.append((float(w[0]), w[1]))
    marks.sort()
    bt = [ph + b * bar_sec for b in BAR_IDS]
    idx = [int(np.argmin([abs(x - tm) for x in bt])) for tm, _ in marks]
    SEGS, lab = [], []
    for k, (i0, (tm, name)) in enumerate(zip(idx, marks)):
        i1 = idx[k + 1] if k + 1 < len(idx) else NB
        if i1 > i0: SEGS.append((i0, i1)); lab.append(name)
    if SEGS and SEGS[0][0] > 0: SEGS[0] = (0, SEGS[0][1])
    group = list(range(len(SEGS)))
    print('区切りの表を使用:', SEC_FILE)
NAME = dict(intro='イントロ', A='Aメロ', B='Bメロ', chorus='サビ', interlude='間奏', outro='アウトロ', **{'break': '落ち'})
print('sections', ' / '.join(f"{NAME[lab[q]]}@{ph + BAR_IDS[i] * bar_sec:.1f}s({j - i})" for q, (i, j) in enumerate(SEGS)))
print('groups  ', ' '.join(str(g) for g in group))
# 区切りの中を4小節ずつのフレーズに分ける(端が2小節なら前のフレーズに足す)
phrases, sec, sec_pos, sec_occ = [], [], [], []
occ = {}
for q, (i, j) in enumerate(SEGS):
    occ[lab[q]] = occ.get(lab[q], -1) + 1
    chunk = [BAR_IDS[i:j][k:k + 4] for k in range(0, j - i, 4)]
    if len(chunk) > 1 and len(chunk[-1]) < 4: tail = chunk.pop(); chunk[-1] = chunk[-1] + tail
    for k, c in enumerate(chunk):
        phrases.append(c); sec.append(lab[q]); sec_pos.append(k); sec_occ.append(occ[lab[q]])
if os.environ.get('SEC_ONLY'): sys.exit()

# --- 区切りごとの譜面の傾向 ---
# voices: 使う声部(先頭ほど選ばれやすい) / dens: 密度の倍率 / chord: 同時押しの倍率 / fill: 区切りの最後の小節を細かくする
STYLE = {
    # grid8: EXTRA 以外は8分の位置だけにする(Aメロは歌を追う落ち着いた譜面に) / chord: 同時押しの倍率(2以上は大きい音なら拍の頭で同時押し)
    'intro':     dict(voices=['trill', 'hats', 'bass', 'stairs'], dens=0.7, chord=0.5, fill=False),
    'A':         dict(voices=['melody', 'bass', 'stairs'], dens=0.7, chord=0.0, fill=False, grid8=True),
    'B':         dict(voices=['stairs', 'groove', 'trill', 'melody'], dens=0.8, chord=0.8, fill=True),
    'chorus':    dict(voices=['groove', 'hats', 'melody', 'stairs', 'bass'], dens=1.4, chord=2.5, fill=False),
    'interlude': dict(voices=['trill', 'hats', 'groove', 'bass'], dens=1.0, chord=1.0, fill=True),
    'outro':     dict(voices=['melody', 'trill', 'stairs'], dens=0.65, chord=0.5, fill=False),
    'break':     dict(voices=['melody', 'stairs'], dens=0.5, chord=0.0, fill=True),
}
# 2番以降のサビは「1番サビの強化版」: 1番サビと同じ位置では同じ声部を使い、
# 密度と同時押しを回数に応じて増やす。base_pi は元にする1番サビのフレーズ、boost は強化の段階(1番=0、2番=1、3番=2…)
ch_len = {}
for i in range(len(phrases)):
    if sec[i] == 'chorus': ch_len[sec_occ[i]] = ch_len.get(sec_occ[i], 0) + len(phrases[i])
# 1番サビ = Aメロか Bメロのすぐあとに来る最初のサビ(曲の頭のサビ頭やイントロ直後のサビは数えない)
after_ab = {sec_occ[i] for i in range(1, len(phrases)) if sec[i] == 'chorus' and sec_pos[i] == 0 and sec[i - 1] in ('A', 'B')}
BASE_OCC = min(after_ab or [o for o, n in ch_len.items() if n >= 8] or [0])
base_pi, boost = list(range(len(phrases))), [0] * len(phrases)
first = {sec_pos[i]: i for i in range(len(phrases)) if sec[i] == 'chorus' and sec_occ[i] == BASE_OCC}
for i in range(len(phrases)):
    if sec[i] == 'chorus' and sec_occ[i] > BASE_OCC:
        boost[i] = min(2, sec_occ[i] - BASE_OCC)  # 強化は2段階まで(サビが多い曲で濃くなりすぎないように)
        if sec_pos[i] in first: base_pi[i] = first[sec_pos[i]]
plan, recent, used = [], [], {}
for i, bs in enumerate(phrases):
    pr = band_profile(bs); st = STYLE[sec[i]]
    ok = ['melody', 'stairs', 'trill']
    if pr['l'] > 0.2: ok += ['bass', 'groove']
    if pr['hat16'] > 0.15 or pr['h'] > 0.25: ok += ['hats']
    cand = [v for v in st['voices'] if v in ok] or ['melody']
    # 同じ区切りの何フレーズ目か。前回同じ区切りの同じ位置で使った声部と、直前のフレーズの声部は避ける(2回目のサビは別の譜面)
    key = (sec[i], sec_pos[i])
    c2 = [v for v in cand if v != used.get(key) and v not in recent[-1:]] or cand
    w = [len(st['voices']) - st['voices'].index(v) for v in c2]
    v = rng.choices(c2, weights=w)[0]
    if base_pi[i] < i: v = plan[base_pi[i]]  # 1番サビと同じ声部
    plan.append(v); recent.append(v); used[key] = v
print('phrases ', ' '.join(f'{v[:3]}' for v in plan))
if os.environ.get('DEBUG'): print('plan    ', ' '.join(f'{sec[i][:3]}{sec_occ[i]}.{sec_pos[i]}:{plan[i][:3]}{"+" * boost[i]}' for i in range(len(plan))))

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
    'inferno': dict(grid=1, same=0.15, chord=0.32, maxc=3, thr=0.02),  # 5つ目の難易度(EXTRA の上)
}
# 速い曲(BPM 200 以上、または CHART_FAST=1): キーボードで叩ける細かさにするため、HARD・EXTRA も8分まで(NORMAL はもともと8分まで)
FAST = bpm >= 200 or bool(os.environ.get('CHART_FAST'))
if FAST:
    for k_, P_ in LV.items():
        if k_ != 'normal': P_['grid'] *= 2

# 小節ごとの密度の倍率。alpha は区切りごとの差の強さ(1=そのまま。目標の密度に届かない曲は弱めて作り直す)
def make_bd(alpha):
    bd = {}
    for i, bs in enumerate(phrases):
        st = STYLE[sec[i]]
        last = i + 1 >= len(sec) or sec[i + 1] != sec[i]
        for j, b in enumerate(bs):
            d = st['dens'] * (1 + 0.15 * boost[i]) * (1.5 if st['fill'] and last and j == len(bs) - 1 else 1.0)
            bd[b] = 1 + (d - 1) * alpha
    return bd

def build(lv, target, alpha=1.0):
    P = LV[lv]
    BD = make_bd(alpha); cm = 1 + (1 - alpha) * 0.6  # 差を弱めるときは同時押しで密度を補う
    # 1小節の数: 盛り上がりに合わせ、全体で目標 nps になるように係数を探す
    lo_s, hi_s = 0.1, 20.0
    for _ in range(30):
        mid_s = (lo_s + hi_s) / 2
        n = sum(min(16 // P['grid'], int(round(mid_s * bar_sec * BD[b] * (0.35 + 0.65 * min(1, E[b] / emax) ** 1.3)))) for b in BAR_IDS)
        if n / T_END * (1 + P['chord'] * 0.8) > target: hi_s = mid_s
        else: lo_s = mid_s
    scale = lo_s
    notes = []
    hist = []  # 直前の小節の形
    lane_state = {'melody': 1, 'stairs': 0, 'dir': 1, 'trill': (0, 2), 'alt': 0}
    for pi, bs in enumerate(phrases):
        v = plan[pi]; st = STYLE[sec[pi]]; cb = 1 + 0.5 * boost[pi]  # 強化版は同時押しも増やす
        for bi, b in enumerate(bs):
            n = min(16 // P['grid'], int(round(scale * bar_sec * BD[b] * (0.35 + 0.65 * min(1, E[b] / emax) ** 1.3))))
            gr = max(P['grid'], 2) if st.get('grid8') and lv not in ('extra', 'inferno') and alpha >= 1 else P['grid']
            cs = [s for s in bars[b] if s['pos'] % gr == 0]
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
                pr = pairs[(base_pi[pi] * 4 + bi) % len(pairs)]  # 強化版は1番サビと同じペア
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
                if st['chord'] >= 2: strong = strong or s['l'] > 0.5 or (s['pos'] in (4, 12) and s['m'] > 0.5)
                if strong and rng.random() < P['chord'] * 3 * max(st['chord'], 1 - alpha) * cb * cm and (s['pos'] % 4 == 0 or (st['chord'] >= 2 and P['maxc'] >= 3 and s['pos'] % 2 == 0 and rng.random() < 0.5)):
                    notes.append([s['g'], 3 - ln if 3 - ln != ln else (ln + 2) % 4, s])
                    if P['maxc'] >= 3 and s['pos'] == 0 and bi == 0 and s['l'] > 0.8 and s['m'] > 0.7 and s['h'] > 0.6:
                        rest = [q for q in range(4) if q not in (ln, 3 - ln)]
                        notes.append([s['g'], rest[pi % len(rest)], s])
                elif alpha < 1 and (s['l'] > 0.3 or s['m'] > 0.3) and rng.random() < (1 - alpha) * 0.75:
                    # 差を弱めて作り直すとき(密な譜面の曲): 左右の手を重ねる2つ同時押しを、どの位置にも入れてよい
                    notes.append([s['g'], 3 - ln if 3 - ln != ln else (ln + 2) % 4, s])
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
    # --- 2番以降のサビ(強化版): 1番サビの完成したノーツをそのまま写し、その上に自分で作ったノーツから足す ---
    # 足す数は 1番の 15% × 強化の段階。足すのは、同じレーンが近すぎず、同時押しの上限を超えないものだけ
    def bar_t(b): return (ph + b * bar_sec - step / 2) * 1000  # 半マス手前から(拍の頭のノーツを取りこぼさない)
    for pi in range(len(phrases)):
        bp = base_pi[pi]
        if bp >= pi: continue
        nb = min(len(phrases[pi]), len(phrases[bp]))
        w0, w1 = bar_t(phrases[pi][0]), bar_t(phrases[pi][nb - 1] + 1)
        own = [n for n in out if w0 <= n[0] < w1]
        out = [n for n in out if not (w0 <= n[0] < w1)]
        kept = []
        for j in range(nb):
            s0, d0 = bar_t(phrases[bp][j]), bar_t(phrases[pi][j])
            kept += [[round(n[0] - s0 + d0), n[1]] for n in out if s0 <= n[0] < s0 + bar_sec * 1000]
        add = round(len(kept) * 0.15 * boost[pi])
        times = {}
        for n in kept: times.setdefault(n[0], set()).add(n[1])
        # 1番に無いタイミング(細かい刻み)を先に、次に同時押しを足す
        cand = sorted(own, key=lambda n: (n[0] in times, rng.random()))
        for n in cand:
            if add <= 0: break
            ls = times.get(n[0], set())
            if n[1] in ls or len(ls) >= P['maxc']: continue
            if any(k[1] == n[1] and abs(k[0] - n[0]) < P['same'] * 1000 for k in kept): continue
            kept.append(n); times.setdefault(n[0], set()).add(n[1]); add -= 1
        out += kept
    # 仕上げ: 3ms 以内のずれはそろえ、同じレーンが近すぎるもの・同時押しの上限を超えるものは消す(写した所のつなぎ目のため)
    out.sort()
    fin, last = [], {}
    for tm, ln in out:
        if fin and tm - fin[-1][0] <= 3: tm = fin[-1][0]
        same_t = [o for o in fin if o[0] == tm]
        if any(o[1] == ln for o in same_t) or len(same_t) >= P['maxc']: continue
        if ln in last and tm - last[ln] < P['same'] * 1000 - 2: continue
        fin.append([tm, ln]); last[ln] = tm
    return fin

src = open(DATA, encoding='utf-8').read()
m = re.search(r'export default (\{.*\});', src, re.S)
data = json.loads(m.group(1))
for lv, target in TARGETS.items():
    # 重なりで消えるぶんがあるので、目標の密度に近づくまで数回やり直す
    # 届かないときは、区切りごとの差を弱めて(alpha を下げて)やり直す
    for alpha in (1.0, 0.6, 0.3, 0.0):
        want = target
        for _ in range(5):
            c = build(lv, want, alpha)
            got = len(c) / T_END
            if abs(got - target) < 0.15: break
            want *= target / max(got, 0.1)
        if got >= target * 0.95: break
    if alpha < 1: print('   区切りごとの差を弱めた: alpha', alpha)
    # 今の譜面のロングノーツを引き継ぐ。
    # 1) 同じ時刻(±40ms)に新しいノーツがあれば、のばしている間あいているレーンでロングにする(レーンを移してもよい)
    # 2) なければ、のばしている間あいているレーンに新しくロングを置く(同時押しの上限は守る)
    # 置いたぶんで目標より 3% 以上多くなったら、全体を減らして作り直す
    old_ln = [n for n in data['charts'].get(lv, []) if len(n) > 2]
    gap = LV[lv]['same'] * 1000
    def carry(c):
        kept = added = 0
        def lane_free(ln, t_from, t_to, skip=None):
            # その間にそのレーンで始まるノーツがなく、そのレーンでのばしているロングとも重ならない
            return all(not (q[1] == ln and (t_from < q[0] <= t_to or (len(q) > 2 and q[0] <= t_to and q[2] + gap >= t_from))) for q in c if q is not skip)
        for t0, l0, e0 in old_ln:
            near = sorted((n for n in c if len(n) == 2 and abs(n[0] - t0) <= 40), key=lambda n: (n[1] != l0, abs(n[0] - t0)))
            done = False
            for n in near:
                for ln in [n[1], l0] + [x for x in range(4) if x not in (n[1], l0)]:
                    if any(q is not n and q[0] == n[0] and q[1] == ln for q in c): continue
                    if lane_free(ln, n[0] - gap, e0 + gap, skip=n):
                        n[1] = ln; n.append(e0 - t0 + n[0]); kept += 1; done = True; break
                if done: break
            if done: continue
            same_t = [q for q in c if abs(q[0] - t0) <= 40]
            if len(same_t) >= LV[lv]['maxc']: continue
            for ln in [l0] + [x for x in range(4) if x != l0]:
                if any(q[1] == ln for q in same_t): continue
                if lane_free(ln, t0 - gap, e0 + gap):
                    c.append([t0, ln, e0]); added += 1; break
        c.sort(key=lambda n: (n[0], n[1]))
        return kept, added
    if old_ln:
        base_c = [list(n) for n in c]
        kept, added = carry(c)
        if len(c) > target * T_END * 1.03:
            c = build(lv, want * target * T_END / len(c), alpha)
            kept, added = carry(c)
        print('   ロングノーツ', kept + added, '/', len(old_ln), f'本を引き継いだ(新しく置いた {added} 本)')
    data['charts'][lv] = c
    print(lv, len(c), 'notes', f'{len(c) / T_END:.2f} nps', 'lanes', np.bincount([n[1] for n in c], minlength=4).tolist())
    # 区切りの種類ごとの密度(傾向が変わっているかの確認用)
    span = {}
    for pi, bs in enumerate(phrases):
        g0 = ph + bs[0] * bar_sec; g1 = ph + (bs[-1] + 1) * bar_sec
        ts = [q[0] for q in c if g0 * 1000 <= q[0] < g1 * 1000]
        a = span.setdefault(sec[pi], [0, 0.0, 0]); a[0] += len(ts); a[1] += g1 - g0; a[2] += len(ts) - len(set(ts))
    print('   ', ' '.join(f'{NAME[k]}{v[0] / v[1]:.1f}(同時{v[2] / max(1, v[0]) * 100:.0f}%)' for k, v in span.items()))
head = src[:m.start()].rstrip('\n')
head = re.sub(r'\n// [^\n]*varied\.py[^\n]*', '', head)  # 前の varied.py の説明は消して書き直す
head += '\n// ' + '・'.join(k for k in data['charts'] if k != 'easy') + ' は varied.py(曲をイントロ・Aメロ・Bメロ・サビなどに区切り、区切りごとに拾う音・密度・同時押しの傾向を変え、2番以降のサビは1番サビの強化版にし、4小節ごとに拾う音を切り替えて同じ形の小節が続かないようにした譜面。区切りは tools/audiochart/sections/ の表)。'
open(DATA, 'w', encoding='utf-8').write(head + '\nexport default ' + json.dumps(data, separators=(',', ':')) + ';\n')

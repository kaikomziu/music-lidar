# 高難易度の「重ねる」譜面: 主旋律だけでなく裏の音(キック・ベース・ハット・シンセ)も拾い、左手と右手で別のリズムを叩く形にする
# - 刻みは8分まで(16分は置かない)。キーボードで叩ける細かさのまま、同時押しと両手の別リズムで難しくする
# - 左手(D・F = レーン0・1)は低い音(キック・ベース)、右手(J・K = レーン2・3)は中・高い音(シンセ・声・ハット)
# - 同じ手で8分が続くときは2つのキーを交互に叩く(同じキーの8分連打はしない)
# - 両方の手に音がある所は同時押し。小節の頭で全部の帯域が強い所は3つ同時押し
# 使い方: 作業フォルダ(feat.npz と grid.npy がある所)で
#   python layered.py <既存の .data.js> <T_END> <HARDの目標 nps> <NORMALの目標 nps>
#   EASY は既存の .data.js のまま。HARD と NORMAL を作り直して同じファイルに書き戻す
import sys, json, re
import numpy as np

DATA, T_END, HARD_NPS, NORMAL_NPS = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
d = np.load('feat.npz'); t = d['t']; dt = t[1] - t[0]
low, mid, high = d['low'], d['mid'], d['high']
bpm, ph = np.load('grid.npy'); spb = 60 / bpm; e8 = spb / 2

def at(v, tm, w=2):
    i = int(round((tm - t[0]) / dt))
    if i < 0 or i >= len(v): return 0.0
    return float(v[max(0, i - w):i + w + 1].max())

# 8分の格子ごとの各帯域の強さ
slots = []
k = 0
while True:
    g = ph + k * e8
    if g > T_END: break
    if g >= 0.15:
        slots.append(dict(k=k, t=g, l=at(low, g), m=at(mid, g), h=at(high, g), beat=(k % 2 == 0), bar=(k % 8 == 0)))
    k += 1
L = np.array([s['l'] for s in slots]); R = np.array([max(s['m'], 0.8 * s['h']) for s in slots])
dur = T_END - slots[0]['t']

def pick(target_nps, alt_hands):
    # 左右それぞれ、強い順に拾って目標の数にする(左右の割合は音の強さの合計に合わせる)
    n = int(target_nps * dur)
    best = None
    for q in np.linspace(0.05, 0.98, 120):
        tl, tr = np.quantile(L, q), np.quantile(R, q)
        on_l = L >= tl; on_r = R >= tr
        if alt_hands:  # NORMAL: 同じ手で8分が続かないように(続いたら弱い方を落とす)
            on_l, on_r = thin(on_l, L), thin(on_r, R)
        c = int(on_l.sum() + on_r.sum())
        if best is None or abs(c - n) < abs(best[0] - n): best = (c, on_l, on_r)
    return best[1], best[2]

def thin(on, v):
    on = on.copy()
    for i in range(1, len(on)):
        if on[i] and on[i - 1]:
            if v[i] > v[i - 1]: on[i - 1] = False
            else: on[i] = False
    return on

def build(on_l, on_r, triple):
    notes = []
    last = {0: -9, 1: -9, 2: -9, 3: -9}
    prev = {'L': None, 'R': None}  # 手ごとの直前のレーンと時刻
    def place(hand, s, prefer):
        lanes = (0, 1) if hand == 'L' else (2, 3)
        p = prev[hand]
        if p and s['t'] - p[1] < e8 * 1.5: lane = lanes[1] if p[0] == lanes[0] else lanes[0]  # 8分が続く: 交互
        else: lane = prefer
        if s['t'] - last[lane] < 0.2:  # 同じキーが近すぎる: もう片方へ
            other = lanes[1] if lane == lanes[0] else lanes[0]
            if s['t'] - last[other] < 0.2: return None
            lane = other
        last[lane] = s['t']; prev[hand] = (lane, s['t'])
        notes.append([round(s['t'] * 1000), lane])
        return lane
    for i, s in enumerate(slots):
        a = b = None
        if on_l[i]: a = place('L', s, 0 if s['beat'] else 1)  # 拍の頭のキックは外側(D)、裏のベースは内側(F)
        if on_r[i]: b = place('R', s, 3 if s['h'] > s['m'] else 2)  # ハットが強ければ外側(K)、シンセ・声は内側(J)
        # 3つ同時押し: 小節の頭で全部の帯域が強い所(HARD だけ)
        if triple and s['bar'] and a is not None and b is not None and min(s['l'], s['m'], s['h']) > 0.75:
            for lane in ((1 if a == 0 else 0), (2 if b == 3 else 3)):
                if s['t'] - last[lane] >= 0.2:
                    last[lane] = s['t']; notes.append([round(s['t'] * 1000), lane]); break
    return sorted(notes)

src = open(DATA, encoding='utf-8').read()
m = re.search(r'export default (\{.*\});', src, re.S)
data = json.loads(m.group(1))
on_l, on_r = pick(HARD_NPS, False)
data['charts']['hard'] = build(on_l, on_r, True)
on_l, on_r = pick(NORMAL_NPS, True)
data['charts']['normal'] = build(on_l, on_r, False)
for lv in ('easy', 'normal', 'hard'):
    c = data['charts'][lv]
    print(lv, len(c), 'notes', f'{len(c) / dur:.2f} nps', 'lanes', np.bincount([n[1] for n in c], minlength=4).tolist())
head = src[:m.start()]
head = re.sub(r'^// .*\n', '', head, count=1)
open(DATA, 'w', encoding='utf-8').write(
    head.replace('export default ', '') +
    f'// 譜面データ(EASY は chart.py、NORMAL・HARD は layered.py: 裏の音も拾い、左手=低い音・右手=中高い音で重ねた高難易度。8分まで)。[ms, レーン, 終端ms?]\n'
    'export default ' + json.dumps(data, separators=(',', ':')) + ';\n')

// DUBSTEP / 140 BPM: ハーフタイムのビートとワブルベース
const PAD = ['F3+Ab3+C4', 'Db3+F3+Ab3', 'Eb3+G3+Bb3', 'C3+Eb3+G3'];
// ワブル: [拍, 長さ, 音, 1拍あたりの揺れ回数]
const WOB = [
  [[0, 1.5, 'F2', 2], [1.5, 0.5, 'F2', 4], [2, 1, 'Ab2', 1], [3, 0.75, 'C3', 3], [3.75, 0.25, 'Eb3', 4]],
  [[0, 1, 'Db2', 1], [1, 1, 'Db2', 4], [2, 0.5, 'F2', 2], [2.5, 0.5, 'Ab2', 2], [3, 1, 'Bb2', 3]],
  [[0, 2, 'Eb2', 0.5], [2, 0.5, 'Eb2', 4], [2.5, 0.5, 'G2', 4], [3, 1, 'Bb2', 2]],
  [[0, 0.75, 'C3', 3], [0.75, 0.75, 'C3', 3], [1.5, 0.5, 'Eb3', 4], [2, 2, 'C2', 1.5]],
];
const BELL = 'C6 - - - Ab5 - - - | F5 - - - Ab5 - C6 - | Bb5 - - - G5 - - - | Eb5 - - - - - - - |';

export default {
  id: 'wub-fracture',
  urlId: 'almqea2oc', // 曲ページのURL (music/almqea2oc/)。公開後は変えない
  title: 'Wub Fracture',
  artist: 'MUSIC LiDAR',
  genre: 'DUBSTEP',
  bpm: 140,
  color: '#8f5bff',
  levels: { easy: 3, normal: 6, hard: 10 },
  preview: 96,
  chart: { hard: { minGap: 0.1, maxNps: 8, lnMin: 0.35 }, normal: { lnMin: 0.45 } },
  compose(s) {
    const pads = (from, bars, vel = 1) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, PAD[b % 4].split('+'), 4, vel); };
    const wob = (from, bars, vel = 1) => {
      for (let b = from; b < from + bars; b++) for (const [o, d, n, r] of WOB[b % 4]) s.wobble(b * 4 + o, n, d, r, vel);
    };
    const half = { kick: 'X.........x.....', snare: '........X.......', hat: 'x.x.x.x.x.x.x.x.' };
    const half2 = { kick: 'X.....x...x..x..', snare: '........X.....g.', hat: 'x.xxx.x.x.xxx.xo' };

    // intro
    pads(0, 8, 0.9);
    s.seq('bell', 0, 0.5, BELL, 0.8);
    s.seq('bell', 16, 0.5, BELL, 0.8);
    s.drums(4, 4, { hat: 'x...x...x...x...', kick: 'X...............' });
    // build
    s.drums(8, 2, { snare: 'x...x...x...x...', kick: 'X...X...X...X...' });
    s.drums(10, 1, { snare: 'x.x.x.x.x.x.x.x.' });
    s.drums(11, 1, { snare: 'xxxxxxxxxxxxxxxx' });
    s.ghost(() => pads(8, 4, 0.8));
    s.riser(32, 16);
    // drop 1
    s.crash(48); s.downer(48, 2);
    s.drums(12, 16, half); wob(12, 8); wob(20, 8);
    s.crash(80, 0.8);
    // break
    s.downer(112, 4);
    pads(28, 8, 1.1);
    s.seq('bell', 112, 0.5, BELL);
    s.seq('lead', 128, 0.5, BELL, 0.7);
    s.drums(32, 2, { snare: 'x...x...x...x...' });
    s.drums(34, 2, { snare: 'xxxxxxxxxxxxxxxx' });
    s.riser(128, 16);
    // drop 2
    s.crash(144); s.downer(144, 2);
    s.drums(36, 16, half2); wob(36, 16);
    s.crash(176, 0.8);
    // outro
    s.crash(208); s.kick(208);
    s.wobble(208, 'F2', 2, 0.5); s.pad(208, ['F3', 'Ab3', 'C4'], 4, 0.9);
  },
};

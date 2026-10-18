// CHIPTUNE / 150 BPM: ファミコン風の8bitサウンド
const ROOT = ['C', 'A', 'F', 'G'];
const ARP = [['C5', 'E5', 'G5', 'C6'], ['A4', 'C5', 'E5', 'A5'], ['F4', 'A4', 'C5', 'F5'], ['G4', 'B4', 'D5', 'G5']];
const MEL_A =
  'E5 - G5 - C6 - G5 - | A5 - - - E5 - C5 - | F5 - A5 - C6 - A5 - | G5 - - - - - D5 - |' +
  'E5 - G5 - C6 - E6 - | D6 - C6 - A5 - G5 - | F5 - E5 - D5 - E5 - | C5 - - - - - - - |';
const MEL_B = [
  'C6 B5 A5 G5 A5 G5 E5 G5 C6 B5 A5 G5 E5 D5 C5 D5',
  'A5 G5 E5 D5 E5 D5 C5 E5 A5 G5 E5 G5 A5 B5 C6 A5',
  'F5 G5 A5 C6 F6 E6 C6 A5 F5 G5 A5 C6 D6 C6 A5 F5',
  'G5 A5 B5 D6 G6 F6 D6 B5 G5 B5 D6 F6 G6 - - -',
];
const BRIDGE = 'A5 - - - - - - - | F5 - - - - - - - | G5 - - - E5 - - - | D5 - - - G5 - - - |';

export default {
  id: 'pixel-quest',
  urlId: 'kln5x9ywd', // 曲ページのURL (music/kln5x9ywd/)。公開後は変えない
  title: 'Pixel Quest',
  artist: 'MUSIC LiDAR',
  genre: 'CHIPTUNE',
  bpm: 150,
  color: '#5dff9c',
  levels: { easy: 3, normal: 7, hard: 10 },
  preview: 96,
  chart: { hard: { minGap: 0.1, maxNps: 8.5 } },
  compose(s) {
    const bass = (from, bars) => {
      for (let b = from; b < from + bars; b++) for (let i = 0; i < 8; i++) s.chipbass(b * 4 + i * 0.5, ROOT[b % 4] + (i % 2 ? '3' : '2'), 0.45, 0.9);
    };
    const arp = (from, bars, vel = 0.4) => {
      for (let b = from; b < from + bars; b++) for (let i = 0; i < 16; i++) s.chip(b * 4 + i / 4, ARP[b % 4][[0, 1, 2, 3, 2, 1][i % 6]], 0.2, vel, 0.125);
    };
    const beat = { chipkick: 'X.......X.x.....', chipsnare: '....X.......X...', chiphat: 'x.x.x.x.x.x.x.x.' };
    const fast = { chipkick: 'X...X...X.x.X...', chipsnare: '....X.......X.xx', chiphat: 'xxxxxxxxxxxxxxxx' };

    // intro: アルペジオだけ
    arp(0, 4, 0.7);
    s.drums(2, 2, { chiphat: 'x.x.x.x.x.x.x.x.' });
    // A
    s.drums(4, 16, beat);
    bass(4, 16);
    s.ghost(() => arp(4, 16, 0.3));
    s.seq('chip', 16, 0.5, MEL_A);
    s.seq('chip', 48, 0.5, MEL_A);
    // B: 16分の速いフレーズ
    s.drums(20, 8, fast);
    bass(20, 8);
    for (let r = 0; r < 2; r++) MEL_B.forEach((m, i) => s.seq('chip', (20 + r * 4 + i) * 4, 0.25, m, 0.9));
    // ブリッジ: のばす音
    s.drums(28, 4, { chipkick: 'X...............', chiphat: 'x...x...x...x...' });
    s.ghost(() => arp(28, 4, 0.35));
    s.seq('chip', 112, 0.5, BRIDGE);
    // A' → B'
    s.drums(32, 8, beat);
    bass(32, 8);
    s.seq('chip', 128, 0.5, MEL_A, 1);
    s.ghost(() => arp(32, 8, 0.3));
    s.drums(40, 8, fast);
    bass(40, 8);
    for (let r = 0; r < 2; r++) MEL_B.forEach((m, i) => s.seq('chip', (40 + r * 4 + i) * 4, 0.25, m, 1));
    // ending
    s.chipkick(192); s.chipsnare(192);
    s.chip(192, 'C6', 2, 1, 0.5); s.chip(192, 'E5', 2, 0.6, 0.25); s.chipbass(192, 'C2', 2);
  },
};

// LO-FI HIP HOP / 82 BPM: ゆったりハネるビートとエレピ、ウッドベース(初心者にもやさしい)
const CH = ['F3+A3+C4+E4', 'F3+B3+E4', 'E3+G3+B3+D4', 'G3+C4+E4'];
const ROOT = ['D2', 'G2', 'C2', 'A1'];
const FIFTH = ['A2', 'D2', 'G2', 'E2'];
const MEL_A =
  'A4 - C5 - E5 - D5 C5 | B4 - - - G4 - . . | E5 - - D5 C5 - B4 - | A4 - - - . . . . |' +
  'A4 - C5 - E5 - G5 - | F5 - E5 - D5 - C5 - | B4 - D5 - G5 - - - | E5 - - - . . . . |';
const MEL_B =
  'D5 - - E5 F5 - E5 D5 | D5 - - - B4 - G4 - | G5 - - E5 D5 - C5 - | E5 - - - - - . . |' +
  'D5 - F5 - A5 - G5 F5 | F5 - E5 - D5 - B4 - | C5 - E5 - G5 - B5 - | A5 - - - - - - - |';

export default {
  id: 'rainy-window',
  urlId: 'y2kv05uv9', // 曲ページのURL (music/y2kv05uv9/)。公開後は変えない
  title: 'Rainy Window',
  artist: 'MUSIC LiDAR',
  genre: 'LO-FI HIP HOP',
  bpm: 82,
  color: '#9fb7ff',
  levels: { easy: 1, normal: 3, hard: 5 },
  preview: 16,
  chart: { easy: { maxNps: 1.6 }, normal: { maxNps: 3.0 }, hard: { minGap: 0.14, maxNps: 5 } },
  compose(s) {
    s.setSwing(1 / 6);
    const keys = (from, bars, vel = 0.6) => {
      for (let b = from; b < from + bars; b++) {
        const c = CH[b % 4].split('+');
        c.forEach((n) => { s.keys(b * 4, n, 1.4, vel); s.keys(b * 4 + 2.5, n, 1.2, vel * 0.8); });
      }
    };
    const bass = (from, bars) => {
      for (let b = from; b < from + bars; b++) {
        s.upright(b * 4, ROOT[b % 4], 1.4, 1);
        s.upright(b * 4 + 1.5, FIFTH[b % 4], 0.8, 0.7);
        s.upright(b * 4 + 2.5, ROOT[b % 4], 1.2, 0.85);
      }
    };
    const beat = { kick: 'X.......x.X.....', snare: '....X.......X...', hat: 'x.g.x.g.x.g.x.gx' };
    const beat2 = { kick: 'X.......x.X...x.', snare: '....X.......X..g', hat: 'x.gxx.g.x.gxx.go' };

    // intro: エレピだけ
    s.ghost(() => keys(0, 4, 0.55));
    s.keys(0, 'E5', 2, 0.8); s.keys(4, 'D5', 2, 0.7); s.keys(8, 'B4', 2, 0.7); s.keys(12, 'C5', 3, 0.7);
    // A
    s.drums(4, 8, beat); keys(4, 8); bass(4, 8);
    s.seq('bell', 16, 0.5, MEL_A, 0.85);
    // B
    s.drums(12, 8, beat2); s.ghost(() => keys(12, 8, 0.5)); bass(12, 8);
    s.seq('keys', 48, 0.5, MEL_B, 0.95);
    // break: ドラムなし
    keys(20, 4, 0.7);
    s.seq('bell', 80, 1, 'A5 - E5 - | F5 - D5 - | G5 - B4 - | C5 - - - |', 0.7);
    s.drums(23, 1, { kick: 'x.......x.x.....', snare: '............X.X.' });
    // A'
    s.drums(24, 8, beat2); s.ghost(() => keys(24, 8, 0.5)); bass(24, 8);
    s.seq('keys', 96, 0.5, MEL_A, 1);
    s.ghost(() => s.seq('bell', 96, 0.5, MEL_A, 0.3));
    // outro
    s.drums(32, 3, beat); keys(32, 3, 0.5); bass(32, 3);
    s.seq('bell', 128, 0.5, 'A4 - C5 - E5 - D5 C5 | B4 - - - G4 - . . | E5 - - - - - - - |', 0.7);
    ['F3', 'A3', 'C4', 'E4', 'G4'].forEach((n) => s.keys(140, n, 4, 0.7));
    s.upright(140, 'D2', 3); s.kick(140, 0.6);
  },
};

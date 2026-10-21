// JAZZ BALLAD / 120 BPM: 夜のジャズ喫茶。ブラシのドラムとウォーキングベース、エレピのメロディ
import { pattern } from './kit.js';

const PROG = ['F3+A3+C4+E4', 'F3+B3+D4+E4', 'E3+G3+B3+D4', 'C#4+E4+G4+Bb3'];
const WALK = [['D2', 'E2', 'F2', 'A2'], ['G2', 'F2', 'E2', 'D2'], ['C2', 'E2', 'G2', 'B1'], ['A1', 'C#2', 'E2', 'G2']];
const HEAD =
  'A5 - - G5 F5 - E5 - | D5 - - - B4 - G4 - | E5 - D5 - C5 - B4 - | C#5 - E5 - G5 - - - |' +
  'F5 - - E5 D5 - A5 - | G5 - - - F5 - D5 - | E5 - G5 - B5 - - A5 | A5 - - - - - . . |';

export default {
  id: 'jazz-cafe',
  urlId: '60rihlt50', // 曲ページのURL (music/60rihlt50/)。公開後は変えない
  title: 'Midnight Jazz Cafe',
  artist: 'MUSIC LiDAR',
  genre: 'JAZZ',
  bpm: 120,
  color: '#d4a373',
  levels: { easy: 2, normal: 4, hard: 7 },
  preview: 48,
  chart: { easy: { maxNps: 1.7 }, hard: { minGap: 0.13, maxNps: 5.5 } },
  compose(s) {
    s.setSwing(1 / 6);
    const comp = (from, bars, vel = 0.45) => pattern(s, 'keys', from, bars, 'x.....x...x.....', (b) => PROG[b % 4], { vel, len: 0.6 });
    const walk = (from, bars) => { for (let b = from; b < from + bars; b++) WALK[b % 4].forEach((n, i) => s.upright(b * 4 + i, n, 0.9, i === 0 ? 1 : 0.8)); };
    const brush = { ride: 'x...x.x.x...x.x.', snare: 'g.g.g.g.g.g.g.g.', kick: 'g.......g.......' };
    comp(0, 4, 0.6); s.seq('keys', 0, 0.5, 'A5 - G5 - F5 - E5 - | D5 - - - . . . . | E5 - D5 - C5 - B4 - | C#5 - - - . . . . |', 0.8);
    s.drums(4, 16, brush); comp(4, 16); walk(4, 16);
    s.seq('keys', 16, 0.5, HEAD, 0.95); s.seq('keys', 48, 0.5, HEAD, 0.95);
    s.drums(20, 8, { ...brush, snare: 'g..g.g..g..g.g.g' }); s.ghost(() => comp(20, 8, 0.35)); walk(20, 8);
    for (let b = 20; b < 28; b++) {
      const c = PROG[b % 4].split('+');
      [0, 0.5, 1.5, 2, 3, 3.5].forEach((o, i) => s.bell(b * 4 + o, c[(i + b) % c.length].replace(/\d/, (d) => +d + 2), 0.4, 0.8));
    }
    s.drums(28, 8, brush); comp(28, 8); walk(28, 8);
    s.seq('lead', 112, 0.5, HEAD, 0.9);
    s.ride(144); ['F3', 'A3', 'C4', 'E4', 'G4'].forEach((n) => s.keys(144, n, 4, 0.7)); s.upright(144, 'D2', 3); s.keys(144, 'A5', 3);
  },
};

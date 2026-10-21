// MARCH / 116 BPM: ブラスバンドの行進曲。小太鼓のマーチと元気なメロディ(初心者向け)
import { pattern, bassLine } from './kit.js';

const PROG = ['C4+E4+G4', 'C4+E4+G4', 'F4+A4+C5', 'G4+B4+D5', 'C4+E4+G4', 'A4+C5+E5', 'D4+F4+A4', 'G4+B4+D5'];
const ROOT = ['C2', 'C2', 'F1', 'G1', 'C2', 'A1', 'D2', 'G1'];
const MEL =
  'G5 - - E5 C5 - E5 - | G5 - - - C6 - - - | A5 - - G5 F5 - A5 - | G5 - - - - - . . |' +
  'E5 - - F5 G5 - E5 - | A5 - - - C6 - - - | B5 - A5 - G5 - F5 - | G5 - - - - - . . |';
const TRIO =
  'C6 - B5 - A5 - G5 - | E5 - - - G5 - - - | F5 - A5 - C6 - A5 - | G5 - - - - - . . |' +
  'E5 - G5 - C6 - E6 - | D6 - - - C6 - A5 - | B5 - D6 - G5 - B5 - | C6 - - - - - . . |';

export default {
  id: 'sunny-parade',
  urlId: 'irb5hdpdj', // 曲ページのURL (music/irb5hdpdj/)。公開後は変えない
  title: 'Sunny Parade',
  artist: 'MUSIC LiDAR',
  genre: 'MARCH',
  bpm: 116,
  color: '#ffd84a',
  levels: { easy: 1, normal: 3, hard: 6 },
  preview: 16,
  chart: { easy: { maxNps: 1.6 }, hard: { minGap: 0.13, maxNps: 5 } },
  compose(s) {
    const oompah = (from, bars, vel = 0.5) => pattern(s, 'stab', from, bars, '....x.......x...', (b) => PROG[b % 8], { vel, len: 0.4 });
    const tuba = (from, bars) => bassLine(s, from, bars, ROOT, 'X.......f.......', { len: 0.8 });
    const march = { kick: 'X.......X.......', snare: '..g.x.g.g.g.x.gg', crash: '................' };
    s.drums(0, 2, { snare: 'x.x.x.xxx.x.x.xx' }); s.drums(2, 2, march); oompah(2, 2); tuba(2, 2);
    s.crash(16);
    s.drums(4, 16, march); oompah(4, 16); tuba(4, 16);
    s.seq('lead', 16, 0.5, MEL, 0.95); s.seq('square', 48, 0.5, MEL, 0.95);
    s.crash(80);
    s.drums(20, 8, { ...march, snare: 'x.g.x.g.x.g.x.g.' }); oompah(20, 8, 0.55); tuba(20, 8);
    s.seq('bell', 80, 0.5, TRIO, 0.9);
    s.crash(112);
    s.drums(28, 8, march); oompah(28, 8); tuba(28, 8);
    s.seq('lead', 112, 0.5, MEL, 1); s.ghost(() => s.seq('bell', 112, 0.5, MEL, 0.3));
    s.crash(144); s.kick(144); s.stab(144, ['C4', 'E4', 'G4', 'C5'], 2, 1); s.bass(144, 'C2', 2);
  },
};

// SALSA / 180 BPM: ピアノのモントゥーノ(くり返しのリフ)、クラーベのリズム、ホーンの合いの手
import { pattern, bassLine } from './kit.js';

const PROG = ['A3+C4+E4', 'D4+F4+A4', 'E4+G#4+B4', 'A3+C4+E4'];
const ROOT = ['A1', 'D2', 'E2', 'A1'];
const MONTUNO = ['A4 E5 C5 E5 A4 E5 C5 E5', 'D5 A5 F5 A5 D5 A5 F5 A5', 'E5 B5 G#5 B5 E5 B5 G#5 B5', 'A4 C5 E5 A5 G5 E5 C5 A4'];
const HORN =
  'E5 - - E5 . A5 - . | F5 - - A5 . D6 - . | B5 - - G#5 . E5 - . | A5 - - - . . . . |' +
  'C6 - B5 - A5 - E5 - | D6 - C6 - A5 - F5 - | E5 - G#5 - B5 - D6 - | C6 - - - A5 - - - |';

export default {
  id: 'salsa-fuego',
  urlId: 'lecdzr59r', // 曲ページのURL (music/lecdzr59r/)。公開後は変えない
  title: 'Salsa Fuego',
  artist: 'MUSIC LiDAR',
  genre: 'SALSA',
  bpm: 180,
  color: '#ff6a3d',
  levels: { easy: 2, normal: 6, hard: 10 },
  preview: 64,
  chart: { normal: { minGap: 0.17 }, hard: { minGap: 0.09, maxNps: 9 } },
  compose(s) {
    const montuno = (from, bars, vel = 0.6) => { for (let b = from; b < from + bars; b++) s.seq('keys', b * 4, 0.5, MONTUNO[b % 4], vel); };
    const tumbao = (from, bars) => bassLine(s, from, bars, ROOT, '......X.....X...', { len: 0.8 });
    const clave = { snare: 'x..x...x..x.x...', hat: 'x.x.x.x.x.x.x.x.', kick: '...x.......x....' };
    montuno(0, 4, 0.7); s.drums(2, 2, clave);
    s.crash(16);
    s.drums(4, 16, clave); s.ghost(() => montuno(4, 16, 0.4)); tumbao(4, 16);
    s.seq('stab', 16, 0.5, HORN, 0.9); s.seq('lead', 48, 0.5, HORN, 0.9);
    s.drums(20, 4, { snare: 'x..x...x..x.x...', kick: 'X...X...X...X...' }); montuno(20, 4, 0.8); tumbao(20, 4);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, { ...clave, ride: 'x.x.x.x.x.x.x.x.' }); montuno(24, 16, 0.4); tumbao(24, 16);
    pattern(s, 'stab', 24, 16, 'X.....x.....x...', (b) => ['A4+C5+E5', 'A4+D5+F5', 'G#4+B4+E5', 'A4+C5+E5'][b % 4], { vel: 0.4, len: 0.3 });
    s.seq('lead', 96, 0.5, HORN, 1); s.seq('square', 128, 0.5, HORN, 1);
    // もう一周(モントゥーノを前に)
    s.crash(160);
    s.drums(40, 16, clave); montuno(40, 16, 0.65); tumbao(40, 16);
    s.seq('stab', 160, 0.5, HORN, 0.9); s.ghost(() => s.seq('lead', 192, 0.5, HORN, 0.4));
    s.crash(224); s.kick(224); s.stab(224, ['A4', 'C5', 'E5', 'A5'], 2, 1); s.bass(224, 'A1', 2);
  },
};

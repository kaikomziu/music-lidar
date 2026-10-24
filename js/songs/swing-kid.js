// BIG BAND / 168 BPM: ハネるリズムに、ブラスの合いの手。ジャズのビッグバンド
import { pattern, bassLine, arp, build } from './kit.js';

const PROG = ['C4+E4+G4+A4', 'A3+C4+E4+G4', 'D4+F4+A4+C5', 'G3+B3+D4+F4'];
const ROOT = ['C2', 'A1', 'D2', 'G1'];
const MEL =
  'E5 - G5 - A5 - C6 - | B5 - A5 - G5 - E5 - | F5 - A5 - C6 - D6 - | B5 - - - G5 - . . |' +
  'E5 - G5 - A5 - C6 - | E6 - D6 - C6 - A5 - | D6 - C6 - A5 - F5 - | C6 - - - - - . . |';
const SHOUT =
  'C6 C6 . A5 C6 . D6 . | E6 - - - D6 C6 A5 . | D6 D6 . C6 A5 . F5 . | G5 - A5 - B5 - D6 - |' +
  'E6 E6 . D6 C6 . A5 . | C6 - - - E6 - G6 - | F6 - E6 - D6 - C6 - | C6 - - - - - . . |';

export default {
  id: 'swing-kid',
  urlId: 'uvvgitmzz', // 曲ページのURL (music/uvvgitmzz/)。公開後は変えない
  title: 'Swing Kid',
  artist: 'MUSIC LiDAR',
  genre: 'BIG BAND',
  bpm: 168,
  color: '#ff8a3d',
  levels: { easy: 3, normal: 6, hard: 8 },
  preview: 112,
  chart: { normal: { minGap: 0.17 }, hard: { minGap: 0.1, maxNps: 8 } },
  compose(s) {
    s.setSwing(1 / 6);
    const brass = (from, bars, vel = 0.55) => pattern(s, 'stab', from, bars, '....X.....x.X...', (b) => PROG[b % 4], { vel, len: 0.4 });
    const swing = { kick: 'X.......X.......', snare: '....g.......X...', ride: 'x...x.x.x...x.x.' };
    brass(0, 4, 0.7); s.drums(0, 4, swing); bassLine(s, 0, 4, ROOT, 'X...f...o...f...', { type: 'upright' });
    s.drums(4, 16, swing); brass(4, 16, 0.4); bassLine(s, 4, 16, ROOT, 'X...f...o...f...', { type: 'upright' });
    s.seq('lead', 16, 0.5, MEL, 0.9); s.seq('keys', 48, 0.5, MEL, 0.9);
    s.drums(20, 8, { ...swing, snare: '..g.....g...X...' }); bassLine(s, 20, 8, ROOT, 'X...f...o...f...', { type: 'upright' });
    arp(s, 'clav', 20, 8, PROG, { step: 0.5, vel: 0.75, order: [0, 1, 2, 3, 4, 3, 2, 1] }); build(s, 26);
    s.crash(112); s.crash(144, 0.8);
    s.drums(28, 16, { ...swing, snare: '....x.......X..x', hat: '....x.......x...' }); brass(28, 16, 0.5); bassLine(s, 28, 16, ROOT, 'X...f...o...f...', { type: 'upright' });
    s.seq('supersaw', 112, 0.5, SHOUT, 0.95); s.seq('lead', 144, 0.5, SHOUT, 1);
    s.drums(44, 8, swing); brass(44, 8, 0.45); bassLine(s, 44, 8, ROOT, 'X...f...o...f...', { type: 'upright' }); s.seq('keys', 176, 0.5, MEL, 1);
    s.crash(208); s.kick(208); s.stab(208, ['C4', 'E4', 'G4', 'A4'], 3, 1); s.upright(208, 'C2', 3);
  },
};

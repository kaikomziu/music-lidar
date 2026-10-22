// LO-FI / 78 BPM: 夜の図書館。ゆっくりハネるビートとエレピ(やさしめ)
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['A3+C4+E4+G4', 'D4+F4+A4+C5', 'G3+B3+D4+F4', 'C4+E4+G4+B4'];
const ROOT = ['A1', 'D2', 'G1', 'C2'];
const MEL =
  'E5 - - - G5 - A5 - | F5 - - - D5 - - - | D5 - F5 - G5 - B5 - | B5 - - - G5 - - - |' +
  'E5 - G5 - C6 - B5 - | A5 - - - F5 - D5 - | G5 - - - F5 - D5 - | E5 - - - - - . . |';

export default {
id: 'lofi-library',
  urlId: 'g1si4vv0a', // 曲ページのURL (music/g1si4vv0a/)。公開後は変えない
  title: 'Lofi Library',
  artist: 'MUSIC LiDAR',
  genre: 'LO-FI HIP HOP',
  bpm: 78,
  color: '#a0b8ff',
  levels: { easy: 1, normal: 2, hard: 3 },
  preview: 16,
  chart: { easy: { maxNps: 1.4 }, normal: { maxNps: 2.6 }, hard: { minGap: 0.14, maxNps: 4.5 } },
  compose(s) {

    s.setSwing(1 / 6);
    const keys = (from, bars, vel = 0.45) => pattern(s, 'keys', from, bars, 'x.......x..x....', (b) => PROG[b % 4], { vel, len: 1.2 });
    const beat = { kick: 'X.......x.X.....', snare: '....X.......X...', hat: 'x.g.x.g.x.g.x.gx' };
    keys(0, 4, 0.55);
    s.drums(4, 16, beat); keys(4, 16); bassLine(s, 4, 16, ROOT, 'X.......x.X.....', { type: 'upright' });
    s.seq('bell', 16, 0.5, MEL, 0.9); s.seq('keys', 48, 0.5, MEL, 0.95);
    keys(20, 4, 0.6); s.seq('bell', 80, 1, 'E5 - - - | F5 - - - | D5 - - - | B4 - - - |', 0.7);
    s.drums(24, 8, beat); s.ghost(() => keys(24, 8, 0.35)); bassLine(s, 24, 8, ROOT, 'X.......x.X.....', { type: 'upright' });
    s.seq('lead', 96, 0.5, MEL, 0.9);
    ['A3', 'C4', 'E4', 'G4', 'B4'].forEach((n) => s.keys(128, n, 4, 0.7)); s.upright(128, 'A1', 3); s.kick(128, 0.6);
  },
};

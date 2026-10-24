// BALLAD / 80 BPM: ホタルの光る夜道を歩くような、ピアノのやさしいバラード(初心者向け)
import { sustain, bassLine, arp } from './kit.js';

const PROG = ['C4+E4+G4', 'A3+C4+E4', 'F3+A3+C4', 'G3+B3+D4'];
const ROOT = ['C2', 'A1', 'F1', 'G1'];
const MEL =
  'E5 - - D5 C5 - D5 E5 | A4 - - - . . C5 D5 | F5 - - E5 D5 - C5 D5 | B4 - - - . . . . |' +
  'E5 - - G5 A5 - G5 E5 | A5 - - G5 E5 - C5 D5 | F5 - E5 - D5 - B4 - | C5 - - - - - . . |';

export default {
  id: 'firefly-path',
  urlId: 'tg7am3zu6', // 曲ページのURL (music/tg7am3zu6/)。公開後は変えない
  title: 'Firefly Path',
  artist: 'MUSIC LiDAR',
  genre: 'BALLAD',
  bpm: 80,
  color: '#c6ff7a',
  levels: { easy: 1, normal: 2, hard: 3 },
  preview: 48,
  chart: { easy: { maxNps: 1.2 }, hard: { minGap: 0.16, maxNps: 4 } },
  compose(s) {
    const piano = (from, bars, vel = 0.35) => s.ghost(() => arp(s, 'keys', from, bars, PROG, { step: 0.5, vel, order: [0, 1, 2, 1, 3, 1, 2, 1] }));
    const soft = { kick: 'X.......X.......', snare: '........x.......', hat: '..x...x...x...x.' };
    arp(s, 'keys', 0, 4, PROG, { step: 1, vel: 0.55, order: [0, 1, 2, 1] });
    piano(4, 16); bassLine(s, 4, 16, ROOT, 'X.......X.......', { type: 'upright', vel: 0.8 });
    s.seq('keys', 16, 0.5, MEL, 0.9);
    s.drums(12, 8, soft); sustain(s, 'pad', 12, 8, PROG, 0.45); s.seq('bell', 48, 0.5, MEL, 0.8);
    sustain(s, 'pad', 20, 4, PROG, 0.6); s.seq('bell', 80, 1, 'G5 - - - | E5 - - - | A5 - G5 - | D5 - - - |', 0.7);
    s.crash(96, 0.6);
    s.drums(24, 8, soft); piano(24, 8, 0.4); bassLine(s, 24, 8, ROOT, 'X.......X...f...', { type: 'upright', vel: 0.85 });
    s.seq('lead', 96, 0.5, MEL, 0.9);
    s.kick(128); s.keys(128, 'C4', 4); s.keys(128, 'E4', 4); s.keys(128, 'G4', 4); s.keys(128, 'C5', 4); s.upright(128, 'C2', 4);
  },
};

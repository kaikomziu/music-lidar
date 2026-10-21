// JUNGLE / 165 BPM: 細かく切り刻んだブレイクビーツと、深いサブベース、ふわっとしたパッド
import { sustain, bassLine, arp } from './kit.js';

const PROG = ['E4+G4+B4+D5', 'C4+E4+G4+B4', 'A3+C4+E4+G4', 'B3+D4+F#4+A4'];
const ROOT = ['E1', 'C2', 'A1', 'B1'];
const BREAKS = [
  { kick: 'X.X.......X.....', snare: '....X..X.X..X..x', hat: 'g.g.g.g.g.g.g.g.' },
  { kick: 'X.........X.X...', snare: '....X.g.....X.x.', hat: 'g.ggg.g.g.ggg.g.' },
  { kick: 'X.X.....X.X.....', snare: '....X..X....X.XX', hat: 'g.g.g.g.g.g.g.g.' },
];
const MEL =
  'B5 - - - - - G5 - | E6 - - - D6 - B5 - | A5 - - - - - G5 - | F#5 - - - - - - - |' +
  'B5 - - - D6 - E6 - | G6 - - - E6 - D6 - | C6 - - - B5 - A5 - | B5 - - - - - - - |';

export default {
  id: 'jungle-lights',
  urlId: 'q8gsugeob', // 曲ページのURL (music/q8gsugeob/)。公開後は変えない
  title: 'Jungle Lights',
  artist: 'MUSIC LiDAR',
  genre: 'JUNGLE',
  bpm: 165,
  color: '#c8ff6d',
  levels: { easy: 4, normal: 7, hard: 11 },
  preview: 64,
  chart: { normal: { minGap: 0.16 }, hard: { minGap: 0.085, maxNps: 9.5, minScore: 0.8 } },
  compose(s) {
    const breaks = (from, bars) => { for (let b = from; b < from + bars; b++) s.drums(b, 1, BREAKS[(b % 4 === 3) ? 2 : b % 2]); };
    sustain(s, 'pad', 0, 8, PROG, 0.6);
    s.seq('bell', 16, 1, 'B5 - - - | G5 - - - | E5 - - - | F#5 - - - |', 0.6);
    s.crash(32);
    breaks(8, 16); bassLine(s, 8, 16, ROOT, 'X.......X.......', { len: 1.6 }); sustain(s, 'pad', 8, 16, PROG, 0.35);
    s.seq('lead', 32, 0.5, MEL, 0.9); s.seq('bell', 64, 0.5, MEL, 0.95);
    sustain(s, 'pad', 24, 4, PROG, 0.7); arp(s, 'pluck', 24, 4, PROG, { step: 0.25, vel: 0.55, order: [0, 1, 2, 3] });
    s.drums(27, 1, { snare: 'x.x.x.x.xxxxxxxx' });
    s.crash(112); s.crash(144, 0.8);
    breaks(28, 16); bassLine(s, 28, 16, ROOT, 'X.......X..X....', { len: 1.2 }); arp(s, 'pluck', 28, 16, PROG, { step: 0.25, vel: 0.4, order: [0, 2, 1, 3] });
    s.seq('supersaw', 112, 0.5, MEL, 0.9); s.seq('lead', 144, 0.5, MEL, 1);
    sustain(s, 'pad', 44, 4, PROG, 0.6); s.drums(44, 2, BREAKS[0]);
    s.bass(184, 'E1', 3); s.bell(184, 'B5', 3);
  },
};

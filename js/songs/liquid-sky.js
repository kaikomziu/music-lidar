// LIQUID FUNK / 172 BPM: なめらかなドラムンベース。エレピの和音とやわらかいベース、きれいなメロディ
import { pattern, sustain, bassLine, arp } from './kit.js';

const PROG = ['D4+F#4+A4+C#5', 'B3+D4+F#4+A4', 'G3+B3+D4+F#4', 'A3+C#4+E4+G4'];
const ROOT = ['D2', 'B1', 'G1', 'A1'];
const MEL =
  'F#5 - - - A5 - - - | C#6 - - - B5 - A5 - | B5 - - - D6 - - - | E6 - - - C#6 - - - |' +
  'F#6 - - - E6 - D6 - | C#6 - - - A5 - F#5 - | G5 - A5 - B5 - D6 - | C#6 - - - - - - - |';

export default {
  id: 'liquid-sky',
  urlId: 'qliqvo8mp', // 曲ページのURL (music/qliqvo8mp/)。公開後は変えない
  title: 'Liquid Sky',
  artist: 'MUSIC LiDAR',
  genre: 'LIQUID FUNK',
  bpm: 172,
  color: '#6ff0ff',
  levels: { easy: 3, normal: 7, hard: 10 },
  preview: 96,
  chart: { normal: { minGap: 0.16 }, hard: { minGap: 0.09, maxNps: 8.5 } },
  compose(s) {
    const rhodes = (from, bars, vel = 0.4) => pattern(s, 'keys', from, bars, 'x.....x...x.....', (b) => PROG[b % 4], { vel, len: 0.8 });
    const dnb = { kick: 'X.........X.....', snare: '....X.......X...', hat: 'x.xgx.xgx.xgx.xg', ride: '..x...x...x...x.' };
    sustain(s, 'pad', 0, 8, PROG, 0.6); s.ghost(() => arp(s, 'bell', 4, 4, PROG, { step: 0.5, vel: 0.4, oct: 1 }));
    s.crash(32);
    s.drums(8, 16, dnb); rhodes(8, 16); bassLine(s, 8, 16, ROOT, 'X.........X.....', { len: 1.4 });
    s.seq('lead', 32, 0.5, MEL, 0.95); s.seq('bell', 64, 0.5, MEL, 0.95);
    sustain(s, 'pad', 24, 4, PROG, 0.7); arp(s, 'pluck', 24, 4, PROG, { step: 0.25, vel: 0.55, order: [0, 1, 2, 3, 2, 1] });
    s.drums(27, 1, { snare: 'x.x.x.x.xxxxxxxx' });
    s.crash(112); s.crash(144, 0.8);
    s.drums(28, 16, { ...dnb, snare: '....X..g....X..g' }); rhodes(28, 16, 0.35); bassLine(s, 28, 16, ROOT, 'X.........X..X..', { len: 1 });
    s.seq('supersaw', 112, 0.5, MEL, 0.9); s.seq('lead', 144, 0.5, MEL, 1);
    s.ghost(() => arp(s, 'pluck', 28, 16, PROG, { step: 0.25, vel: 0.3, order: [0, 2, 1, 3] }));
    sustain(s, 'pad', 44, 2, PROG, 0.6); s.bell(176, 'C#6', 3); s.bass(176, 'D2', 3);
  },
};

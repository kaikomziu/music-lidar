// R&B / 92 BPM: しっとりしたエレピと、ためのあるビート、なめらかなメロディ
import { pattern, sustain, bassLine } from './kit.js';

const PROG = ['D4+F#4+A4+C#5', 'B3+D4+F#4+A4', 'E4+G4+B4+D5', 'A3+C#4+E4+G4'];
const ROOT = ['D2', 'B1', 'E2', 'A1'];
const MEL =
  'F#5 - - E5 D5 - C#5 - | B4 - - - D5 - F#5 - | E5 - - D5 B4 - G4 - | A4 - - - . . . . |' +
  'F#5 - A5 - C#6 - B5 A5 | F#5 - - - D5 - E5 - | G5 - F#5 - E5 - D5 - | C#5 - - - - - . . |';

export default {
  id: 'velvet-rnb',
  urlId: 'jhl9jej8a', // 曲ページのURL (music/jhl9jej8a/)。公開後は変えない
  title: 'Velvet Night',
  artist: 'MUSIC LiDAR',
  genre: 'R&B',
  bpm: 92,
  color: '#c38bff',
  levels: { easy: 2, normal: 3, hard: 5 },
  preview: 48,
  chart: { hard: { minGap: 0.12, maxNps: 5.5 } },
  compose(s) {
    s.setSwing(1 / 12);
    const rhodes = (from, bars, vel = 0.4) => pattern(s, 'keys', from, bars, 'x.....x...x.....', (b) => PROG[b % 4], { vel, len: 0.8 });
    const beat = { kick: 'X......x..X.....', snare: '....X.......X...', hat: 'x.x.x.x.x.xxx.x.' };
    rhodes(0, 4, 0.55);
    s.drums(4, 8, beat); rhodes(4, 8); bassLine(s, 4, 8, ROOT, 'X......x..X.....', { len: 0.6 });
    s.seq('lead', 16, 0.5, MEL, 0.9);
    s.drums(12, 8, { ...beat, snare: '....X..g....X...' }); s.ghost(() => rhodes(12, 8, 0.35)); bassLine(s, 12, 8, ROOT, 'X......x..X..x..', { len: 0.5 });
    s.seq('keys', 48, 0.5, MEL, 0.95); sustain(s, 'pad', 12, 8, PROG, 0.3);
    sustain(s, 'pad', 20, 4, PROG, 0.6); s.seq('bell', 80, 1, 'F#5 - - - | D5 - - - | G5 - - - | E5 - - - |', 0.8);
    s.crash(96, 0.6);
    s.drums(24, 8, beat); s.ghost(() => rhodes(24, 8, 0.35)); bassLine(s, 24, 8, ROOT, 'X......x..X..x..', { len: 0.5 });
    s.seq('lead', 96, 0.5, MEL, 1); s.ghost(() => s.seq('bell', 96, 0.5, MEL, 0.3));
    s.kick(128); ['D4', 'F#4', 'A4', 'C#5', 'E5'].forEach((n) => s.keys(128, n, 4, 0.7)); s.bass(128, 'D2', 3);
  },
};

// NEO SOUL / 88 BPM: ゆるくずれたビートと、9thの和音。夜のラウンジ
import { pattern, sustain, bassLine } from './kit.js';

const PROG = ['Eb4+G4+Bb4+D5', 'C4+Eb4+G4+Bb4', 'F4+Ab4+C5+Eb5', 'Bb3+D4+F4+Ab4'];
const ROOT = ['Eb2', 'C2', 'F1', 'Bb1'];
const MEL =
  'Bb5 - - G5 - Eb5 - - | G5 - F5 - Eb5 - C5 - | C6 - - Ab5 - F5 - - | Ab5 - G5 - F5 - - - |' +
  'Bb5 - D6 - - Bb5 G5 - | Eb6 - D6 - C6 - Bb5 - | Ab5 - C6 - Eb6 - D6 - | Bb5 - - - - - . . |';

export default {
  id: 'velvet-lounge',
  urlId: 'pupws93fy', // 曲ページのURL (music/pupws93fy/)。公開後は変えない
  title: 'Velvet Lounge',
  artist: 'MUSIC LiDAR',
  genre: 'NEO SOUL',
  bpm: 88,
  color: '#c38bff',
  levels: { easy: 2, normal: 4, hard: 5 },
  preview: 48,
  chart: { hard: { minGap: 0.12, maxNps: 5.5, minScore: 0.8 } },
  compose(s) {
    s.setSwing(1 / 7);
    const rhodes = (from, bars, vel = 0.4) => pattern(s, 'keys', from, bars, 'x.....x..x....x.', (b) => PROG[b % 4], { vel, len: 0.6 });
    const lazy = { kick: 'X......x..X...x.', snare: '....X.......X..g', hat: 'x.xxx.x.x.xxx.x.' };
    rhodes(0, 4, 0.5); sustain(s, 'pad', 0, 4, PROG, 0.3);
    s.drums(4, 16, lazy); rhodes(4, 16); bassLine(s, 4, 16, ROOT, 'X......x..X...x.', { len: 0.5 });
    s.seq('lead', 16, 0.5, MEL, 0.9); s.seq('keys', 48, 0.5, MEL, 0.95);
    sustain(s, 'pad', 20, 4, PROG, 0.6); s.seq('bell', 80, 1, 'G5 - - - | Eb5 - - - | C6 - - - | D6 - - - |', 0.8);
    s.drums(24, 8, lazy); s.ghost(() => rhodes(24, 8, 0.35)); bassLine(s, 24, 8, ROOT, 'X......x..X...x.', { len: 0.5 });
    s.seq('lead', 96, 0.5, MEL, 1); s.ghost(() => s.seq('bell', 96, 0.5, MEL, 0.3));
    s.kick(128); ['Eb4', 'G4', 'Bb4', 'D5', 'F5'].forEach((n) => s.keys(128, n, 4, 0.7)); s.bass(128, 'Eb2', 3);
  },
};

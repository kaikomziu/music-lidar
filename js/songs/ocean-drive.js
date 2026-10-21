// NU DISCO / 120 BPM: 海沿いの夜のドライブ。うねるベースと裏打ちのハット
import { pattern, sustain, bassLine } from './kit.js';

const PROG = ['F#4+A4+C#5+E5', 'D4+F#4+A4+C#5', 'B3+D4+F#4+A4', 'C#4+E#4+G#4'];
const ROOT = ['F#1', 'D2', 'B1', 'C#2'];
const MEL =
  'C#6 - - A5 - - F#5 - | E5 - F#5 - A5 - - - | D6 - - C#6 - - A5 - | G#5 - - - E#5 - - - |' +
  'C#6 - E6 - C#6 - A5 - | F#5 - A5 - C#6 - E6 - | D6 - C#6 - B5 - A5 - | G#5 - - - - - . . |';

export default {
  id: 'ocean-drive',
  urlId: 'x7ldc6z6x', // 曲ページのURL (music/x7ldc6z6x/)。公開後は変えない
  title: 'Ocean Drive',
  artist: 'MUSIC LiDAR',
  genre: 'NU DISCO',
  bpm: 120,
  color: '#3dd6ff',
  levels: { easy: 2, normal: 5, hard: 8 },
  preview: 64,
  sidechain: true,
  chart: { hard: { minGap: 0.105, maxNps: 7.5 } },
  compose(s) {
    const disco = { kick: 'X...X...X...X...', hat: '..o...o...o...o.', clap: '....x.......x...' };
    const bass = (from, bars) => bassLine(s, from, bars, ROOT, 'X.o.X.o.X.o.X.o.', { type: 'slap' });
    const chords = (from, bars, vel = 0.4) => pattern(s, 'keys', from, bars, '..x...x...x...x.', (b) => PROG[b % 4], { vel, len: 0.3 });
    s.drums(0, 4, { kick: 'X...X...X...X...', hat: '..o...o...o...o.' }); bass(2, 2);
    s.drums(4, 8, disco); bass(4, 8); chords(4, 8);
    s.seq('lead', 16, 0.5, MEL, 0.9);
    s.crash(48);
    s.drums(12, 8, { ...disco, hat: 'x.o.x.o.x.o.x.o.' }); bass(12, 8); s.ghost(() => chords(12, 8, 0.35)); sustain(s, 'pad', 12, 8, PROG, 0.35);
    s.seq('keys', 48, 0.5, MEL, 0.95);
    s.drums(20, 4, { clap: '....x.......x...' }); bass(20, 4);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, { ...disco, hat: 'x.o.x.o.x.o.x.o.' }); bass(24, 16); chords(24, 16, 0.35);
    s.seq('lead', 96, 0.5, MEL, 1); s.seq('square', 128, 0.5, MEL, 1);
    s.crash(160); s.kick(160); s.slap(160, 'F#2', 1); s.stab(160, ['F#4', 'A4', 'C#5', 'E5'], 2, 1);
  },
};

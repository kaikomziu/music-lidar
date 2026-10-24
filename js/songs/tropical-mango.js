// TROPICAL HOUSE / 108 BPM: マリンバ風のメロディと、ゆるい4つ打ち。夏のビーチ
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['A4+C#5+E5', 'F#4+A4+C#5', 'D4+F#4+A4', 'E4+G#4+B4'];
const ROOT = ['A1', 'F#1', 'D2', 'E2'];
const MEL =
  'E5 . C#5 . E5 . F#5 E5 | . . C#5 . A4 . B4 C#5 | D5 . F#5 . A5 . F#5 E5 | . . B4 . G#4 . B4 . |' +
  'E5 . C#5 . E5 . A5 G#5 | . . F#5 . C#5 . E5 F#5 | D5 . F#5 . A5 . B5 A5 | G#5 - - - E5 - . . |';

export default {
  id: 'tropical-mango',
  urlId: '53zsdj4fc', // 曲ページのURL (music/53zsdj4fc/)。公開後は変えない
  title: 'Tropical Mango',
  artist: 'MUSIC LiDAR',
  genre: 'TROPICAL HOUSE',
  bpm: 108,
  color: '#ffb347',
  levels: { easy: 2, normal: 4, hard: 6 },
  preview: 64,
  sidechain: true,
  chart: { hard: { minGap: 0.12, maxNps: 6 } },
  compose(s) {
    const four = { kick: 'X...X...X...X...', clap: '....x.......x...', hat: '..x...x...x...x.' };
    sustain(s, 'pad', 0, 4, PROG, 0.55); s.seq('pluck', 0, 0.5, MEL.split('|').slice(0, 4).join('|'), 0.6);
    s.drums(4, 16, four); bassLine(s, 4, 16, ROOT, 'X..x..x.X..x..x.');
    s.ghost(() => sustain(s, 'pad', 4, 16, PROG, 0.35));
    s.seq('pluck', 16, 0.5, MEL, 0.9); s.seq('bell', 48, 0.5, MEL, 0.85);
    sustain(s, 'pad', 20, 4, PROG, 0.65); s.downer(80, 4); build(s, 22);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, { ...four, hat: 'x.x.x.x.x.x.x.x.' }); bassLine(s, 24, 16, ROOT, 'X..x..x.X..x.ox.');
    s.ghost(() => arp(s, 'pluck', 24, 16, PROG, { step: 0.25, vel: 0.3, order: [0, 1, 2, 3] }));
    s.seq('lead', 96, 0.5, MEL, 0.95); s.seq('pluck', 128, 0.5, MEL, 1);
    s.crash(160); s.kick(160); s.pad(160, ['A4', 'C#5', 'E5'], 3, 0.8); s.bass(160, 'A1', 2);
  },
};

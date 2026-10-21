// DEEP HOUSE / 122 BPM: 深い7th・9thのコード、跳ねるベース、ゆったり4つ打ち
import { pattern, sustain, bassLine } from './kit.js';

const PROG = ['D4+F4+A4+C5+E5', 'D4+F4+A4+C5+E5', 'G3+Bb3+D4+F4+A4', 'G3+Bb3+D4+F4+A4'];
const ROOT = ['D2', 'D2', 'G1', 'G1'];
const MEL =
  'A5 - - - G5 F5 - D5 | . . . . C5 - D5 - | F5 - - - E5 D5 - A4 | . . . . . . . . |' +
  'A5 - - - C6 A5 - G5 | . . F5 - G5 - A5 - | D6 - - - C6 A5 - F5 | G5 - - - . . . . |';

export default {
  id: 'deep-blue-current',
  urlId: 'eacf1osog', // 曲ページのURL (music/eacf1osog/)。公開後は変えない
  title: 'Deep Blue Current',
  artist: 'MUSIC LiDAR',
  genre: 'DEEP HOUSE',
  bpm: 122,
  color: '#4fd0ff',
  levels: { easy: 2, normal: 5, hard: 8 },
  preview: 64,
  sidechain: true,
  chart: { hard: { minGap: 0.115, maxNps: 7 } },
  compose(s) {
    const stabs = (from, bars, vel = 0.4) => pattern(s, 'stab', from, bars, '..x...x..x....x.', (b) => PROG[b % 4], { vel, len: 0.3 });
    const four = { kick: 'X...X...X...X...', hat: '..x...x...x...x.', clap: '....x.......x...' };
    const groove = { kick: 'X...X...X...X...', hat: 'g.x.g.x.g.x.g.xg', clap: '....x.......x...', ride: 'x.x.x.x.x.x.x.x.' };
    s.drums(0, 8, { kick: 'X...X...X...X...', hat: '..x...x...x...x.' }); s.ghost(() => sustain(s, 'pad', 4, 4, PROG, 0.4));
    s.drums(8, 8, four); bassLine(s, 8, 8, ROOT, 'X..x..o...X..x..'); stabs(8, 8);
    s.crash(64);
    s.drums(16, 8, groove); bassLine(s, 16, 8, ROOT, 'X..x..o...X..x..'); s.ghost(() => stabs(16, 8, 0.3));
    s.seq('keys', 64, 0.5, MEL, 0.95);
    sustain(s, 'pad', 24, 4, PROG, 0.7); s.seq('bell', 96, 1, 'A5 - - - | G5 - F5 - | D6 - - - | C6 - - - |', 0.7);
    s.crash(112); s.crash(144, 0.7);
    s.drums(28, 16, groove); bassLine(s, 28, 16, ROOT, 'X..x..o...X..x..'); stabs(28, 16, 0.35);
    s.seq('keys', 112, 0.5, MEL, 1); s.seq('lead', 144, 0.5, MEL, 0.95);
    s.ghost(() => s.seq('bell', 144, 0.5, MEL, 0.3));
    s.drums(44, 6, four); bassLine(s, 44, 4, ROOT, 'X..x..o...X..x..'); sustain(s, 'pad', 46, 4, PROG, 0.5);
    s.kick(200); s.pad(200, ['D4', 'F4', 'A4', 'C5', 'E5'], 4, 0.7);
  },
};

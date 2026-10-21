// GABBER / 200 BPM: 割れたハードキックの4つ打ちと、叫ぶようなリード。鬼畜寄り
import { pattern, sustain, bassLine, build } from './kit.js';

const PROG = ['A3+C4+E4', 'A3+C4+E4', 'F3+A3+C4', 'G3+B3+D4'];
const ROOT = ['A1', 'A1', 'F1', 'G1'];
const SCREAM = [
  'A5 A5 C6 A5 E6 A5 C6 A5 D6 A5 C6 A5 B5 A5 G5 A5',
  'A5 A5 C6 A5 E6 A5 G6 E6 D6 C6 B5 A5 G5 A5 B5 C6',
  'F5 F5 A5 F5 C6 F5 A5 F5 E6 F5 C6 F5 A5 F5 C6 E6',
  'G5 G5 B5 G5 D6 G5 B5 G5 F6 E6 D6 B5 G5 B5 D6 G6',
];
const THEME =
  'A5 - - - E6 - - - | C6 - B5 - A5 - - - | F5 - - - C6 - - - | B5 - G5 - D6 - - - |';

export default {
  id: 'gabber-storm',
  urlId: '8j83a6otc', // 曲ページのURL (music/8j83a6otc/)。公開後は変えない
  title: 'Gabber Storm',
  artist: 'MUSIC LiDAR',
  genre: 'GABBER',
  bpm: 200,
  color: '#ff2a2a',
  levels: { easy: 4, normal: 10, hard: 13 },
  preview: 96,
  chart: { easy: { maxNps: 3.2 }, normal: { minGap: 0.13, maxNps: 7.5 }, hard: { minGap: 0.072, maxNps: 12.5, minScore: 0.7 } },
  compose(s) {
    const kicks = { hardkick: 'X...X...X...X...', hat: '..x...x...x...x.' };
    const storm = { hardkick: 'X...X...X...X...', hat: 'xxxxxxxxxxxxxxxx', clap: '....x.......x...' };
    sustain(s, 'pad', 0, 8, PROG, 0.6); s.seq('supersaw', 0, 1, THEME.repeat(2), 0.6);
    s.drums(4, 4, kicks);
    s.crash(32);
    s.drums(8, 16, storm); bassLine(s, 8, 16, ROOT, '..X...X...X...X.');
    for (let b = 8; b < 16; b++) s.seq('lead', b * 4, 0.25, SCREAM[b % 4], 0.9);
    s.seq('supersaw', 64, 0.5, THEME.repeat(2), 1);
    pattern(s, 'stab', 16, 8, 'x..x..x.x..x..x.', (b) => PROG[b % 4], { vel: 0.35, len: 0.2 });
    s.downer(96, 4); sustain(s, 'pad', 24, 8, PROG, 0.9); s.seq('bell', 96, 0.5, THEME.repeat(2), 0.85);
    build(s, 30);
    s.crash(128); s.crash(160, 0.8);
    s.drums(32, 16, storm); bassLine(s, 32, 16, ROOT, '..X...X...X...X.');
    for (let b = 32; b < 48; b++) s.seq(b < 40 ? 'lead' : 'supersaw', b * 4, 0.25, SCREAM[b % 4], 0.95);
    s.drums(48, 4, { hardkick: 'XXXXXXXXXXXXXXXX' });
    s.crash(208); s.hardkick(208); s.stab(208, ['A4', 'C5', 'E5', 'A5'], 3, 1);
  },
};

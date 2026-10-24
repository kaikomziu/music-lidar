// DARKSYNTH / 140 BPM: 闇夜を駆ける忍者。16分のアルペジオと、うなるリースベース
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['D4+F4+A4', 'Bb3+D4+F4', 'C4+E4+G4', 'A3+C#4+E4'];
const ROOT = ['D2', 'Bb1', 'C2', 'A1'];
const MEL =
  'D5 - F5 - A5 - D6 - | C6 - Bb5 - A5 - F5 - | G5 - - - E5 - C5 - | C#5 - E5 - A5 - - - |' +
  'D6 - C6 - A5 - F5 - | D6 - F6 - E6 - D6 - | E6 - C6 - G5 - E5 - | C#6 - - - A5 - - - |';

export default {
  id: 'dark-shinobi',
  urlId: 'yfmyy8k5c', // 曲ページのURL (music/yfmyy8k5c/)。公開後は変えない
  title: 'Dark Shinobi',
  artist: 'MUSIC LiDAR',
  genre: 'DARKSYNTH',
  bpm: 140,
  color: '#ff3355',
  levels: { easy: 4, normal: 7, hard: 11 },
  preview: 32,
  chart: { normal: { minGap: 0.15 }, hard: { minGap: 0.085, maxNps: 9.5, minScore: 0.7, chordP: 0.42 } },
  compose(s) {
    const run = (from, bars, vel = 0.6) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 2, 1, 0, 1] });
    const drive = { kick: 'X...X...X...X..x', snare: '....X.......X...', hat: '..x...x...x...x.' };
    sustain(s, 'pad', 0, 8, PROG, 0.55); run(4, 4, 0.5); build(s, 6);
    s.crash(32);
    s.drums(8, 16, drive); run(8, 16, 0.65); bassLine(s, 8, 16, ROOT, 'X.xxX.xxX.xxX.xx', { type: 'reese', vel: 0.8 });
    s.seq('lead', 32, 0.5, MEL + MEL, 0.9);
    sustain(s, 'pad', 24, 8, PROG, 0.65); s.seq('bell', 96, 0.5, MEL, 0.8); s.downer(96, 4); build(s, 30);
    s.crash(128); s.crash(160, 0.8);
    s.drums(32, 16, { ...drive, hat: 'xxxxxxxxxxxxxxxx', snare: '....X.......X.xx' }); run(32, 16, 0.7);
    bassLine(s, 32, 16, ROOT, 'X.xxX.xxX.xxX.xo', { type: 'reese', vel: 0.85 });
    s.seq('supersaw', 128, 0.5, MEL + MEL, 0.95);
    pattern(s, 'stab', 40, 8, 'X..X..X...X..X..', (b) => PROG[b % 4], { vel: 0.45, len: 0.2 });
    s.crash(192); s.kick(192); s.stab(192, ['D4', 'F4', 'A4'], 2, 1); s.reese(192, 'D2', 3);
  },
};

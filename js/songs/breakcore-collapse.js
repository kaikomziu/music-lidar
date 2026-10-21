// BREAKCORE / 190 BPM: 切り刻まれた高速ブレイクと、はかないピアノ。最難関クラス
import { sustain, bassLine, arp } from './kit.js';

const PROG = ['A3+C4+E4+G4', 'F3+A3+C4+E4', 'D4+F4+A4+C5', 'E3+G#3+B3+D4'];
const ROOT = ['A1', 'F1', 'D2', 'E1'];
const BREAKS = [
  { kick: 'X.X...X...X..X..', snare: '....X..X.X..X.XX', hat: 'xxxxxxxxxxxxxxxx' },
  { kick: 'X..X..X.X...X...', snare: '..X.X.X...XXX.X.', hat: 'xxxxxxxxxxxxxxxx' },
  { kick: 'XX..X.X..X.X..X.', snare: '..XX.X..XX.X.XXX', hat: 'xxxxxxxxxxxxxxxx' },
  { kick: 'X.X.X.X.X.X.X.X.', snare: 'XXXXXXXXXXXXXXXX', hat: '................' },
];
const PIANO =
  'E5 - - - C6 - - - | B5 - - - A5 - - - | A5 - - - F5 - - - | G#5 - - - B5 - - - |';

export default {
  id: 'breakcore-collapse',
  urlId: 'fpco9ioat', // 曲ページのURL (music/fpco9ioat/)。公開後は変えない
  title: 'Breakcore Collapse',
  artist: 'MUSIC LiDAR',
  genre: 'BREAKCORE',
  bpm: 190,
  color: '#b0ff3d',
  levels: { easy: 5, normal: 10, hard: 14 },
  preview: 64,
  chart: { easy: { maxNps: 3.3 }, normal: { minGap: 0.12, maxNps: 8, minScore: 1.6 }, hard: { minGap: 0.068, maxNps: 14, minScore: 0.6 } },
  compose(s) {
    const breaks = (from, bars) => { for (let b = from; b < from + bars; b++) s.drums(b, 1, BREAKS[b % 4 === 3 ? (b % 8 === 7 ? 3 : 2) : b % 2]); };
    sustain(s, 'pad', 0, 8, PROG, 0.5); s.seq('keys', 0, 0.5, PIANO + PIANO, 0.8);
    s.crash(32);
    breaks(8, 16); bassLine(s, 8, 16, ROOT, 'X.......X.......', { type: 'reese', len: 1.6 });
    s.seq('keys', 32, 0.5, PIANO + PIANO, 0.9);
    arp(s, 'pluck', 16, 8, PROG, { step: 0.25, vel: 0.75, order: [0, 1, 2, 3, 4, 3, 2, 1], oct: 1 });
    sustain(s, 'pad', 24, 4, PROG, 0.8); s.seq('bell', 96, 0.5, PIANO, 0.85);
    s.crash(112); s.crash(144, 0.8);
    breaks(28, 16); bassLine(s, 28, 16, ROOT, 'X...X...X..XX...', { type: 'reese' });
    arp(s, 'lead', 28, 16, PROG, { step: 0.25, vel: 0.85, order: [0, 2, 1, 3, 4, 2, 5, 3], oct: 1 });
    s.ghost(() => s.seq('keys', 112, 0.5, (PIANO + PIANO).repeat(2), 0.4));
    // 最後の崩壊
    s.crash(176);
    breaks(44, 8); bassLine(s, 44, 8, ROOT, 'X.X.X.X.X.X.X.X.', { type: 'reese' });
    arp(s, 'square', 44, 8, PROG, { step: 0.25, vel: 0.9, order: [0, 1, 2, 3, 4, 5, 6, 7], oct: 1 });
    sustain(s, 'pad', 52, 2, PROG, 0.6); s.keys(208, 'A5', 3, 0.8); s.keys(208, 'E5', 3, 0.7);
  },
};

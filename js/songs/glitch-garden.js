// GLITCH HOP / 110 BPM: こわれたデジタルの庭。つっかえるビートと、ぴょこぴょこ跳ねるシンセ
import { pattern, sustain, bassLine, arp } from './kit.js';

const PROG = ['A3+C4+E4+G4', 'F3+A3+C4+E4', 'D4+F4+A4', 'E4+G#4+B4'];
const ROOT = ['A1', 'F1', 'D2', 'E1'];
const MEL =
  'E5 . E5 G5 . A5 . C6 | B5 . A5 . . G5 E5 . | F5 . F5 A5 . C6 . D6 | B5 . G#5 . E5 . . . |' +
  'A5 . C6 . E6 . D6 C6 | A5 . . G5 . E5 . . | F5 . A5 . D6 . F6 . | E6 . . . B5 . . . |';

export default {
  id: 'glitch-garden',
  urlId: 'xefxyobvi', // 曲ページのURL (music/xefxyobvi/)。公開後は変えない
  title: 'Glitch Garden',
  artist: 'MUSIC LiDAR',
  genre: 'GLITCH HOP',
  bpm: 110,
  color: '#9dff4f',
  levels: { easy: 3, normal: 5, hard: 8 },
  preview: 48,
  chart: { hard: { minGap: 0.09, maxNps: 8.5, minScore: 0.7 } },
  compose(s) {
    s.setSwing(1 / 8);
    const stutter = { kick: 'X..X......X..X..', snare: '....X..x.x..X..X', hat: 'xxx.x.xxx.x.xxxx' };
    const glitch = (from, bars, vel = 0.6) => arp(s, 'chip', from, bars, PROG, { step: 0.125, vel, order: [0, 0, 1, 1, 2, 2, 3, 0, 4, 4, 3, 2, 1, 1, 0, 0], oct: 1 });
    sustain(s, 'pad', 0, 4, PROG, 0.5); s.ghost(() => glitch(2, 2, 0.4));
    s.drums(4, 8, stutter); bassLine(s, 4, 8, ROOT, 'X..X......X..X..', { type: 'reese' });
    s.seq('square', 16, 0.5, MEL, 0.9);
    s.drums(12, 8, stutter); bassLine(s, 12, 8, ROOT, 'X..X......X..X..', { type: 'reese' }); glitch(12, 8, 0.55);
    pattern(s, 'stab', 12, 8, '..x..x....x..x..', (b) => PROG[b % 4], { vel: 0.35, len: 0.15 });
    sustain(s, 'pad', 20, 4, PROG, 0.7); s.drums(23, 1, { snare: 'x.x.xxxxx.x.xxxx' });
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, stutter); bassLine(s, 24, 16, ROOT, 'X..X......X..X..', { type: 'reese' });
    s.seq('lead', 96, 0.5, MEL, 1); s.seq('chip', 128, 0.5, MEL, 1); s.ghost(() => glitch(24, 16, 0.35));
    s.crash(160); s.kick(160); s.reese(160, 'A1', 2); s.stab(160, ['A4', 'C5', 'E5'], 2, 1);
  },
};

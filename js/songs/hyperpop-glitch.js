// HYPERPOP / 160 BPM: ぎらぎらの音とつっかえるリズム。かわいいのに激しい
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['E4+G#4+B4', 'C#4+E4+G#4', 'A3+C#4+E4', 'B3+D#4+F#4'];
const ROOT = ['E1', 'C#2', 'A1', 'B1'];
const MEL =
  'B5 . B5 . G#5 . E5 . | C#6 - B5 - G#5 - E5 - | A5 . A5 . C#6 . E6 . | D#6 - - - B5 - - - |' +
  'B5 . B5 . E6 . G#6 . | F#6 - E6 - C#6 - B5 - | A5 . C#6 . E6 . F#6 . | E6 - - - - - . . |';

export default {
  id: 'hyperpop-glitch',
  urlId: 'f8u4tf135', // 曲ページのURL (music/f8u4tf135/)。公開後は変えない
  title: 'Hyperpop Glitch',
  artist: 'MUSIC LiDAR',
  genre: 'HYPERPOP',
  bpm: 160,
  color: '#ff5ec4',
  levels: { easy: 4, normal: 8, hard: 12 },
  preview: 96,
  sidechain: true,
  chart: { normal: { minGap: 0.15 }, hard: { minGap: 0.08, maxNps: 10.5, chordP: 0.42 } },
  compose(s) {
    const stutter = { kick: 'X..X..X.X.X.....', snare: '....X..x....X.xx', hat: 'xxxxx.xxxxx.xxxx' };
    const glitch = (from, bars, vel = 0.5) => arp(s, 'chip', from, bars, PROG, { step: 0.125, vel, order: [0, 1, 2, 3, 2, 1, 0, 0], oct: 1 });
    sustain(s, 'pad', 0, 4, PROG, 0.6); s.ghost(() => glitch(2, 2, 0.4));
    s.drums(4, 8, stutter); bassLine(s, 4, 8, ROOT, 'X..X..X.X.X.....', { type: 'reese' });
    s.seq('square', 16, 0.5, MEL, 0.95);
    sustain(s, 'pad', 12, 4, PROG, 0.7); s.seq('bell', 48, 0.5, MEL.split('|').slice(0, 4).join('|'), 0.85); build(s, 14);
    s.crash(64); s.crash(96, 0.8);
    s.drums(16, 16, stutter); bassLine(s, 16, 16, ROOT, 'X..X..X.X.X..X..', { type: 'reese' });
    pattern(s, 'supersaw', 16, 16, 'X..X..X...X..X..', (b) => PROG[b % 4], { vel: 0.35 });
    s.seq('lead', 64, 0.5, MEL, 1); s.seq('chip', 96, 0.5, MEL, 1);
    s.drums(32, 4, { kick: 'XXXX....XXXX....', snare: '....XXXX....XXXX' }); s.ghost(() => glitch(32, 4, 0.5));
    s.crash(144);
    s.drums(36, 8, stutter); bassLine(s, 36, 8, ROOT, 'X..X..X.X.X..X..', { type: 'reese' }); glitch(36, 8, 0.45);
    s.seq('lead', 144, 0.5, MEL, 1);
    s.crash(176); s.kick(176); s.stab(176, ['E4', 'G#4', 'B4', 'E5'], 2, 1); s.reese(176, 'E1', 2);
  },
};

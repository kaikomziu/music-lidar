// JUMP UP / 180 BPM(鬼畜): はねるドラムンベース。ワブルベースとスネアの連打で縦連・同時押しが多い
import { sustain, bassLine, arp } from './kit.js';

const PROG = ['E4+G4+B4', 'E4+G4+B4', 'C4+E4+G4', 'D4+F#4+A4'];
const ROOT = ['E1', 'E1', 'C2', 'D2'];
const BEATS = [
  { kick: 'X.........X.....', snare: '....X.......X...', hat: 'x.xxx.xxx.xxx.xx' },
  { kick: 'X.X.......X..X..', snare: '....X..x....X.xx', hat: 'xxxxxxxxxxxxxxxx' },
];

export default {
  id: 'terminal-velocity',
  urlId: 'f1uxqvjsl', // 曲ページのURL (music/f1uxqvjsl/)。公開後は変えない
  title: 'Terminal Velocity',
  artist: 'MUSIC LiDAR',
  genre: 'JUMP UP',
  bpm: 180,
  color: '#ffe03d',
  levels: { easy: 5, normal: 9, hard: 12 },
  preview: 96,
  chart: {
    easy: { minGap: 0.27, maxNps: 3.2 },
    normal: { minGap: 0.125, maxNps: 6.8, chordP: 0.3 },
    hard: { minGap: 0.068, maxNps: 12.5, minScore: 0.45, chordP: 0.5, chordMax: 3, sameGap: 0.068 },
  },
  compose(s) {
    const beats = (from, bars) => { for (let b = from; b < from + bars; b++) s.drums(b, 1, BEATS[b % 2]); };
    const wob = (from, bars, rate = 2) => { for (let b = from; b < from + bars; b++) { s.wobble(b * 4, ROOT[b % 4].replace(/\d/, (d) => +d + 1), 1.5, rate); s.wobble(b * 4 + 2, ROOT[b % 4].replace(/\d/, (d) => +d + 1), 0.75, rate * 2); s.wobble(b * 4 + 3, ROOT[b % 4].replace(/\d/, (d) => +d + 1), 1, 4); } };
    sustain(s, 'pad', 0, 8, PROG, 0.6); s.seq('bell', 0, 0.5, 'B5 - - - E6 - - - | G6 - - - F#6 - - - | E6 - - - G5 - - - | A5 - - - D6 - - - |'.repeat(2), 0.7);
    s.drums(6, 1, { snare: 'x...x...x.x.x.x.' }); s.drums(7, 1, { snare: 'xxxxxxxxxxxxxxxx' });
    s.crash(32);
    beats(8, 16); wob(8, 16); bassLine(s, 8, 16, ROOT, 'X.........X.....', { len: 1.5 });
    arp(s, 'pluck', 16, 8, PROG, { step: 0.25, vel: 0.75, order: [0, 2, 1, 3, 2, 4, 3, 5], oct: 1 });
    sustain(s, 'pad', 24, 4, PROG, 0.8); s.drums(27, 1, { snare: 'x.x.x.x.xxxxxxxx' });
    s.crash(112); s.crash(144, 0.8);
    beats(28, 16); wob(28, 16, 4); bassLine(s, 28, 16, ROOT, 'X.........X..X..', { len: 1 });
    arp(s, 'square', 28, 16, PROG, { step: 0.25, vel: 0.8, order: [0, 1, 2, 3, 4, 5, 4, 3, 2, 3, 4, 5, 6, 5, 4, 3], oct: 1 });
    s.drums(44, 4, { kick: 'X.X.X.X.X.X.X.X.', snare: 'xxxxxxxxxxxxxxxx' }); wob(44, 4, 8);
    s.crash(192); s.kick(192); s.wobble(192, 'E2', 2, 1); s.stab(192, ['E4', 'G4', 'B4'], 2, 1);
  },
};

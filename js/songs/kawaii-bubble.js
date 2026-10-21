// KAWAII FUTURE BASS / 160 BPM: ぴこぴこの8bit音とふわふわの和音、かわいいメロディ
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['F4+A4+C5+E5', 'G4+B4+D5', 'E4+G4+B4+D5', 'A4+C5+E5+G5'];
const ROOT = ['F1', 'G1', 'E1', 'A1'];
const MEL =
  'C6 D6 E6 . G6 . E6 . | D6 - B5 - G5 - . . | E6 D6 C6 . B5 . G5 . | A5 - - - C6 - - - |' +
  'C6 D6 E6 . G6 . A6 . | G6 - E6 - D6 - . . | E6 D6 C6 . D6 . E6 . | A5 - - - - - . . |';

export default {
  id: 'kawaii-bubble',
  urlId: 'il5gs945p', // 曲ページのURL (music/il5gs945p/)。公開後は変えない
  title: 'Kawaii Bubble',
  artist: 'MUSIC LiDAR',
  genre: 'KAWAII FUTURE BASS',
  bpm: 160,
  color: '#ffb3e6',
  levels: { easy: 3, normal: 7, hard: 11 },
  preview: 96,
  sidechain: true,
  chart: { normal: { minGap: 0.16 }, hard: { minGap: 0.09, maxNps: 9, chordP: 0.42 } },
  compose(s) {
    const saws = (from, bars, vel = 0.35) => pattern(s, 'supersaw', from, bars, 'X..X..X...X..X..', (b) => PROG[b % 4], { vel });
    const bubbles = (from, bars, vel = 0.4) => { for (let b = from; b < from + bars; b++) { const c = PROG[b % 4].split('+'); for (let i = 0; i < 8; i++) s.chip(b * 4 + i / 2, c[i % c.length].replace(/\d/, (d) => +d + 1), 0.2, vel, 0.25); } };
    const half = { kick: 'X.........X.....', snare: '........X.......', hat: 'x.x.x.x.x.x.x.x.' };
    sustain(s, 'pad', 0, 4, PROG, 0.6); bubbles(0, 4, 0.5);
    s.drums(4, 8, { kick: 'X.........X.....', snare: '........x.......', hat: '..x...x...x...x.' }); sustain(s, 'pad', 4, 8, PROG, 0.4); bassLine(s, 4, 8, ROOT, 'X.........X.....', { type: 'reese', len: 1.4 });
    s.seq('bell', 16, 0.5, MEL, 0.9);
    sustain(s, 'pad', 12, 4, PROG, 0.6); arp(s, 'pluck', 12, 4, PROG, { step: 0.25, vel: 0.6, order: [0, 1, 2, 3] }); build(s, 14);
    s.crash(64); s.crash(96, 0.8);
    s.drums(16, 16, half); saws(16, 16); bassLine(s, 16, 16, ROOT, 'X.........X.....', { type: 'reese', len: 1.4 });
    s.seq('chip', 64, 0.5, MEL, 1); s.seq('bell', 96, 0.5, MEL, 1); s.ghost(() => bubbles(16, 16, 0.3));
    sustain(s, 'pad', 32, 4, PROG, 0.7); bubbles(32, 4, 0.6); build(s, 34);
    s.crash(144);
    s.drums(36, 8, { ...half, hat: 'x.xxx.x.x.xxx.xo' }); saws(36, 8, 0.4); bassLine(s, 36, 8, ROOT, 'X.........X..X..', { type: 'reese', len: 1 });
    s.seq('chip', 144, 0.5, MEL, 1); s.ghost(() => s.seq('supersaw', 144, 0.5, MEL, 0.35));
    s.crash(176); sustain(s, 'pad', 44, 2, PROG, 0.6); s.bell(176, 'C6', 2); s.bell(178, 'A5', 3);
  },
};

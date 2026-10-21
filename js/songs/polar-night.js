// AMBIENT / 90 BPM: 極夜の空。ゆっくりのパッドとベル、静かなビート(やさしめ)
import { sustain, arp, bassLine } from './kit.js';

const PROG = ['A3+E4+B4+C#5', 'F#3+C#4+E4+A4', 'D3+A3+E4+F#4', 'E3+B3+E4+G#4'];
const ROOT = ['A1', 'F#1', 'D2', 'E2'];
const MEL =
  'E5 - - - C#5 - - - | E5 - F#5 - A5 - - - | F#5 - - - E5 - - - | B4 - - - - - - - |' +
  'E5 - - - A5 - - - | G#5 - - - E5 - C#5 - | D5 - - - F#5 - E5 - | E5 - - - - - - - |';

export default {
  id: 'polar-night',
  urlId: 'z7ie7kr94', // 曲ページのURL (music/z7ie7kr94/)。公開後は変えない
  title: 'Polar Night',
  artist: 'MUSIC LiDAR',
  genre: 'AMBIENT',
  bpm: 90,
  color: '#9ad7ff',
  levels: { easy: 1, normal: 3, hard: 5 },
  preview: 32,
  chart: { easy: { maxNps: 1.4 }, normal: { maxNps: 2.4 }, hard: { minGap: 0.16, maxNps: 4 } },
  compose(s) {
    const shimmer = (from, bars, vel = 0.35) => arp(s, 'pluck', from, bars, PROG, { step: 0.5, vel, order: [0, 2, 1, 3, 2, 1, 3, 2], oct: 1 });
    sustain(s, 'pad', 0, 4, PROG, 0.7);
    s.seq('bell', 0, 1, 'E5 - - - | C#5 - - - | A4 - - - | B4 - - - |', 0.7);
    sustain(s, 'pad', 4, 8, PROG, 0.5); s.ghost(() => shimmer(4, 8)); bassLine(s, 4, 8, ROOT, 'X.......X.......', { len: 1.8 });
    s.drums(4, 8, { kick: 'X.........X.....', snare: '........x.......', hat: '..x...x...x...x.' });
    s.seq('bell', 16, 0.5, MEL, 0.9);
    sustain(s, 'pad', 12, 8, PROG, 0.5); shimmer(12, 8, 0.6); bassLine(s, 12, 8, ROOT, 'X.......X.......', { len: 1.8 });
    s.drums(12, 8, { kick: 'X.........X.....', snare: '........x.......', hat: 'x.x.x.x.x.x.x.x.' });
    sustain(s, 'pad', 20, 4, PROG, 0.8); s.seq('keys', 80, 1, 'A5 - - - | F#5 - - - | E5 - - - | G#5 - - - |', 0.7);
    sustain(s, 'pad', 24, 8, PROG, 0.5); s.ghost(() => shimmer(24, 8)); bassLine(s, 24, 8, ROOT, 'X.......X...x...', { len: 1.5 });
    s.drums(24, 8, { kick: 'X.........X.....', snare: '........x.......', hat: 'x.x.x.x.x.x.x.x.' });
    s.seq('square', 96, 0.5, MEL, 0.85); s.ghost(() => s.seq('bell', 96, 0.5, MEL, 0.35));
    sustain(s, 'pad', 32, 3, PROG, 0.6); s.bell(132, 'E5', 4, 0.7); s.bass(128, 'A1', 4);
  },
};

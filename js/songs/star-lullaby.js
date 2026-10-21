// MUSIC BOX / 72 BPM: オルゴールの子守歌。いちばんやさしい曲のひとつ
import { sustain, arp } from './kit.js';

const PROG = ['C4+E4+G4', 'F4+A4+C5', 'C4+E4+G4', 'G3+B3+D4', 'A3+C4+E4', 'F4+A4+C5', 'C4+E4+G4', 'G3+B3+D4'];
const MEL =
  'G5 - E5 - G5 - - - | A5 - G5 - F5 - - - | E5 - G5 - C6 - - - | B5 - - - D5 - - - |' +
  'C5 - E5 - A5 - - - | A5 - C6 - F5 - - - | E5 - D5 - C5 - E5 - | D5 - - - - - - - |';

export default {
  id: 'star-lullaby',
  urlId: 'b4vgdax1h', // 曲ページのURL (music/b4vgdax1h/)。公開後は変えない
  title: 'Star Lullaby',
  artist: 'MUSIC LiDAR',
  genre: 'MUSIC BOX',
  bpm: 72,
  color: '#fff3b0',
  levels: { easy: 1, normal: 2, hard: 3 },
  preview: 32,
  chart: { easy: { maxNps: 1.0 }, normal: { maxNps: 1.7, minGap: 0.3, minScore: 2.0 }, hard: { minGap: 0.2, maxNps: 2.8, minScore: 1.5 } },
  compose(s) {
    const box = (from, bars, vel = 0.4) => arp(s, 'bell', from, bars, PROG, { step: 0.5, vel, order: [0, 1, 2, 1], oct: 1 });
    s.ghost(() => box(0, 2, 0.45));
    s.seq('bell', 8, 0.5, MEL, 0.9); s.ghost(() => box(2, 8, 0.3)); sustain(s, 'pad', 2, 8, PROG, 0.65);
    s.drums(10, 8, { kick: 'x.......x.......', hat: '....x.......x...' });
    s.seq('bell', 40, 0.5, MEL, 0.95); box(10, 8, 0.3); sustain(s, 'pad', 10, 8, PROG, 0.7); s.ghost(() => s.seq('keys', 40, 0.5, MEL, 0.6));
    sustain(s, 'pad', 18, 4, PROG, 0.8); s.seq('keys', 72, 1, 'E5 - - - | F5 - - - | G5 - - - | B4 - - - |', 0.7);
    s.drums(22, 8, { kick: 'x.......x.......', hat: '....x.......x...' });
    s.seq('pluck', 88, 0.5, MEL, 0.9); box(22, 8, 0.3); sustain(s, 'pad', 22, 8, PROG, 0.7); s.ghost(() => s.seq('keys', 88, 0.5, MEL, 0.6));
    s.bell(120, 'C6', 4, 0.8); s.pad(120, ['C4', 'E4', 'G4'], 4, 0.5);
  },
};

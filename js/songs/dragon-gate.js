// CHINESE / 128 BPM: 五音音階の二胡風メロディと揚琴(ようきん)風のトレモロ、銅鑼
import { sustain, bassLine, arp } from './kit.js';

const PROG = ['G4+B4+D5', 'E4+G4+B4', 'C4+E4+G4', 'D4+F#4+A4'];
const ROOT = ['G1', 'E1', 'C2', 'D2'];
const MEL =
  'D5 - E5 - G5 - A5 - | B5 - - A5 G5 - E5 - | E5 - G5 - D5 - - - | E5 - D5 - B4 - A4 - |' +
  'G5 - A5 - B5 - D6 - | E6 - - D6 B5 - A5 - | A5 - B5 - G5 - E5 - | G5 - - - - - . . |';

export default {
  id: 'dragon-gate',
  urlId: 'nhi60tthq', // 曲ページのURL (music/nhi60tthq/)。公開後は変えない
  title: 'Dragon Gate',
  artist: 'MUSIC LiDAR',
  genre: 'CHINESE',
  bpm: 128,
  color: '#ff4040',
  levels: { easy: 2, normal: 5, hard: 10 },
  preview: 80,
  chart: { hard: { minGap: 0.1, maxNps: 7.5 } },
  compose(s) {
    const yangqin = (from, bars, vel = 0.45) => arp(s, 'pluck', from, bars, ['G4+A4+B4+D5', 'E4+G4+A4+B4', 'C4+D4+E4+G4', 'D4+E4+G4+A4'], { step: 0.25, vel, order: [0, 1, 2, 3, 2, 1], oct: 1 });
    const beat = { kick: 'X.......X.x.....', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    sustain(s, 'pad', 0, 4, PROG, 0.6); s.crash(0); yangqin(2, 2, 0.6);
    s.drums(4, 8, beat); yangqin(4, 8); bassLine(s, 4, 8, ROOT, 'X.......X...X...');
    s.seq('lead', 16, 0.5, MEL, 0.95);
    s.crash(48);
    s.drums(12, 8, { ...beat, hat: 'xxxxxxxxxxxxxxxx', kick: 'X.x.....X.x.....' }); s.ghost(() => yangqin(12, 8, 0.35)); bassLine(s, 12, 8, ROOT, 'X...X...X...X...');
    s.seq('square', 48, 0.5, MEL, 1); sustain(s, 'pad', 12, 8, PROG, 0.35);
    s.drums(20, 4, { kick: 'X...X...X...X...', snare: 'x.x.x.x.xxxxxxxx' }); s.crash(80); s.crash(88);
    s.seq('bell', 80, 0.25, 'G5 A5 B5 D6 E6 D6 B5 A5 '.repeat(4) + 'E6 D6 B5 A5 G5 A5 B5 D6 '.repeat(4), 0.8);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, { ...beat, hat: 'xxxxxxxxxxxxxxxx', kick: 'X.x.....X.x.....' }); yangqin(24, 16, 0.4); bassLine(s, 24, 16, ROOT, 'X...X...X...X...');
    s.seq('lead', 96, 0.5, MEL, 1); s.seq('square', 128, 0.5, MEL, 1);
    s.crash(160); s.kick(160); s.pad(160, ['G4', 'B4', 'D5'], 3, 0.8); s.lead(160, 'G5', 3); s.bass(160, 'G1', 2);
  },
};

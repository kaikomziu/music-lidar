// FLASHCORE / 230 BPM: 光速で駆け抜けるきらきらハードコア。16分のスーパーソウ連打(鬼畜)
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['E4+G4+B4', 'C4+E4+G4', 'D4+F#4+A4', 'B3+D#4+F#4'];
const ROOT = ['E2', 'C2', 'D2', 'B1'];
const MEL =
  'B5 E6 F#6 G6 F#6 E6 B5 G5 | C6 E6 G6 E6 C6 G5 E5 G5 | D6 F#6 A6 F#6 D6 A5 F#5 A5 | B5 D#6 F#6 B6 A6 F#6 D#6 B5 |' +
  'G6 F#6 E6 B5 G6 F#6 E6 B5 | G6 E6 C6 G5 E6 C6 G5 E5 | A6 F#6 D6 A5 F#6 D6 A5 F#5 | B6 - - - F#6 - D#6 - |';
const PIANO = 'E6 - - - B5 - - - | C6 - - - G5 - - - | D6 - - - A5 - - - | D#6 - - - F#6 - - - |';

export default {
  id: 'lightspeed-flash',
  urlId: 'ql5eruw6q', // 曲ページのURL (music/ql5eruw6q/)。公開後は変えない
  title: 'Lightspeed Flash',
  artist: 'MUSIC LiDAR',
  genre: 'FLASHCORE',
  bpm: 230,
  color: '#7af7ff',
  levels: { easy: 5, normal: 11, hard: 14 },
  preview: 160,
  chart: { normal: { minGap: 0.12, maxNps: 6.5 }, hard: { minGap: 0.065, maxNps: 13.5, minScore: 0.6, chordP: 0.42 } },
  compose(s) {
    const saw = (from, bars, vel = 0.55) => arp(s, 'supersaw', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 2, 1, 2, 3] });
    const core = { hardkick: 'X...X...X...X...', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const blast = { hardkick: 'X.X.X.X.X.X.X.X.', snare: '..X...X...X...X.', hat: 'xxxxxxxxxxxxxxxx' };
    sustain(s, 'pad', 0, 4, PROG, 0.55); s.seq('bell', 0, 0.5, PIANO, 0.7); build(s, 4, 4);
    s.crash(32);
    s.drums(8, 16, core); saw(8, 16); bassLine(s, 8, 16, ROOT, 'X.o.X.o.X.o.X.o.', { vel: 0.85 });
    s.seq('lead', 32, 0.5, MEL + MEL, 0.9);
    s.seq('keys', 96, 0.5, PIANO + PIANO, 0.9); s.ghost(() => sustain(s, 'pad', 24, 8, PROG, 0.4)); build(s, 30);
    s.crash(128); s.crash(160, 0.8);
    s.drums(32, 16, blast); saw(32, 16, 0.6); bassLine(s, 32, 16, ROOT, 'XoXoXoXoXoXoXoXo', { vel: 0.8 });
    s.seq('lead', 128, 0.5, MEL + MEL, 1);
    sustain(s, 'pad', 48, 4, PROG, 0.6); s.seq('bell', 192, 0.25, MEL.split('|').slice(0, 4).join('|'), 0.85);
    s.crash(208);
    s.drums(52, 20, { ...blast, snare: 'X.X.X.X.X.X.X.X.' }); saw(52, 20, 0.65); bassLine(s, 52, 20, ROOT, 'XoXoXoXoXoXoXoXo', { vel: 0.8 });
    s.seq('supersaw', 208, 0.5, MEL + MEL, 0.9); s.seq('lead', 240, 0.25, MEL + MEL, 1);
    pattern(s, 'stab', 64, 8, 'X..X..X.X..X..X.', (b) => PROG[b % 4], { vel: 0.6, len: 0.15 });
    s.crash(288); s.hardkick(288); s.stab(288, ['E4', 'G4', 'B4'], 3, 1); s.bass(288, 'E2', 3);
  },
};

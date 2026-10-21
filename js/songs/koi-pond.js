// WA-POP(和ポップ) / 118 BPM: 鯉の泳ぐ池。箏とシンセが混ざる明るい和風ポップ
import { sustain, bassLine, arp } from './kit.js';

const PROG = ['D4+F#4+A4', 'B3+D4+F#4', 'G3+B3+D4', 'A3+C#4+E4'];
const ROOT = ['D2', 'B1', 'G1', 'A1'];
const MEL =
  'A5 - B5 - D6 - E6 - | F#6 - E6 - D6 - B5 - | B5 - A5 - F#5 - E5 - | E5 - - - . . . . |' +
  'A5 - B5 - D6 - F#6 - | E6 - D6 - B5 - A5 - | B5 - D6 - E6 - A6 - | F#6 - - - - - . . |';

export default {
  id: 'koi-pond',
  urlId: 'jg9f20nsl', // 曲ページのURL (music/jg9f20nsl/)。公開後は変えない
  title: 'Koi Pond',
  artist: 'MUSIC LiDAR',
  genre: 'WA-POP',
  bpm: 118,
  color: '#ff8a7a',
  levels: { easy: 2, normal: 5, hard: 8 },
  preview: 48,
  chart: { hard: { minGap: 0.11, maxNps: 6.5 } },
  compose(s) {
    const koto = (from, bars, vel = 0.5) => arp(s, 'pluck', from, bars, ['D4+E4+F#4+A4+B4', 'B3+D4+E4+F#4+A4', 'G3+A3+B3+D4+E4', 'A3+B3+C#4+E4+F#4'], { step: 0.25, vel, order: [0, 1, 2, 3, 4, 3, 2, 1], oct: 1 });
    const pop = { kick: 'X.....x.X.......', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    koto(0, 4, 0.6); sustain(s, 'pad', 0, 4, PROG, 0.4);
    s.drums(4, 8, pop); bassLine(s, 4, 8, ROOT, 'X.....X.X...X...'); s.ghost(() => koto(4, 8, 0.35));
    s.seq('lead', 16, 0.5, MEL, 0.95);
    s.crash(48);
    s.drums(12, 8, { ...pop, hat: 'xxxxxxxxxxxxxxxx' }); bassLine(s, 12, 8, ROOT, 'X.X.X.X.X.X.X.X.'); sustain(s, 'pad', 12, 8, PROG, 0.35);
    s.seq('bell', 48, 0.5, MEL, 1); koto(12, 8, 0.3);
    s.drums(20, 4, { kick: 'X..x..X.X..x..X.' }); koto(20, 4, 0.75);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, { ...pop, hat: 'xxxxxxxxxxxxxxxx' }); bassLine(s, 24, 16, ROOT, 'X.X.X.X.X.X.X.X.'); sustain(s, 'pad', 24, 16, PROG, 0.35);
    s.seq('lead', 96, 0.5, MEL, 1); s.seq('square', 128, 0.5, MEL, 1); s.ghost(() => koto(24, 16, 0.3));
    s.crash(160); s.kick(160); s.pluck(160, 'D5', 3); s.pad(160, ['D4', 'F#4', 'A4'], 3, 0.7); s.bass(160, 'D2', 2);
  },
};

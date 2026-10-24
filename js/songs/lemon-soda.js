// SHIBUYA-KEI / 112 BPM: 炭酸みたいにはじける、おしゃれな渋谷系ポップ(初心者向け)
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['F4+A4+C5+E5', 'D4+F4+A4+C5', 'G4+Bb4+D5+F5', 'C4+E4+G4+Bb4'];
const ROOT = ['F1', 'D2', 'G1', 'C2'];
const MEL =
  'C6 - A5 - F5 - G5 A5 | . . D6 - C6 - A5 - | Bb5 - - G5 D5 - F5 G5 | E5 - - - . . . . |' +
  'C6 - A5 - F5 - A5 C6 | D6 - F6 - E6 - D6 - | Bb5 - A5 - G5 - E5 - | F5 - - - - - . . |';

export default {
  id: 'lemon-soda',
  urlId: '5gu37e7h1', // 曲ページのURL (music/5gu37e7h1/)。公開後は変えない
  title: 'Lemon Soda',
  artist: 'MUSIC LiDAR',
  genre: 'SHIBUYA-KEI',
  bpm: 112,
  color: '#ffe65c',
  levels: { easy: 1, normal: 3, hard: 5 },
  preview: 48,
  chart: { easy: { maxNps: 1.5 }, hard: { minGap: 0.16, maxNps: 4.2 } },
  compose(s) {
    const comp = (from, bars, vel = 0.35) => s.ghost(() => pattern(s, 'stab', from, bars, 'x..x..x...x..x..', (b) => PROG[b % 4], { vel, len: 0.3 }));
    const beat = { kick: 'X......xX.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' };
    sustain(s, 'pad', 0, 4, PROG, 0.55); arp(s, 'keys', 0, 4, PROG, { step: 0.5, vel: 0.5, order: [0, 1, 2, 3] });
    s.drums(4, 16, beat); comp(4, 16); bassLine(s, 4, 16, ROOT, 'X..xX...X..xX...', { type: 'upright' });
    s.seq('square', 16, 0.5, MEL, 0.85); s.seq('keys', 48, 0.5, MEL, 0.9);
    sustain(s, 'pad', 20, 4, PROG, 0.6); s.seq('bell', 80, 1, 'E6 - - - | C6 - - - | D6 - - - | C6 - - - |', 0.75); build(s, 22);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, { ...beat, hat: 'x.xxx.xxx.xxx.xx' }); comp(24, 16, 0.4); bassLine(s, 24, 16, ROOT, 'X..xX..oX..xX..o', { type: 'upright' });
    s.seq('lead', 96, 0.5, MEL, 0.95); s.seq('square', 128, 0.5, MEL, 1);
    s.crash(160); s.kick(160); s.stab(160, ['F4', 'A4', 'C5', 'E5'], 3, 0.9); s.upright(160, 'F1', 3);
  },
};

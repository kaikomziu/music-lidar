// BOUNCE POP / 116 BPM: 水たまりをぴょんぴょん。はずむベースとぴこぴこの音(初心者向け)
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['C4+E4+G4', 'A3+C4+E4', 'F3+A3+C4', 'G3+B3+D4'];
const ROOT = ['C2', 'A1', 'F1', 'G1'];
const MEL =
  'G5 - E5 - G5 - C6 - | A5 - E5 - C5 - - - | F5 - A5 - C6 - A5 - | B5 - - - G5 - - - |' +
  'C6 - G5 - E5 - G5 - | A5 - C6 - E6 - - - | D6 - C6 - A5 - F5 - | G5 - - - - - . . |';

export default {
id: 'puddle-jump',
  urlId: 'am8bydaqf', // 曲ページのURL (music/am8bydaqf/)。公開後は変えない
  title: 'Puddle Jump',
  artist: 'MUSIC LiDAR',
  genre: 'BOUNCE POP',
  bpm: 116,
  color: '#7fd4ff',
  levels: { easy: 1, normal: 3, hard: 5 },
  preview: 16,
  chart: { easy: { maxNps: 1.6 }, hard: { minGap: 0.13, maxNps: 5 } },
  compose(s) {

    const bounce = { kick: 'X.....X.X.......', clap: '....X.......X...', hat: '..x...x...x...x.' };
    const pops = (from, bars, vel = 0.4) => pattern(s, 'chip', from, bars, '..x...x...x...x.', (b) => [PROG[b % 4].split('+')[2].replace(/\d/, (d) => +d + 1)], { vel, len: 0.2 });
    pops(0, 4, 0.6); bassLine(s, 2, 2, ROOT, 'X.....X.X.......');
    s.drums(4, 16, bounce); s.ghost(() => pops(4, 16, 0.3)); bassLine(s, 4, 16, ROOT, 'X.....X.X.......');
    s.seq('pluck', 16, 0.5, MEL, 0.95); s.seq('square', 48, 0.5, MEL, 0.9);
    s.drums(20, 4, { kick: 'X...X...X...X...' }); sustain(s, 'pad', 20, 4, PROG, 0.6);
    s.crash(96);
    s.drums(24, 8, { ...bounce, hat: 'x.x.x.x.x.x.x.x.' }); pops(24, 8, 0.35); bassLine(s, 24, 8, ROOT, 'X.o.X.o.X.o.X.o.');
    s.seq('bell', 96, 0.5, MEL, 1);
    s.crash(128); s.kick(128); s.stab(128, ['C4', 'E4', 'G4', 'C5'], 2, 1); s.bass(128, 'C2', 2);
  },
};

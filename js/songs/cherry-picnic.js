// SPRING POP / 108 BPM: 春のピクニック。ウクレレ風の刻みと口ずさめるメロディ(初心者向け)
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['F4+A4+C5', 'C4+E4+G4', 'D4+F4+A4', 'Bb3+D4+F4'];
const ROOT = ['F1', 'C2', 'D2', 'Bb1'];
const MEL =
  'A5 - - G5 F5 - C5 - | E5 - - - G5 - - - | F5 - - E5 D5 - A5 - | Bb5 - - - A5 - - - |' +
  'C6 - - Bb5 A5 - F5 - | G5 - - - E5 - C5 - | D5 - F5 - A5 - D6 - | C6 - - - - - . . |';

export default {
id: 'cherry-picnic',
  urlId: 'lpvm1lsmw', // 曲ページのURL (music/lpvm1lsmw/)。公開後は変えない
  title: 'Cherry Picnic',
  artist: 'MUSIC LiDAR',
  genre: 'SPRING POP',
  bpm: 108,
  color: '#ffb3c8',
  levels: { easy: 1, normal: 2, hard: 4 },
  preview: 16,
  chart: { easy: { maxNps: 1.3 }, normal: { maxNps: 2.3, minGap: 0.28 }, hard: { minGap: 0.18, maxNps: 3.8 } },
  compose(s) {

    const uke = (from, bars, vel = 0.45) => pattern(s, 'pluck', from, bars, 'x.x.xx.xx.x.xx.x', (b) => PROG[b % 4], { vel, len: 0.2 });
    const beat = { kick: 'X.......X.......', clap: '....X.......X...', hat: '..x...x...x...x.' };
    uke(0, 4, 0.55);
    s.drums(4, 16, beat); s.ghost(() => uke(4, 16, 0.35)); bassLine(s, 4, 16, ROOT, 'X.......X...X...');
    s.seq('bell', 16, 0.5, MEL, 0.95); s.seq('keys', 48, 0.5, MEL, 0.9);
    sustain(s, 'pad', 20, 4, PROG, 0.6); uke(20, 4, 0.5);
    s.drums(24, 8, { ...beat, hat: 'x.x.x.x.x.x.x.x.' }); s.ghost(() => uke(24, 8, 0.35)); bassLine(s, 24, 8, ROOT, 'X...X...X...X...');
    s.seq('lead', 96, 0.5, MEL, 1); s.ghost(() => s.seq('bell', 96, 0.5, MEL, 0.3));
    s.crash(128, 0.5); s.kick(128); s.pad(128, ['F4', 'A4', 'C5'], 3, 0.7); s.bell(128, 'F6', 3); s.bass(128, 'F1', 2);
  },
};

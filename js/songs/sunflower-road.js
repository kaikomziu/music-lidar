// COUNTRY / 112 BPM: ひまわり畑の一本道。ギターの刻みとはずむベース(初心者向け)
import { pattern, bassLine } from './kit.js';

const PROG = ['G3+B3+D4', 'G3+B3+D4', 'C4+E4+G4', 'D4+F#4+A4'];
const ROOT = ['G1', 'G1', 'C2', 'D2'];
const MEL =
  'B4 - D5 - G5 - - - | G5 - A5 - B5 - G5 - | E5 - G5 - C6 - - - | A5 - - - F#5 - - - |' +
  'B4 - D5 - G5 - B5 - | D6 - B5 - G5 - - - | E5 - G5 - A5 - F#5 - | G5 - - - - - . . |';

export default {
  id: 'sunflower-road',
  urlId: 'itrzo5y3k', // 曲ページのURL (music/itrzo5y3k/)。公開後は変えない
  title: 'Sunflower Road',
  artist: 'MUSIC LiDAR',
  genre: 'COUNTRY',
  bpm: 112,
  color: '#ffd84a',
  levels: { easy: 1, normal: 3, hard: 6 },
  preview: 48,
  chart: { easy: { maxNps: 1.6 }, hard: { minGap: 0.13, maxNps: 5 } },
  compose(s) {
    const strum = (from, bars, vel = 0.45) => pattern(s, 'pluck', from, bars, 'x.xxx.xxx.xxx.xx', (b) => PROG[b % 4], { vel, len: 0.2 });
    const boom = (from, bars) => bassLine(s, from, bars, ROOT, 'X...f...X...f...');
    const train = { kick: 'X.......X.......', snare: '....X.......X...', hat: 'x.xxx.xxx.xxx.xx' };
    strum(0, 4, 0.55); boom(2, 2);
    s.drums(4, 16, train); s.ghost(() => strum(4, 16, 0.35)); boom(4, 16);
    s.seq('lead', 16, 0.5, MEL, 0.9); s.seq('keys', 48, 0.5, MEL, 0.95);
    s.drums(20, 4, { kick: 'X.......X.......', hat: 'x.x.x.x.x.x.x.x.' }); strum(20, 4, 0.6); boom(20, 4);
    s.crash(96);
    s.drums(24, 8, train); s.ghost(() => strum(24, 8, 0.35)); boom(24, 8);
    s.seq('lead', 96, 0.5, MEL, 1); s.ghost(() => s.seq('bell', 96, 0.5, MEL, 0.3));
    s.kick(128); s.crash(128, 0.6); s.pluck(128, 'G4', 2); s.pluck(128, 'B4', 2); s.pluck(128, 'D5', 2); s.bass(128, 'G1', 2);
  },
};

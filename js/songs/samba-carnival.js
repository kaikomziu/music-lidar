// SAMBA / 100 BPM(2拍子感): カーニバルの打楽器隊と、明るいブラスのメロディ
import { pattern, bassLine } from './kit.js';

const PROG = ['G4+B4+D5', 'E4+G4+B4', 'A4+C5+E5', 'D4+F#4+A4'];
const ROOT = ['G1', 'E1', 'A1', 'D2'];
const MEL =
  'D5 - G5 - B5 - A5 G5 | E5 - - - G5 - B5 - | C6 - B5 - A5 - E5 - | F#5 - - - D5 - . . |' +
  'D5 - G5 - B5 - D6 - | E6 - D6 - B5 - G5 - | A5 - C6 - E6 - D6 C6 | B5 - A5 - G5 - . . |';

export default {
  id: 'samba-carnival',
  urlId: 'hbqd26t62', // 曲ページのURL (music/hbqd26t62/)。公開後は変えない
  title: 'Samba Carnival',
  artist: 'MUSIC LiDAR',
  genre: 'SAMBA',
  bpm: 100,
  color: '#3ddc6e',
  levels: { easy: 2, normal: 5, hard: 9 },
  preview: 48,
  chart: { hard: { minGap: 0.11, maxNps: 7, minScore: 0.8 } },
  compose(s) {
    const batucada = { kick: 'X.....X.X.....X.', snare: 'g.x.g.xxg.x.g.xx', hat: 'xxxxxxxxxxxxxxxx' };
    const cavaco = (from, bars, vel = 0.45) => pattern(s, 'pluck', from, bars, 'x.xx.x.x.xx.x.x.', (b) => PROG[b % 4], { vel, len: 0.2 });
    const surdo = (from, bars) => bassLine(s, from, bars, ROOT, 'X.......X.......', { len: 1.2 });
    s.drums(0, 4, { snare: 'x.x.x.xxx.x.x.xx', kick: 'X.......X.......' }); cavaco(2, 2, 0.6);
    s.crash(16);
    s.drums(4, 16, batucada); cavaco(4, 16); surdo(4, 16);
    s.seq('lead', 16, 0.5, MEL, 0.95); s.seq('stab', 48, 0.5, MEL, 0.85);
    s.drums(20, 4, { kick: 'X.....X.X.....X.', snare: 'x.x.x.x.x.x.x.x.' }); surdo(20, 4);
    s.crash(96);
    s.drums(24, 16, batucada); cavaco(24, 16, 0.4); surdo(24, 16);
    s.seq('lead', 96, 0.5, MEL, 1); s.seq('square', 128, 0.5, MEL, 1);
    s.crash(160); s.kick(160); s.stab(160, ['G4', 'B4', 'D5', 'G5'], 2, 1); s.bass(160, 'G1', 2);
  },
};

// CELTIC / 132 BPM: フィドル風の速いメロディ、ハープのアルペジオ、ボウラン(太鼓)のハネるリズム
import { sustain, arp, bassLine } from './kit.js';

const PROG = ['D4+F#4+A4', 'D4+F#4+A4', 'C4+E4+G4', 'D4+F#4+A4', 'G3+B3+D4', 'D4+F#4+A4', 'A3+C#4+E4', 'D4+F#4+A4'];
const ROOT = ['D2', 'D2', 'C2', 'D2', 'G1', 'D2', 'A1', 'D2'];
const REEL =
  'D5 E5 F#5 A5 B5 A5 F#5 A5 | D6 C6 A5 F#5 G5 E5 C5 E5 | D5 E5 F#5 A5 B5 A5 F#5 E5 | D5 F#5 A5 F#5 D5 - - - |' +
  'G5 A5 B5 G5 A5 B5 D6 B5 | A5 F#5 D5 F#5 A5 - F#5 E5 | E5 F#5 G5 A5 B5 C#6 D6 B5 | A5 F#5 E5 F#5 D5 - - - |';

export default {
  id: 'celtic-run',
  urlId: 'myp1q6ab1', // 曲ページのURL (music/myp1q6ab1/)。公開後は変えない
  title: 'Celtic Run',
  artist: 'MUSIC LiDAR',
  genre: 'CELTIC',
  bpm: 132,
  color: '#7dff6d',
  levels: { easy: 3, normal: 6, hard: 8 },
  preview: 48,
  chart: { hard: { minGap: 0.1, maxNps: 8 } },
  compose(s) {
    s.setSwing(1 / 8);
    const harp = (from, bars, vel = 0.4) => arp(s, 'pluck', from, bars, PROG, { step: 0.5, vel, order: [0, 1, 2, 3, 2, 1, 0, 1] });
    const bodhran = { kick: 'X..x..X.X..x..x.', snare: '....g.......g...', hat: 'x.x.x.x.x.x.x.x.' };
    harp(0, 4, 0.6); sustain(s, 'pad', 0, 4, PROG, 0.4);
    s.drums(4, 16, bodhran); bassLine(s, 4, 16, ROOT, 'X.......X.......', { len: 1.5 }); s.ghost(() => harp(4, 16, 0.3));
    s.seq('lead', 16, 0.5, REEL, 0.95); s.seq('lead', 48, 0.5, REEL, 0.95);
    s.drums(20, 4, { kick: 'X.......X.......' }); sustain(s, 'pad', 20, 4, PROG, 0.6);
    s.seq('bell', 80, 1, 'A5 - F#5 - | D6 - - - | B5 - G5 - | A5 - - - |', 0.85);
    s.crash(96, 0.6); s.crash(128, 0.6);
    s.drums(24, 16, { ...bodhran, hat: 'xxxxxxxxxxxxxxxx' }); bassLine(s, 24, 16, ROOT, 'X...X...X...X...'); harp(24, 16, 0.35);
    s.seq('square', 96, 0.5, REEL, 1); s.seq('lead', 128, 0.5, REEL, 1); s.ghost(() => s.seq('bell', 128, 0.5, REEL, 0.3));
    s.kick(160); s.crash(160, 0.6); s.pad(160, ['D4', 'F#4', 'A4'], 3, 0.7); s.lead(160, 'D6', 2); s.bass(160, 'D2', 2);
  },
};

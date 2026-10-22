// BOLLYWOOD / 120 BPM: タブラ風のはねるリズムと、きらびやかなストリングス
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['D4+F4+A4', 'C4+E4+G4', 'Bb3+D4+F4', 'A3+C#4+E4'];
const ROOT = ['D2', 'C2', 'Bb1', 'A1'];
const MEL =
  'D5 E5 F5 . A5 . G5 F5 | E5 - - - C5 - - - | D5 F5 A5 . Bb5 . A5 G5 | A5 - - - C#5 - - - |' +
  'A5 . A5 Bb5 A5 . G5 F5 | G5 . G5 A5 G5 . F5 E5 | F5 . E5 D5 C#5 . E5 . | D5 - - - - - . . |';

export default {
id: 'bollywood-beat',
  urlId: '6ylfpzih2', // 曲ページのURL (music/6ylfpzih2/)。公開後は変えない
  title: 'Bollywood Beat',
  artist: 'MUSIC LiDAR',
  genre: 'BOLLYWOOD',
  bpm: 120,
  color: '#ff7a3d',
  levels: { easy: 2, normal: 5, hard: 9 },
  preview: 48,
  chart: { hard: { minGap: 0.1, maxNps: 7.5 } },
  compose(s) {

    const tabla = { kick: 'X..x..X.X..x....', snare: '...x.....x...x.x', hat: 'xxx.xxx.xxx.xxx.' };
    const strings = (from, bars, vel = 0.5) => sustain(s, 'pad', from, bars, PROG, vel);
    s.drums(0, 4, { snare: '...x.....x...x.x', hat: 'xxx.xxx.xxx.xxx.' }); strings(0, 4, 0.6);
    s.drums(4, 16, tabla); strings(4, 16, 0.35); bassLine(s, 4, 16, ROOT, 'X..x..X.X.......');
    s.seq('lead', 16, 0.5, MEL, 0.95); s.seq('pluck', 48, 0.5, MEL, 0.95);
    strings(20, 4, 0.8); s.seq('square', 80, 0.25, 'D5 E5 F5 G5 A5 G5 F5 E5 '.repeat(8), 0.7);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, { ...tabla, kick: 'X..x..X.X..x..X.' }); strings(24, 16, 0.4); bassLine(s, 24, 16, ROOT, 'X..x..X.X..x....');
    s.seq('lead', 96, 0.5, MEL, 1); s.seq('supersaw', 128, 0.5, MEL, 0.9);
    s.crash(160); s.kick(160); s.pad(160, ['D4', 'F4', 'A4', 'D5'], 3, 0.9); s.lead(160, 'D6', 2); s.bass(160, 'D2', 2);
  },
};

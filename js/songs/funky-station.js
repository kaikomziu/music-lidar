// FUNK / 108 BPM: 16分のカッティング、スラップベース、ホーンのキメ
import { pattern, bassLine } from './kit.js';

const PROG = ['E4+G4+B4+D5', 'E4+G4+B4+D5', 'A4+C#5+E5+G5', 'A4+C#5+E5+G5'];
const ROOT = ['E2', 'E2', 'A2', 'A2'];
const HORN = ['E4+G4+B4', 'E4+G4+B4', 'E4+A4+C#5', 'E4+A4+C#5'];
const MEL =
  'B5 - - . G5 - E5 - | D5 - E5 - G5 - . . | C#6 - - . A5 - G5 - | E5 - G5 - A5 - . . |' +
  'B5 - - . D6 - B5 - | A5 - G5 - E5 - . . | C#6 - E6 - D6 - C#6 - | A5 - - - - - . . |';

export default {
  id: 'funky-station',
  urlId: 'm6ou2c8pr', // 曲ページのURL (music/m6ou2c8pr/)。公開後は変えない
  title: 'Funky Station',
  artist: 'MUSIC LiDAR',
  genre: 'FUNK',
  bpm: 108,
  color: '#ffb000',
  levels: { easy: 2, normal: 5, hard: 9 },
  preview: 48,
  chart: { hard: { minGap: 0.105, maxNps: 7.5 } },
  compose(s) {
    const cut = (from, bars, vel = 0.45) => pattern(s, 'clav', from, bars, 'x.xx.x.xx.x.x.xx', (b) => PROG[b % 4], { vel, len: 0.15 });
    const slap = (from, bars) => bassLine(s, from, bars, ROOT, 'X..o..X.X.o..Xo.', { type: 'slap' });
    const horns = (from, bars, vel = 0.7) => pattern(s, 'stab', from, bars, 'X.....x...x.X...', (b) => HORN[b % 4], { vel, len: 0.3 });
    const funk = { kick: 'X.....x...X..x..', snare: '....X..g.g..X..g', hat: 'xgxgxgxgxgxgxgxo' };
    s.drums(0, 4, { hat: 'xgxgxgxgxgxgxgxg', kick: 'X.........X.....' }); cut(0, 4, 0.55);
    s.crash(16);
    s.drums(4, 8, funk); slap(4, 8); s.ghost(() => cut(4, 8, 0.35));
    s.seq('lead', 16, 0.5, MEL, 0.9);
    s.drums(12, 4, funk); slap(12, 4); horns(12, 4);
    s.crash(64);
    s.drums(16, 8, funk); slap(16, 8); s.ghost(() => cut(16, 8, 0.35)); horns(16, 8, 0.45);
    s.seq('square', 64, 0.5, MEL, 0.95);
    s.drums(24, 4, { kick: 'X.........X.....', snare: '....X.......X...' }); slap(24, 4);
    s.crash(112); s.crash(144, 0.8);
    s.drums(28, 16, funk); slap(28, 16); cut(28, 16, 0.35); horns(28, 16, 0.4);
    s.seq('lead', 112, 0.5, MEL, 1); s.seq('square', 144, 0.5, MEL, 1);
    s.crash(176); s.kick(176); s.slap(176, 'E2', 1); s.stab(176, ['E4', 'G4', 'B4', 'D5'], 2, 1);
  },
};

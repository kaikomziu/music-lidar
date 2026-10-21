// TOY POP / 124 BPM: おもちゃ箱が動き出す。木琴風のプラックと小太鼓(初心者向け)
import { pattern, bassLine } from './kit.js';

const PROG = ['C4+E4+G4', 'F4+A4+C5', 'G4+B4+D5', 'C4+E4+G4'];
const ROOT = ['C2', 'F1', 'G1', 'C2'];
const MEL =
  'C5 - E5 - G5 - C6 - | A5 - F5 - C5 - - - | D5 - G5 - B5 - D6 - | C6 - - - G5 - - - |' +
  'E5 - G5 - C6 - E6 - | F6 - C6 - A5 - F5 - | G5 - B5 - D6 - B5 - | C6 - - - - - . . |';

export default {
  id: 'toy-box-march',
  urlId: 'nlg5hxt23', // 曲ページのURL (music/nlg5hxt23/)。公開後は変えない
  title: 'Toy Box March',
  artist: 'MUSIC LiDAR',
  genre: 'TOY POP',
  bpm: 124,
  color: '#ff9a5c',
  levels: { easy: 1, normal: 4, hard: 6 },
  preview: 16,
  chart: { easy: { maxNps: 1.6 }, hard: { minGap: 0.13, maxNps: 5 } },
  compose(s) {
    const xylo = (from, bars, vel = 0.4) => pattern(s, 'chip', from, bars, 'x...x...x...x...', (b) => PROG[b % 4].split('+').slice(0, 1).map((n) => n.replace(/\d/, (d) => +d + 1)), { vel, len: 0.3 });
    const toy = { kick: 'X.......X.......', snare: '..g.x.g...g.x.g.', hat: '....x.......x...' };
    s.drums(0, 4, { snare: 'x.x.x.x.x.x.xxxx' }); xylo(0, 4, 0.6);
    s.drums(4, 16, toy); s.ghost(() => xylo(4, 16, 0.3)); bassLine(s, 4, 16, ROOT, 'X...f...X...f...');
    s.seq('pluck', 16, 0.5, MEL, 0.95); s.seq('bell', 48, 0.5, MEL, 0.9);
    s.drums(20, 4, { snare: 'x.x.x.x.x.x.x.x.' }); pattern(s, 'stab', 20, 4, 'x...x...x...x...', (b) => PROG[b % 4], { vel: 0.5, len: 0.3 });
    s.crash(96);
    s.drums(24, 8, toy); s.ghost(() => xylo(24, 8, 0.3)); bassLine(s, 24, 8, ROOT, 'X.f.X.f.X.f.X.f.');
    s.seq('square', 96, 0.5, MEL, 1); s.ghost(() => s.seq('bell', 96, 0.5, MEL, 0.3));
    s.crash(128); s.kick(128); s.stab(128, ['C4', 'E4', 'G4', 'C5'], 2, 1); s.bass(128, 'C2', 2);
  },
};

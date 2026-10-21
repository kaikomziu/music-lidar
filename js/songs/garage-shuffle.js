// UK GARAGE / 132 BPM: ハネる2ステップのビートと、切り刻んだ和音、ぶーんと鳴るベース
import { pattern, sustain, bassLine } from './kit.js';

const PROG = ['F#4+A4+C#5+E5', 'D4+F#4+A4+C#5', 'E4+G#4+B4', 'C#4+E4+G#4+B4'];
const ROOT = ['F#1', 'D2', 'E2', 'C#2'];
const MEL =
  'C#6 . C#6 . A5 - . . | F#5 . A5 . C#6 . E6 . | B5 . B5 . G#5 - . . | E5 . G#5 . B5 . C#6 . |' +
  'C#6 . E6 . C#6 . A5 . | A5 - F#5 - . . A5 . | G#5 - B5 - E6 . D#6 . | C#6 - - - . . . . |';

export default {
  id: 'garage-shuffle',
  urlId: 'j1gncrhju', // 曲ページのURL (music/j1gncrhju/)。公開後は変えない
  title: 'Garage Shuffle',
  artist: 'MUSIC LiDAR',
  genre: 'UK GARAGE',
  bpm: 132,
  color: '#5effc6',
  levels: { easy: 3, normal: 5, hard: 8 },
  preview: 64,
  chart: { hard: { minGap: 0.1, maxNps: 8 } },
  compose(s) {
    s.setSwing(1 / 10);
    const twoStep = { kick: 'X.........X..x..', snare: '....X.......X...', hat: '..x...x...x...xx' };
    const chops = (from, bars, vel = 0.45) => pattern(s, 'stab', from, bars, 'x..x...x..x...x.', (b) => PROG[b % 4], { vel, len: 0.2 });
    sustain(s, 'pad', 0, 4, PROG, 0.6); chops(2, 2, 0.5);
    s.drums(4, 8, twoStep); chops(4, 8); bassLine(s, 4, 8, ROOT, 'X.....X...X..X..', { type: 'reese' });
    s.seq('pluck', 16, 0.5, MEL, 0.9);
    s.drums(12, 8, { ...twoStep, hat: 'x.x.x.x.x.x.x.xx' }); s.ghost(() => chops(12, 8, 0.35)); bassLine(s, 12, 8, ROOT, 'X.....X...X..X..', { type: 'reese' });
    s.seq('keys', 48, 0.5, MEL, 0.95);
    sustain(s, 'pad', 20, 4, PROG, 0.7); s.seq('bell', 80, 1, 'C#6 - - - | A5 - - - | B5 - - - | G#5 - - - |', 0.8);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, { ...twoStep, hat: 'x.x.x.x.x.x.x.xx', ride: '..x...x...x...x.' }); chops(24, 16, 0.4); bassLine(s, 24, 16, ROOT, 'X.....X...X..X..', { type: 'reese' });
    s.seq('lead', 96, 0.5, MEL, 1); s.seq('pluck', 128, 0.5, MEL, 1);
    s.kick(160); s.crash(160, 0.6); s.pad(160, ['F#4', 'A4', 'C#5', 'E5'], 3, 0.8); s.reese(160, 'F#1', 2);
  },
};

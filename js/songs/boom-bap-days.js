// HIP HOP / 90 BPM: 太いキックとスネアの「ブーンバップ」、ジャジーなサンプル風ピアノ
import { pattern, bassLine } from './kit.js';

const PROG = ['A3+C4+E4+G4', 'D4+F4+A4+C5', 'G3+B3+D4+F4', 'C4+E4+G4+B4'];
const ROOT = ['A1', 'D2', 'G1', 'C2'];
const HOOK =
  'E5 - G5 - A5 - . . | C6 - A5 - . . . . | B5 - A5 - G5 - F5 - | E5 - - - . . . . |' +
  'E5 - G5 - A5 - C6 - | D6 - C6 - A5 - . . | G5 - B5 - D6 - C6 - | B5 - - - . . . . |';

export default {
  id: 'boom-bap-days',
  urlId: 'epuuxrkc6', // 曲ページのURL (music/epuuxrkc6/)。公開後は変えない
  title: 'Boom Bap Days',
  artist: 'MUSIC LiDAR',
  genre: 'HIP HOP',
  bpm: 90,
  color: '#e0c68a',
  levels: { easy: 2, normal: 3, hard: 5 },
  preview: 32,
  chart: { hard: { minGap: 0.12, maxNps: 5.5 } },
  compose(s) {
    s.setSwing(1 / 8);
    const sample = (from, bars, vel = 0.5) => pattern(s, 'keys', from, bars, 'x.....x...x.....', (b) => PROG[b % 4], { vel, len: 0.5 });
    const bap = { kick: 'X.......X.X.....', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const bap2 = { kick: 'X......xX.X.....', snare: '....X.......X..g', hat: 'x.xxx.x.x.xxx.x.' };
    sample(0, 4, 0.6); s.drums(2, 2, { hat: 'x.x.x.x.x.x.x.x.' });
    s.drums(4, 8, bap); sample(4, 8); bassLine(s, 4, 8, ROOT, 'X.......X.X.....', { len: 0.7 });
    s.seq('bell', 32, 0.5, HOOK, 0.9);
    s.drums(12, 8, bap2); s.ghost(() => sample(12, 8, 0.4)); bassLine(s, 12, 8, ROOT, 'X......xX.X.....', { len: 0.6 });
    s.seq('square', 48, 0.5, HOOK, 0.95);
    // スクラッチ風の休み
    s.drums(20, 4, { kick: 'X.......X.......', snare: '....X.......X...' }); sample(20, 4, 0.6);
    s.seq('keys', 80, 0.25, 'A5 . A5 A5 . . C6 . '.repeat(8), 0.8);
    s.drums(24, 8, bap2); s.ghost(() => sample(24, 8, 0.4)); bassLine(s, 24, 8, ROOT, 'X......xX.X.....', { len: 0.6 });
    s.seq('bell', 96, 0.5, HOOK, 1); s.ghost(() => s.seq('keys', 96, 0.5, HOOK, 0.35));
    s.kick(128); s.snare(129); ['A3', 'C4', 'E4', 'G4'].forEach((n) => s.keys(128, n, 3, 0.7)); s.bass(128, 'A1', 2);
  },
};

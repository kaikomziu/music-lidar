// LOUNGE / 90 BPM: 泡風呂みたいにのんびり。エレピとビブラフォン風のベル(初心者向け)
import { pattern, sustain, bassLine } from './kit.js';

const PROG = ['F3+A3+C4+E4', 'D3+F3+A3+C4', 'G3+Bb3+D4+F4', 'C3+E3+G3+Bb3'];
const ROOT = ['F1', 'D2', 'G1', 'C2'];
const MEL =
  'A5 - - - C6 - - - | A5 - G5 - F5 - - - | D5 - - - F5 - A5 - | G5 - - - - - . . |' +
  'A5 - C6 - E6 - - - | D6 - C6 - A5 - - - | Bb5 - A5 - G5 - D5 - | E5 - - - - - . . |';

export default {
  id: 'bubble-bath',
  urlId: '1wltyw2u7', // 曲ページのURL (music/1wltyw2u7/)。公開後は変えない
  title: 'Bubble Bath',
  artist: 'MUSIC LiDAR',
  genre: 'LOUNGE',
  bpm: 90,
  color: '#a8f0ff',
  levels: { easy: 1, normal: 2, hard: 4 },
  preview: 16,
  chart: { easy: { maxNps: 1.3 }, normal: { maxNps: 2.2, minGap: 0.3 }, hard: { minGap: 0.18, maxNps: 3.6 } },
  compose(s) {
    s.setSwing(1 / 8);
    const keys = (from, bars, vel = 0.4) => pattern(s, 'keys', from, bars, 'x.....x.....x...', (b) => PROG[b % 4], { vel, len: 0.9 });
    const brush = { kick: 'X.......X.......', snare: 'g.g.g.g.g.g.g.g.', ride: 'x...x.x.x...x.x.' };
    keys(0, 4, 0.5); sustain(s, 'pad', 0, 4, PROG, 0.4);
    s.drums(4, 16, brush); keys(4, 16); bassLine(s, 4, 16, ROOT, 'X.......X...x...', { type: 'upright' });
    s.seq('bell', 16, 0.5, MEL, 0.9); s.seq('keys', 48, 0.5, MEL, 0.9);
    sustain(s, 'pad', 20, 4, PROG, 0.6); s.seq('bell', 80, 1, 'C6 - - - | A5 - - - | F5 - - - | E5 - - - |', 0.8);
    s.drums(24, 8, brush); s.ghost(() => keys(24, 8, 0.35)); bassLine(s, 24, 8, ROOT, 'X.......X...x...', { type: 'upright' });
    s.seq('bell', 96, 0.5, MEL, 1); s.ghost(() => s.seq('keys', 96, 0.5, MEL, 0.35));
    ['F3', 'A3', 'C4', 'E4', 'G4'].forEach((n) => s.keys(128, n, 4, 0.7)); s.upright(128, 'F1', 3); s.bell(128, 'A5', 3);
  },
};

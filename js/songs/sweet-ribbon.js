// CANDY POP / 128 BPM: バレンタイン限定の甘いポップ。王道進行(IV→V→iii→vi)にベルとキラキラしたアルペジオ
// 期間限定(js/event.js の valentine: 2/1〜2/14)。バレンタインイベントのスコアアタック曲(js/season.js)
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['F4+A4+C5+E5', 'G4+B4+D5+F5', 'E4+G4+B4+D5', 'A3+C4+E4+G4'];
const ROOT = ['F1', 'G1', 'E1', 'A1'];
const MEL =
  'E5 - G5 - A5 G5 E5 - | D5 - E5 - G5 - - - | E5 - G5 - A5 - C6 - | B5 - A5 - G5 - . . |' +
  'A5 - C6 - D6 - C6 A5 | G5 - E5 - G5 - A5 - | F5 - E5 - D5 - E5 - | C5 - - - - - . . |';
const HOOK = 'C6 - B5 - C6 - E6 - | D6 - - - C6 - B5 - | C6 - B5 - A5 - G5 - | A5 - - - - - . . |';

export default {
  id: 'sweet-ribbon',
  urlId: '8rxb4s4gc', // 曲ページのURL (music/8rxb4s4gc/)。公開後は変えない
  title: 'Sweet Ribbon',
  artist: 'MUSIC LiDAR',
  genre: 'CANDY POP',
  bpm: 128,
  color: '#ff7eb6',
  levels: { easy: 2, normal: 5, hard: 8 },
  preview: 96,
  event: 'valentine', // 期間限定(js/event.js)
  chart: { easy: { maxNps: 1.6 }, normal: { maxNps: 3.0 }, hard: { minGap: 0.13, maxNps: 5.0 } },
  compose(s) {
    const comp = (from, bars, vel = 0.35) => s.ghost(() => pattern(s, 'stab', from, bars, 'x..x..x.x..x..x.', (b) => PROG[b % 4], { vel, len: 0.25 }));
    const beat = { kick: 'X...X...X...X...', snare: '....x.......x...', hat: '..x...x...x...x.' };
    // イントロ: パッドとキラキラしたアルペジオ
    sustain(s, 'pad', 0, 4, PROG, 0.5); arp(s, 'bell', 0, 4, PROG, { step: 0.5, vel: 0.45, order: [0, 2, 1, 3] });
    // Aメロ
    s.drums(4, 16, beat); comp(4, 16); bassLine(s, 4, 16, ROOT, 'X..xX...X..xX.x.');
    s.seq('square', 16, 0.5, MEL, 0.85); arp(s, 'keys', 4, 16, PROG, { step: 1, vel: 0.35, order: [0, 1, 2, 3] });
    // つなぎ
    sustain(s, 'pad', 20, 4, PROG, 0.6); s.seq('bell', 80, 1, 'E6 - - - | D6 - - - | B5 - - - | C6 - - - |', 0.75); build(s, 22);
    // サビ
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, { ...beat, hat: 'x.xxx.xxx.xxx.xx', snare: '....x.......x..x' }); comp(24, 16, 0.42); bassLine(s, 24, 16, ROOT, 'X.xxX.x.X.xxX.xo');
    s.seq('lead', 96, 0.5, HOOK + HOOK, 0.95); s.seq('bell', 112, 0.5, MEL, 0.6); s.seq('square', 128, 0.5, MEL, 1);
    arp(s, 'bell', 24, 16, PROG, { step: 0.25, vel: 0.3, order: [0, 1, 2, 3, 2, 1] });
    // おわり
    s.crash(160); s.kick(160); s.stab(160, ['F4', 'A4', 'C5', 'E5'], 3, 0.9); s.bass(160, 'F1', 3);
  },
};

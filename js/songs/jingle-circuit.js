// CHRISTMAS POP / 150 BPM: 鈴が鳴りっぱなしの、にぎやかなクリスマスポップ(期間限定: 12/1〜1/31)
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['C4+E4+G4', 'A3+C4+E4', 'F3+A3+C4', 'G3+B3+D4'];
const ROOT = ['C2', 'A1', 'F1', 'G1'];
// サビの和音(8小節で1周): F G Em Am F G C C
const HP = ['F3+A3+C4', 'G3+B3+D4', 'E3+G3+B3', 'A3+C4+E4', 'F3+A3+C4', 'G3+B3+D4', 'C4+E4+G4', 'C4+E4+G4'];
const HROOT = ['F1', 'G1', 'E1', 'A1', 'F1', 'G1', 'C2', 'C2'];
const MEL =
  'G4 - C5 - E5 D5 C5 - | A4 - C5 - F5 E5 D5 - | F4 - A4 - D5 C5 B4 A4 | G4 - B4 - D5 - - - |' +
  'G4 - C5 - E5 - G5 - | A5 G5 F5 E5 D5 - C5 - | F5 E5 D5 C5 B4 - C5 D5 | C5 - - - . . . . |';
const PRE = 'F5 - E5 - D5 - C5 - | D5 - E5 - F5 - G5 - | A5 - G5 - F5 - E5 - | D5 - - - G5 - - - |';
const HOOK =
  'A5 - G5 - F5 - C5 - | D5 - E5 F5 G5 - - - | G5 - E5 - B4 - E5 - | A5 - G5 - E5 - - - |' +
  'F5 - A5 - C6 - A5 - | B5 - A5 - G5 - D5 - | E5 - G5 - C6 - B5 - | C6 - - - - - . . |';
// 間奏: 鈴のメロディ
const BELLS = 'E6 . G6 . C7 . G6 . | A6 . F6 . D6 . B5 . | C6 . E6 . G6 . E6 . | D6 - - - - - - - |';

export default {
  id: 'jingle-circuit',
  urlId: '3t1i5b2dl', // 曲ページのURL (music/3t1i5b2dl/)。公開後は変えない
  title: 'Jingle Circuit',
  artist: 'MUSIC LiDAR',
  genre: 'CHRISTMAS POP',
  bpm: 150,
  color: '#ff3b4e',
  event: 'xmas', // 期間限定(js/event.js)
  levels: { easy: 3, normal: 6, hard: 9 },
  preview: 64,
  chart: { normal: { minGap: 0.2 }, hard: { minGap: 0.12, maxNps: 7, chordP: 0.35 } },
  compose(s) {
    // 鈴(ずっとシャンシャン鳴る。譜面には乗せない)
    const sleigh = (from, bars, pat = 'x.xxx.xxx.xxx.xx') => s.ghost(() => s.drums(from, bars, { hat: pat }));
    const hookChords = (from, bars, vel) => {
      for (let b = from; b < from + bars; b++) s.pad(b * 4, HP[(b - from) % 8].split('+'), 4, vel);
    };
    const hookBass = (from, bars) => {
      for (let b = from; b < from + bars; b++) {
        const r = HROOT[(b - from) % 8];
        [0, 1.5, 2, 3].forEach((k, i) => s.upright(b * 4 + k, r, i === 1 ? 0.4 : 0.9, i === 0 ? 1 : 0.85));
      }
    };
    const pop = { kick: 'X.......X.x.....', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const four = { kick: 'X...X...X...X...', clap: '....X.......X...', hat: '..x...x...x...x.', snare: '...............g' };

    // イントロ(0〜3): 鈴とピアノ
    sleigh(0, 4);
    pattern(s, 'keys', 0, 4, 'x..x..x.x..x..x.', (b) => PROG[b % 4], { vel: 0.45, len: 0.3 });
    s.seq('bell', 8, 0.5, BELLS, 0.7);
    // Aメロ(4〜11)
    s.crash(16, 0.6);
    sleigh(4, 8);
    s.drums(4, 8, pop);
    bassLine(s, 4, 8, ROOT, 'X..x..x.X..x....', { type: 'upright', vel: 0.9 });
    pattern(s, 'keys', 4, 8, '..x...x...x...x.', (b) => PROG[b % 4], { vel: 0.35, len: 0.25 });
    s.seq('keys', 16, 0.5, MEL, 0.9);
    // Bメロ(12〜15)
    sustain(s, 'pad', 12, 4, PROG, 0.45);
    s.drums(12, 2, { kick: 'X...X...X...X...', hat: 'xxxxxxxxxxxxxxxx' });
    s.seq('pluck', 48, 0.5, PRE, 0.85);
    sleigh(12, 4, 'xxxxxxxxxxxxxxxx');
    build(s, 14);
    // サビ(16〜23)
    const chorus = (bar, lead = 'lead', extra = false) => {
      s.crash(bar * 4);
      sleigh(bar, 8, 'xxxxxxxxxxxxxxxx');
      s.drums(bar, 8, four);
      hookChords(bar, 8, 0.4);
      hookBass(bar, 8);
      s.seq(lead, bar * 4, 0.5, HOOK, 0.95);
      s.ghost(() => arp(s, 'bell', bar, 8, HP.map((_, i) => HP[(i - bar % 8 + 8) % 8]), { step: 0.5, vel: 0.3, order: [0, 1, 2, 3], oct: 1 }));
      if (extra) s.ghost(() => s.seq('bell', bar * 4, 0.5, HOOK, 0.35));
    };
    chorus(16);
    // 間奏(24〜27): 鈴のメロディ
    sleigh(24, 4);
    s.drums(24, 4, pop);
    bassLine(s, 24, 4, ROOT, 'X...X...X...X...', { type: 'upright', vel: 0.85 });
    s.seq('bell', 96, 0.5, BELLS, 0.95);
    // Aメロ2(28〜35)・Bメロ2(36〜39)
    sleigh(28, 8);
    s.drums(28, 8, { ...pop, hat: 'x.xxx.xxx.xxx.xx' });
    bassLine(s, 28, 8, ROOT, 'X..x..x.X..x..x.', { type: 'upright', vel: 0.9 });
    s.seq('pluck', 112, 0.5, MEL, 0.9);
    s.ghost(() => s.seq('keys', 112, 0.5, MEL, 0.35));
    sustain(s, 'pad', 36, 4, PROG, 0.45);
    s.drums(36, 2, { kick: 'X...X...X...X...', hat: 'xxxxxxxxxxxxxxxx' });
    s.seq('keys', 144, 0.5, PRE, 0.9);
    build(s, 38);
    // サビ2(40〜47)
    chorus(40, 'lead', true);
    // ブリッジ(48〜55): 静かに。雪の夜
    s.downer(192, 4);
    sustain(s, 'pad', 48, 8, PROG, 0.55);
    arp(s, 'bell', 48, 8, PROG, { step: 0.5, vel: 0.45, order: [0, 1, 2, 3, 2, 1, 0, 2], oct: 1 });
    s.seq('keys', 208, 1, 'E5 - G5 - | C6 - - - | A5 - G5 - | F5 - E5 - | D5 - E5 - | F5 - A5 - | G5 - - - | G5 - B5 - |', 0.8);
    s.ghost(() => s.drums(52, 2, { kick: 'X.......X.......' }));
    build(s, 54);
    // ラストサビ(56〜63): 半音上げずに、音を厚く
    chorus(56, 'supersaw', true);
    s.ghost(() => s.seq('lead', 224, 0.5, HOOK, 0.4));
    // 締め
    s.crash(256); s.kick(256); s.clap(256);
    s.pad(256, ['C4', 'E4', 'G4', 'C5'], 3, 0.7);
    s.bell(256, 'C7', 3, 0.9); s.bell(256.5, 'G6', 2.5, 0.6);
    s.upright(256, 'C2', 2.5);
  },
};

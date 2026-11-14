// FLAMENCO / 124 BPM: 情熱のルンバ・フラメンカ。アンダルシア進行(Am-G-F-E)に、かき鳴らすギターと手拍子(パルマ)
import { pattern, sustain, bassLine, arp, build, ch } from './kit.js';

const PROG = ['A3+C4+E4+A4', 'G3+B3+D4+G4', 'F3+A3+C4+F4', 'E3+G#3+B3+E4'];
const ROOT = ['A1', 'G1', 'F1', 'E1'];
const PAD = ['A3+C4+E4', 'G3+B3+D4', 'F3+A3+C4', 'E3+G#3+B3'];
const MEL =
  'E5 - F5 E5 D5 C5 B4 A4 | B4 - D5 - G5 - F5 E5 | F5 - E5 F5 A5 - G5 F5 | E5 - - - G#4 - B4 - |' +
  'A5 - G5 F5 E5 - C5 - | D5 - B4 - G5 - - F5 | E5 F5 E5 D5 C5 - A4 - | G#4 - B4 - E5 - - - |';
// サビ: 高く歌い上げる
const HOOK =
  'A5 - - C6 B5 A5 G5 - | G5 - - B5 A5 G5 F5 - | F5 - - A5 G5 F5 E5 - | E5 F5 G#5 A5 B5 - - - |' +
  'C6 - B5 A5 B5 - A5 G5 | B5 - A5 G5 F5 - E5 - | F5 E5 F5 G5 A5 - F5 - | E5 - - - - - . . |';

// ギターのかき鳴らし(ラスゲアード): 和音を少しずつずらして鳴らす。down=低い弦から
function strum(s, beat, chord, vel, down = true) {
  const notes = ch(chord);
  const list = down ? notes : [...notes].reverse();
  list.forEach((n, k) => s.pluck(beat + k * 0.03, n, 0.3, vel * (k === 0 ? 1 : 0.8)));
}
// 1小節ぶんのかき鳴らし。pat: D=下 U=上 .=休(16ステップ)
function strumBars(s, from, bars, pat, vel = 0.55) {
  const p = pat.replace(/[\s|]/g, '');
  for (let b = from; b < from + bars; b++) {
    for (let i = 0; i < 16; i++) {
      const c = p[i];
      if (c === 'D' || c === 'U') strum(s, b * 4 + i / 4, PROG[b % 4], vel * (i % 4 === 0 ? 1 : 0.8), c === 'D');
    }
  }
}

export default {
  id: 'crimson-rumba',
  urlId: '73sdwf8fo', // 曲ページのURL (music/73sdwf8fo/)。公開後は変えない
  title: 'Crimson Rumba',
  artist: 'MUSIC LiDAR',
  genre: 'FLAMENCO',
  bpm: 124,
  color: '#ff3d4f',
  levels: { easy: 3, normal: 6, hard: 10 },
  preview: 32,
  chart: { normal: { minGap: 0.17 }, hard: { minGap: 0.1, maxNps: 8.5, chordP: 0.4 } },
  compose(s) {
    const RUMBA = 'D..U..D.D.UD..U.';
    const palmas = { kick: 'X.....x.X.....x.', clap: '....X..g....X.g.', hat: 'x.g.x.g.x.g.x.g.' };
    // イントロ: ギターだけ → 手拍子が入る
    strumBars(s, 0, 4, 'D.......D...D...', 0.5);
    strumBars(s, 4, 4, RUMBA, 0.5);
    s.drums(4, 2, { clap: '....X.......X...' });
    build(s, 6);
    // Aメロ
    s.crash(32);
    s.drums(8, 16, palmas);
    strumBars(s, 8, 16, RUMBA, 0.5);
    bassLine(s, 8, 16, ROOT, 'X..x..f.X..x..f.', { type: 'upright', vel: 0.9 });
    s.seq('keys', 32, 0.5, MEL + MEL, 0.9);
    // ブレイク: ギターの独奏(ファルセータ)
    s.crash(96, 0.7);
    sustain(s, 'pad', 24, 8, PAD, 0.5);
    arp(s, 'pluck', 24, 6, PROG, { step: 0.25, vel: 0.55, order: [0, 2, 1, 3, 2, 1, 3, 4] });
    s.drums(24, 6, { clap: '....X.......X...' });
    s.downer(96, 4);
    build(s, 30);
    // サビ
    s.crash(128); s.crash(160, 0.8);
    s.drums(32, 16, { kick: 'X.....x.X.....x.', clap: '....X..x....X.xx', hat: 'xgxgxgxgxgxgxgxg', snare: '..........g....g' });
    strumBars(s, 32, 16, 'D.UD.UD.D.UD.UDU', 0.55);
    bassLine(s, 32, 16, ROOT, 'X..x..f.X.ox..f.', { type: 'upright', vel: 0.95 });
    s.seq('lead', 128, 0.5, HOOK + HOOK, 0.85);
    sustain(s, 'pad', 32, 16, PAD, 0.45);
    pattern(s, 'stab', 40, 8, 'X.....X.....X...', (b) => PAD[b % 4], { vel: 0.4, len: 0.25 });
    // 締め: ジャン!
    s.crash(192); s.kick(192); s.clap(192);
    strum(s, 192, 'A2+E3+A3+C4+E4+A4', 0.8);
    s.upright(192, 'A1', 2.5);
    s.stab(192, ['A3', 'C4', 'E4'], 2, 0.8);
  },
};

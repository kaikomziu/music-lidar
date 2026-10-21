// BIG ROOM / 128 BPM: 長いビルドアップから、太いキックと短いリードが鳴るドロップ
import { pattern, sustain, bassLine, build } from './kit.js';

const PROG = ['A3+C4+E4', 'F3+A3+C4', 'C4+E4+G4', 'G3+B3+D4'];
const ROOT = ['A1', 'F1', 'C2', 'G1'];
// ドロップの短いリード(ビッグルームらしい「ダッ・ダッ」)
const DROP =
  'A5 . . A5 . . C6 . | . . A5 . G5 . E5 . | F5 . . F5 . . A5 . | . . C6 . B5 . G5 . |' +
  'C6 . . C6 . . E6 . | . . C6 . B5 . G5 . | D6 . . D6 . . B5 . | G5 . A5 . B5 . D6 . |';
const BREAK =
  'E5 - - - A5 - - - | C6 - - - B5 - A5 - | F5 - - - A5 - - - | C6 - - - D6 - - - |';

export default {
  id: 'big-room-blast',
  urlId: 'n0197vaua', // 曲ページのURL (music/n0197vaua/)。公開後は変えない
  title: 'Big Room Blast',
  artist: 'MUSIC LiDAR',
  genre: 'BIG ROOM',
  bpm: 128,
  color: '#ff5ef2',
  levels: { easy: 3, normal: 6, hard: 10 },
  preview: 96,
  sidechain: true,
  chart: { hard: { minGap: 0.1, maxNps: 8, chordP: 0.45 } },
  compose(s) {
    const four = { kick: 'X...X...X...X...', hat: '..x...x...x...x.', clap: '....x.......x...' };
    const drop = { hardkick: 'X...X...X...X...', clap: '....X.......X...', hat: 'g.x.g.x.g.x.g.xo' };
    s.drums(0, 8, four); bassLine(s, 4, 4, ROOT, '..X...X...X...X.');
    pattern(s, 'pluck', 0, 8, 'x..x..x...x..x..', (b) => PROG[b % 4], { vel: 0.5, len: 0.2 });
    // ブレイク
    s.downer(32, 4);
    sustain(s, 'pad', 8, 8, PROG, 0.8); s.seq('supersaw', 32, 0.5, BREAK + BREAK, 0.8);
    s.drums(12, 2, { kick: 'X...X...X...X...' }); build(s, 14);
    // ドロップ
    s.crash(64); s.crash(96, 0.8);
    s.drums(16, 16, drop); bassLine(s, 16, 16, ROOT, 'X.X.X.X.X.X.X.X.'); s.seq('lead', 64, 0.5, DROP, 1); s.seq('supersaw', 96, 0.5, DROP, 1);
    s.ghost(() => s.seq('supersaw', 64, 0.5, DROP, 0.4));
    // ブレイク2 → ドロップ2
    s.downer(128, 4);
    sustain(s, 'pad', 32, 6, PROG, 0.8); s.seq('bell', 128, 0.5, BREAK, 0.85); build(s, 36, 2);
    s.crash(152); s.crash(184, 0.8);
    s.drums(38, 16, drop); bassLine(s, 38, 16, ROOT, 'X.X.X.X.X.X.X.X.'); s.seq('supersaw', 152, 0.5, DROP, 1); s.seq('lead', 184, 0.5, DROP, 1);
    s.crash(216); s.hardkick(216); s.stab(216, ['A4', 'C5', 'E5', 'A5'], 3, 1); s.bass(216, 'A1', 2);
  },
};

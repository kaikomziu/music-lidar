// CITY POP / 112 BPM: 夜の街を走るスラップベースとエレピ、きらきらのシンセ
const PROG = ['Bb', 'A', 'G', 'F'];
const TONE = { Bb: ['Bb1', 'Bb2', 'F2'], A: ['A1', 'A2', 'E2'], G: ['G1', 'G2', 'D2'], F: ['F1', 'F2', 'C2'] };
const KEYS = { Bb: ['D4', 'F4', 'A4'], A: ['C4', 'E4', 'G4'], G: ['Bb3', 'D4', 'F4'], F: ['A3', 'C4', 'E4'] };
// 16分: R=低いルート o=1オクターブ上 f=5度
const SLAP = ['R', '.', '.', 'R', '.', '.', 'o', '.', 'R', '.', 'f', 'o', '.', '.', 'R', '.'];
const KEY_PAT = '..x...x...x..x..';
const VERSE =
  'F5 - - E5 D5 - C5 - | E5 - - - C5 - A4 - | D5 - F5 - Bb5 - A5 G5 | A5 - - - - - . . |' +
  'F5 - - E5 D5 - C5 - | E5 - - G5 - - E5 - | D5 - C5 - Bb4 - C5 - | A4 - - - - - . . |';
const CHORUS =
  'D6 - C6 - A5 - C6 - | C6 - - - A5 G5 E5 - | F5 - G5 - Bb5 - A5 - | A5 - G5 - F5 - - - |' +
  'D6 - C6 - A5 - C6 - | E6 - D6 - C6 - A5 - | Bb5 - A5 - G5 - F5 G5 | F5 - - - - - . . |';

export default {
  id: 'midnight-avenue',
  urlId: '0eitwz3rd', // 曲ページのURL (music/0eitwz3rd/)。公開後は変えない
  title: 'Midnight Avenue',
  artist: 'MUSIC LiDAR',
  genre: 'CITY POP',
  bpm: 112,
  color: '#ff8a7a',
  levels: { easy: 2, normal: 5, hard: 9 },
  preview: 80,
  chart: { hard: { minGap: 0.105, maxNps: 7.5 } },
  compose(s) {
    const slap = (from, bars) => {
      for (let b = from; b < from + bars; b++) {
        const [lo, hi, f] = TONE[PROG[b % 4]];
        SLAP.forEach((k, i) => {
          if (k === '.') return;
          s.slap(b * 4 + i / 4, k === 'R' ? lo.replace(/1$/, '2') : k === 'o' ? hi.replace(/2$/, '3') : f, 0.22, i === 0 ? 1 : 0.8);
        });
      }
    };
    const keys = (from, bars, vel = 0.55) => {
      for (let b = from; b < from + bars; b++) {
        const c = KEYS[PROG[b % 4]];
        [...KEY_PAT].forEach((ch, i) => { if (ch === 'x') c.forEach((n) => s.keys(b * 4 + i / 4, n, 0.35, vel)); });
      }
    };
    const pad = (from, bars, vel = 0.5) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, KEYS[PROG[b % 4]].map((n) => n.replace(/\d/, (d) => +d + 1)), 4, vel); };
    const groove = { kick: 'X.....x...X.....', snare: '....X.......X...', hat: 'x.xgx.xgx.xgx.xo' };
    const groove2 = { kick: 'X.....x...X..x..', snare: '....X..g....X...', hat: 'xgxgxgxgxgxgxgxo' };

    // intro: シンセのきらきら
    s.ghost(() => pad(0, 4, 0.6));
    s.seq('bell', 0, 0.5, 'D6 C6 A5 F5 C6 A5 F5 E5 | C6 A5 G5 E5 A5 G5 E5 C5 | Bb5 G5 F5 D5 G5 F5 D5 Bb4 | A5 F5 E5 C5 F5 E5 C5 A4 |', 0.6);
    s.drums(2, 2, { kick: 'X.......X.......', hat: '..x...x...x...x.' });
    slap(2, 2);
    // Aメロ
    s.crash(16, 0.6);
    s.drums(4, 8, groove); slap(4, 8); keys(4, 8);
    s.seq('lead', 16, 0.5, VERSE, 0.85);
    // サビ
    s.crash(48);
    s.drums(12, 8, groove2); slap(12, 8); s.ghost(() => keys(12, 8, 0.45)); pad(12, 8, 0.4);
    s.seq('lead', 48, 0.5, CHORUS, 1);
    s.ghost(() => s.seq('bell', 48, 0.5, CHORUS, 0.3));
    // 間奏: ベースソロ風
    s.drums(20, 4, { kick: 'X.........X.....', hat: 'x.x.x.x.x.x.x.x.', snare: '....x.......x...' });
    for (let b = 20; b < 24; b++) {
      const [lo, hi, f] = TONE[PROG[b % 4]];
      ['R', 'o', 'f', 'o', 'R', '.', 'o', 'f', '.', 'R', 'o', '.', 'f', 'o', 'R', 'o'].forEach((k, i) => {
        if (k !== '.') s.slap(b * 4 + i / 4, k === 'R' ? lo.replace(/1$/, '2') : k === 'o' ? hi.replace(/2$/, '3') : f, 0.2, 0.9);
      });
    }
    s.riser(92, 4, 0.6);
    // Aメロ → サビ
    s.crash(96, 0.7);
    s.drums(24, 8, groove); slap(24, 8); keys(24, 8);
    s.seq('keys', 96, 0.5, VERSE, 0.95);
    s.crash(128);
    s.drums(32, 8, groove2); slap(32, 8); s.ghost(() => keys(32, 8, 0.45)); pad(32, 8, 0.45);
    s.seq('lead', 128, 0.5, CHORUS, 1);
    s.ghost(() => s.seq('bell', 128, 0.5, CHORUS, 0.3));
    // outro
    s.drums(40, 3, groove); slap(40, 3); keys(40, 3, 0.45);
    s.crash(172); s.kick(172); s.slap(172, 'F2', 1.5);
    ['A4', 'C5', 'E5', 'G5'].forEach((n) => s.keys(172, n, 3, 0.8));
    s.bell(172, 'F6', 3, 0.8);
  },
};

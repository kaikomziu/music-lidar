// TECHNO / 132 BPM: 4つ打ちのキックに、うねる16分のアシッドラインと短いスタブ
const ACID = [
  'A2 A2 A3 A2 C3 A2 G3 A2 A2 E3 A2 A3 C4 A2 G2 A2',
  'A2 A2 A3 A2 C3 A2 G3 A2 A2 E3 A2 A3 E3 G3 A3 C4',
  'F2 F2 F3 F2 A2 F2 E3 F2 F2 C3 F2 F3 A3 F2 E2 F2',
  'G2 G2 G3 G2 B2 G2 F3 G2 G2 D3 G2 G3 B3 D4 E4 G4',
];
const STAB = ['A3+C4+E4', 'A3+C4+E4', 'F3+A3+C4', 'G3+B3+D4'];
const HOOK =
  'A4 . A4 . C5 . A4 . | E5 . D5 . C5 . A4 . | A4 . A4 . C5 . E5 . | G5 . E5 . D5 . C5 . |' +
  'A4 . A4 . C5 . A4 . | E5 . D5 . C5 . A4 . | F5 . E5 . D5 . C5 . | B4 . C5 . D5 . E5 . |';

export default {
  id: 'iron-pulse',
  urlId: '4l89ubl0s', // 曲ページのURL (music/4l89ubl0s/)。公開後は変えない
  title: 'Iron Pulse',
  artist: 'MUSIC LiDAR',
  genre: 'TECHNO',
  bpm: 132,
  color: '#7dffcf',
  levels: { easy: 3, normal: 6, hard: 10 },
  preview: 144,
  sidechain: true,
  chart: { normal: { minGap: 0.2 }, hard: { minGap: 0.11, maxNps: 7.5 } },
  compose(s) {
    const acid = (from, bars, vel = 0.75) => {
      for (let b = from; b < from + bars; b++) ACID[b % 4].split(' ').forEach((n, i) => s.square(b * 4 + i / 4, n, 0.18, vel * (i % 4 === 0 ? 1 : 0.75)));
    };
    const stabs = (from, bars, vel = 0.6) => {
      for (let b = from; b < from + bars; b++) [0.5, 1.75, 2.5, 3.5].forEach((o) => s.stab(b * 4 + o, STAB[b % 4].split('+'), 0.25, vel));
    };
    const rumble = (from, bars) => { for (let b = from; b < from + bars; b++) for (let i = 0; i < 4; i++) s.bass(b * 4 + i + 0.5, 'A1', 0.35, 0.8); };
    const four = { kick: 'X...X...X...X...', hat: '..x...x...x...x.' };
    const full = { kick: 'X...X...X...X...', hat: 'g.x.g.x.g.x.g.xg', clap: '....x.......x...', ride: 'x...x...x...x...' };

    // intro: キックとハット
    s.drums(0, 8, four);
    s.ghost(() => rumble(4, 4));
    // A: アシッド
    s.crash(32, 0.6);
    s.drums(8, 8, { ...four, clap: '....x.......x...' }); rumble(8, 8);
    acid(8, 8);
    // B: スタブ
    s.drums(16, 8, full); rumble(16, 8);
    s.ghost(() => acid(16, 8, 0.45)); stabs(16, 8);
    // break
    s.downer(96, 4);
    for (let b = 24; b < 28; b++) s.pad(b * 4, STAB[b % 4].split('+'), 4, 0.8);
    s.seq('lead', 96, 1, 'A4 - C5 - | E5 - D5 - | C5 - - - | B4 - - - |', 0.8);
    s.drums(28, 2, { snare: 'x...x...x...x...' });
    s.drums(30, 1, { snare: 'x.x.x.x.x.x.x.x.' });
    s.drums(31, 1, { snare: 'xxxxxxxxxxxxxxxx' });
    s.riser(112, 16, 0.8);
    // C: フック(2周)
    s.crash(128); s.crash(160, 0.8);
    s.drums(32, 16, full); rumble(32, 16);
    s.seq('lead', 128, 0.5, HOOK, 1);
    s.seq('lead', 160, 0.5, HOOK, 1);
    s.ghost(() => { acid(32, 16, 0.4); stabs(32, 16, 0.4); });
    // outro
    s.drums(48, 4, four); acid(48, 2, 0.6);
    s.crash(208); s.kick(208); s.bass(208, 'A1', 2);
  },
};

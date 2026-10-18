// SPEEDCORE / 220 BPM (鬼畜)
const PAD = ['D3+F3+A3+D4', 'Bb2+F3+Bb3+D4', 'C3+G3+C4+E4', 'A2+E3+A3+C#4'];
const ROOT = ['D2', 'Bb1', 'C2', 'A1'];
// 16分のアルペジオ(1小節ぶん)
const ARP = [
  ['D5', 'F5', 'A5', 'D6', 'A5', 'F5', 'D5', 'F5', 'A5', 'D6', 'F6', 'D6', 'A5', 'F5', 'D5', 'A4'],
  ['Bb4', 'D5', 'F5', 'Bb5', 'F5', 'D5', 'Bb4', 'D5', 'F5', 'Bb5', 'D6', 'Bb5', 'F5', 'D5', 'Bb4', 'F4'],
  ['C5', 'E5', 'G5', 'C6', 'G5', 'E5', 'C5', 'E5', 'G5', 'C6', 'E6', 'C6', 'G5', 'E5', 'C5', 'G4'],
  ['A4', 'C#5', 'E5', 'A5', 'E5', 'C#5', 'A4', 'C#5', 'E5', 'A5', 'C#6', 'A5', 'E5', 'C#5', 'A4', 'E4'],
];
const HOOK =
  'D6 - A5 - F5 - D6 - C6 - A5 - G5 - A5 - | Bb5 - F5 - D5 - Bb5 - A5 - F5 - D5 - F5 - |' +
  'C6 - G5 - E5 - C6 - D6 - C6 - G5 - E5 - | A5 - - - C#6 - - - E6 - - - A6 - - - |';
const BREAK = 'A5 - - - - - - - | F5 - - - - - - - | G5 - - - E5 - - - | C#5 - - - - - - - |';

export default {
  id: 'overclock-omega',
  urlId: 'wdlpblwds', // 曲ページのURL (music/wdlpblwds/)。公開後は変えない
  title: 'Overclock Ω',
  artist: 'MUSIC LiDAR',
  genre: 'SPEEDCORE',
  bpm: 220,
  color: '#ff3b5c',
  levels: { easy: 6, normal: 10, hard: 14 },
  preview: 160,
  // 鬼畜: 16分の縦連・3つ押しも出る
  chart: {
    easy: { minGap: 0.26, maxNps: 3.4 },
    normal: { minGap: 0.13, maxNps: 6.5, chordP: 0.3 },
    hard: { minGap: 0.066, maxNps: 13, minScore: 0.4, chordP: 0.5, chordMax: 3, sameGap: 0.066, lnMin: 0.25 },
  },
  compose(s) {
    const pads = (from, bars, vel = 1) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, PAD[b % 4].split('+'), 4, vel); };
    const arps = (from, bars, type = 'pluck', vel = 0.85) => {
      for (let b = from; b < from + bars; b++) ARP[b % 4].forEach((n, i) => s[type](b * 4 + i / 4, n, 0.2, vel * (i % 4 === 0 ? 1 : 0.8)));
    };
    const bass = (from, bars) => {
      for (let b = from; b < from + bars; b++) for (let i = 0; i < 4; i++) s.bass(b * 4 + i + 0.5, ROOT[b % 4], 0.4, 0.9);
    };
    const gabber = { hardkick: 'X...X...X...X...', hat: 'x.x.x.x.x.x.x.x.', clap: '....x.......x...' };
    const rush = { hardkick: 'X...X...X...X.X.', hat: 'xxxxxxxxxxxxxxxx', clap: '....x.......x..x' };
    const machine = { hardkick: 'X.X.X.X.X.X.X.X.', hat: 'xxxxxxxxxxxxxxxx', snare: '....X.......X...' };

    // intro
    pads(0, 8, 0.8);
    arps(0, 4, 'pluck', 0.6);
    s.drums(4, 4, { hardkick: 'X...X...X...X...', hat: '..x...x...x...x.' });
    arps(4, 4, 'square', 0.75);
    s.riser(16, 16);

    // drop 1
    s.crash(32);
    s.drums(8, 16, gabber);
    s.drums(24, 8, rush);
    bass(8, 24);
    s.seq('lead', 32, 0.25, HOOK);
    s.seq('lead', 48, 0.25, HOOK);
    arps(16, 8, 'square', 0.9);
    s.seq('lead', 96, 0.25, HOOK);
    s.ghost(() => arps(24, 4, 'pluck', 0.4));
    arps(28, 4, 'pluck', 0.95);
    for (let b = 8; b < 32; b += 8) s.crash(b * 4, 0.8);

    // break
    s.downer(128, 4);
    pads(32, 8, 1.1);
    s.seq('bell', 128, 0.5, BREAK);
    s.seq('bell', 144, 0.5, BREAK);
    s.drums(36, 2, { snare: 'x...x...x...x...' });
    s.drums(38, 1, { snare: 'x.x.x.x.x.x.x.x.' });
    s.drums(39, 1, { snare: 'xxxxxxxxxxxxxxxx' });
    s.riser(144, 16);

    // drop 2
    s.crash(160);
    s.drums(40, 16, rush);
    s.drums(56, 16, machine);
    s.drums(72, 6, rush);
    bass(40, 38);
    arps(40, 8, 'square', 0.95);
    s.seq('lead', 192, 0.25, HOOK);
    s.seq('lead', 208, 0.25, HOOK);
    arps(56, 8, 'pluck', 1);
    s.ghost(() => s.seq('lead', 224, 0.25, HOOK, 0.4));
    s.seq('lead', 256, 0.25, HOOK);
    arps(68, 10, 'square', 1);
    for (let b = 40; b < 78; b += 8) s.crash(b * 4, 0.8);
    // ラスト2小節はキック16分連打
    s.drums(78, 2, { hardkick: 'XxxxXxxxXxxxXxxx', snare: 'xxxxxxxxxxxxxxxx' });

    // end
    s.crash(320);
    s.hardkick(320);
    s.stab(320, ['D4', 'F4', 'A4', 'D5'], 2, 1);
    s.reese(320, 'D1', 3);
  },
};

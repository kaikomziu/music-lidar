// HYPERCORE / 190 BPM (鬼畜: トリル・乱打・同時押し多め)
const PAD = ['E3+G3+B3+E4', 'C3+G3+C4+E4', 'G2+D3+G3+B3', 'D3+A3+D4+F#4'];
const STAB = ['E4+G4+B4', 'C4+E4+G4', 'D4+G4+B4', 'D4+F#4+A4'];
const ROOT = ['E2', 'C2', 'G1', 'D2'];
// ペダル音とトリルの入ったリフ(16分)
const RIFF = [
  'E5 E5 G5 E5 B5 E5 A5 E5 G5 E5 F#5 E5 D5 E5 B4 E5',
  'C5 C5 E5 C5 G5 C5 F#5 C5 E5 C5 D5 C5 B4 C5 A4 C5',
  'B4 D5 G5 B5 D6 B5 G5 D5 B4 D5 G5 B5 D6 G6 D6 B5',
  'A4 D5 F#5 A5 D6 A5 F#5 D5 F#5 A5 D6 F#6 A6 F#6 D6 A5',
];
const TRILL = [
  'E5 G5 E5 G5 E5 G5 E5 G5 B5 A5 B5 A5 B5 A5 G5 F#5',
  'E5 G5 E5 G5 C6 B5 C6 B5 G5 E5 G5 E5 C5 E5 G5 C6',
  'D5 B4 D5 B4 G5 D5 G5 D5 B5 G5 B5 G5 D6 B5 D6 B5',
  'F#5 A5 F#5 A5 D6 A5 D6 A5 F#6 D6 F#6 D6 A6 - - -',
];
const MELO = 'B5 - - - G5 - - - | E6 - - - D6 - C6 - | B5 - - - D6 - - - | A5 - - - - - - - |';

export default {
  id: 'hyper-scan-breaker',
  urlId: 'raerp0oqy', // 曲ページのURL (music/raerp0oqy/)。公開後は変えない
  title: 'Hyper Scan Breaker',
  artist: 'MUSIC LiDAR',
  genre: 'HYPERCORE',
  bpm: 190,
  color: '#ff8a2a',
  levels: { easy: 5, normal: 9, hard: 13 },
  preview: 128,
  chart: {
    easy: { minGap: 0.3, maxNps: 3 },
    normal: { minGap: 0.15, maxNps: 6, chordP: 0.3 },
    hard: { minGap: 0.077, maxNps: 12, minScore: 0.4, chordP: 0.55, chordMax: 3, sameGap: 0.15, lnMin: 0.28 },
  },
  compose(s) {
    const pads = (from, bars, vel = 1) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, PAD[b % 4].split('+'), 4, vel); };
    const riff = (from, bars, set = RIFF, type = 'lead', vel = 0.9) => {
      for (let b = from; b < from + bars; b++) s.seq(type, b * 4, 0.25, set[b % 4], vel);
    };
    const stabs = (from, bars, vel = 0.9) => {
      for (let b = from; b < from + bars; b++) [0, 1.5, 3].forEach((o) => s.stab(b * 4 + o, STAB[b % 4].split('+'), 0.3, vel));
    };
    const bass = (from, bars) => {
      for (let b = from; b < from + bars; b++) { s.reese(b * 4, ROOT[b % 4], 1.5, 0.9); s.reese(b * 4 + 2, ROOT[b % 4], 1.5, 0.8); }
    };
    const beat = { hardkick: 'X..X..X...X..X..', hat: 'x.x.x.x.x.x.x.x.', snare: '....X.......X...' };
    const beat2 = { hardkick: 'X..X..X.X.X..X..', hat: 'xxxxxxxxxxxxxxxx', snare: '....X..x....X.xx' };

    // intro
    pads(0, 4, 0.8);
    s.seq('bell', 0, 0.5, MELO, 0.8);
    s.drums(2, 2, { hat: 'x.x.x.x.x.x.x.x.' });
    s.riser(8, 8);

    // A: リフ
    s.crash(16);
    s.drums(4, 16, beat);
    bass(4, 16);
    riff(4, 8, RIFF, 'square', 0.85);
    riff(12, 8, RIFF, 'lead', 0.95);
    s.ghost(() => pads(4, 16, 0.5));
    s.crash(48, 0.8);

    // B: 同時押しスタブ + メロディ
    s.crash(80);
    s.drums(20, 8, beat2);
    bass(20, 8);
    stabs(20, 8);
    s.seq('lead', 80, 0.5, MELO);
    s.seq('lead', 96, 0.5, MELO);

    // 一瞬のブレイク
    s.downer(112, 4);
    pads(28, 4, 1);
    s.seq('bell', 112, 0.5, MELO);
    s.drums(30, 1, { snare: 'x.x.x.x.x.x.x.x.' });
    s.drums(31, 1, { snare: 'xxxxxxxxxxxxxxxx', hardkick: 'X...X...X.X.XXXX' });

    // C: トリル地獄
    s.crash(128);
    s.drums(32, 16, beat2);
    bass(32, 16);
    riff(32, 8, TRILL, 'lead', 1);
    riff(40, 4, RIFF, 'square', 1);
    riff(44, 4, TRILL, 'square', 1);
    s.ghost(() => stabs(32, 16, 0.5));
    s.crash(160, 0.8);

    // D: 全部のせ
    s.crash(192);
    s.drums(48, 14, { ...beat2, hardkick: 'X.XX.XX.X.XX.XX.' });
    bass(48, 14);
    riff(48, 8, RIFF, 'lead', 1);
    stabs(48, 14, 0.8);
    riff(56, 6, TRILL, 'lead', 1);
    s.drums(62, 2, { hardkick: 'XxxxXxxxXxxxXxxx', snare: 'xxxxxxxxxxxxxxxx' });
    s.crash(224, 0.8);

    // end
    s.crash(256);
    s.hardkick(256);
    s.stab(256, ['E4', 'G4', 'B4', 'E5'], 2, 1);
    s.reese(256, 'E1', 3);
  },
};

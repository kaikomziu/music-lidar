// WA-FUSION(和風) / 140 BPM: 都節音階の箏(こと)と尺八風のリード、和太鼓のようなキック
const ROOT = ['D2', 'Bb1', 'C2', 'A1'];
const PAD = ['D3+A3+D4', 'Bb2+F3+Bb3', 'C3+G3+C4', 'A2+E3+A3'];
const KOTO = [
  'D5 A4 D5 Eb5 G5 Eb5 D5 A4', 'Bb4 F4 Bb4 D5 F5 D5 Bb4 F4',
  'C5 G4 C5 Eb5 G5 Eb5 C5 G4', 'A4 E4 A4 D5 E5 D5 A4 E4',
];
const MEL_A =
  'D5 - Eb5 - G5 - A5 - | Bb5 - A5 - G5 - - - | A5 - G5 - Eb5 - D5 - | D5 - - - . . . . |' +
  'G5 - A5 - Bb5 - D6 - | Eb6 - D6 - Bb5 - A5 - | G5 - A5 - Bb5 - A5 G5 | D5 - - - - - . . |';
const MEL_B =
  'A5 - - - D6 - - - | Bb5 - A5 - G5 - - - | G5 - - - C6 - - - | A5 - G5 - Eb5 - - - |' +
  'D5 - G5 - A5 - D6 - | Eb6 - - - D6 - Bb5 - | A5 - G5 - Eb5 - G5 - | A5 - - - - - - - |';

export default {
  id: 'sakura-lattice',
  urlId: '5iri6x0i7', // 曲ページのURL (music/5iri6x0i7/)。公開後は変えない
  title: 'Sakura Lattice',
  artist: 'MUSIC LiDAR',
  genre: 'WA-FUSION',
  bpm: 140,
  color: '#ff8fb1',
  levels: { easy: 3, normal: 6, hard: 10 },
  preview: 96,
  chart: { hard: { minGap: 0.1, maxNps: 8 } },
  compose(s) {
    const koto = (from, bars, vel = 0.75) => { for (let b = from; b < from + bars; b++) s.seq('pluck', b * 4, 0.5, KOTO[b % 4], vel); };
    const pads = (from, bars, vel = 0.6) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, PAD[b % 4].split('+'), 4, vel); };
    const bass = (from, bars) => { for (let b = from; b < from + bars; b++) { s.bass(b * 4, ROOT[b % 4], 1.5); s.bass(b * 4 + 2, ROOT[b % 4], 0.5, 0.8); s.bass(b * 4 + 3, ROOT[b % 4], 0.5, 0.8); } };
    const taiko = { kick: 'X..x..X.X..x..X.', snare: '........X.......' };
    const beat = { kick: 'X...x..xX...x...', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };

    // intro: 箏と和太鼓
    koto(0, 4, 0.8);
    s.drums(2, 2, taiko);
    // A
    s.crash(16);
    s.drums(4, 8, beat); bass(4, 8); s.ghost(() => koto(4, 8, 0.4)); pads(4, 8, 0.4);
    s.seq('lead', 16, 0.5, MEL_A, 0.9);
    // B
    s.crash(48);
    s.drums(12, 8, { ...beat, hat: 'xxxxxxxxxxxxxxxx' }); bass(12, 8); pads(12, 8, 0.5);
    s.seq('bell', 48, 0.5, MEL_B, 0.95);
    s.ghost(() => koto(12, 8, 0.35));
    // 間奏: 和太鼓ソロ
    s.drums(20, 4, { kick: 'X..x..X.X..x..X.', snare: 'g.g.g.g.X.g.g.gX', hat: '................' });
    koto(20, 4, 0.9);
    s.drums(23, 1, { kick: 'X.X.X.X.XXXXXXXX' });
    // A' + B'
    s.crash(96);
    s.drums(24, 8, beat); bass(24, 8); pads(24, 8, 0.45);
    s.seq('square', 96, 0.5, MEL_A, 0.95);
    s.ghost(() => koto(24, 8, 0.4));
    s.crash(128);
    s.drums(32, 8, { ...beat, hat: 'xxxxxxxxxxxxxxxx' }); bass(32, 8); pads(32, 8, 0.5);
    s.seq('lead', 128, 0.5, MEL_B, 1);
    s.ghost(() => s.seq('bell', 128, 0.5, MEL_B, 0.3));
    // outro
    koto(40, 2, 0.7); s.drums(40, 2, taiko);
    s.kick(168); s.crash(168); s.pad(168, ['D3', 'A3', 'D4', 'Eb4'], 4, 0.8); s.pluck(168, 'D5', 2);
  },
};

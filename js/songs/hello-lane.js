// BEGINNER / 110 BPM (初心者向け: はねるポップ。HARDで少し8分が混ざる)
const PAD = ['G3+B3+D4', 'C3+E3+G3', 'D3+F#3+A3', 'G3+B3+D4', 'E3+G3+B3', 'C3+E3+G3', 'D3+F#3+A3', 'G3+B3+D4'];
const ROOT = ['G1', 'C2', 'D2', 'G1', 'E2', 'C2', 'D2', 'G1'];
const MEL_A = 'G4 B4 D5 B4 | C5 - E5 - | D5 C5 B4 A4 | G4 - - - | B4 B4 C5 D5 | E5 - C5 - | A4 B4 C5 A4 | G4 - - - |';
const MEL_B = 'D5 - D5 - | E5 - G5 - | D5 - B4 - | A4 - - - | B4 - B4 - | C5 - E5 - | D5 C5 B4 A4 | G4 - - - |';
const FILL = 'B4 D5 G5 D5 B4 D5 G5 D5';

export default {
  id: 'hello-lane',
  urlId: 'yfr75wjn2', // 曲ページのURL (music/yfr75wjn2/)。公開後は変えない
  title: 'Hello, Lane',
  artist: 'MUSIC LiDAR',
  genre: 'BEGINNER',
  bpm: 110,
  color: '#b8ff9e',
  levels: { easy: 1, normal: 3, hard: 5 },
  preview: 48,
  chart: {
    easy: { minGap: 0.52, maxNps: 1.3, chordMax: 1, lnMin: 1.0, minScore: 3.2 },
    normal: { minGap: 0.27, maxNps: 2.2, chordMax: 1, lnMin: 0.8 },
    hard: { minGap: 0.27, maxNps: 3.2, chordP: 0.15, chordMax: 2, lnMin: 0.5 },
  },
  compose(s) {
    const pads = (from, bars, vel = 1) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, PAD[b % 8].split('+'), 4, vel); };
    const bass = (from, bars) => {
      for (let b = from; b < from + bars; b++) { const r = ROOT[b % 8]; s.bass(b * 4, r, 0.9, 0.8); s.bass(b * 4 + 1.5, r, 0.4, 0.6); s.bass(b * 4 + 2, r, 0.9, 0.75); s.bass(b * 4 + 3.5, r, 0.4, 0.6); }
    };
    const pop = { kick: 'X.......X.x.....', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };

    // intro
    pads(0, 4, 0.7);
    s.drums(0, 2, { kick: 'X...X...X...X...' });
    s.drums(2, 2, { kick: 'X...X...X...X...', hat: 'x.x.x.x.x.x.x.x.' });

    // A, B, A, B
    let beat = 16;
    [MEL_A, MEL_B, MEL_A, MEL_B].forEach((m, i) => {
      const bar = beat / 4;
      if (i > 0) s.crash(beat, 0.6);
      pads(bar, 8, 0.6);
      bass(bar, 8);
      s.drums(bar, 8, pop);
      s.seq(i < 2 ? 'square' : 'pluck', beat, 1, m, 0.85);
      if (i % 2 === 1) s.seq('pluck', beat + 30, 0.25, FILL, 0.7); // 最後の小節後半だけ細かい(HARD向け)
      beat += 32;
    });

    // outro
    pads(36, 4, 0.8);
    s.seq('bell', 144, 1, 'D5 - - - | B4 - - - | A4 - - - | G4 - - - |');
    s.crash(160, 0.5);
    s.pad(160, ['G3', 'B3', 'D4', 'G4'], 4, 0.9);
    s.kick(160);
  },
};

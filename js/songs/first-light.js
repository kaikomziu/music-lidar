// BEGINNER / 90 BPM (初心者向け: 4分音符中心、同時押しなし)
const PAD = ['C3+E3+G3+C4', 'B2+D3+G3+B3', 'A2+C3+E3+A3', 'A2+C3+F3+A3'];
const ROOT = ['C2', 'G1', 'A1', 'F1'];
const MEL_A = 'E5 - G5 - | D5 - B4 - | C5 - E5 - | F5 - - - | E5 - G5 - | D5 - G5 - | A5 - G5 E5 | F5 - - - |';
const MEL_B = 'C5 - D5 E5 | D5 - - - | C5 - D5 E5 | A4 - - - | F5 - E5 D5 | E5 - C5 - | D5 - E5 F5 | E5 - - - |';

export default {
  id: 'first-light',
  title: 'First Light',
  artist: 'MUSIC LiDAR',
  genre: 'BEGINNER',
  bpm: 90,
  color: '#9fe8ff',
  levels: { easy: 1, normal: 2, hard: 4 },
  preview: 16,
  chart: {
    easy: { minGap: 0.62, maxNps: 1.1, chordMax: 1, lnMin: 1.2, minScore: 3.2 },
    normal: { minGap: 0.32, maxNps: 1.9, chordMax: 1, lnMin: 0.9 },
    hard: { minGap: 0.32, maxNps: 2.8, chordP: 0.12, chordMax: 2, lnMin: 0.6 },
  },
  compose(s) {
    const pads = (from, bars, vel = 1) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, PAD[b % 4].split('+'), 4, vel); };
    const bass = (from, bars) => { for (let b = from; b < from + bars; b++) { s.bass(b * 4, ROOT[b % 4], 1.8, 0.8); s.bass(b * 4 + 2, ROOT[b % 4], 1.8, 0.7); } };
    const soft = { kick: 'X.......X.......', snare: '....x.......x...', hat: 'x...x...x...x...' };

    // intro: キックだけで拍をつかむ
    pads(0, 4, 0.8);
    s.drums(0, 4, { kick: 'X...X...X...X...' });

    // A
    pads(4, 8, 0.7);
    bass(4, 8);
    s.drums(4, 8, soft);
    s.seq('bell', 16, 1, MEL_A);

    // B
    s.crash(48, 0.6);
    pads(12, 8, 0.7);
    bass(12, 8);
    s.drums(12, 8, soft);
    s.seq('bell', 48, 1, MEL_B);

    // A'
    s.crash(80, 0.6);
    pads(20, 8, 0.8);
    bass(20, 8);
    s.drums(20, 8, { ...soft, hat: 'x.x.x.x.x.x.x.x.' });
    s.seq('square', 80, 1, MEL_A, 0.8);
    s.ghost(() => s.seq('bell', 80, 1, MEL_A, 0.4));

    // outro: ゆっくり長押し
    pads(28, 4, 0.9);
    s.seq('bell', 112, 1, 'C5 - - - | G4 - - - | A4 - - - | C5 - - - |');
    s.crash(128, 0.5);
    s.pad(128, ['C3', 'E3', 'G3', 'C4'], 4, 0.9);
    s.kick(128);
  },
};

// CHILL / 100 BPM
const CH = ['F3+A3+C4+E4', 'F3+A3+B3+D4', 'E3+G3+B3+D4', 'E3+G3+A3+C4'];
const ROOT = ['D2', 'G2', 'C2', 'A1'];
const ARP = [
  ['D4', 'F4', 'A4', 'C5', 'E5', 'C5', 'A4', 'F4'],
  ['G3', 'B3', 'D4', 'F4', 'A4', 'F4', 'D4', 'B3'],
  ['C4', 'E4', 'G4', 'B4', 'D5', 'B4', 'G4', 'E4'],
  ['A3', 'C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'C4'],
];

const MEL_A =
  'D5 - - C5 A4 - G4 - | F4 - - - - - E4 G4 | E4 - - - - - - - | . . A4 C5 D5 - E5 - |' +
  'D5 - - C5 A4 - C5 - | D5 - F5 - E5 - - - | C5 - - - - - B4 - | A4 - - - - - - - |';
const MEL_B =
  'A5 - G5 - E5 - D5 - | F5 - - E5 D5 - C5 - | E5 - G5 - - - E5 D5 | C5 - D5 - E5 - - - |' +
  'A5 - G5 - E5 - G5 - | A5 - C6 - B5 - G5 - | E5 - - - D5 - E5 - | A4 - - - - - . . |';
const MEL_BREAK = 'D5 - - - - - - - | F5 - - - E5 - - - | G5 - - - - - - - | E5 - - - - - - - |';

export default {
  id: 'cloud-point',
  urlId: 'az7t658wr', // 曲ページのURL (music/az7t658wr/)。公開後は変えない
  title: 'Cloud Point',
  artist: 'MUSIC LiDAR',
  genre: 'CHILL',
  bpm: 100,
  color: '#5ef2ff',
  levels: { easy: 2, normal: 5, hard: 8 },
  preview: 48, // 拍
  compose(s) {
    const chords = (from, bars, vel = 1) => {
      for (let b = from; b < from + bars; b++) s.pad(b * 4, CH[b % 4].split('+'), 4, vel);
    };
    const bass = (from, bars) => {
      for (let b = from; b < from + bars; b++) {
        const r = ROOT[b % 4];
        s.bass(b * 4, r, 1.5); s.bass(b * 4 + 2.5, r, 1); s.bass(b * 4 + 3.5, r.replace(/\d/, (d) => +d + 1), 0.4, 0.8);
      }
    };
    const arp = (from, bars, vel = 0.7) => {
      for (let b = from; b < from + bars; b++) ARP[b % 4].forEach((n, i) => s.pluck(b * 4 + i * 0.5, n, 0.4, vel));
    };
    const beatA = { kick: 'X.........x..... X.......x.x.....', snare: '....X.......X...', hat: 'x.g.x.g.x.g.x.gx' };
    const beatB = { kick: 'X.........x..... X.......x.x...x.', snare: '....X.......X..g', hat: 'xgxgxgxgxgxgxgxo' };

    // intro
    chords(0, 4);
    arp(0, 4, 0.75);
    s.drums(2, 2, { hat: 'x...x...x...x...' });

    // A
    chords(4, 8, 0.8);
    bass(4, 8);
    s.drums(4, 8, beatA);
    s.crash(16);
    s.seq('bell', 16, 0.5, MEL_A);
    s.ghost(() => arp(4, 8, 0.4));

    // B
    chords(12, 8, 0.8);
    bass(12, 8);
    s.drums(12, 8, beatB);
    s.crash(48);
    s.seq('square', 48, 0.5, MEL_B, 0.9);
    s.ghost(() => s.seq('bell', 48, 0.5, MEL_B, 0.35));

    // break
    chords(20, 4, 1.1);
    s.seq('bell', 80, 0.5, MEL_BREAK);
    s.riser(88, 8);
    s.drums(23, 1, { kick: 'x...x...x...x.x.', snare: '........x.x.xxxx' });

    // A'
    chords(24, 8, 0.85);
    bass(24, 8);
    s.drums(24, 8, beatB);
    s.crash(96);
    s.crash(112, 0.7);
    s.seq('square', 96, 0.5, MEL_A, 0.9);
    s.ghost(() => arp(24, 8, 0.45));

    // outro
    chords(32, 4, 0.9);
    arp(32, 3, 0.6);
    s.crash(128, 0.6);
    s.bell(140, 'D5', 2);
    s.bell(142, 'A4', 2);
    s.pad(144, ['D3', 'F3', 'A3', 'C4', 'E4'], 4, 1);
    s.bell(144, 'D5', 4);
    s.bass(144, 'D2', 3);
    s.crash(144, 0.7);
    s.kick(144);
  },
};

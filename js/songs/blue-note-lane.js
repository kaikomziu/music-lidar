// JAZZ SWING / 168 BPM: ハネるリズム(3連スウィング)、ウッドベースのウォーキング、エレピ
const COMP = ['F4+A4+Bb4+D5', 'E4+A4+Bb4+D5', 'E4+A4+C5', 'E4+A4+C5', 'G4+C5+E5', 'F#4+B4+C5+E5', 'F4+A4+Bb4+D5', 'E4+A4+Bb4+D5'];
const WALK = [
  ['G2', 'A2', 'Bb2', 'B2'], ['C3', 'E3', 'G3', 'E3'], ['F2', 'A2', 'C3', 'A2'], ['F2', 'G2', 'G#2', 'A2'],
  ['A2', 'C3', 'E3', 'Eb3'], ['D3', 'F#2', 'A2', 'C3'], ['G2', 'Bb2', 'D3', 'Db3'], ['C3', 'Bb2', 'G2', 'E2'],
];
const HEAD =
  'A4 C5 D5 F5 A5 - G5 F5 | E5 G5 Bb5 A5 G5 E5 C5 Bb4 | A4 - C5 - E5 - G5 - | F5 - - - - - . . |' +
  'E5 G5 A5 C6 B5 - A5 G5 | F#5 A5 C6 - B5 A5 F#5 D5 | F5 - D5 - Bb4 - G4 - | E5 - - - C5 - . . |';
// アドリブ風のフレーズ(コードごとの音)
const SOLO_TONES = [
  ['G4', 'Bb4', 'D5', 'F5', 'A5'], ['E4', 'G4', 'Bb4', 'C5', 'D5'], ['F4', 'A4', 'C5', 'E5', 'G5'], ['A4', 'C5', 'E5', 'F5', 'G5'],
  ['A4', 'C5', 'E5', 'G5', 'B5'], ['F#4', 'A4', 'C5', 'D5', 'E5'], ['G4', 'Bb4', 'D5', 'F5', 'A5'], ['E4', 'G4', 'Bb4', 'C5', 'E5'],
];

export default {
  id: 'blue-note-lane',
  urlId: 'xscev0ip3', // 曲ページのURL (music/xscev0ip3/)。公開後は変えない
  title: 'Blue Note Lane',
  artist: 'MUSIC LiDAR',
  genre: 'JAZZ',
  bpm: 168,
  color: '#4fa3ff',
  levels: { easy: 3, normal: 5, hard: 10 },
  preview: 80,
  chart: { normal: { minGap: 0.17 }, hard: { minGap: 0.11, maxNps: 7 } },
  compose(s) {
    s.setSwing(1 / 6);
    const comp = (from, bars, vel = 0.7) => {
      for (let b = from; b < from + bars; b++) {
        const c = COMP[b % 8].split('+');
        c.forEach((n) => { s.keys(b * 4, n, 0.4, vel * 0.55); s.keys(b * 4 + 1.5, n, 0.3, vel * 0.5); });
      }
    };
    const walk = (from, bars) => { for (let b = from; b < from + bars; b++) WALK[b % 8].forEach((n, i) => s.upright(b * 4 + i, n, 0.9, i === 0 ? 1 : 0.85)); };
    const swingDrums = { ride: 'x...x.x.x...x.x.', hat: '....x.......x...', kick: 'g...............', snare: '..........g....g' };
    const solo = (from, bars) => {
      for (let b = from; b < from + bars; b++) {
        const tones = SOLO_TONES[b % 8];
        for (let i = 0; i < 8; i++) {
          if (s.rng() < 0.18 && i % 2) continue;
          const k = Math.floor((Math.sin((b * 8 + i) * 0.7) * 0.5 + 0.5) * tones.length);
          s.keys(b * 4 + i * 0.5, tones[Math.min(tones.length - 1, k)], 0.4, 0.95);
        }
      }
    };

    // intro
    comp(0, 4, 0.8); walk(0, 4);
    s.drums(0, 4, { ride: 'x...x.x.x...x.x.', hat: '....x.......x...' });
    // head x2
    s.drums(4, 16, swingDrums); comp(4, 16); walk(4, 16);
    s.seq('keys', 16, 0.5, HEAD, 1);
    s.seq('keys', 48, 0.5, HEAD, 1);
    // solo
    s.drums(20, 16, { ...swingDrums, snare: '..g...g...g..g.g' });
    s.ghost(() => comp(20, 16, 0.6)); walk(20, 16);
    solo(20, 16);
    s.crash(80, 0.5);
    // head again
    s.drums(36, 16, swingDrums); comp(36, 16); walk(36, 16);
    s.seq('keys', 144, 0.5, HEAD, 1);
    s.seq('keys', 176, 0.5, HEAD, 1);
    // ending
    s.ride(208); s.kick(208, 0.6);
    ['F3', 'A3', 'C4', 'E4', 'G4'].forEach((n) => s.keys(208, n, 3, 0.8));
    s.keys(208, 'A5', 3, 1);
    s.upright(208, 'F2', 2.5);
  },
};

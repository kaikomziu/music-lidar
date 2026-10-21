// REGGAETON / 96 BPM: 「ドン・ツッ・ドン・ツッ」のデンボウのリズムと、ラテンのギター風メロディ
const PROG = ['Am', 'F', 'G', 'Em'];
const ROOT = { Am: 'A1', F: 'F1', G: 'G1', Em: 'E1' };
const CH = { Am: 'A3+C4+E4', F: 'A3+C4+F4', G: 'B3+D4+G4', Em: 'B3+E4+G4' };
const MEL =
  'A5 - - G5 E5 - - C5 | D5 - E5 - . . . . | C6 - - B5 G5 - - E5 | B5 - - - . . . . |' +
  'A5 - - G5 E5 - G5 A5 | C6 - A5 - F5 - - - | D5 - E5 - G5 - B5 - | E5 - - - . . . . |';
const HOOK =
  'E5 . E5 . A5 . G5 . | F5 . F5 . A5 . C6 . | D5 . D5 . G5 . B5 . | B5 . G5 . E5 - - . |';

export default {
  id: 'dembow-lights',
  urlId: 'rtg6ttp0p', // 曲ページのURL (music/rtg6ttp0p/)。公開後は変えない
  title: 'Dembow Lights',
  artist: 'MUSIC LiDAR',
  genre: 'REGGAETON',
  bpm: 96,
  color: '#ff6a3d',
  levels: { easy: 2, normal: 4, hard: 8 },
  preview: 48,
  chart: { hard: { minGap: 0.12, maxNps: 6.5 } },
  compose(s) {
    const dembow = { kick: 'X...X...X...X...', snare: '...X..X....X..X.', hat: 'x.x.x.x.x.x.x.x.' };
    const dembow2 = { kick: 'X...X...X...X...', snare: '...X..X....X..XX', hat: 'xxx.xxx.xxx.xxx.' };
    const bass = (from, bars) => { for (let b = from; b < from + bars; b++) { const r = ROOT[PROG[b % 4]]; s.bass(b * 4, r, 0.7, 1); s.bass(b * 4 + 0.75, r, 0.4, 0.8); s.bass(b * 4 + 2, r, 0.7, 1); s.bass(b * 4 + 2.75, r, 0.4, 0.8); } };
    const guitar = (from, bars, vel = 0.5) => {
      for (let b = from; b < from + bars; b++) [0, 0.75, 1.5, 2.5, 3.25].forEach((o, i) => s.pluck(b * 4 + o, CH[PROG[b % 4]].split('+')[i % 3].replace(/\d/, (d) => +d + 1), 0.3, vel));
    };
    const pads = (from, bars, vel = 0.4) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, CH[PROG[b % 4]].split('+'), 4, vel); };

    // intro
    guitar(0, 4, 0.7); pads(0, 4, 0.5);
    s.drums(2, 2, { hat: 'x.x.x.x.x.x.x.x.', snare: '...x..x....x..x.' });
    // A
    s.crash(16);
    s.drums(4, 8, dembow); bass(4, 8); s.ghost(() => guitar(4, 8, 0.35)); pads(4, 8);
    s.seq('lead', 16, 0.5, MEL, 0.9);
    // サビ
    s.crash(48);
    s.drums(12, 8, dembow2); bass(12, 8); pads(12, 8, 0.5);
    s.seq('pluck', 48, 0.5, HOOK + HOOK, 1);
    s.ghost(() => s.seq('bell', 48, 0.5, HOOK + HOOK, 0.3));
    // break
    s.drums(20, 4, { snare: '...X..X....X..X.' }); pads(20, 4, 0.7);
    s.seq('keys', 80, 1, 'E5 - A5 - | F5 - C6 - | G5 - B5 - | E5 - - - |', 0.8);
    // A' + サビ
    s.crash(96);
    s.drums(24, 8, dembow); bass(24, 8); s.ghost(() => guitar(24, 8, 0.35)); pads(24, 8);
    s.seq('square', 96, 0.5, MEL, 0.95);
    s.crash(128);
    s.drums(32, 8, dembow2); bass(32, 8); pads(32, 8, 0.5);
    s.seq('pluck', 128, 0.5, HOOK + HOOK, 1);
    // outro
    guitar(40, 2, 0.6); s.drums(40, 2, dembow);
    s.kick(168); s.crash(168); s.bass(168, 'A1', 2); s.pad(168, ['A3', 'C4', 'E4'], 3, 0.7);
  },
};

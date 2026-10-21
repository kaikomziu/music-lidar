// HAPPY HARDCORE / 172 BPM: 明るいピアノの連打と、駆け上がるスーパーソウ
const PROG = ['C', 'G', 'Am', 'F'];
const CH = { C: 'C4+E4+G4', G: 'B3+D4+G4', Am: 'C4+E4+A4', F: 'C4+F4+A4' };
const ROOT = { C: 'C2', G: 'G1', Am: 'A1', F: 'F1' };
const MEL =
  'E5 - G5 - C6 - B5 - | D6 - - - B5 - G5 - | C6 - B5 - A5 - G5 - | A5 - - - F5 - - - |' +
  'E5 - G5 - C6 - D6 - | E6 - - - D6 - B5 - | C6 - A5 - G5 - F5 - | G5 - - - - - . . |';
const PIANO = 'x..x..x.x..x..x.';

export default {
  id: 'sugar-rush',
  urlId: 'h44beqr46', // 曲ページのURL (music/h44beqr46/)。公開後は変えない
  title: 'Sugar Rush Scan',
  artist: 'MUSIC LiDAR',
  genre: 'HAPPY HARDCORE',
  bpm: 172,
  color: '#ff7ad9',
  levels: { easy: 4, normal: 8, hard: 12 },
  preview: 128,
  sidechain: true,
  chart: { normal: { minGap: 0.15 }, hard: { minGap: 0.085, maxNps: 10, chordP: 0.4 } },
  compose(s) {
    const piano = (from, bars, vel = 0.6) => {
      for (let b = from; b < from + bars; b++) [...PIANO].forEach((c, i) => { if (c === 'x') CH[PROG[b % 4]].split('+').forEach((n) => s.keys(b * 4 + i / 4, n.replace(/\d/, (d) => +d + 1), 0.25, vel)); });
    };
    const bass = (from, bars) => { for (let b = from; b < from + bars; b++) for (let i = 0; i < 4; i++) s.bass(b * 4 + i + 0.5, ROOT[PROG[b % 4]], 0.4, 1); };
    const four = { kick: 'X...X...X...X...', hat: '..x...x...x...x.', clap: '....X.......X...' };

    // intro: ピアノ
    piano(0, 4, 0.7);
    s.drums(2, 2, { kick: 'X...X...X...X...' });
    // A
    s.crash(16);
    s.drums(4, 8, four); bass(4, 8); s.ghost(() => piano(4, 8, 0.4));
    s.seq('lead', 16, 0.5, MEL, 0.9);
    // break
    s.downer(48, 4);
    for (let b = 12; b < 20; b++) s.pad(b * 4, CH[PROG[b % 4]].split('+'), 4, 0.8);
    s.seq('bell', 48, 0.5, MEL, 0.85);
    s.drums(18, 1, { snare: 'x...x...x...x...' }); s.drums(19, 1, { snare: 'x.x.x.x.xxxxxxxx' });
    s.riser(64, 16, 0.8);
    // drop(2周)
    s.crash(80); s.crash(112, 0.8);
    s.drums(20, 16, { ...four, hat: 'g.x.g.x.g.x.g.xo' }); bass(20, 16); piano(20, 16, 0.4);
    s.seq('supersaw', 80, 0.5, MEL, 1);
    s.seq('supersaw', 112, 0.5, MEL, 1);
    // ピアノソロ
    s.drums(36, 4, four); bass(36, 4);
    s.seq('keys', 144, 0.25,
      'C6 G5 E5 G5 C6 G5 E6 D6 C6 G5 E5 G5 C6 D6 E6 G6 ' + 'B5 G5 D5 G5 B5 G5 D6 C6 B5 G5 D5 G5 B5 C6 D6 G6 ' +
      'A5 E5 C5 E5 A5 E5 C6 B5 A5 E5 C5 E5 A5 B5 C6 E6 ' + 'F5 C5 A4 C5 F5 C5 A5 G5 F5 A5 C6 F6 E6 D6 C6 B5', 0.9);
    // last
    s.crash(160);
    s.drums(40, 8, four); bass(40, 8); piano(40, 8, 0.4);
    s.seq('lead', 160, 0.5, MEL, 1);
    s.ghost(() => s.seq('supersaw', 160, 0.5, MEL, 0.4));
    s.crash(192); s.kick(192); s.stab(192, ['C5', 'E5', 'G5', 'C6'], 3, 1); s.bass(192, 'C2', 2);
  },
};

// DRUM & BASS / 174 BPM
const PADCH = ['E3+G3+B3+D4', 'C3+G3+B3+E4', 'D3+A3+C4+F#4', 'B2+F#3+A3+D4'];
const ROOT = ['E1', 'C2', 'D2', 'B1'];
const ARPS = [
  ['E5', 'G5', 'B5', 'E6'],
  ['C5', 'E5', 'G5', 'B5'],
  ['D5', 'F#5', 'A5', 'D6'],
  ['B4', 'D5', 'F#5', 'B5'],
];

const MEL =
  'B4 - - - E5 - G5 - | F#5 - - - D5 - - - | A5 - - - G5 - F#5 - | D5 - - - - - B4 - |' +
  'B4 - - - E5 - G5 - | B5 - - - A5 - G5 - | F#5 - G5 - A5 - D6 - | B5 - - - - - - - |';
const MEL_HI =
  'E6 - D6 B5 - G5 B5 - | C6 - B5 G5 - E5 G5 - | D6 - C6 A5 - F#5 A5 - | B5 - - - F#5 - D5 - |' +
  'E6 - D6 B5 - G5 B5 - | C6 - B5 G5 - E5 G5 - | A5 - B5 - C6 - D6 - | E6 - - - - - - - |';
const BREAK =
  'G5 - - - - - - - | E5 - - - - - - - | F#5 - - - A5 - - - | F#5 - - - - - - - |' +
  'B5 - - - - - - - | G5 - - - - - E5 - | D5 - - - F#5 - - - | E5 - - - - - - - |';

export default {
  id: 'lidar-rush',
  title: 'LiDAR Rush',
  artist: 'MUSIC LiDAR',
  genre: 'DRUM & BASS',
  bpm: 174,
  color: '#9dff4f',
  levels: { easy: 4, normal: 7, hard: 11 },
  preview: 64,
  compose(s) {
    const pads = (from, bars, vel = 1) => {
      for (let b = from; b < from + bars; b++) s.pad(b * 4, PADCH[(b >> 1) % 4].split('+'), 4, vel);
    };
    const reese = (from, bars, vel = 1) => {
      for (let b = from; b < from + bars; b += 2) {
        const r = ROOT[(b >> 1) % 4];
        s.reese(b * 4, r, 2.5, vel);
        s.reese(b * 4 + 3, r, 1, vel * 0.8);
        s.reese(b * 4 + 4.5, r.replace(/\d/, (d) => +d + 1), 1.5, vel * 0.9);
        s.reese(b * 4 + 6.5, r, 1.5, vel);
      }
    };
    const arps = (from, bars, vel = 0.8, type = 'pluck') => {
      for (let b = from; b < from + bars; b++) {
        const a = ARPS[(b >> 1) % 4];
        for (let i = 0; i < 16; i++) s[type](b * 4 + i / 4, a[[0, 1, 2, 3, 2, 1, 2, 3][i % 8]], 0.2, vel * (i % 4 === 0 ? 1 : 0.75));
      }
    };
    const twoStep = { kick: 'X.........X..... X.........X.x...', snare: '....X.......X... ....X.......X..g', hat: 'x.x.x.x.x.x.x.x.' };
    const roll = { kick: 'X.........X..... X.x.......X.....', snare: '....X..g.g..X... ....X..g....X.gg', hat: 'xgxgxgxgxgxgxgxg', ride: '..x...x...x...x.' };

    // intro
    pads(0, 8, 0.9);
    s.drums(0, 4, { hat: 'x.x.x.x.x.x.x.x.' });
    s.drums(4, 4, { hat: 'xgxgxgxgxgxgxgxg', kick: 'X...............' });
    s.seq('bell', 0, 0.5, BREAK, 0.7);
    s.riser(16, 16, 0.8);

    // build
    s.crash(32, 0.7);
    s.drums(8, 8, twoStep);
    reese(8, 8, 0.8);
    s.ghost(() => pads(8, 8, 0.5));
    s.seq('square', 32, 0.5, MEL, 0.8);

    // drop A
    s.crash(64); s.crash(96, 0.8);
    s.drums(16, 16, roll);
    reese(16, 16);
    s.seq('lead', 64, 0.5, MEL);
    s.seq('lead', 96, 0.5, MEL_HI);
    s.ghost(() => arps(16, 16, 0.35));

    // break (half-time)
    s.downer(128, 4);
    pads(32, 8, 1.1);
    s.seq('bell', 128, 0.5, BREAK);
    s.drums(32, 8, { kick: 'X...............', snare: '........X.......' });

    // build 2
    pads(40, 8, 0.7);
    arps(40, 4, 0.7);
    s.drums(40, 4, { kick: 'X.........X.....', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' });
    s.drums(44, 2, { snare: 'x.x.x.x.x.x.x.x.' });
    s.drums(46, 2, { snare: 'xxxxxxxxxxxxxxxx' });
    arps(44, 4, 0.8, 'square');
    s.riser(176, 16, 1);

    // drop B
    s.crash(192); s.crash(224, 0.8); s.crash(256, 0.8);
    s.drums(48, 24, roll);
    reese(48, 24);
    s.seq('lead', 192, 0.5, MEL_HI);
    arps(56, 8, 0.75, 'pluck');
    s.ghost(() => s.seq('lead', 224, 0.5, MEL, 0.4));
    s.seq('lead', 256, 0.5, MEL_HI);
    s.ghost(() => arps(64, 8, 0.4));

    // outro
    s.crash(288, 0.8);
    pads(72, 8, 0.9);
    s.drums(72, 4, { hat: 'x.x.x.x.x.x.x.x.', kick: 'X.........X.....' });
    s.seq('bell', 288, 0.5, BREAK.split('|').slice(0, 4).join('|'), 0.8);
    s.crash(320);
    s.kick(320);
    s.reese(320, 'E1', 3);
    s.bell(320, 'E5', 4);
    s.pad(320, ['E3', 'B3', 'E4', 'G4'], 4, 1);
  },
};

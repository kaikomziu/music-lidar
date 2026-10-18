// HOUSE / 126 BPM
const CH = ['A3+C4+E4', 'A3+C4+F4', 'G3+C4+E4', 'G3+B3+D4'];
const PADCH = ['A2+E3+A3+C4+E4', 'F2+C3+A3+C4+F4', 'C3+G3+C4+E4+G4', 'G2+D3+G3+B3+D4'];
const ROOT = ['A2', 'F2', 'C3', 'G2'];

const RIFF =
  'E5 . E5 A5 . G5 E5 . | D5 . C5 . D5 E5 . . | E5 . E5 A5 . G5 E5 . | B5 - A5 - G5 - E5 - |';
const RIFF2 =
  'E5 . E5 A5 . G5 E5 C6 | B5 . A5 . G5 A5 . . | E5 . E5 A5 . G5 E5 . | D6 - C6 - B5 - G5 - |';
const BREAK =
  'A4 - - C5 | F5 - - E5 | E5 - - D5 | D5 - B4 G4 | A4 - - C5 | F5 - E5 F5 | G5 - - - | G5 - B5 - |';

export default {
  id: 'pulse-grid',
  urlId: 'v0r71l4ls', // 曲ページのURL (music/v0r71l4ls/)。公開後は変えない
  title: 'Pulse Grid',
  artist: 'MUSIC LiDAR',
  genre: 'HOUSE',
  bpm: 126,
  color: '#ff4fd8',
  levels: { easy: 3, normal: 6, hard: 9 },
  preview: 128,
  sidechain: true,
  compose(s) {
    const bass = (from, bars, vel = 1) => {
      for (let b = from; b < from + bars; b++) {
        const r = ROOT[b % 4];
        for (let i = 0; i < 4; i++) s.bass(b * 4 + i + 0.5, r, 0.4, vel);
      }
    };
    const stabs = (from, bars, vel = 0.8) => {
      for (let b = from; b < from + bars; b++) {
        const c = CH[b % 4].split('+');
        [0.5, 1.5, 2.75, 3.5].forEach((o) => s.stab(b * 4 + o, c, 0.3, vel));
      }
    };
    const pads = (from, bars, vel = 1) => {
      for (let b = from; b < from + bars; b++) s.pad(b * 4, PADCH[b % 4].split('+'), 4, vel);
    };
    const riff = (from, reps, type, str = RIFF, vel = 1) => {
      for (let r = 0; r < reps; r++) s.seq(type, (from + r * 4) * 4, 0.5, str, vel);
    };
    const full = { kick: 'X...X...X...X...', clap: '....X.......X...', hat: '..x...x...x...x.' };
    const fuller = { kick: 'X...X...X...X...', clap: '....X.......X...', hat: 'gxxggxxggxxggxxo' };

    // intro
    s.drums(0, 4, { kick: 'X...X...X...X...', hat: '..o...o...o...o.' });
    s.drums(4, 4, { kick: 'X...X...X...X...', hat: '..x...x...x...x.' });
    s.ghost(() => pads(0, 8, 0.6));
    bass(4, 4, 0.7);

    // groove
    s.crash(32, 0.6);
    s.drums(8, 8, full);
    bass(8, 8);
    stabs(8, 8);

    // riff in
    s.crash(64, 0.7);
    s.drums(16, 8, fuller);
    bass(16, 8);
    s.ghost(() => stabs(16, 8, 0.55));
    riff(16, 2, 'square');

    // build
    s.ghost(() => pads(24, 8, 0.8));
    riff(24, 1, 'pluck');
    s.drums(24, 4, { clap: '....X.......X...', hat: '..x...x...x...x.' });
    s.drums(28, 1, { snare: 'x...x...x...x...' });
    s.drums(29, 1, { snare: 'x.x.x.x.x.x.x.x.' });
    s.drums(30, 2, { snare: 'xxxxxxxxxxxxxxxx' });
    riff(28, 1, 'pluck');
    s.riser(112, 16, 1);

    // drop 1
    s.crash(128); s.crash(160, 0.8);
    s.drums(32, 16, fuller);
    bass(32, 16);
    s.ghost(() => { stabs(32, 16, 0.6); pads(32, 16, 0.5); });
    riff(32, 4, 'lead');

    // breakdown
    s.downer(192, 4);
    pads(48, 8, 1.1);
    s.seq('bell', 192, 1, BREAK);
    s.drums(52, 2, { hat: '..x...x...x...x.' });
    s.drums(54, 2, { kick: 'x...x...x...x...', hat: 'xxxxxxxxxxxxxxxx' });
    s.riser(216, 8, 1);

    // drop 2
    s.crash(224); s.crash(240, 0.8);
    s.drums(56, 8, fuller);
    bass(56, 8);
    s.ghost(() => { stabs(56, 8, 0.6); pads(56, 8, 0.5); });
    riff(56, 1, 'lead', RIFF2);
    riff(60, 1, 'lead', RIFF2);

    // end
    s.crash(256);
    s.kick(256);
    s.stab(256, ['A3', 'C4', 'E4', 'A4'], 2, 1);
    s.bass(256, 'A1', 2);
    s.pad(256, ['A2', 'E3', 'A3', 'C4', 'E4'], 4, 0.9);
  },
};

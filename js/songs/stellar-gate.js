// TRANCE / 138 BPM: スーパーソウのメロディと長いブレイクダウン
const PAD = ['A3+C4+E4', 'A3+C4+E4', 'F3+A3+C4', 'F3+A3+C4', 'G3+C4+E4', 'G3+C4+E4', 'G3+B3+D4', 'G3+B3+D4'];
const ROOT = ['A1', 'A1', 'F1', 'F1', 'C2', 'C2', 'G1', 'G1'];
const ARP = [['A4', 'C5', 'E5'], ['A4', 'C5', 'E5'], ['F4', 'A4', 'C5'], ['F4', 'A4', 'C5'], ['G4', 'C5', 'E5'], ['G4', 'C5', 'E5'], ['G4', 'B4', 'D5'], ['G4', 'B4', 'D5']];
const ANTHEM =
  'E5 - - - A5 - - - | G5 - E5 - D5 - C5 - | C5 - - - F5 - - - | E5 - C5 - A4 - - - |' +
  'G4 - - - C5 - - - | E5 - D5 - C5 - G5 - | G5 - - - B5 - - - | A5 - G5 - D5 - - - |';
const BREAK =
  'E5 - - - - - - - | - - - - A5 - - - | C5 - - - - - - - | F5 - - - E5 - - - |' +
  'G5 - - - - - - - | - - - - E5 - - - | D5 - - - - - - - | B4 - - - - - - - |';

export default {
  id: 'stellar-gate',
  urlId: 'mlnkp4d7s', // 曲ページのURL (music/mlnkp4d7s/)。公開後は変えない
  title: 'Stellar Gate',
  artist: 'MUSIC LiDAR',
  genre: 'TRANCE',
  bpm: 138,
  color: '#7a8bff',
  levels: { easy: 3, normal: 6, hard: 11 },
  preview: 160,
  sidechain: true,
  compose(s) {
    const pads = (from, bars, vel = 1) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, PAD[b % 8].split('+'), 4, vel); };
    const bass = (from, bars) => { for (let b = from; b < from + bars; b++) for (let i = 0; i < 4; i++) s.bass(b * 4 + i + 0.5, ROOT[b % 8], 0.42, 1); };
    const arp = (from, bars, vel = 0.7, type = 'pluck') => {
      for (let b = from; b < from + bars; b++) for (let i = 0; i < 16; i++) s[type](b * 4 + i / 4, ARP[b % 8][i % 3].replace(/\d/, (d) => (i % 6 >= 3 ? +d + 1 : d)), 0.2, vel * (i % 4 === 0 ? 1 : 0.7));
    };
    const gate = (from, bars, vel = 0.45) => { for (let b = from; b < from + bars; b++) for (let i = 0; i < 16; i += 2) s.stab(b * 4 + i / 4, PAD[b % 8].split('+'), 0.2, vel); };
    const four = { kick: 'X...X...X...X...', hat: '..x...x...x...x.', clap: '....x.......x...' };
    const fourBusy = { kick: 'X...X...X...X...', hat: 'gxxggxxggxxggxxo', clap: '....X.......X...' };

    // intro
    s.drums(0, 8, { kick: 'X...X...X...X...', hat: '..x...x...x...x.' });
    bass(4, 4);
    s.ghost(() => pads(0, 8, 0.5));
    // build: アルペジオ
    s.crash(32, 0.7);
    s.drums(8, 8, four); bass(8, 8);
    arp(8, 8, 0.75);
    // breakdown
    s.downer(64, 4);
    pads(16, 16, 1.1);
    s.seq('supersaw', 64, 1, BREAK, 0.8);
    s.ghost(() => gate(24, 8, 0.35));
    s.drums(28, 2, { snare: 'x...x...x...x...' });
    s.drums(30, 1, { snare: 'x.x.x.x.x.x.x.x.' });
    s.drums(31, 1, { snare: 'xxxxxxxxxxxxxxxx' });
    s.riser(112, 16);
    // drop
    s.crash(128); s.crash(160, 0.8);
    s.drums(32, 16, fourBusy); bass(32, 16);
    s.seq('supersaw', 128, 0.5, ANTHEM);
    s.seq('supersaw', 160, 0.5, ANTHEM);
    s.ghost(() => { gate(32, 16, 0.3); arp(32, 16, 0.35); });
    // outro
    s.crash(192, 0.7);
    s.drums(48, 8, four); bass(48, 4);
    arp(48, 8, 0.6);
    s.crash(224); s.kick(224);
    s.supersaw(224, 'A5', 3); s.pad(224, ['A3', 'C4', 'E4'], 4);
  },
};

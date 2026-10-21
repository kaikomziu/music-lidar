// WA-ROCK(和ロック) / 165 BPM: 歪んだギターと箏の速いフレーズ、和太鼓
import { pattern, bassLine, arp } from './kit.js';

const PWR = ['A2+E3+A3', 'F2+C3+F3', 'G2+D3+G3', 'E2+B2+E3'];
const ROOT = ['A1', 'F1', 'G1', 'E1'];
const KOTO = ['A4+C5+D5+E5', 'F4+A4+C5+E5', 'G4+B4+D5+E5', 'E4+G4+A4+B4'];
const THEME =
  'A5 - C6 - D6 - E6 - | G6 - E6 - D6 - C6 - | D6 - - - C6 - A5 - | G5 - - - E5 - - - |' +
  'A5 - C6 - D6 - E6 - | G6 - A6 - G6 - E6 - | D6 - C6 - A5 - G5 - | A5 - - - - - . . |';

export default {
  id: 'neon-samurai',
  urlId: 'jif318rxh', // 曲ページのURL (music/jif318rxh/)。公開後は変えない
  title: 'Neon Samurai',
  artist: 'MUSIC LiDAR',
  genre: 'WA-ROCK',
  bpm: 165,
  color: '#ff4f6e',
  levels: { easy: 4, normal: 7, hard: 12 },
  preview: 96,
  chart: { normal: { minGap: 0.16 }, hard: { minGap: 0.088, maxNps: 9.5, chordP: 0.42 } },
  compose(s) {
    const gtr = (from, bars, vel = 0.6) => pattern(s, 'guitar', from, bars, 'X.x.x.x.X.x.x.x.', (b) => PWR[b % 4], { vel, len: 0.4 });
    const koto = (from, bars, vel = 0.7) => arp(s, 'pluck', from, bars, KOTO, { step: 0.25, vel, order: [0, 1, 2, 3, 4, 3, 2, 1], oct: 1 });
    const taiko = { kick: 'X..x..X.X..x..X.', snare: '........X.......' };
    const rock = { kick: 'X.x.X.x.X.x.X.x.', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    koto(0, 4, 0.8); s.drums(0, 4, taiko);
    s.crash(16);
    s.drums(4, 8, rock); gtr(4, 8); bassLine(s, 4, 8, ROOT, 'X.x.X.x.X.x.X.x.');
    s.seq('gtrlead', 16, 0.5, THEME, 1);
    s.drums(12, 8, taiko); koto(12, 8, 0.8); bassLine(s, 12, 8, ROOT, 'X.......X.......');
    s.ghost(() => s.seq('lead', 48, 0.5, THEME, 0.35));
    s.crash(80); s.crash(112, 0.8);
    s.drums(20, 16, rock); gtr(20, 16); bassLine(s, 20, 16, ROOT, 'X.x.X.x.X.x.X.x.');
    s.seq('gtrlead', 80, 0.5, THEME, 1); s.seq('lead', 112, 0.5, THEME, 1);
    s.ghost(() => koto(28, 8, 0.35));
    s.drums(36, 4, { kick: 'X..x..X.X..x..X.', snare: 'g.g.g.g.X.g.g.gX' }); koto(36, 4, 0.9);
    s.crash(160);
    s.drums(40, 8, rock); gtr(40, 8); bassLine(s, 40, 8, ROOT, 'X.x.X.x.X.x.X.x.'); koto(40, 8, 0.75);
    s.ghost(() => s.seq('gtrlead', 160, 0.5, THEME, 0.4));
    s.crash(192); s.kick(192); s.guitar(192, ['A2', 'E3', 'A3'], 3, 1); s.bass(192, 'A1', 3); s.pluck(192, 'A5', 2);
  },
};

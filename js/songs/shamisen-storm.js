// TSUGARU ROCK / 160 BPM: 津軽三味線のような激しい撥(ばち)さばきとロックバンド
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['E4+G4+A4+B4', 'D4+E4+G4+A4', 'C4+D4+E4+G4', 'B3+D4+E4+F#4'];
const PWR = ['E2+B2+E3', 'D2+A2+D3', 'C2+G2+C3', 'B1+F#2+B2'];
const ROOT = ['E2', 'D2', 'C2', 'B1'];
const BACHI = [
  'E5 E5 B5 E5 A5 E5 G5 E5 E5 E5 B5 E5 D6 B5 A5 G5',
  'D5 D5 A5 D5 G5 D5 E5 D5 D5 D5 A5 D5 C6 A5 G5 E5',
  'C5 C5 G5 C5 E5 C5 D5 C5 C5 C5 G5 C5 A5 G5 E5 D5',
  'B4 B4 F#5 B4 E5 B4 D5 B4 B4 E5 F#5 A5 B5 D6 E6 F#6',
];
const THEME = 'E6 - - - B5 - - - | D6 - - - A5 - G5 - | E5 - G5 - A5 - C6 - | B5 - - - - - - - |';

export default {
id: 'shamisen-storm',
  urlId: '9w7t42tep', // 曲ページのURL (music/9w7t42tep/)。公開後は変えない
  title: 'Shamisen Storm',
  artist: 'MUSIC LiDAR',
  genre: 'WA-ROCK',
  bpm: 160,
  color: '#ff4f6e',
  levels: { easy: 4, normal: 8, hard: 12 },
  preview: 96,
  chart: { normal: { minGap: 0.16 }, hard: { minGap: 0.085, maxNps: 10, chordP: 0.42 } },
  compose(s) {

    const bachi = (from, bars, vel = 0.9) => { for (let b = from; b < from + bars; b++) s.seq('pluck', b * 4, 0.25, BACHI[b % 4], vel); };
    const gtr = (from, bars, vel = 0.5) => pattern(s, 'guitar', from, bars, 'X.x.X.x.X.x.X.x.', (b) => PWR[b % 4], { vel, len: 0.35 });
    const rock = { kick: 'X.x.X.x.X.x.X.x.', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const taiko = { kick: 'X..x..X.X..x..X.', snare: '........X.......' };
    bachi(0, 4, 0.95); s.drums(2, 2, taiko);
    s.crash(16);
    s.drums(4, 8, rock); gtr(4, 8); bassLine(s, 4, 8, ROOT, 'X.x.X.x.X.x.X.x.'); s.seq('gtrlead', 16, 0.5, THEME + THEME, 1);
    s.drums(12, 8, taiko); bachi(12, 8); bassLine(s, 12, 8, ROOT, 'X.......X.......');
    s.crash(80); s.crash(112, 0.8);
    s.drums(20, 16, rock); gtr(20, 16, 0.45); bassLine(s, 20, 16, ROOT, 'X.x.X.x.X.x.X.x.');
    s.seq('gtrlead', 80, 0.5, THEME + THEME, 1); bachi(28, 8, 0.85);
    s.drums(36, 4, { kick: 'XXXXXXXXXXXXXXXX', snare: '....X.......X...' }); bachi(36, 4, 1);
    s.crash(160); s.kick(160); s.guitar(160, ['E2', 'B2', 'E3'], 3, 1); s.pluck(160, 'E5', 2); s.bass(160, 'E2', 3);
  },
};

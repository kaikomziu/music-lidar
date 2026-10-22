// ANISON / 172 BPM: アニメのオープニング風。疾走するバンドと高く伸びるサビ
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['D4+F#4+A4', 'A3+C#4+E4', 'B3+D4+F#4', 'G3+B3+D4'];
const PWR = ['D2+A2+D3', 'A1+E2+A2', 'B1+F#2+B2', 'G1+D2+G2'];
const ROOT = ['D2', 'A1', 'B1', 'G1'];
const VERSE =
  'F#5 - E5 - D5 - E5 - | F#5 - A5 - - - E5 - | D5 - B4 - D5 - F#5 - | G5 - F#5 - E5 - - - |';
const CHORUS =
  'A5 - - - D6 - - - | C#6 - B5 - A5 - E5 - | F#5 - - - B5 - A5 - | G5 - A5 - B5 - D6 - |' +
  'E6 - - - D6 - C#6 - | D6 - - - A5 - - - | B5 - C#6 - D6 - F#6 - | E6 - - - - - - - |';

export default {
id: 'brave-horizon',
  urlId: 'u69ib8g4k', // 曲ページのURL (music/u69ib8g4k/)。公開後は変えない
  title: 'Brave Horizon',
  artist: 'MUSIC LiDAR',
  genre: 'ANISON',
  bpm: 172,
  color: '#5ef2ff',
  levels: { easy: 4, normal: 7, hard: 11 },
  preview: 64,
  chart: { normal: { minGap: 0.16 }, hard: { minGap: 0.085, maxNps: 9.5, chordP: 0.42 } },
  compose(s) {

    const gtr = (from, bars, vel = 0.5) => pattern(s, 'guitar', from, bars, 'X.x.X.x.X.x.X.x.', (b) => PWR[b % 4], { vel, len: 0.35 });
    const run = { kick: 'X.x.X.x.X.x.X.x.', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    s.seq('gtrlead', 0, 0.25, 'D5 F#5 A5 D6 '.repeat(4) + 'A4 C#5 E5 A5 '.repeat(4) + 'B4 D5 F#5 B5 '.repeat(4) + 'G4 B4 D5 G5 '.repeat(4), 0.85);
    s.crash(16);
    s.drums(4, 8, run); gtr(4, 8); bassLine(s, 4, 8, ROOT, 'X.x.X.x.X.x.X.x.'); s.seq('lead', 16, 0.5, VERSE + VERSE, 0.95);
    build(s, 12);
    s.crash(56); s.crash(88, 0.8);
    s.drums(14, 16, { ...run, hat: 'xxxxxxxxxxxxxxxx' }); gtr(14, 16, 0.45); bassLine(s, 14, 16, ROOT, 'X.x.X.x.X.x.X.x.'); sustain(s, 'pad', 14, 16, PROG, 0.35);
    s.seq('supersaw', 56, 0.5, CHORUS + CHORUS, 1);
    s.drums(30, 4, run); s.seq('gtrlead', 120, 0.25, 'A5 B5 C#6 D6 E6 F#6 E6 D6 '.repeat(4) + 'B5 C#6 D6 E6 F#6 A6 F#6 E6 '.repeat(4), 0.9);
    s.crash(136);
    s.drums(34, 8, { ...run, hat: 'xxxxxxxxxxxxxxxx' }); gtr(34, 8, 0.45); bassLine(s, 34, 8, ROOT, 'X.x.X.x.X.x.X.x.');
    s.seq('lead', 136, 0.5, CHORUS, 1); s.ghost(() => s.seq('supersaw', 136, 0.5, CHORUS, 0.4));
    s.crash(168); s.kick(168); s.guitar(168, ['D2', 'A2', 'D3'], 3, 1); s.bass(168, 'D2', 3);
  },
};

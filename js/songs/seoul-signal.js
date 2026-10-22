// K-POP / 128 BPM: キレのあるダンスビートと、耳に残るフック
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['D4+F4+A4', 'Bb3+D4+F4', 'C4+E4+G4', 'A3+C#4+E4'];
const ROOT = ['D2', 'Bb1', 'C2', 'A1'];
const VERSE =
  'A5 . A5 . F5 . D5 . | F5 - G5 - A5 - . . | G5 . G5 . E5 . C5 . | E5 - F5 - G5 - . . |' +
  'A5 . A5 . F5 . D5 . | Bb5 - A5 - F5 - . . | G5 . A5 . Bb5 . C6 . | C#6 - - - A5 - . . |';
const HOOK =
  'D6 - D6 - C6 - A5 - | F5 - - - D6 - - - | C6 - C6 - Bb5 - G5 - | E5 - - - C#6 - - - |';

export default {
id: 'seoul-signal',
  urlId: 'r2znzienj', // 曲ページのURL (music/r2znzienj/)。公開後は変えない
  title: 'Seoul Signal',
  artist: 'MUSIC LiDAR',
  genre: 'K-POP',
  bpm: 128,
  color: '#ff5ea8',
  levels: { easy: 2, normal: 5, hard: 8 },
  preview: 64,
  chart: { hard: { minGap: 0.1, maxNps: 7.5 } },
  sidechain: true,
  compose(s) {

    const dance = { kick: 'X...X...X...X...', clap: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const synth = (from, bars, vel = 0.4) => pattern(s, 'stab', from, bars, 'X..X..X.....X...', (b) => PROG[b % 4], { vel, len: 0.2 });
    s.drums(0, 4, { kick: 'X...X...X...X...', hat: '..x...x...x...x.' }); synth(2, 2, 0.5);
    s.drums(4, 8, dance); bassLine(s, 4, 8, ROOT, 'X..X..X...X..X..'); s.ghost(() => synth(4, 8, 0.3));
    s.seq('lead', 16, 0.5, VERSE, 0.95);
    build(s, 12);
    s.crash(56); s.crash(72, 0.8);
    s.drums(14, 8, { ...dance, hat: 'xxxxxxxxxxxxxxxx' }); bassLine(s, 14, 8, ROOT, 'X..X..X...X..X..'); synth(14, 8);
    s.seq('supersaw', 56, 0.5, HOOK + HOOK, 1);
    s.drums(22, 4, { kick: 'X.......X.......', snare: '....X.......X...' }); s.seq('pluck', 88, 0.25, 'D5 F5 A5 D6 '.repeat(4) + 'Bb4 D5 F5 Bb5 '.repeat(4) + 'C5 E5 G5 C6 '.repeat(4) + 'A4 C#5 E5 A5 '.repeat(4), 0.75);
    s.crash(104);
    s.drums(26, 8, dance); bassLine(s, 26, 8, ROOT, 'X..X..X...X..X..'); s.ghost(() => synth(26, 8, 0.3)); s.seq('square', 104, 0.5, VERSE, 1);
    build(s, 34);
    s.crash(144); s.crash(160, 0.8);
    s.drums(36, 8, { ...dance, hat: 'xxxxxxxxxxxxxxxx' }); bassLine(s, 36, 8, ROOT, 'X..X..X...X..X..'); synth(36, 8);
    s.seq('supersaw', 144, 0.5, HOOK + HOOK, 1); s.ghost(() => s.seq('lead', 144, 0.5, HOOK + HOOK, 0.4));
    s.crash(176); s.kick(176); s.stab(176, ['D4', 'F4', 'A4', 'D5'], 2, 1); s.bass(176, 'D2', 2);
  },
};

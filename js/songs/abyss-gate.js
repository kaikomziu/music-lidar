// HARDCORE / 200 BPM(鬼畜): 深淵の門。暗いスーパーソウと、ねじれる16分のリード
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['C#4+E4+G#4', 'A3+C#4+E4', 'F#3+A3+C#4', 'G#3+B#3+D#4'];
const ROOT = ['C#2', 'A1', 'F#1', 'G#1'];
const LEAD = [
  'C#6 G#5 E5 G#5 C#6 E6 D#6 C#6 B5 G#5 E5 G#5 B5 C#6 D#6 E6',
  'A5 E5 C#5 E5 A5 C#6 B5 A5 G#5 E5 C#5 E5 G#5 A5 B5 C#6',
  'F#5 C#5 A4 C#5 F#5 A5 G#5 F#5 E5 C#5 A4 C#5 E5 F#5 G#5 A5',
  'G#5 D#5 B#4 D#5 G#5 B#5 C#6 D#6 E6 D#6 C#6 B#5 G#5 F#5 E5 D#5',
];
const THEME = 'C#6 - - - G#5 - - - | E6 - - - C#6 - - - | A5 - - - C#6 - - - | B#5 - - - D#6 - - - |';

export default {
  id: 'abyss-gate',
  urlId: 'xfrpw4577', // 曲ページのURL (music/xfrpw4577/)。公開後は変えない
  title: 'Abyss Gate',
  artist: 'MUSIC LiDAR',
  genre: 'HARDCORE',
  bpm: 200,
  color: '#8a3dff',
  levels: { easy: 5, normal: 10, hard: 13 },
  preview: 128,
  chart: {
    easy: { minGap: 0.27, maxNps: 3.3 },
    normal: { minGap: 0.12, maxNps: 7, chordP: 0.3 },
    hard: { minGap: 0.068, maxNps: 13.5, minScore: 0.45, chordP: 0.48, chordMax: 3, sameGap: 0.068 },
  },
  compose(s) {
    const lead = (from, bars, type = 'lead', vel = 0.9) => { for (let b = from; b < from + bars; b++) s.seq(type, b * 4, 0.25, LEAD[b % 4], vel); };
    const core = { hardkick: 'X...X...X...X...', hat: 'xxxxxxxxxxxxxxxx', clap: '....x.......x...' };
    sustain(s, 'pad', 0, 8, PROG, 0.7); s.seq('supersaw', 0, 1, THEME.replace(/6/g, '5').repeat(2), 0.6);
    s.drums(4, 4, { hardkick: 'X...X...X...X...' });
    s.crash(32);
    s.drums(8, 16, core); bassLine(s, 8, 16, ROOT, '..X...X...X...X.'); lead(8, 16);
    pattern(s, 'stab', 8, 16, 'x..x..x.x..x..x.', (b) => PROG[b % 4], { vel: 0.35, len: 0.2 });
    s.downer(96, 4); sustain(s, 'pad', 24, 6, PROG, 0.9); s.seq('supersaw', 96, 0.5, THEME + THEME, 0.85); build(s, 30);
    s.crash(128); s.crash(160, 0.8);
    s.drums(32, 16, { ...core, hardkick: 'X..XX...X..XX...' }); bassLine(s, 32, 16, ROOT, '..X...X...X...X.');
    lead(32, 16, 'supersaw', 0.85); s.ghost(() => s.seq('bell', 128, 1, THEME.repeat(4), 0.4));
    arp(s, 'square', 40, 8, PROG, { step: 0.25, vel: 0.7, order: [0, 1, 2, 3, 2, 1, 0, 1], oct: 1 });
    s.drums(48, 4, { hardkick: 'XXXXXXXXXXXXXXXX', clap: 'x.x.x.x.x.x.xxxx' }); lead(48, 4, 'lead', 1);
    s.crash(208); s.hardkick(208); s.stab(208, ['C#4', 'E4', 'G#4', 'C#5'], 3, 1); s.bass(208, 'C#2', 2);
  },
};

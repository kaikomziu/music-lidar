// WA-CORE(和風コア) / 222 BPM(鬼畜): 桜吹雪。箏の超高速トレモロと和太鼓、ハードコアのキック
import { sustain, bassLine, arp, build } from './kit.js';

const PROG = ['A4+C5+D5+E5', 'F4+A4+C5+E5', 'G4+B4+D5+E5', 'E4+G4+A4+B4'];
const ROOT = ['A1', 'F1', 'G1', 'E1'];
const MEL =
  'A5 - C6 - D6 - E6 - | G6 - E6 - D6 - C6 - | B5 - D6 - E6 - G6 - | A6 - - - E6 - - - |' +
  'E6 - D6 - C6 - A5 - | C6 - D6 - E6 - A6 - | G6 - E6 - D6 - B5 - | A5 - - - - - - - |';

export default {
  id: 'sakura-blizzard',
  urlId: '4zh6n2vj5', // 曲ページのURL (music/4zh6n2vj5/)。公開後は変えない
  title: 'Sakura Blizzard',
  artist: 'MUSIC LiDAR',
  genre: 'WA-CORE',
  bpm: 222,
  color: '#ff7aa8',
  levels: { easy: 6, normal: 10, hard: 15 },
  preview: 128,
  chart: {
    easy: { minGap: 0.28, maxNps: 3.5 },
    normal: { minGap: 0.12, maxNps: 7.2, chordP: 0.3 },
    hard: { minGap: 0.064, maxNps: 14, minScore: 0.45, chordP: 0.48, chordMax: 3, sameGap: 0.064 },
  },
  compose(s) {
    const koto = (from, bars, vel = 0.8) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 5, 6, 5, 4, 3], oct: 1 });
    const taiko = { kick: 'X..x..X.X..x..X.', snare: '........X.......' };
    const core = { hardkick: 'X...X...X...X...', snare: '..x...x...x...x.', hat: 'xxxxxxxxxxxxxxxx' };
    koto(0, 8, 0.7); s.drums(0, 8, taiko);
    s.crash(32);
    s.drums(8, 16, core); bassLine(s, 8, 16, ROOT, '..X...X...X...X.'); s.seq('lead', 32, 0.5, MEL + MEL, 1); s.ghost(() => koto(8, 16, 0.35));
    s.drums(24, 6, taiko); sustain(s, 'pad', 24, 8, PROG, 0.8); koto(24, 6, 0.9); build(s, 30);
    s.crash(128); s.crash(160, 0.8);
    s.drums(32, 16, { ...core, hardkick: 'X.X.X.X.X.X.X.X.' }); bassLine(s, 32, 16, ROOT, 'X.X.X.X.X.X.X.X.'); koto(32, 16, 0.85);
    s.ghost(() => s.seq('square', 128, 0.5, MEL + MEL, 0.4));
    s.drums(48, 8, core); bassLine(s, 48, 8, ROOT, '..X...X...X...X.'); s.seq('lead', 192, 0.5, MEL, 1); koto(48, 8, 0.6);
    s.crash(224); s.kick(224); s.hardkick(224); s.pluck(224, 'A5', 3); s.pad(224, ['A3', 'E4', 'A4'], 4, 0.8); s.bass(224, 'A1', 2);
  },
};

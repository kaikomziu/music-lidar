// FRENCHCORE / 190 BPM(鬼畜): キックがマシンガンのように連射される。ベースとキックで叩くリズム譜面
import { sustain, bassLine, arp } from './kit.js';

const PROG = ['G4+Bb4+D5', 'Eb4+G4+Bb4', 'F4+A4+C5', 'D4+F#4+A4'];
const ROOT = ['G1', 'Eb2', 'F1', 'D2'];
const KICKS = ['X.X.X.X.X.X.X.X.', 'X.XXX.X.X.XXX.XX', 'XXXXX.X.XXXXX.X.', 'X.X.XXXXX.X.XXXX'];
const HOOK =
  'G5 - Bb5 - D6 - G6 - | Eb6 - - - Bb5 - G5 - | F5 - A5 - C6 - F6 - | F#6 - - - D6 - A5 - |';

export default {
  id: 'kick-machinegun',
  urlId: 'm2vs2ma1t', // 曲ページのURL (music/m2vs2ma1t/)。公開後は変えない
  title: 'Kick Machinegun',
  artist: 'MUSIC LiDAR',
  genre: 'FRENCHCORE',
  bpm: 190,
  color: '#ff7a3d',
  levels: { easy: 5, normal: 9, hard: 12 },
  preview: 96,
  chart: {
    easy: { minGap: 0.27, maxNps: 3.2 },
    normal: { minGap: 0.125, maxNps: 6.8, chordP: 0.3 },
    hard: { minGap: 0.07, maxNps: 12.5, minScore: 0.45, chordP: 0.45, chordMax: 3, sameGap: 0.07 },
  },
  compose(s) {
    const guns = (from, bars) => { for (let b = from; b < from + bars; b++) s.drums(b, 1, { hardkick: KICKS[b % 4], clap: '....x.......x...' }); };
    sustain(s, 'pad', 0, 8, PROG, 0.7); s.seq('supersaw', 0, 0.5, HOOK + HOOK, 0.7);
    s.drums(4, 4, { hardkick: 'X...X...X...X...' });
    s.crash(32);
    guns(8, 16); bassLine(s, 8, 16, ROOT, '..X...X...X...X.'); s.seq('lead', 32, 0.5, HOOK.repeat(4), 0.95);
    sustain(s, 'pad', 24, 4, PROG, 0.9); arp(s, 'pluck', 24, 4, PROG, { step: 0.25, vel: 0.7, order: [0, 1, 2, 3, 2, 1] });
    s.drums(27, 1, { hardkick: 'XXXXXXXXXXXXXXXX' });
    s.crash(112); s.crash(144, 0.8);
    guns(28, 16); bassLine(s, 28, 16, ROOT, 'X.X.X.X.X.X.X.X.');
    s.seq('supersaw', 112, 0.5, HOOK.repeat(4), 1);
    arp(s, 'square', 36, 8, PROG, { step: 0.25, vel: 0.75, order: [0, 1, 2, 3, 4, 3, 2, 1], oct: 1 });
    s.drums(44, 4, { hardkick: 'XXXXXXXXXXXXXXXX', clap: 'x...x...x.x.xxxx' });
    s.crash(192); s.hardkick(192); s.stab(192, ['G4', 'Bb4', 'D5', 'G5'], 3, 1); s.bass(192, 'G1', 2);
  },
};

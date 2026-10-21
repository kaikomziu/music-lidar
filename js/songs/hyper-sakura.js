// J-CORE / 175 BPM: かわいい和風メロディを、ハードコアのキックで駆け抜ける
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['F4+A4+C5', 'G4+Bb4+D5', 'E4+G4+C5', 'A4+C5+E5'];
const ROOT = ['F1', 'G1', 'C2', 'A1'];
const MEL =
  'C6 - D6 - F6 - G6 - | A6 - G6 - F6 - D6 - | E6 - D6 - C6 - G5 - | A5 - C6 - E6 - - - |' +
  'C6 - D6 - F6 - A6 - | Bb6 - A6 - G6 - F6 - | G6 - E6 - C6 - D6 - | E6 - - - - - - - |';

export default {
  id: 'hyper-sakura',
  urlId: 'atpt5m0ob', // 曲ページのURL (music/atpt5m0ob/)。公開後は変えない
  title: 'Hyper Sakura',
  artist: 'MUSIC LiDAR',
  genre: 'J-CORE',
  bpm: 175,
  color: '#ff9de2',
  levels: { easy: 4, normal: 8, hard: 12 },
  preview: 96,
  sidechain: true,
  chart: { normal: { minGap: 0.15 }, hard: { minGap: 0.08, maxNps: 10.5, chordP: 0.42 } },
  compose(s) {
    const koto = (from, bars, vel = 0.7) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 4, 3, 2, 1], oct: 1 });
    const core = { hardkick: 'X...X...X...X...', hat: 'g.x.g.x.g.x.g.xg', clap: '....x.......x...' };
    sustain(s, 'pad', 0, 4, PROG, 0.6); s.seq('bell', 0, 0.5, MEL.split('|').slice(0, 4).join('|'), 0.7);
    s.crash(16);
    s.drums(4, 8, core); bassLine(s, 4, 8, ROOT, '..X...X...X...X.'); koto(4, 8);
    s.seq('square', 16, 0.5, MEL, 0.9);
    sustain(s, 'pad', 12, 4, PROG, 0.8); s.seq('bell', 48, 0.5, MEL.split('|').slice(4).join('|'), 0.85); build(s, 14);
    s.crash(64); s.crash(96, 0.8);
    s.drums(16, 16, { ...core, hardkick: 'X...X...X...X.X.' }); bassLine(s, 16, 16, ROOT, '..X...X...X...X.');
    pattern(s, 'supersaw', 16, 16, 'X..X..X...X..X..', (b) => PROG[b % 4], { vel: 0.35 });
    s.seq('lead', 64, 0.5, MEL, 1); s.seq('chip', 96, 0.5, MEL, 1);
    s.drums(32, 4, { hardkick: 'X.X.X.X.X.X.XXXX' }); koto(32, 4, 0.95);
    s.crash(144);
    s.drums(36, 8, core); bassLine(s, 36, 8, ROOT, '..X...X...X...X.'); koto(36, 8, 0.6); s.seq('lead', 144, 0.5, MEL, 1);
    s.crash(176); s.hardkick(176); s.stab(176, ['F4', 'A4', 'C5', 'F5'], 3, 1); s.bass(176, 'F1', 2);
  },
};

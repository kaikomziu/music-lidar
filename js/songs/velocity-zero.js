// TRANCECORE / 185 BPM(鬼畜): トランスのきらきらしたメロディを、ハードコアの速さで
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['A3+C4+E4', 'F3+A3+C4', 'C4+E4+G4', 'G3+B3+D4'];
const ROOT = ['A1', 'F1', 'C2', 'G1'];
const ANTHEM =
  'E6 - - - A5 - C6 - | D6 - C6 - A5 - - - | C6 - - - F6 - E6 - | D6 - C6 - G5 - - - |' +
  'E6 - - - A6 - G6 - | E6 - D6 - C6 - - - | C6 - D6 - E6 - G6 - | B6 - - - G6 - - - |';

export default {
  id: 'velocity-zero',
  urlId: 'n7dfdx2tx', // 曲ページのURL (music/n7dfdx2tx/)。公開後は変えない
  title: 'Velocity Zero',
  artist: 'MUSIC LiDAR',
  genre: 'TRANCECORE',
  bpm: 185,
  color: '#5e9bff',
  levels: { easy: 4, normal: 9, hard: 12 },
  preview: 128,
  sidechain: true,
  chart: {
    easy: { minGap: 0.27, maxNps: 3.1 },
    normal: { minGap: 0.125, maxNps: 6.8, chordP: 0.3 },
    hard: { minGap: 0.07, maxNps: 12, minScore: 0.45, chordP: 0.45, chordMax: 3, sameGap: 0.07 },
  },
  compose(s) {
    const trance = (from, bars, vel = 0.75) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 4, 3, 2, 1], oct: 1 });
    const core = { hardkick: 'X...X...X...X...', hat: 'g.x.g.x.g.x.g.xg', clap: '....x.......x...' };
    sustain(s, 'pad', 0, 8, PROG, 0.6); s.ghost(() => trance(0, 8, 0.4));
    s.crash(32);
    s.drums(8, 16, core); bassLine(s, 8, 16, ROOT, '..X...X...X...X.'); trance(8, 16);
    s.seq('lead', 64, 0.5, ANTHEM, 0.9);
    s.downer(96, 4); sustain(s, 'pad', 24, 8, PROG, 0.9); s.seq('supersaw', 96, 0.5, ANTHEM, 0.85); build(s, 30);
    s.crash(128); s.crash(160, 0.8);
    s.drums(32, 16, { ...core, hardkick: 'X...X...X...X.X.' }); bassLine(s, 32, 16, ROOT, '..X...X...X...X.');
    s.seq('supersaw', 128, 0.5, ANTHEM + ANTHEM, 1); trance(32, 16, 0.6);
    pattern(s, 'stab', 40, 8, 'x.x.x.x.x.x.x.x.', (b) => PROG[b % 4], { vel: 0.35, len: 0.15 });
    s.drums(48, 4, { hardkick: 'X.X.X.X.XXXXXXXX' }); trance(48, 4, 0.95);
    s.crash(208); s.hardkick(208); s.supersaw(208, 'A5', 3); s.supersaw(208, 'E6', 3); s.bass(208, 'A1', 2);
  },
};

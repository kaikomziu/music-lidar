// SPEEDCORE / 240 BPM(鬼畜): 1秒1小節の暴走。ハードキックの連打と32分のアルペジオ
import { sustain, bassLine, arp } from './kit.js';

const PROG = ['E4+G4+B4', 'C4+E4+G4', 'D4+F#4+A4', 'B3+D#4+F#4'];
const ROOT = ['E1', 'C2', 'D2', 'B1'];
const HOOK =
  'E6 - B5 - G5 - E6 - | C6 - G5 - E5 - C6 - | D6 - A5 - F#5 - D6 - | D#6 - F#6 - B6 - - - |' +
  'G6 - E6 - B5 - G6 - | E6 - C6 - G5 - E6 - | F#6 - D6 - A5 - F#6 - | B6 - - - D#6 - - - |';

export default {
  id: 'neutron-overdrive',
  urlId: 'l1so1j4wt', // 曲ページのURL (music/l1so1j4wt/)。公開後は変えない
  title: 'Neutron Overdrive',
  artist: 'MUSIC LiDAR',
  genre: 'SPEEDCORE',
  bpm: 240,
  color: '#ff2d55',
  levels: { easy: 5, normal: 11, hard: 15 },
  preview: 160,
  chart: {
    easy: { minGap: 0.27, maxNps: 3.6 },
    normal: { minGap: 0.12, maxNps: 7.5, chordP: 0.3 },
    hard: { minGap: 0.062, maxNps: 15.5, minScore: 0.4, chordP: 0.5, chordMax: 3, sameGap: 0.062, lnMin: 0.25 },
  },
  compose(s) {
    const run = (from, bars, vel = 0.85, type = 'pluck') => arp(s, type, from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 6, 5], oct: 1 });
    const core = { hardkick: 'X...X...X...X...', hat: 'x.x.x.x.x.x.x.x.', clap: '....x.......x...' };
    const roll = { hardkick: 'X.X.X.X.X.X.X.X.', hat: 'xxxxxxxxxxxxxxxx', clap: '....x.......x...' };
    sustain(s, 'pad', 0, 8, PROG, 0.6); s.seq('supersaw', 0, 1, 'E5 - - - | C5 - - - | D5 - - - | D#5 - - - |'.repeat(2), 0.6);
    s.drums(4, 4, { hardkick: 'X...X...X...X...' });
    s.crash(32);
    s.drums(8, 16, core); bassLine(s, 8, 16, ROOT, '..X...X...X...X.'); run(8, 16);
    s.seq('supersaw', 64, 0.5, HOOK, 0.9);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, roll); bassLine(s, 24, 16, ROOT, '..X...X...X...X.'); s.seq('lead', 96, 0.5, HOOK + HOOK, 1);
    run(24, 16, 0.7, 'square');
    s.downer(160, 4); sustain(s, 'pad', 40, 8, PROG, 0.9); s.seq('bell', 160, 0.5, HOOK, 0.85);
    s.drums(46, 2, { hardkick: 'XXXXXXXXXXXXXXXX', clap: 'x.x.x.x.xxxxxxxx' }); s.riser(176, 8, 0.9);
    s.crash(192); s.crash(224, 0.8); s.crash(256, 0.8);
    s.drums(48, 24, roll); bassLine(s, 48, 24, ROOT, 'X.X.X.X.X.X.X.X.'); run(48, 24, 0.9);
    s.seq('supersaw', 192, 0.5, HOOK + HOOK + HOOK, 1);
    s.crash(288); s.hardkick(288); s.stab(288, ['E4', 'G4', 'B4', 'E5'], 3, 1); s.bass(288, 'E1', 2);
  },
};

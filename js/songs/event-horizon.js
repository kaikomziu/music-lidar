// TERRORCORE / 230 BPM(鬼畜): ブラックホールの事象の地平線。暗くて重い高速ハードコア
import { sustain, bassLine, arp } from './kit.js';

const PROG = ['C4+Eb4+G4', 'Ab3+C4+Eb4', 'F3+Ab3+C4', 'G3+B3+D4'];
const ROOT = ['C2', 'Ab1', 'F1', 'G1'];
const HOOK =
  'C6 - G5 - Eb6 - D6 - | C6 - Ab5 - Eb5 - Ab5 - | F5 - Ab5 - C6 - F6 - | D6 - B5 - G5 - B5 - |' +
  'Eb6 - D6 - C6 - G5 - | Ab5 - C6 - Eb6 - G6 - | F6 - Eb6 - D6 - C6 - | B5 - - - G5 - - - |';

export default {
  id: 'event-horizon',
  urlId: 'yqs3b4prl', // 曲ページのURL (music/yqs3b4prl/)。公開後は変えない
  title: 'Event Horizon',
  artist: 'MUSIC LiDAR',
  genre: 'TERRORCORE',
  bpm: 230,
  color: '#b03dff',
  levels: { easy: 5, normal: 11, hard: 15 },
  preview: 128,
  chart: {
    easy: { minGap: 0.27, maxNps: 3.5 },
    normal: { minGap: 0.12, maxNps: 8, chordP: 0.35 },
    hard: { minGap: 0.064, maxNps: 15, minScore: 0.4, chordP: 0.55, chordMax: 3, sameGap: 0.064 },
  },
  compose(s) {
    const run = (from, bars, vel = 0.85, type = 'pluck') => arp(s, type, from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 4, 5, 4, 3, 2, 1], oct: 1 });
    const terror = { hardkick: 'X.X.X.X.X.X.X.X.', hat: 'xxxxxxxxxxxxxxxx', clap: '....X.......X...' };
    sustain(s, 'pad', 0, 8, PROG, 0.8); s.downer(0, 8); s.drums(4, 4, { hardkick: 'X...X...X...X...' });
    s.crash(32);
    s.drums(8, 16, terror); bassLine(s, 8, 16, ROOT, 'X.X.X.X.X.X.X.X.'); run(8, 16);
    s.seq('supersaw', 64, 0.5, HOOK, 0.95);
    sustain(s, 'pad', 24, 4, PROG, 1); s.seq('bell', 96, 0.5, HOOK.split('|').slice(0, 4).join('|'), 0.8);
    s.drums(27, 1, { hardkick: 'XXXXXXXXXXXXXXXX' });
    s.crash(112); s.crash(144, 0.8); s.crash(176, 0.8);
    s.drums(28, 24, terror); bassLine(s, 28, 24, ROOT, 'X.X.X.X.X.X.X.X.'); run(28, 24, 0.8, 'square');
    s.seq('lead', 112, 0.5, HOOK + HOOK + HOOK.split('|').slice(0, 8).join('|'), 1);
    // 地平線の向こう側
    s.crash(208);
    s.drums(52, 8, { hardkick: 'XXXXXXXXXXXXXXXX', clap: '....X.......X...' }); bassLine(s, 52, 8, ROOT, 'X.X.X.X.X.X.X.X.');
    run(52, 8, 0.95); s.seq('supersaw', 208, 0.5, HOOK, 1);
    s.crash(240); s.hardkick(240); s.stab(240, ['C4', 'Eb4', 'G4', 'C5'], 3, 1); s.bass(240, 'C2', 2);
  },
};

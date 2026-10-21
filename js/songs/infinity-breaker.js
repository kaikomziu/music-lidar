// SPEEDCORE / 260 BPM(最難関): 最後の壁。260BPMの16分と3つ押し、途中で止まって再加速
import { sustain, bassLine, arp } from './kit.js';

const PROG = ['D4+F4+A4', 'Bb3+D4+F4', 'G3+Bb3+D4', 'A3+C#4+E4'];
const ROOT = ['D2', 'Bb1', 'G1', 'A1'];
const HOOK =
  'D6 - A5 - F6 - D6 - | Bb5 - F5 - D6 - Bb5 - | G5 - Bb5 - D6 - G6 - | A6 - - - C#6 - E6 - |' +
  'F6 - E6 - D6 - A5 - | F6 - D6 - Bb5 - F5 - | G6 - F6 - D6 - Bb5 - | A5 - C#6 - E6 - A6 - |';

export default {
  id: 'infinity-breaker',
  urlId: 'tvzhh4b3e', // 曲ページのURL (music/tvzhh4b3e/)。公開後は変えない
  title: 'Infinity Breaker',
  artist: 'MUSIC LiDAR',
  genre: 'SPEEDCORE',
  bpm: 260,
  color: '#ff0040',
  levels: { easy: 6, normal: 12, hard: 15 },
  preview: 192,
  chart: {
    easy: { minGap: 0.26, maxNps: 3.9 },
    normal: { minGap: 0.11, maxNps: 8.5, chordP: 0.35 },
    hard: { minGap: 0.055, maxNps: 16.5, minScore: 0.4, chordP: 0.55, chordMax: 3, sameGap: 0.055, lnMin: 0.25 },
  },
  gimmicks: [
    { beat: 252, type: 'stop', beats: 4 },
    { beat: 256, type: 'speed', to: 1.4, beats: 32 },
  ],
  compose(s) {
    const run = (from, bars, vel = 0.85, type = 'pluck') => arp(s, type, from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5], oct: 1 });
    const core = { hardkick: 'X...X...X...X...', hat: 'xxxxxxxxxxxxxxxx', clap: '....x.......x...' };
    const roll = { hardkick: 'X.X.X.X.X.X.X.X.', hat: 'xxxxxxxxxxxxxxxx', clap: '....X.......X...' };
    sustain(s, 'pad', 0, 8, PROG, 0.8); s.seq('supersaw', 0, 1, 'D5 - - - | Bb4 - - - | G4 - - - | A4 - - - |'.repeat(2), 0.6);
    s.drums(4, 4, { hardkick: 'X...X...X...X...' });
    s.crash(32);
    s.drums(8, 24, core); bassLine(s, 8, 24, ROOT, '..X...X...X...X.'); run(8, 24);
    s.seq('supersaw', 64, 0.5, HOOK + HOOK, 0.95);
    s.crash(128); s.crash(160, 0.8);
    s.drums(32, 24, roll); bassLine(s, 32, 24, ROOT, 'X.X.X.X.X.X.X.X.'); run(32, 24, 0.8, 'square');
    s.seq('lead', 128, 0.5, HOOK + HOOK + HOOK, 1);
    s.drums(56, 7, { hardkick: 'XXXXXXXXXXXXXXXX', clap: '....X.......X...' }); run(56, 7, 0.95);
    // 止まって、再加速
    sustain(s, 'pad', 63, 1, PROG, 1);
    s.crash(256); s.crash(288, 0.8);
    s.drums(64, 16, roll); bassLine(s, 64, 16, ROOT, 'X.X.X.X.X.X.X.X.'); run(64, 16, 1);
    s.seq('supersaw', 256, 0.5, HOOK + HOOK, 1);
    s.crash(320); s.hardkick(320); s.stab(320, ['D4', 'F4', 'A4', 'D5'], 4, 1); s.bass(320, 'D2', 3);
  },
};

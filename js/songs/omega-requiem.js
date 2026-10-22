// ORCHESTRAL CORE / 210 BPM(鬼畜): 合唱のような弦と金管が、ハードコアのキックの上で鳴り響く最終楽章
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['D4+F4+A4', 'Bb3+D4+F4', 'G3+Bb3+D4', 'A3+C#4+E4'];
const ROOT = ['D2', 'Bb1', 'G1', 'A1'];
const CHOIR =
  'D6 - - - A5 - - - | F6 - - - D6 - - - | D6 - - - Bb5 - G5 - | C#6 - - - E6 - - - |' +
  'F6 - - - D6 - A5 - | Bb5 - D6 - F6 - Bb6 - | G6 - F6 - D6 - Bb5 - | A6 - - - - - - - |';

export default {
id: 'omega-requiem',
  urlId: '006lup0eg', // 曲ページのURL (music/006lup0eg/)。公開後は変えない
  title: 'Omega Requiem',
  artist: 'MUSIC LiDAR',
  genre: 'ORCHESTRAL CORE',
  bpm: 210,
  color: '#ffd25e',
  levels: { easy: 5, normal: 11, hard: 14 },
  preview: 128,
  chart: { easy: { minGap: 0.27, maxNps: 3.4 }, normal: { minGap: 0.12, maxNps: 8, chordP: 0.35 }, hard: { minGap: 0.068, maxNps: 14.5, minScore: 0.4, chordP: 0.55, chordMax: 3, sameGap: 0.068 } },
  compose(s) {

    const strings = (from, bars, vel = 0.7) => sustain(s, 'pad', from, bars, PROG, vel);
    const brass = (from, bars, vel = 0.55) => pattern(s, 'stab', from, bars, 'X..X..X.X..X..X.', (b) => PROG[b % 4], { vel, len: 0.25 });
    const run = (from, bars, vel = 0.85) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1, 2, 3, 4, 5], oct: 1 });
    const core = { hardkick: 'X...X...X...X...', snare: '....X.......X...', hat: 'xxxxxxxxxxxxxxxx' };
    strings(0, 8, 0.8); s.seq('bell', 0, 1, 'D6 - A5 - | F5 - - - | G5 - Bb5 - | A5 - - - |'.repeat(2), 0.7);
    s.drums(6, 2, { kick: 'x...x...x.x.xxxx' });
    s.crash(32);
    s.drums(8, 16, core); strings(8, 16, 0.4); brass(8, 16); bassLine(s, 8, 16, ROOT, 'X.X.X.X.X.X.X.X.');
    s.seq('supersaw', 32, 0.5, CHOIR + CHOIR, 1);
    strings(24, 4, 1); s.drums(26, 2, { kick: 'x.x.x.x.xxxxxxxx' });
    s.crash(112); s.crash(144, 0.8); s.crash(176, 0.8);
    s.drums(28, 24, { ...core, hardkick: 'X.X.X.X.X.X.X.X.' }); bassLine(s, 28, 24, ROOT, 'X.X.X.X.X.X.X.X.'); run(28, 24);
    s.seq('lead', 112, 0.5, CHOIR + CHOIR + CHOIR, 1); s.ghost(() => brass(28, 24, 0.35));
    s.crash(208); s.hardkick(208); s.pad(208, ['D4', 'F4', 'A4', 'D5'], 4, 1); s.stab(208, ['D4', 'F4', 'A4', 'D5'], 3, 1); s.bass(208, 'D2', 3);
  },
};

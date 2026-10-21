// NEUROFUNK / 175 BPM(鬼畜): うねる機械的なベースと、細かく刻むドラム。16分の縦連が多い
import { pattern, sustain, bassLine, arp } from './kit.js';

const PROG = ['F4+Ab4+C5', 'Db4+F4+Ab4', 'Eb4+G4+Bb4', 'C4+E4+G4'];
const ROOT = ['F1', 'Db2', 'Eb2', 'C2'];
const STABS = 'x.xx.x.xx.x.x.xx';

export default {
  id: 'fractal-storm',
  urlId: 'c5jov8f70', // 曲ページのURL (music/c5jov8f70/)。公開後は変えない
  title: 'Fractal Storm',
  artist: 'MUSIC LiDAR',
  genre: 'NEUROFUNK',
  bpm: 175,
  color: '#3dd6ff',
  levels: { easy: 5, normal: 9, hard: 12 },
  preview: 96,
  chart: {
    easy: { minGap: 0.27, maxNps: 3.2 },
    normal: { minGap: 0.125, maxNps: 6.8, chordP: 0.3 },
    hard: { minGap: 0.07, maxNps: 12, minScore: 0.45, chordP: 0.45, chordMax: 3, sameGap: 0.07 },
  },
  compose(s) {
    const neuro = { kick: 'X.........X..X..', snare: '....X..x.x..X..x', hat: 'xxxxxxxxxxxxxxxx' };
    const glitch = (from, bars, vel = 0.8) => arp(s, 'square', from, bars, PROG, { step: 0.25, vel, order: [0, 0, 1, 0, 2, 0, 1, 3, 0, 2, 1, 0, 3, 2, 1, 4], oct: 1 });
    sustain(s, 'pad', 0, 8, PROG, 0.6); s.ghost(() => glitch(4, 4, 0.4));
    s.crash(32);
    s.drums(8, 16, neuro); bassLine(s, 8, 16, ROOT, 'X..X.X..X.XX.X..', { type: 'reese' }); glitch(8, 16);
    pattern(s, 'stab', 16, 8, STABS, (b) => PROG[b % 4], { vel: 0.4, len: 0.15 });
    sustain(s, 'pad', 24, 4, PROG, 0.8); s.seq('bell', 96, 0.5, 'C6 - Ab5 - F5 - - - | Db6 - Ab5 - F5 - - - | Eb6 - Bb5 - G5 - - - | E6 - - - C6 - - - |', 0.85);
    s.drums(27, 1, { snare: 'xxxxxxxxxxxxxxxx' });
    s.crash(112); s.crash(144, 0.8);
    s.drums(28, 16, { ...neuro, kick: 'X..X......X..X..' }); bassLine(s, 28, 16, ROOT, 'X..X.X..X.XX.X.X', { type: 'reese' });
    glitch(28, 16, 0.85); pattern(s, 'stab', 28, 16, STABS, (b) => PROG[b % 4], { vel: 0.45, len: 0.15 });
    s.drums(44, 4, { kick: 'X.X.X.X.X.X.X.X.', snare: 'xxxxxxxxxxxxxxxx' }); glitch(44, 4, 1);
    s.crash(192); s.kick(192); s.reese(192, 'F1', 3); s.stab(192, ['F4', 'Ab4', 'C5'], 2, 1);
  },
};

// DRUM & BASS / 174 BPM: うなるリースベースと2ステップのブレイク、16分のアルペジオ
import { sustain, bassLine, arp, build } from './kit.js';

const PROG = ['F4+Ab4+C5', 'Db4+F4+Ab4', 'Ab3+C4+Eb4', 'Eb4+G4+Bb4'];
const ROOT = ['F1', 'Db2', 'Ab1', 'Eb2'];
const MEL =
  'C6 - - - Ab5 - - - | F5 - Ab5 - C6 - Db6 - | C6 - - - Eb6 - - - | Bb5 - - - G5 - - - |' +
  'C6 - - - Ab5 - F6 - | Eb6 - Db6 - C6 - Ab5 - | Bb5 - - - C6 - Eb6 - | F6 - - - - - - - |';

export default {
  id: 'circuit-breaker',
  urlId: '66x9cml20', // 曲ページのURL (music/66x9cml20/)。公開後は変えない
  title: 'Circuit Breaker',
  artist: 'MUSIC LiDAR',
  genre: 'DRUM & BASS',
  bpm: 174,
  color: '#9dff4f',
  levels: { easy: 4, normal: 8, hard: 12 },
  preview: 96,
  chart: { normal: { minGap: 0.15 }, hard: { minGap: 0.082, maxNps: 10.5 } },
  compose(s) {
    const dnb = { kick: 'X.........X.....', snare: '....X.......X...', hat: 'x.xxx.xxx.xxx.xx' };
    const roll = { kick: 'X.........XX....', snare: '....X..g.g..X..g', hat: 'xxxxxxxxxxxxxxxx' };
    const arps = (from, bars, vel = 0.6) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 2, 1, 0, 1], oct: 1 });
    sustain(s, 'pad', 0, 8, PROG, 0.6); arps(4, 4, 0.5);
    s.crash(32);
    s.drums(8, 8, dnb); bassLine(s, 8, 8, ROOT, 'X.....X...X.....', { type: 'reese' }); arps(8, 8, 0.6);
    s.drums(16, 8, dnb); bassLine(s, 16, 8, ROOT, 'X.....X...X.....', { type: 'reese' }); sustain(s, 'pad', 16, 8, PROG, 0.4);
    s.seq('lead', 64, 0.5, MEL, 0.95);
    build(s, 22);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, roll); bassLine(s, 24, 16, ROOT, 'X..X..X...X.X...', { type: 'reese' });
    s.seq('supersaw', 96, 0.5, MEL, 1); arps(32, 8, 0.75);
    s.ghost(() => arps(24, 8, 0.35));
    sustain(s, 'pad', 40, 4, PROG, 0.7); s.seq('bell', 160, 1, 'C6 - - - | Db6 - - - | Eb6 - - - | F6 - - - |', 0.7);
    s.crash(176);
    s.drums(44, 8, roll); bassLine(s, 44, 8, ROOT, 'X..X..X...X.X...', { type: 'reese' }); arps(44, 8, 0.8);
    s.ghost(() => s.seq('supersaw', 176, 0.5, MEL, 0.4));
    s.crash(208); s.kick(208); s.reese(208, 'F1', 3); s.pad(208, ['F4', 'Ab4', 'C5'], 4, 0.7);
  },
};

// GIMMICK / 200 BPM(鬼畜): 量子ジャンプ。譜面が瞬間移動するように止まり、跳ね、消える
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['G4+Bb4+D5', 'Eb4+G4+Bb4', 'F4+A4+C5', 'D4+F#4+A4'];
const ROOT = ['G1', 'Eb2', 'F1', 'D2'];
const MEL =
  'G5 - D6 - Bb5 - G6 - | Eb6 - Bb5 - G5 - Eb6 - | F6 - C6 - A5 - F6 - | F#6 - D6 - A5 - D6 - |' +
  'G6 - F6 - D6 - Bb5 - | G5 - Bb5 - Eb6 - G6 - | A6 - F6 - C6 - A5 - | D6 - - - - - - - |';

export default {
id: 'quantum-leap',
  urlId: 'tkz5ps7tk', // 曲ページのURL (music/tkz5ps7tk/)。公開後は変えない
  title: 'Quantum Leap',
  artist: 'MUSIC LiDAR',
  genre: 'GIMMICK',
  bpm: 200,
  color: '#5effd0',
  levels: { easy: 4, normal: 10, hard: 15 },
  preview: 128,
  chart: { easy: { maxNps: 3.3 }, normal: { minGap: 0.13, maxNps: 7.5 }, hard: { minGap: 0.072, maxNps: 13, minScore: 0.45, chordP: 0.5, chordMax: 3, sameGap: 0.072 } },
  // 瞬間移動: 短い停止と急な速さの切り替えをくり返す
  gimmicks: [
    ...[...Array(8)].map((_, i) => ({ beat: 32 + i * 4, type: 'stop', beats: 1 })),
    ...[...Array(8)].map((_, i) => ({ beat: 64 + i * 4, type: 'speed', to: i % 2 ? 0.5 : 2.2, beats: 0 })),
    { beat: 96, type: 'speed', to: 1, beats: 0 },
    { beat: 96, type: 'cover', to: 0.5, beats: 2 },
    { beat: 126, type: 'cover', to: 0, beats: 2 },
    { beat: 128, type: 'stop', beats: 4 },
    { beat: 160, type: 'speed', to: 2.5, beats: 0 },
    { beat: 176, type: 'speed', to: 0.4, beats: 0 },
    { beat: 184, type: 'speed', to: 1.6, beats: 8 },
  ],
  compose(s) {

    const core = { hardkick: 'X...X...X...X...', hat: 'xxxxxxxxxxxxxxxx', clap: '....x.......x...' };
    const run = (from, bars, vel = 0.85) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 4, 5, 4, 3], oct: 1 });
    sustain(s, 'pad', 0, 8, PROG, 0.6); run(4, 4, 0.5);
    s.crash(32);
    s.drums(8, 8, core); bassLine(s, 8, 8, ROOT, '..X...X...X...X.'); s.seq('lead', 32, 0.5, MEL, 1);
    s.crash(64);
    s.drums(16, 8, core); bassLine(s, 16, 8, ROOT, '..X...X...X...X.'); run(16, 8, 0.9);
    s.crash(96);
    s.drums(24, 8, { ...core, hardkick: 'X.X.X.X.X.X.X.X.' }); bassLine(s, 24, 8, ROOT, 'X.X.X.X.X.X.X.X.'); s.seq('square', 96, 0.5, MEL, 1);
    sustain(s, 'pad', 32, 1, PROG, 1); s.riser(128, 4, 0.8);
    s.crash(132);
    s.drums(33, 15, core); bassLine(s, 33, 15, ROOT, '..X...X...X...X.'); run(33, 7, 0.9); s.seq('supersaw', 160, 0.5, MEL, 1);
    s.crash(192); s.hardkick(192); s.stab(192, ['G4', 'Bb4', 'D5', 'G5'], 3, 1); s.bass(192, 'G1', 2);
  },
};

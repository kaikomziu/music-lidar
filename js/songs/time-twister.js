// GIMMICK / 170 BPM: 時間がねじれる。逆にゆっくり→2倍速→止まる、を何度もくり返す
import { sustain, bassLine, arp, build } from './kit.js';

const PROG = ['C4+Eb4+G4', 'Ab3+C4+Eb4', 'Bb3+D4+F4', 'G3+B3+D4'];
const ROOT = ['C2', 'Ab1', 'Bb1', 'G1'];
const MEL =
  'G5 - C6 - Eb6 - D6 C6 | Ab5 - - - C6 - Eb6 - | F6 - Eb6 - D6 - Bb5 - | B5 - - - D6 - G6 - |' +
  'G6 - F6 - Eb6 - C6 - | Eb6 - D6 - C6 - Ab5 - | Bb5 - D6 - F6 - D6 - | C6 - - - - - - - |';

export default {
  id: 'time-twister',
  urlId: '8fput7b2w', // 曲ページのURL (music/8fput7b2w/)。公開後は変えない
  title: 'Time Twister',
  artist: 'MUSIC LiDAR',
  genre: 'GIMMICK',
  bpm: 170,
  color: '#9d7bff',
  levels: { easy: 4, normal: 9, hard: 13 },
  preview: 96,
  chart: { easy: { maxNps: 3 }, normal: { minGap: 0.14, maxNps: 7 }, hard: { minGap: 0.08, maxNps: 10.5, chordP: 0.42 } },
  gimmicks: [
    { beat: 32, type: 'speed', to: 0.45, beats: 0 },
    { beat: 48, type: 'speed', to: 2, beats: 0 },
    { beat: 64, type: 'speed', to: 1, beats: 0 },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ beat: 64 + i * 4 + 2, type: 'stop', beats: 0.5 })),
    { beat: 96, type: 'speed', to: 0.6, beats: 8 },
    { beat: 104, type: 'speed', to: 1.8, beats: 4 },
    { beat: 112, type: 'cover', to: 0.4, beats: 2 },
    { beat: 126, type: 'stop', beats: 2 },
    { beat: 128, type: 'speed', to: 1, beats: 0 },
    { beat: 160, type: 'cover', to: 0, beats: 2 },
    { beat: 176, type: 'speed', to: 2.4, beats: 16 },
  ],
  compose(s) {
    const four = { kick: 'X...X...X...X...', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const busy = { kick: 'X.x.X...X.x.X...', snare: '....X.......X..x', hat: 'xxxxxxxxxxxxxxxx' };
    const arps = (from, bars, vel = 0.7) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 4, 3, 2, 1], oct: 1 });
    sustain(s, 'pad', 0, 4, PROG, 0.7); arps(2, 2, 0.5);
    s.crash(16);
    s.drums(4, 4, four); bassLine(s, 4, 4, ROOT, 'X.x.X.x.X.x.X.x.'); s.seq('lead', 16, 0.5, MEL.split('|').slice(0, 4).join('|'), 0.95);
    // ゆっくり(0.45倍)→2倍速
    s.drums(8, 4, { kick: 'X.......X.......', snare: '........X.......' }); sustain(s, 'pad', 8, 4, PROG, 0.6);
    s.seq('bell', 32, 1, 'G5 - C6 - | Eb6 - - - | D6 - Bb5 - | B5 - - - |', 0.9);
    s.drums(12, 4, busy); arps(12, 4, 0.85); bassLine(s, 12, 4, ROOT, 'X.x.X.x.X.x.X.x.');
    // 半拍止まる
    s.crash(64);
    s.drums(16, 8, four); bassLine(s, 16, 8, ROOT, 'X.x.X.x.X.x.X.x.'); s.seq('square', 64, 0.5, MEL, 1);
    // ゆらぐ → 隠れる → 止まる
    s.drums(24, 8, busy); bassLine(s, 24, 8, ROOT, 'X.x.X.x.X.x.X.x.'); arps(24, 8, 0.6);
    s.seq('lead', 96, 0.5, MEL, 1);
    s.crash(128);
    s.drums(32, 8, four); bassLine(s, 32, 8, ROOT, 'X.x.X.x.X.x.X.x.'); s.seq('supersaw', 128, 0.5, MEL, 1);
    build(s, 42);
    // 最後は加速しながら終わる
    s.crash(176);
    s.drums(44, 4, busy); arps(44, 4, 0.9); bassLine(s, 44, 4, ROOT, 'X.x.X.x.X.x.X.x.');
    s.crash(192); s.kick(192); s.stab(192, ['C4', 'Eb4', 'G4', 'C5'], 2, 1); s.bass(192, 'C2', 2);
  },
};

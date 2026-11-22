// GIMMICK / 174 BPM・ドラムンベース: フラッシュ・点滅・画面揺れが中心。奥が隠れる・手前で消える・揺れるも(1.81.0)
// 光の点滅が多いので photosensitive: true(始める前に注意を出す)。点滅は1秒に3回未満(gimmick.js)。流れる速さは速くしない
import { sustain, bassLine, arp, build } from './kit.js';

const PROG = ['C3+D#3+G3', 'G#2+C3+D#3', 'D#3+G3+A#3', 'A#2+D3+F3'];
const ROOT = ['C2', 'G#1', 'D#2', 'A#1'];
const MEL_A = 'C6 - D#6 - G6 - C6 - | G#5 - C6 - D#6 - G#5 - | D#6 - G6 - A#6 - G6 - | F6 - D6 - A#5 - - - |';
const MEL_B = 'G6 - F6 - D#6 - C6 - | G#6 - G6 - D#6 - C6 - | A#6 - G6 - D#6 - A#5 - | D6 - - - F6 - - - |';
const MEL = MEL_A + MEL_B;

export default {
  id: 'strobe-storm',
  urlId: '42ograr4g', // 曲ページのURL (music/42ograr4g/)。公開後は変えない
  title: 'Strobe Storm',
  artist: 'MUSIC LiDAR',
  genre: 'GIMMICK',
  bpm: 174,
  color: '#f4f4ff',
  levels: { easy: 5, normal: 10, hard: 14 },
  preview: 160,
  photosensitive: true,
  chart: {
    easy: { minGap: 0.27, maxNps: 3.6 },
    normal: { minGap: 0.13, maxNps: 7.5, chordP: 0.3 },
    hard: { minGap: 0.086, maxNps: 12, chordP: 0.5, chordMax: 3, sameGap: 0.086 },
  },
  gimmicks: [
    // A: 4拍ごとにフラッシュ、途中から奥が隠れる
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ beat: 32 + i * 4, type: 'flash', to: 0.7 })),
    { beat: 48, type: 'cover', to: 0.35, beats: 2 },
    { beat: 64, type: 'cover', to: 0, beats: 2 },
    // B: 点滅 → 手前で消える
    { beat: 64, type: 'strobe', to: 0.5, beats: 0 },
    { beat: 80, type: 'strobe', to: 0, beats: 0 },
    { beat: 80, type: 'hidden', to: 0.3, beats: 2 },
    { beat: 96, type: 'hidden', to: 0, beats: 2 },
    // ガタガタ揺れて、ゆらゆら揺れる
    { beat: 96, type: 'shake', to: 0.5, beats: 1 },
    { beat: 100, type: 'shake', to: 0, beats: 1 },
    { beat: 104, type: 'shake', to: 0.5, beats: 1 },
    { beat: 108, type: 'shake', to: 0, beats: 1 },
    { beat: 112, type: 'sway', to: 0.6, beats: 2 },
    { beat: 128, type: 'sway', to: 0, beats: 2 },
    // ゆっくり + 弱い点滅
    { beat: 128, type: 'speed', to: 0.6, beats: 2 },
    { beat: 128, type: 'strobe', to: 0.4, beats: 0 },
    { beat: 140, type: 'strobe', to: 0, beats: 0 },
    { beat: 140, type: 'speed', to: 1, beats: 4 },
    { beat: 152, type: 'shake', to: 0.35, beats: 6 },
    { beat: 158, type: 'stop', beats: 2 },
    { beat: 160, type: 'shake', to: 0, beats: 0 },
    // サビ: 8拍ごとにフラッシュ、途中で点滅、揺れ
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ beat: 160 + i * 8, type: 'flash', to: 0.8 })),
    { beat: 176, type: 'strobe', to: 0.6, beats: 0 },
    { beat: 192, type: 'strobe', to: 0, beats: 0 },
    { beat: 192, type: 'shake', to: 0.3, beats: 2 },
    { beat: 200, type: 'shake', to: 0, beats: 2 },
    { beat: 208, type: 'strobe', to: 0.5, beats: 0 },
    { beat: 220, type: 'strobe', to: 0, beats: 0 },
    { beat: 224, type: 'flash', to: 1 },
  ],
  compose(s) {
    const core = { kick: 'X.........X.....', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const run = (from, bars, vel = 0.7) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 2, 1, 2, 3], oct: 1 });
    sustain(s, 'pad', 0, 8, PROG, 0.6); run(4, 4, 0.4);
    s.crash(32);
    s.drums(8, 8, core); bassLine(s, 8, 8, ROOT, 'X.......X.....x.', { type: 'reese' }); s.seq('lead', 32, 0.5, MEL, 1);
    s.crash(64);
    s.drums(16, 8, { ...core, hat: 'xxxxxxxxxxxxxxxx' }); bassLine(s, 16, 8, ROOT, 'X.......X.....x.', { type: 'reese' }); s.seq('supersaw', 64, 0.5, MEL, 0.9); s.ghost(() => run(16, 8, 0.35));
    s.crash(96);
    s.drums(24, 8, { ...core, kick: 'X.....X...X.....' }); bassLine(s, 24, 8, ROOT, 'X..x....X..x....', { type: 'reese' }); run(24, 8, 0.85);
    s.crash(128);
    s.drums(32, 4, { kick: 'X...............', snare: '........X.......', hat: 'x...x...x...x...' }); sustain(s, 'pad', 32, 4, PROG, 0.6);
    s.seq('lead', 128, 1, 'C6 - G6 - G#5 - D#6 - A#6 - G6 - F6 - D6 -', 0.8);
    s.drums(36, 4, core); run(36, 4, 0.7); build(s, 38);
    s.crash(160);
    s.drums(40, 16, { ...core, kick: 'X.....X...X.....' }); bassLine(s, 40, 16, ROOT, 'X..x....X..x..x.', { type: 'reese' }); s.seq('supersaw', 160, 0.5, MEL + MEL, 1); s.ghost(() => run(40, 16, 0.4));
    s.crash(224);
    s.drums(56, 4, core); sustain(s, 'pad', 56, 4, PROG, 0.6); s.seq('lead', 224, 0.5, MEL_A, 0.7);
    s.crash(240); s.kick(240); s.stab(240, ['C3', 'D#3', 'G3', 'C4'], 3, 1); s.bass(240, 'C2', 2);
  },
};

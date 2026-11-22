// GIMMICK / 150 BPM: 画面が横に動く・判定ラインが上がる・回る・ひっくり返る・揺れる・光る「やばいギミック譜面」(1.80.0)
// 流れる速さは速くしない(遅くなる・止まるだけ)。光の点滅・画面の動きがあるので photosensitive: true(始める前に注意を出す)
import { sustain, bassLine, arp, build } from './kit.js';

const PROG = ['E3+G3+B3', 'C3+E3+G3', 'G3+B3+D4', 'D3+F#3+A3'];
const ROOT = ['E1', 'C2', 'G1', 'D2'];
const MEL_A = 'E5 - G5 - B5 - E6 - | C6 - B5 - G5 - E5 - | D5 - G5 - B5 - D6 - | F#5 - A5 - D6 - F#6 - |';
const MEL_B = 'E6 - D6 - B5 - G5 - | E6 - G6 - E6 - C6 - | B5 - G5 - D6 - B5 - | A5 - - - F#5 - - - |';
const MEL = MEL_A + MEL_B;

export default {
  id: 'vertigo-scan',
  urlId: 'sfpgttno4', // 曲ページのURL (music/sfpgttno4/)。公開後は変えない
  title: 'Vertigo Scan',
  artist: 'MUSIC LiDAR',
  genre: 'GIMMICK',
  bpm: 150,
  color: '#b07dff',
  levels: { easy: 4, normal: 8, hard: 12 },
  preview: 160,
  photosensitive: true,
  chart: {
    easy: { minGap: 0.3, maxNps: 3 },
    normal: { minGap: 0.15, maxNps: 6, chordP: 0.25 },
    hard: { minGap: 0.1, maxNps: 9.5, chordP: 0.4, chordMax: 3, sameGap: 0.1 },
  },
  gimmicks: [
    // A: レーンが左右へ動き、判定ラインが上がる
    { beat: 32, type: 'shift', to: -1.4, beats: 4 },
    { beat: 40, type: 'shift', to: 1.4, beats: 4 },
    { beat: 48, type: 'shift', to: 0, beats: 2 },
    { beat: 52, type: 'judge', to: -0.22, beats: 4 },
    { beat: 60, type: 'judge', to: 0, beats: 2 },
    // B: 光りながら1回転
    ...[0, 1, 2, 3].map((i) => ({ beat: 64 + i * 8, type: 'flash', to: 0.8 })),
    ...[0, 1, 2, 3].map((i) => ({ beat: 64 + i * 8, type: 'spin', to: 90 * (i + 1), beats: 8 })),
    // 上下反転、途中で揺れる
    { beat: 96, type: 'flip', to: 1, beats: 2 },
    { beat: 108, type: 'shake', to: 0.5, beats: 1 },
    { beat: 112, type: 'shake', to: 0, beats: 1 },
    { beat: 120, type: 'flip', to: 0, beats: 2 },
    // ゆっくり + 点滅
    { beat: 128, type: 'speed', to: 0.6, beats: 2 },
    { beat: 128, type: 'strobe', to: 0.6, beats: 0 },
    { beat: 140, type: 'strobe', to: 0, beats: 0 },
    { beat: 140, type: 'speed', to: 1, beats: 4 },
    // ためて、止まる
    { beat: 152, type: 'shake', to: 0.3, beats: 6 },
    { beat: 158, type: 'stop', beats: 2 },
    { beat: 160, type: 'shake', to: 0, beats: 0 },
    // サビ: 全部盛り(逆さまに回りながら揺れて、さらに上下反転)
    { beat: 160, type: 'flash', to: 1 },
    { beat: 160, type: 'spin', to: 540, beats: 16 },
    { beat: 160, type: 'sway', to: 0.6, beats: 4 },
    { beat: 176, type: 'flip', to: 1, beats: 2 },
    { beat: 184, type: 'shake', to: 0.4, beats: 2 },
    { beat: 192, type: 'spin', to: 720, beats: 8 },
    { beat: 192, type: 'flip', to: 0, beats: 4 },
    { beat: 192, type: 'sway', to: 0, beats: 4 },
    { beat: 192, type: 'shake', to: 0, beats: 2 },
    { beat: 200, type: 'judge', to: -0.2, beats: 4 },
    { beat: 208, type: 'judge', to: 0, beats: 4 },
    { beat: 208, type: 'strobe', to: 0.5, beats: 0 },
    { beat: 220, type: 'strobe', to: 0, beats: 0 },
    { beat: 224, type: 'flash', to: 0.9 },
  ],
  compose(s) {
    const core = { kick: 'X...X...X...X...', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const run = (from, bars, vel = 0.8) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 4, 5, 4, 3], oct: 1 });
    // イントロ
    sustain(s, 'pad', 0, 8, PROG, 0.7); run(4, 4, 0.45);
    // A(レーンが動く)
    s.crash(32);
    s.drums(8, 8, core); bassLine(s, 8, 8, ROOT, 'X.x.X.x.X.x.X.x.'); s.seq('lead', 32, 0.5, MEL, 1);
    // B(回る)
    s.crash(64);
    s.drums(16, 8, { ...core, hat: 'xxxxxxxxxxxxxxxx' }); bassLine(s, 16, 8, ROOT, 'X.x.X.x.X.x.X.x.'); s.seq('supersaw', 64, 0.5, MEL, 0.9); s.ghost(() => run(16, 8, 0.35));
    // 上下反転
    s.crash(96);
    s.drums(24, 8, core); bassLine(s, 24, 8, ROOT, 'X..xX..xX..xX..x'); run(24, 8, 0.85);
    // ゆっくり(半分のノリ)
    s.crash(128);
    s.drums(32, 4, { kick: 'X.......X.......', snare: '........X.......', hat: 'x...x...x...x...' }); sustain(s, 'pad', 32, 4, PROG, 0.6);
    s.seq('lead', 128, 1, 'E5 - B5 - C6 - G5 - D6 - A5 - F#6 - D6 -', 0.8);
    // ため
    s.drums(36, 4, core); run(36, 4, 0.7); build(s, 38);
    // サビ
    s.crash(160);
    s.drums(40, 16, { ...core, kick: 'X.X.X.X.X.X.X.X.' }); bassLine(s, 40, 16, ROOT, 'X.X.X.X.X.X.X.X.'); s.seq('supersaw', 160, 0.5, MEL + MEL, 1); s.ghost(() => run(40, 16, 0.4));
    // アウトロ
    s.crash(224);
    s.drums(56, 4, core); sustain(s, 'pad', 56, 4, PROG, 0.6); s.seq('lead', 224, 0.5, MEL_A, 0.7);
    s.crash(240); s.kick(240); s.stab(240, ['E3', 'G3', 'B3', 'E4'], 3, 1); s.bass(240, 'E1', 2);
  },
};

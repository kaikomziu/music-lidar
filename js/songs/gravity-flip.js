// GIMMICK / 140 BPM・チップチューン: 何度も上下反転する(すばやく入れ替わる所も)。判定ラインの移動・横移動・停止も(1.81.0)
// 上下反転などがあるので photosensitive: true(始める前に注意を出す)。流れる速さは速くしない
import { sustain, bassLine, arp, build } from './kit.js';

const PROG = ['A3+C4+E4', 'F3+A3+C4', 'C4+E4+G4', 'G3+B3+D4'];
const ROOT = ['A1', 'F1', 'C2', 'G1'];
const MEL_A = 'A5 - C6 - E6 - A6 - | F6 - E6 - C6 - A5 - | G5 - C6 - E6 - G6 - | D6 - G6 - B6 - - - |';
const MEL_B = 'A6 - G6 - E6 - C6 - | F6 - A6 - F6 - C6 - | E6 - C6 - G6 - E6 - | D6 - - - B5 - - - |';
const MEL = MEL_A + MEL_B;

export default {
  id: 'gravity-flip',
  urlId: 'bzbz4pj9t', // 曲ページのURL (music/bzbz4pj9t/)。公開後は変えない
  title: 'Gravity Flip',
  artist: 'MUSIC LiDAR',
  genre: 'GIMMICK',
  bpm: 140,
  color: '#ffb84d',
  levels: { easy: 4, normal: 8, hard: 12 },
  preview: 160,
  photosensitive: true,
  chart: {
    easy: { minGap: 0.3, maxNps: 3 },
    normal: { minGap: 0.15, maxNps: 6, chordP: 0.25 },
    hard: { minGap: 0.107, maxNps: 9.5, chordP: 0.4, chordMax: 3, sameGap: 0.107 },
  },
  gimmicks: [
    // A: ひっくり返って、戻る
    { beat: 32, type: 'flip', to: 1, beats: 2 },
    { beat: 48, type: 'flip', to: 0, beats: 2 },
    { beat: 56, type: 'judge', to: -0.2, beats: 2 },
    { beat: 64, type: 'judge', to: 0, beats: 2 },
    // すばやく入れ替わる
    ...[0, 1, 2, 3].map((i) => ({ beat: 64 + i * 4, type: 'flip', to: i % 2 ? 0 : 1, beats: 0.5 })),
    { beat: 80, type: 'stop', beats: 1 },
    // 逆さまのまま左右へ
    { beat: 96, type: 'flip', to: 1, beats: 2 },
    { beat: 96, type: 'shift', to: -1.2, beats: 4 },
    { beat: 104, type: 'shift', to: 1.2, beats: 4 },
    { beat: 112, type: 'shift', to: 0, beats: 2 },
    { beat: 120, type: 'flip', to: 0, beats: 2 },
    // ゆっくり、ゆっくりひっくり返る
    { beat: 128, type: 'speed', to: 0.6, beats: 2 },
    { beat: 128, type: 'flip', to: 1, beats: 4 },
    { beat: 140, type: 'flip', to: 0, beats: 4 },
    { beat: 140, type: 'speed', to: 1, beats: 4 },
    { beat: 158, type: 'stop', beats: 2 },
    // サビ: 8拍ごとに入れ替わる
    { beat: 160, type: 'flash', to: 0.6 },
    ...[0, 1, 2, 3].map((i) => ({ beat: 160 + i * 8, type: 'flip', to: i % 2 ? 0 : 1, beats: 1 })),
    { beat: 176, type: 'judge', to: -0.15, beats: 2 },
    { beat: 192, type: 'judge', to: 0, beats: 2 },
    { beat: 192, type: 'sway', to: 0.5, beats: 4 },
    { beat: 208, type: 'sway', to: 0, beats: 4 },
    { beat: 216, type: 'flip', to: 1, beats: 2 },
    { beat: 222, type: 'flip', to: 0, beats: 2 },
  ],
  compose(s) {
    const core = { chipkick: 'X...X...X...X...', chipsnare: '....X.......X...', chiphat: 'x.x.x.x.x.x.x.x.' };
    const run = (from, bars, vel = 0.7) => arp(s, 'chip', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 4, 3, 2, 1], oct: 1 });
    sustain(s, 'pad', 0, 8, PROG, 0.5); run(4, 4, 0.4);
    s.crash(32);
    s.drums(8, 8, core); bassLine(s, 8, 8, ROOT, 'X.x.X.x.X.x.X.x.', { type: 'chipbass' }); s.seq('chip', 32, 0.5, MEL, 0.9);
    s.crash(64);
    s.drums(16, 8, { ...core, chiphat: 'xxxxxxxxxxxxxxxx' }); bassLine(s, 16, 8, ROOT, 'X.x.X.x.X.x.X.x.', { type: 'chipbass' }); s.seq('square', 64, 0.5, MEL, 0.85); s.ghost(() => run(16, 8, 0.3));
    s.crash(96);
    s.drums(24, 8, core); bassLine(s, 24, 8, ROOT, 'X..xX..xX..xX..x', { type: 'chipbass' }); run(24, 8, 0.85);
    s.crash(128);
    s.drums(32, 4, { chipkick: 'X.......X.......', chipsnare: '........X.......', chiphat: 'x...x...x...x...' }); sustain(s, 'pad', 32, 4, PROG, 0.5);
    s.seq('chip', 128, 1, 'A5 - E6 - F6 - C6 - G6 - D6 - B5 - G5 -', 0.8);
    s.drums(36, 4, core); run(36, 4, 0.7); build(s, 38);
    s.crash(160);
    s.drums(40, 16, { ...core, chipkick: 'X.X.X.X.X.X.X.X.' }); bassLine(s, 40, 16, ROOT, 'X.X.X.X.X.X.X.X.', { type: 'chipbass' }); s.seq('chip', 160, 0.5, MEL + MEL, 1); s.ghost(() => run(40, 16, 0.35));
    s.crash(224);
    s.drums(56, 4, core); sustain(s, 'pad', 56, 4, PROG, 0.5); s.seq('square', 224, 0.5, MEL_A, 0.7);
    s.crash(240); s.kick(240); s.stab(240, ['A3', 'C4', 'E4', 'A4'], 3, 1); s.bass(240, 'A1', 2);
  },
};

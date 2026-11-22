// GIMMICK / 128 BPM: レーンが左右へ流れ、判定ラインが上下し、隠れて・消えて・ゆっくりになる(1.81.0)
// 光の点滅・回転・上下反転・画面揺れは使わない(光が苦手な人も遊べるギミック曲。注意は出ない)。流れる速さは速くしない
import { sustain, bassLine, arp, build } from './kit.js';

const PROG = ['D3+F#3+A3', 'B2+D3+F#3', 'G2+B2+D3', 'A2+C#3+E3'];
const ROOT = ['D2', 'B1', 'G1', 'A1'];
const MEL_A = 'F#5 - A5 - D6 - A5 - | B5 - A5 - F#5 - D5 - | G5 - B5 - D6 - B5 - | A5 - C#6 - E6 - - - |';
const MEL_B = 'F#6 - E6 - D6 - A5 - | B5 - D6 - B5 - F#5 - | G5 - A5 - B5 - D6 - | E6 - - - C#6 - - - |';
const MEL = MEL_A + MEL_B;

export default {
  id: 'drift-lane',
  urlId: '6a6rkkmpa', // 曲ページのURL (music/6a6rkkmpa/)。公開後は変えない
  title: 'Drift Lane',
  artist: 'MUSIC LiDAR',
  genre: 'GIMMICK',
  bpm: 128,
  color: '#5effc9',
  levels: { easy: 3, normal: 7, hard: 11 },
  preview: 160,
  chart: {
    easy: { minGap: 0.32, maxNps: 2.6 },
    normal: { minGap: 0.16, maxNps: 5, chordP: 0.2 },
    hard: { minGap: 0.117, maxNps: 8.5, chordP: 0.35, chordMax: 3, sameGap: 0.117 },
  },
  gimmicks: [
    // A: 左へ流れて、右へ流れて、真ん中へ
    { beat: 32, type: 'shift', to: -1.2, beats: 8 },
    { beat: 40, type: 'shift', to: 1.2, beats: 8 },
    { beat: 48, type: 'shift', to: 0, beats: 4 },
    // B: 判定ラインが上がって下がる + 揺れる
    { beat: 64, type: 'judge', to: -0.2, beats: 4 },
    { beat: 64, type: 'sway', to: 0.5, beats: 4 },
    { beat: 72, type: 'judge', to: 0.05, beats: 4 },
    { beat: 80, type: 'judge', to: 0, beats: 4 },
    { beat: 88, type: 'sway', to: 0, beats: 4 },
    // C: 奥が隠れる → 手前で消える
    { beat: 96, type: 'cover', to: 0.4, beats: 2 },
    { beat: 112, type: 'cover', to: 0, beats: 2 },
    { beat: 112, type: 'hidden', to: 0.3, beats: 2 },
    { beat: 124, type: 'hidden', to: 0, beats: 2 },
    // ゆっくり
    { beat: 128, type: 'speed', to: 0.7, beats: 2 },
    { beat: 140, type: 'speed', to: 1, beats: 4 },
    { beat: 158, type: 'stop', beats: 2 },
    // サビ: 左右に流れながら揺れて、判定ラインが上がって、最後は消える
    { beat: 160, type: 'shift', to: -1, beats: 4 },
    { beat: 168, type: 'shift', to: 1, beats: 4 },
    { beat: 176, type: 'shift', to: 0, beats: 4 },
    { beat: 176, type: 'sway', to: 0.7, beats: 2 },
    { beat: 192, type: 'sway', to: 0, beats: 2 },
    { beat: 192, type: 'judge', to: -0.18, beats: 4 },
    { beat: 208, type: 'judge', to: 0, beats: 4 },
    { beat: 208, type: 'hidden', to: 0.25, beats: 2 },
    { beat: 220, type: 'hidden', to: 0, beats: 2 },
  ],
  compose(s) {
    const core = { kick: 'X...X...X...X...', clap: '....X.......X...', hat: '..x...x...x...x.' };
    const run = (from, bars, vel = 0.7) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 1, 3, 2, 1, 2], oct: 1 });
    sustain(s, 'pad', 0, 8, PROG, 0.6); s.ghost(() => arp(s, 'bell', 4, 4, PROG, { step: 0.5, vel: 0.4, order: [0, 2, 1, 2], oct: 1 }));
    s.crash(32);
    s.drums(8, 8, core); bassLine(s, 8, 8, ROOT, 'X..xX..xX..xX..x'); s.seq('bell', 32, 0.5, MEL, 0.9);
    s.crash(64);
    s.drums(16, 8, { ...core, hat: 'x.x.x.x.x.x.x.x.' }); bassLine(s, 16, 8, ROOT, 'X..xX..xX..xX..x'); run(16, 8, 0.8); s.ghost(() => sustain(s, 'pad', 16, 8, PROG, 0.35));
    s.crash(96);
    s.drums(24, 8, core); bassLine(s, 24, 8, ROOT, 'X...X...X...X...'); s.seq('lead', 96, 0.5, MEL, 0.85);
    s.crash(128);
    s.drums(32, 4, { kick: 'X.......X.......', clap: '........X.......', hat: '....x.......x...' }); sustain(s, 'pad', 32, 4, PROG, 0.6);
    s.seq('bell', 128, 1, 'F#5 - A5 - B5 - D6 - E6 - C#6 - A5 - - -', 0.8);
    s.drums(36, 4, core); run(36, 4, 0.6); build(s, 38);
    s.crash(160);
    s.drums(40, 16, { ...core, hat: 'x.x.x.x.x.x.x.x.' }); bassLine(s, 40, 16, ROOT, 'X.xXX.xXX.xXX.xX'); s.seq('lead', 160, 0.5, MEL + MEL, 1); s.ghost(() => run(40, 16, 0.35));
    s.crash(224);
    s.drums(56, 4, core); sustain(s, 'pad', 56, 4, PROG, 0.6); s.seq('bell', 224, 0.5, MEL_A, 0.7);
    s.crash(240); s.kick(240); s.stab(240, ['D3', 'F#3', 'A3', 'D4'], 3, 1); s.bass(240, 'D2', 2);
  },
};

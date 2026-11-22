// GIMMICK / 160 BPM・エレクトロ: 画面が90度ずつ行ったり来たり、逆に回り、ぐるっと1回転する。画面揺れも(1.81.0)
// 回転・揺れ・フラッシュがあるので photosensitive: true(始める前に注意を出す)。流れる速さは速くしない
// spin の値はつぎのギミックまで残るので、元の向きに戻すときは 360 の倍数にする(最後は 1440 = 4回転で元どおり)
import { sustain, bassLine, arp, build } from './kit.js';

const PROG = ['F#3+A3+C#4', 'D3+F#3+A3', 'A3+C#4+E4', 'E3+G#3+B3'];
const ROOT = ['F#1', 'D2', 'A1', 'E1'];
const MEL_A = 'F#5 - A5 - C#6 - F#6 - | D6 - C#6 - A5 - F#5 - | E5 - A5 - C#6 - E6 - | G#5 - B5 - E6 - - - |';
const MEL_B = 'F#6 - E6 - C#6 - A5 - | D6 - F#6 - D6 - A5 - | C#6 - A5 - E6 - C#6 - | B5 - - - G#5 - - - |';
const MEL = MEL_A + MEL_B;

export default {
  id: 'spin-cycle',
  urlId: 'nrzc9oh16', // 曲ページのURL (music/nrzc9oh16/)。公開後は変えない
  title: 'Spin Cycle',
  artist: 'MUSIC LiDAR',
  genre: 'GIMMICK',
  bpm: 160,
  color: '#ff6ad5',
  levels: { easy: 5, normal: 9, hard: 13 },
  preview: 160,
  photosensitive: true,
  chart: {
    easy: { minGap: 0.28, maxNps: 3.4 },
    normal: { minGap: 0.14, maxNps: 6.8, chordP: 0.3 },
    hard: { minGap: 0.094, maxNps: 10.5, chordP: 0.45, chordMax: 3, sameGap: 0.094 },
  },
  gimmicks: [
    // A: 右へ90度 → 戻る → 左へ90度 → 戻る
    { beat: 32, type: 'spin', to: 90, beats: 4 },
    { beat: 40, type: 'spin', to: 0, beats: 4 },
    { beat: 48, type: 'spin', to: -90, beats: 4 },
    { beat: 56, type: 'spin', to: 0, beats: 4 },
    // B: ぐるっと1回転 → 少し戻ってまた回る
    { beat: 64, type: 'spin', to: 360, beats: 16 },
    { beat: 80, type: 'spin', to: 270, beats: 4 },
    { beat: 88, type: 'spin', to: 360, beats: 4 },
    // 揺れながら逆さまへ
    { beat: 96, type: 'shake', to: 0.4, beats: 1 },
    { beat: 100, type: 'shake', to: 0, beats: 1 },
    { beat: 104, type: 'shake', to: 0.4, beats: 1 },
    { beat: 108, type: 'shake', to: 0, beats: 1 },
    { beat: 112, type: 'spin', to: 540, beats: 8 },
    { beat: 124, type: 'spin', to: 720, beats: 4 },
    // ゆっくり、ゆっくり90度
    { beat: 128, type: 'speed', to: 0.6, beats: 2 },
    { beat: 128, type: 'spin', to: 810, beats: 12 },
    { beat: 140, type: 'spin', to: 720, beats: 4 },
    { beat: 140, type: 'speed', to: 1, beats: 4 },
    { beat: 152, type: 'shake', to: 0.3, beats: 6 },
    { beat: 158, type: 'stop', beats: 2 },
    { beat: 160, type: 'shake', to: 0, beats: 0 },
    // サビ: 1回転 → 逆さま → 揺れ → 戻る → 左右にカクカク
    { beat: 160, type: 'flash', to: 0.8 },
    { beat: 160, type: 'spin', to: 1080, beats: 16 },
    { beat: 176, type: 'spin', to: 1260, beats: 8 },
    { beat: 184, type: 'shake', to: 0.4, beats: 2 },
    { beat: 192, type: 'spin', to: 1440, beats: 8 },
    { beat: 192, type: 'shake', to: 0, beats: 2 },
    { beat: 200, type: 'spin', to: 1350, beats: 2 },
    { beat: 204, type: 'spin', to: 1530, beats: 4 },
    { beat: 208, type: 'spin', to: 1440, beats: 4 },
    { beat: 216, type: 'flash', to: 0.8 },
    { beat: 224, type: 'flash', to: 0.9 },
  ],
  compose(s) {
    const core = { kick: 'X...X...X...X...', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const run = (from, bars, vel = 0.75) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 2, 1, 3, 2, 4, 3, 5], oct: 1 });
    sustain(s, 'pad', 0, 8, PROG, 0.6); run(4, 4, 0.4);
    s.crash(32);
    s.drums(8, 8, core); bassLine(s, 8, 8, ROOT, 'X.xXX.xXX.xXX.xX', { type: 'reese' }); s.seq('lead', 32, 0.5, MEL, 1);
    s.crash(64);
    s.drums(16, 8, { ...core, hat: 'xxxxxxxxxxxxxxxx' }); bassLine(s, 16, 8, ROOT, 'X.xXX.xXX.xXX.xX', { type: 'reese' }); s.seq('supersaw', 64, 0.5, MEL, 0.9); s.ghost(() => run(16, 8, 0.35));
    s.crash(96);
    s.drums(24, 8, core); bassLine(s, 24, 8, ROOT, 'X..xX..xX..xX..x', { type: 'reese' }); run(24, 8, 0.85);
    s.crash(128);
    s.drums(32, 4, { kick: 'X.......X.......', snare: '........X.......', hat: 'x...x...x...x...' }); sustain(s, 'pad', 32, 4, PROG, 0.6);
    s.seq('lead', 128, 1, 'F#5 - C#6 - D6 - A5 - E6 - B5 - G#5 - E5 -', 0.8);
    s.drums(36, 4, core); run(36, 4, 0.7); build(s, 38);
    s.crash(160);
    s.drums(40, 16, { ...core, kick: 'X.X.X.X.X.X.X.X.' }); bassLine(s, 40, 16, ROOT, 'X.X.X.X.X.X.X.X.', { type: 'reese' }); s.seq('supersaw', 160, 0.5, MEL + MEL, 1); s.ghost(() => run(40, 16, 0.4));
    s.crash(224);
    s.drums(56, 4, core); sustain(s, 'pad', 56, 4, PROG, 0.6); s.seq('lead', 224, 0.5, MEL_A, 0.7);
    s.crash(240); s.kick(240); s.stab(240, ['F#3', 'A3', 'C#4', 'F#4'], 3, 1); s.bass(240, 'F#1', 2);
  },
};

// GIMMICK / 180 BPM(鬼畜): 歯車がくるった時計塔。秒針のように止まり、巻き戻すように遅くなり、急に進む
import { sustain, bassLine, arp, build } from './kit.js';

const PROG = ['A3+C4+E4', 'D4+F4+A4', 'B3+D4+F4', 'E4+G#4+B4'];
const ROOT = ['A1', 'D2', 'B1', 'E1'];
const MEL =
  'A5 - E5 - A5 - C6 - | D6 - A5 - F5 - D6 - | B5 - F5 - D5 - B5 - | G#5 - B5 - E6 - - - |' +
  'C6 - B5 - A5 - E5 - | F5 - A5 - D6 - F6 - | D6 - B5 - F5 - G#5 - | A5 - - - - - - - |';

export default {
  id: 'clockwork-chaos',
  urlId: 'pz5w0r12j', // 曲ページのURL (music/pz5w0r12j/)。公開後は変えない
  title: 'Clockwork Chaos',
  artist: 'MUSIC LiDAR',
  genre: 'GIMMICK',
  bpm: 180,
  color: '#ffcc66',
  levels: { easy: 3, normal: 9, hard: 14 },
  preview: 96,
  chart: {
    easy: { maxNps: 3 },
    normal: { minGap: 0.14, maxNps: 7 },
    hard: { minGap: 0.07, maxNps: 12, minScore: 0.45, chordP: 0.5, chordMax: 3, sameGap: 0.07 },
  },
  // 秒針: 1拍ごとに半拍止まる / 巻き戻し: ゆっくり / ぜんまい: 急加速
  gimmicks: [
    ...[...Array(16)].map((_, i) => ({ beat: 32 + i + 0.5, type: 'stop', beats: 0.5 })),
    { beat: 48, type: 'speed', to: 0.4, beats: 4 },
    { beat: 64, type: 'speed', to: 2.2, beats: 0 },
    { beat: 80, type: 'speed', to: 1, beats: 0 },
    { beat: 94, type: 'stop', beats: 2 },
    { beat: 112, type: 'cover', to: 0.45, beats: 2 },
    { beat: 142, type: 'cover', to: 0, beats: 2 },
    ...[...Array(8)].map((_, i) => ({ beat: 144 + i * 4 + 3, type: 'stop', beats: 1 })),
    { beat: 176, type: 'speed', to: 1.9, beats: 16 },
  ],
  compose(s) {
    const tick = { hat: 'x...x...x...x...', snare: '..x...x...x...x.' };
    const core = { kick: 'X...X...X...X...', snare: '....X.......X...', hat: 'xxxxxxxxxxxxxxxx' };
    const gears = (from, bars, vel = 0.8) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 4, 3, 2, 1], oct: 1 });
    s.drums(0, 8, tick); sustain(s, 'pad', 0, 8, PROG, 0.5); s.ghost(() => gears(4, 4, 0.4));
    // 秒針
    s.crash(32);
    s.drums(8, 4, core); bassLine(s, 8, 4, ROOT, 'X...X...X...X...'); s.seq('bell', 32, 1, 'A5 - E5 - | D6 - A5 - | B5 - F5 - | G#5 - E6 - |', 1);
    // 巻き戻し → ぜんまい
    s.drums(12, 4, { kick: 'X.......X.......', snare: '........X.......' }); sustain(s, 'pad', 12, 4, PROG, 0.7); s.seq('lead', 48, 1, 'E6 - D6 - | C6 - B5 - | A5 - G#5 - | A5 - - - |', 0.9);
    s.crash(64);
    s.drums(16, 4, core); bassLine(s, 16, 4, ROOT, 'X.X.X.X.X.X.X.X.'); gears(16, 4, 0.9);
    s.drums(20, 4, core); bassLine(s, 20, 4, ROOT, 'X.x.X.x.X.x.X.x.'); s.seq('lead', 80, 0.5, MEL.split('|').slice(0, 4).join('|'), 1);
    build(s, 26);
    // 隠れる時計塔
    s.crash(112);
    s.drums(28, 8, core); bassLine(s, 28, 8, ROOT, 'X.x.X.x.X.x.X.x.'); s.seq('square', 112, 0.5, MEL, 1); s.ghost(() => gears(28, 8, 0.35));
    // 止まりながら
    s.crash(144);
    s.drums(36, 8, core); bassLine(s, 36, 8, ROOT, 'X.x.X.x.X.x.X.x.'); gears(36, 8, 0.85);
    // 加速して終わり
    s.crash(176);
    s.drums(44, 6, { ...core, kick: 'X.X.X.X.X.X.X.X.' }); bassLine(s, 44, 6, ROOT, 'X.X.X.X.X.X.X.X.'); s.seq('supersaw', 176, 0.5, MEL, 1);
    s.crash(200); s.kick(200); s.stab(200, ['A3', 'C4', 'E4', 'A4'], 3, 1); s.bass(200, 'A1', 2);
  },
};

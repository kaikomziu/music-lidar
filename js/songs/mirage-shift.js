// GIMMICK / 150 BPM: 蜃気楼のように譜面がゆれる。ゆっくり→急加速→止まる→隠れる
import { sustain, bassLine, arp, build } from './kit.js';

const PROG = ['E4+G4+B4', 'C4+E4+G4', 'D4+F#4+A4', 'B3+D#4+F#4'];
const ROOT = ['E1', 'C2', 'D2', 'B1'];
const MEL =
  'E5 - G5 - B5 - E6 - | D6 - C6 - B5 - G5 - | A5 - - - F#5 - D5 - | D#5 - F#5 - B5 - - - |' +
  'E6 - D6 - B5 - G5 - | E5 - G5 - C6 - E6 - | D6 - A5 - F#5 - D6 - | B5 - - - - - - - |';

export default {
  id: 'mirage-shift',
  urlId: 'vv2lr260p', // 曲ページのURL (music/vv2lr260p/)。公開後は変えない
  title: 'Mirage Shift',
  artist: 'MUSIC LiDAR',
  genre: 'GIMMICK',
  bpm: 150,
  color: '#ffd06f',
  levels: { easy: 3, normal: 8, hard: 12 },
  preview: 96,
  chart: { normal: { minGap: 0.17 }, hard: { minGap: 0.09, maxNps: 9 } },
  gimmicks: [
    { beat: 16, type: 'speed', to: 0.5, beats: 8 },
    { beat: 32, type: 'speed', to: 1, beats: 0 },
    { beat: 46, type: 'stop', beats: 2 },
    { beat: 64, type: 'speed', to: 2.2, beats: 0 },
    { beat: 80, type: 'speed', to: 0.7, beats: 0 },
    { beat: 96, type: 'speed', to: 1, beats: 4 },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ beat: 112 + i * 4 + 2, type: 'stop', beats: 1 })),
    { beat: 144, type: 'cover', to: 0.4, beats: 4 },
    { beat: 172, type: 'cover', to: 0, beats: 4 },
    { beat: 176, type: 'speed', to: 1.6, beats: 8 },
    { beat: 200, type: 'speed', to: 1, beats: 0 },
  ],
  compose(s) {
    const four = { kick: 'X...X...X...X...', hat: '..x...x...x...x.', clap: '....x.......x...' };
    const arps = (from, bars, vel = 0.6) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 2, 1], oct: 1 });
    sustain(s, 'pad', 0, 4, PROG, 0.6); arps(2, 2, 0.5);
    // ゆっくりになっていくところ
    s.drums(4, 4, { kick: 'X.......X.......', hat: '..x...x...x...x.' }); sustain(s, 'pad', 4, 4, PROG, 0.5);
    s.seq('bell', 16, 1, 'E5 - G5 - | B5 - - - | A5 - F#5 - | D#5 - - - |', 0.85);
    s.crash(32);
    s.drums(8, 8, four); bassLine(s, 8, 8, ROOT, '..X...X...X...X.'); s.seq('lead', 32, 0.5, MEL, 0.95);
    // 2.2倍速 → 0.7倍
    s.crash(64);
    s.drums(16, 4, { ...four, hat: 'xxxxxxxxxxxxxxxx' }); bassLine(s, 16, 4, ROOT, '..X...X...X...X.'); arps(16, 4, 0.85);
    s.drums(20, 4, { kick: 'X.......X.......', snare: '........X.......' }); sustain(s, 'pad', 20, 4, PROG, 0.6);
    s.seq('keys', 80, 1, 'E6 - D6 - | C6 - - - | A5 - D6 - | B5 - - - |', 0.9);
    build(s, 26);
    // 止まりながら進む
    s.crash(112);
    s.drums(28, 8, four); bassLine(s, 28, 8, ROOT, '..X...X...X...X.'); s.seq('square', 112, 0.5, MEL, 1);
    // 隠し
    s.crash(144);
    s.drums(36, 8, four); bassLine(s, 36, 8, ROOT, '..X...X...X...X.'); arps(36, 8, 0.75);
    // 加速して終わり
    s.crash(176);
    s.drums(44, 6, { ...four, hat: 'xxxxxxxxxxxxxxxx' }); bassLine(s, 44, 6, ROOT, '..X...X...X...X.');
    s.seq('supersaw', 176, 0.5, MEL, 1);
    s.crash(200); s.kick(200); s.pad(200, ['E4', 'G4', 'B4'], 4, 0.8); s.bass(200, 'E1', 2);
  },
};

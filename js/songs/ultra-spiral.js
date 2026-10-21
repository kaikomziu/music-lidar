// GIMMICK / 190 BPM(鬼畜): 譜面がらせんのように加速・減速・停止をくり返す。最凶のギミック曲
import { sustain, bassLine, arp, build } from './kit.js';

const PROG = ['B3+D4+F#4', 'G3+B3+D4', 'E4+G4+B4', 'F#3+A#3+C#4'];
const ROOT = ['B1', 'G1', 'E1', 'F#1'];
const MEL =
  'F#5 - B5 - D6 - F#6 - | G6 - F#6 - D6 - B5 - | E6 - G6 - B6 - G6 - | A#6 - F#6 - C#6 - A#5 - |' +
  'B5 - D6 - F#6 - B6 - | B6 - A6 - G6 - D6 - | G6 - E6 - B5 - E6 - | F#6 - - - C#6 - - - |';

export default {
  id: 'ultra-spiral',
  urlId: 'a56twjcjq', // 曲ページのURL (music/a56twjcjq/)。公開後は変えない
  title: 'Ultra Spiral',
  artist: 'MUSIC LiDAR',
  genre: 'GIMMICK',
  bpm: 190,
  color: '#e05eff',
  levels: { easy: 5, normal: 10, hard: 15 },
  preview: 128,
  chart: {
    easy: { minGap: 0.27, maxNps: 3.2 },
    normal: { minGap: 0.12, maxNps: 7, chordP: 0.3 },
    hard: { minGap: 0.066, maxNps: 13.5, minScore: 0.45, chordP: 0.5, chordMax: 3, sameGap: 0.066 },
  },
  gimmicks: [
    // らせん: 0.5倍 → 2倍 をなめらかに往復
    ...[0, 1, 2, 3].map((i) => ({ beat: 32 + i * 16, type: 'speed', to: i % 2 ? 0.5 : 2, beats: 8 })),
    { beat: 96, type: 'speed', to: 1, beats: 0 },
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => ({ beat: 96 + i * 2 + 1.5, type: 'stop', beats: 0.5 })),
    { beat: 128, type: 'cover', to: 0.5, beats: 4 },
    { beat: 158, type: 'stop', beats: 2 },
    { beat: 160, type: 'cover', to: 0, beats: 0 },
    { beat: 160, type: 'speed', to: 2.6, beats: 0 },
    { beat: 176, type: 'speed', to: 0.4, beats: 0 },
    { beat: 184, type: 'speed', to: 1.5, beats: 8 },
    { beat: 224, type: 'speed', to: 1, beats: 0 },
  ],
  compose(s) {
    const core = { kick: 'X...X...X...X...', snare: '....X.......X...', hat: 'xxxxxxxxxxxxxxxx' };
    const run = (from, bars, vel = 0.85) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 4, 5, 4, 3], oct: 1 });
    sustain(s, 'pad', 0, 8, PROG, 0.7); run(4, 4, 0.5);
    s.crash(32);
    s.drums(8, 16, core); bassLine(s, 8, 16, ROOT, 'X.x.X.x.X.x.X.x.'); s.seq('lead', 32, 0.5, MEL + MEL, 1); s.ghost(() => run(8, 16, 0.35));
    s.crash(96);
    s.drums(24, 8, core); bassLine(s, 24, 8, ROOT, 'X.x.X.x.X.x.X.x.'); run(24, 8, 0.9);
    s.crash(128);
    s.drums(32, 8, { ...core, kick: 'X.X.X.X.X.X.X.X.' }); bassLine(s, 32, 8, ROOT, 'X.x.X.x.X.x.X.x.'); s.seq('supersaw', 128, 0.5, MEL, 1);
    s.crash(160);
    s.drums(40, 8, core); run(40, 8, 0.95); bassLine(s, 40, 8, ROOT, 'X.X.X.X.X.X.X.X.');
    build(s, 54);
    s.crash(192);
    s.drums(48, 8, core); bassLine(s, 48, 8, ROOT, 'X.x.X.x.X.x.X.x.'); s.seq('lead', 192, 0.5, MEL, 1); run(48, 8, 0.6);
    s.crash(224); s.kick(224); s.stab(224, ['B3', 'D4', 'F#4', 'B4'], 3, 1); s.bass(224, 'B1', 2);
  },
};

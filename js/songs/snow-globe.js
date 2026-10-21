// WINTER / 96 BPM: スノードームの中の冬。鈴とベルのやさしいメロディ(初心者向け)
import { pattern, sustain, bassLine } from './kit.js';

const PROG = ['G4+B4+D5', 'E4+G4+B4', 'C4+E4+G4', 'D4+F#4+A4'];
const ROOT = ['G1', 'E1', 'C2', 'D2'];
const MEL =
  'D5 - G5 - B5 - - - | A5 - G5 - E5 - - - | E5 - G5 - C6 - - - | B5 - A5 - F#5 - - - |' +
  'D5 - G5 - B5 - D6 - | E6 - D6 - B5 - - - | C6 - B5 - A5 - E5 - | G5 - - - - - - - |';

export default {
  id: 'snow-globe',
  urlId: 't85637jar', // 曲ページのURL (music/t85637jar/)。公開後は変えない
  title: 'Snow Globe',
  artist: 'MUSIC LiDAR',
  genre: 'WINTER',
  bpm: 96,
  color: '#bfe6ff',
  levels: { easy: 1, normal: 2, hard: 4 },
  preview: 16,
  chart: { easy: { maxNps: 1.3 }, normal: { maxNps: 2.2, minGap: 0.3 }, hard: { minGap: 0.2, maxNps: 3.6 } },
  compose(s) {
    const bells = (from, bars, vel = 0.4) => pattern(s, 'bell', from, bars, 'x.x.x.x.x.x.x.x.', (b) => [PROG[b % 4].split('+')[(b + 2) % 3].replace(/\d/, (d) => +d + 1)], { vel, len: 0.3 });
    const beat = { kick: 'X.......X.......', hat: 'x.x.x.x.x.x.x.x.', snare: '....x.......x...' };
    sustain(s, 'pad', 0, 4, PROG, 0.6); s.ghost(() => bells(0, 4, 0.4));
    s.drums(4, 16, beat); sustain(s, 'pad', 4, 16, PROG, 0.35); bassLine(s, 4, 16, ROOT, 'X.......X.......'); s.ghost(() => bells(4, 16, 0.25));
    s.seq('bell', 16, 0.5, MEL, 0.95); s.seq('keys', 48, 0.5, MEL, 0.9);
    sustain(s, 'pad', 20, 4, PROG, 0.7); s.seq('pluck', 80, 1, 'B5 - - - | G5 - - - | E5 - - - | F#5 - - - |', 0.8);
    s.drums(24, 8, { ...beat, hat: 'xxxxxxxxxxxxxxxx' }); sustain(s, 'pad', 24, 8, PROG, 0.4); bassLine(s, 24, 8, ROOT, 'X...X...X...X...');
    s.seq('bell', 96, 0.5, MEL, 1); s.ghost(() => s.seq('keys', 96, 0.5, MEL, 0.4));
    s.crash(128, 0.5); s.pad(128, ['G4', 'B4', 'D5'], 4, 0.7); s.bell(128, 'G6', 3); s.bass(128, 'G1', 2);
  },
};

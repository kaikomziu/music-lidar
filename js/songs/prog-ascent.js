// PROGRESSIVE HOUSE / 126 BPM: 少しずつ音が重なって、ゆっくり空へ上っていく
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['B3+D4+F#4', 'G3+B3+D4', 'D4+F#4+A4', 'A3+C#4+E4'];
const ROOT = ['B1', 'G1', 'D2', 'A1'];
const MEL =
  'F#5 - - - D5 - B4 - | D5 - - - G5 - F#5 - | F#5 - - - A5 - - - | E5 - - - C#5 - - - |' +
  'F#5 - - - B5 - A5 - | G5 - - - D6 - B5 - | A5 - - - F#5 - D5 - | E5 - - - - - - - |';

export default {
  id: 'prog-ascent',
  urlId: 'vdxi3zoc4', // 曲ページのURL (music/vdxi3zoc4/)。公開後は変えない
  title: 'Ascent',
  artist: 'MUSIC LiDAR',
  genre: 'PROGRESSIVE HOUSE',
  bpm: 126,
  color: '#7ab8ff',
  levels: { easy: 2, normal: 5, hard: 9 },
  preview: 128,
  sidechain: true,
  chart: { hard: { minGap: 0.1, maxNps: 7.5 } },
  compose(s) {
    const four = { kick: 'X...X...X...X...', hat: '..x...x...x...x.' };
    const full = { kick: 'X...X...X...X...', hat: 'g.x.g.x.g.x.g.xg', clap: '....x.......x...', ride: 'x.x.x.x.x.x.x.x.' };
    const plucks = (from, bars, vel) => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 2, 1, 2, 3], oct: 1 });
    s.drums(0, 8, four); s.ghost(() => plucks(4, 4, 0.3));
    s.drums(8, 8, { ...four, clap: '....x.......x...' }); bassLine(s, 8, 8, ROOT, '..X...X...X...X.'); plucks(8, 8, 0.5);
    s.crash(64);
    s.drums(16, 8, full); bassLine(s, 16, 8, ROOT, '..X...X...X...X.'); s.ghost(() => plucks(16, 8, 0.35));
    s.seq('lead', 64, 0.5, MEL, 0.9); sustain(s, 'pad', 16, 8, PROG, 0.3);
    s.downer(96, 4); sustain(s, 'pad', 24, 8, PROG, 0.8); s.seq('bell', 96, 0.5, MEL, 0.85); build(s, 30);
    s.crash(128); s.crash(160, 0.8);
    s.drums(32, 16, full); bassLine(s, 32, 16, ROOT, '..X...X...X...X.');
    pattern(s, 'supersaw', 32, 16, 'X.......x...x...', (b) => PROG[b % 4], { vel: 0.35 });
    s.seq('supersaw', 128, 0.5, MEL, 1); s.seq('lead', 160, 0.5, MEL, 1); s.ghost(() => plucks(32, 16, 0.3));
    s.drums(48, 4, four); plucks(48, 3, 0.4);
    s.crash(208); s.kick(208); s.pad(208, ['B3', 'D4', 'F#4'], 4, 0.8); s.bass(208, 'B1', 2);
  },
};

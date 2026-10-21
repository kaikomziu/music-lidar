// MOOMBAHTON / 108 BPM: レゲトンのリズムにEDMのシンセ。南国のダンスフロア
import { pattern, sustain, bassLine } from './kit.js';

const PROG = ['G4+Bb4+D5', 'Eb4+G4+Bb4', 'F4+A4+C5', 'D4+F#4+A4'];
const ROOT = ['G1', 'Eb2', 'F1', 'D2'];
const DROP =
  'G5 . G5 Bb5 . G5 D6 . | Eb6 . D6 . Bb5 . G5 . | F5 . F5 A5 . F5 C6 . | D6 . C6 . A5 . F#5 . |';
const VERSE =
  'D5 - - - G5 - - - | Bb5 - A5 - G5 - - - | A5 - - - C6 - - - | A5 - - - F#5 - - - |';

export default {
  id: 'moombah-heat',
  urlId: 'mo5rip1sj', // 曲ページのURL (music/mo5rip1sj/)。公開後は変えない
  title: 'Moombah Heat',
  artist: 'MUSIC LiDAR',
  genre: 'MOOMBAHTON',
  bpm: 108,
  color: '#ff8c3d',
  levels: { easy: 2, normal: 5, hard: 8 },
  preview: 64,
  sidechain: true,
  chart: { hard: { minGap: 0.11, maxNps: 7 } },
  compose(s) {
    const dembow = { kick: 'X...X...X...X...', snare: '...X..X....X..X.', hat: 'x.x.x.x.x.x.x.x.' };
    s.drums(0, 4, { hat: 'x.x.x.x.x.x.x.x.', snare: '...x..x....x..x.' }); sustain(s, 'pad', 0, 4, PROG, 0.6);
    s.drums(4, 8, dembow); bassLine(s, 4, 8, ROOT, 'X..X..X...X..X..'); sustain(s, 'pad', 4, 8, PROG, 0.35);
    s.seq('pluck', 16, 0.5, VERSE + VERSE, 0.9);
    s.drums(12, 2, { kick: 'X...X...X...X...' }); s.drums(14, 1, { snare: 'x.x.x.x.x.x.x.x.' }); s.drums(15, 1, { snare: 'xxxxxxxxxxxxxxxx' }); s.riser(48, 16, 0.7);
    sustain(s, 'pad', 12, 4, PROG, 0.6);
    s.crash(64); s.crash(80, 0.8);
    s.drums(16, 8, dembow); bassLine(s, 16, 8, ROOT, 'X..X..X...X..X..', { type: 'reese' });
    s.seq('lead', 64, 0.5, DROP + DROP, 1); pattern(s, 'stab', 16, 8, '...x..x....x..x.', (b) => PROG[b % 4], { vel: 0.35, len: 0.2 });
    s.drums(24, 8, dembow); bassLine(s, 24, 8, ROOT, 'X..X..X...X..X..'); sustain(s, 'pad', 24, 8, PROG, 0.35);
    s.seq('square', 96, 0.5, VERSE + VERSE, 0.95);
    s.crash(128); s.crash(144, 0.8);
    s.drums(32, 8, dembow); bassLine(s, 32, 8, ROOT, 'X..X..X...X..X..', { type: 'reese' });
    s.seq('supersaw', 128, 0.5, DROP + DROP, 1); pattern(s, 'stab', 32, 8, '...x..x....x..x.', (b) => PROG[b % 4], { vel: 0.35, len: 0.2 });
    s.crash(160); s.kick(160); s.stab(160, ['G4', 'Bb4', 'D5'], 2, 1); s.bass(160, 'G1', 2);
  },
};

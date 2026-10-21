// KIDS POP / 120 BPM: わたあめみたいにふわふわの、かんたんで楽しい曲
import { pattern, sustain, bassLine } from './kit.js';

const PROG = ['F4+A4+C5', 'C4+E4+G4', 'D4+F4+A4', 'Bb3+D4+F4'];
const ROOT = ['F1', 'C2', 'D2', 'Bb1'];
const MEL =
  'C5 - F5 - A5 - - - | G5 - E5 - C5 - - - | D5 - F5 - A5 - - - | Bb5 - A5 - F5 - - - |' +
  'C6 - A5 - F5 - - - | G5 - - - E5 - - - | F5 - A5 - D6 - C6 - | Bb5 - - - A5 - - - |';

export default {
  id: 'cotton-candy',
  urlId: 'lxb2wug9u', // 曲ページのURL (music/lxb2wug9u/)。公開後は変えない
  title: 'Cotton Candy',
  artist: 'MUSIC LiDAR',
  genre: 'KIDS POP',
  bpm: 120,
  color: '#ffb8d9',
  levels: { easy: 1, normal: 2, hard: 4 },
  preview: 16,
  chart: { easy: { maxNps: 1.3 }, normal: { maxNps: 2.2, minGap: 0.3 }, hard: { minGap: 0.2, maxNps: 3.6 } },
  compose(s) {
    const piano = (from, bars, vel = 0.4) => pattern(s, 'keys', from, bars, 'x...x...x...x...', (b) => PROG[b % 4], { vel, len: 0.5 });
    const beat = { kick: 'X.......X.......', clap: '....X.......X...', hat: '..x...x...x...x.' };
    piano(0, 4, 0.5); s.seq('bell', 0, 1, 'C6 - A5 - | G5 - E5 - | F5 - A5 - | Bb5 - - - |', 0.7);
    s.drums(4, 16, beat); s.ghost(() => piano(4, 16)); bassLine(s, 4, 16, ROOT, 'X.......X.......');
    s.seq('bell', 16, 0.5, MEL, 0.9); s.seq('square', 48, 0.5, MEL, 0.9);
    sustain(s, 'pad', 20, 4, PROG, 0.6); s.seq('keys', 80, 1, 'A5 - - - | G5 - - - | F5 - - - | D5 - - - |', 0.8);
    s.drums(24, 8, { ...beat, hat: 'x.x.x.x.x.x.x.x.' }); s.ghost(() => piano(24, 8)); bassLine(s, 24, 8, ROOT, 'X...X...X...X...');
    s.seq('lead', 96, 0.5, MEL, 0.95); s.ghost(() => s.seq('bell', 96, 0.5, MEL, 0.35));
    s.kick(128); s.crash(128, 0.5); s.bell(128, 'F6', 2); s.pad(128, ['F4', 'A4', 'C5'], 3, 0.6); s.bass(128, 'F1', 2);
  },
};

// SYMPHONIC METAL / 195 BPM(鬼畜): 合唱のような厚いパッドとツーバス、ギターの速弾き
import { pattern, sustain, bassLine } from './kit.js';

const PROG = ['D4+F4+A4', 'Bb3+D4+F4', 'G3+Bb3+D4', 'A3+C#4+E4'];
const PWR = ['D2+A2+D3', 'Bb1+F2+Bb2', 'G1+D2+G2', 'A1+E2+A2'];
const ROOT = ['D2', 'Bb1', 'G1', 'A1'];
const SHRED = [
  'D5 E5 F5 G5 A5 G5 F5 E5 D5 F5 A5 D6 C#6 D6 E6 F6',
  'Bb4 C5 D5 F5 Bb5 A5 G5 F5 D5 F5 Bb5 D6 C6 D6 Eb6 F6',
  'G4 A4 Bb4 D5 G5 F5 E5 D5 Bb4 D5 G5 Bb5 A5 Bb5 C6 D6',
  'A4 C#5 E5 A5 C#6 A5 E5 C#5 E5 A5 C#6 E6 G6 F6 E6 C#6',
];
const CHOIR =
  'A5 - - - D6 - - - | F6 - - - D6 - - - | D6 - - - Bb5 - G5 - | A5 - - - C#6 - - - |' +
  'D6 - - - F6 - - - | Bb6 - - - A6 - - - | G6 - F6 - E6 - D6 - | C#6 - - - E6 - - - |';

export default {
  id: 'thunder-requiem',
  urlId: '13wc0vnva', // 曲ページのURL (music/13wc0vnva/)。公開後は変えない
  title: 'Thunder Requiem',
  artist: 'MUSIC LiDAR',
  genre: 'SYMPHONIC METAL',
  bpm: 195,
  color: '#ffcc3d',
  levels: { easy: 5, normal: 10, hard: 13 },
  preview: 128,
  chart: {
    easy: { minGap: 0.27, maxNps: 3.2 },
    normal: { minGap: 0.12, maxNps: 7, chordP: 0.3 },
    hard: { minGap: 0.07, maxNps: 13, minScore: 0.45, chordP: 0.5, chordMax: 3, sameGap: 0.07 },
  },
  compose(s) {
    const gtr = (from, bars, vel = 0.55) => pattern(s, 'guitar', from, bars, 'X.x.X.x.X.x.X.x.', (b) => PWR[b % 4], { vel, len: 0.35 });
    const shred = (from, bars, vel = 0.95) => { for (let b = from; b < from + bars; b++) s.seq('gtrlead', b * 4, 0.25, SHRED[b % 4], vel); };
    const blast = { kick: 'XXXXXXXXXXXXXXXX', snare: '....X.......X...', ride: 'x.x.x.x.x.x.x.x.' };
    const gallop = { kick: 'X.xxX.xxX.xxX.xx', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    sustain(s, 'pad', 0, 8, PROG, 0.8); s.seq('bell', 0, 1, 'D6 - A5 - | F5 - - - | G5 - Bb5 - | A5 - - - |'.repeat(2), 0.7);
    s.drums(6, 2, { kick: 'X...X...X...X...', snare: 'x.x.x.x.xxxxxxxx' });
    s.crash(32);
    s.drums(8, 8, gallop); gtr(8, 8); bassLine(s, 8, 8, ROOT, 'X.xxX.xxX.xxX.xx'); shred(8, 8);
    s.crash(64); s.crash(96, 0.8);
    s.drums(16, 16, blast); gtr(16, 16, 0.5); bassLine(s, 16, 16, ROOT, 'X.x.X.x.X.x.X.x.'); sustain(s, 'pad', 16, 16, PROG, 0.5);
    s.seq('supersaw', 64, 0.5, CHOIR + CHOIR, 1);
    sustain(s, 'pad', 32, 4, PROG, 0.9); s.seq('keys', 128, 0.25, SHRED.join(' '), 0.85);
    s.crash(144); s.crash(176, 0.8);
    s.drums(36, 16, gallop); gtr(36, 16); bassLine(s, 36, 16, ROOT, 'X.xxX.xxX.xxX.xx'); shred(36, 16, 1);
    s.ghost(() => s.seq('supersaw', 144, 0.5, CHOIR + CHOIR, 0.45));
    s.crash(208); s.kick(208); s.guitar(208, ['D2', 'A2', 'D3'], 3, 1); s.pad(208, ['D4', 'F4', 'A4', 'D5'], 4, 1); s.bass(208, 'D2', 3);
  },
};

// AFROBEATS / 104 BPM: はずむパーカッションと、ギターのくり返しリフ、明るいシンセ
import { pattern, bassLine, sustain } from './kit.js';

const PROG = ['C4+E4+G4', 'A3+C4+E4', 'F3+A3+C4', 'G3+B3+D4'];
const ROOT = ['C2', 'A1', 'F1', 'G1'];
const RIFF = ['E5 G5 . E5 C5 . G4 .', 'C5 E5 . C5 A4 . E4 .', 'A4 C5 . A4 F4 . C5 .', 'B4 D5 . B4 G4 . D5 .'];
const MEL =
  'G5 - - E5 G5 - A5 - | C6 - - - A5 - G5 - | A5 - - F5 A5 - C6 - | B5 - - - G5 - - - |' +
  'G5 - - E5 G5 - C6 - | E6 - - - D6 - C6 - | A5 - C6 - F5 - A5 - | G5 - - - - - . . |';

export default {
  id: 'afro-sunrise',
  urlId: 'bh4pcwmbk', // 曲ページのURL (music/bh4pcwmbk/)。公開後は変えない
  title: 'Afro Sunrise',
  artist: 'MUSIC LiDAR',
  genre: 'AFROBEATS',
  bpm: 104,
  color: '#ffa53d',
  levels: { easy: 2, normal: 4, hard: 8 },
  preview: 48,
  chart: { hard: { minGap: 0.11, maxNps: 6.5 } },
  compose(s) {
    const riff = (from, bars, vel = 0.55) => { for (let b = from; b < from + bars; b++) s.seq('pluck', b * 4, 0.5, RIFF[b % 4], vel); };
    const afro = { kick: 'X..x..X...X..x..', snare: '....x..g....x...', hat: 'x.xxx.xxx.xxx.xx' };
    riff(0, 4, 0.7); s.drums(2, 2, { hat: 'x.xxx.xxx.xxx.xx' });
    s.drums(4, 8, afro); s.ghost(() => riff(4, 8, 0.4)); bassLine(s, 4, 8, ROOT, 'X..x..X...X.....');
    s.seq('lead', 16, 0.5, MEL, 0.9);
    s.crash(48);
    s.drums(12, 8, afro); riff(12, 8, 0.5); bassLine(s, 12, 8, ROOT, 'X..x..X...X.....'); sustain(s, 'pad', 12, 8, PROG, 0.35);
    s.drums(20, 4, { kick: 'X..x..X...X..x..', hat: 'x.x.x.x.x.x.x.x.' }); bassLine(s, 20, 4, ROOT, 'X..x..X...X.....');
    s.seq('keys', 80, 1, 'G5 - E5 - | A5 - - - | F5 - A5 - | G5 - - - |', 0.85);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, afro); s.ghost(() => riff(24, 16, 0.4)); bassLine(s, 24, 16, ROOT, 'X..x..X...X..x..');
    pattern(s, 'stab', 24, 16, '..x...x...x..x..', (b) => PROG[b % 4], { vel: 0.3, len: 0.2 });
    s.seq('square', 96, 0.5, MEL, 1); s.seq('lead', 128, 0.5, MEL, 1);
    s.crash(160); s.kick(160); s.pad(160, ['C4', 'E4', 'G4'], 3, 0.7); s.pluck(160, 'C5', 2); s.bass(160, 'C2', 2);
  },
};

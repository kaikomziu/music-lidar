// SYNTH POP / 120 BPM: 80年代のゲームセンター。きらきらのシンセとゲートのかかったスネア
import { pattern, sustain, bassLine } from './kit.js';

const PROG = ['A3+C4+E4', 'F3+A3+C4', 'C4+E4+G4', 'G3+B3+D4'];
const ROOT = ['A1', 'F1', 'C2', 'G1'];
const MEL =
  'E5 - A5 - C6 - B5 - | A5 - - - F5 - - - | G5 - C6 - E6 - D6 - | B5 - - - G5 - - - |' +
  'E5 - A5 - C6 - E6 - | F6 - E6 - C6 - A5 - | G5 - C6 - D6 - E6 - | D6 - - - B5 - - - |';

export default {
  id: 'retro-arcade',
  urlId: 'fnrgi7weg', // 曲ページのURL (music/fnrgi7weg/)。公開後は変えない
  title: 'Retro Arcade',
  artist: 'MUSIC LiDAR',
  genre: 'SYNTH POP',
  bpm: 120,
  color: '#ff5ec4',
  levels: { easy: 2, normal: 5, hard: 8 },
  preview: 64,
  chart: { hard: { minGap: 0.11, maxNps: 7 } },
  compose(s) {
    const synth = (from, bars, vel = 0.4) => pattern(s, 'stab', from, bars, 'x.x...x.x.x...x.', (b) => PROG[b % 4], { vel, len: 0.2 });
    const eighty = { kick: 'X.......X.X.....', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    s.seq('square', 0, 0.25, 'A4 C5 E5 A5 '.repeat(4) + 'F4 A4 C5 F5 '.repeat(4) + 'C5 E5 G5 C6 '.repeat(4) + 'G4 B4 D5 G5 '.repeat(4), 0.6);
    s.drums(4, 8, eighty); synth(4, 8); bassLine(s, 4, 8, ROOT, 'X.X.X.X.X.X.X.X.');
    s.seq('lead', 16, 0.5, MEL, 0.95);
    s.crash(48);
    s.drums(12, 8, eighty); s.ghost(() => synth(12, 8, 0.35)); bassLine(s, 12, 8, ROOT, 'X.X.X.X.X.X.X.X.'); sustain(s, 'pad', 12, 8, PROG, 0.35);
    s.seq('supersaw', 48, 0.5, MEL, 0.95);
    s.drums(20, 4, { kick: 'X...X...X...X...', snare: '....X.......X..X' }); s.seq('square', 80, 0.25, ('A5 E5 C5 E5 ').repeat(16), 0.7);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, { ...eighty, hat: 'xxxxxxxxxxxxxxxx' }); synth(24, 16, 0.35); bassLine(s, 24, 16, ROOT, 'X.X.X.X.X.X.X.X.');
    s.seq('lead', 96, 0.5, MEL, 1); s.seq('supersaw', 128, 0.5, MEL, 1);
    s.crash(160); s.kick(160); s.stab(160, ['A4', 'C5', 'E5', 'A5'], 2, 1); s.bass(160, 'A1', 2);
  },
};

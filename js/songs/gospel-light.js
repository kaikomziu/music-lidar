// GOSPEL / 84 BPM: 手拍子とオルガン、教会のピアノ。ハネるリズムで高らかに
import { pattern, sustain, bassLine } from './kit.js';

const PROG = ['C4+E4+G4', 'F4+A4+C5', 'C4+E4+G4', 'G4+B4+D5', 'A4+C5+E5', 'F4+A4+C5', 'C4+E4+G4', 'G4+B4+D5'];
const ROOT = ['C2', 'F1', 'C2', 'G1', 'A1', 'F1', 'C2', 'G1'];
const MEL =
  'E5 - G5 - C6 - - - | A5 - G5 - F5 - - - | E5 - D5 - C5 - E5 - | D5 - - - - - . . |' +
  'E5 - G5 - C6 - D6 - | E6 - - - C6 - A5 - | G5 - E5 - D5 - C5 - | C5 - - - - - . . |';

export default {
  id: 'gospel-light',
  urlId: 'ohl6lbgft', // 曲ページのURL (music/ohl6lbgft/)。公開後は変えない
  title: 'Gospel Light',
  artist: 'MUSIC LiDAR',
  genre: 'GOSPEL',
  bpm: 84,
  color: '#fff0a0',
  levels: { easy: 1, normal: 3, hard: 5 },
  preview: 48,
  chart: { easy: { maxNps: 1.5 }, hard: { minGap: 0.13, maxNps: 5 } },
  compose(s) {
    s.setSwing(1 / 6);
    const organ = (from, bars, vel = 0.55) => sustain(s, 'pad', from, bars, PROG, vel);
    const piano = (from, bars, vel = 0.4) => pattern(s, 'keys', from, bars, '..x...x...x...x.', (b) => PROG[b % 8], { vel, len: 0.4 });
    const clap = { kick: 'X.......X.......', clap: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    organ(0, 4, 0.7); s.seq('keys', 0, 0.5, 'G5 - - - E5 - - - | F5 - - - A5 - - - | G5 - - - - - - - | D5 - - - - - - - |', 0.8);
    s.drums(4, 16, clap); organ(4, 16, 0.4); piano(4, 16); bassLine(s, 4, 16, ROOT, 'X.......X...x...');
    s.seq('lead', 16, 0.5, MEL, 0.95); s.seq('keys', 48, 0.5, MEL, 0.95);
    s.drums(20, 4, { clap: 'x...X...x...X...' }); organ(20, 4, 0.7);
    s.seq('bell', 80, 1, 'C6 - - - | A5 - - - | G5 - - - | D6 - - - |', 0.8);
    s.crash(96);
    s.drums(24, 8, { ...clap, clap: '..x.X...x.x.X...' }); organ(24, 8, 0.45); piano(24, 8, 0.45); bassLine(s, 24, 8, ROOT, 'X...X...X...X...');
    s.seq('lead', 96, 0.5, MEL, 1); s.ghost(() => s.seq('bell', 96, 0.5, MEL, 0.3));
    s.crash(128); s.kick(128); s.pad(128, ['C4', 'E4', 'G4', 'C5'], 4, 0.9); s.keys(128, 'C6', 3); s.bass(128, 'C2', 3);
  },
};

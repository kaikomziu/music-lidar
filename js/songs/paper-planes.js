// J-POP / 132 BPM: 王道進行(IV→V→iii→vi)のピアノとバンドで、まっすぐなサビ
import { pattern, sustain, bassLine, build } from './kit.js';

const PROG = ['F4+A4+C5', 'G4+B4+D5', 'E4+G4+B4', 'A4+C5+E5'];
const ROOT = ['F1', 'G1', 'E1', 'A1'];
const VERSE =
  'A5 - G5 - F5 - E5 - | D5 - E5 - G5 - - - | G5 - E5 - D5 - B4 - | C5 - - - A4 - - - |' +
  'A5 - G5 - F5 - A5 - | B5 - A5 - G5 - D6 - | B5 - - - A5 - G5 - | A5 - - - - - . . |';
const CHORUS =
  'C6 - - - C6 - D6 - | D6 - - - B5 - G5 - | B5 - - - G5 - E5 - | E5 - A5 - C6 - - - |' +
  'C6 - - - C6 - E6 - | D6 - - - B5 - D6 - | E6 - D6 - B5 - G5 - | A5 - - - - - - - |';

export default {
  id: 'paper-planes',
  urlId: 'a7nclvpcx', // 曲ページのURL (music/a7nclvpcx/)。公開後は変えない
  title: 'Paper Planes',
  artist: 'MUSIC LiDAR',
  genre: 'J-POP',
  bpm: 132,
  color: '#7fd4ff',
  levels: { easy: 2, normal: 5, hard: 8 },
  preview: 80,
  chart: { hard: { minGap: 0.11, maxNps: 7 } },
  compose(s) {
    const piano = (from, bars, vel = 0.45) => pattern(s, 'keys', from, bars, 'x.x.x.x.x.x.x.x.', (b) => PROG[b % 4], { vel, len: 0.4 });
    const band = { kick: 'X.....x.X.......', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const rock = { kick: 'X.x...x.X.x.....', snare: '....X.......X...', hat: 'xxxxxxxxxxxxxxxx' };
    // intro
    s.seq('keys', 0, 0.5, CHORUS.split('|').slice(0, 4).join('|'), 0.8); piano(0, 4, 0.4);
    // Aメロ
    s.crash(16);
    s.drums(4, 8, band); s.ghost(() => piano(4, 8, 0.35)); bassLine(s, 4, 8, ROOT, 'X.......X.......');
    s.seq('lead', 16, 0.5, VERSE, 0.9);
    // Bメロ(盛り上げ)
    s.drums(12, 2, band); sustain(s, 'pad', 12, 4, PROG, 0.5); bassLine(s, 12, 4, ROOT, 'X.X.X.X.X.X.X.X.');
    s.seq('bell', 48, 0.5, 'E5 - - - G5 - - - | A5 - - - B5 - - - | C6 - - - D6 - - - | E6 - - - - - - - |', 0.85);
    build(s, 14);
    // サビ
    s.crash(64);
    s.drums(16, 8, rock); piano(16, 8); bassLine(s, 16, 8, ROOT, 'X.x.X.x.X.x.X.x.');
    s.seq('supersaw', 64, 0.5, CHORUS, 1);
    // 間奏 → Aメロ → サビ2回
    s.drums(24, 4, band); piano(24, 4, 0.5); bassLine(s, 24, 4, ROOT, 'X.......X.......');
    s.crash(112);
    s.drums(28, 8, band); s.ghost(() => piano(28, 8, 0.35)); bassLine(s, 28, 8, ROOT, 'X.......X.......');
    s.seq('keys', 112, 0.5, VERSE, 0.95);
    build(s, 34);
    s.crash(144); s.crash(176);
    s.drums(36, 16, rock); piano(36, 16); bassLine(s, 36, 16, ROOT, 'X.x.X.x.X.x.X.x.');
    s.seq('supersaw', 144, 0.5, CHORUS, 1);
    s.seq('lead', 176, 0.5, CHORUS, 1);
    s.ghost(() => s.seq('supersaw', 176, 0.5, CHORUS, 0.4));
    s.crash(208); s.kick(208); s.pad(208, ['F4', 'A4', 'C5', 'E5'], 4, 0.8); s.keys(208, 'C6', 3); s.bass(208, 'F1', 3);
  },
};

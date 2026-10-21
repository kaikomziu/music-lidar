// CHIPTUNE / 180 BPM: ダンジョンを駆け抜ける8bit。三角波ベースと速いアルペジオ
import { arp } from './kit.js';

const PROG = ['D4+F4+A4', 'Bb3+D4+F4', 'C4+E4+G4', 'A3+C#4+E4'];
const ROOT = ['D2', 'Bb1', 'C2', 'A1'];
const THEME =
  'D5 - F5 - A5 - D6 - | C6 - Bb5 - A5 - F5 - | G5 - - - C6 - - - | C#6 - - - E6 - - - |' +
  'D6 - C6 - A5 - F5 - | Bb5 - A5 - F5 - D5 - | E5 - G5 - C6 - E6 - | D6 - - - - - - - |';
const RUN = 'D5 E5 F5 G5 A5 G5 F5 E5 D5 F5 A5 D6 A5 F5 D5 A4';

export default {
  id: 'chip-dungeon',
  urlId: 'e8bj729yj', // 曲ページのURL (music/e8bj729yj/)。公開後は変えない
  title: 'Chip Dungeon',
  artist: 'MUSIC LiDAR',
  genre: 'CHIPTUNE',
  bpm: 180,
  color: '#8cff9a',
  levels: { easy: 3, normal: 8, hard: 12 },
  preview: 96,
  chart: { normal: { minGap: 0.15 }, hard: { minGap: 0.08, maxNps: 10.5 } },
  compose(s) {
    const bass = (from, bars) => { for (let b = from; b < from + bars; b++) for (let i = 0; i < 8; i++) s.chipbass(b * 4 + i / 2, i % 2 ? ROOT[b % 4].replace(/\d/, (d) => +d + 1) : ROOT[b % 4], 0.4, 1); };
    const arps = (from, bars, vel = 0.4) => { for (let b = from; b < from + bars; b++) { const c = PROG[b % 4].split('+'); for (let i = 0; i < 16; i++) s.chip(b * 4 + i / 4, c[i % 3].replace(/\d/, (d) => +d + 1), 0.2, vel, 0.125); } };
    const beat = { chipkick: 'X.....x.X.......', chipsnare: '....X.......X...', chiphat: 'x.x.x.x.x.x.x.x.' };
    const busy = { chipkick: 'X.x...x.X.x...x.', chipsnare: '....X.......X..x', chiphat: 'xxxxxxxxxxxxxxxx' };
    s.ghost(() => arps(0, 4, 0.5)); s.drums(2, 2, { chiphat: 'x.x.x.x.x.x.x.x.' });
    s.seq('chip', 0, 0.25, RUN + ' ' + RUN, 0.8);
    s.drums(4, 8, beat); bass(4, 8); s.ghost(() => arps(4, 8));
    for (const [t, st] of [[16, THEME]]) s.seq('chip', t, 0.5, st, 1);
    s.drums(12, 8, busy); bass(12, 8);
    for (let b = 12; b < 20; b++) s.seq('chip', b * 4, 0.25, RUN, 0.85);
    s.drums(20, 16, busy); bass(20, 16); s.ghost(() => arps(20, 16, 0.35));
    s.seq('chip', 80, 0.5, THEME, 1); s.seq('square', 112, 0.5, THEME, 1);
    s.drums(36, 4, { chipkick: 'X...X...X...X...', chiphat: 'x.x.x.x.x.x.x.x.' }); bass(36, 4);
    arp(s, 'chip', 36, 4, PROG, { step: 0.25, vel: 0.8, order: [0, 1, 2, 3, 4, 5, 4, 3], oct: 1 });
    s.drums(40, 8, busy); bass(40, 8);
    s.seq('chip', 160, 0.5, THEME, 1); s.ghost(() => arps(40, 8, 0.35));
    s.chipkick(192); s.chip(192, 'D6', 2, 1); s.chipbass(192, 'D2', 2);
  },
};

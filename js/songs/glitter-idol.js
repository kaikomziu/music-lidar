// IDOL POP / 168 BPM: きらきらのシンセとコール(手拍子)が入る、元気なアイドルソング
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['C4+E4+G4', 'A3+C4+E4', 'F3+A3+C4', 'G3+B3+D4'];
const ROOT = ['C2', 'A1', 'F1', 'G1'];
const VERSE =
  'E5 - G5 - E5 - D5 C5 | A5 - - - G5 - - - | F5 - A5 - C6 - A5 - | G5 - - - - - . . |' +
  'E5 - G5 - E5 - D5 C5 | A5 - - - C6 - - - | B5 - A5 - G5 - D5 - | C5 - - - - - . . |';
const CHORUS =
  'C6 - C6 - D6 - E6 - | E6 - D6 - C6 - A5 - | F5 - A5 - C6 - F6 - | E6 - D6 - D6 - - - |' +
  'C6 - C6 - D6 - E6 - | G6 - E6 - C6 - A5 - | F6 - E6 - D6 - B5 - | C6 - - - - - - - |';

export default {
  id: 'glitter-idol',
  urlId: 'b9yajlduo', // 曲ページのURL (music/b9yajlduo/)。公開後は変えない
  title: 'Glitter Idol',
  artist: 'MUSIC LiDAR',
  genre: 'IDOL POP',
  bpm: 168,
  color: '#ff9de6',
  levels: { easy: 3, normal: 7, hard: 10 },
  preview: 96,
  sidechain: true,
  chart: { normal: { minGap: 0.16 }, hard: { minGap: 0.095, maxNps: 8.5 } },
  compose(s) {
    const sparkle = (from, bars, vel = 0.45) => arp(s, 'bell', from, bars, PROG, { step: 0.25, vel, oct: 1, order: [0, 1, 2, 3, 2, 1] });
    const four = { kick: 'X...X...X...X...', clap: '....X.......X...', hat: '..x...x...x...x.' };
    const call = { kick: 'X...X...X...X...', clap: 'x.x.X.x.x.x.X.x.', hat: 'x.x.x.x.x.x.x.x.' }; // 「はい!はい!」の手拍子
    sparkle(0, 4, 0.6); s.drums(2, 2, { kick: 'X...X...X...X...' });
    s.crash(16);
    s.drums(4, 8, four); bassLine(s, 4, 8, ROOT, 'X.o.X.o.X.o.X.o.'); s.ghost(() => sparkle(4, 8, 0.3));
    s.seq('square', 16, 0.5, VERSE, 0.9);
    sustain(s, 'pad', 12, 4, PROG, 0.6); bassLine(s, 12, 4, ROOT, 'X.......X.......');
    s.seq('lead', 48, 1, 'G5 - A5 - | C6 - - - | A5 - C6 - | D6 - - - |', 0.85);
    build(s, 14);
    s.crash(64); s.crash(96, 0.8);
    s.drums(16, 16, call); bassLine(s, 16, 16, ROOT, 'X.o.X.o.X.o.X.o.'); pattern(s, 'supersaw', 16, 16, 'X..x..x...x..x..', (b) => PROG[b % 4], { vel: 0.4 });
    s.seq('lead', 64, 0.5, CHORUS, 1); s.seq('square', 96, 0.5, CHORUS, 1);
    sparkle(32, 4, 0.6); s.drums(32, 4, four); bassLine(s, 32, 4, ROOT, 'X.o.X.o.X.o.X.o.');
    s.crash(144);
    s.drums(36, 8, four); bassLine(s, 36, 8, ROOT, 'X.o.X.o.X.o.X.o.'); s.ghost(() => sparkle(36, 8, 0.3));
    s.seq('square', 144, 0.5, VERSE, 1);
    build(s, 44);
    s.crash(184); s.crash(216, 0.8);
    s.drums(46, 16, call); bassLine(s, 46, 16, ROOT, 'X.o.X.o.X.o.X.o.'); pattern(s, 'supersaw', 46, 16, 'X..x..x...x..x..', (b) => PROG[b % 4], { vel: 0.4 });
    s.seq('lead', 184, 0.5, CHORUS, 1); s.seq('lead', 216, 0.5, CHORUS, 1);
    s.ghost(() => s.seq('bell', 216, 0.5, CHORUS, 0.35));
    s.crash(248); s.kick(248); s.stab(248, ['C5', 'E5', 'G5', 'C6'], 3, 1); s.bass(248, 'C2', 2);
  },
};

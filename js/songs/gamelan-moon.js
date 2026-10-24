// GAMELAN / 120 BPM: ガムラン風の金属音と、からみあう音階。満月の夜のエレクトロ
import { sustain, bassLine, arp, build } from './kit.js';

const PROG = ['E4+B4', 'C4+G4', 'F4+C5', 'E4+B4'];
const ROOT = ['E1', 'C2', 'F1', 'E1'];
const MEL =
  'E5 F5 G5 . B5 . G5 F5 | E5 . . C5 E5 . F5 . | G5 . F5 E5 C5 . B4 . | E5 - - - . . . . |' +
  'B5 . C6 B5 G5 . F5 . | E5 F5 G5 . B5 . C6 . | B5 . G5 F5 E5 . C5 . | E5 - - - - - . . |';

export default {
  id: 'gamelan-moon',
  urlId: 'xme59yccq', // 曲ページのURL (music/xme59yccq/)。公開後は変えない
  title: 'Gamelan Moon',
  artist: 'MUSIC LiDAR',
  genre: 'GAMELAN',
  bpm: 120,
  color: '#ffd27a',
  levels: { easy: 3, normal: 5, hard: 8 },
  preview: 64,
  chart: { hard: { minGap: 0.1, maxNps: 7.5 } },
  compose(s) {
    const kotekan = (from, bars, vel = 0.3) => s.ghost(() => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 1, 3, 1, 2, 0], oct: 1 }));
    const kendang = { kick: 'X..x..x.X.x...x.', snare: '....x..g....x..g' };
    s.seq('bell', 0, 0.5, MEL.split('|').slice(0, 4).join('|'), 0.7); s.crash(0, 0.6);
    s.drums(4, 16, kendang); kotekan(4, 16); bassLine(s, 4, 16, ROOT, 'X.......X...X...');
    s.seq('bell', 16, 0.5, MEL, 0.9); s.seq('pluck', 48, 0.5, MEL, 0.85); s.crash(48, 0.6);
    sustain(s, 'pad', 20, 4, PROG, 0.6); s.seq('bell', 80, 1, 'E6 - - - | C6 - B5 - | G5 - F5 - | E5 - - - |', 0.7); build(s, 22);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, { ...kendang, hat: 'x.x.x.x.x.x.x.x.' }); kotekan(24, 16, 0.35); bassLine(s, 24, 16, ROOT, 'X..xX...X..xX.o.');
    s.seq('lead', 96, 0.5, MEL, 0.95); s.seq('bell', 128, 0.5, MEL, 1);
    s.drums(40, 8, kendang); kotekan(40, 8, 0.4); bassLine(s, 40, 8, ROOT, 'X.......X...X...');
    arp(s, 'pluck', 40, 8, PROG, { step: 0.5, vel: 0.7, order: [0, 2, 1, 3, 2, 1, 3, 2], oct: 1 });
    s.crash(192); s.kick(192); s.bell(192, 'E5', 4); s.bell(192, 'B5', 4); s.bass(192, 'E1', 3);
  },
};

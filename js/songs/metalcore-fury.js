// METALCORE / 200 BPM: ツーバスの連打、刻むギター、重いブレイクダウン
import { pattern, bassLine } from './kit.js';

const PWR = ['D2+A2+D3', 'Bb1+F2+Bb2', 'C2+G2+C3', 'A1+E2+A2'];
const ROOT = ['D2', 'Bb1', 'C2', 'A1'];
const CHORUS =
  'A5 - - - D6 - - - | F6 - - - E6 - D6 - | C6 - - - E6 - - - | E6 - - - C#6 - - - |' +
  'D6 - - - F6 - - - | A6 - - - G6 - F6 - | E6 - - - C6 - - - | D6 - - - - - - - |';
const RIFF = ['D5 D5 F5 D5 G5 D5 A5 D5', 'Bb4 Bb4 D5 Bb4 F5 Bb4 A5 F5', 'C5 C5 E5 C5 G5 C5 E5 G5', 'A4 A4 C#5 A4 E5 A4 G5 E5'];

export default {
  id: 'metalcore-fury',
  urlId: 'wrs1a9som', // 曲ページのURL (music/wrs1a9som/)。公開後は変えない
  title: 'Metalcore Fury',
  artist: 'MUSIC LiDAR',
  genre: 'METALCORE',
  bpm: 200,
  color: '#ff3d3d',
  levels: { easy: 4, normal: 9, hard: 13 },
  preview: 96,
  chart: { easy: { maxNps: 3 }, normal: { minGap: 0.13, maxNps: 7.5 }, hard: { minGap: 0.072, maxNps: 12, chordP: 0.45, minScore: 0.8 } },
  compose(s) {
    const chug = (from, bars, vel = 0.6) => pattern(s, 'guitar', from, bars, 'X.x.X.x.X.x.X.x.', (b) => PWR[b % 4], { vel, len: 0.4 });
    const riff = (from, bars, vel = 0.9) => { for (let b = from; b < from + bars; b++) s.seq('gtrlead', b * 4, 0.5, RIFF[b % 4], vel); };
    const blast = { kick: 'XXXXXXXXXXXXXXXX', snare: '..x...x...x...x.', hat: 'x.x.x.x.x.x.x.x.' };
    const rock = { kick: 'X.x.X.x.X.x.X.x.', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const breakdown = { kick: 'X..X..X.....X...', snare: '........X.......', crash: 'x.......x.......' };
    s.drums(0, 4, rock); riff(0, 4, 0.85);
    s.crash(16);
    s.drums(4, 8, blast); chug(4, 8); bassLine(s, 4, 8, ROOT, 'X.x.X.x.X.x.X.x.'); riff(4, 8);
    s.crash(48); s.crash(80, 0.8);
    s.drums(12, 16, rock); chug(12, 16, 0.55); bassLine(s, 12, 16, ROOT, 'X...X...X...X...');
    s.seq('lead', 48, 0.5, CHORUS, 1); s.seq('gtrlead', 80, 0.5, CHORUS, 1);
    // ブレイクダウン
    s.drums(28, 8, breakdown); pattern(s, 'guitar', 28, 8, 'X..X..X.....X...', (b) => PWR[b % 2], { vel: 0.9, len: 0.6 });
    bassLine(s, 28, 8, ROOT, 'X..X..X.....X...');
    s.crash(144);
    s.drums(36, 8, blast); chug(36, 8); bassLine(s, 36, 8, ROOT, 'X.x.X.x.X.x.X.x.'); riff(36, 8, 0.95);
    s.ghost(() => s.seq('lead', 144, 0.5, CHORUS, 0.4));
    // ラストのサビ
    s.crash(176); s.crash(208, 0.8);
    s.drums(44, 16, rock); chug(44, 16, 0.55); bassLine(s, 44, 16, ROOT, 'X...X...X...X...');
    s.seq('gtrlead', 176, 0.5, CHORUS, 1); s.seq('lead', 208, 0.5, CHORUS, 1);
    s.crash(240); s.kick(240); s.guitar(240, ['D2', 'A2', 'D3'], 3, 1); s.bass(240, 'D2', 3);
  },
};

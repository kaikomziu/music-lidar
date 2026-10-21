// SOUTHERN ROCK / 140 BPM: 砂ぼこりの道を走るロック。ギターのリフとシャッフル気味のドラム
import { pattern, bassLine } from './kit.js';

const PWR = ['E2+B2+E3', 'E2+B2+E3', 'A2+E3+A3', 'D2+A2+D3'];
const ROOT = ['E2', 'E2', 'A1', 'D2'];
const RIFF = ['E4 . G4 A4 . B4 . D5', 'E5 . D5 B4 . A4 G4 .', 'A4 . C5 D5 . E5 . G5', 'D5 . E5 F#5 . A5 F#5 .'];
const MEL =
  'B5 - - - E6 - D6 - | B5 - A5 - G5 - E5 - | A5 - - - C6 - B5 - | A5 - F#5 - D5 - - - |' +
  'B5 - D6 - E6 - G6 - | E6 - D6 - B5 - - - | C6 - B5 - A5 - G5 - | E5 - - - - - . . |';

export default {
  id: 'thunder-road',
  urlId: 'g21hdc6jn', // 曲ページのURL (music/g21hdc6jn/)。公開後は変えない
  title: 'Thunder Road',
  artist: 'MUSIC LiDAR',
  genre: 'SOUTHERN ROCK',
  bpm: 140,
  color: '#ff8c3d',
  levels: { easy: 3, normal: 6, hard: 8 },
  preview: 48,
  chart: { hard: { minGap: 0.1, maxNps: 7.5, chordP: 0.42 } },
  compose(s) {
    s.setSwing(1 / 10);
    const riff = (from, bars, vel = 0.85) => { for (let b = from; b < from + bars; b++) s.seq('gtrlead', b * 4, 0.5, RIFF[b % 4], vel); };
    const chug = (from, bars, vel = 0.5) => pattern(s, 'guitar', from, bars, 'X.x.X.x.X.x.X.x.', (b) => PWR[b % 4], { vel, len: 0.35 });
    const rock = { kick: 'X.....x.X.......', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    riff(0, 4, 0.9); s.drums(2, 2, rock);
    s.crash(16);
    s.drums(4, 8, rock); chug(4, 8); bassLine(s, 4, 8, ROOT, 'X.x.X.x.X.x.X.x.'); s.seq('lead', 16, 0.5, MEL, 0.95);
    s.drums(12, 8, rock); riff(12, 8); bassLine(s, 12, 8, ROOT, 'X...X...X...X...');
    s.crash(80); s.crash(112, 0.8);
    s.drums(20, 16, { ...rock, hat: 'xxxxxxxxxxxxxxxx' }); chug(20, 16, 0.55); bassLine(s, 20, 16, ROOT, 'X.x.X.x.X.x.X.x.');
    s.seq('gtrlead', 80, 0.5, MEL, 1); s.seq('lead', 112, 0.5, MEL, 1);
    s.drums(36, 4, rock); riff(36, 4, 1);
    s.crash(160); s.kick(160); s.guitar(160, ['E2', 'B2', 'E3'], 3, 1); s.bass(160, 'E2', 3);
  },
};

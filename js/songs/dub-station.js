// DUB / 140 BPM: 裏で刻むギターと、ワンドロップのドラム。こだまするメロディカ
import { pattern, sustain, bassLine, build } from './kit.js';

const PROG = ['G4+Bb4+D5', 'G4+Bb4+D5', 'C4+Eb4+G4', 'D4+F#4+A4'];
const ROOT = ['G1', 'G1', 'C2', 'D2'];
const MEL =
  'D5 - - - Bb4 - G4 - | A4 - Bb4 - C5 - D5 - | Eb5 - - - D5 - C5 - | D5 - - - . . . . |' +
  'G5 - - F5 D5 - Bb4 - | C5 - D5 - F5 - G5 - | Eb5 - D5 - C5 - Bb4 - | A4 - - - F#4 - - - |';
const ECHO = 'D6 . . D6 . . D6 . | . . . . . . . . | G5 . . G5 . . G5 . | . . . . . . . . |';

export default {
  id: 'dub-station',
  urlId: 'p34060tgd', // 曲ページのURL (music/p34060tgd/)。公開後は変えない
  title: 'Dub Station',
  artist: 'MUSIC LiDAR',
  genre: 'DUB',
  bpm: 140,
  color: '#5cff8f',
  levels: { easy: 2, normal: 4, hard: 7 },
  preview: 64,
  chart: { hard: { minGap: 0.11, maxNps: 7 } },
  compose(s) {
    const skank = (from, bars, vel = 0.5) => pattern(s, 'guitar', from, bars, '..x...x...x...x.', (b) => PROG[b % 4], { vel, len: 0.2 });
    const drop = { kick: '........X.......', snare: '........x.......', hat: 'x.x.x.x.x.x.x.x.' };
    skank(0, 4, 0.6); bassLine(s, 0, 4, ROOT, 'X.......X.......', { vel: 0.8 });
    s.drums(4, 16, drop); skank(4, 16, 0.45); bassLine(s, 4, 16, ROOT, 'X...o..xX.....x.');
    s.seq('square', 16, 0.5, MEL, 0.85); s.seq('lead', 48, 0.5, MEL, 0.9);
    s.drums(20, 4, { kick: '........X.......' }); s.seq('bell', 80, 0.5, ECHO, 0.8); s.ghost(() => sustain(s, 'pad', 20, 4, PROG, 0.4)); build(s, 22);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, { ...drop, hat: 'xxxxxxxxxxxxxxxx', snare: '........x.....x.' }); skank(24, 16, 0.5); bassLine(s, 24, 16, ROOT, 'X...o..xX..o..x.');
    s.seq('keys', 96, 0.5, MEL, 0.95); s.seq('supersaw', 128, 0.5, MEL, 0.95);
    s.drums(40, 8, drop); skank(40, 8, 0.45); bassLine(s, 40, 8, ROOT, 'X...o..xX.....x.'); s.seq('square', 160, 0.5, MEL, 1);
    s.crash(192); s.kick(192); s.guitar(192, ['G4', 'Bb4', 'D5'], 2, 1); s.bass(192, 'G1', 3);
  },
};

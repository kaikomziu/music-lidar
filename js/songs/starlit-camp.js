// CAMPFIRE / 92 BPM: 星空の下のキャンプ。ギターのアルペジオとハーモニカ風のメロディ(初心者向け)
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['G3+B3+D4', 'D4+F#4+A4', 'E4+G4+B4', 'C4+E4+G4'];
const ROOT = ['G1', 'D2', 'E1', 'C2'];
const MEL =
  'D5 - G5 - B5 - - - | A5 - F#5 - D5 - - - | E5 - G5 - B5 - - A5 | G5 - - - E5 - - - |' +
  'D5 - G5 - B5 - D6 - | C#6 - A5 - F#5 - - - | G5 - B5 - E6 - D6 - | G5 - - - - - . . |';

export default {
id: 'starlit-camp',
  urlId: 'uslfxx148', // 曲ページのURL (music/uslfxx148/)。公開後は変えない
  title: 'Starlit Camp',
  artist: 'MUSIC LiDAR',
  genre: 'CAMPFIRE',
  bpm: 92,
  color: '#ffcf5e',
  levels: { easy: 1, normal: 3, hard: 4 },
  preview: 32,
  chart: { easy: { maxNps: 1.4 }, hard: { minGap: 0.14, maxNps: 4.5 } },
  compose(s) {

    const guitar = (from, bars, vel = 0.45) => arp(s, 'pluck', from, bars, PROG, { step: 0.5, vel, order: [0, 2, 1, 3, 2, 1, 2, 3] });
    const camp = { kick: 'X.......X.......', snare: '....g.......g...', hat: '..x...x...x...x.' };
    guitar(0, 4, 0.6);
    s.drums(4, 16, camp); s.ghost(() => guitar(4, 16, 0.35)); bassLine(s, 4, 16, ROOT, 'X.......X.......', { type: 'upright' });
    s.seq('square', 16, 0.5, MEL, 0.85); s.seq('lead', 48, 0.5, MEL, 0.9);
    sustain(s, 'pad', 20, 4, PROG, 0.6); s.seq('bell', 80, 1, 'B5 - - - | A5 - - - | G5 - - - | E5 - - - |', 0.75);
    s.drums(24, 8, { ...camp, snare: '....x.......x...' }); guitar(24, 8, 0.4); bassLine(s, 24, 8, ROOT, 'X...X...X...X...', { type: 'upright' });
    s.seq('square', 96, 0.5, MEL, 0.95);
    s.kick(128); s.pluck(128, 'G4', 3); s.pluck(128, 'B4', 3); s.pluck(128, 'D5', 3); s.upright(128, 'G1', 3);
  },
};

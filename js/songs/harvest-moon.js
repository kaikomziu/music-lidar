// FOLK / 104 BPM: 収穫の月の夜。アコースティックギター風のアルペジオと口笛のようなメロディ
import { sustain, bassLine, arp } from './kit.js';

const PROG = ['E4+G#4+B4', 'C#4+E4+G#4', 'A3+C#4+E4', 'B3+D#4+F#4'];
const ROOT = ['E2', 'C#2', 'A1', 'B1'];
const MEL =
  'B5 - - - G#5 - E5 - | G#5 - - - C#6 - - - | C#6 - B5 - A5 - E5 - | F#5 - - - - - . . |' +
  'B5 - - - E6 - - - | D#6 - C#6 - B5 - G#5 - | A5 - - - C#6 - B5 - | B5 - - - - - . . |';

export default {
  id: 'harvest-moon',
  urlId: 'lncoq91sw', // 曲ページのURL (music/lncoq91sw/)。公開後は変えない
  title: 'Harvest Moon',
  artist: 'MUSIC LiDAR',
  genre: 'FOLK',
  bpm: 104,
  color: '#ffb05e',
  levels: { easy: 2, normal: 4, hard: 6 },
  preview: 48,
  chart: { hard: { minGap: 0.12, maxNps: 5.5 } },
  compose(s) {
    const guitar = (from, bars, vel = 0.45) => arp(s, 'pluck', from, bars, PROG, { step: 0.5, vel, order: [0, 2, 1, 3, 2, 1, 2, 3] });
    const folk = { kick: 'X.......X.......', snare: '....g.......g...', hat: 'x.x.x.x.x.x.x.x.' };
    guitar(0, 4, 0.6);
    s.drums(4, 16, folk); s.ghost(() => guitar(4, 16, 0.35)); bassLine(s, 4, 16, ROOT, 'X.......X...X...', { type: 'upright' });
    s.seq('lead', 16, 0.5, MEL, 0.9); s.seq('bell', 48, 0.5, MEL, 0.9);
    sustain(s, 'pad', 20, 4, PROG, 0.6); guitar(20, 4, 0.6);
    s.crash(96, 0.5);
    s.drums(24, 8, { ...folk, snare: '....x.......x...' }); s.ghost(() => guitar(24, 8, 0.35)); bassLine(s, 24, 8, ROOT, 'X...X...X...X...', { type: 'upright' });
    s.seq('lead', 96, 0.5, MEL, 1); s.ghost(() => s.seq('keys', 96, 0.5, MEL, 0.3));
    s.kick(128); s.pluck(128, 'E4', 3); s.pluck(128, 'G#4', 3); s.pluck(128, 'B4', 3); s.upright(128, 'E2', 3);
  },
};

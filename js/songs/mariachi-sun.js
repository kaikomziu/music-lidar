// MARIACHI / 140 BPM: 太陽のフィエスタ。トランペット風のメロディとギターの刻み
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['G4+B4+D5', 'D4+F#4+A4', 'D4+F#4+A4', 'G4+B4+D5', 'C4+E4+G4', 'G4+B4+D5', 'D4+F#4+A4', 'G4+B4+D5'];
const ROOT = ['G1', 'D2', 'D2', 'G1', 'C2', 'G1', 'D2', 'G1'];
const MEL =
  'D5 - G5 - B5 - - A5 | A5 - - - F#5 - - - | A5 - D6 - C6 - - B5 | B5 - - - G5 - - - |' +
  'C6 - - B5 C6 - E6 - | D6 - - C6 B5 - G5 - | A5 - B5 - C6 - A5 - | G5 - - - - - . . |';

export default {
id: 'mariachi-sun',
  urlId: 'c54s12wcl', // 曲ページのURL (music/c54s12wcl/)。公開後は変えない
  title: 'Mariachi Sun',
  artist: 'MUSIC LiDAR',
  genre: 'MARIACHI',
  bpm: 140,
  color: '#ffb02e',
  levels: { easy: 2, normal: 5, hard: 8 },
  preview: 32,
  chart: { hard: { minGap: 0.1, maxNps: 7, chordP: 0.42 } },
  compose(s) {

    const guit = (from, bars, vel = 0.45) => pattern(s, 'pluck', from, bars, 'X...x.x.X...x.x.', (b) => PROG[b % 8], { vel, len: 0.2 });
    const oom = (from, bars) => bassLine(s, from, bars, ROOT, 'X.......f.......', { type: 'upright' });
    const beat = { kick: 'X.......X.......', snare: '....x.x.....x.x.', hat: 'x.x.x.x.x.x.x.x.' };
    guit(0, 4, 0.6); oom(0, 4);
    s.drums(4, 16, beat); guit(4, 16); oom(4, 16);
    s.seq('stab', 16, 0.5, MEL, 0.9); s.seq('lead', 48, 0.5, MEL, 0.95);
    s.drums(20, 4, { kick: 'X.......X.......', snare: 'x.x.x.x.x.x.x.x.' }); guit(20, 4, 0.7); oom(20, 4);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, { ...beat, hat: 'xxxxxxxxxxxxxxxx' }); guit(24, 16, 0.4); oom(24, 16);
    s.seq('lead', 96, 0.5, MEL, 1); s.seq('square', 128, 0.5, MEL, 1); s.ghost(() => s.seq('stab', 128, 0.5, MEL, 0.35));
    s.crash(160); s.kick(160); s.stab(160, ['G4', 'B4', 'D5', 'G5'], 2, 1); s.upright(160, 'G1', 2);
  },
};

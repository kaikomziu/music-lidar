// POWER METAL / 180 BPM: 水晶の城を攻める勇者。ツーバスとギターのハモり、壮大なサビ
import { pattern, sustain, bassLine } from './kit.js';

const PROG = ['E4+G4+B4', 'C4+E4+G4', 'D4+F#4+A4', 'B3+D#4+F#4'];
const PWR = ['E2+B2+E3', 'C2+G2+C3', 'D2+A2+D3', 'B1+F#2+B2'];
const ROOT = ['E2', 'C2', 'D2', 'B1'];
const HARMONY = [
  'E5 F#5 G5 A5 B5 A5 G5 F#5 G5 A5 B5 C6 D6 C6 B5 A5',
  'C5 D5 E5 F#5 G5 F#5 E5 D5 E5 F#5 G5 A5 B5 A5 G5 E5',
  'D5 E5 F#5 G5 A5 G5 F#5 E5 F#5 G5 A5 B5 C6 B5 A5 F#5',
  'B4 C#5 D#5 E5 F#5 E5 D#5 C#5 D#5 E5 F#5 G5 A5 B5 D#6 F#6',
];
const CHORUS =
  'B5 - - - E6 - - - | G6 - - - E6 - - - | F#6 - - - D6 - A5 - | D#6 - - - B5 - - - |' +
  'E6 - - - G6 - - - | B6 - - - A6 - G6 - | F#6 - E6 - D6 - F#6 - | E6 - - - - - - - |';

export default {
  id: 'crystal-fortress',
  urlId: 'mrdixseuj', // 曲ページのURL (music/mrdixseuj/)。公開後は変えない
  title: 'Crystal Fortress',
  artist: 'MUSIC LiDAR',
  genre: 'POWER METAL',
  bpm: 180,
  color: '#7dd0ff',
  levels: { easy: 3, normal: 8, hard: 12 },
  preview: 96,
  chart: { normal: { minGap: 0.15 }, hard: { minGap: 0.08, maxNps: 10.5, chordP: 0.45 } },
  compose(s) {
    const gtr = (from, bars, vel = 0.5) => pattern(s, 'guitar', from, bars, 'X.x.X.x.X.x.X.x.', (b) => PWR[b % 4], { vel, len: 0.35 });
    const harm = (from, bars, vel = 0.9) => { for (let b = from; b < from + bars; b++) s.seq('gtrlead', b * 4, 0.25, HARMONY[b % 4], vel); };
    const double = { kick: 'XxXxXxXxXxXxXxXx', snare: '....X.......X...', ride: 'x.x.x.x.x.x.x.x.' };
    sustain(s, 'pad', 0, 4, PROG, 0.8); s.seq('bell', 0, 1, 'E6 - B5 - | G5 - - - | A5 - F#5 - | D#6 - - - |', 0.7);
    s.crash(16);
    s.drums(4, 8, double); gtr(4, 8); bassLine(s, 4, 8, ROOT, 'X.x.X.x.X.x.X.x.'); harm(4, 8);
    s.crash(48); s.crash(80, 0.8);
    s.drums(12, 16, double); gtr(12, 16, 0.45); bassLine(s, 12, 16, ROOT, 'X.x.X.x.X.x.X.x.'); sustain(s, 'pad', 12, 16, PROG, 0.4);
    s.seq('supersaw', 48, 0.5, CHORUS + CHORUS, 1);
    s.drums(28, 4, { kick: 'X...X...X...X...', snare: '....X.......X...' }); harm(28, 4, 1);
    s.crash(128);
    s.drums(32, 8, double); gtr(32, 8); bassLine(s, 32, 8, ROOT, 'X.x.X.x.X.x.X.x.'); s.seq('lead', 128, 0.5, CHORUS, 1); s.ghost(() => harm(32, 8, 0.4));
    // ラストのサビ(ハモりつき)
    s.crash(160); s.crash(192, 0.8);
    s.drums(40, 16, double); gtr(40, 16, 0.45); bassLine(s, 40, 16, ROOT, 'X.x.X.x.X.x.X.x.'); sustain(s, 'pad', 40, 16, PROG, 0.4);
    s.seq('supersaw', 160, 0.5, CHORUS + CHORUS, 1); harm(48, 8, 0.85);
    s.crash(224); s.kick(224); s.guitar(224, ['E2', 'B2', 'E3'], 3, 1); s.pad(224, ['E4', 'G4', 'B4', 'E5'], 4, 1); s.bass(224, 'E2', 3);
  },
};

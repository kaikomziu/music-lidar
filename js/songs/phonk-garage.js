// PHONK / 150 BPM: カウベルのメロディと太い808。夜のガレージでドリフト
import { pattern, sustain, bassLine, build } from './kit.js';

const PROG = ['C#4+E4+G#4', 'C#4+E4+G#4', 'A3+C#4+E4', 'B3+D#4+F#4'];
const ROOT = ['C#2', 'C#2', 'A1', 'B1'];
const COW =
  'C#6 . C#6 . E6 . C#6 . G#5 . C#6 . E6 . F#6 . | E6 . C#6 . G#5 . . . C#6 . C#6 . E6 . G#6 . |' +
  'A6 . G#6 . E6 . C#6 . A5 . C#6 . E6 . C#6 . | B5 . D#6 . F#6 . D#6 . B5 . F#6 . D#6 . B5 . |';
const SLOW = 'G#5 - - - E5 - C#5 - | E5 - - - . . . . | A5 - - - G#5 - E5 - | F#5 - - - D#5 - - - |';

export default {
  id: 'phonk-garage',
  urlId: 'isf7kkeoz', // 曲ページのURL (music/isf7kkeoz/)。公開後は変えない
  title: 'Phonk Garage',
  artist: 'MUSIC LiDAR',
  genre: 'PHONK',
  bpm: 150,
  color: '#c04dff',
  levels: { easy: 4, normal: 7, hard: 10 },
  preview: 32,
  chart: { normal: { minGap: 0.15 }, hard: { minGap: 0.09, maxNps: 9, chordP: 0.4 } },
  compose(s) {
    const phonk = { kick: 'X.....X...X.....', clap: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const roll = { ...phonk, hat: 'x.x.x.x.x.xxx.x.xxxxx.x.x.x.xxxx' };
    s.seq('bell', 0, 0.25, COW, 0.75);
    s.drums(4, 3, { clap: '....X.......X...' }); s.seq('bell', 16, 0.25, COW.split('|').slice(0, 3).join('|'), 0.8); build(s, 6, 2);
    s.crash(32);
    s.drums(8, 16, roll); bassLine(s, 8, 16, ROOT, 'X.........X.....', { vel: 1 }); s.seq('bell', 32, 0.25, COW.repeat(4), 0.95);
    sustain(s, 'pad', 24, 8, PROG, 0.6); s.seq('lead', 96, 0.5, SLOW + SLOW, 0.85); s.downer(96, 4); build(s, 30);
    s.crash(128); s.crash(160, 0.8);
    s.drums(32, 16, { ...roll, kick: 'X.....X...X...x.' }); bassLine(s, 32, 16, ROOT, 'X.........X...o.');
    s.seq('bell', 128, 0.25, COW.repeat(4), 1); s.ghost(() => s.seq('supersaw', 128, 0.5, SLOW.repeat(4), 0.4));
    pattern(s, 'stab', 32, 16, 'X.......x.......', (b) => PROG[b % 4], { vel: 0.5, len: 0.5 });
    s.crash(192); s.kick(192); s.bell(192, 'C#6', 2); s.bass(192, 'C#1', 3);
  },
};

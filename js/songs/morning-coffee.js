// ACOUSTIC POP / 100 BPM: ギター風のアルペジオと軽いドラムの、朝っぽいやさしい曲
import { pattern, sustain, bassLine, arp } from './kit.js';

const PROG = ['C4+E4+G4', 'G3+B3+D4', 'A3+C4+E4', 'F3+A3+C4'];
const ROOT = ['C2', 'G1', 'A1', 'F1'];
const VERSE =
  'E5 - D5 C5 D5 - E5 - | D5 - - - B4 - G4 - | C5 - E5 - A5 - G5 - | F5 - E5 - D5 - - - |' +
  'E5 - D5 C5 D5 - E5 - | G5 - - - D5 - B4 - | C5 - D5 - E5 - A4 - | C5 - - - - - . . |';
const CHORUS =
  'G5 - - E5 G5 - A5 - | B5 - A5 - G5 - D5 - | E5 - - C5 E5 - A5 - | A5 - G5 - F5 - - - |' +
  'G5 - - E5 G5 - A5 - | B5 - D6 - B5 - G5 - | A5 - G5 - E5 - D5 - | C5 - - - - - . . |';

export default {
  id: 'morning-coffee',
  urlId: 'yuvtz279e', // 曲ページのURL (music/yuvtz279e/)。公開後は変えない
  title: 'Morning Coffee',
  artist: 'MUSIC LiDAR',
  genre: 'ACOUSTIC POP',
  bpm: 100,
  color: '#ffc98a',
  levels: { easy: 1, normal: 3, hard: 5 },
  preview: 48,
  chart: { easy: { maxNps: 1.5 }, hard: { minGap: 0.14, maxNps: 4.5 } },
  compose(s) {
    const guitar = (from, bars, vel = 0.5) => arp(s, 'pluck', from, bars, PROG, { step: 0.5, vel, order: [0, 1, 2, 3, 2, 1, 2, 3] });
    const beat = { kick: 'X.......X.x.....', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    guitar(0, 4, 0.6);
    s.drums(4, 8, beat); s.ghost(() => guitar(4, 8, 0.35)); bassLine(s, 4, 8, ROOT, 'X.......X...x...');
    s.seq('keys', 16, 0.5, VERSE, 0.9);
    s.crash(48);
    s.drums(12, 8, { ...beat, hat: 'x.xxx.x.x.xxx.x.' }); s.ghost(() => guitar(12, 8, 0.35)); bassLine(s, 12, 8, ROOT, 'X...X...X...X...');
    sustain(s, 'pad', 12, 8, PROG, 0.35);
    s.seq('lead', 48, 0.5, CHORUS, 0.9);
    guitar(20, 4, 0.6);
    s.drums(24, 8, beat); s.ghost(() => guitar(24, 8, 0.35)); bassLine(s, 24, 8, ROOT, 'X.......X...x...');
    s.seq('keys', 96, 0.5, VERSE, 0.95);
    s.crash(128);
    s.drums(32, 8, { ...beat, hat: 'x.xxx.x.x.xxx.x.' }); s.ghost(() => guitar(32, 8, 0.35)); bassLine(s, 32, 8, ROOT, 'X...X...X...X...');
    sustain(s, 'pad', 32, 8, PROG, 0.35);
    s.seq('lead', 128, 0.5, CHORUS, 1);
    s.ghost(() => s.seq('bell', 128, 0.5, CHORUS, 0.3));
    guitar(40, 2, 0.5); s.kick(168); s.pad(168, ['C4', 'E4', 'G4'], 3, 0.6); s.keys(168, 'C5', 3); s.bass(168, 'C2', 3);
  },
};

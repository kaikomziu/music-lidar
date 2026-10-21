// TANGO / 120 BPM: 「ズッ・ズッ・ズン」と刻むタンゴのリズム、アコーディオン風の和音、哀愁のメロディ
import { pattern, bassLine } from './kit.js';

const PROG = ['D4+F4+A4', 'D4+F4+A4', 'C#4+E4+G4+A4', 'D4+F4+A4', 'G4+Bb4+D5', 'D4+F4+A4', 'E4+G4+Bb4+C#5', 'D4+F4+A4'];
const ROOT = ['D2', 'D2', 'A1', 'D2', 'G1', 'D2', 'A1', 'D2'];
const MEL =
  'A5 - - Bb5 A5 - F5 - | D5 - - - . . A4 - | E5 - - F5 E5 - C#5 - | D5 - - - - - . . |' +
  'D6 - - C6 Bb5 - G5 - | A5 - - - F5 - D5 - | E5 - F5 - G5 - Bb5 - | A5 - - - - - . . |';
const TANGO = 'X..X..X.X.......';

export default {
  id: 'tango-noir',
  urlId: 'ge0u1kpu0', // 曲ページのURL (music/ge0u1kpu0/)。公開後は変えない
  title: 'Tango Noir',
  artist: 'MUSIC LiDAR',
  genre: 'TANGO',
  bpm: 120,
  color: '#ff4f4f',
  levels: { easy: 2, normal: 5, hard: 8 },
  preview: 48,
  chart: { hard: { minGap: 0.11, maxNps: 6.5, chordP: 0.45 } },
  compose(s) {
    const acc = (from, bars, vel = 0.45) => pattern(s, 'stab', from, bars, TANGO, (b) => PROG[b % 8], { vel, len: 0.3 });
    const bass = (from, bars) => bassLine(s, from, bars, ROOT, 'X..X..X.X.......', { len: 0.3 });
    const beat = { kick: 'X..X..X.X.......', snare: '........X.......' };
    acc(0, 4, 0.6); bass(0, 4);
    s.drums(4, 8, beat); acc(4, 8); bass(4, 8);
    s.seq('lead', 16, 0.5, MEL, 0.95);
    s.drums(12, 8, { ...beat, hat: 'x.x.x.x.x.x.x.x.' }); s.ghost(() => acc(12, 8, 0.35)); bass(12, 8);
    s.seq('keys', 48, 0.5, MEL, 0.95);
    for (let b = 12; b < 20; b++) s.keys(b * 4 + 3.5, PROG[b % 8].split('+')[0].replace(/\d/, '3'), 0.3, 0.6);
    // ピアノのソロ風(16分のかけあがり)
    s.drums(20, 4, beat); bass(20, 4);
    for (let b = 20; b < 24; b++) s.seq('keys', b * 4 + 2, 0.25, 'D5 E5 F5 G5 A5 Bb5 C#6 D6', 0.85);
    acc(20, 4, 0.5);
    s.crash(96, 0.6);
    s.drums(24, 8, { ...beat, hat: 'x.x.x.x.x.x.x.x.' }); acc(24, 8, 0.4); bass(24, 8);
    s.seq('lead', 96, 0.5, MEL, 1); s.ghost(() => s.seq('keys', 96, 0.5, MEL, 0.35));
    // もう一度、激しく
    s.crash(128);
    s.drums(32, 8, { ...beat, hat: 'xxxxxxxxxxxxxxxx' }); acc(32, 8, 0.5); bass(32, 8);
    s.seq('keys', 128, 0.5, MEL, 1); s.ghost(() => s.seq('lead', 128, 0.5, MEL, 0.4));
    for (let b = 32; b < 40; b += 2) s.seq('keys', b * 4 + 2, 0.25, 'D5 E5 F5 G5 A5 Bb5 C#6 D6', 0.6);
    s.stab(160, ['D4', 'F4', 'A4', 'D5'], 0.3, 1); s.bass(160, 'D2', 0.3); s.kick(160); s.stab(161.5, ['A3', 'D4', 'F4', 'A4'], 1.5, 1); s.bass(161.5, 'D1', 1.5);
  },
};

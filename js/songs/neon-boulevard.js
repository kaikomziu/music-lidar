// FUTURE FUNK / 118 BPM: 80年代シティポップをちょっと早回しにしたような、ネオンの大通り
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['Ab4+C5+Eb5+G5', 'F4+Ab4+C5+Eb5', 'Db4+F4+Ab4+C5', 'Eb4+G4+Bb4+Db5'];
const ROOT = ['Ab1', 'F1', 'Db2', 'Eb2'];
const MEL =
  'Eb6 - C6 - Ab5 - Bb5 C6 | . . C6 - Ab5 - F5 - | Ab5 - - Bb5 C6 - Eb6 - | Db6 - C6 - Bb5 - - - |' +
  'Eb6 - C6 - Ab5 - C6 Eb6 | F6 - Eb6 - C6 - Ab5 - | Bb5 - C6 - Db6 - F6 - | Eb6 - - - - - . . |';

export default {
id: 'neon-boulevard',
  urlId: 'ge4te4utl', // 曲ページのURL (music/ge4te4utl/)。公開後は変えない
  title: 'Neon Boulevard',
  artist: 'MUSIC LiDAR',
  genre: 'FUTURE FUNK',
  bpm: 118,
  color: '#ff7ad9',
  levels: { easy: 3, normal: 5, hard: 9 },
  preview: 64,
  chart: { hard: { minGap: 0.1, maxNps: 7.5 } },
  sidechain: true,
  compose(s) {

    const filt = (from, bars, vel = 0.4) => pattern(s, 'stab', from, bars, 'x.xx.x.xx.x.x.x.', (b) => PROG[b % 4], { vel, len: 0.15 });
    const funk = { kick: 'X...X...X...X...', clap: '....X.......X...', hat: 'x.o.x.o.x.o.x.o.' };
    filt(0, 4, 0.5);
    s.drums(4, 16, funk); filt(4, 16, 0.35); bassLine(s, 4, 16, ROOT, 'X.o.X..oX.o.X..o', { type: 'slap' });
    s.seq('lead', 16, 0.5, MEL, 0.9); s.seq('keys', 48, 0.5, MEL, 0.95);
    s.drums(20, 4, { clap: '....X.......X...' }); sustain(s, 'pad', 20, 4, PROG, 0.6); s.downer(80, 4);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, funk); filt(24, 16, 0.35); bassLine(s, 24, 16, ROOT, 'X.o.X..oX.o.X..o', { type: 'slap' });
    s.seq('supersaw', 96, 0.5, MEL, 0.95); s.seq('lead', 128, 0.5, MEL, 1);
    s.crash(160); s.kick(160); s.stab(160, ['Ab4', 'C5', 'Eb5', 'G5'], 2, 1); s.slap(160, 'Ab2', 1);
  },
};

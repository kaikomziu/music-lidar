// OUTRUN / 160 BPM: 夜のハイウェイを全開で。速いアルペジオとスネアのゲートリバーブ
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['E4+G4+B4', 'C4+E4+G4', 'D4+F#4+A4', 'B3+D#4+F#4'];
const ROOT = ['E1', 'C2', 'D2', 'B1'];
const MEL =
  'B5 - - - E6 - D6 - | C6 - B5 - G5 - - - | A5 - - - D6 - C6 - | B5 - A5 - F#5 - - - |' +
  'B5 - - - G6 - F#6 - | E6 - D6 - C6 - B5 - | A5 - D6 - F#6 - A6 - | G6 - - - F#6 - - - |';

export default {
id: 'synth-racer',
  urlId: 'kr15r0i5j', // 曲ページのURL (music/kr15r0i5j/)。公開後は変えない
  title: 'Synth Racer',
  artist: 'MUSIC LiDAR',
  genre: 'OUTRUN',
  bpm: 160,
  color: '#ff3dd0',
  levels: { easy: 3, normal: 7, hard: 11 },
  preview: 96,
  chart: { normal: { minGap: 0.16 }, hard: { minGap: 0.09, maxNps: 9.5 } },
  sidechain: true,
  compose(s) {

    const arps = (from, bars, vel = 0.6) => arp(s, 'square', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 2, 1, 0, 1], oct: 0 });
    const drive = { kick: 'X...X...X...X...', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    s.ghost(() => arps(0, 4, 0.5)); bassLine(s, 2, 2, ROOT, 'X.X.X.X.X.X.X.X.');
    s.crash(16);
    s.drums(4, 8, drive); arps(4, 8); bassLine(s, 4, 8, ROOT, 'X.X.X.X.X.X.X.X.');
    s.seq('lead', 48, 0.5, MEL, 0.95);
    s.drums(12, 8, drive); s.ghost(() => arps(12, 8, 0.35)); bassLine(s, 12, 8, ROOT, 'X.X.X.X.X.X.X.X.'); sustain(s, 'pad', 12, 8, PROG, 0.35);
    s.downer(80, 4); sustain(s, 'pad', 20, 4, PROG, 0.8); build(s, 22);
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, { ...drive, hat: 'xxxxxxxxxxxxxxxx' }); arps(24, 16, 0.55); bassLine(s, 24, 16, ROOT, 'X.X.X.X.X.X.X.X.');
    s.seq('supersaw', 96, 0.5, MEL, 1); s.seq('lead', 128, 0.5, MEL, 1);
    s.crash(160); s.kick(160); s.supersaw(160, 'E5', 3); s.supersaw(160, 'B5', 3); s.bass(160, 'E1', 2);
  },
};

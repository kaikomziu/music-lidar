// ARABIAN / 110 BPM: 砂漠を渡る風。ハーモニックマイナーの妖しいメロディと、ダラブッカ風のリズム
import { sustain, bassLine, arp } from './kit.js';

const PROG = ['D4+F4+A4', 'D4+F4+A4', 'Eb4+G4+Bb4', 'C#4+E4+A4'];
const ROOT = ['D2', 'D2', 'Eb2', 'A1'];
const MEL =
  'D5 - Eb5 - F#5 - G5 - | A5 - - - G5 F#5 Eb5 - | D5 - Eb5 - D5 - C5 - | D5 - - - . . . . |' +
  'A5 - Bb5 - A5 - G5 - | F#5 - G5 - A5 - - - | G5 - F#5 - Eb5 - C#5 - | D5 - - - - - . . |';

export default {
  id: 'desert-wind',
  urlId: '49u16sw09', // 曲ページのURL (music/49u16sw09/)。公開後は変えない
  title: 'Desert Wind',
  artist: 'MUSIC LiDAR',
  genre: 'ARABIAN',
  bpm: 110,
  color: '#ffb05e',
  levels: { easy: 2, normal: 4, hard: 8 },
  preview: 48,
  chart: { hard: { minGap: 0.12, maxNps: 6.5 } },
  compose(s) {
    const doum = { kick: 'X.....x.X.......', snare: '...x.......x.x..', hat: 'x.xxx.x.x.xxx.x.' };
    const oud = (from, bars, vel = 0.5) => arp(s, 'pluck', from, bars, ['D4+Eb4+F#4+A4', 'D4+Eb4+F#4+A4', 'Eb4+G4+Bb4+D5', 'C#4+E4+G4+A4'], { step: 0.25, vel, order: [0, 1, 2, 1, 3, 2, 1, 0] });
    sustain(s, 'pad', 0, 4, PROG, 0.6); s.seq('lead', 0, 0.5, 'D5 - - - Eb5 - - - | F#5 - - - - - - - | G5 - - - F#5 - Eb5 - | D5 - - - - - - - |', 0.8);
    s.drums(4, 8, doum); oud(4, 8); bassLine(s, 4, 8, ROOT, 'X.....X.X.......');
    s.seq('lead', 16, 0.5, MEL, 0.95);
    s.drums(12, 8, { ...doum, hat: 'xxxxxxxxxxxxxxxx' }); s.ghost(() => oud(12, 8, 0.35)); bassLine(s, 12, 8, ROOT, 'X.....X.X.......');
    s.seq('square', 48, 0.5, MEL, 0.95); sustain(s, 'pad', 12, 8, PROG, 0.35);
    s.drums(20, 4, { snare: 'x..x..x.x..x..x.', kick: 'X.......X.......' }); oud(20, 4, 0.7);
    s.crash(96);
    s.drums(24, 8, { ...doum, hat: 'xxxxxxxxxxxxxxxx' }); oud(24, 8, 0.4); bassLine(s, 24, 8, ROOT, 'X.....X.X.......');
    s.seq('lead', 96, 0.5, MEL, 1); s.ghost(() => s.seq('bell', 96, 0.5, MEL, 0.3));
    s.kick(128); s.crash(128, 0.6); s.pad(128, ['D4', 'F#4', 'A4'], 3, 0.7); s.lead(128, 'D5', 3); s.bass(128, 'D2', 3);
  },
};

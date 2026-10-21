// PIANO / 100 BPM: ピアノだけの雨の曲。左手のアルペジオと、右手のしずくのようなメロディ
import { arp } from './kit.js';

const PROG = ['E3+B3+E4+G4', 'C3+G3+C4+E4', 'G3+D4+G4+B4', 'D3+A3+D4+F#4', 'A2+E3+A3+C4', 'C3+G3+C4+E4', 'B2+F#3+B3+D#4', 'E3+B3+E4+G4'];
const MEL =
  'B5 - - - G5 - E5 - | E5 - - - G5 - C6 - | B5 - - - D6 - - - | A5 - - - F#5 - - - |' +
  'C6 - - - B5 - A5 - | G5 - - - E5 - C6 - | B5 - - - D#6 - F#6 - | E6 - - - - - - - |';

export default {
  id: 'piano-rain',
  urlId: 'i11bpuwio', // 曲ページのURL (music/i11bpuwio/)。公開後は変えない
  title: 'Piano Rain',
  artist: 'MUSIC LiDAR',
  genre: 'PIANO',
  bpm: 100,
  color: '#d0e4ff',
  levels: { easy: 1, normal: 3, hard: 4 },
  preview: 32,
  chart: { easy: { maxNps: 1.4 }, normal: { maxNps: 2.6 }, hard: { minGap: 0.13, maxNps: 5 } },
  compose(s) {
    const left = (from, bars, vel = 0.45) => arp(s, 'keys', from, bars, PROG, { step: 0.5, vel, order: [0, 1, 2, 3, 2, 1, 2, 3], len: 0.9 });
    s.ghost(() => left(0, 4, 0.5));
    s.ghost(() => left(4, 8)); s.seq('keys', 16, 0.5, MEL, 0.95);
    left(12, 8, 0.4); s.seq('keys', 48, 0.5, MEL.replace(/(\w#?)5/g, '$15').replace(/ - - - \|/g, ' . . . |'), 0.95);
    // 雨だれ(高い音の16分)
    for (let b = 20; b < 24; b++) s.seq('keys', b * 4, 0.25, 'E6 B5 G5 B5 E6 B5 G5 B5 C6 G5 E5 G5 C6 G5 E5 G5', 0.6);
    s.ghost(() => left(20, 4, 0.35));
    s.ghost(() => left(24, 8, 0.45)); s.seq('keys', 96, 0.5, MEL, 1);
    s.keys(128, 'E3', 4, 0.6); s.keys(128, 'B3', 4, 0.6); s.keys(128, 'G4', 4, 0.6); s.keys(128, 'E5', 4, 0.8);
  },
};

// VAPORWAVE / 78 BPM: ゆらゆらのエレピ、ぼやけたパッド、遅いビート(いちばんやさしい曲のひとつ)
const CH = ['E3+G#3+B3+D#4', 'C#3+E3+G#3+B3', 'A2+C#3+E3+G#3', 'B2+D#3+F#3+A3'];
const ROOT = ['E2', 'C#2', 'A1', 'B1'];
const MEL =
  'B4 - - - G#4 - - - | E5 - - - D#5 - C#5 - | C#5 - - - - - . . | B4 - - - F#4 - - - |' +
  'G#4 - - - B4 - - - | E5 - - - F#5 - G#5 - | E5 - - - - - . . | D#5 - - - - - . . |';

export default {
  id: 'plaza-1995',
  urlId: '1c1jgezsz', // 曲ページのURL (music/1c1jgezsz/)。公開後は変えない
  title: 'Plaza 1995',
  artist: 'MUSIC LiDAR',
  genre: 'VAPORWAVE',
  bpm: 78,
  color: '#a6f0ff',
  levels: { easy: 1, normal: 2, hard: 4 },
  preview: 16,
  chart: { easy: { maxNps: 1.3 }, normal: { maxNps: 2.2, minGap: 0.3 }, hard: { minGap: 0.2, maxNps: 3.6 } },
  compose(s) {
    const keys = (from, bars, vel = 0.55) => { for (let b = from; b < from + bars; b++) CH[b % 4].split('+').forEach((n) => { s.keys(b * 4, n, 2.5, vel); s.keys(b * 4 + 3, n, 1, vel * 0.7); }); };
    const pads = (from, bars, vel = 0.5) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, CH[b % 4].split('+').map((n) => n.replace(/\d/, (d) => +d + 1)), 4, vel); };
    const bass = (from, bars) => { for (let b = from; b < from + bars; b++) { s.bass(b * 4, ROOT[b % 4], 1.8); s.bass(b * 4 + 2.5, ROOT[b % 4], 1.2, 0.8); } };
    const beat = { kick: 'X.......X.x.....', snare: '....X.......X...', hat: '..x...x...x...x.' };

    // intro
    pads(0, 4, 0.6); keys(0, 4, 0.5);
    // A
    s.drums(4, 8, beat); keys(4, 8); bass(4, 8);
    s.seq('bell', 16, 0.5, MEL, 0.85);
    // B: パッドだけでふわっと
    pads(12, 4, 0.7); bass(12, 4);
    s.seq('keys', 48, 1, 'G#5 - - - | E5 - - - | C#5 - - - | D#5 - - - |', 0.8);
    s.drums(15, 1, { snare: '........x.x.x.x.' });
    // A'
    s.drums(16, 8, { ...beat, hat: 'x.x.x.x.x.x.x.x.' }); keys(16, 8, 0.5); bass(16, 8); pads(16, 8, 0.3);
    s.seq('square', 64, 0.5, MEL, 0.85);
    s.ghost(() => s.seq('bell', 64, 0.5, MEL, 0.3));
    // outro
    pads(24, 3, 0.6); keys(24, 2, 0.4);
    s.bell(104, 'E5', 4, 0.7); s.bass(104, 'E2', 3);
  },
};

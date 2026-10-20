// FUTURE BASS / 150 BPM: ハーフテンポのビートに、うねるスーパーソウの和音とキラキラのチョップ
const CHORDS = ['F4+A4+C5+E5', 'G4+B4+D5', 'E4+G4+B4+D5', 'A4+C5+E5'];
const ROOT = ['F1', 'G1', 'E1', 'A1'];
const SAW_PAT = 'X..X..X...X..X..'; // 和音を刻むリズム(フューチャーベースらしいシンコペーション)
const VERSE =
  'E5 - - - G5 - A5 - | B5 - - - D5 - - - | E5 - G5 - B5 - D6 - | C6 - - - - - . . |' +
  'A5 - - - G5 - E5 - | D5 - - - G5 - B5 - | B5 - - - A5 - G5 - | E5 - - - - - . . |';
const DROP =
  'C6 . A5 C6 . E6 D6 C6 | D6 - B5 - G5 . D6 . | B5 . G5 B5 . D6 E6 D6 | C6 - - - A5 - E5 - |' +
  'C6 . A5 C6 . E6 D6 C6 | D6 - B5 - G5 . G6 . | E6 . D6 B5 . G5 A5 B5 | A5 - - - - - . . |';

export default {
  id: 'sky-prism',
  urlId: 'qjz4vniy2', // 曲ページのURL (music/qjz4vniy2/)。公開後は変えない
  title: 'Sky Prism',
  artist: 'MUSIC LiDAR',
  genre: 'FUTURE BASS',
  bpm: 150,
  color: '#ff9df0',
  levels: { easy: 3, normal: 7, hard: 11 },
  preview: 112,
  sidechain: true,
  chart: { normal: { minGap: 0.17 }, hard: { minGap: 0.095, maxNps: 8.5, chordP: 0.42 } },
  compose(s) {
    const saws = (from, bars, vel = 0.5) => {
      for (let b = from; b < from + bars; b++) {
        const c = CHORDS[b % 4].split('+');
        [...SAW_PAT].forEach((ch, i) => {
          if (ch === '.') return;
          const len = SAW_PAT.slice(i + 1).search(/X/);
          c.forEach((n) => s.supersaw(b * 4 + i / 4, n, ((len < 0 ? 16 - i : len + 1) / 4) * 0.85, vel));
        });
      }
    };
    const pads = (from, bars, vel = 0.7) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, CHORDS[b % 4].split('+'), 4, vel); };
    const bass = (from, bars) => { for (let b = from; b < from + bars; b++) { s.reese(b * 4, ROOT[b % 4], 1.6, 1); s.reese(b * 4 + 2.5, ROOT[b % 4], 1.4, 0.85); } };
    const half = { kick: 'X.........X.....', snare: '........X.......', hat: 'x.x.x.x.x.x.x.x.' };
    const halfBusy = { kick: 'X.........X..x..', snare: '........X......g', hat: 'x.xxx.x.x.xxx.xo' };
    const build = (bar) => {
      s.drums(bar, 2, { snare: 'x...x...x...x...', kick: 'x...x...x...x...' });
      s.drums(bar + 2, 1, { snare: 'x.x.x.x.x.x.x.x.' });
      s.drums(bar + 3, 1, { snare: 'xxxxxxxxxxxxxxxx' });
      s.riser(bar * 4, 16, 0.8);
    };

    // intro
    pads(0, 4, 0.8);
    s.ghost(() => s.seq('pluck', 0, 0.25, 'E5 G5 C6 E6 C6 G5 E5 C5 '.repeat(8), 0.4));
    // verse
    s.drums(4, 8, { kick: 'X.........X.....', hat: '..x...x...x...x.', snare: '........x.......' });
    pads(4, 8, 0.55); bass(4, 8);
    s.seq('bell', 16, 0.5, VERSE, 0.9);
    // build
    pads(12, 4, 0.6); build(12);
    s.seq('pluck', 48, 0.5, 'E5 G5 A5 B5 C6 B5 A5 G5 | G5 A5 B5 D6 E6 D6 B5 A5 |', 0.7);
    // drop 1
    s.crash(64);
    s.drums(16, 8, half); saws(16, 8); bass(16, 8);
    s.seq('pluck', 64, 0.5, DROP, 1);
    // verse 2
    s.downer(96, 4);
    s.drums(24, 8, { kick: 'X.........X.....', hat: 'x...x...x...x...', snare: '........x.......' });
    pads(24, 8, 0.6); bass(24, 8);
    s.seq('bell', 96, 0.5, VERSE, 0.95);
    // build 2
    pads(32, 4, 0.6); build(32);
    s.seq('pluck', 128, 0.25, 'E5 G5 A5 B5 C6 B5 A5 G5 '.repeat(4) + 'G5 A5 B5 D6 E6 D6 B5 A5 '.repeat(4), 0.75);
    // drop 2(2周)
    s.crash(144); s.crash(176, 0.8);
    s.drums(36, 16, halfBusy); saws(36, 16, 0.55); bass(36, 16);
    s.seq('pluck', 144, 0.5, DROP, 1);
    s.seq('pluck', 176, 0.5, DROP, 1);
    s.ghost(() => s.seq('bell', 176, 0.5, DROP, 0.35));
    // outro
    s.crash(208, 0.7);
    pads(52, 3, 0.7);
    s.seq('bell', 208, 0.5, 'C6 . A5 C6 . E6 D6 C6 | D6 - B5 - G5 - - - | A5 - - - - - - - |', 0.7);
  },
};

// SHMUP CHIPTUNE / 210 BPM(鬼畜): 弾幕シューティングのボス戦。8bitの高速アルペジオ
const PROG = ['A4+C5+E5', 'F4+A4+C5', 'G4+B4+D5', 'E4+G#4+B4'];
const ROOT = ['A1', 'F1', 'G1', 'E1'];
const THEME =
  'A5 - C6 - E6 - A6 - | G6 - F6 - E6 - C6 - | D6 - B5 - G5 - D6 - | E6 - G#6 - B6 - - - |' +
  'A6 - E6 - C6 - A5 - | F6 - E6 - C6 - A5 - | G5 - B5 - D6 - G6 - | G#6 - - - E6 - - - |';

export default {
  id: 'bullet-hell-404',
  urlId: '5xsee8tl0', // 曲ページのURL (music/5xsee8tl0/)。公開後は変えない
  title: 'Bullet Hell 404',
  artist: 'MUSIC LiDAR',
  genre: 'CHIPTUNE',
  bpm: 210,
  color: '#3dffb0',
  levels: { easy: 5, normal: 10, hard: 14 },
  preview: 96,
  chart: {
    easy: { minGap: 0.27, maxNps: 3.3 },
    normal: { minGap: 0.12, maxNps: 7.2, chordP: 0.3 },
    hard: { minGap: 0.066, maxNps: 13.5, minScore: 0.45, chordP: 0.45, chordMax: 3, sameGap: 0.066 },
  },
  compose(s) {
    const arps = (from, bars, vel = 0.8, duty = 0.125) => {
      for (let b = from; b < from + bars; b++) { const c = PROG[b % 4].split('+'); for (let i = 0; i < 16; i++) s.chip(b * 4 + i / 4, c[(i + (i >> 2)) % 3].replace(/\d/, (d) => +d + (i % 8 >= 4 ? 1 : 0)), 0.18, vel * (i % 4 ? 0.8 : 1), duty); }
    };
    const bass = (from, bars) => { for (let b = from; b < from + bars; b++) for (let i = 0; i < 8; i++) s.chipbass(b * 4 + i / 2, i % 2 ? ROOT[b % 4].replace(/\d/, (d) => +d + 1) : ROOT[b % 4], 0.35, 1); };
    const beat = { chipkick: 'X.x.X.x.X.x.X.x.', chipsnare: '....X.......X..x', chiphat: 'xxxxxxxxxxxxxxxx' };
    s.ghost(() => arps(0, 4, 0.5)); s.drums(2, 2, { chiphat: 'xxxxxxxxxxxxxxxx' });
    s.drums(4, 16, beat); bass(4, 16); arps(4, 8);
    s.seq('chip', 48, 0.5, THEME, 1); s.ghost(() => arps(12, 8, 0.35));
    s.drums(20, 4, { chipkick: 'X...X...X...X...', chipsnare: 'x.x.x.x.xxxxxxxx' }); arps(20, 4, 0.9, 0.25);
    s.drums(24, 16, beat); bass(24, 16);
    s.seq('chip', 96, 0.5, THEME + THEME, 1); arps(24, 16, 0.6);
    s.drums(40, 8, { chipkick: 'XXXXXXXXXXXXXXXX', chipsnare: '....X.......X...', chiphat: 'xxxxxxxxxxxxxxxx' }); bass(40, 8);
    for (let b = 40; b < 48; b++) s.seq('square', b * 4, 0.25, 'A5 C6 E6 A6 E6 C6 A5 E5 F5 A5 C6 F6 G6 B6 G#6 E6', 0.9);
    // ラスト: テーマをもう一度
    s.drums(48, 16, beat); bass(48, 16);
    s.seq('chip', 192, 0.5, THEME + THEME, 1); arps(48, 16, 0.55);
    s.chipkick(256); s.chip(256, 'A6', 2, 1); s.chipbass(256, 'A1', 2);
  },
};

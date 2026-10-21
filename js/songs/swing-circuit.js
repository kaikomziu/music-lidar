// ELECTRO SWING / 124 BPM: 4つ打ちキックに、ハネるウッドベースとブラスのスタブ、クラリネット風リード
const PROG = ['Am', 'E7', 'Dm', 'Am', 'Dm', 'Am', 'E7', 'Am'];
const CH = { Am: 'A3+C4+E4', E7: 'G#3+B3+D4', Dm: 'A3+D4+F4' };
const WALK = { Am: ['A2', 'C3', 'E3', 'C3'], E7: ['E2', 'G#2', 'B2', 'D3'], Dm: ['D2', 'F2', 'A2', 'F2'] };
const MEL =
  'E5 - A5 - C6 - B5 A5 | G#5 - B5 - - - E5 - | F5 - A5 - D6 - C6 B5 | A5 - - - . . . . |' +
  'D6 - C6 - A5 - F5 - | E5 - A5 - C6 - E6 - | D6 - B5 - G#5 - B5 - | A5 - - - - - . . |';
const BRASS = 'x..x..x.....x...';

export default {
  id: 'swing-circuit',
  urlId: 'kyj30ytjt', // 曲ページのURL (music/kyj30ytjt/)。公開後は変えない
  title: 'Swing Circuit',
  artist: 'MUSIC LiDAR',
  genre: 'ELECTRO SWING',
  bpm: 124,
  color: '#ffb84f',
  levels: { easy: 3, normal: 5, hard: 8 },
  preview: 48,
  sidechain: true,
  chart: { normal: { minScore: 1.6 }, hard: { minGap: 0.1, maxNps: 7, minScore: 0.6 } },
  compose(s) {
    s.setSwing(1 / 6);
    const walk = (from, bars) => { for (let b = from; b < from + bars; b++) WALK[PROG[b % 8]].forEach((n, i) => s.upright(b * 4 + i, n, 0.8, i === 0 ? 1 : 0.85)); };
    const piano = (from, bars, vel = 0.5) => { for (let b = from; b < from + bars; b++) [1, 3].forEach((o) => CH[PROG[b % 8]].split('+').forEach((n) => s.keys(b * 4 + o, n, 0.3, vel))); };
    const brass = (from, bars, vel = 0.55) => {
      for (let b = from; b < from + bars; b++) [...BRASS].forEach((c, i) => { if (c === 'x') s.stab(b * 4 + i / 4, CH[PROG[b % 8]].split('+').map((n) => n.replace(/\d/, (d) => +d + 1)), 0.3, vel); });
    };
    const four = { kick: 'X...X...X...X...', clap: '....X.......X...', hat: '..x...x...x...x.' };
    const fourBusy = { kick: 'X...X...X...X...', clap: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.', ride: '..x...x...x...x.' };

    // intro: ピアノとベース(古いレコード風)
    piano(0, 4, 0.6); walk(0, 4);
    // A
    s.crash(16);
    s.drums(4, 8, four); walk(4, 8); s.ghost(() => piano(4, 8, 0.4));
    s.seq('square', 16, 0.5, MEL, 0.9);
    // B: ブラス
    s.crash(48);
    s.drums(12, 8, fourBusy); walk(12, 8); brass(12, 8);
    s.ghost(() => s.seq('lead', 48, 0.5, MEL, 0.4));
    // break: ベースとクラップ
    s.drums(20, 4, { clap: '....X.......X...' }); walk(20, 4);
    s.seq('keys', 80, 0.5, 'E5 - - - A5 - - - | G#5 - - - E5 - - - | F5 - - - D5 - - - | E5 - - - - - . . |', 0.9);
    s.riser(88, 8, 0.6);
    // A + B 全部
    s.crash(96); s.crash(128, 0.8);
    s.drums(24, 16, fourBusy); walk(24, 16); brass(24, 16, 0.45);
    s.seq('lead', 96, 0.5, MEL, 1);
    s.seq('square', 128, 0.5, MEL, 1);
    // outro
    s.drums(40, 2, four); walk(40, 2);
    s.kick(168); s.crash(168); s.stab(168, ['A4', 'C5', 'E5', 'G5'], 2, 0.9); s.upright(168, 'A2', 2);
  },
};

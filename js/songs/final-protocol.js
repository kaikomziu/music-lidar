// BOSS BATTLE / 200 BPM: ラスボス戦。歪んだギターと16分の速弾き、譜面停止・急な変速つき
const PROG = ['Em', 'C', 'D', 'B'];
const PWR = { Em: 'E2+B2+E3', C: 'C2+G2+C3', D: 'D2+A2+D3', B: 'B1+F#2+B2' };
const ROOT = { Em: 'E1', C: 'C2', D: 'D2', B: 'B1' };
const RUN = {
  Em: 'E5 F#5 G5 B5 E6 B5 G5 F#5 E5 F#5 G5 B5 E6 F#6 G6 E6',
  C: 'C5 E5 G5 C6 E6 C6 G5 E5 C5 E5 G5 C6 E6 G6 E6 C6',
  D: 'D5 F#5 A5 D6 F#6 D6 A5 F#5 D5 F#5 A5 D6 F#6 A6 F#6 D6',
  B: 'B4 D#5 F#5 B5 D#6 B5 F#5 D#5 B4 C5 D#5 F#5 A5 B5 C6 D#6',
};
const THEME =
  'E5 - - - B5 - - - | C6 - B5 - A5 - G5 - | F#5 - - - A5 - - - | D#6 - - - B5 - - - |' +
  'E6 - - - D6 - C6 - | B5 - - - G5 - E5 - | A5 - - - F#5 - D6 - | D#6 - - - - - - - |';

export default {
  id: 'final-protocol',
  urlId: '2uqkfeajn', // 曲ページのURL (music/2uqkfeajn/)。公開後は変えない
  title: 'Final Protocol',
  artist: 'MUSIC LiDAR',
  genre: 'BOSS BATTLE',
  bpm: 200,
  color: '#ff3060',
  levels: { easy: 4, normal: 9, hard: 13 },
  preview: 160,
  chart: {
    easy: { maxNps: 3.2 },
    normal: { minGap: 0.13, maxNps: 8, minScore: 1.8 },
    hard: { minGap: 0.074, maxNps: 12, chordP: 0.45, minScore: 0.7 },
  },
  // 停止・変速(拍で指定)。曲の展開に合わせて止めたり速くしたりする
  gimmicks: [
    { beat: 30, type: 'stop', beats: 2 },
    { beat: 64, type: 'speed', to: 0.6, beats: 0 },
    { beat: 96, type: 'speed', to: 1.6, beats: 0 },
    { beat: 112, type: 'speed', to: 1, beats: 4 },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ beat: 128 + i * 4 + 3, type: 'stop', beats: 1 })),
    { beat: 160, type: 'cover', to: 0.35, beats: 2 },
    { beat: 222, type: 'cover', to: 0, beats: 2 },
    { beat: 224, type: 'stop', beats: 4 },
    { beat: 228, type: 'speed', to: 1.8, beats: 16 },
  ],
  compose(s) {
    const gtr = (from, bars, vel = 0.65) => { for (let b = from; b < from + bars; b++) for (let i = 0; i < 8; i++) s.guitar(b * 4 + i / 2, PWR[PROG[b % 4]].split('+'), 0.4, vel); };
    const bass = (from, bars) => { for (let b = from; b < from + bars; b++) for (let i = 0; i < 8; i++) s.bass(b * 4 + i / 2, ROOT[PROG[b % 4]], 0.4, i % 2 ? 0.8 : 1); };
    const runs = (from, bars, vel = 0.9, type = 'gtrlead') => { for (let b = from; b < from + bars; b++) s.seq(type, b * 4, 0.25, RUN[PROG[b % 4]], vel); };
    const rock = { kick: 'X.x.X.x.X.x.X.x.', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const blast = { kick: 'XxXxXxXxXxXxXxXx', snare: '..x...x...x...x.', crash: 'x...............' };

    // intro: 警報のようなパッドと太鼓(beat 30 で譜面が止まる)
    for (let b = 0; b < 8; b++) s.pad(b * 4, ['E3', 'G3', 'B3', 'D#4'], 4, 0.6);
    s.drums(0, 7, { kick: 'X.......X.......', snare: '............X...' });
    s.drums(7, 1, { snare: 'x.x.x.xx........' });
    // A: テーマ(beat 32〜)
    s.crash(32);
    s.drums(8, 8, rock); gtr(8, 8); bass(8, 8);
    s.seq('gtrlead', 32, 0.5, THEME, 1);
    // B: スロー(譜面 0.6倍)
    s.crash(64);
    for (let b = 16; b < 24; b++) s.pad(b * 4, PWR[PROG[b % 4]].split('+').map((n) => n.replace(/\d/, (d) => +d + 2)), 4, 0.8);
    s.drums(16, 8, { kick: 'X.......X.......', snare: '........X.......', ride: 'x...x...x...x...' });
    s.seq('bell', 64, 1, 'E5 - B5 - | C6 - - - | A5 - F#5 - | D#6 - - - | E6 - D6 - | B5 - G5 - | A5 - D6 - | D#6 - - - |', 0.9);
    // C: 速弾き(譜面 1.6倍)
    s.crash(96);
    s.drums(24, 4, blast); bass(24, 4); runs(24, 4);
    s.riser(112, 16, 0.8);
    s.drums(28, 4, rock); gtr(28, 4); bass(28, 4);
    s.seq('gtrlead', 112, 0.5, THEME.split('|').slice(0, 4).join('|'), 1);
    // D: ストップ&ゴー(4拍ごとに最後の1拍で止まる)
    s.crash(128);
    s.drums(32, 8, rock); bass(32, 8);
    for (let b = 32; b < 40; b++) [0, 0.5, 1, 1.5, 2, 2.5].forEach((o) => s.guitar(b * 4 + o, PWR[PROG[b % 4]].split('+'), 0.4, 0.7));
    s.seq('square', 128, 0.5, THEME, 1);
    // E: 隠し + 速弾き
    s.crash(160); s.crash(192, 0.8);
    s.drums(40, 16, blast); gtr(40, 16, 0.5); bass(40, 16);
    runs(40, 8, 0.95);
    s.seq('gtrlead', 192, 0.5, THEME, 1);
    s.ghost(() => runs(48, 8, 0.4, 'lead'));
    // F: 止まってから加速して終わる
    s.crash(224, 0.6);
    s.drums(57, 7, rock); gtr(57, 7, 0.6); bass(57, 7);
    runs(57, 6, 1, 'lead');
    s.crash(256); s.kick(256); s.guitar(256, ['E2', 'B2', 'E3'], 3, 1); s.bass(256, 'E1', 3);
  },
};

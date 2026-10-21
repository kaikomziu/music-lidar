// JAZZ FUSION / 230 BPM(鬼畜): 超高速のジャズ。ウォーキングベースとエレピの速弾きアドリブ
const PROG = ['D4+F4+A4+C5', 'G3+B3+D4+F4', 'C4+E4+G4+B4', 'A3+C#4+E4+G4'];
const WALK = [['D2', 'E2', 'F2', 'A2'], ['G2', 'F2', 'D2', 'B1'], ['C2', 'E2', 'G2', 'Bb2'], ['A1', 'C#2', 'E2', 'G2']];
// 1小節8分×2(=16分の速弾き)
const RUNS = [
  'D5 E5 F5 A5 C6 A5 F5 E5 D5 F5 A5 C6 E6 D6 C6 A5',
  'G5 F5 D5 B4 G4 B4 D5 F5 A5 G5 F5 D5 B4 D5 F5 G5',
  'C5 E5 G5 B5 C6 B5 G5 E5 D5 E5 G5 B5 D6 C6 B5 G5',
  'A5 G5 E5 C#5 A4 C#5 E5 G5 Bb5 A5 G5 E5 C#5 E5 G5 A5',
];
const HEAD =
  'A5 - C6 - D6 - F6 - | E6 - D6 - B5 - G5 - | G5 - B5 - C6 - E6 - | E6 - C#6 - A5 - G5 - |';

export default {
  id: 'jackhammer-jazz',
  urlId: 'nwymwm8rk', // 曲ページのURL (music/nwymwm8rk/)。公開後は変えない
  title: 'Jackhammer Jazz',
  artist: 'MUSIC LiDAR',
  genre: 'JAZZ FUSION',
  bpm: 230,
  color: '#ffa05e',
  levels: { easy: 5, normal: 10, hard: 14 },
  preview: 64,
  chart: {
    easy: { minGap: 0.28, maxNps: 3.3 },
    normal: { minGap: 0.13, maxNps: 7, chordP: 0.25 },
    hard: { minGap: 0.064, maxNps: 13.5, minScore: 0.5, chordP: 0.4, chordMax: 3, sameGap: 0.064 },
  },
  compose(s) {
    const walk = (from, bars) => { for (let b = from; b < from + bars; b++) WALK[b % 4].forEach((n, i) => s.upright(b * 4 + i, n, 0.8, i === 0 ? 1 : 0.85)); };
    const comp = (from, bars, vel = 0.4) => { for (let b = from; b < from + bars; b++) [0, 1.5, 2.5].forEach((o) => PROG[b % 4].split('+').forEach((n) => s.keys(b * 4 + o, n, 0.3, vel))); };
    const runs = (from, bars, type = 'keys', vel = 0.95) => { for (let b = from; b < from + bars; b++) s.seq(type, b * 4, 0.25, RUNS[b % 4], vel); };
    const fusion = { ride: 'x.x.x.x.x.x.x.x.', kick: 'X.....x...X.....', snare: '....X..g.g..X..g', hat: '..x...x...x...x.' };
    comp(0, 4, 0.55); walk(0, 4); s.drums(0, 4, { ride: 'x.x.x.x.x.x.x.x.' });
    s.crash(16);
    s.drums(4, 16, fusion); walk(4, 16); s.ghost(() => comp(4, 16));
    s.seq('keys', 16, 0.5, HEAD.repeat(2), 1); runs(12, 8);
    s.crash(80);
    s.drums(20, 16, { ...fusion, kick: 'X..x..x...X..x..' }); walk(20, 16); s.ghost(() => comp(20, 16, 0.35));
    runs(20, 8, 'lead', 0.9); runs(28, 8, 'gtrlead', 0.95);
    s.crash(144);
    s.drums(36, 16, fusion); walk(36, 16); comp(36, 8, 0.4);
    s.seq('keys', 144, 0.5, HEAD.repeat(2), 1); runs(44, 8, 'keys', 1);
    // ソロまわし(エレピ → ギター → ユニゾン)
    s.crash(208);
    s.drums(52, 16, { ...fusion, kick: 'X..x..x...X..x..' }); walk(52, 16);
    runs(52, 4, 'keys', 1); runs(56, 4, 'gtrlead', 1); runs(60, 8, 'lead', 1); s.ghost(() => runs(60, 8, 'keys', 0.4));
    s.crash(272); s.kick(272); ['D4', 'F4', 'A4', 'C5', 'E5'].forEach((n) => s.keys(272, n, 3, 0.8)); s.upright(272, 'D2', 3);
  },
};

// BOSSA NOVA / 128 BPM: ナイロンギター風の刻みと、ゆるく歩くベース、エレピの歌メロ
const CH = ['F3+A3+C4+E4', 'F3+B3+D4', 'E3+G3+B3+D4', 'G3+C#4+E4'];
const ROOT = ['D2', 'G2', 'C2', 'A1'];
const FIFTH = ['A1', 'D2', 'G1', 'E2'];
const COMP = 'x..x..x...x..x..'; // ボサノバのギターのリズム
const MEL =
  'A5 - - G5 F5 - E5 - | D5 - - - B4 - - . | E5 - G5 - B5 - - A5 | G5 - - - E5 - C#5 - |' +
  'A5 - - G5 F5 - A5 - | B5 - - - G5 - - . | C6 - B5 - G5 - E5 - | E5 - - - - - . . |';
const MEL2 =
  'F5 - E5 - F5 - A5 - | G5 - F5 - D5 - B4 - | C5 - D5 - E5 - G5 - | E5 - - - C#5 - - - |' +
  'D5 - E5 - F5 - A5 - | B5 - A5 - G5 - F5 - | E5 - D5 - C5 - B4 - | D5 - - - - - . . |';

export default {
  id: 'sunset-bossa',
  urlId: 'pq9gik7n0', // 曲ページのURL (music/pq9gik7n0/)。公開後は変えない
  title: 'Sunset Bossa',
  artist: 'MUSIC LiDAR',
  genre: 'BOSSA NOVA',
  bpm: 128,
  color: '#ffcf5e',
  levels: { easy: 2, normal: 5, hard: 7 },
  preview: 48,
  chart: { easy: { maxNps: 1.7 }, normal: { minGap: 0.2 }, hard: { minGap: 0.12, maxNps: 6.5 } },
  compose(s) {
    const comp = (from, bars, vel = 0.5) => {
      for (let b = from; b < from + bars; b++) {
        const c = CH[b % 4].split('+');
        [...COMP].forEach((ch, i) => { if (ch === 'x') c.forEach((n) => s.pluck(b * 4 + i / 4, n, 0.3, vel)); });
      }
    };
    const bass = (from, bars) => {
      for (let b = from; b < from + bars; b++) {
        s.upright(b * 4, ROOT[b % 4], 1.4, 1); s.upright(b * 4 + 1.5, FIFTH[b % 4], 0.45, 0.75);
        s.upright(b * 4 + 2, FIFTH[b % 4], 1.4, 0.9); s.upright(b * 4 + 3.5, ROOT[b % 4], 0.45, 0.75);
      }
    };
    const bossa = { kick: 'X..xX..xX..xX..x', snare: 'g..g..g...g..g..', hat: 'x.x.x.x.x.x.x.x.' };
    const bossaRide = { kick: 'X..xX..xX..xX..x', snare: 'g..g..g...g..g..', ride: 'x.x.x.x.x.x.x.x.' };

    // intro: ギターだけ
    comp(0, 4, 0.6); bass(2, 2);
    // A
    s.drums(4, 8, bossa); s.ghost(() => comp(4, 8)); bass(4, 8);
    s.seq('keys', 16, 0.5, MEL, 0.95);
    // B
    s.drums(12, 8, bossaRide); s.ghost(() => comp(12, 8)); bass(12, 8);
    s.seq('keys', 48, 0.5, MEL2, 0.95);
    s.ghost(() => s.seq('bell', 48, 0.5, MEL2, 0.25));
    // 間奏: ギターのソロ風
    s.drums(20, 8, bossa); bass(20, 8);
    for (let b = 20; b < 28; b++) {
      const c = CH[b % 4].split('+').map((n) => n.replace(/\d/, (d) => +d + 1));
      [0, 0.75, 1.5, 2, 2.75, 3.5].forEach((o, i) => s.pluck(b * 4 + o, c[(i + b) % c.length], 0.35, 0.9));
    }
    s.ghost(() => comp(20, 8, 0.35));
    // A'
    s.crash(112, 0.5);
    s.drums(28, 8, bossaRide); s.ghost(() => comp(28, 8)); bass(28, 8);
    s.seq('keys', 112, 0.5, MEL, 1);
    s.ghost(() => s.seq('bell', 112, 0.5, MEL, 0.3));
    // outro
    s.drums(36, 3, bossa); comp(36, 3, 0.5); bass(36, 3);
    ['F3', 'A3', 'C4', 'E4', 'A4'].forEach((n) => s.pluck(156, n, 3, 0.8));
    s.keys(156, 'D5', 3, 0.9); s.upright(156, 'D2', 3);
  },
};

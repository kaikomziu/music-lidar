// BLUES / 96 BPM: 12小節ブルースのシャッフル。ギターのリックとピアノ、ウォーキングベース
const TWELVE = ['A', 'D', 'A', 'A', 'D', 'D', 'A', 'A', 'E', 'D', 'A', 'E'];
const CH = { A: 'A3+C#4+E4+G4', D: 'A3+C4+D4+F#4', E: 'G#3+B3+D4+E4' };
const WALK = { A: ['A1', 'C#2', 'E2', 'F#2'], D: ['D2', 'F#2', 'A2', 'B2'], E: ['E2', 'G#2', 'B2', 'C#3'] };
// コードごとのリック(1小節・8分)
const LICK = {
  A: ['A5 - C6 - A5 G5 E5 -', 'E5 G5 A5 C6 - A5 G5 -', 'C6 - - A5 G5 - E5 -'],
  D: ['D6 - C6 - A5 - F#5 -', 'A5 C6 D6 - C6 A5 - -', 'F#5 - A5 - C6 - D6 -'],
  E: ['E6 - D6 - B5 - G#5 -', 'B5 - D6 - E6 - - -', 'G#5 B5 D6 E6 - - - -'],
};

export default {
  id: 'blues-highway',
  urlId: 'ihnshnrxo', // 曲ページのURL (music/ihnshnrxo/)。公開後は変えない
  title: 'Blues Highway',
  artist: 'MUSIC LiDAR',
  genre: 'BLUES',
  bpm: 96,
  color: '#5e8bff',
  levels: { easy: 2, normal: 4, hard: 6 },
  preview: 48,
  chart: { hard: { minGap: 0.11, maxNps: 6, minScore: 0.6 } },
  compose(s) {
    s.setSwing(1 / 6);
    const chord = (b) => TWELVE[b % 12];
    const shuffle = { kick: 'X.......X.......', snare: '....X.......X...', ride: 'x.x.x.x.x.x.x.x.' };
    const walk = (from, bars) => { for (let b = from; b < from + bars; b++) WALK[chord(b)].forEach((n, i) => s.upright(b * 4 + i, n, 0.85, i === 0 ? 1 : 0.8)); };
    const piano = (from, bars, vel = 0.4) => { for (let b = from; b < from + bars; b++) [0.5, 1.5, 2.5, 3.5].forEach((o) => CH[chord(b)].split('+').forEach((n) => s.keys(b * 4 + o, n, 0.3, vel))); };
    const licks = (from, bars, type, vel = 0.95) => { for (let b = from; b < from + bars; b++) s.seq(type, b * 4, 0.5, LICK[chord(b)][b % 3], vel); };
    // intro: 最後の4小節
    s.drums(0, 2, shuffle); walk(0, 2); s.seq('gtrlead', 0, 0.5, 'E6 - D6 - B5 - G#5 - | A5 - - - - - . . |', 0.9);
    // 12小節 × 4周
    const start = 2;
    s.drums(start, 48, shuffle); walk(start, 48);
    s.ghost(() => piano(start, 12, 0.4)); licks(start, 12, 'keys', 0.9);
    licks(start + 12, 12, 'gtrlead');
    piano(start + 24, 12, 0.5);
    licks(start + 36, 12, 'gtrlead', 1); s.ghost(() => piano(start + 36, 12, 0.35));
    const end = (start + 48) * 4;
    s.kick(end); s.crash(end, 0.5); s.upright(end, 'A1', 3); ['A3', 'C#4', 'E4', 'G4'].forEach((n) => s.keys(end, n, 3, 0.8)); s.gtrlead(end, 'A5', 3);
  },
};

// HARDSTYLE / 150 BPM: 歪んだハードキックと裏打ちのリバースベース、叫ぶスーパーソウのアンセム
const ROOT = ['A1', 'F1', 'C2', 'G1'];
const PAD = ['A3+C4+E4', 'F3+A3+C4', 'G3+C4+E4', 'G3+B3+D4'];
const ANTHEM =
  'A5 - - - E5 - A5 - | C6 - B5 - A5 - G5 - | F5 - - - A5 - C6 - | B5 - A5 - G5 - D5 - |' +
  'C6 - - - E5 - C6 - | B5 - A5 - G5 - E5 - | D5 - G5 - B5 - D6 - | E6 - - - - - - - |';
const SCREECH = [
  'A5 E6 A5 C6 A5 E6 A5 C6 A5 E6 A5 C6 B5 C6 D6 E6',
  'F5 C6 F5 A5 F5 C6 F5 A5 F5 C6 F5 A5 G5 A5 B5 C6',
  'C6 G6 C6 E6 C6 G6 C6 E6 C6 G6 C6 E6 D6 E6 F6 G6',
  'G5 D6 G5 B5 G5 D6 G5 B5 G5 D6 G5 B5 A5 B5 C6 D6',
];

export default {
  id: 'hard-reflector',
  urlId: 'hhwzomwv0', // 曲ページのURL (music/hhwzomwv0/)。公開後は変えない
  title: 'Hard Reflector',
  artist: 'MUSIC LiDAR',
  genre: 'HARDSTYLE',
  bpm: 150,
  color: '#ff5050',
  levels: { easy: 4, normal: 7, hard: 11 },
  preview: 128,
  chart: { normal: { minGap: 0.16 }, hard: { minGap: 0.075, maxNps: 11, minScore: 0.6, chordP: 0.45 } },
  compose(s) {
    const kicks = (from, bars, vel = 1) => { for (let b = from; b < from + bars; b++) for (let i = 0; i < 4; i++) s.hardkick(b * 4 + i, vel); };
    const rev = (from, bars) => { for (let b = from; b < from + bars; b++) for (let i = 0; i < 4; i++) s.bass(b * 4 + i + 0.5, ROOT[b % 4], 0.4, 1); };
    const pads = (from, bars, vel = 0.8) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, PAD[b % 4].split('+'), 4, vel); };
    const tops = { hat: '..x...x...x...x.', clap: '....x.......x...' };

    // intro: パッド → キック
    pads(0, 8, 0.7);
    s.seq('supersaw', 0, 1, 'A4 - - - | F4 - - - | G4 - - - | B4 - - - | A4 - - - | F4 - - - | G4 - - - | E5 - - - |', 0.6);
    kicks(4, 4, 0.9);
    // A: キック+リバースベース
    s.crash(32);
    kicks(8, 8); rev(8, 8); s.drums(8, 8, tops);
    for (let b = 8; b < 16; b++) [0.5, 1.5, 2.5, 3.5].forEach((o) => s.stab(b * 4 + o, PAD[b % 4].split('+'), 0.3, 0.55));
    // break: アンセムをゆっくり
    s.downer(64, 4);
    pads(16, 8, 1);
    s.seq('supersaw', 64, 0.5, ANTHEM, 0.85);
    // build: キックロール
    for (let b = 24; b < 26; b++) for (let i = 0; i < 8; i++) s.hardkick(b * 4 + i / 2, 0.8);
    for (let b = 26; b < 28; b++) for (let i = 0; i < 16; i++) s.hardkick(b * 4 + i / 4, 0.7 + i / 50);
    s.riser(96, 16, 0.9);
    // drop: アンセム2周
    s.crash(112); s.crash(144, 0.8);
    kicks(28, 16); rev(28, 16); s.drums(28, 16, { ...tops, hat: 'g.x.g.x.g.x.g.xo' });
    s.seq('supersaw', 112, 0.5, ANTHEM, 1);
    s.seq('lead', 144, 0.5, ANTHEM, 1);
    s.ghost(() => s.seq('supersaw', 144, 0.5, ANTHEM, 0.5));
    // climax: 16分のスクリーチ
    s.crash(176);
    kicks(44, 8); rev(44, 8); s.drums(44, 8, tops);
    for (let b = 44; b < 52; b++) SCREECH[b % 4].split(' ').forEach((n, i) => s.lead(b * 4 + i / 4, n, 0.2, i % 4 === 0 ? 1 : 0.8));
    // outro
    s.crash(208);
    pads(52, 3, 0.8); s.hardkick(208); s.supersaw(208, 'A4', 4, 0.8); s.supersaw(208, 'E5', 4, 0.8);
  },
};

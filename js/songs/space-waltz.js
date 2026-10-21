// WALTZ / 132 BPM(3拍子): 宇宙で踊るワルツ。「ズン・チャッ・チャッ」と回るリズム
// このファイルだけ3拍子なので、ドラムパターン(4拍子用)は使わず1拍ずつ置いている
const PROG = ['C4+E4+G4', 'C4+E4+G4', 'D4+F4+A4', 'G3+B3+D4+F4', 'G3+B3+D4+F4', 'G3+B3+D4+F4', 'C4+E4+G4', 'C4+E4+G4'];
const ROOT = ['C2', 'C2', 'D2', 'G1', 'G1', 'G1', 'C2', 'C2'];
// 1小節 = 3拍(6トークン)
const MEL = [
  'E5 - - - G5 -', 'C6 - - - B5 -', 'A5 - - - F5 -', 'D5 - - - - -',
  'D5 - - - F5 -', 'B5 - - - A5 -', 'G5 - - - E5 -', 'C5 - - - - -',
  'E5 - G5 - C6 -', 'E6 - - - D6 -', 'C6 - A5 - F5 -', 'D6 - - - - -',
  'B5 - D6 - F6 -', 'E6 - D6 - B5 -', 'C6 - - - G5 -', 'C6 - - - - -',
];

export default {
  id: 'space-waltz',
  urlId: 'ac2b5ke6v', // 曲ページのURL (music/ac2b5ke6v/)。公開後は変えない
  title: 'Space Waltz',
  artist: 'MUSIC LiDAR',
  genre: 'WALTZ',
  bpm: 132,
  color: '#b0c4ff',
  levels: { easy: 2, normal: 3, hard: 4 },
  preview: 48,
  chart: { hard: { minGap: 0.13, maxNps: 5.5 } },
  compose(s) {
    const BAR = 3;
    const waltz = (from, bars, vel = 0.5, drums = true) => {
      for (let b = from; b < from + bars; b++) {
        const t = b * BAR, c = PROG[b % 8].split('+');
        s.bass(t, ROOT[b % 8], 0.9, 1);
        [1, 2].forEach((o) => c.forEach((n) => s.pluck(t + o, n, 0.5, vel)));
        if (drums) { s.kick(t, 0.8); s.hat(t + 1, 0.5); s.hat(t + 2, 0.5); }
      }
    };
    const mel = (from, type, vel = 0.9) => MEL.forEach((m, i) => s.seq(type, (from + i) * BAR, 0.5, m, vel));
    const pads = (from, bars, vel = 0.5) => { for (let b = from; b < from + bars; b++) s.pad(b * BAR, PROG[b % 8].split('+'), BAR, vel); };
    pads(0, 8, 0.6); waltz(4, 4, 0.5, false);
    s.crash(8 * BAR, 0.5);
    waltz(8, 16); mel(8, 'bell');
    pads(24, 8, 0.6); waltz(24, 8, 0.4, false);
    s.seq('keys', 24 * BAR, 0.5, 'G5 - - - - - C6 - - - - - A5 - - - - - B5 - - - - - G5 - - - - - E5 - - - - - D5 - - - - - G5 - - - - -', 0.8);
    s.crash(32 * BAR, 0.6);
    waltz(32, 16, 0.45); mel(32, 'lead', 1); s.ghost(() => mel(32, 'bell', 0.35)); pads(32, 16, 0.35);
    s.crash(48 * BAR, 0.6);
    waltz(48, 16, 0.45); mel(48, 'square', 1); pads(48, 16, 0.4);
    s.crash(64 * BAR, 0.5); s.kick(64 * BAR); s.pad(64 * BAR, ['C4', 'E4', 'G4', 'C5'], 4, 0.8); s.bell(64 * BAR, 'C6', 3); s.bass(64 * BAR, 'C2', 3);
  },
};

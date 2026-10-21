// TRAP / 140 BPM(ハーフタイム): 重い808、細かく転がるハイハット、暗いベルのメロディ
const ROOT = ['F1', 'Db2', 'Eb2', 'C2'];
const PAD = ['F3+Ab3+C4', 'Db3+F3+Ab3', 'Eb3+G3+Bb3', 'C3+E3+G3'];
const MEL =
  'C6 - Ab5 - F5 - G5 Ab5 | G5 - Eb5 - - - . . | Db6 - Ab5 - F5 - Ab5 - | C6 - - - Bb5 - G5 - |' +
  'C6 - Ab5 - F5 - Ab5 C6 | Eb6 - Db6 - C6 - Bb5 - | Ab5 - G5 - F5 - Eb5 - | E5 - - - G5 - - - |';
// ハイハットのロール(1小節)。数字は1拍を何分割するか
const ROLL = [2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 8, 2, 2, 2];

export default {
  id: 'low-orbit',
  urlId: 'd463i01hl', // 曲ページのURL (music/d463i01hl/)。公開後は変えない
  title: 'Low Orbit',
  artist: 'MUSIC LiDAR',
  genre: 'TRAP',
  bpm: 140,
  color: '#b48cff',
  levels: { easy: 3, normal: 6, hard: 11 },
  preview: 80,
  chart: { hard: { minGap: 0.085, maxNps: 8, minScore: 0.7 } },
  compose(s) {
    const pads = (from, bars, vel = 0.5) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, PAD[b % 4].split('+'), 4, vel); };
    const b808 = (from, bars) => {
      for (let b = from; b < from + bars; b++) { s.bass(b * 4, ROOT[b % 4], 1.8, 1); s.bass(b * 4 + 2.5, ROOT[b % 4], 0.6, 0.8); s.bass(b * 4 + 3.25, ROOT[b % 4].replace(/\d/, (d) => +d + 1), 0.5, 0.75); }
    };
    // 1小節を半拍ずつ、ROLL の分割数でハイハットを刻む
    const hats = (from, bars, busy = true) => {
      for (let b = from; b < from + bars; b++) {
        for (let h = 0; h < 8; h++) {
          const div = busy ? ROLL[(h + (b % 2) * 8) % 16] : 2;
          const n = div / 2;
          for (let k = 0; k < n; k++) s.hat(b * 4 + h * 0.5 + k * (0.5 / n), k === 0 ? 0.8 : 0.5);
        }
      }
    };
    const half = { kick: 'X......X..X.....', snare: '........X.......' };

    // intro
    pads(0, 4, 0.7);
    s.seq('bell', 0, 0.5, MEL.split('|').slice(0, 4).join('|'), 0.6);
    hats(2, 2, false);
    // A
    s.crash(16);
    s.drums(4, 8, half); b808(4, 8); hats(4, 8); pads(4, 8, 0.35);
    s.seq('bell', 16, 0.5, MEL, 0.95);
    // B: 808だけ
    s.drums(12, 4, { kick: 'X.........X.....', snare: '........X.......' }); b808(12, 4); hats(12, 4, false);
    s.seq('pluck', 48, 0.25, 'F5 Ab5 C6 Ab5 '.repeat(4) + 'Db5 F5 Ab5 F5 '.repeat(4) + 'Eb5 G5 Bb5 G5 '.repeat(4) + 'C5 E5 G5 E5 '.repeat(4), 0.7);
    // A'
    s.crash(64);
    s.drums(16, 8, { ...half, snare: '........X......g' }); b808(16, 8); hats(16, 8); pads(16, 8, 0.4);
    s.seq('square', 64, 0.5, MEL, 0.95);
    s.ghost(() => s.seq('bell', 64, 0.5, MEL, 0.35));
    // C: アルペジオと808
    s.downer(96, 4);
    s.drums(24, 8, { kick: 'X.........X..x..', snare: '........X.......' }); b808(24, 8); hats(24, 8, false);
    s.seq('pluck', 96, 0.25, ('F5 Ab5 C6 Ab5 '.repeat(4) + 'Db5 F5 Ab5 F5 '.repeat(4) + 'Eb5 G5 Bb5 G5 '.repeat(4) + 'C5 E5 G5 E5 '.repeat(4)).repeat(2), 0.75);
    // A'': 全部のせ
    s.crash(128);
    s.drums(32, 8, { ...half, snare: '........X......g' }); b808(32, 8); hats(32, 8); pads(32, 8, 0.4);
    s.seq('bell', 128, 0.5, MEL, 1);
    s.ghost(() => s.seq('square', 128, 0.5, MEL, 0.4));
    // outro
    pads(40, 3, 0.6); hats(40, 2, false); s.bass(160, 'F1', 3);
    s.seq('bell', 160, 0.5, 'C6 - Ab5 - F5 - G5 Ab5 | G5 - - - - - . . | F5 - - - - - - - |', 0.7);
  },
};

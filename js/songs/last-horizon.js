// ORCHESTRAL / 120 BPM: 弦のピチカートと厚いストリングス、ブラス、ティンパニ風の太鼓で壮大に
const PROG = ['Dm', 'Bb', 'F', 'C'];
const STR = { Dm: 'D3+A3+D4+F4', Bb: 'Bb2+F3+Bb3+D4', F: 'F3+A3+C4+F4', C: 'C3+G3+C4+E4' };
const BRASS = { Dm: 'D4+F4+A4', Bb: 'D4+F4+Bb4', F: 'C4+F4+A4', C: 'C4+E4+G4' };
const ROOT = { Dm: 'D2', Bb: 'Bb1', F: 'F1', C: 'C2' };
const PIZZ = { Dm: 'D5 A4 F5 A4', Bb: 'D5 Bb4 F5 Bb4', F: 'C5 A4 F5 A4', C: 'E5 C5 G5 C5' };
const THEME =
  'D5 - - - A5 - - - | F5 - - E5 D5 - C5 - | A4 - - - C5 - F5 - | E5 - - - - - - - |' +
  'D5 - - - A5 - - - | Bb5 - - A5 G5 - F5 - | A5 - - - C6 - - - | G5 - - - - - - - |';
const CLIMAX =
  'A5 - - - D6 - - - | D6 - C6 - Bb5 - A5 - | C6 - - - F6 - - - | E6 - D6 - C6 - G5 - |' +
  'A5 - - - D6 - - - | F6 - E6 - D6 - Bb5 - | C6 - A5 - F6 - E6 - | D6 - - - - - - - |';

export default {
  id: 'last-horizon',
  urlId: '485yusnb9', // 曲ページのURL (music/485yusnb9/)。公開後は変えない
  title: 'Last Horizon',
  artist: 'MUSIC LiDAR',
  genre: 'ORCHESTRAL',
  bpm: 120,
  color: '#ffd9a0',
  levels: { easy: 3, normal: 6, hard: 9 },
  preview: 128,
  chart: { hard: { minGap: 0.11, maxNps: 7.5, chordP: 0.42 } },
  compose(s) {
    const strings = (from, bars, vel = 0.7) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, STR[PROG[b % 4]].split('+'), 4, vel); };
    const pizz = (from, bars, vel = 0.6) => { for (let b = from; b < from + bars; b++) s.seq('pluck', b * 4, 0.5, PIZZ[PROG[b % 4]] + ' ' + PIZZ[PROG[b % 4]], vel); };
    const brass = (from, bars, vel = 0.6) => { for (let b = from; b < from + bars; b++) [0, 1.5, 3].forEach((o) => s.stab(b * 4 + o, BRASS[PROG[b % 4]].split('+'), o === 3 ? 1 : 0.5, vel)); };
    const lows = (from, bars) => { for (let b = from; b < from + bars; b++) { s.bass(b * 4, ROOT[PROG[b % 4]], 2); s.bass(b * 4 + 2, ROOT[PROG[b % 4]], 2, 0.8); } };
    const march = { kick: 'X.......X.......', snare: 'x.g.x.ggx.g.x.gg' };
    const epic = { kick: 'X..xX...X..xX.x.', snare: '....X.......X...', crash: '................' };

    // intro: 弦の静かな始まり
    strings(0, 4, 0.6);
    s.seq('bell', 0, 1, 'D5 - - - | F5 - - - | A5 - - - | G5 - E5 - |', 0.6);
    // A: ピチカートとテーマ
    pizz(4, 8); strings(4, 8, 0.45); lows(4, 8);
    s.drums(8, 4, march);
    s.seq('keys', 16, 0.5, THEME, 0.9);
    // B: ブラス
    s.crash(48);
    s.drums(12, 8, march); brass(12, 8); strings(12, 8, 0.6); lows(12, 8);
    s.seq('lead', 48, 0.5, THEME, 0.95);
    // 静かなところ → ティンパニのロール
    strings(20, 4, 0.8);
    s.seq('bell', 80, 1, 'A5 - - - | Bb5 - - - | C6 - - - | E6 - - - |', 0.7);
    s.drums(22, 1, { kick: 'x...x...x.x.x.x.' }); s.drums(23, 1, { kick: 'xxxxxxxxxxxxxxxx' });
    s.riser(88, 8, 0.6);
    // クライマックス(2周)
    s.crash(96); s.crash(128);
    s.drums(24, 16, epic); brass(24, 16, 0.5); strings(24, 16, 0.7); lows(24, 16); s.ghost(() => pizz(24, 16, 0.35));
    s.seq('supersaw', 96, 0.5, CLIMAX, 0.95);
    s.seq('lead', 128, 0.5, CLIMAX, 1);
    // ending
    s.crash(160); s.kick(160); s.kick(161, 0.8); s.kick(162, 0.9);
    s.pad(160, ['D3', 'A3', 'D4', 'F4', 'A4'], 6, 1); s.stab(163, ['D4', 'F4', 'A4', 'D5'], 3, 1); s.bass(163, 'D2', 3);
  },
};

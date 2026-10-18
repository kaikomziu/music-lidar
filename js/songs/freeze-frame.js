// GIMMICK / 160 BPM: 譜面停止・変速・隠し(サドゥン)入り
const PAD = ['A2+E3+A3+C4', 'F2+C3+F3+A3', 'C3+G3+C4+E4', 'G2+D3+G3+B3'];
const STAB = ['A4+C5+E5', 'F4+A4+C5', 'G4+C5+E5', 'G4+B4+D5'];
const ROOT = ['A1', 'F1', 'C2', 'G1'];

// A: 8分のリフ(4小節)
const RIFF_A =
  'E5 . A5 . C6 . B5 A5 | F5 . A5 . C6 . A5 . | G5 . C6 . E6 . D6 C6 | B5 . G5 . D5 - - . |';
// スロー区間: のびやかな長押し
const SLOW = 'A5 - - - E5 - - - | F5 - - - A5 - - - | G5 - - - C6 - - - | B5 - - - - - - - |';
// 加速区間: 16分
const BURST = [
  'A5 C6 E6 C6 A5 C6 E6 C6 A5 C6 E6 C6 B5 C6 E6 C6',
  'F5 A5 C6 A5 F5 A5 C6 A5 F5 A5 C6 A5 G5 A5 C6 A5',
  'G5 C6 E6 C6 G5 C6 E6 C6 G5 C6 E6 C6 A5 C6 E6 C6',
  'G5 B5 D6 B5 G5 B5 D6 B5 G5 B5 D6 B5 D6 E6 F#6 G6',
];
// ストップ&ゴー: 裏拍は休符(その間だけ譜面が止まる)
const STUTTER = 'A5 . C6 . E6 . C6 . | F5 . A5 . C6 . A5 . | G5 . C6 . E6 . G6 . | D6 . B5 . G5 . D6 . |';
// 隠し区間: 細かめのリフ
const HIDE =
  'A5 C6 E6 A5 C6 E6 A5 C6 | F5 A5 C6 F5 A5 C6 F5 A5 | G5 C6 E6 G5 C6 E6 G5 C6 | G5 B5 D6 G5 B5 D6 G6 F#6 |';
const FINAL =
  'E6 . E6 D6 C6 . B5 C6 | A5 . C6 . F6 . E6 . | E6 . G6 . E6 D6 C6 . | B5 . D6 . G6 - - - |';

export default {
  id: 'freeze-frame',
  urlId: 'h21dslg1j', // 曲ページのURL (music/h21dslg1j/)。公開後は変えない
  title: 'Freeze Frame',
  artist: 'MUSIC LiDAR',
  genre: 'GIMMICK',
  bpm: 160,
  color: '#c49bff',
  levels: { easy: 4, normal: 8, hard: 12 },
  preview: 192,
  chart: {
    normal: { minGap: 0.18 },
    hard: { minGap: 0.092, maxNps: 9, chordP: 0.4 },
  },
  // 拍で指定。stop: その拍から beats 拍のあいだ譜面が止まる / speed: 流れる速さの倍率 / cover: レーン奥を隠す割合
  gimmicks: [
    { beat: 46, type: 'stop', beats: 2 },
    { beat: 62, type: 'stop', beats: 1 },
    { beat: 64, type: 'speed', to: 0.5, beats: 0 },
    { beat: 96, type: 'speed', to: 2.0, beats: 0 },
    { beat: 112, type: 'speed', to: 1, beats: 0 },
    ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => ({ beat: 112 + i * 2 + 1.5, type: 'stop', beats: 0.5 })),
    { beat: 144, type: 'cover', to: 0.45, beats: 2 },
    { beat: 174, type: 'cover', to: 0, beats: 2 },
    { beat: 186, type: 'stop', beats: 6 },
    { beat: 192, type: 'speed', to: 1.7, beats: 16 },
    { beat: 232, type: 'speed', to: 1, beats: 8 },
  ],
  compose(s) {
    const pads = (from, bars, vel = 1) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, PAD[b % 4].split('+'), 4, vel); };
    const bass = (from, bars, vel = 1) => {
      for (let b = from; b < from + bars; b++) for (let i = 0; i < 4; i++) s.bass(b * 4 + i + 0.5, ROOT[b % 4], 0.4, vel);
    };
    const stabs = (from, bars, offs, vel = 0.8) => {
      for (let b = from; b < from + bars; b++) offs.forEach((o) => s.stab(b * 4 + o, STAB[b % 4].split('+'), 0.3, vel));
    };
    const beat = { kick: 'X...X...X...X...', snare: '....X.......X...', hat: '..x...x...x...x.' };
    const busy = { kick: 'X...X...X..XX...', snare: '....X.......X..x', hat: 'xxxxxxxxxxxxxxxx' };

    // intro (bars 0-3)
    pads(0, 4, 0.8);
    s.drums(0, 4, { hat: 'x.x.x.x.x.x.x.x.' });
    s.drums(2, 2, { kick: 'X...X...X...X...' });

    // A (bars 4-15) beat 46 と 62 で譜面停止 → 音もそこで一瞬止める
    s.crash(16);
    s.drums(4, 7, beat);
    s.drums(11, 1, { kick: 'X...X...........', snare: '....X...........' });
    s.drums(12, 3, beat);
    s.drums(15, 1, { kick: 'X...X...X.......', snare: '....X...X.......' });
    bass(4, 7); bass(12, 3);
    s.ghost(() => pads(4, 12, 0.5));
    s.seq('square', 16, 0.5, RIFF_A);
    s.seq('square', 32, 0.5, RIFF_A.replace(/ \| B5[^|]*\|$/, ' | B5 - - - . . . . |'));
    s.seq('lead', 48, 0.5, RIFF_A);
    s.crash(48, 0.7);

    // B スロー (bars 16-23): 譜面は半分の速さ
    s.crash(64);
    pads(16, 8, 1);
    s.drums(16, 8, { kick: 'X.......X.......', snare: '........X.......', hat: 'x...x...x...x...' });
    s.seq('bell', 64, 0.5, SLOW);
    s.seq('bell', 80, 0.5, SLOW);

    // C 加速 (bars 24-27): 譜面2倍速
    s.crash(96);
    s.drums(24, 4, busy);
    bass(24, 4);
    BURST.forEach((r, i) => s.seq('pluck', 96 + i * 4, 0.25, r));
    s.riser(104, 8, 0.7);

    // D ストップ&ゴー (bars 28-35): 2拍ごとに半拍止まる
    s.crash(112);
    s.drums(28, 8, { kick: 'X...X...X...X...', snare: '....X.......X...', hat: 'x...x...x...x...' });
    stabs(28, 8, [0, 1, 2, 3], 0.7);
    s.seq('lead', 112, 0.5, STUTTER);
    s.seq('lead', 128, 0.5, STUTTER);

    // E 隠し (bars 36-43): レーン奥が見えない
    s.crash(144);
    s.drums(36, 8, busy);
    bass(36, 8);
    s.seq('square', 144, 0.5, HIDE);
    s.seq('square', 160, 0.5, HIDE);

    // ブレイク (bars 44-47): 186拍目から長い停止
    s.downer(176, 4);
    pads(44, 4, 1.1);
    s.seq('bell', 176, 1, 'A5 - E5 - | F5 - - - | . . . . | . . . . |');
    s.riser(186, 6, 1);

    // F ラスト (bars 48-63): だんだん速くなる
    s.crash(192); s.crash(224, 0.8);
    s.drums(48, 14, busy);
    bass(48, 14);
    stabs(48, 14, [0.5, 1.5, 2.5, 3.5], 0.55);
    s.seq('lead', 192, 0.5, FINAL);
    s.seq('lead', 208, 0.5, FINAL);
    BURST.forEach((r, i) => s.seq('pluck', 224 + i * 4, 0.25, r, 0.9));
    s.seq('lead', 240, 0.5, FINAL);
    s.drums(62, 2, { kick: 'X...X...X...XXXX', snare: 'xxxxxxxxxxxxxxxx' });

    // end
    s.crash(256);
    s.kick(256);
    s.stab(256, ['A4', 'C5', 'E5', 'A5'], 2, 1);
    s.bass(256, 'A1', 2);
    s.pad(256, ['A2', 'E3', 'A3', 'C4', 'E4'], 4, 0.9);
  },
};

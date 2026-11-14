// CHRISTMAS TRANCE / 138 BPM: 聖夜のトランス。ベルのアルペジオと聖歌隊のようなパッドから、雪の夜空へ駆け上がる(期間限定: 12/1〜1/31)
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['B3+D4+F#4', 'G3+B3+D4', 'D4+F#4+A4', 'A3+C#4+E4'];
const ROOT = ['B1', 'G1', 'D2', 'A1'];
const CHOIR = ['B3+D4+F#4+B4', 'G3+B3+D4+G4', 'A3+D4+F#4+A4', 'A3+C#4+E4+A4'];
// 静かなところのメロディ(聖歌のように)
const MEL =
  'F#5 - - - E5 - D5 - | B4 - - - D5 - E5 - | F#5 - A5 - G5 - F#5 - | E5 - - - - - - - |' +
  'F#5 - - - E5 - D5 - | B4 - - - D5 - G5 - | F#5 - E5 - D5 - C#5 - | D5 - - - - - - - |';
// ドロップのリード(和音に合わせて1小節ずつ)
const DROP =
  'B5 . B5 F#5 . B5 . D6 | . D6 . B5 . G5 B5 . | A5 . A5 F#5 . A5 . D6 | . C#6 . E6 . C#6 A5 . |' +
  'D6 . D6 B5 . F#6 . D6 | . B5 . D6 . G6 D6 . | F#6 . F#6 D6 . A5 . F#5 | E6 . C#6 . A5 . E5 . |';

export default {
  id: 'snowlight-carol',
  urlId: 'zcdl6ur3d', // 曲ページのURL (music/zcdl6ur3d/)。公開後は変えない
  title: 'Snowlight Carol',
  artist: 'MUSIC LiDAR',
  genre: 'CHRISTMAS TRANCE',
  bpm: 138,
  color: '#7fd8ff',
  event: 'xmas', // 期間限定(js/event.js)
  levels: { easy: 5, normal: 8, hard: 11 },
  preview: 80,
  sidechain: true,
  chart: { normal: { minGap: 0.16 }, hard: { minGap: 0.09, maxNps: 9.5, chordP: 0.45 } },
  compose(s) {
    const sleigh = (from, bars, pat = 'x.x.x.x.x.x.x.x.') => s.ghost(() => s.drums(from, bars, { hat: pat }));
    const bellArp = (from, bars, vel = 0.4) => arp(s, 'bell', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 2, 3, 1, 2, 3, 4], oct: 1 });
    const trance = { kick: 'X...X...X...X...', hat: '..x...x...x...x.', clap: '....X.......X...', ride: 'x.x.x.x.x.x.x.x.' };

    // イントロ(0〜7): 聖歌隊のパッドとベル → キックが入る
    sustain(s, 'pad', 0, 8, CHOIR, 0.55);
    s.ghost(() => bellArp(0, 8, 0.3));
    sleigh(0, 8);
    s.drums(4, 4, { kick: 'X...X...X...X...', hat: '..x...x...x...x.' });
    bassLine(s, 4, 4, ROOT, '..x...x...x...x.', { vel: 0.7 });
    pattern(s, 'pluck', 4, 4, 'x..x..x...x..x..', (b) => PROG[b % 4], { vel: 0.4, len: 0.2 });
    // ブレイク(8〜15): 聖歌のメロディ
    s.crash(32, 0.6);
    s.downer(32, 4);
    sustain(s, 'pad', 8, 8, CHOIR, 0.6);
    s.seq('bell', 32, 0.5, MEL, 0.95);
    s.ghost(() => s.seq('keys', 32, 0.5, MEL, 0.4));
    s.ghost(() => bellArp(8, 8, 0.2));
    // ビルドアップ(16〜19)
    sustain(s, 'pad', 16, 4, CHOIR, 0.65);
    s.seq('supersaw', 64, 0.5, MEL.split('|').slice(0, 4).join('|'), 0.7);
    s.drums(16, 2, { kick: 'X...X...X...X...' });
    sleigh(16, 4, 'xxxxxxxxxxxxxxxx');
    build(s, 18);
    // ドロップ1(20〜35)
    const drop = (bar) => {
      s.crash(bar * 4); s.crash(bar * 4 + 32, 0.8);
      s.drums(bar, 16, trance);
      sleigh(bar, 16, 'xxxxxxxxxxxxxxxx');
      bassLine(s, bar, 16, ROOT, '..X...X...X...X.', { type: 'reese', vel: 0.85 });
      sustain(s, 'pad', bar, 16, CHOIR, 0.3);
      s.seq('lead', bar * 4, 0.5, DROP, 1);
      s.seq('supersaw', bar * 4 + 32, 0.5, DROP, 1);
      s.ghost(() => s.seq('supersaw', bar * 4, 0.5, DROP, 0.4));
      s.ghost(() => bellArp(bar, 16, 0.22));
    };
    drop(20);
    // 中間のブレイク(36〜43): 雪の静けさ
    s.downer(144, 4);
    sustain(s, 'pad', 36, 8, CHOIR, 0.6);
    bellArp(36, 4, 0.5);
    s.seq('keys', 160, 0.5, MEL.split('|').slice(4).join('|'), 0.9);
    s.ghost(() => s.seq('bell', 160, 0.5, MEL.split('|').slice(4).join('|'), 0.4));
    // ビルドアップ2(44〜47)
    sustain(s, 'pad', 44, 4, CHOIR, 0.65);
    pattern(s, 'pluck', 44, 4, 'xxxxxxxxxxxxxxxx', (b) => [PROG[b % 4].split('+')[(b + 1) % 3].replace(/\d/, (d) => +d + 1)], { vel: 0.5, len: 0.2 });
    s.drums(44, 2, { kick: 'X...X...X...X...', clap: '....X.......X...' });
    build(s, 46);
    // ドロップ2(48〜63)
    drop(48);
    s.ghost(() => s.seq('bell', 192 + 32, 0.5, DROP, 0.35));
    // 締め: 鐘
    s.crash(256); s.kick(256);
    s.pad(256, ['B3', 'D4', 'F#4', 'B4'], 4, 0.7);
    s.bell(256, 'B6', 3.5, 0.9); s.bell(256.75, 'F#6', 3, 0.6); s.bell(257.5, 'D6', 2.5, 0.5);
    s.reese(256, 'B1', 2);
  },
};

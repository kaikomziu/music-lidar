// POLKA / 140 BPM: アコーディオン風の和音が「ズン・チャッ」と跳ねる楽しいポルカ
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const PROG = ['C4+E4+G4', 'G3+B3+D4+F4', 'G3+B3+D4+F4', 'C4+E4+G4', 'F4+A4+C5', 'C4+E4+G4', 'G3+B3+D4+F4', 'C4+E4+G4'];
const ROOT = ['C2', 'G1', 'G1', 'C2', 'F1', 'C2', 'G1', 'C2'];
const MEL =
  'E5 F5 G5 . G5 . G5 . | F5 G5 A5 . G5 . F5 . | D5 E5 F5 . F5 . F5 . | E5 F5 G5 . C6 - - . |' +
  'A5 . C6 . A5 . F5 . | G5 . E5 . C5 . E5 . | D5 . F5 . B5 . D6 . | C6 - - - - - . . |';

export default {
id: 'polka-party',
  urlId: 'z3ea5gme3', // 曲ページのURL (music/z3ea5gme3/)。公開後は変えない
  title: 'Polka Party',
  artist: 'MUSIC LiDAR',
  genre: 'POLKA',
  bpm: 140,
  color: '#ff5050',
  levels: { easy: 2, normal: 4, hard: 7 },
  preview: 32,
  chart: { hard: { minGap: 0.11, maxNps: 6.5 } },
  compose(s) {

    const accordion = (from, bars, vel = 0.45) => pattern(s, 'stab', from, bars, '..x...x...x...x.', (b) => PROG[b % 8], { vel, len: 0.2 });
    const oom = (from, bars) => bassLine(s, from, bars, ROOT, 'X...f...X...f...', { len: 0.4 });
    const polka = { kick: 'X...X...X...X...', snare: '..x...x...x...x.' };
    accordion(0, 4, 0.55); oom(0, 4);
    s.drums(4, 16, polka); accordion(4, 16); oom(4, 16);
    s.seq('lead', 16, 0.5, MEL, 0.95); s.seq('keys', 48, 0.5, MEL, 0.95);
    s.drums(20, 4, { kick: 'X.......X.......', snare: '....x.......x...' }); accordion(20, 4, 0.6); oom(20, 4);
    s.crash(96, 0.6);
    s.drums(24, 8, { ...polka, hat: 'x.x.x.x.x.x.x.x.' }); accordion(24, 8, 0.4); oom(24, 8);
    s.seq('square', 96, 0.5, MEL, 1);
    // もう一回、もっと速く感じるように
    s.crash(128, 0.6);
    s.drums(32, 8, { ...polka, hat: 'xxxxxxxxxxxxxxxx' }); accordion(32, 8, 0.4); oom(32, 8);
    s.seq('lead', 128, 0.5, MEL, 1); s.ghost(() => s.seq('keys', 128, 0.5, MEL, 0.35));
    s.kick(160); s.stab(160, ['C4', 'E4', 'G4', 'C5'], 0.4, 1); s.kick(161); s.stab(161, ['C4', 'E4', 'G4', 'C5'], 1, 1); s.bass(161, 'C2', 1);
  },
};

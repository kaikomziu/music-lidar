// BLUEGRASS / 180 BPM: バンジョーのロールとフィドルの速弾き。カントリー最速決定戦
import { sustain, bassLine, arp, build } from './kit.js';

const PROG = ['G3+B3+D4', 'G3+B3+D4', 'C4+E4+G4', 'D4+F#4+A4'];
const ROOT = ['G1', 'G1', 'C2', 'D2'];
const FIDDLE =
  'G5 A5 B5 D6 E6 D6 B5 A5 | G5 A5 B5 G5 A5 - . . | C6 D6 E6 G6 E6 D6 C6 B5 | A5 B5 C6 A5 D6 - . . |' +
  'B5 D6 G6 D6 B5 D6 G6 F#6 | E6 C6 G5 C6 E6 - D6 C6 | B5 A5 G5 A5 B5 D6 E6 F#6 | G6 - - - . . . . |';
const BANJO =
  'G4 B4 D5 G4 B4 D5 G4 B4 | D5 G5 D5 B4 G4 - . . | C5 E5 G5 C5 E5 G5 C5 E5 | D5 F#5 A5 D5 F#5 A5 D6 . |';

export default {
  id: 'bluegrass-rush',
  urlId: 'wpeauzrrf', // 曲ページのURL (music/wpeauzrrf/)。公開後は変えない
  title: 'Bluegrass Rush',
  artist: 'MUSIC LiDAR',
  genre: 'BLUEGRASS',
  bpm: 180,
  color: '#e8b04a',
  levels: { easy: 4, normal: 8, hard: 12 },
  preview: 112,
  chart: { normal: { minGap: 0.15, maxNps: 4.8 }, hard: { minGap: 0.08, maxNps: 9.5, minScore: 0.7 } },
  compose(s) {
    const roll = (from, bars, vel = 0.3) => s.ghost(() => arp(s, 'pluck', from, bars, PROG, { step: 0.25, vel, order: [0, 1, 3, 0, 2, 3, 1, 4] }));
    const train = { kick: 'X.......X.......', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    arp(s, 'pluck', 0, 4, PROG, { step: 0.5, vel: 0.65, order: [0, 1, 3, 0, 2, 3, 1, 4] });
    s.drums(4, 16, train); roll(4, 16); bassLine(s, 4, 16, ROOT, 'X...f...X...f...', { type: 'upright' });
    s.seq('gtrlead', 16, 0.5, FIDDLE, 0.9); s.seq('gtrlead', 48, 0.5, FIDDLE, 0.95);
    s.drums(20, 8, { kick: 'X.......X.......', hat: '..x...x...x...x.' }); bassLine(s, 20, 8, ROOT, 'X...f...X...f...', { type: 'upright' });
    s.seq('pluck', 80, 0.5, BANJO + BANJO, 0.9); build(s, 26);
    s.crash(112); s.crash(144, 0.8);
    s.drums(28, 16, { ...train, snare: '....X.......X..x', hat: 'xxxxxxxxxxxxxxxx' }); roll(28, 16, 0.35); bassLine(s, 28, 16, ROOT, 'X.f.X.f.X.f.X.f.', { type: 'upright' });
    s.seq('gtrlead', 112, 0.5, FIDDLE, 1); s.seq('supersaw', 144, 0.5, FIDDLE, 0.95);
    sustain(s, 'pad', 44, 4, PROG, 0.5); s.seq('pluck', 176, 0.5, BANJO, 0.9);
    s.drums(48, 12, { ...train, hat: 'xxxxxxxxxxxxxxxx' }); roll(48, 12, 0.35); bassLine(s, 48, 12, ROOT, 'X.f.X.f.X.f.X.f.', { type: 'upright' });
    s.seq('gtrlead', 192, 0.5, FIDDLE + FIDDLE.split('|').slice(0, 4).join('|'), 1);
    s.crash(240); s.kick(240); s.guitar(240, ['G3', 'B3', 'D4', 'G4'], 2, 1); s.upright(240, 'G1', 3);
  },
};

// PSYTRANCE / 145 BPM: ころがる16分のベースと、うねうね動くシンセ。森の奥へトランス
import { sustain, arp, build } from './kit.js';

const KEYS = ['E2', 'E2', 'G2', 'D2'];
const LEAD =
  'E5 F5 G5 B5 E6 B5 G5 F5 | E5 G5 B5 D6 E6 D6 B5 G5 | G5 A5 B5 D6 G6 D6 B5 A5 | D6 C6 B5 A5 G5 F5 E5 D5 |';
const HOOK =
  'E6 - - - B5 - - - | G6 - - - F6 - E6 - | D6 - - - B5 - G5 - | A5 - B5 - D6 - - - |';

export default {
  id: 'psy-forest',
  urlId: 'asmjyl799', // 曲ページのURL (music/asmjyl799/)。公開後は変えない
  title: 'Psy Forest',
  artist: 'MUSIC LiDAR',
  genre: 'PSYTRANCE',
  bpm: 145,
  color: '#a0ff6a',
  levels: { easy: 4, normal: 7, hard: 11 },
  preview: 128,
  sidechain: true,
  chart: { normal: { minGap: 0.16 }, hard: { minGap: 0.09, maxNps: 9.5, minScore: 0.8 } },
  compose(s) {
    // キック以外の16分3つにベース(サイトランスのころがるベース)
    const roll = (from, bars) => { for (let b = from; b < from + bars; b++) for (let i = 0; i < 16; i++) if (i % 4) s.bass(b * 4 + i / 4, KEYS[b % 4], 0.2, 0.85); };
    const four = { kick: 'X...X...X...X...', hat: '..x...x...x...x.', ride: 'x.x.x.x.x.x.x.x.' };
    const full = { kick: 'X...X...X...X...', hat: 'gxgxgxgxgxgxgxgx', clap: '....x.......x...' };
    s.drums(0, 8, { kick: 'X...X...X...X...' }); roll(4, 4);
    s.ghost(() => arp(s, 'square', 0, 8, ['E4+G4+B4', 'E4+G4+B4', 'G4+B4+D5', 'D4+F#4+A4'], { step: 0.25, vel: 0.35, order: [0, 1, 2, 1] }));
    s.crash(32);
    s.drums(8, 16, four); roll(8, 16);
    s.seq('lead', 32, 0.25, LEAD + LEAD, 0.8); s.seq('square', 64, 0.25, LEAD + LEAD, 0.85);
    s.downer(96, 4); sustain(s, 'pad', 24, 8, ['E4+G4+B4', 'C4+E4+G4', 'D4+F#4+A4', 'B3+D4+F#4'], 0.8);
    s.seq('supersaw', 96, 0.5, HOOK + HOOK, 0.85); build(s, 30);
    s.crash(128); s.crash(160, 0.8);
    s.drums(32, 16, full); roll(32, 16);
    s.seq('supersaw', 128, 0.5, HOOK + HOOK, 1); s.seq('lead', 160, 0.25, LEAD + LEAD + LEAD + LEAD, 0.9);
    s.ghost(() => s.seq('square', 128, 0.25, LEAD + LEAD + LEAD + LEAD, 0.35));
    s.drums(48, 4, four); roll(48, 3);
    s.crash(208); s.kick(208); s.bass(208, 'E1', 2);
  },
};

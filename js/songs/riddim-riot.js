// RIDDIM / 150 BPM(ハーフ): くり返すワブルベースと、空白の多いスネア。縦連が多め
import { pattern, sustain, bassLine, arp, build } from './kit.js';

const ROOT = ['F1', 'F1', 'Db2', 'Eb2'];
const PROG = ['F4+Ab4+C5', 'F4+Ab4+C5', 'Db4+F4+Ab4', 'Eb4+G4+Bb4'];
const HOOK = 'C6 . . C6 . . Ab5 . | F5 . . . Ab5 . C6 . | Db6 . . Db6 . . Ab5 . | Bb5 . G5 . Eb5 . . . |';

export default {
id: 'riddim-riot',
  urlId: 'drjckuw9y', // 曲ページのURL (music/drjckuw9y/)。公開後は変えない
  title: 'Riddim Riot',
  artist: 'MUSIC LiDAR',
  genre: 'RIDDIM',
  bpm: 150,
  color: '#b0ff3d',
  levels: { easy: 3, normal: 7, hard: 11 },
  preview: 64,
  chart: { normal: { minGap: 0.16 }, hard: { minGap: 0.09, maxNps: 9, minScore: 0.7, chordP: 0.45 } },
  compose(s) {

    const half = { kick: 'X.........X.....', snare: '........X.......', hat: 'x.x.x.x.x.x.x.x.' };
    const wobs = (from, bars, rate = 2) => { for (let b = from; b < from + bars; b++) { const r = ROOT[b % 4].replace(/\d/, (d) => +d + 1); s.wobble(b * 4, r, 0.75, rate); s.wobble(b * 4 + 1, r, 0.75, rate); s.wobble(b * 4 + 2.5, r, 0.5, rate * 2); s.wobble(b * 4 + 3, r, 1, rate * 3); } };
    sustain(s, 'pad', 0, 8, PROG, 0.6); s.seq('bell', 0, 0.5, HOOK + HOOK, 0.7);
    build(s, 6);
    s.crash(32);
    s.drums(8, 16, half); wobs(8, 16); s.seq('square', 32, 0.5, HOOK.repeat(4), 0.85);
    sustain(s, 'pad', 24, 4, PROG, 0.8); s.downer(96, 4); build(s, 26);
    s.crash(112); s.crash(144, 0.8);
    s.drums(28, 16, { ...half, snare: '........X.....X.', hat: 'xxxxxxxxxxxxxxxx' }); wobs(28, 16, 4);
    s.seq('lead', 112, 0.5, HOOK.repeat(4), 1); arp(s, 'pluck', 36, 8, PROG, { step: 0.25, vel: 0.6, order: [0, 1, 2, 3] });
    s.crash(176); s.kick(176); s.wobble(176, 'F2', 2, 1); s.stab(176, ['F4', 'Ab4', 'C5'], 2, 1);
  },
};

// REGGAE / 76 BPM: 3拍目にだけ落ちる「ワンドロップ」と裏打ちのカッティング。のんびり初心者向け
const PROG = ['Gm', 'Gm', 'Cm', 'Cm', 'Eb', 'Eb', 'D', 'D'];
const CH = { Gm: 'Bb3+D4+G4', Cm: 'C4+Eb4+G4', Eb: 'Bb3+Eb4+G4', D: 'A3+D4+F#4' };
const LINE = { Gm: 'G2 . . G2 . . Bb2 . C3 - . . D3 . C3 .', Cm: 'C3 . . C3 . . Eb3 . F3 - . . G3 . F3 .', Eb: 'Eb2 . . Eb2 . . G2 . Bb2 - . . C3 . Bb2 .', D: 'D2 . . D2 . . F#2 . A2 - . . C3 . A2 .' };
const MEL =
  'D5 - - C5 Bb4 - G4 - | . . Bb4 C5 D5 - - - | Eb5 - - D5 C5 - G4 - | C5 - - - . . . . |' +
  'Bb4 - - C5 D5 - G5 - | F5 - Eb5 - D5 - - - | C5 - - D5 Eb5 - D5 C5 | A4 - - - . . . . |';

export default {
  id: 'island-signal',
  urlId: '31nfsb6of', // 曲ページのURL (music/31nfsb6of/)。公開後は変えない
  title: 'Island Signal',
  artist: 'MUSIC LiDAR',
  genre: 'REGGAE',
  bpm: 76,
  color: '#6dff8a',
  levels: { easy: 1, normal: 3, hard: 5 },
  preview: 32,
  chart: { easy: { maxNps: 1.5 }, hard: { minGap: 0.13, maxNps: 5 } },
  compose(s) {
    const skank = (from, bars, vel = 0.55) => {
      for (let b = from; b < from + bars; b++) [1, 3].forEach((o) => CH[PROG[b % 8]].split('+').forEach((n) => s.clav(b * 4 + o, n, 0.25, vel)));
    };
    const organ = (from, bars, vel = 0.4) => { for (let b = from; b < from + bars; b++) [1.5, 3.5].forEach((o) => s.stab(b * 4 + o, CH[PROG[b % 8]].split('+'), 0.2, vel)); };
    const bass = (from, bars) => { for (let b = from; b < from + bars; b++) s.seq('bass', b * 4, 0.25, LINE[PROG[b % 8]], 1); };
    const drop = { kick: '........X.......', snare: '........X.......', hat: 'x.x.x.x.x.x.x.x.' };
    const drop2 = { kick: '........X.......', snare: '........X.....g.', hat: 'x.xxx.x.x.xxx.x.' };

    // intro
    skank(0, 4); s.drums(2, 2, { hat: 'x.x.x.x.x.x.x.x.', snare: '........x.......' });
    // A
    s.drums(4, 8, drop); bass(4, 8); skank(4, 8); s.ghost(() => organ(4, 8));
    s.seq('square', 16, 0.5, MEL, 0.85);
    // B: ダブっぽくベースとドラムだけ
    s.drums(12, 4, drop2); bass(12, 4);
    s.seq('bell', 48, 1, 'D5 - - - | G5 - - - | Eb5 - - - | C5 - - - |', 0.7);
    // A'
    s.crash(64, 0.6);
    s.drums(16, 8, drop2); bass(16, 8); skank(16, 8); s.ghost(() => organ(16, 8));
    s.seq('lead', 64, 0.5, MEL, 0.9);
    s.ghost(() => s.seq('bell', 64, 0.5, MEL, 0.3));
    // outro
    s.drums(24, 3, drop); bass(24, 3); skank(24, 3);
    s.kick(108); s.bass(108, 'G2', 2); s.stab(108, ['Bb3', 'D4', 'G4'], 3, 0.7);
  },
};

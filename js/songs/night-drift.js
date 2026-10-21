// EUROBEAT / 156 BPM: オクターブで跳ねるベースと、走り抜けるシンセのリフ
const PROG = ['A', 'F', 'G', 'A'];
const OCT = { A: ['A1', 'A2'], F: ['F1', 'F2'], G: ['G1', 'G2'], E: ['E1', 'E2'] };
const CH = { A: 'A4+C5+E5', F: 'F4+A4+C5', G: 'G4+B4+D5', E: 'G#4+B4+E5' };
const VERSE =
  'A5 . A5 . G5 . A5 C6 | . A5 . G5 . E5 . . | F5 . F5 . E5 . F5 A5 | . G5 . F5 . E5 D5 . |' +
  'E5 . E5 . D5 . E5 G5 | . E5 . D5 . C5 . . | D5 . E5 . F5 . G5 . | A5 - - - - - . . |';
const CHORUS =
  'E6 - D6 - C6 - D6 - | E6 - - - A5 - - - | F6 - E6 - D6 - E6 - | F6 - - - G6 - - - |' +
  'E6 - D6 - C6 - B5 - | A5 - - - E6 - - - | D6 - C6 - B5 - G5 - | A5 - - - - - - - |';
const RIFF = 'A5 C6 E6 A6 E6 C6 A5 C6 F5 A5 C6 F6 C6 A5 F5 A5 G5 B5 D6 G6 D6 B5 G5 B5 A5 C6 E6 A6 G6 E6 C6 B5';

export default {
  id: 'night-drift',
  urlId: '05jaqhep3', // 曲ページのURL (music/05jaqhep3/)。公開後は変えない
  title: 'Night Drift 95',
  artist: 'MUSIC LiDAR',
  genre: 'EUROBEAT',
  bpm: 156,
  color: '#ffe14f',
  levels: { easy: 4, normal: 7, hard: 11 },
  preview: 112,
  chart: { normal: { minGap: 0.16 }, hard: { minGap: 0.09, maxNps: 9.5 } },
  compose(s) {
    const oct = (from, bars) => {
      for (let b = from; b < from + bars; b++) { const [lo, hi] = OCT[PROG[b % 4]]; for (let i = 0; i < 8; i++) s.bass(b * 4 + i / 2, i % 2 ? hi : lo, 0.4, i % 2 ? 0.8 : 1); }
    };
    const stabs = (from, bars, vel = 0.5) => { for (let b = from; b < from + bars; b++) [0, 1.5, 3].forEach((o) => s.stab(b * 4 + o, CH[PROG[b % 4]].split('+'), 0.5, vel)); };
    const four = { kick: 'X...X...X...X...', hat: '..x...x...x...x.', snare: '....X.......X...' };
    const busy = { kick: 'X...X...X...X...', hat: 'g.x.g.x.g.x.g.xo', clap: '....X.......X...' };

    // intro: リフ
    s.drums(0, 4, { kick: 'X...X...X...X...', hat: '..x...x...x...x.' });
    s.seq('pluck', 0, 0.25, RIFF + ' ' + RIFF, 0.8);
    oct(2, 2);
    // Aメロ
    s.crash(16);
    s.drums(4, 8, four); oct(4, 8); s.ghost(() => stabs(4, 8, 0.35));
    s.seq('lead', 16, 0.5, VERSE, 0.9);
    // Bメロ: リフ
    s.drums(12, 4, four); oct(12, 4);
    s.seq('square', 48, 0.25, RIFF + ' ' + RIFF, 0.85);
    s.riser(56, 8, 0.7);
    // サビ
    s.crash(64); s.crash(96, 0.8);
    s.drums(16, 8, busy); oct(16, 8); stabs(16, 8, 0.45);
    s.seq('supersaw', 64, 0.5, CHORUS, 1);
    // 間奏
    s.drums(24, 4, four); oct(24, 4);
    s.seq('pluck', 96, 0.25, RIFF + ' ' + RIFF, 0.9);
    // Aメロ → サビ
    s.crash(112);
    s.drums(28, 8, four); oct(28, 8); s.ghost(() => stabs(28, 8, 0.35));
    s.seq('lead', 112, 0.5, VERSE, 1);
    s.crash(144); s.crash(176, 0.8);
    s.drums(36, 16, busy); oct(36, 16); stabs(36, 16, 0.45);
    s.seq('supersaw', 144, 0.5, CHORUS, 1);
    s.seq('lead', 176, 0.5, CHORUS, 1);
    s.ghost(() => s.seq('supersaw', 176, 0.5, CHORUS, 0.4));
    // outro
    s.crash(208); s.kick(208); s.bass(208, 'A1', 2); s.stab(208, ['A4', 'C5', 'E5', 'A5'], 3, 0.9);
  },
};

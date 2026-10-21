// SKA PUNK / 176 BPM: 裏打ちのギター、走るパンクのドラム、ホーン隊のメロディ
const PROG = ['C', 'Am', 'F', 'G'];
const CH = { C: 'C4+E4+G4', Am: 'A3+C4+E4', F: 'A3+C4+F4', G: 'B3+D4+G4' };
const PWR = { C: 'C3+G3+C4', Am: 'A2+E3+A3', F: 'F2+C3+F3', G: 'G2+D3+G3' };
const BASS = { C: ['C2', 'E2', 'G2', 'E2'], Am: ['A1', 'C2', 'E2', 'C2'], F: ['F1', 'A1', 'C2', 'A1'], G: ['G1', 'B1', 'D2', 'B1'] };
const HORN =
  'G5 - E5 - C5 - E5 - | A5 - - - G5 - E5 - | F5 - A5 - C6 - A5 - | B5 - - - D6 - - - |' +
  'C6 - B5 - A5 - G5 - | E5 - G5 - A5 - C6 - | A5 - G5 - F5 - A5 - | G5 - - - - - . . |';
const CHORUS =
  'E6 - E6 - D6 - C6 - | C6 - - - A5 - - - | A5 - C6 - F6 - E6 - | D6 - - - - - . . |' +
  'E6 - E6 - D6 - C6 - | E6 - - - G6 - - - | F6 - E6 - D6 - B5 - | C6 - - - - - . . |';

export default {
  id: 'offbeat-skater',
  urlId: '9ktkxk6k0', // 曲ページのURL (music/9ktkxk6k0/)。公開後は変えない
  title: 'Offbeat Skater',
  artist: 'MUSIC LiDAR',
  genre: 'SKA PUNK',
  bpm: 176,
  color: '#5ef2a0',
  levels: { easy: 3, normal: 7, hard: 11 },
  preview: 96,
  chart: { normal: { minGap: 0.17 }, hard: { minGap: 0.09, maxNps: 9, chordP: 0.42 } },
  compose(s) {
    const skank = (from, bars, vel = 0.5) => { for (let b = from; b < from + bars; b++) for (let i = 0; i < 4; i++) s.stab(b * 4 + i + 0.5, CH[PROG[b % 4]].split('+'), 0.2, vel); };
    const power = (from, bars, vel = 0.7) => { for (let b = from; b < from + bars; b++) for (let i = 0; i < 8; i++) s.guitar(b * 4 + i / 2, PWR[PROG[b % 4]].split('+'), 0.4, vel); };
    const bass = (from, bars) => { for (let b = from; b < from + bars; b++) BASS[PROG[b % 4]].forEach((n, i) => s.bass(b * 4 + i, n, 0.8)); };
    const ska = { kick: 'X.......X.......', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const punk = { kick: 'X.x.X.x.X.x.X.x.', snare: '....X.......X...', hat: 'xxxxxxxxxxxxxxxx' };

    // intro: ギターのカウント
    s.drums(0, 1, { hat: 'X...X...X...X...' });
    s.drums(1, 3, ska); skank(1, 3, 0.6); bass(2, 2);
    // Aメロ(スカ)
    s.crash(16);
    s.drums(4, 8, ska); skank(4, 8); bass(4, 8);
    s.seq('square', 16, 0.5, HORN, 0.9);
    // サビ(パンク)
    s.crash(48); s.crash(64, 0.8);
    s.drums(12, 8, punk); power(12, 8, 0.6); bass(12, 8);
    s.seq('gtrlead', 48, 0.5, CHORUS, 1);
    // 間奏: ホーンの掛け合い
    s.drums(20, 4, ska); skank(20, 4); bass(20, 4);
    s.seq('stab', 80, 0.5, 'C5+E5 . C5+E5 . G5+B5 - . . | A4+C5 . A4+C5 . E5+A5 - . . | F4+A4 . F4+A4 . C5+F5 - . . | G4+B4 . G4+B4 . D5+G5 - - - |', 0.8);
    // Aメロ → サビ
    s.crash(96);
    s.drums(24, 8, ska); skank(24, 8); bass(24, 8);
    s.seq('lead', 96, 0.5, HORN, 1);
    s.crash(128); s.crash(144, 0.8);
    s.drums(32, 8, punk); power(32, 8, 0.6); bass(32, 8);
    s.seq('gtrlead', 128, 0.5, CHORUS, 1);
    s.ghost(() => s.seq('square', 128, 0.5, CHORUS, 0.35));
    // ブリッジ: スカに戻って溜める
    s.drums(40, 4, ska); skank(40, 4); bass(40, 4);
    s.seq('square', 160, 0.5, 'C6 - - - G5 - - - | A5 - - - E5 - - - | F5 - - - C6 - - - | D6 - - - - - - - |', 0.9);
    s.drums(43, 1, { kick: 'X.X.X.X.XXXXXXXX', snare: 'x.x.x.x.xxxxxxxx' });
    // ラストのサビ
    s.crash(176); s.crash(192, 0.8);
    s.drums(44, 8, punk); power(44, 8, 0.6); bass(44, 8);
    s.seq('gtrlead', 176, 0.5, CHORUS, 1);
    s.ghost(() => s.seq('square', 176, 0.5, CHORUS, 0.35));
    // outro
    s.crash(208); s.kick(208); s.guitar(208, ['C3', 'G3', 'C4'], 3, 0.9); s.bass(208, 'C2', 3);
  },
};

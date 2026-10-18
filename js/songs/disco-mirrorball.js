// FUNK / DISCO / 118 BPM: 16分のスラップベースとクラビネット、裏打ちハイハット
const SLAP = 'R2 . R3 . . R2 . b3 R3 . f2 . b3 . R3 .'; // R=ルート b=短7度 f=5度(下)
const TONES = { D: { R: 'D', b: 'C', f: 'A' }, G: { R: 'G', b: 'F', f: 'D' }, Bb: { R: 'Bb', b: 'Ab', f: 'F' }, A: { R: 'A', b: 'G', f: 'E' } };
const CLAV = { D: ['F4', 'A4', 'C5', 'E5'], G: ['F4', 'B4', 'D5', 'E5'], Bb: ['D4', 'F4', 'A4', 'C5'], A: ['C#4', 'G4', 'B4', 'E5'] };
const CLAV_PAT = 'x.x..x.x.x..x.x.';
const VAMP = ['D', 'D', 'G', 'G'];
const BRIDGE = ['Bb', 'Bb', 'A', 'A'];
const MELO =
  'A5 - - G5 F5 - D5 - | . . F5 G5 A5 - C6 - | B5 - - A5 G5 - E5 - | . . G5 A5 B5 - D6 - |' +
  'C6 - A5 - G5 - F5 - | E5 - D5 - . . A4 - | B4 - D5 - E5 - G5 - | A5 - - - - - . . |';

export default {
  id: 'disco-mirrorball',
  urlId: 'o2sipqhru', // 曲ページのURL (music/o2sipqhru/)。公開後は変えない
  title: 'Disco Mirrorball',
  artist: 'MUSIC LiDAR',
  genre: 'FUNK / DISCO',
  bpm: 118,
  color: '#ff9de2',
  levels: { easy: 2, normal: 4, hard: 9 },
  preview: 48,
  compose(s) {
    const slap = (from, bars, prog) => {
      for (let b = from; b < from + bars; b++) {
        const t = TONES[prog[b % 4]];
        SLAP.split(' ').forEach((tok, i) => {
          if (tok === '.') return;
          const note = t[tok[0]] + tok[1];
          s.slap(b * 4 + i / 4, note.replace('Bb3', 'Bb2').replace('Ab3', 'Ab2'), 0.22, tok[0] === 'R' && i === 0 ? 1 : 0.8);
        });
      }
    };
    const clav = (from, bars, prog, vel = 0.8) => {
      for (let b = from; b < from + bars; b++) {
        const c = CLAV[prog[b % 4]];
        [...CLAV_PAT].forEach((ch, i) => { if (ch === 'x') c.forEach((n) => s.clav(b * 4 + i / 4, n, 0.16, vel)); });
      }
    };
    const strings = (b, prog) => s.stab(b * 4, CLAV[prog[b % 4]].map((n) => n.replace('4', '5')), 2, 0.7);
    const disco = { kick: 'X...X...X...X...', clap: '....X.......X...', hat: 'g.o.g.o.g.o.g.o.' };

    // intro: ドラム+ベース
    s.drums(0, 4, { kick: 'X...X...X...X...', hat: '..o...o...o...o.' });
    slap(2, 2, VAMP);
    // A: クラビ
    s.crash(16, 0.6);
    s.drums(4, 8, disco); slap(4, 8, VAMP); clav(4, 8, VAMP);
    // B: メロディ
    s.crash(48, 0.7);
    s.drums(12, 8, disco); slap(12, 8, VAMP); s.ghost(() => clav(12, 8, VAMP, 0.5));
    s.seq('lead', 48, 0.5, MELO, 0.9);
    // break: ベースとクラップだけ
    s.drums(20, 4, { clap: '....X.......X...' }); slap(20, 4, VAMP);
    // B again
    s.crash(96);
    s.drums(24, 8, disco); slap(24, 8, VAMP); s.ghost(() => clav(24, 8, VAMP, 0.5));
    s.seq('lead', 96, 0.5, MELO, 1);
    for (let b = 24; b < 32; b += 2) strings(b, VAMP);
    // bridge
    s.drums(32, 4, disco); slap(32, 4, BRIDGE); clav(32, 4, BRIDGE);
    for (let b = 32; b < 36; b += 2) strings(b, BRIDGE);
    s.riser(140, 4, 0.7);
    // last
    s.crash(144);
    s.drums(36, 8, disco); slap(36, 8, VAMP); s.ghost(() => clav(36, 8, VAMP, 0.5));
    s.seq('keys', 144, 0.5, MELO, 1);
    for (let b = 36; b < 44; b += 2) strings(b, VAMP);
    // outro
    s.drums(44, 3, { kick: 'X...X...X...X...', hat: '..o...o...o...o.' }); slap(44, 3, VAMP);
    s.crash(188); s.kick(188); s.slap(188, 'D2', 1); s.stab(188, ['D5', 'F5', 'A5', 'C6'], 2, 1);
  },
};

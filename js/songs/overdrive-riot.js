// ROCK / METAL / 180 BPM: 歪んだギターのリフ、サビはツーバス
const PC = { // パワーコード
  E: ['E2', 'B2', 'E3'], G: ['G2', 'D3', 'G3'], A: ['A2', 'E3', 'A3'], D: ['D2', 'A2', 'D3'],
  C: ['C3', 'G3', 'C4'], B: ['B2', 'F#3', 'B3'], F: ['F#2', 'C#3', 'F#3'],
};
// リフ: 16分ごと。m=Eのブリッジミュート、大文字=そのコードを伸ばす、.=休み
const RIFF = ['m.m.m.G.m.m.A.G.', 'm.m.m.G.m.m.D...', 'm.m.m.G.m.m.A.G.', 'm.mmm.C...B.....'];
const CHORUS = ['E', 'C', 'G', 'D'];
const HOOK =
  'B4 - - - E5 - - - | E5 - D5 - C5 - B4 - | D5 - - - G5 - - - | F#5 - - - - - D5 - |' +
  'B4 - - - E5 - G5 - | A5 - G5 - E5 - D5 - | B4 - - - D5 - E5 - | E5 - - - - - - - |';
const PENTA = ['E5', 'G5', 'A5', 'B5', 'D6', 'E6', 'D6', 'B5', 'A5', 'G5'];

export default {
  id: 'overdrive-riot',
  urlId: 'biub56q78', // 曲ページのURL (music/biub56q78/)。公開後は変えない
  title: 'Overdrive Riot',
  artist: 'MUSIC LiDAR',
  genre: 'ROCK / METAL',
  bpm: 180,
  color: '#ff7a59',
  levels: { easy: 3, normal: 8, hard: 12 },
  preview: 80,
  chart: { normal: { minGap: 0.16 }, hard: { minGap: 0.083, maxNps: 10, chordP: 0.45 } },
  compose(s) {
    const riff = (from, bars, vel = 1) => {
      for (let b = from; b < from + bars; b++) {
        const pat = RIFF[b % 4];
        for (let i = 0; i < 16; i++) {
          const ch = pat[i];
          if (ch === '.') continue;
          if (ch === 'm') s.guitar(b * 4 + i / 4, PC.E.slice(0, 2), 0.18, vel * 0.85);
          else {
            let len = 1;
            while (pat[i + len] === '.' && len < 4) len++;
            s.guitar(b * 4 + i / 4, PC[ch], len / 4, vel);
          }
        }
      }
    };
    const chords = (from, bars, vel = 1) => {
      for (let b = from; b < from + bars; b++) {
        const c = PC[CHORUS[b % 4]];
        s.guitar(b * 4, c, 1.4, vel); s.guitar(b * 4 + 1.5, c, 1, vel * 0.9); s.guitar(b * 4 + 2.5, c, 1.4, vel * 0.9);
      }
    };
    const bassLine = (from, bars, chorus) => {
      for (let b = from; b < from + bars; b++) {
        const r = (chorus ? PC[CHORUS[b % 4]][0] : 'E2').replace('2', '1').replace('3', '2');
        for (let i = 0; i < 8; i++) s.bass(b * 4 + i * 0.5, r, 0.4, 0.85);
      }
    };
    const verse = { kick: 'X.....x.X.x.....', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const chorusDr = { kick: 'xxxxxxxxxxxxxxxx', snare: '....X.......X...', ride: 'x.x.x.x.x.x.x.x.' };

    // intro: リフだけ → ドラム
    riff(0, 4, 0.9);
    s.drums(2, 1, { snare: 'x.x.x.x.x.x.xxxx' });
    s.drums(3, 1, { snare: 'xxxxxxxxxxxxxxxx', kick: 'X...X...X...X...' });
    // verse 1
    s.crash(16);
    s.drums(4, 8, verse); riff(4, 8); bassLine(4, 8, false);
    // chorus 1
    s.crash(48); s.crash(64, 0.8);
    s.drums(12, 8, chorusDr); s.ghost(() => chords(12, 8, 0.85)); bassLine(12, 8, true);
    s.seq('gtrlead', 48, 0.5, HOOK);
    // verse 2
    s.crash(80);
    s.drums(20, 8, verse); riff(20, 8); bassLine(20, 8, false);
    // solo
    s.crash(112);
    s.drums(28, 8, { ...chorusDr, kick: 'X.x.X.x.X.x.X.x.' }); s.ghost(() => chords(28, 8, 0.7)); bassLine(28, 8, true);
    for (let b = 28; b < 36; b++) for (let i = 0; i < 16; i++) {
      if (b % 2 === 1 && i >= 12) { if (i === 12) s.gtrlead(b * 4 + 3, 'E6', 1); continue; }
      s.gtrlead(b * 4 + i / 4, PENTA[(i + b * 3) % PENTA.length], 0.22, 0.9);
    }
    // last chorus
    s.crash(144); s.crash(160, 0.8);
    s.drums(36, 8, chorusDr); s.ghost(() => chords(36, 8, 0.85)); bassLine(36, 8, true);
    s.seq('gtrlead', 144, 0.5, HOOK);
    // outro
    s.drums(44, 1, { kick: 'X...X...X...xxxx', snare: '........xxxxxxxx' });
    s.crash(180); s.kick(180);
    s.guitar(180, PC.E, 3, 1); s.bass(180, 'E1', 3);
    s.gtrlead(180, 'E5', 3, 0.9);
  },
};

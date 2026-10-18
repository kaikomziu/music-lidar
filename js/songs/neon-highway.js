// SYNTHWAVE / 104 BPM: 80年代風。8分のベース、ゲートリバーブのスネア、ポリシンセ
const PAD = ['F3+Ab3+C4', 'Db3+F3+Ab3', 'Ab3+C4+Eb4', 'Eb3+G3+Bb3'];
const ROOT = ['F1', 'Db2', 'Ab1', 'Eb2'];
const ARP = [['F4', 'Ab4', 'C5', 'F5'], ['Db4', 'F4', 'Ab4', 'Db5'], ['Ab4', 'C5', 'Eb5', 'Ab5'], ['Eb4', 'G4', 'Bb4', 'Eb5']];
const VERSE = 'C5 - - - Ab4 - C5 - | F5 - - - Eb5 - Db5 - | C5 - - - Eb5 - Ab5 - | G5 - - - - - - - |';
const CHORUS =
  'C6 - - - Bb5 - Ab5 - | Ab5 - - - F5 - Db5 - | Eb5 - - - F5 - C5 - | Bb4 - - - - - - - |' +
  'C6 - - - Bb5 - C6 - | Db6 - - - C6 - Ab5 - | Bb5 - Ab5 - G5 - Eb5 - | F5 - - - - - - - |';

export default {
  id: 'neon-highway',
  urlId: 'dw1ml3c6t', // 曲ページのURL (music/dw1ml3c6t/)。公開後は変えない
  title: 'Neon Highway',
  artist: 'MUSIC LiDAR',
  genre: 'SYNTHWAVE',
  bpm: 104,
  color: '#ff6b9e',
  levels: { easy: 2, normal: 4, hard: 8 },
  preview: 64,
  compose(s) {
    const pads = (from, bars, vel = 1) => { for (let b = from; b < from + bars; b++) s.pad(b * 4, PAD[b % 4].split('+'), 4, vel); };
    const bass = (from, bars) => {
      for (let b = from; b < from + bars; b++) for (let i = 0; i < 8; i++) s.bass(b * 4 + i * 0.5, ROOT[b % 4].replace(/\d/, (d) => (i % 4 === 3 ? +d + 1 : d)), 0.42, i % 2 ? 0.75 : 0.95);
    };
    const arp = (from, bars, vel = 0.5) => { for (let b = from; b < from + bars; b++) for (let i = 0; i < 16; i++) s.pluck(b * 4 + i / 4, ARP[b % 4][i % 4], 0.2, vel); };
    const brass = (from, bars) => { for (let b = from; b < from + bars; b++) { s.stab(b * 4, PAD[b % 4].split('+').map((n) => n.replace('3', '4')), 1.5, 0.8); s.stab(b * 4 + 2.5, PAD[b % 4].split('+').map((n) => n.replace('3', '4')), 1.2, 0.7); } };
    const beat = { kick: 'X.......X.......', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' };
    const drive = { kick: 'X.......X.x.....', snare: '....X.......X...', hat: 'xxxxxxxxxxxxxxxx' };

    // intro
    pads(0, 4, 0.8);
    arp(0, 4, 0.6);
    s.drums(2, 2, { hat: 'x.x.x.x.x.x.x.x.' });
    // verse
    s.crash(16, 0.6);
    s.drums(4, 8, beat); bass(4, 8); s.ghost(() => pads(4, 8, 0.6));
    s.seq('square', 16, 0.5, VERSE, 0.85);
    s.seq('square', 32, 0.5, VERSE, 0.85);
    // chorus
    s.crash(48);
    s.drums(12, 8, drive); bass(12, 8); s.ghost(() => { pads(12, 8, 0.5); arp(12, 8, 0.3); }); brass(12, 8);
    s.seq('lead', 48, 0.5, CHORUS);
    // verse 2
    s.crash(80, 0.6);
    s.drums(20, 8, beat); bass(20, 8); arp(20, 8, 0.55); s.ghost(() => pads(20, 8, 0.6));
    // break
    pads(28, 4, 1.1);
    s.seq('lead', 112, 0.5, VERSE, 0.7);
    s.drums(31, 1, { snare: '....x...x.x.xxxx' });
    // last chorus
    s.crash(128);
    s.drums(32, 8, drive); bass(32, 8); s.ghost(() => { pads(32, 8, 0.5); arp(32, 8, 0.3); }); brass(32, 8);
    s.seq('lead', 128, 0.5, CHORUS);
    // outro
    pads(40, 4, 0.9); arp(40, 3, 0.5);
    s.drums(40, 2, beat); bass(40, 2);
    s.crash(176); s.kick(176); s.lead(176, 'F5', 3); s.pad(176, ['F3', 'Ab3', 'C4'], 4);
  },
};

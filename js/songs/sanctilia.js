// 音源ファイルを使う曲。
// 音楽: PeriTune「Sanctilia」(造語コーラス。2026-11-15 公開)。https://peritune.com/blog/2026/11/15/sanctilia/
// 2026年3月より後に公開された曲なので CC BY ではなく PeriTune の利用規約(https://peritune.com/about/)で使う。ゲームへの組み込みOK・クレジットは任意(「PeriTune」と書く)・Content ID への登録は禁止
// 音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。
// 譜面: 歌なし(inst)版の音から、chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/sanctilia.txt)で NORMAL〜INFERNO。inst 版は曲としては入れない
import data from './sanctilia.data.js';

export default {
  id: 'sanctilia',
  urlId: 'jofpgqxb7', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: 'Sanctilia',
  artist: 'PeriTune',
  genre: 'ORCHESTRAL', // 造語コーラスの壮大な曲。ジャケットは aurora
  color: '#ffe3a3',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/sanctilia.bin',
  audioKey: 'aes:Oq6d4uxXDwy3FGYDtx8ajxhnqktgnBi1o7p6qy8ACT4=',
  fixedCharts: data.charts,
  levels: { easy: 2, normal: 4, hard: 7, extra: 9, inferno: 11 },
  previewAt: 58.8, // 秒(サビ)
  credit: '音楽:PeriTune「Sanctilia」',
  creditUrl: 'https://peritune.com/blog/2026/11/15/sanctilia/',
};

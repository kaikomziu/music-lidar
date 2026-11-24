// 音源ファイルを使う曲。
// 音楽: ナツメダ ユキ「標めいた、」(歌: 音街ウナ)。https://piapro.jp/YukiNatsumeda
// 作者さんの許可を得て使用(2026-11-24)。音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。歌詞はまだ入れていない。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/shirube-meita.txt)で NORMAL〜INFERNO
import data from './shirube-meita.data.js';

export default {
  id: 'shirube-meita',
  urlId: '9uoqqrxi6', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: '標めいた、',
  artist: 'ナツメダ ユキ',
  genre: 'VOCAL POP',
  color: '#c9a8ff',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/shirube-meita.bin',
  audioKey: 'aes:OLsvGnGpngSaEg2tMjgedi+xhvpWz+3jwdU/ETaECEo=',
  fixedCharts: data.charts,
  levels: { easy: 2, normal: 4, hard: 7, extra: 10, inferno: 11 },
  previewAt: 37.3, // 秒(1番サビ)
  credit: '音楽:ナツメダ ユキ「標めいた、」(歌:音街ウナ)',
  creditUrl: 'https://piapro.jp/YukiNatsumeda',
};

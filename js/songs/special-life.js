// 音源ファイルを使う曲。
// 音楽: 御箸ねくらぁ。「special life」(劇用BGM)。
// 作者さんの許可を得て使用(2026-11-24)。音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。作者さんのリンクはまだないので creditUrl なし。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/special-life.txt)で NORMAL〜INFERNO
import data from './special-life.data.js';

export default {
  id: 'special-life',
  urlId: '5dzexwge4', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: 'special life',
  artist: '御箸ねくらぁ。',
  genre: 'BGM',
  color: '#ffe98a',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/special-life.bin',
  audioKey: 'aes:o3ZKM0pSUKFE8N02lTel7kxU7xtaxCdiyUZdKfFcLWo=',
  fixedCharts: data.charts,
  levels: { easy: 2, normal: 4, hard: 6, extra: 8, inferno: 10 },
  previewAt: 38.4, // 秒
  credit: '音楽:御箸ねくらぁ。「special life」',
};

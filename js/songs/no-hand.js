// 音源ファイルを使う曲。
// 音楽: 御箸ねくらぁ。「no hand」(劇用BGM)。
// 作者さんの許可を得て使用(2026-11-24)。音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。作者さんのリンクはまだないので creditUrl なし。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/no-hand.txt)で NORMAL〜INFERNO
import data from './no-hand.data.js';

export default {
  id: 'no-hand',
  urlId: '8d490gce7', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: 'no hand',
  artist: '御箸ねくらぁ。',
  genre: 'BGM',
  color: '#ffd75e',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/no-hand.bin',
  audioKey: 'aes:0Bqqk9uNzimGGaFzIMDKj5wYifwPQ4Np8vXayM9S01g=',
  fixedCharts: data.charts,
  levels: { easy: 1, normal: 3, hard: 4, extra: 5, inferno: 7 },
  previewAt: 38.5, // 秒
  credit: '音楽:御箸ねくらぁ。「no hand」',
};

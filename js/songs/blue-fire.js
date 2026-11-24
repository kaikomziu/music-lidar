// 音源ファイルを使う曲。
// 音楽: 御箸ねくらぁ。「blue fire」(劇用BGM)。元は前半・後半の2ファイルで、前半の12小節のあとに後半を1拍目がそろうようにつないだ(1.89.1)
// 作者さんの許可を得て使用(2026-11-24)。音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。作者さんのリンクはまだないので creditUrl なし。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/blue-fire.txt)で NORMAL〜INFERNO
import data from './blue-fire.data.js';

export default {
  id: 'blue-fire',
  urlId: 'c4zmhhi1i', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: 'blue fire',
  artist: '御箸ねくらぁ。',
  genre: 'BGM',
  color: '#3fb6ff',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/blue-fire.bin',
  audioKey: 'aes:6teLn+kUUPfp/Ev6B7cN7z7T/15wNjJmdNTEQfTMX4I=',
  fixedCharts: data.charts,
  levels: { easy: 3, normal: 5, hard: 8, extra: 11, inferno: 12 },
  previewAt: 26.2, // 秒(後半のはじめ)
  credit: '音楽:御箸ねくらぁ。「blue fire」',
};

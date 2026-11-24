// 音源ファイルを使う曲。
// 音楽: 御箸ねくらぁ。「blue fire (前半)」(劇用BGM)。
// 作者さんの許可を得て使用(2026-11-24)。音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。作者さんのリンクはまだないので creditUrl なし。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/blue-fire-1.txt)で NORMAL〜INFERNO
import data from './blue-fire-1.data.js';

export default {
  id: 'blue-fire-1',
  urlId: 'c4zmhhi1i', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: 'blue fire (前半)',
  artist: '御箸ねくらぁ。',
  genre: 'BGM',
  color: '#3fb6ff',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/blue-fire-1.bin',
  audioKey: 'aes:RaXVrZK2RlsIXyFsrH5WVyXTF7KNZc9gitSdWj9ZkH4=',
  fixedCharts: data.charts,
  levels: { easy: 3, normal: 4, hard: 8, extra: 10, inferno: 11 },
  previewAt: 8.7, // 秒
  credit: '音楽:御箸ねくらぁ。「blue fire (前半)」',
};

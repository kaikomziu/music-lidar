// 音源ファイルを使う曲。
// 音楽: 御箸ねくらぁ。「anti natalism」(劇用BGM)。
// 作者さんの許可を得て使用(2026-11-24)。音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。作者さんのリンクはまだないので creditUrl なし。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/anti-natalism.txt)で NORMAL〜INFERNO
import data from './anti-natalism.data.js';

export default {
  id: 'anti-natalism',
  urlId: 'bbytwtb5a', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: 'anti natalism',
  artist: '御箸ねくらぁ。',
  genre: 'BGM',
  color: '#6ee08a',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/anti-natalism.bin',
  audioKey: 'aes:MDi9JjQzUddJgkhgL8blINheMQrCxaA9xyGrAR9/ero=',
  fixedCharts: data.charts,
  levels: { easy: 1, normal: 4, hard: 5, extra: 8, inferno: 9 },
  previewAt: 42.7, // 秒
  credit: '音楽:御箸ねくらぁ。「anti natalism」',
};

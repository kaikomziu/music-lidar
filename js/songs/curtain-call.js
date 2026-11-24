// 音源ファイルを使う曲。
// 音楽: 御箸ねくらぁ。「curtain call」(劇用BGM)。
// 作者さんの許可を得て使用(2026-11-24)。音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。作者さんのリンクはまだないので creditUrl なし。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/curtain-call.txt)で NORMAL〜INFERNO
import data from './curtain-call.data.js';

export default {
  id: 'curtain-call',
  urlId: 's7xcrlg2v', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: 'curtain call',
  artist: '御箸ねくらぁ。',
  genre: 'BGM',
  color: '#ff6b7a',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/curtain-call.bin',
  audioKey: 'aes:jVFjuy6ulw16q8l+TleoqzW1g9s9OrJtZXcmmOP5q7c=',
  fixedCharts: data.charts,
  levels: { easy: 3, normal: 4, hard: 8, extra: 11, inferno: 12 },
  previewAt: 46.1, // 秒
  credit: '音楽:御箸ねくらぁ。「curtain call」',
};

// 音源ファイルを使う曲。
// 音楽: 御箸ねくらぁ。「myslee」(劇用BGM)。
// 作者さんの許可を得て使用(2026-11-24)。音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。作者さんのリンクはまだないので creditUrl なし。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/myslee.txt)で NORMAL〜INFERNO
import data from './myslee.data.js';

export default {
  id: 'myslee',
  urlId: 'mj1khntd2', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: 'myslee',
  artist: '御箸ねくらぁ。',
  genre: 'BGM',
  color: '#ff8fc8',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/myslee.bin',
  audioKey: 'aes:j9Tk5WshdzHHO7Ugr9IvLLidi9JFcUvhPlzFo8Y6CDU=',
  fixedCharts: data.charts,
  levels: { easy: 3, normal: 6, hard: 9, extra: 11, inferno: 13 },
  previewAt: 62.0, // 秒
  credit: '音楽:御箸ねくらぁ。「myslee」',
};

// 音源ファイルを使う曲。
// 音楽: ナツメダ ユキ「うつせみ」。https://piapro.jp/YukiNatsumeda
// 作者さんの許可を得て使用(2026-11-24)。音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。歌詞はまだ入れていない。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/utsusemi.txt)で NORMAL〜INFERNO
import data from './utsusemi.data.js';

export default {
  id: 'utsusemi',
  urlId: 'vbtcjbs73', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: 'うつせみ',
  artist: 'ナツメダ ユキ',
  genre: 'VOCAL POP',
  color: '#ffe08a',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/utsusemi.bin',
  audioKey: 'aes:1zAszYKcqtWSUgu9f1JFfAi+jTEeyjMjwJB5W+/8+Jk=',
  fixedCharts: data.charts,
  levels: { easy: 2, normal: 4, hard: 6, extra: 8, inferno: 10 },
  previewAt: 72.4, // 秒(1番サビ)
  credit: '音楽:ナツメダ ユキ「うつせみ」',
  creditUrl: 'https://piapro.jp/YukiNatsumeda',
};

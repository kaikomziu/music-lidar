// 音源ファイルを使う曲。
// 音楽: ナツメダ ユキ「動きだす他人」(歌: 音街ウナ)。https://piapro.jp/YukiNatsumeda
// 作者さんの許可を得て使用(2026-11-24)。音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。歌詞はまだ入れていない。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/ugokidasu-tanin.txt)で NORMAL〜INFERNO
import data from './ugokidasu-tanin.data.js';

export default {
  id: 'ugokidasu-tanin',
  urlId: '8wqee7qk2', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: '動きだす他人',
  artist: 'ナツメダ ユキ',
  genre: 'VOCAL POP',
  color: '#9effc4',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/ugokidasu-tanin.bin',
  audioKey: 'aes:kSDysV51wVNRFgvA0RYHGqr/QW7VP8SELV0WVVpUpAQ=',
  fixedCharts: data.charts,
  levels: { easy: 2, normal: 3, hard: 5, extra: 8, inferno: 10 },
  previewAt: 48.3, // 秒(1番サビ)
  credit: '音楽:ナツメダ ユキ「動きだす他人」(歌:音街ウナ)',
  creditUrl: 'https://piapro.jp/YukiNatsumeda',
};

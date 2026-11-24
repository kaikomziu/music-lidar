// 音源ファイルを使う曲。
// 音楽: ナツメダ ユキ「時間旅行」(歌: 音街ウナ)。https://piapro.jp/YukiNatsumeda
// 作者さんの許可を得て使用(2026-11-24)。音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。歌詞はまだ入れていない。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/jikan-ryokou.txt)で NORMAL〜INFERNO
import data from './jikan-ryokou.data.js';

export default {
  id: 'jikan-ryokou',
  urlId: 'laci35k21', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: '時間旅行',
  artist: 'ナツメダ ユキ',
  genre: 'VOCAL POP',
  color: '#8fd3ff',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/jikan-ryokou.bin',
  audioKey: 'aes:ZmhUfCiyGNRhnUf6wLt/ZvGit9D6HtWUMRgFTonyBmA=',
  fixedCharts: data.charts,
  levels: { easy: 2, normal: 5, hard: 6, extra: 9, inferno: 11 },
  previewAt: 36.3, // 秒(1番サビ)
  credit: '音楽:ナツメダ ユキ「時間旅行」(歌:音街ウナ)',
  creditUrl: 'https://piapro.jp/YukiNatsumeda',
};

// 音源ファイルを使う曲。
// 音楽: ナツメダ ユキ「雷と蜃気楼」(歌: 音街ウナ)。https://piapro.jp/YukiNatsumeda
// 作者さんの許可を得て使用(2026-11-24)。音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。歌詞はまだ入れていない。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/kaminari-to-shinkirou.txt)で NORMAL〜INFERNO
import data from './kaminari-to-shinkirou.data.js';

export default {
  id: 'kaminari-to-shinkirou',
  urlId: 'z4z61numl', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: '雷と蜃気楼',
  artist: 'ナツメダ ユキ',
  genre: 'VOCAL POP',
  color: '#ffd84d',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/kaminari-to-shinkirou.bin',
  audioKey: 'aes:wg1WE/R6VgLxvPTtefCAXuFv9tmCzIW+09MFsPKwG90=',
  fixedCharts: data.charts,
  levels: { easy: 2, normal: 4, hard: 6, extra: 9, inferno: 10 },
  previewAt: 45.7, // 秒(1番サビ)
  credit: '音楽:ナツメダ ユキ「雷と蜃気楼」(歌:音街ウナ)',
  creditUrl: 'https://piapro.jp/YukiNatsumeda',
};

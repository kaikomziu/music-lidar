// 音源ファイルを使う曲。
// 音楽: ナツメダ ユキ「日々の映画」(歌: 音街ウナ)。https://piapro.jp/YukiNatsumeda
// 作者さんの許可を得て使用(2026-11-24)。音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。歌詞はまだ入れていない。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/hibi-no-eiga.txt)で NORMAL〜INFERNO
import data from './hibi-no-eiga.data.js';

export default {
  id: 'hibi-no-eiga',
  urlId: 'pea9dj2sb', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: '日々の映画',
  artist: 'ナツメダ ユキ',
  genre: 'VOCAL POP',
  color: '#ffb36b',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/hibi-no-eiga.bin',
  audioKey: 'aes:DmU3saxgTrIKkyqZLi7WtjHRK+8vxu+PDoqmi81wMN0=',
  fixedCharts: data.charts,
  levels: { easy: 3, normal: 6, hard: 8, extra: 11, inferno: 12 },
  previewAt: 34.3, // 秒(1番サビ)
  credit: '音楽:ナツメダ ユキ「日々の映画」(歌:音街ウナ)',
  creditUrl: 'https://piapro.jp/YukiNatsumeda',
};

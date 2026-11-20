// 音源ファイルを使う曲。
// 音楽: ナツメダ ユキ「暮らし泳ぐ」(歌: 音街ウナ)。https://piapro.jp/YukiNatsumeda
// 音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。
// 歌詞はサーバー(mlidar_lyrics)に置き、管理者が譜面メーカーで時刻を合わせる(lyrics.js)。
import data from './kurashi-oyogu.data.js';

export default {
  id: 'kurashi-oyogu',
  urlId: 'gczx1kw7p', // 曲ページのURL (music/gczx1kw7p/)。公開後は変えない
  title: '暮らし泳ぐ',
  artist: 'ナツメダ ユキ',
  genre: 'VOCAL POP',
  color: '#5ad7c8',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/kurashi-oyogu.bin',
  audioKey: 'aes:yhOYA+KYkg+gEgrKY6qajxV2eunyUOC07NZuiDY9vaU=',
  fixedCharts: data.charts,
  levels: { easy: 2, normal: 4, hard: 6 },
  previewAt: 126, // 秒
  credit: '音楽:ナツメダ ユキ「暮らし泳ぐ」(歌:音街ウナ)',
  creditUrl: 'https://piapro.jp/YukiNatsumeda',
};

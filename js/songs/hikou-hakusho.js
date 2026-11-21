// 音源ファイルを使う曲。
// 音楽: ナツメダ ユキ「飛行白書」(歌: 音街ウナ)。https://piapro.jp/YukiNatsumeda
// 音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。
// 歌詞はまだ入れていない(入れるときはサーバーの mlidar_lyrics に置き、管理者が譜面メーカーで時刻を合わせる。lyrics.js)。
import data from './hikou-hakusho.data.js';

export default {
  id: 'hikou-hakusho',
  urlId: 'p7kamy0sp', // 曲ページのURL (music/p7kamy0sp/)。公開後は変えない
  title: '飛行白書',
  artist: 'ナツメダ ユキ',
  genre: 'VOCAL POP',
  color: '#7fb8ff',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/hikou-hakusho.bin',
  audioKey: 'aes:1aLqAT1vQGW+2P2StnHhS+aHkWvNiGK3Li9DGFI6KFs=',
  fixedCharts: data.charts,
  levels: { easy: 2, normal: 4, hard: 6, extra: 9 }, // EXTRA: layered.py(16分まで)で裏の音も拾った最高難度
  previewAt: 104, // 秒
  credit: '音楽:ナツメダ ユキ「飛行白書」(歌:音街ウナ)',
  creditUrl: 'https://piapro.jp/YukiNatsumeda',
};

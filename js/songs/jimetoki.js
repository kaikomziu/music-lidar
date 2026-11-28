// 音源ファイルを使う曲。
// 音楽: Centipede630 Kosai「じめときしふぇねちるあみん」(feat. 天泣ツネキ。アルバム「人間として生きるのに向いてない。」)。https://www.youtube.com/@Centipede630
// 作者さんの許可を得て使用(2026-11-28)。実況・配信はクレジット必須で OK、収益化はなし(作者さんの指定。streaming.html)。
// 音源は m4a を mp3 にしてから埋め込みのジャケット画像を外し、tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。ジャケットはアルバムの画像(img/jackets/centipede-ningen.jpg。同じアルバムの2曲で共通)。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/jimetoki.txt)で NORMAL〜INFERNO。BPM 150
import data from './jimetoki.data.js';

export default {
  id: 'jimetoki',
  urlId: 'cx89807b8', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: 'じめときしふぇねちるあみん',
  artist: 'Centipede630 Kosai feat. 天泣ツネキ',
  genre: 'VOCAL POP',
  color: '#e8a46a',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/jimetoki.bin',
  audioKey: 'aes:WEHf66UUmF9kWcTZrVPcnJDpx/5lTFEa0rm6+/b2WMI=',
  fixedCharts: data.charts,
  levels: { easy: 3, normal: 6, hard: 10, extra: 12, inferno: 14 },
  previewAt: 64.0, // 秒(サビ)
  jacket: 'img/jackets/centipede-ningen.jpg',
  credit: '音楽:Centipede630 Kosai「じめときしふぇねちるあみん」(歌:天泣ツネキ)',
  creditUrl: 'https://www.youtube.com/@Centipede630',
};

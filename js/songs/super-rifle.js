// 音源ファイルを使う曲。
// 音楽: Centipede630 Kosai「スーパーライフル☆ (feat. 初音ミク)」(2026)。https://www.youtube.com/@Centipede630
// 作者さんの許可を得て使用(2026-11-28)。実況・配信はクレジット必須で OK、収益化はなし(作者さんの指定。streaming.html)。
// 音源は mp3 から埋め込みのジャケット画像を外し、tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。ジャケットは音源に入っていた画像(img/jackets/super-rifle.jpg。512×512)。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/super-rifle.txt)で NORMAL〜INFERNO。BPM 180
import data from './super-rifle.data.js';

export default {
  id: 'super-rifle',
  urlId: 'f66j0qzg6', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: 'スーパーライフル☆',
  artist: 'Centipede630 Kosai feat. 初音ミク',
  genre: 'VOCAL POP',
  color: '#8ff0ee',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/super-rifle.bin',
  audioKey: 'aes:X2OyMFxoW+FU7tCvaIm1Zqstl3gTfLYBaFgWchmpfJg=',
  fixedCharts: data.charts,
  levels: { easy: 4, normal: 7, hard: 10, extra: 13, inferno: 15 },
  previewAt: 64.2, // 秒(サビ)
  jacket: 'img/jackets/super-rifle.jpg',
  credit: '音楽:Centipede630 Kosai「スーパーライフル☆」(歌:初音ミク)',
  creditUrl: 'https://www.youtube.com/@Centipede630',
};

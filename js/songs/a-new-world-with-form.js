// 音源ファイルを使う曲。
// 音楽: Patençial公式「A new world with form」。作者さんの許可を得て使用。実況・配信 OK、収益化 OK。
// ジャケットは作者さんの画像(img/jackets/a-new-world-with-form.jpg)。MV はなし(mv: false)。
// 音源は元の MP3 をそのまま AES-GCM 暗号化(画像を抜くと MP3 の頭の情報が消えて 12ms ずれるため)。
import data from './a-new-world-with-form.data.js';

export default {
  id: 'a-new-world-with-form',
  urlId: 'c2fgjku3h', // 曲ページのURL (music/c2fgjku3h/)。公開後は変えない
  title: 'A new world with form',
  artist: 'Patençial公式',
  genre: 'BGM',
  color: '#3ec6d8',
  bpm: data.bpm,
  offset: data.offset,
  duration: data.duration,
  audio: 'audio/a-new-world-with-form.bin',
  audioKey: 'aes:Y/AE19nDRu8m3Q46xWQW+oI6UUF0tNHzTHURmWlOTLE=',
  fixedCharts: data.charts,
  holdStyle: false,
  levels: { easy: 2, normal: 3, hard: 5, extra: 9, inferno: 11 },
  previewAt: 95.1,
  jacket: 'img/jackets/a-new-world-with-form.jpg',
  mv: false,
  credit: '音楽:Patençial公式「A new world with form」',
};

// 音源ファイルを使う曲。
// 音楽: MARETU「しう」。https://www.youtube.com/@MARETUch
// 作者さんの許可を得て使用(2026-11-23)。実況・配信 OK、収益化 OK。クレジットは「音楽：MARETU」(作者さんの指定)。
// 音源は m4a を mp3 にしてから tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。ジャケットは自動で描く(元のイラストは使わない)。
import data from './maretu-shiu.data.js';

export default {
  id: 'maretu-shiu',
  urlId: 'mtl8qr8zf', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: 'しう',
  artist: 'MARETU',
  genre: 'VOCAL POP',
  color: '#8ab4ff',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/maretu-shiu.bin',
  audioKey: 'aes:wujpANikSvy4MLdHBBnW8wTXjeOLnazcmQFdFILfK/k=',
  fixedCharts: data.charts,
  levels: { easy: 2, normal: 5, hard: 8, extra: 10 }, // EXTRA: layered.py で裏の音も拾った最高難度
  previewAt: 238.5, // 秒
  credit: '音楽：MARETU',
  creditUrl: 'https://www.youtube.com/@MARETUch',
};

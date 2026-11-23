// 音源ファイルを使う曲。
// 音楽: MARETU「ニャン」(feat. 初音ミク)。https://www.youtube.com/@MARETUch
// 作者さんの許可を得て使用(2026-11-23)。実況・配信 OK、収益化 OK。クレジットは「音楽：MARETU」(作者さんの指定)。
// 音源は m4a を mp3 にしてから tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。ジャケットは自動で描く(元のイラストは使わない)。
import data from './maretu-nyan.data.js';

export default {
  id: 'maretu-nyan',
  urlId: 'htut7q7lv', // 曲ページのURL (music/<urlId>/)。公開後は変えない
  title: 'ニャン',
  artist: 'MARETU',
  genre: 'VOCAL POP',
  color: '#ffd04a',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/maretu-nyan.bin',
  audioKey: 'aes:eydbVecEQEXFcrEAE5JuGufiKvgsBLn4T6N3kWaqGO0=',
  fixedCharts: data.charts,
  levels: { easy: 3, normal: 6, hard: 9, extra: 11, inferno: 12 }, // EXTRA: layered.py で裏の音も拾った最高難度
  previewAt: 152.3, // 秒
  credit: '音楽：MARETU',
  creditUrl: 'https://www.youtube.com/@MARETUch',
};

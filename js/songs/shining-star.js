// 音源ファイルを使う曲。
// 音楽: 魔王魂「シャイニングスター」 https://maou.audio/ (フリー素材。利用時はクレジット表記が必要)
// 譜面は音源を解析して BPM 158 の16分グリッドに合わせて作ったもの(shining-star.data.js)。
import data from './shining-star.data.js';

export default {
  id: 'shining-star',
  title: 'シャイニングスター',
  artist: '魔王魂',
  genre: 'POP',
  color: '#ffcf4a',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/shining-star.mp3',
  fixedCharts: data.charts,
  levels: { easy: 3, normal: 6, hard: 9 },
  previewAt: 71.43, // 秒
  credit: '音楽:魔王魂',
  creditUrl: 'https://maou.audio/',
};

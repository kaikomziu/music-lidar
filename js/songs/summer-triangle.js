// 音源ファイルを使う曲。
// 音楽: しゃろう「SUMMER TRIANGLE」 OpenTracks の音源利用ライセンスによる(ゲームでの利用は可、クレジット表記は不要)。
// ライセンスで「利用者が音源ファイルを簡単に取り出して複製できる状態」が禁止されているので、
// 音源は tools/scramble_audio.py で並べ替えた .bin で置き、ゲーム内で元に戻して鳴らす。
// 「音源を聴かせることが主な目的のもの」への利用も禁止なので、「きくだけ」モードには入れない。
import data from './summer-triangle.data.js';

export default {
  id: 'summer-triangle',
  urlId: 'fzkavq172', // 曲ページのURL (music/fzkavq172/)。公開後は変えない
  title: 'SUMMER TRIANGLE',
  artist: 'しゃろう',
  genre: 'POP',
  color: '#5ec8ff',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/summer-triangle.bin',
  audioKey: 'S7CP9fF9wowsoGJywol1Mr1E',
  fixedCharts: data.charts,
  levels: { easy: 4, normal: 8, hard: 11 },
  previewAt: 40, // 秒
  credit: '音楽:しゃろう「SUMMER TRIANGLE」(OpenTracks)',
  creditUrl: 'https://opentracks.com/',
};

// 音源ファイルを使う曲。
// 音楽: 御箸ねくらぁ。「Crying Red」(ゲームで使ってよい BGM。https://youtu.be/PWKgh4ZqHTg)。
// 音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。
// 譜面は tools/audiochart の chart.py を CHART_FAST=1 で作ったもの(曲全体の音量がほぼ一定で、ふつうに作ると全小節が最大密度になるため)。
import data from './crying-red.data.js';

export default {
  id: 'crying-red',
  urlId: '3a3etz1pw', // 曲ページのURL (music/3a3etz1pw/)。公開後は変えない
  title: 'Crying Red',
  artist: '御箸ねくらぁ。',
  genre: 'CHIPTUNE',
  color: '#ff3d5a',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/crying-red.bin',
  audioKey: 'aes:Z2mu/j7uX8GTgBzIX6NU7K+InjyXWrWFjFWbSJBUDBY=',
  fixedCharts: data.charts,
  levels: { easy: 2, normal: 5, hard: 8 },
  previewAt: 88, // 秒
  credit: '音楽:御箸ねくらぁ。「Crying Red」',
  creditUrl: 'https://youtu.be/PWKgh4ZqHTg',
};

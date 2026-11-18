// 音源ファイルを使う曲。
// 音楽: 全て蝶々の所為です。「Hydrangea」。ライセンス: CC BY 4.0(クレジットを書けば、収益化も含めて自由に使える)。
// CC BY は「受け取った人の権利を技術的な手段で制限してはいけない」決まりがあるので、音源は並べ替えず mp3 のまま置く(audioKey なし)。
// 譜面は tools/audiochart で、音源の立ち上がりを低・中・高の帯域ごとに拾い、BPM 125 の16分格子にそろえ、メロディの高さでレーンを決めたもの(hydrangea.data.js)。
import data from './hydrangea.data.js';

export default {
  id: 'hydrangea',
  urlId: '87g9303l3', // 曲ページのURL (music/87g9303l3/)。公開後は変えない
  title: 'Hydrangea',
  artist: '全て蝶々の所為です。',
  genre: 'ELECTRO POP',
  color: '#9b8cff',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/hydrangea.mp3',
  fixedCharts: data.charts,
  levels: { easy: 3, normal: 7, hard: 10 },
  previewAt: 52, // 秒(いちばん盛り上がる所)
  credit: '音楽:全て蝶々の所為です。「Hydrangea」(CC BY 4.0)',
  creditUrl: 'https://creativecommons.org/licenses/by/4.0/deed.ja',
};

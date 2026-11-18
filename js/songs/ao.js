// 音源ファイルを使う曲。
// 音楽: 全て蝶々の所為です。「蒼」(歌: 東北きりたん / NEUTRINO)。ライセンス: CC BY 4.0(クレジットを書けば、収益化も含めて自由に使える)。
// CC BY は「受け取った人の権利を技術的な手段で制限してはいけない」決まりがあるので、音源は並べ替えず mp3 のまま置く(audioKey なし)。
// 譜面は tools/audiochart で、音源の立ち上がりを低・中・高の帯域ごとに拾い、BPM 125 の16分格子にそろえ、メロディの高さでレーンを決めたもの(ao.data.js)。
import data from './ao.data.js';

export default {
  id: 'ao',
  urlId: '74y0rubvz', // 曲ページのURL (music/74y0rubvz/)。公開後は変えない
  title: '蒼',
  artist: '全て蝶々の所為です。',
  genre: 'VOCAL POP',
  color: '#3f8cff',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/ao.mp3',
  fixedCharts: data.charts,
  levels: { easy: 4, normal: 7, hard: 10 },
  previewAt: 168, // 秒(いちばん盛り上がる所)
  credit: '音楽:全て蝶々の所為です。「蒼」(CC BY 4.0)',
  creditUrl: 'https://creativecommons.org/licenses/by/4.0/deed.ja',
};

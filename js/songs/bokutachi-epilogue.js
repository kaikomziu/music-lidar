// 音源ファイルを使う曲。
// 音楽: ああああ「僕たちの旅とエピローグ。」(Long ver.。アルバム「セーブデータとほうき星」より。購入した音源)。
// ガイドライン: ゲーム開発者が非商用の公式コンテンツとして使う場合は事前許諾なく無償で利用可(水の追憶と同じ作者さん)。
// 収益化(広告など)をするときは、配布元の contact から連絡が必要。
// 音源は MP3(192kbps)にして tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置く。平文の音源は置かない。
// 譜面は音源の立ち上がりを低・中・高の帯域ごとに拾い、BPM 91.415 の16分格子にそろえたもの(bokutachi-epilogue.data.js)。
// 静かな所が長いので平均の密度は低め。EXTRA は layered.py(16分まで)で裏の音も拾った最高難度。
import data from './bokutachi-epilogue.data.js';

export default {
  id: 'bokutachi-epilogue',
  urlId: 'uuvzz03he', // 曲ページのURL (music/uuvzz03he/)。公開後は変えない
  title: '僕たちの旅とエピローグ。',
  artist: 'ああああ',
  genre: 'BGM',
  color: '#ffb86b',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/bokutachi-epilogue.bin',
  audioKey: 'aes:wQKaP8t7ifNNMa+qovhUqlOzYs8kJnzfSk35kUEs4xo=',
  fixedCharts: data.charts,
  levels: { easy: 1, normal: 3, hard: 5, extra: 9, inferno: 10 },
  previewAt: 215.5, // 秒(いちばん盛り上がる所)
  credit: '音楽:ああああ「僕たちの旅とエピローグ。」',
};

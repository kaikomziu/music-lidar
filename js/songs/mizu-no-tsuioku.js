// 音源ファイルを使う曲。
// 音楽: ああああ「水の追憶」(インスト)。ガイドライン: ゲーム開発者が非商用の公式コンテンツとして使う場合は事前許諾なく無償で利用可(使用時は一報をもらえると嬉しい、とのこと)。
// 収益化(広告など)をするときは、配布元の contact から連絡が必要。
// 譜面は音源の立ち上がりを低・中・高の帯域ごとに拾い、BPM 126.685 の16分格子にそろえ、メロディの高さでレーンを決めたもの(mizu-no-tsuioku.data.js)。
import data from './mizu-no-tsuioku.data.js';

export default {
  id: 'mizu-no-tsuioku',
  urlId: 'zc1esfmlm', // 曲ページのURL (music/zc1esfmlm/)。公開後は変えない
  title: '水の追憶',
  artist: 'ああああ',
  genre: 'PIANO ELECTRONICA',
  color: '#4fc3ff',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/mizu-no-tsuioku.bin', // そのままでは再生できないよう並べ替えた音源(tools/scramble_audio.py)
  audioKey: 'iPG627z5ohlSbfp08E7awoRBIZnYBIE5',
  fixedCharts: data.charts,
  levels: { easy: 3, normal: 6, hard: 9, extra: 11 }, // EXTRA: layered.py で裏の音も拾った最高難度
  previewAt: 157.5, // 秒(いちばん盛り上がる所)
  credit: '音楽:ああああ「水の追憶」',
};

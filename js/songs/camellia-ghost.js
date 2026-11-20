// 音源ファイルを使う曲。
// 音楽: かめりあ(Camellia)「GHOST」。ゲームでの使用は作者さんから許可をもらっている(2026-11-20)。
// 音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。
// 譜面は tools/audiochart の chart.py を CHART_FAST=1 で作ったもの(キーボードで叩ける細かさ: HARD は8分まで・同じキーの8分連打なし)。
import data from './camellia-ghost.data.js';

export default {
  id: 'camellia-ghost',
  urlId: '5ztnwsn3a', // 曲ページのURL (music/5ztnwsn3a/)。公開後は変えない
  title: 'GHOST',
  artist: 'かめりあ(Camellia)',
  genre: 'ELECTRONIC',
  color: '#9d7bff',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/camellia-ghost.bin',
  audioKey: 'aes:sKmtHS+3tyiP7FiZDVV3ODkO8MKvm68tw4SPRtpsnZo=',
  fixedCharts: data.charts,
  levels: { easy: 2, normal: 4, hard: 8 },
  previewAt: 90, // 秒
  credit: '音楽:かめりあ(Camellia)「GHOST」',
};

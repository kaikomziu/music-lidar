// 音源ファイルを使う曲。
// 音楽: かめりあ(Camellia)「GHOST (2020 Halloween+++++++++ VIP)」。ゲームでの使用は作者さんから許可をもらっている(2026-11-20)。
// 音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。期間限定にはしない(いつでも遊べる)。
// 譜面: EASY は chart.py(CHART_FAST=1)、NORMAL・HARD は tools/audiochart/layered.py で裏の音も拾って重ねた高難易度(左手=キック・ベース、右手=シンセ・声・ハット)。
// 刻みは8分まで・同じキーの8分連打なし(キーボードで叩ける細かさ)。
import data from './camellia-ghost-vip.data.js';

export default {
  id: 'camellia-ghost-vip',
  urlId: 'fd6d2knmn', // 曲ページのURL (music/fd6d2knmn/)。公開後は変えない
  title: 'GHOST (2020 Halloween+++++++++ VIP)',
  artist: 'かめりあ(Camellia)',
  genre: 'ELECTRONIC',
  color: '#ff8a3d',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/camellia-ghost-vip.bin',
  audioKey: 'aes:dXTX9FhlNu9b36X//ao4LrR9kvyhfhM4ht5E2PvUwf8=',
  fixedCharts: data.charts,
  levels: { easy: 3, normal: 9, hard: 14 },
  previewAt: 86, // 秒
  credit: '音楽:かめりあ(Camellia)「GHOST (2020 Halloween+++++++++ VIP)」',
};

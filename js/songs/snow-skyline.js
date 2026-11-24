// 音源ファイルを使う曲。
// 音楽: ナツメダ ユキ「スノウスカイライン」(歌: 音街ウナ)。https://piapro.jp/YukiNatsumeda
// 作者さんの許可を得て使用(2026-11-24)。音源は tools/encrypt_audio.mjs で AES-GCM 暗号化した .bin で置き、ゲーム内(js/external-audio.js)で復号して鳴らす。平文の音源は置かない。
// 「きくだけ」モードには入れない(player.js はクレジットのある曲を入れない)。歌詞はまだ入れていない。
// 歌あり(snow-skyline)と off vocal(snow-skyline-off)は長さも時刻も同じなので、譜面は同じ snow-skyline.data.js を使う(歌ありの音から作った)。ランキングは別
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/snow-skyline.txt)で NORMAL〜INFERNO
import data from './snow-skyline.data.js';

export default {
  id: 'snow-skyline',
  urlId: 'rl0js2vig', // 曲ページのURL (music/rl0js2vig/)。公開後は変えない
  title: 'スノウスカイライン',
  artist: 'ナツメダ ユキ',
  genre: 'VOCAL POP',
  color: '#bfe6ff',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/snow-skyline.bin',
  audioKey: 'aes:jwEGfGEslbmn0kGfsbcApvDFAhKxmINTgwOiFj5w8vE=',
  fixedCharts: data.charts,
  levels: { easy: 2, normal: 5, hard: 6, extra: 9, inferno: 11 },
  previewAt: 64.3, // 秒(1番サビ)
  credit: '音楽:ナツメダ ユキ「スノウスカイライン」(歌:音街ウナ)',
  creditUrl: 'https://piapro.jp/YukiNatsumeda',
};

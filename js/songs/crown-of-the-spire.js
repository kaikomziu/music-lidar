// 音源ファイルを使う曲。
// 音楽: Patençial公式「Crown Of The Spire」。作者さんの許可を得て使用(A new world with form と同じ。実況・配信 OK、収益化 OK)。
// MV はなし(mv: false。A new world with form と同じ)。ジャケットは自動で描く。
// 音源は元の MP3 をそのまま AES-GCM 暗号化(A new world with form と同じ。画像などを抜くと MP3 の頭の情報が変わって時刻がずれることがあるため)。
// 譜面: chart.py で EASY、varied.py(区切りの表 tools/audiochart/sections/crown-of-the-spire.txt)で NORMAL〜INFERNO
import data from './crown-of-the-spire.data.js';

export default {
  id: 'crown-of-the-spire',
  urlId: '15n9km9j4', // 曲ページのURL (music/15n9km9j4/)。公開後は変えない
  title: 'Crown Of The Spire',
  artist: 'Patençial公式',
  genre: 'BGM',
  color: '#e8b04a',
  bpm: data.bpm,
  offset: data.offset,
  duration: data.duration,
  audio: 'audio/crown-of-the-spire.bin',
  audioKey: 'aes:c6+hR/rYThI0msj5feATE+hWA7iDqzECl7IkDbOElfc=',
  fixedCharts: data.charts,
  levels: { easy: 1, normal: 3, hard: 5, extra: 7, inferno: 9 },
  previewAt: 53.8, // 秒
  mv: false,
  credit: '音楽:Patençial公式「Crown Of The Spire」',
};

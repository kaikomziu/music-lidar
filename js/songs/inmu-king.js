// 音源ファイルを使う曲。
// 音楽: YAJU-MC(やじゅまん)「INMU KING」 ニコニ・コモンズ nc499430 https://commons.nicovideo.jp/works/nc499430
// 利用条件: 非収益での転載・複製・無料再配布・ゲームへの組み込みは事前連絡なしで可(配布ページの「その他独自に定める条件」より)。
// 譜面は音源を解析して BPM 133 の16分グリッドに合わせて作ったもの(inmu-king.data.js)。
import data from './inmu-king.data.js';

export default {
  id: 'inmu-king',
  urlId: '9t5h981d9', // 曲ページのURL (music/9t5h981d9/)。公開後は変えない
  title: 'INMU KING',
  artist: 'YAJU-MC(やじゅまん)',
  genre: 'HIP HOP',
  color: '#ff4f4f',
  bpm: data.bpm,
  offset: data.offset, // 1拍目の位置(秒)
  duration: data.duration,
  audio: 'audio/inmu-king.mp3',
  fixedCharts: data.charts,
  levels: { easy: 3, normal: 7, hard: 10 },
  previewAt: 70, // 秒
  credit: '音楽:YAJU-MC(やじゅまん)「INMU KING」 ニコニ・コモンズ nc499430',
  creditUrl: 'https://commons.nicovideo.jp/works/nc499430',
};

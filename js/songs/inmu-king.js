// 音源ファイルを使う曲。
// 音楽: YAJU-MC(やじゅまん)「INMU KING」 ニコニ・コモンズ nc499430 https://commons.nicovideo.jp/works/nc499430
// 利用条件: 非収益での転載・複製・無料再配布・ゲームへの組み込みは事前連絡なしで可(配布ページの「その他独自に定める条件」より)。
// MV: YAJU-MC が個別に配布している映像素材を、曲の頭にそろえて切り出したもの(video/inmu-king.bin に並べ替えて保存。js/mv.js の VIDEO_MVS で元に戻して再生)
// 譜面は歌声(原曲 − オフボーカル)の音節に合わせ、BPM 133 の16分グリッドにそろえたもの(inmu-king.data.js)。
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
  audio: 'audio/inmu-king.bin',
  audioKey: 'xbrgE5EWB89kvsep46gSDTYcp5sAw3wz',
  fixedCharts: data.charts,
  levels: { easy: 2, normal: 6, hard: 9, extra: 11, inferno: 12 }, // EXTRA: layered.py で裏の音も拾った最高難度
  previewAt: 70, // 秒
  credit: '音楽:YAJU-MC(やじゅまん)「INMU KING」 ニコニ・コモンズ nc499430',
  creditUrl: 'https://commons.nicovideo.jp/works/nc499430',
};

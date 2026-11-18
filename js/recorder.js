// 縦型のプレイ動画(ショート・TikTok・リール向け 1080×1920)
// しくみ: プレイ画面(#stage)の真ん中を切り抜いて、上に曲名、下にスコアを足した別の canvas に毎フレーム描き、
//         その canvas と曲の音(audio.js の recordTap)を MediaRecorder で録る。mp4 が録れるブラウザは mp4、ほかは webm
import { recordTap } from './audio.js';

const W = 1080, H = 1920;
let armed = false;
let rec = null; // { mr, chunks, tap, raf, entry }
let lastVideo = null; // { blob, name }

export const recordSupported = () => typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream;
export const arm = () => { armed = true; };
export const isArmed = () => armed;
export const lastRecording = () => lastVideo;

function pickType() {
  const list = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return list.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
}

// game: 遊んでいる Game、stage: #stage、info: { entry, label, jacket(URL) }
export function startRecording(game, stage, info) {
  if (!armed || !recordSupported()) return false;
  armed = false;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const jacket = new Image();
  jacket.src = info.jacket;
  const color = info.entry.color || '#5ef2ff';
  const draw = () => {
    rec.raf = requestAnimationFrame(draw);
    // 背景
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#05071a'); bg.addColorStop(0.5, '#0a0f2c'); bg.addColorStop(1, '#05071a');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // プレイ画面の真ん中を切り抜く
    const sw = stage.width, sh = stage.height;
    if (sw && sh) {
      const cw = Math.min(sw, sh * 0.82);
      const dh = Math.min(1340, W * sh / cw);
      g.drawImage(stage, (sw - cw) / 2, Math.max(0, sh - cw * dh / W), cw, Math.min(sh, cw * dh / W), 0, 330, W, dh);
      g.fillStyle = color; g.fillRect(0, 326, W, 4); g.fillRect(0, 330 + dh, W, 4);
    }
    // 上: 曲名
    if (jacket.complete && jacket.naturalWidth) g.drawImage(jacket, 60, 70, 200, 200);
    g.strokeStyle = color; g.lineWidth = 4; g.strokeRect(60, 70, 200, 200);
    g.textBaseline = 'alphabetic';
    g.fillStyle = 'rgba(200,215,255,0.85)'; g.font = '700 34px "Orbitron", "Noto Sans JP", sans-serif';
    g.fillText('MUSIC LiDAR', 300, 110);
    g.fillStyle = '#fff'; g.font = '800 62px "Noto Sans JP", "Orbitron", sans-serif';
    let title = info.entry.title;
    while (g.measureText(title).width > W - 340 && title.length > 3) title = title.slice(0, -2) + '…';
    g.fillText(title, 300, 192);
    g.fillStyle = color; g.font = '700 34px "Orbitron", "Noto Sans JP", sans-serif';
    g.fillText(info.label, 300, 250);
    // 下: スコアとコンボ
    const y0 = 1700;
    g.fillStyle = 'rgba(200,215,255,0.7)'; g.font = '700 30px "Orbitron", sans-serif';
    g.fillText('SCORE', 60, y0 - 70); g.fillText('COMBO', 700, y0 - 70);
    g.fillStyle = '#fff'; g.font = '800 92px "Orbitron", sans-serif';
    g.save(); g.shadowColor = color; g.shadowBlur = 24;
    g.fillText(String(game.score || 0).padStart(7, '0'), 60, y0 + 20);
    g.fillText(String(game.combo || 0), 700, y0 + 20);
    g.restore();
    g.fillStyle = 'rgba(200,215,255,0.8)'; g.font = '600 34px "Noto Sans JP", sans-serif';
    g.fillText('music-lidar.com ・ 無料・インストール不要', 60, H - 70);
  };
  const tap = recordTap();
  const stream = new MediaStream([...cv.captureStream(30).getVideoTracks(), ...tap.stream.getAudioTracks()]);
  const type = pickType();
  const mr = new MediaRecorder(stream, type ? { mimeType: type, videoBitsPerSecond: 6e6 } : undefined);
  const chunks = []; // 止めたあとにも最後のデータが届くので、rec ではなくここにためる
  rec = { mr, chunks, tap, raf: 0, entry: info.entry, type: mr.mimeType || type };
  mr.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
  mr.start(1000);
  draw();
  return true;
}

export const recording = () => !!rec;

// 録画を終えて { blob, name } を返す(録っていなければ null)
export function stopRecording() {
  if (!rec) return Promise.resolve(null);
  const r = rec;
  rec = null;
  cancelAnimationFrame(r.raf);
  return new Promise((res) => {
    r.mr.onstop = () => {
      r.tap.stop();
      const ext = /mp4/.test(r.type) ? 'mp4' : 'webm';
      const blob = new Blob(r.chunks, { type: r.type.split(';')[0] || 'video/webm' });
      lastVideo = { blob, name: `music-lidar-${r.entry.id}.${ext}` };
      res(lastVideo);
    };
    try { r.mr.stop(); } catch { r.tap.stop(); res(null); }
  });
}

// 録った動画を共有(スマホ)か保存
export async function saveVideo(v, toast) {
  const file = new File([v.blob], v.name, { type: v.blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], text: 'MUSIC LiDAR #MUSICLiDAR https://music-lidar.com/' }); return; } catch (e) { if (e?.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(v.blob); a.download = v.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
  toast?.(`動画を保存しました(${v.name})`);
}

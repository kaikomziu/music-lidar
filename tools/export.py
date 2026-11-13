# 内蔵曲(自作曲)の音声を mp3、MV を mp4 に書き出す。
#   python tools/export.py              … まだ書き出していない曲だけ書き出す(ふだんはこれ)
#   python tools/export.py id1 id2      … 指定した曲を書き出し直す(曲を作り直したとき)
#   python tools/export.py --all        … 全曲を書き出し直す
# 出力先は D:\MUSIC_LiDAR_export(mp3/ と mp4/)。--out で変えられる。
# 仕組み: このスクリプトがローカルサーバーを立ててブラウザで tools/export.html を開く。
# ページが曲を合成・MVを描画してサーバーへ送り、サーバーが ffmpeg で mp3 / mp4 にする。
# 音源ファイルの曲(def.audio がある INMU KING など)はライセンスのある外部音源なので対象外。
import argparse, json, os, shutil, subprocess, sys, threading, webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument('ids', nargs='*', help='書き出し直す曲の id(省略時は未書き出しの曲だけ)')
ap.add_argument('--all', action='store_true', help='全曲を書き出し直す')
ap.add_argument('--out', default=r'D:\MUSIC_LiDAR_export')
ap.add_argument('--port', type=int, default=8795)
ap.add_argument('--no-open', action='store_true', help='ブラウザを自動で開かない(URLだけ表示)')
args = ap.parse_args()

FF = shutil.which('ffmpeg')
if not FF:
    try:
        import imageio_ffmpeg
        FF = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        sys.exit('ffmpeg が見つかりません(winget install Gyan.FFmpeg などで入れてください)')

OUT = args.out
MP3, MP4, TMP = (os.path.join(OUT, d) for d in ('mp3', 'mp4', '_tmp'))
for d in (MP3, MP4, TMP): os.makedirs(d, exist_ok=True)
videos = {}  # name -> 一時フレームファイルの情報
done = threading.Event()
jobs, errors = [], []  # ffmpeg の変換は裏で走らせて、ページは次の曲へ進む(速くするため)

def run_bg(label, cmd, cleanup=None):
    def work():
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode: errors.append(f'{label}: {r.stderr[-300:]}'); print(f'  失敗 {label}: {r.stderr[-200:]}', flush=True)
        else:
            print(f'  完成 {label}', flush=True)
            if cleanup: os.remove(cleanup)
    t = threading.Thread(target=work); t.start(); jobs.append(t)

def meta_args(q):
    out = []
    for k in ('title', 'artist', 'album', 'genre', 'track'):
        if k in q: out += ['-metadata', f'{k}={q[k]}']
    return out

def safe(name):
    return ''.join(ch for ch in name if ch not in '\\/:*?"<>|').strip()

class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw): super().__init__(*a, directory=ROOT, **kw)
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')  # 曲を直した直後でも最新を読む
        super().end_headers()
    def reply(self, obj, code=200):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(b)))
        self.end_headers(); self.wfile.write(b)
    def body(self):
        return self.rfile.read(int(self.headers.get('Content-Length', 0)))

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == '/x/config':  # ページに渡す設定と、もう書き出してあるファイルの一覧
            return self.reply({'ids': args.ids, 'all': args.all, 'out': OUT,
                               'mp3': sorted(os.listdir(MP3)), 'mp4': sorted(os.listdir(MP4))})
        return super().do_GET()

    def do_POST(self):
        u = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        name = safe(q.get('name', 'x'))
        data = self.body()  # 先に全部読む(途中で失敗しても接続が切れないように)
        try:
            if u.path == '/x/wav':  # WAV → mp3(WAV は mp4 用に一時保存)
                wav = os.path.join(TMP, name + '.wav')
                open(wav, 'wb').write(data)
                run_bg(name + '.mp3', [FF, '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '320k',
                                       *meta_args(q), os.path.join(MP3, name + '.mp3')])
                return self.reply({'ok': True})
            if u.path == '/x/vstart':  # JPEG フレームをいったん一時ファイルにためる
                path = os.path.join(TMP, name + '.mjpeg')
                videos[name] = {'f': open(path, 'wb'), 'path': path, 'q': q}
                return self.reply({'ok': True})
            if u.path == '/x/vframe':
                videos[name]['f'].write(data)
                return self.reply({'ok': True})
            if u.path == '/x/vend':  # フレーム + 音声 → mp4
                v = videos.pop(name)
                v['f'].close()
                wav = os.path.join(TMP, name + '.wav')
                run_bg(name + '.mp4', [FF, '-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', v['q'].get('fps', '30'),
                                       '-i', v['path'], '-i', wav, '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p',
                                       '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', *meta_args(v['q']),
                                       os.path.join(MP4, name + '.mp4')], cleanup=v['path'])
                return self.reply({'ok': True})
            if u.path == '/x/log':  # ページからの進み具合をターミナルに表示
                print(data.decode('utf-8', errors='replace'), flush=True)
                return self.reply({'ok': True})
            if u.path == '/x/done':
                print(data.decode('utf-8', errors='replace'), flush=True)
                self.reply({'ok': True})
                done.set()
                return
            self.reply({'ok': False, 'err': 'unknown'}, 404)
        except Exception as e:
            self.reply({'ok': False, 'err': str(e)}, 500)

srv = ThreadingHTTPServer(('127.0.0.1', args.port), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{args.port}/tools/export.html'
print(f'書き出し先: {OUT}')
print(f'書き出しページ: {url}  (このタブは閉じずに、終わるまでそのままにしてください)', flush=True)
if not args.no_open: webbrowser.open(url)
done.wait()
print('ffmpeg の変換が終わるのを待っています…', flush=True)
for t in jobs: t.join()
shutil.rmtree(TMP, ignore_errors=True)
print('失敗: ' + ' / '.join(errors) if errors else 'すべて完了しました', flush=True)
srv.shutdown()

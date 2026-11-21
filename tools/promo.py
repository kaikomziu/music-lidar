# TikTok などの宣伝動画(縦 1080×1920・15〜20秒の mp4)を作る。
#   python tools/promo.py            … tools/promo-plan.json の全部を作る
#   python tools/promo.py 1 4 9      … plan の 1・4・9 番目だけ作る(1 から数える)
#   python tools/promo.py --page trailer.html … 横 1920×1080・2分半の紹介動画(tools/trailer.html)を1本作る
# 出力先は D:\MUSIC_LiDAR_export\promo(--out で変えられる)。ファイル名は promo-01-auto-<曲id>.mp4 など。
# 仕組み: tools/export.py と同じ。このスクリプトがローカルサーバーを立ててブラウザで tools/promo.html を開き、
#   ページが曲を合成・プレイ画面とMVを描いて WAV と JPEG フレームを送り、ここで ffmpeg が mp4 にする。
# オリジナル曲(音源ファイルのない曲)だけを使う。ほかの作者さんの曲は宣伝に使う許可がないため。
import argparse, json, os, shutil, subprocess, sys, threading, webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument('only', nargs='*', type=int, help='作る番号(promo-plan.json の何番目か。1 から)')
ap.add_argument('--out', default=r'D:\MUSIC_LiDAR_export\promo')
ap.add_argument('--port', type=int, default=8796)
ap.add_argument('--no-open', action='store_true', help='ブラウザを自動で開かない(URLだけ表示)')
ap.add_argument('--sfx', default=r'C:\Users\4yoma\Desktop\04_音楽・動画\動画編集\効果音', help='効果音のフォルダ(/sfx/ で配る。素材は再配布禁止のものがあるのでリポジトリにはコピーしない)')
ap.add_argument('--page', default='promo.html', help='開くページ(promo.html = 縦の宣伝動画 / trailer.html = 横の紹介動画)')
args = ap.parse_args()

FF = shutil.which('ffmpeg')
if not FF:
    try:
        import imageio_ffmpeg
        FF = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        sys.exit('ffmpeg が見つかりません(winget install Gyan.FFmpeg などで入れてください)')

OUT = args.out
TMP = os.path.join(OUT, '_tmp')
os.makedirs(TMP, exist_ok=True)
videos = {}
done = threading.Event()
jobs, errors = [], []

def run_bg(label, cmd, cleanup=()):
    def work():
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode: errors.append(f'{label}: {r.stderr[-300:]}'); print(f'  失敗 {label}: {r.stderr[-200:]}', flush=True)
        else:
            print(f'  完成 {label}', flush=True)
            for p in cleanup:
                try: os.remove(p)
                except OSError: pass
    t = threading.Thread(target=work); t.start(); jobs.append(t)

def safe(name):
    return ''.join(ch for ch in name if ch.isalnum() or ch in '-_').strip() or 'x'

class H(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw): super().__init__(*a, directory=ROOT, **kw)
    def log_message(self, *a): pass
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def reply(self, obj, code=200):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(b)))
        self.end_headers(); self.wfile.write(b)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == '/x/config':
            return self.reply({'only': args.only, 'out': OUT})
        if u.path.startswith('/sfx/'):  # 手元の効果音(紹介動画用)。フォルダの外は読ませない
            from urllib.parse import unquote
            base = os.path.realpath(args.sfx)
            f = os.path.realpath(os.path.join(base, unquote(u.path[5:])))
            if not f.startswith(base + os.sep) or not os.path.isfile(f):
                self.send_response(404); self.end_headers(); return
            data = open(f, 'rb').read()
            self.send_response(200); self.send_header('Content-Type', 'audio/mpeg'); self.send_header('Content-Length', str(len(data))); self.end_headers()
            self.wfile.write(data); return
        return super().do_GET()

    def do_POST(self):
        u = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        name = safe(q.get('name', 'x'))
        data = self.rfile.read(int(self.headers.get('Content-Length', 0)))
        try:
            if u.path == '/x/wav':
                open(os.path.join(TMP, name + '.wav'), 'wb').write(data)
                return self.reply({'ok': True})
            if u.path == '/x/vstart':
                path = os.path.join(TMP, name + '.mjpeg')
                videos[name] = {'f': open(path, 'wb'), 'path': path, 'q': q}
                return self.reply({'ok': True})
            if u.path == '/x/vframe':
                videos[name]['f'].write(data)
                return self.reply({'ok': True})
            if u.path == '/x/vend':  # フレーム + 音声 → mp4(TikTok 向け: H.264 / AAC / 30fps / yuv420p)
                v = videos.pop(name)
                v['f'].close()
                wav = os.path.join(TMP, name + '.wav')
                run_bg(name + '.mp4', [FF, '-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', v['q'].get('fps', '30'),
                                       '-i', v['path'], '-i', wav, '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p',
                                       '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
                                       '-metadata', 'title=' + v['q'].get('title', name), '-metadata', 'artist=MUSIC LiDAR',
                                       os.path.join(OUT, name + '.mp4')], cleanup=(v['path'], wav))
                return self.reply({'ok': True})
            if u.path in ('/x/log', '/x/done'):
                print(data.decode('utf-8', errors='replace'), flush=True)
                self.reply({'ok': True})
                if u.path == '/x/done': done.set()
                return
            self.reply({'ok': False, 'err': 'unknown'}, 404)
        except Exception as e:
            self.reply({'ok': False, 'err': str(e)}, 500)

srv = ThreadingHTTPServer(('127.0.0.1', args.port), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{args.port}/tools/{args.page}'
print(f'書き出し先: {OUT}')
print(f'書き出しページ: {url}  (このタブは閉じずに、終わるまでそのままにしてください)', flush=True)
if not args.no_open: webbrowser.open(url)
done.wait()
print('ffmpeg の変換が終わるのを待っています…', flush=True)
for t in jobs: t.join()
shutil.rmtree(TMP, ignore_errors=True)
print('失敗: ' + ' / '.join(errors) if errors else 'すべて完了しました', flush=True)
srv.shutdown()

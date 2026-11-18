# tools/og.html が作った画像を受け取って music/<urlId>/og.jpg に保存するだけのローカルサーバー(開発用)
# 使い方: python tools/og_save_server.py 8766 "C:/Users/4yoma/Desktop/Claude/music-lidar"
import http.server, re, sys, os
ROOT = sys.argv[2]
class H(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def cors(self):
        self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Methods', 'POST'); self.send_header('Access-Control-Allow-Headers', '*')
    def do_POST(self):
        m = re.fullmatch(r'/save/([a-z0-9]{6,16})', self.path)
        if not m: self.send_response(400); self.cors(); self.end_headers(); return
        n = int(self.headers['Content-Length']); data = self.rfile.read(n)
        d = os.path.join(ROOT, 'music', m.group(1))
        if not os.path.isdir(d): self.send_response(404); self.cors(); self.end_headers(); return
        open(os.path.join(d, 'og.jpg'), 'wb').write(data)
        self.send_response(200); self.cors(); self.end_headers(); self.wfile.write(b'ok')
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), H).serve_forever()

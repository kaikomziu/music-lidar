"""公開前に実行: アセットにバージョンを付けて、古いHTMLと新しいJSが混ざらないようにする。

  python tools/release.py

- index.html の <meta name="app-version">、CSS/JSの ?v=、import map を新しいバージョンに書き換える
- version.json を更新する(ページ側が起動時に no-store で読み、HTMLが古ければ自動で読み直す)
"""
import json
import pathlib
import re
from datetime import datetime, timedelta, timezone

root = pathlib.Path(__file__).resolve().parent.parent
v = datetime.now(timezone(timedelta(hours=9))).strftime('%Y%m%d%H%M%S')

js = sorted(p.relative_to(root).as_posix() for p in (root / 'js').rglob('*.js'))
imports = {f'./{f}': f'./{f}?v={v}' for f in js}
importmap = '<script type="importmap">' + json.dumps({'imports': imports}, ensure_ascii=False) + '</script>'

html_path = root / 'index.html'
html = html_path.read_text(encoding='utf-8')
html, n1 = re.subn(r'<meta name="app-version" content="[^"]*">', f'<meta name="app-version" content="{v}">', html)
html, n2 = re.subn(r'<!--IMPORTMAP-->.*?<!--/IMPORTMAP-->', lambda m: f'<!--IMPORTMAP-->{importmap}<!--/IMPORTMAP-->', html, flags=re.S)
html, n3 = re.subn(r'href="css/style\.css(\?v=[^"]*)?"', f'href="css/style.css?v={v}"', html)
html, n4 = re.subn(r'src="js/main\.js(\?v=[^"]*)?"', f'src="js/main.js?v={v}"', html)
assert (n1, n2, n3, n4) == (1, 1, 1, 1), (n1, n2, n3, n4)
html_path.write_text(html, encoding='utf-8', newline='\n')
(root / 'version.json').write_text(json.dumps({'v': v}) + '\n', encoding='utf-8', newline='\n')
print('version', v, '/', len(js), 'modules')

# 曲ごとのページ(music/<urlId>/)とサイトマップを作り直す
import subprocess
subprocess.run(['node', str(root / 'tools' / 'build-pages.mjs')], check=True)

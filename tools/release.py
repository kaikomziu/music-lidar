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

# 特製MV(js/mv/*.js)の一覧を js/mv.js の MV_INDEX に書き込む(曲を遊ぶときに、どのファイルを読むか)
mv_index = {}
for f in sorted((root / 'js' / 'mv').glob('*.js')):
    src = f.read_text(encoding='utf-8')
    body = src[src.rfind('export default {'):]
    for sid in re.findall(r"^\s*'([a-z0-9-]+)'\s*:", body, flags=re.M):
        mv_index[sid] = f.stem
mv_path = root / 'js' / 'mv.js'
mv_src = mv_path.read_text(encoding='utf-8')
mv_src, n_mv = re.subn(r'const MV_INDEX = \{[^}]*\};', 'const MV_INDEX = ' + json.dumps(mv_index, ensure_ascii=False) + ';', mv_src)
assert n_mv == 1, n_mv
mv_path.write_text(mv_src, encoding='utf-8', newline='\n')

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

# 起動を速くする: main.js から静的に import される全モジュールを <link rel="modulepreload"> で先に読み始める
# (import をたどると5段の待ち合わせになるので、HTMLを読んだ時点で並行して取りに行く)
def static_graph(start):
    seen, stack = [], [start]
    pat = re.compile(r'''(?:^|\n)\s*import\s+(?:[^'"]*?\s+from\s+)?['"](\.{1,2}/[^'"]+)['"]''')
    while stack:
        f = stack.pop()
        if f in seen:
            continue
        seen.append(f)
        src = (root / f).read_text(encoding='utf-8')
        for i in pat.findall(src):
            stack.append(((root / f).parent / i).resolve().relative_to(root).as_posix())
    return seen
mods = [m for m in static_graph('js/main.js') if m != 'js/main.js']
preload = ''.join(f'<link rel="modulepreload" href="{m}?v={v}">' for m in sorted(mods))
html, n5 = re.subn(r'<!--PRELOAD-->.*?<!--/PRELOAD-->', lambda m: f'<!--PRELOAD-->{preload}<!--/PRELOAD-->', html, flags=re.S)
assert n5 == 1, n5
html_path.write_text(html, encoding='utf-8', newline='\n')
# 読みもののページ(遊び方・配信ガイドラインなど)の共通 CSS・JS にもバージョンを付ける(まとめページは guide.html から写す)
for page in ['guide.html', 'streaming.html', 'submit-music.html', 'credits.html', 'music-guidelines.html']:
    pp = root / page
    src = pp.read_text(encoding='utf-8')
    src, a = re.subn(r'href="css/pages\.css(\?v=[^"]*)?"', f'href="css/pages.css?v={v}"', src)
    src, b = re.subn(r'src="js/page-nav\.js(\?v=[^"]*)?"', f'src="js/page-nav.js?v={v}"', src)
    assert (a, b) == (1, 1), (page, a, b)
    pp.write_text(src, encoding='utf-8', newline='\n')
(root / 'version.json').write_text(json.dumps({'v': v}) + '\n', encoding='utf-8', newline='\n')
print('version', v, '/', len(js), 'modules')

# 曲ごとのページ(music/<urlId>/)とサイトマップを作り直す
import subprocess
subprocess.run(['node', str(root / 'tools' / 'build-pages.mjs')], check=True)

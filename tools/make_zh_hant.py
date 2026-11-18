# js/i18n-zh-hans.js(簡体字)から js/i18n-zh-hant.js(繁体字・台湾の言い回し)を作る
# 使い方: pip install opencc-python-reimplemented → python tools/make_zh_hant.py
import re, pathlib
from opencc import OpenCC
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'js' / 'i18n-zh-hans.js').read_text(encoding='utf-8')
cc = OpenCC('s2twp')
head, body = src.split('export default {', 1)
# キー(日本語)はそのまま、値だけを変換する
body = re.sub(r"'([^']*)'\s*:\s*'([^']*)'", lambda m: f"'{m.group(1)}': '{cc.convert(m.group(2))}'", body)
out = "// 中国語(繁体字)の辞書。tools/make_zh_hant.py が i18n-zh-hans.js から自動で作る(直接編集しない)\nexport default {" + body
(root / 'js' / 'i18n-zh-hant.js').write_text(out, encoding='utf-8')
print('ok')

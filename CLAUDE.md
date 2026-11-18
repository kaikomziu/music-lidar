# MUSIC LiDAR

- 作業の前に、まず `docs/ARCHITECTURE.md`(仕組みの解説)を読む。コード全体を読み直さなくてよいように書いてある
- 解説に書いていないことが必要になったら、コードを読んでから `docs/ARCHITECTURE.md` に追記する。仕組みを変えたら、同じコミットで解説も直す
- 公開の手順(changelog → `python tools/release.py` → `git fetch` → `git add -A -- . ':!AI_GUIDE.md'` → push)は解説の「11. 作業のルール」にある。`AI_GUIDE.md` はコミットしない

# 音源ファイルを、そのままでは再生できない .bin に並べ替える(ゲーム内の js/main.js unscramble() で元に戻す)
# 使い方: python tools/scramble_audio.py 入力.mp3 audio/出力.bin 鍵の文字列
# ライセンスで「音源ファイルを利用者が簡単に取り出せる状態」を禁止している曲に使う
import sys
src, dst, key = sys.argv[1], sys.argv[2], sys.argv[3].encode('utf-8')
data = bytearray(open(src, 'rb').read())
for i in range(len(data)):
    data[i] ^= key[i % len(key)] ^ ((i >> 8) & 255)
open(dst, 'wb').write(data)
print(dst, len(data), 'bytes')

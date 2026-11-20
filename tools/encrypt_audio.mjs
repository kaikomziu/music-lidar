// 音源ファイルを AES-GCM(256bit・ランダムな鍵)で暗号化した .bin にする(ゲーム内の js/external-audio.js で元に戻す)
// 使い方: node tools/encrypt_audio.mjs 入力.mp3 audio/出力.bin
// 出力の形は [iv 12バイト][暗号文+認証タグ]。表示される鍵(aes:...)を曲ファイルの audioKey に書く
// ※ 鍵はゲームのJSに入るので、遊ぶ人のブラウザで元に戻す以上、完全な防止ではない(そのままでは取り出せない、という仕組み)
import { readFileSync, writeFileSync } from 'fs';
import { webcrypto as crypto } from 'crypto';

const [src, dst] = process.argv.slice(2);
if (!src || !dst) { console.error('使い方: node tools/encrypt_audio.mjs 入力 出力.bin'); process.exit(1); }
const data = readFileSync(src);
const raw = crypto.getRandomValues(new Uint8Array(32));
const iv = crypto.getRandomValues(new Uint8Array(12));
const key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
const out = new Uint8Array(12 + ct.length);
out.set(iv); out.set(ct, 12);
writeFileSync(dst, out);
console.log(dst, out.length, 'bytes');
console.log('audioKey: aes:' + Buffer.from(raw).toString('base64'));

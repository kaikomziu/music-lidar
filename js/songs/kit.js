// 曲づくりの小道具(いくつかの曲で共用)。拍(beat)単位、1小節=4拍
import { toMidi } from '../composer.js';

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const nameOf = (m) => NAMES[m % 12] + (Math.floor(m / 12) - 1);
// 音名を半音ずらす / オクターブ上げる
export const tr = (n, semis) => nameOf(toMidi(n) + semis);
export const up = (n, oct = 1) => tr(n, 12 * oct);
export const ch = (c) => (Array.isArray(c) ? c : c.split('+'));
const MULTI = new Set(['pad', 'stab', 'guitar']);

// 16ステップのパターンで鳴らす。'X'=強 'x'=普通。長さは次の発音まで(len で固定も可)
// notesOf(bar) は音名の配列を返す
export function pattern(s, type, from, bars, pat, notesOf, { vel = 0.6, len = null } = {}) {
  const p = pat.replace(/[\s|]/g, '');
  for (let b = from; b < from + bars; b++) {
    const notes = ch(notesOf(b));
    for (let i = 0; i < 16; i++) {
      const c = p[i];
      if (c !== 'x' && c !== 'X') continue;
      let j = i + 1;
      while (j < 16 && p[j] !== 'x' && p[j] !== 'X') j++;
      const d = len ?? ((j - i) / 4) * 0.9;
      const v = vel * (c === 'X' ? 1 : 0.8);
      if (MULTI.has(type)) s[type](b * 4 + i / 4, notes, d, v);
      else notes.forEach((n) => s[type](b * 4 + i / 4, n, d, v));
    }
  }
}

// 1小節ずつ和音を伸ばす(パッドなど)
export function sustain(s, type, from, bars, prog, vel = 0.6, beats = 4) {
  for (let b = from; b < from + bars; b++) {
    const notes = ch(prog[b % prog.length]);
    for (let k = 0; k < 4; k += beats) {
      if (MULTI.has(type)) s[type](b * 4 + k, notes, beats, vel);
      else notes.forEach((n) => s[type](b * 4 + k, n, beats, vel));
    }
  }
}

// ベース。pat の文字: X/x=ルート o=1オクターブ上 f=5度 .=休
export function bassLine(s, from, bars, roots, pat = 'X...X...X...X...', { type = 'bass', vel = 1, len = null } = {}) {
  const p = pat.replace(/[\s|]/g, '');
  for (let b = from; b < from + bars; b++) {
    const r = roots[b % roots.length];
    for (let i = 0; i < 16; i++) {
      const c = p[i];
      if (!c || c === '.') continue;
      let j = i + 1;
      while (j < 16 && p[j] === '.') j++;
      const n = c === 'o' ? up(r) : c === 'f' ? tr(r, 7) : r;
      s[type](b * 4 + i / 4, n, len ?? ((j - i) / 4) * 0.85, vel * (c === 'X' ? 1 : 0.85));
    }
  }
}

// アルペジオ。order は和音の何番目の音を順に鳴らすか(和音より大きい番号は1オクターブ上)
export function arp(s, type, from, bars, prog, { step = 0.25, vel = 0.6, order = [0, 1, 2, 1], oct = 0, len = null } = {}) {
  const per = Math.round(4 / step);
  for (let b = from; b < from + bars; b++) {
    const c = ch(prog[b % prog.length]);
    for (let i = 0; i < per; i++) {
      const k = order[i % order.length];
      const n = up(c[k % c.length], oct + Math.floor(k / c.length));
      s[type](b * 4 + i * step, n, len ?? step * 0.9, vel * (i % 4 === 0 ? 1 : 0.8));
    }
  }
}

// スネアロールの盛り上げ(2小節)+ ライザー
export function build(s, bar, bars = 2) {
  s.drums(bar, Math.max(1, bars - 1), { snare: 'x...x...x.x.x.x.' });
  s.drums(bar + bars - 1, 1, { snare: 'xxxxxxxxxxxxxxxx' });
  s.riser(bar * 4, bars * 4, 0.7);
}

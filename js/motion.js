// 画面全体の細かい動き(イージング・アニメーション)
// - モーダル: 閉じるときもすっと消える(「on」が外れたら少しの間だけ「closing」で表示を残す)
// - コイン: 数字が増減するときにカウントアップする
// - ボタン: 押した所から光の波紋が広がる
// - 選曲: 曲を変えるとジャケットと曲名が入れ替わるように動く
// 「視差効果を減らす」設定の端末では動きを止める
const REDUCED = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const easeOutCubic = (x) => 1 - (1 - x) ** 3;

// --- モーダルを閉じるアニメーション ---
function watchOverlays() {
  const mo = new MutationObserver((list) => {
    for (const m of list) {
      const el = m.target, was = (m.oldValue || '').split(/\s+/).includes('on');
      if (was && !el.classList.contains('on') && !REDUCED) {
        el.classList.add('closing');
        clearTimeout(el._closeT);
        el._closeT = setTimeout(() => el.classList.remove('closing'), 220);
      } else if (el.classList.contains('on')) el.classList.remove('closing');
    }
  });
  for (const el of document.querySelectorAll('.overlay')) mo.observe(el, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
}

// --- 数字のカウントアップ(コインなど) ---
const tweens = new WeakMap();
export function tweenNumber(el, to, ms = 600, fmt = (v) => Math.round(v).toLocaleString()) {
  // 前の値。まだ数字が出ていない(「-」など)ときは、最初の表示なのでそのまま出す
  const from = tweens.get(el)?.value ?? parseInt(String(el.textContent).replace(/[^\d-]/g, ''), 10);
  cancelAnimationFrame(tweens.get(el)?.raf);
  if (REDUCED || from === to || !Number.isFinite(from)) { el.textContent = fmt(to); tweens.set(el, { value: to }); return; }
  const t0 = performance.now(), st = { value: from };
  tweens.set(el, st);
  el.classList.remove('num-up', 'num-down'); void el.offsetWidth; el.classList.add(to > from ? 'num-up' : 'num-down');
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    st.value = from + (to - from) * easeOutCubic(k);
    el.textContent = fmt(st.value);
    if (k < 1) st.raf = requestAnimationFrame(step); else st.value = to;
  };
  st.raf = requestAnimationFrame(step);
}

// --- ボタンの波紋 ---
const RIPPLE = '.btn-glow, .btn-play, .btn-line, .h-tile, .diff-btn, .chip';
function ripples() {
  document.addEventListener('pointerdown', (ev) => {
    const b = ev.target.closest(RIPPLE);
    if (!b || b.disabled || REDUCED) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2;
    const i = document.createElement('i');
    i.className = 'ripple';
    i.style.cssText = `width:${s}px;height:${s}px;left:${ev.clientX - r.left - s / 2}px;top:${ev.clientY - r.top - s / 2}px`;
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
    b.classList.add('has-ripple');
    b.appendChild(i);
    setTimeout(() => i.remove(), 650);
  }, { passive: true });
}

// --- 要素のアニメーションをもう一度再生する(内容を入れ替えたとき) ---
export function replay(el, cls) {
  if (!el || REDUCED) return;
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
}

export function initMotion() {
  watchOverlays();
  ripples();
}

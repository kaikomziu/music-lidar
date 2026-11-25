// ホームの大きい枠(ヒーロー)を数秒ごとに切り替える(2026-11-25〜)
// LIVE(#h-live)のあとに、ドックの各機能の大きいスライドを作って順に見せる。
// スライドを押すと、ドックの同じタイルを押したのと同じ動きになる(ログインが要るものはログイン画面など、今までどおり)
const $ = (id) => document.getElementById(id);
const INTERVAL = 5000; // 1枚を見せる時間(ミリ秒)

// ドックのタイル → スライドの中身(英語の見出し・色)
const SLIDES = [
  { sel: '#btn-charts', kick: 'COMMUNITY', title: 'CHARTS', color: '#ff7ce6' },
  { sel: '#btn-maker', kick: 'EDITOR', title: 'MAKER', color: '#5ef2ff' },
  { sel: '#btn-player', kick: 'LISTEN', title: 'MUSIC', color: '#7fd8ff' },
  { sel: '[data-nav="team"]', kick: 'UNIT', title: 'TEAM', color: '#6dffb0' },
  { sel: '[data-nav="gacha"]', kick: 'SCAN', title: 'GACHA', color: '#ffd25e' },
  { sel: '[data-nav="quest"]', kick: 'MISSION', title: 'QUEST', color: '#ff9a5c' },
  { sel: '#btn-pass', kick: 'SEASON', title: 'PASS', color: '#c49bff' },
  { sel: '.h-discord', kick: 'COMMUNITY', title: 'DISCORD', color: '#9aa3ff' },
];

export function initHomeHero({ isHome }) {
  const hero = $('h-hero'), bars = $('h-hero-bars'), dock = $('h-dock');
  if (!hero || !bars || !dock) return;
  const slides = [{ el: $('h-live'), tile: null }];
  for (const s of SLIDES) {
    const tile = dock.querySelector(s.sel);
    if (!tile) continue;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'h-tile h-slide h-slide-feature';
    el.style.setProperty('--tc', s.color);
    el.innerHTML = `<span class="hs-art" aria-hidden="true">${tile.querySelector('.h-ico svg')?.outerHTML || ''}<i></i><i></i></span>
      <div class="h-label"><small>${s.kick}</small><b>${s.title}</b><span>${tile.querySelector('.h-label span')?.textContent || ''}</span></div>
      <p></p><em class="h-go">OPEN ▶</em>`;
    el.tabIndex = -1;
    el.addEventListener('click', () => tile.click());
    hero.insertBefore(el, bars);
    slides.push({ el, tile });
  }
  // 下の細い棒(押すとその1枚へ)。今の棒は時間に合わせて伸びる
  bars.innerHTML = slides.map((_, i) => `<button type="button" class="hh-bar" aria-label="${i + 1}枚目"><i></i></button>`).join('');
  const barEls = [...bars.children];
  barEls.forEach((b, i) => b.addEventListener('click', (ev) => { ev.stopPropagation(); show(i); }));

  let cur = 0, timer = 0, paused = false;
  function fill(s) {
    if (!s.tile) return;
    // 説明文やログインの状態は JS が書き換えるので、見せるたびに写す
    s.el.querySelector('p').textContent = s.tile.querySelector('p')?.textContent || '';
    s.el.classList.toggle('locked', s.tile.classList.contains('locked'));
  }
  function show(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, k) => {
      if (k === cur) fill(s);
      s.el.classList.toggle('on', k === cur);
      s.el.tabIndex = k === cur ? 0 : -1;
      s.tile?.classList.toggle('h-cur', k === cur); // ドックの同じアイコンを光らせる
    });
    barEls.forEach((b, k) => { b.classList.toggle('on', k === cur); b.classList.toggle('done', k < cur); });
    restart();
  }
  function restart() {
    clearTimeout(timer);
    const bar = barEls[cur]?.querySelector('i');
    if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
    hero.classList.toggle('paused', paused);
    if (!paused) timer = setTimeout(() => { if (isHome() && !document.hidden && !hero.matches(':hover')) show(cur + 1); else restart(); }, INTERVAL);
  }
  // マウスを乗せている間・LIVE のモード選択を開いている間は止める
  const pause = (on) => { paused = on; restart(); };
  hero.addEventListener('mouseenter', () => pause(true));
  hero.addEventListener('mouseleave', () => pause(false));
  hero.addEventListener('focusin', () => pause(true));
  hero.addEventListener('focusout', () => pause(false));
  show(0);
}

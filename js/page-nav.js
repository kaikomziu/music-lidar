// 読みもののページ(遊び方・曲のまとめ・配信ガイドライン・楽曲募集・使用ガイドライン・クレジット)の共通の動き(2026-11-25〜)
// - 上に、ページどうしを行き来するナビを足す(タイトル画面のウィンドウ = iframe の中では出さない)
// - 下の線で、どこまで読んだかを出す
// - 章の見出し・表・箱が画面に入ったら、すっと出す
// 見た目は css/pages.css
(() => {
  const inFrame = window.top !== window;
  const root = document.documentElement;
  if (inFrame) root.classList.add('in-frame');
  const LINKS = [
    ['guide.html', '遊び方・収録曲'], ['collections/', '曲のまとめ'], ['streaming.html', '実況・配信ガイドライン'],
    ['submit-music.html', '楽曲募集'], ['music-guidelines.html', '曲の使用ガイドライン'], ['credits.html', 'クレジット'],
  ];
  function addNav() {
    const here = location.pathname.replace(/\/index\.html$/, '/');
    const nav = document.createElement('nav');
    nav.className = 'pg-nav';
    nav.setAttribute('aria-label', 'MUSIC LiDAR のページ');
    nav.innerHTML = `<a class="pg-brand" href="./"><i aria-hidden="true"><b></b><b></b><b></b><b></b></i><span>MUSIC LiDAR</span></a>
      <div class="pg-links">${LINKS.map(([href, name]) => `<a href="${href}">${name}</a>`).join('')}</div>
      <a class="pg-play" href="./">▶ PLAY</a>`;
    // 今いるページに印(曲のまとめは、その下のページでも印を付ける)
    for (const a of nav.querySelectorAll('.pg-links a')) {
      const p = new URL(a.getAttribute('href'), document.baseURI).pathname;
      if (p.endsWith('/') ? here.startsWith(p) : here === p) a.classList.add('on');
    }
    document.body.prepend(nav);
    const on = nav.querySelector('.pg-links a.on');
    if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    // 読んだところまで線を伸ばす
    const prog = () => {
      const max = root.scrollHeight - innerHeight;
      nav.style.setProperty('--pg-progress', (max > 0 ? Math.min(100, (scrollY / max) * 100) : 0) + '%');
    };
    addEventListener('scroll', prog, { passive: true });
    prog();
  }
  function reveal() {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = [...document.querySelectorAll('.wrap > h2, .wrap > .box, .wrap > .table-wrap, .wrap > form, .wrap > .dc-banner')];
    const io = new IntersectionObserver((ents) => {
      for (const e of ents) if (e.isIntersecting) { e.target.classList.add('pg-in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px' });
    for (const el of els) {
      // 最初から見えているものは隠さない(読み込んだ瞬間にちらつかないように)
      if (el.getBoundingClientRect().top < innerHeight) continue;
      el.classList.add('pg-reveal');
      io.observe(el);
    }
  }
  // ロゴの <small> が「MUSIC」(前に付く)か「CREDITS」など(後ろの札)かを分ける
  function tagLogo() {
    const logo = document.querySelector('.logo');
    const sm = logo?.querySelector('small');
    if (sm && logo.firstChild === sm) sm.classList.add('pre');
  }
  const start = () => { tagLogo(); if (!inFrame) addNav(); reveal(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

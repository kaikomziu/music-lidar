// 読みもののページ(遊び方・曲のまとめ・配信ガイドライン・楽曲募集・使用ガイドライン・クレジット)の共通の動き(2026-11-25〜)
// - 上に、ページどうしを行き来するナビを足す(タイトル画面のウィンドウ = iframe の中では出さない)
// - 下の線で、どこまで読んだかを出す
// - 章の見出し・表・箱が画面に入ったら、すっと出す
// - 収録曲の表(data-filter)に検索・絞り込み・並べ替えを付ける
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
  // 収録曲の表(data-filter のある .table-wrap)に、検索・ジャンル・レベル・BPM の絞り込みと並べ替えを付ける
  // 行の data-c(まとめの種類)・data-lv(HARD のレベル)・data-bpm は tools/build-pages.mjs が書く
  const GENRES = [['', 'すべて'], ['beginner', 'やさしい'], ['pop', 'ポップ'], ['rock', 'ロック'], ['edm', 'EDM'], ['core', 'コア系'],
    ['jazz', 'ジャズ'], ['wa', '和風'], ['world', 'ワールド'], ['retro', 'レトロ'], ['chill', 'チル'], ['hard', '鬼畜曲']];
  const LVS = [['', 'すべて'], ['1-5', '〜5'], ['6-9', '6〜9'], ['10-12', '10〜12'], ['13-99', '13〜']];
  const BPMS = [['', 'すべて'], ['0-110', '〜110'], ['111-149', '111〜149'], ['150-179', '150〜179'], ['180-999', '180〜']];
  const SORTS = [['', 'いつもの順'], ['lv', 'レベルが低い順'], ['lv-', 'レベルが高い順'], ['bpm', 'BPMが遅い順'], ['bpm-', 'BPMが速い順'], ['name', '曲名順']];
  function songFilter(wrap) {
    const tbody = wrap.querySelector('tbody');
    if (!tbody) return;
    const rows = [...tbody.rows].map((tr, i) => ({
      tr, i, c: (tr.dataset.c || '').split(' '), lv: +tr.dataset.lv || 0, bpm: +tr.dataset.bpm || 0,
      name: tr.cells[0].textContent.trim(), text: (tr.cells[0].textContent + ' ' + tr.cells[1].textContent).toLowerCase(),
    }));
    const st = { q: '', g: '', lv: '', bpm: '', sort: '' };
    const chips = (key, list) => `<div class="sf-row" role="group" data-key="${key}">${list.map(([v, t]) =>
      `<button type="button" data-v="${v}" aria-pressed="${v === '' ? 'true' : 'false'}">${t}</button>`).join('')}</div>`;
    const box = document.createElement('div');
    box.className = 'song-filter';
    box.innerHTML = `<div class="sf-top"><input type="search" placeholder="曲名・ジャンルで検索" aria-label="曲を検索" autocomplete="off">
      <select aria-label="並べ替え">${SORTS.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>
      <span class="sf-n" aria-live="polite"></span></div>
      <div class="sf-lab">ジャンル</div>${chips('g', GENRES)}
      <div class="sf-two"><div><div class="sf-lab">レベル(HARD)</div>${chips('lv', LVS)}</div>
      <div><div class="sf-lab">BPM</div>${chips('bpm', BPMS)}</div></div>
      <p class="sf-none" hidden>当てはまる曲がありません。条件をゆるめてみてください。<button type="button" class="sf-reset">条件をリセット</button></p>`;
    wrap.before(box);
    const inp = box.querySelector('input'), sel = box.querySelector('select'), n = box.querySelector('.sf-n'), none = box.querySelector('.sf-none');
    const inRange = (x, r) => { if (!r) return true; const [a, b] = r.split('-').map(Number); return x >= a && x <= b; };
    function apply() {
      const q = st.q.trim().toLowerCase();
      let shown = rows.filter((r) => (!q || q.split(/\s+/).every((w) => r.text.includes(w)))
        && (!st.g || r.c.includes(st.g)) && inRange(r.lv, st.lv) && inRange(r.bpm, st.bpm));
      const by = { lv: (a, b) => a.lv - b.lv || a.bpm - b.bpm, bpm: (a, b) => a.bpm - b.bpm || a.lv - b.lv, name: (a, b) => a.name.localeCompare(b.name, 'ja') };
      const key = st.sort.replace('-', '');
      const order = [...rows].sort(by[key] || ((a, b) => a.i - b.i));
      if (st.sort.endsWith('-')) order.reverse();
      const set = new Set(shown);
      for (const r of order) { r.tr.hidden = !set.has(r); tbody.appendChild(r.tr); }
      n.textContent = `${shown.length} / ${rows.length}曲`;
      none.hidden = shown.length > 0;
      wrap.hidden = shown.length === 0;
    }
    inp.addEventListener('input', () => { st.q = inp.value; apply(); });
    sel.addEventListener('change', () => { st.sort = sel.value; apply(); });
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.sf-row button');
      if (b) {
        const row = b.parentElement;
        st[row.dataset.key] = b.dataset.v;
        for (const x of row.children) x.setAttribute('aria-pressed', String(x === b));
        apply();
      } else if (e.target.closest('.sf-reset')) {
        Object.assign(st, { q: '', g: '', lv: '', bpm: '' });
        inp.value = '';
        for (const row of box.querySelectorAll('.sf-row')) for (const x of row.children) x.setAttribute('aria-pressed', String(x.dataset.v === ''));
        apply();
      }
    });
    apply();
  }
  const start = () => { tagLogo(); if (!inFrame) addNav(); document.querySelectorAll('.table-wrap[data-filter]').forEach(songFilter); reveal(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

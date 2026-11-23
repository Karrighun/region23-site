/* Фото и видео из Telegram-канала на сайте (оба сайта).
   Источник — data/media.json страницы (его пишет tools/tg_news.py вместе с news.json).
   <div data-media="photo" data-limit="24"></div>  — сетка фото без обрезки, в своих пропорциях
   <div data-media="video" data-limit="8"></div>   — ролики: кадр-обложка из самого видео, по клику плеер
   Ссылки с атрибутом data-play="путь.mp4" (карточки новостей с видео) тоже открываются в плеере.
   Просмотр: полноэкранное окно, стрелки ← → и Esc, свайп на телефоне. */
(function () {
  var css =
    '.mg{columns:4 230px;column-gap:10px}' +
    '.mg a{display:block;margin:0 0 10px;break-inside:avoid;position:relative;overflow:hidden;background:#0c1530}' +
    '.mg img{display:block;width:100%;height:auto;transition:transform .5s,opacity .3s}' +
    '.mg a:hover img{transform:scale(1.03)}' +
    '.mv{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px}' +
    '.mv a{position:relative;display:block;aspect-ratio:9/16;overflow:hidden;background:#0c1530}' +
    '.mv a.wide{grid-column:span 2;aspect-ratio:auto}' +
    '.mv img{width:100%;height:100%;object-fit:cover;transition:transform .5s}' +
    '.mv a:hover img{transform:scale(1.04)}' +
    '.mv a.tg{background:#000}.mv a.tg:before{content:"";position:absolute;inset:-30px;background:var(--t) center/cover;filter:blur(22px) brightness(.5)}' +
    '.mv a.tg img{position:relative;width:auto;max-width:100%;height:auto;max-height:100%;margin:auto;display:block;object-fit:contain;top:50%;transform:translateY(-50%)}.mv a.tg:hover img{transform:translateY(-50%)}' +
    '.mv a.tg .playb,.mv a.tg .t{z-index:2}' +
    '.mv .t,.mg .t{position:absolute;left:0;right:0;bottom:0;padding:34px 12px 10px;background:linear-gradient(0deg,rgba(5,10,24,.92),transparent);color:#fff;font:700 13px/1.3 Onest,Nunito,system-ui,sans-serif}' +
    '.mv .t small,.mg .t small{display:block;font-weight:600;font-size:11px;opacity:.7;margin-top:2px}' +
    '.mg .t{opacity:0;transition:opacity .25s}.mg a:hover .t,.mg a:focus-visible .t{opacity:1}' +
    '.playb{position:absolute;left:50%;top:46%;width:58px;height:58px;margin:-29px 0 0 -29px;background:#E3262B;display:grid;place-items:center;transition:transform .25s}' +
    'a:hover>.playb{transform:scale(1.1)}' +
    '.playb:before{content:"";border-left:16px solid #fff;border-top:10px solid transparent;border-bottom:10px solid transparent;margin-left:4px}' +
    '.playb.sm{width:44px;height:44px;margin:-22px 0 0 -22px}' +
    '.mlb{margin:0;padding:0;border:0;width:100vw;height:100svh;max-width:none;max-height:none;background:rgba(3,6,15,.96);color:#fff}' +
    '.mlb::backdrop{background:rgba(3,6,15,.9)}' +
    '.mlb .st{position:absolute;inset:56px 64px 70px;display:grid;place-items:center}' +
    '.mlb .st img,.mlb .st video{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;background:#000}' +
    '.mlb .cp{position:absolute;left:64px;right:64px;bottom:16px;display:flex;justify-content:space-between;gap:16px;align-items:center;font:600 14px/1.4 Onest,Nunito,system-ui,sans-serif}' +
    '.mlb .cp a{color:#fff;text-decoration:underline;white-space:nowrap}' +
    '.mlb button{position:absolute;width:52px;height:52px;border:0;background:rgba(255,255,255,.08);color:#fff;font-size:26px;cursor:pointer}' +
    '.mlb button:hover{background:#E3262B}' +
    '.mlb .x{top:8px;right:8px}.mlb .pv{left:6px;top:50%;margin-top:-26px}.mlb .nx{right:6px;top:50%;margin-top:-26px}' +
    '@media (max-width:700px){.mlb .st{inset:56px 0 86px}.mlb .pv,.mlb .nx{top:auto;bottom:16px;margin:0}.mlb .cp{left:66px;right:66px;bottom:14px;flex-direction:column;align-items:flex-start;gap:4px;font-size:12px}.mv{grid-template-columns:repeat(2,1fr)}.mv a.wide{grid-column:span 2}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var esc = function (s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var fmt = function (iso) { var t = new Date(iso); return isNaN(t) ? '' : t.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }); };

  // ---- окно просмотра ----
  var dlg = document.createElement('dialog'); dlg.className = 'mlb'; dlg.setAttribute('aria-label', 'Просмотр');
  dlg.innerHTML = '<div class="st"></div><div class="cp"><span></span><a target="_blank" rel="noopener">Пост в Telegram</a></div>' +
    '<button class="x" type="button" aria-label="Закрыть">×</button><button class="pv" type="button" aria-label="Назад">←</button><button class="nx" type="button" aria-label="Вперёд">→</button>';
  document.body.appendChild(dlg);
  var list = [], cur = 0;
  function show(i) {
    cur = (i + list.length) % list.length; var m = list[cur], stg = dlg.querySelector('.st');
    stg.innerHTML = m.type === 'video'
      ? '<video src="' + esc(m.src) + '"' + (m.poster ? ' poster="' + esc(m.poster) + '"' : '') + ' controls autoplay playsinline></video>'
      : '<img src="' + esc(m.src) + '" alt="' + esc(m.caption) + '">';
    dlg.querySelector('.cp span').textContent = [fmt(m.date), m.caption].filter(Boolean).join(' · ');
    var a = dlg.querySelector('.cp a'); a.hidden = !m.post; if (m.post) a.href = m.post;
    dlg.querySelector('.pv').hidden = dlg.querySelector('.nx').hidden = list.length < 2;
  }
  function open(items, i) { list = items; show(i); if (!dlg.open) dlg.showModal(); }
  function stop() { var v = dlg.querySelector('video'); if (v) v.pause(); }
  dlg.querySelector('.x').onclick = function () { stop(); dlg.close(); };
  dlg.querySelector('.pv').onclick = function () { stop(); show(cur - 1); };
  dlg.querySelector('.nx').onclick = function () { stop(); show(cur + 1); };
  dlg.addEventListener('close', function () { stop(); dlg.querySelector('.st').innerHTML = ''; });
  dlg.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { stop(); show(cur + 1); } if (e.key === 'ArrowLeft') { stop(); show(cur - 1); } });
  var x0 = null;
  dlg.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 60) { stop(); show(cur + (dx < 0 ? 1 : -1)); } x0 = null; });

  // карточки новостей с видео
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-play]'); if (!a) return;
    e.preventDefault();
    open([{ type: 'video', src: a.dataset.play, poster: a.dataset.poster, caption: a.dataset.caption, date: a.dataset.date, post: a.href }], 0);
  });

  // ---- сетки из media.json ----
  var boxes = [].slice.call(document.querySelectorAll('[data-media]'));
  if (!boxes.length || !window.fetch) return;
  fetch('data/media.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) {
    boxes.forEach(function (box) {
      var kind = box.dataset.media, lim = +(box.dataset.limit || 24);
      var items = d.items.filter(function (m) { return (kind === 'all' || m.type === kind) && (m.type === 'photo' || (m.src && m.poster) || m.thumb); }).slice(0, lim);
      if (!items.length) return;
      box.classList.add(kind === 'video' ? 'mv' : 'mg');
      box.innerHTML = items.map(function (m, i) {
        var img = m.type === 'video' ? (m.poster || m.thumb) : m.src, wide = m.type === 'video' && m.w > m.h;
        return '<a href="' + esc(m.post) + '"' + (m.thumb && !m.src ? ' target="_blank" rel="noopener" class="tg' + (wide ? ' wide' : '') + '" style="--t:url(' + esc(m.thumb) + ')"' : ' data-i="' + i + '"' + (wide ? ' class="wide"' : '')) + '><img src="' + esc(img) + '" alt="' + esc(m.caption) + '" loading="lazy"' + (m.w ? ' width="' + m.w + '" height="' + m.h + '"' : '') + '>' +
          (m.type === 'video' ? '<span class="playb"></span>' : '') +
          '<span class="t">' + esc(m.caption || (m.type === 'video' ? 'Видео' : 'Фото')) + '<small>' + fmt(m.date) + (m.dur ? ' · ' + esc(m.dur) : '') + (m.thumb && !m.src ? ' · в Telegram' : '') + '</small></span></a>';
      }).join('');
      if (innerWidth <= 760 && box.children.length > 8) { /* телефон: показываем по 6 */
        [].slice.call(box.children, 6).forEach(function (c) { c.hidden = true; });
        var mb = document.createElement('button'); mb.type = 'button'; mb.className = 'morebtn'; mb.textContent = 'Показать ещё';
        mb.addEventListener('click', function () { var h = [].filter.call(box.children, function (c) { return c.hidden; }); h.slice(0, 6).forEach(function (c) { c.hidden = false; }); if (h.length <= 6) mb.remove(); });
        box.after(mb);
      }
      box.addEventListener('click', function (e) { var a = e.target.closest('a[data-i]'); if (!a) return; e.preventDefault(); open(items, +a.dataset.i); });
    });
  }).catch(function () {});
})();

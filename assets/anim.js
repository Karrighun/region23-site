/* Появление блоков при скролле — вариант «Фокус» (выбран клиентом 23.11.2026):
   блок выходит из размытия и чуть уменьшается до своего размера, как камера наводит резкость.
   Подключается на обоих сайтах после site.js / kids.js. Блоки помечены классом .rv; соседи в одном ряду идут по очереди.
   Класс .pre — блок ещё не показан (на него опираются полосы графиков и счётчики). */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var E = 'cubic-bezier(.2,.7,.1,1)';
  var st = document.createElement('style');
  st.textContent =
    '.rv,.js .rv.pre{transform:none;opacity:1}' +
    '.rv{transition:opacity .55s ease,filter .6s ease,transform .75s ' + E + '}' +
    '.rv.pre{opacity:0;filter:blur(12px);transform:scale(1.04);transition:none}' +
    '.rv.done{filter:none}' +
    /* на телефонах и тач-экранах — без blur: размытие крупных фото при скролле дает рывки (iOS) */
    '@media (hover:none),(max-width:900px){.rv.pre{filter:none;transform:translate3d(0,18px,0)}.rv{transition:opacity .5s ease,transform .6s ' + E + '}}';
  document.head.appendChild(st);
  var els = [].slice.call(document.querySelectorAll('.rv'));
  els.forEach(function (e) {
    var sib = [].filter.call(e.parentNode.children, function (x) { return x.classList.contains('rv'); });
    e.style.transitionDelay = Math.min(sib.indexOf(e), 4) * 45 + 'ms';
  });
  if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('done'); }); return; }
  function show(e) { e.classList.remove('pre'); setTimeout(function () { e.classList.add('done'); }, 800); }
  els.forEach(function (e) { if (e.getBoundingClientRect().top > innerHeight * .85) e.classList.add('pre'); else e.classList.add('done'); });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (x) { if (x.isIntersecting) { show(x.target); io.unobserve(x.target); } });
  }, { rootMargin: '0px 0px -15% 0px' });
  els.forEach(function (e) { if (e.classList.contains('pre')) io.observe(e); });
})();

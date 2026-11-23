/* Общая шапка, меню, подвал и мелкая анимация для страниц adult/site/*.html. Страница задаёт <body data-page="matches"> */
(function(){
  document.documentElement.classList.add('js');
  var page=document.body.dataset.page||'';
  var NAV=[['index','Главная'],['matches','Матчи'],['team','Команда'],['club','Клуб'],['media','Медиа'],['tickets','Билеты']];
  var links=NAV.map(function(n){return '<a href="'+n[0]+'.html"'+(n[0]===page?' aria-current="page"':'')+'>'+n[1]+'</a>'}).join('')+'<a href="../../kids/site/index.html">Академия</a>';
  var hdr=document.createElement('header');hdr.className='hdr';
  hdr.innerHTML='<div class="in"><a class="brand" href="index.html" aria-label="Регион 23 — на главную"><img src="../../assets/logo.svg" alt=""><span>РЕГИОН 23<small>хоккейная команда · Анапа</small></span></a>'+
    '<nav class="menu" aria-label="Разделы сайта">'+links+'</nav>'+
    '<div class="right"><a class="btn red sm" href="tickets.html">Билеты</a><button class="burger" type="button" aria-label="Открыть меню" aria-expanded="false"><svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="#fff" stroke-width="2"><path d="M0 1h18M0 6h18M6 11h12"/></svg></button></div></div>';
  document.body.prepend(hdr);
  var dr=document.createElement('div');dr.className='drawer';dr.id='drawer';dr.setAttribute('aria-hidden','true');
  dr.innerHTML='<button class="x" type="button" aria-label="Закрыть меню">×</button>'+links;
  document.body.appendChild(dr);
  var bg=hdr.querySelector('.burger');
  function tog(o){dr.classList.toggle('open',o);dr.setAttribute('aria-hidden',o?'false':'true');bg.setAttribute('aria-expanded',o)}
  bg.addEventListener('click',function(){tog(true)});dr.querySelector('.x').addEventListener('click',function(){tog(false)});
  addEventListener('keydown',function(e){if(e.key==='Escape')tog(false)});
  var solid=function(){hdr.classList.toggle('solid',scrollY>40)};solid();addEventListener('scroll',solid,{passive:true});

  var f=document.createElement('footer');f.className='ftr';
  f.innerHTML='<div class="wrap"><div class="cols">'+
   '<div><a class="brand" href="index.html"><img src="../../assets/logo.svg" alt=""><span>РЕГИОН 23<small>хоккейная команда · Анапа</small></span></a><p style="margin-top:14px;max-width:320px;line-height:1.6;color:var(--mute)">Любительская хоккейная команда Анапы с 2019 года. Пятикратный чемпион Ночной хоккейной лиги Краснодарского края, первый обладатель Кубка Южной столицы.</p></div>'+
   '<div><h4>Разделы</h4>'+NAV.map(function(n){return '<a href="'+n[0]+'.html">'+n[1]+'</a>'}).join('')+'<a href="../../kids/site/index.html">Детская академия</a></div>'+
   '<div><h4>Связь</h4><p class="tnum">+7 (962) 853-53-75</p><p>Мария, администратор</p><a href="https://t.me/XKREGION23">Telegram @XKREGION23</a><a href="https://t.me/hk_region23_kids">Telegram академии</a><a href="https://max.ru/">Канал в MAX</a></div>'+
   '<div><h4>Где играем</h4><p>Анапа</p><p>Краснодар, Ice Palace</p><p>ст. Северская, «Клуб загородного отдыха»</p><p>Горячий Ключ, ЛД «Барс»</p></div>'+
   '</div><div class="bottom"><span>© 2019–2026 ХК «Регион 23»</span><span>Концепт сайта · данные из Telegram-канала клуба на 23.11.2026</span></div></div>';
  document.body.appendChild(f);

  // появление блоков — assets/anim.js (4 варианта)

  // ---- варианты блоков (.vsw → .sv[data-v]) и счётчики [data-countup] ----
  function runCount(scope){
    [].forEach.call(scope.querySelectorAll('[data-countup]'),function(el){
      if(el._done)return;el._done=1;
      var to=+el.dataset.countup,pad=+(el.dataset.pad||0),t0=null;
      function f(n){var s=String(n);while(s.length<pad)s='0'+s;el.textContent=s}
      if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window)){f(to);return}
      f(0);
      var io=new IntersectionObserver(function(es){if(!es[0].isIntersecting)return;io.disconnect();
        requestAnimationFrame(function step(ts){t0=t0||ts;var k=Math.min(1,(ts-t0)/1400);f(Math.round(to*(1-Math.pow(1-k,3))));if(k<1)requestAnimationFrame(step)})});
      io.observe(el);
    });
  }
  [].forEach.call(document.querySelectorAll('.vsw'),function(sw){
    var box=sw.parentNode,key='r23v-'+location.pathname.split('/').pop()+'-'+(sw.getAttribute('aria-label')||'x');
    function pick(v){[].forEach.call(sw.children,function(b){b.setAttribute('aria-selected',b.dataset.v===v)});
      [].forEach.call(box.querySelectorAll(':scope>.sv,:scope>*>.sv'),function(x){x.hidden=x.dataset.v!==v;if(!x.hidden)runCount(x)});
      try{localStorage.setItem(key,v)}catch(e){}}
    sw.addEventListener('click',function(e){var b=e.target.closest('button');if(b)pick(b.dataset.v)});
    var sv;try{sv=localStorage.getItem(key)}catch(e){}
    pick(box.querySelector('.sv[data-v="'+sv+'"]')?sv:sw.children[0].dataset.v);
  });
  runCount(document);

  // ---- шрифты: ?font=a|b|c|d|e или кнопки внизу справа (для выбора на этапе концепта) ----
  var FONTS={a:'Sofia Sans Extra Condensed + Onest',b:'Unbounded + Golos Text',c:'Dela Gothic One + Manrope',d:'Russo One + Golos Text',e:'Oswald + Manrope (было)'};
  var fq=(location.search.match(/font=([a-e])/)||[])[1],fs;try{fs=localStorage.getItem('r23font')}catch(e){}
  function setFont(k){document.documentElement.dataset.font=k;try{localStorage.setItem('r23font',k)}catch(e){}
    [].forEach.call(document.querySelectorAll('.fontsw button'),function(b){b.setAttribute('aria-pressed',b.dataset.k===k)})}
  var sw=document.createElement('div');sw.className='fontsw';sw.setAttribute('role','group');sw.setAttribute('aria-label','Вариант шрифта');
  sw.innerHTML='<span>Шрифт</span>'+Object.keys(FONTS).map(function(k){return '<button type="button" data-k="'+k+'" title="'+FONTS[k]+'">'+k.toUpperCase()+'</button>'}).join('');
  document.body.appendChild(sw);
  sw.addEventListener('click',function(e){var b=e.target.closest('button');if(b)setFont(b.dataset.k)});
  setFont(fq||fs||'a');

  // ---- новости из Telegram: <div data-feed data-limit="3" data-rubric="Матчи"> → карточки из data/news.json ----
  var feeds=[].slice.call(document.querySelectorAll('[data-feed]'));
  if(feeds.length&&window.fetch){
    fetch('data/news.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():Promise.reject()}).then(function(d){
      var esc=function(s){return String(s||'').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
      var fmt=function(iso){var t=new Date(iso);return isNaN(t)?'':t.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'})};
      function more(box){var n=box.children.length,lim=8,nx=box.nextElementSibling;if(nx&&nx.classList.contains('morebtn'))nx.remove();if(innerWidth>760||n<=lim+2)return;[].slice.call(box.children,lim).forEach(function(c){c.hidden=true});var b=document.createElement('button');b.type='button';b.className='morebtn';b.textContent='Показать ещё';b.addEventListener('click',function(){var h=[].filter.call(box.children,function(c){return c.hidden});h.slice(0,lim).forEach(function(c){c.hidden=false});if(h.length<=lim)b.remove()});box.after(b)}
      function render(box){var lim=+(box.dataset.limit||9),rb=box.dataset.rubric||'';
        var items=d.items.filter(function(p){return (p.image||p.tgvideo)&&(!rb||p.rubric===rb)}).slice(0,lim);
        box.innerHTML=items.map(function(p){return '<a class="card news" href="'+esc(p.url)+'" target="_blank" rel="noopener"'+(p.video?' data-play="'+esc(p.video)+'" data-poster="'+esc(p.image)+'" data-caption="'+esc(p.title)+'" data-date="'+esc(p.date)+'"':'')+'>'+(p.image?'<div class="im'+(p.w&&p.h&&Math.abs(p.w/p.h-1)>.08?' fit" style="--t:url('+esc(p.image)+')':'')+'"><img src="'+esc(p.image)+'" alt="" loading="lazy">'+(p.video?'<span class="playb sm"></span>':'')+'</div>':'<div class="im '+(p.thumb?'tthumb" style="--t:url('+esc(p.thumb)+')"><img src="'+esc(p.thumb)+'" alt="" loading="lazy">':'noimg">')+'<span class="playb sm"></span><em>'+(p.dur?esc(p.dur)+' · ':'')+'Видео в Telegram</em></div>')+'<div class="bd"><span class="src">'+esc(p.rubric)+' · Telegram</span><time>'+fmt(p.date)+'</time><h3>'+esc(p.title)+'</h3>'+(p.text?'<p>'+esc(p.text.slice(0,180))+(p.text.length>180?'…':'')+'</p>':'')+'</div></a>'}).join('');more(box);}
      feeds.forEach(function(box){render(box);box._render=render});
      [].forEach.call(document.querySelectorAll('[data-feedstate]'),function(el){el.textContent='Лента обновлена '+new Date(d.updated).toLocaleString('ru-RU')+' · источник: t.me/'+d.channel});
      [].forEach.call(document.querySelectorAll('[data-feedtab]'),function(b){b.addEventListener('click',function(){
        var box=document.querySelector(b.dataset.feedtab);box.dataset.rubric=b.dataset.r||'';render(box);
        [].forEach.call(b.parentNode.children,function(x){x.setAttribute('aria-pressed',x===b)})})});
    }).catch(function(){/* нет ленты — остаются статичные карточки */});
  }

  // обратный отсчёт: <div data-count="2026-11-28T18:00:00+03:00"> с четырьмя <b>
  [].forEach.call(document.querySelectorAll('[data-count]'),function(box){
    var t=new Date(box.dataset.count),b=box.querySelectorAll('b');
    function tick(){var s=Math.max(0,(t-new Date())/1000);[s/86400,s%86400/3600,s%3600/60,s%60].forEach(function(v,i){if(b[i])b[i].textContent=String(Math.floor(v)).padStart(2,'0')})}
    tick();setInterval(tick,1000);
  });
})();

/* эмблемы соперников в списках матчей вместо буквенных значков */
(function(){
  var C={'Гвардия':'crest-gvardiya.webp','Шторм':'crest-shtorm.webp','Черномортранснефть':'crest-chtn.webp','Ключ':'crest-klyuch.webp','One Timer':'crest-onetimer.webp','Титан':'crest-titan2.webp'};
  [].forEach.call(document.querySelectorAll('.mrow .t .crest'),function(s){
    var name=s.parentNode.textContent.replace(s.textContent,'').replace(/­/g,'').trim(),f=C[name];
    if(!f)return;var i=document.createElement('img');i.className='cimg';i.src='img/'+f;i.alt='';i.loading='lazy';s.replaceWith(i)});
})();

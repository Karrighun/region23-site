/* Общая шапка, подвал, появление блоков, лента Telegram и форма записи для kids/site/*.html.
   Страница задает <body data-page="groups">. Лента: <div data-feed data-limit="3" data-rubric="Академия"> ← data/news.json
   (обновляет tools/tg_news.py --channel hk_region23_kids --out kids/site/data, по cron раз в 15 минут) */
(function(){
  document.documentElement.classList.add('js');
  var page=document.body.dataset.page||'';
  var NAV=[['index','Главная'],['groups','Группы и расписание'],['coaches','Тренеры'],['camp','Лагерь и сборы'],['news','Новости'],['contacts','Контакты']];
  var link=function(n){return '<a href="'+n[0]+'.html"'+(n[0]===page?' aria-current="page"':'')+'>'+n[1]+'</a>'};
  // «Взрослая команда» — в середине меню и выделена цветом (зеркально «Детской академии» на взрослом сайте)
  var links=NAV.slice(0,3).map(link).join('')+'<a class="nav-adult" href="../../adult/site/index.html">Взрослая команда</a>'+NAV.slice(3).map(link).join('');
  var hdr=document.createElement('header');hdr.className='hdr';
  hdr.innerHTML='<div class="in"><a class="brand" href="index.html" aria-label="Регион 23 Kids — на главную"><img src="../../assets/logo.svg" alt=""><span>РЕГИОН KIDS<small>хоккейная академия · Анапа</small></span></a>'+
    '<nav class="menu" aria-label="Разделы сайта">'+links+'</nav>'+
    '<div class="right"><a class="btn red sm" href="contacts.html#form">Записаться</a></div></div>';
  document.body.prepend(hdr);
  var solid=function(){hdr.classList.toggle('solid',scrollY>40)};solid();addEventListener('scroll',solid,{passive:true});

  var f=document.createElement('footer');f.className='ftr';
  f.innerHTML='<div class="wrap"><div class="cols">'+
   '<div><a class="brand" href="index.html"><img src="../../assets/logo.svg" alt=""><span>РЕГИОН KIDS<small>хоккейная академия · Анапа</small></span></a><p style="margin-top:14px;max-width:340px;line-height:1.6;color:rgba(255,255,255,.7)">Детская хоккейная академия ХК «Регион 23». Учим кататься и играть с 3 лет. Форма и первая тренировка бесплатно.</p></div>'+
   '<div><h4>Разделы</h4>'+NAV.map(function(n){return '<a href="'+n[0]+'.html">'+n[1]+'</a>'}).join('')+'<a href="../../adult/site/index.html">Взрослая команда</a></div>'+
   '<div><h4>Запись</h4><a class="tnum" href="tel:+79826729292">+7 (982) 672-92-92</a><p>Сергей Сергеевич Купцов, директор академии</p><a href="https://t.me/hk_region23_kids">Telegram академии</a><a href="https://t.me/XKREGION23">Telegram команды</a></div>'+
   '<div class="xm-col"><h4>Где тренируемся</h4>'+
     '<div class="xmap"><button class="xm-card" type="button" aria-expanded="false" aria-controls="xm-body">'+
       '<span class="xm-top"><svg class="xm-ico" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></svg><span class="xm-live"><i></i>на карте</span></span>'+
       '<b>Ледовый каток «Джунгли»</b><span class="xm-addr">Анапа, Котломской проезд, 1</span><span class="xm-line"></span><span class="xm-hint">Показать на карте</span></button>'+
       '<div class="xm-body" id="xm-body" hidden><div class="xm-map"></div>'+
       '<div class="xm-foot"><span class="xm-coord">44.9037° N · 37.3229° E</span><span class="xm-btns">'+
         '<a class="xm-btn red" href="https://yandex.ru/maps/?rtext=~44.903651%2C37.322896&rtt=auto" target="_blank" rel="noopener">Маршрут</a>'+
         '<a class="xm-btn" href="https://yandex.ru/maps/org/74044996616/?ll=37.322432%2C44.903807&z=17" target="_blank" rel="noopener">Открыть в Яндекс Картах</a>'+
         '<button class="xm-btn ghost xm-close" type="button">Свернуть</button></span></div></div></div></div>'+
   '</div><div class="bottom"><span>© 2019–2026 ХК «Регион 23»</span><span>Концепт сайта · данные из Telegram-канала академии на 23.11.2026</span></div></div>';
  document.body.appendChild(f);

  // карта катка в подвале: компактная карточка → по клику раскрывается на всю ширину с Яндекс Картой (в духе expand-map)
  (function(){
    var col=f.querySelector('.xm-col'),box=f.querySelector('.xmap'),btn=box.querySelector('.xm-card'),body=box.querySelector('.xm-body'),map=box.querySelector('.xm-map');
    var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,busy=false;
    var SRC='https://yandex.ru/map-widget/v1/?ll=37.322896%2C44.903651&z=17&pt=37.322896%2C44.903651%2Cpm2rdl&l=map';
    function morph(change,after){
      var a=box.getBoundingClientRect();change();var b=box.getBoundingClientRect();
      if(reduce||!box.animate){after&&after();return}
      busy=true;box.style.overflow='hidden';
      var an=box.animate([{width:a.width+'px',height:a.height+'px'},{width:b.width+'px',height:b.height+'px'}],{duration:560,easing:'cubic-bezier(.22,1,.36,1)'});
      an.onfinish=an.oncancel=function(){box.style.overflow='';busy=false;after&&after()};
    }
    function open(){
      if(busy)return;
      // карту грузим, когда блок уже раскрыт: иначе Яндекс запоминает узкий размер и на телефоне рисует полоску
      morph(function(){col.classList.add('wide');box.classList.add('open');body.hidden=false;btn.setAttribute('aria-expanded','true')},
        function(){if(!map.firstChild){var fr=document.createElement('iframe');fr.src=SRC;fr.title='Ледовый каток «Джунгли» на Яндекс Картах';fr.allowFullscreen=true;map.appendChild(fr)}
          requestAnimationFrame(function(){box.classList.add('shown')})});
      setTimeout(function(){box.scrollIntoView({behavior:reduce?'auto':'smooth',block:'nearest'})},reduce?0:380);
    }
    function close(){
      if(busy)return;box.classList.remove('shown');
      morph(function(){col.classList.remove('wide');box.classList.remove('open');body.hidden=true;btn.setAttribute('aria-expanded','false')});
      btn.focus();
    }
    btn.addEventListener('click',function(){box.classList.contains('open')?close():open()});
    box.querySelector('.xm-close').addEventListener('click',close);
    addEventListener('keydown',function(e){if(e.key==='Escape'&&box.classList.contains('open'))close()});
  })();

  // появление блоков — assets/anim.js (4 варианта)

  var feeds=[].slice.call(document.querySelectorAll('[data-feed]'));
  if(feeds.length&&window.fetch){
    fetch('data/news.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():Promise.reject()}).then(function(d){
      var esc=function(s){return String(s||'').replace(/ё/g,'е').replace(/Ё/g,'Е').replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
      var fmt=function(iso){var t=new Date(iso);return isNaN(t)?'':t.toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'})};
      function more(box){var n=box.children.length,lim=8,nx=box.nextElementSibling;if(nx&&nx.classList.contains('morebtn'))nx.remove();if(innerWidth>760||n<=lim+2)return;[].slice.call(box.children,lim).forEach(function(c){c.hidden=true});var b=document.createElement('button');b.type='button';b.className='morebtn';b.textContent='Показать еще';b.addEventListener('click',function(){var h=[].filter.call(box.children,function(c){return c.hidden});h.slice(0,lim).forEach(function(c){c.hidden=false});if(h.length<=lim)b.remove()});box.after(b)}
      function render(box){var lim=+(box.dataset.limit||9),rb=box.dataset.rubric||'';
        var items=d.items.filter(function(p){return (p.image||p.tgvideo)&&(!rb||p.rubric===rb)}).slice(0,lim);
        box.innerHTML=items.map(function(p){return '<a class="card news" href="'+esc(p.url)+'" target="_blank" rel="noopener"'+(p.video?' data-play="'+esc(p.video)+'" data-poster="'+esc(p.image)+'" data-caption="'+esc(p.title)+'" data-date="'+esc(p.date)+'"':'')+'>'+(p.image?'<div class="im'+(p.w&&p.h&&Math.abs(p.w/p.h-1)>.08?' fit" style="--t:url('+esc(p.image)+')':'')+'"><img src="'+esc(p.image)+'" alt="" loading="lazy">'+(p.video?'<span class="playb sm"></span>':'')+'</div>':'<div class="im '+(p.thumb?'tthumb" style="--t:url('+esc(p.thumb)+')"><img src="'+esc(p.thumb)+'" alt="" loading="lazy">':'noimg">')+'<span class="playb sm"></span><em>'+(p.dur?esc(p.dur)+' · ':'')+'Видео в Telegram</em></div>')+'<div><span class="src">'+esc(p.rubric)+'</span><time>'+fmt(p.date)+'</time><h3>'+esc(p.title)+'</h3>'+(p.text?'<p>'+esc(p.text.slice(0,160))+(p.text.length>160?'…':'')+'</p>':'')+'</div></a>'}).join('');more(box);}
      feeds.forEach(render);
      [].forEach.call(document.querySelectorAll('[data-feedstate]'),function(el){el.textContent='Лента обновлена '+new Date(d.updated).toLocaleString('ru-RU')+' · источник: t.me/'+d.channel});
      [].forEach.call(document.querySelectorAll('[data-feedtab]'),function(b){b.addEventListener('click',function(){
        var box=document.querySelector(b.dataset.feedtab);box.dataset.rubric=b.dataset.r||'';render(box);
        [].forEach.call(b.parentNode.children,function(x){x.setAttribute('aria-pressed',x===b)})})});
    }).catch(function(){});
  }

  // кнопки «Записаться» на любой странице запоминают, откуда пришли: это попадёт в заявку
  document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a[href*="contacts.html#form"]');
    if(a)try{sessionStorage.setItem('r23from',JSON.stringify({from:location.href,btn:a.textContent.trim().slice(0,60)}))}catch(_){}});

  // форма записи → POST /api/lead (сервер region23-lead шлёт заявку ботом в Telegram)
  var fm=document.querySelector('form[data-signup]');
  if(fm){
    var t0=Date.now(),msg=fm.querySelector('.ok'),btn=fm.querySelector('button[type=submit]'),ph=fm.elements.phone;
    var digits=function(s){var d=s.replace(/\D/g,'');if(d.length===11&&/^[78]/.test(d))d=d.slice(1);return d};
    ph.addEventListener('input',function(){ph.setCustomValidity('')});
    var say=function(text,bad){msg.hidden=false;msg.textContent=text;msg.classList.toggle('err',!!bad)};
    fm.addEventListener('submit',function(e){e.preventDefault();
      ph.setCustomValidity(/^9\d{9}$/.test(digits(ph.value))?'':'Введите мобильный номер: +7 и 10 цифр');
      if(!fm.reportValidity())return;
      var src={};try{src=JSON.parse(sessionStorage.getItem('r23from')||'{}')}catch(_){}
      var body={t:(Date.now()-t0)/1000,page:location.href.split('#')[0],from:src.from||document.referrer||'',btn:src.btn||''};
      ['parent','phone','child','year','level','note','website'].forEach(function(k){body[k]=fm.elements[k]?fm.elements[k].value:''});
      btn.disabled=true;say('Отправляем заявку…');
      fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
        .then(function(r){return r.json().catch(function(){return {ok:false}})})
        .then(function(j){
          if(j&&j.ok){fm.reset();say('Заявка отправлена. Тренер перезвонит, чтобы выбрать день пробной тренировки.');
            try{sessionStorage.removeItem('r23from')}catch(_){}
            setTimeout(function(){btn.disabled=false},8000);return}
          btn.disabled=false;
          if(j&&j.field&&fm.elements[j.field])fm.elements[j.field].focus();
          say('Ошибка: '+((j&&j.error)||'заявка не отправилась. Позвоните нам: +7 (982) 672-92-92'),1)})
        .catch(function(){btn.disabled=false;say('Ошибка: нет связи с сервером. Проверьте интернет или позвоните: +7 (982) 672-92-92',1)});
    });
  }
})();

/* чистые адреса на боевых доменах: без index.html, переходы между сайтами — сразу на нужный домен
   (локально и в артефакте ссылки остаются относительными, чтобы всё открывалось без сервера) */
(function(){
  if(!/(^|\.)hkregion23\.ru$/.test(location.hostname))return;
  var A='https://hkregion23.ru/',K='https://academy.hkregion23.ru/';
  function fix(h){
    h=h.replace(/^\.\.\/\.\.\/adult\/site\//,A).replace(/^\.\.\/\.\.\/kids\/site\//,K);
    var s=h.replace(/(^|\/)index\.html(?=$|[#?])/,'$1');
    if(s!==h&&(s===''||/^[#?]/.test(s)))s='./'+s;
    return s;
  }
  [].forEach.call(document.querySelectorAll('a[href]'),function(a){var h=a.getAttribute('href'),n=fix(h);if(n!==h)a.setAttribute('href',n)});
})();

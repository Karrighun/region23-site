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
   '<div><h4>Где тренируемся</h4><p>Ледовый каток «Джунгли»</p><p>Анапа, Котломской проезд, 1</p></div>'+
   '</div><div class="bottom"><span>© 2019–2026 ХК «Регион 23»</span><span>Концепт сайта · данные из Telegram-канала академии на 23.11.2026</span></div></div>';
  document.body.appendChild(f);

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

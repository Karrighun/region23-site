/* Живые глаза маскота M1: радужки непрерывно следят за курсором/пальцем.
   Слои (все в координатах кадра 1856×2304, в процентах): база без зрачков (Magnific) → радужки под маской белков
   → тень век (multiply) → блики → кадр моргания. Данные о глазах — m1-eyes.json. */
(function(){
  var box=document.querySelector('[data-live-eyes]');if(!box)return;
  var A=box.dataset.base||'../assets/kidsm/';
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css='.le{position:absolute;inset:0;will-change:transform;transform-origin:50% 90%}'+
    '.le>*{position:absolute;inset:0;width:100%;height:100%}'+
    '.le img.full{object-fit:cover;-webkit-mask-image:radial-gradient(ellipse 72% 80% at 50% 44%,#000 60%,transparent 98%);mask-image:radial-gradient(ellipse 72% 80% at 50% 44%,#000 60%,transparent 98%)}'+
    '.le .irises{-webkit-mask-image:url('+A+'m1-eyemask-a.png);mask-image:url('+A+'m1-eyemask-a.png);-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;mask-mode:alpha}'+
    '.le .irises img{position:absolute;height:auto;will-change:transform}'+
    '.le .shade{pointer-events:none}'+
    '.le .hl i{position:absolute;border-radius:50%;background:#fff;will-change:transform}'+
    '.le .blink{opacity:0;transition:opacity .06s}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  fetch(A+'m1-eyes.json').then(function(r){return r.json()}).then(function(J){
    var W=J.frame[0],H=J.frame[1];
    var le=document.createElement('div');le.className='le';
    le.innerHTML='<img class="full" src="'+A+'m1-base.webp" alt="Маскот академии «Регион 23» — мальчик-хоккеист в чёрной форме клуба, следит глазами за курсором">'+
      '<div class="irises"></div><img class="full shade" src="'+A+'m1-shade-b.png" alt="" aria-hidden="true"><div class="hl" aria-hidden="true"></div>'+
      '<img class="full blink" src="'+A+'p3d-B.webp" alt="" aria-hidden="true">';
    box.appendChild(le);
    var ir=le.querySelector('.irises'),hl=le.querySelector('.hl'),eyes=[];
    ['l','r'].forEach(function(k){var e=J[k],d=e.r*2*1.04;
      var im=new Image();im.src=A+'m1-iris.png';im.alt='';
      im.style.cssText='left:'+((e.cx-d/2)*100)+'%;top:'+((e.cy-d/2*W/H)*100)+'%;width:'+(d*100)+'%';
      ir.appendChild(im);
      var h1=document.createElement('i'),h2=document.createElement('i');
      h1.style.cssText='left:'+((e.cx-e.r*.42)*100)+'%;top:'+((e.cy-e.r*.5*W/H)*100)+'%;width:'+(e.r*.42*100)+'%;aspect-ratio:1';
      h2.style.cssText='left:'+((e.cx+e.r*.28)*100)+'%;top:'+((e.cy+e.r*.3*W/H)*100)+'%;width:'+(e.r*.16*100)+'%;aspect-ratio:1;opacity:.85';
      hl.appendChild(h1);hl.appendChild(h2);
      eyes.push({e:e,im:im,h:[h1,h2],ex:(e.wx1-e.wx0)/2,ey:(e.wy1-e.wy0)/2*H/W});
    });
    var blink=le.querySelector('.blink');
    (function b(){blink.style.opacity=1;setTimeout(function(){blink.style.opacity=0},140);setTimeout(b,2500+Math.random()*3500)})();
    var px=null,py=null,last=-1e9,cx=0,cy=0;
    function set(x,y){px=x;py=y;last=performance.now()}
    addEventListener('pointermove',function(e){set(e.clientX,e.clientY)});
    addEventListener('touchstart',function(e){var t=e.touches[0];if(t)set(t.clientX,t.clientY)},{passive:true});
    addEventListener('touchmove',function(e){var t=e.touches[0];if(t)set(t.clientX,t.clientY)},{passive:true});
    var t0=performance.now();
    (function loop(now){
      var R=box.getBoundingClientRect(),s=R.width,tx,ty;
      var fx=R.left+R.width*.5,fy=R.top+R.height*.35;
      if(px===null||now-last>3500){var k=(now-t0)/1000;tx=Math.sin(k*.7)*.7;ty=Math.sin(k*.43)*.4}
      else{var dx=px-fx,dy=py-fy,dd=Math.hypot(dx,dy)||1,f=Math.min(1,dd/(s*.6));tx=dx/dd*f;ty=dy/dd*f}
      cx+=(tx-cx)*(reduce?1:.22);cy+=(ty-cy)*(reduce?1:.22);
      eyes.forEach(function(o){
        var mx=Math.max(0,o.ex-o.e.r*.72)*s,my=Math.max(o.e.r*.25,o.ey-o.e.r*.6)*s;
        var X=cx*mx,Y=cy*my;
        o.im.style.transform='translate('+X.toFixed(2)+'px,'+Y.toFixed(2)+'px)';
        o.h[0].style.transform=o.h[1].style.transform='translate('+(X*.75).toFixed(2)+'px,'+(Y*.75).toFixed(2)+'px)';
      });
      if(!reduce){var br=Math.sin(now/900)*.005;le.style.transform='translate3d('+(cx*6).toFixed(1)+'px,'+(cy*4).toFixed(1)+'px,0) rotate('+(cx*1.2).toFixed(2)+'deg) scale('+(1+br).toFixed(4)+')'}
      requestAnimationFrame(loop)})(t0);
  });
})();

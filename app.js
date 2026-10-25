(() => {
  'use strict';
  const C = window.STORY;
  const scenes = [...document.querySelectorAll('.scene')];
  const chapters=['ПЕРЕДМОВА','СПОГАДИ','ПРОСТІ РЕЧІ','ЧЕСНО','З ГУМОРОМ','СЕКРЕТ','ЛИСТ','ФІНАЛ'];
  const $ = (sel, parent=document) => parent.querySelector(sel);
  let current=0, switching=false, soundOn=false, photoIndex=0, toastTimer;
  const state={photos:new Set(),ordinary:new Set(),honesty:new Set(), quiz:0, scratch:false, letter:false, stars:new Set()};
  const audio=$('#soundtrack'); audio.volume=.48;

  function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2600)}
  function updateNav(){ $('#progress-bar').style.width=`${(current+1)/scenes.length*100}%`;$('#chapter-name').textContent=chapters[current];$('#foot-count').textContent=`${String(current+1).padStart(2,'0')} — 08`;$('#back-btn').hidden=(current===0); }
  function show(n){if(switching||n<0||n>=scenes.length)return; switching=true; const wipe=$('#transition-layer');wipe.classList.remove('run');void wipe.offsetWidth;wipe.classList.add('run');setTimeout(()=>{scenes[current].classList.remove('is-active');current=n;scenes[current].classList.add('is-active');scenes[current].scrollTop=0;window.scrollTo(0,0);updateNav();if(n===5)setTimeout(setupScratch,100);if(n===7)startFinale();},590);setTimeout(()=>{switching=false;wipe.classList.remove('run')},1390)}
  function unlock(sel){const b=$(sel);if(b)b.disabled=false}
  document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>{if(current===0&&!soundOn){audio.play().then(()=>{soundOn=true;setSoundButton()}).catch(()=>setSoundButton())}show(current+1)}));
  $('#back-btn').addEventListener('click',()=>show(current-1));
  function setSoundButton(){ $('#sound-label').textContent=soundOn?'увімк.':'вимк.'; $('#sound-btn').setAttribute('aria-pressed',String(soundOn)); }
  $('#sound-btn').addEventListener('click',()=>{if(soundOn){audio.pause();soundOn=false;setSoundButton()}else{audio.play().then(()=>{soundOn=true;setSoundButton()}).catch(()=>toast('Браузер не дозволив запустити музику'))}});
  setSoundButton(); updateNav();
  if(matchMedia('(pointer:fine)').matches) document.addEventListener('pointermove',e=>{const g=$('#pointer-glow');g.style.left=e.clientX+'px';g.style.top=e.clientY+'px';},{passive:true});

  function photoUrl(name){return window.STORY_PHOTO_URLS?.[name] || 'photos/'+name}
  function imageMarkup(g, extraClass=''){
    const img=document.createElement('img');img.src=photoUrl(g.image);img.alt=g.title;img.className=extraClass;
    img.addEventListener('error',()=>{if(img.dataset.fallback==='1')return;img.dataset.fallback='1';img.src=g.fallback;const parent=img.parentElement;if(parent&&!parent.querySelector('.placeholder')){const badge=document.createElement('span');badge.className='placeholder';badge.textContent='Тут буде ваше фото';parent.append(badge)}});
    return img;
  }
  // Ten real photos: all interactive and all included in the final montage.
  C.gallery.forEach((g,i)=>{
    const card=document.createElement('button'); card.type='button';card.className='photo-card';card.style.setProperty('--rotation',['-3deg','2.5deg','-1.7deg','2deg','1.3deg','-2.2deg','3deg','-1deg','1deg','-2.5deg'][i]);
    const frame=document.createElement('div');frame.className='photo-image';frame.append(imageMarkup(g));card.append(frame);
    const title=document.createElement('h3');title.textContent=g.title;card.append(title);
    const small=document.createElement('small');small.textContent='ВІДКРИТИ СПОГАД ↗';card.append(small);
    card.addEventListener('click',()=>openPhoto(i));$('#photo-masonry').append(card)
  });
  function openPhoto(i){photoIndex=i;state.photos.add(i);$(`.photo-card:nth-child(${i+1})`).classList.add('seen');$('#photos-opened').textContent=`Відкрито ${state.photos.size} із ${C.gallery.length} фото (для продовження достатньо 6)`;if(state.photos.size>=6)unlock('#photos-next');
    const g=C.gallery[i];$('#dialog-photo').style.backgroundImage=`url("${photoUrl(g.image)}")`; const test=new Image();test.src=photoUrl(g.image);test.onerror=()=>{if(photoIndex===i){$('#dialog-photo').style.backgroundImage=`url('${g.fallback}')`;$('#dialog-photo').innerHTML='<small>Тут буде ваше фото</small>'}};test.onload=()=>{if(photoIndex===i)$('#dialog-photo').innerHTML=''};
    $('#dialog-label').textContent=g.label;$('#dialog-title').textContent=g.title;$('#dialog-text').textContent=g.detail;
    if(!$('#photo-dialog').open)$('#photo-dialog').showModal();
  }
  $('#dialog-close').addEventListener('click',()=>$('#photo-dialog').close());$('#dialog-next').addEventListener('click',()=>openPhoto((photoIndex+1)%C.gallery.length));$('#photo-dialog').addEventListener('click',e=>{if(e.target===$('#photo-dialog'))$('#photo-dialog').close()});

  C.ordinaryThings.forEach((g,i)=>{const b=document.createElement('button');b.type='button';b.className='ordinary-card';b.innerHTML=`<span class="icon">✳</span><div class="front"><small>ДОТОРКНИСЬ · ${String(i+1).padStart(2,'0')}</small><b></b><p>Не все так очевидно →</p></div><div class="back"><small>І ОТ ЧОМУ...</small><p></p></div>`;b.querySelector('b').textContent=g.front;b.querySelector('.back p').textContent=g.back;b.addEventListener('click',()=>{b.classList.toggle('revealed');state.ordinary.add(i);$('#ordinary-count').textContent=`${state.ordinary.size} / 4 відкрито`;if(state.ordinary.size===4)unlock('#ordinary-next')});$('#ordinary-grid').append(b)});
  C.honesty.forEach((g,i)=>{const b=document.createElement('button');b.type='button';b.className='honesty-item';b.innerHTML=`<span class="num">0${i+1}</span><h3></h3><span class="plus">＋</span><p></p>`;b.querySelector('h3').textContent=g.heading;b.querySelector('p').textContent=g.answer;b.setAttribute('aria-expanded','false');b.addEventListener('click',()=>{b.classList.toggle('revealed');b.setAttribute('aria-expanded',String(b.classList.contains('revealed')));state.honesty.add(i);if(state.honesty.size===C.honesty.length){$('#honesty-outro').hidden=false;unlock('#honesty-next')}});$('#honesty-stack').append(b)});
  const questions=[
    {q:'Що цей хлопець найчастіше робить, якщо щось пішло не так?',opts:['Одразу все ідеально виправляє','Спочатку трохи тупить, потім намагається виправити','Урочисто звинувачує Меркурій'],right:1,correct:'Ти його надто добре знаєш. На жаль для нього 😅',wrong:'Ха, гарна версія. Але спробуй ще.'},
    {q:'Як називається наш ідеальний план на вечір?',opts:['Календар на 17 пунктів','Просто бути разом, а там розберемось','Термінова нарада з порядком денним'],right:1,correct:'О, так. Може, ще щось смачненьке прихопимо.',wrong:'Ми обидва знаємо, що складні плани — це підозріло.'},
    {q:'Чому я взагалі написав цілий сайт?',opts:['Бо люблю ускладнювати собі життя','Бо хотів тебе трохи здивувати й сказати важливе','Бо так попросив інтернет'],right:1,correct:'Ну все. Ти розкусила мій секрет ❤️',wrong:'Не вірю. Спробуй варіант більш схожий на мене.'}
  ];
  let lockedAnswer=false;
  function renderQuiz(){const q=questions[state.quiz];$('#quiz-no').textContent=`ПИТАННЯ ${String(state.quiz+1).padStart(2,'0')} / 03`;$('#quiz-question').textContent=q.q;$('#quiz-feedback').textContent='';const box=$('#quiz-options');box.replaceChildren();q.opts.forEach((option,i)=>{const b=document.createElement('button');b.textContent=option;b.addEventListener('click',()=>{if(lockedAnswer)return;if(i===q.right){lockedAnswer=true;b.classList.add('correct');$('#quiz-feedback').textContent=q.correct;setTimeout(()=>{state.quiz++;lockedAnswer=false;if(state.quiz===questions.length){$('#quiz-card').innerHTML='<div class="quiz-no">РЕЗУЛЬТАТ: 3 ІЗ 3</div><h3>Висновок експертної комісії</h3><p style="font-size:1.05rem;line-height:1.9">Об’єкт «Макс» до кінця не вивчений, іноді поводиться дивно, але до Насті ставиться дуже серйозно. Допуск до наступного розділу відкрито.</p>';unlock('#quiz-next');}else renderQuiz()},1100)}else{b.classList.add('wrong');$('#quiz-feedback').textContent=q.wrong;setTimeout(()=>b.classList.remove('wrong'),800)}});box.append(b)})}renderQuiz();

  let scratchReady=false, scratching=false, strokes=0;const canvas=$('#scratch'), ctx=canvas.getContext('2d',{willReadFrequently:false});
  function setupScratch(){if(scratchReady)return;scratchReady=true;const rect=canvas.getBoundingClientRect();if(rect.width<10){scratchReady=false;return}const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.floor(rect.width*dpr);canvas.height=Math.floor(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);const grad=ctx.createLinearGradient(0,0,rect.width,rect.height);grad.addColorStop(0,'#75576e');grad.addColorStop(.5,'#4d425a');grad.addColorStop(1,'#95737f');ctx.fillStyle=grad;ctx.fillRect(0,0,rect.width,rect.height);ctx.fillStyle='#fff1de';ctx.textAlign='center';ctx.font='italic 34px Georgia';ctx.fillText('одна маленька правда',rect.width/2,rect.height/2-18);ctx.font='13px sans-serif';ctx.fillText('зітри цей шар',rect.width/2,rect.height/2+25)}
  function scratchAt(e){const r=canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(x,y,31,0,Math.PI*2);ctx.fill();if(++strokes>18&&!state.scratch){state.scratch=true;unlock('#scratch-next');$('#scratch-hint').textContent='Ось воно. Деякі речі взагалі не треба ускладнювати.';canvas.style.transition='opacity 1.2s';canvas.style.opacity='0';setTimeout(()=>{canvas.style.pointerEvents='none'},1200)}}
  canvas.addEventListener('pointerdown',e=>{if(!scratchReady)setupScratch();scratching=true;canvas.setPointerCapture(e.pointerId);scratchAt(e)});canvas.addEventListener('pointermove',e=>{if(scratching)scratchAt(e)});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>canvas.addEventListener(ev,()=>scratching=false));
  $('#open-letter').addEventListener('click',()=>{$('#letter-envelope').hidden=true;$('#letter-paper').hidden=false;const text=$('#letter-text');text.replaceChildren();C.letter.forEach(par=>{const p=document.createElement('p');p.textContent=par;text.append(p)});state.letter=true;unlock('#letter-next');toast('Тут можна не поспішати ♥')});

  const starMessages=['Мені смішно з тобою так, як ні з ким.','Мені подобається наша звичайна буденність.','Я хочу краще чути тебе, навіть коли помиляюсь.','Я не хочу, щоб це залишалось тільки на словах.','Я дуже радий, що в моєму житті є ти.'];
  const points=[[77,254],[203,95],[357,185],[483,60],[623,258]];
  document.querySelectorAll('.star-point').forEach((b,i)=>b.addEventListener('click',()=>{if(state.stars.has(i))return;state.stars.add(i);b.classList.add('picked');$('#star-message').textContent=starMessages[i];$('#star-message').classList.add('show');if(state.stars.size===5){setTimeout(()=>{$('#constellation-line').setAttribute('d','M 350 338 C 285 285 80 180 120 88 C 160 -5 285 22 350 120 C 415 22 540 -5 580 88 C 620 180 415 285 350 338 Z');$('#constellation-line').classList.add('complete');setTimeout(revealFinale,1650)},900)}}));
  function revealFinale(){document.querySelector('.scene--finale').classList.add('completed');$('#constellation').style.transition='opacity 1s, transform 1s';$('#constellation').style.opacity='0';$('#constellation').style.transform='scale(1.28)';$('#finale-guide').style.opacity='0';setTimeout(()=>{document.querySelector('.scene--finale h2').textContent='';$('#constellation').hidden=true;$('#final-reveal').hidden=false;$('#last-line').textContent=C.lastLine;const row=$('#final-mini-photos');row.replaceChildren();C.gallery.forEach((g,i)=>{const img=imageMarkup(g);img.style.setProperty('--rotate',['-9deg','5deg','-2deg','7deg','-5deg','6deg','-7deg','4deg','-3deg','8deg'][i]);row.append(img)});burst(150); $('#final-reveal').scrollIntoView({behavior:'smooth',block:'center'})},970)}
  $('#restart').addEventListener('click',()=>{window.location.reload()});
  let particles=[],fctx,fw=0,fh=0,animStarted=false;
  function startFinale(){if(animStarted)return;animStarted=true;const c=$('#finale-canvas');fctx=c.getContext('2d');const resize=()=>{fw=c.width=innerWidth;fh=c.height=Math.max(innerHeight,document.querySelector('.scene--finale').scrollHeight)};resize();window.addEventListener('resize',resize);particles=Array.from({length:95},()=>({x:Math.random()*fw,y:Math.random()*fh,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()*1.3+.3,alpha:.18+Math.random()*.45,life:1}));let last=0;function animate(t){if(t-last<33){requestAnimationFrame(animate);return}last=t;fctx.clearRect(0,0,fw,fh);for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=fw;if(p.x>fw)p.x=0;if(p.y<0)p.y=fh;if(p.y>fh)p.y=0;fctx.beginPath();fctx.fillStyle=`rgba(255,213,183,${p.alpha*p.life})`;fctx.arc(p.x,p.y,p.r,0,Math.PI*2);fctx.fill();if(p.life!==1){p.life-=.014;if(p.life<=0)particles.splice(i,1)}}requestAnimationFrame(animate)}requestAnimationFrame(animate)}
  function burst(n){const x=innerWidth/2,y=innerHeight*.47;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*5;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:1.4+Math.random()*2.4,alpha:.65+Math.random()*.3,life:.75+Math.random()*.45})}}
  // Escape may close the photo modal; arrows navigate photos only inside a modal.
  window.addEventListener('keydown',e=>{if($('#photo-dialog').open){if(e.key==='ArrowRight')openPhoto((photoIndex+1)%C.gallery.length);if(e.key==='ArrowLeft')openPhoto((photoIndex+C.gallery.length-1)%C.gallery.length)}});
})();

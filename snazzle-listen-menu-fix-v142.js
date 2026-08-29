// Snazzle v142 — directe en robuuste koppeling tussen het compacte menu en Luisterverhalen.
// Het v129-menu toont een spiegelknop van de originele luisterknop. Op sommige mobiele
// browsers kan de verborgen bronknop daardoor niet betrouwbaar openen. Deze fix vangt
// de zichtbare menu-keuze direct af en opent de luistermodule via zijn publieke API.

const VERSION='142.2.0';

// Laad de aparte mobiele audiofix met een eigen cache-buster.
import(`./snazzle-listen-audio-fix-v143.js?v=${Date.now()}`).catch(err=>console.error('Luisteraudio fix kon niet laden',err));

function isListenMenuButton(button){
  if(!(button instanceof Element)) return false;
  if(!button.closest('#quickMenuPanel')) return false;
  const text=`${button.id||''} ${button.getAttribute('aria-label')||''} ${button.textContent||''}`.toLowerCase();
  return /luisterverhalen|luister verhalen|snlistenmenuv63/.test(text);
}

function closeQuickMenu(){
  try{document.getElementById('quickMenuClose')?.click();}catch{}
}

function toast(message){
  const el=document.getElementById('toast');
  if(!el) return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__snListenFixToast142);
  window.__snListenFixToast142=setTimeout(()=>el.classList.remove('show'),2600);
}

function openListenStories(){
  closeQuickMenu();

  let tries=0;
  const attempt=()=>{
    const api=window.SnazzleListenStoriesV63;
    if(api?.open){
      setTimeout(()=>{
        try{api.open();}
        catch(err){console.error('Luisterverhalen openen mislukt',err);toast('Luisterverhalen konden niet openen. Probeer het nog eens.');}
      },90);
      return;
    }
    tries++;
    if(tries>=40){
      toast('Luisterverhalen worden nog geladen. Probeer het zo nog eens.');
      return;
    }
    setTimeout(attempt,100);
  };
  attempt();
}

function handleListenClick(event){
  const button=event.target instanceof Element ? event.target.closest('button') : null;
  if(!isListenMenuButton(button)) return;

  // Voorkom dat de spiegelknop daarna alsnog de verborgen oude knop probeert aan te klikken.
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();
  openListenStories();
}

if(!window.__snListenMenuFix142){
  window.__snListenMenuFix142=true;
  document.addEventListener('click',handleListenClick,true);
  document.addEventListener('pointerup',event=>{
    // Click blijft de hoofdroute; pointerup is alleen een mobiele fallback wanneer een browser
    // na een touch geen click produceert. De tijdstempel voorkomt dubbel openen.
    const button=event.target instanceof Element ? event.target.closest('button') : null;
    if(!isListenMenuButton(button)) return;
    const now=Date.now();
    if(now-(window.__snListenPointer142||0)<450) return;
    window.__snListenPointer142=now;
  },true);
}

console.info(`Snazzle luistermenu fix ${VERSION} geladen`);
window.SnazzleListenMenuFixV142={open:openListenStories};

// Snazzle v144 — Luisterverhalen als vaste directe knop in het compacte menu.
// Geen spiegelknop meer: de zichtbare knop opent rechtstreeks de luistermodule.

const VERSION='144.0.0';

function textOf(el){
  return String(`${el?.id||''} ${el?.getAttribute?.('aria-label')||''} ${el?.textContent||''}`).toLowerCase();
}

function toast(message){
  const el=document.getElementById('toast');
  if(!el)return;
  el.textContent=message;
  el.classList.add('show');
  clearTimeout(window.__snListenDirectToast144);
  window.__snListenDirectToast144=setTimeout(()=>el.classList.remove('show'),2600);
}

function closeMenu(){
  try{document.getElementById('quickMenuClose')?.click();}catch{}
}

function openListenDirect(){
  closeMenu();
  let tries=0;
  const attempt=()=>{
    if(window.SnazzleListenStoriesV63?.open){
      try{window.SnazzleListenStoriesV63.open();}
      catch(err){console.error('Luisterverhalen direct openen',err);toast('Luisterverhalen konden niet openen. Probeer het nog eens.');}
      return;
    }
    tries++;
    if(tries>=50){toast('Luisterverhalen worden nog geladen. Probeer het zo nog eens.');return;}
    setTimeout(attempt,100);
  };
  setTimeout(attempt,80);
}

function installDirectListenButton(){
  const root=document.getElementById('snMainMenuV129');
  const play=root?.querySelector('[data-options="play"]');
  if(!play)return false;

  // Verwijder uitsluitend de gespiegeld weergegeven luisterverhalen-knop.
  play.querySelectorAll('.sn-main-proxy').forEach(proxy=>{
    if(/luisterverhalen|luister verhalen|snlistenmenuv63/.test(textOf(proxy))) proxy.remove();
  });

  let button=document.getElementById('snListenDirectMenuV144');
  if(!button){
    button=document.createElement('button');
    button.type='button';
    button.id='snListenDirectMenuV144';
    button.className='sn-main-fixed';
    button.dataset.rank='30';
    button.setAttribute('aria-label','Open Snazzle Luisterverhalen');
    button.innerHTML='<b>🎧</b><span><strong>Luisterverhalen</strong><small>Kies een verhaal en luister</small></span><i>›</i>';
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      openListenDirect();
    });
  }

  const before=[...play.children].find(el=>el!==button && Number(el.dataset.rank||999)>30);
  if(before)play.insertBefore(button,before);else play.appendChild(button);
  return true;
}

function boot(){
  installDirectListenButton();
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    queueMicrotask(()=>{queued=false;installDirectListenButton();});
  });
  observer.observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();

console.info(`Snazzle luistermenu direct ${VERSION} geladen`);
window.SnazzleListenDirectMenuV144={install:installDirectListenButton,open:openListenDirect};

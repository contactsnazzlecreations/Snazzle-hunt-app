// Snazzle Game Menu v178 — robuuste directe ingang naar de Snazzle Wereld.
// Werkt zowel vanaf de verborgen bronknop als vanaf de zichtbare gegroepeerde menu-spiegel.

function closeQuickMenuV178(){
  try{document.getElementById('quickMenuClose')?.click();}catch{}
}

function showToastV178(message){
  const toast=document.getElementById('toast');
  if(!toast)return;
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(window.__snGameToast178);
  window.__snGameToast178=setTimeout(()=>toast.classList.remove('show'),2400);
}

function forceOpenBuiltHubV178(){
  const hub=document.getElementById('sn47Hub');
  if(!hub)return false;

  // De v47-module bouwt de hub al bij het laden. Door een echte tabklik te doen
  // gebruiken we zijn eigen renderfunctie, zonder afhankelijk te zijn van een
  // oude homekaart of documentbrede kliklistener.
  hub.classList.add('show');
  hub.setAttribute('aria-hidden','false');
  document.body.classList.add('sn47-no-scroll');

  const room=hub.querySelector('[data-sn47-tab="room"]');
  if(room){
    try{room.click();}catch{}
  }
  return true;
}

function triggerLegacyEntryV178(){
  let entry=document.querySelector('.v38-world-entry');
  let temporary=false;
  if(!entry){
    entry=document.createElement('button');
    entry.type='button';
    entry.className='v38-world-entry';
    entry.hidden=true;
    document.body.appendChild(entry);
    temporary=true;
  }
  try{
    entry.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,composed:true,view:window}));
  }catch{
    try{entry.click();}catch{}
  }
  if(temporary)setTimeout(()=>entry.remove(),400);
}

async function openSnazzleGameV62(){
  closeQuickMenuV178();

  // Eerste keuze: de reeds gebouwde hub rechtstreeks openen. Dit is het snelst
  // en voorkomt de oude keten proxy -> bronknop -> verborgen homekaart -> hub.
  if(forceOpenBuiltHubV178())return;

  showToastV178('Snazzle Spel openen…');

  // Als de hub net iets later geladen wordt, wachten we kort. De knop blijft dus
  // ook op langzamere Android-toestellen betrouwbaar werken.
  for(let i=0;i<20;i++){
    await new Promise(resolve=>setTimeout(resolve,100));
    if(forceOpenBuiltHubV178())return;
  }

  // Laatste compatibiliteitsroute voor oudere/cached versies.
  triggerLegacyEntryV178();
  setTimeout(()=>{
    if(!document.getElementById('sn47Hub')?.classList.contains('show')){
      showToastV178('Snazzle Spel is nog aan het laden. Probeer nog één keer.');
    }
  },500);
}

function installSnazzleGameMenuV62(){
  const list=document.querySelector('#quickMenuPanel .quick-menu-list');
  if(!list || document.getElementById('snazzleGameMenuV62')) return;

  const btn=document.createElement('button');
  btn.id='snazzleGameMenuV62';
  btn.type='button';
  btn.setAttribute('aria-label','Open het Snazzle Spel');
  btn.innerHTML='<b>🎮</b><span><strong>Snazzle Spel</strong><small>Speel in de Snazzle Wereld</small></span><i>›</i>';
  btn.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    openSnazzleGameV62();
  });

  const hunt=[...list.querySelectorAll('button')].find(b=>b.dataset?.quickAction==='hunt');
  if(hunt?.nextSibling) list.insertBefore(btn,hunt.nextSibling);
  else list.appendChild(btn);
}

// De nieuwe hoofdmenu-indeling toont een spiegelknop. Vang die klik rechtstreeks
// op zodat we niet meer afhankelijk zijn van source.click() op een verborgen knop.
document.addEventListener('click',e=>{
  const visible=e.target?.closest?.('#snMainMenuV129 .sn-main-proxy,#snMainMenuV129 .sn-main-fixed');
  if(!visible)return;
  const text=(visible.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
  if(!text.includes('snazzle spel'))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  openSnazzleGameV62();
},true);

function initV62(){
  installSnazzleGameMenuV62();
  const observer=new MutationObserver(()=>installSnazzleGameMenuV62());
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initV62,{once:true});
else initV62();

window.SnazzleGameMenuV62={open:openSnazzleGameV62,install:installSnazzleGameMenuV62,version:'178-direct-hub'};

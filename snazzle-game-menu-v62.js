// Snazzle v62 — zet het Snazzle Spel weer duidelijk in het gewone Snazzle-menu.
// De bestaande Snazzle Wereld/hub blijft volledig intact; dit bestand herstelt alleen de ingang.

function openSnazzleGameV62(){
  // Sluit eerst het gewone menu zodat de spelwereld vrij kan openen.
  try{ document.getElementById('quickMenuClose')?.click(); }catch{}

  // v47 luistert documentbreed naar een klik op .v38-world-entry en opent dan
  // de complete Snazzle Wereld-hub. Gebruik de bestaande ingang als die er is.
  let entry=document.querySelector('.v38-world-entry');
  let temporary=false;
  if(!entry){
    // Robuuste fallback als de oude homekaart niet meer zichtbaar is.
    entry=document.createElement('button');
    entry.type='button';
    entry.className='v38-world-entry';
    entry.hidden=true;
    document.body.appendChild(entry);
    temporary=true;
  }
  setTimeout(()=>{
    try{ entry.click(); }
    finally{ if(temporary) entry.remove(); }
  },80);
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

  // Zet het spel hoog in het menu, direct na Hunt zoeken.
  const hunt=[...list.querySelectorAll('button')].find(b=>b.dataset?.quickAction==='hunt');
  if(hunt?.nextSibling) list.insertBefore(btn,hunt.nextSibling);
  else list.appendChild(btn);
}

function initV62(){
  installSnazzleGameMenuV62();
  new MutationObserver(()=>installSnazzleGameMenuV62()).observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initV62,{once:true});
else initV62();

window.SnazzleGameMenuV62={open:openSnazzleGameV62,install:installSnazzleGameMenuV62};

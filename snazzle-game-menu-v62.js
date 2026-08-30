// Snazzle Game Menu v179 — duidelijke scheiding tussen spelletjes en de twee Snazzle-werelden.
// Spelletjes = minigames, Mijn Snazzle Wereld = persoonlijke hub, Ontdekkerswereld = interactief bosavontuur.

function closeQuickMenuV179(){
  try{document.getElementById('quickMenuClose')?.click();}catch{}
}

function showToastV179(message){
  const toast=document.getElementById('toast');
  if(!toast)return;
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(window.__snGameToast179);
  window.__snGameToast179=setTimeout(()=>toast.classList.remove('show'),2400);
}

function forceOpenBuiltHubV179(){
  const hub=document.getElementById('sn47Hub');
  if(!hub)return false;

  hub.classList.add('show');
  hub.setAttribute('aria-hidden','false');
  document.body.classList.add('sn47-no-scroll');

  const room=hub.querySelector('[data-sn47-tab="room"]');
  if(room){
    try{room.click();}catch{}
  }
  return true;
}

function triggerLegacyEntryV179(){
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
  closeQuickMenuV179();

  if(forceOpenBuiltHubV179())return;

  showToastV179('Mijn Snazzle Wereld openen…');

  for(let i=0;i<20;i++){
    await new Promise(resolve=>setTimeout(resolve,100));
    if(forceOpenBuiltHubV179())return;
  }

  triggerLegacyEntryV179();
  setTimeout(()=>{
    if(!document.getElementById('sn47Hub')?.classList.contains('show')){
      showToastV179('Mijn Snazzle Wereld is nog aan het laden. Probeer nog één keer.');
    }
  },500);
}

function menuProxyForSourceV179(source){
  if(!source)return null;
  const key=source.__snMainKey;
  if(!key)return null;
  try{return document.querySelector(`#snMainMenuV129 .sn-main-proxy[data-source-key="${CSS.escape(key)}"]`);}
  catch{return document.querySelector(`#snMainMenuV129 .sn-main-proxy[data-source-key="${key}"]`);}
}

function setMenuCardV179(el,icon,title,sub){
  if(!el)return;
  let b=el.querySelector(':scope > b');
  let span=el.querySelector(':scope > span');
  let strong=span?.querySelector('strong');
  let small=span?.querySelector('small');
  if(b)b.textContent=icon;
  if(strong)strong.textContent=title;
  if(small)small.textContent=sub;
}

function putAtRankV179(box,el,rank){
  if(!box||!el||el.parentElement!==box)return;
  el.dataset.rank=String(rank);
  const before=[...box.children].find(x=>x!==el&&Number(x.dataset.rank||999)>rank);
  if(before)box.insertBefore(el,before);
  else box.appendChild(el);
}

function relabelPlayMenuV179(){
  const list=document.querySelector('#quickMenuPanel .quick-menu-list');
  const playBox=document.querySelector('#snMainMenuV129 [data-options="play"]');

  // 1. Spelletjes: alleen minigames, nu explicieter benoemd.
  const games=list?.querySelector('[data-snazzle-fun="games"]');
  if(games){
    setMenuCardV179(games,'🎮','Spelletjes','Puzzel & minigames');
    games.setAttribute('aria-label','Open Snazzle Spelletjes');
    const proxy=menuProxyForSourceV179(games);
    setMenuCardV179(proxy,'🎮','Spelletjes','Puzzel & minigames');
    putAtRankV179(playBox,proxy,10);
  }

  // 2. Persoonlijke hub: kamer, verhalen, opdrachten en badges.
  const mine=document.getElementById('snazzleGameMenuV62');
  if(mine){
    mine.dataset.quickAction='snazzle spel'; // interne sleutel houdt deze ingang hoog in de groep Spelen.
    mine.setAttribute('aria-label','Open Mijn Snazzle Wereld');
    setMenuCardV179(mine,'🏡','Mijn Snazzle Wereld','Kamer, avonturen, verhalen & badges');
    const proxy=menuProxyForSourceV179(mine);
    setMenuCardV179(proxy,'🏡','Mijn Snazzle Wereld','Kamer, avonturen, verhalen & badges');
    putAtRankV179(playBox,proxy,11);
  }

  // 3. Het bestaande interactieve bosspel krijgt een eigen, niet-verwarrende naam.
  const explore=list?.querySelector('[data-v38-world]');
  if(explore){
    explore.dataset.quickAction='game ontdekkerswereld';
    explore.setAttribute('aria-label','Open de Ontdekkerswereld');
    setMenuCardV179(explore,'🌍','Ontdekkerswereld','Interactief bosavontuur');
    let proxy=menuProxyForSourceV179(explore);
    if(!proxy){
      proxy=[...document.querySelectorAll('#snMainMenuV129 .sn-main-proxy')].find(el=>{
        const t=el.querySelector('strong')?.textContent?.trim();
        return t==='Snazzle Wereld'||t==='Ontdekkerswereld';
      });
    }
    setMenuCardV179(proxy,'🌍','Ontdekkerswereld','Interactief bosavontuur');
    putAtRankV179(playBox,proxy,12);
  }
}

function installSnazzleGameMenuV62(){
  const list=document.querySelector('#quickMenuPanel .quick-menu-list');
  if(!list)return;

  let btn=document.getElementById('snazzleGameMenuV62');
  if(!btn){
    btn=document.createElement('button');
    btn.id='snazzleGameMenuV62';
    btn.type='button';
    btn.dataset.quickAction='snazzle spel';
    btn.setAttribute('aria-label','Open Mijn Snazzle Wereld');
    btn.innerHTML='<b>🏡</b><span><strong>Mijn Snazzle Wereld</strong><small>Kamer, avonturen, verhalen & badges</small></span><i>›</i>';
    btn.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      openSnazzleGameV62();
    });

    const hunt=[...list.querySelectorAll('button')].find(b=>b.dataset?.quickAction==='hunt');
    if(hunt?.nextSibling)list.insertBefore(btn,hunt.nextSibling);
    else list.appendChild(btn);
  }

  relabelPlayMenuV179();
}

// De zichtbare spiegelknop krijgt een directe route naar de persoonlijke wereld.
document.addEventListener('click',e=>{
  const visible=e.target?.closest?.('#snMainMenuV129 .sn-main-proxy,#snMainMenuV129 .sn-main-fixed');
  if(!visible)return;
  const text=(visible.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
  if(!text.includes('mijn snazzle wereld')&&!text.includes('snazzle spel'))return;
  e.preventDefault();
  e.stopImmediatePropagation();
  openSnazzleGameV62();
},true);

function initV62(){
  installSnazzleGameMenuV62();
  let queued=false;
  const observer=new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      installSnazzleGameMenuV62();
      relabelPlayMenuV179();
    });
  });
  if(document.body)observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(relabelPlayMenuV179,250);
  setTimeout(relabelPlayMenuV179,900);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initV62,{once:true});
else initV62();

window.SnazzleGameMenuV62={open:openSnazzleGameV62,install:installSnazzleGameMenuV62,relabel:relabelPlayMenuV179,version:'179-clear-play-menu'};

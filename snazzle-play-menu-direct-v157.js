// Snazzle v157 — directe, lokale koppeling voor de drie knoppen onder Spelen.
// Alleen Snazzle Spel, De Bieb en Luisterverhalen worden aangepast.

(function installSnazzlePlayMenuDirectV157(){
  if(window.__snazzlePlayMenuDirectV157) return;
  window.__snazzlePlayMenuDirectV157=true;

  const fresh=path=>window.__snazzleFresh ? window.__snazzleFresh(path) : `${path}?v=157-${Date.now()}`;

  function closeMenuHard(){
    try{document.getElementById('quickMenuClose')?.click();}catch{}
    const overlay=document.getElementById('quickMenuOverlay');
    if(overlay){
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden','true');
    }
    document.getElementById('quickMenuBtn')?.setAttribute('aria-expanded','false');
    document.documentElement.style.overflow='';
    document.body.style.overflow='';
  }

  async function ensureModule(path){
    try{return await import(fresh(path));}
    catch(err){console.error(`Spelen-module kon niet laden: ${path}`,err);return null;}
  }

  function toast(message){
    const el=document.getElementById('toast');
    if(!el)return;
    el.textContent=message;
    el.classList.add('show');
    clearTimeout(window.__snPlayDirectToast157);
    window.__snPlayDirectToast157=setTimeout(()=>el.classList.remove('show'),2600);
  }

  async function openGame(){
    closeMenuHard();
    if(!window.SnazzleGameMenuV62?.open){
      await ensureModule('./snazzle-world-hub-v47.js');
      await ensureModule('./snazzle-game-menu-v62.js');
    }
    if(window.SnazzleGameMenuV62?.open){
      window.SnazzleGameMenuV62.open();
      return;
    }
    toast('Snazzle Spel kon nog niet openen.');
  }

  async function openBieb(){
    closeMenuHard();
    if(!window.SnazzleBiebV73?.open) await ensureModule('./snazzle-bieb-v73.js');
    if(window.SnazzleBiebV73?.open){
      window.SnazzleBiebV73.open();
      return;
    }
    toast('De Bieb kon nog niet openen.');
  }

  async function openListen(){
    closeMenuHard();
    if(!window.SnazzleListenStoriesV63?.open) await ensureModule('./snazzle-listen-stories-v63.js');
    if(window.SnazzleListenMenuFixV142?.open){
      window.SnazzleListenMenuFixV142.open();
      return;
    }
    if(window.SnazzleListenStoriesV63?.open){
      window.SnazzleListenStoriesV63.open();
      try{window.SnazzleListenListFixV150?.refresh?.();}catch{}
      return;
    }
    toast('Luisterverhalen konden nog niet openen.');
  }

  function kindOf(button){
    const text=String(`${button?.id||''} ${button?.getAttribute?.('aria-label')||''} ${button?.textContent||''}`).toLowerCase();
    if(/snazzle spel|snazzlegamemenuv62/.test(text)) return 'game';
    if(/\bde bieb\b|snbiebmenu73|jouw boeken en leeshoek/.test(text)) return 'bieb';
    if(/luisterverhalen|luister verhalen|snlistenmenuv63/.test(text)) return 'listen';
    return '';
  }

  function wireButton(current){
    const kind=kindOf(current);
    if(!kind || current.dataset.playDirect157===kind) return false;

    const button=current.cloneNode(true);
    button.dataset.playDirect157=kind;
    current.replaceWith(button);
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      if(kind==='game') openGame();
      if(kind==='bieb') openBieb();
      if(kind==='listen') openListen();
    });
    return true;
  }

  function wirePlayButtons(){
    const play=document.querySelector('#snMainMenuV129 [data-options="play"]');
    if(!play) return false;
    [...play.querySelectorAll(':scope > button')].forEach(wireButton);
    return true;
  }

  function boot(){
    wirePlayButtons();
    const root=document.getElementById('snMainMenuV129');
    if(root && !root.__snPlayDirectObserver157){
      const observer=new MutationObserver(()=>wirePlayButtons());
      observer.observe(root,{childList:true,subtree:true});
      root.__snPlayDirectObserver157=observer;
    }
  }

  boot();
  const bodyObserver=new MutationObserver(()=>boot());
  bodyObserver.observe(document.body,{childList:true,subtree:true});

  window.SnazzlePlayMenuDirectV157={openGame,openBieb,openListen,wire:wirePlayButtons};
})();
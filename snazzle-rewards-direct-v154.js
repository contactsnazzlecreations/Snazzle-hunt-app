// Snazzle v155 — veilige directe openers voor Mijn kaarten en Mijn beloningen.
// Bewust klein gehouden: alleen deze twee menuknoppen worden aangepast.

(function installSnazzleCollectionDirectV155(){
  if(window.__snazzleCollectionDirectV155) return;
  window.__snazzleCollectionDirectV155=true;

  const closeMenu=()=>{
    try{ document.getElementById('quickMenuClose')?.click(); }catch{}
    const overlay=document.getElementById('quickMenuOverlay');
    if(overlay){
      overlay.classList.remove('show');
      overlay.setAttribute('aria-hidden','true');
    }
    document.getElementById('quickMenuBtn')?.setAttribute('aria-expanded','false');
    document.documentElement.style.overflow='';
    document.body.style.overflow='';
  };

  const openCollectionTab=tab=>{
    closeMenu();
    const targetId=tab==='nest' ? 'collectionNest' : 'collectionCards';

    const openNow=()=>{
      const sheet=document.getElementById('collectionSheet');
      const target=document.getElementById(targetId);
      if(!sheet || !target) return false;

      sheet.querySelectorAll('[data-collection-tab]').forEach(btn=>{
        btn.classList.toggle('on',btn.dataset.collectionTab===tab);
      });
      sheet.querySelectorAll('.collection-section').forEach(section=>section.classList.remove('on'));
      target.classList.add('on');
      sheet.classList.add('show');
      const panel=sheet.querySelector('.panel');
      if(panel) panel.scrollTop=0;
      return true;
    };

    if(openNow()) return;

    // Alleen als de collectie nog niet klaar is: gebruik één keer de bestaande collectie-ingang.
    try{
      (document.querySelector('#quickMenuPanel .quick-menu-list > [data-snazzle-collection]') ||
       document.querySelector('.collection-home-card'))?.click();
    }catch{}

    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(openNow() || tries>=30) clearInterval(timer);
    },100);
  };

  const wireOne=(id,marker,tab)=>{
    const current=document.getElementById(id);
    if(!current || current.dataset[marker]==='1') return false;

    // Clone verwijdert alleen de oude listener van deze ene knop; uiterlijk en tekst blijven gelijk.
    const button=current.cloneNode(true);
    button.dataset[marker]='1';
    current.replaceWith(button);
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      openCollectionTab(tab);
    });
    return true;
  };

  const wireButtons=()=>{
    wireOne('snCardsMenuV129','cardsDirect155','cards');
    wireOne('snRewardsMenuV129','rewardsDirect155','nest');
  };

  wireButtons();
  const observer=new MutationObserver(wireButtons);
  observer.observe(document.body,{childList:true,subtree:true});

  window.SnazzleCollectionDirectV155={
    openCards:()=>openCollectionTab('cards'),
    openRewards:()=>openCollectionTab('nest'),
    wire:wireButtons
  };
})();
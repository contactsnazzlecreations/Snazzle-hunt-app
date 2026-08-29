// Snazzle v154 — veilige directe opener voor Mijn beloningen.
// Bewust klein gehouden: geen globale click/pointer intercepts en geen wijzigingen aan andere schermen.

(function installSnazzleRewardsDirectV154(){
  if(window.__snazzleRewardsDirectV154) return;
  window.__snazzleRewardsDirectV154=true;

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

  const openRewards=()=>{
    closeMenu();

    const openNow=()=>{
      const sheet=document.getElementById('collectionSheet');
      const nest=document.getElementById('collectionNest');
      if(!sheet || !nest) return false;

      sheet.querySelectorAll('[data-collection-tab]').forEach(btn=>{
        const active=btn.dataset.collectionTab==='nest';
        btn.classList.toggle('on',active);
      });
      sheet.querySelectorAll('.collection-section').forEach(section=>section.classList.remove('on'));
      nest.classList.add('on');
      sheet.classList.add('show');
      const panel=sheet.querySelector('.panel');
      if(panel) panel.scrollTop=0;
      return true;
    };

    if(openNow()) return;

    // Alleen als de collectie nog niet klaar is: activeer één keer de bestaande collectie-ingang.
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

  const wireButton=()=>{
    const current=document.getElementById('snRewardsMenuV129');
    if(!current || current.dataset.rewardsDirect154==='1') return false;

    // Clone verwijdert alleen de oude listener van deze ene knop; alle vormgeving/tekst blijft gelijk.
    const button=current.cloneNode(true);
    button.dataset.rewardsDirect154='1';
    current.replaceWith(button);
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopPropagation();
      openRewards();
    });
    return true;
  };

  wireButton();
  const observer=new MutationObserver(()=>wireButton());
  observer.observe(document.body,{childList:true,subtree:true});

  window.SnazzleRewardsV154={open:openRewards,wire:wireButton};
})();
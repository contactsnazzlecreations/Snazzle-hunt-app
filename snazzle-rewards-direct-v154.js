// Snazzle v156 — Mijn kaarten en Mijn beloningen openen als duidelijk aparte schermen.
// Beide gebruiken nog dezelfde centrale collectie-data, maar tonen ieder alleen hun eigen inhoud.

(function installSnazzleCollectionDirectV156(){
  if(window.__snazzleCollectionDirectV156) return;
  window.__snazzleCollectionDirectV156=true;

  function ensureFocusStyle(){
    if(document.getElementById('snCollectionFocusStyleV156')) return;
    const style=document.createElement('style');
    style.id='snCollectionFocusStyleV156';
    style.textContent=`
      #collectionSheet.sn-focus-v156 .collection-hero,
      #collectionSheet.sn-focus-v156 .collection-tabs{display:none!important}
      #collectionSheet.sn-focus-v156 .collection-controls{margin-top:10px}
      #snCollectionFocusBannerV156{margin:2px 0 14px;padding:15px 16px;border-radius:20px;border:3px solid #6d4b27;box-shadow:0 5px 0 #4d331d;color:#fff;position:relative;overflow:hidden}
      #snCollectionFocusBannerV156.cards{background:linear-gradient(135deg,#5f4fd0,#3952b9 52%,#167e68)}
      #snCollectionFocusBannerV156.rewards{background:linear-gradient(135deg,#d77a21,#b64d31 52%,#7440a7)}
      #snCollectionFocusBannerV156 .sn-focus-icon{font-size:42px;line-height:1;margin-bottom:5px}
      #snCollectionFocusBannerV156 strong{display:block;font-size:23px;line-height:1.1}
      #snCollectionFocusBannerV156 small{display:block;margin-top:5px;font-size:12px;line-height:1.35;font-weight:800;color:#fff7dc}
      #collectionSheet.sn-focus-rewards-v156 .collection-controls{display:none!important}
      #collectionSheet.sn-focus-cards-v156 #collectionCards{display:block!important}
      #collectionSheet.sn-focus-rewards-v156 #collectionNest{display:block!important}
    `;
    document.head.appendChild(style);
  }

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

  function resetFocus(){
    const sheet=document.getElementById('collectionSheet');
    if(!sheet) return;
    sheet.classList.remove('sn-focus-v156','sn-focus-cards-v156','sn-focus-rewards-v156');
    document.getElementById('snCollectionFocusBannerV156')?.remove();
    const title=sheet.querySelector('.collection-panel>h2');
    if(title) title.textContent='Mijn Snazzle Wereld ✨';
  }

  function applyFocus(tab){
    ensureFocusStyle();
    const sheet=document.getElementById('collectionSheet');
    const targetId=tab==='nest' ? 'collectionNest' : 'collectionCards';
    const target=document.getElementById(targetId);
    if(!sheet || !target) return false;

    resetFocus();
    sheet.classList.add('sn-focus-v156',tab==='nest'?'sn-focus-rewards-v156':'sn-focus-cards-v156');

    const title=sheet.querySelector('.collection-panel>h2');
    if(title) title.textContent=tab==='nest'?'Mijn beloningen 🎁':'Mijn kaarten 🃏';

    const banner=document.createElement('div');
    banner.id='snCollectionFocusBannerV156';
    banner.className=tab==='nest'?'rewards':'cards';
    banner.innerHTML=tab==='nest'
      ? '<div class="sn-focus-icon">🎁🥚</div><strong>Mijn beloningen</strong><small>Bekijk je Snazzle Nest, mijlpalen en geheime bonus-Snazzles die je met echte vondsten kunt verdienen.</small>'
      : '<div class="sn-focus-icon">🃏✨</div><strong>Mijn kaarten</strong><small>Hier zie je jouw verzamelde Snazzle Cards en de kaarten die nog op ontdekking wachten.</small>';

    const controls=sheet.querySelector('.collection-controls');
    if(controls) controls.before(banner);
    else sheet.querySelector('.collection-panel')?.prepend(banner);

    sheet.querySelectorAll('[data-collection-tab]').forEach(btn=>{
      const active=btn.dataset.collectionTab===tab;
      btn.classList.toggle('on',active);
      btn.setAttribute('aria-selected',active?'true':'false');
    });
    sheet.querySelectorAll('.collection-section').forEach(section=>section.classList.remove('on'));
    target.classList.add('on');
    sheet.classList.add('show');
    sheet.setAttribute('aria-hidden','false');

    const panel=sheet.querySelector('.panel');
    if(panel) panel.scrollTop=0;
    return true;
  }

  const openCollectionTab=tab=>{
    closeMenu();
    if(applyFocus(tab)) return;

    // Als de collectie nog niet is opgebouwd, activeer eenmaal de bestaande collectiebron.
    try{
      (document.querySelector('#quickMenuPanel .quick-menu-list > [data-snazzle-collection]') ||
       document.querySelector('.collection-home-card'))?.click();
    }catch{}

    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(applyFocus(tab) || tries>=35) clearInterval(timer);
    },100);
  };

  const wireOne=(id,marker,tab)=>{
    const current=document.getElementById(id);
    if(!current || current.dataset[marker]==='1') return false;

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

  function wireGenericReset(){
    const candidates=[
      document.querySelector('#quickMenuPanel .quick-menu-list > [data-snazzle-collection]'),
      document.querySelector('.collection-home-card')
    ].filter(Boolean);
    candidates.forEach(el=>{
      if(el.dataset.focusReset156==='1') return;
      el.dataset.focusReset156='1';
      el.addEventListener('click',resetFocus,{capture:true});
    });
  }

  const wireButtons=()=>{
    wireOne('snCardsMenuV129','cardsDirect156','cards');
    wireOne('snRewardsMenuV129','rewardsDirect156','nest');
    wireGenericReset();
  };

  wireButtons();
  const observer=new MutationObserver(wireButtons);
  observer.observe(document.body,{childList:true,subtree:true});

  window.SnazzleCollectionDirectV156={
    openCards:()=>openCollectionTab('cards'),
    openRewards:()=>openCollectionTab('nest'),
    reset:resetFocus,
    wire:wireButtons
  };
})();
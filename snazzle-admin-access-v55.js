// Snazzle v55 — robuuste directe toegang tot Beheer op mobiel.
// Het slotje blijft zichtbaar en klikbaar naast het gewone Snazzle-menu.

function installAdminAccessV55(){
  const btn=document.getElementById('adminBtn');
  if(!btn) return;

  // Sommige oudere/newer lagen verbergen het oorspronkelijke slotje.
  // We houden het bewust als veilige directe beheer-ingang.
  btn.style.setProperty('display','grid','important');
  btn.style.setProperty('place-items','center','important');
  btn.style.setProperty('position','relative','important');
  btn.style.setProperty('z-index','31','important');
  btn.style.setProperty('pointer-events','auto','important');
  btn.style.setProperty('touch-action','manipulation','important');
  btn.setAttribute('aria-label','Snazzle Beheer openen');
  btn.title='Snazzle Beheer';

  const top=btn.closest('.top');
  if(top){
    top.style.setProperty('z-index','30','important');
    top.style.setProperty('pointer-events','auto','important');
  }

  if(btn.dataset.v55AdminAccess==='1') return;
  btn.dataset.v55AdminAccess='1';

  const openAdmin=event=>{
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const role=(document.getElementById('adminRole')?.textContent||'').trim();
    const adminSheet=document.getElementById('adminSheet');
    const loginSheet=document.getElementById('adminLogin');
    const alreadyAdmin=role && role!=='Niet ingelogd';
    const target=alreadyAdmin ? adminSheet : loginSheet;
    if(target){
      target.classList.add('show');
      target.setAttribute('aria-hidden','false');
    }
  };

  // Capture voorkomt dat een andere laag de tik onderweg onderschept.
  btn.addEventListener('click',openAdmin,true);
  btn.addEventListener('pointerup',e=>{
    if(e.pointerType==='touch' || e.pointerType==='pen') openAdmin(e);
  },true);
}

installAdminAccessV55();
setTimeout(installAdminAccessV55,400);
setTimeout(installAdminAccessV55,1400);
new MutationObserver(()=>installAdminAccessV55()).observe(document.body,{childList:true,subtree:true});

window.SnazzleAdminAccessV55={open(){document.getElementById('adminBtn')?.click();}};

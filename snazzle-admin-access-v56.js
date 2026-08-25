// Snazzle v56 — beheercompatibiliteit zonder extra slotje in de header.
// Het gewone Snazzle-menu is de vaste ingang voor Beheer.

const adminButton=()=>document.getElementById('adminBtn');

function hideHeaderAdminV56(){
  const btn=adminButton();
  if(!btn) return;
  btn.style.setProperty('display','none','important');
  btn.style.setProperty('visibility','hidden','important');
  btn.style.setProperty('opacity','0','important');
  btn.style.setProperty('pointer-events','none','important');
  btn.setAttribute('aria-hidden','true');
}

function showAdminV56(){
  const role=(document.getElementById('adminRole')?.textContent||'').trim();
  const isAdmin=role && role!=='Niet ingelogd';
  const target=document.getElementById(isAdmin ? 'adminSheet' : 'adminLogin');
  if(!target) return false;
  target.classList.add('show');
  target.setAttribute('aria-hidden','false');
  target.style.setProperty('display','flex','important');
  target.style.setProperty('z-index','13050','important');
  return true;
}

function clearLegacyAdminRoute(){
  try{
    const url=new URL(location.href);
    if(url.searchParams.get('beheer')!=='1') return;
    url.searchParams.delete('beheer');
    history.replaceState(history.state,'',url.pathname+(url.searchParams.toString()?`?${url.searchParams}`:'')+url.hash);
  }catch{}
}

function initV56(){
  hideHeaderAdminV56();
  const direct=new URLSearchParams(location.search).get('beheer')==='1';
  if(direct){
    // Oude directe beheerlinks blijven bruikbaar, maar openen slechts één keer.
    // De URL wordt meteen opgeschoond zodat vernieuwen of opnieuw openen naar Home gaat.
    clearLegacyAdminRoute();
    setTimeout(showAdminV56,700);
  }
}

initV56();
setTimeout(hideHeaderAdminV56,350);
setTimeout(hideHeaderAdminV56,1200);
new MutationObserver(()=>hideHeaderAdminV56()).observe(document.body,{childList:true,subtree:true});

window.SnazzleAdminAccessV56={open:showAdminV56};

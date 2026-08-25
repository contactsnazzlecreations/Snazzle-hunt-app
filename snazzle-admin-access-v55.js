// Snazzle v55 — mobiele beheercompatibiliteit.
// Beheer blijft beschikbaar via het Snazzle-menu; het losse slotje in de header blijft verborgen.

function hideHeaderAdminV55(){
  const btn=document.getElementById('adminBtn');
  if(!btn) return;
  btn.style.setProperty('display','none','important');
  btn.style.setProperty('visibility','hidden','important');
  btn.style.setProperty('pointer-events','none','important');
  btn.setAttribute('aria-hidden','true');
}

function openAdminV55(){
  const role=(document.getElementById('adminRole')?.textContent||'').trim();
  const isAdmin=role && role!=='Niet ingelogd';
  const target=document.getElementById(isAdmin ? 'adminSheet' : 'adminLogin');
  if(!target) return false;
  target.classList.add('show');
  target.setAttribute('aria-hidden','false');
  return true;
}

hideHeaderAdminV55();
setTimeout(hideHeaderAdminV55,400);
setTimeout(hideHeaderAdminV55,1400);
new MutationObserver(()=>hideHeaderAdminV55()).observe(document.body,{childList:true,subtree:true});

window.SnazzleAdminAccessV55={open:openAdminV55};

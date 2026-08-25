// Snazzle v56 — onafhankelijke beheer-ingang, ook als een andere laag de zichtbare knop overlapt.

const adminButton = () => document.getElementById('adminBtn');

function showAdminV56(){
  const role=(document.getElementById('adminRole')?.textContent||'').trim();
  const isAdmin=role && role!=='Niet ingelogd';
  const target=document.getElementById(isAdmin ? 'adminSheet' : 'adminLogin');
  if(!target) return false;

  // Zorg dat beheer altijd boven de presentatielagen uitkomt.
  target.classList.add('show');
  target.setAttribute('aria-hidden','false');
  target.style.setProperty('display','flex','important');
  target.style.setProperty('z-index','13050','important');

  const panel=target.querySelector('.panel');
  if(panel){
    panel.style.setProperty('position','relative','important');
    panel.style.setProperty('z-index','1','important');
    panel.style.setProperty('pointer-events','auto','important');
  }
  return true;
}

function keepButtonUsableV56(){
  const btn=adminButton();
  if(!btn) return;
  btn.style.setProperty('display','grid','important');
  btn.style.setProperty('place-items','center','important');
  btn.style.setProperty('visibility','visible','important');
  btn.style.setProperty('opacity','1','important');
  btn.style.setProperty('position','relative','important');
  btn.style.setProperty('z-index','13020','important');
  btn.style.setProperty('pointer-events','auto','important');
  btn.style.setProperty('touch-action','manipulation','important');
  btn.setAttribute('aria-label','Snazzle Beheer openen');
  btn.title='Snazzle Beheer';

  const top=btn.closest('.top');
  if(top){
    top.style.setProperty('position','relative','important');
    top.style.setProperty('z-index','13010','important');
  }
}

function pointHitsAdminV56(x,y){
  const btn=adminButton();
  if(!btn) return false;
  const r=btn.getBoundingClientRect();
  const pad=8;
  return x>=r.left-pad && x<=r.right+pad && y>=r.top-pad && y<=r.bottom+pad;
}

// Document-capture: zelfs als een onzichtbare laag boven de knop ligt, zien wij de tik als eerste.
document.addEventListener('pointerdown',e=>{
  keepButtonUsableV56();
  if(!pointHitsAdminV56(e.clientX,e.clientY)) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  showAdminV56();
},true);

document.addEventListener('click',e=>{
  const btn=adminButton();
  if(!btn || !(e.target===btn || btn.contains(e.target))) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  showAdminV56();
},true);

function initV56(){
  keepButtonUsableV56();
  const direct=new URLSearchParams(location.search).get('beheer')==='1';
  if(direct){
    // Directe beheerlink: geen tik op het slotje nodig.
    setTimeout(showAdminV56,250);
    setTimeout(showAdminV56,900);
    setTimeout(showAdminV56,1800);
  }
}

initV56();
setTimeout(keepButtonUsableV56,350);
setTimeout(keepButtonUsableV56,1200);
new MutationObserver(()=>keepButtonUsableV56()).observe(document.body,{childList:true,subtree:true});

window.SnazzleAdminAccessV56={open:showAdminV56};

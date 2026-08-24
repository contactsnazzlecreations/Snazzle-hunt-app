// Snazzle Hunt v44 — minimale mobiele fix voor alleen het dorpsvenster.
// Geen MutationObserver, geen globale click-capture en geen globale touch-action regels.
// Dit voorkomt dat andere knoppen, scroll of geheime Snazzle-interacties worden geraakt.

const q44=(s,r=document)=>r.querySelector(s);
let lastAction44=0;

function closeVillage44(){
  const sheet=q44('#villageSheet');
  if(!sheet) return;
  sheet.classList.remove('show');
  sheet.setAttribute('aria-hidden','true');
}

function useVillage44(){
  closeVillage44();
  window.setTimeout(()=>{
    const hunt=q44('.hunt');
    if(hunt) hunt.scrollIntoView({behavior:'smooth',block:'start'});
  },60);
}

function once44(fn){
  const now=Date.now();
  if(now-lastAction44<280) return;
  lastAction44=now;
  fn();
}

function bind44(){
  const sheet=q44('#villageSheet');
  if(!sheet) return;

  const close=q44('[data-close="villageSheet"], .close',sheet);
  const use=q44('#useVillageBtn',sheet);

  if(close && close.dataset.v44Bound!=='1'){
    close.dataset.v44Bound='1';
    close.style.touchAction='manipulation';
    close.addEventListener('pointerup',()=>once44(closeVillage44));
    close.addEventListener('click',()=>once44(closeVillage44));
  }

  if(use && use.dataset.v44Bound!=='1'){
    use.dataset.v44Bound='1';
    use.style.touchAction='manipulation';
    use.addEventListener('pointerup',()=>once44(useVillage44));
    use.addEventListener('click',()=>once44(useVillage44));
  }
}

function init44(){
  bind44();
  // Eén late bind voor modules die Home kort na DOMContentLoaded nog aanvullen.
  window.setTimeout(bind44,600);
  window.addEventListener('pageshow',()=>window.setTimeout(bind44,80));
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init44,{once:true});
else init44();

console.info('Snazzle dorpsknoppen v44 geladen');

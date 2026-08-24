// Snazzle Hunt v43 — herstel mobiele bediening zonder globale click-capture.
// Doel: scrollen, knoppen en geheime klikpunten blijven overal bruikbaar.

const q43=(s,r=document)=>r.querySelector(s);
const qa43=(s,r=document)=>[...r.querySelectorAll(s)];

function noVisibleOverlay43(){
  const sheetOpen=qa43('.sheet.show').some(el=>getComputedStyle(el).display!=='none');
  const quick=q43('#quickMenuOverlay');
  const quickOpen=!!quick && (quick.classList.contains('show') || quick.getAttribute('aria-hidden')==='false');
  const poster=q43('#eventPosterOverlay');
  const posterOpen=!!poster && poster.classList.contains('show');
  const magic=q43('#snazzleMagicOverlay');
  const magicOpen=!!magic && magic.getAttribute('aria-hidden')==='false';
  return !(sheetOpen||quickOpen||posterOpen||magicOpen);
}

function restorePage43(){
  if(!noVisibleOverlay43()) return;
  document.documentElement.style.overflow='';
  document.body.style.overflow='';
  document.documentElement.style.touchAction='';
  document.body.style.touchAction='';
}

function closeVillage43(){
  const sheet=q43('#villageSheet');
  if(!sheet) return;
  sheet.classList.remove('show');
  sheet.setAttribute('aria-hidden','true');
  requestAnimationFrame(restorePage43);
}

function bindVillage43(){
  const sheet=q43('#villageSheet');
  if(!sheet) return;

  const close=q43('[data-close="villageSheet"], .close',sheet);
  if(close && close.dataset.v43Bound!=='1'){
    close.dataset.v43Bound='1';
    close.addEventListener('click',()=>closeVillage43());
  }

  const use=q43('#useVillageBtn',sheet);
  if(use && use.dataset.v43Bound!=='1'){
    use.dataset.v43Bound='1';
    // Laat eerst de bestaande app-handler het dorp werkelijk wijzigen.
    // Daarna alleen een veilige mobiele fallback voor sluiten/scrollen.
    use.addEventListener('click',()=>{
      setTimeout(()=>{
        closeVillage43();
        q43('.hunt')?.scrollIntoView({behavior:'smooth',block:'start'});
      },40);
    });
  }

  if(sheet.dataset.v43Backdrop!=='1'){
    sheet.dataset.v43Backdrop='1';
    sheet.addEventListener('click',e=>{ if(e.target===sheet) closeVillage43(); });
  }
}

function injectSafety43(){
  if(q43('#v43MobileInteractionStyles')) return;
  const s=document.createElement('style');
  s.id='v43MobileInteractionStyles';
  s.textContent=`
    html,body{touch-action:pan-y pinch-zoom}
    .app{touch-action:pan-y}
    button,a,[role="button"],.magic-hotspot,.v37-secret-trigger,#v37CodeStar,#v37Moon{pointer-events:auto}
    .sheet:not(.show){pointer-events:none!important}
    .quick-menu-overlay[aria-hidden="true"]{pointer-events:none!important}
    #eventPosterOverlay:not(.show){pointer-events:none!important}
    #snazzleMagicOverlay[aria-hidden="true"]{pointer-events:none!important}
    #villageSheet .close,#useVillageBtn{touch-action:manipulation;pointer-events:auto!important}
  `;
  document.head.appendChild(s);
}

function init43(){
  injectSafety43();
  bindVillage43();
  restorePage43();

  const observer=new MutationObserver(()=>{
    bindVillage43();
    if(noVisibleOverlay43()) restorePage43();
  });
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','aria-hidden']});

  window.addEventListener('pageshow',restorePage43);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(restorePage43,80);});
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init43,{once:true});
else init43();

console.info('Snazzle mobiele bediening v43 geladen');

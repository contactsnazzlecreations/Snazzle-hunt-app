// Snazzle v76 — robuuste sluitknop voor het oudergedeelte op mobiele browsers.
// Android-fix: sluit via centrale capture-handler zodat overlays of andere modules
// de X-knop niet meer kunnen onderscheppen.

const VERSION='76.1.0';

function installStyles76(){
  if(document.getElementById('snParentCloseFixStyles76')) return;
  const style=document.createElement('style');
  style.id='snParentCloseFixStyles76';
  style.textContent=`
    #snParentSheet{z-index:8800!important;pointer-events:auto!important}
    #snParentSheet.show{display:flex!important;pointer-events:auto!important}
    #snParentSheet .sn-parent-panel{position:relative;z-index:1;pointer-events:auto!important}
    #snParentClose{position:relative!important;z-index:99999!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;user-select:none!important}
  `;
  document.head.appendChild(style);
}

function closeParent76(){
  const sheet=document.getElementById('snParentSheet');
  if(!sheet) return;
  sheet.classList.remove('show');
  sheet.style.display='none';
  sheet.setAttribute('aria-hidden','true');
  document.documentElement.style.overflow='';
  document.body.style.overflow='';
  requestAnimationFrame(()=>{ sheet.style.display=''; });
}

function isCloseTarget(target){
  return target instanceof Element && !!target.closest('#snParentClose');
}

function globalCloseHandler(e){
  if(!isCloseTarget(e.target)) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation?.();
  closeParent76();
}

function bindClose76(){
  installStyles76();
  const button=document.getElementById('snParentClose');
  if(button){
    button.type='button';
    button.setAttribute('aria-label','Oudergedeelte sluiten');
    button.onclick=closeParent76;
  }
}

function init76(){
  bindClose76();
  if(!window.__snazzleParentCloseGlobal76){
    window.__snazzleParentCloseGlobal76=true;
    document.addEventListener('pointerdown',globalCloseHandler,true);
    document.addEventListener('touchstart',globalCloseHandler,{capture:true,passive:false});
    document.addEventListener('click',globalCloseHandler,true);
  }
  const observer=new MutationObserver(bindClose76);
  observer.observe(document.body,{childList:true,subtree:true});
  console.info(`Snazzle parent close fix ${VERSION} geladen`);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init76,{once:true});
else init76();

window.SnazzleParentCloseFixV76={close:closeParent76,bind:bindClose76};

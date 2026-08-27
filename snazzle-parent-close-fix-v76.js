// Snazzle v76 — robuuste sluitknop voor beide ouder/veiligheid overlays op mobiele browsers.
// v53 gebruikt #snParentOverlay, v65 gebruikt #snParentSheet en beide hadden dezelfde
// knop-id. Deze fix behandelt daarom alle zichtbare oudervensters en alle sluitknoppen.

const VERSION='76.2.0';

function installStyles76(){
  if(document.getElementById('snParentCloseFixStyles76')) return;
  const style=document.createElement('style');
  style.id='snParentCloseFixStyles76';
  style.textContent=`
    #snParentSheet,#snParentOverlay{pointer-events:auto!important}
    #snParentSheet.show,#snParentOverlay.show{pointer-events:auto!important}
    #snParentSheet .sn-parent-panel,#snParentOverlay .sn-parent-panel{position:relative;pointer-events:auto!important}
    #snParentSheet [id="snParentClose"],#snParentOverlay [id="snParentClose"],
    #snParentSheet .sn-parent-close,#snParentOverlay .sn-parent-close{
      position:relative!important;z-index:2147483647!important;pointer-events:auto!important;
      touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;
      user-select:none!important;-webkit-user-select:none!important
    }
  `;
  document.head.appendChild(style);
}

function hideOverlay(el){
  if(!el) return;
  el.classList.remove('show');
  el.setAttribute('aria-hidden','true');
  el.style.pointerEvents='none';
  // Forceer direct onzichtbaar voor mobiele browsers; verwijder inline display daarna
  // zodat de oorspronkelijke module hem later weer normaal kan openen.
  const oldDisplay=el.style.display;
  el.style.display='none';
  requestAnimationFrame(()=>{
    el.style.display=oldDisplay || '';
    el.style.pointerEvents='';
  });
}

function closeParent76(source){
  const nearest=source instanceof Element ? source.closest('#snParentOverlay,#snParentSheet') : null;
  if(nearest) hideOverlay(nearest);
  else {
    document.querySelectorAll('#snParentOverlay.show,#snParentSheet.show').forEach(hideOverlay);
  }
  document.documentElement.style.overflow='';
  document.body.style.overflow='';
}

function getCloseButton(target){
  if(!(target instanceof Element)) return null;
  return target.closest('#snParentOverlay [id="snParentClose"],#snParentSheet [id="snParentClose"],#snParentOverlay .sn-parent-close,#snParentSheet .sn-parent-close');
}

function globalCloseHandler(e){
  const button=getCloseButton(e.target);
  if(!button) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation?.();
  closeParent76(button);
}

function bindClose76(){
  installStyles76();
  document.querySelectorAll('#snParentOverlay [id="snParentClose"],#snParentSheet [id="snParentClose"],#snParentOverlay .sn-parent-close,#snParentSheet .sn-parent-close').forEach(button=>{
    button.type='button';
    button.setAttribute('aria-label','Oudergedeelte sluiten');
    if(button.dataset.snParentClose762==='1') return;
    button.dataset.snParentClose762='1';
    button.addEventListener('pointerdown',globalCloseHandler,true);
    button.addEventListener('touchstart',globalCloseHandler,{capture:true,passive:false});
    button.addEventListener('click',globalCloseHandler,true);
  });
}

function init76(){
  bindClose76();
  if(!window.__snazzleParentCloseGlobal762){
    window.__snazzleParentCloseGlobal762=true;
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

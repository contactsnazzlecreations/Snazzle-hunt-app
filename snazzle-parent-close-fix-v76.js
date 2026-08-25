// Snazzle v76 — robuuste sluitknop voor het oudergedeelte op mobiele browsers.
// Houdt het oudervenster boven eventuele oude menu-lagen en vangt zowel pointer- als klikbediening af.

const VERSION='76.0.0';

function installStyles76(){
  if(document.getElementById('snParentCloseFixStyles76')) return;
  const style=document.createElement('style');
  style.id='snParentCloseFixStyles76';
  style.textContent=`
    #snParentSheet{z-index:8800!important;pointer-events:auto!important}
    #snParentSheet.show{display:flex!important;pointer-events:auto!important}
    #snParentSheet .sn-parent-panel{position:relative;z-index:1;pointer-events:auto!important}
    #snParentClose{position:relative!important;z-index:20!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important}
  `;
  document.head.appendChild(style);
}

function closeParent76(){
  const sheet=document.getElementById('snParentSheet');
  if(!sheet) return;
  sheet.classList.remove('show');
  sheet.setAttribute('aria-hidden','true');
  document.documentElement.style.overflow='';
  document.body.style.overflow='';
}

function bindClose76(){
  installStyles76();
  const button=document.getElementById('snParentClose');
  if(!button || button.dataset.snParentClose76==='1') return;
  button.dataset.snParentClose76='1';
  const handler=e=>{
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation?.();
    closeParent76();
  };
  button.addEventListener('pointerup',handler,true);
  button.addEventListener('click',handler,true);
  button.addEventListener('touchend',handler,{capture:true,passive:false});
}

function init76(){
  bindClose76();
  const observer=new MutationObserver(bindClose76);
  observer.observe(document.body,{childList:true,subtree:true});
  console.info(`Snazzle parent close fix ${VERSION} geladen`);
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init76,{once:true});
else init76();

window.SnazzleParentCloseFixV76={close:closeParent76,bind:bindClose76};

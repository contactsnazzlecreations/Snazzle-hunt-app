// Snazzle AR place rescue v194
// Eén directe Android/PWA route voor de knop 'Plaats via kaart + camera'.
// Geen laad-overlay en nooit wachten op Leaflet/GPS voordat het plaatsingsscherm zichtbaar wordt.

const BUTTON_SELECTOR_194='#snArStudioLaunch184,.sn-ar-studio-launch184';
const BUTTON_LABEL_194='🗺️📷 Plaats via kaart + camera';
let busy194=false;
let importPromise194=null;

function toast194(message){
  const toast=document.getElementById('toast');
  if(toast){
    toast.textContent=message;
    toast.classList.add('show');
    clearTimeout(window.__snArRescueToast194);
    window.__snArRescueToast194=setTimeout(()=>toast.classList.remove('show'),3200);
  }else{
    console.warn(message);
  }
}

function removeOldLoading194(){
  document.getElementById('snArLaunchLoading192')?.remove();
}

function style194(){
  if(document.getElementById('snArRescueStyle194')) return;
  const s=document.createElement('style');
  s.id='snArRescueStyle194';
  s.textContent=`
    #snArStudioLaunch184,.sn-ar-studio-launch184{
      pointer-events:auto!important;
      touch-action:manipulation!important;
      position:relative!important;
      z-index:8000!important;
    }
    #snArStudioV184{z-index:30000!important}
  `;
  document.head.appendChild(s);
}

function findButton194(){
  return document.querySelector(BUTTON_SELECTOR_194)
    || [...document.querySelectorAll('#snArAdminV85 button')]
      .find(b=>/Plaats via kaart\s*\+\s*camera/i.test(b.textContent||''))
    || null;
}

function harden194(){
  style194();
  removeOldLoading194();
  const btn=findButton194();
  if(!btn) return false;
  btn.id='snArStudioLaunch184';
  btn.type='button';
  btn.disabled=false;
  btn.removeAttribute('disabled');
  btn.removeAttribute('aria-disabled');
  btn.style.setProperty('pointer-events','auto','important');
  btn.style.setProperty('touch-action','manipulation','important');
  btn.style.setProperty('position','relative','important');
  btn.style.setProperty('z-index','8000','important');
  btn.dataset.snRescue194='1';
  if(!btn.textContent?.trim()) btn.textContent=BUTTON_LABEL_194;
  return true;
}

function studioVisible194(){
  return !!document.getElementById('snArStudioV184')?.classList.contains('show');
}

function importStudio194(){
  if(window.SnazzleArPlaceStudioV184?.open) return Promise.resolve(window.SnazzleArPlaceStudioV184);
  if(importPromise194) return importPromise194;
  const version=encodeURIComponent(window.__snazzleRuntimeVersion||'v194');
  const moduleUrl=`./snazzle-ar-place-studio-v184.js?rescue194=${version}`;
  const attempt=import(moduleUrl).catch(err=>{
    console.error('AR plaatsstudio import v194 mislukt',err);
    return null;
  });
  const timeout=new Promise(resolve=>setTimeout(()=>resolve(null),4500));
  importPromise194=Promise.race([attempt,timeout]).finally(()=>{importPromise194=null;});
  return importPromise194;
}

function callOpen194(api){
  if(!api?.open) return false;
  try{
    // Bewust NIET awaiten: open() toont de modal vóór Leaflet/GPS wordt geladen.
    const result=api.open();
    Promise.resolve(result).catch(err=>console.warn('AR plaatsstudio achtergrondfout v194',err));
    return true;
  }catch(err){
    console.error('AR plaatsstudio open v194 mislukt',err);
    return false;
  }
}

async function open194(){
  if(busy194 || studioVisible194()) return;
  busy194=true;
  removeOldLoading194();
  harden194();

  try{
    let api=window.SnazzleArPlaceStudioV184;
    if(api?.open){
      callOpen194(api);
      await new Promise(r=>setTimeout(r,80));
      if(studioVisible194()) return;
    }

    api=await importStudio194();
    if(!api?.open) api=window.SnazzleArPlaceStudioV184;
    if(!callOpen194(api)) throw new Error('De plaatsmodule is niet beschikbaar.');

    for(let i=0;i<15;i++){
      await new Promise(r=>setTimeout(r,80));
      if(studioVisible194()) return;
    }
    throw new Error('Het plaatsingsscherm werd niet zichtbaar.');
  }catch(err){
    console.error('Snazzle AR rescue v194',err);
    toast194('⚠️ Plaatsingsscherm kon niet openen. Sluit Beheer en open het opnieuw.');
  }finally{
    busy194=false;
    harden194();
  }
}

function isMapButton194(target){
  const btn=target?.closest?.('button,a');
  return !!(btn && (
    btn.matches?.(BUTTON_SELECTOR_194)
    || /Plaats via kaart\s*\+\s*camera/i.test(btn.textContent||'')
  ));
}

function intercept194(event){
  if(!isMapButton194(event.target)) return;
  event.preventDefault?.();
  event.stopPropagation?.();
  event.stopImmediatePropagation?.();
  open194();
}

// Eén capture-route. Pointerdown is vroeg genoeg voor Android/PWA en voorkomt dubbele click-afhandeling.
document.addEventListener('pointerdown',intercept194,true);
document.addEventListener('click',event=>{
  if(!isMapButton194(event.target)) return;
  event.preventDefault?.();
  event.stopPropagation?.();
  event.stopImmediatePropagation?.();
  if(!studioVisible194()) open194();
},true);

const observer194=new MutationObserver(()=>harden194());
function boot194(){
  harden194();
  if(document.body) observer194.observe(document.body,{childList:true,subtree:true});
  [50,150,400,900,1800,3500,7000].forEach(ms=>setTimeout(harden194,ms));
}
if(document.body) boot194();
else document.addEventListener('DOMContentLoaded',boot194,{once:true});

window.SnazzleArPlaceRescueV194={open:open194,harden:harden194};
console.info('Snazzle AR place rescue v194 geladen');

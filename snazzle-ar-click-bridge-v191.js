// Snazzle AR click bridge v191.2
// Harde Android/PWA launcher: vervangt de kaartknop door een schoon element met eigen touch/pointer/click events.

const BUTTON_SELECTOR='#snArStudioLaunch184,.sn-ar-studio-launch184';
const LABEL='🗺️📷 Plaats via kaart + camera';
let opening=false;
let rebinding=false;

function notify191(message){
  const toast=document.getElementById('toast');
  if(toast){
    toast.textContent=message;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),2600);
  }else{
    console.warn(message);
  }
}

async function ensureStudio191(){
  if(window.SnazzleArPlaceStudioV184?.open) return window.SnazzleArPlaceStudioV184;
  try{
    const base='./snazzle-ar-place-studio-v184.js';
    const url=`${base}?bridge191=${Date.now()}`;
    await import(url);
  }catch(err){
    console.error('AR plaatsstudio opnieuw laden mislukt',err);
  }
  for(let i=0;i<20;i++){
    if(window.SnazzleArPlaceStudioV184?.open) return window.SnazzleArPlaceStudioV184;
    await new Promise(r=>setTimeout(r,50));
  }
  return null;
}

async function openStudio191(){
  if(opening) return;
  opening=true;
  const btn=document.querySelector('#snArStudioLaunch184');
  const oldText=btn?.textContent||LABEL;
  if(btn){btn.disabled=false;btn.textContent='🗺️ Kaart openen…';}
  try{
    const api=await ensureStudio191();
    if(!api?.open) throw new Error('AR plaatsstudio is niet beschikbaar.');
    await api.open();
    const modal=document.getElementById('snArStudioV184');
    if(!modal?.classList.contains('show')) throw new Error('Plaatsingsscherm kon niet zichtbaar worden.');
  }catch(err){
    console.error('AR plaatsstudio kon niet openen',err);
    notify191('⚠️ Kaartscherm kon niet openen. Probeer nog één keer.');
  }finally{
    if(btn?.isConnected){btn.disabled=false;btn.textContent=oldText;}
    opening=false;
  }
}

function launchEvent191(event){
  event?.preventDefault?.();
  event?.stopPropagation?.();
  openStudio191();
}

function hardBind191(){
  if(rebinding) return;
  const current=document.querySelector('#snArStudioLaunch184');
  if(!current) return;
  if(current.dataset.snHardLauncher191==='1'){
    current.disabled=false;
    current.style.pointerEvents='auto';
    return;
  }

  rebinding=true;
  try{
    const btn=current.cloneNode(true);
    btn.id='snArStudioLaunch184';
    btn.type='button';
    btn.disabled=false;
    btn.dataset.snHardLauncher191='1';
    btn.textContent=LABEL;
    btn.style.pointerEvents='auto';
    btn.style.touchAction='manipulation';
    btn.style.position='relative';
    btn.style.zIndex='1000';
    btn.removeAttribute('aria-disabled');

    // Pointerdown opent al vóór een eventuele latere globale click-handler kan ingrijpen.
    btn.addEventListener('pointerdown',launchEvent191,{passive:false});
    btn.addEventListener('touchend',launchEvent191,{passive:false});
    btn.addEventListener('click',launchEvent191,{passive:false});
    current.replaceWith(btn);
  }finally{
    rebinding=false;
  }
}

// Ook als Beheer de sectie later opnieuw rendert, wordt de knop opnieuw hard gekoppeld.
const observer191=new MutationObserver(()=>hardBind191());
function start191(){
  hardBind191();
  if(document.body) observer191.observe(document.body,{childList:true,subtree:true});
  [100,300,700,1500,3000,6000].forEach(ms=>setTimeout(hardBind191,ms));
}
if(document.body) start191();
else document.addEventListener('DOMContentLoaded',start191,{once:true});

// Document-fallback voor bestaande knop tussen twee renders in.
document.addEventListener('pointerdown',event=>{
  const btn=event.target?.closest?.(BUTTON_SELECTOR);
  if(!btn) return;
  if(btn.dataset.snHardLauncher191==='1') return;
  launchEvent191(event);
},true);

window.SnazzleArClickBridgeV191={open:openStudio191,rebind:hardBind191};
console.info('Snazzle AR click bridge v191.2 geladen');
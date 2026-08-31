// Snazzle AR launcher v192.1
// Robuuste Android/PWA launcher voor 'Plaats via kaart + camera'.
// Opent het plaatsingsscherm direct; de kaart/GPS mag daarna op de achtergrond laden.

const V192='192.1.0';
const BUTTON_ID='snArStudioLaunch184';
let opening192=false;
let lastStart192=0;

function isMapButton192(el){
  if(!el || el.nodeType!==1) return false;
  if(el.id===BUTTON_ID) return true;
  if(el.classList?.contains('sn-ar-studio-launch184')) return true;
  return el.matches?.('button,a') && /Plaats via kaart\s*\+\s*camera/i.test(el.textContent||'');
}

function buttonAtPoint192(x,y){
  try{
    const stack=document.elementsFromPoint?.(x,y)||[];
    for(const el of stack){
      if(isMapButton192(el)) return el;
      const near=el.closest?.('button,a');
      if(isMapButton192(near)) return near;
    }
  }catch{}
  return null;
}

function findMapButton192(){
  return document.getElementById(BUTTON_ID)
    || [...document.querySelectorAll('#snArAdminV85 button,#snArAdminV85 a')]
      .find(el=>/Plaats via kaart\s*\+\s*camera/i.test(el.textContent||''))
    || null;
}

function hardenButton192(){
  const btn=findMapButton192();
  if(!btn) return;
  btn.id=BUTTON_ID;
  btn.type='button';
  btn.disabled=false;
  btn.removeAttribute('disabled');
  btn.removeAttribute('aria-disabled');
  btn.style.setProperty('pointer-events','auto','important');
  btn.style.setProperty('touch-action','manipulation','important');
  btn.style.setProperty('position','relative','important');
  btn.style.setProperty('z-index','5000','important');
  btn.dataset.snLauncher192='1';
}

function notify192(message){
  const toast=document.getElementById('toast');
  if(toast){
    toast.textContent=message;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),2600);
  }else{
    console.warn(message);
  }
}

async function getStudio192(){
  if(window.SnazzleArPlaceStudioV184?.open) return window.SnazzleArPlaceStudioV184;
  try{
    await import(`./snazzle-ar-place-studio-v184.js?launcher192=${Date.now()}`);
  }catch(err){
    console.error('v192 studio import mislukt',err);
  }
  for(let i=0;i<30;i++){
    if(window.SnazzleArPlaceStudioV184?.open) return window.SnazzleArPlaceStudioV184;
    await new Promise(r=>setTimeout(r,50));
  }
  return null;
}

async function launch192(){
  const now=Date.now();
  if(opening192 || now-lastStart192<350) return;
  opening192=true; lastStart192=now;

  const btn=findMapButton192();
  const oldText=btn?.textContent||'🗺️📷 Plaats via kaart + camera';
  if(btn){
    btn.disabled=false;
    btn.textContent='🗺️ Kaart openen…';
  }

  try{
    const api=await getStudio192();
    if(!api?.open) throw new Error('De AR-plaatsmodule kon niet worden geladen.');

    // Belangrijk voor Android/PWA: niet wachten tot Leaflet/GPS klaar is.
    // De async open()-functie bouwt en toont het scherm al vóór zijn eerste await.
    const openingPromise=api.open();
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

    let modal=document.getElementById('snArStudioV184');
    if(!modal?.classList.contains('show')){
      // Geef een trager toestel nog kort de tijd, maar blokkeer nooit op kaart-CDN/GPS.
      await Promise.race([
        Promise.resolve(openingPromise).catch(()=>{}),
        new Promise(r=>setTimeout(r,900))
      ]);
      modal=document.getElementById('snArStudioV184');
    }

    if(!modal?.classList.contains('show')) throw new Error('Het plaatsingsscherm werd niet zichtbaar.');

    // Eventuele kaartfout wordt in het geopende scherm zelf getoond.
    Promise.resolve(openingPromise).catch(err=>console.warn('AR plaatsstudio achtergrondfout',err));
  }catch(err){
    console.error('v192 kaartlauncher fout',err);
    notify192('⚠️ Kaartscherm kon niet openen. Tik nog één keer.');
  }finally{
    if(btn?.isConnected){
      btn.disabled=false;
      btn.textContent=oldText;
    }
    opening192=false;
  }
}

function eventTargetsMapButton192(event){
  if(isMapButton192(event.target?.closest?.('button,a'))) return true;
  const t=event.touches?.[0]||event.changedTouches?.[0];
  const x=Number.isFinite(event.clientX)?event.clientX:t?.clientX;
  const y=Number.isFinite(event.clientY)?event.clientY:t?.clientY;
  return Number.isFinite(x)&&Number.isFinite(y)&&!!buttonAtPoint192(x,y);
}

function intercept192(event){
  if(!eventTargetsMapButton192(event)) return;
  event.preventDefault?.();
  event.stopPropagation?.();
  event.stopImmediatePropagation?.();
  launch192();
}

// Capture op meerdere invoertypen. Dit werkt ook wanneer een overlay boven de knop ligt.
document.addEventListener('pointerdown',intercept192,true);
document.addEventListener('touchstart',intercept192,{capture:true,passive:false});
document.addEventListener('click',intercept192,true);

const observer192=new MutationObserver(hardenButton192);
function start192(){
  hardenButton192();
  if(document.body) observer192.observe(document.body,{subtree:true,childList:true});
  [50,150,400,900,1800,3500,7000].forEach(ms=>setTimeout(hardenButton192,ms));
}
if(document.body) start192(); else document.addEventListener('DOMContentLoaded',start192,{once:true});

window.SnazzleArLauncherV192={open:launch192,harden:hardenButton192};
console.info(`Snazzle AR launcher v${V192} geladen`);

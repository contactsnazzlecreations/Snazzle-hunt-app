// Snazzle AR launcher v192
// Robuuste Android/PWA launcher voor 'Plaats via kaart + camera'.
// Werkt ook wanneer een transparante/andere laag de knop visueel overlapt.

const V192='192.0.0';
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

function loadingOverlay192(){
  let el=document.getElementById('snArLaunchLoading192');
  if(el) return el;
  el=document.createElement('div');
  el.id='snArLaunchLoading192';
  el.style.cssText='position:fixed;inset:0;z-index:25000;background:rgba(4,24,15,.94);display:none;place-items:center;padding:24px;color:#fff;font-family:system-ui,-apple-system,Segoe UI,sans-serif;text-align:center';
  el.innerHTML='<div style="max-width:330px;background:#fff1bd;color:#2f2417;border:4px solid #7a5631;border-radius:24px;padding:24px;box-shadow:0 18px 50px rgba(0,0,0,.4)"><div style="font-size:42px">🗺️</div><h2 style="margin:8px 0">Kaart openen…</h2><p id="snArLaunchMsg192" style="font-weight:750;line-height:1.4">Snazzle plaatsingsscherm wordt geladen.</p><button id="snArLaunchClose192" type="button" style="display:none;width:100%;margin-top:12px;border:0;border-radius:14px;padding:13px;background:#6b4229;color:#fff;font-weight:900">Sluiten</button></div>';
  document.body.appendChild(el);
  el.querySelector('#snArLaunchClose192')?.addEventListener('click',()=>{el.style.display='none';});
  return el;
}

function showLoading192(message='Snazzle plaatsingsscherm wordt geladen.'){
  const el=loadingOverlay192();
  const msg=el.querySelector('#snArLaunchMsg192');
  const close=el.querySelector('#snArLaunchClose192');
  if(msg) msg.textContent=message;
  if(close) close.style.display='none';
  el.style.display='grid';
}

function showError192(message){
  const el=loadingOverlay192();
  const msg=el.querySelector('#snArLaunchMsg192');
  const close=el.querySelector('#snArLaunchClose192');
  if(msg) msg.textContent='⚠️ '+message;
  if(close) close.style.display='block';
  el.style.display='grid';
}

function hideLoading192(){
  const el=document.getElementById('snArLaunchLoading192');
  if(el) el.style.display='none';
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
  showLoading192();
  try{
    const api=await getStudio192();
    if(!api?.open) throw new Error('De AR-plaatsmodule kon niet worden geladen.');
    await api.open();
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const modal=document.getElementById('snArStudioV184');
    if(!modal?.classList.contains('show')) throw new Error('Het plaatsingsscherm werd niet zichtbaar.');
    hideLoading192();
  }catch(err){
    console.error('v192 kaartlauncher fout',err);
    showError192(err?.message||'Kaartscherm kon niet openen.');
  }finally{
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

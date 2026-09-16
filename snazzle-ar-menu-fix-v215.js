// Snazzle AR menu fix v216 — één AR-import en één mobiele invoerroute.
// Maakt de zichtbare Snazzle AR-knop onafhankelijk van de verborgen legacy-launcher.

const AR_MENU_SELECTOR='#snArMenuV129';
let opening215=false;
let lastOpen215=0;

const sleep215=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function toast215(message){
  const toast=document.getElementById('toast');
  if(!toast)return;
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(window.__snArMenuToast215);
  window.__snArMenuToast215=setTimeout(()=>toast.classList.remove('show'),2800);
}

function closeMenu215(){
  try{
    const close=document.getElementById('quickMenuClose');
    if(close)close.click();
    else document.getElementById('quickMenuPanel')?.classList.remove('show');
  }catch{}
}

async function ensureArUi215(){
  if(document.getElementById('snArIntro'))return true;
  try{
    if(typeof window.__snazzleImport==='function')await window.__snazzleImport('./snazzle-ar-v80.js');
    else await import('./snazzle-ar-v80.js?v=216');
  }catch(err){
    console.error('Snazzle AR UI kon niet laden',err);
  }
  for(let i=0;i<20;i++){
    if(document.getElementById('snArIntro'))return true;
    await sleep215(50);
  }
  return false;
}

async function openAr215(){
  const now=Date.now();
  if(opening215||now-lastOpen215<450)return;
  opening215=true;
  lastOpen215=now;
  closeMenu215();

  try{
    if(!(await ensureArUi215()))throw new Error('AR-interface ontbreekt');
    await sleep215(40);

    const legacyLaunch=document.getElementById('snArLaunch');
    if(legacyLaunch){try{legacyLaunch.click();}catch{}}

    const intro=document.getElementById('snArIntro');
    if(!intro)throw new Error('AR-introscherm ontbreekt');
    intro.classList.add('show');
    window.__snazzleArPriority=true;

    const status=document.getElementById('snArStatus');
    if(status&&!status.textContent.trim())status.textContent='AR klaar — tik op Zoek AR Snazzle';
    Promise.resolve(window.SnazzleArWorldV85?.reload?.()).catch(()=>{});
  }catch(err){
    console.error('Snazzle AR menu v216 fout',err);
    toast215('⚠️ Snazzle AR kon niet openen. Probeer nog één keer.');
  }finally{
    opening215=false;
  }
}

function isArMenu215(event){return !!event.target?.closest?.(AR_MENU_SELECTOR);}
function intercept215(event){
  if(!isArMenu215(event))return;
  event.preventDefault?.();
  event.stopPropagation?.();
  event.stopImmediatePropagation?.();
  openAr215();
}

// Pointerdown vangt mobiel/muis af vóór oude launchers. Click blijft alleen toetsenbord-fallback.
document.addEventListener('pointerdown',intercept215,true);
document.addEventListener('click',event=>{
  if(event.detail!==0)return;
  intercept215(event);
},true);

window.SnazzleArMenuFixV215={open:openAr215};
console.info('Snazzle AR menu fix v216 geladen');

// Snazzle AR menu fix v215.1
// Maakt de zichtbare Snazzle AR-knop in het compacte menu onafhankelijk van de verborgen legacy-launcher.

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
    await import(`./snazzle-ar-v80.js?menu215=${Date.now()}`);
  }catch(err){
    console.error('Snazzle AR UI kon niet opnieuw laden',err);
  }
  for(let i=0;i<24;i++){
    if(document.getElementById('snArIntro'))return true;
    await sleep215(50);
  }
  return false;
}

async function openAr215(){
  const now=Date.now();
  if(opening215||now-lastOpen215<400)return;
  opening215=true;
  lastOpen215=now;
  closeMenu215();

  try{
    if(!(await ensureArUi215()))throw new Error('AR-interface ontbreekt');
    await sleep215(70);

    // Gebruik de bestaande launcher als die beschikbaar is, zodat alle werelddata-hooks blijven werken.
    const legacyLaunch=document.getElementById('snArLaunch');
    if(legacyLaunch){
      try{legacyLaunch.click();}catch{}
    }

    // Harde fallback: het AR-introscherm moet na een tik altijd zichtbaar worden.
    const intro=document.getElementById('snArIntro');
    if(!intro)throw new Error('AR-introscherm ontbreekt');
    intro.classList.add('show');
    window.__snazzleArPriority=true;

    const status=document.getElementById('snArStatus');
    if(status&&!status.textContent.trim())status.textContent='AR klaar — tik op Zoek AR Snazzle';
    Promise.resolve(window.SnazzleArWorldV85?.reload?.()).catch(()=>{});
  }catch(err){
    console.error('Snazzle AR menu v215 fout',err);
    toast215('⚠️ Snazzle AR kon niet openen. Probeer nog één keer.');
  }finally{
    opening215=false;
  }
}

function isArMenu215(event){
  return !!event.target?.closest?.(AR_MENU_SELECTOR);
}

function intercept215(event){
  if(!isArMenu215(event))return;
  event.preventDefault?.();
  event.stopPropagation?.();
  event.stopImmediatePropagation?.();
  openAr215();
}

// Pointerdown opent vóór eventuele oude globale click-handlers; click is fallback voor desktop/toetsenbord.
document.addEventListener('pointerdown',intercept215,true);
document.addEventListener('touchstart',intercept215,{capture:true,passive:false});
document.addEventListener('click',intercept215,true);

window.SnazzleArMenuFixV215={open:openAr215};
console.info('Snazzle AR menu fix v215.1 geladen');

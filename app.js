// Snazzle Hunt v98 — snelle fail-safe start + één vast premium menu.
// Belangrijk: oudere modules mogen het hoofdmenu niet meer vervangen of er losse witte knoppen aan toevoegen.

const runtimeVersion = new URL(import.meta.url).searchParams.get('v') || Date.now().toString();
const fresh = path => `${path}${path.includes('?') ? '&' : '?'}fresh=${encodeURIComponent(runtimeVersion)}`;
window.__snazzleRuntimeVersion = runtimeVersion;
window.__snazzleFresh = fresh;
window.__snazzleCoreReady = false;
window.__snazzleMenuVersion = 'v98';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const loaded = new Map();
let corePromise;
let menuBusy = false;

function addStylesheet(path){
  if(document.querySelector(`link[data-snazzle-theme="${path}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fresh(path);
  link.dataset.snazzleTheme = path;
  document.head.appendChild(link);
}

// Alleen de bewezen visuele CSS vroeg laden. Dit blokkeert de app niet.
[
  './snazzle-magic-theme.css',
  './snazzle-enchanted-layer.css',
  './snazzle-professional-v53.css',
  './snazzle-final-polish-v59.css'
].forEach(addStylesheet);

let bootEl = null;
let bootReleased = false;
function buildBoot(){
  if(!document.body || document.getElementById('snV98Boot')) return;
  const splash = document.createElement('div');
  splash.id = 'snV98Boot';
  splash.setAttribute('aria-hidden','true');
  splash.style.cssText = 'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:linear-gradient(180deg,#17684c,#083a31);color:#fff7df;text-align:center;font-family:system-ui,-apple-system,Segoe UI,sans-serif;transition:opacity .18s ease';
  splash.innerHTML = '<div style="padding:24px;font-weight:900;text-shadow:0 2px 8px rgba(0,0,0,.28)"><div style="width:104px;height:104px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;background:#ffd35e;border:5px solid #76502d;box-shadow:0 8px 0 #4a2b18;font-size:52px">🦆</div><div style="font-size:44px;font-weight:1000;color:#ffd35e">Snazzle</div><div style="margin-top:12px;font-size:20px">Samen naar buiten</div><div style="margin-top:18px;font-size:14px">Je avontuur wordt klaargezet…</div></div>';
  document.body.appendChild(splash);
  bootEl = splash;
}
function releaseBoot(){
  if(bootReleased) return;
  bootReleased = true;
  const splash = bootEl || document.getElementById('snV98Boot') || document.getElementById('snV97Boot') || document.getElementById('snV59Boot');
  if(splash){
    splash.style.opacity = '0';
    splash.style.pointerEvents = 'none';
    setTimeout(()=>splash.remove(),220);
  }
  document.body?.classList.remove('sn-v59-booting');
  document.documentElement.dataset.snazzleBoot = 'v98';
}
if(document.body) buildBoot(); else document.addEventListener('DOMContentLoaded',buildBoot,{once:true});
// Harde noodrem: een laadscherm mag nooit blijven hangen.
setTimeout(releaseBoot,2800);

function showMessage(message){
  const toast = document.getElementById('toast');
  if(toast){
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__snV98Toast);
    window.__snV98Toast = setTimeout(()=>toast.classList.remove('show'),2100);
  }
}

const menuItems = [
  ['🏠','Home','Terug naar het begin','home'],
  ['🔎','Hunt zoeken','Bekijk de actieve Snazzle Hunt','hunt'],
  ['📍','Kies je dorp','Montfort en andere dorpen','village'],
  ['🎮','Snazzle Spel','Open jouw Snazzle Wereld','game'],
  ['🎧','Luisterverhalen','Luister naar Snazzle verhalen','listen'],
  ['📚','De Bieb','Lezen en je leeshoek bouwen','bieb'],
  ['✨','Mijn Collectie','Kaarten, Nest & jaarstand','collection'],
  ['📷','Snazzle AR','Zoek met camera en GPS','ar'],
  ['🗞️','Snazzle Nieuws','Nieuws uit de Snazzle Wereld','news'],
  ['👥','Vrienden','Bekijk actieve Snazzlers','friends'],
  ['🏆','Mijn vondsten','Jouw gevonden hunts','findings'],
  ['🎉','Actie & evenement','Open de actuele poster','event'],
  ['🛍️','Shop','Bekijk Snazzle items','shop'],
  ['👤','Mijn profiel','Naam of nickname aanpassen','profile'],
  ['👨‍👩‍👧','Voor ouders','Veiligheid, privacy en tips','parents']
];

function installMenuStyles(){
  if(document.getElementById('snPremiumMenuV98Styles')) return;
  const style = document.createElement('style');
  style.id = 'snPremiumMenuV98Styles';
  style.textContent = `
    #quickMenuBtn.sn-v98-menu-btn{width:58px!important;height:58px!important;flex:0 0 58px!important;border-radius:19px!important;border:3px solid #8b6538!important;background:linear-gradient(145deg,#397844,#1f5735)!important;color:#fff9e7!important;font-size:31px!important;font-weight:1000!important;display:grid!important;place-items:center!important;box-shadow:0 6px 0 #4c2f1d,0 10px 20px rgba(0,0,0,.22)!important;touch-action:manipulation!important;position:relative!important;z-index:50!important;padding:0!important}
    #quickMenuOverlay.sn-v98-overlay{position:fixed!important;inset:0!important;z-index:12000!important;background:rgba(2,14,8,.76)!important;display:none!important;justify-content:flex-end!important;opacity:1!important;visibility:visible!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
    #quickMenuOverlay.sn-v98-overlay.show{display:flex!important}
    #quickMenuPanel.sn-v98-panel{width:min(91vw,405px)!important;height:100%!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding:calc(17px + env(safe-area-inset-top)) 14px calc(26px + env(safe-area-inset-bottom))!important;background:linear-gradient(180deg,#17633a 0%,#0d4b2e 56%,#07331f 100%)!important;border-left:4px solid #9a7040!important;color:#fff8df!important;box-sizing:border-box!important;box-shadow:-16px 0 42px rgba(0,0,0,.42)!important;transform:none!important}
    #quickMenuPanel .sn-v98-head{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;padding:2px 1px 15px!important;border-bottom:2px solid rgba(255,218,112,.22)!important}
    #quickMenuPanel .sn-v98-brand{display:flex!important;align-items:center!important;gap:11px!important;min-width:0!important}
    #quickMenuPanel .sn-v98-duck{width:52px!important;height:52px!important;flex:0 0 52px!important;border-radius:50%!important;display:grid!important;place-items:center!important;background:linear-gradient(145deg,#ffe66d,#ffb72f)!important;border:3px solid #754720!important;font-size:27px!important;box-shadow:0 4px 0 #4a2b17!important}
    #quickMenuPanel .sn-v98-brand strong{display:block!important;color:#ffd34b!important;font-size:22px!important;line-height:1.05!important;text-shadow:0 2px rgba(0,0,0,.24)!important}
    #quickMenuPanel .sn-v98-brand small{display:block!important;margin-top:5px!important;color:#c9ef8a!important;font-size:12px!important;font-weight:850!important}
    #quickMenuClose.sn-v98-close{width:45px!important;height:45px!important;flex:0 0 45px!important;border:0!important;border-radius:14px!important;background:#724328!important;color:#fff!important;font-size:28px!important;font-weight:900!important;box-shadow:0 4px 0 #432618!important;padding:0!important}
    #quickMenuPanel .sn-v98-note{margin:14px 3px 10px!important;color:#c9ef8a!important;font-size:11px!important;font-weight:1000!important;text-transform:uppercase!important;letter-spacing:1.15px!important}
    #quickMenuPanel #snV98MenuList{display:grid!important;grid-template-columns:1fr!important;gap:8px!important;margin:0!important;padding:0!important}
    #quickMenuPanel .sn-menu-item{width:100%!important;min-height:64px!important;border:2px solid rgba(255,226,154,.21)!important;border-radius:17px!important;background:linear-gradient(135deg,rgba(255,255,255,.115),rgba(255,255,255,.055))!important;color:#fff8df!important;padding:9px 10px!important;display:grid!important;grid-template-columns:43px minmax(0,1fr) 22px!important;align-items:center!important;gap:9px!important;text-align:left!important;box-shadow:0 4px 9px rgba(0,0,0,.13)!important;appearance:none!important;-webkit-appearance:none!important;white-space:normal!important}
    #quickMenuPanel .sn-menu-item:active{background:rgba(255,211,75,.17)!important;transform:scale(.985)!important}
    #quickMenuPanel .sn-menu-icon{width:42px!important;height:42px!important;border-radius:13px!important;display:grid!important;place-items:center!important;background:rgba(255,222,112,.13)!important;font-size:23px!important}
    #quickMenuPanel .sn-menu-copy{display:block!important;min-width:0!important;line-height:1.12!important}
    #quickMenuPanel .sn-menu-copy strong{display:block!important;color:#fff8df!important;font-size:16px!important;font-weight:900!important;line-height:1.15!important}
    #quickMenuPanel .sn-menu-copy small{display:block!important;margin-top:4px!important;color:#d7e9bd!important;font-size:11px!important;font-weight:720!important;line-height:1.25!important}
    #quickMenuPanel .sn-menu-arrow{font-style:normal!important;font-size:29px!important;color:#ffd34b!important;text-align:center!important}
    #quickMenuPanel .sn-menu-admin{width:100%!important;min-height:62px!important;margin-top:12px!important;border:2px solid #9b7144!important;border-radius:17px!important;background:linear-gradient(135deg,#6b4329,#4b2d1d)!important;color:#fff2d4!important;padding:11px!important;display:grid!important;grid-template-columns:43px 1fr!important;align-items:center!important;gap:8px!important;text-align:left!important;box-shadow:0 4px 0 #352117!important;appearance:none!important;-webkit-appearance:none!important}
    #quickMenuPanel .sn-menu-admin b{font-size:24px!important;text-align:center!important}.sn-menu-admin span strong{display:block!important;font-size:16px!important}.sn-menu-admin span small{display:block!important;margin-top:3px!important;color:#dfc7a5!important;font-size:10px!important}
    #quickMenuPanel .sn-v98-footer{text-align:center!important;color:#a9dc72!important;font-size:11px!important;font-weight:900!important;margin:17px 0 3px!important}
    /* STRIKTE MENUWACHT: alle oude/los toegevoegde knoppen in dit paneel verdwijnen. */
    #quickMenuPanel button:not(.sn-menu-item):not(.sn-menu-admin):not(#quickMenuClose){display:none!important}
    #quickMenuPanel .quick-menu-extra,#quickMenuPanel .quick-menu-parent-extra,#quickMenuPanel [data-quick-extra],#quickMenuPanel .sn-prof-menu-extra{display:none!important}
  `;
  document.head.appendChild(style);
}

function buildPremiumMenu(){
  installMenuStyles();
  // Verwijder ieder ouder menu volledig. Er is vanaf v98 maar één eigenaar van het menu.
  document.getElementById('quickMenuOverlay')?.remove();
  document.getElementById('quickMenuBtn')?.remove();
  const top = document.querySelector('.top');
  if(!top) return;
  const oldAdmin = document.getElementById('adminBtn');
  if(oldAdmin) oldAdmin.style.display = 'none';

  const btn = document.createElement('button');
  btn.id = 'quickMenuBtn';
  btn.className = 'sn-v98-menu-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label','Snazzle menu openen');
  btn.setAttribute('aria-expanded','false');
  btn.textContent = '☰';
  top.appendChild(btn);

  const overlay = document.createElement('div');
  overlay.id = 'quickMenuOverlay';
  overlay.className = 'sn-v98-overlay';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML = `
    <aside id="quickMenuPanel" class="sn-v98-panel" role="dialog" aria-modal="true" aria-label="Snazzle menu" data-menu-owner="v98">
      <div class="sn-v98-head">
        <div class="sn-v98-brand"><span class="sn-v98-duck">🦆</span><div><strong>Snazzle Menu</strong><small id="quickMenuVillage">📍 ${localStorage.getItem('snazzleVillage') || 'Montfort'}</small></div></div>
        <button id="quickMenuClose" class="sn-v98-close" type="button" aria-label="Menu sluiten">×</button>
      </div>
      <div class="sn-v98-note">Alles van Snazzle</div>
      <nav id="snV98MenuList" aria-label="Snazzle onderdelen">
        ${menuItems.map(([icon,title,sub,key])=>`<button class="sn-menu-item" type="button" data-sn-action="${key}"><b class="sn-menu-icon">${icon}</b><span class="sn-menu-copy"><strong>${title}</strong><small>${sub}</small></span><i class="sn-menu-arrow">›</i></button>`).join('')}
      </nav>
      <button class="sn-menu-admin" type="button" data-sn-action="admin"><b>🔒</b><span><strong>Beheer</strong><small>Voor Snazzle beheerders</small></span></button>
      <div class="sn-v98-footer">Samen naar buiten 🌿</div>
    </aside>`;
  document.body.appendChild(overlay);

  const closeMenu = () => {
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
    btn.setAttribute('aria-expanded','false');
    document.documentElement.style.overflow='';
    document.body.style.overflow='';
  };
  const openMenu = () => {
    const village = document.getElementById('quickMenuVillage');
    if(village) village.textContent = '📍 ' + (localStorage.getItem('snazzleVillage') || 'Montfort');
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
    btn.setAttribute('aria-expanded','true');
    document.documentElement.style.overflow='hidden';
    document.body.style.overflow='hidden';
  };
  btn.onclick = e => { e.preventDefault(); openMenu(); };
  document.getElementById('quickMenuClose').onclick = e => { e.preventDefault(); closeMenu(); };
  overlay.addEventListener('click',e=>{ if(e.target===overlay) closeMenu(); });
  overlay.querySelectorAll('[data-sn-action]').forEach(item=>item.onclick=async e=>{
    e.preventDefault();
    e.stopPropagation();
    const action=item.dataset.snAction;
    closeMenu();
    await runMenuAction(action);
  });
}

function ensurePremiumMenu(){
  const panel = document.getElementById('quickMenuPanel');
  const btn = document.getElementById('quickMenuBtn');
  if(panel?.dataset.menuOwner === 'v98' && btn?.classList.contains('sn-v98-menu-btn')){
    const village=document.getElementById('quickMenuVillage');
    if(village) village.textContent='📍 '+(localStorage.getItem('snazzleVillage')||'Montfort');
    return;
  }
  buildPremiumMenu();
}

async function loadModule(path,timeoutMs=5000){
  if(loaded.has(path)) return loaded.get(path);
  const promise = Promise.race([
    import(fresh(path)),
    new Promise((_,reject)=>setTimeout(()=>reject(new Error('timeout '+path)),timeoutMs))
  ]).catch(err=>{ loaded.delete(path); throw err; });
  loaded.set(path,promise);
  return promise;
}
async function ensureCore(){ return await corePromise; }
async function feature(label,fn){
  if(menuBusy) return;
  menuBusy=true;
  try{
    showMessage(label);
    await ensureCore();
    await fn();
  }catch(err){
    console.warn('Snazzle onderdeel',err);
    showMessage('Dit onderdeel kon nu niet openen. Probeer nog eens.');
  }finally{ menuBusy=false; ensurePremiumMenu(); }
}

async function runMenuAction(action){
  if(action==='home'){ window.scrollTo({top:0,behavior:'auto'}); return; }
  if(action==='village'){ document.querySelector('.villages')?.scrollIntoView({block:'center',behavior:'smooth'}); return; }
  if(action==='hunt'){ await feature('Hunt openen…',async()=>document.getElementById('navHunt')?.click()); return; }
  if(action==='friends'){ await feature('Vrienden openen…',async()=>document.getElementById('navFriends')?.click()); return; }
  if(action==='findings'){ await feature('Vondsten openen…',async()=>document.getElementById('findsBtn')?.click()); return; }
  if(action==='event'){ await feature('Actie openen…',async()=>document.querySelector('.home-card:nth-child(2)')?.click()); return; }
  if(action==='shop'){ await feature('Shop openen…',async()=>document.getElementById('navShop')?.click()); return; }
  if(action==='profile'){ await feature('Profiel openen…',async()=>document.getElementById('navProfile')?.click()); return; }
  if(action==='admin'){ await feature('Beheer openen…',async()=>document.getElementById('adminBtn')?.click()); return; }
  if(action==='game'){
    await feature('Snazzle Spel openen…',async()=>{
      await loadModule('./snazzle-world-adventure-v38.js');
      await loadModule('./snazzle-world-hub-v47.js');
      await loadModule('./snazzle-game-menu-v62.js');
      window.SnazzleGameMenuV62?.open?.();
    }); return;
  }
  if(action==='listen'){
    await feature('Luisterverhalen openen…',async()=>{
      await loadModule('./snazzle-listen-stories-v63.js');
      window.SnazzleListenStoriesV63?.open?.();
    }); return;
  }
  if(action==='bieb'){
    await feature('De Bieb openen…',async()=>{
      await loadModule('./snazzle-bieb-v73.js');
      await loadModule('./snazzle-bieb-cloud-v74.js');
      await loadModule('./snazzle-bieb-locations-v77.js');
      window.SnazzleBiebV73?.open?.();
    }); return;
  }
  if(action==='collection'){
    await feature('Collectie openen…',async()=>{
      await loadModule('./snazzle-collection.js');
      await loadModule('./snazzle-card-system-v2.js');
      await loadModule('./snazzle-card-worlds-v78.js');
      document.querySelector('[data-snazzle-collection]')?.click();
      document.getElementById('collectionHomeCard')?.click();
    }); return;
  }
  if(action==='ar'){
    await feature('Snazzle AR openen…',async()=>{
      await loadModule('./snazzle-ar-v80.js');
      await loadModule('./snazzle-ar-safety-v82.js');
      document.getElementById('snArLaunch')?.click();
    }); return;
  }
  if(action==='news'){
    await feature('Snazzle Nieuws openen…',async()=>{
      await loadModule('./snazzle-news-v46.js');
      document.getElementById('snNewsLaunch')?.click();
    }); return;
  }
  if(action==='parents'){
    await feature('Voor ouders openen…',async()=>{
      await loadModule('./snazzle-parent-hub-v65.js');
      await loadModule('./snazzle-parent-close-fix-v76.js');
      window.SnazzleParentHubV65?.open?.();
    });
  }
}

if(document.body) ensurePremiumMenu(); else document.addEventListener('DOMContentLoaded',ensurePremiumMenu,{once:true});

// Kern direct starten. Deze bevat Hunt, dorpen, profiel, vrienden, vondsten en beheer.
corePromise = import(fresh('./app-core.js'))
  .then(mod=>{
    window.__snazzleCoreReady=true;
    document.documentElement.dataset.snazzleCore='ready';
    ensurePremiumMenu();
    releaseBoot();
    return mod;
  })
  .catch(err=>{
    console.error('Snazzle kern kon niet laden',err);
    releaseBoot();
    showMessage('De verbinding is traag. Open de app nog een keer.');
    return null;
  });

// Ook bij een trage Firebase/CDN-verbinding is het scherm uiterlijk snel zichtbaar.
Promise.race([corePromise,wait(2300)]).then(releaseBoot);

// Kleine selectie achtergrondmodules; zware onderdelen worden verder pas geladen wanneer je ze opent.
(async()=>{
  const core=await corePromise;
  if(!core) return;
  await wait(700);
  const background=[
    './snazzle-runtime-stability-v71.js',
    './snazzle-image-stability-v72.js',
    './snazzle-auto-update-v51.js',
    './snazzle-privacy-v52.js',
    './snazzle-central-assets-v48.js',
    './snazzle-central-visuals-v54.js',
    './snazzle-public-visual-publish-v64.js',
    './snazzle-image-recovery-v60.js',
    './snazzle-top-stability-v70.js',
    './snazzle-final-polish-v59.js'
  ];
  for(const path of background){
    try{ await loadModule(path,4000); }catch(err){ console.warn('achtergrondmodule overgeslagen',path,err); }
    ensurePremiumMenu();
    await wait(60);
  }
})();

// Menu integriteitswacht: als een oude module later probeert het menu te vervangen, wordt v98 teruggezet.
let repairTimer;
const menuObserver = new MutationObserver(()=>{
  clearTimeout(repairTimer);
  repairTimer=setTimeout(()=>{
    const panel=document.getElementById('quickMenuPanel');
    if(panel && panel.dataset.menuOwner!=='v98') ensurePremiumMenu();
  },80);
});
function startMenuGuard(){ if(document.body) menuObserver.observe(document.body,{childList:true,subtree:true}); }
if(document.body) startMenuGuard(); else document.addEventListener('DOMContentLoaded',startMenuGuard,{once:true});

// Shop pas na auth, buiten het kritieke startpad.
corePromise.then(async core=>{
  if(!core) return;
  try{
    const {getAuth,onAuthStateChanged}=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js');
    const auth=getAuth();
    let shopLoaded=false;
    onAuthStateChanged(auth,async user=>{
      if(!user||shopLoaded) return;
      shopLoaded=true;
      try{ await loadModule('./shop.js',6000); }catch{}
      try{ await loadModule('./shop-email-settings.js',6000); }catch{}
      ensurePremiumMenu();
    });
  }catch(err){ console.warn('shop achtergrondlader',err); }
});

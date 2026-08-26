// Snazzle Hunt v98 — fail-safe startup + permanent premium menu.
// The app shell must stay usable and older modules may never replace the main menu styling.

const runtimeVersion = new URL(import.meta.url).searchParams.get('v') || Date.now().toString();
const fresh = path => `${path}${path.includes('?') ? '&' : '?'}fresh=${encodeURIComponent(runtimeVersion)}`;
window.__snazzleRuntimeVersion = runtimeVersion;
window.__snazzleFresh = fresh;
window.__snazzleCoreReady = false;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function addStylesheet(path){
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = fresh(path);
  document.head.appendChild(link);
  return link;
}

function refreshLocalStyles(){
  document.querySelectorAll('link[rel="stylesheet"][href]').forEach(link => {
    try {
      const url = new URL(link.getAttribute('href'), location.href);
      if(url.origin !== location.origin) return;
      if(!url.pathname.includes('/Snazzle-hunt-app/')) return;
      if(url.searchParams.get('fresh') === runtimeVersion) return;
      url.searchParams.set('fresh', runtimeVersion);
      link.href = url.href;
    } catch {}
  });
}

const headObserver = new MutationObserver(refreshLocalStyles);
headObserver.observe(document.head, {childList:true, subtree:true});

addStylesheet('./snazzle-magic-theme.css');
addStylesheet('./snazzle-enchanted-layer.css');
addStylesheet('./snazzle-professional-v53.css');
addStylesheet('./snazzle-final-polish-v59.css');
refreshLocalStyles();

let bootBorn = performance.now();
let bootReleased = false;
let bootEl = null;

function buildBoot(){
  if(!document.body || document.getElementById('snV98Boot')) return;
  bootBorn = performance.now();
  const splash = document.createElement('div');
  splash.id = 'snV98Boot';
  splash.setAttribute('aria-hidden','true');
  splash.style.cssText = 'position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:linear-gradient(180deg,#17684c,#083a31);color:#fff7df;text-align:center;font-family:system-ui,-apple-system,Segoe UI,sans-serif;transition:opacity .22s ease';
  splash.innerHTML = '<div style="padding:24px;font-weight:900;text-shadow:0 2px 8px rgba(0,0,0,.28)"><div style="width:104px;height:104px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;background:#ffd35e;border:5px solid #76502d;box-shadow:0 8px 0 #4a2b18;font-size:52px">🦆</div><div style="font-size:44px;font-weight:1000;color:#ffd35e">Snazzle</div><div style="margin-top:12px;font-size:20px">Samen naar buiten</div><div style="margin-top:20px;font-size:14px">Je avontuur wordt klaargezet…</div></div>';
  document.body.appendChild(splash);
  bootEl = splash;
}

function releaseBoot(){
  if(bootReleased) return;
  bootReleased = true;
  const finish = () => {
    const splash = bootEl || document.getElementById('snV98Boot') || document.getElementById('snV97Boot') || document.getElementById('snV59Boot');
    if(splash){
      splash.style.opacity = '0';
      splash.style.pointerEvents = 'none';
      setTimeout(() => splash.remove(), 260);
    }
    document.body?.classList.remove('sn-v59-booting');
    document.body?.classList.add('sn-v98-ready');
  };
  const minVisible = 220;
  const left = Math.max(0, minVisible - (performance.now() - bootBorn));
  setTimeout(finish, left);
}

if(document.body) buildBoot();
else document.addEventListener('DOMContentLoaded', buildBoot, {once:true});
setTimeout(releaseBoot, 3000);

function showStartupMessage(message='Dit onderdeel wordt klaargezet…'){
  const toast = document.getElementById('toast');
  if(toast){
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__snazzleStartupToast);
    window.__snazzleStartupToast = setTimeout(() => toast.classList.remove('show'), 1900);
  }
}

async function safeImport(path, timeoutMs=3500){
  let timer;
  try {
    const modulePromise = import(fresh(path));
    const timeoutPromise = new Promise(resolve => { timer = setTimeout(() => resolve(null), timeoutMs); });
    const mod = await Promise.race([modulePromise, timeoutPromise]);
    if(!mod) console.warn('Snazzle module overgeslagen wegens trage start:', path);
    return mod;
  } catch(err){
    console.warn('Snazzle module kon niet laden:', path, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const premiumMenuItems = [
  ['🏠','Home','Terug naar het begin','home'],
  ['🔎','Hunt zoeken','Bekijk de actieve Snazzle Hunt','hunt'],
  ['📍','Kies je dorp','Montfort en andere dorpen','village'],
  ['🎮','Snazzle Spel','Open jouw Snazzle Wereld','game'],
  ['🎧','Luisterverhalen','Kies een verhaal en luister','listen'],
  ['📚','De Bieb','Boeken, verhalen en leeshoek','bieb'],
  ['✨','Mijn Collectie','Kaarten, Nest en jaarstand','collection'],
  ['📷','Snazzle AR','Zoek Snazzles met camera en GPS','ar'],
  ['🗞️','Snazzle Nieuws','Nieuws uit de Snazzle Wereld','news'],
  ['👥','Vrienden','Bekijk actieve Snazzlers','friends'],
  ['🏆','Mijn vondsten','Jouw gevonden Hunts','findings'],
  ['🎉','Actie & evenement','Bekijk de actuele poster','event'],
  ['🛍️','Shop','Bekijk Snazzle items','shop'],
  ['👤','Mijn profiel','Naam of nickname aanpassen','profile'],
  ['👨‍👩‍👧','Voor ouders','Veiligheid, privacy en tips','parents']
];

function installMenuStyles(){
  if(document.getElementById('snPremiumMenuV98')) return;
  const style = document.createElement('style');
  style.id = 'snPremiumMenuV98';
  style.textContent = `
    #quickMenuBtn{width:58px!important;height:58px!important;flex:0 0 58px!important;border-radius:20px!important;border:3px solid #8e6739!important;background:linear-gradient(145deg,#397a45,#174f31)!important;color:#fff9df!important;font-size:31px!important;font-weight:1000!important;display:grid!important;place-items:center!important;box-shadow:0 6px 0 #4b301d,0 10px 22px rgba(0,0,0,.25)!important;touch-action:manipulation!important}
    #quickMenuOverlay{position:fixed!important;inset:0!important;z-index:5000!important;background:rgba(2,15,8,.76)!important;display:none;justify-content:flex-end!important}
    #quickMenuOverlay.show{display:flex!important}
    #quickMenuPanel{width:min(91vw,405px)!important;height:100%!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;padding:calc(18px + env(safe-area-inset-top)) 15px calc(28px + env(safe-area-inset-bottom))!important;background:radial-gradient(circle at 85% 8%,rgba(222,199,87,.12),transparent 24%),linear-gradient(180deg,#1d6b3d 0%,#0e4d2d 54%,#07371f 100%)!important;border-left:4px solid #8d6637!important;color:#fff7df!important;box-sizing:border-box!important;box-shadow:-16px 0 38px rgba(0,0,0,.38)!important}
    .sn-menu-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:3px 2px 16px;border-bottom:2px solid rgba(255,221,127,.22)}
    .sn-menu-brand{display:flex;align-items:center;gap:11px;min-width:0}.sn-menu-duck{width:52px;height:52px;flex:0 0 52px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(145deg,#ffe46c,#ffbd35);border:3px solid #754720;font-size:27px;box-shadow:0 5px 0 #4b2c18}.sn-menu-brand strong{display:block;color:#ffd34d;font-size:22px;line-height:1.05;text-shadow:0 2px rgba(0,0,0,.22)}.sn-menu-brand small{display:block;margin-top:5px;color:#cdef91;font-size:12px;font-weight:850}.sn-menu-close{width:46px;height:46px;flex:0 0 46px;border:0;border-radius:15px;background:linear-gradient(#825232,#603820);color:white;font-size:28px;font-weight:900;box-shadow:0 4px 0 #3b2317}.sn-menu-kicker{margin:15px 3px 10px;font-size:11px;font-weight:1000;text-transform:uppercase;letter-spacing:1.3px;color:#c9ef8a}
    #quickMenuPanel .quick-menu-list{display:grid!important;gap:8px!important;margin:0!important;padding:0!important}
    #quickMenuPanel .quick-menu-list>button{appearance:none!important;width:100%!important;min-height:66px!important;border:2px solid rgba(255,225,151,.22)!important;border-radius:18px!important;background:linear-gradient(135deg,rgba(255,255,255,.115),rgba(255,255,255,.055))!important;color:#fff8e2!important;padding:9px 11px!important;display:grid!important;grid-template-columns:44px 1fr 20px!important;align-items:center!important;gap:9px!important;text-align:left!important;box-shadow:0 4px 10px rgba(0,0,0,.12)!important}
    #quickMenuPanel .quick-menu-list>button:active{background:rgba(255,215,86,.17)!important;transform:scale(.985)!important}
    #quickMenuPanel .quick-menu-icon{width:43px;height:43px;border-radius:14px;display:grid;place-items:center;background:rgba(255,223,116,.12);font-size:23px}.sn-menu-copy{min-width:0}.sn-menu-copy strong{display:block;font-size:16px;line-height:1.12;color:#fff8e2}.sn-menu-copy small{display:block;margin-top:4px;font-size:11px;line-height:1.25;color:#d4e8bd;font-weight:720}.sn-menu-arrow{font-style:normal;font-size:30px;color:#ffd24c;text-align:center}
    #quickMenuAdminV98{width:100%!important;margin-top:14px!important;border:2px solid #9a7044!important;border-radius:18px!important;background:linear-gradient(135deg,#74472b,#50301f)!important;color:#fff1d2!important;padding:13px 14px!important;display:grid!important;grid-template-columns:42px 1fr!important;align-items:center!important;gap:9px!important;text-align:left!important;box-shadow:0 5px 0 #352117!important}.sn-admin-icon{font-size:24px}.sn-admin-copy strong{display:block;font-size:16px}.sn-admin-copy small{display:block;margin-top:3px;font-size:10px;color:#dec7a7;font-weight:700}.sn-menu-footer{text-align:center;color:#a9db75;font-size:11px;font-weight:900;margin:18px 0 2px;letter-spacing:.4px}
    #quickMenuPanel button:not(.sn-menu-close):not(#quickMenuAdminV98):not([data-startup-action]){display:none!important}
  `;
  document.head.appendChild(style);
}

function premiumMenuMarkup(){
  const village = localStorage.getItem('snazzleVillage') || 'Montfort';
  return `
    <div class="sn-menu-head">
      <div class="sn-menu-brand"><span class="sn-menu-duck">🦆</span><div><strong>Snazzle Menu</strong><small id="quickMenuVillage">📍 ${village}</small></div></div>
      <button id="quickMenuClose" class="sn-menu-close" type="button" aria-label="Menu sluiten">×</button>
    </div>
    <div class="sn-menu-kicker">Alles van Snazzle</div>
    <nav class="quick-menu-list" aria-label="Snazzle menu">
      ${premiumMenuItems.map(([icon,title,sub,key]) => `<button type="button" data-startup-action="${key}"><b class="quick-menu-icon">${icon}</b><span class="sn-menu-copy"><strong>${title}</strong><small>${sub}</small></span><i class="sn-menu-arrow">›</i></button>`).join('')}
    </nav>
    <button id="quickMenuAdminV98" type="button" data-startup-action="admin"><span class="sn-admin-icon">🔒</span><span class="sn-admin-copy"><strong>Beheer</strong><small>Voor Snazzle beheerders</small></span></button>
    <div class="sn-menu-footer">Samen naar buiten 🌿</div>`;
}

let menuGuardBusy = false;
function restorePremiumMenu(){
  const panel = document.getElementById('quickMenuPanel');
  if(!panel || menuGuardBusy) return;
  const list = panel.querySelector('.quick-menu-list');
  const canonicalCount = list?.querySelectorAll(':scope > [data-startup-action]').length || 0;
  const stray = [...panel.querySelectorAll('button')].some(b => b.id !== 'quickMenuClose' && b.id !== 'quickMenuAdminV98' && !b.matches('[data-startup-action]'));
  if(canonicalCount === premiumMenuItems.length && !stray && document.getElementById('quickMenuAdminV98')) return;
  menuGuardBusy = true;
  panel.innerHTML = premiumMenuMarkup();
  menuGuardBusy = false;
}

async function openPremiumFeature(action){
  if(action === 'home'){ window.scrollTo({top:0, behavior:'auto'}); return; }
  if(action === 'village'){ document.querySelector('.villages')?.scrollIntoView({block:'center'}); return; }
  if(action === 'hunt'){ if(!window.__snazzleCoreReady) return showStartupMessage(); document.querySelector('#navHunt')?.click(); return; }
  if(action === 'friends'){ if(!window.__snazzleCoreReady) return showStartupMessage(); document.querySelector('#navFriends')?.click(); return; }
  if(action === 'findings'){ if(!window.__snazzleCoreReady) return showStartupMessage(); document.querySelector('#findsBtn')?.click(); return; }
  if(action === 'shop'){ if(!window.__snazzleCoreReady) return showStartupMessage(); document.querySelector('#navShop')?.click(); return; }
  if(action === 'profile'){ if(!window.__snazzleCoreReady) return showStartupMessage(); document.querySelector('#navProfile')?.click(); return; }
  if(action === 'admin'){ if(!window.__snazzleCoreReady) return showStartupMessage(); document.querySelector('#adminBtn')?.click(); return; }
  if(action === 'event'){ if(!window.__snazzleCoreReady) return showStartupMessage(); document.querySelector('.home-card:nth-child(2)')?.click(); return; }

  showStartupMessage('Onderdeel openen…');
  if(action === 'game'){
    await safeImport('./snazzle-world-adventure-v38.js');
    await safeImport('./snazzle-world-hub-v47.js');
    await safeImport('./snazzle-game-menu-v62.js');
    window.SnazzleGameMenuV62?.open?.();
  } else if(action === 'listen'){
    await safeImport('./snazzle-listen-stories-v63.js');
    window.SnazzleListenStoriesV63?.open?.();
  } else if(action === 'bieb'){
    await safeImport('./snazzle-bieb-v73.js');
    await safeImport('./snazzle-bieb-cloud-v74.js');
    await safeImport('./snazzle-bieb-locations-v77.js');
    window.SnazzleBiebV73?.open?.();
  } else if(action === 'collection'){
    await safeImport('./snazzle-collection.js');
    await safeImport('./snazzle-card-system-v2.js');
    await safeImport('./snazzle-card-worlds-v78.js');
    document.querySelector('[data-snazzle-collection]')?.click() || document.querySelector('#collectionHomeCard')?.click();
  } else if(action === 'ar'){
    await safeImport('./snazzle-ar-v80.js');
    await safeImport('./snazzle-ar-safety-v82.js');
    document.querySelector('#snArLaunch')?.click();
  } else if(action === 'news'){
    await safeImport('./snazzle-news-v46.js');
    document.querySelector('#snNewsLaunch')?.click();
  } else if(action === 'parents'){
    await safeImport('./snazzle-parent-hub-v65.js');
    await safeImport('./snazzle-parent-close-fix-v76.js');
    window.SnazzleParentHubV65?.open?.();
  }
  restorePremiumMenu();
}

function installStartupMenu(){
  installMenuStyles();
  const top = document.querySelector('.top');
  if(!top) return;
  const oldAdmin = document.getElementById('adminBtn');
  if(oldAdmin) oldAdmin.style.display = 'none';

  let btn = document.getElementById('quickMenuBtn');
  if(!btn){
    btn = document.createElement('button');
    btn.id = 'quickMenuBtn';
    btn.type = 'button';
    btn.textContent = '☰';
    btn.setAttribute('aria-label','Snazzle menu openen');
    top.appendChild(btn);
  }

  let overlay = document.getElementById('quickMenuOverlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'quickMenuOverlay';
    const panel = document.createElement('aside');
    panel.id = 'quickMenuPanel';
    panel.innerHTML = premiumMenuMarkup();
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  } else {
    restorePremiumMenu();
  }

  const closeMenu = () => {
    overlay.classList.remove('show');
    overlay.style.display = 'none';
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  };
  const openMenu = () => {
    restorePremiumMenu();
    const village = document.getElementById('quickMenuVillage');
    if(village) village.textContent = '📍 ' + (localStorage.getItem('snazzleVillage') || 'Montfort');
    overlay.style.display = 'flex';
    overlay.classList.add('show');
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  };

  btn.onclick = openMenu;
  overlay.onclick = event => {
    if(event.target === overlay){ closeMenu(); return; }
    if(event.target.closest('#quickMenuClose')){ closeMenu(); return; }
    const actionButton = event.target.closest('[data-startup-action]');
    if(actionButton){
      const action = actionButton.dataset.startupAction;
      closeMenu();
      setTimeout(() => openPremiumFeature(action), 20);
    }
  };

  const panel = document.getElementById('quickMenuPanel');
  if(panel && !window.__snazzleMenuGuardV98){
    window.__snazzleMenuGuardV98 = new MutationObserver(() => restorePremiumMenu());
    window.__snazzleMenuGuardV98.observe(panel, {childList:true, subtree:true});
  }
}

if(document.body) installStartupMenu();
else document.addEventListener('DOMContentLoaded', installStartupMenu, {once:true});

function idleSlot(){
  return new Promise(resolve => {
    if('requestIdleCallback' in window) requestIdleCallback(() => resolve(), {timeout:600});
    else setTimeout(resolve, 90);
  });
}

const corePromise = import(fresh('./app-core.js'))
  .then(mod => {
    window.__snazzleCoreReady = true;
    document.documentElement.dataset.snazzleCore = 'ready';
    restorePremiumMenu();
    return mod;
  })
  .catch(err => {
    console.error('Snazzle kern kon niet laden', err);
    showStartupMessage('De verbinding is traag. Probeer de app opnieuw te openen.');
    return null;
  });

(async function start(){
  await Promise.race([corePromise, wait(2400)]);
  releaseBoot();

  const core = await corePromise;
  if(!core) return;

  await wait(500);
  const optionalModules = [
    './snazzle-runtime-stability-v71.js',
    './snazzle-image-stability-v72.js',
    './snazzle-auto-update-v51.js',
    './snazzle-privacy-v52.js',
    './snazzle-parent-hub-v65.js',
    './snazzle-parent-close-fix-v76.js',
    './snazzle-central-assets-v48.js',
    './snazzle-admin-reset-v49.js',
    './snazzle-admin-backup-v50.js',
    './shop-compat.js',
    './kids-fun.js',
    './snazzle-route.js',
    './snazzle-collection.js',
    './snazzle-ar-v80.js',
    './snazzle-ar-safety-v82.js',
    './snazzle-card-system-v2.js',
    './snazzle-card-worlds-v78.js',
    './snazzle-card-world-prompt-v79.js',
    './snazzle-hunt-code-v2.js',
    './snazzle-unlock.js',
    './image-fit.js',
    './snazzle-world.js',
    './snazzle-home-magic.js',
    './snazzle-home-magic-fix.js',
    './village-access.js',
    './snazzle-characters.js',
    './snazzle-adventure-ui-v28.js',
    './snazzle-clean-home-v31.js',
    './snazzle-v32-guard.js',
    './snazzle-image-control-v32.js',
    './snazzle-village-admin-v33.js',
    './snazzle-secret-characters-v34.js',
    './snazzle-idle-hunt-duck-v35.js',
    './snazzle-home-hunt-image-v36.js',
    './snazzle-click-secrets-v37.js',
    './snazzle-world-adventure-v38.js',
    './snazzle-season-theme-v38.js',
    './snazzle-world-theme-v39.js',
    './snazzle-news-v46.js',
    './snazzle-world-hub-v47.js',
    './snazzle-game-menu-v62.js',
    './snazzle-listen-stories-v63.js',
    './snazzle-central-visuals-v54.js',
    './snazzle-public-visual-publish-v64.js',
    './snazzle-image-recovery-v60.js',
    './snazzle-admin-close-v61.js',
    './snazzle-admin-access-v55.js',
    './snazzle-professional-v53.js',
    './snazzle-admin-access-v56.js',
    './snazzle-safe-admin-v58.js',
    './snazzle-final-polish-v59.js',
    './snazzle-star-rewards-v67.js',
    './snazzle-quiet-psst-v68.js',
    './snazzle-input-visibility-v69.js',
    './snazzle-top-stability-v70.js',
    './snazzle-bieb-v73.js',
    './snazzle-bieb-cloud-v74.js',
    './snazzle-bieb-locations-v77.js'
  ];

  for(const modulePath of optionalModules){
    await idleSlot();
    await safeImport(modulePath, 3000);
    refreshLocalStyles();
    restorePremiumMenu();
  }
})();

corePromise.then(async core => {
  if(!core) return;
  try {
    const {getAuth, onAuthStateChanged} = await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js');
    const auth = getAuth();
    let shopLoaded = false;
    onAuthStateChanged(auth, async user => {
      if(!user || shopLoaded) return;
      shopLoaded = true;
      await safeImport('./shop.js', 4500);
      await safeImport('./shop-email-settings.js', 4500);
      refreshLocalStyles();
      restorePremiumMenu();
    });
  } catch(err){
    console.warn('Shop-auth achtergrondlader kon niet starten', err);
  }
});

setTimeout(() => {
  refreshLocalStyles();
  restorePremiumMenu();
  headObserver.disconnect();
}, 30000);

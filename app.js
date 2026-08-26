// Snazzle Hunt v97 — fail-safe startup without changing the existing app layout.
// The visible app and menu may never be blocked by optional modules.

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

// Keep the proven visual theme, but never wait for CSS before making the app usable.
addStylesheet('./snazzle-magic-theme.css');
addStylesheet('./snazzle-enchanted-layer.css');
addStylesheet('./snazzle-professional-v53.css');
addStylesheet('./snazzle-final-polish-v59.css');
refreshLocalStyles();

let bootBorn = performance.now();
let bootReleased = false;
let bootEl = null;

function buildBoot(){
  if(!document.body || document.getElementById('snV97Boot')) return;
  bootBorn = performance.now();
  const splash = document.createElement('div');
  splash.id = 'snV97Boot';
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
    const splash = bootEl || document.getElementById('snV97Boot') || document.getElementById('snV59Boot');
    if(splash){
      splash.style.opacity = '0';
      splash.style.pointerEvents = 'none';
      setTimeout(() => splash.remove(), 260);
    }
    document.body?.classList.remove('sn-v59-booting');
    document.body?.classList.add('sn-v97-ready');
  };
  const minVisible = 220;
  const left = Math.max(0, minVisible - (performance.now() - bootBorn));
  setTimeout(finish, left);
}

if(document.body) buildBoot();
else document.addEventListener('DOMContentLoaded', buildBoot, {once:true});

// Absolute guarantee: the loading screen can never stay on screen indefinitely.
setTimeout(releaseBoot, 3000);

function showStartupMessage(message='Dit onderdeel wordt nog geladen…'){
  const toast = document.getElementById('toast');
  if(toast){
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.__snazzleStartupToast);
    window.__snazzleStartupToast = setTimeout(() => toast.classList.remove('show'), 1800);
  }
}

function installStartupMenu(){
  if(document.getElementById('quickMenuPanel')) return;
  const top = document.querySelector('.top');
  if(!top) return;
  const oldAdmin = document.getElementById('adminBtn');
  if(oldAdmin) oldAdmin.style.display = 'none';

  const btn = document.createElement('button');
  btn.id = 'quickMenuBtn';
  btn.type = 'button';
  btn.textContent = '☰';
  btn.setAttribute('aria-label','Snazzle menu openen');
  btn.style.cssText = 'width:54px;height:54px;flex:0 0 54px;border-radius:18px;border:3px solid #8a6539;background:#285e35;color:#fff7df;font-size:29px;font-weight:1000;display:grid;place-items:center;box-shadow:0 5px 0 #4a2e1b;touch-action:manipulation';
  top.appendChild(btn);

  const overlay = document.createElement('div');
  overlay.id = 'quickMenuOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:5000;background:rgba(3,16,8,.72);display:none;justify-content:flex-end';
  overlay.innerHTML = `
    <aside id="quickMenuPanel" style="width:min(90vw,390px);height:100%;overflow:auto;padding:calc(18px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));background:linear-gradient(180deg,#175e35,#07351f);border-left:4px solid #8c6236;color:#fff7df;box-sizing:border-box">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:15px;border-bottom:2px solid rgba(255,218,112,.22)">
        <div style="display:flex;align-items:center;gap:10px"><span style="width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:#ffd45b;border:3px solid #754720;font-size:25px">🦆</span><div><strong style="display:block;color:#ffd348;font-size:22px">Snazzle Menu</strong><small id="quickMenuVillage" style="color:#c9ef8a;font-weight:850">📍 ${localStorage.getItem('snazzleVillage') || 'Montfort'}</small></div></div>
        <button id="quickMenuClose" type="button" style="width:44px;height:44px;border:0;border-radius:14px;background:#744528;color:white;font-size:27px">×</button>
      </div>
      <div style="margin:14px 3px 10px;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:1.2px;color:#c9ef8a">Waar wil je naartoe?</div>
      <nav class="quick-menu-list" style="display:grid;gap:8px">
        ${[
          ['🏠','Home','Terug naar het begin','home'],
          ['🔎','Hunt zoeken','Bekijk de actieve Snazzle Hunt','hunt'],
          ['📍','Kies je dorp','Ga snel naar de dorpskeuze','village'],
          ['👥','Vrienden','Bekijk actieve Snazzlers','friends'],
          ['🏆','Mijn vondsten','Jouw gevonden hunts','findings'],
          ['🎉','Actie & evenement','Open de actuele poster','event'],
          ['🛍️','Shop','Bekijk Snazzle items','shop'],
          ['👤','Mijn profiel','Naam of nickname aanpassen','profile']
        ].map(([icon,title,sub,key]) => `<button type="button" data-startup-action="${key}" style="width:100%;min-height:64px;border:2px solid rgba(255,224,147,.22);border-radius:17px;background:rgba(255,255,255,.09);color:#fff7df;padding:9px 11px;display:grid;grid-template-columns:42px 1fr 20px;align-items:center;gap:9px;text-align:left"><b style="font-size:23px">${icon}</b><span><strong style="display:block;font-size:16px">${title}</strong><small style="display:block;margin-top:3px;font-size:11px;color:#d6e8bd">${sub}</small></span><i style="font-style:normal;font-size:29px;color:#ffd34b">›</i></button>`).join('')}
      </nav>
      <button type="button" data-startup-action="admin" style="width:100%;margin-top:14px;border:2px solid #9b7144;border-radius:17px;background:#5a3824;color:#fff2d4;padding:13px;text-align:left;font-weight:900">🔒 &nbsp; Beheer</button>
    </aside>`;
  document.body.appendChild(overlay);

  const closeMenu = () => {
    overlay.style.display = 'none';
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  };
  const openMenu = () => {
    const village = document.getElementById('quickMenuVillage');
    if(village) village.textContent = '📍 ' + (localStorage.getItem('snazzleVillage') || 'Montfort');
    overlay.style.display = 'flex';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  };
  btn.onclick = openMenu;
  document.getElementById('quickMenuClose').onclick = closeMenu;
  overlay.addEventListener('click', event => { if(event.target === overlay) closeMenu(); });

  const clickWhenReady = selector => {
    if(!window.__snazzleCoreReady){ showStartupMessage(); return; }
    document.querySelector(selector)?.click();
  };
  overlay.querySelectorAll('[data-startup-action]').forEach(item => item.onclick = () => {
    const action = item.dataset.startupAction;
    closeMenu();
    if(action === 'home'){ window.scrollTo({top:0, behavior:'auto'}); return; }
    if(action === 'village'){ document.querySelector('.villages')?.scrollIntoView({block:'center'}); return; }
    if(action === 'hunt'){ clickWhenReady('#navHunt'); return; }
    if(action === 'friends'){ clickWhenReady('#navFriends'); return; }
    if(action === 'findings'){ clickWhenReady('#findsBtn'); return; }
    if(action === 'shop'){ clickWhenReady('#navShop'); return; }
    if(action === 'profile'){ clickWhenReady('#navProfile'); return; }
    if(action === 'admin'){ clickWhenReady('#adminBtn'); return; }
    if(action === 'event'){
      if(!window.__snazzleCoreReady){ showStartupMessage(); return; }
      document.querySelector('.home-card:nth-child(2)')?.click();
    }
  });
}

if(document.body) installStartupMenu();
else document.addEventListener('DOMContentLoaded', installStartupMenu, {once:true});

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
    return mod;
  })
  .catch(err => {
    console.error('Snazzle kern kon niet laden', err);
    showStartupMessage('De verbinding is traag. Probeer de app opnieuw te openen.');
    return null;
  });

(async function start(){
  // Show the real app as soon as the core is ready, but never later than ~2.4 seconds.
  await Promise.race([corePromise, wait(2400)]);
  releaseBoot();

  const core = await corePromise;
  if(!core) return;

  // Optional features load only after the home screen and menu are already usable.
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
  }
})();

// Shop extras also stay outside the critical startup path.
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
    });
  } catch(err){
    console.warn('Shop-auth achtergrondlader kon niet starten', err);
  }
});

setTimeout(() => {
  refreshLocalStyles();
  headObserver.disconnect();
}, 30000);

// Snazzle Hunt entrypoint: keep the proven hunt app core separate from newer modules.

// Vaste buildversie voor lokale bestanden. index.html mag app.js zelf verversen,
// maar de tientallen lokale modules hoeven niet bij IEDERE start opnieuw via 4G gedownload te worden.
// Bij iedere release verhogen we deze buildversie, zodat gewijzigde bestanden nooit onder een oude cache-sleutel blijven hangen.
const runtimeVersion = '20260826-current-v86';
const fresh = (path) => `${path}${path.includes('?') ? '&' : '?'}fresh=${encodeURIComponent(runtimeVersion)}`;
window.__snazzleRuntimeVersion = runtimeVersion;
window.__snazzleFresh = fresh;

function refreshLocalStyles(){
  document.querySelectorAll('link[rel="stylesheet"][href]').forEach(link=>{
    try{
      const url=new URL(link.getAttribute('href'),location.href);
      if(url.origin!==location.origin) return;
      if(!url.pathname.includes('/Snazzle-hunt-app/')) return;
      if(url.searchParams.get('fresh')===runtimeVersion) return;
      url.searchParams.set('fresh',runtimeVersion);
      link.href=url.href;
    }catch{}
  });
}
const headObserver=new MutationObserver(refreshLocalStyles);
headObserver.observe(document.head,{childList:true,subtree:true});

async function safeImport(path){
  try{
    return await import(fresh(path));
  }catch(err){
    console.error(`Snazzle module kon niet laden: ${path}`,err);
    return null;
  }
}

// Stabiliteit en beelddecoding eerst.
await Promise.all([
  safeImport('./snazzle-runtime-stability-v71.js'),
  safeImport('./snazzle-image-stability-v72.js')
]);

function addTheme(id,path){
  if(document.getElementById(id)) return document.getElementById(id);
  const link=document.createElement('link');
  link.id=id;
  link.rel='stylesheet';
  link.href=fresh(path);
  document.head.appendChild(link);
  return link;
}

// De zichtbare huidige home-stijlen starten meteen met laden.
// v28 + v31 zijn de lagen die de oude basis-home ombouwen naar de actuele rustige Snazzle-home.
const adventureTheme=addTheme('snazzleAdventureThemeV28','./snazzle-reference-layout.css');
const cleanHomeTheme=addTheme('snazzleCleanHomeV31','./snazzle-clean-home-v31.css');
addTheme('snazzleMagicTheme','./snazzle-magic-theme.css');
addTheme('snazzleEnchantedTheme','./snazzle-enchanted-layer.css');
addTheme('snazzleProfessionalTheme','./snazzle-professional-v53.css');
addTheme('snazzleFinalPolishTheme','./snazzle-final-polish-v59.css');
refreshLocalStyles();

function waitStyle(link,maxWait=1800){
  try{ if(link?.sheet) return Promise.resolve(); }catch{}
  return new Promise(resolve=>{
    if(!link) return resolve();
    let done=false;
    const finish=()=>{ if(done) return; done=true; resolve(); };
    link.addEventListener('load',finish,{once:true});
    link.addEventListener('error',finish,{once:true});
    setTimeout(finish,maxWait);
  });
}

// Rustige laadlaag bij iedere start.
(function installEarlyBootV59(){
  const build=()=>{
    if(!document.body || document.getElementById('snV59Boot')) return;
    document.body.classList.add('sn-v59-booting');
    const seen=sessionStorage.getItem('snazzleProSplashSeen')==='1';
    sessionStorage.setItem('snazzleProSplashSeen','1');
    const splash=document.createElement('div');
    splash.id='snV59Boot';
    splash.className='sn-v59-boot';
    splash.setAttribute('aria-hidden','true');
    splash.innerHTML='<div class="sn-v59-boot-inner"><div class="sn-v59-boot-mark">🦆</div><h1>Snazzle</h1><p>Samen naar buiten</p><small>Je avontuur wordt klaargezet…</small><div class="sn-v59-boot-line"></div></div>';
    document.body.appendChild(splash);
    const born=performance.now();
    let released=false;

    const releaseBoot=()=>{
      if(released) return;
      released=true;
      const minVisible=seen ? 120 : 350;
      const wait=Math.max(0,minVisible-(performance.now()-born));
      setTimeout(()=>{
        splash.style.opacity='0';
        splash.style.visibility='hidden';
        splash.style.pointerEvents='none';
        splash.classList.add('hide');
        document.body.classList.remove('sn-v59-booting');
        document.body.classList.add('sn-v59-ready');
        setTimeout(()=>splash.remove(),320);
      },wait);
    };

    window.__snazzleReleaseBoot=releaseBoot;
    // Alleen als er echt iets misgaat tonen we na 8 seconden alsnog de werkende kern.
    setTimeout(releaseBoot,8000);
  };
  if(document.body) build(); else document.addEventListener('DOMContentLoaded',build,{once:true});
})();

// Eerst de werkende Hunt-kern.
await import(fresh('./app-core.js'));

// KRITIEKE FIX: bouw de actuele home NU op, vóór alle zware extra functies.
// Voorheen stonden v28/v31 pas na ruim twintig modules. Op 4G verdween de splash dan al
// en bleef de oude basis-home in beeld. Deze twee lagen staan nu direct achter app-core.
await safeImport('./snazzle-adventure-ui-v28.js');
await safeImport('./snazzle-clean-home-v31.js');
refreshLocalStyles();
await Promise.allSettled([waitStyle(adventureTheme),waitStyle(cleanHomeTheme)]);
try{ await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))); }catch{}
window.__snazzleReleaseBoot?.();

// De overige functies laden daarna door. Ze blokkeren de zichtbare home niet meer.
const optionalModules=[
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
  await safeImport(modulePath);
  refreshLocalStyles();
}

try{ await window.__snazzleRuntimeSettle71?.(); }catch(err){ console.warn('Snazzle settle v71',err); }

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const auth = getAuth();
let shopLoaded = false;
onAuthStateChanged(auth, async user => {
  if (!user || shopLoaded) return;
  shopLoaded = true;
  await safeImport('./shop.js');
  await safeImport('./shop-email-settings.js');
  refreshLocalStyles();
});

setTimeout(()=>{refreshLocalStyles();headObserver.disconnect();},12000);

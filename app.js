// Snazzle Hunt entrypoint: keep the proven hunt app core separate from newer modules.

// Eén vaste releaseversie voor alle lokale bestanden.
// Daardoor hoeft een telefoon niet bij IEDERE start tientallen modules opnieuw via 4G te downloaden.
// Bij een echte nieuwe release verhogen we alleen deze waarde.
const runtimeVersion = '20260826-v87';
const fresh = (path) => `${path}${path.includes('?') ? '&' : '?'}fresh=${encodeURIComponent(runtimeVersion)}`;
window.__snazzleRuntimeVersion = runtimeVersion;
window.__snazzleFresh = fresh;

// Exact dezelfde modulevolgorde als de laatst werkende app.
// We gaan ze alleen alvast parallel DOWNLOADEN; uitvoeren blijft bewust in dezelfde volgorde.
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

// Start alle netwerkdownloads direct en parallel, zonder de modules al uit te voeren.
// Dynamic import gebruikt daarna dezelfde reeds gedownloade module-resources.
function preloadModule(path){
  try{
    const href=fresh(path);
    if(document.querySelector(`link[rel="modulepreload"][href="${href}"]`)) return;
    const link=document.createElement('link');
    link.rel='modulepreload';
    link.href=href;
    document.head.appendChild(link);
  }catch{}
}
[
  './snazzle-runtime-stability-v71.js',
  './snazzle-image-stability-v72.js',
  './app-core.js',
  ...optionalModules
].forEach(preloadModule);

// Sommige oudere presentatiemodules voegen zelf CSS toe met een vast ?v= nummer.
// Iedere lokale stylesheet krijgt daarom dezelfde releaseversie als de JavaScript-modules.
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

// Stabiliteitslagen eerst. Ze downloaden al parallel met de rest.
await Promise.all([
  safeImport('./snazzle-runtime-stability-v71.js'),
  safeImport('./snazzle-image-stability-v72.js')
]);

// Presentatielaag: dezelfde thema's als voorheen.
for(const [id,path] of [
  ['snazzleMagicTheme','./snazzle-magic-theme.css'],
  ['snazzleEnchantedTheme','./snazzle-enchanted-layer.css'],
  ['snazzleProfessionalTheme','./snazzle-professional-v53.css'],
  ['snazzleFinalPolishTheme','./snazzle-final-polish-v59.css']
]){
  if(document.getElementById(id)) continue;
  const link=document.createElement('link');
  link.id=id;
  link.rel='stylesheet';
  link.href=fresh(path);
  document.head.appendChild(link);
}
refreshLocalStyles();

// Rustige laadlaag. We tonen GEEN oude basis-home tussendoor.
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

    window.__snazzleReleaseBoot=()=>{
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

    // Alleen als er echt een fout optreedt mag de kern na 20 seconden alsnog zichtbaar worden.
    // Normaal verdwijnt dit scherm veel eerder zodra alle bestaande UI-lagen in hun oude volgorde klaar zijn.
    setTimeout(()=>window.__snazzleReleaseBoot?.(),20000);
  };
  if(document.body) build(); else document.addEventListener('DOMContentLoaded',build,{once:true});
})();

// app-core blijft de enige kritieke module.
await import(fresh('./app-core.js'));

// Uitvoering blijft exact in de bewezen volgorde, maar vrijwel alle bestanden zijn inmiddels al parallel binnengehaald.
for(const modulePath of optionalModules){
  await safeImport(modulePath);
  refreshLocalStyles();
}

// Pas als de volledige huidige Snazzle-interface klaarstaat verdwijnt de splash.
try{ await window.__snazzleRuntimeSettle71?.(); }catch(err){ console.warn('Snazzle settle v71',err); }
try{ await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))); }catch{}
window.__snazzleReleaseBoot?.();

// v45 recovery: Samen Buiten, Extra Hints en alle latere mobiele fixlagen zijn tijdelijk uitgeschakeld.

import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';

const auth = getAuth();
let shopLoaded = false;
onAuthStateChanged(auth, async user => {
  if (!user || shopLoaded) return;
  shopLoaded = true;
  // Ook deze twee bestanden krijgen dezelfde vaste releasecache.
  preloadModule('./shop.js');
  preloadModule('./shop-email-settings.js');
  await safeImport('./shop.js');
  await safeImport('./shop-email-settings.js');
  refreshLocalStyles();
});

setTimeout(()=>{refreshLocalStyles();headObserver.disconnect();},12000);

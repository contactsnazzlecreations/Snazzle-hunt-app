// Snazzle Hunt entrypoint — v89 startup recovery.
// Volledige huidige app behouden, maar geen enkele optionele module mag het laadscherm blokkeren.

const runtimeVersion='20260826-v89';
const fresh=(path)=>`${path}${path.includes('?')?'&':'?'}fresh=${encodeURIComponent(runtimeVersion)}`;
window.__snazzleRuntimeVersion=runtimeVersion;
window.__snazzleFresh=fresh;

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

function addTheme(id,path){
  if(document.getElementById(id)) return;
  const link=document.createElement('link');
  link.id=id;link.rel='stylesheet';link.href=fresh(path);
  document.head.appendChild(link);
}
addTheme('snazzleMagicTheme','./snazzle-magic-theme.css');
addTheme('snazzleEnchantedTheme','./snazzle-enchanted-layer.css');
addTheme('snazzleProfessionalTheme','./snazzle-professional-v53.css');
addTheme('snazzleFinalPolishTheme','./snazzle-final-polish-v59.css');
refreshLocalStyles();

let releaseBootNow=()=>{};
(function installBoot(){
  const build=()=>{
    if(!document.body||document.getElementById('snV59Boot')) return;
    document.body.classList.add('sn-v59-booting');
    const seen=sessionStorage.getItem('snazzleProSplashSeen')==='1';
    sessionStorage.setItem('snazzleProSplashSeen','1');
    const splash=document.createElement('div');
    splash.id='snV59Boot';splash.className='sn-v59-boot';splash.setAttribute('aria-hidden','true');
    splash.innerHTML='<div class="sn-v59-boot-inner"><div class="sn-v59-boot-mark">🦆</div><h1>Snazzle</h1><p>Samen naar buiten</p><small>Je avontuur wordt klaargezet…</small><div class="sn-v59-boot-line"></div></div>';
    document.body.appendChild(splash);
    const born=performance.now();
    let released=false;
    const release=()=>{
      if(released) return;
      released=true;
      const minVisible=seen?120:350;
      const wait=Math.max(0,minVisible-(performance.now()-born));
      setTimeout(()=>{
        splash.style.setProperty('opacity','0','important');
        splash.style.setProperty('visibility','hidden','important');
        splash.style.setProperty('display','none','important');
        splash.style.setProperty('pointer-events','none','important');
        document.body.classList.remove('sn-v59-booting');
        document.body.classList.add('sn-v59-ready');
        setTimeout(()=>splash.remove(),50);
      },wait);
    };
    releaseBootNow=release;
    window.__snazzleReleaseBoot=release;
    // Lokale harde noodstop: kan niet door een latere module worden overschreven.
    setTimeout(release,8500);
  };
  if(document.body) build(); else document.addEventListener('DOMContentLoaded',build,{once:true});
})();

function preloadModule(path){
  try{
    const link=document.createElement('link');
    link.rel='modulepreload';link.href=fresh(path);
    document.head.appendChild(link);
  }catch{}
}
['./snazzle-runtime-stability-v71.js','./snazzle-image-stability-v72.js','./app-core.js',...optionalModules].forEach(preloadModule);

async function safeImport(path){
  try{return await import(fresh(path));}
  catch(err){console.error(`Snazzle module kon niet laden: ${path}`,err);return null;}
}

// BELANGRIJK: na het budget keren we echt terug. De import blijft zelfstandig doorlopen,
// maar deze functie wacht er NIET alsnog op. Daardoor kan één trage module de hele app niet vastzetten.
async function startWithBudget(path,budget=120){
  const task=safeImport(path);
  await Promise.race([
    task,
    new Promise(resolve=>setTimeout(resolve,budget))
  ]);
}

await Promise.all([
  startWithBudget('./snazzle-runtime-stability-v71.js',400),
  startWithBudget('./snazzle-image-stability-v72.js',400)
]);

// app-core is de enige kritieke module.
try{
  await import(fresh('./app-core.js'));
}catch(err){
  console.error('Snazzle app-core kon niet laden',err);
  releaseBootNow();
  throw err;
}

// De bestaande volgorde blijft de startvolgorde. Iedere laag krijgt maximaal 120 ms om de volgende tegen te houden.
for(const modulePath of optionalModules){
  await startWithBudget(modulePath,120);
  refreshLocalStyles();
}

try{await window.__snazzleRuntimeSettle71?.();}catch(err){console.warn('Snazzle settle v71',err);}
try{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}catch{}
releaseBootNow();

// Firebase-auth en Shop laden pas nadat de zichtbare app vrijgegeven kan worden.
(async()=>{
  try{
    const {getAuth,onAuthStateChanged}=await import('https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js');
    const auth=getAuth();
    let shopLoaded=false;
    onAuthStateChanged(auth,async user=>{
      if(!user||shopLoaded) return;
      shopLoaded=true;
      preloadModule('./shop.js');
      preloadModule('./shop-email-settings.js');
      await startWithBudget('./shop.js',400);
      await startWithBudget('./shop-email-settings.js',400);
      refreshLocalStyles();
    });
  }catch(err){console.warn('Snazzle auth/shop later laden',err);}
})();

setTimeout(()=>{refreshLocalStyles();headObserver.disconnect();},12000);

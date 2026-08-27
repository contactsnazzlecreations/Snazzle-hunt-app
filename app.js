// Snazzle Hunt entrypoint: keep the proven hunt app core separate from newer modules.

// Vaste release-versie: app.js zelf mag door index.html opnieuw worden opgehaald,
// maar alle lokale modules en styles blijven daarna cachebaar op de telefoon.
const runtimeVersion = '20260827-v109-no-mid-session-reload';
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

await safeImport('./snazzle-runtime-stability-v71.js');
await safeImport('./snazzle-image-stability-v72.js');

const magicTheme = document.createElement('link');
magicTheme.rel = 'stylesheet';
magicTheme.href = fresh('./snazzle-magic-theme.css');
document.head.appendChild(magicTheme);

const enchantedTheme = document.createElement('link');
enchantedTheme.rel = 'stylesheet';
enchantedTheme.href = fresh('./snazzle-enchanted-layer.css');
document.head.appendChild(enchantedTheme);

const professionalTheme = document.createElement('link');
professionalTheme.rel = 'stylesheet';
professionalTheme.href = fresh('./snazzle-professional-v53.css');
document.head.appendChild(professionalTheme);

const finalPolishTheme = document.createElement('link');
finalPolishTheme.rel = 'stylesheet';
finalPolishTheme.href = fresh('./snazzle-final-polish-v59.css');
document.head.appendChild(finalPolishTheme);
refreshLocalStyles();

(function installEarlyBootV103(){
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
      const minVisible=seen ? 180 : 480;
      const wait=Math.max(0,minVisible-(performance.now()-born));
      setTimeout(()=>{
        splash.classList.add('hide');
        splash.style.setProperty('opacity','0','important');
        splash.style.setProperty('visibility','hidden','important');
        splash.style.setProperty('pointer-events','none','important');
        document.body.classList.remove('sn-v59-booting');
        document.body.classList.add('sn-v59-ready');
        setTimeout(()=>splash.remove(),350);
      },wait);
    };

    window.__snazzleReleaseBoot=releaseBoot;
    setTimeout(releaseBoot,7000);
  };
  if(document.body) build(); else document.addEventListener('DOMContentLoaded',build,{once:true});
})();

await import(fresh('./app-core.js'));

(function installHeroQuack(){
  const hero=document.getElementById('hero');
  if(!hero) return;

  let audioContext=null;
  const hasSnazzleHero=()=>getComputedStyle(hero).backgroundImage.includes('url(');

  const playQuack=()=>{
    const AudioCtx=window.AudioContext || window.webkitAudioContext;
    if(!AudioCtx) return;
    audioContext ||= new AudioCtx();
    if(audioContext.state==='suspended') audioContext.resume().catch(()=>{});

    const now=audioContext.currentTime;
    const master=audioContext.createGain();
    const filter=audioContext.createBiquadFilter();
    const osc1=audioContext.createOscillator();
    const osc2=audioContext.createOscillator();

    filter.type='bandpass';
    filter.frequency.setValueAtTime(720,now);
    filter.Q.setValueAtTime(0.75,now);

    osc1.type='sawtooth';
    osc2.type='square';
    osc1.frequency.setValueAtTime(500,now);
    osc1.frequency.exponentialRampToValueAtTime(255,now+0.16);
    osc1.frequency.setValueAtTime(360,now+0.17);
    osc1.frequency.exponentialRampToValueAtTime(215,now+0.31);
    osc2.frequency.setValueAtTime(250,now);
    osc2.frequency.exponentialRampToValueAtTime(135,now+0.30);

    master.gain.setValueAtTime(0.0001,now);
    master.gain.exponentialRampToValueAtTime(0.085,now+0.018);
    master.gain.exponentialRampToValueAtTime(0.045,now+0.13);
    master.gain.setValueAtTime(0.075,now+0.17);
    master.gain.exponentialRampToValueAtTime(0.0001,now+0.34);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(master);
    master.connect(audioContext.destination);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now+0.35);
    osc2.stop(now+0.35);
  };

  hero.addEventListener('click',()=>{
    if(hasSnazzleHero()) playQuack();
  });
})();

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
  './snazzle-ar-safety-v82b.js',
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
  await safeImport(modulePath);
  refreshLocalStyles();
}

try{ await window.__snazzleRuntimeSettle71?.(); }catch(err){ console.warn('Snazzle settle v71',err); }
window.__snazzleReleaseBoot?.();

// AR-beheer hoort bij Beheer, niet bij het kritieke opstartpad. Het wordt daarom pas
// na de zichtbare app geladen en kan de publieke home nooit meer blokkeren.
setTimeout(()=>{
  safeImport('./snazzle-ar-admin-v83.js');
  safeImport('./snazzle-ar-admin-display-v84.js');
},900);

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